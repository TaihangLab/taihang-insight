import { authAxios } from '@/api/commons'
import type { ForwardTimeRange, AlertForwardStatistics } from '@/types/center.d'

/**
 * 预警转发统计 API
 * 提供预警转发相关统计数据
 */

/**
 * 预警转发统计 API 类
 */
class AlertForwardAPI {
  /**
   * 获取报警转发统计
   * GET /api/v1/alerts/forward-statistics
   * @param timeRange 时间范围: '7d' | '30d'
   *
   * 注意：响应拦截器会自动提取 data.data 字段
   * 使用 axios 的类型参数来指定返回类型，而不是使用 'as' 类型断言
   */
  getForwardStatistics(timeRange: ForwardTimeRange = '7d'): Promise<AlertForwardStatistics> {
    // 响应拦截器会自动提取 data 字段，因此这里返回的就是 AlertForwardStatistics
    return authAxios.get<any, AlertForwardStatistics>(
      '/api/v1/alerts/forward-statistics',
      {
        params: { time_range: timeRange }
      }
    )
  }
}

// 导出单例实例
export default new AlertForwardAPI()
