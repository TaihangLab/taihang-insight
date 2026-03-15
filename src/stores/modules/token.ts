/**
 * Token Store
 * 统一管理所有 Token 和认证相关信息
 *
 * 设计原则：
 * 1. 集中管理 adminToken、wvpToken、wvpUser 等认证数据
 * 2. 使用 pinia-plugin-persistedstate 统一持久化
 * 3. 提供类型安全的访问方法
 */

import { defineStore } from "pinia";
import { ref } from "vue";
import { StorageKey } from "./storageKeys";

/** WVP 用户信息类型 */
export interface WvpUser {
  id?: number;
  username?: string;
  name?: string;
  [key: string]: unknown;
}

export const useTokenStore = defineStore(
  "token",
  () => {
    // ==================== 状态 ====================
    /** 管理员 Token（base64 字符串） */
    const adminToken = ref("");

    /** WVP Token */
    const wvpToken = ref("");

    /** WVP 用户信息 */
    const wvpUser = ref<WvpUser | null>(null);

    // ==================== Admin Token 方法 ====================

    /**
     * 设置管理员 Token
     */
    function setAdminToken(token: string) {
      adminToken.value = token;
    }

    /**
     * 获取管理员 Token
     */
    function getAdminToken(): string {
      return adminToken.value;
    }

    /**
     * 移除管理员 Token
     */
    function removeAdminToken() {
      adminToken.value = "";
    }

    /**
     * 检查是否有管理员 Token
     */
    function hasAdminToken(): boolean {
      return !!adminToken.value;
    }

    // ==================== WVP Token 方法 ====================

    /**
     * 设置 WVP Token
     */
    function setWvpToken(token: string) {
      wvpToken.value = token;
    }

    /**
     * 获取 WVP Token
     */
    function getWvpToken(): string {
      return wvpToken.value;
    }

    /**
     * 移除 WVP Token
     */
    function removeWvpToken() {
      wvpToken.value = "";
    }

    /**
     * 检查是否有 WVP Token
     */
    function hasWvpToken(): boolean {
      return !!wvpToken.value;
    }

    // ==================== WVP User 方法 ====================

    /**
     * 设置 WVP 用户信息
     */
    function setWvpUser(user: WvpUser | null) {
      wvpUser.value = user;
    }

    /**
     * 获取 WVP 用户信息
     */
    function getWvpUser(): WvpUser | null {
      return wvpUser.value;
    }

    /**
     * 移除 WVP 用户信息
     */
    function removeWvpUser() {
      wvpUser.value = null;
    }

    // ==================== 通用方法 ====================

    /**
     * 清除所有认证信息
     * 注意：不清除 userInfo/permissions/menus，由各 store 自己管理
     */
    function clearTokens() {
      adminToken.value = "";
      wvpToken.value = "";
      wvpUser.value = null;
    }

    /**
     * 检查是否有任何认证信息
     */
    function hasAnyToken(): boolean {
      return !!adminToken.value || !!wvpToken.value;
    }

    return {
      // 状态
      adminToken,
      wvpToken,
      wvpUser,
      // Admin Token 方法
      setAdminToken,
      getAdminToken,
      removeAdminToken,
      hasAdminToken,
      // WVP Token 方法
      setWvpToken,
      getWvpToken,
      removeWvpToken,
      hasWvpToken,
      // WVP User 方法
      setWvpUser,
      getWvpUser,
      removeWvpUser,
      // 通用方法
      clearTokens,
      hasAnyToken,
    };
  },
  {
    persist: {
      key: StorageKey.AUTH,
      storage: localStorage,
      pick: ["adminToken", "wvpToken", "wvpUser"],
    },
  },
);
