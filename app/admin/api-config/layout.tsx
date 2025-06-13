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
  Key
} from 'lucide-react'
import { InstanceFilterSelector } from '@components/admin/api-config/instance-filter-selector'

interface ApiConfigLayoutProps {
  children: ReactNode
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

    if (!confirm(`确定要将"${instanceToSet.display_name || instanceToSet.instance_id}"设置为默认应用吗？`)) {
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
            <div className="p-2">
              {filteredInstances.map((instance) => (
                <div
                  key={instance.instance_id}
                  className={cn(
                    "p-2.5 rounded-lg mb-2 cursor-pointer group",
                    "transition-colors duration-150 ease-in-out",
                    "focus:outline-none focus:ring-2",
                    selectedInstanceId === instance.instance_id
                    ? isDark
                      ? "bg-stone-600 border border-stone-500 focus:ring-stone-500"
                      : "bg-stone-300 border border-stone-400"
                    : isDark
                      ? "hover:bg-stone-700 focus:ring-stone-600"
                      : "hover:bg-stone-200 focus:ring-stone-300"
                  
                  )}
                  onClick={() => {
                    // --- BEGIN COMMENT ---
                    // 只发送事件给page组件，不在layout中设置状态
                    // --- END COMMENT ---
                    window.dispatchEvent(new CustomEvent('selectInstance', {
                      detail: instance
                    }))
                  }}
                  tabIndex={0}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className={cn(
                          "h-3.5 w-3.5 flex-shrink-0",
                          isDark ? "text-stone-400" : "text-stone-500"
                        )} />
                        <h3 className={cn(
                          "font-medium text-sm truncate font-serif",
                          isDark ? "text-stone-200" : "text-stone-800"
                        )}>
                          {instance.display_name}
                        </h3>
                        
                        {/* --- 默认应用标签 --- */}
                        {instance.is_default && (
                          <span className={cn(
                            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium font-serif",
                            isDark
                              ? "bg-stone-600/30 text-stone-300 border border-stone-600"
                              : "bg-stone-700/10 text-stone-700 border border-stone-700/20"
                          )}>
                            <Star className="h-2.5 w-2.5" />
                            默认
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        "text-xs truncate font-serif",
                        isDark ? "text-stone-400" : "text-stone-600"
                      )}>
                        {instance.description || instance.instance_id}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* --- 设置默认应用按钮 --- */}
                      {!instance.is_default && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSetDefaultInstance(instance.id)
                          }}
                          disabled={isProcessing}
                          className={cn(
                            "p-1 rounded transition-colors cursor-pointer",
                            "focus:outline-none focus:ring-2 focus:ring-stone-500",
                            isDark 
                              ? "hover:bg-stone-700 text-stone-400 hover:text-stone-200" 
                              : "hover:bg-stone-200 text-stone-600 hover:text-stone-900",
                            isProcessing && "opacity-50 cursor-not-allowed"
                          )}
                          title="设为默认应用"
                        >
                          <StarOff className="h-3 w-3" />
                        </button>
                      )}
                      
                      {/* --- 删除按钮 --- */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteInstance(instance.instance_id)
                        }}
                        disabled={isProcessing || instance.is_default}
                        className={cn(
                          "p-1 rounded transition-colors",
                          "focus:outline-none focus:ring-2 focus:ring-red-500",
                          instance.is_default
                            ? "opacity-50 cursor-not-allowed text-stone-400"
                            : cn(
                                "cursor-pointer",
                                isDark 
                                  ? "hover:bg-red-900/30 text-red-400 hover:text-red-300" 
                                  : "hover:bg-red-100 text-red-600 hover:text-red-700"
                              ),
                          (isProcessing && !instance.is_default) && "opacity-50 cursor-not-allowed"
                        )}
                        title={instance.is_default ? "默认应用不可删除" : "删除"}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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