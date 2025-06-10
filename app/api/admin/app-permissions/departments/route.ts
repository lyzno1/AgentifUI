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
    // 获取所有部门权限配置，包含组织名称
    // --- END COMMENT ---
    const { data: permissions, error } = await supabase
      .from('department_app_permissions')
      .select(`
        *,
        organizations!inner(name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('获取部门权限失败:', error)
      return NextResponse.json({ error: '获取部门权限失败' }, { status: 500 })
    }

    // --- BEGIN COMMENT ---
    // 格式化返回数据
    // --- END COMMENT ---
    const formattedPermissions = permissions?.map(perm => ({
      ...perm,
      org_name: perm.organizations?.name || '未知组织'
    })) || []

    return NextResponse.json({
      permissions: formattedPermissions
    })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    // --- BEGIN COMMENT ---
    // 简化请求参数：移除permission_level字段
    // --- END COMMENT ---
    const { orgId, department, appId, is_enabled, usage_quota } = await request.json()

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
    if (!orgId || !department || !appId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    // --- BEGIN COMMENT ---
    // 使用upsert操作，如果记录存在则更新，不存在则创建
    // 简化版本：只保留is_enabled和usage_quota字段
    // --- END COMMENT ---
    const { error } = await supabase
      .from('department_app_permissions')
      .upsert({
        org_id: orgId,
        department,
        service_instance_id: appId,
        is_enabled: is_enabled ?? true,
        usage_quota: usage_quota || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'org_id,department,service_instance_id'
      })

    if (error) {
      console.error('更新部门权限失败:', error)
      return NextResponse.json({ error: '更新失败' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
} 