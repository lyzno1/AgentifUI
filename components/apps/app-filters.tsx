"use client"

import { Search, Grid3x3, List } from "lucide-react"
import { cn } from "@lib/utils"
import { useThemeColors } from "@lib/hooks/use-theme-colors"

interface AppFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedCategory: string
  onCategoryChange: (category: string) => void
  categories: string[]
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
}

export function AppFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  viewMode,
  onViewModeChange
}: AppFiltersProps) {
  const { colors, isDark } = useThemeColors()

  // 获取分类显示信息
  const getCategoryDisplay = (category: string) => {
    if (category === '全部') {
      return { icon: '🏪', label: '全部' }
    }
    if (category === '常用应用') {
      return { icon: '⭐', label: '常用' }
    }
    if (category === '其他') {
      return { icon: '📦', label: '其他' }
    }
    
    // Dify应用类型映射
    const typeMap: Record<string, { icon: string; label: string }> = {
      '聊天机器人': { icon: '🤖', label: '聊天机器人' },
      '智能助手': { icon: '🧠', label: '智能助手' },
      '工作流': { icon: '⚡', label: '工作流' },
      '文本生成': { icon: '✍️', label: '文本生成' },
      '对话流': { icon: '💬', label: '对话流' }
    }
    
    return typeMap[category] || { icon: '🔧', label: category }
  }

  return (
    <div className="space-y-4 mb-6">
      {/* 搜索框 */}
      <div className="relative">
        <Search className={cn(
          "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4",
          isDark ? "text-stone-400" : "text-stone-500"
        )} />
        <input
          type="text"
          placeholder="搜索应用..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            "w-full pl-10 pr-4 py-2.5 rounded-lg border font-serif",
            "focus:outline-none focus:ring-2 focus:ring-stone-500/20 focus:border-stone-400",
            "transition-all duration-200",
            isDark ? [
              "bg-stone-800 border-stone-700 text-stone-100",
              "placeholder:text-stone-400"
            ] : [
              "bg-white border-stone-200 text-stone-900",
              "placeholder:text-stone-500"
            ]
          )}
        />
      </div>

      {/* 分类和视图控制 */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        {/* 分类标签 */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const { icon, label } = getCategoryDisplay(category)
            const isSelected = selectedCategory === category
            
            return (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 font-serif",
                  isSelected ? [
                    isDark ? [
                      "bg-stone-700 text-stone-100",
                      "ring-1 ring-stone-600"
                    ] : [
                      "bg-stone-900 text-white",
                      "ring-1 ring-stone-300"
                    ]
                  ] : [
                    isDark ? [
                      "bg-stone-800 text-stone-300 hover:bg-stone-700",
                      "border border-stone-700 hover:border-stone-600"
                    ] : [
                      "bg-stone-100 text-stone-700 hover:bg-stone-200",
                      "border border-stone-200 hover:border-stone-300"
                    ]
                  ]
                )}
              >
                <span className="text-sm">{icon}</span>
                <span>{label}</span>
              </button>
            )
          })}
        </div>

        {/* 视图切换 */}
        <div className={cn(
          "flex rounded-lg p-1 border",
          isDark ? "bg-stone-800 border-stone-700" : "bg-stone-100 border-stone-200"
        )}>
          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 font-serif",
              viewMode === 'grid' ? [
                isDark ? "bg-stone-700 text-stone-100" : "bg-white text-stone-900 shadow-sm"
              ] : [
                isDark ? "text-stone-400 hover:text-stone-300" : "text-stone-600 hover:text-stone-700"
              ]
            )}
          >
            <Grid3x3 className="w-4 h-4" />
            <span className="hidden sm:inline">网格</span>
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 font-serif",
              viewMode === 'list' ? [
                isDark ? "bg-stone-700 text-stone-100" : "bg-white text-stone-900 shadow-sm"
              ] : [
                isDark ? "text-stone-400 hover:text-stone-300" : "text-stone-600 hover:text-stone-700"
              ]
            )}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">列表</span>
          </button>
        </div>
      </div>
    </div>
  )
} 