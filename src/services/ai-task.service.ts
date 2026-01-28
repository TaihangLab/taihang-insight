/**
 * AI 任务管理服务
 */

import axiosInstance from './config/axios'
import type { ApiResponse, PaginatedResponse, AITask, CreateAITaskParams, UpdateAITaskParams } from './types'

export class AITaskService {
  private readonly basePath = '/api/v1/ai-tasks'

  /**
   * 获取 AI 任务列表
   */
  async getAITaskList(params?: {
    page?: number
    limit?: number
    camera_id?: string
    skill_class_id?: string
    status?: boolean
  }): Promise<PaginatedResponse<AITask>> {
    const response = await axiosInstance.get<any, PaginatedResponse<AITask>>(this.basePath, { params })
    return response
  }

  /**
   * 获取 AI 任务详情
   */
  async getAITaskDetail(taskId: string): Promise<ApiResponse<AITask>> {
    const response = await axiosInstance.get<any, ApiResponse<AITask>>(`${this.basePath}/${taskId}`)
    return response
  }

  /**
   * 创建 AI 任务
   */
  async createAITask(taskData: CreateAITaskParams): Promise<ApiResponse<AITask>> {
    const response = await axiosInstance.post<any, ApiResponse<AITask>>(this.basePath, taskData)
    return response
  }

  /**
   * 更新 AI 任务
   */
  async updateAITask(taskId: string, taskData: UpdateAITaskParams): Promise<ApiResponse<AITask>> {
    const response = await axiosInstance.put<any, ApiResponse<AITask>>(
      `${this.basePath}/${taskId}`,
      taskData
    )
    return response
  }

  /**
   * 删除 AI 任务
   */
  async deleteAITask(taskId: string): Promise<ApiResponse<void>> {
    const response = await axiosInstance.delete<any, ApiResponse<void>>(`${this.basePath}/${taskId}`)
    return response
  }

  /**
   * 批量删除 AI 任务
   */
  async batchDeleteAITasks(taskIds: string[]): Promise<ApiResponse<void>> {
    const response = await axiosInstance.post<any, ApiResponse<void>>(
      `${this.basePath}/batch-delete`,
      { ids: taskIds }
    )
    return response
  }

  /**
   * 启动 AI 任务
   */
  async startAITask(taskId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await axiosInstance.post<any, ApiResponse<{ message: string }>>(
      `${this.basePath}/${taskId}/start`
    )
    return response
  }

  /**
   * 停止 AI 任务
   */
  async stopAITask(taskId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await axiosInstance.post<any, ApiResponse<{ message: string }>>(
      `${this.basePath}/${taskId}/stop`
    )
    return response
  }

  /**
   * 获取任务的摄像头列表
   */
  async getCameraAITasks(cameraId: string): Promise<ApiResponse<AITask[]>> {
    const response = await axiosInstance.get<any, ApiResponse<AITask[]>>(
      `/api/v1/cameras/${cameraId}/ai-tasks`
    )
    return response
  }
}

// 导出单例
export default new AITaskService()
