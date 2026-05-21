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

export function getRoleUserIds (roleId) {
  return request({ url: `/system/role/${roleId}/userIds`, method: 'get' })
}

export function listRoleAllocatedUsers (roleId, params) {
  return request({ url: `/system/role/${roleId}/users/allocated`, method: 'get', params })
}

export function listRoleUnallocatedUsers (roleId, params) {
  return request({ url: `/system/role/${roleId}/users/unallocated`, method: 'get', params })
}

export function addRoleUsers (roleId, userIds) {
  return request({
    url: `/system/role/${roleId}/users/add`,
    method: 'post',
    data: { userIds }
  })
}

export function removeRoleUsers (roleId, userIds) {
  return request({
    url: `/system/role/${roleId}/users/remove`,
    method: 'post',
    data: { userIds }
  })
}

export function updateRoleUsers (roleId, userIds) {
  return request({
    url: `/system/role/${roleId}/users`,
    method: 'put',
    data: { userIds }
  })
}
