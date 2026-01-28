/**
 * Dialog 组件相关 API
 * 该文件封装所有 dialog 组件中使用的接口请求
 */
import request from '@/utils/request'
import type { AxiosRequestConfig } from 'axios'

// ==================== 通用类型定义 ====================
interface ApiResponse<T = any> {
  code: number
  data: T
  msg?: string
  message?: string
}

// ==================== Onvif 相关 ====================
/**
 * ONVIF RTSP 请求参数
 */
interface OnvifRtspParams {
  hostname: string
  timeout: number
  username: string
  password: string
}

/**
 * 获取 ONVIF RTSP 地址
 */
export function getOnvifRtsp(params: OnvifRtspParams): Promise<ApiResponse> {
  return request({
    url: '/api/v1/onvif/rtsp',
    method: 'get',
    params: params
  })
}

// ==================== 轨迹查询相关 ====================
/**
 * 查询历史轨迹
 * @param deviceId - 设备ID
 * @param channelId - 通道ID (可选)
 * @param start - 开始时间
 * @param end - 结束时间
 */
export function getPositionHistory(
  deviceId: string,
  channelId: string | undefined,
  start: string,
  end: string
): Promise<ApiResponse> {
  let url = `/api/v1/position/history/${deviceId}?start=${start}&end=${end}`
  if (channelId) {
    url += `&channelId=${channelId}`
  }
  return request({
    url: url,
    method: 'get'
  })
}

// ==================== 设备管理相关 ====================
/**
 * 添加或更新设备
 * @param data - 设备数据
 * @param isUpdate - 是否为更新操作
 */
export function saveDevice(data: Record<string, any>, isUpdate = false): Promise<ApiResponse> {
  return request({
    url: `/api/v1/device/query/device/${isUpdate ? 'update' : 'add'}`,
    method: 'post',
    data: data
  })
}

// ==================== 国标编码相关 ====================
/**
 * 查询行政区划子列表
 * @param parent - 父级编码
 */
export function getRegionChildList(parent: string): Promise<ApiResponse> {
  return request({
    url: '/api/v1/region/base/child/list',
    method: 'get',
    params: { parent }
  })
}

/**
 * 查询行业编码列表
 */
export function getIndustryCodeList(): Promise<ApiResponse> {
  return request({
    url: '/api/v1/common/channel/industry/list',
    method: 'get'
  })
}

/**
 * 查询设备类型列表
 */
export function getDeviceTypeList(): Promise<ApiResponse> {
  return request({
    url: '/api/v1/common/channel/type/list',
    method: 'get'
  })
}

/**
 * 查询网络标识类型列表
 */
export function getNetworkIdentificationList(): Promise<ApiResponse> {
  return request({
    url: '/api/v1/common/channel/network/identification/list',
    method: 'get'
  })
}

// ==================== 目录/分组管理相关 ====================
/**
 * 添加或编辑目录
 * @param data - 目录数据
 * @param isEdit - 是否为编辑操作
 */
export function saveCatalog(data: Record<string, any>, isEdit = false): Promise<ApiResponse> {
  return request({
    url: `/api/v1/platform/catalog/${isEdit ? 'edit' : 'add'}`,
    method: 'post',
    data: data
  })
}

// ==================== 用户密码管理相关 ====================
/**
 * 修改当前用户密码
 * @param oldPassword - 旧密码 (MD5加密)
 * @param password - 新密码
 */
export function changePassword(oldPassword: string, password: string): Promise<ApiResponse> {
  return request({
    url: '/api/v1/user/changePassword',
    method: 'post',
    params: {
      oldPassword: oldPassword,
      password: password
    }
  })
}

/**
 * 管理员修改用户密码
 * @param password - 新密码
 * @param userId - 用户ID
 */
export function changePasswordForAdmin(password: string, userId: number): Promise<ApiResponse> {
  return request({
    url: '/api/v1/user/changePasswordForAdmin',
    method: 'post',
    params: {
      password: password,
      userId: userId
    }
  })
}

/**
 * 修改用户 PushKey
 * @param pushKey - 新的 PushKey
 * @param userId - 用户ID
 */
export function changePushKey(pushKey: string, userId: number): Promise<ApiResponse> {
  return request({
    url: '/api/v1/user/changePushKey',
    method: 'post',
    params: {
      pushKey: pushKey,
      userId: userId
    }
  })
}

// ==================== 录像下载相关 ====================
/**
 * 获取录像下载进度
 * @param deviceId - 设备ID
 * @param channelId - 通道ID
 * @param stream - 流标识
 */
export function getDownloadProgress(deviceId: string, channelId: string, stream: string): Promise<ApiResponse> {
  return request({
    url: `/api/v1/gb_record/download/progress/${deviceId}/${channelId}/${stream}`,
    method: 'get'
  })
}

/**
 * 停止录像下载
 * @param deviceId - 设备ID
 * @param channelId - 通道ID
 * @param stream - 流标识
 */
export function stopDownloadRecord(deviceId: string, channelId: string, stream: string): Promise<ApiResponse> {
  return request({
    url: `/api/v1/gb_record/download/stop/${deviceId}/${channelId}/${stream}`,
    method: 'get'
  })
}

// ==================== 设备通道列表相关 ====================
/**
 * 获取国标设备列表
 * @param params - 查询参数
 */
export function getGbDeviceList(params: Record<string, any>): Promise<ApiResponse> {
  return request({
    url: '/api/v1/device/query/devices',
    method: 'get',
    params: params
  })
}

/**
 * 获取国标通道列表（按行政区划）
 * @param params - 查询参数
 */
export function getChannelByCivilCode(params: Record<string, any>): Promise<ApiResponse> {
  return request({
    url: '/api/v1/common/channel/civilcode/list',
    method: 'get',
    params: params
  })
}

/**
 * 获取国标通道列表（按父节点）
 * @param params - 查询参数
 */
export function getChannelByParent(params: Record<string, any>): Promise<ApiResponse> {
  return request({
    url: '/api/v1/common/channel/parent/list',
    method: 'get',
    params: params
  })
}

// ==================== 平台共享相关 ====================
/**
 * 获取平台共享通道列表
 * @param params - 查询参数
 */
export function getPlatformChannelList(params: Record<string, any>): Promise<ApiResponse> {
  return request({
    url: '/api/v1/platform/channel/list',
    method: 'get',
    params: params
  })
}

/**
 * 添加平台共享通道
 * @param data - 通道数据
 */
export function addPlatformChannel(data: Record<string, any>): Promise<ApiResponse> {
  return request({
    url: '/api/v1/platform/channel/add',
    method: 'post',
    data: data
  })
}

/**
 * 按设备添加平台共享通道
 * @param data - 设备数据
 */
export function addPlatformChannelByDevice(data: Record<string, any>): Promise<ApiResponse> {
  return request({
    url: '/api/v1/platform/channel/device/add',
    method: 'post',
    data: data
  })
}

/**
 * 移除平台共享通道
 * @param data - 通道数据
 */
export function removePlatformChannel(data: Record<string, any>): Promise<ApiResponse> {
  return request({
    url: '/api/v1/platform/channel/remove',
    method: 'delete',
    data: data
  })
}

/**
 * 按设备移除平台共享通道
 * @param data - 设备数据
 */
export function removePlatformChannelByDevice(data: Record<string, any>): Promise<ApiResponse> {
  return request({
    url: '/api/v1/platform/channel/device/remove',
    method: 'post',
    data: data
  })
}

/**
 * 更新平台共享通道自定义信息
 * @param data - 通道数据
 */
export function updatePlatformChannelCustom(data: Record<string, any>): Promise<ApiResponse> {
  return request({
    url: '/api/v1/platform/channel/custom/update',
    method: 'post',
    data: data
  })
}

/**
 * 更新平台国标通道
 * @param data - 通道数据
 */
export function updatePlatformChannelForGb(data: Record<string, any>): Promise<ApiResponse> {
  return request({
    url: '/api/v1/platform/update_channel_for_gb',
    method: 'post',
    data: data
  })
}

// ==================== 录像计划关联相关 ====================
/**
 * 获取录像计划通道列表
 * @param params - 查询参数
 */
export function getRecordPlanChannelList(params: Record<string, any>): Promise<ApiResponse> {
  return request({
    url: '/api/v1/record/plan/channel/list',
    method: 'get',
    params: params
  })
}

/**
 * 关联/取消关联录像计划
 * @param data - 关联数据
 */
export function linkRecordPlan(data: Record<string, any>): Promise<ApiResponse> {
  return request({
    url: '/api/v1/record/plan/link',
    method: 'post',
    data: data
  })
}

// ==================== 异常通道相关 ====================
/**
 * 获取异常行政区划通道列表
 * @param params - 查询参数
 */
export function getUnusualCivilCodeChannelList(params: Record<string, any>): Promise<ApiResponse> {
  return request({
    url: '/api/v1/common/channel/civilCode/unusual/list',
    method: 'get',
    params: params
  })
}

/**
 * 清除异常行政区划通道
 * @param data - 通道数据
 */
export function clearUnusualCivilCodeChannel(data: Record<string, any>): Promise<ApiResponse> {
  return request({
    url: '/api/v1/common/channel/civilCode/unusual/clear',
    method: 'post',
    data: data
  })
}

/**
 * 获取行政区划描述
 * @param civilCode - 行政区划代码
 */
export function getRegionDescription(civilCode: string): Promise<ApiResponse> {
  return request({
    url: '/api/v1/region/description',
    method: 'get',
    params: { civilCode }
  })
}

/**
 * 按行政区划添加区域
 * @param civilCode - 行政区划代码
 */
export function addRegionByCivilCode(civilCode: string): Promise<ApiResponse> {
  return request({
    url: '/api/v1/region/addByCivilCode',
    method: 'get',
    params: { civilCode }
  })
}

/**
 * 获取异常分组通道列表
 * @param params - 查询参数
 */
export function getUnusualParentChannelList(params: Record<string, any>): Promise<ApiResponse> {
  return request({
    url: '/api/v1/common/channel/parent/unusual/list',
    method: 'get',
    params: params
  })
}

/**
 * 清除异常分组通道
 * @param data - 通道数据
 */
export function clearUnusualParentChannel(data: Record<string, any>): Promise<ApiResponse> {
  return request({
    url: '/api/v1/common/channel/parent/unusual/clear',
    method: 'post',
    data: data
  })
}

// ==================== 设备同步相关 ====================
/**
 * 获取设备同步状态
 * @param deviceId - 设备ID
 */
export function getDeviceSyncStatus(deviceId: string): Promise<ApiResponse> {
  return request({
    url: `/api/v1/device/query/${deviceId}/sync_status/`,
    method: 'get'
  })
}

// ==================== 播放相关 ====================
/**
 * 开始播放
 * @param deviceId - 设备ID
 * @param channelId - 通道ID
 */
export function startPlay(deviceId: string, channelId: string): Promise<ApiResponse> {
  return request({
    url: `/api/v1/play/start/${deviceId}/${channelId}`,
    method: 'get'
  })
}
