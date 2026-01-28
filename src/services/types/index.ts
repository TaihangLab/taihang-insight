/**
 * VisionAI 服务类型定义
 */

// ============ 通用类型 ============

export interface ApiResponse<T = any> {
  code?: number
  success?: boolean
  message?: string
  detail?: string
  data?: T
}

export interface PaginatedResponse<T> {
  code?: number
  success?: boolean
  message?: string
  data?: T[]
  page?: number
  limit?: number
  pages?: number
  total?: number
}

export interface PaginationParams {
  page?: number
  limit?: number
  query?: string
}

// ============ 模型相关类型 ============

export interface Model {
  id: string
  name: string
  type: string
  status: string
  usage_status?: string
  description?: string
  created_at?: string
  updated_at?: string
}

export interface ModelListParams extends PaginationParams {
  name?: string
  type?: string
  usage_status?: string
}

// ============ 技能相关类型 ============

export interface SkillClass {
  id: string
  name: string
  type: string
  status: boolean
  required_models: string[]
  params: Record<string, any>
  alert_definitions: any[]
  created_at?: string
  updated_at?: string
}

export interface SkillListParams extends PaginationParams {
  name?: string
  type?: string
  status?: boolean
}

export interface AITaskSkillClass extends SkillClass {
  devices?: any[]
}

// ============ AI 任务相关类型 ============

export interface AITask {
  id: string
  name: string
  camera_id: string
  skill_class_id: string
  status: boolean
  config?: Record<string, any>
  running_period?: {
    enabled: boolean
    periods?: Array<{
      start: string
      end: string
    }>
  }
  created_at?: string
  updated_at?: string
}

export interface CreateAITaskParams {
  name: string
  camera_id: string
  skill_class_id: string
  config?: Record<string, any>
  running_period?: {
    enabled: boolean
    periods?: Array<{
      start: string
      end: string
    }>
  }
}

export interface UpdateAITaskParams {
  name?: string
  camera_id?: string
  skill_class_id?: string
  status?: boolean
  config?: Record<string, any>
  running_period?: {
    enabled: boolean
    periods?: Array<{
      start: string
      end: string
    }>
  }
}

// ============ 大模型技能相关类型 ============

export interface LlmSkill {
  id: string
  skill_id: string
  skill_name: string
  description?: string
  is_published: boolean
  icon_url?: string
  prompt_template: string
  system_prompt?: string
  output_parameters?: Array<{
    name: string
    type: string
    description?: string
  }>
  created_at?: string
  updated_at?: string
}

export interface CreateLlmSkillParams {
  skill_id: string
  skill_name: string
  description?: string
  prompt_template: string
  system_prompt?: string
  output_parameters?: Array<{
    name: string
    type: string
    description?: string
  }>
}

export interface LlmSkillListParams extends PaginationParams {
  skill_name?: string
  is_published?: boolean
}

// ============ 大模型任务相关类型 ============

export interface LlmTask {
  id: string
  name: string
  skill_id: string
  status: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateLlmTaskParams {
  name: string
  skill_id: string
}

export interface LlmTaskListParams extends PaginationParams {
  skill_id?: string
  status?: boolean
}

// ============ 摄像头相关类型 ============

export interface Camera {
  id: string
  name: string
  rtsp_url: string
  channel_id?: string
  status?: string
  created_at?: string
  updated_at?: string
}

export interface CameraListParams extends PaginationParams {
  name?: string
  status?: string
}

export interface UpdateCameraParams {
  name?: string
  rtsp_url?: string
  status?: string
}

// ============ 预警相关类型 ============

export interface Alert {
  id: string
  task_id: string
  camera_id: string
  alert_type: string
  alert_level: number
  image_url?: string
  video_url?: string
  status?: string
  created_at?: string
  timestamp?: string
}

export interface AlertListParams extends PaginationParams {
  task_id?: string
  camera_id?: string
  alert_type?: string
  alert_level?: number
  status?: string
  start_time?: string
  end_time?: string
}

export interface UpdateAlertParams {
  status?: string
  is_false_alarm?: boolean
  review_notes?: string
  reviewer_name?: string
}

export interface AlertStatistics {
  total_alerts: number
  by_level: Record<number, number>
  by_type: Record<string, number>
  false_alarm_rate?: number
}

// ============ 复判技能相关类型 ============

export interface ReviewSkill {
  id: string
  skill_id: string
  skill_name: string
  description?: string
  prompt_template: string
  is_published: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateReviewSkillParams {
  skill_id: string
  skill_name: string
  description?: string
  prompt_template: string
}

export interface ReviewSkillListParams extends PaginationParams {
  skill_name?: string
  is_published?: boolean
}

// ============ 复判记录相关类型 ============

export interface ReviewRecord {
  id: string
  alert_id: string
  original_result: string
  review_result: string
  confidence?: number
  reviewer?: string
  created_at?: string
}

export interface ReviewRecordListParams extends PaginationParams {
  alert_id?: string
  reviewer?: string
  start_time?: string
  end_time?: string
}

export interface CreateReviewRecordParams {
  alert_id: string
  original_result: string
  review_result: string
  confidence?: number
  reviewer?: string
}

// ============ 聊天相关类型 ============

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
  message_id?: string
}

export interface ChatConversation {
  conversation_id: string
  title: string
  message_count: number
  last_message_time: string
  created_at: string
  group_id?: string
}

export interface ChatRequest {
  message: string
  conversation_id?: string
  system_prompt?: string
  stream?: boolean
  temperature?: number
  max_tokens?: number
  context_length?: number
  model?: string
}

export interface ChatResponse {
  conversation_id: string
  message: ChatMessage
  usage?: Record<string, any>
  finish_reason: string
  model: string
  created_at: string
}

export interface ConversationListParams {
  limit?: number
}

// ============ 通道相关类型 ============

export interface Channel {
  id: string
  name: string
  stream_url?: string
  status?: string
}

export interface ChannelListParams extends PaginationParams {
  name?: string
  status?: string
}

// ============ 区域相关类型 ============

export interface RegionTreeNode {
  id: string
  name: string
  children?: RegionTreeNode[]
}

export interface GroupTreeNode {
  id: string
  name: string
  children?: GroupTreeNode[]
}

// ============ 检测结果相关类型 ============

export interface DetectionResult {
  task_id: string
  detections: Array<{
    class_name: string
    confidence: number
    bbox: [number, number, number, number]
  }>
  timestamp: string
}
