/**
 * 预警统计相关类型定义
 */

/**
 * 时间范围类型
 */
export type TimeRange = '24h' | '7d' | '30d'

/**
 * 时间粒度类型
 */
export type Granularity = 'hour' | 'day'

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
