/**
 * 用户管理 API（对接 smart_engine /api/v1/system/user/*）
 */
import request from '@/utils/request'

export function listUsers (params) {
  return request({ url: '/system/user/list', method: 'get', params })
}

export function getUser (userId) {
  return request({ url: `/system/user/${userId}`, method: 'get' })
}

export function addUser (data) {
  return request({ url: '/system/user', method: 'post', data })
}

export function updateUser (userId, data) {
  return request({ url: `/system/user/${userId}`, method: 'put', data })
}

export function deleteUser (userId) {
  return request({ url: `/system/user/${userId}`, method: 'delete' })
}

export function resetUserPassword (userId, password) {
  return request({
    url: `/system/user/${userId}/resetPwd`,
    method: 'put',
    data: { password }
  })
}
