/**
 * Permissions Store
 * 管理用户权限码列表
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { StorageKey } from './storageKeys'

export const usePermissionsStore = defineStore('permissions', () => {
  // 权限列表
  const permissions = ref<string[]>([])

  /**
   * 设置权限列表
   */
  function setPermissions(perms: string[]) {
    console.log('[PermissionsStore] 设置权限:', perms.length, '个')
    permissions.value = perms
  }

  /**
   * 清除权限列表
   */
  function clearPermissions() {
    permissions.value = []
  }

  /**
   * 检查是否有指定权限
   */
  function hasPermission(permission: string): boolean {
    return permissions.value.includes(permission)
  }

  /**
   * 检查是否有多个权限中的任意一个
   */
  function hasAnyPermission(perms: string[]): boolean {
    return perms.some(p => permissions.value.includes(p))
  }

  /**
   * 获取所有权限
   */
  function getAllPermissions(): string[] {
    return permissions.value
  }

  return {
    permissions,
    setPermissions,
    clearPermissions,
    hasPermission,
    hasAnyPermission,
    getAllPermissions
  }
}, {
  persist: {
    key: StorageKey.PERMISSION,
    storage: localStorage
  }
})
