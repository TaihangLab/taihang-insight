/**
 * 流媒体服务器相关API
 */
import request from '@/utils/request'

/**
 * 获取流媒体服务器列表
 * @param {Object} params - 查询参数
 */
export function getMediaServerList(params) {
  return request({
    url: '/api/v1/server/media_server/list',
    method: 'get',
    params: params
  })
}

/**
 * 获取流媒体服务器详情
 * @param {string} id - 服务器ID
 */
export function getMediaServerInfo(id) {
  return request({
    url: `/api/v1/server/media_server/one/${id}`,
    method: 'get'
  })
}

/**
 * 添加流媒体服务器
 * @param {Object} data - 服务器数据
 */
export function addMediaServer(data) {
  return request({
    url: '/api/v1/server/media_server/add',
    method: 'post',
    data: data
  })
}

/**
 * 更新流媒体服务器
 * @param {Object} data - 服务器数据
 */
export function updateMediaServer(data) {
  return request({
    url: '/api/v1/server/media_server/update',
    method: 'post',
    data: data
  })
}

/**
 * 删除流媒体服务器
 * @param {string} id - 服务器ID
 */
export function deleteMediaServer(id) {
  return request({
    url: `/api/v1/server/media_server/delete/${id}`,
    method: 'delete'
  })
}

/**
 * 测试流媒体服务器连接
 * @param {string} id - 服务器ID
 */
export function testMediaServer(id) {
  return request({
    url: `/api/v1/server/media_server/test/${id}`,
    method: 'get'
  })
}

/**
 * 获取在线流媒体服务器
 */
export function getOnlineMediaServers() {
  return request({
    url: '/api/v1/server/media_server/online',
    method: 'get'
  })
}

/**
 * 获取在线流媒体服务器列表
 */
export function getOnlineMediaServerList() {
  return request({
    url: '/api/v1/server/media_server/online/list',
    method: 'get'
  })
}

/**
 * 检查流媒体服务器连接
 * @param {Object} params - 服务器参数
 */
export function checkMediaServer(params) {
  return request({
    url: '/api/v1/server/media_server/check',
    method: 'get',
    params: {
      ip: params.ip,
      port: params.httpPort,
      secret: params.secret,
      type: params.type
    }
  })
}

/**
 * 检查录像服务器连接
 * @param {Object} params - 服务器参数
 */
export function checkRecordServer(params) {
  return request({
    url: '/api/v1/server/media_server/record/check',
    method: 'get',
    params: {
      ip: params.ip,
      port: params.recordAssistPort
    }
  })
}

/**
 * 保存流媒体服务器（添加或更新）
 * @param {Object} data - 服务器数据
 */
export function saveMediaServer(data) {
  return request({
    url: '/api/v1/server/media_server/save',
    method: 'post',
    data: data
  })
}

/**
 * 删除流媒体服务器（通过params）
 * @param {string} id - 服务器ID
 */
export function deleteMediaServerByParams(id) {
  return request({
    url: '/api/v1/server/media_server/delete',
    method: 'delete',
    params: { id }
  })
}

/**
 * 获取媒体流信息
 * @param {Object} params - 查询参数
 * @param {string} params.app - 应用名
 * @param {string} params.stream - 流ID
 * @param {string} params.mediaServerId - 流媒体服务器ID
 */
export function getMediaInfo(params) {
  return request({
    url: '/api/v1/server/media_server/media_info',
    method: 'get',
    params: params
  })
}

