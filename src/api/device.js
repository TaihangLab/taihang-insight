/**
 * 设备管理相关API
 */
import request from '@/utils/request'

/**
 * 获取设备列表
 * @param {Object} params - 查询参数
 */
export function getDeviceList(params) {
  return request({
    url: '/api/v1/device/query/devices',
    method: 'get',
    params: params
  })
}

/**
 * 获取设备详情
 * @param {string} deviceId - 设备ID
 */
export function getDeviceInfo(deviceId) {
  return request({
    url: `/api/v1/device/query/devices/${deviceId}`,
    method: 'get'
  })
}

/**
 * 添加设备
 * @param {Object} data - 设备数据
 */
export function addDevice(data) {
  return request({
    url: '/api/v1/device/add',
    method: 'post',
    data: data
  })
}

/**
 * 更新设备
 * @param {Object} data - 设备数据
 */
export function updateDevice(data) {
  return request({
    url: '/api/v1/device/update',
    method: 'post',
    data: data
  })
}

/**
 * 删除设备
 * @param {string} deviceId - 设备ID
 */
export function deleteDevice(deviceId) {
  return request({
    url: `/api/v1/device/delete/${deviceId}`,
    method: 'delete'
  })
}

/**
 * 获取设备树形结构
 * @param {string} deviceId - 设备ID
 * @param {Object} params - 查询参数
 */
export function getDeviceTree(deviceId, params) {
  return request({
    url: `/api/v1/device/query/tree/${deviceId}`,
    method: 'get',
    params: params
  })
}

/**
 * 同步设备通道
 * @param {string} deviceId - 设备ID
 */
export function syncDeviceChannels(deviceId) {
  return request({
    url: `/api/v1/device/query/devices/${deviceId}/sync`,
    method: 'post'
  })
}

/**
 * 刷新设备状态
 * @param {string} deviceId - 设备ID
 */
export function refreshDevice(deviceId) {
  return request({
    url: `/api/v1/device/query/devices/${deviceId}/status`,
    method: 'get'
  })
}

/**
 * 订阅设备目录
 * @param {string} deviceId - 设备ID
 * @returns {Promise}
 */
export function subscribeCatalog(deviceId) {
  return request({
    url: '/api/v1/device/query/subscribe/catalog',
    method: 'get',
    params: { id: deviceId }
  })
}

/**
 * 订阅设备移动位置
 * @param {string} deviceId - 设备ID
 * @param {number} expires - 过期时间（秒）
 * @param {number} interval - 间隔时间（秒）
 * @returns {Promise}
 */
export function subscribeMobilePosition(deviceId, expires, interval) {
  return request({
    url: '/api/v1/device/query/subscribe/mobile-position',
    method: 'get',
    params: { 
      id: deviceId,
      expires: expires,
      interval: interval
    }
  })
}

/**
 * 订阅设备报警
 * @param {string} deviceId - 设备ID
 * @param {number} expires - 过期时间（秒）
 * @returns {Promise}
 */
export function subscribeAlarm(deviceId, expires) {
  return request({
    url: '/api/v1/device/query/subscribe/alarm',
    method: 'get',
    params: { 
      id: deviceId,
      expires: expires
    }
  })
}

/**
 * 添加国标设备
 * @param {Object} data - 设备数据
 */
export function addGBDevice(data) {
  return request({
    url: '/api/v1/device/query/devices/add',
    method: 'post',
    data: data
  })
}

/**
 * 编辑国标设备
 * @param {string} deviceId - 设备ID
 * @param {Object} data - 设备数据
 */
export function updateGBDevice(deviceId, data) {
  return request({
    url: `/api/v1/device/query/devices/${deviceId}/edit`,
    method: 'put',
    data: data
  })
}

/**
 * 录像控制
 * @param {Object} params - 控制参数
 * @param {string} params.deviceId - 设备ID
 * @param {string} params.channelId - 通道ID
 * @param {string} params.recordCmdStr - 录像命令（Record/StopRecord）
 */
export function controlRecord(params) {
  return request({
    url: '/api/v1/device/control/record',
    method: 'get',
    params: params
  })
}

/**
 * 获取设备快照
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID
 */
export function getDeviceSnap(deviceId, channelId) {
  return request({
    url: `/api/v1/device/query/snap/${deviceId}/${channelId}`,
    method: 'get',
    responseType: 'blob'
  })
}

