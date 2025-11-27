/**
 * 用户管理相关API
 */
import request from '@/utils/request'

/**
 * 用户登录
 * @param {Object} data - 登录数据
 */
export function login(data) {
  return request({
    url: '/prod-api/smart-engine/api/v1/user/login',
    method: 'post',
    data: data
  })
}

/**
 * 用户登出
 */
export function logout() {
  return request({
    url: '/prod-api/smart-engine/api/v1/user/static/logout',
    method: 'post'
  })
}

/**
 * 获取用户信息
 */
export function getUserInfo() {
  return request({
    url: '/prod-api/smart-engine/api/v1/user/info',
    method: 'get'
  })
}

/**
 * 获取用户列表
 * @param {Object} params - 查询参数
 */
export function getUserList(params) {
  return request({
    url: '/prod-api/smart-engine/api/v1/user/list',
    method: 'get',
    params: params
  })
}

/**
 * 添加用户
 * @param {Object} data - 用户数据
 */
export function addUser(data) {
  return request({
    url: '/prod-api/smart-engine/api/v1/user/add',
    method: 'post',
    data: data
  })
}

/**
 * 更新用户
 * @param {Object} data - 用户数据
 */
export function updateUser(data) {
  return request({
    url: '/prod-api/smart-engine/api/v1/user/update',
    method: 'post',
    data: data
  })
}

/**
 * 删除用户
 * @param {number} id - 用户ID
 */
export function deleteUser(id) {
  return request({
    url: `/prod-api/smart-engine/api/v1/user/delete/${id}`,
    method: 'delete'
  })
}

/**
 * 修改密码
 * @param {Object} data - 密码数据
 */
export function changePassword(data) {
  return request({
    url: '/prod-api/smart-engine/api/v1/user/password/change',
    method: 'post',
    data: data
  })
}

/**
 * 重置密码
 * @param {number} userId - 用户ID
 */
export function resetPassword(userId) {
  return request({
    url: `/prod-api/smart-engine/api/v1/user/password/reset/${userId}`,
    method: 'post'
  })
}

/**
 * 获取用户详细信息（包含推流密钥）
 */
export function getUserDetailInfo() {
  return request({
    url: '/prod-api/smart-engine/api/v1/user/userInfo',
    method: 'post'
  })
}

