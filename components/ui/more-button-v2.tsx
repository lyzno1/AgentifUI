"use client"

import React from "react"
import { MoreHorizontal } from "lucide-react"
import { cn } from "@lib/utils"
import { useMobile } from "@lib/hooks/use-mobile"
import { useTheme } from "@lib/hooks/use-theme"

interface MoreButtonV2Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  iconClassName?: string
  isMenuOpen?: boolean // 下拉菜单是否打开
  isItemSelected?: boolean // 当前item是否被选中
  forceVisible?: boolean // 强制显示（移动端或其他情况）
  disableHover?: boolean // 是否禁用悬停效果（当有其他菜单打开时）
}

export const MoreButtonV2 = React.forwardRef<HTMLButtonElement, MoreButtonV2Props>(
  ({ 
    className, 
    iconClassName, 
    isMenuOpen = false,
    isItemSelected = false,
    forceVisible = false,
    disableHover = false,
    ...props 
  }, ref) => {
    const isMobile = useMobile()
    const { isDark } = useTheme()
    
    // --- BEGIN COMMENT ---
    // 响应式显示逻辑：移动端永远显示，桌面端根据悬停状态显示
    // --- END COMMENT ---
    const shouldForceVisible = isMobile || forceVisible
    
    return (
      <button
        ref={ref}
        className={cn(
          "p-1.5 rounded-md transition-all duration-200 ease-in-out",
          "flex items-center justify-center",
          // --- BEGIN COMMENT ---
          // 响应式显示：移动端永远显示，桌面端悬停显示
          // --- END COMMENT ---
          shouldForceVisible ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100",
          // --- BEGIN COMMENT ---
          // 动态cursor：下拉菜单打开时不显示pointer
          // --- END COMMENT ---
          !isMenuOpen ? "cursor-pointer" : "",
          // --- BEGIN COMMENT ---
          // 悬停效果：圆角矩形背景
          // --- END COMMENT ---
          disableHover ? "" : isDark ? "hover:bg-white/12" : "hover:bg-black/8",
          // --- BEGIN COMMENT ---
          // 选中状态：下拉菜单打开时的背景效果
          // --- END COMMENT ---
          isMenuOpen && (isDark ? "bg-white/15" : "bg-black/10"),
          // --- BEGIN COMMENT ---
          // 焦点状态
          // --- END COMMENT ---
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          className
        )}
        {...props}
      >
        <MoreHorizontal className={cn("w-4 h-4", iconClassName)} />
        <span className="sr-only">更多选项</span>
      </button>
    )
  }
)

MoreButtonV2.displayName = "MoreButtonV2"