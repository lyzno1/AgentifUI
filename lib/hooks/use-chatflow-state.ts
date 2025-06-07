import React from 'react';
import { useChatflowInterface } from '@lib/hooks/use-chatflow-interface';
import { useChatInterface } from '@lib/hooks/use-chat-interface';

/**
 * Chatflow状态管理Hook
 * 
 * 功能：
 * - 根据应用类型选择正确的接口
 * - 管理节点跟踪器显示状态
 * - 自动响应节点执行状态
 * - 支持用户主动关闭后不再自动打开
 */
export function useChatflowState(isChatflowApp: boolean) {
  const chatflowInterface = useChatflowInterface();
  const regularInterface = useChatInterface();
  
  // 🎯 根据应用类型选择正确的接口
  const chatInterface = isChatflowApp ? chatflowInterface : regularInterface;
  
  // 🎯 nodeTracker只在chatflow应用中有效
  const nodeTracker = isChatflowApp ? chatflowInterface.nodeTracker : { 
    nodes: [], 
    isExecuting: false, 
    executionProgress: { current: 0, total: 0, percentage: 0 }, 
    error: null 
  };
  
  // 🎯 节点跟踪器显示状态
  const [showNodeTracker, setShowNodeTracker] = React.useState(false);
  
  // 🎯 新增：跟踪用户是否主动关闭了弹窗
  // 当用户主动关闭后，新的bar不再自动触发弹窗打开
  const [userHasClosed, setUserHasClosed] = React.useState(false);
  
  // 🎯 悬浮球显示逻辑：在chatflow应用中始终显示
  const showFloatingController = isChatflowApp;
  
  // 🎯 关键修复：只在真正开始执行时才自动显示跟踪器
  // 不基于历史节点数据，避免chatflow应用间切换时自动弹出
  React.useEffect(() => {
    if (!isChatflowApp) return;
    
    const isExecuting = nodeTracker?.isExecuting;
    
    // 只有在真正开始执行时，且用户没有主动关闭的情况下才自动显示跟踪器
    if (isExecuting && !userHasClosed) {
      setShowNodeTracker(true);
    }
  }, [isChatflowApp, nodeTracker?.isExecuting, userHasClosed]);
  
  // 🎯 包装setShowNodeTracker，跟踪用户的主动操作
  const handleToggleNodeTracker = React.useCallback((show: boolean) => {
    setShowNodeTracker(show);
    
    // 如果用户主动关闭（从true变为false），记录这个状态
    if (!show && showNodeTracker) {
      setUserHasClosed(true);
    }
    
    // 如果用户主动打开（从false变为true），重置关闭状态
    if (show && !showNodeTracker) {
      setUserHasClosed(false);
    }
  }, [showNodeTracker]);
  
  // 🎯 当开始新的执行时，重置用户关闭状态
  // 这样每次新的对话开始时，都可以重新自动显示
  React.useEffect(() => {
    if (!isChatflowApp) return;
    
    const isExecuting = nodeTracker?.isExecuting;
    
    // 当开始新的执行时，重置用户关闭状态
    if (isExecuting) {
      setUserHasClosed(false);
    }
  }, [isChatflowApp, nodeTracker?.isExecuting]);
  
  return {
    // 聊天接口
    messages: chatInterface.messages,
    handleSubmit: chatInterface.handleSubmit,
    isProcessing: chatInterface.isProcessing,
    handleStopProcessing: chatInterface.handleStopProcessing,
    sendDirectMessage: chatInterface.sendDirectMessage,
    
    // Chatflow相关
    nodeTracker,
    showNodeTracker,
    setShowNodeTracker: handleToggleNodeTracker, // 使用包装后的函数
    showFloatingController
  };
} 