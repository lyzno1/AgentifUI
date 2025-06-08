import { create } from 'zustand'
import type { AppExecution } from '@lib/types/database'

/**
 * 工作流迭代接口
 */
export interface WorkflowIteration {
  id: string
  index: number
  status: 'running' | 'completed' | 'failed'
  startTime: number
  endTime?: number
  inputs?: any
  outputs?: any
}

/**
 * 工作流并行分支接口
 */
export interface WorkflowParallelBranch {
  id: string
  name: string
  status: 'running' | 'completed' | 'failed'
  startTime: number
  endTime?: number
  inputs?: any
  outputs?: any
}

/**
 * 工作流节点状态接口
 */
export interface WorkflowNode {
  id: string
  title: string
  type?: string // 节点类型
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime?: number
  endTime?: number
  description: string
  visible: boolean
  error?: string
  
  // 🎯 新增：迭代支持
  isIterationNode?: boolean
  totalIterations?: number
  currentIteration?: number
  iterations?: WorkflowIteration[]
  isInIteration?: boolean // 是否是迭代中的子节点
  
  // 🎯 新增：并行分支支持
  isParallelNode?: boolean
  totalBranches?: number
  completedBranches?: number
  parallelBranches?: WorkflowParallelBranch[]
}

/**
 * 工作流执行状态接口
 */
interface WorkflowExecutionState {
  // --- 执行状态 ---
  isExecuting: boolean
  executionProgress: number // 0-100
  
  // --- 节点跟踪 ---
  nodes: WorkflowNode[]
  currentNodeId: string | null
  
  // --- 表单管理 ---
  formData: Record<string, any>
  formLocked: boolean
  
  // --- 错误处理 ---
  error: string | null
  canRetry: boolean
  
  // --- 历史记录 ---
  executionHistory: AppExecution[]
  
  // --- Dify标识 ---
  difyTaskId: string | null
  difyWorkflowRunId: string | null
  
  // --- 当前执行记录 ---
  currentExecution: AppExecution | null
  
  // 🎯 新增：迭代和并行分支状态
  iterationExpandedStates: Record<string, boolean>
  
  // --- Actions ---
  startExecution: (formData: Record<string, any>) => void
  stopExecution: () => void
  setExecutionProgress: (progress: number) => void
  
  // --- 节点管理 ---
  addNode: (node: WorkflowNode) => void
  updateNode: (nodeId: string, updates: Partial<WorkflowNode>) => void
  onNodeStarted: (nodeId: string, title: string, description: string) => void
  onNodeFinished: (nodeId: string, success: boolean, error?: string) => void
  resetNodes: () => void
  
  // --- 表单管理 ---
  setFormData: (data: Record<string, any>) => void
  lockForm: () => void
  unlockForm: () => void
  resetFormData: () => void
  
  // --- 错误管理 ---
  setError: (error: string | null, canRetry?: boolean) => void
  clearError: () => void
  
  // --- 历史记录管理 ---
  setExecutionHistory: (history: AppExecution[]) => void
  addExecutionToHistory: (execution: AppExecution) => void
  
  // --- Dify标识管理 ---
  setDifyTaskId: (taskId: string | null) => void
  setDifyWorkflowRunId: (runId: string | null) => void
  
  // --- 当前执行记录管理 ---
  setCurrentExecution: (execution: AppExecution | null) => void
  updateCurrentExecution: (updates: Partial<AppExecution>) => void
  
  // 🎯 新增：迭代和并行分支管理
  addIteration: (nodeId: string, iteration: WorkflowIteration) => void
  updateIteration: (nodeId: string, iterationId: string, updates: Partial<WorkflowIteration>) => void
  completeIteration: (nodeId: string, iterationId: string) => void
  addParallelBranch: (nodeId: string, branch: WorkflowParallelBranch) => void
  updateParallelBranch: (nodeId: string, branchId: string, updates: Partial<WorkflowParallelBranch>) => void
  completeParallelBranch: (nodeId: string, branchId: string, status: 'completed' | 'failed') => void
  toggleIterationExpanded: (nodeId: string) => void
  
  // 🎯 新增：SSE事件处理
  handleNodeEvent: (event: any) => void
  
  // --- 重置状态 ---
  reset: () => void
  clearAll: () => void // 完全清空所有状态，包括历史记录
  clearExecutionState: () => void // 仅清空执行相关状态，保留表单数据和历史记录
}

/**
 * 工作流执行状态管理Store
 * 
 * 核心职责：
 * - 管理工作流执行的完整生命周期状态
 * - 跟踪节点执行进度和状态变化
 * - 管理表单数据和锁定状态
 * - 处理错误和重试逻辑
 * - 维护执行历史记录
 * - 同步Dify API标识符
 * - 提供多种清空状态的方法
 */
export const useWorkflowExecutionStore = create<WorkflowExecutionState>((set, get) => ({
  // --- 初始状态 ---
  isExecuting: false,
  executionProgress: 0,
  nodes: [],
  currentNodeId: null,
  formData: {},
  formLocked: false,
  error: null,
  canRetry: false,
  executionHistory: [],
  difyTaskId: null,
  difyWorkflowRunId: null,
  currentExecution: null,
  iterationExpandedStates: {},
  
  // --- 执行控制 ---
  startExecution: (formData: Record<string, any>) => {
    console.log('[工作流Store] 开始执行，表单数据:', formData)
    set({
      isExecuting: true,
      executionProgress: 0,
      formData,
      formLocked: true,
      error: null,
      canRetry: false,
      nodes: [],
      currentNodeId: null,
      difyTaskId: null,
      difyWorkflowRunId: null
    })
  },
  
  stopExecution: () => {
    console.log('[工作流Store] 停止执行')
    set((state) => ({
      isExecuting: false,
      formLocked: false,
      currentNodeId: null,
      // 将所有运行中的节点标记为停止状态
      nodes: state.nodes.map(node => {
        if (node.status === 'running') {
          return { 
            ...node, 
            status: 'failed', // 保持为failed，因为这是中断的执行
            error: '用户手动停止',
            endTime: Date.now(),
            description: node.title + ' (已停止)'
          }
        }
        // 同时处理迭代中的节点
        if (node.iterations) {
          return {
            ...node,
            iterations: node.iterations.map(iteration => 
              iteration.status === 'running'
                ? { ...iteration, status: 'failed', endTime: Date.now() }
                : iteration
            )
          }
        }
        // 同时处理并行分支中的节点
        if (node.parallelBranches) {
          return {
            ...node,
            parallelBranches: node.parallelBranches.map(branch => 
              branch.status === 'running'
                ? { ...branch, status: 'failed', endTime: Date.now() }
                : branch
            )
          }
        }
        return node
      })
    }))
  },
  
  setExecutionProgress: (progress: number) => {
    set({ executionProgress: Math.max(0, Math.min(100, progress)) })
  },
  
  // --- 节点管理 ---
  addNode: (node: WorkflowNode) => {
    console.log('[工作流Store] 添加节点:', node)
    set((state) => ({
      nodes: [...state.nodes, node]
    }))
  },
  
  updateNode: (nodeId: string, updates: Partial<WorkflowNode>) => {
    console.log('[工作流Store] 更新节点:', nodeId, updates)
    set((state) => ({
      nodes: state.nodes.map(node =>
        node.id === nodeId ? { ...node, ...updates } : node
      )
    }))
  },
  
  onNodeStarted: (nodeId: string, title: string, description: string) => {
    console.log('[工作流Store] 节点开始:', nodeId, title)
    const now = Date.now()
    set((state) => {
      const existingNode = state.nodes.find(n => n.id === nodeId)
      if (existingNode) {
        // 更新现有节点
        return {
          currentNodeId: nodeId,
          nodes: state.nodes.map(node =>
            node.id === nodeId
              ? { ...node, status: 'running', startTime: now, description, visible: true }
              : node
          )
        }
      } else {
        // 创建新节点
        const newNode: WorkflowNode = {
          id: nodeId,
          title,
          status: 'running',
          startTime: now,
          description,
          visible: true
        }
        return {
          currentNodeId: nodeId,
          nodes: [...state.nodes, newNode]
        }
      }
    })
  },
  
  onNodeFinished: (nodeId: string, success: boolean, error?: string) => {
    console.log('[工作流Store] 节点完成:', nodeId, success, error)
    const now = Date.now()
    set((state) => ({
      nodes: state.nodes.map(node =>
        node.id === nodeId
          ? {
              ...node,
              status: success ? 'completed' : 'failed',
              endTime: now,
              error: error || undefined,
              description: success 
                ? node.title + '完成' 
                : error || '执行失败'
            }
          : node
      ),
      currentNodeId: success ? null : state.currentNodeId
    }))
    
    // 计算执行进度
    const { nodes } = get()
    const completedNodes = nodes.filter(n => n.status === 'completed' || n.status === 'failed').length
    const progress = nodes.length > 0 ? (completedNodes / nodes.length) * 100 : 0
    set({ executionProgress: progress })
  },
  
  resetNodes: () => {
    console.log('[工作流Store] 重置节点')
    set({
      nodes: [],
      currentNodeId: null,
      executionProgress: 0
    })
  },
  
  // --- 表单管理 ---
  setFormData: (data: Record<string, any>) => {
    set({ formData: data })
  },
  
  lockForm: () => {
    set({ formLocked: true })
  },
  
  unlockForm: () => {
    set({ formLocked: false })
  },
  
  resetFormData: () => {
    console.log('[工作流Store] 重置表单数据')
    set({ 
      formData: {},
      formLocked: false
    })
  },
  
  // --- 错误管理 ---
  setError: (error: string | null, canRetry: boolean = false) => {
    console.log('[工作流Store] 设置错误:', error, '可重试:', canRetry)
    set({ 
      error, 
      canRetry,
      isExecuting: false,
      formLocked: false
    })
  },
  
  clearError: () => {
    set({ error: null, canRetry: false })
  },
  
  // --- 历史记录管理 ---
  setExecutionHistory: (history: AppExecution[]) => {
    set({ executionHistory: history })
  },
  
  addExecutionToHistory: (execution: AppExecution) => {
    console.log('[工作流Store] 添加执行记录到历史:', execution.id)
    set((state) => ({
      executionHistory: [execution, ...state.executionHistory]
    }))
  },
  
  // --- Dify标识管理 ---
  setDifyTaskId: (taskId: string | null) => {
    console.log('[工作流Store] 设置Dify任务ID:', taskId)
    set({ difyTaskId: taskId })
  },
  
  setDifyWorkflowRunId: (runId: string | null) => {
    console.log('[工作流Store] 设置Dify工作流运行ID:', runId)
    set({ difyWorkflowRunId: runId })
  },
  
  // --- 当前执行记录管理 ---
  setCurrentExecution: (execution: AppExecution | null) => {
    console.log('[工作流Store] 设置当前执行记录:', execution?.id)
    set({ currentExecution: execution })
  },
  
  updateCurrentExecution: (updates: Partial<AppExecution>) => {
    console.log('[工作流Store] 更新当前执行记录:', updates)
    set((state) => ({
      currentExecution: state.currentExecution
        ? { ...state.currentExecution, ...updates }
        : null
    }))
  },
  
  // 🎯 新增：迭代和并行分支管理
  addIteration: (nodeId: string, iteration: WorkflowIteration) => {
    console.log('[工作流Store] 添加迭代:', nodeId, iteration)
    set((state) => ({
      nodes: state.nodes.map(node =>
        node.id === nodeId
          ? {
              ...node,
              iterations: [...(node.iterations || []), iteration]
            }
          : node
      )
    }))
  },
  
  updateIteration: (nodeId: string, iterationId: string, updates: Partial<WorkflowIteration>) => {
    console.log('[工作流Store] 更新迭代:', nodeId, iterationId, updates)
    set((state) => ({
      nodes: state.nodes.map(node =>
        node.id === nodeId
          ? {
              ...node,
              iterations: node.iterations?.map(iter =>
                iter.id === iterationId ? { ...iter, ...updates } : iter
              ) || []
            }
          : node
      )
    }))
  },
  
  completeIteration: (nodeId: string, iterationId: string) => {
    console.log('[工作流Store] 完成迭代:', nodeId, iterationId)
    get().updateIteration(nodeId, iterationId, {
      status: 'completed',
      endTime: Date.now()
    })
  },
  
  addParallelBranch: (nodeId: string, branch: WorkflowParallelBranch) => {
    console.log('[工作流Store] 添加并行分支:', nodeId, branch)
    set((state) => ({
      nodes: state.nodes.map(node =>
        node.id === nodeId
          ? {
              ...node,
              parallelBranches: [...(node.parallelBranches || []), branch]
            }
          : node
      )
    }))
  },
  
  updateParallelBranch: (nodeId: string, branchId: string, updates: Partial<WorkflowParallelBranch>) => {
    console.log('[工作流Store] 更新并行分支:', nodeId, branchId, updates)
    set((state) => ({
      nodes: state.nodes.map(node =>
        node.id === nodeId
          ? {
              ...node,
              parallelBranches: node.parallelBranches?.map(branch =>
                branch.id === branchId ? { ...branch, ...updates } : branch
              ) || []
            }
          : node
      )
    }))
  },
  
  completeParallelBranch: (nodeId: string, branchId: string, status: 'completed' | 'failed') => {
    console.log('[工作流Store] 完成并行分支:', nodeId, branchId, status)
    get().updateParallelBranch(nodeId, branchId, {
      status,
      endTime: Date.now()
    })
  },
  
  toggleIterationExpanded: (nodeId: string) => {
    console.log('[工作流Store] 切换迭代展开状态:', nodeId)
    set((state) => ({
      iterationExpandedStates: {
        ...state.iterationExpandedStates,
        [nodeId]: !state.iterationExpandedStates[nodeId]
      }
    }))
  },
  
  // 🎯 新增：SSE事件处理 - 借鉴chatflow的实现
  handleNodeEvent: (event: any) => {
    console.log('[工作流Store] 处理节点事件:', event.event, event.data)
    
    switch (event.event) {
      case 'node_started':
        const { node_id, node_type, title } = event.data
        get().onNodeStarted(node_id, title || `${node_type} 节点`, '开始执行')
        break
        
      case 'node_finished':
        const { node_id: finishedNodeId, status, error } = event.data
        const success = status === 'succeeded'
        get().onNodeFinished(finishedNodeId, success, error)
        break
        
      case 'iteration_started':
        const { node_id: iterNodeId, iteration_id, iteration_index, total_iterations } = event.data
        
        // 创建或更新迭代节点
        const existingNode = get().nodes.find(n => n.id === iterNodeId)
        if (!existingNode) {
          get().addNode({
            id: iterNodeId,
            title: '循环迭代',
            type: 'iteration',
            status: 'running',
            startTime: Date.now(),
            description: '准备迭代',
            visible: true,
            isIterationNode: true,
            totalIterations: total_iterations,
            currentIteration: 0,
            iterations: []
          })
        } else {
          get().updateNode(iterNodeId, {
            isIterationNode: true,
            totalIterations: total_iterations,
            currentIteration: 0,
            status: 'running'
          })
        }
        
        // 自动展开迭代节点
        set((state) => ({
          iterationExpandedStates: {
            ...state.iterationExpandedStates,
            [iterNodeId]: true
          }
        }))
        break
        
      case 'iteration_next':
        const { node_id: nextNodeId, iteration_id: nextIterationId, iteration_index: nextIndex } = event.data
        
        // 更新当前迭代轮次
        const currentNode = get().nodes.find(n => n.id === nextNodeId)
        if (currentNode) {
          const newIndex = nextIndex !== undefined ? nextIndex : (currentNode.currentIteration || 0) + 1
          get().updateNode(nextNodeId, {
            currentIteration: newIndex
          })
        }
        break
        
      case 'iteration_completed':
        const { node_id: completedNodeId } = event.data
        get().updateNode(completedNodeId, {
          status: 'completed',
          endTime: Date.now(),
          description: '迭代完成'
        })
        break
        
      case 'parallel_branch_started':
        const { node_id: parallelNodeId, parallel_id, parallel_run_id } = event.data
        
        // 创建或更新并行分支节点
        const existingParallelNode = get().nodes.find(n => n.id === parallelNodeId)
        if (!existingParallelNode) {
          get().addNode({
            id: parallelNodeId,
            title: '并行分支',
            type: 'parallel',
            status: 'running',
            startTime: Date.now(),
            description: '并行执行中',
            visible: true,
            isParallelNode: true,
            totalBranches: 1,
            completedBranches: 0,
            parallelBranches: []
          })
        }
        
        // 添加分支
        get().addParallelBranch(parallelNodeId, {
          id: parallel_run_id,
          name: `分支 ${parallel_id}`,
          status: 'running',
          startTime: Date.now()
        })
        break
        
      case 'parallel_branch_finished':
        const { node_id: finishedParallelNodeId, parallel_run_id: finishedRunId, status: branchStatus } = event.data
        const branchSuccess = branchStatus === 'succeeded'
        
        get().completeParallelBranch(
          finishedParallelNodeId,
          finishedRunId,
          branchSuccess ? 'completed' : 'failed'
        )
        
        // 更新完成分支数
        const parallelNode = get().nodes.find(n => n.id === finishedParallelNodeId)
        if (parallelNode) {
          const completedCount = (parallelNode.parallelBranches || []).filter(b => 
            b.status === 'completed' || b.status === 'failed'
          ).length
          
          get().updateNode(finishedParallelNodeId, {
            completedBranches: completedCount
          })
          
          // 如果所有分支都完成了，标记节点为完成
          if (completedCount === parallelNode.totalBranches) {
            get().updateNode(finishedParallelNodeId, {
              status: 'completed',
              endTime: Date.now(),
              description: '并行执行完成'
            })
          }
        }
        break
        
      case 'workflow_started':
        get().startExecution(get().formData)
        break
        
      case 'workflow_finished':
        set({ isExecuting: false, currentNodeId: null })
        break
        
      case 'workflow_interrupted':
        get().stopExecution()
        get().setError('工作流被中断')
        break
        
      default:
        console.log('[工作流Store] 未处理的事件类型:', event.event)
    }
  },
  
  // --- 重置状态 ---
  reset: () => {
    console.log('[工作流Store] 重置所有状态（保留历史记录）')
    set({
      isExecuting: false,
      executionProgress: 0,
      nodes: [],
      currentNodeId: null,
      formData: {},
      formLocked: false,
      error: null,
      canRetry: false,
      difyTaskId: null,
      difyWorkflowRunId: null,
      currentExecution: null,
      iterationExpandedStates: {}
      // 注意：不重置 executionHistory，保持历史记录
    })
  },
  
  clearAll: () => {
    console.log('[工作流Store] 完全清空所有状态')
    set({
      isExecuting: false,
      executionProgress: 0,
      nodes: [],
      currentNodeId: null,
      formData: {},
      formLocked: false,
      error: null,
      canRetry: false,
      executionHistory: [], // 清空历史记录
      difyTaskId: null,
      difyWorkflowRunId: null,
      currentExecution: null,
      iterationExpandedStates: {}
    })
  },
  
  clearExecutionState: () => {
    console.log('[工作流Store] 清空执行状态（保留表单数据和历史记录）')
    set((state) => ({
      isExecuting: false,
      executionProgress: 0,
      nodes: [],
      currentNodeId: null,
      formLocked: false,
      error: null,
      canRetry: false,
      difyTaskId: null,
      difyWorkflowRunId: null,
      currentExecution: null,
      iterationExpandedStates: {}
      // 保留：formData, executionHistory
    }))
  }
}))

// --- 选择器函数，用于优化组件重渲染 ---
export const workflowExecutionSelectors = {
  // 执行状态选择器
  executionStatus: (state: WorkflowExecutionState) => ({
    isExecuting: state.isExecuting,
    progress: state.executionProgress,
    error: state.error,
    canRetry: state.canRetry
  }),
  
  // 节点状态选择器  
  nodesStatus: (state: WorkflowExecutionState) => ({
    nodes: state.nodes,
    currentNodeId: state.currentNodeId
  }),
  
  // 表单状态选择器
  formStatus: (state: WorkflowExecutionState) => ({
    formData: state.formData,
    formLocked: state.formLocked
  }),
  
  // 当前执行选择器
  currentExecution: (state: WorkflowExecutionState) => state.currentExecution,
  
  // 历史记录选择器
  executionHistory: (state: WorkflowExecutionState) => state.executionHistory,
  
  // Dify标识选择器
  difyIds: (state: WorkflowExecutionState) => ({
    taskId: state.difyTaskId,
    workflowRunId: state.difyWorkflowRunId
  })
} 