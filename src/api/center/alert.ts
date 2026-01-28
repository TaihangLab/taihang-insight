/**
 * 预警管理 API
 * 提供预警的查询、更新、删除以及SSE实时推送功能
 */

import { AxiosResponse } from 'axios'
import visionAIAxios, { type UnifiedResponse, UnifiedResponse } from './base'
import type { Alert, AlertQueryParams, AlertStatusUpdate } from './base'

/**
 * SSE消息回调类型
 */
export type SSEMessageCallback = (data: any) => void
export type SSEErrorCallback = (event: Event) => void
export type SSECloseCallback = () => void

/**
 * 预警管理 API 类
 */
class AlertAPI {
  /**
   * 获取实时预警列表
   * @param params 查询参数
   * @returns 预警列表响应
   */
  async getRealTimeAlerts(params: AlertQueryParams = {}): Promise<AxiosResponse<UnifiedResponse<Alert[]>>> {
    const apiParams = { ...params }

    if (!apiParams.page) {
      apiParams.page = 1
    }

    if (!apiParams.limit) {
      apiParams.limit = 10
    }

    // 处理日期时间参数
    if (apiParams.startDate) {
      (apiParams as any).start_date = apiParams.startDate
      delete apiParams.startDate
    }

    if (apiParams.endDate) {
      (apiParams as any).end_date = apiParams.endDate
      delete apiParams.endDate
    }

    // 处理预警等级映射
    if (apiParams.warningLevel) {
      const levelMap: Record<string, number> = {
        'level1': 1,
        'level2': 2,
        'level3': 3,
        'level4': 4
      }
      const level = apiParams.warningLevel as string
      ;(apiParams as any).alert_level = levelMap[level]
      delete apiParams.warningLevel
    }

    // 处理预警类型映射
    if (apiParams.warningType) {
      const typeMap: Record<string, string> = {
        'safety_helmet': 'safety_helmet_detection',
        'safety_belt': 'safety_belt_detection',
        'protective_clothing': 'protective_clothing_detection',
        'unauthorized_personnel': 'personnel_intrusion_detection',
        'smoking': 'smoke_fire_detection',
        'high_altitude': 'high_altitude_work_detection'
      }
      const type = apiParams.warningType as string
      ;(apiParams as any).alert_type = typeMap[type]
      delete apiParams.warningType
    }

    if (apiParams.warningSkill) {
      (apiParams as any).alert_type = apiParams.warningSkill
      delete apiParams.warningSkill
    }

    if (apiParams.warningName) {
      (apiParams as any).alert_name = apiParams.warningName
      delete apiParams.warningName
    }

    if (apiParams.warningId) {
      (apiParams as any).alert_id = parseInt(apiParams.warningId)
      delete apiParams.warningId
    }

    // 处理状态映射
    if (apiParams.statusFilter) {
      const statusMap: Record<string, string> = {
        'pending': '待处理',
        'processing': '处理中',
        'completed': '已处理',
        'archived': '已归档',
        'falseAlarm': '误报'
      }
      apiParams.status = statusMap[apiParams.statusFilter]
      delete apiParams.statusFilter
    }

    console.log('获取实时预警列表 - API调用参数:', apiParams)

    try {
      const response = await visionAIAxios.get('/api/v1/alerts/real-time', { params: apiParams })
      return this.transformAlertListResponse(response)
    } catch (error) {
      console.error('获取实时预警列表失败:', error)
      throw error
    }
  }

  /**
   * 转换预警列表响应数据
   */
  private transformAlertListResponse(response: AxiosResponse): AxiosResponse {
    const originalData = response.data

    if (originalData && originalData.code !== undefined) {
      return response
    }

    const transformedData: UnifiedResponse<Alert[]> = {
      code: 0,
      msg: 'success',
      data: [],
      total: 0
    }

    if (originalData && originalData.alerts) {
      transformedData.data = originalData.alerts
      transformedData.total = originalData.total || transformedData.data.length

      if (originalData.page) transformedData.page = originalData.page
      if (originalData.limit) transformedData.limit = originalData.limit
      if (originalData.pages) transformedData.pages = originalData.pages
      if (originalData.pagination) {
        transformedData.pagination = originalData.pagination
      }
    } else {
      transformedData.data = originalData
    }

    response.data = transformedData
    console.log('实时预警列表响应转换完成:', response.data)

    return response
  }

  /**
   * 更新预警状态
   * @param alertId 预警ID
   * @param updateData 更新数据
   */
  async updateAlertStatus(alertId: number, updateData: AlertStatusUpdate): Promise<AxiosResponse> {
    if (!alertId) {
      console.error('更新预警状态失败: 缺少预警ID')
      return Promise.reject(new Error('缺少预警ID'))
    }

    console.log('更新预警状态:', alertId, updateData)

    try {
      return await visionAIAxios.put(`/api/v1/alerts/${alertId}/status`, updateData)
    } catch (error) {
      console.error('更新预警状态失败:', error)
      throw error
    }
  }

  /**
   * 批量更新预警状态
   * @param alertIds 预警ID数组
   * @param updateData 更新数据
   */
  async batchUpdateAlertStatus(alertIds: number[], updateData: AlertStatusUpdate): Promise<AxiosResponse> {
    if (!alertIds || alertIds.length === 0) {
      console.error('批量更新预警状态失败: 缺少预警ID')
      return Promise.reject(new Error('缺少预警ID'))
    }

    console.log('批量更新预警状态:', alertIds, updateData)

    try {
      return await visionAIAxios.put('/api/v1/alerts/batch-update', {
        alert_ids: alertIds,
        ...updateData
      })
    } catch (error) {
      console.error('批量更新预警状态失败:', error)
      throw error
    }
  }

  /**
   * 删除预警
   * @param alertId 预警ID
   */
  async deleteAlert(alertId: number): Promise<AxiosResponse> {
    if (!alertId) {
      console.error('删除预警失败: 缺少预警ID')
      return Promise.reject(new Error('缺少预警ID'))
    }

    console.log('删除预警:', alertId)

    try {
      return await visionAIAxios.delete(`/api/v1/alerts/${alertId}`)
    } catch (error) {
      console.error('删除预警失败:', error)
      throw error
    }
  }

  /**
   * 批量删除预警
   * @param alertIds 预警ID数组
   */
  async batchDeleteAlerts(alertIds: number[]): Promise<AxiosResponse> {
    if (!alertIds || alertIds.length === 0) {
      console.error('批量删除预警失败: 缺少预警ID')
      return Promise.reject(new Error('缺少预警ID'))
    }

    console.log('批量删除预警:', alertIds)

    try {
      return await visionAIAxios.post('/api/v1/alerts/batch-delete', {
        alert_ids: alertIds
      })
    } catch (error) {
      console.error('批量删除预警失败:', error)
      throw error
    }
  }

  /**
   * 根据ID获取单个预警详情
   * @param alertId 预警ID
   */
  async getAlertDetail(alertId: number | string): Promise<AxiosResponse<UnifiedResponse<Alert>>> {
    if (!alertId) {
      console.error('获取预警详情失败: 缺少预警ID')
      return Promise.reject(new Error('缺少预警ID'))
    }

    console.log('获取预警详情:', alertId)

    try {
      return await visionAIAxios.get(`/api/v1/alerts/${alertId}`)
    } catch (error) {
      console.error('获取预警详情失败:', error)
      throw error
    }
  }

  /**
   * 创建SSE连接，监听实时预警推送
   * @param onMessage 接收到消息时的回调函数
   * @param onError 发生错误时的回调函数
   * @param onClose 连接关闭时的回调函数
   * @returns SSE连接对象
   */
  createAlertSSEConnection(
    onMessage?: SSEMessageCallback,
    onError?: SSEErrorCallback,
    onClose?: SSECloseCallback
  ): EventSource {
    const sseUrl = `${visionAIAxios.defaults.baseURL}/api/v1/alerts/stream`
    console.log('创建SSE连接:', sseUrl)

    const eventSource = new EventSource(sseUrl)

    eventSource.onopen = function() {
      console.log('SSE连接已建立')
    }

    eventSource.onmessage = function(event) {
      console.log('收到SSE消息:', event.data)

      if (!event.data || event.data.trim() === '') {
        return
      }

      try {
        let jsonData = event.data

        if (jsonData.startsWith('data: ')) {
          jsonData = jsonData.substring(6)
        }

        const data = JSON.parse(jsonData)
        if (onMessage) {
          onMessage(data)
        }
      } catch (error) {
        console.error('解析SSE消息失败:', error)
        if (onMessage) {
          onMessage({ raw: event.data })
        }
      }
    }

    eventSource.onerror = function(event) {
      console.log('SSE连接错误:', event)
      if (onError) {
        onError(event as Event)
      }
    }

    // 添加关闭方法
    const originalClose = eventSource.close.bind(eventSource)
    eventSource.close = function() {
      console.log('关闭SSE连接')
      originalClose()
      if (onClose) {
        onClose()
      }
    }

    return eventSource
  }

  /**
   * 获取SSE连接状态
   */
  async getSSEStatus(): Promise<AxiosResponse> {
    console.log('获取SSE连接状态')
    try {
      return await visionAIAxios.get('/api/v1/alerts/sse/status')
    } catch (error) {
      console.error('获取SSE连接状态失败:', error)
      throw error
    }
  }

  /**
   * 获取当前连接的SSE客户端信息
   */
  async getConnectedClients(): Promise<AxiosResponse> {
    console.log('获取连接客户端信息')
    try {
      return await visionAIAxios.get('/api/v1/alerts/connected')
    } catch (error) {
      console.error('获取连接客户端信息失败:', error)
      throw error
    }
  }

  /**
   * 发送测试预警（仅供调试使用）
   */
  async sendTestAlert(): Promise<AxiosResponse> {
    console.log('发送测试预警')
    try {
      return await visionAIAxios.post('/api/v1/alerts/test')
    } catch (error) {
      console.error('发送测试预警失败:', error)
      throw error
    }
  }

  /**
   * 获取预警统计信息
   * @param days 统计天数
   */
  async getAlertStatistics(days = 7): Promise<AxiosResponse> {
    console.log('获取预警统计信息，天数:', days)
    try {
      return await visionAIAxios.get('/api/v1/alerts/statistics', {
        params: { days }
      })
    } catch (error) {
      console.error('获取预警统计信息失败:', error)
      throw error
    }
  }

  /**
   * 标记预警为误报
   * @param alertId 预警ID
   * @param reviewNotes 复判意见
   * @param reviewerName 复判人员姓名
   */
  async markAlertAsFalseAlarm(alertId: number, reviewNotes: string, reviewerName: string): Promise<AxiosResponse> {
    if (!alertId || !reviewNotes || !reviewerName) {
      console.error('标记误报失败: 缺少必要参数')
      return Promise.reject(new Error('缺少必要参数：预警ID、复判意见和复判人员姓名必须提供'))
    }

    console.log('标记预警为误报:', { alertId, reviewNotes, reviewerName })

    try {
      const response = await visionAIAxios.post(`/api/v1/alerts/${alertId}/false-alarm`, null, {
        params: {
          review_notes: reviewNotes,
          reviewer_name: reviewerName
        }
      })
      console.log('标记误报成功:', response.data)
      return response
    } catch (error) {
      console.error('标记误报失败:', error)
      throw error
    }
  }

  /**
   * 批量标记预警为误报
   * @param alertIds 预警ID数组
   * @param reviewNotes 复判意见
   * @param reviewerName 复判人员姓名
   */
  async batchMarkAlertsAsFalseAlarm(
    alertIds: number[],
    reviewNotes: string,
    reviewerName: string
  ): Promise<AxiosResponse> {
    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      console.error('批量标记误报失败: 缺少预警ID数组')
      return Promise.reject(new Error('缺少预警ID数组'))
    }

    if (!reviewNotes || !reviewerName) {
      console.error('批量标记误报失败: 缺少复判意见或复判人员姓名')
      return Promise.reject(new Error('缺少复判意见或复判人员姓名'))
    }

    console.log('批量标记预警为误报:', { alertIds, reviewNotes, reviewerName })

    try {
      const response = await visionAIAxios.post('/api/v1/alerts/batch-false-alarm', {
        alert_ids: alertIds
      }, {
        params: {
          review_notes: reviewNotes,
          reviewer_name: reviewerName
        }
      })
      console.log('批量标记误报成功:', response.data)
      return response
    } catch (error) {
      console.error('批量标记误报失败:', error)
      throw error
    }
  }

  /**
   * 导出预警数据
   * @param params 导出参数
   */
  async exportAlerts(params: any = {}): Promise<AxiosResponse> {
    console.log('导出预警数据，参数:', params)

    const exportParams = { ...params }

    if (!exportParams.format) {
      exportParams.format = 'csv'
    }

    if (exportParams.warningSkill) {
      exportParams.alert_type = exportParams.warningSkill
      delete exportParams.warningSkill
    }

    if (!exportParams.alert_ids || exportParams.alert_ids.length === 0) {
      delete exportParams.alert_ids
    }

    try {
      const response = await visionAIAxios.get('/api/v1/alerts/export', {
        params: exportParams,
        responseType: 'blob',
        timeout: 60000
      })
      console.log('导出预警数据成功')
      return response
    } catch (error) {
      console.error('导出预警数据失败:', error)
      throw error
    }
  }
}

// 导出单例实例
export default new AlertAPI()
