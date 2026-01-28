/**
 * 摄像头管理服务
 */

import axiosInstance from './config/axios'
import type { ApiResponse, PaginatedResponse, Camera, CameraListParams, UpdateCameraParams, AITask } from './types'

export class CameraService {
  private readonly basePath = '/api/v1/cameras'

  /**
   * 获取摄像头列表
   */
  async getCameraList(params?: CameraListParams): Promise<PaginatedResponse<Camera>> {
    const response = await axiosInstance.get<any, PaginatedResponse<Camera>>(this.basePath, { params })
    return response
  }

  /**
   * 获取摄像头详情
   */
  async getCameraDetail(cameraId: string): Promise<ApiResponse<Camera>> {
    const response = await axiosInstance.get<any, ApiResponse<Camera>>(`${this.basePath}/${cameraId}`)
    return response
  }

  /**
   * 创建摄像头
   */
  async createCamera(cameraData: {
    name: string
    rtsp_url: string
    channel_id?: string
  }): Promise<ApiResponse<Camera>> {
    const response = await axiosInstance.post<any, ApiResponse<Camera>>(this.basePath, cameraData)
    return response
  }

  /**
   * 更新摄像头
   */
  async updateCamera(cameraId: string, updateData: UpdateCameraParams): Promise<ApiResponse<Camera>> {
    const response = await axiosInstance.put<any, ApiResponse<Camera>>(
      `${this.basePath}/${cameraId}`,
      updateData
    )
    return response
  }

  /**
   * 删除摄像头
   */
  async deleteCamera(cameraId: string): Promise<ApiResponse<void>> {
    const response = await axiosInstance.delete<any, ApiResponse<void>>(`${this.basePath}/${cameraId}`)
    return response
  }

  /**
   * 批量删除摄像头
   */
  async batchDeleteCameras(cameraIds: string[]): Promise<ApiResponse<void>> {
    const response = await axiosInstance.post<any, ApiResponse<void>>(
      `${this.basePath}/batch-delete`,
      { ids: cameraIds }
    )
    return response
  }

  /**
   * 获取摄像头的 AI 任务列表
   */
  async getCameraAITasks(cameraId: string): Promise<ApiResponse<AITask[]>> {
    const response = await axiosInstance.get<any, ApiResponse<AITask[]>>(
      `${this.basePath}/${cameraId}/ai-tasks`
    )
    return response
  }
}

// 导出单例
export default new CameraService()
