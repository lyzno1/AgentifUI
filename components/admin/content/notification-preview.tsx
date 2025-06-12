"use client"

import React from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { NotificationConfig } from './notification-editor'
import { Bell, AlertTriangle, Info, Wrench, X } from 'lucide-react'

interface NotificationPreviewProps {
  notification: NotificationConfig
}

const NotificationPreview: React.FC<NotificationPreviewProps> = ({ 
  notification 
}) => {
  const { isDark } = useTheme()

  // --- BEGIN COMMENT ---
  // 获取通知类型图标和颜色 (统一stone配色)
  // --- END COMMENT ---
  const getTypeStyles = () => {
    switch (notification.type) {
      case 'update':
        return {
          icon: <Bell className="h-5 w-5" />,
          color: isDark ? "text-stone-300" : "text-stone-700",
          bg: isDark ? "bg-stone-700/50" : "bg-stone-200/50",
          border: isDark ? "border-stone-600/50" : "border-stone-300/50"
        }
      case 'feature':
        return {
          icon: <Info className="h-5 w-5" />,
          color: isDark ? "text-stone-300" : "text-stone-700",
          bg: isDark ? "bg-stone-700/50" : "bg-stone-200/50",
          border: isDark ? "border-stone-600/50" : "border-stone-300/50"
        }
      case 'maintenance':
        return {
          icon: <Wrench className="h-5 w-5" />,
          color: isDark ? "text-stone-300" : "text-stone-700",
          bg: isDark ? "bg-stone-700/50" : "bg-stone-200/50",
          border: isDark ? "border-stone-600/50" : "border-stone-300/50"
        }
      case 'announcement':
      default:
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          color: isDark ? "text-stone-300" : "text-stone-700",
          bg: isDark ? "bg-stone-700/50" : "bg-stone-200/50",
          border: isDark ? "border-stone-600/50" : "border-stone-300/50"
        }
    }
  }

  const typeStyles = getTypeStyles()

  // --- BEGIN COMMENT ---
  // 渲染对应位置的通知
  // --- END COMMENT ---
  const renderNotification = () => {
    if (!notification.isActive) return null

    switch (notification.position) {
      case 'top-center':
        return renderTopNotification()
      case 'bottom-right':
        return renderBottomRightNotification()
      case 'center':
      default:
        return renderCenterNotification()
    }
  }

  // --- BEGIN COMMENT ---
  // 中央模态框通知 - 预览版本
  // --- END COMMENT ---
  const renderCenterNotification = () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div 
        className={cn(
          "relative rounded-lg border p-6 shadow-lg max-w-md w-full mx-4",
          isDark ? "bg-stone-800 border-stone-600" : "bg-white border-stone-200"
        )}
      >
        {/* --- BEGIN COMMENT ---
        通知标题和图标
        --- END COMMENT --- */}
        <div className="flex items-start gap-3 mb-3">
          <div className={cn("flex-shrink-0 p-2 rounded-lg", typeStyles.bg)}>
            <div className={typeStyles.color}>
              {typeStyles.icon}
            </div>
          </div>
          <div className="flex-1">
            <h3 className={cn(
              "text-lg font-semibold",
              isDark ? "text-stone-100" : "text-stone-900"
            )}>
              {notification.title}
            </h3>
          </div>
        </div>

        {/* --- BEGIN COMMENT ---
        通知内容
        --- END COMMENT --- */}
        <p className={cn(
          "text-sm mb-4",
          isDark ? "text-stone-300" : "text-stone-600"
        )}>
          {notification.content}
        </p>

        {/* --- BEGIN COMMENT ---
        操作按钮
        --- END COMMENT --- */}
        <div className="flex justify-end">
          <button className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
            isDark 
              ? "bg-stone-700 text-stone-200 hover:bg-stone-600" 
              : "bg-stone-200 text-stone-800 hover:bg-stone-300"
          )}>
            知道了
          </button>
        </div>
      </div>
    </div>
  )

  // --- BEGIN COMMENT ---
  // 顶部横幅通知 - 预览版本
  // --- END COMMENT ---
  const renderTopNotification = () => (
    <div className={cn(
      "absolute top-16 left-0 right-0 shadow-lg border-b",
      isDark ? "bg-stone-800 border-stone-600" : "bg-white border-stone-200"
    )}>
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", typeStyles.bg)}>
              <span className={typeStyles.color}>
                {typeStyles.icon}
              </span>
            </div>
            <div>
              <h4 className={cn(
                "font-semibold mb-1",
                isDark ? "text-stone-100" : "text-stone-900"
              )}>
                {notification.title}
              </h4>
              <p className={cn(
                "text-sm",
                isDark ? "text-stone-300" : "text-stone-600"
              )}>
                {notification.content}
              </p>
            </div>
          </div>
          <button className={cn(
            "p-2 rounded-full hover:bg-stone-500/10 transition-colors",
            isDark ? "text-stone-400" : "text-stone-500"
          )}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )

  // --- BEGIN COMMENT ---
  // 右下角通知 - 预览版本
  // --- END COMMENT ---
  const renderBottomRightNotification = () => (
    <div className={cn(
      "absolute bottom-6 right-6 max-w-sm rounded-xl shadow-xl border",
      isDark ? "bg-stone-800 border-stone-600" : "bg-white border-stone-200"
    )}>
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg flex-shrink-0", typeStyles.bg)}>
            <span className={typeStyles.color}>
              {typeStyles.icon}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className={cn(
                "font-semibold text-sm",
                isDark ? "text-stone-100" : "text-stone-900"
              )}>
                {notification.title}
              </h4>
              <button className={cn(
                "p-1 rounded-full hover:bg-stone-500/10 transition-colors",
                isDark ? "text-stone-400" : "text-stone-500"
              )}>
                <X className="h-3 w-3" />
              </button>
            </div>
            <p className={cn(
              "text-xs leading-relaxed",
              isDark ? "text-stone-300" : "text-stone-600"
            )}>
              {notification.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div 
      className={cn(
        "h-full w-full relative overflow-hidden",
        isDark ? "bg-stone-900" : "bg-stone-50"
      )}
    >
      {/* --- BEGIN COMMENT ---
      模拟完整页面背景 - 参考About预览的结构
      --- END COMMENT --- */}
      <div className="h-full w-full">
        {/* 模拟导航栏 */}
        <div className={cn(
          "h-16 border-b flex items-center px-6",
          isDark ? "bg-stone-800 border-stone-600" : "bg-white border-stone-200"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg",
              isDark ? "bg-stone-700" : "bg-stone-100"
            )} />
            <h1 className={cn(
              "text-lg font-semibold",
              isDark ? "text-stone-100" : "text-stone-900"
            )}>
              AgentifUI
            </h1>
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="h-[calc(100%-4rem)] p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className={cn(
                "text-3xl font-bold mb-4",
                isDark ? "text-stone-100" : "text-stone-900"
              )}>
                欢迎使用 AgentifUI
              </h1>
              <p className={cn(
                "text-lg mb-6",
                isDark ? "text-stone-300" : "text-stone-600"
              )}>
                这是一个完整的页面预览，用于展示通知在实际应用中的显示效果。
              </p>
            </div>

            {/* 模拟内容卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={cn(
                  "p-6 rounded-xl border",
                  isDark ? "bg-stone-800 border-stone-600" : "bg-white border-stone-200"
                )}>
                  <div className={cn(
                    "w-12 h-12 rounded-lg mb-4",
                    isDark ? "bg-stone-700" : "bg-stone-100"
                  )} />
                  <h3 className={cn(
                    "text-lg font-semibold mb-2",
                    isDark ? "text-stone-100" : "text-stone-900"
                  )}>
                    功能模块 {i}
                  </h3>
                  <p className={cn(
                    "text-sm",
                    isDark ? "text-stone-400" : "text-stone-600"
                  )}>
                    这里是一些示例内容，用于展示通知在真实页面环境中的显示效果和层级关系。
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- BEGIN COMMENT ---
      渲染通知 (仅在激活时显示)
      --- END COMMENT --- */}
      {renderNotification()}
    </div>
  )
}

// --- BEGIN COMMENT ---
// 通知预览包装器组件 - 处理空状态
// --- END COMMENT ---
interface NotificationPreviewWrapperProps {
  notification: NotificationConfig | null
}

export const NotificationPreviewWrapper: React.FC<NotificationPreviewWrapperProps> = ({ 
  notification 
}) => {
  const { isDark } = useTheme()

  if (!notification) {
    return (
      <div className={cn(
        "h-full flex items-center justify-center",
        isDark ? "bg-stone-900" : "bg-stone-50"
      )}>
        <div className={cn(
          "text-center p-8 rounded-xl border",
          isDark ? "bg-stone-800 border-stone-600" : "bg-white border-stone-200"
        )}>
          <Bell className={cn(
            "h-12 w-12 mx-auto mb-4",
            isDark ? "text-stone-600" : "text-stone-400"
          )} />
          <p className={cn(
            "text-lg font-medium mb-2",
            isDark ? "text-stone-300" : "text-stone-600"
          )}>
            选择通知预览
          </p>
          <p className={cn(
            "text-sm",
            isDark ? "text-stone-400" : "text-stone-500"
          )}>
            从左侧选择一个通知来预览其显示效果
          </p>
        </div>
      </div>
    )
  }

  return <NotificationPreview notification={notification} />
}

export default NotificationPreviewWrapper 