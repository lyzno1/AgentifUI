"use client"

import React, { ReactNode, useEffect, useState, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useApiConfigStore, ServiceInstance } from '@lib/stores/api-config-store'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { 
  Plus,
  Database,
  Globe,
  Trash2,
  Loader2,
  Star,
  StarOff,
  Key,
  Bot,
  MessageSquare,
  Workflow,
  Zap,
  FileText,
  Settings
} from 'lucide-react'
import { InstanceFilterSelector } from '@components/admin/api-config/instance-filter-selector'

interface ApiConfigLayoutProps {
  children: ReactNode
}

// --- BEGIN COMMENT ---
// 根据Dify应用类型获取对应图标
// --- END COMMENT ---
const getAppTypeIcon = (difyAppType?: string) => {
  switch (difyAppType) {
    case 'chatbot':
      return MessageSquare
    case 'agent':
      return Bot
    case 'chatflow':
      return Workflow
    case 'workflow':
      return Settings
    case 'text-generation':
      return FileText
    default:
      return Globe
  }
}

// --- BEGIN COMMENT ---
// 根据Dify应用类型获取类型标签和颜色
// --- END COMMENT ---
const getAppTypeInfo = (difyAppType?: string) => {
  switch (difyAppType) {
    case 'chatbot':
      return { label: '聊天助手', color: 'emerald' }
    case 'agent':
      return { label: '智能代理', color: 'violet' }
    case 'chatflow':
      return { label: '对话流', color: 'amber' }
    case 'workflow':
      return { label: '工作流', color: 'rose' }
    case 'text-generation':
      return { label: '文本生成', color: 'cyan' }
    default:
      return { label: '应用', color: 'stone' }
  }
}

export default function ApiConfigLayout({ children }: ApiConfigLayoutProps) {
  const { isDark } = useTheme()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  const {
    serviceInstances: instances,
    apiKeys,
    providers,
    isLoading: instancesLoading,
    loadConfigData: loadInstances,
    deleteAppInstance: deleteInstance,
    setDefaultInstance
  } = useApiConfigStore()
  
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null)
  
  // --- BEGIN COMMENT ---
  // 从URL查询参数获取筛选状态
  // --- END COMMENT ---
  const [filterProviderId, setFilterProviderId] = useState<string | null>(() => {
    return searchParams.get('provider') || null
  })

  // --- BEGIN COMMENT ---
  // 初始化数据加载
  // --- END COMMENT ---
  useEffect(() => {
    if (!hasInitiallyLoaded) {
      loadInstances().finally(() => {
        setHasInitiallyLoaded(true)
      })
    }
  }, [hasInitiallyLoaded, loadInstances])

  // --- BEGIN COMMENT ---
  // 处理筛选变化并同步URL
  // --- END COMMENT ---
  const handleFilterChange = (providerId: string | null) => {
    // 如果值没有变化，直接返回
    if (providerId === filterProviderId) return;
    
    setFilterProviderId(providerId)
    
    // 立即更新URL查询参数，不使用startTransition避免延迟
    const params = new URLSearchParams(searchParams.toString())
    if (providerId) {
      params.set('provider', providerId)
    } else {
      params.delete('provider')
    }
    
    const newUrl = `${pathname}?${params.toString()}`
    router.replace(newUrl, { scroll: false })
    
    // --- BEGIN COMMENT ---
    // 通知page组件筛选状态变化，用于新建应用时自动设置提供商
    // --- END COMMENT ---
    window.dispatchEvent(new CustomEvent('filterChanged', {
      detail: { providerId }
    }))
  }

  // --- BEGIN COMMENT ---
  // 监听URL变化同步筛选状态（优化避免循环）
  // --- END COMMENT ---
  useEffect(() => {
    const urlProviderId = searchParams.get('provider')
    // 只在真正不同时才更新，避免循环
    if (urlProviderId !== filterProviderId) {
      setFilterProviderId(urlProviderId)
      // 同步通知page组件
      window.dispatchEvent(new CustomEvent('filterChanged', {
        detail: { providerId: urlProviderId }
      }))
    }
  }, [searchParams]) // 移除filterProviderId依赖，避免循环

  // --- BEGIN COMMENT ---
  // 🎯 根据筛选条件过滤应用实例
  // --- END COMMENT ---
  const filteredInstances = useMemo(() => {
    if (!filterProviderId) {
      return instances; // 显示全部
    }
    return instances.filter(instance => instance.provider_id === filterProviderId);
  }, [instances, filterProviderId]);

  // --- BEGIN COMMENT ---
  // 监听page组件的状态变化，完全同步page的表单状态
  // --- END COMMENT ---
  useEffect(() => {
    const handleAddFormToggled = (event: CustomEvent) => {
      const { showAddForm: newShowAddForm, selectedInstance } = event.detail
      setShowAddForm(newShowAddForm)
      // --- BEGIN COMMENT ---
      // 当显示添加表单时，清除所有选中状态
      // 当显示编辑表单时，设置对应的选中状态
      // --- END COMMENT ---
      if (newShowAddForm) {
        setSelectedInstanceId(null)
      } else if (selectedInstance) {
        setSelectedInstanceId(selectedInstance.instance_id)
      } else {
        setSelectedInstanceId(null)
      }
    }

    const handleSetInstanceAsDefault = (event: CustomEvent) => {
      const { instanceId } = event.detail
      handleSetDefaultInstance(instanceId)
    }

    const handleDirectSetDefault = (event: CustomEvent) => {
      const { instanceId } = event.detail
      // --- 统一逻辑：直接调用相同的函数 ---
      handleSetDefaultInstance(instanceId)
    }

    const handleReloadInstances = () => {
      // 重新加载服务实例数据
      loadInstances()
    }

    const handleReloadProviders = () => {
      // 重新加载providers数据
      loadInstances() // 这会同时加载providers和instances
    }

    window.addEventListener('addFormToggled', handleAddFormToggled as EventListener)
    window.addEventListener('setInstanceAsDefault', handleSetInstanceAsDefault as EventListener)
    window.addEventListener('directSetDefault', handleDirectSetDefault as EventListener)
    window.addEventListener('reloadInstances', handleReloadInstances)
    window.addEventListener('reloadProviders', handleReloadProviders)
    
    return () => {
      window.removeEventListener('addFormToggled', handleAddFormToggled as EventListener)
      window.removeEventListener('setInstanceAsDefault', handleSetInstanceAsDefault as EventListener)
      window.removeEventListener('directSetDefault', handleDirectSetDefault as EventListener)
      window.removeEventListener('reloadInstances', handleReloadInstances)
      window.removeEventListener('reloadProviders', handleReloadProviders)
    }
  }, [])

  const handleDeleteInstance = async (instanceId: string) => {
    const instanceToDelete = instances.find(inst => inst.instance_id === instanceId)
    if (!instanceToDelete) {
      alert('未找到要删除的实例')
      return
    }
    
    // --- 检查是否为默认应用 ---
    if (instanceToDelete.is_default) {
      alert('默认应用不可删除，请先设置其他应用为默认应用')
      return
    }
    
    if (!confirm('确定要删除此应用实例吗？此操作不可撤销。')) {
      return
    }

    setIsProcessing(true)
    try {
      await deleteInstance(instanceToDelete.id)
      
      // --- BEGIN COMMENT ---
      // 通知page组件实例被删除
      // --- END COMMENT ---
      window.dispatchEvent(new CustomEvent('instanceDeleted', {
        detail: { instanceId }
      }))
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除应用实例失败')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSetDefaultInstance = async (instanceId: string) => {
    // --- 添加调试信息 ---
    console.log('设置默认应用 - 传入ID:', instanceId)
    console.log('当前所有实例:', instances.map(inst => ({ id: inst.id, instance_id: inst.instance_id, display_name: inst.display_name })))
    
    // --- 修复：使用数据库ID查找实例 ---
    const instanceToSet = instances.find(inst => inst.id === instanceId)
    if (!instanceToSet) {
      console.error('未找到实例，传入ID:', instanceId)
      alert('未找到要设置的实例')
      return
    }

    console.log('找到实例:', instanceToSet)

    if (instanceToSet.is_default) {
      return // 已经是默认应用，无需操作
    }

    if (!confirm(`确定要将"${instanceToSet.display_name || '此应用'}"设置为默认应用吗？`)) {
      return
    }

    setIsProcessing(true)
    try {
      await setDefaultInstance(instanceToSet.id)
      
      // --- BEGIN COMMENT ---
      // 通知page组件默认应用已更改
      // --- END COMMENT ---
      window.dispatchEvent(new CustomEvent('defaultInstanceChanged', {
        detail: { instanceId }
      }))
    } catch (error) {
      console.error('设置默认应用失败:', error)
      alert('设置默认应用失败')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* --- BEGIN COMMENT ---
      左侧导航：固定宽度，从admin导航栏下方开始
      --- END COMMENT --- */}
      <div className={cn(
        "w-80 flex-shrink-0 flex flex-col fixed left-16 z-40",
        "top-12 bottom-0"
      )}>
        {/* 头部：不需要额外的顶部间距，因为已经从正确位置开始 */}
        <div className={cn(
          "p-2 border-b flex-shrink-0",
          isDark ? "border-stone-700 bg-stone-800" : "border-stone-200 bg-stone-100"
        )}>
          <div className="flex items-center justify-between mb-2">
            {/* --- BEGIN COMMENT ---
            使用新的筛选选择器替换原有的标题
            --- END COMMENT --- */}
            <InstanceFilterSelector
              providers={providers}
              selectedProviderId={filterProviderId}
              onFilterChange={handleFilterChange}
              instanceCount={filteredInstances.length}
              isLoading={!hasInitiallyLoaded && instancesLoading}
            />
            
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('toggleAddForm'))
              }}
              className={cn(
                "p-1.5 rounded-lg transition-all duration-200 cursor-pointer",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                showAddForm
                  ? isDark
                    ? "bg-stone-500 text-stone-100 focus:ring-stone-400"
                    : "bg-stone-400 text-white focus:ring-stone-300"
                  : isDark 
                    ? "bg-stone-600 hover:bg-stone-500 text-stone-200 hover:text-stone-100 focus:ring-stone-500" 
                    : "bg-stone-200 hover:bg-stone-300 text-stone-700 hover:text-stone-900 focus:ring-stone-400"
              )}
            >
              <Plus className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                showAddForm && "rotate-45"
              )} />
            </button>
          </div>
        </div>
        
        {/* 列表：独立滚动区域 */}
        <div className={cn(
          "flex-1 overflow-y-auto min-h-0",
          isDark ? "bg-stone-800" : "bg-stone-100"
        )}>
          {!hasInitiallyLoaded && instancesLoading ? (
            <div className="p-4 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-stone-400" />
              <p className={cn(
                "text-sm font-serif",
                isDark ? "text-stone-400" : "text-stone-600"
              )}>
                加载应用实例中...
              </p>
            </div>
          ) : filteredInstances.length === 0 ? (
            <div className="p-4 text-center">
              <Database className="h-12 w-12 mx-auto mb-3 text-stone-400" />
              <p className={cn(
                "text-sm font-serif",
                isDark ? "text-stone-400" : "text-stone-600"
              )}>
                {filterProviderId ? '该提供商暂无应用实例' : '暂无应用实例'}
              </p>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('toggleAddForm'))
                }}
                className={cn(
                  "mt-2 text-sm transition-colors font-serif cursor-pointer",
                  isDark ? "text-stone-300 hover:text-stone-100" : "text-stone-600 hover:text-stone-800"
                )}
              >
                添加第一个应用
              </button>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {filteredInstances.map((instance) => {
                const difyAppType = instance.config?.app_metadata?.dify_apptype
                const AppIcon = getAppTypeIcon(difyAppType)
                const typeInfo = getAppTypeInfo(difyAppType)
                const provider = providers.find(p => p.id === instance.provider_id)
                
                return (
                  <div
                    key={instance.instance_id}
                    className={cn(
                      "relative p-3 rounded-xl cursor-pointer group",
                      "transition-all duration-200 ease-in-out",
                      "focus:outline-none focus:ring-2 focus:ring-offset-2",
                      "border backdrop-blur-sm",
                      // 固定高度保持一致性
                      "h-20 flex flex-col justify-between",
                      selectedInstanceId === instance.instance_id
                        ? isDark
                          ? "bg-stone-700/80 border-stone-400 shadow-xl focus:ring-stone-400"
                          : "bg-white border-stone-400 shadow-lg focus:ring-stone-300"
                        : isDark
                          ? "bg-stone-800/70 border-stone-600/70 hover:bg-stone-700/80 hover:border-stone-500 hover:shadow-lg focus:ring-stone-500"
                          : "bg-white/90 border-stone-300/80 hover:bg-white hover:border-stone-400 hover:shadow-md focus:ring-stone-300"
                    )}
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('selectInstance', {
                        detail: instance
                      }))
                    }}
                    tabIndex={0}
                  >
                    {/* 主要内容区域 */}
                    <div className="flex items-start justify-between h-full">
                      <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                        {/* 顶部：应用名称和图标 */}
                        <div className="flex items-center gap-2">
                          <AppIcon className={cn(
                            "h-4 w-4 flex-shrink-0",
                            isDark ? "text-stone-300" : "text-stone-600"
                          )} />
                          <h3 className={cn(
                            "font-medium text-sm truncate font-serif",
                            isDark ? "text-stone-100" : "text-stone-900"
                          )}>
                            {instance.display_name}
                          </h3>
                          
                          {/* 默认应用标签 */}
                          {instance.is_default && (
                            <span className={cn(
                              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium font-serif",
                              isDark
                                ? "bg-amber-900/30 text-amber-300 border border-amber-800/40"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            )}>
                              <Star className="h-2.5 w-2.5" />
                              默认
                            </span>
                          )}
                        </div>
                        
                        {/* 底部：类型和提供商信息（低调显示） */}
                        <div className="flex items-center gap-2 text-xs">
                          {/* 应用类型原始值 */}
                          {difyAppType && (
                            <span className={cn(
                              "font-serif",
                              isDark ? "text-stone-500" : "text-stone-500"
                            )}>
                              {difyAppType}
                            </span>
                          )}
                          
                          {/* 分隔符 */}
                          {difyAppType && provider && (
                            <span className={cn(
                              "text-stone-500"
                            )}>
                              ·
                            </span>
                          )}
                          
                          {/* 提供商信息 */}
                          {provider && (
                            <span className={cn(
                              "font-serif",
                              isDark ? "text-stone-500" : "text-stone-500"
                            )}>
                              {provider.name}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* 右侧操作按钮 */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        {/* 设置默认应用按钮 */}
                        {!instance.is_default && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSetDefaultInstance(instance.id)
                            }}
                            disabled={isProcessing}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors cursor-pointer",
                              "focus:outline-none focus:ring-2 focus:ring-offset-1",
                              isDark 
                                ? "hover:bg-stone-600 text-stone-400 hover:text-amber-300 focus:ring-amber-500" 
                                : "hover:bg-amber-100 text-stone-500 hover:text-amber-700 focus:ring-amber-300",
                              isProcessing && "opacity-50 cursor-not-allowed"
                            )}
                            title="设为默认应用"
                          >
                            <StarOff className="h-3.5 w-3.5" />
                          </button>
                        )}
                        
                        {/* 删除按钮 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteInstance(instance.instance_id)
                          }}
                          disabled={isProcessing || instance.is_default}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            "focus:outline-none focus:ring-2 focus:ring-offset-1",
                            instance.is_default
                              ? "opacity-30 cursor-not-allowed text-stone-400"
                              : cn(
                                  "cursor-pointer",
                                  isDark 
                                    ? "hover:bg-red-900/40 text-stone-400 hover:text-red-300 focus:ring-red-500" 
                                    : "hover:bg-red-100 text-stone-500 hover:text-red-700 focus:ring-red-300"
                                ),
                            (isProcessing && !instance.is_default) && "opacity-50 cursor-not-allowed"
                          )}
                          title={instance.is_default ? "默认应用不可删除" : "删除"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* --- BEGIN COMMENT ---
      分割线：从admin导航栏下方开始的全高度垂直分割线
      --- END COMMENT --- */}
      <div className={cn(
        "fixed left-96 z-40 w-px",
        "top-12 bottom-0",
        isDark ? "bg-stone-700" : "bg-stone-200"
      )}></div>
      
      {/* --- BEGIN COMMENT ---
      右侧内容区域：调整左边距以适应固定侧边栏
      --- END COMMENT --- */}
      <div className="flex-1 h-full overflow-hidden ml-80 pl-px">
        {children}
      </div>
    </div>
  )
} 