/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'data-view-vue3' {
  const dataV: any
  export default dataV
}

declare module 'vue-contextmenujs' {
  const contextmenu: any
  export default contextmenu
}

// 声明全局变量
declare const browserId: string

// 扩展 Window 接口
interface Window {
  $myServerId?: string
  videojs?: any
}

// jQuery 类型
declare const $: any
declare const jQuery: any

// Jessibuca 播放器
declare const Jessibuca: any

// EasyWasmPlayer
declare const EasyWasmPlayer: any

// ZLMRTCClient
declare const ZLMRTCClient: any

// h265webjs
declare const h265webjs: any
declare const missile: any
