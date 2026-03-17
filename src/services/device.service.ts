/**
 * 设备管理 API 服务
 * 提供国标设备、推流设备、拉流设备等的管理功能
 */

import axiosInstance from "@/services/config/axios";
import type { ApiResponse, PaginatedResponse } from "@/services/types";

/**
 * 国标设备信息
 */
export interface GBDevice {
  id: string;
  name: string;
  status: boolean;
  channelCount: number;
  online: boolean;
  manufacturer?: string;
  model?: string;
  ipAddress?: string;
  registerTime?: string;
  updateTime?: string;
}

/**
 * 设备查询参数
 */
export interface DeviceQueryParams {
  page?: number;
  count?: number;
  query?: string;
  status?: boolean | null;
  online?: boolean | null;
}

/**
 * 设备统计信息
 */
export interface DeviceStats {
  total: number;
  online: number;
  offline: number;
  channels: number;
}

/**
 * 设备管理服务类
 */
export class DeviceService {
  private readonly basePath = "/api/v1/devices";

  /**
   * 获取国标设备列表
   */
  async getGBDeviceList(params: DeviceQueryParams = {}): Promise<PaginatedResponse<GBDevice>> {
    const response = await axiosInstance.get<unknown, PaginatedResponse<GBDevice>>(
      `${this.basePath}/gb`,
      { params },
    );
    return response;
  }

  /**
   * 获取设备详情
   */
  async getDeviceDetail(deviceId: string): Promise<ApiResponse<GBDevice>> {
    if (!deviceId) {
      return Promise.reject(new Error("缺少设备 ID"));
    }

    const response = await axiosInstance.get<unknown, ApiResponse<GBDevice>>(
      `${this.basePath}/gb/${deviceId}`,
    );
    return response;
  }

  /**
   * 创建设备
   */
  async createDevice(deviceData: Partial<GBDevice>): Promise<ApiResponse<GBDevice>> {
    if (!deviceData.name) {
      return Promise.reject(new Error("设备名称不能为空"));
    }

    const response = await axiosInstance.post<unknown, ApiResponse<GBDevice>>(
      `${this.basePath}/gb`,
      deviceData,
    );
    return response;
  }

  /**
   * 更新设备
   */
  async updateDevice(
    deviceId: string,
    deviceData: Partial<GBDevice>,
  ): Promise<ApiResponse<GBDevice>> {
    if (!deviceId) {
      return Promise.reject(new Error("缺少设备 ID"));
    }

    const response = await axiosInstance.put<unknown, ApiResponse<GBDevice>>(
      `${this.basePath}/gb/${deviceId}`,
      deviceData,
    );
    return response;
  }

  /**
   * 删除设备
   */
  async deleteDevice(deviceId: string): Promise<ApiResponse<void>> {
    if (!deviceId) {
      return Promise.reject(new Error("缺少设备 ID"));
    }

    const response = await axiosInstance.delete<any, ApiResponse<void>>(
      `${this.basePath}/gb/${deviceId}`,
    );
    return response;
  }

  /**
   * 获取设备统计信息
   */
  async getDeviceStats(): Promise<ApiResponse<DeviceStats>> {
    const response = await axiosInstance.get<unknown, ApiResponse<DeviceStats>>(
      `${this.basePath}/summary`,
    );
    return response;
  }

  /**
   * 同步设备通道
   */
  async syncDeviceChannels(deviceId: string): Promise<ApiResponse<{ message: string }>> {
    if (!deviceId) {
      return Promise.reject(new Error("缺少设备 ID"));
    }

    const response = await axiosInstance.post<unknown, ApiResponse<{ message: string }>>(
      `${this.basePath}/gb/${deviceId}/sync`,
    );
    return response;
  }

  /**
   * 获取设备通道列表
   */
  async getDeviceChannels(
    deviceId: string,
    params?: { page?: number; count?: number },
  ): Promise<PaginatedResponse<any>> {
    if (!deviceId) {
      return Promise.reject(new Error("缺少设备 ID"));
    }

    const response = await axiosInstance.get<unknown, PaginatedResponse<any>>(
      `${this.basePath}/gb/${deviceId}/channels`,
      { params },
    );
    return response;
  }
}

// 导出单例
export const deviceService = new DeviceService();

export default deviceService;
