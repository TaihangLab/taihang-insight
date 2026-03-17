/**
 * 大屏监控 API
 * 拆分为多个独立接口，分别获取各模块数据
 * 原 /api/v1/monitor/dashboard/summary 已弃用并删除
 */
import authAxios from "@/api/commons";
import type {
  AlertSummary,
  AlertLevel,
  AlertStatus,
  DeviceTopWarning,
  SystemStatus,
  TimeRange,
} from "@/types/center/dashboard";

/**
 * 大屏监控 API 类
 */
class DashboardAPI {
  /**
   * 获取预警统计摘要
   * GET /api/v1/monitor/alerts/summary
   */
  getAlertSummary(): Promise<AlertSummary> {
    return authAxios.get<unknown, AlertSummary>("/api/v1/monitor/alerts/summary");
  }

  /**
   * 获取预警等级分布
   * GET /api/v1/monitor/alerts/levels
   */
  getAlertLevels(range: TimeRange = "7d"): Promise<AlertLevel[]> {
    return authAxios.get<unknown, AlertLevel[]>("/api/v1/monitor/alerts/levels", {
      params: { range },
    });
  }

  /**
   * 获取预警状态分布
   * GET /api/v1/monitor/alerts/status
   */
  getAlertStatus(range: TimeRange = "7d"): Promise<AlertStatus[]> {
    return authAxios.get<unknown, AlertStatus[]>("/api/v1/monitor/alerts/status", {
      params: { range },
    });
  }

  /**
   * 获取设备预警 TOP 列表
   * GET /api/v1/monitor/devices/top-warnings
   */
  getDeviceTopWarnings(range: TimeRange = "7d", topN: number = 10): Promise<DeviceTopWarning[]> {
    return authAxios.get<unknown, DeviceTopWarning[]>("/api/v1/monitor/devices/top-warnings", {
      params: { range, top_n: topN },
    });
  }

  /**
   * 获取系统运行状态
   * GET /api/v1/monitor/system/status
   */
  getSystemStatus(): Promise<SystemStatus> {
    return authAxios.get<unknown, SystemStatus>("/api/v1/monitor/system/status");
  }

  /**
   * @deprecated 原接口已删除，请使用拆分后的独立接口
   * GET /api/v1/monitor/dashboard/summary
   */
  getSummary(): Promise<never> {
    return Promise.reject(new Error("getSummary 接口已删除，请使用拆分后的独立接口"));
  }
}

// 导出单例实例
export default new DashboardAPI();
