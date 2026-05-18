/**
 * 认证与系统管理 API（对接 smart_engine 后端 /api/v1）
 */
import request from '@/utils/request'

export function login (data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

export function register (data) {
  return request({
    url: '/auth/register',
    method: 'post',
    data
  })
}

export function logout () {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}

export function getCaptcha () {
  return request({
    url: '/auth/code',
    method: 'get'
  })
}

export function refreshToken () {
  return request({
    url: '/auth/refresh',
    method: 'post'
  })
}

export function getUserInfo () {
  return request({
    url: '/system/user/getInfo',
    method: 'get'
  })
}

export function getRouters () {
  return request({
    url: '/system/menu/getRouters',
    method: 'get'
  })
}

export function getUserProfile () {
  return request({
    url: '/system/user/profile',
    method: 'get'
  })
}

export function updateUserPwd (oldPassword, newPassword) {
  return request({
    url: '/system/user/profile/updatePwd',
    method: 'put',
    params: { oldPassword, newPassword }
  })
}

export function listMenuTree () {
  return request({
    url: '/system/menu/tree',
    method: 'get'
  })
}
