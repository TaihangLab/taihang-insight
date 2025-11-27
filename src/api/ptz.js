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
    url: `/prod-api/smart-engine/api/v1/ptz/control/${deviceId}/${channelId}`,
    method: 'get',
    params: params
  })
}

/**
 * 前端云台控制
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID
 * @param {Object} params - 控制参数
 * @param {string} params.command - 控制命令
 * @param {number} params.horizonSpeed - 水平速度
 * @param {number} params.verticalSpeed - 垂直速度
 * @param {number} params.zoomSpeed - 变倍速度
 */
export function frontEndPtzControl(deviceId, channelId, params) {
  return request({
    url: `/prod-api/smart-engine/api/v1/front-end/ptz/${deviceId}/${channelId}`,
    method: 'get',
    params: params
  })
}

/**
 * 光圈控制
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID
 * @param {Object} params - 控制参数
 * @param {string} params.command - 控制命令（in/out/stop）
 * @param {number} params.speed - 速度
 */
export function irisControl(deviceId, channelId, params) {
  return request({
    url: `/prod-api/smart-engine/api/v1/front-end/fi/iris/${deviceId}/${channelId}`,
    method: 'get',
    params: params
  })
}

/**
 * 聚焦控制
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID
 * @param {Object} params - 控制参数
 * @param {string} params.command - 控制命令（near/far/stop）
 * @param {number} params.speed - 速度
 */
export function focusControl(deviceId, channelId, params) {
  return request({
    url: `/prod-api/smart-engine/api/v1/front-end/fi/focus/${deviceId}/${channelId}`,
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
    url: `/prod-api/smart-engine/api/v1/ptz/preset/query/${deviceId}/${channelId}`,
    method: 'get'
  })
}

/**
 * 获取预置位列表（前端接口）
 * @param {string} deviceId - 设备ID
 * @param {string} channelDeviceId - 通道设备ID
 */
export function getFrontEndPresetList(deviceId, channelDeviceId) {
  return request({
    url: `/prod-api/smart-engine/api/v1/front-end/preset/query/${deviceId}/${channelDeviceId}`,
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
    url: `/prod-api/smart-engine/api/v1/ptz/preset/add/${deviceId}/${channelId}`,
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
    url: `/prod-api/smart-engine/api/v1/ptz/preset/del/${deviceId}/${channelId}/${presetId}`,
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
    url: `/prod-api/smart-engine/api/v1/ptz/preset/goto/${deviceId}/${channelId}/${presetId}`,
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
    url: `/prod-api/smart-engine/api/v1/ptz/cruise/query/${deviceId}/${channelId}`,
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
    url: `/prod-api/smart-engine/api/v1/ptz/cruise/add/${deviceId}/${channelId}`,
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
    url: `/prod-api/smart-engine/api/v1/ptz/cruise/del/${deviceId}/${channelId}/${cruiseId}`,
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
    url: `/prod-api/smart-engine/api/v1/ptz/cruise/start/${deviceId}/${channelId}/${cruiseId}`,
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
    url: `/prod-api/smart-engine/api/v1/ptz/cruise/stop/${deviceId}/${channelId}/${cruiseId}`,
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
    url: `/prod-api/smart-engine/api/v1/ptz/scan/query/${deviceId}/${channelId}`,
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
    url: `/prod-api/smart-engine/api/v1/ptz/scan/start/${deviceId}/${channelId}`,
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
    url: `/prod-api/smart-engine/api/v1/ptz/scan/stop/${deviceId}/${channelId}`,
    method: 'get'
  })
}

/**
 * 添加巡航点
 * @param {string} deviceId - 设备ID
 * @param {string} channelDeviceId - 通道设备ID
 * @param {Object} params - 参数
 * @param {number} params.cruiseId - 巡航组号
 * @param {number} params.presetId - 预置点ID
 */
export function addCruisePoint(deviceId, channelDeviceId, params) {
  return request({
    url: `/prod-api/smart-engine/api/v1/front-end/cruise/point/add/${deviceId}/${channelDeviceId}`,
    method: 'get',
    params: params
  })
}

/**
 * 删除巡航点
 * @param {string} deviceId - 设备ID
 * @param {string} channelDeviceId - 通道设备ID
 * @param {Object} params - 参数
 * @param {number} params.cruiseId - 巡航组号
 * @param {number} params.presetId - 预置点ID（0表示删除整个巡航组）
 */
export function deleteCruisePoint(deviceId, channelDeviceId, params) {
  return request({
    url: `/prod-api/smart-engine/api/v1/front-end/cruise/point/delete/${deviceId}/${channelDeviceId}`,
    method: 'get',
    params: params
  })
}

/**
 * 设置巡航速度
 * @param {string} deviceId - 设备ID
 * @param {string} channelDeviceId - 通道设备ID
 * @param {Object} params - 参数
 * @param {number} params.cruiseId - 巡航组号
 * @param {number} params.speed - 巡航速度（1-4095）
 */
export function setCruiseSpeed(deviceId, channelDeviceId, params) {
  return request({
    url: `/prod-api/smart-engine/api/v1/front-end/cruise/speed/${deviceId}/${channelDeviceId}`,
    method: 'get',
    params: params
  })
}

/**
 * 设置巡航时间
 * @param {string} deviceId - 设备ID
 * @param {string} channelDeviceId - 通道设备ID
 * @param {Object} params - 参数
 * @param {number} params.cruiseId - 巡航组号
 * @param {number} params.time - 巡航停留时间（秒）
 */
export function setCruiseTime(deviceId, channelDeviceId, params) {
  return request({
    url: `/prod-api/smart-engine/api/v1/front-end/cruise/time/${deviceId}/${channelDeviceId}`,
    method: 'get',
    params: params
  })
}

/**
 * 开始巡航（前端接口）
 * @param {string} deviceId - 设备ID
 * @param {string} channelDeviceId - 通道设备ID
 * @param {Object} params - 参数
 * @param {number} params.cruiseId - 巡航组号
 */
export function startFrontEndCruise(deviceId, channelDeviceId, params) {
  return request({
    url: `/prod-api/smart-engine/api/v1/front-end/cruise/start/${deviceId}/${channelDeviceId}`,
    method: 'get',
    params: params
  })
}

/**
 * 停止巡航（前端接口）
 * @param {string} deviceId - 设备ID
 * @param {string} channelDeviceId - 通道设备ID
 * @param {Object} params - 参数
 * @param {number} params.cruiseId - 巡航组号
 */
export function stopFrontEndCruise(deviceId, channelDeviceId, params) {
  return request({
    url: `/prod-api/smart-engine/api/v1/front-end/cruise/stop/${deviceId}/${channelDeviceId}`,
    method: 'get',
    params: params
  })
}

// ==================== 预置位操作（前端接口） ====================

/**
 * 添加预置位（前端接口）
 * @param {string} deviceId - 设备ID
 * @param {string} channelDeviceId - 通道设备ID
 * @param {Object} params - 参数
 * @param {number} params.presetId - 预置位编号（1-255）
 */
export function addFrontEndPreset(deviceId, channelDeviceId, params) {
  return request({
    url: `/prod-api/smart-engine/api/v1/front-end/preset/add/${deviceId}/${channelDeviceId}`,
    method: 'get',
    params: params
  })
}

/**
 * 调用预置位（前端接口）
 * @param {string} deviceId - 设备ID
 * @param {string} channelDeviceId - 通道设备ID
 * @param {Object} params - 参数
 * @param {number} params.presetId - 预置位ID
 */
export function callFrontEndPreset(deviceId, channelDeviceId, params) {
  return request({
    url: `/prod-api/smart-engine/api/v1/front-end/preset/call/${deviceId}/${channelDeviceId}`,
    method: 'get',
    params: params
  })
}

/**
 * 删除预置位（前端接口）
 * @param {string} deviceId - 设备ID
 * @param {string} channelDeviceId - 通道设备ID
 * @param {Object} params - 参数
 * @param {number} params.presetId - 预置位ID
 */
export function deleteFrontEndPreset(deviceId, channelDeviceId, params) {
  return request({
    url: `/prod-api/smart-engine/api/v1/front-end/preset/delete/${deviceId}/${channelDeviceId}`,
    method: 'get',
    params: params
  })
}

// ==================== 扫描操作（前端接口） ====================

/**
 * 设置扫描左边界
 * @param {string} deviceId - 设备ID
 * @param {string} channelDeviceId - 通道设备ID
 * @param {Object} params - 参数
 * @param {number} params.scanId - 扫描组号
 */
export function setScanLeft(deviceId, channelDeviceId, params) {
  return request({
    url: `/prod-api/smart-engine/api/v1/front-end/scan/set/left/${deviceId}/${channelDeviceId}`,
    method: 'get',
    params: params
  })
}

/**
 * 设置扫描右边界
 * @param {string} deviceId - 设备ID
 * @param {string} channelDeviceId - 通道设备ID
 * @param {Object} params - 参数
 * @param {number} params.scanId - 扫描组号
 */
export function setScanRight(deviceId, channelDeviceId, params) {
  return request({
    url: `/prod-api/smart-engine/api/v1/front-end/scan/set/right/${deviceId}/${channelDeviceId}`,
    method: 'get',
    params: params
  })
}

/**
 * 设置扫描速度
 * @param {string} deviceId - 设备ID
 * @param {string} channelDeviceId - 通道设备ID
 * @param {Object} params - 参数
 * @param {number} params.scanId - 扫描组号
 * @param {number} params.speed - 扫描速度（1-4095）
 */
export function setScanSpeed(deviceId, channelDeviceId, params) {
  return request({
    url: `/prod-api/smart-engine/api/v1/front-end/scan/set/speed/${deviceId}/${channelDeviceId}`,
    method: 'get',
    params: params
  })
}

/**
 * 开始自动扫描
 * @param {string} deviceId - 设备ID
 * @param {string} channelDeviceId - 通道设备ID
 * @param {Object} params - 参数
 * @param {number} params.scanId - 扫描组号
 */
export function startFrontEndScan(deviceId, channelDeviceId, params) {
  return request({
    url: `/prod-api/smart-engine/api/v1/front-end/scan/start/${deviceId}/${channelDeviceId}`,
    method: 'get',
    params: params
  })
}

/**
 * 停止自动扫描
 * @param {string} deviceId - 设备ID
 * @param {string} channelDeviceId - 通道设备ID
 * @param {Object} params - 参数
 * @param {number} params.scanId - 扫描组号
 */
export function stopFrontEndScan(deviceId, channelDeviceId, params) {
  return request({
    url: `/prod-api/smart-engine/api/v1/front-end/scan/stop/${deviceId}/${channelDeviceId}`,
    method: 'get',
    params: params
  })
}

// ==================== 雨刷控制 ====================

/**
 * 控制雨刷
 * @param {string} deviceId - 设备ID
 * @param {string} channelDeviceId - 通道设备ID
 * @param {Object} params - 参数
 * @param {string} params.command - 命令（on/off）
 */
export function controlWiper(deviceId, channelDeviceId, params) {
  return request({
    url: `/prod-api/smart-engine/api/v1/front-end/wiper/${deviceId}/${channelDeviceId}`,
    method: 'get',
    params: params
  })
}

// ==================== 辅助开关控制 ====================

/**
 * 控制辅助开关
 * @param {string} deviceId - 设备ID
 * @param {string} channelDeviceId - 通道设备ID
 * @param {Object} params - 参数
 * @param {string} params.command - 命令（on/off）
 * @param {number} params.switchId - 开关编号（2-255）
 */
export function controlAuxiliary(deviceId, channelDeviceId, params) {
  return request({
    url: `/prod-api/smart-engine/api/v1/front-end/auxiliary/${deviceId}/${channelDeviceId}`,
    method: 'get',
    params: params
  })
}

