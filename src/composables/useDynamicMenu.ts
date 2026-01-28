/**
 * 动态菜单 Composable
 * 根据后端返回的菜单树生成侧边栏菜单
 */

import { computed } from 'vue'
import { useUserStore } from '@/stores/modules/user'
import type { MenuItem } from '@/types/auth'

/**
 * 菜单类型映射
 */
const MenuType = {
  FOLDER: 'folder',     // 文件夹（不对应页面）
  MENU: 'menu',         // 菜单项（对应页面）
  BUTTON: 'button'      // 按钮（不在菜单中显示）
} as const

/**
 * 图标映射（将后端返回的图标名称映射到 Element Plus 图标）
 */
const iconMap: Record<string, string> = {
  // 监控预警
  'monitoring': 'VideoCamera',
  'realtime': 'View',
  'statistics': 'DataAnalysis',
  'warning': 'Warning',
  'review': 'CircleCheck',

  // 设备配置
  'device': 'Cpu',
  'camera': 'VideoCamera',
  'video': 'VideoPlay',

  // 模型管理
  'model': 'DataAnalysis',
  'list': 'List',

  // 技能管理
  'skill': 'MagicStick',
  'multimodal': 'ChatLineSquare',

  // 系统管理
  'system': 'Setting',
  'tenant': 'OfficeBuilding',
  'user': 'User',
  'role': 'UserFilled',
  'permission': 'Lock',
  'department': 'School',
  'position': 'Stamp',
  'knowledge': 'Notebook',

  // 可视中心
  'visual': 'View',
  'algorithm': 'Connection',
  'park': 'MapLocation',

  // 默认图标
  'default': 'Menu'
}

/**
 * 获取图标组件名
 */
function getIconName(icon?: string): string {
  if (!icon) return iconMap.default

  // 支持多种图标格式
  const iconKey = icon.toLowerCase().replace(/[-_]/g, '')

  // 精确匹配
  if (iconMap[icon]) {
    return iconMap[icon]
  }

  // 模糊匹配
  for (const [key, value] of Object.entries(iconMap)) {
    if (iconKey.includes(key.toLowerCase())) {
      return value
    }
  }

  return iconMap.default
}

/**
 * 过滤菜单项（只显示文件夹和菜单，隐藏按钮）
 */
function filterMenuItems(items: MenuItem[]): MenuItem[] {
  return items.filter(item => {
    // 只显示启用的菜单项
    if (item.status !== 0) return false

    // 过滤掉按钮类型
    if (item.menu_type === MenuType.BUTTON) return false

    // 过滤掉设置为不可见的菜单
    if (item.visible === false) return false

    return true
  })
}

/**
 * 递归处理菜单树
 */
function processMenuTree(items: MenuItem[]): MenuItem[] {
  const filteredItems = filterMenuItems(items)

  return filteredItems.map(item => ({
    ...item,
    icon: getIconName(item.icon),
    children: item.children ? processMenuTree(item.children) : undefined
  }))
}

/**
 * 使用动态菜单
 */
export function useDynamicMenu() {
  const userStore = useUserStore()

  /**
   * 处理后的菜单树
   */
  const menuTree = computed(() => {
    const rawMenuTree = userStore.menuTree || []

    if (rawMenuTree.length === 0) {
      return []
    }

    return processMenuTree(rawMenuTree)
  })

  /**
   * 是否有菜单数据
   */
  const hasMenu = computed(() => menuTree.value.length > 0)

  /**
   * 查找菜单项
   */
  function findMenuItem(path: string, items: MenuItem[] = menuTree.value): MenuItem | null {
    for (const item of items) {
      if (item.path === path) {
        return item
      }

      if (item.children?.length) {
        const found = findMenuItem(path, item.children)
        if (found) return found
      }
    }

    return null
  }

  /**
   * 获取面包屑导航
   */
  function getBreadcrumb(path: string): MenuItem[] {
    const breadcrumb: MenuItem[] = []

    function traverse(items: MenuItem[], currentPath: string, ancestors: MenuItem[] = []) {
      for (const item of items) {
        const currentAncestors = [...ancestors, item]

        if (item.path === currentPath) {
          breadcrumb.push(...currentAncestors)
          return true
        }

        if (item.children?.length) {
          if (traverse(item.children, currentPath, currentAncestors)) {
            return true
          }
        }
      }

      return false
    }

    traverse(menuTree.value, path)

    return breadcrumb
  }

  return {
    menuTree,
    hasMenu,
    findMenuItem,
    getBreadcrumb
  }
}
