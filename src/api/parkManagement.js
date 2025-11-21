import request from '@/api/request'

/**
 * 获取设备树状图数据
 */
export function getDeviceTree() {
  return request({
    url: '/park/device/tree',
    method: 'get'
  })
}

/**
 * 获取CPU和内存使用率数据
 * @param {Object} params - 查询参数
 * @param {string} params.timeRange - 时间范围
 */
export function getCpuMemoryUsage(params) {
  return request({
    url: '/park/resource/cpu-memory',
    method: 'get',
    params
  })
}

/**
 * 获取存储使用情况
 */
export function getStorageUsage() {
  return request({
    url: '/park/resource/storage',
    method: 'get'
  })
}

/**
 * 获取实时画面列表
 * @param {Object} params - 查询参数
 * @param {number} params.pageNum - 当前页码
 * @param {number} params.pageSize - 每页大小
 */
export function getRealtimeVideoList(params) {
  return request({
    url: '/park/video/realtime-list',
    method: 'get',
    params
  })
}

/**
 * 获取预警抓拍列表
 * @param {Object} params - 查询参数
 * @param {number} params.pageNum - 当前页码
 * @param {number} params.pageSize - 每页大小
 * @param {string} params.category - 预警类别
 */
export function getAlertCaptureList(params) {
  return request({
    url: '/park/alert/capture-list',
    method: 'get',
    params
  })
}

/**
 * 获取预警抓拍详情
 * @param {string} id - 预警ID
 */
export function getAlertCaptureDetail(id) {
  return request({
    url: `/park/alert/capture/${id}`,
    method: 'get'
  })
}

/**
 * 获取设备状态统计
 */
export function getDeviceStatusStatistics() {
  return request({
    url: '/park/device/status-statistics',
    method: 'get'
  })
}

/**
 * 获取带宽使用情况
 * @param {Object} params - 查询参数
 * @param {string} params.timeRange - 时间范围
 */
export function getBandwidthUsage(params) {
  return request({
    url: '/park/network/bandwidth',
    method: 'get',
    params
  })
}

/**
 * 获取视频流地址
 * @param {string} deviceId - 设备ID
 */
export function getVideoStreamUrl(deviceId) {
  return request({
    url: `/park/video/stream/${deviceId}`,
    method: 'get'
  })
}

/**
 * 切换视频分屏模式
 * @param {Object} data - 分屏配置
 * @param {number} data.mode - 分屏模式：1/4/9/16
 */
export function switchScreenMode(data) {
  return request({
    url: '/park/video/screen-mode',
    method: 'post',
    data
  })
}

/**
 * 获取设备在线状态
 * @param {string} deviceId - 设备ID
 */
export function getDeviceOnlineStatus(deviceId) {
  return request({
    url: `/park/device/online-status/${deviceId}`,
    method: 'get'
  })
}

/**
 * 控制设备
 * @param {Object} data - 控制指令
 * @param {string} data.deviceId - 设备ID
 * @param {string} data.command - 控制指令
 * @param {Object} data.params - 指令参数
 */
export function controlDevice(data) {
  return request({
    url: '/park/device/control',
    method: 'post',
    data
  })
}

