/**
 * 播放和语音对讲相关API
 */
import request from '@/utils/request'

/**
 * 启动播放
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID
 */
export function startPlay(deviceId, channelId) {
  return request({
    url: `/api/play/start/${deviceId}/${channelId}`,
    method: 'get'
  })
}

/**
 * 停止播放
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID
 */
export function stopPlay(deviceId, channelId) {
  return request({
    url: `/api/play/stop/${deviceId}/${channelId}`,
    method: 'get'
  })
}

/**
 * 启动语音对讲
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID
 * @param {Object} params - 参数
 * @param {number} params.timeout - 超时时间
 * @param {boolean} params.broadcastMode - 是否为喊话模式
 */
export function startBroadcast(deviceId, channelId, params) {
  return request({
    url: `/api/play/broadcast/${deviceId}/${channelId}`,
    method: 'get',
    params: params
  })
}

/**
 * 停止语音对讲
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID
 */
export function stopBroadcast(deviceId, channelId) {
  return request({
    url: `/api/play/broadcast/stop/${deviceId}/${channelId}`,
    method: 'get'
  })
}


