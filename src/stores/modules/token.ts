/**
 * Token Store
 * 管理 JWT Token
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTokenStore = defineStore('token', () => {
  // Token
  const token = ref('')

  /**
   * 设置 Token
   */
  function setToken(newToken: string) {
    token.value = newToken
  }

  /**
   * 清除 Token
   */
  function clearToken() {
    token.value = ''
  }

  /**
   * 检查是否有 Token
   */
  function hasToken(): boolean {
    return !!token.value
  }

  return {
    token,
    setToken,
    clearToken,
    hasToken
  }
}, {
  persist: {
    key: 'taihang-token',
    storage: localStorage
  }
})
