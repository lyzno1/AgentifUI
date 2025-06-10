/**
 * 部门权限数据同步工具
 * 
 * 用于同步现有组织和部门数据到部门权限表，
 * 以及提供权限管理的辅助功能
 */

import { createClient } from '@lib/supabase/client';
import type { Result } from './department-app-permissions';

// --- BEGIN COMMENT ---
// 🎯 数据同步相关类型定义
// --- END COMMENT ---
export interface OrgDepartmentInfo {
  org_id: string;
  org_name: string;
  department: string;
  member_count: number;
  has_permissions: boolean;
}

export interface PermissionSyncResult {
  created_permissions: number;
  existing_permissions: number;
  total_combinations: number;
  organizations: number;
  departments: number;
  service_instances: number;
}

/**
 * 获取所有组织和部门的信息
 */
export async function getOrgDepartmentInfo(): Promise<Result<OrgDepartmentInfo[]>> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .rpc('get_org_department_info');

    if (error) {
      console.error('获取组织部门信息失败:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('获取组织部门信息异常:', error);
    return { success: false, error: '获取组织部门信息失败' };
  }
}

/**
 * 同步部门权限数据
 * 为所有现有的组织部门组合创建权限记录
 */
export async function syncDepartmentPermissions(): Promise<Result<PermissionSyncResult>> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .rpc('sync_department_permissions');

    if (error) {
      console.error('同步部门权限失败:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data };
  } catch (error) {
    console.error('同步部门权限异常:', error);
    return { success: false, error: '同步部门权限失败' };
  }
}

/**
 * 获取权限同步状态
 */
export async function getPermissionSyncStatus(): Promise<Result<{
  total_orgs: number;
  total_departments: number;
  total_apps: number;
  total_permissions: number;
  coverage_percentage: number;
}>> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .rpc('get_permission_sync_status');

    if (error) {
      console.error('获取权限同步状态失败:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data };
  } catch (error) {
    console.error('获取权限同步状态异常:', error);
    return { success: false, error: '获取权限同步状态失败' };
  }
}

/**
 * 批量更新部门权限 - 简化版本
 */
export async function batchUpdateDepartmentPermissions(updates: {
  org_id: string;
  department: string;
  service_instance_id: string;
  usage_quota?: number | null;
  is_enabled: boolean;
}[]): Promise<Result<number>> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('department_app_permissions')
      .upsert(
        updates.map(update => ({
          org_id: update.org_id,
          department: update.department,
          service_instance_id: update.service_instance_id,
          is_enabled: update.is_enabled,
          usage_quota: update.usage_quota,
          updated_at: new Date().toISOString()
        })),
        {
          onConflict: 'org_id,department,service_instance_id'
        }
      );

    if (error) {
      console.error('批量更新部门权限失败:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: updates.length };
  } catch (error) {
    console.error('批量更新部门权限异常:', error);
    return { success: false, error: '批量更新部门权限失败' };
  }
}

/**
 * 为新部门创建默认权限
 */
export async function createDefaultPermissionsForDepartment(
  org_id: string, 
  department: string
): Promise<Result<number>> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .rpc('create_default_permissions_for_department', {
        target_org_id: org_id,
        target_department: department
      });

    if (error) {
      console.error('为新部门创建默认权限失败:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data };
  } catch (error) {
    console.error('为新部门创建默认权限异常:', error);
    return { success: false, error: '为新部门创建默认权限失败' };
  }
}

/**
 * 删除部门的所有权限
 */
export async function deleteDepartmentPermissions(
  org_id: string, 
  department: string
): Promise<Result<number>> {
  try {
    const supabase = createClient();
    
    // 先查询要删除的记录数量
    const { count, error: countError } = await supabase
      .from('department_app_permissions')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org_id)
      .eq('department', department);

    if (countError) {
      console.error('查询部门权限数量失败:', countError);
      return { success: false, error: countError.message };
    }

    // 执行删除操作
    const { error } = await supabase
      .from('department_app_permissions')
      .delete()
      .eq('org_id', org_id)
      .eq('department', department);

    if (error) {
      console.error('删除部门权限失败:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: count || 0 };
  } catch (error) {
    console.error('删除部门权限异常:', error);
    return { success: false, error: '删除部门权限失败' };
  }
} 