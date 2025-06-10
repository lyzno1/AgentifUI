/**
 * 部门应用权限服务
 * 
 * 提供部门级应用权限管理功能，包括：
 * - 获取用户可访问的应用列表
 * - 检查用户对特定应用的权限
 * - 管理部门应用权限配置
 * - 使用配额管理和统计
 */

import { createClient } from '@lib/supabase/client';
import type { 
  DepartmentAppPermission, 
  UserAccessibleApp, 
  AppPermissionCheck
} from '@lib/types/database';

// --- BEGIN COMMENT ---
// 🎯 Result类型定义，用于统一错误处理
// --- END COMMENT ---
export type Result<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

/**
 * 获取用户可访问的应用列表
 * 基于用户所属部门的权限配置
 */
export async function getUserAccessibleApps(userId: string): Promise<Result<UserAccessibleApp[]>> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase.rpc('get_user_accessible_apps', {
      p_user_id: userId
    });

    if (error) {
      console.error('获取用户可访问应用失败:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('获取用户可访问应用异常:', error);
    return { success: false, error: '获取应用列表失败' };
  }
}

/**
 * 检查用户对特定应用的访问权限
 */
export async function checkUserAppPermission(
  userId: string, 
  serviceInstanceId: string
): Promise<Result<AppPermissionCheck>> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase.rpc('check_user_app_permission', {
      p_user_id: userId,
      p_service_instance_id: serviceInstanceId
    });

    if (error) {
      console.error('检查用户应用权限失败:', error);
      return { success: false, error: error.message };
    }

    // 数据库函数返回单行结果，需要取第一个元素
    const result = Array.isArray(data) ? data[0] : data;
    
    if (!result) {
      return { 
        success: true, 
        data: { 
          has_access: false, 
          quota_remaining: null, 
          error_message: '权限检查失败' 
        } 
      };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('检查用户应用权限异常:', error);
    return { success: false, error: '权限检查失败' };
  }
}

/**
 * 增加应用使用计数
 */
export async function incrementAppUsage(
  userId: string, 
  serviceInstanceId: string
): Promise<Result<{ success: boolean; new_used_count: number; quota_remaining: number | null; error_message: string | null }>> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase.rpc('increment_app_usage', {
      p_user_id: userId,
      p_service_instance_id: serviceInstanceId
    });

    if (error) {
      console.error('增加应用使用计数失败:', error);
      return { success: false, error: error.message };
    }

    // 数据库函数返回单行结果
    const result = Array.isArray(data) ? data[0] : data;
    return { success: true, data: result };
  } catch (error) {
    console.error('增加应用使用计数异常:', error);
    return { success: false, error: '更新使用计数失败' };
  }
}

/**
 * 获取组织部门的应用权限列表
 */
export async function getDepartmentAppPermissions(
  orgId: string, 
  department?: string
): Promise<Result<DepartmentAppPermission[]>> {
  try {
    const supabase = createClient();
    
    let query = supabase
      .from('department_app_permissions')
      .select(`
        *,
        service_instances!inner(
          id,
          display_name,
          description,
          instance_id,
          visibility
        )
      `)
      .eq('org_id', orgId);

    if (department) {
      query = query.eq('department', department);
    }

    const { data, error } = await query.order('department').order('created_at', { ascending: false });

    if (error) {
      console.error('获取部门应用权限失败:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('获取部门应用权限异常:', error);
    return { success: false, error: '获取权限列表失败' };
  }
}

/**
 * 创建或更新部门应用权限
 */
export async function upsertDepartmentAppPermission(
  orgId: string,
  department: string,
  serviceInstanceId: string,
  permission: Partial<DepartmentAppPermission>
): Promise<Result<DepartmentAppPermission>> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('department_app_permissions')
      .upsert({
        org_id: orgId,
        department,
        service_instance_id: serviceInstanceId,
        is_enabled: permission.is_enabled ?? true,
        usage_quota: permission.usage_quota ?? null,
        settings: permission.settings ?? {},
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'org_id,department,service_instance_id'
      })
      .select()
      .single();

    if (error) {
      console.error('创建/更新部门应用权限失败:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('创建/更新部门应用权限异常:', error);
    return { success: false, error: '创建/更新权限失败' };
  }
}

/**
 * 删除部门应用权限
 */
export async function deleteDepartmentAppPermission(
  orgId: string,
  department: string,
  serviceInstanceId: string
): Promise<Result<boolean>> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('department_app_permissions')
      .delete()
      .eq('org_id', orgId)
      .eq('department', department)
      .eq('service_instance_id', serviceInstanceId);

    if (error) {
      console.error('删除部门应用权限失败:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: true };
  } catch (error) {
    console.error('删除部门应用权限异常:', error);
    return { success: false, error: '删除权限失败' };
  }
}

/**
 * 批量设置部门应用权限
 */
export async function batchSetDepartmentAppPermissions(
  orgId: string,
  department: string,
  permissions: Array<{
    serviceInstanceId: string;
    usageQuota?: number | null;
    isEnabled?: boolean;
  }>
): Promise<Result<DepartmentAppPermission[]>> {
  try {
    const supabase = createClient();
    
    const permissionData = permissions.map(p => ({
      org_id: orgId,
      department,
      service_instance_id: p.serviceInstanceId,
      is_enabled: p.isEnabled ?? true,
      usage_quota: p.usageQuota ?? null,
      settings: {},
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('department_app_permissions')
      .upsert(permissionData, {
        onConflict: 'org_id,department,service_instance_id'
      })
      .select();

    if (error) {
      console.error('批量设置部门应用权限失败:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('批量设置部门应用权限异常:', error);
    return { success: false, error: '批量设置权限失败' };
  }
}

/**
 * 获取部门应用使用统计
 */
export async function getDepartmentAppUsageStats(
  orgId: string,
  department?: string,
  startDate?: string,
  endDate?: string
): Promise<Result<Array<{
  department: string;
  service_instance_id: string;
  display_name: string;
  used_count: number;
  usage_quota: number | null;
  quota_remaining: number | null;
  usage_percentage: number | null;
}>>> {
  try {
    const supabase = createClient();
    
    let query = supabase
      .from('department_app_permissions')
      .select(`
        department,
        service_instance_id,
        used_count,
        usage_quota,
        service_instances!inner(
          display_name
        )
      `)
      .eq('org_id', orgId)
      .eq('is_enabled', true);

    if (department) {
      query = query.eq('department', department);
    }

    const { data, error } = await query;

    if (error) {
      console.error('获取部门应用使用统计失败:', error);
      return { success: false, error: error.message };
    }

    // 计算统计数据
    const stats = (data || []).map(item => {
      const quotaRemaining = item.usage_quota ? Math.max(0, item.usage_quota - item.used_count) : null;
      const usagePercentage = item.usage_quota ? Math.round((item.used_count / item.usage_quota) * 100) : null;
      
      return {
        department: item.department,
        service_instance_id: item.service_instance_id,
        display_name: (item.service_instances as any)?.display_name || '未知应用',
        used_count: item.used_count,
        usage_quota: item.usage_quota,
        quota_remaining: quotaRemaining,
        usage_percentage: usagePercentage
      };
    });

    return { success: true, data: stats };
  } catch (error) {
    console.error('获取部门应用使用统计异常:', error);
    return { success: false, error: '获取使用统计失败' };
  }
}

/**
 * 重置月度配额（定时任务使用）
 */
export async function resetMonthlyQuotas(): Promise<Result<number>> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase.rpc('reset_monthly_quotas');

    if (error) {
      console.error('重置月度配额失败:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || 0 };
  } catch (error) {
    console.error('重置月度配额异常:', error);
    return { success: false, error: '重置配额失败' };
  }
}

/**
 * 获取用户部门信息
 */
export async function getUserDepartmentInfo(userId: string): Promise<Result<{
  orgId: string;
  orgName: string;
  department: string;
  role: string;
} | null>> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('org_members')
      .select(`
        org_id,
        department,
        role,
        organizations!inner(
          name
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 用户不属于任何组织
        return { success: true, data: null };
      }
      console.error('获取用户部门信息失败:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      data: {
        orgId: data.org_id,
        orgName: (data.organizations as any).name,
        department: data.department || '',
        role: data.role
      }
    };
  } catch (error) {
    console.error('获取用户部门信息异常:', error);
    return { success: false, error: '获取部门信息失败' };
  }
} 