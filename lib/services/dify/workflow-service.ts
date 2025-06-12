// --- BEGIN COMMENT ---
// lib/services/dify/workflow-service.ts
// 实现与 Dify Workflow API 的交互逻辑。
// 参考文档: POST /workflows/run
// --- END COMMENT ---

import { 
  DifyWorkflowRequestPayload, 
  DifyWorkflowCompletionResponse,
  DifyWorkflowStreamResponse,
  DifyWorkflowSseEvent,
  DifyWorkflowFinishedData,
  DifyWorkflowSseNodeStartedEvent,
  DifyWorkflowSseNodeFinishedEvent,
  DifyWorkflowErrorCode,
  DifyApiError,
  DifyWorkflowRunDetailResponse,
  GetDifyWorkflowLogsParams,
  GetDifyWorkflowLogsResponse
} from './types';
import { parseSseStream } from '@lib/utils/sse-parser';

// --- BEGIN COMMENT ---
// 定义 Dify API 基础 URL (指向我们的后端代理)
// --- END COMMENT ---
const DIFY_API_BASE_URL = '/api/dify'; // 代理的基础路径

/**
 * 处理 Dify Workflow API 错误响应
 */
function handleWorkflowApiError(status: number, errorBody: string): Error {
  try {
    const errorData = JSON.parse(errorBody) as DifyApiError;
    const errorCode = errorData.code as DifyWorkflowErrorCode;
    
    // 根据错误码提供更友好的错误信息
    const errorMessages: Record<DifyWorkflowErrorCode, string> = {
      'invalid_param': '请求参数错误，请检查输入参数',
      'app_unavailable': '应用不可用，请检查应用状态',
      'provider_not_initialize': '模型提供商未初始化',
      'provider_quota_exceeded': '模型提供商配额已超限',
      'model_currently_not_support': '当前模型不支持此操作',
      'workflow_request_error': '工作流请求错误'
    };
    
    const friendlyMessage = errorMessages[errorCode] || errorData.message || '未知错误';
    return new Error(`Dify Workflow API 错误 (${status}): ${friendlyMessage}`);
    
  } catch (parseError) {
    // 如果无法解析错误响应，返回原始错误信息
    return new Error(`Dify Workflow API 请求失败 (${status}): ${errorBody}`);
  }
}

/**
 * 执行 Dify Workflow (blocking 模式)
 * 
 * @param payload - 发送给 Dify Workflow API 的请求体
 * @param appId - Dify 应用的 ID
 * @returns 一个包含完整执行结果的 Promise
 * @throws 如果 fetch 请求失败或 API 返回错误状态，则抛出错误
 */
export async function executeDifyWorkflow(
  payload: DifyWorkflowRequestPayload,
  appId: string
): Promise<DifyWorkflowCompletionResponse> {
  console.log('[Dify Workflow Service] Executing workflow (blocking mode):', payload);
  
  const apiUrl = `${DIFY_API_BASE_URL}/${appId}/workflows/run`;
  
  // 确保使用 blocking 模式
  const blockingPayload: DifyWorkflowRequestPayload = {
    ...payload,
    response_mode: 'blocking'
  };
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(blockingPayload),
    });

    console.log('[Dify Workflow Service] Received response status:', response.status);

    if (!response.ok) {
      let errorBody = 'Unknown error';
      try {
        errorBody = await response.text();
      } catch (e) {
        // 忽略读取错误体时的错误
      }
      throw handleWorkflowApiError(response.status, errorBody);
    }

    const result: DifyWorkflowCompletionResponse = await response.json();
    console.log('[Dify Workflow Service] Workflow execution completed:', result.data.status);
    
    return result;

  } catch (error) {
    console.error('[Dify Workflow Service] Error in executeDifyWorkflow:', error);
    throw error;
  }
}

/**
 * 执行 Dify Workflow (streaming 模式)
 * 
 * @param payload - 发送给 Dify Workflow API 的请求体
 * @param appId - Dify 应用的 ID
 * @param onProgressUpdate - 可选的回调函数，当节点状态更新时调用
 * @returns 一个包含进度流和完成 Promise 的对象
 * @throws 如果 fetch 请求失败或 API 返回错误状态，则抛出错误
 */
export async function streamDifyWorkflow(
  payload: DifyWorkflowRequestPayload,
  appId: string,
  onProgressUpdate?: (event: DifyWorkflowSseEvent) => void
): Promise<DifyWorkflowStreamResponse> {
  console.log('[Dify Workflow Service] Starting workflow stream:', payload);
  
  const apiUrl = `${DIFY_API_BASE_URL}/${appId}/workflows/run`;
  
  // 确保使用 streaming 模式
  const streamingPayload: DifyWorkflowRequestPayload = {
    ...payload,
    response_mode: 'streaming'
  };
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(streamingPayload),
    });

    console.log('[Dify Workflow Service] Received streaming response status:', response.status);

    if (!response.ok) {
      let errorBody = 'Unknown error';
      try {
        errorBody = await response.text();
      } catch (e) {
        // 忽略读取错误体时的错误
      }
      throw handleWorkflowApiError(response.status, errorBody);
    }

    if (!response.body) {
      throw new Error('Dify Workflow API response body is null.');
    }

    const stream = response.body;
    let workflowRunId: string | null = null;
    let taskId: string | null = null;
    let completionResolve: (value: DifyWorkflowFinishedData) => void;
    let completionReject: (reason: any) => void;

    // 创建完成 Promise
    const completionPromise = new Promise<DifyWorkflowFinishedData>((resolve, reject) => {
      completionResolve = resolve;
      completionReject = reject;
    });

    // --- BEGIN COMMENT ---
    // 创建进度流生成器
    // --- END COMMENT ---
    async function* processProgressStream(): AsyncGenerator<DifyWorkflowSseEvent, void, undefined> {
      try {
        for await (const result of parseSseStream(stream)) {
          if (result.type === 'error') {
            console.error('[Dify Workflow Service] SSE Parser Error:', result.error);
            completionReject(new Error('Error parsing SSE stream.'));
            throw new Error('Error parsing SSE stream.');
          }

          const event = result.event as DifyWorkflowSseEvent;
          console.log(`[Dify Workflow Service] Received SSE event: ${event.event}`);

          // 提取 workflow_run_id 和 task_id
          if (event.workflow_run_id && !workflowRunId) {
            workflowRunId = event.workflow_run_id;
            console.log('[Dify Workflow Service] Extracted workflowRunId:', workflowRunId);
          }
          if (event.task_id && !taskId) {
            taskId = event.task_id;
            console.log('[Dify Workflow Service] Extracted taskId:', taskId);
          }

          // 处理不同类型的事件
          switch (event.event) {
            case 'workflow_started':
              console.log('[Dify Workflow Service] Workflow started:', event.data.id);
              break;
              
            case 'node_started':
              console.log('[Dify Workflow Service] Node started:', event.data.node_id, event.data.title);
              if (onProgressUpdate) {
                try {
                  onProgressUpdate(event);
                } catch (callbackError) {
                  console.error('[Dify Workflow Service] Error in onProgressUpdate callback:', callbackError);
                }
              }
              yield event;
              break;
              
            case 'node_finished':
              console.log('[Dify Workflow Service] Node finished:', event.data.node_id, event.data.status);
              if (onProgressUpdate) {
                try {
                  onProgressUpdate(event);
                } catch (callbackError) {
                  console.error('[Dify Workflow Service] Error in onProgressUpdate callback:', callbackError);
                }
              }
              yield event;
              break;

            // 🎯 新增：Loop 事件处理 - 关键修复！
            case 'loop_started':
              console.log('[Dify Workflow Service] Loop started:', event.data.node_id, event.data.title);
              if (onProgressUpdate) {
                try {
                  onProgressUpdate(event);
                } catch (callbackError) {
                  console.error('[Dify Workflow Service] Error in onProgressUpdate callback (loop_started):', callbackError);
                }
              }
              yield event;
              break;

            case 'loop_next':
              console.log('[Dify Workflow Service] Loop next:', event.data.node_id, 'index:', event.data.index);
              if (onProgressUpdate) {
                try {
                  onProgressUpdate(event);
                } catch (callbackError) {
                  console.error('[Dify Workflow Service] Error in onProgressUpdate callback (loop_next):', callbackError);
                }
              }
              yield event;
              break;

            case 'loop_completed':
              console.log('[Dify Workflow Service] Loop completed:', event.data.node_id);
              if (onProgressUpdate) {
                try {
                  onProgressUpdate(event);
                } catch (callbackError) {
                  console.error('[Dify Workflow Service] Error in onProgressUpdate callback (loop_completed):', callbackError);
                }
              }
              yield event;
              break;

            // 🎯 新增：Iteration 事件处理
            case 'iteration_started':
              console.log('[Dify Workflow Service] Iteration started:', event.data.node_id, event.data.title);
              if (onProgressUpdate) {
                try {
                  onProgressUpdate(event);
                } catch (callbackError) {
                  console.error('[Dify Workflow Service] Error in onProgressUpdate callback (iteration_started):', callbackError);
                }
              }
              yield event;
              break;

            case 'iteration_next':
              console.log('[Dify Workflow Service] Iteration next:', event.data.node_id, 'index:', event.data.iteration_index);
              if (onProgressUpdate) {
                try {
                  onProgressUpdate(event);
                } catch (callbackError) {
                  console.error('[Dify Workflow Service] Error in onProgressUpdate callback (iteration_next):', callbackError);
                }
              }
              yield event;
              break;

            case 'iteration_completed':
              console.log('[Dify Workflow Service] Iteration completed:', event.data.node_id);
              if (onProgressUpdate) {
                try {
                  onProgressUpdate(event);
                } catch (callbackError) {
                  console.error('[Dify Workflow Service] Error in onProgressUpdate callback (iteration_completed):', callbackError);
                }
              }
              yield event;
              break;
              
            case 'workflow_finished':
              console.log('[Dify Workflow Service] Workflow finished:', event.data.status);
              completionResolve(event.data);
              return; // 结束生成器
              
            case 'error':
              console.error('[Dify Workflow Service] Workflow error:', event.message);
              const error = new Error(`Dify Workflow error: ${event.code} - ${event.message}`);
              completionReject(error);
              throw error;
              
            default:
              console.log('[Dify Workflow Service] Ignoring unknown event type:', (event as any).event);
              break;
          }
        }
      } catch (error) {
        console.error('[Dify Workflow Service] Error in processProgressStream:', error);
        completionReject(error);
        throw error;
      }
    }

    const responsePayload: DifyWorkflowStreamResponse = {
      progressStream: processProgressStream(),
      getWorkflowRunId: () => workflowRunId,
      getTaskId: () => taskId,
      completionPromise
    };

    return responsePayload;

  } catch (error) {
    console.error('[Dify Workflow Service] Error in streamDifyWorkflow:', error);
    throw error;
  }
}

/**
 * 停止 Dify Workflow 执行
 * 
 * @param appId - Dify 应用的 ID
 * @param taskId - 需要停止的任务 ID
 * @param user - 发起请求的用户标识符
 * @returns 一个表示停止操作结果的 Promise
 * @throws 如果请求失败或 API 返回错误状态，则抛出错误
 */
export async function stopDifyWorkflow(
  appId: string,
  taskId: string,
  user: string
): Promise<{ result: 'success' }> {
  console.log(`[Dify Workflow Service] Requesting to stop workflow task ${taskId} for app ${appId}`);

  const slug = `workflows/tasks/${taskId}/stop`;
  const apiUrl = `${DIFY_API_BASE_URL}/${appId}/${slug}`;

  const payload = { user };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log(`[Dify Workflow Service] Stop workflow response status for ${taskId}:`, response.status);

    if (!response.ok) {
      let errorBody = 'Unknown error';
      try {
        errorBody = await response.text();
      } catch (e) {
        // 忽略读取错误
      }
      throw handleWorkflowApiError(response.status, errorBody);
    }

    const result = await response.json();
    console.log(`[Dify Workflow Service] Workflow task ${taskId} stopped successfully.`);
    return result;

  } catch (error) {
    console.error(`[Dify Workflow Service] Error stopping workflow task ${taskId}:`, error);
    throw error;
  }
}

/**
 * 获取 workflow 执行情况
 * 
 * @param appId - 应用 ID
 * @param workflowRunId - workflow 执行 ID
 * @returns Promise<DifyWorkflowRunDetailResponse> - workflow 执行详情
 */
export async function getDifyWorkflowRunDetail(
  appId: string,
  workflowRunId: string
): Promise<DifyWorkflowRunDetailResponse> {
  const slug = `workflows/run/${workflowRunId}`; // Dify API 路径
  const apiUrl = `/api/dify/${appId}/${slug}`; // 指向后端代理

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 不需要 Authorization 头，这是代理的职责
    });

    if (!response.ok) {
      // 处理 404 错误
      if (response.status === 404) {
        throw new Error('Workflow 执行记录未找到');
      }

      // 尝试解析错误响应
      let errorData: DifyApiError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          status: response.status,
          code: response.status.toString(),
          message: response.statusText || '获取 workflow 执行情况失败'
        };
      }
      
      console.error('[Dify Workflow Service] 获取 workflow 执行情况失败:', errorData);
      throw new Error(`获取 workflow 执行情况失败: ${errorData.message}`);
    }

    const result: DifyWorkflowRunDetailResponse = await response.json();
    
    console.log('[Dify Workflow Service] 成功获取 workflow 执行情况:', {
      appId,
      workflowRunId,
      status: result.status,
      totalSteps: result.total_steps,
      totalTokens: result.total_tokens
    });
    
    return result;

  } catch (error) {
    console.error('[Dify Workflow Service] 获取 workflow 执行情况时发生错误:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('获取 workflow 执行情况时发生未知错误');
  }
}

// --- BEGIN COMMENT ---
// 获取 Workflow 日志
// GET /workflows/logs
// --- END COMMENT ---

/**
 * 获取 workflow 日志列表
 * 倒序返回 workflow 日志
 * 
 * @param appId - 应用 ID
 * @param params - 查询参数
 * @returns Promise<GetDifyWorkflowLogsResponse> - workflow 日志列表
 */
export async function getDifyWorkflowLogs(
  appId: string,
  params?: GetDifyWorkflowLogsParams
): Promise<GetDifyWorkflowLogsResponse> {
  const slug = 'workflows/logs'; // Dify API 路径
  
  // 构建查询参数
  const searchParams = new URLSearchParams();
  if (params?.keyword) {
    searchParams.append('keyword', params.keyword);
  }
  if (params?.status) {
    searchParams.append('status', params.status);
  }
  if (params?.page) {
    searchParams.append('page', params.page.toString());
  }
  if (params?.limit) {
    searchParams.append('limit', params.limit.toString());
  }
  
  const queryString = searchParams.toString();
  const apiUrl = `/api/dify/${appId}/${slug}${queryString ? `?${queryString}` : ''}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 不需要 Authorization 头，这是代理的职责
    });

    if (!response.ok) {
      // 尝试解析错误响应
      let errorData: DifyApiError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          status: response.status,
          code: response.status.toString(),
          message: response.statusText || '获取 workflow 日志失败'
        };
      }
      
      console.error('[Dify Workflow Service] 获取 workflow 日志失败:', errorData);
      throw new Error(`获取 workflow 日志失败: ${errorData.message}`);
    }

    const result: GetDifyWorkflowLogsResponse = await response.json();
    
    console.log('[Dify Workflow Service] 成功获取 workflow 日志:', {
      appId,
      params,
      page: result.page,
      limit: result.limit,
      total: result.total,
      dataCount: result.data.length,
      hasMore: result.has_more
    });
    
    return result;

  } catch (error) {
    console.error('[Dify Workflow Service] 获取 workflow 日志时发生错误:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('获取 workflow 日志时发生未知错误');
  }
} 