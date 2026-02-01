/**
 * 认证 API 实现
 *
 * 注意：
 * 1. 从 Pinia Store 获取 token，而不是直接访问 localStorage
 * 2. login 接口不需要 Authorization header
 * 3. 其他接口需要 token，没有 token 时不应调用
 */

import axios from 'axios'
import router from '@/router'
import type {
  AuthInfoResponse,
  AuthPermissionsResponse,
  LoginRequest,
  LoginResponse,
  UnifiedResponse,
  MenuItem
} from '@/types/auth'

// 获取 API 基础 URL
// 使用与主应用相同的后端地址
const getApiBaseURL = () => {
  // 开发环境和生产环境都使用完整的后端 URL
  // 与 main.ts 中的 API_BASE_URL 保持一致
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

  if (import.meta.env.MODE === 'production') {
    return import.meta.env.VITE_API_BASE_URL || API_BASE_URL
  }
  return API_BASE_URL
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
    // 登录接口不需要 token
    if (config.url === '/api/v1/login') {
      // 添加 clientid 请求头（后端认证必需）
      config.headers.clientid = import.meta.env.VITE_CLIENT_ID
      return config
    }

    // 其他接口需要从 Pinia Store 获取 token
    // 注意：这里无法直接使用 useUserStore()，因为这是在 axios 拦截器中
    // 需要从 localStorage 读取 Pinia 持久化的数据
    try {
      const authData = localStorage.getItem('taihang-auth')
      const token = authData ? JSON.parse(authData).token : null

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      // 如果没有 token，继续请求（让后端返回 401）
    } catch (e) {
      console.warn('读取 token 失败:', e)
    }

    // 添加 clientid 请求头（后端认证必需）
    config.headers.clientid = import.meta.env.VITE_CLIENT_ID
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器：统一处理 401 错误
authAxios.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      // 清除认证缓存数据（保留 token，等待用户重新登录）
      // 注意：这里无法直接使用 useUserStore()，需要操作 localStorage
      try {
        const authData = localStorage.getItem('taihang-auth')
        if (authData) {
          const parsed = JSON.parse(authData)
          // 清除 userInfo, permissions, menuTree，保留 token
          parsed.userInfo = null
          parsed.permissions = []
          parsed.menuTree = []
          parsed.isLoggedIn = false
          localStorage.setItem('taihang-auth', JSON.stringify(parsed))
        }
      } catch (e) {
        console.warn('清除认证数据失败:', e)
      }

      // 使用 router 跳转到登录页，避免页面刷新导致日志丢失
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

/**
 * 认证 API 类
 */
class AuthAPI {
  /**
   * 用户登录（不需要 token）
   * POST /api/v1/login
   */
  async login(params: LoginRequest): Promise<LoginResponse> {
    return authAxios.post('/api/v1/login', params)
  }

  /**
   * 获取用户基本信息（需要 token）
   * GET /api/v1/info
   */
  async getUserInfo(): Promise<UnifiedResponse<AuthInfoResponse>> {
    return authAxios.get('/api/v1/info')
  }

  /**
   * 获取权限码列表（需要 token）
   * GET /api/v1/permissions
   */
  async getPermissions(): Promise<UnifiedResponse<AuthPermissionsResponse>> {
    return authAxios.get('/api/v1/permissions')
  }

  /**
   * 获取菜单树（需要 token）
   * GET /api/v1/menu
   *
   * 后端返回结构：
   * {
   *   code: 200,
   *   data: {
   *     user_id: number,
   *     user_name: string,
   *     menu_tree: MenuItem[]
   *   }
   * }
   */
  async getMenuTree(): Promise<UnifiedResponse<{ user_id: number; user_name: string; menu_tree: MenuItem[] }>> {
    return authAxios.get('/api/v1/menu')
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
