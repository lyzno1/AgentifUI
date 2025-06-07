import React from 'react';
import { useAppListStore } from '@lib/stores/app-list-store';
import { useCurrentApp } from '@lib/hooks/use-current-app';
import { useChatInterface } from '@lib/hooks/use-chat-interface';

/**
 * Chatflow应用检测Hook
 * 
 * 功能：
 * - 自动加载应用列表
 * - 根据对话历史检测应用类型
 * - 判断是否为chatflow应用
 */
export function useChatflowDetection() {
  const { apps, fetchApps } = useAppListStore();
  const { currentAppInstance } = useCurrentApp();
  const { conversationAppId } = useChatInterface();
  
  // --- BEGIN COMMENT ---
  // 🎯 确保应用列表已加载
  // --- END COMMENT ---
  React.useEffect(() => {
    if (apps.length === 0) {
      fetchApps();
    }
  }, [apps.length, fetchApps]);
  
  // --- BEGIN COMMENT ---
  // 🎯 获取当前对话关联的应用
  // --- END COMMENT ---
  const currentConversationApp = React.useMemo(() => {
    if (conversationAppId) {
      // 尝试多种匹配方式查找应用
      return apps.find(app => 
        app.instance_id === conversationAppId || 
        app.id === conversationAppId
      );
    }
    return currentAppInstance;
  }, [conversationAppId, apps, currentAppInstance]);
  
  // --- BEGIN COMMENT ---
  // 🎯 判断是否为chatflow应用
  // --- END COMMENT ---
  const isChatflowApp = React.useMemo(() => {
    if (!currentConversationApp) return false;
    
    const difyAppType = 
      currentConversationApp.config?.app_metadata?.dify_apptype ||
      (currentConversationApp as any).difyAppType ||
      (currentConversationApp as any).dify_apptype;
      
    return difyAppType === 'chatflow';
  }, [currentConversationApp]);
  
  return {
    isChatflowApp,
    currentConversationApp,
    conversationAppId,
    isLoading: apps.length === 0
  };
} 