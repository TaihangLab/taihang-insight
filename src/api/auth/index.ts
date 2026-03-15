/**
 * 认证服务 API
 * 处理用户信息、权限、菜单的获取
 * 注意：缓存由 Pinia 持久化插件自动管理
 */

import { createAuthAPI } from "./authAPI";
import type { AuthInfoResponse, AuthPermissionsResponse, MenuItem } from "@/types/auth";

// 导出单例实例
export const authAPI = createAuthAPI();

// 导出类型
export type * from "@/types/auth";

/**
 * 获取用户基本信息
 * 注意：响应拦截器已提取 data.data，response 直接是内层数据
 */
export async function getUserInfo(forceRefresh = false): Promise<AuthInfoResponse | null> {
  try {
    const response = await authAPI.getUserInfo();
    if (response && response.user_id) {
      return response;
    }
    return null;
  } catch (error) {
    console.error("获取用户信息失败:", error);
    throw error;
  }
}

/**
 * 获取权限码列表
 * 注意：响应拦截器已提取 data.data，response 直接是内层数据
 */
export async function getPermissions(forceRefresh = false): Promise<string[]> {
  try {
    const response = await authAPI.getPermissions();
    if (response && response.permission_codes) {
      return response.permission_codes || [];
    }
    return [];
  } catch (error) {
    console.error("获取权限码失败:", error);
    throw error;
  }
}

/**
 * 获取菜单树
 * 后端返回结构：{ code: 200, data: { user_id, user_name, menu_tree: MenuItem[] } }
 * 注意：响应拦截器已提取 data.data，response 直接是内层数据
 */
export async function getMenuTree(forceRefresh = false): Promise<MenuItem[] | null> {
  try {
    const response = await authAPI.getMenuTree();
    if (response && response.menu_tree) {
      return response.menu_tree;
    }
    return null;
  } catch (error) {
    console.error("获取菜单树失败:", error);
    throw error;
  }
}

/**
 * 批量获取用户认证信息（用于登录后刷新）
 */
export async function fetchAllAuthInfo(forceRefresh = false) {
  const [userInfo, permissions, menuTree] = await Promise.all([
    getUserInfo(forceRefresh),
    getPermissions(forceRefresh),
    getMenuTree(forceRefresh),
  ]);

  return {
    userInfo,
    permissions,
    menuTree,
  };
}
