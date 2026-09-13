import axios from 'axios'
const config = require('../../../config/index.js')

const AUTH_URL = config.API_BASE_URL + '/api/v1/auth'

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

  isAdmin() {
    const user = this.getUser() || {};
    return !!user.is_admin;
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

  applyAuthResult(data) {
    const payload = data || {};
    const user = payload.user || {};
    this.setUser(user);
    this.setToken(payload.access_token);
    this.setLsCookie(user.username);
    return user;
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
  },

  authHeaders() {
    const token = this.getToken();
    return token ? { 'access-token': token } : {};
  },

  login(username, password) {
    return axios.post(AUTH_URL + '/login', { username, password }, { timeout: 15000 })
      .then((res) => this.applyAuthResult(res.data));
  },

  fetchMe() {
    return axios.get(AUTH_URL + '/me', {
      timeout: 15000,
      headers: this.authHeaders()
    }).then((res) => {
      const user = res.data || {};
      this.setUser(user);
      return user;
    });
  },

  changePassword(oldPassword, newPassword) {
    return axios.post(AUTH_URL + '/change-password', {
      old_password: oldPassword,
      new_password: newPassword
    }, {
      timeout: 15000,
      headers: this.authHeaders()
    });
  },

  listUsers() {
    return axios.get(AUTH_URL + '/users', {
      timeout: 15000,
      headers: this.authHeaders()
    }).then((res) => res.data || []);
  },

  createUser(payload) {
    return axios.post(AUTH_URL + '/users', payload, {
      timeout: 15000,
      headers: this.authHeaders()
    }).then((res) => res.data);
  },

  updateUser(userId, payload) {
    return axios.patch(AUTH_URL + '/users/' + userId, payload, {
      timeout: 15000,
      headers: this.authHeaders()
    }).then((res) => res.data);
  },

  resetPassword(userId, newPassword) {
    return axios.post(AUTH_URL + '/users/' + userId + '/reset-password', {
      new_password: newPassword
    }, {
      timeout: 15000,
      headers: this.authHeaders()
    });
  }
}
