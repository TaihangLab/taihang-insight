/**
 * 认证管理模块
 * 提供统一的登录/登出操作
 *
 * 设计原则：
 * 1. 解耦 logout 逻辑，避免循环依赖
 * 2. 各 store 负责自己的清除逻辑
 * 3. 提供统一的入口点
 */

import { useTokenStore } from "./token";
import { useUserInfoStore } from "./userInfo";
import { usePermissionsStore } from "./permissions";
import { useMenusStore } from "./menus";
import { useAppStore } from "./app";
import { storage } from "./storage";

/**
 * 统一登出操作
 * 清除所有认证相关数据和用户偏好设置
 */
export async function logout(): Promise<void> {
  try {
    console.log("[Auth] 开始登出流程...");

    // 1. 清除 token（认证数据）
    const tokenStore = useTokenStore();
    tokenStore.clearTokens();
    console.log("[Auth] Token 已清除");

    // 2. 清除用户信息
    const userInfoStore = useUserInfoStore();
    userInfoStore.clearUserInfo();
    console.log("[Auth] 用户信息已清除");

    // 3. 清除权限
    const permissionsStore = usePermissionsStore();
    permissionsStore.clearPermissions();
    console.log("[Auth] 权限已清除");

    // 4. 清除菜单
    const menusStore = useMenusStore();
    menusStore.clearMenuTree();
    console.log("[Auth] 菜单已清除");

    // 5. 重置动态路由标记
    const appStore = useAppStore();
    appStore.resetDynamicRoutes();
    console.log("[Auth] 动态路由已重置");

    // 6. 清除 storage 中的用户偏好和业务数据
    storage.clearUserData();
    console.log("[Auth] 用户偏好和业务数据已清除");

    // 7. 动态导入并重置路由
    await import("@/router").then(({ resetAsyncRoutes }) => {
      resetAsyncRoutes();
      console.log("[Auth] 路由已重置");
    });

    console.log("[Auth] 登出完成");
  } catch (error) {
    console.error("[Auth] 登出过程中发生错误:", error);
    throw error;
  }
}

/**
 * 检查是否已登录
 */
export function isLoggedIn(): boolean {
  const tokenStore = useTokenStore();
  return tokenStore.hasAnyToken();
}

/**
 * 刷新所有认证数据
 */
export async function refreshAuthData(): Promise<void> {
  console.log("[Auth] 开始刷新认证数据...");

  try {
    const [userInfo, permissions, menus] = await Promise.all([
      useUserInfoStore().refresh(),
      usePermissionsStore().refresh(),
      useMenusStore().refresh(),
    ]);

    console.log("[Auth] 认证数据刷新完成");
  } catch (error) {
    console.error("[Auth] 刷新认证数据失败:", error);
    throw error;
  }
}

// 导出类型
export type * from "./token";
