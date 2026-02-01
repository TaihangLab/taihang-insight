import { AxiosResponse } from 'axios'
import visionAIAxios, { type UnifiedResponse } from './base'
/**
 * 实时检测管理 API
 * 提供 OSD 检测框叠加功能
 */

/**
 * AI 任务信息
 */
export interface AITask {
  id: number
  name: string
  skill_name: string
  camera_id: number
  status: string
  running: boolean
}

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

/**
 * 实时检测管理 API 类
 */
class RealtimeDetectionAPI {
  /**
   * 获取指定摄像头的运行中AI任务列表
   * @param cameraId 摄像头ID
   */
  async getTasksByCamera(cameraId: number): Promise<AxiosResponse<UnifiedResponse<AITask[]>>> {
    if (!cameraId) {
      console.error('获取AI任务列表失败: 缺少摄像头ID')
      return Promise.reject(new Error('缺少摄像头ID'))
    }

    try {
      const response = await visionAIAxios.get(`/api/v1/realtime-detection/detection/tasks/by_camera/${cameraId}`)
      console.log('获取AI任务列表成功:', response.data)
      return response
    } catch (error) {
      console.error('❌ 获取AI任务列表失败:', error)
      throw error
    }
  }

  /**
   * 获取指定任务的当前检测结果（HTTP轮询方式）
   * @param taskId 任务ID
   */
  async getDetectionResult(taskId: number): Promise<AxiosResponse<UnifiedResponse<DetectionResult>>> {
    if (!taskId) {
      console.error('获取检测结果失败: 缺少任务ID')
      return Promise.reject(new Error('缺少任务ID'))
    }

    try {
      const response = await visionAIAxios.get(`/api/v1/realtime-detection/detection/result/${taskId}`)
      console.log('获取检测结果成功:', response.data)
      return response
    } catch (error) {
      console.error('❌ 获取检测结果失败:', error)
      throw error
    }
  }
}

// 导出单例实例
export default new RealtimeDetectionAPI()
