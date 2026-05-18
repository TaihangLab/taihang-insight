/**
 * UserService 兼容层
 *
 * 内部委派给 @/utils/auth，统一使用 taihang-token / taihang-user，
 * 同时仍写入旧键 wvp-user / wvp-login-status，避免老代码读取失败。
 */
import {
  getToken,
  setToken,
  removeToken,
  getUser,
  setUser,
  removeUser
} from '@/utils/auth'

export default {
  setUser (user) { setUser(user) },
  getUser () { return getUser() },
  clearUserInfo () { removeUser() },
  getToken () { return getToken() },
  setToken (token) { setToken(token || 'logged-in') },
  clearLoginStatus () { removeToken() }
}
