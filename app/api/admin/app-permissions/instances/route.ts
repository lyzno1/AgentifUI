import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // --- BEGIN COMMENT ---
    // 获取当前用户信息，验证管理员权限
    // --- END COMMENT ---
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // --- BEGIN COMMENT ---
    // 检查用户是否为管理员（这里简化处理，实际应该检查用户角色）
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
    // 获取所有应用实例
    // --- END COMMENT ---
    const { data: instances, error } = await supabase
      .from('service_instances')
      .select('*')
      .order('display_name')

    if (error) {
      console.error('获取应用实例失败:', error)
      return NextResponse.json({ error: '获取应用实例失败' }, { status: 500 })
    }

    return NextResponse.json({
      instances: instances || []
    })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
} 