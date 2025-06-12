/**
 * 统一的实时订阅管理服务
 * 
 * 管理Supabase实时订阅，避免重复订阅和内存泄漏
 * 提供订阅、取消订阅和管理功能
 */

import { createClient } from '@lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface SubscriptionConfig {
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema: string;
  table: string;
  filter?: string;
}

interface ManagedSubscription {
  channel: RealtimeChannel;
  handlers: Set<(payload: any) => void>;
  config: SubscriptionConfig;
  createdAt: number;
}

export class RealtimeService {
  private static instance: RealtimeService;
  private supabase = createClient();
  private subscriptions = new Map<string, ManagedSubscription>();

  private constructor() {}

  /**
   * 获取实时服务单例
   */
  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  /**
   * 订阅数据库变化
   * @param key 订阅标识键
   * @param config 订阅配置
   * @param handler 变化处理函数
   * @returns 取消订阅的函数
   */
  subscribe(
    key: string,
    config: SubscriptionConfig,
    handler: (payload: any) => void
  ): () => void {
    let subscription = this.subscriptions.get(key);

    if (subscription) {
      // 如果订阅已存在，只添加新的处理函数
      subscription.handlers.add(handler);
      console.log(`[实时订阅] 添加处理函数到现有订阅: ${key}`);
    } else {
      // 创建新的订阅
      // --- BEGIN COMMENT ---
      // 🔧 修复重复订阅问题：使用订阅键作为channel名称，确保每个订阅都有唯一的channel
      // --- END COMMENT ---
      const channelKey = `channel-${key}`;
      const channel = this.supabase.channel(channelKey);

      // 创建复合处理函数，调用所有注册的处理函数
      const compositeHandler = (payload: any) => {
        const sub = this.subscriptions.get(key);
        if (sub) {
          sub.handlers.forEach(h => {
            try {
              h(payload);
            } catch (error) {
              console.error(`[实时订阅] 处理函数执行出错:`, error);
            }
          });
        }
      };

      // 配置订阅
      const subscriptionConfig = {
        event: config.event,
        schema: config.schema,
        table: config.table,
        ...(config.filter && { filter: config.filter })
      };

      // 配置订阅
      channel.on(
        'postgres_changes' as any, // 临时类型转换，避免TypeScript类型错误
        subscriptionConfig,
        compositeHandler
      );

      // 订阅频道
      channel.subscribe((status) => {
        console.log(`[实时订阅] ${key} 状态变化: ${status}`);
      });

      subscription = {
        channel,
        handlers: new Set([handler]),
        config,
        createdAt: Date.now()
      };

      this.subscriptions.set(key, subscription);
      console.log(`[实时订阅] 创建新订阅: ${key}`);
    }

    // 返回取消订阅的函数
    return () => {
      this.unsubscribeHandler(key, handler);
    };
  }

  /**
   * 移除特定的处理函数
   */
  private unsubscribeHandler(key: string, handler: (payload: any) => void): void {
    const subscription = this.subscriptions.get(key);
    if (!subscription) return;

    subscription.handlers.delete(handler);

    // 如果没有处理函数了，完全移除订阅
    if (subscription.handlers.size === 0) {
      this.unsubscribe(key);
    }
  }

  /**
   * 完全取消订阅
   */
  unsubscribe(key: string): void {
    const subscription = this.subscriptions.get(key);
    if (!subscription) return;

    try {
      this.supabase.removeChannel(subscription.channel);
      this.subscriptions.delete(key);
      console.log(`[实时订阅] 取消订阅: ${key}`);
    } catch (error) {
      console.error(`[实时订阅] 取消订阅失败: ${key}`, error);
    }
  }

  /**
   * 取消所有订阅
   */
  unsubscribeAll(): void {
    const keys = Array.from(this.subscriptions.keys());
    keys.forEach(key => this.unsubscribe(key));
    console.log(`[实时订阅] 取消了所有订阅，共 ${keys.length} 个`);
  }

  /**
   * 获取订阅统计信息
   */
  getStats(): {
    total: number;
    byTable: Record<string, number>;
    byEvent: Record<string, number>;
    oldestSubscription?: { key: string; age: number };
  } {
    const stats = {
      total: this.subscriptions.size,
      byTable: {} as Record<string, number>,
      byEvent: {} as Record<string, number>,
      oldestSubscription: undefined as { key: string; age: number } | undefined
    };

    let oldestTimestamp = Date.now();
    let oldestKey = '';

    for (const [key, subscription] of this.subscriptions.entries()) {
      // 按表统计
      const table = subscription.config.table;
      stats.byTable[table] = (stats.byTable[table] || 0) + 1;

      // 按事件统计
      const event = subscription.config.event;
      stats.byEvent[event] = (stats.byEvent[event] || 0) + 1;

      // 找出最老的订阅
      if (subscription.createdAt < oldestTimestamp) {
        oldestTimestamp = subscription.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      stats.oldestSubscription = {
        key: oldestKey,
        age: Date.now() - oldestTimestamp
      };
    }

    return stats;
  }

  /**
   * 列出所有活跃订阅
   */
  listSubscriptions(): Array<{
    key: string;
    table: string;
    event: string;
    filter?: string;
    handlerCount: number;
    age: number;
  }> {
    return Array.from(this.subscriptions.entries()).map(([key, subscription]) => ({
      key,
      table: subscription.config.table,
      event: subscription.config.event,
      filter: subscription.config.filter,
      handlerCount: subscription.handlers.size,
      age: Date.now() - subscription.createdAt
    }));
  }

  /**
   * 销毁服务，清理所有订阅
   */
  destroy(): void {
    this.unsubscribeAll();
    console.log('[实时订阅] 服务已销毁');
  }
}

// 导出单例实例
export const realtimeService = RealtimeService.getInstance();

// 常用的订阅键生成器
export const SubscriptionKeys = {
  // --- BEGIN COMMENT ---
  // 🔧 修复重复订阅问题：为不同用途的Hook提供差异化的订阅键
  // --- END COMMENT ---
  sidebarConversations: (userId: string) => `sidebar-conversations:${userId}`,
  allConversations: (userId: string) => `all-conversations:${userId}`,
  
  // --- BEGIN COMMENT ---
  // 保持向后兼容性，现有代码可以继续使用
  // --- END COMMENT ---
  userConversations: (userId: string) => `user-conversations:${userId}`,
  
  conversationMessages: (conversationId: string) => `conversation-messages:${conversationId}`,
  userProfile: (userId: string) => `user-profile:${userId}`,
  providers: () => 'providers',
  serviceInstances: () => 'service-instances',
  apiKeys: () => 'api-keys',
};

// 常用的订阅配置
export const SubscriptionConfigs = {
  conversations: (userId?: string): SubscriptionConfig => ({
    event: '*',
    schema: 'public',
    table: 'conversations',
    ...(userId && { filter: `user_id=eq.${userId}` })
  }),
  
  messages: (conversationId?: string): SubscriptionConfig => ({
    event: '*',
    schema: 'public',
    table: 'messages',
    ...(conversationId && { filter: `conversation_id=eq.${conversationId}` })
  }),
  
  profiles: (userId?: string): SubscriptionConfig => ({
    event: 'UPDATE',
    schema: 'public',
    table: 'profiles',
    ...(userId && { filter: `id=eq.${userId}` })
  }),
  
  providers: (): SubscriptionConfig => ({
    event: '*',
    schema: 'public',
    table: 'providers'
  }),
  
  serviceInstances: (): SubscriptionConfig => ({
    event: '*',
    schema: 'public',
    table: 'service_instances'
  })
}; 