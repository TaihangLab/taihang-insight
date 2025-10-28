import request from '@/utils/request'

// 查询岗位列表
export function listPost(query) {
  return request({
    url: '/post/list',
    method: 'get',
    params: query
  })
}

// 查询岗位详细
export function getPost(postId) {
  return request({
    url: '/post/' + postId,
    method: 'get'
  })
}

// 新增岗位
export function addPost(data) {
  return request({
    url: '/post/add',
    method: 'post',
    data: data
  })
}

// 修改岗位
export function updatePost(data) {
  return request({
    url: '/post/edit',
    method: 'put',
    data: data
  })
}

// 删除岗位
export function delPost(postId) {
  return request({
    url: '/post/' + postId,
    method: 'delete'
  })
}

// 岗位状态修改
export function changePostStatus(postId, status) {
  const data = {
    postId,
    status
  }
  return request({
    url: '/post/changeStatus',
    method: 'put',
    data: data
  })
}

// 获取岗位选项列表
export function optionselect() {
  return request({
    url: '/post/option/list',
    method: 'get'
  })
}
