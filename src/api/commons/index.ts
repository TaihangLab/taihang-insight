/**
 * API 公共模块
 * 提供所有 API 模块共享的方法、类型和工具函数
 */

import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { storage } from '@/stores/modules/storage'

// ========== 类型导出 ==========
// 重新导出全局类型
export type { UnifiedResponse, RBACResponse, PageParams, PaginationData } from '@/types/global'

// ========== API 错误类 ==========
/**
 * 自定义 API 错误类
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

// ========== 基础 URL 配置 ==========
/**
 * 获取 API 基础 URL
 * 开发环境：路径中包含 /api/v1 前缀，由 vite 代理转发
 * 生产环境：使用环境变量配置的完整 URL
 */
export const getApiBaseURL = () => {
  if (import.meta.env.MODE === 'production') {
    return import.meta.env.VITE_API_BASE_URL || ''
  }
  return ''
}

/**
 * 获取认证 API 基础 URL（始终使用完整 URL）
 * 用于认证相关接口，开发环境也需要完整 URL
 */
export const getAuthApiBaseURL = () => {
  return import.meta.env.VITE_API_BASE_URL || ''
}

// ========== 参数序列化 ==========

/**
 * 统一参数序列化（支持数组重复键）
 * @param params 参数对象
 */
export const paramsSerializer = function (params: Record<string, any>): string {
  const queryParams: string[] = []

  for (const key in params) {
    if (params[key] !== undefined) {
      if (Array.isArray(params[key])) {
        // 数组参数：使用重复的键名传递每个值
        params[key].forEach((value: any) => {
          queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        })
      } else {
        queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      }
    }
  }

  return queryParams.join('&')
}

// ========== 请求头配置 ==========

/**
 * 添加认证请求头（Authorization + clientid）
 * @param config Axios 请求配置
 */
export const addAuthHeaders = (
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig => {
  const token = storage.getAdminToken()
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  // 始终添加 clientid
  config.headers['clientid'] = import.meta.env.VITE_CLIENT_ID
  return config
}

/**
 * 仅添加 clientid 请求头（用于完全不需要认证的接口）
 */
export const addClientIdHeader = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  config.headers['clientid'] = import.meta.env.VITE_CLIENT_ID
  return config
}

// ========== 错误处理 ==========

/**
 * 创建 403 错误
 */
export const create403Error = (message = '无权限访问该资源'): APIError => {
  const error = new APIError(message, 403)
  error.code = 403
  error.status = 403
  return error
}

/**
 * 创建 401 错误
 */
export const create401Error = (message = '登录已过期，请重新登录'): APIError => {
  const error = new APIError(message, 401)
  error.status = 401
  return error
}

/**
 * 创建 404 错误
 */
export const create404Error = (message = '请求的资源不存在'): APIError => {
  const error = new APIError(message, 404)
  error.status = 404
  return error
}

/**
 * 创建网络错误
 */
export const createNetworkError = (message = '网络连接失败'): APIError => {
  const error = new APIError(message, 'NETWORK_ERROR')
  return error
}

// ========== 响应处理 ==========

/**
 * 通用响应处理函数
 * 将非标准响应转换为 UnifiedResponse 格式
 */
export const handleSimpleResponse = (
  response: AxiosResponse,
  apiName: string
): AxiosResponse => {
  const originalData = response.data

  if (originalData && originalData.code !== undefined) {
    return response
  }

  const transformedData = {
    code: 0,
    msg: 'success',
    data: {},
    total: 0
  }

  if (originalData && originalData.success !== undefined) {
    transformedData.code = originalData.success ? 0 : -1
    transformedData.msg = originalData.message || (originalData.success ? 'success' : 'failed')
    transformedData.data = originalData
  } else {
    transformedData.data = originalData
  }

  response.data = transformedData
  console.log(`${apiName}响应转换完成:`, response.data)

  return response
}

// ========== Axios 实例创建工厂 ==========

/**
 * 创建配置好的 Axios 实例
 * @param config Axios 配置
 * @param options 额外选项
 */
export const createAxiosInstance = (
  config: {
    baseURL?: string
    timeout?: number
    withCredentials?: boolean
  } = {},
  options: {
    skipAuth?: boolean // 跳过添加认证头（完全不需要认证）
    skipClientId?: boolean // 跳过添加 clientid
    skipResponseInterceptor?: boolean // 跳过响应拦截器
    customResponseInterceptor?: (instance: AxiosInstance) => void // 自定义响应拦截器
  } = {}
): AxiosInstance => {
  const instance = axios.create({
    baseURL: config.baseURL ?? getApiBaseURL(),
    timeout: config.timeout ?? 15000,
    withCredentials: config.withCredentials ?? false,
  })

  // 设置参数序列化
  instance.defaults.paramsSerializer = paramsSerializer

  // 请求拦截器
  instance.interceptors.request.use(
    (requestConfig: InternalAxiosRequestConfig) => {
      // 完全跳过认证
      if (options.skipAuth) {
        if (!options.skipClientId) {
          return addClientIdHeader(requestConfig)
        }
        return requestConfig
      }

      // 正常添加认证头
      return addAuthHeaders(requestConfig)
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // 添加通用响应拦截器（除非跳过）
  if (!options.skipResponseInterceptor && !options.customResponseInterceptor) {
    attachCommonResponseInterceptor(instance)
  }

  // 添加自定义响应拦截器
  if (options.customResponseInterceptor) {
    options.customResponseInterceptor(instance)
  }

  return instance
}

/**
 * 附加通用响应拦截器
 * 处理统一的 RBACResponse 格式和常见错误
 */
export const attachCommonResponseInterceptor = (instance: AxiosInstance) => {
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      const data = response.data
      // 检查是否为 RBACResponse 格式 { success, code, message, data }
      if (data && typeof data === 'object' && 'success' in data && 'code' in data && 'message' in data) {
        if (data.success) {
          // 请求成功，返回 data 字段
          return data
        } else {
          // 请求失败，抛出错误
          const error = new APIError(data.message || 'API请求失败', data.code)
          error.response = data
          throw error
        }
      }
      // 检查是否为 UnifiedResponse 格式 { code, msg, data }
      if (data && typeof data === 'object' && 'code' in data && 'msg' in data) {
        // 请求成功（code === 0），返回 data 字段
        return data.data
      }
      // 其他格式，直接返回
      return data
    },
    (error) => {
      console.error('API 请求错误:', error)

      if (error.status === 403) {
        const customError = new APIError('无权限访问该资源', 403)
        customError.code = 403
        customError.status = 403
        customError.response = error.response?.data
        customError.originalError = error
        return Promise.reject(customError)
      }

      // 处理有响应的 HTTP 错误
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
}

 /**
 * 需要认证的 axios 实例
 * 自动添加 Authorization 和 clientid
 */
export const authAxios = createAxiosInstance(
  {
    timeout: 15000
  },
)

// 默认导出，方便其他模块使用
export default authAxios