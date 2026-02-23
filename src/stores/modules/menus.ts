/**
 * Menus Store
 * 管理用户菜单树
 *
 * 设计原则：
 * 1. 将 API 调用和缓存逻辑封装在 Store 内部
 * 2. get 操作时自动判断是否需要刷新（数据为空时自动加载）
 * 3. 组件只需调用 refresh() 或直接使用数据，无需关心缓存
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MenuItem } from '@/types/auth'
import { StorageKey } from './storageKeys'
import authAPI from '@/api/auth/authAPI'

export const useMenusStore = defineStore('menus', () => {
  // ==================== 私有状态（不返回，外部无法直接访问） ====================
  const menuTree = ref<MenuItem[]>([])
  const loading = ref(false)
  const initialized = ref(false)

  // ==================== 公共方法 ====================

  /**
   * 从后端刷新菜单树
   * 强制刷新，不判断缓存状态
   */
  async function refresh(): Promise<void> {
    if (loading.value) return

    loading.value = true
    try {
      const result = await authAPI.getMenuTree()
      if (result.code === 200 && result.data) {
        const menu = result.data.menu_tree || []
        menuTree.value = menu
        initialized.value = true
        console.log('[MenusStore] 刷新成功:', menu.length, '个菜单')
      } else {
        menuTree.value = []
        initialized.value = true
        console.warn('[MenusStore] 接口返回失败，设置为空数组')
      }
    } catch (error) {
      menuTree.value = []
      initialized.value = true
      console.error('[MenusStore] 刷新失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 确保数据已加载（内部方法）
   */
  async function ensureInitialized(): Promise<void> {
    if (!initialized.value && !loading.value) {
      await refresh()
    }
  }

  /**
   * 设置菜单树（保留此方法用于兼容）
   */
  function setMenuTree(menu: MenuItem[] | null | undefined) {
    if (Array.isArray(menu)) {
      menuTree.value = menu
      initialized.value = true
    } else {
      menuTree.value = []
      initialized.value = true
    }
  }

  /**
   * 清除菜单树
   */
  function clearMenuTree() {
    menuTree.value = []
    initialized.value = false
  }

  /**
   * 递归查找第一个可访问的菜单（只返回 menu 类型）
   */
  async function findFirstAccessibleMenu(): Promise<string | null> {
    await ensureInitialized()

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
  async function getAccessibleRoutes(): Promise<string[]> {
    await ensureInitialized()

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
  async function hasMenuPath(path: string): Promise<boolean> {
    const routes = await getAccessibleRoutes()
    return routes.includes(path)
  }

  /**
   * 获取菜单树（带自动加载）
   * 强制使用此方法访问，确保缓存逻辑生效
   */
  async function getMenuTree(): Promise<MenuItem[]> {
    await ensureInitialized()
    return menuTree.value
  }

  /**
   * 同步版本获取菜单树（不触发自动加载）
   * 仅在确定数据已加载的场景使用
   */
  function getMenuTreeSync(): MenuItem[] {
    return menuTree.value
  }

  /**
   * 检查是否有已加载的菜单数据
   */
  function hasData(): boolean {
    return initialized.value && menuTree.value.length > 0
  }

  return {
    loading,
    refresh,
    setMenuTree,
    clearMenuTree,
    getMenuTree,
    getMenuTreeSync,
    findFirstAccessibleMenu,
    getAccessibleRoutes,
    hasMenuPath,
    hasData
  }
}, {
  persist: {
    key: StorageKey.MENUS,
    storage: localStorage
  }
})
