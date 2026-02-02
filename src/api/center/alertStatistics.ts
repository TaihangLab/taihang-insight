import authAxios from '@/api/commons'
import type {
  AlertSummary,
  AlertTypeStat,
  LocationStat,
  AlertTrend,
  AlertLevelStat,
  AlertImage,
  TimeRange,
  Granularity
} from '@/types/center/alertStatistics'

/**
 * 预警统计管理 API 类
 */
class AlertStatisticsAPI {
  /**
   * 获取综合统计（包含设备 Top 10）
   * @param range 时间范围: '24h' | '7d' | '30d'
   * 注意：响应拦截器会提取 data 字段，返回类型是 AlertSummary
   */
  async getSummary(range: TimeRange = '24h'): Promise<AlertSummary> {
    return authAxios.get('/api/v1/alerts/statistics', {
      params: { range }
    }) as Promise<AlertSummary>
  }

  /**
   * 获取预警趋势数据
   * @param range 时间范围: '24h' | '7d' | '30d'
   * @param granularity 时间粒度: 'hour' | 'day'
   * 注意：响应拦截器会提取 data 字段，返回类型是 AlertTrend
   */
  async getTrend(
    range: TimeRange = '24h',
    granularity: Granularity = 'hour'
  ): Promise<AlertTrend> {
    return authAxios.get('/api/v1/alerts/statistics/trend', {
      params: { range, granularity }
    }) as Promise<AlertTrend>
  }

  /**
   * 获取预警类型排名
   * @param range 时间范围: '24h' | '7d' | '30d'
   * @param topN 返回 Top N
   * 注意：响应拦截器会提取 data 字段，返回类型是 AlertTypeStat[]
   */
  async getByType(
    range: TimeRange = '7d',
    topN: number = 10
  ): Promise<AlertTypeStat[]> {
    return authAxios.get('/api/v1/alerts/statistics/by-type', {
      params: { range, top_n: topN }
    }) as Promise<AlertTypeStat[]>
  }

  /**
   * 获取预警等级占比
   * @param range 时间范围: '24h' | '7d' | '30d'
   * 注意：响应拦截器会提取 data 字段，返回类型是 AlertLevelStat[]
   */
  async getByLevel(
    range: TimeRange = '7d'
  ): Promise<AlertLevelStat[]> {
    return authAxios.get('/api/v1/alerts/statistics/level', {
      params: { range }
    }) as Promise<AlertLevelStat[]>
  }

  /**
   * 获取位置/设备预警数量 Top N
   * @param range 时间范围: '24h' | '7d' | '30d'
   * @param topN 返回 Top N
   * 注意：响应拦截器会提取 data 字段，返回类型是 LocationStat[]
   */
  async getByLocation(
    range: TimeRange = '7d',
    topN: number = 10
  ): Promise<LocationStat[]> {
    return authAxios.get('/api/v1/alerts/statistics/location', {
      params: { range, top_n: topN }
    }) as Promise<LocationStat[]>
  }

  /**
   * 获取最新预警图片（用于大屏展示）
   * @param limit 返回数量限制
   */
  async getLatestImages(limit = 10): Promise<AlertImage[]> {
    try {
      const response = await authAxios.get('/api/v1/alerts/latest-images', {
        params: { limit }
      })

      // 响应拦截器已经处理了 UnifiedResponse 格式，直接返回 data 字段
      let images: AlertImage[] = []

      if (Array.isArray(response)) {
        // 响应拦截器已经提取了 data 字段
        images = response.map((item: AlertImage) => ({
          ...item,
          // 如果 image_url 是 http/https 开头，确保直接使用完整 URL
          image_url: item.image_url?.startsWith('http')
            ? item.image_url
            : item.image_url
        }))
      }

      return images
    } catch (error) {
      console.error('[统计API] 获取最新预警图片失败:', error)
      // 失败时返回空数组
      return []
    }
  }

  /**
   * 获取预警处理情况统计
   * @param range 时间范围: '24h' | '7d' | '30d'
   * 注意：响应拦截器会提取 data 字段，返回类型是 AlertLevelStat[]
   */
  async getProcessingStatus(
    range: TimeRange = '7d'
  ): Promise<AlertLevelStat[]> {
    return authAxios.get('/api/v1/alerts/statistics/processing-status', {
      params: { range }
    }) as Promise<AlertLevelStat[]>
  }
}

// 导出单例实例
export default new AlertStatisticsAPI()
