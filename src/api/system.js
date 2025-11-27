/**
 * 系统管理相关API
 */
import request from '@/utils/request'

/**
 * 获取系统配置信息
 */
export function getSystemConfig() {
  return request({
    url: '/prod-api/smart-engine/api/v1/server/system/configInfo',
    method: 'get'
  })
}

/**
 * 更新系统配置
 * @param {Object} data - 配置数据
 */
export function updateSystemConfig(data) {
  return request({
    url: '/prod-api/smart-engine/api/v1/server/system/config',
    method: 'post',
    data: data
  })
}

/**
 * 获取服务器信息
 */
export function getServerInfo() {
  return request({
    url: '/prod-api/smart-engine/api/v1/server/info',
    method: 'get'
  })
}

/**
 * 获取日志列表
 * @param {Object} params - 查询参数
 */
export function getLogList(params) {
  return request({
    url: '/prod-api/smart-engine/api/v1/server/log/list',
    method: 'get',
    params: params
  })
}

