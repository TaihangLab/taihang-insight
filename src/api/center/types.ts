/**
 * VisionAI Center API 类型定义
 * 所有 API 模块共享的类型定义
 */

// ============================================================================
// 通用类型
// ============================================================================

/**
 * 分页参数
 */
export interface PageParams {
  page?: number
  limit?: number
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
  name?: string
  framework?: string
  device_type?: string
  status?: string
  usage_status?: string
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
  name?: string
  category?: string
  status?: string | boolean
  type?: string
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
  status?: string
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
