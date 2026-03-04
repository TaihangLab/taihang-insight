/**
 * WVP Camera API 基础配置
 * 提供专用于 WVP 摄像头设备管理的 axios 实例
 */

import { createAxiosInstance } from '@/api/commons'

/**
 * 获取 WVP API 基础 URL
 * WVP (Web Video Platform) - 视频平台 API
 */
export const getWVPAxiosBaseURL = () => {
  const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://172.16.201.80/prod-api/smart-engine'
  return `${apiBaseURL}/api/v1/wvp`
}

/**
 * 创建专用于 WVP 摄像头设备管理的 axios 实例
 * 不需要认证头，使用 WVP 平台自己的认证机制
 */
const wvpAxios = createAxiosInstance(
  {
    baseURL: getWVPAxiosBaseURL(),
    timeout: 30000, // 视频流操作超时时间更长
    withCredentials: false
  },
  {
    skipAuth: true, // 跳过 RBAC 认证，WVP 有自己的认证
    skipResponseInterceptor: true // 跳过通用响应拦截器，WVP 有自己的响应格式
  }
)

export default wvpAxios
