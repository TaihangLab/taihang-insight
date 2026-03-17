import { apiGet } from "@/api/utils/apiHelpers";
import type { DeviceStatusStatistics, DeviceTreeNode, ConnectionSummary } from "@/types/center.d";

/**
 * 设备统计管理 API
 * 提供设备状态统计和设备树结构
 */

/**
 * 设备统计管理 API 类
 */
class DeviceStatisticsAPI {
  /**
   * 获取设备状态统计
   * GET /api/v1/devices/statistics
   */
  getStatusStatistics(): Promise<DeviceStatusStatistics> {
    return apiGet<DeviceStatusStatistics>("/api/v1/devices/statistics");
  }

  /**
   * 获取设备树状结构
   * GET /api/v1/devices/tree
   */
  getDeviceTree(): Promise<DeviceTreeNode[]> {
    return apiGet<DeviceTreeNode[]>("/api/v1/devices/tree");
  }

  /**
   * 获取设备接入摘要
   * GET /api/v1/devices/summary
   */
  getConnectionSummary(): Promise<ConnectionSummary> {
    return apiGet<ConnectionSummary>("/api/v1/devices/summary");
  }
}

// 导出单例实例
export default new DeviceStatisticsAPI();
