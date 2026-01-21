// 首先初始化全局变量（必须在所有其他导入之前）
import './setup-globals'

// 导入全局设计系统样式
import './styles/design-system.css'

// 导入 video.js 样式
import 'video.js/dist/video-js.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus, { ElNotification } from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import dataV from 'data-view-vue3'
// import Contextmenu from 'vue-contextmenujs' // 暂时注释 - Vue 3 不兼容
import App from './App.vue'
import router from './router'
import FpJS from '@fingerprintjs/fingerprintjs'
import axios from 'axios'

// 导入 font-awesome
import '@fortawesome/fontawesome-free/css/all.min.css'

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

// 全局属性
app.config.globalProperties.$axios = axios
app.config.globalProperties.$notify = ElNotification
app.config.globalProperties.$tableHeght = window.innerHeight - 170
app.config.globalProperties.$channelTypeList = {
  1: { id: 1, name: '国标设备', style: { color: '#409eff', borderColor: '#b3d8ff' } },
  2: { id: 2, name: '推流设备', style: { color: '#67c23a', borderColor: '#c2e7b0' } },
  3: { id: 3, name: '拉流代理', style: { color: '#e6a23c', borderColor: '#f5dab1' } }
}

// 生成浏览器指纹并初始化应用
async function initApp() {
  try {
    const fp = await FpJS.load()
    const result = await fp.get()
    const visitorId = result.visitorId

    // 设置浏览器 ID
    app.config.globalProperties.$browserId = visitorId
    console.log('浏览器 ID:', visitorId)

    // 获取服务ID
    try {
      const res = await axios({
        method: 'get',
        url: config.API_BASE_URL + '/api/v1/server/system/configInfo'
      })
      if (res.data.code === 0) {
        console.log('当前服务ID:', res.data.data.addOn.serverId)
        app.config.globalProperties.$myServerId = res.data.data.addOn.serverId
      }
    } catch (error) {
      console.error('获取服务ID失败:', error)
    }
  } catch (error) {
    console.error('生成浏览器指纹失败:', error)
    // 使用备用方法生成ID
    const fallbackId = Math.random().toString(36).substring(2) + Date.now().toString(36)
    app.config.globalProperties.$browserId = fallbackId
  }

  // 挂载应用
  app.mount('#app')
}

// 启动应用
initApp()
