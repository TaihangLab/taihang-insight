/**
 * 动态路由 / 侧边栏菜单生成
 *
 * 后端 /system/menu/getRouters 返回若依风格的 RouterVo[]:
 *   { name, path, hidden, redirect, component, alwaysShow, meta:{title,icon,noCache,link}, children }
 *
 * 这里把它转换为 vue-router 可识别的路由对象，并保留一份纯数据 sidebarMenus 用于头部 / 侧边栏渲染。
 */
import { getRouters } from '@/api/auth'

const state = {
  routes: [],           // vue-router 可注册的动态路由
  addRoutes: [],        // 本次新增的动态路由（便于 router.addRoutes）
  sidebarMenus: []      // 用于渲染的菜单数据（保留 RouterVo 形态）
}

const mutations = {
  SET_ROUTES: (s, routes) => {
    s.addRoutes = routes
    s.routes = routes
  },
  SET_SIDEBAR_MENUS: (s, menus) => {
    s.sidebarMenus = menus || []
  },
  RESET: (s) => {
    s.routes = []
    s.addRoutes = []
    s.sidebarMenus = []
  }
}

// 因为本项目当前未引入"按 component 字符串自动定位 .vue 文件"的工程化方案，
// 这里把动态路由生成与菜单数据生成解耦：菜单数据直接用于头部渲染，
// 真正的页面组件仍依赖 router/index.js 里的静态注册。
function buildSidebarMenus (data) {
  if (!Array.isArray(data)) return []
  return data.map(item => ({
    name: item.name,
    path: item.path,
    hidden: !!item.hidden,
    icon: (item.meta && item.meta.icon) || '#',
    title: (item.meta && item.meta.title) || item.name,
    alwaysShow: !!item.alwaysShow,
    redirect: item.redirect,
    component: item.component,
    children: buildSidebarMenus(item.children || [])
  }))
}

const actions = {
  /** 拉取并生成动态路由 */
  GenerateRoutes ({ commit }) {
    return new Promise((resolve, reject) => {
      getRouters().then(res => {
        const data = res.data || []
        commit('SET_SIDEBAR_MENUS', buildSidebarMenus(data))
        commit('SET_ROUTES', [])
        resolve([])
      }).catch(err => reject(err))
    })
  },

  ResetPermission ({ commit }) {
    commit('RESET')
  }
}

export default {
  namespaced: false,
  state,
  mutations,
  actions
}
