import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { appId, visibility } = await request.json()

    // --- BEGIN COMMENT ---
    // 获取当前用户信息，验证管理员权限
    // --- END COMMENT ---
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // --- BEGIN COMMENT ---
    // 检查用户是否为管理员
    // --- END COMMENT ---
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }

    // --- BEGIN COMMENT ---
    // 验证输入参数
    // --- END COMMENT ---
    if (!appId || !visibility) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    if (!['public', 'org_only', 'private'].includes(visibility)) {
      return NextResponse.json({ error: '无效的可见性设置' }, { status: 400 })
    }

    // --- BEGIN COMMENT ---
    // 更新应用可见性
    // --- END COMMENT ---
    const { error } = await supabase
      .from('service_instances')
      .update({ 
        visibility,
        updated_at: new Date().toISOString()
      })
      .eq('id', appId)

    if (error) {
      console.error('更新应用可见性失败:', error)
      return NextResponse.json({ error: '更新失败' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
} 