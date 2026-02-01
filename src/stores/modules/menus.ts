/**
 * Menus Store
 * 管理用户菜单树
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MenuItem } from '@/types/auth'
import { StorageKey } from './storageKeys'

export const useMenusStore = defineStore('menus', () => {
  // 菜单树
  const menuTree = ref<MenuItem[]>([])

  /**
   * 设置菜单树
   */
  function setMenuTree(menu: MenuItem[] | null | undefined) {
    console.log('[MenusStore] 设置菜单树:', menu?.length || 0, '个')
    if (Array.isArray(menu)) {
      menuTree.value = menu
    } else {
      menuTree.value = []
    }
  }

  /**
   * 清除菜单树
   */
  function clearMenuTree() {
    menuTree.value = []
  }

  /**
   * 递归查找第一个可访问的菜单（只返回 menu 类型）
   */
  function findFirstAccessibleMenu(): string | null {
    function search(items: MenuItem[]): string | null {
      for (const item of items) {
        if (item.path && item.menu_type === 'menu') {
          return item.path
        }
        if (item.children?.length) {
          const found = search(item.children)
          if (found) return found
        }
      }
      return null
    }
    return search(menuTree.value)
  }

  /**
   * 提取所有可访问的路由（只包含 menu 类型）
   */
  function getAccessibleRoutes(): string[] {
    const routes: string[] = []

    function extract(items: MenuItem[]) {
      for (const item of items) {
        if (item.menu_type === 'menu' && item.path) {
          routes.push(item.path)
        }
        if (item.children?.length) {
          extract(item.children)
        }
      }
    }
    extract(menuTree.value)

    return routes
  }

  /**
   * 检查是否有指定路径的菜单
   */
  function hasMenuPath(path: string): boolean {
    return getAccessibleRoutes().includes(path)
  }

  return {
    menuTree,
    setMenuTree,
    clearMenuTree,
    findFirstAccessibleMenu,
    getAccessibleRoutes,
    hasMenuPath
  }
}, {
  persist: {
    key: StorageKey.MENUS,
    storage: localStorage
  }
})
