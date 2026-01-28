/**
 * 复判记录管理服务
 */

import axiosInstance from './config/axios'
import type {
  ApiResponse,
  PaginatedResponse,
  ReviewRecord,
  ReviewRecordListParams,
  CreateReviewRecordParams
} from './types'

export class ReviewRecordService {
  private readonly basePath = '/api/v1/llm-skills/review-records'

  /**
   * 获取复判服务状态
   */
  async getReviewServiceStatus(): Promise<ApiResponse<{
    status: string
    enabled: boolean
  }>> {
    const response = await axiosInstance.get<any, ApiResponse<{
      status: string
      enabled: boolean
    }>>(`${this.basePath}/status`)
    return response
  }

  /**
   * 启动复判服务
   */
  async startReviewService(): Promise<ApiResponse<{ message: string }>> {
    const response = await axiosInstance.post<any, ApiResponse<{ message: string }>>(
      `${this.basePath}/start`
    )
    return response
  }

  /**
   * 停止复判服务
   */
  async stopReviewService(): Promise<ApiResponse<{ message: string }>> {
    const response = await axiosInstance.post<any, ApiResponse<{ message: string }>>(
      `${this.basePath}/stop`
    )
    return response
  }

  /**
   * 获取待复判的 AI 任务列表
   */
  async getAITasksForReview(params?: {
    page?: number
    limit?: number
    status?: string
  }): Promise<PaginatedResponse<any>> {
    const response = await axiosInstance.get<any, PaginatedResponse<any>>(
      `${this.basePath}/ai-tasks`,
      { params }
    )
    return response
  }

  /**
   * 获取复判记录列表
   */
  async getReviewRecords(params?: ReviewRecordListParams): Promise<PaginatedResponse<ReviewRecord>> {
    const response = await axiosInstance.get<any, PaginatedResponse<ReviewRecord>>(this.basePath, { params })
    return response
  }

  /**
   * 根据ID获取复判记录
   */
  async getReviewRecordById(reviewId: string): Promise<ApiResponse<ReviewRecord>> {
    const response = await axiosInstance.get<any, ApiResponse<ReviewRecord>>(`${this.basePath}/${reviewId}`)
    return response
  }

  /**
   * 根据预警ID获取复判记录
   */
  async getReviewRecordsByAlertId(alertId: string): Promise<ApiResponse<ReviewRecord[]>> {
    const response = await axiosInstance.get<any, ApiResponse<ReviewRecord[]>>(
      `${this.basePath}/alert/${alertId}`
    )
    return response
  }

  /**
   * 创建复判记录
   */
  async createReviewRecord(recordData: CreateReviewRecordParams): Promise<ApiResponse<ReviewRecord>> {
    const response = await axiosInstance.post<any, ApiResponse<ReviewRecord>>(this.basePath, recordData)
    return response
  }

  /**
   * 更新复判记录
   */
  async updateReviewRecord(reviewId: string, updateData: Partial<CreateReviewRecordParams>): Promise<ApiResponse<ReviewRecord>> {
    const response = await axiosInstance.put<any, ApiResponse<ReviewRecord>>(
      `${this.basePath}/${reviewId}`,
      updateData
    )
    return response
  }

  /**
   * 删除复判记录
   */
  async deleteReviewRecord(reviewId: string): Promise<ApiResponse<void>> {
    const response = await axiosInstance.delete<any, ApiResponse<void>>(`${this.basePath}/${reviewId}`)
    return response
  }

  /**
   * 获取复判记录统计
   */
  async getReviewRecordStatistics(params?: {
    start_time?: string
    end_time?: string
  }): Promise<ApiResponse<{
    total_reviews: number
    confirmed_alerts: number
    false_alarms: number
    accuracy_rate: number
  }>> {
    const response = await axiosInstance.get<any, ApiResponse<{
      total_reviews: number
      confirmed_alerts: number
      false_alarms: number
      accuracy_rate: number
    }>>(`${this.basePath}/statistics`, { params })
    return response
  }
}

// 导出单例
export default new ReviewRecordService()
