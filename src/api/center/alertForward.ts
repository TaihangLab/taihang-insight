import { apiGet } from "@/api/utils/apiHelpers";
import type { ForwardTimeRange, AlertForwardStatistics } from "@/types/center.d";

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
   */
  getForwardStatistics(timeRange: ForwardTimeRange = "7d"): Promise<AlertForwardStatistics> {
    return apiGet<AlertForwardStatistics>("/api/v1/alerts/forward-statistics", {
      params: { time_range: timeRange },
    });
  }
}

// 导出单例实例
export default new AlertForwardAPI();
