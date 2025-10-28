import request from '@/utils/request'

// 获取模型列表
export function getModelList(params) {
  return request({
    url: '/models/list',
    method: 'get',
    params: params
  })
}

// 同步模型
export function syncModels() {
  return request({
    url: '/models/sync',
    method: 'post'
  })
}

// 删除模型
export function deleteModel(id) {
  return request({
    url: `/models/${id}`,
    method: 'delete'
  })
}

// 批量删除模型
export function batchDeleteModels(ids) {
  return request({
    url: '/models/batch-delete',
    method: 'post',
    data: { ids }
  })
}
