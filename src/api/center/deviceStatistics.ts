/**
 * 设备统计管理 API
 * 提供设备状态统计和设备树结构
 */

import { AxiosResponse } from 'axios'
import { type UnifiedResponse, UnifiedResponse } from './base'

/**
 * 设备状态统计
 */
export interface DeviceStatusStatistics {
  total_devices: number
  online_devices: number
  offline_devices: number
  online_rate: number
  device_groups: DeviceGroup[]
}

/**
 * 设备分组
 */
export interface DeviceGroup {
  name: string
  online: number
  offline: number
  total: number
}

/**
 * 设备树节点
 */
export interface DeviceTreeNode {
  id: string
  label: string
  status?: string
  children?: DeviceTreeNode[]
}

/**
 * 设备接入摘要
 */
export interface ConnectionSummary {
  total_connections: number
  video_streams: number
  capture_services: number
  nvr_calls: number
  other_connections: number
}

/**
 * 设备统计管理 API 类
 */
class DeviceStatisticsAPI {
  /**
   * 获取设备状态统计
   */
  async getStatusStatistics(): Promise<AxiosResponse<UnifiedResponse<DeviceStatusStatistics>>> {
    console.log('[设备API] 获取设备状态统计')

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
        resolve({
          data: {
            code: 0,
            msg: 'success',
            data: mockData
          }
        } as any)
      }, 200)
    })

    // 真实API调用
    // return visionAIAxios.get('/api/v1/devices/statistics')
  }

  /**
   * 获取设备树状结构
   */
  async getDeviceTree(): Promise<AxiosResponse<UnifiedResponse<DeviceTreeNode[]>>> {
    console.log('[设备API] 获取设备树状结构')

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
        resolve({
          data: {
            code: 0,
            msg: 'success',
            data: mockData
          }
        } as any)
      }, 300)
    })

    // 真实API调用
    // return visionAIAxios.get('/api/v1/devices/tree')
  }

  /**
   * 获取设备接入摘要
   */
  async getConnectionSummary(): Promise<AxiosResponse<UnifiedResponse<ConnectionSummary>>> {
    console.log('[设备API] 获取设备接入摘要')

    const mockData: ConnectionSummary = {
      total_connections: 286589,
      video_streams: 562,
      capture_services: 23108,
      nvr_calls: 2389,
      other_connections: 260530
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            code: 0,
            msg: 'success',
            data: mockData
          }
        } as any)
      }, 200)
    })

    // 真实API调用
    // return visionAIAxios.get('/api/v1/devices/summary')
  }
}

// 导出单例实例
export default new DeviceStatisticsAPI()
