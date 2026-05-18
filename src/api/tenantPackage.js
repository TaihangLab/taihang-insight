/**
 * 租户套餐 API（对接 smart_engine /api/v1/system/tenant/package/*）
 */
import request from '@/utils/request'

export function listTenantPackages (params) {
  return request({
    url: '/system/tenant/package/list',
    method: 'get',
    params
  })
}

export function selectTenantPackages () {
  return request({
    url: '/system/tenant/package/selectList',
    method: 'get'
  })
}

export function getTenantPackage (packageId) {
  return request({
    url: `/system/tenant/package/${packageId}`,
    method: 'get'
  })
}

export function addTenantPackage (data) {
  return request({
    url: '/system/tenant/package',
    method: 'post',
    data
  })
}

export function updateTenantPackage (data) {
  return request({
    url: '/system/tenant/package',
    method: 'put',
    data
  })
}

export function changeTenantPackageStatus (packageId, statusValue) {
  return request({
    url: '/system/tenant/package/changeStatus',
    method: 'put',
    data: { packageId, status: statusValue }
  })
}

export function deleteTenantPackages (ids) {
  return request({
    url: `/system/tenant/package/${ids}`,
    method: 'delete'
  })
}
