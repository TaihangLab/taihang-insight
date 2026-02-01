import { AxiosResponse } from 'axios'
import visionAIAxios, { type UnifiedResponse } from './base'
/**
 * 实时监控管理 API
 * 提供实时监控页面的通道管理和视频播放功能
 */

/**
 * 通道查询参数
 */
export interface ChannelQueryParams {
  page?: number
  count?: number
  query?: string
  online?: boolean
  has_record_plan?: boolean
  channel_type?: number
  civil_code?: string
  parent_device_id?: string
}

/**
 * 通道数据
 */
export interface Channel {
  id: number
  name: string
  channel_id: string
  status: boolean
  online: boolean
  channel_type: number
  civil_code?: string
  device_id?: string
}

/**
 * 播放流信息
 */
export interface PlayStreamInfo {
  stream_url: string
  stream_type: string
  rtsp_url?: string
  flv_url?: string
  hls_url?: string
}

/**
 * 树节点查询参数
 */
export interface TreeQueryParams {
  query?: string
  parent?: number
  hasChannel?: boolean
  online?: boolean
  channel_type?: number
}

/**
 * 树节点
 */
export interface TreeNode {
  id: string | number
  label: string
  children?: TreeNode[]
  status?: string
  type?: string
}

/**
 * 实时监控管理 API 类
 */
class RealtimeMonitorAPI {
  /**
   * 获取实时监控通道列表
   * @param params 查询参数
   */
  async getChannelList(params: ChannelQueryParams = {}): Promise<AxiosResponse<UnifiedResponse<Channel[]>>> {
    console.log('📤 获取实时监控通道列表 - 参数:', params)

    try {
      const response = await visionAIAxios.get('/api/v1/realtime-monitor/channels', { params })
      console.log('📥 获取实时监控通道列表成功:', response.data)
      return response
    } catch (error) {
      console.error('❌ 获取实时监控通道列表失败:', error)
      throw error
    }
  }

  /**
   * 获取通道详情
   * @param channelId 通道ID
   */
  async getChannelDetail(channelId: number): Promise<AxiosResponse<UnifiedResponse<Channel>>> {
    if (!channelId) {
      console.error('获取通道详情失败: 缺少通道ID')
      return Promise.reject(new Error('缺少通道ID'))
    }

    console.log('📤 获取通道详情 - 通道ID:', channelId)

    try {
      const response = await visionAIAxios.get(`/api/v1/realtime-monitor/channels/${channelId}`)
      console.log('📥 获取通道详情成功:', response.data)
      return response
    } catch (error) {
      console.error('❌ 获取通道详情失败:', error)
      throw error
    }
  }

  /**
   * 播放通道视频
   * @param channelId 通道ID
   */
  async playChannel(channelId: number): Promise<AxiosResponse<UnifiedResponse<PlayStreamInfo>>> {
    if (!channelId) {
      console.error('播放通道失败: 缺少通道ID')
      return Promise.reject(new Error('缺少通道ID'))
    }

    console.log('📤 播放通道 - 通道ID:', channelId)

    try {
      const response = await visionAIAxios.get(`/api/v1/realtime-monitor/play/${channelId}`)
      console.log('📥 播放通道成功:', response.data)
      return response
    } catch (error) {
      console.error('❌ 播放通道失败:', error)
      throw error
    }
  }

  /**
   * 停止播放通道视频
   * @param channelId 通道ID
   */
  async stopChannel(channelId: number): Promise<AxiosResponse> {
    if (!channelId) {
      console.error('停止播放通道失败: 缺少通道ID')
      return Promise.reject(new Error('缺少通道ID'))
    }

    console.log('📤 停止播放通道 - 通道ID:', channelId)

    try {
      const response = await visionAIAxios.get(`/api/v1/realtime-monitor/stop/${channelId}`)
      console.log('📥 停止播放成功:', response.data)
      return response
    } catch (error) {
      console.error('❌ 停止播放失败:', error)
      throw error
    }
  }

  /**
   * 获取通道树结构
   * @param params 查询参数
   */
  async getChannelTree(params: TreeQueryParams = {}): Promise<AxiosResponse<UnifiedResponse<TreeNode[]>>> {
    console.log('📤 获取通道树 - 参数:', params)

    try {
      const response = await visionAIAxios.get('/api/v1/realtime-monitor/channels/tree', { params })
      console.log('📥 获取通道树成功:', response.data)
      return response
    } catch (error) {
      console.error('❌ 获取通道树失败:', error)
      throw error
    }
  }

  /**
   * 获取行政区划树
   * @param params 查询参数
   */
  async getRegionTree(params: TreeQueryParams = {}): Promise<AxiosResponse<UnifiedResponse<TreeNode[]>>> {
    console.log('📤 获取行政区划树 - 参数:', params)

    try {
      const response = await visionAIAxios.get('/api/v1/realtime-monitor/region/tree', { params })
      console.log('📥 获取行政区划树成功:', response.data)
      return response
    } catch (error) {
      console.error('❌ 获取行政区划树失败:', error)
      throw error
    }
  }

  /**
   * 获取业务分组树
   * @param params 查询参数
   */
  async getGroupTree(params: TreeQueryParams = {}): Promise<AxiosResponse<UnifiedResponse<TreeNode[]>>> {
    console.log('📤 获取业务分组树 - 参数:', params)

    try {
      const response = await visionAIAxios.get('/api/v1/realtime-monitor/group/tree', { params })
      console.log('📥 获取业务分组树成功:', response.data)
      return response
    } catch (error) {
      console.error('❌ 获取业务分组树失败:', error)
      throw error
    }
  }
}

// 导出单例实例
export default new RealtimeMonitorAPI()
