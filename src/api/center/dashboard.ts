/**
 * 大屏监控统一 API
 * 提供一次性获取所有大屏所需数据的接口
 */
import authAxios from '@/api/commons'
import type { DashboardSummary } from '@/types/center/dashboard'

/**
 * 大屏监控 API 类
 */
class DashboardAPI {
  /**
   * 获取大屏监控摘要数据
   * 一次性返回所有大屏需要的数据：预警、设备、系统统计
   */
  async getSummary(): Promise<DashboardSummary> {
    return authAxios.get('/monitor/dashboard/summary') as Promise<DashboardSummary>
  }
}

// 导出单例实例
export default new DashboardAPI()
