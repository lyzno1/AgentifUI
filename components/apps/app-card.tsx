"use client"

import { Star, ArrowRight, Cpu, Blocks, Heart } from "lucide-react"
import { cn } from "@lib/utils"
import { useThemeColors } from "@lib/hooks/use-theme-colors"
import { getDifyAppTypeInfo } from "@lib/types/dify-app-types"
import { useFavoriteAppsStore } from "@lib/stores/favorite-apps-store"

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

interface AppCardProps {
  app: AppInstance
  viewMode: 'grid' | 'list'
  onClick: (app: AppInstance) => void
}

export function AppCard({ app, viewMode, onClick }: AppCardProps) {
  const { colors, isDark } = useThemeColors()
  const { addFavoriteApp, removeFavoriteApp, isFavorite } = useFavoriteAppsStore()

  // 获取Dify应用类型信息
  const difyAppType = app.config?.app_metadata?.dify_apptype || app.difyAppType
  const difyTypeInfo = difyAppType ? getDifyAppTypeInfo(difyAppType) : null
  
  // 检查是否为收藏应用
  const isAppFavorite = isFavorite(app.instanceId)

  // 处理收藏切换
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (isAppFavorite) {
      removeFavoriteApp(app.instanceId)
    } else {
      await addFavoriteApp({
        instanceId: app.instanceId,
        displayName: app.displayName,
        description: app.description,
        iconUrl: app.iconUrl,
        appType: app.appType,
        dify_apptype: difyAppType as 'agent' | 'chatbot' | 'text-generation' | 'chatflow' | 'workflow' | undefined
      })
    }
  }

  // 获取应用图标 - 更小尺寸
  const getAppIcon = (app: AppInstance) => {
    if (app.iconUrl) {
      return (
        <img 
          src={app.iconUrl} 
          alt={app.displayName}
          className="w-8 h-8 rounded-full object-cover"
        />
      )
    }

    // 使用彩色渐变背景 - 更小尺寸
    const getIconColors = () => {
      if (difyTypeInfo) {
        switch (difyAppType) {
          case 'chatbot':
            return isDark 
              ? "bg-gradient-to-br from-blue-500 to-blue-600" 
              : "bg-gradient-to-br from-blue-400 to-blue-500"
          case 'agent':
            return isDark 
              ? "bg-gradient-to-br from-purple-500 to-purple-600" 
              : "bg-gradient-to-br from-purple-400 to-purple-500"
          case 'workflow':
            return isDark 
              ? "bg-gradient-to-br from-green-500 to-green-600" 
              : "bg-gradient-to-br from-green-400 to-green-500"
          case 'text-generation':
            return isDark 
              ? "bg-gradient-to-br from-orange-500 to-orange-600" 
              : "bg-gradient-to-br from-orange-400 to-orange-500"
          case 'chatflow':
            return isDark 
              ? "bg-gradient-to-br from-teal-500 to-teal-600" 
              : "bg-gradient-to-br from-teal-400 to-teal-500"
          default:
            return isDark 
              ? "bg-gradient-to-br from-stone-600 to-stone-700" 
              : "bg-gradient-to-br from-stone-400 to-stone-500"
        }
      }
      
      return app.appType === 'model'
        ? isDark 
          ? "bg-gradient-to-br from-stone-600 to-stone-700" 
          : "bg-gradient-to-br from-stone-400 to-stone-500"
        : isDark 
          ? "bg-gradient-to-br from-stone-500 to-stone-600" 
          : "bg-gradient-to-br from-stone-300 to-stone-400"
    }

    return (
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm",
        getIconColors()
      )}>
        {difyTypeInfo ? (
          <span className="text-sm">{difyTypeInfo.icon}</span>
        ) : app.appType === 'model' ? (
          <Cpu className="w-4 h-4" />
        ) : (
          <Blocks className="w-4 h-4" />
        )}
      </div>
    )
  }

  return (
    <div
      onClick={() => onClick(app)}
      className={cn(
        "group cursor-pointer transition-all duration-200 relative",
        "rounded-lg border bg-white",
        "hover:shadow-md hover:-translate-y-0.5",
        isDark ? [
          "bg-stone-900 border-stone-700",
          "hover:shadow-stone-950/30 hover:border-stone-600"
        ] : [
          "bg-white border-stone-200",
          "hover:shadow-stone-200/30 hover:border-stone-300"
        ],
        viewMode === 'list' && "flex items-center gap-3 p-3"
      )}
    >
      {viewMode === 'grid' ? (
        <div className="p-4 h-full flex flex-col">
          {/* 右上角收藏按钮 */}
          <button
            onClick={handleToggleFavorite}
            className={cn(
              "absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center",
              "transition-all duration-200 opacity-0 group-hover:opacity-100",
              "hover:scale-110",
              isAppFavorite ? [
                "bg-red-100 text-red-500 opacity-100",
                isDark && "bg-red-900/30 text-red-400"
              ] : [
                "bg-stone-100 text-stone-400 hover:bg-stone-200",
                isDark && "bg-stone-800 text-stone-500 hover:bg-stone-700"
              ]
            )}
          >
            <Heart className={cn(
              "w-3 h-3 transition-transform",
              isAppFavorite && "fill-current scale-110"
            )} />
          </button>

          {/* 应用图标和标题 */}
          <div className="flex items-center gap-3 mb-2">
            {getAppIcon(app)}
            <h3 className={cn(
              "font-semibold text-sm font-serif line-clamp-1 flex-1",
              colors.mainText.tailwind
            )}>
              {app.displayName}
            </h3>
          </div>

          {/* 应用描述 - 固定高度 */}
          <div className="flex-1 mb-3">
            <p className={cn(
              "text-xs line-clamp-2 font-serif leading-relaxed",
              isDark ? "text-stone-400" : "text-stone-600"
            )}>
              {app.description || "暂无描述"}
            </p>
          </div>

          {/* 底部信息 - 固定在底部 */}
          <div className="flex items-center justify-between text-xs mt-auto">
            <span className={cn(
              "font-serif",
              isDark ? "text-stone-500" : "text-stone-500"
            )}>
              {difyTypeInfo?.label || "应用"}
            </span>
            
            <ArrowRight className={cn(
              "w-3 h-3",
              isDark ? "text-stone-500" : "text-stone-500"
            )} />
          </div>
        </div>
      ) : (
        // 列表视图
        <>
          {/* 应用图标 */}
          <div className="flex-shrink-0">
            {getAppIcon(app)}
          </div>
          
          {/* 应用信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={cn(
                "font-semibold text-sm font-serif",
                colors.mainText.tailwind
              )}>
                {app.displayName}
              </h3>
              
              {difyTypeInfo && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded font-serif",
                  isDark ? "bg-stone-800 text-stone-300" : "bg-stone-100 text-stone-600"
                )}>
                  {difyTypeInfo.label}
                </span>
              )}
            </div>
            
            <p className={cn(
              "text-xs line-clamp-1 font-serif",
              isDark ? "text-stone-400" : "text-stone-600"
            )}>
              {app.description || "暂无描述"}
            </p>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleFavorite}
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center",
                "transition-all duration-200",
                isAppFavorite ? [
                  "bg-red-100 text-red-500",
                  isDark && "bg-red-900/30 text-red-400"
                ] : [
                  "bg-stone-100 text-stone-400 hover:bg-stone-200 opacity-0 group-hover:opacity-100",
                  isDark && "bg-stone-800 text-stone-500 hover:bg-stone-700"
                ]
              )}
            >
              <Heart className={cn(
                "w-3 h-3 transition-transform",
                isAppFavorite && "fill-current"
              )} />
            </button>
            
            <ArrowRight className={cn(
              "w-4 h-4",
              isDark ? "text-stone-400" : "text-stone-500"
            )} />
          </div>
        </>
      )}
    </div>
  )
} 