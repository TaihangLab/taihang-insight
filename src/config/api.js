/**
 * API配置文件
 * 统一管理后端服务地址
 * 兼容CommonJS和ES6模块格式
 */

// 后端API基础地址
const API_BASE_URL = 'http://192.168.26.213:8000';
// const API_BASE_URL = 'http://127.0.0.1:8000';

// 各个服务的完整地址（如果需要不同的服务地址）
const API_ENDPOINTS = {
  // 主要API服务
  MAIN_API: API_BASE_URL,

  // 如果有其他服务，可以在这里添加
  // AUTH_API: 'http://192.168.26.213:8001',
  // FILE_API: 'http://192.168.26.213:8002',
};

// 代理配置（用于webpack开发环境）
const PROXY_CONFIG = {
  '/api': {
    target: API_BASE_URL,
    changeOrigin: true,
    ws: true,
    secure: false,
    logLevel: 'debug'
  },
  '/debug': {
    target: API_BASE_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/debug': '/api/v1/wvp'
    }
  },
  '/static/snap': {
    target: API_BASE_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/static/snap': '/api/v1/wvp/static/snap'
    }
  }
};

// 导出配置
const config = {
  API_BASE_URL,
  API_ENDPOINTS,
  PROXY_CONFIG
};

// CommonJS导出（用于webpack配置文件）
module.exports = config;

// ES6导出（用于Vue组件）
// 使用try-catch来避免在CommonJS环境中执行ES6语法
try {
  if (typeof module !== 'undefined' && module.exports) {
    // 如果支持ES6，添加named exports
    module.exports.API_BASE_URL = API_BASE_URL;
    module.exports.API_ENDPOINTS = API_ENDPOINTS;
    module.exports.PROXY_CONFIG = PROXY_CONFIG;
  }
} catch (e) {
  // 忽略错误
}
