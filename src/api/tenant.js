/**
 * 租户与租户套餐管理 API（对接 smart_engine /api/v1/system/tenant/*）
 */
import request from '@/utils/request'

// ==================== 登录页公共接口 ====================
export function getLoginTenantList () {
  return request({
    url: '/auth/tenant/list',
    method: 'get'
  })
}

// ==================== 租户 CRUD ====================
export function listTenants (params) {
  return request({
    url: '/system/tenant/list',
    method: 'get',
    params
  })
}

export function getTenant (id) {
  return request({
    url: `/system/tenant/${id}`,
    method: 'get'
  })
}

export function addTenant (data) {
  return request({
    url: '/system/tenant',
    method: 'post',
    data
  })
}

export function updateTenant (data) {
  return request({
    url: '/system/tenant',
    method: 'put',
    data
  })
}

export function changeTenantStatus (id, statusValue) {
  return request({
    url: '/system/tenant/changeStatus',
    method: 'put',
    data: { id, status: statusValue }
  })
}

export function deleteTenants (ids) {
  return request({
    url: `/system/tenant/${ids}`,
    method: 'delete'
  })
}

// ==================== 动态切换租户（超管） ====================
export function switchTenant (tenantId) {
  return request({
    url: `/system/tenant/dynamic/${tenantId}`,
    method: 'get'
  })
}

export function clearDynamicTenant () {
  return request({
    url: '/system/tenant/dynamic/clear',
    method: 'get'
  })
}
