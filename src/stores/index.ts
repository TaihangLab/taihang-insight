// Pinia stores 入口文件
// 导出所有 stores 以便集中管理

export { useAppStore } from './modules/app'
export { useAlertStore } from './modules/alert'
export { useTempStore } from './modules/temp'
export { useReviewStore } from './modules/review'

// 新的独立认证 stores（替代原 useUserStore）
export { useTokenStore } from './modules/token'
export { useUserInfoStore } from './modules/userInfo'
export { usePermissionsStore } from './modules/permissions'
export { useMenusStore } from './modules/menus'

// 导出 storage 工具模块
export { default as storage } from './modules/storage'
