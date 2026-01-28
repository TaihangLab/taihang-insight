/**
 * VisionAI Center API 统一导出
 *
 * 提供所有视觉AI中心相关API的统一访问入口
 *
 * @example
 * ```typescript
 * import centerAPI from '@/api/center'
 *
 * // 使用模型API
 * const models = await centerAPI.model.getModelList()
 *
 * // 使用技能API
 * const skills = await centerAPI.skill.getSkillList()
 *
 * // 使用摄像头API
 * const cameras = await centerAPI.camera.getCameraList()
 *
 * // 使用预警API
 * const alerts = await centerAPI.alert.getRealTimeAlerts()
 * ```
 */

// 导出各个API模块
import modelAPI from './model'
import skillAPI from './skill'
import cameraAPI from './camera'
import alertAPI from './alert'
import reviewSkillAPI from './reviewSkill'
import archiveAPI from './archive'
import taskReviewAPI from './taskReview'
import reviewRecordAPI from './reviewRecord'
import realtimeMonitorAPI from './realtimeMonitor'
import realtimeDetectionAPI from './realtimeDetection'
import alertStatisticsAPI from './alertStatistics'
import systemMonitorAPI from './systemMonitor'
import deviceStatisticsAPI from './deviceStatistics'
import alertForwardAPI from './alertForward'
import chatAssistantAPI from './chatAssistant'

// 导出基础配置
export { default as visionAIAxios } from './base'
export { handleSimpleResponse } from './base'
export type { UnifiedResponse, PageParams, APIError } from './base'

/**
 * VisionAI Center API 统一接口
 */
const centerAPI = {
  // 模型管理
  model: modelAPI,

  // 技能管理
  skill: skillAPI,

  // 摄像头管理
  camera: cameraAPI,

  // 预警管理
  alert: alertAPI,

  // 复判技能管理
  reviewSkill: reviewSkillAPI,

  // 档案管理
  archive: archiveAPI,

  // 任务复判管理
  taskReview: taskReviewAPI,

  // 复判记录管理
  reviewRecord: reviewRecordAPI,

  // 实时监控管理
  realtimeMonitor: realtimeMonitorAPI,

  // 实时检测管理
  realtimeDetection: realtimeDetectionAPI,

  // 预警统计管理
  alertStatistics: alertStatisticsAPI,

  // 系统监控管理
  systemMonitor: systemMonitorAPI,

  // 设备统计管理
  deviceStatistics: deviceStatisticsAPI,

  // 预警转发统计管理
  alertForward: alertForwardAPI,

  // 智能助手管理
  chatAssistant: chatAssistantAPI
}

// 导出默认实例
export default centerAPI

// 同时也支持命名导出各个API模块
export {
  modelAPI,
  skillAPI,
  cameraAPI,
  alertAPI,
  reviewSkillAPI,
  archiveAPI,
  taskReviewAPI,
  reviewRecordAPI,
  realtimeMonitorAPI,
  realtimeDetectionAPI,
  alertStatisticsAPI,
  systemMonitorAPI,
  deviceStatisticsAPI,
  alertForwardAPI,
  chatAssistantAPI
}
