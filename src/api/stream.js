/**
 * 流管理相关API
 */
import request from '@/utils/request'

/**
 * 获取推流列表
 * @param {Object} params - 查询参数
 */
export function getPushStreamList(params) {
  return request({
    url: '/prod-api/smart-engine/api/v1/push/list',
    method: 'get',
    params: params
  })
}

/**
 * 添加推流
 * @param {Object} data - 推流数据
 */
export function addPushStream(data) {
  return request({
    url: '/prod-api/smart-engine/api/v1/push/add',
    method: 'post',
    data: data
  })
}

/**
 * 更新推流
 * @param {Object} data - 推流数据
 */
export function updatePushStream(data) {
  return request({
    url: '/prod-api/smart-engine/api/v1/push/update',
    method: 'post',
    data: data
  })
}

/**
 * 删除推流
 * @param {string} app - 应用名
 * @param {string} stream - 流ID
 */
export function deletePushStream(app, stream) {
  return request({
    url: '/prod-api/smart-engine/api/v1/push/delete',
    method: 'delete',
    params: { app, stream }
  })
}

/**
 * 获取拉流代理列表
 * @param {Object} params - 查询参数
 */
export function getStreamProxyList(params) {
  return request({
    url: '/prod-api/smart-engine/api/v1/proxy/list',
    method: 'get',
    params: params
  })
}

/**
 * 添加拉流代理
 * @param {Object} data - 代理数据
 */
export function addStreamProxy(data) {
  return request({
    url: '/prod-api/smart-engine/api/v1/proxy/save',
    method: 'post',
    data: data
  })
}

/**
 * 更新拉流代理
 * @param {Object} data - 代理数据
 */
export function updateStreamProxy(data) {
  return request({
    url: '/prod-api/smart-engine/api/v1/proxy/save',
    method: 'post',
    data: data
  })
}

/**
 * 删除拉流代理
 * @param {string} app - 应用名
 * @param {string} stream - 流ID
 */
export function deleteStreamProxy(app, stream) {
  return request({
    url: '/prod-api/smart-engine/api/v1/proxy/del',
    method: 'delete',
    params: { app, stream }
  })
}

/**
 * 启用拉流代理
 * @param {string} app - 应用名
 * @param {string} stream - 流ID
 */
export function enableStreamProxy(app, stream) {
  return request({
    url: '/prod-api/smart-engine/api/v1/proxy/start',
    method: 'get',
    params: { app, stream }
  })
}

/**
 * 停用拉流代理
 * @param {string} app - 应用名
 * @param {string} stream - 流ID
 */
export function disableStreamProxy(app, stream) {
  return request({
    url: '/prod-api/smart-engine/api/v1/proxy/stop',
    method: 'get',
    params: { app, stream }
  })
}

/**
 * 启动推流
 * @param {number} id - 推流ID
 * @returns {Promise}
 */
export function startPushStream(id) {
  return request({
    url: '/prod-api/smart-engine/api/v1/push/start',
    method: 'get',
    params: { id }
  })
}

/**
 * 停止推流
 * @param {number} id - 推流ID
 * @returns {Promise}
 */
export function stopPushStream(id) {
  return request({
    url: '/prod-api/smart-engine/api/v1/push/stop',
    method: 'get',
    params: { id }
  })
}

/**
 * 删除推流（通过ID）
 * @param {number} id - 推流ID
 * @param {string} mediaServerId - 流媒体服务器ID
 * @returns {Promise}
 */
export function removePushStream(id, mediaServerId) {
  return request({
    url: '/prod-api/smart-engine/api/v1/push/remove',
    method: 'delete',
    params: { id, mediaServerId }
  })
}

/**
 * 批量删除推流
 * @param {Array<number>} ids - 推流ID数组
 * @param {string} mediaServerId - 流媒体服务器ID
 * @returns {Promise}
 */
export function batchRemovePushStream(ids, mediaServerId) {
  return request({
    url: '/prod-api/smart-engine/api/v1/push/batchRemove',
    method: 'post',
    data: { ids, mediaServerId }
  })
}

/**
 * 删除拉流代理（通过ID）
 * @param {number} id - 代理ID
 * @param {string} mediaServerId - 流媒体服务器ID
 * @returns {Promise}
 */
export function deleteStreamProxyById(id, mediaServerId) {
  return request({
    url: '/prod-api/smart-engine/api/v1/proxy/delete',
    method: 'delete',
    params: { id, mediaServerId }
  })
}

/**
 * 批量删除拉流代理
 * @param {Array<number>} ids - 代理ID数组
 * @param {string} mediaServerId - 流媒体服务器ID
 * @returns {Promise}
 */
export function batchRemoveStreamProxy(ids, mediaServerId) {
  return request({
    url: '/prod-api/smart-engine/api/v1/proxy/batchRemove',
    method: 'post',
    data: { ids, mediaServerId }
  })
}

/**
 * 启动拉流代理（通过ID）
 * @param {number} id - 代理ID
 * @param {string} mediaServerId - 流媒体服务器ID
 * @returns {Promise}
 */
export function startStreamProxyById(id, mediaServerId) {
  return request({
    url: '/prod-api/smart-engine/api/v1/proxy/start',
    method: 'get',
    params: { id, mediaServerId }
  })
}

/**
 * 停止拉流代理（通过ID）
 * @param {number} id - 代理ID
 * @param {string} mediaServerId - 流媒体服务器ID
 * @returns {Promise}
 */
export function stopStreamProxyById(id, mediaServerId) {
  return request({
    url: '/prod-api/smart-engine/api/v1/proxy/stop',
    method: 'get',
    params: { id, mediaServerId }
  })
}


