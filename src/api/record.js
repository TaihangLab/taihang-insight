/**
 * 录像管理相关API
 */
import request from '@/utils/request'

/**
 * 获取设备录像列表
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID
 * @param {Object} params - 查询参数
 */
export function getRecordList(deviceId, channelId, params) {
  return request({
    url: `/prod-api/smart-engine/api/v1/record/list/${deviceId}/${channelId}`,
    method: 'get',
    params: params
  })
}

/**
 * 下载录像
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID
 * @param {Object} params - 下载参数
 */
export function downloadRecord(deviceId, channelId, params) {
  return request({
    url: `/prod-api/smart-engine/api/v1/record/download/${deviceId}/${channelId}`,
    method: 'get',
    params: params
  })
}

/**
 * 获取云端录像列表
 * @param {Object} params - 查询参数
 */
export function getCloudRecordList(params) {
  return request({
    url: '/prod-api/smart-engine/api/v1/cloudRecord/list',
    method: 'get',
    params: params
  })
}

/**
 * 删除云端录像
 * @param {string} id - 录像ID
 */
export function deleteCloudRecord(id) {
  return request({
    url: `/prod-api/smart-engine/api/v1/cloudRecord/delete/${id}`,
    method: 'delete'
  })
}

/**
 * 获取录像下载进度
 * @param {string} downloadId - 下载ID
 */
export function getDownloadProgress(downloadId) {
  return request({
    url: `/prod-api/smart-engine/api/v1/record/download/progress/${downloadId}`,
    method: 'get'
  })
}

