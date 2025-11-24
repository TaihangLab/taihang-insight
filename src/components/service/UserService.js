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

  setToken(token) {
    localStorage.setItem("wvp-token", token);
  },

  clearToken(){
    localStorage.removeItem("wvp-token");
    localStorage.removeItem("wvp-user");
  }
}
