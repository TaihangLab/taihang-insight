import { authAxios } from '@/api/commons'
import type { ResourceMetric, TimeRange, SystemResourcesData, CurrentResources, ResourceHistory, StorageUsage, BandwidthUsage } from '@/types/center.d'

/**
 * 系统资源监控 API
 * 提供系统资源使用率监控数据
 */

/**
 * 系统资源监控 API 类
 */
class SystemMonitorAPI {
  /**
   * 获取系统资源数据（完整版）
   * GET /api/v1/server/system/resources
   *
   * 注意：响应拦截器会自动提取 data.data 字段
   * 使用 axios 的类型参数来指定返回类型，而不是使用 'as' 类型断言
   */
  getSystemResources(): Promise<SystemResourcesData> {
    // 响应拦截器会自动提取 data 字段，因此这里返回的就是 SystemResourcesData
    return authAxios.get<any, SystemResourcesData>('/api/v1/server/system/resources')
  }

  /**
   * 获取当前资源使用率
   * GET /api/v1/system/resources
   *
   * 注意：响应拦截器会自动提取 data.data 字段
   * 使用 axios 的类型参数来指定返回类型，而不是使用 'as' 类型断言
   */
  getCurrentResources(): Promise<CurrentResources> {
    // 响应拦截器会自动提取 data 字段，因此这里返回的就是 CurrentResources
    return authAxios.get<any, CurrentResources>('/api/v1/system/resources')
  }

  /**
   * 获取资源历史数据（用于图表展示）
   * GET /api/v1/system/resources/history
   * @param metric 资源类型: 'cpu' | 'memory' | 'disk' | 'network'
   * @param timeRange 时间范围: '1h' | '6h' | '24h' | '7d'
   *
   * 注意：响应拦截器会自动提取 data.data 字段
   * 使用 axios 的类型参数来指定返回类型，而不是使用 'as' 类型断言
   */
  getResourceHistory(metric: ResourceMetric = 'cpu', timeRange: TimeRange = '1h'): Promise<ResourceHistory> {
    // 响应拦截器会自动提取 data 字段，因此这里返回的就是 ResourceHistory
    return authAxios.get<any, ResourceHistory>('/api/v1/system/resources/history', {
      params: { metric, time_range: timeRange }
    })
  }

  /**
   * 获取存储使用情况
   * GET /api/v1/storage/usage
   *
   * 注意：响应拦截器会自动提取 data.data 字段
   * 使用 axios 的类型参数来指定返回类型，而不是使用 'as' 类型断言
   */
  getStorageUsage(): Promise<StorageUsage> {
    // 响应拦截器会自动提取 data 字段，因此这里返回的就是 StorageUsage
    return authAxios.get<any, StorageUsage>('/api/v1/storage/usage')
  }

  /**
   * 获取带宽使用情况
   * GET /api/v1/bandwidth/usage
   * @param timeRange 时间范围
   *
   * 注意：响应拦截器会自动提取 data.data 字段
   * 使用 axios 的类型参数来指定返回类型，而不是使用 'as' 类型断言
   */
  getBandwidthUsage(timeRange: TimeRange = '1h'): Promise<BandwidthUsage> {
    // 响应拦截器会自动提取 data 字段，因此这里返回的就是 BandwidthUsage
    return authAxios.get<any, BandwidthUsage>('/api/v1/bandwidth/usage', {
      params: { time_range: timeRange }
    })
  }
}

// 导出单例实例
export default new SystemMonitorAPI()
