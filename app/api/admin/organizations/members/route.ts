import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@lib/supabase/server'

// --- BEGIN COMMENT ---
// 获取组织成员列表
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

    // --- 获取所有组织成员，包含用户信息 ---
    const { data: members, error } = await supabase
      .from('org_members')
      .select(`
        *,
        user:profiles(full_name, username),
        organization:organizations(name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('获取组织成员失败:', error)
      return NextResponse.json({ error: '获取组织成员失败' }, { status: 500 })
    }

    return NextResponse.json({ 
      members: members || [],
      success: true 
    })

  } catch (error) {
    console.error('组织成员API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// --- BEGIN COMMENT ---
// 添加用户到组织
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
    const { userId, orgId, department, jobTitle, role } = await request.json()

    if (!userId?.trim() || !orgId?.trim()) {
      return NextResponse.json({ error: '用户ID和组织ID不能为空' }, { status: 400 })
    }

    // --- 检查用户是否存在 ---
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // --- 检查组织是否存在 ---
    const { data: organization } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', orgId)
      .single()

    if (!organization) {
      return NextResponse.json({ error: '组织不存在' }, { status: 404 })
    }

    // --- 检查用户是否已在该组织的该部门中 ---
    // --- BEGIN COMMENT ---
    // 🔧 修复：支持用户在同组织的不同部门
    // 检查用户是否已在该组织的特定部门，而不是整个组织
    // --- END COMMENT ---
    const { data: existingMember } = await supabase
      .from('org_members')
      .select('id, department')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .eq('department', department?.trim() || '默认部门')
      .single()

    if (existingMember) {
      return NextResponse.json({ 
        error: `用户已在该组织的"${department?.trim() || '默认部门'}"部门中` 
      }, { status: 400 })
    }

    // --- 添加用户到组织 ---
    const { data: member, error } = await supabase
      .from('org_members')
      .insert({
        user_id: userId,
        org_id: orgId,
        role: role || 'member',
        department: department?.trim() || null,
        job_title: jobTitle?.trim() || null
      })
      .select(`
        *,
        user:profiles(full_name, username),
        organization:organizations(name)
      `)
      .single()

    if (error) {
      console.error('添加组织成员失败:', error)
      return NextResponse.json({ error: '添加组织成员失败' }, { status: 500 })
    }

    // --- 如果指定了部门，为该部门创建默认权限 ---
    if (department?.trim()) {
      try {
        await supabase.rpc('create_default_permissions_for_department', {
          target_org_id: orgId,
          target_department: department.trim()
        })
      } catch (permError) {
        console.warn('创建部门默认权限失败:', permError)
        // 不影响主要操作，只记录警告
      }
    }

    return NextResponse.json({ 
      member,
      success: true 
    })

  } catch (error) {
    console.error('添加组织成员API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// --- BEGIN COMMENT ---
// 从组织中移除用户
// --- END COMMENT ---
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
    const { memberId } = await request.json()

    if (!memberId?.trim()) {
      return NextResponse.json({ error: '成员ID不能为空' }, { status: 400 })
    }

    // --- 检查成员是否存在 ---
    const { data: member } = await supabase
      .from('org_members')
      .select('*')
      .eq('id', memberId)
      .single()

    if (!member) {
      return NextResponse.json({ error: '成员不存在' }, { status: 404 })
    }

    // --- 删除组织成员 ---
    const { error } = await supabase
      .from('org_members')
      .delete()
      .eq('id', memberId)

    if (error) {
      console.error('移除组织成员失败:', error)
      return NextResponse.json({ error: '移除组织成员失败' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: '成功移除组织成员'
    })

  } catch (error) {
    console.error('移除组织成员API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
} 