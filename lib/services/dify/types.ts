// --- BEGIN COMMENT ---
// lib/services/dify/types.ts
// 定义与 Dify API (特别是 /chat-messages) 交互相关的数据结构
// 基于官方文档: https://docs.dify.ai/api-reference/workflow-api/chat-message
// --- END COMMENT ---

// --- 请求体 Payload 类型 --- (用于 POST /chat-messages)

/** Dify 文件对象结构 (用于请求体) */
export interface DifyFile {
  type: 'image' | 'document' | 'audio' | 'video' | 'custom';
  transfer_method: 'remote_url' | 'local_file';
  url?: string; // transfer_method 为 remote_url 时必需
  upload_file_id?: string; // transfer_method 为 local_file 时必需
}

/** Dify 聊天消息请求体 */
export interface DifyChatRequestPayload {
  query: string; // 用户输入
  inputs?: Record<string, any>; // App 输入变量, 默认为 {}
  response_mode: 'streaming' | 'blocking'; // 响应模式
  user: string; // 用户唯一标识符
  conversation_id?: string | null; // 对话 ID (null 或空字符串表示新对话)
  files?: DifyFile[]; // 文件列表
  auto_generate_name?: boolean; // 是否自动生成标题, 默认 true
}

// --- 流式响应 (SSE) 事件类型 --- (用于 response_mode: 'streaming')

// 基础 SSE 事件结构
interface DifySseBaseEvent {
  task_id: string; // 任务 ID
  id?: string; // 事件或消息 ID (message 事件有)
  conversation_id: string; // 对话 ID
  event: string; // 事件类型
}

/** event: message (文本块) */
export interface DifySseMessageEvent extends DifySseBaseEvent {
  event: 'message';
  id: string; // 消息 ID
  answer: string; // LLM 返回的文本块内容
  created_at: number;
}

/** event: message_file (文件) */
export interface DifySseMessageFileEvent extends DifySseBaseEvent {
  event: 'message_file';
  id: string; // 文件 ID
  type: string; // 文件类型 (例如 'image')
  belongs_to: 'user' | 'assistant';
  url: string; // 文件访问地址
}

/** event: message_end (消息结束) */
export interface DifySseMessageEndEvent extends DifySseBaseEvent {
  event: 'message_end';
  id: string; // 消息 ID
  metadata: Record<string, any>; // 元数据
  usage: DifyUsage; // 模型用量信息
  retriever_resources?: DifyRetrieverResource[]; // 引用和归属
}

/** event: tts_message (TTS 音频块) */
export interface DifySseTtsMessageEvent extends DifySseBaseEvent {
  event: 'tts_message';
  id: string; // 消息 ID
  audio: string; // Base64 编码的音频块
  created_at: number;
}

/** event: tts_message_end (TTS 结束) */
export interface DifySseTtsMessageEndEvent extends DifySseBaseEvent {
  event: 'tts_message_end';
  id: string; // 消息 ID
  audio: string; // 空字符串
  created_at: number;
}

/** event: message_replace (内容替换) */
export interface DifySseMessageReplaceEvent extends DifySseBaseEvent {
  event: 'message_replace';
  id: string; // 消息 ID
  answer: string; // 替换后的完整内容
  created_at: number;
}

/** event: workflow_started (工作流开始) */
export interface DifySseWorkflowStartedEvent extends DifySseBaseEvent {
  event: 'workflow_started';
  workflow_run_id: string;
  data: { id: string; workflow_id: string; sequence_number: number; created_at: number; };
}

/** event: node_started (节点开始) */
export interface DifySseNodeStartedEvent extends DifySseBaseEvent {
  event: 'node_started';
  workflow_run_id: string;
  data: {
    id: string;
    node_id: string;
    node_type: string;
    title: string;
    index: number;
    predecessor_node_id?: string;
    inputs: Record<string, any>;
    created_at: number;
  };
}

/** event: node_finished (节点结束) */
export interface DifySseNodeFinishedEvent extends DifySseBaseEvent {
  event: 'node_finished';
  workflow_run_id: string;
  data: {
    id: string;
    node_id: string;
    index: number;
    predecessor_node_id?: string;
    inputs?: Record<string, any>;
    process_data?: any;
    outputs?: any;
    status: 'running' | 'succeeded' | 'failed' | 'stopped';
    error?: string;
    elapsed_time?: number;
    execution_metadata?: any;
    total_tokens?: number;
    total_price?: string;
    currency?: string;
    created_at: number;
  };
}

/** event: workflow_finished (工作流结束) */
export interface DifySseWorkflowFinishedEvent extends DifySseBaseEvent {
  event: 'workflow_finished';
  workflow_run_id: string;
  data: {
    id: string;
    workflow_id: string;
    status: 'running' | 'succeeded' | 'failed' | 'stopped';
    outputs?: any;
    error?: string;
    elapsed_time?: number;
    total_tokens?: number;
    total_steps: number;
    created_at: number;
    finished_at: number;
  };
}

/** event: error (流错误) */
export interface DifySseErrorEvent extends DifySseBaseEvent {
  event: 'error';
  id?: string; // 消息 ID (可能没有)
  status: number; // HTTP 状态码 (可能是 Dify 内部的)
  code: string; // 错误码
  message: string; // 错误消息
}

/** event: ping (保持连接) */
export interface DifySsePingEvent extends DifySseBaseEvent {
  event: 'ping';
}

/** event: agent_thought (Agent 思考过程) */
export interface DifySseAgentThoughtEvent extends DifySseBaseEvent {
  event: 'agent_thought';
  id: string; // Agent 思考消息 ID
  message_id: string; // 消息 ID
  position: number; // 位置序号
  thought: string; // 思考过程的文本内容
  observation: string; // 观察结果
  tool: string; // 使用的工具
  tool_labels: Record<string, any>; // 工具标签
  tool_input: string; // 工具输入
  message_files: any[]; // 消息文件
  created_at: number; // 创建时间戳
}

/** event: agent_message (Agent 应用的流式回答内容) */
export interface DifySseAgentMessageEvent extends DifySseBaseEvent {
  event: 'agent_message';
  id: string; // Agent 消息 ID
  message_id: string; // 消息 ID
  answer: string; // Agent 回答的文本块
  created_at: number; // 创建时间戳
}

/** Dify 模型用量信息 */
export interface DifyUsage {
  prompt_tokens?: number;
  prompt_unit_price?: string;
  prompt_price_unit?: string;
  prompt_price?: string;
  completion_tokens?: number;
  completion_unit_price?: string;
  completion_price_unit?: string;
  completion_price?: string;
  total_tokens: number;
  total_price?: string;
  currency?: string;
  latency?: number;
}

/** Dify 引用和归属信息 */
export interface DifyRetrieverResource {
  segment_id: string;
  document_id: string;
  document_name: string;
  position: number;
  content: string;
  score?: number;
  // 其他可能的字段
}

// 所有可能的 SSE 事件联合类型
export type DifySseEvent = 
  | DifySseMessageEvent
  | DifySseMessageFileEvent
  | DifySseMessageEndEvent
  | DifySseTtsMessageEvent
  | DifySseTtsMessageEndEvent
  | DifySseMessageReplaceEvent
  | DifySseWorkflowStartedEvent
  | DifySseNodeStartedEvent
  | DifySseNodeFinishedEvent
  | DifySseWorkflowFinishedEvent
  | DifySseIterationStartedEvent
  | DifySseIterationNextEvent
  | DifySseIterationCompletedEvent
  | DifySseParallelBranchStartedEvent
  | DifySseParallelBranchFinishedEvent
  | DifySseLoopStartedEvent
  | DifySseLoopNextEvent
  | DifySseLoopCompletedEvent
  | DifySseErrorEvent
  | DifySsePingEvent
  | DifySseAgentThoughtEvent
  | DifySseAgentMessageEvent;

// --- BEGIN COMMENT ---
// 新增：迭代相关的SSE事件类型
// --- END COMMENT ---

/** event: iteration_started (迭代开始) */
export interface DifySseIterationStartedEvent extends DifySseBaseEvent {
  event: 'iteration_started';
  workflow_run_id: string;
  data: {
    id: string;
    node_id: string;
    node_type: string;
    title: string;
    iteration_id: string;
    iteration_index: number;
    total_iterations?: number;
    inputs: Record<string, any>;
    created_at: number;
  };
}

/** event: iteration_next (迭代下一轮) */
export interface DifySseIterationNextEvent extends DifySseBaseEvent {
  event: 'iteration_next';
  workflow_run_id: string;
  data: {
    id: string;
    node_id: string;
    iteration_id: string;
    iteration_index: number;
    outputs?: Record<string, any>;
    created_at: number;
  };
}

/** event: iteration_completed (迭代完成) */
export interface DifySseIterationCompletedEvent extends DifySseBaseEvent {
  event: 'iteration_completed';
  workflow_run_id: string;
  data: {
    id: string;
    node_id: string;
    iteration_id: string;
    total_iterations: number;
    outputs: Record<string, any>;
    elapsed_time: number;
    created_at: number;
  };
}

/** event: parallel_branch_started (并行分支开始) */
export interface DifySseParallelBranchStartedEvent extends DifySseBaseEvent {
  event: 'parallel_branch_started';
  workflow_run_id: string;
  data: {
    id: string;
    node_id: string;
    branch_id: string;
    branch_index: number;
    total_branches?: number;
    inputs: Record<string, any>;
    created_at: number;
  };
}

/** event: parallel_branch_finished (并行分支结束) */
export interface DifySseParallelBranchFinishedEvent extends DifySseBaseEvent {
  event: 'parallel_branch_finished';
  workflow_run_id: string;
  data: {
    id: string;
    node_id: string;
    branch_id: string;
    branch_index: number;
    status: 'succeeded' | 'failed' | 'stopped';
    outputs?: Record<string, any>;
    error?: string;
    elapsed_time: number;
    created_at: number;
  };
}

// --- BEGIN COMMENT ---
// 新增：循环(Loop)相关的SSE事件类型
// Loop与Iteration的区别：
// - Loop：基于条件判断的重复执行，可能无限循环或基于计数器
// - Iteration：基于输入数据列表的遍历执行，有明确的结束条件
// --- END COMMENT ---

/** event: loop_started (循环开始) */
export interface DifySseLoopStartedEvent extends DifySseBaseEvent {
  event: 'loop_started';
  workflow_run_id: string;
  data: {
    id: string;
    node_id: string;
    node_type: string;
    title: string;
    inputs: Record<string, any>;
    metadata?: { loop_length?: number }; // 循环限制信息
    created_at: number;
  };
}

/** event: loop_next (循环下一轮) */
export interface DifySseLoopNextEvent extends DifySseBaseEvent {
  event: 'loop_next';
  workflow_run_id: string;
  data: {
    id: string;
    node_id: string;
    node_type: string;
    title: string;
    index: number;
    pre_loop_output?: Record<string, any>;
    created_at: number;
  };
}

/** event: loop_completed (循环完成) */
export interface DifySseLoopCompletedEvent extends DifySseBaseEvent {
  event: 'loop_completed';
  workflow_run_id: string;
  data: {
    id: string;
    node_id: string;
    // 🎯 修复：实际数据中没有total_loops字段，需要从其他地方推断
    outputs?: Record<string, any>;
    elapsed_time?: number;
    created_at: number;
  };
}

// --- 服务函数返回类型 --- (供 Hook 使用)

export interface DifyStreamResponse {
  // --- BEGIN COMMENT ---
  // 经过处理的文本块流，只包含 `event: message` 中的 `answer` 字段内容。
  // 服务层负责解析 SSE 并过滤出文本。
  // --- END COMMENT ---
  answerStream: AsyncGenerator<string, void, undefined>; 
  
  // --- BEGIN COMMENT ---
  // 提供方法以在流处理过程中或结束后获取 conversation_id。
  // 该方法在流开始时返回 null，在流中捕获到 ID 后返回 ID。
  // --- END COMMENT ---
  getConversationId: () => string | null;

  // --- BEGIN COMMENT ---
  // 提供方法以在流处理过程中或结束后获取 task_id。
  // --- END COMMENT ---
  getTaskId: () => string | null;

  // --- BEGIN COMMENT ---
  // 可以添加一个 Promise，在 message_end 事件到达时 resolve，
  // 并携带最终的 usage 和 metadata 等信息，供需要完整响应的场景使用。
  // --- END COMMENT ---
  completionPromise?: Promise<{ usage?: DifyUsage; metadata?: Record<string, any>; retrieverResources?: DifyRetrieverResource[] }>;

  // --- BEGIN COMMENT ---
  // 可能还需要传递其他从流中提取的非文本事件，如文件事件等，根据需求添加。
  // fileEventsStream?: AsyncGenerator<DifySseMessageFileEvent, void, undefined>;
  // --- END COMMENT ---
}

// --- BEGIN COMMENT ---
// Dify 停止流式任务 API 类型
// POST /chat-messages/:task_id/stop
// --- END COMMENT ---

/** Dify 停止任务请求体 */
export interface DifyStopTaskRequestPayload {
  user: string; // 用户唯一标识符，必须和发送消息时一致
}

/** Dify 停止任务响应体 */
export interface DifyStopTaskResponse {
  result: 'success'; // 固定返回 success
}

// --- BEGIN ADDITION ---
// --- BEGIN COMMENT ---
// Dify 文件上传 API 响应体
// POST /files/upload
// --- END COMMENT ---
export interface DifyFileUploadResponse {
  id: string; // 文件 ID (UUID)
  name: string;
  size: number;
  extension: string;
  mime_type: string;
  created_by: string | number; // 用户 ID (可能是数字或字符串)
  created_at: number; // Unix 时间戳
}
// --- END ADDITION --- 

// --- BEGIN MESSAGES API TYPES ---

// --- BEGIN COMMENT ---
// /messages API - 通用错误响应结构
// 这个可以作为 message-service.ts 抛出错误的类型参考
// --- END COMMENT ---
export interface DifyApiError {
  status: number;      // HTTP 状态码
  code: string;        // Dify 内部错误码或 HTTP 状态码字符串
  message: string;     // 错误描述
  [key: string]: any; // 允许其他可能的错误字段，如 Dify 返回的 validation_errors 等
}

// --- BEGIN COMMENT ---
// /messages API - 消息文件对象结构
// --- END COMMENT ---
export interface DifyMessageFile {
  id: string; // 文件 ID
  type: string; // 文件类型，例如 "image" (图片)
  url: string; // 文件的预览地址
  belongs_to: 'user' | 'assistant'; // 文件归属方，"user" (用户) 或 "assistant" (助手)
}

// --- BEGIN COMMENT ---
// /messages API - 消息反馈信息结构
// --- END COMMENT ---
export interface DifyMessageFeedback {
  rating: 'like' | 'dislike' | null; // 点赞 'like' / 点踩 'dislike'，或者可能为 null
  // 根据实际 API 可能还有其他反馈相关的字段，例如 content
}

// --- BEGIN COMMENT ---
// /messages API - 单条消息对象结构 (与 SSE 中的 DifyMessage 不同，这是获取历史消息的特定结构)
// --- END COMMENT ---
export interface ConversationMessage {
  id: string; // 消息的唯一 ID
  conversation_id: string; // 该消息所属的会话 ID
  inputs: Record<string, any>; // 用户输入的参数，具体内容取决于应用设计
  query: string; // 用户发送的原始提问内容
  answer: string; // AI 助手的回答内容
  message_files: DifyMessageFile[]; // 消息中包含的文件列表
  created_at: number; // 消息创建的时间戳 (Unix timestamp)
  feedback: DifyMessageFeedback | null; // 用户对这条回答的反馈信息
  retriever_resources: DifyRetrieverResource[]; // 引用和归属分段列表
}

// --- BEGIN COMMENT ---
// /messages API - 获取历史消息的请求查询参数 (Query Parameters) 接口
// --- END COMMENT ---
export interface GetMessagesParams {
  conversation_id: string; // 会话 ID (必需)
  user: string; // 用户标识 (必需)
  first_id?: string | null; // 当前消息列表最上面 (最早) 那条消息的 ID，用于分页 (可选, 默认为 null)
  limit?: number; // 一次请求希望返回多少条聊天记录 (可选, 默认为 20)
}

// --- BEGIN COMMENT ---
// /messages API - 获取历史消息的响应体结构
// --- END COMMENT ---
export interface GetMessagesResponse {
  data: ConversationMessage[]; // 本次请求获取到的消息对象列表
  has_more: boolean; // 是否还有更早的聊天记录可以加载
  limit: number; // 本次请求实际返回的聊天记录条数
}
// --- END MESSAGES API TYPES --- 


// --- BEGIN CONVERSATIONS API TYPES ---
// --- BEGIN COMMENT ---
// /conversations API - 获取会话列表的参数
// --- END COMMENT ---
export interface GetConversationsParams {
  user: string; // 用户标识，必需
  last_id?: string | null; // 当前页最后一条记录的ID，用于分页，选填
  limit?: number; // 一次返回多少条记录，默认20，选填
  sort_by?: 'created_at' | '-created_at' | 'updated_at' | '-updated_at'; // 排序字段，默认-updated_at
}

// --- BEGIN COMMENT ---
// /conversations API - 单个会话对象结构
// --- END COMMENT ---
export interface Conversation {
  id: string; // 会话ID
  name: string; // 会话名称，默认由大语言模型生成
  inputs: Record<string, any>; // 用户输入参数
  status: string; // 会话状态
  introduction: string; // 开场白
  created_at: number; // 创建时间(时间戳)
  updated_at: number; // 更新时间(时间戳)
}

// --- BEGIN COMMENT ---
// /conversations API - 获取会话列表的响应体结构
// --- END COMMENT ---
export interface GetConversationsResponse {
  data: Conversation[]; // 会话列表
  has_more: boolean; // 是否有更多会话
  limit: number; // 返回条数
}
// --- BEGIN COMMENT ---
// /conversations API - 删除会话的请求体结构
// --- END COMMENT ---
export interface DeleteConversationRequestPayload {
  user: string; // 用户标识，由开发者定义规则，需保证用户标识在应用内唯一
}

// --- BEGIN COMMENT ---
// /conversations API - 删除会话的响应体结构
// --- END COMMENT ---
export interface DeleteConversationResponse {
  result: 'success';
}

// --- BEGIN COMMENT ---
// /conversations API - 重命名会话的请求体结构
// --- END COMMENT ---
export interface RenameConversationRequestPayload {
  name?: string; // （选填）名称，若 auto_generate 为 true 时，该参数可不传
  auto_generate?: boolean; // （选填）自动生成标题，默认 false
  user: string; // 用户标识，由开发者定义规则，需保证用户标识在应用内唯一
}

// --- BEGIN COMMENT ---
// /conversations API - 重命名会话的响应体结构，返回更新后的会话信息
// --- END COMMENT ---
export interface RenameConversationResponse extends Conversation {
  // 继承了 Conversation 接口的所有字段
}

// --- BEGIN COMMENT ---
// /conversations API - 获取对话变量的请求参数
// --- END COMMENT ---
export interface GetConversationVariablesParams {
  user: string; // 用户标识符，由开发人员定义的规则，在应用程序内必须唯一
  last_id?: string | null; // （选填）当前页最后面一条记录的 ID，默认 null
  limit?: number; // （选填）一次请求返回多少条记录，默认 20 条，最大 100 条，最小 1 条
}

// --- BEGIN COMMENT ---
// /conversations API - 对话变量对象结构
// --- END COMMENT ---
export interface ConversationVariable {
  id: string; // 变量 ID
  name: string; // 变量名称
  value_type: string; // 变量类型（字符串、数字、布尔等）
  value: string; // 变量值
  description: string; // 变量描述
  created_at: number; // 创建时间戳
  updated_at: number; // 最后更新时间戳
}

// --- BEGIN COMMENT ---
// /conversations API - 获取对话变量的响应体结构
// --- END COMMENT ---
export interface GetConversationVariablesResponse {
  limit: number; // 每页项目数
  has_more: boolean; // 是否有更多项目
  data: ConversationVariable[]; // 变量列表
}

// --- END CONVERSATIONS API TYPES ---

// --- BEGIN COMMENT ---
// 应用参数相关类型定义 (GET /parameters)
// --- END COMMENT ---

/** Dify 数字输入控件 */
export interface DifyNumberInputControl {
  label: string; // 控件展示标签名
  variable: string; // 控件 ID
  required: boolean; // 是否必填
  default: number | string; // 默认值（可以是数字或字符串）
  min?: number; // 最小值限制
  max?: number; // 最大值限制
  step?: number; // 步长，默认为1
  precision?: number; // 小数位数限制
}

/** Dify 文本输入控件 */
export interface DifyTextInputControl {
  label: string; // 控件展示标签名
  variable: string; // 控件 ID
  required: boolean; // 是否必填
  max_length?: number; // 最大长度限制
  default: string; // 默认值
}

/** 用户输入表单控件 - 段落文本输入 */
export interface DifyParagraphControl {
  label: string; // 控件展示标签名
  variable: string; // 控件 ID
  required: boolean; // 是否必填
  default: string; // 默认值
}

/** 用户输入表单控件 - 下拉选择 */
export interface DifySelectControl {
  label: string; // 控件展示标签名
  variable: string; // 控件 ID
  required: boolean; // 是否必填
  default: string; // 默认值
  options: string[]; // 选项值列表
}

/** 文件输入控件 */
export interface DifyFileInputControl {
  label: string; // 控件展示标签名
  variable: string; // 控件 ID
  required: boolean; // 是否必填
  default?: File[]; // 默认值（文件数组）
  number_limits?: number; // 文件数量限制
  allowed_file_types?: string[]; // 允许的文件类型
  max_file_size_mb?: number; // 最大文件大小(MB)
}

/** 用户输入表单项 */
export interface DifyUserInputFormItem {
  'text-input'?: DifyTextInputControl;
  'number'?: DifyNumberInputControl;
  'paragraph'?: DifyParagraphControl;
  'select'?: DifySelectControl;
  'file'?: DifyFileInputControl;
  'file-list'?: DifyFileInputControl; // 多文件模式
}

/** 图片上传配置 */
export interface DifyImageUploadConfig {
  enabled: boolean; // 是否开启
  number_limits: number; // 图片数量限制，默认 3
  transfer_methods: ('remote_url' | 'local_file')[]; // 传递方式列表，必选一个
}

/** 文档上传配置 */
export interface DifyDocumentUploadConfig {
  enabled: boolean; // 是否开启
  number_limits: number; // 文档数量限制
  transfer_methods: ('remote_url' | 'local_file')[]; // 传递方式列表
}

/** 音频上传配置 */
export interface DifyAudioUploadConfig {
  enabled: boolean; // 是否开启
  number_limits: number; // 音频数量限制
  transfer_methods: ('remote_url' | 'local_file')[]; // 传递方式列表
}

/** 视频上传配置 */
export interface DifyVideoUploadConfig {
  enabled: boolean; // 是否开启
  number_limits: number; // 视频数量限制
  transfer_methods: ('remote_url' | 'local_file')[]; // 传递方式列表
}

/** 其他文件类型上传配置 */
export interface DifyOtherUploadConfig {
  enabled: boolean; // 是否开启
  number_limits: number; // 文件数量限制
  transfer_methods: ('remote_url' | 'local_file')[]; // 传递方式列表
  custom_extensions?: string[]; // 自定义文件扩展名列表
}

/** 文件上传配置 */
export interface DifyFileUploadConfig {
  enabled?: boolean; // 顶层的文件上传总开关
  allowed_file_types?: string[]; // 允许的文件类型列表
  allowed_file_extensions?: string[]; // 允许的文件扩展名列表
  allowed_file_upload_methods?: string[]; // 允许的上传方式
  max_file_size_mb?: number; // 最大文件大小(MB)
  number_limits?: number; // 文件数量限制（可能的字段名1）
  max_files?: number; // 文件数量限制（可能的字段名2）
  file_count_limit?: number; // 文件数量限制（可能的字段名3）
  image?: DifyImageUploadConfig; // 图片设置
  document?: DifyDocumentUploadConfig; // 文档设置  
  audio?: DifyAudioUploadConfig; // 音频设置
  video?: DifyVideoUploadConfig; // 视频设置
  other?: DifyOtherUploadConfig; // 其他文件类型设置
}

/** 系统参数配置 */
export interface DifySystemParameters {
  file_size_limit: number; // 文档上传大小限制 (MB)
  image_file_size_limit: number; // 图片文件上传大小限制 (MB)
  audio_file_size_limit: number; // 音频文件上传大小限制 (MB)
  video_file_size_limit: number; // 视频文件上传大小限制 (MB)
}

/** 回答后推荐问题配置 */
export interface DifySuggestedQuestionsAfterAnswer {
  enabled: boolean; // 是否开启
}

/** 语音转文本配置 */
export interface DifySpeechToText {
  enabled: boolean; // 是否开启
}

/** 文本转语音配置 */
export interface DifyTextToSpeech {
  enabled: boolean; // 是否开启
  voice?: string; // 语音类型
  language?: string; // 语言
  autoPlay?: 'enabled' | 'disabled'; // 自动播放：enabled 开启, disabled 关闭
}

/** 引用和归属配置 */
export interface DifyRetrieverResourceConfig {
  enabled: boolean; // 是否开启
}

/** 标记回复配置 */
export interface DifyAnnotationReply {
  enabled: boolean; // 是否开启
}

/** 获取应用参数响应 */
export interface DifyAppParametersResponse {
  opening_statement: string; // 开场白
  suggested_questions: string[]; // 开场推荐问题列表
  suggested_questions_after_answer: DifySuggestedQuestionsAfterAnswer; // 启用回答后给出推荐问题
  speech_to_text: DifySpeechToText; // 语音转文本
  text_to_speech: DifyTextToSpeech; // 文本转语音
  retriever_resource: DifyRetrieverResourceConfig; // 引用和归属
  annotation_reply: DifyAnnotationReply; // 标记回复
  user_input_form: DifyUserInputFormItem[]; // 用户输入表单配置
  file_upload: DifyFileUploadConfig; // 文件上传配置
  system_parameters: DifySystemParameters; // 系统参数
}

// --- BEGIN COMMENT ---
// Workflow API 相关类型定义
// POST /workflows/run
// 基于完整的 OpenAPI 文档更新
// --- END COMMENT ---

/** Workflow 输入文件对象 */
export interface DifyWorkflowInputFile {
  type: 'document' | 'image' | 'audio' | 'video' | 'custom';
  transfer_method: 'remote_url' | 'local_file';
  url?: string; // transfer_method 为 remote_url 时必需
  upload_file_id?: string; // transfer_method 为 local_file 时必需
}

/** Dify Workflow 请求体 */
export interface DifyWorkflowRequestPayload {
  inputs: Record<string, any>; // 结构化输入参数，支持字符串、数字、布尔值、对象、文件数组
  response_mode: 'streaming' | 'blocking';
  user: string;
  // 注意：Workflow 没有 conversation_id 概念
}

/** Dify Workflow 执行响应 (blocking模式) */
export interface DifyWorkflowCompletionResponse {
  workflow_run_id: string; // UUID 格式
  task_id: string; // UUID 格式
  data: DifyWorkflowFinishedData;
}

/** Workflow 执行完成数据 */
export interface DifyWorkflowFinishedData {
  id: string; // workflow 执行 ID (UUID)
  workflow_id: string; // 关联 Workflow ID (UUID)
  status: 'running' | 'succeeded' | 'failed' | 'stopped';
  outputs?: Record<string, any> | null; // 结构化输出 (JSON)
  error?: string | null;
  elapsed_time?: number | null; // 耗时(秒)
  total_tokens?: number | null;
  total_steps: number; // 总步数，默认 0
  created_at: number; // 开始时间 (Unix timestamp)
  finished_at: number; // 结束时间 (Unix timestamp)
}

/** Workflow SSE 事件 - workflow_started */
export interface DifyWorkflowSseStartedEvent {
  event: 'workflow_started';
  task_id: string;
  workflow_run_id: string;
  data: {
    id: string;
    workflow_id: string;
    sequence_number: number;
    created_at: number;
  };
}

/** Workflow SSE 事件 - workflow_finished */
export interface DifyWorkflowSseFinishedEvent {
  event: 'workflow_finished';
  task_id: string;
  workflow_run_id: string;
  data: DifyWorkflowFinishedData;
}

/** Workflow SSE 事件 - node_started */
export interface DifyWorkflowSseNodeStartedEvent {
  event: 'node_started';
  task_id: string;
  workflow_run_id: string;
  data: {
    id: string;
    node_id: string;
    node_type: string;
    title: string;
    index: number;
    predecessor_node_id?: string;
    inputs: Record<string, any>;
    created_at: number;
  };
}

/** Workflow SSE 事件 - node_finished */
export interface DifyWorkflowSseNodeFinishedEvent {
  event: 'node_finished';
  task_id: string;
  workflow_run_id: string;
  data: {
    id: string;
    node_id: string;
    index: number;
    predecessor_node_id?: string;
    inputs?: Record<string, any>;
    process_data?: any;
    outputs?: any;
    status: 'running' | 'succeeded' | 'failed' | 'stopped';
    error?: string;
    elapsed_time?: number;
    execution_metadata?: any;
    total_tokens?: number;
    total_price?: string;
    currency?: string;
    created_at: number;
  };
}

/** Workflow SSE 事件 - error */
export interface DifyWorkflowSseErrorEvent {
  event: 'error';
  task_id: string;
  workflow_run_id?: string;
  status: number;
  code: string;
  message: string;
}

/** 所有 Workflow SSE 事件的联合类型 */
export type DifyWorkflowSseEvent = 
  | DifyWorkflowSseStartedEvent
  | DifyWorkflowSseFinishedEvent
  | DifyWorkflowSseNodeStartedEvent
  | DifyWorkflowSseNodeFinishedEvent
  | DifyWorkflowSseErrorEvent
  | DifySseIterationStartedEvent
  | DifySseIterationNextEvent
  | DifySseIterationCompletedEvent
  | DifySseLoopStartedEvent
  | DifySseLoopNextEvent
  | DifySseLoopCompletedEvent;

/** Workflow 流式响应接口 */
export interface DifyWorkflowStreamResponse {
  // 🎯 修复：节点执行进度流，支持所有 workflow 事件类型
  progressStream: AsyncGenerator<DifyWorkflowSseEvent, void, undefined>;
  
  // 获取 workflow_run_id
  getWorkflowRunId: () => string | null;
  
  // 获取 task_id
  getTaskId: () => string | null;
  
  // 完成时的 Promise，包含最终结果
  completionPromise: Promise<DifyWorkflowFinishedData>;
}

/** Workflow API 错误码 */
export type DifyWorkflowErrorCode = 
  | 'invalid_param'
  | 'app_unavailable' 
  | 'provider_not_initialize'
  | 'provider_quota_exceeded'
  | 'model_currently_not_support'
  | 'workflow_request_error';

// --- BEGIN COMMENT ---
// 获取应用基本信息 API 类型定义
// GET /info
// --- END COMMENT ---

/** 获取应用基本信息响应 */
export interface DifyAppInfoResponse {
  name: string; // 应用名称
  description: string; // 应用描述
  tags: string[]; // 应用标签
}

// --- BEGIN COMMENT ---
// 消息反馈 API 类型定义
// POST /messages/:message_id/feedbacks
// --- END COMMENT ---

/** 消息反馈请求体 */
export interface DifyMessageFeedbackRequestPayload {
  rating: 'like' | 'dislike' | null; // 反馈类型：点赞 'like'、点踩 'dislike'、撤销 'null'
  user: string; // 用户标识符
  content?: string; // 消息反馈的具体信息（可选）
}

/** 消息反馈响应体 */
export interface DifyMessageFeedbackResponse {
  result: 'success'; // 固定返回 success
}

// --- BEGIN COMMENT ---
// 语音转文本 API 类型定义
// POST /audio-to-text
// --- END COMMENT ---

/** 语音转文本请求体 */
export interface DifyAudioToTextRequestPayload {
  file: File; // 音频文件
  user: string; // 用户标识符
}

/** 语音转文本响应体 */
export interface DifyAudioToTextResponse {
  text: string; // 转换后的文本
}

// --- BEGIN COMMENT ---
// Text-Generation API 类型定义
// POST /completion-messages
// --- END COMMENT ---

/** 文本生成请求体 */
export interface DifyCompletionRequestPayload {
  inputs: Record<string, any>; // 输入参数
  response_mode: 'streaming' | 'blocking'; // 响应模式
  user: string; // 用户标识符
  files?: DifyFile[]; // 文件列表（可选）
}

/** 文本生成完成响应 (blocking模式) */
export interface DifyCompletionResponse {
  message_id: string; // 消息 ID
  mode: string; // App 模式，固定为 "completion"
  answer: string; // 生成的文本
  metadata: Record<string, any>; // 元数据
  usage: DifyUsage; // 使用量信息
  created_at: number; // 创建时间戳
}

/** 文本生成流式响应接口 */
export interface DifyCompletionStreamResponse {
  // 文本块流
  answerStream: AsyncGenerator<string, void, undefined>;
  
  // 获取消息 ID
  getMessageId: () => string | null;
  
  // 获取任务 ID
  getTaskId: () => string | null;
  
  // 完成时的 Promise
  completionPromise: Promise<{ usage?: DifyUsage; metadata?: Record<string, any> }>;
}

// --- BEGIN COMMENT ---
// WebApp 设置 API 类型定义
// GET /site
// --- END COMMENT ---

/** WebApp 设置响应 */
export interface DifyWebAppSettingsResponse {
  title: string; // WebApp 名称
  chat_color_theme: string; // 聊天颜色主题, hex 格式
  chat_color_theme_inverted: boolean; // 聊天颜色主题是否反转
  icon_type: 'emoji' | 'image'; // 图标类型
  icon: string; // 图标内容 (emoji 或图片 URL)
  icon_background: string; // hex 格式的背景色
  icon_url: string | null; // 图标 URL
  description: string; // 描述
  copyright: string; // 版权信息
  privacy_policy: string; // 隐私政策链接
  custom_disclaimer: string; // 自定义免责声明
  default_language: string; // 默认语言
  show_workflow_steps: boolean; // 是否显示工作流详情
  use_icon_as_answer_icon: boolean; // 是否使用 WebApp 图标替换聊天中的机器人图标
}

// --- BEGIN COMMENT ---
// 应用 Meta 信息 API 类型定义
// GET /meta
// --- END COMMENT ---

/** 工具图标详情 */
export interface DifyToolIconDetail {
  background: string; // hex 格式的背景色
  content: string; // emoji
}

/** 应用 Meta 信息响应 */
export interface DifyAppMetaResponse {
  tool_icons: Record<string, string | DifyToolIconDetail>; // 工具图标，键为工具名称，值为图标 URL 或详情对象
}

/** Workflow 执行详情响应 */
export interface DifyWorkflowRunDetailResponse {
  id: string; // workflow 执行 ID (UUID)
  workflow_id: string; // 关联的 Workflow ID (UUID)
  status: 'running' | 'succeeded' | 'failed' | 'stopped'; // 执行状态
  inputs: string; // 任务输入内容的 JSON 字符串
  outputs: Record<string, any> | null; // 任务输出内容的 JSON 对象
  error: string | null; // 错误原因
  total_steps: number; // 任务执行总步数
  total_tokens: number; // 任务执行总 tokens
  created_at: number; // 任务开始时间 (Unix timestamp)
  finished_at: number | null; // 任务结束时间 (Unix timestamp)
  elapsed_time: number | null; // 耗时(秒)
}

// --- BEGIN COMMENT ---
// Workflow 日志 API 类型定义
// GET /workflows/logs
// --- END COMMENT ---

/** Workflow 执行状态枚举 */
export type DifyWorkflowLogStatus = 'succeeded' | 'failed' | 'stopped' | 'running';

/** 获取 Workflow 日志的请求参数 */
export interface GetDifyWorkflowLogsParams {
  keyword?: string; // 关键字（可选）
  status?: DifyWorkflowLogStatus; // 执行状态（可选）
  page?: number; // 当前页码，默认 1
  limit?: number; // 每页条数，默认 20
}

/** Workflow 日志单条记录 */
export interface DifyWorkflowLogEntry {
  id: string; // workflow 执行 ID (UUID)
  workflow_id: string; // 关联的 Workflow ID (UUID)
  status: DifyWorkflowLogStatus; // 执行状态
  inputs: string; // 任务输入内容的 JSON 字符串
  outputs: Record<string, any> | null; // 任务输出内容的 JSON 对象
  error: string | null; // 错误原因
  total_steps: number; // 任务执行总步数
  total_tokens: number; // 任务执行总 tokens
  created_at: number; // 任务开始时间 (Unix timestamp)
  finished_at: number | null; // 任务结束时间 (Unix timestamp)
  elapsed_time: number | null; // 耗时(秒)
}

/** 获取 Workflow 日志的响应体 */
export interface GetDifyWorkflowLogsResponse {
  page: number; // 当前页码
  limit: number; // 每页条数
  total: number; // 总条数
  has_more: boolean; // 是否还有更多数据
  data: DifyWorkflowLogEntry[]; // 当前页码的数据
}

// --- BEGIN COMMENT ---
// 标注列表 API 类型定义
// GET /apps/annotations
// --- END COMMENT ---

/** 单个标注条目 */
export interface DifyAnnotationItem {
  id: string; // 标注ID (UUID格式)
  question: string; // 问题
  answer: string; // 答案内容
  hit_count: number; // 命中次数
  created_at: number; // 创建时间戳
}

/** 获取标注列表的请求参数 */
export interface GetDifyAnnotationsParams {
  page?: number; // 分页页码，默认：1
  limit?: number; // 每页数量，默认 20，范围 1-100
}

/** 标注列表响应 */
export interface DifyAnnotationListResponse {
  data: DifyAnnotationItem[]; // 标注列表
  has_more: boolean; // 是否有更多数据
  limit: number; // 每页数量
  total: number; // 总数量
  page: number; // 当前页码
}

// --- BEGIN COMMENT ---
// 创建标注 API 类型定义
// POST /apps/annotations
// --- END COMMENT ---

/** 创建标注请求体 */
export interface CreateDifyAnnotationRequest {
  question: string; // 问题
  answer: string; // 答案内容
}

/** 创建标注响应 (返回创建的标注条目) */
export interface CreateDifyAnnotationResponse extends DifyAnnotationItem {
  // 继承 DifyAnnotationItem 的所有字段
}

// --- BEGIN COMMENT ---
// 更新标注 API 类型定义
// PUT /apps/annotations/{annotation_id}
// --- END COMMENT ---

/** 更新标注请求体 */
export interface UpdateDifyAnnotationRequest {
  question: string; // 问题
  answer: string; // 答案内容
}

/** 更新标注响应 (返回更新后的标注条目) */
export interface UpdateDifyAnnotationResponse extends DifyAnnotationItem {
  // 继承 DifyAnnotationItem 的所有字段
}

// --- BEGIN COMMENT ---
// 删除标注 API 类型定义
// DELETE /apps/annotations/{annotation_id}
// 删除成功返回 204 状态码，无响应体
// --- END COMMENT ---

/** 删除标注响应 (204 状态码，无内容) */
export interface DeleteDifyAnnotationResponse {
  // 空接口，表示无响应体
}

// --- BEGIN COMMENT ---
// 标注回复初始设置 API 类型定义
// POST /apps/annotation-reply/{action}
// --- END COMMENT ---

/** 标注回复设置动作类型 */
export type DifyAnnotationReplyAction = 'enable' | 'disable';

/** 标注回复初始设置请求体 */
export interface InitialDifyAnnotationReplySettingsRequest {
  embedding_provider_name?: string | null; // （可选）指定的嵌入模型提供商名称
  embedding_model_name?: string | null; // （可选）指定的嵌入模型名称
  score_threshold: number; // 相似度阈值
}

/** 异步任务响应 */
export interface DifyAsyncJobResponse {
  job_id: string; // 任务 ID (UUID格式)
  job_status: string; // 任务状态
}

/** 异步任务状态响应 */
export interface DifyAsyncJobStatusResponse {
  job_id: string; // 任务 ID (UUID格式)
  job_status: string; // 任务状态
  error_msg?: string | null; // 错误信息（如果任务失败）
}