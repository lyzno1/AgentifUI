"use client"

import { Blocks } from "lucide-react"
import { cn } from "@lib/utils"
import { useThemeColors } from "@lib/hooks/use-theme-colors"
import { AppCard } from "./app-card"

interface AppInstance {
  instanceId: string
  displayName: string
  description?: string
  appType: 'model' | 'marketplace'
  iconUrl?: string
  category?: string
  tags?: string[]
  difyAppType?: string
  isPopular?: boolean
  lastUsed?: string
  config?: {
    app_metadata?: {
      dify_apptype?: string
      [key: string]: any
    }
    [key: string]: any
  }
}

interface AppListProps {
  apps: AppInstance[]
  viewMode: 'grid' | 'list'
  onAppClick: (app: AppInstance) => void
}

export function AppList({ apps, viewMode, onAppClick }: AppListProps) {
  const { colors, isDark } = useThemeColors()

  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center mb-3",
          isDark ? "bg-stone-800" : "bg-stone-100"
        )}>
          <Blocks className={cn(
            "w-6 h-6",
            isDark ? "text-stone-400" : "text-stone-500"
          )} />
        </div>
        <h3 className={cn(
          "text-base font-semibold mb-1 font-serif",
          colors.mainText.tailwind
        )}>
          未找到应用
        </h3>
        <p className={cn(
          "text-sm font-serif",
          isDark ? "text-stone-400" : "text-stone-600"
        )}>
          尝试调整搜索条件或浏览其他分类
        </p>
      </div>
    )
  }

  return (
    <div className={cn(
      viewMode === 'grid' 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        : "space-y-3"
    )}>
      {apps.map((app) => (
        <AppCard
          key={app.instanceId}
          app={app}
          viewMode={viewMode}
          onClick={onAppClick}
        />
      ))}
    </div>
  )
} 