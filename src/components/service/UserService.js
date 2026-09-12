
export default {

  /**
   * 存储用户信息 - 保留用于页面显示
   */
  setUser(user){
    localStorage.setItem("taihang-user", JSON.stringify(user || {}));
  },

  /**
   * 获取用户信息 - 保留用于页面显示
   */
  getUser(){
    const raw = localStorage.getItem("taihang-user");
    return raw ? JSON.parse(raw) : {};
  },

  /**
   * 清理用户信息
   */
  clearUserInfo(){
    localStorage.removeItem("taihang-user");
  },

  getToken(){
    return localStorage.getItem("token") || localStorage.getItem("taihang-login-status");
  },

  setToken(token) {
    const value = token || "";
    localStorage.setItem("taihang-login-status", value);
    localStorage.setItem("token", value);
  },

  clearLoginStatus(){
    localStorage.removeItem("taihang-login-status");
    localStorage.removeItem("token");
    this.clearLsCookie();
  },

  setLsCookie(username) {
    if (!username) return;
    document.cookie = "myapp_username=" + encodeURIComponent(username) + "; path=/; SameSite=Lax";
  },

  clearLsCookie() {
    document.cookie = "myapp_username=; path=/; max-age=0";
  }
}
