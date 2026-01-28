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
import ElementPlus, { ElNotification } from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import dataV from 'data-view-vue3'
// import Contextmenu from 'vue-contextmenujs' // 暂时注释 - Vue 3 不兼容
import App from './App.vue'
import router from './router'
import FpJS from '@fingerprintjs/fingerprintjs'
import axios from 'axios'

// 【已替换】FontAwesome 已替换为 UnoCSS Carbon 图标

// 导入配置
const config = {
  API_BASE_URL: 'http://172.16.201.80/prod-api/smart-engine'
}

// Axios 配置
axios.defaults.baseURL = config.API_BASE_URL + '/api/v1/wvp'
axios.defaults.withCredentials = false

// 创建应用实例
const app = createApp(App)

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用插件
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(ElementPlus)
app.use(dataV)
// app.use(Contextmenu) // 暂时注释 - vue-contextmenujs 不兼容 Vue 3，待后续使用 UnoCSS 重写

// 初始化 User Store（从 localStorage 恢复状态）
import { useUserStore } from '@/stores/modules/user'
const userStore = useUserStore()
userStore.initFromCache()

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

// 生成备用ID
function generateFallbackId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// 【性能优化】立即挂载应用，后台异步初始化
app.mount('#app')

// 后台异步初始化 - 不阻塞应用挂载
queueMicrotask(async () => {
  // 1. 异步生成浏览器指纹
  try {
    const fp = await FpJS.load()
    const result = await fp.get()
    const visitorId = result.visitorId
    app.config.globalProperties.$browserId = visitorId
    console.log('✅ 浏览器 ID:', visitorId)
  } catch (error) {
    console.warn('⚠️ 生成浏览器指纹失败，使用备用ID')
    app.config.globalProperties.$browserId = generateFallbackId()
  }

  // 2. 异步获取服务ID
  try {
    const res = await axios({
      method: 'get',
      url: config.API_BASE_URL + '/api/v1/server/system/configInfo'
    })
    if (res.data.code === 0) {
      console.log('✅ 当前服务ID:', res.data.data.addOn.serverId)
      app.config.globalProperties.$myServerId = res.data.data.addOn.serverId
    }
  } catch (error) {
    console.warn('⚠️ 获取服务ID失败（非关键错误）')
  }

  // 3. 同步权限和菜单数据（如果已登录但缓存为空）
  try {
    const token = localStorage.getItem('token')
    // 直接检查 token 而不是 isLoggedIn，因为响应式更新可能还没完成
    if (token) {
      // 检查缓存是否存在
      const cachedPermissions = localStorage.getItem('auth_permissions')
      const cachedMenu = localStorage.getItem('auth_menu')

      // 如果缓存为空，从后端同步获取
      if (!cachedPermissions || !cachedMenu) {
        console.log('🔄 本地缓存为空，从后端同步权限和菜单数据...')

        // 导入 auth 模块
        const { getPermissions, getMenuTree } = await import('@/api/auth')

        // 并行获取权限和菜单
        const [perms, menu] = await Promise.all([
          getPermissions(true),
          getMenuTree(true)
        ])

        // 存储到 localStorage
        if (perms && perms.length > 0) {
          localStorage.setItem('auth_permissions', JSON.stringify(perms))
          localStorage.setItem('auth_permissions_timestamp', Date.now().toString())
        }
        if (menu && menu.length > 0) {
          localStorage.setItem('auth_menu', JSON.stringify(menu))
          localStorage.setItem('auth_menu_timestamp', Date.now().toString())
        }

        // 重新初始化 userStore 以加载新数据
        // @ts-ignore - 忽略类型错误，运行时存在
        userStore.initFromCache()
        console.log('✅ 权限和菜单数据已同步')
      } else {
        console.log('✅ 使用本地缓存的权限和菜单数据')
      }
    }
  } catch (error) {
    console.error('⚠️ 同步权限和菜单数据失败:', error)
  }
})
