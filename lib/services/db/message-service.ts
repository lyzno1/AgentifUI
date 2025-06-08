/**
 * 优化的数据库消息服务
 * 
 * 专门处理消息相关的数据操作，优化分页和排序逻辑
 * 使用数据库级别的排序，避免客户端复杂的排序逻辑
 */

import { dataService } from './data-service';
import { cacheService, CacheKeys } from './cache-service';
import { realtimeService, SubscriptionKeys, SubscriptionConfigs } from './realtime-service';
import { Result, success, failure } from '@lib/types/result';
import { Message, MessageStatus } from '@lib/types/database';
import { ChatMessage } from '@lib/stores/chat-store';
import { extractMainContentForPreview } from '../../utils/index';

export interface MessagePage {
  messages: Message[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount?: number;
}

export interface PaginationCursor {
  timestamp: string;
  id: string;
}

export class MessageService {
  private static instance: MessageService;

  private constructor() {}

  /**
   * 获取消息服务单例
   */
  public static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }

  /**
   * 获取对话的消息（优化分页）
   * 使用基于游标的分页，性能更好
   */
  async getMessagesPaginated(
    conversationId: string,
    options: {
      limit?: number;
      cursor?: string;
      direction?: 'newer' | 'older';
      includeCount?: boolean;
      cache?: boolean;
    } = {}
  ): Promise<Result<MessagePage>> {
    const {
      limit = 20,
      cursor,
      direction = 'older',
      includeCount = false,
      cache = true
    } = options;

    const cacheKey = cache ? 
      `conversation:messages:${conversationId}:${cursor ? `${cursor.substring(0, 8)}:${direction}:${limit}` : `initial:${limit}`}` : 
      undefined;

    return dataService.query(async () => {
      // 解析游标
      let cursorData: PaginationCursor | null = null;
      if (cursor) {
        try {
          cursorData = JSON.parse(atob(cursor));
        } catch (error) {
          throw new Error('无效的分页游标');
        }
      }

      // 构建查询
      let query = dataService['supabase']
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false }); // 保证排序稳定性

      // 应用游标条件
      if (cursorData) {
        if (direction === 'older') {
          query = query.or(
            `created_at.lt.${cursorData.timestamp},and(created_at.eq.${cursorData.timestamp},id.lt.${cursorData.id})`
          );
        } else {
          query = query.or(
            `created_at.gt.${cursorData.timestamp},and(created_at.eq.${cursorData.timestamp},id.gt.${cursorData.id})`
          );
        }
      }

      // 应用分页限制（+1 用于检查是否有更多数据）
      query = query.limit(limit + 1);

      const { data: messages, error } = await query;

      if (error) {
        throw error;
      }

      // 检查是否有更多数据
      const hasMore = messages.length > limit;
      const actualMessages = hasMore ? messages.slice(0, limit) : messages;

      // 生成下一个游标
      let nextCursor: string | undefined;
      if (hasMore && actualMessages.length > 0) {
        const lastMessage = actualMessages[actualMessages.length - 1];
        const cursorObj: PaginationCursor = {
          timestamp: lastMessage.created_at,
          id: lastMessage.id
        };
        nextCursor = btoa(JSON.stringify(cursorObj));
      }

      // 获取总数（如果需要）
      let totalCount: number | undefined;
      if (includeCount) {
        const countResult = await dataService.count('messages', { conversation_id: conversationId });
        if (countResult.success) {
          totalCount = countResult.data;
        }
      }

      return {
        messages: actualMessages,
        hasMore,
        nextCursor,
        totalCount
      };
    }, cacheKey, { cache });
  }

  /**
   * 获取最新的消息（用于初始加载）
   */
  async getLatestMessages(
    conversationId: string,
    limit: number = 20,
    options: { cache?: boolean } = {}
  ): Promise<Result<Message[]>> {
    const { cache = true } = options;
    
    return dataService.findMany<Message>(
      'messages',
      { conversation_id: conversationId },
      { column: 'created_at', ascending: false },
      { offset: 0, limit },
      { 
        cache,
        cacheTTL: 2 * 60 * 1000, // 2分钟缓存
        subscribe: true,
        subscriptionKey: SubscriptionKeys.conversationMessages(conversationId),
        onUpdate: () => {
          // 清除相关缓存
          cacheService.deletePattern(`conversation:messages:${conversationId}:*`);
        }
      }
    );
  }

  /**
   * 保存消息到数据库
   * 对于助手消息，同时更新对话预览（智能提取主要内容）
   */
  async saveMessage(message: {
    conversation_id: string;
    user_id?: string | null;
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: Record<string, any>;
    status?: MessageStatus;
    external_id?: string | null;
    token_count?: number | null;
  }): Promise<Result<Message>> {
    const messageData = {
      ...message,
      metadata: message.metadata || {},
      status: message.status || 'sent',
      is_synced: true
    };

    // --- BEGIN COMMENT ---
    // 🎯 优化：对于助手消息，在保存的同时更新对话预览
    // 使用事务确保数据一致性，避免额外的数据库操作
    // --- END COMMENT ---
    if (message.role === 'assistant') {
      return dataService.query(async () => {
        // 1. 保存消息
        const { data: savedMessage, error: messageError } = await dataService['supabase']
          .from('messages')
          .insert(messageData)
          .select()
          .single();

        if (messageError) {
          throw messageError;
        }

        // 2. 提取主要内容用于预览
        const mainContent = extractMainContentForPreview(message.content);
        
        // 3. 生成预览文本（与原触发器保持一致的截断逻辑）
        let previewText = mainContent || message.content; // 如果提取失败，使用原始内容
        if (previewText.length > 100) {
          previewText = previewText.substring(0, 100) + '...';
        }

        // 4. 更新对话预览（在同一个事务中）
        const { error: conversationError } = await dataService['supabase']
          .from('conversations')
          .update({
            last_message_preview: previewText,
            updated_at: new Date().toISOString()
          })
          .eq('id', message.conversation_id);

        if (conversationError) {
          console.warn('[MessageService] 更新对话预览失败:', conversationError);
          // 不抛出错误，因为消息已经保存成功
        }

        // 5. 清除相关缓存
        cacheService.deletePattern(`conversation:messages:${message.conversation_id}:*`);

        return savedMessage;
      });
    } else {
      // --- BEGIN COMMENT ---
      // 🎯 非助手消息，使用原有逻辑，不影响现有功能
      // --- END COMMENT ---
      const result = await dataService.create<Message>('messages', messageData);

      if (result.success) {
        cacheService.deletePattern(`conversation:messages:${message.conversation_id}:*`);
      }

      return result;
    }
  }

  /**
   * 批量保存消息
   */
  async saveMessages(messages: Array<{
    conversation_id: string;
    user_id?: string | null;
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: Record<string, any>;
    status?: MessageStatus;
    external_id?: string | null;
    token_count?: number | null;
  }>): Promise<Result<string[]>> {
    if (!messages.length) {
      return success([]);
    }

    return dataService.query(async () => {
      const messageData = messages.map(msg => ({
        ...msg,
        metadata: msg.metadata || {},
        status: msg.status || 'sent',
        is_synced: true
      }));

      const { data, error } = await dataService['supabase']
        .from('messages')
        .insert(messageData)
        .select('id');

      if (error) {
        throw error;
      }

      // 清除相关缓存
      const conversationIds = new Set(messages.map(m => m.conversation_id));
      conversationIds.forEach(convId => {
        cacheService.deletePattern(`conversation:messages:${convId}:*`);
      });

      return data.map((item: { id: string }) => item.id);
    });
  }

  /**
   * 更新消息状态
   */
  async updateMessageStatus(
    messageId: string,
    status: MessageStatus
  ): Promise<Result<Message>> {
    const result = await dataService.update<Message>('messages', messageId, { status });

    // 清除相关缓存（需要先获取消息的conversation_id）
    if (result.success) {
      const message = result.data;
      cacheService.deletePattern(`conversation:messages:${message.conversation_id}:*`);
    }

    return result;
  }

  /**
   * 将前端ChatMessage转换为数据库Message
   */
  chatMessageToDbMessage(
    chatMessage: ChatMessage,
    conversationId: string,
    userId?: string | null
  ): Omit<Message, 'id' | 'created_at' | 'is_synced'> {
    const baseMetadata = chatMessage.metadata || {};

    // 添加停止标记
    if (chatMessage.wasManuallyStopped && !baseMetadata.stopped_manually) {
      baseMetadata.stopped_manually = true;
      baseMetadata.stopped_at = baseMetadata.stopped_at || new Date().toISOString();
    }

    // 添加附件信息
    if (chatMessage.attachments && chatMessage.attachments.length > 0) {
      baseMetadata.attachments = chatMessage.attachments;
    }

    // 添加序列索引，确保用户消息在助手消息前面
    baseMetadata.sequence_index = chatMessage.isUser ? 0 : 1;

    return {
      conversation_id: conversationId,
      user_id: chatMessage.isUser ? (userId || null) : null,
      role: chatMessage.role || (chatMessage.isUser ? 'user' : 'assistant'),
      content: chatMessage.text,
      metadata: baseMetadata,
      status: chatMessage.error ? 'error' : 'sent',
      external_id: chatMessage.dify_message_id || null,
      token_count: chatMessage.token_count || null
    };
  }

  /**
   * 将数据库Message转换为前端ChatMessage
   */
  dbMessageToChatMessage(dbMessage: Message): ChatMessage {
    // 从metadata中提取附件信息
    const attachments = dbMessage.metadata?.attachments || [];
    
    return {
      id: `db-${dbMessage.id}`,
      text: dbMessage.content,
      isUser: dbMessage.role === 'user',
      role: dbMessage.role,
      persistenceStatus: 'saved',
      db_id: dbMessage.id,
      dify_message_id: dbMessage.external_id || undefined,
      metadata: dbMessage.metadata || {},
      wasManuallyStopped: dbMessage.metadata?.stopped_manually === true,
      token_count: dbMessage.token_count || undefined,
      attachments: attachments.length > 0 ? attachments : undefined
    };
  }

  /**
   * 查找重复消息（用于去重）
   */
  async findDuplicateMessage(
    content: string,
    role: 'user' | 'assistant' | 'system',
    conversationId: string
  ): Promise<Result<Message | null>> {
    return dataService.findOne<Message>(
      'messages',
      {
        conversation_id: conversationId,
        role,
        content
      },
      { cache: true, cacheTTL: 30 * 1000 } // 30秒缓存
    );
  }

  /**
   * 获取消息统计信息
   */
  async getMessageStats(conversationId: string): Promise<Result<{
    total: number;
    byRole: Record<string, number>;
    lastMessageAt?: string;
  }>> {
    return dataService.query(async () => {
      // 获取总数
      const totalResult = await dataService.count('messages', { conversation_id: conversationId });
      if (!totalResult.success) {
        throw totalResult.error;
      }

      // 获取按角色统计
      const { data: roleStats, error: roleError } = await dataService['supabase']
        .from('messages')
        .select('role')
        .eq('conversation_id', conversationId);

      if (roleError) {
        throw roleError;
      }

      const byRole: Record<string, number> = {};
      roleStats.forEach((item: { role: string }) => {
        byRole[item.role] = (byRole[item.role] || 0) + 1;
      });

      // 获取最后消息时间
      const { data: lastMessage, error: lastError } = await dataService['supabase']
        .from('messages')
        .select('created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastError) {
        throw lastError;
      }

      return {
        total: totalResult.data,
        byRole,
        lastMessageAt: lastMessage?.created_at
      };
    });
  }

  /**
   * 清除消息缓存
   */
  clearMessageCache(conversationId?: string): number {
    if (conversationId) {
      return cacheService.deletePattern(`conversation:messages:${conversationId}:*`);
    } else {
      return cacheService.deletePattern('conversation:messages:*');
    }
  }
}

// 导出单例实例
export const messageService = MessageService.getInstance(); 