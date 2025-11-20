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
    url: '/api/push/list',
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
    url: '/api/push/add',
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
    url: '/api/push/update',
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
    url: '/api/push/delete',
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
    url: '/api/proxy/list',
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
    url: '/api/proxy/save',
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
    url: '/api/proxy/save',
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
    url: '/api/proxy/del',
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
    url: '/api/proxy/start',
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
    url: '/api/proxy/stop',
    method: 'get',
    params: { app, stream }
  })
}

