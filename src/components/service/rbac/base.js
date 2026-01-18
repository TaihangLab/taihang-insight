import axios from 'axios';
import userService from '@/components/service/UserService';

// 导入配置
const config = require('../../../../config/index.js');

// 创建专用于RBAC模块的axios实例
// 注意：如果后端没有RBAC API，则使用模拟数据或切换到主API
const rbacAxios = axios.create({
  baseURL: config.RBAC_API_BASE_URL,  // 如果后端没有RBAC API，可以切换到主API地址
  timeout: 15000,
  withCredentials: false,  // 将withCredentials设置为false，避免CORS错误
});

// 自定义参数序列化函数
rbacAxios.defaults.paramsSerializer = function (params) {
  // 将驼峰命名的参数转换为下划线命名，以兼容后端API
  const convertedParams = {};
  for (const key in params) {
    if (params[key] !== undefined) {
      // 将驼峰转换为下划线，例如：tenant_id -> tenant_id
      const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      convertedParams[snakeCaseKey] = params[key];
    }
  }

  // 自定义参数序列化逻辑，确保数组以多个同名参数形式传递
  const queryParams = [];

  for (const key in convertedParams) {
    if (convertedParams[key] !== undefined) {
      if (Array.isArray(convertedParams[key])) {
        // 对于数组参数，使用重复的键名传递每个值
        convertedParams[key].forEach(value => {
          queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        });
      } else {
        queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(convertedParams[key])}`);
      }
    }
  }

  return queryParams.join('&');
};

// 添加请求拦截器
rbacAxios.interceptors.request.use(
  config => {
    // 这里可以添加token等通用请求头
    const token = userService.getAdminToken()
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token;
    }
    config.headers['clientid'] = '02bb9cfe8d7844ecae8dbe62b1ba971a';
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 添加响应拦截器（处理UnifiedResponse格式）
rbacAxios.interceptors.response.use(
  response => {
    const data = response.data;

    // 检查是否为UnifiedResponse格式
    if (data && typeof data === 'object' && 'success' in data && 'code' in data && 'message' in data) {
      if (data.success) {
        // 请求成功，返回data字段
        return data;
      } else {
        // 请求失败，抛出错误
        const error = new Error(data.message || 'API请求失败');
        error.code = data.code;
        error.response = data;
        throw error;
      }
    }

    // 非UnifiedResponse格式，直接返回
    return data;
  },
  error => {
    // 处理响应错误
    console.error('RBAC API 请求错误:', error);
    
    // 如果是HTTP错误响应，尝试提取UnifiedResponse格式的错误消息
    if (error.response && error.response.data) {
      const data = error.response.data;
      
      // 检查是否为UnifiedResponse格式
      if (data && typeof data === 'object' && 'success' in data && 'code' in data && 'message' in data) {
        const errorMessage = data.message || 'API请求失败';
        const errorCode = data.code || error.response.status;
        
        // 创建新的错误对象，包含详细错误信息
        const customError = new Error(errorMessage);
        customError.code = errorCode;
        customError.status = error.response.status;
        customError.response = data;
        customError.originalError = error;
        
        return Promise.reject(customError);
      }
      
      // 如果是403错误，即使不是UnifiedResponse格式，也提取消息
      if (error.response.status === 403) {
        let errorMessage = '权限不足，无权限访问该资源';
        if (data && typeof data === 'object' && data.message) {
          errorMessage = data.message;
        } else if (data && typeof data === 'object' && data.detail) {
          errorMessage = data.detail;
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
        
        const customError = new Error(errorMessage);
        customError.code = 403;
        customError.status = 403;
        customError.response = error.response.data;
        customError.originalError = error;
        
        return Promise.reject(customError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default rbacAxios;