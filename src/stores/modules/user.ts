import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MenuItem } from '@/api/auth/types'
import {
  getUserInfo,
  getPermissions,
  getMenuTree,
  fetchAllAuthInfo,
  clearAuthCache
} from '@/api/auth'

/**
 * 用户信息类型定义
 */
export interface UserInfo {
  id: number | string
  username: string
  user_name?: string
  nick_name?: string
  email?: string
  phone?: string
  avatar?: string
  role?: string
  tenantId?: string | number
  tenant_id?: string | number
  dept_id?: number
  position_id?: number
  status?: number
  gender?: number
}

/**
 * 用户状态 Store
 */
export const useUserStore = defineStore('user', () => {
  // 用户信息
  const userInfo = ref<UserInfo | null>(null)

  // Token
  const token = ref('')

  // 权限列表
  const permissions = ref<string[]>([])

  // 菜单树
  const menuTree = ref<MenuItem[]>([])

  // 是否已登录
  const isLoggedIn = ref(false)

  /**
   * 设置用户信息
   */
  function setUserInfo(info: UserInfo) {
    userInfo.value = info
    isLoggedIn.value = true
  }

  /**
   * 设置 Token
   */
  function setToken(newToken: string) {
    token.value = newToken
    // 保存到 localStorage
    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
  }

  /**
   * 设置权限列表
   */
  function setPermissions(perms: string[]) {
    permissions.value = perms
  }

  /**
   * 设置菜单树
   */
  function setMenuTree(menu: MenuItem[]) {
    menuTree.value = menu
  }

  /**
   * 登出
   */
  function logout() {
    userInfo.value = null
    token.value = ''
    permissions.value = []
    menuTree.value = []
    isLoggedIn.value = false
    // 清除所有缓存
    clearAuthCache()
    localStorage.removeItem('token')
  }

  /**
   * 检查是否有指定权限
   */
  function hasPermission(permission: string): boolean {
    return permissions.value.includes(permission)
  }

  /**
   * 获取用户基本信息
   */
  async function fetchUserInfo(forceRefresh = false) {
    try {
      const info = await getUserInfo(forceRefresh)
      if (info) {
        setUserInfo({
          id: info.user_id,
          username: info.user_name,
          user_name: info.user_name,
          nick_name: info.nick_name,
          email: info.email,
          phone: info.phone,
          avatar: info.avatar,
          tenantId: info.tenant_id,
          tenant_id: info.tenant_id,
          dept_id: info.dept_id,
          position_id: info.position_id,
          status: info.status,
          gender: info.gender
        })
        return info
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      throw error
    }
  }

  /**
   * 获取权限码列表
   */
  async function fetchPermissions(forceRefresh = false) {
    try {
      const perms = await getPermissions(forceRefresh)
      setPermissions(perms)
      return perms
    } catch (error) {
      console.error('获取权限码失败:', error)
      throw error
    }
  }

  /**
   * 获取菜单树
   */
  async function fetchMenuTree(forceRefresh = false) {
    try {
      const menu = await getMenuTree(forceRefresh)
      if (menu) {
        setMenuTree(menu)
        return menu
      }
      return []
    } catch (error) {
      console.error('获取菜单树失败:', error)
      throw error
    }
  }

  /**
   * 获取用户权限信息（兼容旧方法名）
   * @deprecated 使用 fetchAllAuthInfo 代替
   */
  async function fetchUserAuthInfo() {
    return fetchAllAuthInfo()
  }

  /**
   * 批量获取所有认证信息（用于登录后刷新）
   */
  async function fetchAllAuthInfoData(forceRefresh = false) {
    try {
      const result = await fetchAllAuthInfo(forceRefresh)

      // 更新用户信息
      if (result.userInfo) {
        setUserInfo({
          id: result.userInfo.user_id,
          username: result.userInfo.user_name,
          user_name: result.userInfo.user_name,
          nick_name: result.userInfo.nick_name,
          email: result.userInfo.email,
          phone: result.userInfo.phone,
          avatar: result.userInfo.avatar,
          tenantId: result.userInfo.tenant_id,
          tenant_id: result.userInfo.tenant_id,
          dept_id: result.userInfo.dept_id,
          position_id: result.userInfo.position_id,
          status: result.userInfo.status,
          gender: result.userInfo.gender
        })
      }

      // 更新权限列表
      if (result.permissions) {
        setPermissions(result.permissions)
      }

      // 更新菜单树
      if (result.menuTree) {
        setMenuTree(result.menuTree)
      }

      return result
    } catch (error) {
      console.error('获取用户认证信息失败:', error)
      throw error
    }
  }

  /**
   * 初始化：从 localStorage 恢复状态
   */
  function initFromCache() {
    // 恢复 token
    const cachedToken = localStorage.getItem('token')
    if (cachedToken) {
      token.value = cachedToken
    }

    // 恢复用户信息
    const cachedUserInfo = localStorage.getItem('auth_user_info')
    if (cachedUserInfo) {
      try {
        const info = JSON.parse(cachedUserInfo)
        setUserInfo({
          id: info.user_id,
          username: info.user_name,
          user_name: info.user_name,
          nick_name: info.nick_name,
          email: info.email,
          phone: info.phone,
          avatar: info.avatar,
          tenantId: info.tenant_id,
          tenant_id: info.tenant_id,
          dept_id: info.dept_id,
          position_id: info.position_id,
          status: info.status,
          gender: info.gender
        })
      } catch (error) {
        console.error('解析缓存的用户信息失败:', error)
      }
    }

    // 恢复权限列表
    const cachedPermissions = localStorage.getItem('auth_permissions')
    if (cachedPermissions) {
      try {
        setPermissions(JSON.parse(cachedPermissions))
      } catch (error) {
        console.error('解析缓存的权限列表失败:', error)
      }
    }

    // 恢复菜单树
    const cachedMenu = localStorage.getItem('auth_menu')
    if (cachedMenu) {
      try {
        setMenuTree(JSON.parse(cachedMenu))
      } catch (error) {
        console.error('解析缓存的菜单树失败:', error)
      }
    }

    // 设置登录状态
    if (cachedToken) {
      isLoggedIn.value = true
    }
  }

  return {
    userInfo,
    token,
    permissions,
    menuTree,
    isLoggedIn,
    setUserInfo,
    setToken,
    setPermissions,
    setMenuTree,
    logout,
    hasPermission,
    fetchUserInfo,
    fetchPermissions,
    fetchMenuTree,
    fetchUserAuthInfo,
    fetchAllAuthInfo: fetchAllAuthInfoData,
    initFromCache
  }
})
