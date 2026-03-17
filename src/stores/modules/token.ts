/**
 * Token Store
 * 统一管理 token 相关操作
 *
 * 设计原则：
 * 1. Token 直接存储在 localStorage 中 (Admin-Token)
 * 2. Store 只作为访问接口，不负责持久化
 */

import { defineStore } from "pinia";
import { ref } from "vue";

export const useTokenStore = defineStore("token", () => {
  // ==================== 状态 ====================
  /** 管理员 Token（从 localStorage 读取） */
  const adminToken = ref("");

  /** WVP Token */
  const wvpToken = ref("");

  /** WVP 用户信息 */
  const wvpUser = ref<Record<string, unknown> | null>(null);

  // ==================== Admin Token 方法 ====================

  /**
   * 设置管理员 Token（同时写入 localStorage）
   */
  function setAdminToken(token: string) {
    adminToken.value = token;
    localStorage.setItem("Admin-Token", token);
  }

  /**
   * 获取管理员 Token（从 localStorage 读取）
   */
  function getAdminToken(): string {
    const token = localStorage.getItem("Admin-Token") || "";
    adminToken.value = token;
    return token;
  }

  /**
   * 移除管理员 Token
   */
  function removeAdminToken() {
    adminToken.value = "";
    localStorage.removeItem("Admin-Token");
  }

  /**
   * 检查是否有管理员 Token
   */
  function hasAdminToken(): boolean {
    return !!localStorage.getItem("Admin-Token");
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
  function setWvpUser(user: Record<string, unknown> | null) {
    wvpUser.value = user;
  }

  /**
   * 获取 WVP 用户信息
   */
  function getWvpUser(): Record<string, unknown> | null {
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
   */
  function clearTokens() {
    removeAdminToken();
    removeWvpToken();
    removeWvpUser();
  }

  /**
   * 检查是否有任何认证信息
   */
  function hasAnyToken(): boolean {
    return hasAdminToken() || hasWvpToken();
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
});
