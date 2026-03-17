import { apiGet } from "@/api/utils/apiHelpers";
import type {
  AlertSummary,
  AlertTypeStat,
  LocationStat,
  AlertTrend,
  AlertLevelStat,
  AlertImage,
  TimeRange,
  Granularity,
} from "@/types/center/alertStatistics";

/**
 * 预警统计管理 API 类
 */
class AlertStatisticsAPI {
  /**
   * 获取综合统计（包含设备 Top 10）
   * @param range 时间范围: '24h' | '7d' | '30d'
   */
  async getSummary(range: TimeRange = "24h"): Promise<AlertSummary> {
    return apiGet<AlertSummary>("/api/v1/alerts/statistics", {
      params: { range },
    });
  }

  /**
   * 获取预警趋势数据
   * @param range 时间范围: '24h' | '7d' | '30d'
   * @param granularity 时间粒度: 'hour' | 'day'
   */
  async getTrend(range: TimeRange = "24h", granularity: Granularity = "hour"): Promise<AlertTrend> {
    return apiGet<AlertTrend>("/api/v1/alerts/statistics/trend", {
      params: { range, granularity },
    });
  }

  /**
   * 获取预警类型排名
   * @param range 时间范围: '24h' | '7d' | '30d'
   * @param topN 返回 Top N
   */
  async getByType(range: TimeRange = "7d", topN: number = 10): Promise<AlertTypeStat[]> {
    return apiGet<AlertTypeStat[]>("/api/v1/alerts/statistics/by-type", {
      params: { range, top_n: topN },
    });
  }

  /**
   * 获取预警等级占比
   * @param range 时间范围: '24h' | '7d' | '30d'
   */
  async getByLevel(range: TimeRange = "7d"): Promise<AlertLevelStat[]> {
    return apiGet<AlertLevelStat[]>("/api/v1/alerts/statistics/level", {
      params: { range },
    });
  }

  /**
   * 获取位置/设备预警数量 Top N
   * @param range 时间范围: '24h' | '7d' | '30d'
   * @param topN 返回 Top N
   */
  async getByLocation(range: TimeRange = "7d", topN: number = 10): Promise<LocationStat[]> {
    return apiGet<LocationStat[]>("/api/v1/alerts/statistics/location", {
      params: { range, top_n: topN },
    });
  }

  /**
   * 获取最新预警图片（用于大屏展示）
   * @param limit 返回数量限制
   */
  async getLatestImages(limit = 10): Promise<AlertImage[]> {
    try {
      const response = await apiGet<AlertImage[]>("/api/v1/alerts/latest-images", {
        params: { limit },
      });

      // 处理图片 URL
      return response.map((item: AlertImage) => ({
        ...item,
        // 如果 image_url 是 http/https 开头，确保直接使用完整 URL
        image_url: item.image_url?.startsWith("http") ? item.image_url : item.image_url,
      }));
    } catch (error) {
      console.error("[统计API] 获取最新预警图片失败:", error);
      // 失败时返回空数组
      return [];
    }
  }

  /**
   * 获取预警处理情况统计
   * @param range 时间范围: '24h' | '7d' | '30d'
   */
  async getProcessingStatus(range: TimeRange = "7d"): Promise<AlertLevelStat[]> {
    return apiGet<AlertLevelStat[]>("/api/v1/alerts/statistics/processing-status", {
      params: { range },
    });
  }
}

// 导出单例实例
export default new AlertStatisticsAPI();
