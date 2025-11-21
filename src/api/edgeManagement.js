import request from '@/api/request'

// ==================== 边缘盒子管理 ====================

/**
 * 获取边缘盒子列表
 * @param {Object} params - 查询参数
 * @param {number} params.pageNum - 当前页码
 * @param {number} params.pageSize - 每页大小
 * @param {string} params.keyword - 搜索关键字
 */
export function getEdgeBoxList(params) {
  return request({
    url: '/edge/box/list',
    method: 'get',
    params
  })
}

/**
 * 添加边缘盒子
 * @param {Object} data - 边缘盒子信息
 */
export function addEdgeBox(data) {
  return request({
    url: '/edge/box',
    method: 'post',
    data
  })
}

/**
 * 更新边缘盒子
 * @param {Object} data - 边缘盒子信息
 */
export function updateEdgeBox(data) {
  return request({
    url: '/edge/box',
    method: 'put',
    data
  })
}

/**
 * 删除边缘盒子
 * @param {string} id - 边缘盒子ID
 */
export function deleteEdgeBox(id) {
  return request({
    url: `/edge/box/${id}`,
    method: 'delete'
  })
}

/**
 * 批量删除边缘盒子
 * @param {Array} ids - 边缘盒子ID数组
 */
export function batchDeleteEdgeBox(ids) {
  return request({
    url: '/edge/box/batch',
    method: 'delete',
    data: { ids }
  })
}

/**
 * 绑定边缘服务器
 * @param {Object} data - 绑定信息
 * @param {string} data.boxId - 边缘盒子ID
 * @param {string} data.serverId - 服务器ID
 */
export function bindEdgeServer(data) {
  return request({
    url: '/edge/box/bind',
    method: 'post',
    data
  })
}

// ==================== 边缘服务器管理 ====================

/**
 * 获取边缘服务器列表
 * @param {Object} params - 查询参数
 * @param {number} params.pageNum - 当前页码
 * @param {number} params.pageSize - 每页大小
 * @param {string} params.keyword - 搜索关键字
 */
export function getEdgeServerList(params) {
  return request({
    url: '/edge/server/list',
    method: 'get',
    params
  })
}

/**
 * 注册边缘服务器
 * @param {Object} data - 边缘服务器信息
 */
export function registerEdgeServer(data) {
  return request({
    url: '/edge/server',
    method: 'post',
    data
  })
}

/**
 * 更新边缘服务器
 * @param {Object} data - 边缘服务器信息
 */
export function updateEdgeServer(data) {
  return request({
    url: '/edge/server',
    method: 'put',
    data
  })
}

/**
 * 删除边缘服务器
 * @param {string} id - 边缘服务器ID
 */
export function deleteEdgeServer(id) {
  return request({
    url: `/edge/server/${id}`,
    method: 'delete'
  })
}

/**
 * 获取服务器详情
 * @param {string} id - 边缘服务器ID
 */
export function getEdgeServerDetail(id) {
  return request({
    url: `/edge/server/${id}`,
    method: 'get'
  })
}

/**
 * 更新服务器授权组织
 * @param {Object} data - 授权信息
 * @param {string} data.serverId - 服务器ID
 * @param {Array} data.authorizedGroups - 授权组织列表
 */
export function updateServerAuthorization(data) {
  return request({
    url: '/edge/server/authorization',
    method: 'put',
    data
  })
}

/**
 * 获取可绑定的服务器列表
 */
export function getAvailableServerList() {
  return request({
    url: '/edge/server/available',
    method: 'get'
  })
}

