/**
 * 自定义指令入口
 */

import type { App } from 'vue'
import permission from './permission'

/**
 * 注册所有自定义指令
 */
export function setupDirectives(app: App) {
  // 注册权限指令
  app.directive('permission', permission)
}

// 导出单个指令（按需导入）
export { default as permission } from './permission'
