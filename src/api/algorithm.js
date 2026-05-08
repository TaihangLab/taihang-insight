import request from '@/utils/request'

/**
 * 获取资源统计信息
 */
export function getResourceStatistics() {
  return request({
    url: '/algorithm/resource/statistics',
    method: 'get'
  })
}

/**
 * 获取资源详情
 */
export function getResourceDetails() {
  return request({
    url: '/algorithm/resource/details',
    method: 'get'
  })
}

/**
 * 获取我的算法列表
 */
export function getMyAlgorithms() {
  return request({
    url: '/algorithm/my-list',
    method: 'get'
  })
}

/**
 * 获取算法详情
 * @param {string} id - 算法ID
 */
export function getAlgorithmDetail(id) {
  return request({
    url: `/algorithm/${id}`,
    method: 'get'
  })
}

/**
 * 获取实时事件列表
 * @param {Object} params - 查询参数
 */
export function getRealtimeEvents(params) {
  return request({
    url: '/algorithm/events/realtime',
    method: 'get',
    params
  })
}

/**
 * 获取报警统计数据
 * @param {Object} params - 查询参数
 * @param {string} params.startTime - 开始时间
 * @param {string} params.endTime - 结束时间
 */
export function getAlarmStatistics(params) {
  return request({
    url: '/algorithm/alarm/statistics',
    method: 'get',
    params
  })
}

/**
 * 获取设备统计信息
 */
export function getDeviceStatistics() {
  return request({
    url: '/algorithm/device/statistics',
    method: 'get'
  })
}

/**
 * 获取报警信息列表
 * @param {Object} params - 查询参数
 * @param {number} params.pageNum - 当前页码
 * @param {number} params.pageSize - 每页大小
 * @param {string} params.timeRange - 时间范围
 */
export function getAlarmInfoList(params) {
  return request({
    url: '/algorithm/alarm/list',
    method: 'get',
    params
  })
}

/**
 * 获取报警转发数据
 * @param {Object} params - 查询参数
 */
export function getAlarmForwardingData(params) {
  return request({
    url: '/algorithm/alarm/forwarding',
    method: 'get',
    params
  })
}

/**
 * 获取算法运行状态
 */
export function getAlgorithmRunStatus() {
  return request({
    url: '/algorithm/run-status',
    method: 'get'
  })
}

/**
 * 启动算法
 * @param {string} id - 算法ID
 */
export function startAlgorithm(id) {
  return request({
    url: `/algorithm/${id}/start`,
    method: 'post'
  })
}

/**
 * 停止算法
 * @param {string} id - 算法ID
 */
export function stopAlgorithm(id) {
  return request({
    url: `/algorithm/${id}/stop`,
    method: 'post'
  })
}

/**
 * 重启算法
 * @param {string} id - 算法ID
 */
export function restartAlgorithm(id) {
  return request({
    url: `/algorithm/${id}/restart`,
    method: 'post'
  })
}

