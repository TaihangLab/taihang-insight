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
    url: '/api/region/list',
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
    url: '/api/region/tree',
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
    url: '/api/region/add',
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
    url: '/api/region/update',
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
    url: '/api/region/delete',
    method: 'post',
    params: { id }
  })
}

