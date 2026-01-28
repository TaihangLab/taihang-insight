/**
 * 用户服务
 * 本地存储用户信息和token
 */

import cacheManager from '@/utils/cacheManager'

interface UserInfo {
  id?: string | number
  username?: string
  user_code?: string
  tenant_id?: string | number
}

export default {
  /**
   * 设置用户信息
   */
  setUser(user: UserInfo): void {
    localStorage.setItem('wvp-user', JSON.stringify(user))
  },

  /**
   * 获取用户信息
   */
  getUser(): UserInfo {
    const userStr = localStorage.getItem('wvp-user')
    return userStr ? JSON.parse(userStr) : {}
  },

  /**
   * 清除用户信息
   */
  clearUserInfo(): void {
    localStorage.removeItem('wvp-user')
  },

  /**
   * 获取token
   */
  getToken(): string | null {
    return localStorage.getItem('wvp-token')
  },

  /**
   * 获取管理员token
   */
  getAdminToken(): string | null {
    return localStorage.getItem('Admin-Token')
  },

  /**
   * 设置token
   */
  setToken(token: string): void {
    localStorage.setItem('wvp-token', token)
  },

  /**
   * 清除token和用户信息
   */
  clearToken(): void {
    localStorage.removeItem('Admin-Token')
    localStorage.removeItem('wvp-token')
    localStorage.removeItem('wvp-user')

    // 清理RBAC服务缓存，避免登出后仍显示之前用户的缓存数据
    cacheManager.clear()
  }
}
