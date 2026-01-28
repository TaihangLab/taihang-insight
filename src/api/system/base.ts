import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import userService from '@/components/service/UserService.ts'

// 获取 API 基础 URL
// 开发环境为空（路径中包含 /api/v1 前缀，由 vite 代理转发）
// 生产环境使用环境变量配置的完整 URL
const getApiBaseURL = () => {
  // 生产环境使用完整 URL，开发环境为空
  if (import.meta.env.MODE === 'production') {
    return import.meta.env.VITE_API_BASE_URL || ''
  }
  return ''
}

/**
 * 统一响应格式
 */
export interface UnifiedResponse<T = any> {
  success: boolean
  code: number
  message: string
  data: T
}

/**
 * 创建专用于RBAC模块的axios实例
 */
const rbacAxios: AxiosInstance = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 15000,
  withCredentials: false,
})

/**
 * 自定义参数序列化函数
 */
rbacAxios.defaults.paramsSerializer = function (params) {
  // 将驼峰命名的参数转换为下划线命名，以兼容后端API
  const convertedParams: Record<string, any> = {}
  for (const key in params) {
    if (params[key] !== undefined) {
      // 将驼峰转换为下划线
      const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
      convertedParams[snakeCaseKey] = params[key]
    }
  }

  // 自定义参数序列化逻辑，确保数组以多个同名参数形式传递
  const queryParams: string[] = []

  for (const key in convertedParams) {
    if (convertedParams[key] !== undefined) {
      if (Array.isArray(convertedParams[key])) {
        // 对于数组参数，使用重复的键名传递每个值
        convertedParams[key].forEach((value: any) => {
          queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        })
      } else {
        queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(convertedParams[key])}`)
      }
    }
  }

  return queryParams.join('&')
}

/**
 * 自定义错误类
 */
export class APIError extends Error {
  code?: number | string
  status?: number
  response?: any
  originalError?: any

  constructor(message: string, code?: number | string) {
    super(message)
    this.name = 'APIError'
    this.code = code
  }
}

// 添加请求拦截器
rbacAxios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 添加token等通用请求头
    const token = userService.getAdminToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    config.headers.clientid = import.meta.env.VITE_CLIENT_ID
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 添加响应拦截器（处理UnifiedResponse格式）
rbacAxios.interceptors.response.use(
  (response: AxiosResponse) => {
    const data = response.data
    // 检查是否为UnifiedResponse格式
    if (data && typeof data === 'object' && 'success' in data && 'code' in data && 'message' in data) {
      if (data.success) {
        // 请求成功，返回data字段
        return data
      } else {
        // 请求失败，抛出错误
        const error = new APIError(data.message || 'API请求失败', data.code)
        error.response = data
        throw error
      }
    }
    // 非UnifiedResponse格式，直接返回
    return data
  },
  (error) => {
    console.error('RBAC API 请求错误:', error)

    if (error.status === 403) {
      const errorMessage = '无权限访问该资源'
      const customError = new APIError(errorMessage, 403)
      customError.code = 403
      customError.status = 403
      customError.response = error.response?.data
      customError.originalError = error
      return Promise.reject(customError)
    }

    // 处理有响应的HTTP错误
    if (error.response) {
      const status = error.response.status

      if (status === 403) {
        let errorMessage = '无权限访问该资源'
        if (error.response.data) {
          const data = error.response.data
          if (typeof data === 'object' && 'success' in data && 'code' in data && 'message' in data) {
            errorMessage = data.message || errorMessage
          } else if (typeof data === 'object' && data.message) {
            errorMessage = data.message
          } else if (typeof data === 'object' && data.detail) {
            errorMessage = data.detail
          } else if (typeof data === 'string') {
            errorMessage = data
          }
        }

        const customError = new APIError(errorMessage, 403)
        customError.status = 403
        customError.response = error.response.data
        customError.originalError = error
        return Promise.reject(customError)
      }

      if (status === 401) {
        const customError = new APIError('登录已过期，请重新登录', 401)
        customError.status = 401
        customError.originalError = error
        return Promise.reject(customError)
      }

      if (status === 404) {
        const customError = new APIError('请求的资源不存在', 404)
        customError.status = 404
        customError.originalError = error
        return Promise.reject(customError)
      }

      if (error.response.data) {
        const data = error.response.data
        if (typeof data === 'object' && 'success' in data && 'code' in data && 'message' in data) {
          const errorMessage = data.message || 'API请求失败'
          const errorCode = data.code || status
          const customError = new APIError(errorMessage, errorCode)
          customError.status = status
          customError.response = data
          customError.originalError = error
          return Promise.reject(customError)
        }
      }

      const customError = new APIError(error.response.statusText || `请求失败 (${status})`, status)
      customError.status = status
      customError.originalError = error
      return Promise.reject(customError)
    }

    if (error.message === 'Network Error') {
      const requestUrl = error.config?.url || ''
      let errorMessage = '网络连接失败，可能是CORS跨域或后端服务未启动'

      if (requestUrl.includes('/permissions/') || requestUrl.includes('/roles/') || requestUrl.includes('/users/')) {
        errorMessage = '无权限访问该功能，或后端服务未启动（请检查Network面板查看详情）'
      }

      const customError = new APIError(errorMessage, 'NETWORK_ERROR')
      customError.originalError = error
      return Promise.reject(customError)
    }

    const customError = new APIError(error.message || '请求失败', 'REQUEST_ERROR')
    customError.originalError = error
    return Promise.reject(customError)
  }
)

export default rbacAxios
