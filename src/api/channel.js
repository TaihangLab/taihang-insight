/**
 * 通道管理相关API
 */
import request from '@/utils/request'

/**
 * 获取通道详情
 * @param {number} id - 通道ID
 */
export function getChannelInfo(id) {
  return request({
    url: '/api/common/channel/one',
    method: 'get',
    params: { id }
  })
}

/**
 * 添加通道
 * @param {Object} data - 通道数据
 */
export function addChannel(data) {
  return request({
    url: '/api/common/channel/add',
    method: 'post',
    data: data
  })
}

/**
 * 更新通道
 * @param {Object} data - 通道数据
 */
export function updateChannel(data) {
  return request({
    url: '/api/common/channel/update',
    method: 'post',
    data: data
  })
}

/**
 * 重置通道
 * @param {number} id - 通道ID
 */
export function resetChannel(id) {
  return request({
    url: '/api/common/channel/reset',
    method: 'post',
    params: { id }
  })
}

/**
 * 删除通道
 * @param {number} id - 通道ID
 */
export function deleteChannel(id) {
  return request({
    url: '/api/common/channel/delete',
    method: 'post',
    params: { id }
  })
}

/**
 * 获取设备通道列表
 * @param {string} deviceId - 设备ID
 * @param {Object} params - 查询参数
 */
export function getDeviceChannels(deviceId, params) {
  return request({
    url: `/api/device/query/devices/${deviceId}/channels`,
    method: 'get',
    params: params
  })
}

/**
 * 获取子通道列表
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID
 * @param {Object} params - 查询参数
 */
export function getSubChannels(deviceId, channelId, params) {
  return request({
    url: `/api/device/query/sub_channels/${deviceId}/${channelId}/channels`,
    method: 'get',
    params: params
  })
}

/**
 * 获取通道原始数据
 * @param {number} id - 通道ID
 */
export function getChannelRawData(id) {
  return request({
    url: '/api/device/query/channel/raw',
    method: 'get',
    params: { id }
  })
}

/**
 * 获取通道播放地址
 * @param {number} channelId - 通道ID
 */
export function getChannelPlayUrl(channelId) {
  return request({
    url: '/api/common/channel/play',
    method: 'get',
    params: { channelId }
  })
}

/**
 * 停止通道播放
 * @param {number} channelId - 通道ID
 */
export function stopChannelPlay(channelId) {
  return request({
    url: '/api/common/channel/stop',
    method: 'get',
    params: { channelId }
  })
}

/**
 * 获取通道列表
 * @param {Object} params - 查询参数
 */
export function getChannelList(params) {
  return request({
    url: '/api/common/channel/list',
    method: 'get',
    params: params
  })
}

/**
 * 获取通道截图
 * @param {number} channelId - 通道ID
 */
export function getChannelSnap(channelId) {
  return request({
    url: '/api/common/channel/snap/stream',
    method: 'get',
    params: { channelId },
    responseType: 'blob',
    timeout: 15000
  })
}

