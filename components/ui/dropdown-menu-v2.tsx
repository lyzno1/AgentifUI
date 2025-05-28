"use client"

import React, { useState, createContext, useContext, useEffect, useRef } from "react"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks/use-theme"

// Context to provide closeMenu function to items
interface DropdownMenuV2ContextType {
  closeMenu: () => void
}
const DropdownMenuV2Context = createContext<DropdownMenuV2ContextType | null>(null)

// Custom Item component
interface DropdownMenuV2ItemProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  danger?: boolean
  icon?: React.ReactNode
  className?: string
}

const Item: React.FC<DropdownMenuV2ItemProps> = ({ 
  children, 
  onClick, 
  disabled = false,
  danger = false,
  icon,
  className 
}) => {
  const context = useContext(DropdownMenuV2Context);
  const { isDark } = useTheme();

  const handleItemClick = () => { 
    if (disabled) return
    onClick?.(); 
    if (context) { 
      context.closeMenu();
    }
  };

  return (
    <button
      onClick={handleItemClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2 text-sm font-serif text-left",
        "transition-colors duration-150",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        !disabled && (isDark ? "hover:bg-stone-600/40" : "hover:bg-stone-100/80"),
        danger 
          ? isDark 
            ? "text-red-400 hover:bg-red-900/20" 
            : "text-red-600 hover:bg-red-50"
          : isDark 
            ? "text-stone-300" 
            : "text-stone-600",
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

// Divider component
const Divider: React.FC = () => {
  const { isDark } = useTheme();
  return (
    <div className={cn("h-px my-1", isDark ? "bg-stone-500/40" : "bg-stone-300/40")} />
  );
}

// Main DropdownMenuV2 component
interface DropdownMenuV2Props {
  trigger: React.ReactNode
  children: React.ReactNode
  contentClassName?: string
  placement?: "top" | "bottom" | "left" | "right"
  minWidth?: number
  popoverContainerClassName?: string
  alignToTriggerBottom?: boolean
  preventScroll?: boolean // 是否阻止背景滚动
  isOpen?: boolean // 外部控制的打开状态
  onOpenChange?: (isOpen: boolean) => void // 状态变化回调
}

export function DropdownMenuV2({
  trigger,
  children,
  contentClassName,
  placement = "bottom",
  minWidth = 160,
  popoverContainerClassName,
  alignToTriggerBottom = false,
  preventScroll = true, // 默认阻止滚动
  isOpen: externalIsOpen,
  onOpenChange,
}: DropdownMenuV2Props) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { isDark } = useTheme()
  
  // 使用外部状态或内部状态
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const setIsOpen = onOpenChange || setInternalIsOpen

  // --- BEGIN COMMENT ---
  // 🎯 全局点击监听器：点击组件外部时关闭菜单
  // 这样可以确保点击页面任何地方都能关闭菜单
  // --- END COMMENT ---
  useEffect(() => {
    if (!isOpen) return

    const handleGlobalClick = (event: MouseEvent) => {
      // 如果点击的是组件内部，不关闭菜单
      if (containerRef.current && containerRef.current.contains(event.target as Node)) {
        return
      }
      
      // 点击组件外部，关闭菜单
      setIsOpen(false)
    }

    // 添加全局点击监听器
    document.addEventListener('mousedown', handleGlobalClick)
    
    return () => {
      document.removeEventListener('mousedown', handleGlobalClick)
    }
  }, [isOpen, setIsOpen])

  // --- BEGIN COMMENT ---
  // 阻止背景滚动：当下拉菜单打开时
  // --- END COMMENT ---
  useEffect(() => {
    if (!preventScroll) return

    if (isOpen) {
      // 阻止滚动
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      
      return () => {
        // 恢复滚动
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen, preventScroll])

  const closeMenu = () => {
    setIsOpen(false)
  }

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  // --- BEGIN COMMENT ---
  // 阻止trigger点击事件冒泡
  // --- END COMMENT ---
  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleMenu()
  }

  return (
    <DropdownMenuV2Context.Provider value={{ closeMenu }}>
      <div className="relative" ref={containerRef}>
        {/* Trigger */}
        <div onClick={handleTriggerClick}>
          {trigger}
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className={cn(
            "absolute z-50",
            // --- BEGIN COMMENT ---
            // 定位：右上角与trigger接壤
            // --- END COMMENT ---
            placement === "bottom" ? "top-full right-0 mt-1" : "bottom-full right-0 mb-1",
            popoverContainerClassName
          )}>
            <div 
              className={cn(
                "rounded-md shadow-lg border backdrop-blur-sm",
                // --- BEGIN COMMENT ---
                // 🎯 使用更深的颜色以区别于sidebar背景
                // --- END COMMENT ---
                isDark 
                  ? "bg-stone-800/95 border-stone-600/80" 
                  : "bg-white/95 border-stone-300/80",
                "py-1",
                contentClassName
              )}
              style={{ minWidth: `${minWidth}px` }}
            >
              {children}
            </div>
          </div>
        )}
      </div>
    </DropdownMenuV2Context.Provider>
  )
}

DropdownMenuV2.Item = Item
DropdownMenuV2.Divider = Divider