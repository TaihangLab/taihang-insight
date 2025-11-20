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
    url: '/api/server/media_server/list',
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
    url: `/api/server/media_server/one/${id}`,
    method: 'get'
  })
}

/**
 * 添加流媒体服务器
 * @param {Object} data - 服务器数据
 */
export function addMediaServer(data) {
  return request({
    url: '/api/server/media_server/add',
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
    url: '/api/server/media_server/update',
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
    url: `/api/server/media_server/delete/${id}`,
    method: 'delete'
  })
}

/**
 * 测试流媒体服务器连接
 * @param {string} id - 服务器ID
 */
export function testMediaServer(id) {
  return request({
    url: `/api/server/media_server/test/${id}`,
    method: 'get'
  })
}

/**
 * 获取在线流媒体服务器
 */
export function getOnlineMediaServers() {
  return request({
    url: '/api/server/media_server/online',
    method: 'get'
  })
}

