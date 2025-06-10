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

  // --- 新增批量添加相关状态 ---
  const [isBatchAddOpen, setIsBatchAddOpen] = useState(false)
  const [selectedDepartmentForAdd, setSelectedDepartmentForAdd] = useState<{
    orgId: string;
    orgName: string;
    department: string;
  } | null>(null)
  const [batchAddForm, setBatchAddForm] = useState({
    selectedUsers: [] as string[],
    role: 'member' as 'owner' | 'admin' | 'member',
    jobTitle: ''
  })

  // --- 新增成员编辑相关状态 ---
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<OrgMember | null>(null)
  const [editMemberForm, setEditMemberForm] = useState({
    role: 'member' as 'owner' | 'admin' | 'member',
    jobTitle: '',
    department: ''
  })

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
      .sort(([, a], [, b]) => (b as number) - (a as number))
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

  // --- 批量添加成员处理函数 ---
  const handleBatchAddUsers = async () => {
    if (!selectedDepartmentForAdd || batchAddForm.selectedUsers.length === 0) {
      toast.error('请选择部门和用户')
      return
    }

    setOperationLoading(true)
    let successCount = 0
    let failedCount = 0

    try {
      for (const userId of batchAddForm.selectedUsers) {
        try {
          const response = await fetch('/api/admin/organizations/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              orgId: selectedDepartmentForAdd.orgId,
              department: selectedDepartmentForAdd.department,
              jobTitle: batchAddForm.jobTitle,
              role: batchAddForm.role
            }),
          })

          if (response.ok) {
            successCount++
          } else {
            failedCount++
            console.error(`添加用户 ${userId} 失败`)
          }
        } catch (error) {
          failedCount++
          console.error(`添加用户 ${userId} 异常:`, error)
        }
      }

      // 重新获取数据
      await fetchOrgMembers()
      
      // 关闭对话框并重置表单
      setIsBatchAddOpen(false)
      setSelectedDepartmentForAdd(null)
      setBatchAddForm({
        selectedUsers: [],
        role: 'member',
        jobTitle: ''
      })

      // 显示结果
      if (successCount > 0) {
        toast.success(`成功添加 ${successCount} 名成员${failedCount > 0 ? `, ${failedCount} 名失败` : ''}`)
      } else {
        toast.error('批量添加失败')
      }

    } catch (error) {
      toast.error('批量添加成员失败')
      console.error('批量添加成员失败:', error)
    } finally {
      setOperationLoading(false)
    }
  }

  // --- 打开部门批量添加对话框 ---
  const openDepartmentBatchAdd = (dept: OrgDepartmentInfo) => {
    setSelectedDepartmentForAdd({
      orgId: dept.org_id,
      orgName: dept.org_name,
      department: dept.department
    })
    setIsBatchAddOpen(true)
    initializeUserList()
  }

  // --- 批量用户选择逻辑 ---
  const toggleUserSelection = (userId: string) => {
    setBatchAddForm(prev => ({
      ...prev,
      selectedUsers: prev.selectedUsers.includes(userId)
        ? prev.selectedUsers.filter(id => id !== userId)
        : [...prev.selectedUsers, userId]
    }))
  }

  const toggleSelectAllUsers = () => {
    const availableUsers = filteredUsers.filter(user => 
      !orgMembers.some(member => 
        member.user_id === user.id && 
        member.org_id === selectedDepartmentForAdd?.orgId &&
        member.department === selectedDepartmentForAdd?.department
      )
    )
    
    const allSelected = availableUsers.every(user => 
      batchAddForm.selectedUsers.includes(user.id)
    )
    
    setBatchAddForm(prev => ({
      ...prev,
      selectedUsers: allSelected ? [] : availableUsers.map(user => user.id)
    }))
  }

  // --- 编辑成员相关函数 ---
  const openEditMember = (member: OrgMember) => {
    setEditingMember(member)
    setEditMemberForm({
      role: member.role,
      jobTitle: member.job_title || '',
      department: member.department || ''
    })
    setIsEditMemberOpen(true)
  }

  const handleEditMember = async () => {
    if (!editingMember) return

    setOperationLoading(true)
    try {
      const response = await fetch(`/api/admin/organizations/members/${editingMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: editMemberForm.role,
          jobTitle: editMemberForm.jobTitle,
          department: editMemberForm.department
        }),
      })

      if (response.ok) {
        toast.success('成员信息更新成功')
        await fetchOrgMembers()
        setIsEditMemberOpen(false)
        setEditingMember(null)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || '更新成员信息失败')
      }
    } catch (error) {
      toast.error('更新成员信息失败')
      console.error('更新成员信息失败:', error)
    } finally {
      setOperationLoading(false)
    }
  }

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
      "min-h-screen w-full",
      isDark 
        ? "bg-gradient-to-br from-stone-950 via-stone-900 to-stone-800" 
        : "bg-gradient-to-br from-stone-50 via-white to-stone-100"
    )}>
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
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
              isDark ? "bg-stone-900 border-stone-800" : "bg-stone-100 border-stone-200"
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
                      isDark ? "bg-stone-800 border-stone-700 text-stone-100" : "bg-stone-100 border-stone-300"
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
                      isDark ? "bg-stone-800 border-stone-700 text-stone-100" : "bg-stone-100 border-stone-300"
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
                      isDark ? "bg-stone-800 border-stone-700 text-stone-100" : "bg-stone-100 border-stone-300"
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
              isDark ? "bg-stone-900 border-stone-800" : "bg-stone-100 border-stone-200"
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
                      isDark ? "bg-stone-800 border-stone-700 text-stone-100" : "bg-stone-100 border-stone-300"
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
                      isDark ? "bg-stone-800 border-stone-700 text-stone-100" : "bg-stone-100 border-stone-300"
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
                      isDark ? "bg-stone-800 border-stone-700 text-stone-100" : "bg-stone-100 border-stone-300"
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
                isDark ? "border-stone-700 text-stone-300 hover:bg-stone-800" : "border-stone-300 text-stone-700 hover:bg-stone-100"
              )}>
                <UserPlus className="w-4 h-4 mr-2" />
                添加成员
              </Button>
            </DialogTrigger>
            <DialogContent className={cn(
              "max-w-md",
              isDark ? "bg-stone-900 border-stone-800" : "bg-stone-100 border-stone-200"
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
                          : "bg-stone-100 border-stone-300 text-stone-900 hover:bg-stone-100"
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
                            <UserIcon className={cn(
                              "w-4 h-4",
                              isDark ? "text-stone-400" : "text-stone-500"
                            )} />
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
                              "ml-2 p-1 rounded-full transition-colors",
                              "text-stone-400 hover:text-stone-600",
                              isDark ? "hover:bg-stone-600 hover:text-stone-300" : "hover:bg-stone-200"
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
                        isDark ? "bg-stone-800 border-stone-700" : "bg-stone-100 border-stone-200"
                      )}>
                        <div className={cn(
                          "p-2 border-b",
                          isDark ? "border-stone-700" : "border-stone-200"
                        )}>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
                            <Input
                              value={userSearchTerm}
                              onChange={(e) => handleUserSearch(e.target.value)}
                              placeholder="搜索用户姓名或用户名..."
                              className={cn(
                                "pl-10 font-serif border-0 focus:ring-0",
                                isDark ? "bg-stone-900 text-stone-100" : "bg-stone-100 text-stone-900"
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
                                    isDark ? "hover:bg-stone-700" : "hover:bg-stone-100",
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
                                      <UserIcon className={cn(
                                        "w-4 h-4",
                                        isDark ? "text-stone-400" : "text-stone-500"
                                      )} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={cn(
                                        "font-medium font-serif truncate",
                                        isDark ? "text-stone-100" : "text-stone-900"
                                      )}>
                                        {user.full_name || user.username}
                                      </p>
                                      <p className={cn(
                                        "text-sm font-serif truncate",
                                        isDark ? "text-stone-400" : "text-stone-600"
                                      )}>
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
                                  isDark ? "text-stone-400 border-stone-700 bg-stone-900/50" : "text-stone-500 border-stone-200 bg-stone-100"
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
                              <p className={cn(
                                "text-sm font-serif",
                                isDark ? "text-stone-400" : "text-stone-500"
                              )}>
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
                      isDark ? "bg-stone-800 border-stone-700 text-stone-100" : "bg-stone-100 border-stone-300"
                    )}>
                      <SelectValue placeholder="选择组织" />
                    </SelectTrigger>
                    <SelectContent className={isDark ? "bg-stone-800 border-stone-700" : "bg-stone-100 border-stone-200"}>
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
                      isDark ? "bg-stone-800 border-stone-700 text-stone-100" : "bg-stone-100 border-stone-300"
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
                      isDark ? "bg-stone-800 border-stone-700 text-stone-100" : "bg-stone-100 border-stone-300"
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
                      isDark ? "bg-stone-800 border-stone-700 text-stone-100" : "bg-stone-100 border-stone-300"
                    )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={isDark ? "bg-stone-800 border-stone-700" : "bg-stone-100 border-stone-200"}>
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

          {/* --- 批量添加成员对话框 --- */}
          <Dialog open={isBatchAddOpen} onOpenChange={(open) => {
            setIsBatchAddOpen(open)
            if (!open) {
              setSelectedDepartmentForAdd(null)
              setBatchAddForm({
                selectedUsers: [],
                role: 'member',
                jobTitle: ''
              })
            }
          }}>
            <DialogContent className={cn(
              "max-w-4xl max-h-[90vh] overflow-hidden flex flex-col",
              isDark ? "bg-stone-900 border-stone-800" : "bg-stone-50 border-stone-200"
            )}>
              <DialogHeader>
                <DialogTitle className={cn(
                  "font-serif",
                  isDark ? "text-stone-100" : "text-stone-900"
                )}>
                  批量添加成员
                </DialogTitle>
                <DialogDescription className={cn(
                  "font-serif",
                  isDark ? "text-stone-400" : "text-stone-600"
                )}>
                  {selectedDepartmentForAdd && 
                    `向 ${selectedDepartmentForAdd.orgName} - ${selectedDepartmentForAdd.department} 部门批量添加成员`
                  }
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 左侧：用户选择区域 */}
                <div className="lg:col-span-2 flex flex-col">
                  {/* 搜索和全选 */}
                  <div className="space-y-3 mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        value={userSearchTerm}
                        onChange={(e) => handleUserSearch(e.target.value)}
                        placeholder="搜索用户姓名或用户名..."
                        className={cn(
                          "pl-10 font-serif",
                          isDark ? "bg-stone-800 border-stone-700 text-stone-100" : "bg-white border-stone-300"
                        )}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className={cn(
                        "font-serif text-sm",
                        isDark ? "text-stone-300" : "text-stone-700"
                      )}>
                        选择用户 ({batchAddForm.selectedUsers.length} 已选)
                      </Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={toggleSelectAllUsers}
                        className={cn(
                          "font-serif text-xs",
                          isDark ? "border-stone-700 text-stone-300" : "border-stone-300 text-stone-700"
                        )}
                      >
                        {filteredUsers.filter(user => 
                          !orgMembers.some(member => 
                            member.user_id === user.id && 
                            member.org_id === selectedDepartmentForAdd?.orgId &&
                            member.department === selectedDepartmentForAdd?.department
                          )
                        ).every(user => batchAddForm.selectedUsers.includes(user.id)) ? '取消全选' : '全选'}
                      </Button>
                    </div>
                  </div>

                  {/* 用户列表 */}
                  <div className="flex-1 overflow-auto">
                    <div className="grid gap-2">
                      {filteredUsers.filter(user => 
                        !orgMembers.some(member => 
                          member.user_id === user.id && 
                          member.org_id === selectedDepartmentForAdd?.orgId &&
                          member.department === selectedDepartmentForAdd?.department
                        )
                      ).map((user) => (
                        <div
                          key={user.id}
                          onClick={() => toggleUserSelection(user.id)}
                          className={cn(
                            "p-3 rounded-lg border cursor-pointer transition-all",
                            batchAddForm.selectedUsers.includes(user.id)
                              ? isDark 
                                ? "bg-stone-700 border-stone-600 ring-1 ring-stone-500/50" 
                                : "bg-stone-100 border-stone-400 ring-1 ring-stone-300/50"
                              : isDark
                                ? "bg-stone-800 border-stone-700 hover:bg-stone-750"
                                : "bg-white border-stone-200 hover:bg-stone-50"
                          )}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={cn(
                              "w-6 h-6 rounded border-2 flex items-center justify-center",
                              batchAddForm.selectedUsers.includes(user.id)
                                ? isDark
                                  ? "bg-stone-600 border-stone-600"
                                  : "bg-stone-700 border-stone-700"
                                : isDark 
                                  ? "border-stone-600" 
                                  : "border-stone-300"
                            )}>
                              {batchAddForm.selectedUsers.includes(user.id) && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center",
                              user.role === 'admin' && (isDark ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"),
                              user.role === 'manager' && (isDark ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800"),
                              user.role === 'user' && (isDark ? "bg-stone-700 text-stone-300" : "bg-stone-200 text-stone-700")
                            )}>
                              <UserIcon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "font-medium font-serif text-sm truncate",
                                isDark ? "text-stone-100" : "text-stone-900"
                              )}>
                                {user.full_name || user.username}
                              </p>
                              <p className={cn(
                                "text-xs font-serif truncate",
                                isDark ? "text-stone-400" : "text-stone-600"
                              )}>
                                @{user.username} • {user.role}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 右侧：配置区域 */}
                <div className="space-y-4">
                  <div>
                    <Label className={cn(
                      "font-serif",
                      isDark ? "text-stone-300" : "text-stone-700"
                    )}>
                      职位（可选）
                    </Label>
                    <Input
                      value={batchAddForm.jobTitle}
                      onChange={(e) => setBatchAddForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                      placeholder="输入职位"
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
                      value={batchAddForm.role}
                      onValueChange={(value: 'owner' | 'admin' | 'member') =>
                        setBatchAddForm(prev => ({ ...prev, role: value }))
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

                  {/* 选中用户预览 */}
                  {batchAddForm.selectedUsers.length > 0 && (
                    <div className={cn(
                      "p-3 rounded-lg border",
                      isDark ? "bg-stone-800 border-stone-700" : "bg-stone-100 border-stone-200"
                    )}>
                      <Label className={cn(
                        "font-serif text-sm",
                        isDark ? "text-stone-300" : "text-stone-700"
                      )}>
                        将要添加的用户
                      </Label>
                      <div className="mt-2 space-y-1 max-h-32 overflow-auto">
                        {batchAddForm.selectedUsers.slice(0, 5).map(userId => {
                          const user = allUsers.find(u => u.id === userId)
                          if (!user) return null
                          return (
                            <div key={userId} className={cn(
                              "text-xs font-serif p-2 rounded",
                              isDark ? "bg-stone-900 text-stone-300" : "bg-white text-stone-700"
                            )}>
                              {user.full_name || user.username}
                            </div>
                          )
                        })}
                        {batchAddForm.selectedUsers.length > 5 && (
                          <div className={cn(
                            "text-xs font-serif text-center py-1",
                            isDark ? "text-stone-400" : "text-stone-500"
                          )}>
                            ...还有 {batchAddForm.selectedUsers.length - 5} 个用户
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsBatchAddOpen(false)}
                  className={cn(
                    "font-serif",
                    isDark ? "border-stone-700 text-stone-300" : "border-stone-300 text-stone-700"
                  )}
                >
                  取消
                </Button>
                <Button
                  onClick={handleBatchAddUsers}
                  disabled={batchAddForm.selectedUsers.length === 0 || operationLoading}
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
                    `批量添加 (${batchAddForm.selectedUsers.length})`
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* --- 编辑成员对话框 --- */}
          <Dialog open={isEditMemberOpen} onOpenChange={(open) => {
            setIsEditMemberOpen(open)
            if (!open) {
              setEditingMember(null)
              setEditMemberForm({
                role: 'member',
                jobTitle: '',
                department: ''
              })
            }
          }}>
            <DialogContent className={cn(
              "max-w-md",
              isDark ? "bg-stone-900 border-stone-800" : "bg-stone-50 border-stone-200"
            )}>
              <DialogHeader>
                <DialogTitle className={cn(
                  "font-serif",
                  isDark ? "text-stone-100" : "text-stone-900"
                )}>
                  编辑成员信息
                </DialogTitle>
                <DialogDescription className={cn(
                  "font-serif",
                  isDark ? "text-stone-400" : "text-stone-600"
                )}>
                  修改 {editingMember?.user?.full_name || editingMember?.user?.username || '成员'} 的信息
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label className={cn(
                    "font-serif",
                    isDark ? "text-stone-300" : "text-stone-700"
                  )}>
                    部门
                  </Label>
                  <Input
                    value={editMemberForm.department}
                    onChange={(e) => setEditMemberForm(prev => ({ ...prev, department: e.target.value }))}
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
                    value={editMemberForm.jobTitle}
                    onChange={(e) => setEditMemberForm(prev => ({ ...prev, jobTitle: e.target.value }))}
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
                    value={editMemberForm.role}
                    onValueChange={(value: 'owner' | 'admin' | 'member') =>
                      setEditMemberForm(prev => ({ ...prev, role: value }))
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

                {/* 当前信息显示 */}
                <div className={cn(
                  "p-3 rounded-lg border bg-stone-50",
                  isDark ? "bg-stone-800 border-stone-700" : "bg-stone-100 border-stone-200"
                )}>
                  <Label className={cn(
                    "font-serif text-xs",
                    isDark ? "text-stone-400" : "text-stone-600"
                  )}>
                    当前信息
                  </Label>
                  <div className="mt-1 space-y-1 text-xs">
                    <div className={cn(
                      "font-serif",
                      isDark ? "text-stone-300" : "text-stone-700"
                    )}>
                      部门: {editingMember?.department || '未设置'}
                    </div>
                    <div className={cn(
                      "font-serif",
                      isDark ? "text-stone-300" : "text-stone-700"
                    )}>
                      职位: {editingMember?.job_title || '未设置'}
                    </div>
                    <div className={cn(
                      "font-serif",
                      isDark ? "text-stone-300" : "text-stone-700"
                    )}>
                      角色: {editingMember?.role === 'owner' ? '所有者' : editingMember?.role === 'admin' ? '管理员' : '成员'}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditMemberOpen(false)}
                  className={cn(
                    "font-serif",
                    isDark ? "border-stone-700 text-stone-300" : "border-stone-300 text-stone-700"
                  )}
                >
                  取消
                </Button>
                <Button
                  onClick={handleEditMember}
                  disabled={operationLoading}
                  className={cn(
                    "font-serif",
                    isDark ? "bg-stone-100 hover:bg-stone-200 text-stone-900" : "bg-stone-900 hover:bg-stone-800 text-white"
                  )}
                >
                  {operationLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      更新中...
                    </>
                  ) : (
                    '保存修改'
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
                : "data-[state=active]:bg-stone-100 data-[state=active]:text-stone-900"
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
                : "data-[state=active]:bg-stone-100 data-[state=active]:text-stone-900"
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
                : "data-[state=active]:bg-stone-100 data-[state=active]:text-stone-900"
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
                  isDark ? "bg-stone-900 border-stone-800" : "bg-stone-100 border-stone-200"
                )}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          isDark ? "bg-stone-800" : "bg-stone-100"
                        )}>
                          <Building2 className={cn(
                            "w-5 h-5",
                            isDark ? "text-stone-400" : "text-stone-600"
                          )} />
                        </div>
                        <div>
                          <CardTitle className={cn(
                            "font-serif text-lg",
                            isDark ? "text-stone-100" : "text-stone-900"
                          )}>
                            {org.name}
                          </CardTitle>
                          <CardDescription className={cn(
                            "font-serif",
                            isDark ? "text-stone-400" : "text-stone-600"
                          )}>
                            {org.settings?.description || '暂无描述'}
                          </CardDescription>
                          {org.settings?.type && (
                            <Badge variant="outline" className={cn(
                              "text-xs font-serif mt-1",
                              isDark ? "text-stone-400 border-stone-600" : "text-stone-600 border-stone-300"
                            )}>
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
                            "disabled:opacity-50",
                            isDark ? "text-stone-400 border-stone-700 hover:bg-stone-800" : "text-stone-600 border-stone-300 hover:bg-stone-100"
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
                            "disabled:opacity-50",
                            isDark ? "text-red-400 border-red-800 hover:bg-red-900/20" : "text-red-600 border-red-300 hover:bg-red-100 hover:border-red-400"
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
                          <Users className={cn(
                            "w-4 h-4",
                            isDark ? "text-stone-400" : "text-stone-500"
                          )} />
                          <span className={cn(
                            "text-sm font-serif",
                            isDark ? "text-stone-400" : "text-stone-600"
                          )}>
                            {orgMemberCount} 成员
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Layers className={cn(
                            "w-4 h-4", 
                            isDark ? "text-stone-400" : "text-stone-500"
                          )} />
                          <span className={cn(
                            "text-sm font-serif",
                            isDark ? "text-stone-400" : "text-stone-600"
                          )}>
                            {orgDepartments.length} 部门
                          </span>
                        </div>
                      </div>

                      {orgDepartments.length > 0 && (
                        <div>
                          <p className={cn(
                            "text-xs font-medium font-serif mb-2",
                            isDark ? "text-stone-300" : "text-stone-700"
                          )}>
                            部门：
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {orgDepartments.slice(0, 3).map((dept) => (
                              <Badge 
                                key={dept.department} 
                                variant="outline" 
                                className={cn(
                                  "text-xs font-serif",
                                  isDark ? "border-stone-600 text-stone-300" : "border-stone-300 text-stone-700"
                                )}
                              >
                                {dept.department}
                              </Badge>
                            ))}
                            {orgDepartments.length > 3 && (
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs font-serif",
                                  isDark ? "border-stone-600 text-stone-400" : "border-stone-300 text-stone-500"
                                )}
                              >
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
              isDark ? "bg-stone-800/50" : "bg-stone-100/50"
            )}>
              <CardContent className="py-12">
                <div className="text-center">
                  <Building2 className="w-16 h-16 text-stone-400 mx-auto mb-4" />
                  <h3 className={cn(
                    "text-lg font-medium font-serif",
                    isDark ? "text-stone-300" : "text-stone-700"
                  )}>
                    暂无组织
                  </h3>
                  <p className={cn(
                    "text-stone-600 font-serif mb-4",
                    isDark ? "text-stone-400" : "text-stone-600"
                  )}>
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
          <div className="mb-6">
            <h3 className={cn(
              "text-lg font-medium font-serif",
              isDark ? "text-stone-100" : "text-stone-900"
            )}>
              部门管理
            </h3>
            <p className={cn(
              "text-sm font-serif",
              isDark ? "text-stone-400" : "text-stone-600"
            )}>
              管理各组织的部门结构，每个部门卡片内可直接添加成员
            </p>
          </div>

          <div className="space-y-4">
            {getDepartmentInfo().map((dept) => {
              const deptMembers = orgMembers.filter(
                m => m.org_id === dept.org_id && m.department === dept.department
              )

              return (
                <Card key={`${dept.org_id}-${dept.department}`} className={cn(
                  "border shadow-sm transition-all duration-200 hover:shadow-md",
                  isDark ? "bg-stone-900 border-stone-800 hover:border-stone-700" : "bg-stone-50 border-stone-200 hover:border-stone-300"
                )}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                          isDark ? "bg-stone-800" : "bg-stone-200"
                        )}>
                          <Layers className={cn(
                            "w-4 h-4", 
                            isDark ? "text-stone-400" : "text-stone-600"
                          )} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className={cn(
                            "font-serif text-base sm:text-lg truncate",
                            isDark ? "text-stone-100" : "text-stone-900"
                          )}>
                            {dept.org_name} - {dept.department}
                          </CardTitle>
                          <CardDescription className={cn(
                            "font-serif text-sm",
                            isDark ? "text-stone-400" : "text-stone-600"
                          )}>
                            {dept.member_count} 名成员
                          </CardDescription>
                        </div>
                      </div>
                      
                      {/* --- 添加成员按钮 --- */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDepartmentBatchAdd(dept)}
                        className={cn(
                          "font-serif flex-shrink-0 ml-2",
                          isDark 
                            ? "border-stone-700 hover:bg-stone-800 text-stone-300 hover:text-stone-100" 
                            : "border-stone-300 hover:bg-stone-100 text-stone-700 hover:text-stone-900"
                        )}
                      >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">添加成员</span>
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {deptMembers.length > 0 ? (
                      <div className="grid gap-3 sm:gap-2">
                        {deptMembers.map((member) => (
                          <div
                            key={member.id}
                            className={cn(
                              "flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between p-3 rounded-lg border transition-colors",
                              isDark ? "bg-stone-800 border-stone-700 hover:bg-stone-750" : "bg-white border-stone-200 hover:bg-stone-50"
                            )}
                          >
                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                member.role === 'owner' && (isDark ? "bg-amber-900 text-amber-200" : "bg-amber-100 text-amber-800"),
                                member.role === 'admin' && (isDark ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"),
                                member.role === 'member' && (isDark ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800")
                              )}>
                                {member.role === 'owner' && <Crown className="w-4 h-4" />}
                                {member.role === 'admin' && <Shield className="w-4 h-4" />}
                                {member.role === 'member' && <UserIcon className="w-4 h-4" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={cn(
                                  "font-medium font-serif text-sm sm:text-base truncate",
                                  isDark ? "text-stone-100" : "text-stone-900"
                                )}>
                                  {member.user?.full_name || member.user?.username || '未知用户'}
                                </p>
                                <p className={cn(
                                  "text-xs sm:text-sm font-serif truncate",
                                  isDark ? "text-stone-400" : "text-stone-600"
                                )}>
                                  {member.job_title || '暂无职位'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
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
                                onClick={() => openEditMember(member)}
                                disabled={operationLoading}
                                className={cn(
                                  "font-serif",
                                  isDark 
                                    ? "border-stone-700 hover:bg-stone-800 text-stone-300 hover:text-stone-100" 
                                    : "border-stone-300 hover:bg-stone-100 text-stone-700 hover:text-stone-900"
                                )}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveUserFromOrg(member.id, member.user?.full_name || member.user?.username || '未知用户')}
                                disabled={operationLoading}
                                className={cn(
                                  "text-red-500 hover:text-red-700 disabled:opacity-50 border-red-200",
                                  isDark ? "hover:bg-red-900/20 border-red-800" : "hover:bg-red-50"
                                )}
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
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                        <p className={cn(
                          "font-serif text-sm",
                          isDark ? "text-stone-400" : "text-stone-600"
                        )}>
                          该部门暂无成员
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDepartmentBatchAdd(dept)}
                          className={cn(
                            "mt-3 font-serif",
                            isDark 
                              ? "border-stone-700 hover:bg-stone-800 text-stone-300" 
                              : "border-stone-300 hover:bg-stone-100 text-stone-700"
                          )}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          添加成员
                        </Button>
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
              isDark ? "bg-stone-900 border-stone-800" : "bg-stone-100 border-stone-200"
            )}>
              <CardContent className="text-center py-12">
                <Layers className="w-16 h-16 text-stone-400 mx-auto mb-4" />
                <h3 className={cn(
                  "text-lg font-medium font-serif mb-2",
                  isDark ? "text-stone-100" : "text-stone-900"
                )}>
                  暂无部门
                </h3>
                <p className={cn(
                  "font-serif mb-6",
                  isDark ? "text-stone-400" : "text-stone-600"
                )}>
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
    </div>
  )
} 