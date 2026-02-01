import { AxiosResponse } from 'axios'
import visionAIAxios, { type UnifiedResponse } from './base'
/**
 * 系统资源监控 API
 * 提供系统资源使用率监控数据
 */

/**
 * 资源类型
 */
export type ResourceMetric = 'cpu' | 'memory' | 'disk' | 'network'

/**
 * 时间范围
 */
export type TimeRange = '1h' | '6h' | '24h' | '7d'

/**
 * 当前资源使用率
 */
export interface CurrentResources {
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  network_usage: number
  timestamp: string
}

/**
 * 资源历史数据
 */
export interface ResourceHistory {
  metric: ResourceMetric
  time_range: TimeRange
  time_labels: string[]
  data_points: number[]
}

/**
 * 存储使用情况
 */
export interface StorageUsage {
  total_storage: number
  used_storage: number
  storage_usage: number
  storage_list: StorageItem[]
}

/**
 * 存储项
 */
export interface StorageItem {
  name: string
  usage: number
  total: number
}

/**
 * 带宽使用情况
 */
export interface BandwidthUsage {
  time_range: TimeRange
  time_labels: string[]
  upstream_bandwidth: number[]
  downstream_bandwidth: number[]
  current_upstream: number
  current_downstream: number
}

/**
 * 系统资源监控 API 类
 */
class SystemMonitorAPI {
  /**
   * 获取当前资源使用率
   */
  async getCurrentResources(): Promise<AxiosResponse<UnifiedResponse<CurrentResources>>> {
    console.log('[监控API] 获取当前资源使用率')

    // 模拟实时资源数据（带小幅波动）
    const baseData = {
      cpu: 20.69,
      memory: 64.35,
      disk: 45.60,
      network: 92.34
    }

    const addFluctuation = (value: number, range = 5) => {
      return Math.max(0, Math.min(100, value + (Math.random() - 0.5) * range))
    }

    const mockData: CurrentResources = {
      cpu_usage: parseFloat(addFluctuation(baseData.cpu).toFixed(2)),
      memory_usage: parseFloat(addFluctuation(baseData.memory, 2).toFixed(2)),
      disk_usage: baseData.disk,
      network_usage: parseFloat(addFluctuation(baseData.network, 10).toFixed(2)),
      timestamp: new Date().toISOString()
    }

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
    // return visionAIAxios.get('/api/v1/system/resources')
  }

  /**
   * 获取资源历史数据（用于图表展示）
   * @param metric 资源类型: 'cpu' | 'memory' | 'disk' | 'network'
   * @param timeRange 时间范围: '1h' | '6h' | '24h' | '7d'
   */
  async getResourceHistory(metric: ResourceMetric = 'cpu', timeRange: TimeRange = '1h'): Promise<AxiosResponse<UnifiedResponse<ResourceHistory>>> {
    console.log('[监控API] 获取资源历史数据, 指标:', metric, '时间范围:', timeRange)

    // 生成模拟历史数据
    let pointCount: number, interval: number

    if (timeRange === '1h') {
      pointCount = 12
      interval = 5
    } else if (timeRange === '6h') {
      pointCount = 24
      interval = 15
    } else if (timeRange === '24h') {
      pointCount = 24
      interval = 60
    } else {
      pointCount = 7
      interval = 1440
    }

    const baseValues: Record<ResourceMetric, number> = {
      cpu: 20,
      memory: 64,
      disk: 45,
      network: 85
    }

    const baseValue = baseValues[metric] || 50
    const timeLabels: string[] = []
    const dataPoints: number[] = []
    const now = new Date()

    for (let i = pointCount - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - i * interval * 60 * 1000)

      if (timeRange === '7d') {
        timeLabels.push(`${time.getMonth() + 1}/${time.getDate()}`)
      } else {
        timeLabels.push(`${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`)
      }

      dataPoints.push(parseFloat(Math.max(0, Math.min(100, baseValue + (Math.random() - 0.5) * 20)).toFixed(2)))
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            code: 0,
            msg: 'success',
            data: {
              metric,
              time_range: timeRange,
              time_labels: timeLabels,
              data_points: dataPoints
            }
          }
        } as any)
      }, 200)
    })

    // 真实API调用
    // return visionAIAxios.get('/api/v1/system/resources/history', {
    //   params: { metric, time_range: timeRange }
    // })
  }

  /**
   * 获取存储使用情况
   */
  async getStorageUsage(): Promise<AxiosResponse<UnifiedResponse<StorageUsage>>> {
    console.log('[监控API] 获取存储使用情况')

    const mockData: StorageUsage = {
      total_storage: 1024,
      used_storage: 467,
      storage_usage: 45.6,
      storage_list: [
        { name: '内存1', usage: 60, total: 100 },
        { name: '内存2', usage: 40, total: 100 },
        { name: '内存3', usage: 20, total: 100 },
        { name: '内存4', usage: 70, total: 100 },
        { name: '内存5', usage: 30, total: 100 },
        { name: '内存6', usage: 50, total: 100 },
        { name: '内存7', usage: 10, total: 100 }
      ]
    }

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
    // return visionAIAxios.get('/api/v1/storage/usage')
  }

  /**
   * 获取带宽使用情况
   * @param timeRange 时间范围
   */
  async getBandwidthUsage(timeRange: TimeRange = '1h'): Promise<AxiosResponse<UnifiedResponse<BandwidthUsage>>> {
    console.log('[监控API] 获取带宽使用情况, 时间范围:', timeRange)

    const pointCount = 12
    const timeLabels: string[] = []
    const upstreamData: number[] = []
    const downstreamData: number[] = []

    const now = new Date()
    for (let i = pointCount - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 5 * 60 * 1000)
      timeLabels.push(`${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`)
      upstreamData.push(parseFloat((2 + Math.random() * 0.5).toFixed(2)))
      downstreamData.push(parseFloat((2 + Math.random() * 0.5).toFixed(2)))
    }

    const mockData: BandwidthUsage = {
      time_range: timeRange,
      time_labels: timeLabels,
      upstream_bandwidth: upstreamData,
      downstream_bandwidth: downstreamData,
      current_upstream: upstreamData[upstreamData.length - 1],
      current_downstream: downstreamData[downstreamData.length - 1]
    }

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
    // return visionAIAxios.get('/api/v1/bandwidth/usage', {
    //   params: { time_range: timeRange }
    // })
  }
}

// 导出单例实例
export default new SystemMonitorAPI()
