/**
 * 认证 API 实现
 *
 * 注意：
 * 1. 使用两个独立的 axios 实例：unAuthAxios（无需认证）和 authAxios（需要认证）
 * 2. login 等公开接口使用 unAuthAxios
 * 3. 其他接口使用 authAxios，自动添加 token
 * 4. 使用自定义响应拦截器处理 401 错误和登录页面跳转
 */

import router from '@/router'
import { authAxios, createAxiosInstance } from '@/api/commons'
import type {
  AuthInfoResponse,
  AuthPermissionsResponse,
  LoginRequest,
  LoginResponse,
  MenuItem
} from '@/types/auth'

/**
 * 响应拦截器工厂
 * 处理 401 错误和登录页面跳转
 */
const createAuthResponseInterceptor = (instance: any) => {
  instance.interceptors.response.use(
    (response: any) => {
      return response.data
    },
    (error: any) => {
      if (error.response?.status === 401) {
        // 清除认证缓存数据（保留 token，等待用户重新登录）
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
}

/**
 * 无需认证的 axios 实例
 * 用于 login 等公开接口，只添加 clientid
 */
const unAuthAxios = createAxiosInstance(
  {
    baseURL: import.meta.env.VITE_API_BASE_URL || '',
    timeout: 10000
  },
  {
    skipAuth: true, // 跳过 Authorization
    customResponseInterceptor: createAuthResponseInterceptor
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
    return unAuthAxios.post('/api/v1/login', params)
  }

  /**
   * 获取用户基本信息（需要 token）
   * GET /api/v1/info
   *
   * 注意：响应拦截器已提取 data.data，直接返回内层数据
   */
  async getUserInfo(): Promise<AuthInfoResponse> {
    return authAxios.get('/api/v1/info')
  }

  /**
   * 获取权限码列表（需要 token）
   * GET /api/v1/permissions
   *
   * 注意：响应拦截器已提取 data.data，直接返回内层数据
   */
  async getPermissions(): Promise<AuthPermissionsResponse> {
    return authAxios.get('/api/v1/permissions')
  }

  /**
   * 获取菜单树（需要 token）
   * GET /api/v1/menu
   *
   * 后端返回结构：
   * {
   *   success: true,
   *   code: 200,
   *   message: "获取菜单树成功（超管）",
   *   data: {
   *     user_id: number,
   *     user_name: string,
   *     menu_tree: MenuItem[]
   *   }
   * }
   *
   * 注意：响应拦截器已提取 data.data，直接返回内层数据
   */
  async getMenuTree(): Promise<{ user_id: number | string; user_name: string; menu_tree: MenuItem[] }> {
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
