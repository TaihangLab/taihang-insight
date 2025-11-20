/**
 * 云台控制相关API
 */
import request from '@/utils/request'

/**
 * 云台控制
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID
 * @param {Object} params - 控制参数
 */
export function ptzControl(deviceId, channelId, params) {
  return request({
    url: `/api/ptz/control/${deviceId}/${channelId}`,
    method: 'get',
    params: params
  })
}

/**
 * 获取预置位列表
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID
 */
export function getPresetList(deviceId, channelId) {
  return request({
    url: `/api/ptz/preset/query/${deviceId}/${channelId}`,
    method: 'get'
  })
}

/**
 * 添加预置位
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID
 * @param {Object} data - 预置位数据
 */
export function addPreset(deviceId, channelId, data) {
  return request({
    url: `/api/ptz/preset/add/${deviceId}/${channelId}`,
    method: 'post',
    data: data
  })
}

/**
 * 删除预置位
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID
 * @param {number} presetId - 预置位ID
 */
export function deletePreset(deviceId, channelId, presetId) {
  return request({
    url: `/api/ptz/preset/del/${deviceId}/${channelId}/${presetId}`,
    method: 'delete'
  })
}

/**
 * 调用预置位
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID
 * @param {number} presetId - 预置位ID
 */
export function callPreset(deviceId, channelId, presetId) {
  return request({
    url: `/api/ptz/preset/goto/${deviceId}/${channelId}/${presetId}`,
    method: 'get'
  })
}

/**
 * 获取巡航路线列表
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID
 */
export function getCruiseList(deviceId, channelId) {
  return request({
    url: `/api/ptz/cruise/query/${deviceId}/${channelId}`,
    method: 'get'
  })
}

/**
 * 添加巡航路线
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID
 * @param {Object} data - 巡航数据
 */
export function addCruise(deviceId, channelId, data) {
  return request({
    url: `/api/ptz/cruise/add/${deviceId}/${channelId}`,
    method: 'post',
    data: data
  })
}

/**
 * 删除巡航路线
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID
 * @param {number} cruiseId - 巡航ID
 */
export function deleteCruise(deviceId, channelId, cruiseId) {
  return request({
    url: `/api/ptz/cruise/del/${deviceId}/${channelId}/${cruiseId}`,
    method: 'delete'
  })
}

/**
 * 开始巡航
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID
 * @param {number} cruiseId - 巡航ID
 */
export function startCruise(deviceId, channelId, cruiseId) {
  return request({
    url: `/api/ptz/cruise/start/${deviceId}/${channelId}/${cruiseId}`,
    method: 'get'
  })
}

/**
 * 停止巡航
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID
 * @param {number} cruiseId - 巡航ID
 */
export function stopCruise(deviceId, channelId, cruiseId) {
  return request({
    url: `/api/ptz/cruise/stop/${deviceId}/${channelId}/${cruiseId}`,
    method: 'get'
  })
}

/**
 * 获取扫描配置
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID
 */
export function getScanConfig(deviceId, channelId) {
  return request({
    url: `/api/ptz/scan/query/${deviceId}/${channelId}`,
    method: 'get'
  })
}

/**
 * 开始扫描
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID
 */
export function startScan(deviceId, channelId) {
  return request({
    url: `/api/ptz/scan/start/${deviceId}/${channelId}`,
    method: 'get'
  })
}

/**
 * 停止扫描
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID
 */
export function stopScan(deviceId, channelId) {
  return request({
    url: `/api/ptz/scan/stop/${deviceId}/${channelId}`,
    method: 'get'
  })
}

