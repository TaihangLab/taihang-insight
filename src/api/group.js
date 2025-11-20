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
    method: 'post',
    params: { id }
  })
}

