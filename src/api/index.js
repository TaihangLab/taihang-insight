/**
 * API统一导出入口
 * 参考若依框架的设计，将所有API按模块分类管理
 */

// 边缘管理相关API
export * from './edgeManagement'

// 算法推理相关API
export * from './algorithm'

// 可视化中心相关API
export * from './visualCenter'

// 园区管理相关API
export * from './parkManagement'

// 默认导出request实例，方便特殊场景使用
export { default as request } from './request'
