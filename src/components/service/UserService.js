import RBACService from './RBACService';

export default {

  setUser(user){
    localStorage.setItem("wvp-user", JSON.stringify(user));
  },

  getUser(){
    return JSON.parse(localStorage.getItem("wvp-user")) || {};
  },

  clearUserInfo(){
    localStorage.removeItem("wvp-user");
  },

  getToken(){
    return localStorage.getItem("wvp-token");
  },

  getAdminToken() {
    return localStorage.getItem("Admin-Token");
  },

  setToken(token) {
    localStorage.setItem("wvp-token", token);
  },

  clearToken(){
    localStorage.removeItem("wvp-token");
    localStorage.removeItem("wvp-user");

    // 清理RBAC服务缓存，避免登出后仍显示之前用户的缓存数据
    RBACService.clearCache();
  }
}
