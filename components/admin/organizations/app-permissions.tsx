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
import { Settings, Shield, Users, Globe, Lock, Building2, Search, Filter, Edit, Plus, Minus } from 'lucide-react'
import { cn } from '@lib/utils'
import toast from 'react-hot-toast'

// --- BEGIN COMMENT ---
// 现代化权限管理界面 - 紧凑设计
// --- END COMMENT ---

interface ServiceInstance {
  id: string
  display_name: string
  description?: string
  instance_id: string
  api_path: string
  visibility: 'public' | 'org_only' | 'private'
  config: any
  created_at: string
  updated_at: string
}

interface DepartmentPermission {
  id: string
  org_id: string
  department: string
  service_instance_id: string
  is_enabled: boolean
  usage_quota?: number
  used_count: number
  org_name: string
}

interface OrgDepartment {
  org_id: string
  org_name: string
  department: string
  member_count: number
}

export default function AppPermissionsManagement() {
  const { isDark } = useTheme()
  const [serviceInstances, setServiceInstances] = useState<ServiceInstance[]>([])
  const [departmentPermissions, setDepartmentPermissions] = useState<DepartmentPermission[]>([])
  const [orgDepartments, setOrgDepartments] = useState<OrgDepartment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<ServiceInstance | null>(null)
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false)

  // 数据获取函数
  const fetchServiceInstances = async () => {
    try {
      const response = await fetch('/api/admin/app-permissions/instances')
      if (response.ok) {
        const data = await response.json()
        setServiceInstances(data.instances || [])
      }
    } catch (error) {
      toast.error('获取应用实例失败')
      console.error('获取应用实例失败:', error)
    }
  }

  const fetchDepartmentPermissions = async () => {
    try {
      const response = await fetch('/api/admin/app-permissions/departments')
      if (response.ok) {
        const data = await response.json()
        setDepartmentPermissions(data.permissions || [])
      }
    } catch (error) {
      toast.error('获取部门权限失败')
      console.error('获取部门权限失败:', error)
    }
  }

  const fetchOrgDepartments = async () => {
    try {
      const response = await fetch('/api/admin/organizations/departments')
      if (response.ok) {
        const data = await response.json()
        setOrgDepartments(data.departments || [])
      }
    } catch (error) {
      toast.error('获取组织部门失败')
      console.error('获取组织部门失败:', error)
    }
  }

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
      toast.error('更新应用可见性失败')
      console.error('更新应用可见性失败:', error)
    }
  }

  const updateDepartmentPermission = async (
    orgId: string,
    department: string,
    appId: string,
    permission: { is_enabled: boolean; usage_quota?: number }
  ) => {
    try {
      const response = await fetch('/api/admin/app-permissions/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, department, appId, ...permission }),
      })

      if (response.ok) {
        await fetchDepartmentPermissions()
        toast.success('部门权限更新成功')
      } else {
        toast.error('更新失败')
      }
    } catch (error) {
      toast.error('更新部门权限失败')
      console.error('更新部门权限失败:', error)
    }
  }

  // 工具函数
  const getAppDepartmentPermissions = (appId: string) => {
    return departmentPermissions.filter(p => p.service_instance_id === appId)
  }

  const getVisibilityConfig = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return {
          icon: <Globe className="w-3 h-3" />,
          label: '公开',
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        }
      case 'org_only':
        return {
          icon: <Building2 className="w-3 h-3" />,
          label: '组织',
          color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
        }
      case 'private':
        return {
          icon: <Lock className="w-3 h-3" />,
          label: '私有',
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }
      default:
        return {
          icon: <Shield className="w-3 h-3" />,
          label: '未知',
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
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
        <div className="text-stone-600 dark:text-stone-400 font-serif">加载中...</div>
      </div>
    )
  }

  return (
    <div className={cn(
      "space-y-6 p-6",
      isDark ? "bg-stone-950" : "bg-stone-50"
    )}>
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
          const visibilityConfig = getVisibilityConfig(app.visibility)
          
          return (
            <Card key={app.id} className={cn(
              "border shadow-sm",
              isDark ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200"
            )}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      isDark ? "bg-stone-800" : "bg-stone-100"
                    )}>
                      <Settings className="w-5 h-5 text-stone-600 dark:text-stone-400" />
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
                        isDark ? "border-stone-700 text-stone-300 hover:bg-stone-800" : "border-stone-300 text-stone-700 hover:bg-stone-50"
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
                        <Globe className="w-4 h-4 text-stone-500" />
                        <span className="text-sm font-serif text-stone-600 dark:text-stone-400">
                          可见性: {visibilityConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-stone-500" />
                        <span className="text-sm font-serif text-stone-600 dark:text-stone-400">
                          已授权部门: {authorizedDepts}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {app.description && (
                    <p className="text-sm text-stone-600 dark:text-stone-400 font-serif">
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
          isDark ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200"
        )}>
          <CardContent className="text-center py-12">
            <Settings className="w-16 h-16 text-stone-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 font-serif mb-2">
              暂无应用
            </h3>
            <p className="text-stone-600 dark:text-stone-400 font-serif">
              系统中还没有配置任何应用实例
            </p>
          </CardContent>
        </Card>
      )}

      {/* 权限配置对话框 */}
      <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <DialogContent className={cn(
          "max-w-2xl max-h-[80vh] overflow-y-auto",
          isDark ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200"
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
                    value={selectedApp.visibility}
                    onValueChange={(value) => updateAppVisibility(selectedApp.id, value)}
                  >
                    <SelectTrigger className={cn(
                      "font-serif",
                      isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-300"
                    )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"}>
                      <SelectItem value="public" className="font-serif">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-green-600" />
                          <div>
                            <div className="font-medium">公开</div>
                            <div className="text-xs text-stone-500">所有用户可见</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="org_only" className="font-serif">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-amber-600" />
                          <div>
                            <div className="font-medium">组织限定</div>
                            <div className="text-xs text-stone-500">仅组织成员可见</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="private" className="font-serif">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-red-600" />
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
                {selectedApp.visibility === 'org_only' && (
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
                        const permission = departmentPermissions.find(
                          p => p.org_id === dept.org_id && 
                               p.department === dept.department && 
                               p.service_instance_id === selectedApp.id
                        )
                        
                        return (
                          <div 
                            key={`${dept.org_id}-${dept.department}`}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border",
                              isDark ? "bg-stone-800 border-stone-700" : "bg-stone-50 border-stone-200"
                            )}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                isDark ? "bg-stone-700" : "bg-stone-100"
                              )}>
                                <Building2 className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                              </div>
                              <div>
                                <p className="font-medium font-serif text-stone-900 dark:text-stone-100">
                                  {dept.org_name} - {dept.department}
                                </p>
                                <p className="text-sm text-stone-600 dark:text-stone-400 font-serif">
                                  {dept.member_count} 名成员
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              {permission?.is_enabled && (
                                <div className="text-right">
                                  <p className="text-xs text-stone-600 dark:text-stone-400 font-serif">
                                    配额: {permission.usage_quota || '无限制'}
                                  </p>
                                  <p className="text-xs text-stone-600 dark:text-stone-400 font-serif">
                                    已用: {permission.used_count}
                                  </p>
                                </div>
                              )}
                              <Switch
                                checked={permission?.is_enabled || false}
                                onCheckedChange={(checked) => {
                                  updateDepartmentPermission(
                                    dept.org_id,
                                    dept.department,
                                    selectedApp.id,
                                    { is_enabled: checked, usage_quota: permission?.usage_quota }
                                  )
                                }}
                              />
                            </div>
                          </div>
                        )
                      })}
                      
                      {orgDepartments.length === 0 && (
                        <div className="text-center py-6">
                          <Users className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                          <p className="text-stone-600 dark:text-stone-400 font-serif">
                            暂无组织部门
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button
                  onClick={() => setIsPermissionDialogOpen(false)}
                  className={cn(
                    "font-serif",
                    isDark ? "bg-stone-100 hover:bg-stone-200 text-stone-900" : "bg-stone-900 hover:bg-stone-800 text-white"
                  )}
                >
                  完成
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 