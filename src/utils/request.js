/**
 * smart_engine 统一 axios 实例（baseURL = API_BASE_URL + /api/v1）
 *
 * - 请求拦截：注入 Authorization: Bearer <token>，同时附带 access-token 头以兼容旧后端
 * - 响应拦截：
 *     1. 后端返回 { code, msg, data } 时：
 *        - code === 200 透传 data
 *        - 否则弹错误提示并 reject
 *     2. 401 时清 token 并跳 /login
 */
import axios from 'axios'
import { Message } from 'element-ui'
import { getToken, removeToken, removeUser } from './auth'

const config = require('../../config/index.js')

const service = axios.create({
  baseURL: (config && config.API_BASE_URL ? config.API_BASE_URL : '') + '/api/v1',
  timeout: 30000,
  withCredentials: false
})

/**
 * 剔除 query / params 中的空字符串、null、undefined，避免后端把空串当作"=='' "过滤条件。
 * 例如：{ pageNum:1, status:'' } → { pageNum:1 }
 * 注意：保留 0 / false 等合法假值。
 */
function pruneEmptyParams (params) {
  if (!params || typeof params !== 'object') return params
  const cleaned = {}
  Object.keys(params).forEach((k) => {
    const v = params[k]
    if (v === '' || v === null || typeof v === 'undefined') return
    cleaned[k] = v
  })
  return cleaned
}

service.interceptors.request.use(
  (cfg) => {
    const token = getToken()
    if (token) {
      cfg.headers = cfg.headers || {}
      cfg.headers['Authorization'] = `Bearer ${token}`
      cfg.headers['access-token'] = token
    }
    // 统一清洗查询参数（GET / DELETE 的 params；不动 body 防止误删合法字段）
    if (cfg.params) {
      cfg.params = pruneEmptyParams(cfg.params)
    }
    return cfg
  },
  (error) => Promise.reject(error)
)

service.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data && typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, 'code')) {
      if (data.code === 200) {
        return data
      }
      Message({ message: data.msg || '操作失败', type: 'error', duration: 4000 })
      return Promise.reject(new Error(data.msg || 'Error'))
    }
    return response
  },
  (error) => {
    const status = error && error.response && error.response.status
    if (status === 401) {
      removeToken()
      removeUser()
      Message({ message: '登录已失效，请重新登录', type: 'warning', duration: 3000 })
      if (typeof window !== 'undefined' && window.location && window.location.hash !== '#/login') {
        window.location.hash = '#/login'
      }
    } else {
      const msg = (error && error.response && error.response.data && (error.response.data.msg || error.response.data.detail))
        || error.message
        || '请求失败'
      Message({ message: String(msg), type: 'error', duration: 4000 })
    }
    return Promise.reject(error)
  }
)

export default service
