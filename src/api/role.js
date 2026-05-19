/**
 * 角色管理 API（对接 smart_engine /api/v1/system/role/*）
 */
import request from '@/utils/request'

export function listRoles (params) {
  return request({ url: '/system/role/list', method: 'get', params })
}

export function getRole (roleId) {
  return request({ url: `/system/role/${roleId}`, method: 'get' })
}

export function addRole (data) {
  return request({ url: '/system/role', method: 'post', data })
}

export function updateRole (roleId, data) {
  return request({ url: `/system/role/${roleId}`, method: 'put', data })
}

export function deleteRole (roleId) {
  return request({ url: `/system/role/${roleId}`, method: 'delete' })
}
