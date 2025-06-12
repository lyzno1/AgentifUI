import { create } from 'zustand'

export interface ChatflowNode {
  id: string
  title: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime?: number
  endTime?: number
  description?: string
  type?: string
  visible?: boolean

  // 🎯 新增：迭代支持
  iterations?: ChatflowIteration[]
  currentIteration?: number
  totalIterations?: number
  isIterationNode?: boolean

  // 🎯 新增：节点是否在迭代中
  isInIteration?: boolean
  iterationIndex?: number

  // 🎯 新增：节点是否在循环中
  isInLoop?: boolean
  loopIndex?: number

  // 🎯 新增：并行分支支持
  parallelBranches?: ChatflowParallelBranch[]
  totalBranches?: number
  completedBranches?: number
  isParallelNode?: boolean

  // 🎯 新增：循环支持
  loops?: ChatflowLoop[]
  currentLoop?: number
  totalLoops?: number
  isLoopNode?: boolean
  maxLoops?: number
}

// 🎯 新增：迭代数据结构
export interface ChatflowIteration {
  id: string
  index: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime: number
  endTime?: number
  inputs?: Record<string, any>
  outputs?: Record<string, any>
  error?: string
  description?: string
}

// 🎯 新增：并行分支数据结构
export interface ChatflowParallelBranch {
  id: string
  index: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime: number
  endTime?: number
  inputs?: Record<string, any>
  outputs?: Record<string, any>
  error?: string
  description?: string
}

// 🎯 新增：循环数据结构
export interface ChatflowLoop {
  id: string
  index: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime: number
  endTime?: number
  inputs?: Record<string, any>
  outputs?: Record<string, any>
  error?: string
  description?: string
  maxLoops?: number // 最大循环次数限制
}

interface ChatflowExecutionState {
  // 节点状态
  nodes: ChatflowNode[]
  currentNodeId: string | null
  isExecuting: boolean

  // 🎯 新增：当前迭代状态跟踪
  currentIteration: {
    nodeId: string
    iterationId: string
    index: number
    totalIterations: number
    startTime: number
    status: 'running' | 'completed'
  } | null

  // 🎯 新增：当前循环状态跟踪
  currentLoop: {
    nodeId: string
    loopId: string
    index: number
    maxLoops?: number
    startTime: number
    status: 'running' | 'completed'
  } | null

  // 🎯 新增：迭代节点的展开状态
  iterationExpandedStates: Record<string, boolean>
  
  // 🎯 新增：循环节点的展开状态
  loopExpandedStates: Record<string, boolean>

  // 执行进度
  executionProgress: {
    current: number
    total: number
    percentage: number
  }

  // 错误状态
  error: string | null
  canRetry: boolean

  // Actions
  startExecution: () => void
  stopExecution: () => void
  resetExecution: () => void

  addNode: (node: ChatflowNode) => void
  updateNode: (nodeId: string, updates: Partial<ChatflowNode>) => void
  setCurrentNode: (nodeId: string | null) => void

  // 🎯 新增：迭代相关的actions
  addIteration: (nodeId: string, iteration: ChatflowIteration) => void
  updateIteration: (nodeId: string, iterationId: string, updates: Partial<ChatflowIteration>) => void
  completeIteration: (nodeId: string, iterationId: string) => void

  // 🎯 新增：并行分支相关的actions
  addParallelBranch: (nodeId: string, branch: ChatflowParallelBranch) => void
  updateParallelBranch: (nodeId: string, branchId: string, updates: Partial<ChatflowParallelBranch>) => void
  completeParallelBranch: (nodeId: string, branchId: string, status: 'completed' | 'failed') => void

  // 🎯 新增：循环相关的actions
  addLoop: (nodeId: string, loop: ChatflowLoop) => void
  updateLoop: (nodeId: string, loopId: string, updates: Partial<ChatflowLoop>) => void
  completeLoop: (nodeId: string, loopId: string) => void

  setError: (error: string | null) => void
  setCanRetry: (canRetry: boolean) => void

  // 🎯 新增：迭代展开状态管理
  toggleIterationExpanded: (nodeId: string) => void
  
  // 🎯 新增：循环展开状态管理
  toggleLoopExpanded: (nodeId: string) => void

  // 从 SSE 事件更新状态
  handleNodeEvent: (event: any) => void
}

export const useChatflowExecutionStore = create<ChatflowExecutionState>((set, get) => ({
  // 初始状态
  nodes: [],
  currentNodeId: null,
  isExecuting: false,
  currentIteration: null,
  currentLoop: null,
  iterationExpandedStates: {},
  loopExpandedStates: {},

  executionProgress: {
    current: 0,
    total: 0,
    percentage: 0
  },

  error: null,
  canRetry: false,

  // Actions
  startExecution: () => {
    console.log('[ChatflowExecution] 开始执行')
    set({
      isExecuting: true,
      error: null,
      canRetry: false,
      nodes: [],
      currentNodeId: null,
      executionProgress: { current: 0, total: 0, percentage: 0 }
    })
  },

  stopExecution: () => {
    const { nodes } = get()
    const updatedNodes = nodes.map(node =>
      node.status === 'running'
        ? { ...node, status: 'failed' as const, endTime: Date.now() }
        : node
    )

    set({
      isExecuting: false,
      nodes: updatedNodes,
      currentNodeId: null,
      canRetry: true
    })
  },

  resetExecution: () => {
    set({
      nodes: [],
      currentNodeId: null,
      isExecuting: false,
      executionProgress: { current: 0, total: 0, percentage: 0 },
      error: null,
      canRetry: false
    })
  },

  addNode: (node: ChatflowNode) => {
    set(state => ({
      nodes: [...state.nodes, node]
    }))
  },

  updateNode: (nodeId: string, updates: Partial<ChatflowNode>) => {
    set(state => ({
      nodes: state.nodes.map(node =>
        node.id === nodeId ? { ...node, ...updates } : node
      )
    }))

    // 更新进度
    const { nodes } = get()
    const completedNodes = nodes.filter(n => n.status === 'completed').length
    const totalNodes = nodes.length

    set({
      executionProgress: {
        current: completedNodes,
        total: totalNodes,
        percentage: totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0
      }
    })
  },

  setCurrentNode: (nodeId: string | null) => {
    set({ currentNodeId: nodeId })
  },

  // 🎯 新增：迭代相关的actions
  addIteration: (nodeId: string, iteration: ChatflowIteration) => {
    set(state => ({
      nodes: state.nodes.map(node =>
        node.id === nodeId ? { ...node, iterations: [...(node.iterations || []), iteration] } : node
      )
    }))
  },

  updateIteration: (nodeId: string, iterationId: string, updates: Partial<ChatflowIteration>) => {
    set(state => ({
      nodes: state.nodes.map(node =>
        node.id === nodeId ? {
          ...node,
          iterations: node.iterations?.map(iteration =>
            iteration.id === iterationId ? { ...iteration, ...updates } : iteration
          )
        } : node
      )
    }))
  },

  completeIteration: (nodeId: string, iterationId: string) => {
    set(state => ({
      nodes: state.nodes.map(node =>
        node.id === nodeId ? {
          ...node,
          iterations: node.iterations?.filter(iteration => iteration.id !== iterationId)
        } : node
      )
    }))
  },

  // 🎯 新增：并行分支相关的actions
  addParallelBranch: (nodeId: string, branch: ChatflowParallelBranch) => {
    set(state => ({
      nodes: state.nodes.map(node =>
        node.id === nodeId ? { ...node, parallelBranches: [...(node.parallelBranches || []), branch] } : node
      )
    }))
  },

  updateParallelBranch: (nodeId: string, branchId: string, updates: Partial<ChatflowParallelBranch>) => {
    set(state => ({
      nodes: state.nodes.map(node =>
        node.id === nodeId ? {
          ...node,
          parallelBranches: node.parallelBranches?.map(branch =>
            branch.id === branchId ? { ...branch, ...updates } : branch
          )
        } : node
      )
    }))
  },

  completeParallelBranch: (nodeId: string, branchId: string, status: 'completed' | 'failed') => {
    set(state => ({
      nodes: state.nodes.map(node =>
        node.id === nodeId ? {
          ...node,
          parallelBranches: node.parallelBranches?.filter(branch => branch.id !== branchId)
        } : node
      )
    }))
  },

  // 🎯 新增：循环相关的actions实现
  addLoop: (nodeId: string, loop: ChatflowLoop) => {
    set(state => ({
      nodes: state.nodes.map(node =>
        node.id === nodeId ? { ...node, loops: [...(node.loops || []), loop] } : node
      )
    }))
  },

  updateLoop: (nodeId: string, loopId: string, updates: Partial<ChatflowLoop>) => {
    set(state => ({
      nodes: state.nodes.map(node =>
        node.id === nodeId ? {
          ...node,
          loops: node.loops?.map(loop =>
            loop.id === loopId ? { ...loop, ...updates } : loop
          )
        } : node
      )
    }))
  },

  completeLoop: (nodeId: string, loopId: string) => {
    set(state => ({
      nodes: state.nodes.map(node =>
        node.id === nodeId ? {
          ...node,
          loops: node.loops?.filter(loop => loop.id !== loopId)
        } : node
      )
    }))
  },

  setError: (error: string | null) => {
    set({ error, canRetry: !!error })
  },

  setCanRetry: (canRetry: boolean) => {
    set({ canRetry })
  },

  // 🎯 新增：切换迭代展开状态
  toggleIterationExpanded: (nodeId: string) => {
    set(state => ({
      iterationExpandedStates: {
        ...state.iterationExpandedStates,
        [nodeId]: !state.iterationExpandedStates[nodeId]
      }
    }))
  },
  
  // 🎯 新增：切换循环展开状态
  toggleLoopExpanded: (nodeId: string) => {
    set(state => ({
      loopExpandedStates: {
        ...state.loopExpandedStates,
        [nodeId]: !state.loopExpandedStates[nodeId]
      }
    }))
  },

  // 处理 SSE 事件
  handleNodeEvent: (event: any) => {
    const { nodes } = get()

    console.log('[ChatflowExecution] 🎯 收到节点事件:', event.event)
    console.log('[ChatflowExecution] 节点数据:', event.data)
    console.log('[ChatflowExecution] 当前节点数量:', nodes.length)

    switch (event.event) {
            case 'node_started':
        // 添加或更新节点为运行状态
        const { node_id, title, node_type } = event.data
        const nodeTitle = title || node_type || `节点 ${nodes.length + 1}`
        const { currentIteration } = get()
        
        // 检查是否在迭代中（排除迭代容器节点本身）
        const isInIteration = !!(currentIteration && currentIteration.status === 'running' && currentIteration.nodeId !== node_id)
        
        // 检查是否在循环中（排除循环容器节点本身）
        const { currentLoop } = get()
        const isInLoop = !!(currentLoop && currentLoop.status === 'running' && currentLoop.nodeId !== node_id)
        
        console.log('[ChatflowExecution] 🎯 node_started:', {
          nodeId: node_id,
          nodeTitle,
          isInLoop,
          currentLoopNodeId: currentLoop?.nodeId,
          isLoopContainer: currentLoop?.nodeId === node_id
        })
        
        const existingNodeIndex = nodes.findIndex(n => n.id === node_id)
        
        if (existingNodeIndex >= 0) {
          // 更新现有节点
          get().updateNode(node_id, {
            status: 'running',
            startTime: Date.now(),
            description: '正在执行...',
            type: node_type,
            isInIteration: isInIteration,
            iterationIndex: isInIteration ? currentIteration.index : undefined,
            isInLoop: isInLoop,
            loopIndex: isInLoop ? currentLoop.index : undefined
          })
        } else {
          // 添加新节点
          get().addNode({
            id: node_id,
            title: nodeTitle,
            status: 'running',
            startTime: Date.now(),
            description: '正在执行...',
            type: node_type,
            visible: true,
            isInIteration: isInIteration,
            iterationIndex: isInIteration ? currentIteration.index : undefined,
            isInLoop: isInLoop,
            loopIndex: isInLoop ? currentLoop.index : undefined
          })
        }

        get().setCurrentNode(node_id)
        break

      case 'node_finished':
        // 更新节点为完成状态
        const { node_id: finishedNodeId, status, error } = event.data
        const nodeStatus = status === 'succeeded' ? 'completed' : 'failed'

        get().updateNode(finishedNodeId, {
          status: nodeStatus,
          endTime: Date.now(),
          description: nodeStatus === 'completed' ? '执行完成' : (error || '执行失败')
        })
        break

      case 'node_failed':
        // 更新节点为失败状态
        get().updateNode(event.data.node_id, {
          status: 'failed',
          endTime: Date.now(),
          description: event.data.error || '执行失败'
        })

        get().setError(event.data.error || '节点执行失败')
        break

      case 'workflow_started':
        get().startExecution()
        break

      case 'workflow_finished':
        set({ isExecuting: false, currentNodeId: null })
        break

      case 'workflow_interrupted':
        get().stopExecution()
        get().setError('工作流被中断')
        break

      case 'iteration_started':
        const { node_id: iterNodeId, iteration_id, iteration_index, title: iterTitle, node_type: iterNodeType } = event.data
        const totalIterations = event.data.metadata?.iterator_length || event.data.total_iterations || 1

        // 🎯 修复：迭代开始时应该从0开始，第一次iteration_next才是第1轮
        const initialIndex = 0

        // 设置当前迭代状态 - 后续的节点都会归属到这个迭代
        set({
          currentIteration: {
            nodeId: iterNodeId,
            iterationId: iteration_id || `iter-${Date.now()}`,
            index: initialIndex,
            totalIterations: totalIterations,
            startTime: Date.now(),
            status: 'running'
          }
        })

        // 创建迭代容器节点（如果不存在）
        const existingIterNode = nodes.find(n => n.id === iterNodeId)
        if (!existingIterNode) {
          get().addNode({
            id: iterNodeId,
            title: iterTitle || '迭代',
            status: 'running',
            startTime: Date.now(),
            description: `准备迭代 (共 ${totalIterations} 轮)`,
            type: iterNodeType || 'iteration',
            visible: true,
            isIterationNode: true,
            totalIterations: totalIterations,
            currentIteration: initialIndex
          })
        } else {
          // 更新现有迭代容器
          get().updateNode(iterNodeId, {
            description: `准备迭代 (共 ${totalIterations} 轮)`,
            currentIteration: initialIndex,
            status: 'running'
          })
        }

        // 🎯 自动展开迭代节点
        set(state => ({
          iterationExpandedStates: {
            ...state.iterationExpandedStates,
            [iterNodeId]: true
          }
        }))
        break

      case 'iteration_next':
        const { node_id: nextNodeId, iteration_index: nextIndex } = event.data
        const { currentIteration: currentIter } = get()

        if (currentIter && currentIter.nodeId === nextNodeId) {
          // 🎯 从0开始递增：0->1, 1->2, 2->3
          const newIterationIndex = currentIter.index + 1

          // 🎯 边界检查：防止超出最大迭代次数
          if (newIterationIndex >= currentIter.totalIterations) {
            console.warn('[ChatflowExecution] ⚠️  收到多余的iteration_next事件，已达到最大迭代次数:', {
              '当前index': currentIter.index,
              '新index': newIterationIndex,
              '总次数': currentIter.totalIterations
            })
            break // 忽略多余的iteration_next事件
          }

          console.log('[ChatflowExecution] 🎯 迭代进入下一轮:', {
            '当前轮次': newIterationIndex,
            '总轮次': currentIter.totalIterations
          })

          // 更新当前迭代状态
          set({
            currentIteration: {
              ...currentIter,
              index: newIterationIndex,
              startTime: Date.now()
            }
          })

          // 🎯 关键：使用控制台显示的当前轮次来更新UI
          get().updateNode(nextNodeId, {
            description: `第 ${newIterationIndex} 轮 / 共 ${currentIter.totalIterations} 轮`,
            currentIteration: newIterationIndex
          })

          // 更新所有在迭代中的子节点的轮次标记
          const { nodes } = get()
          nodes.forEach(node => {
            if (node.isInIteration && !node.isIterationNode) {
              get().updateNode(node.id, {
                iterationIndex: newIterationIndex
              })
            }
          })
        }
        break

      case 'iteration_completed':
        const { node_id: completedNodeId } = event.data
        const { currentIteration: completedIter } = get()

        if (completedIter && completedIter.nodeId === completedNodeId) {
          // 更新迭代容器节点为完成状态，保持最终计数
          get().updateNode(completedNodeId, {
            status: 'completed',
            endTime: Date.now(),
            description: `迭代完成 (共 ${completedIter.totalIterations} 轮)`,
            // 🎯 关键修复：不修改 currentIteration 字段，避免UI显示时的重复加一
            totalIterations: completedIter.totalIterations
          })

          // 清除当前迭代状态
          set({ currentIteration: null })

          // 🎯 修复：保持迭代子节点的标记，让用户能看到完整的层级结构
          // 不清除 isInIteration 标记，这样完成的迭代子节点仍然保持缩进显示
        }
        break

      case 'parallel_branch_started':
        const { node_id: branchNodeId, branch_id, branch_index, total_branches } = event.data

        // 确保节点存在并标记为并行节点
        const branchNode = nodes.find(n => n.id === branchNodeId)
        if (branchNode) {
          get().updateNode(branchNodeId, {
            isParallelNode: true,
            totalBranches: total_branches
          })
        }

        // 添加新的并行分支
        get().addParallelBranch(branchNodeId, {
          id: branch_id,
          index: branch_index,
          status: 'running',
          startTime: Date.now(),
          inputs: event.data.inputs,
          description: `分支 ${branch_index}`
        })
        break

      case 'parallel_branch_finished':
        const { node_id: finishedBranchNodeId, branch_id: finishedBranchId, status: branchStatus, error: branchError } = event.data

        // 更新分支状态
        get().updateParallelBranch(finishedBranchNodeId, finishedBranchId, {
          status: branchStatus === 'succeeded' ? 'completed' : 'failed',
          endTime: Date.now(),
          outputs: event.data.outputs,
          error: branchError,
          description: branchStatus === 'succeeded' ? '分支完成' : '分支失败'
        })

        // 🎯 更新完成分支计数
        const { nodes: currentNodes } = get()
        const parallelNode = currentNodes.find(n => n.id === finishedBranchNodeId)
        if (parallelNode && parallelNode.parallelBranches) {
          const completedCount = parallelNode.parallelBranches.filter(
            branch => branch.status === 'completed' || branch.status === 'failed'
          ).length

          get().updateNode(finishedBranchNodeId, {
            completedBranches: completedCount
          })

          // 如果所有分支都完成了，更新节点状态
          if (completedCount === parallelNode.totalBranches) {
            const hasFailedBranches = parallelNode.parallelBranches.some(branch => branch.status === 'failed')
            get().updateNode(finishedBranchNodeId, {
              status: hasFailedBranches ? 'failed' : 'completed',
              endTime: Date.now(),
              description: hasFailedBranches ? '部分分支失败' : '所有分支完成'
            })
          }
        }
        break

            case 'loop_started':
        // 🎯 修复：根据实际数据结构解析字段，与iteration_started保持一致
        const { 
          id: loopId, 
          node_id: loopNodeId, 
          title: loopTitle, 
          node_type: loopNodeType,
          metadata: loopMetadata,
          inputs: loopInputs
        } = event.data
        
        // 从metadata或inputs中获取最大循环次数
        const maxLoops = loopMetadata?.loop_length || loopInputs?.loop_count || undefined
        const initialLoopIndex = 0 // 循环从0开始，与迭代保持一致
        
        console.log('[ChatflowExecution] 🔄 Loop started:', {
          loopNodeId,
          loopTitle,
          maxLoops,
          loopMetadata,
          loopInputs
        })
        
        // 设置当前循环状态 - 后续的节点都会归属到这个循环
        set({
          currentLoop: {
            nodeId: loopNodeId,
            loopId: loopId,
            index: initialLoopIndex,
            maxLoops: maxLoops,
            startTime: Date.now(),
            status: 'running'
          }
        })

        // 创建循环容器节点（如果不存在），与迭代保持一致的逻辑
        const existingLoopNode = nodes.find(n => n.id === loopNodeId)
        if (!existingLoopNode) {
          get().addNode({
            id: loopNodeId,
            title: loopTitle || '循环',
            status: 'running',
            startTime: Date.now(),
            description: maxLoops ? `准备循环 (最多 ${maxLoops} 次)` : '准备循环',
            type: loopNodeType || 'loop',
            visible: true,
            isLoopNode: true,
            maxLoops: maxLoops,
            currentLoop: initialLoopIndex
          })
        } else {
          // 更新现有循环容器
          get().updateNode(loopNodeId, {
            description: maxLoops ? `准备循环 (最多 ${maxLoops} 次)` : '准备循环',
            currentLoop: initialLoopIndex,
            status: 'running'
          })
        }

        // 🎯 自动展开循环节点
        set(state => ({
          loopExpandedStates: {
            ...state.loopExpandedStates,
            [loopNodeId]: true
          }
        }))
        break

      case 'loop_next':
        // 🎯 修复：处理循环下一轮事件，与iteration_next保持完全一致的递增逻辑
        const { node_id: nextLoopNodeId, index: nextLoopIndex } = event.data
        const { currentLoop: currentLoopState } = get()

        if (currentLoopState && currentLoopState.nodeId === nextLoopNodeId) {
          // 🎯 关键修复：使用与iteration相同的递增逻辑，而不是直接使用event数据
          const newLoopIndex = currentLoopState.index + 1

          // 🎯 边界检查：防止超出最大循环次数
          if (currentLoopState.maxLoops && newLoopIndex >= currentLoopState.maxLoops) {
            console.warn('[ChatflowExecution] ⚠️  收到多余的loop_next事件，已达到最大循环次数:', {
              '当前index': currentLoopState.index,
              '新index': newLoopIndex,
              '最大次数': currentLoopState.maxLoops
            })
            break // 忽略多余的loop_next事件
          }

          console.log('[ChatflowExecution] 🔄 循环进入下一轮:', {
            '当前轮次': newLoopIndex,
            '最大轮次': currentLoopState.maxLoops
          })

          // 更新当前循环状态
          set({
            currentLoop: {
              ...currentLoopState,
              index: newLoopIndex,
              startTime: Date.now()
            }
          })

          // 更新循环容器节点显示
          const maxLoopsText = currentLoopState.maxLoops ? ` / 最多 ${currentLoopState.maxLoops} 次` : ''
          get().updateNode(nextLoopNodeId, {
            description: `第 ${newLoopIndex} 轮循环${maxLoopsText}`,
            currentLoop: newLoopIndex
          })

          // 更新所有在循环中的子节点的轮次标记
          const { nodes } = get()
          nodes.forEach(node => {
            if (node.isInLoop && !node.isLoopNode) {
              get().updateNode(node.id, {
                loopIndex: newLoopIndex
              })
            }
          })
        }
        break

      case 'loop_completed':
        const { node_id: completedLoopNodeId, outputs: loopOutputs } = event.data
        const { currentLoop: completedLoopState } = get()

        if (completedLoopState && completedLoopState.nodeId === completedLoopNodeId) {
          // 🎯 修复：从outputs中推断总循环次数，或使用当前循环状态的最大轮次
          const finalLoopCount = loopOutputs?.loop_round || completedLoopState.index + 1 || completedLoopState.maxLoops || 0
          
          // 更新循环容器节点为完成状态
          get().updateNode(completedLoopNodeId, {
            status: 'completed',
            endTime: Date.now(),
            description: `循环完成 (共执行 ${finalLoopCount} 次)`,
            // 🎯 关键修复：不修改 currentLoop 字段，避免UI显示时的重复加一
            totalLoops: finalLoopCount
          })

          // 清除当前循环状态
          set({ currentLoop: null })

          // 🎯 修复：保持循环子节点的标记，让用户能看到完整的层级结构
          // 不清除 isInLoop 标记，这样完成的循环子节点仍然保持缩进显示
        }
        break

      default:
        console.log('[ChatflowExecution] 未知事件类型:', event.event)
        break
    }
  }
})) 