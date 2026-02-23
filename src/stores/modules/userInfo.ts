/**
 * User Info Store
 * 管理用户基本信息
 *
 * 设计原则：
 * 1. 将 API 调用和缓存逻辑封装在 Store 内部
 * 2. get 操作时自动判断是否需要刷新（数据为空时自动加载）
 * 3. 组件只需调用 refresh() 或直接使用数据，无需关心缓存
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserInfo } from '@/types/auth'
import { StorageKey } from './storageKeys'
import authAPI from '@/api/auth/authAPI'

export const useUserInfoStore = defineStore('userInfo', () => {
  // ==================== 私有状态（不返回，外部无法直接访问） ====================
  const userInfo = ref<UserInfo | null>(null)
  const loading = ref(false)
  const initialized = ref(false)

  // ==================== 公共方法 ====================

  /**
   * 从后端刷新用户信息
   * 强制刷新，不判断缓存状态
   */
  async function refresh(): Promise<void> {
    if (loading.value) return

    loading.value = true
    try {
      const result = await authAPI.getUserInfo()
      if (result.code === 200 && result.data) {
        const userData = result.data

        // 转换为 UserInfo 格式
        userInfo.value = {
          id: userData.user_id,
          username: userData.user_name,
          user_name: userData.user_name,
          nick_name: userData.nick_name,
          email: userData.email,
          phone: userData.phone,
          avatar: userData.avatar,
          tenantId: userData.tenant_id,
          tenant_id: userData.tenant_id,
          dept_id: userData.dept_id,
          position_id: userData.position_id,
          status: userData.status,
          gender: userData.gender
        }
        initialized.value = true
        console.log('[UserInfoStore] 刷新成功:', userData.user_name)
      } else {
        userInfo.value = null
        initialized.value = true
        console.warn('[UserInfoStore] 接口返回失败')
      }
    } catch (error) {
      userInfo.value = null
      initialized.value = true
      console.error('[UserInfoStore] 刷新失败:', error)
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
   * 获取用户信息（带自动加载）
   * 强制使用此方法访问，确保缓存逻辑生效
   */
  async function getUserInfo(): Promise<UserInfo | null> {
    await ensureInitialized()
    return userInfo.value
  }

  /**
   * 设置用户信息（保留此方法用于兼容）
   */
  function setUserInfo(info: UserInfo) {
    userInfo.value = info
    initialized.value = true
  }

  /**
   * 清除用户信息
   */
  function clearUserInfo() {
    userInfo.value = null
    initialized.value = false
  }

  /**
   * 获取用户昵称（同步方法，用于模板）
   */
  function getNickName(): string {
    return userInfo.value?.nick_name || userInfo.value?.user_name || ''
  }

  /**
   * 同步版本获取用户信息（不触发自动加载）
   * 仅在确定数据已加载的场景使用
   */
  function getUserInfoSync(): UserInfo | null {
    return userInfo.value
  }

  /**
   * 检查是否有已加载的用户数据
   */
  function hasData(): boolean {
    return initialized.value && userInfo.value !== null
  }

  return {
    refresh,
    getUserInfo,
    getUserInfoSync,
    setUserInfo,
    clearUserInfo,
    getNickName,
    hasData
  }
}, {
  persist: {
    key: StorageKey.USER_INFO,
    storage: localStorage
  }
})
