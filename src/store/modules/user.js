import {
  getUserInfo,
  login as loginApi,
  logout as logoutApi,
  register as registerApi
} from '@/api/auth'
import {
  getToken,
  setToken,
  removeToken,
  setUser,
  removeUser
} from '@/utils/auth'

const state = {
  token: getToken() || '',
  userInfo: {},
  roles: [],
  permissions: []
}

const mutations = {
  SET_TOKEN: (s, token) => {
    s.token = token
  },
  SET_USER_INFO: (s, user) => {
    s.userInfo = user || {}
  },
  SET_ROLES: (s, roles) => {
    s.roles = roles || []
  },
  SET_PERMISSIONS: (s, perms) => {
    s.permissions = perms || []
  },
  RESET: (s) => {
    s.token = ''
    s.userInfo = {}
    s.roles = []
    s.permissions = []
  }
}

const actions = {
  Login ({ commit }, payload) {
    return new Promise((resolve, reject) => {
      loginApi({
        username: (payload.username || '').trim(),
        password: payload.password,
        code: payload.code,
        uuid: payload.uuid
      }).then(res => {
        const data = res.data || {}
        const token = data.access_token
        if (!token) {
          reject(new Error('登录响应缺少 access_token'))
          return
        }
        commit('SET_TOKEN', token)
        setToken(token)
        resolve(data)
      }).catch(err => reject(err))
    })
  },

  Register (_ctx, payload) {
    return registerApi(payload)
  },

  GetInfo ({ commit }) {
    return new Promise((resolve, reject) => {
      getUserInfo().then(res => {
        const data = res.data || {}
        const user = data.user || {}
        const roles = data.roles || []
        const permissions = data.permissions || []
        commit('SET_USER_INFO', user)
        commit('SET_ROLES', roles)
        commit('SET_PERMISSIONS', permissions)
        setUser(user)
        resolve({ user, roles, permissions })
      }).catch(err => reject(err))
    })
  },

  LogOut ({ commit }) {
    return new Promise((resolve) => {
      logoutApi().catch(() => {}).finally(() => {
        commit('RESET')
        removeToken()
        removeUser()
        resolve()
      })
    })
  },

  ResetLocal ({ commit }) {
    commit('RESET')
    removeToken()
    removeUser()
  }
}

export default {
  namespaced: false,
  state,
  mutations,
  actions
}
