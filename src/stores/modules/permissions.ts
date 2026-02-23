/**
 * Permissions Store
 * 管理用户权限码列表
 *
 * 设计原则：
 * 1. 将 API 调用和缓存逻辑封装在 Store 内部
 * 2. get 操作时自动判断是否需要刷新（数据为空时自动加载）
 * 3. 组件只需调用 refresh() 或直接使用数据，无需关心缓存
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { StorageKey } from './storageKeys'
import authAPI from '@/api/auth/authAPI'

export const usePermissionsStore = defineStore('permissions', () => {
  // ==================== 私有状态（不返回，外部无法直接访问） ====================
  const permissions = ref<string[]>([])
  const loading = ref(false)
  const initialized = ref(false)

  // ==================== 公共方法 ====================

  /**
   * 从后端刷新权限列表
   * 强制刷新，不判断缓存状态
   */
  async function refresh(): Promise<void> {
    if (loading.value) return

    loading.value = true
    try {
      const result = await authAPI.getPermissions()
      if (result.code === 200 && result.data) {
        const perms = result.data.permission_codes || []
        permissions.value = perms
        initialized.value = true
        console.log('[PermissionsStore] 刷新成功:', perms.length, '个权限')
      } else {
        permissions.value = []
        initialized.value = true
        console.warn('[PermissionsStore] 接口返回失败，设置为空数组')
      }
    } catch (error) {
      permissions.value = []
      initialized.value = true
      console.error('[PermissionsStore] 刷新失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 确保数据已加载（内部方法）
   * 如果未初始化，自动触发刷新
   */
  async function ensureInitialized(): Promise<void> {
    if (!initialized.value && !loading.value) {
      await refresh()
    }
  }

  /**
   * 获取所有权限（带自动加载）
   * 如果数据为空，自动触发刷新
   */
  async function getAllPermissions(): Promise<string[]> {
    await ensureInitialized()
    return permissions.value
  }

  /**
   * 检查是否有指定权限（带自动加载）
   */
  async function hasPermission(permission: string): Promise<boolean> {
    await ensureInitialized()
    return permissions.value.includes(permission)
  }

  /**
   * 检查是否有多个权限中的任意一个（带自动加载）
   */
  async function hasAnyPermission(perms: string[]): Promise<boolean> {
    await ensureInitialized()
    return perms.some(p => permissions.value.includes(p))
  }

  /**
   * 设置权限列表（保留此方法用于兼容，但推荐使用 refresh）
   */
  function setPermissions(perms: string[]) {
    permissions.value = perms
    initialized.value = true
  }

  /**
   * 清除权限列表
   */
  function clearPermissions() {
    permissions.value = []
    initialized.value = false
  }

  /**
   * 获取权限列表（带自动加载）
   * 强制使用此方法访问，确保缓存逻辑生效
   */
  async function getPermissions(): Promise<string[]> {
    await ensureInitialized()
    return permissions.value
  }

  /**
   * 同步版本获取权限列表（不触发自动加载）
   * 仅在确定数据已加载的场景使用
   */
  function getPermissionsSync(): string[] {
    return permissions.value
  }

  /**
   * 同步版本的 hasPermission（不触发自动加载，用于响应式场景）
   */
  function hasPermissionSync(permission: string): boolean {
    return permissions.value.includes(permission)
  }

  /**
   * 检查是否有已加载的权限数据
   */
  function hasData(): boolean {
    return initialized.value
  }

  return {
    refresh,
    setPermissions,
    clearPermissions,
    getPermissions,
    getPermissionsSync,
    getAllPermissions,
    hasPermission,
    hasAnyPermission,
    hasPermissionSync,
    hasData
  }
}, {
  persist: {
    key: StorageKey.PERMISSION,
    storage: localStorage
  }
})
