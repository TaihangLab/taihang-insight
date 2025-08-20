
export default {

  /**
   * 存储用户信息 - 保留用于页面显示
   */
  setUser(user){
    localStorage.setItem("wvp-user", JSON.stringify(user));
  },

  /**
   * 获取用户信息 - 保留用于页面显示
   */
  getUser(){
    return JSON.parse(localStorage.getItem("wvp-user")) || {};
  },

  /**
   * 清理用户信息
   */
  clearUserInfo(){
    localStorage.removeItem("wvp-user");
  },

  // 登录状态管理 - 用于前端页面刷新状态保持
  getToken(){
    return localStorage.getItem("wvp-login-status");
  },

  setToken(token) {
    localStorage.setItem("wvp-login-status", token || "logged-in");
  },

  // 清理登录状态
  clearLoginStatus(){
    localStorage.removeItem("wvp-login-status");
  }
}
