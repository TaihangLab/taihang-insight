/**
 * 业务分组相关API
 */
import request from '@/utils/request'

/**
 * 获取业务分组列表
 * @param {Object} params - 查询参数
 */
export function getGroupList(params) {
  return request({
    url: '/api/group/list',
    method: 'get',
    params: params
  })
}

/**
 * 获取业务分组树
 * @param {string} parentId - 父节点ID
 */
export function getGroupTree(parentId) {
  return request({
    url: '/api/group/tree',
    method: 'get',
    params: { parentId }
  })
}

/**
 * 添加业务分组
 * @param {Object} data - 分组数据
 */
export function addGroup(data) {
  return request({
    url: '/api/group/add',
    method: 'post',
    data: data
  })
}

/**
 * 更新业务分组
 * @param {Object} data - 分组数据
 */
export function updateGroup(data) {
  return request({
    url: '/api/group/update',
    method: 'post',
    data: data
  })
}

/**
 * 删除业务分组
 * @param {string} id - 分组ID
 */
export function deleteGroup(id) {
  return request({
    url: '/api/group/delete',
    method: 'delete',
    params: { id }
  })
}

/**
 * 获取业务分组树形列表
 * @param {Object} params - 查询参数
 * @param {string} params.query - 查询关键字
 * @param {string} params.parent - 父节点ID
 * @param {boolean} params.hasChannel - 是否包含通道
 */
export function getGroupTreeList(params) {
  return request({
    url: '/api/group/tree/list',
    method: 'get',
    params: params
  })
}

/**
 * 添加设备到业务分组
 * @param {Object} data - 数据
 * @param {string} data.parentId - 父节点ID
 * @param {string} data.businessGroup - 业务分组
 * @param {Array} data.deviceIds - 设备ID数组
 */
export function addDeviceToGroup(data) {
  return request({
    url: '/api/common/channel/group/device/add',
    method: 'post',
    data: data
  })
}

/**
 * 从业务分组移除设备
 * @param {Object} data - 数据
 * @param {Array} data.deviceIds - 设备ID数组
 */
export function removeDeviceFromGroup(data) {
  return request({
    url: '/api/common/channel/group/device/delete',
    method: 'post',
    data: data
  })
}

/**
 * 获取业务分组路径
 * @param {string} deviceId - 设备ID
 * @param {string} businessGroup - 业务分组
 */
export function getGroupPath(deviceId, businessGroup) {
  return request({
    url: '/api/group/path',
    method: 'get',
    params: { deviceId, businessGroup }
  })
}

