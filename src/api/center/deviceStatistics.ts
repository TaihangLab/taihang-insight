import { authAxios } from "@/api/commons";
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
   *
   * 注意：响应拦截器会自动提取 data.data 字段
   * 使用 axios 的类型参数来指定返回类型，而不是使用 'as' 类型断言
   */
  getStatusStatistics(): Promise<DeviceStatusStatistics> {
    // 响应拦截器会自动提取 data 字段，因此这里返回的就是 DeviceStatusStatistics
    return authAxios.get<any, DeviceStatusStatistics>("/api/v1/devices/statistics");
  }

  /**
   * 获取设备树状结构
   * GET /api/v1/devices/tree
   *
   * 注意：响应拦截器会自动提取 data.data 字段
   * 使用 axios 的类型参数来指定返回类型，而不是使用 'as' 类型断言
   */
  getDeviceTree(): Promise<DeviceTreeNode[]> {
    // 响应拦截器会自动提取 data 字段，因此这里返回的就是 DeviceTreeNode[]
    return authAxios.get<any, DeviceTreeNode[]>("/api/v1/devices/tree");
  }

  /**
   * 获取设备接入摘要
   * GET /api/v1/devices/summary
   *
   * 注意：响应拦截器会自动提取 data.data 字段
   * 使用 axios 的类型参数来指定返回类型，而不是使用 'as' 类型断言
   */
  getConnectionSummary(): Promise<ConnectionSummary> {
    // 响应拦截器会自动提取 data 字段，因此这里返回的就是 ConnectionSummary
    return authAxios.get<any, ConnectionSummary>("/api/v1/devices/summary");
  }
}

// 导出单例实例
export default new DeviceStatisticsAPI();
