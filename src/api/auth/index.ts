/**
 * 认证服务 API
 * 处理用户信息、权限、菜单的获取
 * 注意：缓存由 Pinia 持久化插件自动管理
 */

import { createAuthAPI } from './authAPI'
import type {
  AuthInfoResponse,
  AuthPermissionsResponse,
  MenuItem
} from '@/types/auth'

// 导出单例实例
export const authAPI = createAuthAPI()

// 导出类型
export type * from '@/types/auth'

/**
 * 获取用户基本信息
 */
export async function getUserInfo(forceRefresh = false): Promise<AuthInfoResponse | null> {
  try {
    const response = await authAPI.getUserInfo()
    if (response.code === 200 && response.data) {
      return response.data
    }
    return null
  } catch (error) {
    console.error('获取用户信息失败:', error)
    throw error
  }
}

/**
 * 获取权限码列表
 */
export async function getPermissions(forceRefresh = false): Promise<string[]> {
  try {
    const response = await authAPI.getPermissions()
    console.log('response:', response)
    if (response.code === 200 && response.data) {
      return response.data.permission_codes || []
    }
    return []
  } catch (error) {
    console.error('获取权限码失败:', error)
    throw error
  }
}

/**
 * 获取菜单树
 * 后端返回结构：{ code: 200, data: { user_id, user_name, menu_tree: MenuItem[] } }
 */
export async function getMenuTree(forceRefresh = false): Promise<MenuItem[] | null> {
  try {
    const response = await authAPI.getMenuTree()
    if (response.code === 200 && response.data) {
      // 后端返回的数据结构可能是 { menu_tree: MenuItem[] } 或直接是 MenuItem[]
      const menuData = 'menu_tree' in response.data ? (response.data as any).menu_tree : response.data
      return menuData
    }
    return null
  } catch (error) {
    console.error('获取菜单树失败:', error)
    throw error
  }
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
