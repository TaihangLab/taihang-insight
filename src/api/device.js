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
    url: '/api/device/query/devices',
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
    url: `/api/device/query/devices/${deviceId}`,
    method: 'get'
  })
}

/**
 * 添加设备
 * @param {Object} data - 设备数据
 */
export function addDevice(data) {
  return request({
    url: '/api/device/add',
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
    url: '/api/device/update',
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
    url: `/api/device/delete/${deviceId}`,
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
    url: `/api/device/query/tree/${deviceId}`,
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
    url: `/api/device/query/devices/${deviceId}/sync`,
    method: 'post'
  })
}

/**
 * 刷新设备状态
 * @param {string} deviceId - 设备ID
 */
export function refreshDevice(deviceId) {
  return request({
    url: `/api/device/query/devices/${deviceId}/status`,
    method: 'get'
  })
}

