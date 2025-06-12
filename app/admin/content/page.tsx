"use client"

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { Eye } from 'lucide-react'
import toast from 'react-hot-toast'

// --- BEGIN COMMENT ---
// 导入所有原子化组件
// --- END COMMENT ---
import { ContentTabs } from '@components/admin/content/content-tabs'
import { AboutEditor, AboutPageConfig } from '@components/admin/content/about-editor'
import { NotificationEditor, NotificationConfig } from '@components/admin/content/notification-editor'
import { AboutPreview } from '@components/admin/content/about-preview'
import NotificationPreview from '@components/admin/content/notification-preview'
import { PreviewToolbar } from '@components/admin/content/preview-toolbar'

import { ResizableSplitPane } from '@components/ui/resizable-split-pane'
import { getAboutConfig, saveAboutConfig, defaultAboutConfig } from '@lib/config/about-config'

export default function ContentManagementPage() {
  const { isDark } = useTheme()
  const searchParams = useSearchParams()
  const router = useRouter()

  // --- BEGIN COMMENT ---
  // 页面状态管理
  // --- END COMMENT ---
  const [activeTab, setActiveTab] = useState<'about' | 'notifications'>('about')
  const [showPreview, setShowPreview] = useState(true)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showFullscreenPreview, setShowFullscreenPreview] = useState(false)

  // --- BEGIN COMMENT ---
  // About页面配置状态
  // --- END COMMENT ---
  const [aboutConfig, setAboutConfig] = useState<AboutPageConfig>(defaultAboutConfig)
  const [originalAboutConfig, setOriginalAboutConfig] = useState<AboutPageConfig>(defaultAboutConfig)
  const [isLoading, setIsLoading] = useState(true)

  // --- BEGIN COMMENT ---
  // 加载About页面配置
  // --- END COMMENT ---
  useEffect(() => {
    const loadAboutConfig = async () => {
      try {
        const config = await getAboutConfig()
        setAboutConfig(config)
        setOriginalAboutConfig(config)
      } catch (error) {
        console.error('Failed to load about config:', error)
        // 加载失败时使用默认配置
        setAboutConfig(defaultAboutConfig)
        setOriginalAboutConfig(defaultAboutConfig)
      } finally {
        setIsLoading(false)
      }
    }

    loadAboutConfig()
  }, [])

  // --- BEGIN COMMENT ---
  // 通知初始配置
  // --- END COMMENT ---
  const initialNotifications: NotificationConfig[] = [
    {
      id: '1',
      title: '欢迎使用 AgentifUI',
      content: '感谢您选择 AgentifUI！我们为您准备了丰富的功能，快来探索吧。',
      type: 'announcement',
      position: 'center',
      isActive: false,
      startDate: '2024-01-01',
      endDate: null
    },
    {
      id: '2',
      title: '系统更新通知',
      content: '我们即将在今晚进行系统维护，预计停机时间为2小时，感谢您的耐心等待。',
      type: 'maintenance',
      position: 'top-center',
      isActive: false,
      startDate: '2024-01-15',
      endDate: '2024-01-16'
    }
  ]



  // --- BEGIN COMMENT ---
  // 通知配置状态
  // --- END COMMENT ---
  const [notifications, setNotifications] = useState<NotificationConfig[]>(initialNotifications)
  const [originalNotifications, setOriginalNotifications] = useState<NotificationConfig[]>(initialNotifications)
  const [selectedNotification, setSelectedNotification] = useState<NotificationConfig | null>(initialNotifications[0] || null)

  // --- BEGIN COMMENT ---
  // URL参数同步 - 根据查询参数设置活动标签
  // --- END COMMENT ---
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'about' || tab === 'notifications') {
      setActiveTab(tab)
    }
  }, [searchParams])

  // --- BEGIN COMMENT ---
  // 变更检测 - 监听配置变化，更新hasChanges状态
  // --- END COMMENT ---
  useEffect(() => {
    const aboutChanged = JSON.stringify(aboutConfig) !== JSON.stringify(originalAboutConfig)
    const notificationsChanged = JSON.stringify(notifications) !== JSON.stringify(originalNotifications)
    setHasChanges(aboutChanged || notificationsChanged)
  }, [aboutConfig, notifications, originalAboutConfig, originalNotifications])

  // --- BEGIN COMMENT ---
  // 标签切换处理函数
  // --- END COMMENT ---
  const handleTabChange = (tab: 'about' | 'notifications') => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  // --- BEGIN COMMENT ---
  // 保存配置 (集成真正的About配置保存)
  // --- END COMMENT ---
  const handleSave = async () => {
    setIsSaving(true)
    try {
      // --- BEGIN COMMENT ---
      // 保存About页面配置
      // --- END COMMENT ---
      await saveAboutConfig(aboutConfig)
      
      // --- BEGIN COMMENT ---
      // 这里可以添加通知配置的保存逻辑
      // await saveNotificationConfig(notifications)
      // --- END COMMENT ---
      
      // --- BEGIN COMMENT ---
      // 保存成功后更新原始配置，重置hasChanges状态
      // --- END COMMENT ---
      setOriginalAboutConfig({ ...aboutConfig })
      setOriginalNotifications([...notifications])
      
      console.log('配置保存成功:', { 
        about: aboutConfig, 
        notifications: notifications 
      })
      
      // --- BEGIN COMMENT ---
      // 显示保存成功提示
      // --- END COMMENT ---
      toast.success('配置保存成功')
      
    } catch (error) {
      console.error('保存配置失败:', error)
      // --- BEGIN COMMENT ---
      // 显示保存失败提示
      // --- END COMMENT ---
      toast.error('保存配置失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  // --- BEGIN COMMENT ---
  // 重置所有更改到原始状态
  // --- END COMMENT ---
  const handleReset = () => {
    setAboutConfig({ ...originalAboutConfig })
    setNotifications([...originalNotifications])
    setSelectedNotification(originalNotifications[0] || null)
  }

  // --- BEGIN COMMENT ---
  // 处理About配置变更
  // --- END COMMENT ---
  const handleAboutConfigChange = (newConfig: AboutPageConfig) => {
    setAboutConfig(newConfig)
  }

  // --- BEGIN COMMENT ---
  // 处理通知列表变更
  // --- END COMMENT ---
  const handleNotificationsChange = (newNotifications: NotificationConfig[]) => {
    setNotifications(newNotifications)
    
    // --- BEGIN COMMENT ---
    // 如果当前选中的通知被删除，清空选择
    // --- END COMMENT ---
    if (selectedNotification && !newNotifications.find(n => n.id === selectedNotification.id)) {
      setSelectedNotification(newNotifications[0] || null)
    }
  }

  // --- BEGIN COMMENT ---
  // 处理通知选择变更
  // --- END COMMENT ---
  const handleSelectedNotificationChange = (notification: NotificationConfig | null) => {
    setSelectedNotification(notification)
  }

  // --- BEGIN COMMENT ---
  // 全屏预览处理函数
  // --- END COMMENT ---
  const handleFullscreenPreview = () => {
    setShowFullscreenPreview(true)
  }

  const handleCloseFullscreenPreview = () => {
    setShowFullscreenPreview(false)
  }

  return (
    <div className={cn(
      "min-h-screen flex flex-col",
      isDark ? "bg-stone-900" : "bg-stone-50"
    )}>
      {/* --- BEGIN COMMENT ---
      页面头部区域 - 标题和描述 (压缩高度)
      --- END COMMENT --- */}
      <div className={cn(
        "border-b",
        isDark ? "bg-stone-800 border-stone-600" : "bg-white border-stone-200"
      )}>
        <div className="w-full px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={cn(
                "text-2xl font-bold",
                isDark ? "text-stone-100" : "text-stone-900"
              )}>
                关于与通知管理
              </h1>
              <p className={cn(
                "mt-1 text-sm",
                isDark ? "text-stone-400" : "text-stone-600"
              )}>
                管理About页面内容和系统通知推送设置
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* --- BEGIN COMMENT ---
              显示预览按钮 (当预览隐藏时显示)
              --- END COMMENT --- */}
              {!showPreview && (
                <button
                  onClick={() => setShowPreview(true)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm",
                    isDark 
                      ? "bg-stone-700 hover:bg-stone-600 text-stone-300 border border-stone-600" 
                      : "bg-white hover:bg-stone-50 text-stone-600 border border-stone-200"
                  )}
                >
                  <Eye className="h-4 w-4" />
                  显示预览
                </button>
              )}
              
              <ContentTabs 
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- BEGIN COMMENT ---
      主内容区域 - 编辑器和预览面板
      --- END COMMENT --- */}
      <div className="flex-1 flex flex-col min-h-0">
        {showPreview ? (
          <ResizableSplitPane
            storageKey="content-management-split-pane"
            defaultLeftWidth={35}
            minLeftWidth={25}
            maxLeftWidth={65}
            left={
              <div className={cn(
                "h-full flex flex-col",
                isDark ? "bg-stone-800" : "bg-white"
              )}>
                <div className="flex-1 overflow-auto">
                  <div className="p-6">
                    {activeTab === 'about' ? (
                      <AboutEditor 
                        config={aboutConfig}
                        onChange={handleAboutConfigChange}
                      />
                    ) : (
                      <NotificationEditor
                        notifications={notifications}
                        selectedNotification={selectedNotification}
                        onNotificationsChange={handleNotificationsChange}
                        onSelectedChange={handleSelectedNotificationChange}
                      />
                    )}
                    
                    {/* --- BEGIN COMMENT ---
                    保存操作区域 - 集成到编辑区域底部
                    --- END COMMENT --- */}
                    <div className={cn(
                      "mt-8 pt-6 border-t",
                      isDark ? "border-stone-600" : "border-stone-200"
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {hasChanges && (
                            <div className={cn(
                              "flex items-center gap-2 text-sm",
                              isDark ? "text-stone-400" : "text-stone-600"
                            )}>
                              <div className="w-2 h-2 rounded-full bg-orange-500" />
                              <span>有未保存的更改</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleReset}
                            disabled={!hasChanges || isSaving}
                            className={cn(
                              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                              hasChanges && !isSaving
                                ? isDark 
                                  ? "text-stone-300 hover:bg-stone-700" 
                                  : "text-stone-600 hover:bg-stone-100"
                                : "text-stone-500 cursor-not-allowed"
                            )}
                          >
                            重置
                          </button>
                          
                          <button
                            onClick={handleSave}
                            disabled={!hasChanges || isSaving}
                            className={cn(
                              "px-6 py-2 rounded-lg text-sm font-medium transition-colors",
                              hasChanges && !isSaving
                                ? isDark 
                                  ? "bg-stone-100 text-stone-900 hover:bg-white" 
                                  : "bg-stone-900 text-white hover:bg-stone-800"
                                : "bg-stone-300 text-stone-500 cursor-not-allowed"
                            )}
                          >
                            {isSaving ? '保存中...' : '保存更改'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
            right={
              <div className="flex-1 flex flex-col min-w-0">
                {/* --- BEGIN COMMENT ---
                预览工具栏
                --- END COMMENT --- */}
                <PreviewToolbar
                  activeTab={activeTab}
                  previewDevice={previewDevice}
                  onDeviceChange={setPreviewDevice}
                  showPreview={showPreview}
                  onPreviewToggle={() => setShowPreview(!showPreview)}
                  onFullscreenPreview={handleFullscreenPreview}
                />
                
                {/* --- BEGIN COMMENT ---
                预览内容区域
                --- END COMMENT --- */}
                <div className="flex-1 min-h-0">
                  {activeTab === 'about' ? (
                    <AboutPreview 
                      config={aboutConfig}
                      previewDevice={previewDevice}
                    />
                  ) : (
                    <NotificationPreview 
                      notification={selectedNotification}
                    />
                  )}
                </div>
              </div>
            }
          />
        ) : (
          <div className={cn(
            "flex-1 border-r relative",
            isDark ? "bg-stone-800 border-stone-600" : "bg-white border-stone-200"
          )}>
            <div className="h-full overflow-auto">
              <div className="p-6">
                {activeTab === 'about' ? (
                  <AboutEditor 
                    config={aboutConfig}
                    onChange={handleAboutConfigChange}
                  />
                ) : (
                  <NotificationEditor
                    notifications={notifications}
                    selectedNotification={selectedNotification}
                    onNotificationsChange={handleNotificationsChange}
                    onSelectedChange={handleSelectedNotificationChange}
                  />
                )}
                
                {/* --- BEGIN COMMENT ---
                保存操作区域 - 集成到编辑区域底部
                --- END COMMENT --- */}
                <div className={cn(
                  "mt-8 pt-6 border-t",
                  isDark ? "border-stone-600" : "border-stone-200"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {hasChanges && (
                        <div className={cn(
                          "flex items-center gap-2 text-sm",
                          isDark ? "text-stone-400" : "text-stone-600"
                        )}>
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span>有未保存的更改</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleReset}
                        disabled={!hasChanges || isSaving}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                          hasChanges && !isSaving
                            ? isDark 
                              ? "text-stone-300 hover:bg-stone-700" 
                              : "text-stone-600 hover:bg-stone-100"
                            : "text-stone-500 cursor-not-allowed"
                        )}
                      >
                        重置
                      </button>
                      
                      <button
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        className={cn(
                          "px-6 py-2 rounded-lg text-sm font-medium transition-colors",
                          hasChanges && !isSaving
                            ? isDark 
                              ? "bg-stone-100 text-stone-900 hover:bg-white" 
                              : "bg-stone-900 text-white hover:bg-stone-800"
                            : "bg-stone-300 text-stone-500 cursor-not-allowed"
                        )}
                      >
                        {isSaving ? '保存中...' : '保存更改'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            

          </div>
        )}
      </div>

      {/* --- BEGIN COMMENT ---
      全屏预览模态框
      --- END COMMENT --- */}
      {showFullscreenPreview && activeTab === 'about' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
          <div className="h-full flex flex-col">
            {/* 全屏预览工具栏 */}
            <div className={cn(
              "flex items-center justify-between px-6 py-4 border-b",
              isDark ? "bg-stone-800 border-stone-600" : "bg-white border-stone-200"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  isDark ? "bg-stone-600" : "bg-stone-400"
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  isDark ? "text-stone-300" : "text-stone-700"
                )}>
                  全屏预览 - {aboutConfig.title}
                </span>
              </div>
              <button
                onClick={handleCloseFullscreenPreview}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  isDark 
                    ? "bg-stone-700 hover:bg-stone-600 text-stone-300" 
                    : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                )}
              >
                关闭预览
              </button>
            </div>
            
            {/* 全屏预览内容 */}
            <div className="flex-1 overflow-auto">
              <AboutPreview 
                config={aboutConfig}
                previewDevice="desktop"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
