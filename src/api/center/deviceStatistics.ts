import type { DeviceStatusStatistics, DeviceTreeNode, ConnectionSummary } from '@/types/center'

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
   * 注意：响应拦截器会提取 data 字段，返回类型是 DeviceStatusStatistics
   */
  async getStatusStatistics(): Promise<DeviceStatusStatistics> {
    const mockData: DeviceStatusStatistics = {
      total_devices: 150,
      online_devices: 120,
      offline_devices: 30,
      online_rate: 80,
      device_groups: [
        { name: '总数量', online: 27, offline: 3, total: 30 },
        { name: '摄像头组A', online: 18, offline: 9, total: 27 }
      ]
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockData)
      }, 200)
    })

    // 真实API调用（会经过响应拦截器处理）
    // return authAxios.get('/api/v1/devices/statistics') as Promise<DeviceStatusStatistics>
  }

  /**
   * 获取设备树状结构
   * 注意：响应拦截器会提取 data 字段，返回类型是 DeviceTreeNode[]
   */
  async getDeviceTree(): Promise<DeviceTreeNode[]> {
    const mockData: DeviceTreeNode[] = [{
      id: '1',
      label: '市直单位',
      children: [{
        id: '2',
        label: '清江园区',
        children: [{
          id: '3',
          label: '清江园区-南',
          children: [
            { id: '4', label: '监控点1号探头', status: 'online' },
            { id: '5', label: '监控点2号探头', status: 'online' }
          ]
        }, {
          id: '6',
          label: '清江园区-西',
          children: [
            { id: '7', label: '监控点19号探头', status: 'offline' },
            { id: '8', label: '监控点21号探头', status: 'online' }
          ]
        }]
      }]
    }]

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockData)
      }, 300)
    })

    // 真实API调用（会经过响应拦截器处理）
    // return authAxios.get('/api/v1/devices/tree') as Promise<DeviceTreeNode[]>
  }

  /**
   * 获取设备接入摘要
   * 注意：响应拦截器会提取 data 字段，返回类型是 ConnectionSummary
   */
  async getConnectionSummary(): Promise<ConnectionSummary> {
    const mockData: ConnectionSummary = {
      total_connections: 286589,
      video_streams: 562,
      capture_services: 23108,
      nvr_calls: 2389,
      other_connections: 260530
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockData)
      }, 200)
    })

    // 真实API调用（会经过响应拦截器处理）
    // return authAxios.get('/api/v1/devices/summary') as Promise<ConnectionSummary>
  }
}

// 导出单例实例
export default new DeviceStatisticsAPI()
