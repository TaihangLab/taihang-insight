/**
 * VisionAI Center API 基础配置
 * 提供 axios 实例、拦截器和通用工具函数
 */

import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import userService from '@/components/service/UserService'
import type { UnifiedResponse, PageParams, PaginatedResponse } from './types'

// 重新导出类型，方便其他文件使用
export type { UnifiedResponse, PageParams, PaginatedResponse }


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
 * 创建专用于 VisionAI 模块的 axios 实例
 * 开发环境使用 Vite proxy，生产环境使用完整 URL
 */
const visionAIAxios: AxiosInstance = axios.create({
  // 开发环境：使用 /api/v1，由 Vite proxy 转发
  // 生产环境：从环境变量获取完整 URL
  baseURL: getApiBaseURL(),
  timeout: 15000,
  withCredentials: false
})

/**
 * 自定义参数序列化函数
 * 支持数组以重复键名形式传递
 */
visionAIAxios.defaults.paramsSerializer = function (params) {
  const queryParams: string[] = []

  for (const key in params) {
    if (params[key] !== undefined) {
      if (Array.isArray(params[key])) {
        // 对于数组参数，使用重复的键名传递每个值
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
const handleSimpleResponse = (response: AxiosResponse, apiName: string): AxiosResponse => {
  const originalData = response.data

  // 如果已经是期望的格式，直接返回
  if (originalData && originalData.code !== undefined) {
    return response
  }

  // 转换为前端期望的格式
  const transformedData = {
    code: 0,
    msg: 'success',
    data: {},
    total: 0
  }

  // 检查是否为通用操作响应
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
    // 添加 token 等通用请求头
    const token = userService.getAdminToken()
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
    // 直接返回原始响应，不进行数据转换
    return response
  },
  (error) => {
    // 处理响应错误
    if (error.response && error.response.status === 401) {
      console.log('认证失败，请重新登录')
    }
    return Promise.reject(error)
  }
)

export default visionAIAxios
export { handleSimpleResponse }
