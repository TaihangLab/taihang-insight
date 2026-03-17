/**
 * 认证 API 实现
 *
 * 注意：
 * 1. 使用两个独立的 axios 实例：unAuthAxios（无需认证）和 authAxios（需要认证）
 * 2. login 等公开接口使用 unAuthAxios
 * 3. 其他接口使用 authAxios，自动添加 token
 * 4. 使用自定义响应拦截器处理 401 错误和登录页面跳转
 *
 * 认证接口（/api/v1/auth）：
 * - GET /api/v1/auth/info - 获取用户权限信息
 * - GET /api/v1/auth/permissions - 获取权限码列表
 * - GET /api/v1/auth/menu - 获取菜单树
 * - GET /api/v1/auth/user-info - 获取用户信息
 * - POST /api/v1/auth/change-password - 修改密码
 * - POST /api/v1/auth/reset-password - 重置密码
 * - POST /api/v1/auth/refresh-token - 刷新令牌
 * - GET /api/v1/auth/cache/stats - 缓存统计
 * - POST /api/v1/auth/cache/clear - 清除缓存
 * - POST /api/v1/auth/user-info/refresh - 刷新用户态
 * - POST /api/v1/auth/permissions/init - 初始化权限
 */

import router from "@/router";
import { authAxios, createAxiosInstance, type AxiosInstance } from "@/api/commons";
import type {
  AuthInfoResponse,
  AuthPermissionsResponse,
  LoginRequest,
  LoginResponse,
  MenuItem,
  RefreshTokenResponse,
  RefreshUserStateResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  CacheStatsResponse,
  ClearCacheRequest,
  ClearCacheResponse,
  InitPermissionsResponse,
} from "@/types/auth";
import type { AxiosResponse } from "axios";

/**
 * 响应拦截器工厂
 * 处理 401 错误和登录页面跳转
 */
const createAuthResponseInterceptor = (instance: AxiosInstance) => {
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response.data;
    },
    (error: unknown) => {
      if ((error as { response?: { status?: number } })?.response?.status === 401) {
        // 清除认证缓存数据（保留 token，等待用户重新登录）
        try {
          const authData = localStorage.getItem("taihang-auth");
          if (authData) {
            const parsed = JSON.parse(authData);
            // 清除 userInfo, permissions, menuTree，保留 token
            parsed.userInfo = null;
            parsed.permissions = [];
            parsed.menuTree = [];
            parsed.isLoggedIn = false;
            localStorage.setItem("taihang-auth", JSON.stringify(parsed));
          }
        } catch (e) {
          console.warn("清除认证数据失败:", e);
        }

        // 使用 router 跳转到登录页，避免页面刷新导致日志丢失
        router.push("/login");
      }
      return Promise.reject(error);
    },
  );
};

/**
 * 无需认证的 axios 实例
 * 用于 login 等公开接口，只添加 clientid
 */
const unAuthAxios = createAxiosInstance(
  {
    baseURL: import.meta.env.VITE_API_BASE_URL || "",
    timeout: 10000,
  },
  {
    skipAuth: true, // 跳过 Authorization
    customResponseInterceptor: createAuthResponseInterceptor,
  },
);

/**
 * 认证 API 类
 */
class AuthAPI {
  // ==================== 认证相关 ====================

  /**
   * 用户登录（不需要 token）
   * POST /api/v1/auth/login
   */
  async login(params: LoginRequest): Promise<LoginResponse> {
    return unAuthAxios.post("/api/v1/auth/login", params);
  }

  /**
   * 刷新令牌（需要 token）
   * POST /api/v1/auth/refresh-token
   */
  async refreshToken(): Promise<RefreshTokenResponse> {
    return authAxios.post("/api/v1/auth/refresh-token");
  }

  // ==================== 用户信息相关 ====================

  /**
   * 获取用户权限信息（需要 token）
   * GET /api/v1/auth/info
   *
   * 注意：响应拦截器已提取 data.data，直接返回内层数据
   */
  async getUserInfo(): Promise<AuthInfoResponse> {
    return authAxios.get("/api/v1/auth/info");
  }

  /**
   * 获取用户信息（需要 token）
   * GET /api/v1/auth/user-info
   *
   * 注意：响应拦截器已提取 data.data，直接返回内层数据
   */
  async getUserDetail(): Promise<AuthInfoResponse> {
    return authAxios.get("/api/v1/auth/user-info");
  }

  /**
   * 刷新用户态（需要 token）
   * POST /api/v1/auth/user-info/refresh
   *
   * 用于刷新用户相关数据（ userInfo, permissions, menuTree ）
   */
  async refreshUserState(): Promise<RefreshUserStateResponse> {
    return authAxios.post("/api/v1/auth/user-info/refresh");
  }

  // ==================== 权限相关 ====================

  /**
   * 获取权限码列表（需要 token）
   * GET /api/v1/auth/permissions
   *
   * 注意：响应拦截器已提取 data.data，直接返回内层数据
   */
  async getPermissions(): Promise<AuthPermissionsResponse> {
    return authAxios.get("/api/v1/auth/permissions");
  }

  /**
   * 初始化权限（需要 token）
   * POST /api/v1/auth/permissions/init
   *
   * 用于初始化用户权限数据
   */
  async initPermissions(): Promise<InitPermissionsResponse> {
    return authAxios.post("/api/v1/auth/permissions/init");
  }

  // ==================== 菜单相关 ====================

  /**
   * 获取菜单树（需要 token）
   * GET /api/v1/auth/menu
   *
   * 后端返回结构：
   * {
   *   success: true,
   *   code: 200,
   *   message: "获取菜单树成功（超管）",
   *   data: {
   *     user_id: number,
   *     user_name: string,
   *     menu_tree: MenuItem[]
   *   }
   * }
   *
   * 注意：响应拦截器已提取 data.data，直接返回内层数据
   */
  async getMenuTree(): Promise<{
    user_id: number | string;
    user_name: string;
    menu_tree: MenuItem[];
  }> {
    return authAxios.get("/api/v1/auth/menu");
  }

  // ==================== 密码相关 ====================

  /**
   * 修改密码（需要 token）
   * POST /api/v1/auth/change-password
   *
   * @param oldPassword 旧密码
   * @param newPassword 新密码
   */
  async changePassword(params: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    return authAxios.post("/api/v1/auth/change-password", params);
  }

  /**
   * 重置密码（需要 token，管理员权限）
   * POST /api/v1/auth/reset-password
   *
   * @param userId 用户ID
   * @param newPassword 新密码
   */
  async resetPassword(params: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    return authAxios.post("/api/v1/auth/reset-password", params);
  }

  // ==================== 缓存管理 ====================

  /**
   * 获取缓存统计信息（需要 token）
   * GET /api/v1/auth/cache/stats
   *
   * 返回缓存命中率、使用情况等统计信息
   */
  async getCacheStats(): Promise<CacheStatsResponse> {
    return authAxios.get("/api/v1/auth/cache/stats");
  }

  /**
   * 清除缓存（需要 token）
   * POST /api/v1/auth/cache/clear
   *
   * @param keys 可选，指定要清除的缓存键，不传则清除所有
   */
  async clearCache(params?: ClearCacheRequest): Promise<ClearCacheResponse> {
    return authAxios.post("/api/v1/auth/cache/clear", params);
  }
}

/**
 * 创建单例实例
 */
export function createAuthAPI(): AuthAPI {
  return new AuthAPI();
}

// 导出默认实例
export default createAuthAPI();
