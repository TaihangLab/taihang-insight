import axios from 'axios';
import userService from '@/components/service/UserService'

// 导入配置
const config = require('../../../config/index.js');

// 创建专用于RBAC模块的axios实例
const rbacAxios = axios.create({
  baseURL: config.RBAC_API_BASE_URL,
  timeout: 15000,
  withCredentials: false,  // 将withCredentials设置为false，避免CORS错误
});

// 自定义参数序列化函数
rbacAxios.defaults.paramsSerializer = function (params) {
  // 自定义参数序列化逻辑，确保数组以多个同名参数形式传递
  const queryParams = [];

  for (const key in params) {
    if (params[key] !== undefined) {
      if (Array.isArray(params[key])) {
        // 对于数组参数，使用重复的键名传递每个值
        params[key].forEach(value => {
          queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        });
      } else {
        queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
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
    console.error('RBAC API 请求错误:', error.message);
    return Promise.reject(error);
  }
);

// RBAC服务类
class RBACService {
  // 用户管理API
  // 获取用户列表
  static async getUsers(params = {}) {
    try {
      return await rbacAxios.get('/api/v1/rbac/users', { params });
    } catch (error) {
      console.error('获取用户列表失败:', error);
      throw error;
    }
  }

  // 创建用户
  static async createUser(userData) {
    try {
      return await rbacAxios.post('/api/v1/rbac/users', userData);
    } catch (error) {
      console.error('创建用户失败:', error);
      throw error;
    }
  }

  // 更新用户
  static async updateUser(userCode, tenantCode, userData) {
    try {
      return await rbacAxios.put(`/api/v1/rbac/users/${userCode}`, userData, {
        params: { tenant_code: tenantCode }
      });
    } catch (error) {
      console.error('更新用户失败:', error);
      throw error;
    }
  }

  // 删除用户
  static async deleteUser(userCode, tenantCode) {
    try {
      return await rbacAxios.delete(`/api/v1/rbac/users/${userCode}`, {
        params: { tenant_code: tenantCode }
      });
    } catch (error) {
      console.error('删除用户失败:', error);
      throw error;
    }
  }

  // 重置用户密码
  static async resetUserPassword(userCode) {
    try {
      return await rbacAxios.post(`/api/v1/rbac/users/${userCode}/reset-password`);
    } catch (error) {
      console.error('重置用户密码失败:', error);
      throw error;
    }
  }

  // 角色管理API
  // 获取角色列表
  static async getRoles(params = {}) {
    try {
      return await rbacAxios.get('/api/v1/rbac/roles', { params });
    } catch (error) {
      console.error('获取角色列表失败:', error);
      throw error;
    }
  }

  // 创建角色
  static async createRole(roleData) {
    try {
      return await rbacAxios.post('/api/v1/rbac/roles', roleData, {
        params: { tenant_code: roleData.tenantCode }
      });
    } catch (error) {
      console.error('创建角色失败:', error);
      throw error;
    }
  }

  // 更新角色
  static async updateRole(roleCode, tenantCode, roleData) {
    try {
      return await rbacAxios.put(`/api/v1/rbac/roles/${roleCode}`, roleData, {
        params: { tenant_code: tenantCode }
      });
    } catch (error) {
      console.error('更新角色失败:', error);
      throw error;
    }
  }

  // 删除角色
  static async deleteRole(roleCode, tenantCode) {
    try {
      return await rbacAxios.delete(`/api/v1/rbac/roles/${roleCode}`, {
        params: { tenant_code: tenantCode }
      });
    } catch (error) {
      console.error('删除角色失败:', error);
      throw error;
    }
  }

  // 部门管理API
  // 获取部门列表
  static async getDepartments(params = {}) {
    try {
      return await rbacAxios.get('/api/v1/rbac/departments', { params });
    } catch (error) {
      console.error('获取部门列表失败:', error);
      throw error;
    }
  }

  // 创建部门
  static async createDepartment(deptData) {
    try {
      return await rbacAxios.post('/api/v1/rbac/departments', deptData, {
        params: { tenant_code: deptData.tenantCode }
      });
    } catch (error) {
      console.error('创建部门失败:', error);
      throw error;
    }
  }

  // 更新部门
  static async updateDepartment(deptCode, deptData) {
    try {
      return await rbacAxios.put(`/api/v1/rbac/departments/${deptCode}`, deptData, {
        params: { tenant_code: deptData.tenantCode }
      });
    } catch (error) {
      console.error('更新部门失败:', error);
      throw error;
    }
  }

  // 删除部门
  static async deleteDepartment(deptCode, tenantCode) {
    try {
      return await rbacAxios.delete(`/api/v1/rbac/departments/${deptCode}`, {
        params: { tenant_code: tenantCode }
      });
    } catch (error) {
      console.error('删除部门失败:', error);
      throw error;
    }
  }

  // 岗位管理API
  // 获取岗位列表
  static async getPositions(params = {}) {
    try {
      return await rbacAxios.get('/api/v1/rbac/positions', { params });
    } catch (error) {
      console.error('获取岗位列表失败:', error);
      throw error;
    }
  }

  // 创建岗位
  static async createPosition(posData) {
    try {
      return await rbacAxios.post('/api/v1/rbac/positions', posData, {
        params: { tenant_code: posData.tenantCode }
      });
    } catch (error) {
      console.error('创建岗位失败:', error);
      throw error;
    }
  }

  // 更新岗位
  static async updatePosition(positionCode, posData) {
    try {
      return await rbacAxios.put(`/api/v1/rbac/positions/${positionCode}`, posData, {
        params: { tenant_code: posData.tenantCode }
      });
    } catch (error) {
      console.error('更新岗位失败:', error);
      throw error;
    }
  }

  // 删除岗位
  static async deletePosition(positionCode, tenantCode) {
    try {
      return await rbacAxios.delete(`/api/v1/rbac/positions/${positionCode}`, {
        params: { tenant_code: tenantCode }
      });
    } catch (error) {
      console.error('删除岗位失败:', error);
      throw error;
    }
  }

  // 租户管理API
  // 获取租户列表
  static async getTenants(params = {}) {
    try {
      return await rbacAxios.get('/api/v1/rbac/tenants', { params });
    } catch (error) {
      console.error('获取租户列表失败:', error);
      throw error;
    }
  }

  // 创建租户
  static async createTenant(tenantData) {
    try {
      return await rbacAxios.post('/api/v1/rbac/tenants', tenantData);
    } catch (error) {
      console.error('创建租户失败:', error);
      throw error;
    }
  }

  // 更新租户
  static async updateTenant(tenantCode, tenantData) {
    try {
      return await rbacAxios.put(`/api/v1/rbac/tenants/${tenantCode}`, tenantData);
    } catch (error) {
      console.error('更新租户失败:', error);
      throw error;
    }
  }

  // 删除租户
  static async deleteTenant(tenantCode) {
    try {
      return await rbacAxios.delete(`/api/v1/rbac/tenants/${tenantCode}`);
    } catch (error) {
      console.error('删除租户失败:', error);
      throw error;
    }
  }

  // 权限管理API
  // 获取权限列表
  static async getPermissions(params = {}) {
    try {
      return await rbacAxios.get('/api/v1/rbac/permissions', { params });
    } catch (error) {
      console.error('获取权限列表失败:', error);
      throw error;
    }
  }

  // 创建权限
  static async addPermission(permissionData) {
    try {
      return await rbacAxios.post('/api/v1/rbac/permissions', permissionData, {
        params: { tenant_code: permissionData.tenantCode }
      });
    } catch (error) {
      console.error('创建权限失败:', error);
      throw error;
    }
  }

  // 更新权限
  static async updatePermission(permissionCode, tenantCode, permissionData) {
    try {
      return await rbacAxios.put(`/api/v1/rbac/permissions/${permissionCode}`, permissionData, {
        params: { tenant_code: tenantCode }
      });
    } catch (error) {
      console.error('更新权限失败:', error);
      throw error;
    }
  }

  // 删除权限
  static async deletePermission(permissionCode, tenantCode) {
    try {
      return await rbacAxios.delete(`/api/v1/rbac/permissions/${permissionCode}`, {
        params: { tenant_code: tenantCode }
      });
    } catch (error) {
      console.error('删除权限失败:', error);
      throw error;
    }
  }

  // 更新权限状态
  static async updatePermissionStatus(permissionCode, tenantCode, status) {
    try {
      return await rbacAxios.patch(`/api/v1/rbac/permissions/${permissionCode}/status`, { status }, {
        params: { tenant_code: tenantCode }
      });
    } catch (error) {
      console.error('更新权限状态失败:', error);
      throw error;
    }
  }
}

export default RBACService;
