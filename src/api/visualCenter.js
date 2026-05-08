import request from '@/utils/request'
import axios from 'axios'

/**
 * 获取系统状态信息
 */
export function getSystemStatus() {
  return request({
    url: '/visual/system/status',
    method: 'get'
  })
}

/**
 * 获取预警趋势数据
 * @param {Object} params - 查询参数
 * @param {string} params.startTime - 开始时间
 * @param {string} params.endTime - 结束时间
 */
export function getWarningTrend(params) {
  return request({
    url: '/visual/warning/trend',
    method: 'get',
    params
  })
}

/**
 * 获取预警类型排名
 * @param {Object} params - 查询参数
 * @param {number} params.limit - 返回数量限制
 */
export function getWarningTypeRank(params) {
  return request({
    url: '/visual/warning/type-rank',
    method: 'get',
    params
  })
}

/**
 * 获取预警等级占比
 */
export function getWarningLevelRatio() {
  return request({
    url: '/visual/warning/level-ratio',
    method: 'get'
  })
}

/**
 * 获取组织预警Top排名
 * @param {Object} params - 查询参数
 * @param {number} params.limit - 返回数量限制，默认5
 */
export function getOrganizationWarningTop(params) {
  return request({
    url: '/visual/warning/organization-top',
    method: 'get',
    params
  })
}

/**
 * 获取预警处理情况统计
 * @param {Object} params - 查询参数
 * @param {string} params.timeRange - 时间范围: day/week/month
 */
export function getWarningHandleStatus(params) {
  return request({
    url: '/visual/warning/handle-status',
    method: 'get',
    params
  })
}

/**
 * 获取预警记录列表
 * @param {Object} params - 查询参数
 * @param {number} params.pageNum - 当前页码
 * @param {number} params.pageSize - 每页大小
 * @param {string} params.status - 处理状态筛选
 */
export function getWarningRecordList(params) {
  return request({
    url: '/visual/warning/record-list',
    method: 'get',
    params
  })
}

/**
 * 获取设备预警数量Top排名
 * @param {Object} params - 查询参数
 * @param {string} params.timeRange - 时间范围: day/week/month
 * @param {number} params.limit - 返回数量限制，默认10
 */
export function getDeviceWarningTop(params) {
  return request({
    url: '/visual/device/warning-top',
    method: 'get',
    params
  })
}

/**
 * 获取预警图片列表
 * @param {Object} params - 查询参数
 * @param {number} params.limit - 返回数量限制
 */
export function getWarningImageList(params) {
  return request({
    url: '/visual/warning/image-list',
    method: 'get',
    params
  })
}

/**
 * 获取预警详情
 * @param {string} id - 预警ID
 */
export function getWarningDetail(id) {
  return request({
    url: `/visual/warning/${id}`,
    method: 'get'
  })
}

/**
 * 获取天气信息
 * @param {Object} params - 查询参数
 * @param {number} params.latitude - 纬度
 * @param {number} params.longitude - 经度
 * @param {string} params.apiKey - API密钥
 */
export function getWeatherInfo(params) {
  // 使用外部API，不经过request拦截器
  return axios.get('https://api.weatherapi.com/v1/current.json', {
    params: {
      key: params.apiKey,
      q: `${params.latitude},${params.longitude}`,
      lang: 'zh',
      aqi: 'yes'
    }
  })
}

/**
 * 获取地理位置信息
 * @param {Object} coords - 坐标信息
 * @param {number} coords.latitude - 纬度
 * @param {number} coords.longitude - 经度
 */
export function getLocationInfo(coords) {
  return request({
    url: '/visual/location/info',
    method: 'get',
    params: coords
  })
}

/**
 * 获取设备概览信息
 */
export function getDeviceOverview() {
  return request({
    url: '/visual/device/overview',
    method: 'get'
  })
}

