/**
 * ONVIF相关API
 */
import request from '@/utils/request'

/**
 * 获取ONVIF RTSP地址
 * @param {Object} params - 参数
 * @param {string} params.hostname - 主机名
 * @param {number} params.timeout - 超时时间
 * @param {string} params.username - 用户名
 * @param {string} params.password - 密码
 */
export function getOnvifRtsp(params) {
  return request({
    url: '/api/v1/onvif/rtsp',
    method: 'get',
    params: params
  })
}


