/**
 * 权限指令
 * 用法：v-permission="'user:create'" 或 v-permission="['user:create', 'user:edit']"
 */

import type { Directive, DirectiveBinding } from 'vue'
import { usePermissionsStore } from '@/stores/modules/permissions'

/**
 * 检查是否有权限
 */
function hasPermission(value: string | string[]): boolean {
  const permissionsStore = usePermissionsStore()

  if (!value) {
    console.warn('[v-permission] 权限码不能为空')
    return false
  }

  const permissions = permissionsStore.permissions || []

  // 如果权限列表为空，认为有权限（兼容未配置权限的情况）
  if (permissions.length === 0) {
    return true
  }

  // 支持字符串和数组
  const permissionList = Array.isArray(value) ? value : [value]

  // 只要有一个权限码满足即可
  return permissionList.some(permission => permissions.includes(permission))
}

/**
 * 权限指令实现
 */
const permission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding

    if (!hasPermission(value)) {
      // 移除元素
      el.parentNode?.removeChild(el)
    }
  },

  updated(el: HTMLElement, binding: DirectiveBinding) {
    const { value, oldValue } = binding

    if (value === oldValue) return

    if (!hasPermission(value)) {
      // 移除元素
      el.parentNode?.removeChild(el)
    }
  }
}

export default permission
