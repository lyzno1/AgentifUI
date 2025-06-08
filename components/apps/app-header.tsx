"use client"

import { Package } from "lucide-react"
import { cn } from "@lib/utils"
import { useThemeColors } from "@lib/hooks/use-theme-colors"

interface AppHeaderProps {
  totalApps: number
  filteredApps: number
  selectedCategory: string
}

export function AppHeader({ totalApps, filteredApps, selectedCategory }: AppHeaderProps) {
  const { colors, isDark } = useThemeColors()

  return (
    <div className="mb-6">
      {/* 主标题区域 */}
      <div className="flex items-center gap-3 mb-2">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          "bg-gradient-to-br from-blue-500 to-purple-600"
        )}>
          <Package className="w-4 h-4 text-white" />
        </div>
        
        <div>
          <h1 className={cn(
            "text-2xl font-bold font-serif",
            colors.mainText.tailwind
          )}>
            应用市场
          </h1>
        </div>
      </div>

      {/* 简洁的统计信息 */}
      <div className={cn(
        "text-sm font-serif flex items-center gap-4",
        isDark ? "text-stone-400" : "text-stone-600"
      )}>
        <span>
          {selectedCategory === "全部" 
            ? `共 ${totalApps} 个应用` 
            : `${selectedCategory} · ${filteredApps} 个应用`
          }
        </span>
        {selectedCategory !== "全部" && filteredApps !== totalApps && (
          <span className={cn(
            "text-xs px-2 py-0.5 rounded",
            isDark ? "bg-stone-800 text-stone-400" : "bg-stone-100 text-stone-600"
          )}>
            共 {totalApps} 个
          </span>
        )}
      </div>
    </div>
  )
} 