import { getToken, removeToken } from './request'

/**
 * 检查用户是否已登录
 */
export function isLoggedIn() {
  const token = getToken()
  return !!token
}

/**
 * 验证token是否有效（可以在这里添加更复杂的验证逻辑）
 */
export function isTokenValid() {
  const token = getToken()
  
  if (!token) {
    return false
  }
  
  try {
    // 解析JWT token的payload部分
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Math.floor(Date.now() / 1000)
    
    if (payload.exp && payload.exp < currentTime) {
      return false
    }
    
    return true
  } catch (error) {
    return false
  }
}

/**
 * 退出登录
 */
export function logout() {
  removeToken()
  // 清除其他用户相关的本地存储
  localStorage.removeItem('userInfo')
  sessionStorage.clear()
}

/**
 * 检查并处理认证状态
 */
export function checkAuth() {
  if (!isTokenValid()) {
    logout()
    return false
  }
  return true
}

export default {
  isLoggedIn,
  isTokenValid,
  logout,
  checkAuth
}
