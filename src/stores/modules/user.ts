import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 用户信息类型定义
 */
export interface UserInfo {
  id: number | string
  username: string
  name?: string
  email?: string
  avatar?: string
  role?: string
  tenantId?: string | number
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
  }

  /**
   * 设置权限列表
   */
  function setPermissions(perms: string[]) {
    permissions.value = perms
  }

  /**
   * 登出
   */
  function logout() {
    userInfo.value = null
    token.value = ''
    permissions.value = []
    isLoggedIn.value = false
  }

  /**
   * 检查是否有指定权限
   */
  function hasPermission(permission: string): boolean {
    return permissions.value.includes(permission)
  }

  return {
    userInfo,
    token,
    permissions,
    isLoggedIn,
    setUserInfo,
    setToken,
    setPermissions,
    logout,
    hasPermission
  }
})
