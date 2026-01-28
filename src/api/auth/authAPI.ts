/**
 * 认证 API 实现
 */

import axios from 'axios'
import type {
  AuthInfoResponse,
  AuthPermissionsResponse,
  AuthMenuResponse,
  LoginRequest,
  LoginResponse,
  UnifiedResponse
} from '@/types/auth'

// 获取 API 基础 URL
// 开发环境为空（路径中包含 /api/v1 前缀，由 vite 代理转发）
// 生产环境使用环境变量配置的完整 URL
const getApiBaseURL = () => {
  if (import.meta.env.MODE === 'production') {
    return import.meta.env.VITE_API_BASE_URL || ''
  }
  return ''
}

// 创建独立的 axios 实例用于认证接口
const authAxios = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器：添加 token 和 clientid
authAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // 添加 clientid 请求头（后端认证必需）
    config.headers.clientid = import.meta.env.VITE_CLIENT_ID
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
   * 用户登录
   * POST /api/v1/login
   */
  async login(params: LoginRequest): Promise<LoginResponse> {
    return authAxios.post('/api/v1/login', params)
  }

  /**
   * 获取用户基本信息（包含权限和菜单）
   * GET /api/v1/auth/info
   */
  async getUserInfo(): Promise<UnifiedResponse<AuthInfoResponse>> {
    return authAxios.get('/api/v1/auth/info')
  }

  /**
   * 获取权限码列表
   * GET /api/v1/auth/permissions
   */
  async getPermissions(): Promise<UnifiedResponse<AuthPermissionsResponse>> {
    return authAxios.get('/api/v1/auth/permissions')
  }

  /**
   * 获取菜单树
   * GET /api/v1/auth/menu
   */
  async getMenuTree(): Promise<UnifiedResponse<AuthMenuResponse['data']>> {
    return authAxios.get('/api/v1/auth/menu')
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
