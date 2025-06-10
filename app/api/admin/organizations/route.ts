import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@lib/supabase/server'

// --- BEGIN COMMENT ---
// 获取组织列表
// --- END COMMENT ---
export async function GET() {
  try {
    const supabase = await createClient()
    
    // --- 检查用户权限 ---
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // --- 检查是否为管理员 ---
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    // --- 获取所有组织 ---
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('获取组织列表失败:', error)
      return NextResponse.json({ error: '获取组织列表失败' }, { status: 500 })
    }

    return NextResponse.json({ 
      organizations: organizations || [],
      success: true 
    })

  } catch (error) {
    console.error('组织API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// --- BEGIN COMMENT ---
// 创建新组织
// --- END COMMENT ---
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // --- 检查用户权限 ---
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // --- 检查是否为管理员 ---
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    // --- 解析请求数据 ---
    const { name, settings } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: '组织名称不能为空' }, { status: 400 })
    }

    // --- 创建组织 ---
    const { data: organization, error } = await supabase
      .from('organizations')
      .insert({
        name: name.trim(),
        settings: settings || {}
      })
      .select()
      .single()

    if (error) {
      console.error('创建组织失败:', error)
      return NextResponse.json({ error: '创建组织失败' }, { status: 500 })
    }

    return NextResponse.json({ 
      organization,
      success: true 
    })

  } catch (error) {
    console.error('创建组织API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// --- BEGIN COMMENT ---
// 删除组织
// --- END COMMENT ---
// --- BEGIN COMMENT ---
// 更新组织信息
// --- END COMMENT ---
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // --- 检查用户权限 ---
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // --- 检查是否为管理员 ---
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    // --- 解析请求数据 ---
    const { orgId, name, settings } = await request.json()

    if (!orgId?.trim()) {
      return NextResponse.json({ error: '组织ID不能为空' }, { status: 400 })
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: '组织名称不能为空' }, { status: 400 })
    }

    // --- 检查组织是否存在 ---
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id, name, settings')
      .eq('id', orgId)
      .single()

    if (!existingOrg) {
      return NextResponse.json({ error: '组织不存在' }, { status: 404 })
    }

    // --- 更新组织 ---
    const { data: organization, error } = await supabase
      .from('organizations')
      .update({
        name: name.trim(),
        settings: settings || {},
        updated_at: new Date().toISOString()
      })
      .eq('id', orgId)
      .select()
      .single()

    if (error) {
      console.error('更新组织失败:', error)
      return NextResponse.json({ error: '更新组织失败' }, { status: 500 })
    }

    return NextResponse.json({ 
      organization,
      success: true 
    })

  } catch (error) {
    console.error('更新组织API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // --- 检查用户权限 ---
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // --- 检查是否为管理员 ---
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    // --- 解析请求数据 ---
    const { orgId } = await request.json()

    if (!orgId?.trim()) {
      return NextResponse.json({ error: '组织ID不能为空' }, { status: 400 })
    }

    // --- 检查组织是否存在 ---
    const { data: organization } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', orgId)
      .single()

    if (!organization) {
      return NextResponse.json({ error: '组织不存在' }, { status: 404 })
    }

    // --- 检查组织是否还有成员 ---
    const { data: members } = await supabase
      .from('org_members')
      .select('id')
      .eq('org_id', orgId)

    if (members && members.length > 0) {
      return NextResponse.json({ 
        error: '无法删除有成员的组织，请先移除所有成员' 
      }, { status: 400 })
    }

    // --- 删除相关的部门权限配置 ---
    await supabase
      .from('department_app_permissions')
      .delete()
      .eq('org_id', orgId)

    // --- 删除组织 ---
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', orgId)

    if (error) {
      console.error('删除组织失败:', error)
      return NextResponse.json({ error: '删除组织失败' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: `成功删除组织: ${organization.name}`
    })

  } catch (error) {
    console.error('删除组织API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
} 