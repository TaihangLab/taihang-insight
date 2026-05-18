/**
 * Token 与用户信息存取（统一键名 taihang-token / taihang-user）
 *
 * 保留旧键 wvp-login-status / wvp-user 的读取兼容，便于灰度迁移。
 */

const TOKEN_KEY = 'taihang-token'
const USER_KEY = 'taihang-user'
const LEGACY_TOKEN_KEY = 'wvp-login-status'
const LEGACY_USER_KEY = 'wvp-user'

export function getToken () {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY)
}

export function setToken (token) {
  if (!token) {
    return
  }
  localStorage.setItem(TOKEN_KEY, token)
  // 同步写一份到旧键，保持老代码可工作
  localStorage.setItem(LEGACY_TOKEN_KEY, token)
}

export function removeToken () {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(LEGACY_TOKEN_KEY)
}

export function getUser () {
  try {
    const raw = localStorage.getItem(USER_KEY) || localStorage.getItem(LEGACY_USER_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (e) {
    return {}
  }
}

export function setUser (user) {
  const value = JSON.stringify(user || {})
  localStorage.setItem(USER_KEY, value)
  localStorage.setItem(LEGACY_USER_KEY, value)
}

export function removeUser () {
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(LEGACY_USER_KEY)
}
