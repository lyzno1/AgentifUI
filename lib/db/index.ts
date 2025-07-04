// --- BEGIN COMMENT ---
// 导入服务实例，用于内部函数使用
// --- END COMMENT ---
import { cacheService as cacheServiceInstance } from '@lib/services/db/cache-service';
import { realtimeService as realtimeServiceInstance } from '@lib/services/db/realtime-service';

/**
 * 数据库查询函数索引
 *
 * 本文件导出所有数据库查询相关的函数
 * 使用时可以从这个文件统一导入所需的函数
 *
 * 新增：统一数据服务、缓存服务、实时订阅服务
 * 兼容：保留原有函数的导出，同时提供新的优化版本
 */

// 新的统一服务导出

// 统一数据服务
export { dataService } from '@lib/services/db/data-service';

// 缓存服务
export { cacheService, CacheKeys } from '@lib/services/db/cache-service';

// 实时订阅服务
export {
  realtimeService,
  SubscriptionKeys,
  SubscriptionConfigs,
} from '@lib/services/db/realtime-service';

// 消息服务
export { messageService } from '@lib/services/db/message-service';
export type {
  MessagePage,
  PaginationCursor,
} from '@lib/services/db/message-service';

// Result类型和错误处理
export type { Result } from '@lib/types/result';
export {
  success,
  failure,
  wrapAsync,
  DatabaseError,
  NetworkError,
  ValidationError,
} from '@lib/types/result';

// --- BEGIN COMMENT ---

// --- END COMMENT ---

// --- BEGIN COMMENT ---
// 兼容性导出：保留原有函数接口
// 这些函数已经内部升级为使用新的数据服务，但保持相同的API
// --- END COMMENT ---

// API密钥相关函数
export {
  getApiKeyByServiceInstance,
  createApiKey,
  updateApiKey,
  deleteApiKey,
  getDecryptedApiKey,
  incrementApiKeyUsage,
} from './api-keys';

// 服务提供商相关函数
export {
  getAllProviders,
  getActiveProviders,
  getProviderById,
  getProviderByName,
  getDefaultProvider,
  createProvider,
  updateProvider,
  deleteProvider,
} from './providers';

// 服务实例相关函数
export {
  getServiceInstancesByProvider,
  getDefaultServiceInstance,
  getServiceInstanceById,
  getServiceInstanceByInstanceId,
  createServiceInstance,
  updateServiceInstance,
  deleteServiceInstance,
  setDefaultServiceInstance,
  getAppParametersFromDb,
  updateAppParametersInDb,
} from './service-instances';

// --- BEGIN COMMENT ---
// 应用执行记录相关函数：新版本和兼容版本
// --- END COMMENT ---

// 新的优化版本（返回Result类型）
export {
  getUserExecutions,
  getExecutionById,
  getExecutionByExternalId,
  createExecution,
  updateExecution,
  updateExecutionStatus,
  deleteExecution,
  getExecutionsByServiceInstance,
  getExecutionStats,
} from './app-executions';

// 兼容版本（保持原有API）
export {
  getUserExecutionsLegacy,
  getExecutionByIdLegacy,
} from './app-executions';

// --- BEGIN COMMENT ---
// 用户资料相关函数：新版本和兼容版本
// --- END COMMENT ---

// 新的优化版本（返回Result类型）
export {
  getCurrentUserProfile,
  getUserProfileById,
  getUserProfileByUsername,
  getAdminUsers,
  updateUserProfile,
  setUserAsAdmin,
  isUserAdmin,
} from './profiles';

// --- BEGIN COMMENT ---
// 群组管理相关函数（计划添加）
// 暂时通过群组权限获取基本群组信息
// --- END COMMENT ---

// 兼容版本（保持原有API）
export {
  getCurrentUserProfileLegacy,
  getUserProfileByIdLegacy,
  getUserProfileByUsernameLegacy,
  getAdminUsersLegacy,
  updateUserProfileLegacy,
  setUserAsAdminLegacy,
  isUserAdminLegacy,
} from './profiles';

// 对话相关函数
export {
  getUserConversations,
  getConversationById,
  createConversation,
  updateConversation,
  deleteConversation,
  getConversationMessages,
  addMessageToConversation,
  updateMessageStatus,
  getConversationByExternalId,
  renameConversation,
  permanentlyDeleteConversation,
  createEmptyConversation,
  updateConversationMetadata,
} from './conversations';

// --- BEGIN COMMENT ---
// 消息相关函数：新版本通过messageService提供
// 保留原有函数的导出以确保兼容性
// --- END COMMENT ---
export {
  saveMessage,
  saveMessages,
  updateMessageStatus as updateMessageStatusLegacy,
  getMessagesByConversationId,
  chatMessageToDbMessage,
  createPlaceholderAssistantMessage,
  getMessageByContentAndRole,
} from './messages';

// --- BEGIN COMMENT ---
// 新的高级功能函数
// --- END COMMENT ---

/**
 * 清除所有缓存
 */
export function clearAllCache(): void {
  cacheServiceInstance.clear();
}

/**
 * 清除指定表的缓存
 */
export function clearTableCache(table: string): number {
  return cacheServiceInstance.deletePattern(`${table}:*`);
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats() {
  return cacheServiceInstance.getStats();
}

/**
 * 获取实时订阅统计信息
 */
export function getRealtimeStats() {
  return realtimeServiceInstance.getStats();
}

/**
 * 清理所有实时订阅
 */
export function cleanupRealtimeSubscriptions(): void {
  realtimeServiceInstance.unsubscribeAll();
}

/**
 * 批量清理资源（缓存 + 订阅）
 */
export function cleanupAllResources(): void {
  cacheServiceInstance.clear();
  realtimeServiceInstance.unsubscribeAll();
  console.log('[数据库服务] 已清理所有缓存和实时订阅');
}

// --- BEGIN COMMENT ---
// 开发调试用函数
// --- END COMMENT ---

/**
 * 开发模式：打印服务状态
 */
export function debugServiceStatus(): void {
  if (process.env.NODE_ENV === 'development') {
    console.group('[数据库服务状态]');
    console.log('缓存统计:', getCacheStats());
    console.log('实时订阅统计:', getRealtimeStats());
    console.log('订阅列表:', realtimeServiceInstance.listSubscriptions());
    console.groupEnd();
  }
}
