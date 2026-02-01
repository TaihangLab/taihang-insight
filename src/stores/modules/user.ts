import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MenuItem, UserInfo } from '@/types/auth'
import {
  getUserInfo,
  getPermissions,
  getMenuTree,
  fetchAllAuthInfo as fetchAllAuthInfoAPI
} from '@/api/auth'
import storage from './storage'

/**
 * 用户状态 Store
 * 使用 pinia-plugin-persistedstate 自动持久化
 */
export const useUserStore = defineStore('user', () => {
  // ========== 状态定义 ==========
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

  // 恢复状态（用于跟踪哪些数据已成功恢复）
  const restoreStatus = ref({
    userInfo: false,
    permissions: false,
    menuTree: false
  })

  // ========== 数据设置方法 ==========

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
    // 同步到旧系统存储（兼容性）
    storage.setWvpToken(newToken)
    storage.setToken(newToken)
  }

  /**
   * 设置权限列表
   */
  function setPermissions(perms: string[]) {
    permissions.value = perms
    syncToLocalStorage()
  }

  /**
   * 设置菜单树
   */
  function setMenuTree(menu: MenuItem[] | null | undefined) {
    // 安全检查：确保 menu 是数组，如果不是则设置为空数组
    if (Array.isArray(menu)) {
      menuTree.value = menu
      console.log('[UserStore] menuTree.value 设置后:', menuTree.value)
    } else {
      console.warn('[UserStore] setMenuTree received non-array value:', menu)
      menuTree.value = []
    }

    // 【手动持久化】确保数据立即同步到 localStorage
    syncToLocalStorage()
  }

  /**
   * 手动同步当前状态到 localStorage
   * 用于确保关键数据立即持久化
   */
  function syncToLocalStorage() {
    const state = {
      token: token.value,
      userInfo: userInfo.value,
      permissions: permissions.value,
      menuTree: menuTree.value,
      isLoggedIn: isLoggedIn.value
    }
    localStorage.setItem('taihang-auth', JSON.stringify(state))
    console.log('[UserStore] 手动同步到 localStorage:', {
      hasToken: !!state.token,
      permissionsCount: state.permissions.length,
      menuTreeCount: state.menuTree.length
    })
  }

  // ========== 认证操作方法 ==========

  /**
   * 登出（清除所有认证状态）
   */
  function logout() {
    userInfo.value = null
    token.value = ''
    permissions.value = []
    menuTree.value = []
    isLoggedIn.value = false
    restoreStatus.value = {
      userInfo: false,
      permissions: false,
      menuTree: false
    }

    // 清除旧系统的 token
    storage.setWvpToken('')
    storage.setAdminToken('')
    storage.setToken('')
    storage.setWvpUser(null)
  }

  /**
   * 清除认证缓存数据（保留 token，仅清除用户信息、权限、菜单）
   * 用于 401 错误或需要刷新认证数据时
   */
  function clearAuthData() {
    userInfo.value = null
    permissions.value = []
    menuTree.value = []
    isLoggedIn.value = false
    restoreStatus.value = {
      userInfo: false,
      permissions: false,
      menuTree: false
    }
    // 注意：不清除 token.value，因为我们需要保留 token 用于后续请求
  }

  /**
   * 检查是否有指定权限
   */
  function hasPermission(permission: string): boolean {
    return permissions.value.includes(permission)
  }

  // ========== 数据恢复方法（组件化） ==========

  /**
   * 恢复用户信息
   * @param force 是否强制从后端重新获取
   */
  async function restoreUserInfo(force = false): Promise<boolean> {
    // 如果不强制且已有数据，跳过
    if (!force && userInfo.value) {
      restoreStatus.value.userInfo = true
      return true
    }

    try {
      const info = await getUserInfo(force)
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
        restoreStatus.value.userInfo = true
        return true
      }
      console.warn('[UserStore] ⚠️ 用户信息为空')
      return false
    } catch (error) {
      console.error('[UserStore] ❌ 恢复用户信息失败:', error)
      restoreStatus.value.userInfo = false
      return false
    }
  }

  /**
   * 恢复权限列表
   * @param force 是否强制从后端重新获取
   */
  async function restorePermissions(force = false): Promise<boolean> {
    // 如果不强制且已有数据，跳过
    if (!force && permissions.value.length > 0) {
      restoreStatus.value.permissions = true
      return true
    }
    try {
      const perms = await getPermissions(force)
      console.log('[UserStore] 获取的权限列表:', perms)
      setPermissions(perms)
      restoreStatus.value.permissions = true
      console.log('[UserStore] ✅ 权限列表恢复成功，数量:', perms.length)
      return true
    } catch (error) {
      console.error('[UserStore] ❌ 恢复权限列表失败:', error)
      restoreStatus.value.permissions = false
      return false
    }
  }

  /**
   * 恢复菜单树
   * @param force 是否强制从后端重新获取
   */
  async function restoreMenuTree(force = false): Promise<boolean> {
    // 如果不强制且已有数据，跳过
    if (!force && menuTree.value.length > 0) {
      console.log('[UserStore] 菜单树已存在，跳过恢复')
      restoreStatus.value.menuTree = true
      return true
    }

    console.log('[UserStore] 正在恢复菜单树...')
    try {
      const menu = await getMenuTree(force)
      if (menu && menu.length > 0) {
        setMenuTree(menu)
        restoreStatus.value.menuTree = true
        console.log('[UserStore] ✅ 菜单树恢复成功，数量:', menu.length)
        return true
      }
      console.warn('[UserStore] ⚠️ 菜单树为空')
      restoreStatus.value.menuTree = false
      return false
    } catch (error) {
      console.error('[UserStore] ❌ 恢复菜单树失败:', error)
      restoreStatus.value.menuTree = false
      return false
    }
  }

  /**
   * 初始化：从持久化存储恢复认证数据
   *
   * 恢复策略：
   * 1. 如果 token 不存在，说明未登录，不做任何恢复
   * 2. 如果 token 存在但认证数据不完整（包括空数组），强制从后端恢复
   * 3. 支持选择性恢复（只恢复指定的数据）
   *
   * @param options 恢复选项
   */
  async function initFromCache(options?: {
    force?: boolean           // 是否强制全部重新获取
    restoreUserInfo?: boolean // 是否恢复用户信息
    restorePermissions?: boolean // 是否恢复权限列表
    restoreMenuTree?: boolean   // 是否恢复菜单树
  }): Promise<{
    success: boolean
    userInfo: boolean
    permissions: boolean
    menuTree: boolean
  }> {
    const {
      force = false,
      restoreUserInfo: restoreUser = true,
      restorePermissions: restorePerms = true,
      restoreMenuTree: restoreMenu = true
    } = options || {}

    console.log('[UserStore] ========== 开始恢复认证数据 ==========')
    console.log('[UserStore] Token 状态:', token.value ? '存在' : '不存在')
    console.log('[UserStore] 当前数据状态:', {
      hasUserInfo: !!userInfo.value,
      permissionsCount: permissions.value.length,
      menuTreeCount: menuTree.value.length,
      force
    })

    // 如果没有 token，说明未登录，无需恢复
    if (!token.value) {
      console.log('[UserStore] 未检测到 token，跳过恢复')
      return {
        success: false,
        userInfo: false,
        permissions: false,
        menuTree: false
      }
    }

    // 检查是否需要恢复（包括空数组的情况）
    const needsRestore =
      force ||
      (restoreUser && !userInfo.value) ||
      (restorePerms && (!permissions.value || permissions.value.length === 0)) ||
      (restoreMenu && (!menuTree.value || menuTree.value.length === 0))

    if (!needsRestore) {
      console.log('[UserStore] 认证数据完整，无需恢复')
      return {
        success: true,
        userInfo: !!userInfo.value,
        permissions: permissions.value.length > 0,
        menuTree: menuTree.value.length > 0
      }
    }

    console.log('[UserStore] 检测到数据不完整或强制恢复，开始从后端同步...')

    // 执行恢复
    const results = await Promise.allSettled([
      restoreUser ? restoreUserInfo(force) : Promise.resolve(false),
      restorePerms ? restorePermissions(force) : Promise.resolve(false),
      restoreMenu ? restoreMenuTree(force) : Promise.resolve(false)
    ])

    console.log('[UserStore] 恢复结果:', results)
    const [userInfoResult, permissionsResult, menuTreeResult] = results


    const success = {
      userInfo: userInfoResult.status === 'fulfilled' ? userInfoResult.value : false,
      permissions: permissionsResult.status === 'fulfilled' ? permissionsResult.value : false,
      menuTree: menuTreeResult.status === 'fulfilled' ? menuTreeResult.value : false
    }

    console.log('[UserStore] ========== 恢复完成 ==========')
    console.log('[UserStore] 恢复结果:', success)

    // 检查是否在登录页
    const isLoginPage = window.location.pathname.includes('/login')

    // 如果 token 存在但所有恢复都失败，且不在登录页，可能 token 已过期
    if (token.value && !success.userInfo && !success.permissions && !success.menuTree && !isLoginPage) {
      console.warn('[UserStore] ⚠️ 所有数据恢复失败，token 可能已过期')
      // 不自动清除 token，让用户自己处理或通过 401 错误处理
    }

    return {
      success: success.userInfo || success.permissions || success.menuTree,
      ...success
    }
  }

  // ========== 数据获取方法 ==========

  /**
   * 获取用户基本信息
   */
  async function fetchUserInfo(forceRefresh = false) {
    return restoreUserInfo(forceRefresh)
  }

  /**
   * 获取权限码列表
   */
  async function fetchPermissions(forceRefresh = false) {
    return restorePermissions(forceRefresh)
  }

  /**
   * 获取菜单树
   */
  async function fetchMenuTree(forceRefresh = false) {
    return restoreMenuTree(forceRefresh)
  }

  /**
   * 批量获取所有认证信息（用于登录后刷新）
   */
  async function fetchAllAuthInfo(forceRefresh = false): Promise<{
    userInfo: any
    permissions: string[]
    menuTree: MenuItem[]
  }> {
    const result = await fetchAllAuthInfoAPI(forceRefresh)

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
      restoreStatus.value.userInfo = true
    }

    // 更新权限列表
    if (result.permissions) {
      setPermissions(result.permissions)
      restoreStatus.value.permissions = true
    }

    // 更新菜单树
    if (result.menuTree) {
      setMenuTree(result.menuTree)
      restoreStatus.value.menuTree = true
    }

    return result
  }

  return {
    // 状态
    userInfo,
    token,
    permissions,
    menuTree,
    isLoggedIn,
    restoreStatus,

    // 设置方法
    setUserInfo,
    setToken,
    setPermissions,
    setMenuTree,
    syncToLocalStorage,

    // 操作方法
    logout,
    clearAuthData,
    hasPermission,

    // 恢复方法（组件化）
    restoreUserInfo,
    restorePermissions,
    restoreMenuTree,
    initFromCache,

    // 获取方法
    fetchUserInfo,
    fetchPermissions,
    fetchMenuTree,
    fetchAllAuthInfo,
  }
}, {
  // ========== 持久化配置 ==========
  persist: {
    key: 'taihang-auth', // 统一的 localStorage 键名
    storage: localStorage,
    // 选择需要持久化的状态
    pick: ['token', 'userInfo', 'permissions', 'menuTree', 'isLoggedIn']
  }
})
