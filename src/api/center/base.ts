/**
 * VisionAI Center API 基础配置
 * 提供 axios 实例、拦截器和通用工具函数
 */

import { createAxiosInstance } from '@/api/commons'

/**
 * 创建专用于 VisionAI 模块的 axios 实例
 * 使用通用响应拦截器处理 RBACResponse 格式
 */
const authAxios = createAxiosInstance(
  { timeout: 15000 },
)

export default authAxios
