"use client"

import React, { useEffect } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { ChatflowExecutionBar } from './chatflow-execution-bar'
import { useChatflowExecutionStore } from '@lib/stores/chatflow-execution-store'
import { Workflow, Loader2 } from 'lucide-react'

interface ChatflowNodeTrackerProps {
  isVisible: boolean
  className?: string
}

/**
 * Chatflow 节点跟踪器组件
 * 
 * 功能：
 * - 显示 chatflow 执行过程中的节点进度
 * - 实时更新节点状态
 * - fade-in 动画显示
 * - 临时UI，刷新后消失
 * - 不影响正常的流式响应
 */
export function ChatflowNodeTracker({ isVisible, className }: ChatflowNodeTrackerProps) {
  const { isDark } = useTheme()
  
  // 从 store 获取节点状态
  const nodes = useChatflowExecutionStore(state => state.nodes)
  const isExecuting = useChatflowExecutionStore(state => state.isExecuting)
  const executionProgress = useChatflowExecutionStore(state => state.executionProgress)
  const error = useChatflowExecutionStore(state => state.error)
  const iterationExpandedStates = useChatflowExecutionStore(state => state.iterationExpandedStates)
  
  // 🎯 过滤和分组节点：根据展开状态控制迭代中的节点显示
  const getVisibleNodes = () => {
    const visibleNodes = []
    
    for (const node of nodes) {
      // 非迭代中的节点总是显示
      if (!node.isInIteration) {
        visibleNodes.push(node)
      } else {
        // 迭代中的节点：需要找到对应的迭代容器节点
        const iterationNode = nodes.find(n => 
          n.isIterationNode && 
          n.id !== node.id && 
          // 简单的判断：如果迭代节点在当前节点之前，则认为是其容器
          nodes.indexOf(n) < nodes.indexOf(node)
        )
        
        // 如果找到迭代容器节点且已展开，则显示此迭代中的节点
        if (iterationNode && iterationExpandedStates[iterationNode.id]) {
          visibleNodes.push(node)
        }
      }
    }
    
    return visibleNodes
  }
  
  const visibleNodes = getVisibleNodes()
  
  // 如果不可见，不显示
  if (!isVisible) {
    return null
  }
  
  return (
    <div className={cn(
      "transition-all duration-300 transform",
      isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
      className
    )}>
      <div className={cn(
        "rounded-lg border p-4 space-y-3",
        isDark 
          ? "bg-stone-800/50 border-stone-700/50 backdrop-blur-sm" 
          : "bg-white/80 border-stone-200 backdrop-blur-sm"
      )}>
        {/* 标题栏 */}
        <div className={cn(
          "flex items-center gap-2 pb-2 border-b",
          isDark ? "border-stone-700/50" : "border-stone-200/50"
        )}>
          <Workflow className={cn(
            "h-4 w-4",
            isDark ? "text-stone-400" : "text-stone-600"
          )} />
          <span className={cn(
            "text-sm font-medium font-serif",
            isDark ? "text-stone-200" : "text-stone-800"
          )}>
            节点执行进度
          </span>
        </div>
        
        {/* 节点列表 */}
        <div className="space-y-2 relative"> {/* 🎯 添加relative用于竖线定位 */}
          {nodes.length === 0 ? (
            // 没有节点数据时的显示
            <div className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed",
              isDark ? "border-stone-600 bg-stone-800/30" : "border-stone-300 bg-stone-50"
            )}>
              {isExecuting ? (
                <Loader2 className={cn(
                  "h-4 w-4 animate-spin",
                  isDark ? "text-stone-400" : "text-stone-600"
                )} />
              ) : (
                <Workflow className={cn(
                  "h-4 w-4",
                  isDark ? "text-stone-400" : "text-stone-600"
                )} />
              )}
              <div>
                <div className={cn(
                  "text-sm font-medium font-serif",
                  isDark ? "text-stone-200" : "text-stone-800"
                )}>
                  {isExecuting ? "正在启动 Chatflow" : "暂无节点执行记录"}
                </div>
                <div className={cn(
                  "text-xs font-serif",
                  isDark ? "text-stone-400" : "text-stone-600"
                )}>
                  {isExecuting ? "等待节点状态更新..." : "开始对话后将显示节点执行进度"}
                </div>
              </div>
            </div>
          ) : (
            // 🎯 显示过滤后的节点列表
            visibleNodes.map((node, index) => (
              <ChatflowExecutionBar
                key={node.id}
                node={node}
                index={index}
                delay={index * 150} // 每个条延迟150ms出现
              />
            ))
          )}
        </div>
        
        {/* 错误信息 */}
        {error && (
          <div className={cn(
            "mt-3 p-3 rounded-lg border",
            isDark 
              ? "bg-red-900/20 border-red-700/50 text-red-200" 
              : "bg-red-50 border-red-200 text-red-700"
          )}>
            <div className="text-sm font-serif">
              <strong>执行错误：</strong> {error}
            </div>
          </div>
        )}
        

      </div>
    </div>
  )
} 