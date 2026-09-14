
function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') {
    return {}
  }

  try {
    const normalizedToken = token.replace(/^Bearer\s+/i, '').trim()
    const payload = normalizedToken.split('.')[1]
    if (!payload) {
      return {}
    }

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const binaryPayload = window.atob(paddedBase64)
    const encodedPayload = Array.prototype.map.call(binaryPayload, (character) => {
      return `%${(`00${character.charCodeAt(0).toString(16)}`).slice(-2)}`
    }).join('')

    return JSON.parse(decodeURIComponent(encodedPayload))
  } catch (error) {
    return {}
  }
}

function formatUserDisplayName(user, fallback = '系统用户') {
  const userName = user && (user.userName || user.username)
  const nickName = user && (user.nickName || user.nickname)

  if (userName && nickName) {
    return `${userName}/${nickName}`
  }
  return userName || nickName || fallback
}

export default {

  /**
   * 存储用户信息 - 保留用于页面显示
   */
  setUser(user){
    localStorage.setItem("taihang-user", JSON.stringify(user));
  },

  /**
   * 获取用户信息 - 保留用于页面显示
   */
  getUser(){
    const raw = localStorage.getItem("taihang-user");
    try {
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  },

  /**
   * 从上游平台写入的 JWT Token 中读取用户信息，仅用于前端展示。
   */
  getTokenUser(){
    return decodeJwtPayload(this.getAdminToken() || this.getToken());
  },

  /**
   * Token 信息优先，兼容本地登录时保存的 taihang-user。
   */
  getCurrentUser(){
    return {
      ...this.getUser(),
      ...this.getTokenUser()
    };
  },

  getUserDisplayName(fallback = '系统用户'){
    return formatUserDisplayName(this.getCurrentUser(), fallback);
  },

  /**
   * 清理用户信息
   */
  clearUserInfo(){
    localStorage.removeItem("taihang-user");
  },

  getToken(){
    return localStorage.getItem("taihang-login-status");
  },

  setToken(token) {
    localStorage.setItem("taihang-login-status", token || "logged-in");
  },

  clearLoginStatus(){
    localStorage.removeItem("taihang-login-status");
  },

  getAdminToken() {
    return localStorage.getItem("Admin-Token");
  },

  /**
   * nacos 没有慧眼自管 is_admin。
   * 若 JWT/本地用户带 is_admin 则沿用；否则已登录（上游 Token 或模拟登录）即可进入管理页，
   * 后端仍会按 AUTH_LABEL_ADMIN_USERS 白名单拦截开放 API 写操作。
   */
  isAdmin() {
    const user = this.getCurrentUser() || {};
    if (typeof user.is_admin === 'boolean') {
      return user.is_admin;
    }
    return !!(this.getAdminToken() || this.getToken());
  },

  clearToken() {
    this.clearLoginStatus();
    this.clearUserInfo();
    this.clearLsCookie();
  },

  setLsCookie(username) {
    if (!username) return;
    document.cookie = "myapp_username=" + encodeURIComponent(username) + "; path=/; SameSite=Lax";
  },

  clearLsCookie() {
    document.cookie = "myapp_username=; path=/; max-age=0";
  },

  syncLsCookieFromCurrentUser() {
    const user = this.getCurrentUser() || {};
    const login = user.userName || user.username || user.email;
    this.setLsCookie(login);
  }
}
