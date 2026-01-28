/**
 * 大模型任务管理服务
 */

import axiosInstance from './config/axios'
import type {
  ApiResponse,
  PaginatedResponse,
  LlmTask,
  CreateLlmTaskParams,
  LlmTaskListParams
} from './types'

export class LlmTaskService {
  private readonly basePath = '/api/v1/llm-skills/tasks'

  /**
   * 创建 LLM 任务
   */
  async createLlmTask(taskData: CreateLlmTaskParams): Promise<ApiResponse<LlmTask>> {
    const response = await axiosInstance.post<any, ApiResponse<LlmTask>>(this.basePath, taskData)
    return response
  }

  /**
   * 删除 LLM 任务
   */
  async deleteLlmTask(taskId: string): Promise<ApiResponse<void>> {
    const response = await axiosInstance.delete<any, ApiResponse<void>>(`${this.basePath}/${taskId}`)
    return response
  }

  /**
   * 批量删除 LLM 任务
   */
  async batchDeleteLlmTasks(taskIds: string[]): Promise<ApiResponse<void>> {
    const response = await axiosInstance.post<any, ApiResponse<void>>(
      `${this.basePath}/batch-delete`,
      { ids: taskIds }
    )
    return response
  }

  /**
   * 获取 LLM 任务列表
   */
  async getLlmTaskList(params?: LlmTaskListParams): Promise<PaginatedResponse<LlmTask>> {
    const response = await axiosInstance.get<any, PaginatedResponse<LlmTask>>(this.basePath, { params })
    return response
  }

  /**
   * 获取 LLM 任务详情
   */
  async getLlmTaskDetail(taskId: string): Promise<ApiResponse<LlmTask>> {
    const response = await axiosInstance.get<any, ApiResponse<LlmTask>>(`${this.basePath}/${taskId}`)
    return response
  }

  /**
   * 更新 LLM 任务
   */
  async updateLlmTask(taskId: string, taskData: Partial<CreateLlmTaskParams>): Promise<ApiResponse<LlmTask>> {
    const response = await axiosInstance.put<any, ApiResponse<LlmTask>>(
      `${this.basePath}/${taskId}`,
      taskData
    )
    return response
  }

  /**
   * 启动 LLM 任务
   */
  async startLlmTask(taskId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await axiosInstance.post<any, ApiResponse<{ message: string }>>(
      `${this.basePath}/${taskId}/start`
    )
    return response
  }

  /**
   * 停止 LLM 任务
   */
  async stopLlmTask(taskId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await axiosInstance.post<any, ApiResponse<{ message: string }>>(
      `${this.basePath}/${taskId}/stop`
    )
    return response
  }
}

// 导出单例
export default new LlmTaskService()
