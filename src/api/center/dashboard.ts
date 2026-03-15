/**
 * 大屏监控统一 API
 * 提供一次性获取所有大屏所需数据的接口
 */
import authAxios from "@/api/commons";
import type { DashboardSummary } from "@/types/center/dashboard";

/**
 * 大屏监控 API 类
 */
class DashboardAPI {
  /**
   * 获取大屏监控摘要数据
   * GET /api/v1/monitor/dashboard/summary
   * 一次性返回所有大屏需要的数据：预警、设备、系统统计
   *
   * 注意：响应拦截器会自动提取 data.data 字段
   * 使用 axios 的类型参数来指定返回类型，而不是使用 'as' 类型断言
   */
  getSummary(): Promise<DashboardSummary> {
    // 响应拦截器会自动提取 data 字段，因此这里返回的就是 DashboardSummary
    return authAxios.get<any, DashboardSummary>("/api/v1/monitor/dashboard/summary");
  }
}

// 导出单例实例
export default new DashboardAPI();
