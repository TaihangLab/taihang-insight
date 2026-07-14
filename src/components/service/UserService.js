
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
    return raw ? JSON.parse(raw) : {};
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
  }
}
