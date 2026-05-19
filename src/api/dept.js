/**
 * 部门管理 API（对接 smart_engine /api/v1/system/dept/*）
 */
import request from '@/utils/request'

export function listDepts (params) {
  return request({ url: '/system/dept/list', method: 'get', params })
}

export function deptTree () {
  return request({ url: '/system/dept/tree', method: 'get' })
}

export function getDept (deptId) {
  return request({ url: `/system/dept/${deptId}`, method: 'get' })
}

export function addDept (data) {
  return request({ url: '/system/dept', method: 'post', data })
}

export function updateDept (deptId, data) {
  return request({ url: `/system/dept/${deptId}`, method: 'put', data })
}

export function deleteDept (deptId) {
  return request({ url: `/system/dept/${deptId}`, method: 'delete' })
}
