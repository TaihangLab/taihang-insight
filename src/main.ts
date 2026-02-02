// 首先初始化全局变量（必须在所有其他导入之前）
import './setup-globals'

// 【性能优化】导入 UnoCSS 虚拟模块（按需生成样式）
import 'virtual:uno.css'

// Element Plus 基础样式（先导入默认样式）
import 'element-plus/dist/index.css'

// 【主题统一】导入 Element Plus 主题配置（后导入以覆盖默认样式）
import './styles/theme.css'

// 【按需加载】video.js 样式移到组件内导入
// import 'video.js/dist/video-js.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import ElementPlus, { ElNotification } from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import dataV from 'data-view-vue3'
// import Contextmenu from 'vue-contextmenujs' // 暂时注释 - Vue 3 不兼容
import App from './App.vue'
// import router from './router'  // ❌ 移除静态导入，改为动态导入
import axios from 'axios'

// 导入配置
const config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://172.16.201.80/prod-api/smart-engine'
}

// Axios 配置
// 如果API_BASE_URL已经包含了路径，则不重复添加
if (!config.API_BASE_URL.includes('/api/v1/wvp')) {
  axios.defaults.baseURL = config.API_BASE_URL + '/api/v1/wvp'
} else {
  axios.defaults.baseURL = config.API_BASE_URL
}
axios.defaults.withCredentials = false

// 创建应用实例
const app = createApp(App)

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用插件
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(ElementPlus)
app.use(dataV)
// app.use(Contextmenu) // 暂时注释 - vue-contextmenujs 不兼容 Vue 3，待后续使用 UnoCSS 重写

// 注册自定义指令
import { setupDirectives } from '@/directives'
setupDirectives(app)

// 全局属性
app.config.globalProperties.$axios = axios
app.config.globalProperties.$notify = ElNotification
app.config.globalProperties.$tableHeght = window.innerHeight - 170
app.config.globalProperties.$channelTypeList = {
  1: { id: 1, name: '国标设备', style: { color: '#409eff', borderColor: '#b3d8ff' } },
  2: { id: 2, name: '推流设备', style: { color: '#67c23a', borderColor: '#c2e7b0' } },
  3: { id: 3, name: '拉流代理', style: { color: '#e6a23c', borderColor: '#f5dab1' } }
}

// ========== 用户态同步初始化 ==========
// 【关键】用户态是强诉求，必须在路由创建之前完成初始化
// 这样路由守卫和组件才能正确访问用户态数据

import { useUserInfoStore, usePermissionsStore, useMenusStore } from '@/stores'
import authAPI from '@/api/auth/authAPI'
import { StorageKey } from '@/stores/modules/storageKeys'

const userInfoStore = useUserInfoStore()
const permissionsStore = usePermissionsStore()
const menusStore = useMenusStore()

// 从 3 个独立的 localStorage key 检查持久化状态
const persistedUserInfo = localStorage.getItem(StorageKey.USER_INFO)
const persistedPermissions = localStorage.getItem(StorageKey.PERMISSION)
const persistedMenus = localStorage.getItem(StorageKey.MENUS)

// ========== 异步初始化函数 ==========
async function initializeApp() {
  try {
    // 1️⃣ 先建立用户态（同步等待）
    if (!persistedUserInfo || !persistedPermissions || !persistedMenus) {
      console.log('⚠️ 检测到数据不完整，开始从后端同步...')

      try {
        const [userInfoResult, permissionsResult, menuTreeResult] = await Promise.all([
          authAPI.getUserInfo(),
          authAPI.getPermissions(),
          authAPI.getMenuTree()
        ])

        if (userInfoResult.code === 200) {
          const userData = userInfoResult.data
          userInfoStore.setUserInfo({
            id: userData.user_id,
            username: userData.user_name,
            user_name: userData.user_name,
            nick_name: userData.nick_name,
            email: userData.email,
            phone: userData.phone,
            avatar: userData.avatar,
            tenantId: userData.tenant_id,
            tenant_id: userData.tenant_id,
            dept_id: userData.dept_id,
            position_id: userData.position_id,
            status: userData.status,
            gender: userData.gender
          })
        }

        if (permissionsResult.code === 200 && permissionsResult.data) {
          const perms = permissionsResult.data.permission_codes || []
          permissionsStore.setPermissions(perms)
        }

        if (menuTreeResult.code === 200 && menuTreeResult.data) {
          const menu = menuTreeResult.data.menu_tree || []
          menusStore.setMenuTree(menu)
        }
      } catch (error) {
        console.warn('⚠️ 数据恢复失败，token 可能已过期:', error)
      }
    }
    // 2️⃣ 动态导入路由模块
    const { default: router, setupAsyncRoutes } = await import('./router')

    // 3️⃣ 从 localStorage 直接读取菜单数据（确保不受 Pinia 持久化延迟影响）
    let menuTree = menusStore.menuTree || []

    // 如果 store 为空，直接从 localStorage 读取
    if (menuTree.length === 0 && persistedMenus) {
      try {
        const parsed = JSON.parse(persistedMenus)
        menuTree = parsed.menuTree || []
      } catch (e) {
        console.warn('⚠️ 解析 localStorage 菜单数据失败:', e)
      }
    }

    // 4️⃣ 根据菜单建立动态路由（在 app.use(router) 之前！）
    if (menuTree.length > 0) {
      setupAsyncRoutes(menuTree)
    } else {
      console.warn('⚠️ 菜单树为空，跳过动态路由建立')
    }

    // 5️⃣ 注册路由（此时动态路由已存在）
    app.use(router)

    // 6️⃣ 挂载应用
    app.mount('#app')

  } catch (e) {
    console.error('❌ 应用初始化失败:', e)
    // 即使失败也尝试挂载应用，让用户看到错误界面
    app.mount('#app')
  }
}

// ========== 启动应用 ==========
initializeApp()

