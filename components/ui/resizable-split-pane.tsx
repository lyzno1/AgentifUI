"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { useMobile } from '@lib/hooks/use-mobile'
import { cn } from '@lib/utils'
import { GripVertical } from 'lucide-react'

interface ResizableSplitPaneProps {
  left: React.ReactNode
  right: React.ReactNode
  defaultLeftWidth?: number // 默认左侧宽度百分比
  minLeftWidth?: number     // 最小左侧宽度百分比
  maxLeftWidth?: number     // 最大左侧宽度百分比
  className?: string
  storageKey?: string       // localStorage存储键名
}

/**
 * 可调整大小的分屏组件
 * 
 * 功能特点：
 * - 支持拖拽调整左右面板大小
 * - 明显的分屏按钮指示器
 * - 状态持久化到localStorage
 * - 移动端自动禁用
 * - 平滑的动画效果
 */
export function ResizableSplitPane({
  left,
  right,
  defaultLeftWidth = 50,
  minLeftWidth = 20,
  maxLeftWidth = 80,
  className,
  storageKey = 'resizable-split-pane'
}: ResizableSplitPaneProps) {
  const { isDark } = useTheme()
  const isMobile = useMobile()
  const containerRef = useRef<HTMLDivElement>(null)
  
  // --- 从localStorage恢复状态 ---
  const [leftWidth, setLeftWidth] = useState(() => {
    if (typeof window === 'undefined') return defaultLeftWidth
    const saved = localStorage.getItem(storageKey)
    return saved ? Math.max(minLeftWidth, Math.min(maxLeftWidth, parseInt(saved))) : defaultLeftWidth
  })
  
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)
  
  // --- 保存状态到localStorage ---
  useEffect(() => {
    localStorage.setItem(storageKey, leftWidth.toString())
  }, [leftWidth, storageKey])
  
  // --- 开始拖拽 ---
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMobile) return
    
    e.preventDefault()
    setIsDragging(true)
    setStartX(e.clientX)
    setStartWidth(leftWidth)
    
    // 设置全局cursor和禁用文本选择
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.body.style.pointerEvents = 'none'
    
    // 为分割线设置特殊样式
    if (containerRef.current) {
      containerRef.current.style.pointerEvents = 'auto'
    }
  }, [isMobile, leftWidth])
  
  // --- 拖拽移动 ---
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    
    const containerWidth = containerRef.current.offsetWidth
    const deltaX = e.clientX - startX
    const deltaPercent = (deltaX / containerWidth) * 100
    const newWidth = Math.min(maxLeftWidth, Math.max(minLeftWidth, startWidth + deltaPercent))
    
    setLeftWidth(newWidth)
  }, [isDragging, startX, startWidth, minLeftWidth, maxLeftWidth])
  
  // --- 结束拖拽 ---
  const handleMouseUp = useCallback(() => {
    if (!isDragging) return
    
    setIsDragging(false)
    
    // 恢复全局样式
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    document.body.style.pointerEvents = ''
    
    if (containerRef.current) {
      containerRef.current.style.pointerEvents = ''
    }
  }, [isDragging])
  
  // --- 添加全局事件监听 ---
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])
  
  // --- 重置为默认大小 ---
  const handleReset = useCallback(() => {
    setLeftWidth(defaultLeftWidth)
  }, [defaultLeftWidth])
  
  // 移动端直接返回简单的flex布局
  if (isMobile) {
    return (
      <div className={cn("flex h-full", className)} ref={containerRef}>
        <div className="flex-1 min-w-0">{left}</div>
        <div className="flex-1 min-w-0">{right}</div>
      </div>
    )
  }
  
  return (
    <div 
      className={cn("flex h-full relative", className)} 
      ref={containerRef}
    >
      {/* 左侧面板 */}
      <div 
        className="min-w-0 transition-all duration-200 ease-out"
        style={{ width: `${leftWidth}%` }}
      >
        {left}
      </div>
      
      {/* 分割线和拖拽区域 */}
      <div className="relative flex items-center justify-center group z-10">
        {/* 可视分割线 */}
        <div className={cn(
          "w-px h-full transition-all duration-200",
          isDark ? "bg-stone-600" : "bg-stone-300",
          isDragging && (isDark ? "bg-stone-500" : "bg-stone-400")
        )} />
        
        {/* 拖拽热区 */}
        <div 
          className={cn(
            "absolute inset-y-0 -left-2 -right-2 cursor-col-resize",
            "flex items-center justify-center",
            "transition-all duration-150",
            isDragging && "bg-stone-500/5"
          )}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleReset}
          title="拖拽调整面板大小，双击重置"
        >
          {/* 分屏按钮指示器 */}
          <div className={cn(
            "flex items-center justify-center",
            "w-4 h-8 rounded-full border transition-all duration-150",
            "shadow-sm",
            // 默认状态
            isDark 
              ? "bg-stone-800/80 border-stone-600/50 text-stone-400" 
              : "bg-white/80 border-stone-300/50 text-stone-500",
            // 悬停状态
            "group-hover:scale-105",
            isDark
              ? "group-hover:bg-stone-700/90 group-hover:border-stone-500/70 group-hover:text-stone-300"
              : "group-hover:bg-white/90 group-hover:border-stone-400/70 group-hover:text-stone-600",
            // 拖拽状态
            isDragging && (
              isDark
                ? "bg-stone-700/95 border-stone-500/80 text-stone-200 scale-105"
                : "bg-white/95 border-stone-400/80 text-stone-700 scale-105"
            )
          )}>
            <GripVertical className="h-3 w-3" />
          </div>
        </div>
      </div>
      
      {/* 右侧面板 */}
      <div 
        className="flex-1 min-w-0 transition-all duration-200 ease-out"
        style={{ width: `${100 - leftWidth}%` }}
      >
        {right}
      </div>
      
      {/* 拖拽时的全局遮罩 */}
      {isDragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize" style={{ pointerEvents: 'none' }} />
      )}
    </div>
  )
} 