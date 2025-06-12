"use client"

import React, { useState, useEffect } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { 
  Loader2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search
} from 'lucide-react'
import type { WorkflowNode, WorkflowIteration, WorkflowLoop, WorkflowParallelBranch } from '@lib/stores/workflow-execution-store'
import { useWorkflowExecutionStore } from '@lib/stores/workflow-execution-store'

interface ExecutionBarProps {
  node: WorkflowNode
  index: number
  delay?: number
}

/**
 * 工作流执行条组件 - 支持迭代和并行分支的细粒度显示
 * 
 * 特点：
 * - fade-in动画进入
 * - 左侧节点类型图标
 * - 中间显示节点信息和状态
 * - 右侧显示计时信息
 * - 支持迭代展开/折叠
 * - 支持并行分支显示
 * - 悬停效果和交互
 */
export function ExecutionBar({ node, index, delay = 0 }: ExecutionBarProps) {
  const { isDark } = useTheme()
  const [isVisible, setIsVisible] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  
  // 🎯 使用store中的展开状态和actions
  const { 
    iterationExpandedStates, 
    loopExpandedStates, 
    toggleIterationExpanded, 
    toggleLoopExpanded 
  } = useWorkflowExecutionStore()
  
  const isExpanded = (node.isIterationNode && iterationExpandedStates[node.id]) || 
                     (node.isLoopNode && loopExpandedStates[node.id]) || false
  
  // 延迟显示动画
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)
    
    return () => clearTimeout(timer)
  }, [delay])
  
  // 计时器
  useEffect(() => {
    if (node.status === 'running' && node.startTime) {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - node.startTime!)
      }, 100)
      
      return () => clearInterval(interval)
    } else if (node.status === 'completed' && node.startTime && node.endTime) {
      setElapsedTime(node.endTime - node.startTime)
    }
  }, [node.status, node.startTime, node.endTime])
  
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    const seconds = (ms / 1000).toFixed(1)
    return `${seconds}s`
  }
  
  const getStatusIcon = () => {
    // 🎯 保持workflow UI一致性：只使用两种图标 - 放大镜和spinner
    const getSimpleIcon = () => {
      if (node.status === 'running') {
        return <Loader2 className="h-4 w-4 animate-spin" />
      }
      return <Search className="h-4 w-4" />
    }
    
    const icon = getSimpleIcon()
    
    // 根据状态设置颜色
    const colorClass = node.status === 'running'
      ? isDark ? "text-stone-400" : "text-stone-600"
      : node.status === 'completed'
        ? isDark ? "text-stone-400" : "text-stone-600"
        : node.status === 'failed'
          ? "text-red-500"
          : isDark ? "text-stone-500" : "text-stone-400"
    
    return <div className={cn(colorClass)}>{icon}</div>
  }
  
  const getStatusText = () => {
    // 🎯 迭代节点显示特殊状态文本
    if (node.isIterationNode) {
      switch (node.status) {
        case 'running':
          return '正在迭代...'
        case 'completed':
          return '迭代完成'
        case 'failed':
          return '迭代失败'
        default:
          return '等待迭代'
      }
    }
    
    // 🎯 循环节点显示特殊状态文本
    if (node.isLoopNode) {
      switch (node.status) {
        case 'running':
          return '正在循环'
        case 'completed':
          return '循环完成'
        case 'failed':
          return '循环失败'
        default:
          return '等待循环'
      }
    }
    
    // 🎯 并行分支节点显示特殊状态文本
    if (node.isParallelNode) {
      switch (node.status) {
        case 'running':
          return '并行执行中...'
        case 'completed':
          return '并行完成'
        case 'failed':
          return '并行失败'
        default:
          return '等待并行执行'
      }
    }
    
    switch (node.status) {
      case 'running':
        return node.description || '正在执行...'
      case 'completed':
        return '执行完成'
      case 'failed':
        return '执行失败'
      case 'pending':
        return '等待执行'
      default:
        return '未知状态'
    }
  }
  
  const getNodeTitle = () => {
    // 根据节点类型返回友好的中文名称
    switch (node.type) {
      case 'start':
        return '开始节点'
      case 'llm':
        return 'LLM 推理'
      case 'knowledge-retrieval':
        return '知识检索'
      case 'question-classifier':
        return '问题分类器'
      case 'if-else':
        return '条件分支'
      case 'code':
        return '代码执行'
      case 'template-transform':
        return '模板转换'
      case 'variable-assigner':
        return '变量赋值'
      case 'variable-aggregator':
        return '变量聚合器'
      case 'document-extractor':
        return '文档提取器'
      case 'parameter-extractor':
        return '参数提取器'
      case 'http-request':
        return 'HTTP 请求'
      case 'list-operator':
        return '列表操作'
      case 'iteration':
      case 'loop':
        return '循环迭代'
      case 'parallel':
        return '并行分支'
      case 'end':
        return '结束节点'
      default:
        return node.title || `节点 ${index + 1}`
    }
  }
  
  const getBarStyles = () => {
    const baseStyles = cn(
      // 🎯 保持workflow原有样式：细bar样式 + 悬停效果
      "flex items-center gap-3 px-3 py-2 rounded-md border transition-all duration-300",
      "transform font-serif",
      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
    )
    
    // --- BEGIN COMMENT ---
    // 🎯 关键修复：迭代/循环中的节点使用左侧指示条+连接点设计，提供清晰的层级视觉指示
    // --- END COMMENT ---
    const nestedStyles = (node.isInIteration || node.isInLoop) ? cn(
      "relative ml-6 pl-4",
      // 使用相应的指示条样式
      node.isInIteration ? "iteration-node" : "loop-node",
      // 轻微的背景色区分
      isDark ? "bg-stone-800/20" : "bg-stone-50/40"
    ) : ""
    
    const combinedBaseStyles = cn(baseStyles, nestedStyles)
    
    switch (node.status) {
      case 'running':
        return cn(
          combinedBaseStyles,
          isDark
            ? "bg-stone-700/50 border-stone-600 shadow-lg shadow-stone-900/30"
            : "bg-stone-200/50 border-stone-300 shadow-lg shadow-stone-200/50"
        )
      case 'completed':
        return cn(
          combinedBaseStyles,
          isDark
            ? "bg-stone-600/30 border-stone-500"
            : "bg-stone-100 border-stone-300"
        )
      case 'failed':
        return cn(
          combinedBaseStyles,
          isDark
            ? "bg-red-900/20 border-red-700/50"
            : "bg-red-50 border-red-200"
        )
      case 'pending':
        return cn(
          combinedBaseStyles,
          isDark
            ? "bg-stone-800/50 border-stone-700/50"
            : "bg-stone-50 border-stone-200"
        )
      default:
        return cn(
          combinedBaseStyles,
          isDark
            ? "bg-stone-800/50 border-stone-700/50"
            : "bg-stone-50 border-stone-200"
        )
    }
  }
  
  return (
    <div className="space-y-1">
      <div 
        className={cn(
          getBarStyles(),
          // 🎯 所有bar都有悬停效果，只有迭代、循环和并行分支节点才有cursor pointer
          "hover:scale-[1.02] hover:shadow-md transition-all duration-200",
          (node.isIterationNode || node.isLoopNode || node.isParallelNode) && "cursor-pointer"
        )}
        onClick={(node.isIterationNode || node.isLoopNode || node.isParallelNode) ? () => {
          if (node.isIterationNode) {
            toggleIterationExpanded(node.id)
          } else if (node.isLoopNode) {
            toggleLoopExpanded(node.id)
          } else if (node.isParallelNode) {
            toggleIterationExpanded(node.id) // 并行分支暂时使用迭代展开状态
          }
        } : undefined}
      >
        {/* 左侧：状态图标 */}
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>
        
        {/* 中间：节点信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* 节点标题行 */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className={cn(
                "font-medium text-sm font-serif truncate",
                isDark ? "text-stone-200" : "text-stone-800"
              )}>
                {getNodeTitle()}
              </span>
            </div>
            
            {/* 🎯 状态标签行 - 右移一些距离让"执行完成"对齐 */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-8">
              {/* 迭代计数显示 - 显示时加1，从1开始计数 */}
              {node.isIterationNode && node.totalIterations && (
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 font-serif",
                  isDark && "bg-stone-700/50 text-stone-300"
                )}>
                  {(node.currentIteration || 0) + 1}/{node.totalIterations}
                </span>
              )}

              {/* 🎯 循环计数显示 - 显示时加1，从1开始计数 */}
              {node.isLoopNode && node.maxLoops && (
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 font-serif",
                  isDark && "bg-stone-700/50 text-stone-300"
                )}>
                  {(node.currentLoop || 0) + 1}/{node.maxLoops}
                </span>
              )}
                
              {/* 并行分支进度指示 */}
              {node.isParallelNode && node.totalBranches && (
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 font-serif",
                  isDark && "bg-stone-700/50 text-stone-300"
                )}>
                  {node.completedBranches || 0}/{node.totalBranches}
                </span>
              )}
              
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full font-serif",
                node.status === 'running'
                  ? isDark
                    ? "bg-stone-600/40 text-stone-200"
                    : "bg-stone-300/60 text-stone-700"
                  : node.status === 'completed'
                    ? isDark
                      ? "bg-stone-500/40 text-stone-100"
                      : "bg-stone-200 text-stone-800"
                    : node.status === 'failed'
                      ? isDark
                        ? "bg-red-700/30 text-red-200"
                        : "bg-red-100 text-red-700"
                      : isDark
                        ? "bg-stone-700/50 text-stone-400"
                        : "bg-stone-200/80 text-stone-600"
              )}>
                {getStatusText()}
              </span>
            </div>
          </div>
        </div>
        
        {/* 右侧：计时信息 */}
        <div className="flex-shrink-0 w-16 text-right">
          {(node.status === 'running' || node.status === 'completed') && elapsedTime > 0 && (
            <div className={cn(
              "text-xs font-serif",
              isDark ? "text-stone-400" : "text-stone-500"
            )}>
              {formatTime(elapsedTime)}
            </div>
          )}
        </div>
      </div>
      
      {/* 🎯 迭代详情展开区域 */}
      {node.isIterationNode && node.iterations && isExpanded && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-250">
          {node.iterations.map((iteration, iterIndex) => (
            <div
              key={iteration.id}
              className={cn(
                "relative ml-6 pl-4 iteration-node",
                isDark ? "bg-stone-800/30" : "bg-stone-50/30",
                "flex items-center gap-3 px-3 py-2 rounded-md border transition-all duration-300 font-serif",
                iteration.status === 'running'
                  ? isDark
                    ? "bg-stone-700/50 border-stone-600"
                    : "bg-stone-200/50 border-stone-300"
                  : isDark
                    ? "bg-stone-600/30 border-stone-500"
                    : "bg-stone-100 border-stone-300"
              )}
            >
              <div className="flex-shrink-0">
                {iteration.status === 'running' ? (
                  <Loader2 className={cn("h-3 w-3 animate-spin", isDark ? "text-stone-400" : "text-stone-600")} />
                ) : iteration.status === 'completed' ? (
                  <CheckCircle className={cn("h-3 w-3", isDark ? "text-stone-400" : "text-stone-600")} />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <span className={cn("text-sm font-serif", isDark ? "text-stone-200" : "text-stone-800")}>
                  第 {iteration.index + 1} 轮迭代
                </span>
              </div>
              
              <div className="flex-shrink-0">
                {iteration.endTime && iteration.startTime && (
                  <span className={cn("text-xs font-serif", isDark ? "text-stone-400" : "text-stone-500")}>
                    {formatTime(iteration.endTime - iteration.startTime)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🎯 循环详情展开区域 */}
      {node.isLoopNode && node.loops && isExpanded && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-250">
          {node.loops.map((loop, loopIndex) => (
            <div
              key={loop.id}
              className={cn(
                "relative ml-6 pl-4 loop-node",
                isDark ? "bg-stone-800/30" : "bg-stone-50/30",
                "flex items-center gap-3 px-3 py-2 rounded-md border transition-all duration-300 font-serif",
                loop.status === 'running'
                  ? isDark
                    ? "bg-stone-700/50 border-stone-600"
                    : "bg-stone-200/50 border-stone-300"
                  : isDark
                    ? "bg-stone-600/30 border-stone-500"
                    : "bg-stone-100 border-stone-300"
              )}
            >
              <div className="flex-shrink-0">
                {loop.status === 'running' ? (
                  <Loader2 className={cn("h-3 w-3 animate-spin", isDark ? "text-stone-400" : "text-stone-600")} />
                ) : loop.status === 'completed' ? (
                  <CheckCircle className={cn("h-3 w-3", isDark ? "text-stone-400" : "text-stone-600")} />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <span className={cn("text-sm font-serif", isDark ? "text-stone-200" : "text-stone-800")}>
                  第 {loop.index + 1} 轮循环
                </span>
              </div>
              
              <div className="flex-shrink-0">
                {loop.endTime && loop.startTime && (
                  <span className={cn("text-xs font-serif", isDark ? "text-stone-400" : "text-stone-500")}>
                    {formatTime(loop.endTime - loop.startTime)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* 🎯 并行分支详情展开区域 */}
      {node.isParallelNode && node.parallelBranches && isExpanded && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-250">
          {node.parallelBranches.map((branch, branchIndex) => (
            <div
              key={branch.id}
              className={cn(
                "relative ml-6 pl-4 iteration-node",
                isDark ? "bg-stone-800/30" : "bg-stone-50/30",
                "flex items-center gap-3 px-3 py-2 rounded-md border transition-all duration-300 font-serif",
                branch.status === 'running'
                  ? isDark
                    ? "bg-stone-700/50 border-stone-600"
                    : "bg-stone-200/50 border-stone-300"
                  : isDark
                    ? "bg-stone-600/30 border-stone-500"
                    : "bg-stone-100 border-stone-300"
              )}
            >
              <div className="flex-shrink-0">
                {branch.status === 'running' ? (
                  <Loader2 className={cn("h-3 w-3 animate-spin", isDark ? "text-stone-400" : "text-stone-600")} />
                ) : branch.status === 'completed' ? (
                  <CheckCircle className={cn("h-3 w-3", isDark ? "text-stone-400" : "text-stone-600")} />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <span className={cn("text-sm font-serif", isDark ? "text-stone-200" : "text-stone-800")}>
                  {branch.name}
                </span>
              </div>
              
              <div className="flex-shrink-0">
                {branch.endTime && branch.startTime && (
                  <span className={cn("text-xs font-serif", isDark ? "text-stone-400" : "text-stone-500")}>
                    {formatTime(branch.endTime - branch.startTime)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 