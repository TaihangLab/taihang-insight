/**
 * 认证服务
 * 处理用户信息、权限、菜单的获取和缓存
 */

import { createAuthAPI } from './authAPI'
import type {
  AuthInfoResponse,
  AuthPermissionsResponse,
  AuthMenuResponse
} from '@/types/auth'

// 导出单例实例
export const authAPI = createAuthAPI()

// 导出类型
export type * from '@/types/auth'

/**
 * localStorage 缓存管理
 */
const CACHE_KEYS = {
  USER_INFO: 'auth_user_info',
  PERMISSIONS: 'auth_permissions',
  MENU: 'auth_menu',
  CACHE_TIMESTAMP: 'auth_cache_timestamp'
}

/**
 * 缓存时间配置（毫秒）
 */
const CACHE_TTL = {
  USER_INFO: 30 * 60 * 1000,      // 用户信息：30分钟
  PERMISSIONS: 30 * 60 * 1000,    // 权限码：30分钟
  MENU: 60 * 60 * 1000            // 菜单树：60分钟
}

/**
 * 检查缓存是否过期
 */
function isCacheExpired(key: string, ttl: number): boolean {
  const timestamp = localStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP)
  if (!timestamp) return true

  const cacheData = JSON.parse(timestamp)
  const keyTime = cacheData[key]

  if (!keyTime) return true

  return Date.now() - keyTime > ttl
}

/**
 * 更新缓存时间戳
 */
function updateCacheTimestamp(key: string) {
  const timestamp = localStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP)
  const cacheData = timestamp ? JSON.parse(timestamp) : {}
  cacheData[key] = Date.now()
  localStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, JSON.stringify(cacheData))
}

/**
 * 获取用户基本信息（带缓存）
 */
export async function getUserInfo(forceRefresh = false): Promise<AuthInfoResponse | null> {
  // 检查缓存
  if (!forceRefresh) {
    const cached = localStorage.getItem(CACHE_KEYS.USER_INFO)
    if (cached && !isCacheExpired('user_info', CACHE_TTL.USER_INFO)) {
      return JSON.parse(cached)
    }
  }

  // 请求新数据
  try {
    const response = await authAPI.getUserInfo()
    if (response.success && response.data) {
      localStorage.setItem(CACHE_KEYS.USER_INFO, JSON.stringify(response.data))
      updateCacheTimestamp('user_info')
      return response.data
    }
    return null
  } catch (error) {
    console.error('获取用户信息失败:', error)
    // 如果请求失败且有缓存，返回缓存数据
    const cached = localStorage.getItem(CACHE_KEYS.USER_INFO)
    return cached ? JSON.parse(cached) : null
  }
}

/**
 * 获取权限码列表（带缓存）
 */
export async function getPermissions(forceRefresh = false): Promise<string[]> {
  // 检查缓存
  if (!forceRefresh) {
    const cached = localStorage.getItem(CACHE_KEYS.PERMISSIONS)
    if (cached && !isCacheExpired('permissions', CACHE_TTL.PERMISSIONS)) {
      return JSON.parse(cached)
    }
  }

  // 请求新数据
  try {
    const response = await authAPI.getPermissions()
    if (response.success && response.data) {
      const permissions = response.data.permissions || []
      localStorage.setItem(CACHE_KEYS.PERMISSIONS, JSON.stringify(permissions))
      updateCacheTimestamp('permissions')
      return permissions
    }
    return []
  } catch (error) {
    console.error('获取权限码失败:', error)
    // 如果请求失败且有缓存，返回缓存数据
    const cached = localStorage.getItem(CACHE_KEYS.PERMISSIONS)
    return cached ? JSON.parse(cached) : []
  }
}

/**
 * 获取菜单树（带缓存）
 */
export async function getMenuTree(forceRefresh = false): Promise<AuthMenuResponse['data'] | null> {
  // 检查缓存
  if (!forceRefresh) {
    const cached = localStorage.getItem(CACHE_KEYS.MENU)
    if (cached && !isCacheExpired('menu', CACHE_TTL.MENU)) {
      return JSON.parse(cached)
    }
  }

  // 请求新数据
  try {
    const response = await authAPI.getMenuTree()
    if (response.success && response.data) {
      localStorage.setItem(CACHE_KEYS.MENU, JSON.stringify(response.data))
      updateCacheTimestamp('menu')
      return response.data
    }
    return null
  } catch (error) {
    console.error('获取菜单树失败:', error)
    // 如果请求失败且有缓存，返回缓存数据
    const cached = localStorage.getItem(CACHE_KEYS.MENU)
    return cached ? JSON.parse(cached) : null
  }
}

/**
 * 清除所有认证缓存
 */
export function clearAuthCache() {
  Object.values(CACHE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
}

/**
 * 批量获取用户认证信息（用于登录后刷新）
 */
export async function fetchAllAuthInfo(forceRefresh = false) {
  const [userInfo, permissions, menuTree] = await Promise.all([
    getUserInfo(forceRefresh),
    getPermissions(forceRefresh),
    getMenuTree(forceRefresh)
  ])

  return {
    userInfo,
    permissions,
    menuTree
  }
}
