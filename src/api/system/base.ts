/**
 * RBAC API 基础配置
 * 提供专用于 RBAC 模块的 axios 实例
 */

import { createAxiosInstance } from '@/api/commons'

/**
 * 创建专用于 RBAC 模块的 axios 实例
 */
const rbacAxios = createAxiosInstance(
  { timeout: 15000 },
)

export default rbacAxios
