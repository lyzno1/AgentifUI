/**
 * 获取所有历史对话的 Hook
 * 
 * 与 useSidebarConversations 不同，此 Hook 获取用户的所有历史对话
 * 主要用于历史对话页面显示完整的对话列表
 */

import { useState, useEffect, useCallback } from 'react';
import { dataService } from '@lib/services/db/data-service';
import { realtimeService, SubscriptionKeys } from '@lib/services/db/realtime-service';
import { cacheService } from '@lib/services/db/cache-service';
import { Conversation } from '@lib/types/database';
import { createClient } from '@lib/supabase/client';

// 使用单例模式的Supabase客户端
const supabase = createClient();

/**
 * 获取所有历史对话的 Hook
 * 
 * @returns 所有对话列表、加载状态、错误信息和操作函数
 */
export function useAllConversations() {
  // --- BEGIN COMMENT ---
  // 状态定义
  // --- END COMMENT ---
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  // 获取当前用户ID
  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
      }
    };

    fetchUserId();

    // 订阅认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUserId(session.user.id);
        } else {
          setUserId(null);
          // 用户登出时清理状态
          setConversations([]);
          setTotal(0);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // --- BEGIN COMMENT ---
  // 加载所有对话的函数
  // 不限制数量，获取用户的所有历史对话
  // --- END COMMENT ---
  const loadAllConversations = useCallback(async (reset: boolean = false) => {
    if (!userId) {
      setConversations([]);
      setIsLoading(false);
      setTotal(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // --- BEGIN COMMENT ---
      // 使用统一数据服务获取所有对话
      // 不设置 limit，获取所有对话
      // --- END COMMENT ---
      const result = await dataService.findMany<Conversation>(
        'conversations',
        { 
          user_id: userId, 
          status: 'active' 
        },
        { column: 'updated_at', ascending: false },
        { offset: 0, limit: 1000 }, // 设置一个较大的限制，实际上获取所有对话
        {
          cache: true,
          cacheTTL: 5 * 60 * 1000, // 5分钟缓存，比侧边栏缓存时间长
          subscribe: true,
          subscriptionKey: SubscriptionKeys.allConversations(userId),
          onUpdate: (payload) => {
            // 实时更新处理
            console.log('[实时更新] 所有对话变化:', payload);
            
            // 清除缓存并重新加载
            cacheService.deletePattern(`conversations:*`);
            
            // 延迟重新加载，避免频繁更新
            setTimeout(() => {
              loadAllConversations(true);
            }, 500);
          }
        }
      );

      if (result.success) {
        const conversations = result.data;
        
        setConversations(conversations);
        setTotal(conversations.length);
        setError(null);
      } else {
        console.error('加载所有对话失败:', result.error);
        setError(result.error);
        setConversations([]);
        setTotal(0);
      }
    } catch (err) {
      console.error('加载所有对话异常:', err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setConversations([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // 刷新对话列表
  const refresh = useCallback(() => {
    if (userId) {
      // 清除缓存
      cacheService.deletePattern(`conversations:*`);
      loadAllConversations(true);
    }
  }, [userId, loadAllConversations]);

  // 初始加载和用户变化时重新加载
  useEffect(() => {
    if (userId) {
      loadAllConversations(true);
    }
  }, [userId, loadAllConversations]);

  // --- BEGIN COMMENT ---
  // 清理函数：组件卸载时清理订阅
  // --- END COMMENT ---
  useEffect(() => {
    return () => {
      if (userId) {
        realtimeService.unsubscribe(SubscriptionKeys.allConversations(userId));
      }
    };
  }, [userId]);

  // --- BEGIN COMMENT ---
  // 删除对话的辅助函数
  // --- END COMMENT ---
  const deleteConversation = useCallback(async (conversationId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const result = await dataService.softDelete<Conversation>('conversations', conversationId);
      
      if (result.success) {
        // 立即从本地状态中移除
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        setTotal(prev => prev - 1);
        
        // 清除相关缓存
        cacheService.deletePattern(`conversations:*`);
        
        return true;
      } else {
        console.error('删除对话失败:', result.error);
        setError(result.error);
        return false;
      }
    } catch (err) {
      console.error('删除对话异常:', err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return false;
    }
  }, [userId]);

  // --- BEGIN COMMENT ---
  // 重命名对话的辅助函数
  // --- END COMMENT ---
  const renameConversation = useCallback(async (
    conversationId: string, 
    newTitle: string
  ): Promise<boolean> => {
    if (!userId) return false;

    try {
      const result = await dataService.update<Conversation>(
        'conversations',
        conversationId,
        { title: newTitle }
      );
      
      if (result.success) {
        // 更新本地状态
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, title: newTitle, updated_at: result.data.updated_at }
            : conv
        ));
        
        // 清除相关缓存
        cacheService.deletePattern(`conversations:*`);
        
        return true;
      } else {
        console.error('重命名对话失败:', result.error);
        setError(result.error);
        return false;
      }
    } catch (err) {
      console.error('重命名对话异常:', err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return false;
    }
  }, [userId]);

  return {
    conversations,
    isLoading,
    error,
    total,
    refresh,
    deleteConversation,
    renameConversation
  };
} 