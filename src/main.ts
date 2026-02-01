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
import router from './router'
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
app.use(router)
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
// 【关键】用户态是强诉求，必须在应用挂载前完成初始化
// Pinia 持久化插件会自动从 localStorage 恢复基本数据（4 个独立的 key）
// 但我们需要验证数据完整性，如果数据不完整则同步等待恢复完成

import { useUserInfoStore, usePermissionsStore, useMenusStore } from '@/stores'
import authAPI from '@/api/auth/authAPI'
import { StorageKey } from '@/stores/modules/storageKeys'

const userInfoStore = useUserInfoStore()
const permissionsStore = usePermissionsStore()
const menusStore = useMenusStore()

// 从 4 个独立的 localStorage key 检查持久化状态
const persistedUserInfo = localStorage.getItem(StorageKey.USER_INFO)
const persistedPermissions = localStorage.getItem(StorageKey.PERMISSION)
const persistedMenus = localStorage.getItem(StorageKey.MENUS)

try {
  if ((!persistedUserInfo || !persistedPermissions || !persistedMenus)) {
    console.log('⚠️ 检测到数据不完整，开始从后端同步...')

    // 同步等待恢复完成（用户态强诉求）
    // 注意：这里使用 await 会阻塞应用挂载，但这是预期的行为
    // 因为我们需要确保用户态数据完整后再渲染应用
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

      console.log('✅ 用户态数据初始化完成')
    } catch (error) {
      console.warn('⚠️ 数据恢复失败，token 可能已过期:', error)
      // 不自动清除 token，让用户在访问时通过 401 错误处理
    }
  } 
} catch (e) {
  console.warn('⚠️ 解析持久化数据失败:', e)
}


// 【关键】挂载应用
// 此时用户态数据已完整初始化，路由守卫和组件可以安全访问
app.mount('#app')
