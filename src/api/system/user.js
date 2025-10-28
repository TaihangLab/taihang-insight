import request from '@/utils/request'
import { parseStrEmpty } from "@/utils/ruoyi";

// 查询用户列表
export function listUser(query) {
  return request({
    url: '/user/user/list',
    method: 'get',
    params: query
  })
}

// 查询用户详细
export function getUser(userId) {
  return request({
    url: '/user/user/' + parseStrEmpty(userId),
    method: 'get'
  })
}

// 新增用户
export function addUser(data) {
  return request({
    url: '/user/user/add',
    method: 'post',
    data: data
  })
}

// 修改用户
export function updateUser(data) {
  return request({
    url: '/user/user/edit',
    method: 'put',
    data: data
  })
}

// 删除用户
export function delUser(userId) {
  return request({
    url: '/user/user/delete',
    method: 'delete',
    data: Array.isArray(userId) ? userId : [parseInt(userId)]
  })
}

// 用户密码重置
export function resetUserPwd(userId, password) {
  const data = {
    user_id: userId,
    password
  }
  return request({
    url: '/user/user/resetPwd',
    method: 'put',
    data: data
  })
}

// 用户状态修改
export function changeUserStatus(userId, status) {
  const data = {
    user_id: userId,
    status
  }
  return request({
    url: '/user/user/changeStatus',
    method: 'put',
    data: data
  })
}

// 查询用户个人信息
export function getUserProfile() {
  return request({
    url: '/user/user/profile',
    method: 'get'
  })
}

// 修改用户个人信息
export function updateUserProfile(data) {
  return request({
    url: '/user/user/profile',
    method: 'put',
    data: data
  })
}

// 用户密码修改
export function updateUserPwd(oldPassword, newPassword) {
  const data = {
    old_password: oldPassword,
    new_password: newPassword
  }
  return request({
    url: '/user/user/updatePwd',
    method: 'put',
    data: data
  })
}

// 用户头像上传
export function uploadAvatar(data) {
  return request({
    url: '/user/user/avatar',
    method: 'post',
    data: data
  })
}

// 查询授权角色
export function getAuthRole(userId) {
  return request({
    url: '/user/user/authRole/' + userId,
    method: 'get'
  })
}

// 保存授权角色
export function updateAuthRole(data) {
  return request({
    url: '/user/user/authRole',
    method: 'put',
    params: { user_id: data.userId },
    data: data.roleIds
  })
}

// 查询部门下拉树结构
export function deptTreeSelect() {
  return request({
    url: '/user/user/deptTree',
    method: 'get'
  })
}
