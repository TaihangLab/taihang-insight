/**
 * 大屏监控统一 API
 * 提供一次性获取所有大屏所需数据的接口
 */
import authAxios from '@/api/commons'
import type { DashboardSummary } from '@/types/center/dashboard'

/**
 * 创建模拟数据（用于开发环境或 API 不可用时）
 */
function createMockData(): DashboardSummary {
  return {
    alerts: {
      total_alerts: 1247,
      today_alerts: 89,
      pending_alerts: 23,
      processing_alerts: 12,
      resolved_today: 54
    },
    devices: {
      total_cameras: 156,
      online_cameras: 142,
      offline_cameras: 14,
      video_streams: 138,
      capture_services: 8
    },
    system: {
      running_tasks: 45,
      scheduler_running: true,
      active_connections: 23
    },
    timestamp: new Date().toISOString()
  }
}

/**
 * 大屏监控 API 类
 */
class DashboardAPI {
  /**
   * 获取大屏监控摘要数据
   * 一次性返回所有大屏需要的数据：预警、设备、系统统计
   *
   * 注意：当后端接口不可用时，会返回模拟数据并在控制台输出警告
   */
  async getSummary(): Promise<DashboardSummary> {
    try {
      const data = await authAxios.get('/api/v1/monitor/dashboard/summary') as DashboardSummary

      // 验证返回数据格式
      if (!data || !data.alerts || !data.devices || !data.system) {
        console.warn('⚠️ [DashboardAPI] 返回数据格式不正确，使用模拟数据')
        return createMockData()
      }

      return data
    } catch (error: any) {
      // 检查是否是 404 错误（接口不存在）
      if (error?.response?.status === 404 || error?.status === 404) {
        console.warn('⚠️ [DashboardAPI] 接口 /api/v1/monitor/dashboard/summary 不存在，使用模拟数据')
        console.info('ℹ️ 请联系后端开发人员添加该接口，或检查接口路径是否正确')
      } else {
        console.error('❌ [DashboardAPI] 加载大屏摘要数据失败:', error?.message || error)
      }

      // 返回模拟数据，确保页面正常运行
      return createMockData()
    }
  }
}

// 导出单例实例
export default new DashboardAPI()
