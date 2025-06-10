import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const supabase = await createClient()
    const { memberId } = await params
    
    // --- 验证管理员权限 ---
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }

    // --- 解析请求数据 ---
    const { role, jobTitle, department } = await request.json()

    if (!role || !['owner', 'admin', 'member'].includes(role)) {
      return NextResponse.json({ error: '角色参数无效' }, { status: 400 })
    }

    // --- 更新成员信息 ---
    const { data, error } = await supabase
      .from('org_members')
      .update({
        role,
        job_title: jobTitle?.trim() || null,
        department: department?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .select('*')
      .single()

    if (error) {
      console.error('更新成员信息失败:', error)
      return NextResponse.json({ error: '更新成员信息失败' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: '成员信息更新成功',
      member: data
    })

  } catch (error) {
    console.error('更新成员信息异常:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
} 