import { AxiosResponse } from 'axios'
import { authAxios,  type UnifiedResponse } from '@/api/commons'
/**
 * 预警转发统计 API
 * 提供预警转发相关统计数据
 */

/**
 * 时间范围
 */
export type ForwardTimeRange = '7d' | '30d'

/**
 * 预警转发统计
 */
export interface AlertForwardStatistics {
  time_range: ForwardTimeRange
  total_forwards: number
  daily_statistics: DailyStatistic[]
  date_labels: string[]
  forward_counts: number[]
}

/**
 * 日统计
 */
export interface DailyStatistic {
  date: string
  count: number
}

/**
 * 预警转发统计 API 类
 */
class AlertForwardAPI {
  /**
   * 获取报警转发统计
   * @param timeRange 时间范围: '7d' | '30d'
   * 注意：响应拦截器会提取 data 字段，返回类型是 AlertForwardStatistics
   */
  async getForwardStatistics(timeRange: ForwardTimeRange = '7d'): Promise<AlertForwardStatistics> {
    console.log('[转发API] 获取报警转发统计, 时间范围:', timeRange)

    // 生成模拟统计数据
    const days = timeRange === '7d' ? 7 : 30
    const dateLabels: string[] = []
    const forwardCounts: number[] = []

    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      dateLabels.push(`${date.getMonth() + 1}/${date.getDate()}`)
      forwardCounts.push(Math.floor(Math.random() * 20000) + 5000)
    }

    const mockData: AlertForwardStatistics = {
      time_range: timeRange,
      total_forwards: forwardCounts.reduce((a, b) => a + b, 0),
      daily_statistics: dateLabels.map((label, index) => ({
        date: label,
        count: forwardCounts[index]
      })),
      date_labels: dateLabels,
      forward_counts: forwardCounts
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockData)
      }, 200)
    })

    // 真实API调用（会经过响应拦截器处理）
    // return authAxios.get('/api/v1/alerts/forward-statistics', {
    //   params: { time_range: timeRange }
    // }) as Promise<AlertForwardStatistics>
  }
}

// 导出单例实例
export default new AlertForwardAPI()
