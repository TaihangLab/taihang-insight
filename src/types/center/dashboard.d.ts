/**
 * 大屏监控数据统一类型定义
 */

/**
 * 预警数据统计
 */
export interface AlertStats {
  total_alerts: number        // 总预警数
  today_alerts: number        // 今日新增
  pending_alerts: number      // 待处理数
  processing_alerts: number   // 处理中数
  resolved_today: number      // 今日已处理
}

/**
 * 设备数据统计
 */
export interface DeviceStats {
  total_cameras: number       // 总摄像头数
  online_cameras: number      // 在线摄像头数
  offline_cameras: number     // 离线摄像头数
  video_streams: number       // 活跃视频流数
  capture_services: number    // 抓图服务数
}

/**
 * 系统数据统计
 */
export interface SystemStats {
  running_tasks: number        // 运行中的任务数
  scheduler_running: boolean   // 调度器状态
  active_connections: number   // 活跃连接数
}

/**
 * 大屏监控摘要数据
 */
export interface DashboardSummary {
  alerts: AlertStats
  devices: DeviceStats
  system: SystemStats
  timestamp: string
}
