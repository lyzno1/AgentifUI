'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import { Label } from '@components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card'
import { Badge } from '@components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select'
import { Switch } from '@components/ui/switch'
import { Settings, Shield, Users, Globe, Lock, Building2, Search, Filter, Edit, Plus, Minus, Save, RefreshCw } from 'lucide-react'
import { cn } from '@lib/utils'
import toast from 'react-hot-toast'

// --- BEGIN COMMENT ---
// 重新设计的权限配置组件：简化状态管理，修复Switch更新问题
// --- END COMMENT ---

interface ServiceInstance {
  id: string
  display_name: string
  description?: string
  instance_id: string
  visibility: 'public' | 'org_only' | 'private'
}

interface DepartmentPermission {
  id: string
  org_id: string
  department: string
  service_instance_id: string
  is_enabled: boolean
  usage_quota?: number
  used_count: number
}

interface OrgDepartment {
  org_id: string
  org_name: string
  department: string
  member_count: number
}

// --- BEGIN COMMENT ---
// 权限变更项：使用完整ID避免分割错误
// --- END COMMENT ---
interface PermissionChange {
  orgId: string
  department: string
  appId: string
  isEnabled: boolean
  usageQuota?: number
}

export default function AppPermissionsManagement() {
  const { isDark } = useTheme()
  
  // 基础数据
  const [serviceInstances, setServiceInstances] = useState<ServiceInstance[]>([])
  const [departmentPermissions, setDepartmentPermissions] = useState<DepartmentPermission[]>([])
  const [orgDepartments, setOrgDepartments] = useState<OrgDepartment[]>([])
  const [loading, setLoading] = useState(true)
  
  // 对话框状态
  const [selectedApp, setSelectedApp] = useState<ServiceInstance | null>(null)
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false)
  
  // --- BEGIN COMMENT ---
  // 🔧 简化的权限变更缓存：使用数组避免Map的复杂性
  // --- END COMMENT ---
  const [permissionChanges, setPermissionChanges] = useState<PermissionChange[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // --- BEGIN COMMENT ---
  // 🔧 缓存可见性变更，不立即发API
  // --- END COMMENT ---
  const [visibilityChanges, setVisibilityChanges] = useState<Map<string, string>>(new Map())

  // --- BEGIN COMMENT ---
  // 📊 获取组织部门数据
  // --- END COMMENT ---
  const fetchOrgDepartments = async () => {
    try {
      // 并行获取组织和成员数据
      const [orgResponse, memberResponse] = await Promise.all([
        fetch('/api/admin/organizations'),
        fetch('/api/admin/organizations/members')
      ])
      
      if (!orgResponse.ok || !memberResponse.ok) {
        throw new Error('获取数据失败')
      }
      
      const [orgData, memberData] = await Promise.all([
        orgResponse.json(),
        memberResponse.json()
      ])
      
      // 生成部门列表
      const departments: OrgDepartment[] = []
      const organizations = orgData.organizations || []
      const members = memberData.members || []
      
      organizations.forEach((org: any) => {
        const orgMembers = members.filter((member: any) => member.org_id === org.id)
        const deptCounts = new Map<string, number>()
        
        orgMembers.forEach((member: any) => {
          const dept = member.department || '默认部门'
          deptCounts.set(dept, (deptCounts.get(dept) || 0) + 1)
        })
        
        deptCounts.forEach((count, department) => {
          departments.push({
            org_id: org.id,
            org_name: org.name,
            department,
            member_count: count
          })
        })
      })
      
      setOrgDepartments(departments)
      console.log(`[权限配置] 获取到 ${departments.length} 个部门`)
      
    } catch (error) {
      console.error('[权限配置] 获取组织部门失败:', error)
      toast.error('获取组织部门失败')
    }
  }

  // --- BEGIN COMMENT ---
  // 📊 获取应用实例
  // --- END COMMENT ---
  const fetchServiceInstances = async () => {
    try {
      const response = await fetch('/api/admin/app-permissions/instances')
      if (response.ok) {
        const data = await response.json()
        setServiceInstances(data.instances || [])
      }
    } catch (error) {
      console.error('获取应用实例失败:', error)
      toast.error('获取应用实例失败')
    }
  }

  // --- BEGIN COMMENT ---
  // 📊 获取部门权限
  // --- END COMMENT ---
  const fetchDepartmentPermissions = async () => {
    try {
      const response = await fetch('/api/admin/app-permissions/departments')
      if (response.ok) {
        const data = await response.json()
        setDepartmentPermissions(data.permissions || [])
      }
    } catch (error) {
      console.error('获取部门权限失败:', error)
      toast.error('获取部门权限失败')
    }
  }

  // --- BEGIN COMMENT ---
  // 🔄 更新应用可见性
  // --- END COMMENT ---
  const updateAppVisibility = async (appId: string, visibility: string) => {
    try {
      const response = await fetch('/api/admin/app-permissions/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, visibility }),
      })

      if (response.ok) {
        await fetchServiceInstances()
        toast.success('应用可见性更新成功')
      } else {
        toast.error('更新失败')
      }
    } catch (error) {
      console.error('更新应用可见性失败:', error)
      toast.error('更新应用可见性失败')
    }
  }

  // --- BEGIN COMMENT ---
  // 🔧 缓存可见性变更，不立即发API
  // --- END COMMENT ---
  const updateVisibilityCache = (appId: string, visibility: string) => {
    setVisibilityChanges(prev => {
      const newChanges = new Map(prev)
      newChanges.set(appId, visibility)
      return newChanges
    })
    
    // 同时更新selectedApp状态以刷新模态框
    if (selectedApp && selectedApp.id === appId) {
      setSelectedApp(prev => prev ? { ...prev, visibility: visibility as any } : null)
    }
    
    console.log(`[权限配置] 缓存可见性变更: ${appId} -> ${visibility}`)
  }

  const getAppVisibility = (appId: string) => {
    return visibilityChanges.get(appId) || serviceInstances.find(app => app.id === appId)?.visibility || 'public'
  }

  // --- BEGIN COMMENT ---
  // 🔧 获取部门权限状态（包含缓存的变更）
  // --- END COMMENT ---
  const getDepartmentPermissionState = (orgId: string, department: string, appId: string) => {
    // 先查找缓存的变更
    const change = permissionChanges.find(
      c => c.orgId === orgId && c.department === department && c.appId === appId
    )
    
    if (change) {
      return {
        is_enabled: change.isEnabled,
        usage_quota: change.usageQuota
      }
    }
    
    // 查找当前权限
    const permission = departmentPermissions.find(
      p => p.org_id === orgId && p.department === department && p.service_instance_id === appId
    )
    
    return {
      is_enabled: permission?.is_enabled || false,
      usage_quota: permission?.usage_quota
    }
  }

  // --- BEGIN COMMENT ---
  // 🔧 更新权限变更缓存
  // --- END COMMENT ---
  const updatePermissionChange = (orgId: string, department: string, appId: string, isEnabled: boolean) => {
    setPermissionChanges(prev => {
      // 移除已存在的变更
      const filtered = prev.filter(
        c => !(c.orgId === orgId && c.department === department && c.appId === appId)
      )
      
      // 获取当前权限的配额
      const currentPermission = departmentPermissions.find(
        p => p.org_id === orgId && p.department === department && p.service_instance_id === appId
      )
      
      // 添加新的变更
      filtered.push({
        orgId,
        department,
        appId,
        isEnabled,
        usageQuota: currentPermission?.usage_quota
      })
      
      console.log(`[权限配置] 更新权限变更: ${orgId}-${department}-${appId} -> ${isEnabled}`)
      return filtered
    })
  }

  // --- BEGIN COMMENT ---
  // 💾 批量保存权限变更
  // --- END COMMENT ---
  const savePermissionChanges = async () => {
    if (permissionChanges.length === 0) {
      return { success: true, count: 0 }
    }

    let successCount = 0
    let failureCount = 0

    try {
      console.log(`[权限配置] 开始保存 ${permissionChanges.length} 个权限变更`)
      
      for (const change of permissionChanges) {
        try {
          const response = await fetch('/api/admin/app-permissions/departments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orgId: change.orgId,
              department: change.department,
              appId: change.appId,
              is_enabled: change.isEnabled,
              usage_quota: change.usageQuota
            }),
          })

          if (response.ok) {
            successCount++
          } else {
            const errorData = await response.json()
            console.error(`[权限配置] 保存失败:`, errorData)
            failureCount++
          }
        } catch (error) {
          console.error(`[权限配置] 保存异常:`, error)
          failureCount++
        }
      }
      
      // 清除缓存并重新获取数据
      setPermissionChanges([])
      await fetchDepartmentPermissions()
      
      return { success: failureCount === 0, successCount, failureCount }
      
    } catch (error) {
      console.error('[权限配置] 批量保存失败:', error)
      return { success: false, successCount, failureCount }
    }
  }

  // --- BEGIN COMMENT ---
  // 💾 保存可见性变更
  // --- END COMMENT ---
  const saveVisibilityChanges = async () => {
    if (visibilityChanges.size === 0) {
      return { success: true, count: 0 }
    }

    let successCount = 0
    let failureCount = 0

    for (const [appId, visibility] of visibilityChanges.entries()) {
      try {
        const response = await fetch('/api/admin/app-permissions/visibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appId, visibility }),
        })

        if (response.ok) {
          successCount++
        } else {
          console.error(`保存可见性失败: ${appId}`)
          failureCount++
        }
      } catch (error) {
        console.error(`保存可见性异常: ${appId}`, error)
        failureCount++
      }
    }

    setVisibilityChanges(new Map())
    await fetchServiceInstances()
    
    return { success: failureCount === 0, successCount, failureCount }
  }

  // --- BEGIN COMMENT ---
  // 💾 保存所有变更（可见性 + 权限）
  // --- END COMMENT ---
  const saveAllChanges = async () => {
    if (permissionChanges.length === 0 && visibilityChanges.size === 0) {
      toast('没有需要保存的变更')
      return
    }

    setIsSaving(true)
    try {
      // 保存可见性变更
      const visibilityResult = await saveVisibilityChanges()
      
      // 保存权限变更
      const permissionResult = await savePermissionChanges()
      
      // 统一显示结果
      const totalSuccess = (visibilityResult.successCount || 0) + (permissionResult.successCount || 0)
      const totalFailure = (visibilityResult.failureCount || 0) + (permissionResult.failureCount || 0)
      
      if (totalFailure === 0) {
        toast.success(`成功保存 ${totalSuccess} 个配置`)
      } else {
        toast(`保存完成：${totalSuccess} 个成功，${totalFailure} 个失败`)
      }
      
      // 关闭弹窗
      setIsPermissionDialogOpen(false)
      
    } catch (error) {
      toast.error('保存变更失败')
    } finally {
      setIsSaving(false)
    }
  }

  const resetAllChanges = () => {
    setPermissionChanges([])
    setVisibilityChanges(new Map())
    toast('已重置所有未保存的变更')
  }

  const getTotalChanges = () => {
    return permissionChanges.length + visibilityChanges.size
  }

  // 工具函数
  const getAppDepartmentPermissions = (appId: string) => {
    return departmentPermissions.filter(p => p.service_instance_id === appId)
  }

  const getVisibilityConfig = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return {
          icon: <Globe className={cn(
            "w-4 h-4",
            isDark ? "text-stone-400" : "text-stone-500"
          )} />,
          label: '公开',
          color: isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
        }
      case 'org_only':
        return {
          icon: <Building2 className={cn(
            "w-4 h-4",
            isDark ? "text-stone-400" : "text-stone-500"
          )} />,
          label: '组织',
          color: isDark ? 'bg-amber-900 text-amber-200' : 'bg-amber-100 text-amber-800'
        }
      case 'private':
        return {
          icon: <Lock className={cn(
            "w-4 h-4",
            isDark ? "text-stone-400" : "text-stone-500"
          )} />,
          label: '私有',
          color: isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
        }
      default:
        return {
          icon: <Shield className={cn(
            "w-4 h-4",
            isDark ? "text-stone-400" : "text-stone-500"
          )} />,
          label: '未知',
          color: isDark ? 'bg-gray-900 text-gray-200' : 'bg-gray-100 text-gray-800'
        }
    }
  }

  // 初始化数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchServiceInstances(),
        fetchDepartmentPermissions(),
        fetchOrgDepartments()
      ])
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-5 h-5 animate-spin text-stone-600 mr-2" />
        <span className={cn(
          "font-serif",
          isDark ? "text-stone-400" : "text-stone-600"
        )}>加载中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className={cn(
          "text-2xl font-bold font-serif",
          isDark ? "text-stone-100" : "text-stone-900"
        )}>
          应用权限配置
        </h1>
        <p className={cn(
          "font-serif mt-1",
          isDark ? "text-stone-400" : "text-stone-600"
        )}>
          管理应用可见性和部门权限
        </p>
      </div>

      {/* 应用列表 */}
      <div className="space-y-4">
        {serviceInstances.map((app) => {
          const appPermissions = getAppDepartmentPermissions(app.id)
          const authorizedDepts = appPermissions.filter(p => p.is_enabled).length
          const visibilityConfig = getVisibilityConfig(getAppVisibility(app.id))
          
          return (
            <Card key={app.id} className={cn(
              "border shadow-sm",
              isDark ? "bg-stone-900 border-stone-800" : "bg-stone-100 border-stone-200"
            )}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      isDark ? "bg-stone-800" : "bg-stone-100"
                    )}>
                      <Settings className={cn(
                        "w-5 h-5",
                        isDark ? "text-stone-400" : "text-stone-600"
                      )} />
                    </div>
                    <div>
                      <CardTitle className={cn(
                        "text-lg font-serif",
                        isDark ? "text-stone-100" : "text-stone-900"
                      )}>
                        {app.display_name}
                      </CardTitle>
                      <CardDescription className={cn(
                        "font-serif",
                        isDark ? "text-stone-400" : "text-stone-600"
                      )}>
                        ID: {app.instance_id}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={cn("font-serif", visibilityConfig.color)}>
                      <span className="flex items-center gap-1">
                        {visibilityConfig.icon}
                        {visibilityConfig.label}
                      </span>
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedApp(app)
                        setIsPermissionDialogOpen(true)
                      }}
                      className={cn(
                        "font-serif",
                        isDark ? "border-stone-700 text-stone-300 hover:bg-stone-800" : "border-stone-300 text-stone-700 hover:bg-stone-100"
                      )}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      配置权限
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Globe className={cn(
                          "w-4 h-4",
                          isDark ? "text-stone-400" : "text-stone-500"
                        )} />
                        <span className={cn(
                          "text-sm font-serif",
                          isDark ? "text-stone-400" : "text-stone-600"
                        )}>
                          可见性: {visibilityConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Shield className={cn(
                          "w-4 h-4",
                          isDark ? "text-stone-400" : "text-stone-500"
                        )} />
                        <span className={cn(
                          "text-sm font-serif",
                          isDark ? "text-stone-400" : "text-stone-600"
                        )}>
                          已授权部门: {authorizedDepts}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {app.description && (
                    <p className={cn(
                      "text-sm font-serif",
                      isDark ? "text-stone-400" : "text-stone-600"
                    )}>
                      {app.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {serviceInstances.length === 0 && (
        <Card className={cn(
          "border shadow-sm",
          isDark ? "bg-stone-900 border-stone-800" : "bg-stone-100 border-stone-200"
        )}>
          <CardContent className="text-center py-12">
            <Settings className="w-16 h-16 text-stone-400 mx-auto mb-4" />
            <h3 className={cn(
              "text-lg font-medium font-serif mb-2",
              isDark ? "text-stone-100" : "text-stone-900"
            )}>
              暂无应用
            </h3>
            <p className={cn(
              "font-serif",
              isDark ? "text-stone-400" : "text-stone-600"
            )}>
              系统中还没有配置任何应用实例
            </p>
          </CardContent>
        </Card>
      )}

      {/* 权限配置对话框 */}
      <Dialog 
        open={isPermissionDialogOpen} 
        onOpenChange={(open) => {
          if (!open && getTotalChanges() > 0) {
            if (confirm('您有未保存的更改，确定要关闭吗？')) {
              resetAllChanges()
              setIsPermissionDialogOpen(false)
            }
          } else {
            setIsPermissionDialogOpen(open)
          }
        }}
      >
        <DialogContent className={cn(
          "max-w-2xl max-h-[80vh] overflow-y-auto",
          isDark ? "bg-stone-900 border-stone-800" : "bg-stone-100 border-stone-200"
        )}>
          {selectedApp && (
            <>
              <DialogHeader>
                <DialogTitle className={cn(
                  "font-serif",
                  isDark ? "text-stone-100" : "text-stone-900"
                )}>
                  配置应用权限
                </DialogTitle>
                <DialogDescription className={cn(
                  "font-serif",
                  isDark ? "text-stone-400" : "text-stone-600"
                )}>
                  管理 "{selectedApp.display_name}" 的可见性和部门权限
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* 应用可见性设置 */}
                <div>
                  <Label className={cn(
                    "text-base font-medium font-serif",
                    isDark ? "text-stone-200" : "text-stone-800"
                  )}>
                    应用可见性
                  </Label>
                  <p className={cn(
                    "text-sm font-serif mt-1 mb-3",
                    isDark ? "text-stone-400" : "text-stone-600"
                  )}>
                    控制谁可以看到这个应用
                  </p>
                  <Select
                    value={getAppVisibility(selectedApp.id)}
                    onValueChange={(value) => updateVisibilityCache(selectedApp.id, value)}
                  >
                    <SelectTrigger className={cn(
                      "font-serif",
                      isDark ? "bg-stone-800 border-stone-700" : "bg-stone-100 border-stone-300"
                    )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={isDark ? "bg-stone-800 border-stone-700" : "bg-stone-100 border-stone-200"}>
                      <SelectItem value="public" className="font-serif">
                        <div className="flex items-center gap-2">
                          <Globe className={cn(
                            "w-4 h-4",
                            isDark ? "text-stone-400" : "text-stone-500"
                          )} />
                          <div>
                            <div className="font-medium">公开</div>
                            <div className="text-xs text-stone-500">所有用户可见</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="org_only" className="font-serif">
                        <div className="flex items-center gap-2">
                          <Building2 className={cn(
                            "w-4 h-4",
                            isDark ? "text-stone-400" : "text-stone-500"
                          )} />
                          <div>
                            <div className="font-medium">组织限定</div>
                            <div className="text-xs text-stone-500">仅组织成员可见</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="private" className="font-serif">
                        <div className="flex items-center gap-2">
                          <Lock className={cn(
                            "w-4 h-4",
                            isDark ? "text-stone-400" : "text-stone-500"
                          )} />
                          <div>
                            <div className="font-medium">私有</div>
                            <div className="text-xs text-stone-500">仅管理员可见</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 部门权限配置 */}
                {getAppVisibility(selectedApp.id) === 'org_only' && (
                  <div>
                    <Label className={cn(
                      "text-base font-medium font-serif",
                      isDark ? "text-stone-200" : "text-stone-800"
                    )}>
                      部门权限
                    </Label>
                    <p className={cn(
                      "text-sm font-serif mt-1 mb-3",
                      isDark ? "text-stone-400" : "text-stone-600"
                    )}>
                      设置哪些部门可以使用此应用
                    </p>
                    
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {orgDepartments.map((dept) => {
                        const currentState = getDepartmentPermissionState(dept.org_id, dept.department, selectedApp.id)
                        const originalPermission = departmentPermissions.find(
                          p => p.org_id === dept.org_id && 
                               p.department === dept.department && 
                               p.service_instance_id === selectedApp.id
                        )
                        
                        return (
                          <div 
                            key={`${dept.org_id}-${dept.department}`}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border",
                              isDark ? "bg-stone-800 border-stone-700" : "bg-stone-100 border-stone-200"
                            )}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                isDark ? "bg-stone-700" : "bg-stone-100"
                              )}>
                                <Building2 className={cn(
                                  "w-4 h-4",
                                  isDark ? "text-stone-400" : "text-stone-500"
                                )} />
                              </div>
                              <div>
                                <p className={cn(
                                  "font-medium font-serif",
                                  isDark ? "text-stone-100" : "text-stone-900"
                                )}>
                                  {dept.org_name} - {dept.department}
                                </p>
                                <p className={cn(
                                  "text-sm font-serif",
                                  isDark ? "text-stone-400" : "text-stone-600"
                                )}>
                                  {dept.member_count} 名成员
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              {currentState.is_enabled && (
                                <div className="text-right">
                                  <p className={cn(
                                    "text-xs font-serif",
                                    isDark ? "text-stone-400" : "text-stone-600"
                                  )}>
                                    配额: {currentState.usage_quota || '无限制'}
                                  </p>
                                  <p className={cn(
                                    "text-xs font-serif",
                                    isDark ? "text-stone-400" : "text-stone-600"
                                  )}>
                                    已用: {originalPermission?.used_count || 0}
                                  </p>
                                </div>
                              )}
                              <Switch
                                checked={currentState.is_enabled}
                                onCheckedChange={(checked) => {
                                  updatePermissionChange(dept.org_id, dept.department, selectedApp.id, checked)
                                }}
                              />
                            </div>
                          </div>
                        )
                      })}
                      
                      {orgDepartments.length === 0 && (
                        <div className="text-center py-6">
                          <Users className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                          <p className={cn(
                            "font-serif",
                            isDark ? "text-stone-400" : "text-stone-600"
                          )}>
                            暂无组织部门
                          </p>
                          <p className={cn(
                            "text-xs font-serif mt-2",
                            isDark ? "text-stone-500" : "text-stone-500"
                          )}>
                            请先在组织管理中添加成员到部门
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter className="gap-2">
                {/* 显示待保存更改数量 */}
                {getTotalChanges() > 0 && (
                  <div className={cn(
                    "text-sm font-serif mr-auto",
                    isDark ? "text-amber-400" : "text-amber-600"
                  )}>
                    有 {getTotalChanges()} 个待保存的更改
                  </div>
                )}
                
                {/* 重置按钮 */}
                {getTotalChanges() > 0 && (
                  <Button
                    variant="outline"
                    onClick={resetAllChanges}
                    disabled={isSaving}
                    className={cn(
                      "font-serif",
                      isDark ? "border-stone-700 text-stone-300 hover:bg-stone-800" : "border-stone-300 text-stone-700 hover:bg-stone-100"
                    )}
                  >
                    重置
                  </Button>
                )}
                
                {/* 保存按钮 */}
                {getTotalChanges() > 0 && (
                  <Button
                    onClick={saveAllChanges}
                    disabled={isSaving}
                    className={cn(
                      "font-serif",
                      isDark ? "bg-stone-100 hover:bg-stone-200 text-stone-900" : "bg-stone-900 hover:bg-stone-800 text-white"
                    )}
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        保存更改
                      </>
                    )}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 