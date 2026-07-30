import userService from '@/components/service/UserService'

/** 统一 clientid，所有后端请求均需携带 */
export const CLIENT_ID = '02bb9cfe8d7844ecae8dbe62b1ba971a'

/**
 * 获取统一的认证请求头（用于 fetch / SSE / el-upload 等）
 */
export function getAuthHeaders(extraHeaders = {}) {
  const headers = {
    clientid: CLIENT_ID,
    ...extraHeaders,
  }
  // const token = userService.getAdminToken()
  const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsb2dpblR5cGUiOiJsb2dpbiIsImxvZ2luSWQiOiJzeXNfdXNlcjoxOTgyNzE0MTA5NjgwNDk2NjQxIiwicm5TdHIiOiJ1bFFEYnl0QUQzdWxiWXJXeUg0dVNlWndDbWdITXQ4TCIsImNsaWVudGlkIjoiMDJiYjljZmU4ZDc4NDRlY2FlOGRiZTYyYjFiYTk3MWEiLCJ0ZW5hbnRJZCI6IjAwMDAwMCIsInVzZXJJZCI6MTk4MjcxNDEwOTY4MDQ5NjY0MSwidXNlck5hbWUiOiJ6dHNNYW5hZ2VyIiwiZGVwdElkIjoxOTgyNzEzNjYzNDE5MTMzOTUzLCJkZXB0TmFtZSI6IiIsImRlcHRDYXRlZ29yeSI6IiJ9.P3OUOaeTamTY7bYbvBHcIhoscMjyfqh0EVIslK-o-Uo'
  if (token) {
    headers.Authorization = 'Bearer ' + token
  }
  return headers
}

/**
 * 为 axios 请求 config 注入认证头
 */
export function applyAuthHeaders(config) {
  config.headers = config.headers || {}
  const authHeaders = getAuthHeaders()
  Object.keys(authHeaders).forEach((key) => {
    config.headers[key] = authHeaders[key]
  })
  return config
}

/**
 * 为 axios 实例注册请求拦截器，自动附加 Authorization 与 clientid
 */
export function attachAuthRequestInterceptor(axiosInstance) {
  axiosInstance.interceptors.request.use(
    (config) => applyAuthHeaders(config),
    (error) => Promise.reject(error)
  )
  return axiosInstance
}
