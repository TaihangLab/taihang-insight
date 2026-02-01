/**
 * User Info Store
 * 管理用户基本信息
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserInfo } from '@/types/auth'
import { StorageKey } from './storageKeys'

export const useUserInfoStore = defineStore('userInfo', () => {
  // 用户信息
  const userInfo = ref<UserInfo | null>(null)

  /**
   * 设置用户信息
   */
  function setUserInfo(info: UserInfo) {
    userInfo.value = info
  }

  /**
   * 清除用户信息
   */
  function clearUserInfo() {
    userInfo.value = null
  }

  /**
   * 获取用户昵称
   */
  function getNickName(): string {
    return userInfo.value?.nick_name || userInfo.value?.user_name || ''
  }

  return {
    userInfo,
    setUserInfo,
    clearUserInfo,
    getNickName
  }
}, {
  persist: {
    key: StorageKey.USER_INFO,
    storage: localStorage
  }
})
