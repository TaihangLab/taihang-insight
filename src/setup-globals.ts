/**
 * 全局变量初始化文件
 * 必须在所有其他导入之前执行，确保 liveplayer-v3 等依赖全局变量的库正常工作
 */

// 导入 video.js 并立即设置为全局变量
import videojs from 'video.js'

// 确保 videojs 在 window 上可用（liveplayer-v3 依赖）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const window: any

if (typeof window !== 'undefined') {
  window.videojs = videojs
}

export {}
