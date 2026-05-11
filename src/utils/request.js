/*
 * @Descripttion: 
 */
import axios from 'axios'

// 兼容层：nacos 分支 API 仍在 import '@/utils/request'
// 这里不再维护独立 axios 实例，统一复用 main.js 中配置的全局 axios
// （baseURL/withCredentials 等以 main.js 为准）
export default function request(config) {
  return axios(config)
}

