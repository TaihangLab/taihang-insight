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
    url: '/api/v1/wvp/api/common/channel/one',
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
    url: '/api/v1/wvp/api/common/channel/add',
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
    url: '/api/v1/wvp/api/common/channel/update',
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
    url: '/api/v1/wvp/api/common/channel/reset',
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
    url: '/api/v1/wvp/api/common/channel/delete',
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
    url: `/api/v1/wvp/api/device/query/devices/${deviceId}/channels`,
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
    url: `/api/v1/wvp/api/device/query/sub_channels/${deviceId}/${channelId}/channels`,
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
    url: '/api/v1/wvp/api/device/query/channel/raw',
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
    url: '/api/v1/wvp/api/common/channel/play',
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
    url: '/api/v1/wvp/api/common/channel/stop',
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
    url: '/api/v1/wvp/api/common/channel/list',
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
    url: '/api/v1/wvp/api/common/channel/snap/stream',
    method: 'get',
    params: { channelId },
    responseType: 'blob',
    timeout: 15000
  })
}

/**
 * 更新通道音频设置
 * @param {Object} params - 参数
 * @param {number} params.channelId - 通道ID
 * @param {boolean} params.audio - 是否开启音频
 */
export function updateChannelAudio(params) {
  return request({
    url: '/api/v1/wvp/api/device/query/channel/audio',
    method: 'post',
    params: params
  })
}

/**
 * 更新通道码流标识
 * @param {Object} params - 参数
 * @param {number} params.deviceDbId - 设备数据库ID
 * @param {number} params.id - 通道ID
 * @param {string} params.streamIdentification - 码流标识
 */
export function updateChannelStreamIdentification(params) {
  return request({
    url: '/api/v1/wvp/api/device/query/channel/stream/identification/update/',
    method: 'post',
    params: params
  })
}

/**
 * 获取行业编码列表
 */
export function getIndustryCodeList() {
  return request({
    url: '/api/v1/wvp/api/common/channel/industry/list',
    method: 'get'
  })
}

/**
 * 获取设备类型列表
 */
export function getDeviceTypeList() {
  return request({
    url: '/api/v1/wvp/api/common/channel/type/list',
    method: 'get'
  })
}

/**
 * 获取网络标识列表
 */
export function getNetworkIdentificationList() {
  return request({
    url: '/api/v1/wvp/api/common/channel/network/identification/list',
    method: 'get'
  })
}

/**
 * 获取行政区划通道列表
 * @param {Object} params - 查询参数
 */
export function getCivilCodeChannelList(params) {
  return request({
    url: '/api/v1/wvp/api/common/channel/civilcode/list',
    method: 'get',
    params: params
  })
}

/**
 * 获取业务分组通道列表
 * @param {Object} params - 查询参数
 */
export function getParentChannelList(params) {
  return request({
    url: '/api/v1/wvp/api/common/channel/parent/list',
    method: 'get',
    params: params
  })
}

/**
 * 添加通道到行政区划
 * @param {Object} data - 数据
 * @param {string} data.civilCode - 行政区划编码
 * @param {Array} data.channelIds - 通道ID数组
 */
export function addChannelToRegion(data) {
  return request({
    url: '/api/v1/wvp/api/common/channel/region/add',
    method: 'post',
    data: data
  })
}

/**
 * 从行政区划删除通道
 * @param {Object} data - 数据
 * @param {Array} data.channelIds - 通道ID数组
 */
export function deleteChannelFromRegion(data) {
  return request({
    url: '/api/v1/wvp/api/common/channel/region/delete',
    method: 'post',
    data: data
  })
}

/**
 * 添加通道到业务分组
 * @param {Object} data - 数据
 * @param {string} data.parentId - 父节点ID
 * @param {string} data.businessGroup - 业务分组
 * @param {Array} data.channelIds - 通道ID数组
 */
export function addChannelToGroup(data) {
  return request({
    url: '/api/v1/wvp/api/common/channel/group/add',
    method: 'post',
    data: data
  })
}

/**
 * 从业务分组删除通道
 * @param {Object} data - 数据
 * @param {Array} data.channelIds - 通道ID数组
 */
export function deleteChannelFromGroup(data) {
  return request({
    url: '/api/v1/wvp/api/common/channel/group/delete',
    method: 'post',
    data: data
  })
}

