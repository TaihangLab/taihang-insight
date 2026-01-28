/**
 * 预警管理服务
 */

import axiosInstance from './config/axios'
import type { ApiResponse, PaginatedResponse, Alert, AlertListParams, UpdateAlertParams, AlertStatistics } from './types'

export class AlertService {
  private readonly basePath = '/api/v1/alerts'

  /**
   * 获取实时预警列表
   */
  async getRealTimeAlerts(params?: AlertListParams): Promise<PaginatedResponse<Alert>> {
    const response = await axiosInstance.get<any, PaginatedResponse<Alert>>(this.basePath, { params })
    return response
  }

  /**
   * 获取预警详情
   */
  async getAlertDetail(alertId: string): Promise<ApiResponse<Alert>> {
    const response = await axiosInstance.get<any, ApiResponse<Alert>>(`${this.basePath}/${alertId}`)
    return response
  }

  /**
   * 更新预警状态
   */
  async updateAlertStatus(alertId: string, updateData: UpdateAlertParams): Promise<ApiResponse<Alert>> {
    const response = await axiosInstance.put<any, ApiResponse<Alert>>(
      `${this.basePath}/${alertId}`,
      updateData
    )
    return response
  }

  /**
   * 批量更新预警状态
   */
  async batchUpdateAlertStatus(alertIds: string[], updateData: UpdateAlertParams): Promise<ApiResponse<void>> {
    const response = await axiosInstance.put<any, ApiResponse<void>>(
      `${this.basePath}/batch-update`,
      {
        ids: alertIds,
        ...updateData
      }
    )
    return response
  }

  /**
   * 删除预警
   */
  async deleteAlert(alertId: string): Promise<ApiResponse<void>> {
    const response = await axiosInstance.delete<any, ApiResponse<void>>(`${this.basePath}/${alertId}`)
    return response
  }

  /**
   * 批量删除预警
   */
  async batchDeleteAlerts(alertIds: string[]): Promise<ApiResponse<void>> {
    const response = await axiosInstance.post<any, ApiResponse<void>>(
      `${this.basePath}/batch-delete`,
      { ids: alertIds }
    )
    return response
  }

  /**
   * 标记预警为误报
   */
  async markAlertAsFalseAlarm(
    alertId: string,
    reviewNotes: string,
    reviewerName: string
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await axiosInstance.post<any, ApiResponse<{ message: string }>>(
      `${this.basePath}/${alertId}/false-alarm`,
      { review_notes: reviewNotes, reviewer_name: reviewerName }
    )
    return response
  }

  /**
   * 批量标记预警为误报
   */
  async batchMarkAlertsAsFalseAlarm(
    alertIds: string[],
    reviewNotes: string,
    reviewerName: string
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await axiosInstance.post<any, ApiResponse<{ message: string }>>(
      `${this.basePath}/batch-false-alarm`,
      {
        ids: alertIds,
        review_notes: reviewNotes,
        reviewer_name: reviewerName
      }
    )
    return response
  }

  /**
   * 获取预警统计数据
   */
  async getAlertStatistics(days: number = 7): Promise<ApiResponse<AlertStatistics>> {
    const response = await axiosInstance.get<any, ApiResponse<AlertStatistics>>(
      `${this.basePath}/statistics`,
      { params: { days } }
    )
    return response
  }

  /**
   * 导出预警数据
   */
  async exportAlerts(params?: AlertListParams): Promise<Blob> {
    const response = await axiosInstance.get(`${this.basePath}/export`, {
      params,
      responseType: 'blob'
    })
    return response as unknown as Blob
  }

  /**
   * 创建 SSE 连接
   */
  createAlertSSEConnection(
    onMessage: (data: any) => void,
    onError?: (error: Event) => void,
    onClose?: () => void
  ): EventSource {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    const sseUrl = `${baseURL}${this.basePath}/stream`

    const eventSource = new EventSource(sseUrl)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage(data)
      } catch (error) {
        console.error('解析 SSE 数据失败:', error)
      }
    }

    if (onError) {
      eventSource.onerror = onError
    }

    if (onClose) {
      eventSource.addEventListener('close', onClose)
    }

    return eventSource
  }

  /**
   * 获取 SSE 服务状态
   */
  async getSSEStatus(): Promise<ApiResponse<{ status: string; connected_clients: number }>> {
    const response = await axiosInstance.get<any, ApiResponse<{ status: string; connected_clients: number }>>(
      `${this.basePath}/stream/status`
    )
    return response
  }

  /**
   * 获取已连接的客户端列表
   */
  async getConnectedClients(): Promise<ApiResponse<any[]>> {
    const response = await axiosInstance.get<any, ApiResponse<any[]>>(
      `${this.basePath}/stream/clients`
    )
    return response
  }

  /**
   * 发送测试预警
   */
  async sendTestAlert(): Promise<ApiResponse<{ message: string }>> {
    const response = await axiosInstance.post<any, ApiResponse<{ message: string }>>(
      `${this.basePath}/test`
    )
    return response
  }
}

// 导出单例
export default new AlertService()
