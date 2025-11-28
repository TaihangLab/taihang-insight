/**
 * 行政区域相关API
 */
import request from '@/utils/request'

/**
 * 获取行政区域列表
 * @param {Object} params - 查询参数
 */
export function getRegionList(params) {
  return request({
    url: '/api/v1/region/list',
    method: 'get',
    params: params
  })
}

/**
 * 获取行政区域树
 * @param {string} parentId - 父节点ID
 */
export function getRegionTree(parentId) {
  return request({
    url: '/api/v1/region/tree',
    method: 'get',
    params: { parentId }
  })
}

/**
 * 添加行政区域
 * @param {Object} data - 区域数据
 */
export function addRegion(data) {
  return request({
    url: '/api/v1/region/add',
    method: 'post',
    data: data
  })
}

/**
 * 更新行政区域
 * @param {Object} data - 区域数据
 */
export function updateRegion(data) {
  return request({
    url: '/api/v1/region/update',
    method: 'post',
    data: data
  })
}

/**
 * 删除行政区域
 * @param {string} id - 区域ID
 */
export function deleteRegion(id) {
  return request({
    url: '/api/v1/region/delete',
    method: 'delete',
    params: { id }
  })
}

/**
 * 获取行政区域树形列表
 * @param {Object} params - 查询参数
 * @param {string} params.query - 查询关键字
 * @param {string} params.parent - 父节点ID
 * @param {boolean} params.hasChannel - 是否包含通道
 */
export function getRegionTreeList(params) {
  return request({
    url: '/api/v1/region/tree/list',
    method: 'get',
    params: params
  })
}

/**
 * 添加设备到行政区域
 * @param {Object} data - 数据
 * @param {string} data.civilCode - 行政区划编码
 * @param {Array} data.deviceIds - 设备ID数组
 */
export function addDeviceToRegion(data) {
  return request({
    url: '/api/v1/common/channel/region/device/add',
    method: 'post',
    data: data
  })
}

/**
 * 从行政区域移除设备
 * @param {Object} data - 数据
 * @param {Array} data.deviceIds - 设备ID数组
 */
export function removeDeviceFromRegion(data) {
  return request({
    url: '/api/v1/common/channel/region/device/delete',
    method: 'post',
    data: data
  })
}

/**
 * 获取行政区域子列表
 * @param {Object} params - 查询参数
 * @param {string} params.parent - 父节点编码
 */
export function getRegionChildList(params) {
  return request({
    url: '/api/v1/region/base/child/list',
    method: 'get',
    params: params
  })
}

/**
 * 获取行政区划路径
 * @param {string} deviceId - 设备ID
 */
export function getRegionPath(deviceId) {
  return request({
    url: '/api/v1/region/path',
    method: 'get',
    params: { deviceId }
  })
}

