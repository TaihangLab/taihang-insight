// API 基础配置
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? (window.baseUrl || '') 
  : 'http://localhost:8000/api/v1'

// API 版本
export const API_VERSION = 'v1'

// 请求超时时间
export const REQUEST_TIMEOUT = 60000

// 代理配置
export const PROXY_CONFIG = {
  '/api': {
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
    pathRewrite: {
      '^/api': '/api/v1'
    }
  }
}

export default {
  API_BASE_URL,
  API_VERSION,
  REQUEST_TIMEOUT,
  PROXY_CONFIG
}