/**
 * 区域/目录管理服务（WVP 平台）
 */

import axiosInstance from './config/axios'
import type { ApiResponse, RegionTreeNode, GroupTreeNode } from './types'

export class RegionService {
  private readonly regionPath = '/api/v1/wvp/regions'
  private readonly groupPath = '/api/v1/wvp/groups'

  /**
   * 获取区域树
   */
  async getRegionTree(params?: {
    parent_id?: string
  }): Promise<ApiResponse<RegionTreeNode[]>> {
    const response = await axiosInstance.get<any, ApiResponse<RegionTreeNode[]>>(
      this.regionPath,
      { params }
    )
    return response
  }

  /**
   * 获取分组树
   */
  async getGroupTree(params?: {
    parent_id?: string
  }): Promise<ApiResponse<GroupTreeNode[]>> {
    const response = await axiosInstance.get<any, ApiResponse<GroupTreeNode[]>>(
      this.groupPath,
      { params }
    )
    return response
  }

  /**
   * 获取摄像头的任务列表
   */
  async getTasksByCamera(cameraId: string): Promise<ApiResponse<any[]>> {
    const response = await axiosInstance.get<any, ApiResponse<any[]>>(
      `/api/v1/cameras/${cameraId}/ai-tasks`
    )
    return response
  }

  /**
   * 获取检测结果
   */
  async getDetectionResult(taskId: string): Promise<ApiResponse<{
    task_id: string
    detections: Array<{
      class_name: string
      confidence: number
      bbox: [number, number, number, number]
    }>
    timestamp: string
  }>> {
    const response = await axiosInstance.get<any, ApiResponse<any>>(
      `/api/v1/ai-tasks/${taskId}/detection-result`
    )
    return response
  }
}

// 导出单例
export default new RegionService()
