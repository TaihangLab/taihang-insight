/**
 * 预警统计管理 API
 * 提供预警相关的统计数据，包括摘要、趋势、分类统计等
 */

import { AxiosResponse } from 'axios'
import visionAIAxios, { type UnifiedResponse, UnifiedResponse } from './base'

/**
 * 预警统计摘要
 */
export interface AlertSummary {
  total_alerts: number
  pending_count: number
  processing_count: number
  completed_count: number
  online_devices: number
  total_devices: number
  top_alert_types: AlertTypeStat[]
  top_locations: LocationStat[]
}

/**
 * 预警类型统计
 */
export interface AlertTypeStat {
  name: string
  count: number
  value: number
  color?: string
}

/**
 * 位置统计
 */
export interface LocationStat {
  name: string
  count: number
  value: number
}

/**
 * 预警趋势数据
 */
export interface AlertTrend {
  time_labels: string[]
  trend_data: number[]
  total: number
}

/**
 * 预警等级统计
 */
export interface AlertLevelStat {
  value: number
  name: string
  level: number
  color?: string
  itemStyle?: {
    color: string
  }
}

/**
 * 预警图片
 */
export interface AlertImage {
  id: number
  image_url: string
  alert_type: string
  alert_time: string
  camera_name?: string
  location?: string
}

/**
 * 预警统计管理 API 类
 */
class AlertStatisticsAPI {
  /**
   * 获取预警统计摘要
   * @param timeRange 时间范围: 'day' | 'week' | 'month'
   */
  async getSummary(timeRange: 'day' | 'week' | 'month' = 'day'): Promise<AxiosResponse<UnifiedResponse<AlertSummary>>> {
    console.log('[统计API] 获取预警统计摘要, 时间范围:', timeRange)

    // 模拟数据返回
    const mockDataMap: Record<string, AlertSummary> = {
      day: {
        total_alerts: 25,
        pending_count: 5,
        processing_count: 3,
        completed_count: 12,
        online_devices: 120,
        total_devices: 150,
        top_alert_types: [
          { name: '未戴安全帽', count: 9, value: 100 },
          { name: '区域入侵', count: 7, value: 78 },
          { name: '垃圾堆积', count: 5, value: 56 },
          { name: '人员聚集', count: 4, value: 44 },
          { name: '烟雾识别', count: 2, value: 22 }
        ],
        top_locations: [
          { name: '工地东北角', count: 15, value: 100 },
          { name: '工地南侧', count: 12, value: 80 },
          { name: '施工作业区', count: 9, value: 60 },
          { name: '材料区', count: 6, value: 40 },
          { name: '休息区', count: 3, value: 20 }
        ]
      },
      week: {
        total_alerts: 108,
        pending_count: 18,
        processing_count: 25,
        completed_count: 65,
        online_devices: 120,
        total_devices: 150,
        top_alert_types: [
          { name: '未戴安全帽', count: 35, value: 100 },
          { name: '区域入侵', count: 28, value: 80 },
          { name: '垃圾堆积', count: 22, value: 63 },
          { name: '人员聚集', count: 15, value: 43 },
          { name: '烟雾识别', count: 8, value: 23 }
        ],
        top_locations: [
          { name: '生产车间A', count: 45, value: 100 },
          { name: '装配车间', count: 38, value: 84 },
          { name: '机械加工区', count: 32, value: 71 },
          { name: '原料仓库', count: 28, value: 62 },
          { name: '成品仓库', count: 18, value: 40 }
        ]
      },
      month: {
        total_alerts: 300,
        pending_count: 42,
        processing_count: 78,
        completed_count: 180,
        online_devices: 120,
        total_devices: 150,
        top_alert_types: [
          { name: '未戴安全帽', count: 95, value: 100 },
          { name: '区域入侵', count: 78, value: 82 },
          { name: '垃圾堆积', count: 65, value: 68 },
          { name: '人员聚集', count: 52, value: 55 },
          { name: '烟雾识别', count: 35, value: 37 }
        ],
        top_locations: [
          { name: '生产车间A', count: 128, value: 100 },
          { name: '装配车间', count: 98, value: 77 },
          { name: '机械加工区', count: 85, value: 66 },
          { name: '原料仓库', count: 72, value: 56 },
          { name: '成品仓库', count: 45, value: 35 }
        ]
      }
    }

    // 返回模拟数据
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            code: 0,
            msg: 'success',
            data: mockDataMap[timeRange] || mockDataMap.day,
            total: mockDataMap[timeRange]?.total_alerts || 0
          }
        } as any)
      }, 300)
    })

    // 真实API调用（后端就绪后取消注释）
    // return visionAIAxios.get('/api/v1/alerts/statistics/summary', {
    //   params: { time_range: timeRange }
    // })
  }

  /**
   * 获取预警趋势数据
   * @param timeRange 时间范围: '24h' | '7d' | '30d'
   * @param granularity 时间粒度: '1h' | '1d'
   */
  async getTrend(timeRange: '24h' | '7d' | '30d' = '24h', granularity: '1h' | '1d' = '1h'): Promise<AxiosResponse<UnifiedResponse<AlertTrend>>> {
    console.log('[统计API] 获取预警趋势, 时间范围:', timeRange, '粒度:', granularity)

    // 模拟趋势数据
    let timeLabels: string[], trendData: number[]

    if (timeRange === '24h') {
      timeLabels = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '24:00']
      trendData = [3, 2, 5, 10, 14, 12, 7, 5, 8, 11, 9, 6, 5]
    } else if (timeRange === '7d') {
      timeLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      trendData = [25, 32, 28, 35, 30, 22, 18]
    } else {
      timeLabels = Array.from({ length: 30 }, (_, i) => `${i + 1}日`)
      trendData = Array.from({ length: 30 }, () => Math.floor(Math.random() * 30) + 10)
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            code: 0,
            msg: 'success',
            data: {
              time_labels: timeLabels,
              trend_data: trendData,
              total: trendData.reduce((a, b) => a + b, 0)
            }
          }
        } as any)
      }, 300)
    })

    // 真实API调用
    // return visionAIAxios.get('/api/v1/alerts/statistics/trend', {
    //   params: { time_range: timeRange, granularity }
    // })
  }

  /**
   * 获取预警类型统计
   * @param timeRange 时间范围
   */
  async getByType(timeRange: string = 'day'): Promise<AxiosResponse<UnifiedResponse<AlertTypeStat[]>>> {
    console.log('[统计API] 获取预警类型统计, 时间范围:', timeRange)

    const mockData: AlertTypeStat[] = [
      { name: '未戴安全帽', count: 9, value: 100, color: '#FF4D4F' },
      { name: '未穿工作服', count: 7, value: 78, color: '#FF8746' },
      { name: '区域入侵', count: 5, value: 56, color: '#44FF9B' },
      { name: '人员聚集', count: 4, value: 44, color: '#00C5FF' },
      { name: '违规吸烟', count: 3, value: 33, color: '#FFD700' },
      { name: '高空作业未系安全带', count: 2, value: 22, color: '#FF69B4' },
      { name: '烟雾识别', count: 2, value: 22, color: '#9370DB' }
    ]

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            code: 0,
            msg: 'success',
            data: mockData
          }
        } as any)
      }, 200)
    })

    // 真实API调用
    // return visionAIAxios.get('/api/v1/alerts/statistics/by-type', {
    //   params: { time_range: timeRange }
    // })
  }

  /**
   * 获取预警等级统计
   * @param timeRange 时间范围
   */
  async getByLevel(timeRange: string = 'day'): Promise<AxiosResponse<UnifiedResponse<AlertLevelStat[]>>> {
    console.log('[统计API] 获取预警等级统计, 时间范围:', timeRange)

    const mockData: AlertLevelStat[] = [
      { value: 8, name: '紧急', level: 1, color: '#FF4D4F' },
      { value: 15, name: '重要', level: 2, color: '#FF8746' },
      { value: 21, name: '普通', level: 3, color: '#44FF9B' },
      { value: 11, name: '提示', level: 4, color: '#00C5FF' }
    ]

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            code: 0,
            msg: 'success',
            data: mockData
          }
        } as any)
      }, 200)
    })

    // 真实API调用
    // return visionAIAxios.get('/api/v1/alerts/statistics/by-level', {
    //   params: { time_range: timeRange }
    // })
  }

  /**
   * 获取预警位置统计
   * @param timeRange 时间范围
   * @param limit 返回数量限制
   */
  async getByLocation(timeRange: string = 'day', limit = 10): Promise<AxiosResponse<UnifiedResponse<LocationStat[]>>> {
    console.log('[统计API] 获取预警位置统计, 时间范围:', timeRange, '限制:', limit)

    const mockData: LocationStat[] = [
      { name: '摄像头01-工地东北角', count: 15, value: 100 },
      { name: '摄像头03-工地南侧', count: 12, value: 80 },
      { name: '摄像头02-材料区', count: 9, value: 60 },
      { name: '摄像头05-休息区', count: 6, value: 40 },
      { name: '摄像头04-施工作业区', count: 5, value: 33 },
      { name: '摄像头06-工地东北角', count: 4, value: 27 },
      { name: '摄像头07-塔吊区域', count: 3, value: 20 },
      { name: '摄像头08-脚手架区域', count: 2, value: 13 },
      { name: '摄像头09-设备存放区', count: 7, value: 47 },
      { name: '摄像头10-危险作业区', count: 8, value: 53 }
    ]

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            code: 0,
            msg: 'success',
            data: mockData.slice(0, limit)
          }
        } as any)
      }, 200)
    })

    // 真实API调用
    // return visionAIAxios.get('/api/v1/alerts/statistics/by-location', {
    //   params: { time_range: timeRange, limit }
    // })
  }

  /**
   * 获取最新预警图片（用于大屏展示）
   * @param limit 返回数量限制
   */
  async getLatestImages(limit = 10): Promise<AxiosResponse<UnifiedResponse<AlertImage[]>>> {
    console.log('[统计API] 获取最新预警图片, 限制:', limit)

    try {
      const response = await visionAIAxios.get('/api/v1/alerts/latest-images', {
        params: { limit }
      })
      console.log('[统计API] 获取最新预警图片成功, 返回数量:', response.data?.data?.length || 0)
      return response
    } catch (error) {
      console.error('[统计API] 获取最新预警图片失败:', error)
      // 失败时返回空数组
      return {
        data: {
          code: 0,
          msg: 'success',
          data: []
        }
      } as any
    }
  }

  /**
   * 获取预警处理情况统计
   * @param timeRange 时间范围: 'day' | 'week' | 'month'
   */
  async getProcessingStatus(timeRange: 'day' | 'week' | 'month' = 'day'): Promise<AxiosResponse<UnifiedResponse<AlertLevelStat[]>>> {
    console.log('[统计API] 获取预警处理情况, 时间范围:', timeRange)

    const mockDataMap: Record<string, AlertLevelStat[]> = {
      day: [
        { value: 5, name: '待处理', itemStyle: { color: '#FF8746' } } as any,
        { value: 3, name: '处理中', itemStyle: { color: '#44FF9B' } } as any,
        { value: 12, name: '已完成', itemStyle: { color: '#00FFFF' } } as any
      ],
      week: [
        { value: 18, name: '待处理', itemStyle: { color: '#FF8746' } } as any,
        { value: 25, name: '处理中', itemStyle: { color: '#44FF9B' } } as any,
        { value: 65, name: '已完成', itemStyle: { color: '#00FFFF' } } as any
      ],
      month: [
        { value: 42, name: '待处理', itemStyle: { color: '#FF8746' } } as any,
        { value: 78, name: '处理中', itemStyle: { color: '#44FF9B' } } as any,
        { value: 180, name: '已完成', itemStyle: { color: '#00FFFF' } } as any
      ]
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            code: 0,
            msg: 'success',
            data: mockDataMap[timeRange] || mockDataMap.day
          }
        } as any)
      }, 200)
    })

    // 真实API调用
    // return visionAIAxios.get('/api/v1/alerts/statistics/processing-status', {
    //   params: { time_range: timeRange }
    // })
  }
}

// 导出单例实例
export default new AlertStatisticsAPI()
