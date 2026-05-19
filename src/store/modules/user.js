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
  permissions: [],
  tenantId: '',
  dynamicTenantId: ''
}

const mutations = {
  SET_TOKEN: (s, token) => {
    s.token = token
  },
  SET_USER_INFO: (s, user) => {
    s.userInfo = user || {}
    if (user && user.tenantId) {
      s.tenantId = user.tenantId
    } else if (user && user.tenant_id) {
      s.tenantId = user.tenant_id
    }
  },
  SET_ROLES: (s, roles) => {
    s.roles = roles || []
  },
  SET_PERMISSIONS: (s, perms) => {
    s.permissions = perms || []
  },
  SET_TENANT_ID: (s, tid) => {
    s.tenantId = tid || ''
  },
  SET_DYNAMIC_TENANT_ID: (s, tid) => {
    s.dynamicTenantId = tid || ''
  },
  RESET: (s) => {
    s.token = ''
    s.userInfo = {}
    s.roles = []
    s.permissions = []
    s.tenantId = ''
    s.dynamicTenantId = ''
  }
}

const actions = {
  /**
   * 登录
   * @param {Object} payload { username, password, code, uuid, tenantId }
   */
  Login ({ commit }, payload) {
    return new Promise((resolve, reject) => {
      loginApi({
        username: (payload.username || '').trim(),
        password: payload.password,
        code: payload.code,
        uuid: payload.uuid,
        tenantId: payload.tenantId || ''
      }).then(res => {
        const data = res.data || {}
        const token = data.access_token
        if (!token) {
          reject(new Error('登录响应缺少 access_token'))
          return
        }
        commit('SET_TOKEN', token)
        setToken(token)
        if (payload.tenantId) {
          commit('SET_TENANT_ID', payload.tenantId)
        }
        resolve(data)
      }).catch(err => reject(err))
    })
  },

  /** 注册 */
  Register (_ctx, payload) {
    return registerApi(payload)
  },

  /** 获取登录用户信息（user / roles / permissions） */
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
        // 多租户：恢复账号所属租户与超管动态切换状态（刷新页面后仍能从后端 Redis 读回）
        if (data.homeTenantId) {
          commit('SET_TENANT_ID', data.homeTenantId)
        }
        commit('SET_DYNAMIC_TENANT_ID', data.dynamicTenantId || '')
        setUser(user)
        resolve({ user, roles, permissions })
      }).catch(err => reject(err))
    })
  },

  /** 注销 */
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

  /** 强制本地清空（用于 token 失效等） */
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
