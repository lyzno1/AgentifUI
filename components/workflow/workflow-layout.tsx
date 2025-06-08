"use client"

import React, { useState, useCallback, useEffect } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { useMobile } from '@lib/hooks/use-mobile'
import { cn } from '@lib/utils'
import { WorkflowInputForm, WorkflowInputFormRef } from './workflow-input-form'
import { WorkflowTracker } from './workflow-tracker'
import { ExecutionHistory } from './execution-history'
import { ResultViewer } from './workflow-tracker/result-viewer'
import { HistoryButton } from '@components/workflow/history-button'
import { MobileTabSwitcher } from '@components/workflow/mobile-tab-switcher'
import { ResizableSplitPane } from '@components/ui/resizable-split-pane'
import { useWorkflowHistoryStore } from '@lib/stores/workflow-history-store'
import { useWorkflowExecution } from '@lib/hooks/use-workflow-execution'
import { AlertCircle, RefreshCw, X } from 'lucide-react'

interface WorkflowLayoutProps {
  instanceId: string
}

type MobileTab = 'form' | 'tracker' | 'history'

/**
 * 工作流主布局组件
 * 
 * 布局特点：
 * - 桌面端：左右分栏布局（表单 + 跟踪器）
 * - 移动端：标签切换布局
 * - 可折叠的历史记录侧边栏
 * - 统一的状态管理和数据流
 */
export function WorkflowLayout({ instanceId }: WorkflowLayoutProps) {
  const { isDark } = useTheme()
  const isMobile = useMobile()
  
  // --- 新的工作流执行系统 ---
  const {
    isExecuting,
    progress,
    error,
    canRetry,
    nodes,
    currentNodeId,
    currentExecution,
    executionHistory,
    formData,
    formLocked,
    executeWorkflow,
    stopWorkflowExecution,
    retryExecution,
    resetExecution,
    resetAll,
    clearExecutionState,
    loadWorkflowHistory
  } = useWorkflowExecution(instanceId)
  
  // --- 保留原有状态管理 ---
  const { showHistory, setShowHistory } = useWorkflowHistoryStore()
  const [mobileActiveTab, setMobileActiveTab] = useState<MobileTab>('form')
  
  // --- ResultViewer 状态管理 ---
  const [showResultViewer, setShowResultViewer] = useState(false)
  const [selectedExecution, setSelectedExecution] = useState<any>(null)
  const [executionResult, setExecutionResult] = useState<any>(null)
  
  // --- 表单重置引用 ---
  const formResetRef = React.useRef<WorkflowInputFormRef>(null)
  
  // --- 工作流执行回调，现在使用真实的hook ---
  const handleExecuteWorkflow = useCallback(async (formData: Record<string, any>) => {
    console.log('[工作流布局] 开始执行工作流，输入数据:', formData)
    
    try {
      await executeWorkflow(formData)
    } catch (error) {
      console.error('[工作流布局] 执行失败:', error)
    }
  }, [executeWorkflow])
  
  // --- 节点状态更新回调 ---
  const handleNodeUpdate = useCallback((event: any) => {
    console.log('[节点更新]', event)
    // 注意：节点状态现在通过hook自动管理，不需要手动更新
  }, [])
  
  // --- 停止执行 ---
  const handleStopExecution = useCallback(async () => {
    console.log('[工作流布局] 停止执行')
    try {
      await stopWorkflowExecution()
    } catch (error) {
      console.error('[工作流布局] 停止执行失败:', error)
    }
  }, [stopWorkflowExecution])
  
  // --- 重试执行 ---
  const handleRetryExecution = useCallback(async () => {
    console.log('[工作流布局] 重试执行')
    try {
      await retryExecution()
    } catch (error) {
      console.error('[工作流布局] 重试执行失败:', error)
    }
  }, [retryExecution])
  
  // --- 完全重置（包括表单） ---
  const handleCompleteReset = useCallback(() => {
    console.log('[工作流布局] 完全重置')
    
    // 重置执行状态
    resetAll()
    
    // 重置表单
    if (formResetRef.current?.resetForm) {
      formResetRef.current.resetForm()
    }
  }, [resetAll])
  
  // --- 清除错误 ---
  const handleClearError = useCallback(() => {
    console.log('[工作流布局] 清除错误')
    clearExecutionState()
  }, [clearExecutionState])
  
  // --- 处理查看结果 ---
  const handleViewResult = useCallback((result: any, execution: any) => {
    console.log('[工作流布局] 查看执行结果:', execution)
    setExecutionResult(result)
    setSelectedExecution(execution)
    setShowResultViewer(true)
  }, [])
  
  // --- 错误提示组件 ---
  const ErrorBanner = ({ error, canRetry, onRetry, onDismiss }: {
    error: string
    canRetry: boolean
    onRetry: () => void
    onDismiss: () => void
  }) => (
    <div className={cn(
      "px-4 py-3 border-l-4 border-red-500 flex items-center gap-3",
      isDark ? "bg-red-900/20 text-red-200" : "bg-red-50 text-red-800"
    )}>
      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-serif">{error}</p>
      </div>
      <div className="flex items-center gap-2">
        {canRetry && (
          <button
            onClick={onRetry}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              isDark
                ? "hover:bg-red-800/50 text-red-300 hover:text-red-200"
                : "hover:bg-red-200/50 text-red-700 hover:text-red-800"
            )}
            title="重试"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={onDismiss}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            isDark
              ? "hover:bg-red-800/50 text-red-300 hover:text-red-200"
              : "hover:bg-red-200/50 text-red-700 hover:text-red-800"
          )}
          title="关闭"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  // --- 移动端布局 ---
  if (isMobile) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* 全局错误提示 */}
        {error && (
          <ErrorBanner
            error={error}
            canRetry={canRetry}
            onRetry={handleRetryExecution}
            onDismiss={handleClearError}
          />
        )}
        
        {/* 移动端标签切换器 */}
        <MobileTabSwitcher
          activeTab={mobileActiveTab}
          onTabChange={setMobileActiveTab}
          hasHistory={showHistory}
        />
        
        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden">
          {mobileActiveTab === 'form' && (
            <div className="h-full p-4">
              <WorkflowInputForm
                instanceId={instanceId}
                onExecute={handleExecuteWorkflow}
                isExecuting={isExecuting}
                ref={formResetRef}
              />
            </div>
          )}
          
          {mobileActiveTab === 'tracker' && (
            <div className="h-full">
              <WorkflowTracker
                isExecuting={isExecuting}
                executionResult={currentExecution?.outputs || null}
                currentExecution={currentExecution}
                onNodeUpdate={handleNodeUpdate}
                onStop={handleStopExecution}
                onRetry={handleRetryExecution}
                onReset={handleCompleteReset}
              />
            </div>
          )}
          
          {mobileActiveTab === 'history' && (
            <div className="h-full">
              <ExecutionHistory
                instanceId={instanceId}
                onClose={() => setMobileActiveTab('form')}
                isMobile={true}
                onViewResult={handleViewResult}
              />
            </div>
          )}
        </div>
      </div>
    )
  }
  
  // --- 桌面端布局 ---
  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* 全局错误提示 */}
      {error && (
        <ErrorBanner
          error={error}
          canRetry={canRetry}
          onRetry={handleRetryExecution}
          onDismiss={handleClearError}
        />
      )}
      
      <div className="flex-1 flex overflow-hidden">
        {/* 主内容区域 */}
        <div className={cn(
          "flex-1 relative transition-all duration-300 overflow-hidden",
          showHistory ? "lg:w-2/3" : "w-full"
        )}>
          <ResizableSplitPane
            storageKey="workflow-split-pane"
            defaultLeftWidth={50}
            minLeftWidth={25}
            maxLeftWidth={75}
            left={
              <div className="h-full flex flex-col overflow-hidden hide-all-scrollbars">
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-8 pt-4 pb-12 no-scrollbar">
                  <WorkflowInputForm
                    instanceId={instanceId}
                    onExecute={handleExecuteWorkflow}
                    isExecuting={isExecuting}
                    ref={formResetRef}
                  />
                </div>
              </div>
            }
            right={
              <div className="h-full flex flex-col overflow-hidden hide-all-scrollbars">
                <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
                  <WorkflowTracker
                    isExecuting={isExecuting}
                    executionResult={currentExecution?.outputs || null}
                    currentExecution={currentExecution}
                    onNodeUpdate={handleNodeUpdate}
                    onStop={handleStopExecution}
                    onRetry={handleRetryExecution}
                    onReset={handleCompleteReset}
                  />
                </div>
              </div>
            }
          />
        </div>
        
        {/* 历史记录侧边栏 */}
        {showHistory && (
          <div className={cn(
            "w-80 min-w-72 border-l overflow-hidden",
            "transition-all duration-300 ease-in-out",
            "transform-gpu", // 使用GPU加速
            isDark ? "border-stone-700" : "border-stone-200"
          )}>
            <ExecutionHistory
              instanceId={instanceId}
              onClose={() => setShowHistory(false)}
              isMobile={false}
              onViewResult={handleViewResult}
            />
          </div>
        )}
      </div>
      
      {/* --- 结果查看器（页面层级，带模糊背景） --- */}
      {showResultViewer && executionResult && selectedExecution && (
        <ResultViewer
          result={executionResult}
          execution={selectedExecution}
          onClose={() => {
            setShowResultViewer(false)
            setSelectedExecution(null)
            setExecutionResult(null)
          }}
        />
      )}
    </div>
  )
} 