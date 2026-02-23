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

const userInfoStore = useUserInfoStore()
const permissionsStore = usePermissionsStore()
const menusStore = useMenusStore()

// ========== 异步初始化函数 ==========
async function initializeApp() {
  try {
    // 1️⃣ 先建立用户态（使用 Store 的方法检查和刷新数据）
    // 使用 hasData() 方法检查持久化状态，而非直接访问 localStorage
    const hasUserInfo = userInfoStore.hasData()
    const hasPermissions = permissionsStore.hasData()
    const hasMenus = menusStore.hasData()

    if (!hasUserInfo || !hasPermissions || !hasMenus) {
      console.log('⚠️ 检测到数据不完整，开始从后端同步...')

      try {
        // 使用 Store 的 refresh() 方法，将 API 调用封装在 Store 内部
        await Promise.all([
          userInfoStore.refresh(),
          permissionsStore.refresh(),
          menusStore.refresh()
        ])
      } catch (error) {
        console.warn('⚠️ 数据恢复失败，token 可能已过期:', error)
      }
    }

    // 2️⃣ 动态导入路由模块
    const { default: router, setupAsyncRoutes } = await import('./router')

    // 3️⃣ 获取菜单树（使用 Store 的 getter 方法）
    // 此时数据已从持久化加载或从后端获取
    const menuTree = menusStore.getMenuTreeSync() || []

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

