import { AxiosResponse } from 'axios'
import  { authAxios, type UnifiedResponse } from '@/api/commons'
import type { Camera, CameraQueryParams, AITask } from '@/types/center'
/**
 * 摄像头管理 API
 * 提供摄像头的增删改查操作
 */

/**
 * 摄像头管理 API 类
 */
class CameraAPI {
  /**
   * 获取摄像头列表
   * @param params 查询参数
   * @returns 摄像头列表响应
   */
  async getCameraList(params: CameraQueryParams = {}): Promise<UnifiedResponse<Camera[]>> {
    const apiParams = { ...params }

    if (!apiParams.page) {
      apiParams.page = 1
    }

    if (!apiParams.limit) {
      apiParams.limit = 10
    } else {
      apiParams.limit = Math.min(params.limit || 10, 100)
    }

    return authAxios.get('/api/v1/cameras/ai/list', { params: apiParams })
  }

  /**
   * 获取摄像头详情
   * @param cameraId 摄像头ID
   */
  async getCameraDetail(cameraId: number | string): Promise<Camera> {
    return authAxios.get(`/api/v1/cameras/${cameraId}`)
  }

  /**
   * 更新摄像头信息
   * @param cameraId 摄像头ID
   * @param updateData 更新数据
   */
  async updateCamera(cameraId: number | string, updateData: Partial<Camera>): Promise<any> {
    if (!cameraId) {
      return Promise.reject(new Error('缺少摄像头ID'))
    }

    return authAxios.put(`/api/v1/cameras/${cameraId}`, updateData)
  }

  /**
   * 获取摄像头关联的AI任务
   * @param cameraId 摄像头ID
   */
  async getCameraAITasks(cameraId: number | string): Promise<AxiosResponse<UnifiedResponse<AITask[]>>> {
    if (!cameraId) {
      return Promise.reject(new Error('缺少摄像头ID'))
    }

    return authAxios.get(`/api/v1/ai-tasks/camera/id/${cameraId}`)
  }
}

// 导出单例实例
export default new CameraAPI()
