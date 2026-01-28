/**
 * VisionAI 服务统一导出
 *
 * 所有服务模块的统一入口
 */

// 导出所有类型
export * from './types'

// 导出所有服务
export { default as modelService } from './model.service'
export { default as skillService } from './skill.service'
export { default as aiTaskService } from './ai-task.service'
export { default as cameraService } from './camera.service'
export { default as alertService } from './alert.service'
export { default as llmSkillService } from './llm-skill.service'
export { default as llmTaskService } from './llm-task.service'
export { default as reviewSkillService } from './review-skill.service'
export { default as reviewRecordService } from './review-record.service'
export { default as chatService } from './chat.service'
export { default as channelService } from './channel.service'
export { default as regionService } from './region.service'

// 导出 axios 配置
export { default as axiosInstance } from './config/axios'
export { getApiBaseURL } from './config/axios'

// 导出服务类（如果需要创建多个实例）
export { ModelService } from './model.service'
export { SkillService } from './skill.service'
export { AITaskService } from './ai-task.service'
export { CameraService } from './camera.service'
export { AlertService } from './alert.service'
export { LlmSkillService } from './llm-skill.service'
export { LlmTaskService } from './llm-task.service'
export { ReviewSkillService } from './review-skill.service'
export { ReviewRecordService } from './review-record.service'
export { ChatService } from './chat.service'
export { ChannelService } from './channel.service'
export { RegionService } from './region.service'
