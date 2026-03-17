/**
 * 动态菜单 Composable
 * 根据后端返回的菜单树生成侧边栏菜单
 */

import { computed } from "vue";
import { useMenusStore } from "@/stores/modules/menus";
import type { MenuItem, RawMenuItem } from "@/types/auth";

/**
 * 标准化菜单项：将后端字段名转换为前端期望的字段名
 */
function normalizeMenuItem(item: RawMenuItem): MenuItem {
  return {
    ...item,
    menu_name: item.permission_name || item.menu_name || "",
    menu_type: (item.permission_type || item.menu_type || "menu") as "folder" | "menu" | "button",
    menu_code: item.permission_code || item.menu_code,
    children: item.children ? item.children.map(normalizeMenuItem) : undefined,
  };
}

/**
 * 菜单类型映射
 */
const MenuType = {
  FOLDER: "folder", // 文件夹（不对应页面）
  MENU: "menu", // 菜单项（对应页面）
  BUTTON: "button", // 按钮（不在菜单中显示）
} as const;

/**
 * 过滤菜单项（只显示文件夹和菜单，隐藏按钮）
 */
function filterMenuItems(items: RawMenuItem[] | null | undefined): RawMenuItem[] {
  // 安全检查：确保 items 是数组
  if (!Array.isArray(items)) {
    console.warn("[useDynamicMenu] menuTree is not an array:", items);
    return [];
  }

  return items.filter((item) => {
    // 只显示启用的菜单项（status 为 0 或未设置时显示）
    // 注意：后端可能使用 0 表示启用，或 1 表示启用，这里兼容两种情况
    if (item.status !== undefined && item.status !== 0 && item.status !== 1) {
      return false;
    }

    // 获取菜单类型（支持 permission_type 和 menu_type 两种字段名）
    const menuType = item.permission_type || item.menu_type;

    // 过滤掉按钮类型
    if (menuType === MenuType.BUTTON) return false;

    // 过滤掉设置为不可见的菜单
    // 处理各种可能的假值：false, 0, "0", "false"
    // 使用类型断言来兼容后端可能返回的各种类型
    const visibleValue = item.visible;
    if (
      visibleValue === false ||
      (visibleValue as any) === 0 ||
      (visibleValue as any) === "0" ||
      (visibleValue as any) === "false"
    ) {
      return false;
    }

    return true;
  });
}

/**
 * 递归处理菜单树
 */
function processMenuTree(items: RawMenuItem[] | null | undefined): MenuItem[] {
  const filteredItems = filterMenuItems(items);

  return filteredItems.map((item) => {
    const normalized = normalizeMenuItem(item);
    return {
      ...normalized,
      icon: normalized.icon,
      children: Array.isArray(item.children) ? processMenuTree(item.children) : undefined,
    };
  });
}

/**
 * 使用动态菜单
 */
export function useDynamicMenu() {
  const menusStore = useMenusStore();

  /**
   * 处理后的菜单树
   */
  const menuTree = computed(() => {
    const rawMenuTree = menusStore.getMenuTreeSync() || [];

    if (rawMenuTree.length === 0) {
      return [];
    }

    return processMenuTree(rawMenuTree);
  });

  /**
   * 是否有菜单数据
   */
  const hasMenu = computed(() => menuTree.value.length > 0);

  /**
   * 查找菜单项
   */
  function findMenuItem(path: string, items: MenuItem[] = menuTree.value): MenuItem | null {
    for (const item of items) {
      if (item.path === path) {
        return item;
      }

      if (item.children?.length) {
        const found = findMenuItem(path, item.children);
        if (found) return found;
      }
    }

    return null;
  }

  /**
   * 获取面包屑导航
   */
  function getBreadcrumb(path: string): MenuItem[] {
    const breadcrumb: MenuItem[] = [];

    function traverse(items: MenuItem[], currentPath: string, ancestors: MenuItem[] = []) {
      for (const item of items) {
        const currentAncestors = [...ancestors, item];

        if (item.path === currentPath) {
          breadcrumb.push(...currentAncestors);
          return true;
        }

        if (item.children?.length) {
          if (traverse(item.children, currentPath, currentAncestors)) {
            return true;
          }
        }
      }

      return false;
    }

    traverse(menuTree.value, path);

    return breadcrumb;
  }

  return {
    menuTree,
    hasMenu,
    findMenuItem,
    getBreadcrumb,
  };
}
