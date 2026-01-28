/**
 * 认证 API 实现
 */

import axios from 'axios'
import type {
  AuthInfoResponse,
  AuthPermissionsResponse,
  AuthMenuResponse,
  UnifiedResponse
} from './types'

// 创建独立的 axios 实例用于认证接口
const authAxios = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器：添加 token
authAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器：统一处理
authAxios.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期，清除本地数据
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

/**
 * 认证 API 类
 */
class AuthAPI {
  /**
   * 获取用户基本信息
   * GET /api/v1/auth/info
   */
  async getUserInfo(): Promise<UnifiedResponse<AuthInfoResponse>> {
    return authAxios.get('/auth/info')
  }

  /**
   * 获取权限码列表
   * GET /api/v1/auth/permissions
   */
  async getPermissions(): Promise<UnifiedResponse<AuthPermissionsResponse>> {
    return authAxios.get('/auth/permissions')
  }

  /**
   * 获取菜单树
   * GET /api/v1/auth/menu
   */
  async getMenuTree(): Promise<UnifiedResponse<AuthMenuResponse['data']>> {
    return authAxios.get('/auth/menu')
  }
}

/**
 * 创建单例实例
 */
export function createAuthAPI(): AuthAPI {
  return new AuthAPI()
}

// 导出默认实例
export default createAuthAPI()
