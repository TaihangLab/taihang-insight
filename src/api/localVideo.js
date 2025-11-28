import request from '@/utils/request'
import apiConfig from '../config/api.js'

/**
 * 获取本地视频列表
 * @param {Object} params - 查询参数
 * @param {number} params.skip - 跳过数量
 * @param {number} params.limit - 限制数量
 * @param {string} params.name - 视频名称（可选）
 * @param {boolean} params.is_streaming - 推流状态（可选）
 * @returns {Promise}
 */
export function getLocalVideoList(params) {
  return request({
    url: '/api/v1/local-videos/list',
    method: 'get',
    params: params,
    baseURL: apiConfig.API_BASE_URL
  })
}

/**
 * 上传本地视频
 * @param {FormData} formData - 包含文件和其他参数的FormData对象
 * @param {Function} onUploadProgress - 上传进度回调函数
 * @returns {Promise}
 */
export function uploadLocalVideo(formData, onUploadProgress) {
  return request({
    url: '/api/v1/local-videos/upload',
    method: 'post',
    data: formData,
    baseURL: apiConfig.API_BASE_URL,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 300000, // 5分钟超时，适用于大文件上传
    onUploadProgress: onUploadProgress
  })
}

/**
 * 更新本地视频信息
 * @param {number} videoId - 视频ID
 * @param {Object} data - 更新数据
 * @param {string} data.name - 视频名称
 * @param {string} data.description - 视频描述
 * @param {number} data.stream_fps - 推流帧率
 * @returns {Promise}
 */
export function updateLocalVideo(videoId, data) {
  return request({
    url: `/api/v1/local-videos/${videoId}`,
    method: 'put',
    data: data,
    baseURL: apiConfig.API_BASE_URL
  })
}

/**
 * 删除本地视频
 * @param {number} videoId - 视频ID
 * @returns {Promise}
 */
export function deleteLocalVideo(videoId) {
  return request({
    url: `/api/v1/local-videos/${videoId}`,
    method: 'delete',
    baseURL: apiConfig.API_BASE_URL
  })
}

/**
 * 开始推流
 * @param {number} videoId - 视频ID
 * @param {Object} data - 推流配置
 * @param {string} data.stream_id - 推流ID（可选）
 * @param {number} data.stream_fps - 推流帧率（可选）
 * @returns {Promise}
 */
export function startVideoStream(videoId, data) {
  return request({
    url: `/api/v1/local-videos/${videoId}/start-stream`,
    method: 'post',
    data: data,
    baseURL: apiConfig.API_BASE_URL
  })
}

/**
 * 停止推流
 * @param {number} videoId - 视频ID
 * @returns {Promise}
 */
export function stopVideoStream(videoId) {
  return request({
    url: `/api/v1/local-videos/${videoId}/stop-stream`,
    method: 'post',
    baseURL: apiConfig.API_BASE_URL
  })
}

/**
 * 获取推流状态
 * @param {number} videoId - 视频ID
 * @returns {Promise}
 */
export function getVideoStreamStatus(videoId) {
  return request({
    url: `/api/v1/local-videos/${videoId}/stream-status`,
    method: 'get',
    baseURL: apiConfig.API_BASE_URL
  })
}

