import { apiGet } from "@/api/utils/apiHelpers";
import type {
  ResourceMetric,
  TimeRange,
  SystemResourcesData,
  CurrentResources,
  ResourceHistory,
  StorageUsage,
  BandwidthUsage,
} from "@/types/center.d";

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
   */
  getSystemResources(): Promise<SystemResourcesData> {
    return apiGet<SystemResourcesData>("/api/v1/server/system/resources");
  }

  /**
   * 获取当前资源使用率
   * GET /api/v1/system/resources
   */
  getCurrentResources(): Promise<CurrentResources> {
    return apiGet<CurrentResources>("/api/v1/system/resources");
  }

  /**
   * 获取资源历史数据（用于图表展示）
   * GET /api/v1/system/resources/history
   * @param metric 资源类型: 'cpu' | 'memory' | 'disk' | 'network'
   * @param timeRange 时间范围: '1h' | '6h' | '24h' | '7d'
   */
  getResourceHistory(
    metric: ResourceMetric = "cpu",
    timeRange: TimeRange = "1h",
  ): Promise<ResourceHistory> {
    return apiGet<ResourceHistory>("/api/v1/system/resources/history", {
      params: { metric, time_range: timeRange },
    });
  }

  /**
   * 获取存储使用情况
   * GET /api/v1/storage/usage
   */
  getStorageUsage(): Promise<StorageUsage> {
    return apiGet<StorageUsage>("/api/v1/storage/usage");
  }

  /**
   * 获取带宽使用情况
   * GET /api/v1/bandwidth/usage
   * @param timeRange 时间范围
   */
  getBandwidthUsage(timeRange: TimeRange = "1h"): Promise<BandwidthUsage> {
    return apiGet<BandwidthUsage>("/api/v1/bandwidth/usage", {
      params: { time_range: timeRange },
    });
  }
}

// 导出单例实例
export default new SystemMonitorAPI();
