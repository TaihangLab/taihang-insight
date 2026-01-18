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
    // 处理响应错误 - 添加详细的调试日志
    console.error('RBAC API 请求错误:', error);
    console.error('错误详情:', {
      message: error.message,
      hasResponse: !!error.response,
      status: error.response ? error.response.status : null,
      statusText: error.response ? error.response.statusText : null,
      data: error.response ? error.response.data : null
    });

    

    if(error.status === 403){
       let errorMessage = '无权限访问该资源';
        const customError = new Error(errorMessage);
        customError.code = 403;
        customError.status = 403;
        customError.response = error.response.data;
        customError.originalError = error;

        return Promise.reject(customError);
    }

    // 处理有响应的HTTP错误
    if (error.response) {
      const status = error.response.status;

      // 403 权限错误
      if (status === 403) {
        let errorMessage = '无权限访问该资源';

        // 尝试从响应中提取详细错误信息
        if (error.response.data) {
          const data = error.response.data;

          // UnifiedResponse 格式
          if (typeof data === 'object' && 'success' in data && 'code' in data && 'message' in data) {
            errorMessage = data.message || errorMessage;
          }
          // 其他格式
          else if (typeof data === 'object' && data.message) {
            errorMessage = data.message;
          } else if (typeof data === 'object' && data.detail) {
            errorMessage = data.detail;
          } else if (typeof data === 'string') {
            errorMessage = data;
          }
        }

        const customError = new Error(errorMessage);
        customError.code = 403;
        customError.status = 403;
        customError.response = error.response.data;
        customError.originalError = error;

        return Promise.reject(customError);
      }

      // 401 未授权
      if (status === 401) {
        const customError = new Error('登录已过期，请重新登录');
        customError.code = 401;
        customError.status = 401;
        customError.originalError = error;

        return Promise.reject(customError);
      }

      // 404 资源不存在
      if (status === 404) {
        const customError = new Error('请求的资源不存在');
        customError.code = 404;
        customError.status = 404;
        customError.originalError = error;

        return Promise.reject(customError);
      }

      // 其他HTTP错误
      if (error.response.data) {
        const data = error.response.data;

        // UnifiedResponse 格式
        if (typeof data === 'object' && 'success' in data && 'code' in data && 'message' in data) {
          const errorMessage = data.message || 'API请求失败';
          const errorCode = data.code || status;

          const customError = new Error(errorMessage);
          customError.code = errorCode;
          customError.status = status;
          customError.response = data;
          customError.originalError = error;

          return Promise.reject(customError);
        }
      }

      // 通用HTTP错误
      const customError = new Error(error.response.statusText || `请求失败 (${status})`);
      customError.code = status;
      customError.status = status;
      customError.originalError = error;

      return Promise.reject(customError);
    }

    // 处理网络错误（CORS、连接超时等）- error.response 为空
    // 注意：CORS 预检失败时，浏览器不会让 JS 访问响应，所以 error.response 为空
    if (error.message === 'Network Error') {
      // 尝试从请求配置中获取更多信息
      const requestUrl = error.config && error.config.url ? error.config.url : '';

      // RBAC API 的网络错误通常是由于 CORS 或权限问题导致的
      // 用户可以在 Network 面板看到实际的状态码（如 403）
      let errorMessage = '网络连接失败，可能是CORS跨域或后端服务未启动';

      // 如果是 RBAC 权限相关的请求，给出更具体的提示
      if (requestUrl.includes('/permissions/') || requestUrl.includes('/roles/') || requestUrl.includes('/users/')) {
        errorMessage = '无权限访问该功能，或后端服务未启动（请检查Network面板查看详情）';
      }

      const customError = new Error(errorMessage);
      customError.code = 'NETWORK_ERROR';
      customError.originalError = error;

      return Promise.reject(customError);
    }

    // 其他请求错误
    const customError = new Error(error.message || '请求失败');
    customError.code = 'REQUEST_ERROR';
    customError.originalError = error;

    return Promise.reject(customError);
  }
);

export default rbacAxios;