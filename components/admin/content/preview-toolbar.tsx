"use client"

import React from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { Monitor, Tablet, Smartphone, Eye, EyeOff, Maximize2 } from 'lucide-react'

interface PreviewToolbarProps {
  activeTab: 'about' | 'notifications'
  previewDevice: 'desktop' | 'tablet' | 'mobile'
  onDeviceChange: (device: 'desktop' | 'tablet' | 'mobile') => void
  showPreview: boolean
  onPreviewToggle: () => void
  onFullscreenPreview?: () => void
}

export function PreviewToolbar({ 
  activeTab, 
  previewDevice, 
  onDeviceChange, 
  showPreview, 
  onPreviewToggle,
  onFullscreenPreview
}: PreviewToolbarProps) {
  const { isDark } = useTheme()

  const devices = [
    { key: 'desktop' as const, icon: Monitor, label: '桌面' },
    { key: 'tablet' as const, icon: Tablet, label: '平板' },
    { key: 'mobile' as const, icon: Smartphone, label: '移动' }
  ]

  return (
    <div className={cn(
      "flex items-center justify-between p-3 border-b",
      isDark ? "bg-stone-800 border-stone-600" : "bg-stone-50 border-stone-200"
    )}>
      {/* --- BEGIN COMMENT ---
      预览标题
      --- END COMMENT --- */}
      <div className="flex items-center gap-2">
        <Eye className={cn(
          "h-4 w-4",
          isDark ? "text-stone-400" : "text-stone-500"
        )} />
        <span className={cn(
          "text-sm font-medium",
          isDark ? "text-stone-300" : "text-stone-700"
        )}>
          {activeTab === 'about' ? 'About页面预览' : '通知预览'}
        </span>
      </div>

      {/* --- BEGIN COMMENT ---
      预览控制按钮
      --- END COMMENT --- */}
      <div className="flex items-center gap-2">
        {/* --- BEGIN COMMENT ---
        设备切换按钮 (仅About页面且预览开启时显示)
        --- END COMMENT --- */}
        {activeTab === 'about' && showPreview && (
          <div className={cn(
            "flex items-center border rounded-lg p-1",
            isDark ? "bg-stone-700 border-stone-600" : "bg-white border-stone-300"
          )}>
            {devices.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => onDeviceChange(key)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                  previewDevice === key
                    ? isDark ? "bg-stone-600 text-stone-100" : "bg-stone-100 text-stone-900"
                    : isDark ? "text-stone-400 hover:text-stone-300" : "text-stone-600 hover:text-stone-700"
                )}
                title={label}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* --- BEGIN COMMENT ---
        全屏预览按钮 (仅About页面的桌面模式显示)
        --- END COMMENT --- */}
        {activeTab === 'about' && showPreview && previewDevice === 'desktop' && onFullscreenPreview && (
          <button
            onClick={onFullscreenPreview}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              isDark ? "bg-stone-700 hover:bg-stone-600 text-stone-300" : "bg-stone-200 hover:bg-stone-300 text-stone-700"
            )}
            title="全屏预览"
          >
            <Maximize2 className="h-4 w-4" />
            <span className="hidden sm:inline">全屏</span>
          </button>
        )}

        {/* --- BEGIN COMMENT ---
        预览开关按钮
        --- END COMMENT --- */}
        <button
          onClick={onPreviewToggle}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            showPreview
              ? isDark ? "bg-stone-100 text-stone-900" : "bg-stone-900 text-white"
              : isDark ? "bg-stone-700 hover:bg-stone-600 text-stone-300" : "bg-stone-200 hover:bg-stone-300 text-stone-700"
          )}
        >
          {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showPreview ? '隐藏预览' : '显示预览'}
        </button>
      </div>
    </div>
  )
} 