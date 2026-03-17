/**
 * 大屏监控数据统一类型定义
 */

/**
 * 预警等级统计
 */
export interface AlertLevel {
  level: number; // 预警等级 1-4
  level_name: string; // 等级名称：一般、重要、紧急、特急
  count: number; // 该等级的数量
  percentage: number; // 百分比
  color?: string; // 可选的颜色值
}

/**
 * 预警状态统计
 */
export interface AlertStatus {
  status: number; // 状态码 1-5
  status_name: string; // 状态名称：待处理、处理中、已处理、已归档、误报
  count: number; // 该状态的数量
  percentage: number; // 百分比
  color?: string; // 可选的颜色值
}

/**
 * 预警统计摘要（原 alerts/summary 接口返回）
 */
export interface AlertSummary {
  total_alerts: number; // 总预警数
  today_alerts: number; // 今日新增
  pending_alerts: number; // 待处理数
  processing_alerts: number; // 处理中数
  resolved_today: number; // 今日已处理
  resolution_rate: number; // 处理率
}

/**
 * 设备预警 TOP 条目
 */
export interface DeviceTopWarning {
  camera_id: number; // 摄像头 ID
  camera_name: string; // 摄像头名称
  count: number; // 预警数量
}

/**
 * 设备数据统计
 */
export interface DeviceStats {
  total_cameras: number; // 总摄像头数
  online_cameras: number; // 在线摄像头数
  offline_cameras: number; // 离线摄像头数
  video_streams: number; // 活跃视频流数
  capture_services: number; // 抓图服务数
}

/**
 * 系统运行状态
 */
export interface SystemStatus {
  running_tasks: number; // 运行中的任务数
  scheduler_running: boolean; // 调度器状态
  active_connections: number; // 活跃连接数
}

/**
 * 大屏监控摘要数据（兼容旧类型）
 * @deprecated 请使用拆分后的各个接口
 */
export interface DashboardSummary {
  alerts: AlertSummary;
  devices: DeviceStats;
  system: SystemStatus;
  alert_levels: AlertLevel[]; // 预警等级统计
  timestamp: string;
}

/**
 * 时间范围参数
 */
export type TimeRange = "24h" | "7d" | "30d" | "day" | "week" | "month";

/**
 * 大屏数据聚合响应
 * 各个独立接口返回的数据聚合后
 */
export interface DashboardData {
  alertSummary: AlertSummary;
  alertLevels: AlertLevel[];
  alertStatus: AlertStatus[];
  deviceTopWarnings: DeviceTopWarning[];
  systemStatus: SystemStatus;
}
