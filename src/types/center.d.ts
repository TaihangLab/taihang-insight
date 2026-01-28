/**
 * VisionAI Center API 类型定义
 * 包含所有 API 的请求和响应类型
 */

// ============================================
// 基础类型
// ============================================

/**
 * 统一响应格式
 */
export interface UnifiedResponse<T = any> {
  code: number
  msg: string
  data: T
  total?: number
  page?: number
  limit?: number
  pages?: number
  pagination?: any
}

/**
 * 分页查询参数
 */
export interface PageParams {
  page?: number
  limit?: number
}

/**
 * 分页响应数据
 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  pages?: number
  pagination?: any
}

// ============================================
// 模型管理类型
// ============================================

/**
 * 模型状态
 */
export type ModelStatus = 'loaded' | 'unloaded'

/**
 * 模型使用状态
 */
export type UsageStatus = 'using' | 'unused'

/**
 * 模型实体
 */
export interface Model {
  id: number
  name: string
  version: string
  description?: string
  model_status: ModelStatus
  usage_status: UsageStatus
  created_at: string
  updated_at: string
  config?: any
  server_metadata?: any
  model_config?: any
  skill_classes?: string[]
}

/**
 * 模型列表查询参数
 */
export interface ModelQueryParams extends PageParams {
  name?: string
  usage_status?: UsageStatus
}

// ============================================
// 技能管理类型
// ============================================

/**
 * 技能状态
 */
export type SkillStatus = 'published' | 'unpublished'

/**
 * 应用场景
 */
export type ApplicationScenario = 'video_analysis' | 'image_processing'

/**
 * 技能类实体
 */
export interface SkillClass {
  id: number
  skill_name: string
  skill_type?: string
  description?: string
  status?: boolean | SkillStatus
  version?: string
  created_at?: string
  updated_at?: string
  prompt_template?: string
  skill_tags?: string[]
  config?: any
}

/**
 * 技能列表查询参数
 */
export interface SkillQueryParams extends PageParams {
  name?: string
  type?: string
  type_filter?: string
  status?: boolean | SkillStatus
  query?: string
}

/**
 * AI任务实体
 */
export interface AITask {
  id: number
  camera_id: number
  skill_class_id: number
  status?: string | boolean
  created_at?: string
  updated_at?: string
  running_period?: RunningPeriod
  confidence_threshold?: number
  enabled?: boolean
  electronic_fence?: ElectronicFence
}

/**
 * 运行时段配置
 */
export interface RunningPeriod {
  enabled: boolean
  periods: Array<{
    start: string
    end: string
  }>
}

/**
 * 电子围栏配置
 */
export interface ElectronicFence {
  enabled: boolean
  points: Array<[number, number]>
}

/**
 * 多模态LLM技能实体
 */
export interface LlmSkill {
  skill_name: string
  skill_id: string
  application_scenario: ApplicationScenario
  skill_tags: string[]
  skill_icon?: string
  skill_description: string
  prompt_template: string
  output_parameters: OutputParameter[]
  alert_conditions?: any
  status?: boolean
  created_at?: string
  updated_at?: string
}

/**
 * 输出参数配置
 */
export interface OutputParameter {
  name: string
  type: string
  description?: string
  required?: boolean
  enum_values?: any[]
}

/**
 * 多模态LLM任务实体
 */
export interface LlmTask {
  id: number
  name: string
  description?: string
  skill_id: string
  camera_id?: number
  frame_rate: number
  status: boolean
  alert_level: number
  running_period?: RunningPeriod
  created_at?: string
  updated_at?: string
}

// ============================================
// 摄像头管理类型
// ============================================

/**
 * 摄像头实体
 */
export interface Camera {
  id: number
  name: string
  camera_uuid: string
  location: string
  status: boolean
  tags: string[]
  camera_type: string
  skill_names: string[]
}

/**
 * 摄像头列表查询参数
 */
export interface CameraQueryParams extends PageParams {
  name?: string
  location?: string
  tags?: string[] | string
  match_all?: boolean
}

// ============================================
// 预警管理类型
// ============================================

/**
 * 预警等级
 */
export type AlertLevel = 1 | 2 | 3 | 4

/**
 * 预警状态
 */
export type AlertStatus = 1 | 2 | 3 // 1-待处理, 2-处理中, 3-已处理

/**
 * 预警状态字符串
 */
export type AlertStatusString = '待处理' | '处理中' | '已处理' | '已归档' | '误报'

/**
 * 预警实体
 */
export interface Alert {
  id: number
  camera_id: number
  camera_name?: string
  alert_type: string
  alert_name?: string
  alert_level?: AlertLevel
  status?: AlertStatus | AlertStatusString
  task_id?: number
  location?: string
  alert_time?: string
  image_url?: string
  processing_notes?: string
  processed_by?: string
  confidence?: number
  bounding_boxes?: any[]
  metadata?: any
  created_at?: string
  updated_at?: string
}

/**
 * 预警列表查询参数
 */
export interface AlertQueryParams extends PageParams {
  camera_id?: number
  camera_name?: string
  alert_type?: string
  alert_level?: AlertLevel | string
  alert_name?: string
  task_id?: number
  location?: string
  status?: AlertStatus | AlertStatusString | string
  start_date?: string
  end_date?: string
  start_time?: string
  end_time?: string
  startDate?: string
  endDate?: string
  warningLevel?: string
  warningType?: string
  warningSkill?: string
  warningName?: string
  warningId?: string
  statusFilter?: string
}

/**
 * 预警状态更新数据
 */
export interface AlertStatusUpdate {
  status?: AlertStatus | AlertStatusString
  processing_notes?: string
  processed_by?: string
}

// ============================================
// 复判技能类型
// ============================================

/**
 * 复判技能实体
 */
export interface ReviewSkill {
  id: number
  skill_name: string
  skill_tags?: string[]
  description: string
  prompt_template: string
  created_at?: string
  updated_at?: string
}

/**
 * 复判技能创建数据
 */
export interface CreateReviewSkillRequest {
  skill_name: string
  skill_tags?: string[]
  description: string
  prompt_template: string
}

/**
 * 复判技能更新数据
 */
export interface UpdateReviewSkillRequest {
  skill_name?: string
  skill_tags?: string[]
  description?: string
  prompt_template?: string
}

/**
 * 预览测试响应
 */
export interface PreviewTestResponse {
  analysis_result: string
  confidence?: number
}

// ============================================
// 档案管理类型
// ============================================

/**
 * 档案状态
 */
export type ArchiveStatus = 1 | 2 | 3 // 1=正常，2=归档，3=删除

/**
 * 预警档案实体
 */
export interface AlertArchive {
  id: number
  name: string
  location: string
  description?: string
  start_time: string
  end_time: string
  image_url?: string
  status?: ArchiveStatus
  created_by?: string
  created_at?: string
  updated_at?: string
  alert_count?: number
}

/**
 * 档案列表查询参数
 */
export interface ArchiveQueryParams extends PageParams {
  name?: string
  location?: string
  status?: ArchiveStatus
  start_time?: string
  end_time?: string
}

/**
 * 档案创建数据
 */
export interface CreateArchiveRequest {
  name: string
  location: string
  description?: string
  start_time: string
  end_time: string
  image_url?: string
  created_by?: string
}

// ============================================
// 任务复判类型
// ============================================

/**
 * 任务类型
 */
export type TaskType = 'ai_task' | 'llm_task'

/**
 * 复判配置
 */
export interface ReviewConfig {
  review_enabled: boolean
  review_skill_class_id?: number
  review_confidence_threshold?: number
  review_conditions?: any
}

// ============================================
// 复判记录类型
// ============================================

/**
 * 复判记录实体
 */
export interface ReviewRecord {
  id: number
  task_type: TaskType
  task_id: number
  alert_id?: number
  review_skill_id: number
  original_result: any
  review_result: string
  confidence?: number
  reviewed_by?: string
  reviewed_at?: string
  created_at?: string
}

// ============================================
// 实时监控类型
// ============================================

/**
 * SSE连接状态
 */
export type SSEStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

/**
 * 监控区域
 */
export interface MonitorArea {
  id: number
  name: string
  camera_count: number
  alert_count?: number
}

// ============================================
// 统计数据类型
// ============================================

/**
 * 时间范围
 */
export type TimeRange = 'day' | 'week' | 'month' | '7d' | '30d'

/**
 * 统计条目
 */
export interface StatItem {
  name: string
  count: number
  value: number
}

/**
 * 预警统计摘要
 */
export interface AlertStatisticsSummary {
  total_alerts: number
  pending_count: number
  processing_count: number
  completed_count: number
  online_devices: number
  total_devices: number
  top_alert_types: StatItem[]
  top_locations: StatItem[]
}

/**
 * 转发统计数据
 */
export interface ForwardStatistics {
  time_range: TimeRange
  total_forwards: number
  daily_statistics: Array<{
    date: string
    count: number
  }>
  date_labels: string[]
  forward_counts: number[]
}

/**
 * 预警等级统计
 */
export interface AlertLevelStat {
  alert_level: number
  alert_level_name: string
  count: number
}

/**
 * 位置统计
 */
export interface LocationStat {
  location: string
  count: number
}

// ============================================
// 系统监控类型
// ============================================

/**
 * 系统监控指标
 */
export interface SystemMonitorMetrics {
  cpu_usage: number
  memory_usage: number
  gpu_usage?: number
  disk_usage: number
  network_in?: number
  network_out?: number
  active_tasks: number
  queued_tasks: number
  system_status: 'healthy' | 'warning' | 'critical'
}

// ============================================
// 设备统计类型
// ============================================

/**
 * 设备统计数据
 */
export interface DeviceStatistics {
  total_devices: number
  online_devices: number
  offline_devices: number
  device_types: Array<{
    type: string
    count: number
  }>
  top_alert_devices: Array<{
    device_name: string
    alert_count: number
  }>
}
