'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from '@lib/hooks/use-theme'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import { Label } from '@components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card'
import { Badge } from '@components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select'
import { Textarea } from '@components/ui/textarea'
import { 
  Building2, 
  Users, 
  Settings, 
  UserPlus, 
  Trash2, 
  UserMinus,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Shield,
  Crown,
  UserIcon,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
  Layers,
  Edit,
  ChevronDown
} from 'lucide-react'
import { cn } from '@lib/utils'
import AppPermissionsManagement from './app-permissions'
import toast from 'react-hot-toast'

// --- BEGIN COMMENT ---
// 现代化组织管理界面 - Stone风格设计
// 包含统计卡片、筛选功能、响应式布局
// --- END COMMENT ---

interface Organization {
  id: string
  name: string
  logo_url?: string
  settings: any
  created_at: string
  updated_at: string
}

interface OrgMember {
  id: string
  org_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  department?: string
  job_title?: string
  created_at: string
  updated_at: string
  user?: {
    full_name?: string
    username?: string
    email?: string
  }
}

interface OrgDepartmentInfo {
  org_id: string
  org_name: string
  department: string
  member_count: number
  has_permissions: boolean
  roles: string
}

interface OrgStats {
  totalOrganizations: number
  totalMembers: number
  totalDepartments: number
  organizationsWithPermissions: number
  avgMembersPerOrg: number
  topDepartments: Array<{ department: string; count: number }>
}

export default function OrganizationsManagement() {
  const { isDark } = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // --- BEGIN COMMENT ---
  // 🔧 URL查询参数控制tab切换
  // --- END COMMENT ---
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || 'organizations'
  })
  
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([])
  const [orgStats, setOrgStats] = useState<OrgStats | null>(null)
  const [loading, setLoading] = useState(true)
  
  // --- 对话框状态 ---
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false)
  const [isEditOrgOpen, setIsEditOrgOpen] = useState(false)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  
  // --- Loading状态 ---
  const [operationLoading, setOperationLoading] = useState(false)
  
  // --- 表单状态 ---
  const [newOrgForm, setNewOrgForm] = useState({
    name: '',
    description: '',
    type: 'company'
  })
  
  const [editOrgForm, setEditOrgForm] = useState({
    id: '',
    name: '',
    description: '',
    type: 'company'
  })
  
  const [addUserForm, setAddUserForm] = useState({
    userId: '',
    orgId: '',
    department: '',
    jobTitle: '',
    role: 'member' as 'owner' | 'admin' | 'member'
  })

  // --- 用户数据 ---
  const [allUsers, setAllUsers] = useState<Array<{
    id: string
    full_name?: string
    username?: string
    avatar_url?: string
    role?: string
    status?: string
  }>>([])
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [filteredUsers, setFilteredUsers] = useState<typeof allUsers>([])
  const [selectedUser, setSelectedUser] = useState<typeof allUsers[0] | null>(null)

  // --- 从现有成员数据生成部门信息 ---
  const getDepartmentInfo = () => {
    const departmentGroups = orgMembers.reduce((acc, member) => {
      if (member.department) {
        const key = `${member.org_id}-${member.department}`
        if (!acc[key]) {
          const org = organizations.find(o => o.id === member.org_id)
          acc[key] = {
            org_id: member.org_id,
            org_name: org?.name || '未知组织',
            department: member.department,
            member_count: 0,
            has_permissions: false,
            roles: ''
          }
        }
        acc[key].member_count++
      }
      return acc
    }, {} as Record<string, OrgDepartmentInfo>)
    
    return Object.values(departmentGroups)
  }

  // --- 计算组织统计数据 ---
  const calculateStats = (): OrgStats => {
    const totalOrganizations = organizations.length
    const totalMembers = orgMembers.length
    const departmentInfo = getDepartmentInfo()
    
    const totalDepartments = departmentInfo.length
    const organizationsWithPermissions = 0 // 暂时设为0，实际需要根据权限数据计算
    const avgMembersPerOrg = totalOrganizations > 0 ? Math.round(totalMembers / totalOrganizations) : 0
    
    // 计算热门部门
    const deptCounts = departmentInfo.reduce((acc, dept) => {
      acc[dept.department] = (acc[dept.department] || 0) + dept.member_count
      return acc
    }, {} as Record<string, number>)
    
    const topDepartments = Object.entries(deptCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([department, count]) => ({ department, count: count as number }))
    
    return {
      totalOrganizations,
      totalMembers,
      totalDepartments,
      organizationsWithPermissions,
      avgMembersPerOrg,
      topDepartments
    }
  }

  // --- 数据获取函数 ---
  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/admin/organizations')
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data.organizations || [])
      } else {
        toast.error('获取组织列表失败')
      }
    } catch (error) {
      toast.error('获取组织列表失败')
      console.error('获取组织列表失败:', error)
    }
  }

  const fetchOrgMembers = async () => {
    try {
      const response = await fetch('/api/admin/organizations/members')
      if (response.ok) {
        const data = await response.json()
        setOrgMembers(data.members || [])
      } else {
        toast.error('获取成员列表失败')
      }
    } catch (error) {
      toast.error('获取成员列表失败')
      console.error('获取成员列表失败:', error)
    }
  }

  const fetchAllUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setAllUsers(data.users || [])
      } else {
        toast.error('获取用户列表失败')
      }
    } catch (error) {
      toast.error('获取用户列表失败')
      console.error('获取用户列表失败:', error)
    }
  }

  // --- 操作处理函数 ---
  const handleCreateOrganization = async () => {
    setOperationLoading(true)
    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newOrgForm.name,
          settings: { 
            description: newOrgForm.description,
            type: newOrgForm.type
          }
        }),
      })

      if (response.ok) {
        setIsCreateOrgOpen(false)
        setNewOrgForm({ name: '', description: '', type: 'company' })
        await fetchOrganizations()
        toast.success('组织创建成功')
      } else {
        const data = await response.json()
        toast.error(data.error || '创建组织失败')
      }
    } catch (error) {
      toast.error('创建组织失败')
      console.error('创建组织失败:', error)
    } finally {
      setOperationLoading(false)
    }
  }

  const handleEditOrganization = async () => {
    setOperationLoading(true)
    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: editOrgForm.id,
          name: editOrgForm.name,
          settings: {
            description: editOrgForm.description,
            type: editOrgForm.type
          }
        }),
      })

      if (response.ok) {
        setIsEditOrgOpen(false)
        setEditOrgForm({ id: '', name: '', description: '', type: 'company' })
        await fetchOrganizations()
        toast.success('组织更新成功')
      } else {
        const data = await response.json()
        toast.error(data.error || '更新组织失败')
      }
    } catch (error) {
      toast.error('更新组织失败')
      console.error('更新组织失败:', error)
    } finally {
      setOperationLoading(false)
    }
  }

  const openEditDialog = (org: Organization) => {
    setEditOrgForm({
      id: org.id,
      name: org.name,
      description: org.settings?.description || '',
      type: org.settings?.type || 'company'
    })
    setIsEditOrgOpen(true)
  }

  const handleAddUserToOrg = async () => {
    if (!addUserForm.department.trim()) {
      toast.error('部门不能为空')
      return
    }

    setOperationLoading(true)
    try {
      const response = await fetch('/api/admin/organizations/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addUserForm),
      })

      if (response.ok) {
        setIsAddUserOpen(false)
        setAddUserForm({
          userId: '',
          orgId: '',
          department: '',
          jobTitle: '',
          role: 'member'
        })
        resetUserSelection()
        await fetchOrgMembers()
        toast.success('成员添加成功')
      } else {
        const data = await response.json()
        toast.error(data.error || '添加成员失败')
      }
    } catch (error) {
      toast.error('添加成员失败')
      console.error('添加用户到组织失败:', error)
    } finally {
      setOperationLoading(false)
    }
  }

  // --- 优化后的用户选择逻辑 ---
  const resetUserSelection = () => {
    setUserSearchTerm('')
    setFilteredUsers([])
    setSelectedUser(null)
    setIsUserDropdownOpen(false)
    setAddUserForm(prev => ({ ...prev, userId: '' }))
  }

  const initializeUserList = () => {
    if (allUsers.length > 0) {
      setFilteredUsers(allUsers.slice(0, 20))
    }
  }

  const handleUserSearch = (searchTerm: string) => {
    setUserSearchTerm(searchTerm)
    setSelectedUser(null)
    
    if (!searchTerm.trim()) {
      setFilteredUsers(allUsers.slice(0, 20))
    } else {
      const filtered = allUsers.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredUsers(filtered.slice(0, 20))
    }
  }

  const toggleUserDropdown = () => {
    const newOpen = !isUserDropdownOpen
    setIsUserDropdownOpen(newOpen)
    
    if (newOpen && !userSearchTerm) {
      initializeUserList()
    }
  }

  const selectUser = (user: typeof allUsers[0]) => {
    setSelectedUser(user)
    setAddUserForm(prev => ({ ...prev, userId: user.id }))
    setUserSearchTerm('')
    setIsUserDropdownOpen(false)
  }

  const getDisplayText = () => {
    if (selectedUser) {
      return selectedUser.full_name || selectedUser.username || '已选择用户'
    }
    return userSearchTerm || ''
  }

  const handleRemoveUserFromOrg = async (memberId: string, memberName: string) => {
    if (!confirm(`确定要移除成员"${memberName}"吗？`)) return

    setOperationLoading(true)
    try {
      const response = await fetch('/api/admin/organizations/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      })

      if (response.ok) {
        await fetchOrgMembers()
        toast.success('成员移除成功')
      } else {
        const data = await response.json()
        toast.error(data.error || '移除成员失败')
      }
    } catch (error) {
      toast.error('移除成员失败')
      console.error('移除组织成员失败:', error)
    } finally {
      setOperationLoading(false)
    }
  }

  const handleDeleteOrganization = async (orgId: string, orgName: string) => {
    if (!confirm(`确定要删除组织"${orgName}"吗？此操作不可撤销。`)) return

    setOperationLoading(true)
    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      })

      if (response.ok) {
        await Promise.all([fetchOrganizations(), fetchOrgMembers()])
        toast.success('组织删除成功')
      } else {
        const data = await response.json()
        toast.error(data.error || '删除组织失败')
      }
    } catch (error) {
      toast.error('删除组织失败')
      console.error('删除组织失败:', error)
    } finally {
      setOperationLoading(false)
    }
  }

  // --- BEGIN COMMENT ---
  // 🔧 Tab切换和URL同步
  // --- END COMMENT ---
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  // --- BEGIN COMMENT ---
  // 🔧 监听URL变化同步tab状态
  // --- END COMMENT ---
  useEffect(() => {
    const tab = searchParams.get('tab') || 'organizations'
    setActiveTab(tab)
  }, [searchParams])

  // --- 初始化数据 ---
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchOrganizations(),
        fetchOrgMembers(),
        fetchAllUsers()
      ])
      setLoading(false)
    }
    loadData()
  }, [])

  // --- 计算统计数据 ---
  useEffect(() => {
    if (organizations.length > 0 || orgMembers.length > 0) {
      setOrgStats(calculateStats())
    }
  }, [organizations, orgMembers])

  // --- 初始化用户列表显示 ---
  useEffect(() => {
    if (allUsers.length > 0 && filteredUsers.length === 0 && !userSearchTerm && !selectedUser) {
      setFilteredUsers(allUsers.slice(0, 20))
    }
  }, [allUsers, userSearchTerm, selectedUser])

  // --- 点击外部关闭下拉列表 ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.user-search-container')) {
        setIsUserDropdownOpen(false)
      }
    }

    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserDropdownOpen])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-stone-600" />
          <span className="text-stone-600 font-serif">加载中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "space-y-6 p-6",
      isDark ? "bg-stone-950" : "bg-stone-50"
    )}>
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={cn(
            "text-2xl font-bold font-serif",
            isDark ? "text-stone-100" : "text-stone-900"
          )}>
            组织管理
          </h1>
          <p className={cn(
            "font-serif mt-1",
            isDark ? "text-stone-400" : "text-stone-600"
          )}>
            管理组织结构和成员关系
          </p>
        </div>
        
        <div className="flex gap-3">
          <Dialog open={isCreateOrgOpen} onOpenChange={setIsCreateOrgOpen}>
            <DialogTrigger asChild>
              <Button className={cn(
                "font-serif",
                isDark ? "bg-stone-100 hover:bg-stone-200 text-stone-900" : "bg-stone-900 hover:bg-stone-800 text-white"
              )}>
                <Plus className="w-4 h-4 mr-2" />
                创建组织
              </Button>
            </DialogTrigger>
            <DialogContent className={cn(
              "max-w-md",
              isDark ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200"
            )}>
              <DialogHeader>
                <DialogTitle className={cn(
                  "font-serif",
                  isDark ? "text-stone-100" : "text-stone-900"
                )}>
                  创建新组织
                </DialogTitle>
                <DialogDescription className={cn(
                  "font-serif",
                  isDark ? "text-stone-400" : "text-stone-600"
                )}>
                  创建一个新的组织
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className={cn(
                    "font-serif",
                    isDark ? "text-stone-300" : "text-stone-700"
                  )}>
                    组织名称
                  </Label>
                  <Input
                    value={newOrgForm.name}
                    onChange={(e) => setNewOrgForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="输入组织名称"
                    className={cn(
                      "font-serif mt-1",
                      isDark ? "bg-stone-800 border-stone-700 text-stone-100" : "bg-white border-stone-300"
                    )}
                  />
                </div>
                <div>
                  <Label className={cn(
                    "font-serif",
                    isDark ? "text-stone-300" : "text-stone-700"
                  )}>
                    描述
                  </Label>
                  <Textarea
                    value={newOrgForm.description}
                    onChange={(e) => setNewOrgForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="输入描述（可选）"
                    className={cn(
                      "font-serif mt-1",
                      isDark ? "bg-stone-800 border-stone-700 text-stone-100" : "bg-white border-stone-300"
                    )}
                  />
                </div>
                <div>
                  <Label className={cn(
                    "font-serif",
                    isDark ? "text-stone-300" : "text-stone-700"
                  )}>
                    组织类型
                  </Label>
                  <Input
                    value={newOrgForm.type}
                    onChange={(e) => setNewOrgForm(prev => ({ ...prev, type: e.target.value }))}
                    placeholder="输入组织类型（如：公司、团队、部门等）"
                    className={cn(
                      "font-serif mt-1",
                      isDark ? "bg-stone-800 border-stone-700 text-stone-100" : "bg-white border-stone-300"
                    )}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateOrganization}
                  disabled={!newOrgForm.name.trim() || operationLoading}
                  className={cn(
                    "font-serif",
                    isDark ? "bg-stone-100 hover:bg-stone-200 text-stone-900" : "bg-stone-900 hover:bg-stone-800 text-white"
                  )}
                >
                  {operationLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    '创建'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* --- 编辑组织对话框 --- */}
          <Dialog open={isEditOrgOpen} onOpenChange={setIsEditOrgOpen}>
            <DialogContent className={cn(
              "max-w-md",
              isDark ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200"
            )}>
              <DialogHeader>
                <DialogTitle className={cn(
                  "font-serif",
                  isDark ? "text-stone-100" : "text-stone-900"
                )}>
                  编辑组织
                </DialogTitle>
                <DialogDescription className={cn(
                  "font-serif",
                  isDark ? "text-stone-400" : "text-stone-600"
                )}>
                  修改组织的基本信息
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className={cn(
                    "font-serif",
                    isDark ? "text-stone-300" : "text-stone-700"
                  )}>
                    组织名称
                  </Label>
                  <Input
                    value={editOrgForm.name}
                    onChange={(e) => setEditOrgForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="输入组织名称"
                    className={cn(
                      "font-serif mt-1",
                      isDark ? "bg-stone-800 border-stone-700 text-stone-100" : "bg-white border-stone-300"
                    )}
                  />
                </div>
                <div>
                  <Label className={cn(
                    "font-serif",
                    isDark ? "text-stone-300" : "text-stone-700"
                  )}>
                    组织描述
                  </Label>
                  <Textarea
                    value={editOrgForm.description}
                    onChange={(e) => setEditOrgForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="输入组织描述（可选）"
                    className={cn(
                      "font-serif mt-1",
                      isDark ? "bg-stone-800 border-stone-700 text-stone-100" : "bg-white border-stone-300"
                    )}
                  />
                </div>
                <div>
                  <Label className={cn(
                    "font-serif",
                    isDark ? "text-stone-300" : "text-stone-700"
                  )}>
                    组织类型
                  </Label>
                  <Input
                    value={editOrgForm.type}
                    onChange={(e) => setEditOrgForm(prev => ({ ...prev, type: e.target.value }))}
                    placeholder="输入组织类型（如：公司、团队、部门等）"
                    className={cn(
                      "font-serif mt-1",
                      isDark ? "bg-stone-800 border-stone-700 text-stone-100" : "bg-white border-stone-300"
                    )}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleEditOrganization}
                  disabled={!editOrgForm.name.trim() || operationLoading}
                  className={cn(
                    "font-serif",
                    isDark ? "bg-stone-100 hover:bg-stone-200 text-stone-900" : "bg-stone-900 hover:bg-stone-800 text-white"
                  )}
                >
                  {operationLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    '保存'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddUserOpen} onOpenChange={(open) => {
            setIsAddUserOpen(open)
            if (!open) {
              resetUserSelection()
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" className={cn(
                "font-serif",
                isDark ? "border-stone-700 text-stone-300 hover:bg-stone-800" : "border-stone-300 text-stone-700 hover:bg-stone-50"
              )}>
                <UserPlus className="w-4 h-4 mr-2" />
                添加成员
              </Button>
            </DialogTrigger>
            <DialogContent className={cn(
              "max-w-md",
              isDark ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200"
            )}>
              <DialogHeader>
                <DialogTitle className={cn(
                  "font-serif",
                  isDark ? "text-stone-100" : "text-stone-900"
                )}>
                  添加成员
                </DialogTitle>
                <DialogDescription className={cn(
                  "font-serif",
                  isDark ? "text-stone-400" : "text-stone-600"
                )}>
                  将用户添加到组织和部门
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative user-search-container">
                  <Label className={cn(
                    "font-serif",
                    isDark ? "text-stone-300" : "text-stone-700"
                  )}>
                    选择用户
                  </Label>
                  
                  {/* 选择器容器 */}
                  <div className="relative mt-1">
                    {/* 主输入框/显示框 */}
                    <div
                      className={cn(
                        "relative flex items-center min-h-[40px] w-full rounded-md border px-3 py-2 cursor-pointer",
                        "transition-colors font-serif",
                        isUserDropdownOpen && "ring-2 ring-stone-400/20",
                                                   isDark 
                             ? "bg-stone-800 border-stone-700 text-stone-100 hover:bg-stone-800/80"
                             : "bg-white border-stone-300 text-stone-900 hover:bg-stone-50"
                      )}
                      onClick={toggleUserDropdown}
                    >
                      {/* 用户显示区域 */}
                      {selectedUser ? (
                        <div className="flex items-center flex-1 min-w-0">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0",
                            selectedUser.role === 'admin' && (isDark ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"),
                            selectedUser.role === 'manager' && (isDark ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800"),
                            selectedUser.role === 'user' && (isDark ? "bg-stone-700 text-stone-300" : "bg-stone-200 text-stone-700")
                          )}>
                            <UserIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {selectedUser.full_name || selectedUser.username}
                            </p>
                            <p className={cn(
                              "text-xs truncate",
                              isDark ? "text-stone-400" : "text-stone-600"
                            )}>
                              @{selectedUser.username} • {selectedUser.role}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              resetUserSelection()
                            }}
                            className={cn(
                              "ml-2 p-1 rounded-full hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors",
                              "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                            )}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center flex-1">
                          <Search className="w-4 h-4 text-stone-400 mr-2" />
                          <span className={cn(
                            "flex-1 text-sm",
                            isDark ? "text-stone-400" : "text-stone-500"
                          )}>
                            点击选择用户
                          </span>
                        </div>
                      )}
                      
                      {/* 下拉箭头 */}
                      <ChevronDown className={cn(
                        "w-4 h-4 ml-2 transition-transform text-stone-400",
                        isUserDropdownOpen && "rotate-180"
                      )} />
                    </div>
                    
                    {/* 搜索输入框（下拉打开时显示） */}
                    {isUserDropdownOpen && (
                      <div className={cn(
                        "absolute z-50 w-full mt-1 border rounded-md shadow-lg",
                        isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"
                      )}>
                        <div className="p-2 border-b border-stone-200 dark:border-stone-700">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
                            <Input
                              value={userSearchTerm}
                              onChange={(e) => handleUserSearch(e.target.value)}
                              placeholder="搜索用户姓名或用户名..."
                              className={cn(
                                "pl-10 font-serif border-0 focus:ring-0",
                                isDark ? "bg-stone-900 text-stone-100" : "bg-stone-50 text-stone-900"
                              )}
                              autoFocus
                            />
                          </div>
                        </div>
                        
                        {/* 用户列表 */}
                        <div className="max-h-60 overflow-auto">
                          {filteredUsers.length > 0 ? (
                            <>
                              {filteredUsers.map((user) => (
                                <div
                                  key={user.id}
                                  onClick={() => selectUser(user)}
                                  className={cn(
                                    "px-3 py-3 cursor-pointer transition-colors",
                                    "hover:bg-stone-100 dark:hover:bg-stone-700",
                                    "flex items-center justify-between"
                                  )}
                                >
                                  <div className="flex items-center flex-1 min-w-0">
                                    <div className={cn(
                                      "w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0",
                                      user.role === 'admin' && (isDark ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"),
                                      user.role === 'manager' && (isDark ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800"),
                                      user.role === 'user' && (isDark ? "bg-stone-700 text-stone-300" : "bg-stone-200 text-stone-700")
                                    )}>
                                      <UserIcon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium font-serif text-stone-900 dark:text-stone-100 truncate">
                                        {user.full_name || user.username}
                                      </p>
                                      <p className="text-sm text-stone-600 dark:text-stone-400 font-serif truncate">
                                        @{user.username}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs font-serif ml-2 flex-shrink-0"
                                  >
                                    {user.role}
                                  </Badge>
                                </div>
                              ))}
                              
                              {/* 统计信息 */}
                              {allUsers.length > 20 && (
                                <div className={cn(
                                  "px-3 py-2 text-xs border-t",
                                                                     isDark ? "text-stone-400 border-stone-700 bg-stone-900/50" : "text-stone-500 border-stone-200 bg-stone-50"
                                )}>
                                  {userSearchTerm 
                                    ? `显示 ${filteredUsers.length} 个搜索结果` 
                                    : `显示前 20 个用户，共 ${allUsers.length} 个`
                                  }
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="px-3 py-6 text-center">
                              <UserIcon className="w-12 h-12 text-stone-400 mx-auto mb-2" />
                              <p className="text-sm text-stone-500 dark:text-stone-400 font-serif">
                                {userSearchTerm ? '未找到匹配的用户' : '暂无用户数据'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label className={cn(
                    "font-serif",
                    isDark ? "text-stone-300" : "text-stone-700"
                  )}>
                    组织
                  </Label>
                  <Select
                    value={addUserForm.orgId}
                    onValueChange={(value) => setAddUserForm(prev => ({ ...prev, orgId: value }))}
                  >
                    <SelectTrigger className={cn(
                      "font-serif mt-1",
                      isDark ? "bg-stone-800 border-stone-700 text-stone-100" : "bg-white border-stone-300"
                    )}>
                      <SelectValue placeholder="选择组织" />
                    </SelectTrigger>
                    <SelectContent className={isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"}>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id} className="font-serif">
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={cn(
                    "font-serif",
                    isDark ? "text-stone-300" : "text-stone-700"
                  )}>
                    部门
                  </Label>
                  <Input
                    value={addUserForm.department}
                    onChange={(e) => setAddUserForm(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="输入部门名称"
                    className={cn(
                      "font-serif mt-1",
                      isDark ? "bg-stone-800 border-stone-700 text-stone-100" : "bg-white border-stone-300"
                    )}
                  />
                </div>
                <div>
                  <Label className={cn(
                    "font-serif",
                    isDark ? "text-stone-300" : "text-stone-700"
                  )}>
                    职位
                  </Label>
                  <Input
                    value={addUserForm.jobTitle}
                    onChange={(e) => setAddUserForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                    placeholder="输入职位（可选）"
                    className={cn(
                      "font-serif mt-1",
                      isDark ? "bg-stone-800 border-stone-700 text-stone-100" : "bg-white border-stone-300"
                    )}
                  />
                </div>
                <div>
                  <Label className={cn(
                    "font-serif",
                    isDark ? "text-stone-300" : "text-stone-700"
                  )}>
                    角色
                  </Label>
                  <Select
                    value={addUserForm.role}
                    onValueChange={(value: 'owner' | 'admin' | 'member') => 
                      setAddUserForm(prev => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger className={cn(
                      "font-serif mt-1",
                      isDark ? "bg-stone-800 border-stone-700 text-stone-100" : "bg-white border-stone-300"
                    )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"}>
                      <SelectItem value="member" className="font-serif">成员</SelectItem>
                      <SelectItem value="admin" className="font-serif">管理员</SelectItem>
                      <SelectItem value="owner" className="font-serif">所有者</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleAddUserToOrg}
                  disabled={!selectedUser || !addUserForm.orgId || operationLoading}
                  className={cn(
                    "font-serif",
                    isDark ? "bg-stone-100 hover:bg-stone-200 text-stone-900" : "bg-stone-900 hover:bg-stone-800 text-white"
                  )}
                >
                  {operationLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      添加中...
                    </>
                  ) : (
                    '添加'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className={cn(
          "grid w-full grid-cols-3",
          isDark ? "bg-stone-800 border-stone-700" : "bg-stone-100 border-stone-200"
        )}>
          <TabsTrigger 
            value="organizations" 
            className={cn(
              "font-serif",
              isDark 
                ? "data-[state=active]:bg-stone-700 data-[state=active]:text-stone-100" 
                : "data-[state=active]:bg-white data-[state=active]:text-stone-900"
            )}
          >
            组织列表
          </TabsTrigger>
          <TabsTrigger 
            value="departments" 
            className={cn(
              "font-serif",
              isDark 
                ? "data-[state=active]:bg-stone-700 data-[state=active]:text-stone-100" 
                : "data-[state=active]:bg-white data-[state=active]:text-stone-900"
            )}
          >
            部门管理
          </TabsTrigger>
          <TabsTrigger 
            value="permissions" 
            className={cn(
              "font-serif",
              isDark 
                ? "data-[state=active]:bg-stone-700 data-[state=active]:text-stone-100" 
                : "data-[state=active]:bg-white data-[state=active]:text-stone-900"
            )}
          >
            权限配置
          </TabsTrigger>
        </TabsList>

        {/* --- 组织列表标签页 --- */}
        <TabsContent value="organizations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org) => {
              const orgMemberCount = orgMembers.filter(m => m.org_id === org.id).length
              const orgDepartments = getDepartmentInfo().filter(d => d.org_id === org.id)
              
              return (
                <Card key={org.id} className={cn(
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
                          <Building2 className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                        </div>
                        <div>
                          <CardTitle className="font-serif text-lg text-stone-900 dark:text-stone-100">
                            {org.name}
                          </CardTitle>
                          <CardDescription className="font-serif text-stone-600 dark:text-stone-400">
                            {org.settings?.description || '暂无描述'}
                          </CardDescription>
                          {org.settings?.type && (
                            <Badge variant="outline" className="text-xs font-serif mt-1">
                              {org.settings.type}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(org)}
                          disabled={operationLoading}
                          className={cn(
                            "text-stone-600 border-stone-200 hover:bg-stone-50 disabled:opacity-50",
                            "dark:text-stone-400 dark:border-stone-700 dark:hover:bg-stone-800"
                          )}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteOrganization(org.id, org.name)}
                          disabled={operationLoading}
                          className={cn(
                            "text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 disabled:opacity-50",
                            "dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                          )}
                        >
                          {operationLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-stone-500" />
                          <span className="text-sm font-serif text-stone-600 dark:text-stone-400">
                            {orgMemberCount} 成员
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Layers className="w-4 h-4 text-stone-500" />
                          <span className="text-sm font-serif text-stone-600 dark:text-stone-400">
                            {orgDepartments.length} 部门
                          </span>
                        </div>
                      </div>
                      
                      {orgDepartments.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-stone-700 dark:text-stone-300 font-serif mb-2">
                            部门：
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {orgDepartments.slice(0, 3).map((dept) => (
                              <Badge key={dept.department} variant="secondary" className="text-xs font-serif">
                                {dept.department}
                              </Badge>
                            ))}
                            {orgDepartments.length > 3 && (
                              <Badge variant="outline" className="text-xs font-serif">
                                +{orgDepartments.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          
          {organizations.length === 0 && (
            <Card className={cn(
              "border-0 shadow-lg",
              isDark ? "bg-stone-800/50" : "bg-white/50"
            )}>
              <CardContent className="py-12">
                <div className="text-center">
                  <Building2 className="w-16 h-16 text-stone-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium font-serif text-stone-700 dark:text-stone-300 mb-2">
                    暂无组织
                  </h3>
                  <p className="text-stone-600 dark:text-stone-400 font-serif mb-4">
                    点击上方按钮创建第一个组织
                  </p>
                  <Button
                    onClick={() => setIsCreateOrgOpen(true)}
                    className={cn(
                      "font-serif",
                      isDark ? "bg-stone-100 hover:bg-stone-200 text-stone-900" : "bg-stone-900 hover:bg-stone-800 text-white"
                    )}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    创建第一个组织
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 部门管理 */}
        <TabsContent value="departments" className="space-y-4">
          {/* --- 部门管理头部操作区 --- */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium font-serif text-stone-900 dark:text-stone-100">
                部门管理
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 font-serif">
                管理各组织的部门结构
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {getDepartmentInfo().map((dept) => {
              const deptMembers = orgMembers.filter(
                m => m.org_id === dept.org_id && m.department === dept.department
              )
              
              return (
                <Card key={`${dept.org_id}-${dept.department}`} className={cn(
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
                          <Layers className="w-5 h-5 text-stone-600 dark:text-stone-400" />
                        </div>
                        <div>
                          <CardTitle className="font-serif text-lg text-stone-900 dark:text-stone-100">
                            {dept.org_name} - {dept.department}
                          </CardTitle>
                          <CardDescription className="font-serif text-stone-600 dark:text-stone-400">
                            {dept.member_count} 名成员
                          </CardDescription>
                        </div>
                      </div>
                      <Badge 
                        variant={dept.has_permissions ? "default" : "outline"} 
                        className="font-serif"
                      >
                        {dept.has_permissions ? '已配权限' : '未配权限'}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {deptMembers.length > 0 ? (
                      <div className="space-y-2">
                        {deptMembers.map((member) => (
                          <div 
                            key={member.id}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border",
                              isDark ? "bg-stone-800 border-stone-700" : "bg-stone-50 border-stone-200"
                            )}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center",
                                member.role === 'owner' && "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
                                member.role === 'admin' && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                                member.role === 'member' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              )}>
                                {member.role === 'owner' && <Crown className="w-4 h-4" />}
                                {member.role === 'admin' && <Shield className="w-4 h-4" />}
                                {member.role === 'member' && <UserIcon className="w-4 h-4" />}
                              </div>
                              <div>
                                <p className="font-medium font-serif text-stone-900 dark:text-stone-100">
                                  {member.user?.full_name || member.user?.username || '未知用户'}
                                </p>
                                <p className="text-sm text-stone-600 dark:text-stone-400 font-serif">
                                  {member.job_title || '暂无职位'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={
                                  member.role === 'owner' ? 'default' :
                                  member.role === 'admin' ? 'secondary' : 'outline'
                                }
                                className="font-serif text-xs"
                              >
                                {member.role === 'owner' && '所有者'}
                                {member.role === 'admin' && '管理员'}
                                {member.role === 'member' && '成员'}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveUserFromOrg(member.id, member.user?.full_name || member.user?.username || '未知用户')}
                                disabled={operationLoading}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                              >
                                {operationLoading ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <UserMinus className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Users className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                        <p className="text-stone-600 dark:text-stone-400 font-serif">
                          该部门暂无成员
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
          
          {getDepartmentInfo().length === 0 && (
            <Card className={cn(
              "border shadow-sm",
              isDark ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200"
            )}>
              <CardContent className="text-center py-12">
                <Layers className="w-16 h-16 text-stone-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium font-serif text-stone-900 dark:text-stone-100 mb-2">
                  暂无部门
                </h3>
                <p className="text-stone-600 dark:text-stone-400 font-serif mb-6">
                  添加成员到组织后会自动创建部门
                </p>
                <Button
                  onClick={() => setIsAddUserOpen(true)}
                  className={cn(
                    "font-serif",
                    isDark ? "bg-stone-100 hover:bg-stone-200 text-stone-900" : "bg-stone-900 hover:bg-stone-800 text-white"
                  )}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  添加第一个成员
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 权限配置 */}
        <TabsContent value="permissions">
          <AppPermissionsManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
} 