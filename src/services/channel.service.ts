/**
 * 通道管理服务（WVP 平台）
 */

import axiosInstance from './config/axios'
import type { ApiResponse, PaginatedResponse, Channel, ChannelListParams } from './types'

export class ChannelService {
  private readonly basePath = '/api/v1/wvp/channels'

  /**
   * 获取通道列表
   */
  async getChannelList(params?: ChannelListParams): Promise<PaginatedResponse<Channel>> {
    const response = await axiosInstance.get<any, PaginatedResponse<Channel>>(this.basePath, { params })
    return response
  }

  /**
   * 获取通道详情
   */
  async getChannelDetail(channelId: string): Promise<ApiResponse<Channel>> {
    const response = await axiosInstance.get<any, ApiResponse<Channel>>(`${this.basePath}/${channelId}`)
    return response
  }

  /**
   * 播放通道
   */
  async playChannel(channelId: string): Promise<ApiResponse<{ stream_url: string }>> {
    const response = await axiosInstance.post<any, ApiResponse<{ stream_url: string }>>(
      `${this.basePath}/${channelId}/play`
    )
    return response
  }

  /**
   * 停止通道播放
   */
  async stopChannel(channelId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await axiosInstance.post<any, ApiResponse<{ message: string }>>(
      `${this.basePath}/${channelId}/stop`
    )
    return response
  }

  /**
   * 获取通道树
   */
  async getChannelTree(params?: {
    catalog_id?: string
  }): Promise<ApiResponse<any[]>> {
    const response = await axiosInstance.get<any, ApiResponse<any[]>>(
      `${this.basePath}/tree`,
      { params }
    )
    return response
  }
}

// 导出单例
export default new ChannelService()
