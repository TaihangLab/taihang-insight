/**
 * 菜单管理 API（对接 smart_engine /api/v1/system/menu/*）
 */
import request from '@/utils/request'

export function listMenus (params) {
  return request({ url: '/system/menu/list', method: 'get', params })
}

export function menuTree () {
  return request({ url: '/system/menu/tree', method: 'get' })
}

export function getMenu (menuId) {
  return request({ url: `/system/menu/${menuId}`, method: 'get' })
}

export function addMenu (data) {
  return request({ url: '/system/menu', method: 'post', data })
}

export function updateMenu (menuId, data) {
  return request({ url: `/system/menu/${menuId}`, method: 'put', data })
}

export function deleteMenu (menuId) {
  return request({ url: `/system/menu/${menuId}`, method: 'delete' })
}
