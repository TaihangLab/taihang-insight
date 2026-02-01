/**
 * VisionAI Center API 基础配置
 * 提供 axios 实例、拦截器和通用工具函数
 */

import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { storage } from '@/stores/modules/storage'

/**
 * 统一响应格式
 */
export interface UnifiedResponse<T = any> {
  code: number
  msg: string
  data: T
  total?: number
  page?: number
  limit?: number
  pages?: number
  pagination?: any
}

/**
 * 分页参数
 */
export interface PageParams {
  page?: number
  limit?: number
}

// 获取 API 基础 URL
const getApiBaseURL = () => {
  if (import.meta.env.MODE === 'production') {
    return import.meta.env.VITE_API_BASE_URL || ''
  }
  return ''
}

/**
 * 创建专用于 VisionAI 模块的 axios 实例
 */
const visionAIAxios: AxiosInstance = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 15000,
  withCredentials: false
})

/**
 * 自定义参数序列化函数
 */
visionAIAxios.defaults.paramsSerializer = function (params) {
  const queryParams: string[] = []

  for (const key in params) {
    if (params[key] !== undefined) {
      if (Array.isArray(params[key])) {
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

/**
 * 通用响应处理函数
 */
export const handleSimpleResponse = (response: AxiosResponse, apiName: string): AxiosResponse => {
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

// 添加请求拦截器
visionAIAxios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getAdminToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    config.headers['clientid'] = import.meta.env.VITE_CLIENT_ID
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 添加响应拦截器
visionAIAxios.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.log('认证失败，请重新登录')
    }
    return Promise.reject(error)
  }
)

export default visionAIAxios
