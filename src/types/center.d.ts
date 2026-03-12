/**
 * VisionAI Center API 类型定义
 * 所有 API 模块共享的类型定义
 */

// ============================================================================
// 通用类型
// ============================================================================

/**
 * 分页参数（带默认值的实际使用类型）
 */
export type PageParams = {
  /** 页码，从 1 开始 */
  page?: number
  /** 每页数量 */
  limit?: number
}

/**
 * 必填的分页参数
 */
export type RequiredPageParams = {
  /** 页码，从 1 开始 */
  page: number
  /** 每页数量 */
  limit: number
}

/**
 * 带分页信息的列表响应（标准格式）
 *
 * 注意：这是后端返回的标准格式，分页信息直接在响应对象中
 * 不需要特殊的 "PaginatedResponse" 包装类型
 *
 * @example
 * ```typescript
 * // 分页列表
 * type AlertListResponse = {
 *   data: Alert[]
 *   total: number
 *   page: number
 *   limit: number
 *   pages: number
 * }
 *
 * // 单个对象
 * type UserResponse = {
 *   data: User
 *   total: number
 *   page: number
 *   limit: number
 *   pages: number
 * }
 * ```
 */
export type ListWithPagination<T> = {
  /** 数据列表 */
  data: T[]
  /** 总记录数 */
  total: number
  /** 当前页码 */
  page: number
  /** 每页数量 */
  limit: number
  /** 总页数 */
  pages: number
}

// ============================================================================
// 模型相关类型
// ============================================================================

/**
 * 模型数据
 */
export interface Model {
  id: number
  name: string
  version?: string
  file_path?: string
  framework?: string
  device_type?: string
  status?: string
  model_status?: string
  usage_status?: string
  loaded?: boolean
  description?: string
  config?: any
  server_metadata?: any
  model_config?: any
  skill_classes?: any
  created_at?: string
  updated_at?: string
}

/**
 * 模型查询参数
 */
export interface ModelQueryParams extends PageParams {
  query_name?: string
  framework?: string
  device_type?: string
  status?: string
  query_used?: boolean
}

// ============================================================================
// 技能相关类型
// ============================================================================

/**
 * 技能类
 */
export interface SkillClass {
  id: number
  name: string
  description?: string
  category?: string
  icon_url?: string
  created_at?: string
  updated_at?: string
}

/**
 * 技能查询参数
 */
export interface SkillQueryParams extends PageParams {
  query_name?: string
  category?: string
  status?: string | boolean
  query_type?: string
  query?: string
}

/**
 * AI 技能
 */
export interface Skill {
  id: number
  name: string
  display_name?: string
  skill_class_id: number
  skill_class_name?: string
  description?: string
  status: string
  config?: any
  created_at?: string
  updated_at?: string
}

/**
 * AI 任务
 */
export interface AITask {
  id: number
  name: string
  skill_id: number
  skill_class_id?: number
  skill_name: string
  camera_id: number
  camera_name?: string
  status: string
  running: boolean
  running_period?: string
  electronic_fence?: any
  created_at?: string
  updated_at?: string
}

/**
 * LLM 技能
 */
export interface LlmSkill {
  id: string
  skill_id?: string
  skill_name: string
  display_name?: string
  description?: string
  skill_description?: string
  system_prompt?: string
  user_prompt_template?: string
  prompt_template?: string
  provider?: string
  model_name?: string
  temperature?: number
  max_tokens?: number
  status: boolean
  icon_url?: string
  skill_icon?: string
  skill_tags?: string[]
  application_scenario?: string
  output_parameters?: any
  alert_conditions?: any
  created_at?: string
  updated_at?: string
}

/**
 * LLM 任务
 */
export interface LlmTask {
  id: number
  name: string
  skill_id?: string
  llm_skill_id: string
  llm_skill_name?: string
  camera_id: number
  status: string
  running: boolean
  description?: string
  frame_rate?: number
  alert_level?: number
  running_period?: string
  created_at?: string
  updated_at?: string
}

// ============================================================================
// 摄像头相关类型
// ============================================================================

/**
 * 摄像头
 */
export interface Camera {
  id: number
  name: string
  camera_uuid: string
  location?: string
  status: boolean
  tags?: string[]
  camera_type?: string
  skill_names?: string[]
  created_at?: string
  updated_at?: string
}

/**
 * 摄像头查询参数
 */
export interface CameraQueryParams extends PageParams {
  name?: string
  location?: string
  status?: boolean
  camera_type?: string
}

// ============================================================================
// 预警相关类型
// ============================================================================

/**
 * 预警
 */
export interface Alert {
  id: number
  name: string
  device_id?: number
  device_name?: string
  camera_id?: number
  camera_name?: string
  alert_time: string
  alert_level: number
  alert_type?: string
  status?: string
  location?: string
  description?: string
  violation_image_url?: string
  violation_video_url?: string
  extra_data?: any
  created_at?: string
  updated_at?: string
}

/**
 * 预警查询参数
 */
export interface AlertQueryParams extends PageParams {
  name?: string
  device_name?: string
  alert_level?: number
  alert_type?: string
  alert_name?: string
  alert_id?: number
  status?: string
  start_date?: string
  end_date?: string
}

/**
 * 预警状态更新
 */
export interface AlertStatusUpdate {
  status: string
  handler?: string
  notes?: string
}

// ============================================================================
// 档案相关类型
// ============================================================================

/**
 * 预警档案
 */
export interface AlertArchive {
  id: number
  name: string
  location: string
  start_time: string
  end_time: string
  description?: string
  alert_count?: number
  created_at?: string
  updated_at?: string
}

/**
 * 档案查询参数
 */
export interface ArchiveQueryParams extends PageParams {
  name?: string
  location?: string
  start_date?: string
  end_date?: string
}

/**
 * 创建档案请求
 */
export interface CreateArchiveRequest {
  name: string
  location: string
  start_time: string
  end_time: string
  description?: string
}

// ============================================================================
// 复判技能相关类型
// ============================================================================

/**
 * 复判技能
 */
export interface ReviewSkill {
  id: string
  skill_name: string
  display_name?: string
  description: string
  prompt_template: string
  category?: string
  provider?: string
  model_name?: string
  status: boolean
  created_at?: string
  updated_at?: string
}

/**
 * 创建复判技能请求
 */
export interface CreateReviewSkillRequest {
  skill_name: string
  description: string
  prompt_template: string
  category?: string
}

/**
 * 更新复判技能请求
 */
export interface UpdateReviewSkillRequest {
  skill_name?: string
  description?: string
  prompt_template?: string
  category?: string
  status?: boolean
}

/**
 * 预览测试响应
 */
export interface PreviewTestResponse {
  result: string
  confidence?: number
}

// ============================================================================
// 本地视频相关类型
// ============================================================================

/**
 * 本地视频数据
 */
export interface LocalVideo {
  id: number
  name: string
  description?: string
  file_path: string
  file_size: number
  duration?: number
  fps?: number
  width?: number
  height?: number
  is_streaming: boolean
  stream_id?: string
  stream_fps?: number
  created_at: string
}

/**
 * 推流状态
 */
export interface StreamStatus {
  stream_id: string
  video_id: number
  video_name: string
  rtsp_url?: string
  stats?: any
}

// ============================================================================
// SSE 相关类型
// ============================================================================

/**
 * SSE消息回调类型
 */
export type SSEMessageCallback = (data: any) => void
export type SSEErrorCallback = (event: Event) => void
export type SSECloseCallback = () => void

// ============================================================================
// 预警转发相关类型
// ============================================================================

/**
 * 时间范围
 */
export type ForwardTimeRange = '7d' | '30d'

/**
 * 预警转发统计
 */
export interface AlertForwardStatistics {
  time_range: ForwardTimeRange
  total_forwards: number
  daily_statistics: DailyStatistic[]
  date_labels: string[]
  forward_counts: number[]
}

/**
 * 日统计
 */
export interface DailyStatistic {
  date: string
  count: number
}

// ============================================================================
// 聊天助手相关类型
// ============================================================================

/**
 * 聊天消息数据
 */
export interface ChatMessage {
  message: string
  conversation_id?: string | null
  system_prompt?: string | null
  stream?: boolean
  temperature?: number | null
  max_tokens?: number | null
  context_length?: number
  model?: string | null
}

/**
 * 会话消息
 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  message_id?: string
  timestamp?: string
}

/**
 * 会话信息
 */
export interface Conversation {
  conversation_id: string
  title: string
  message_count: number
  last_message_time: string
  created_at: string
  group_id?: string | null
}

/**
 * 分组信息
 */
export interface Group {
  id: string
  name: string
  conversation_count: number
  created_at: string
  updated_at: string
}

/**
 * 流式聊天数据块
 */
export interface ChatChunk {
  /** 本次接收的内容片段 */
  content: string
  /** 完整的响应内容（累计） */
  fullResponse: string
  /** 会话ID */
  conversationId: string
  /** 是否完成 */
  done: boolean
}

/**
 * 流式聊天选项
 */
export interface ChatStreamOptions {
  /** 取消信号 */
  signal?: AbortSignal
}

// ============================================================================
// 设备统计相关类型
// ============================================================================

/**
 * 设备状态统计
 */
export interface DeviceStatusStatistics {
  total_devices: number
  online_devices: number
  offline_devices: number
  online_rate: number
  device_groups: DeviceGroup[]
}

/**
 * 设备分组
 */
export interface DeviceGroup {
  name: string
  online: number
  offline: number
  total: number
}

/**
 * 设备树节点
 */
export interface DeviceTreeNode {
  id: string
  label: string
  status?: string
  children?: DeviceTreeNode[]
}

/**
 * 设备接入摘要
 */
export interface ConnectionSummary {
  total_connections: number
  video_streams: number
  capture_services: number
  nvr_calls: number
  other_connections: number
}

// ============================================================================
// 实时检测相关类型
// ============================================================================

/**
 * 检测结果
 */
export interface DetectionResult {
  task_id: number
  detections: Detection[]
  timestamp: string
}

/**
 * 单个检测结果
 */
export interface Detection {
  class_name: string
  confidence: number
  bbox: BBox
  track_id?: number
}

/**
 * 边界框
 */
export interface BBox {
  x: number
  y: number
  width: number
  height: number
}

// ============================================================================
// 实时监控相关类型
// ============================================================================

/**
 * 通道查询参数
 */
export interface ChannelQueryParams {
  page?: number
  count?: number
  query?: string
  online?: boolean
  has_record_plan?: boolean
  channel_type?: number
  civil_code?: string
  parent_device_id?: string
}

/**
 * 通道数据
 */
export interface Channel {
  id: number
  name: string
  channel_id: string
  status: boolean
  online: boolean
  channel_type: number
  civil_code?: string
  device_id?: string
}

/**
 * 播放流信息
 */
export interface PlayStreamInfo {
  stream_url: string
  stream_type: string
  rtsp_url?: string
  flv_url?: string
  hls_url?: string
}

/**
 * 树节点查询参数
 */
export interface TreeQueryParams {
  query?: string
  parent?: number
  hasChannel?: boolean
  online?: boolean
  channel_type?: number
}

/**
 * 树节点
 */
export interface TreeNode {
  id: string | number
  label: string
  children?: TreeNode[]
  status?: string
  type?: string
}

// ============================================================================
// 复判记录相关类型
// ============================================================================

/**
 * 复判记录查询参数
 */
export interface ReviewRecordQueryParams {
  page?: number
  limit?: number
  alert_id?: number
  reviewer_id?: number
  start_time?: string
  end_time?: string
}

/**
 * 复判记录数据
 */
export interface ReviewRecord {
  id: number
  alert_id: number
  reviewer_id: number
  reviewer_name: string
  review_result: string
  review_notes?: string
  confidence?: number
  created_at?: string
  updated_at?: string
}

/**
 * 复判记录统计
 */
export interface ReviewRecordStatistics {
  total_reviews: number
  correct_reviews: number
  false_alarm_reviews: number
  accuracy_rate: number
}

// ============================================================================
// 复判技能相关类型
// ============================================================================

/**
 * 复判技能查询参数
 */
export interface ReviewSkillQueryParams extends PageParams {
  status?: boolean | string
  name?: string
  tag?: string
  searchKeyword?: string
  selectedCategory?: string
  selectedProvider?: string
}

// ============================================================================
// 系统监控相关类型
// ============================================================================

/**
 * 资源类型
 */
export type ResourceMetric = 'cpu' | 'memory' | 'disk' | 'network'

/**
 * 时间范围
 */
export type TimeRange = '1h' | '6h' | '24h' | '7d'

/**
 * CPU 资源信息
 */
export interface CPUInfo {
  usage: number
  cores: number
  avg_temp: number
  max_temp: number
}

/**
 * 内存资源信息
 */
export interface MemoryInfo {
  usage: number
  total: string
  used: string
}

/**
 * 磁盘资源信息
 */
export interface DiskInfo {
  usage: number
  total: string
  used: string
  type: string
}

/**
 * GPU 资源信息
 */
export interface GPUInfo {
  usage: number
  model: string
  vram_total: string
  temperature: number
}

/**
 * 服务器信息
 */
export interface ServerInfo {
  master: number
  nodes: number
}

/**
 * 系统资源数据（完整）
 */
export interface SystemResourcesData {
  cpu: CPUInfo
  memory: MemoryInfo
  disk: DiskInfo
  gpu: GPUInfo
  servers: ServerInfo
  timestamp: string
}

/**
 * 当前资源使用率（简化版，用于旧接口兼容）
 */
export interface CurrentResources {
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  network_usage: number
  timestamp: string
}

/**
 * 资源历史数据
 */
export interface ResourceHistory {
  metric: ResourceMetric
  time_range: TimeRange
  time_labels: string[]
  data_points: number[]
}

/**
 * 存储使用情况
 */
export interface StorageUsage {
  total_storage: number
  used_storage: number
  storage_usage: number
  storage_list: StorageItem[]
}

/**
 * 存储项
 */
export interface StorageItem {
  name: string
  usage: number
  total: number
}

/**
 * 带宽使用情况
 */
export interface BandwidthUsage {
  time_range: TimeRange
  time_labels: string[]
  upstream_bandwidth: number[]
  downstream_bandwidth: number[]
  current_upstream: number
  current_downstream: number
}

// ============================================================================
// 任务复判相关类型
// ============================================================================

/**
 * 任务复判配置
 */
export interface TaskReviewConfig {
  review_enabled: boolean
  review_skill_class_id?: number
  review_confidence_threshold?: number
  review_conditions?: Record<string, any>
}

// ============================================================================
// 档案记录相关类型
// ============================================================================

/**
 * 预警记录查询参数
 */
export interface AlertRecordQueryParams extends PageParams {
  name?: string
  device_name?: string
  alert_level?: number
  alert_type?: string
  status?: number
  start_time?: string
  end_time?: string
}

/**
 * 预警记录数据
 */
export interface AlertRecord {
  id: number
  archive_id: number
  name: string
  device_name: string
  alert_time: string
  alert_level: number
  alert_type?: string
  location?: string
  description?: string
  remark?: string
  violation_image_url?: string
  violation_video_url?: string
  extra_data?: any
  created_by?: string
  created_at?: string
  updated_at?: string
}
