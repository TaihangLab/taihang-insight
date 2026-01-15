import rbacAxios from './base';

class UserService {
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
  static async updateUser(user_identifier, tenant_code, userData) {
    try {
      // user_identifier 可以是 user_code 或 user_name
      return await rbacAxios.put(`/api/v1/rbac/users/${user_identifier}`, userData, {
        params: { tenant_code: tenant_code }
      });
    } catch (error) {
      console.error('更新用户失败:', error);
      throw error;
    }
  }

  // 删除用户
  static async deleteUser(user_identifier, tenant_code) {
    try {
      // user_identifier 可以是 user_code 或 user_name
      return await rbacAxios.delete(`/api/v1/rbac/users/${user_identifier}`, {
        params: { tenant_code: tenant_code }
      });
    } catch (error) {
      console.error('删除用户失败:', error);
      throw error;
    }
  }

  // 重置用户密码
  static async resetUserPassword(user_identifier, tenant_code = 'default') {
    try {
      // user_identifier 可以是 user_code 或 user_name
      return await rbacAxios.post(`/api/v1/rbac/users/${user_identifier}/reset-password`, {}, {
        params: { tenant_code: tenant_code }
      });
    } catch (error) {
      console.error('重置用户密码失败:', error);
      throw error;
    }
  }

  // 获取用户的角色列表
  static async getUserRoles(userId, tenant_code) {
    try {
      return await rbacAxios.get(`/api/v1/rbac/users/${userId}/roles`, {
        params: { tenant_code: tenant_code }
      });
    } catch (error) {
      console.error('获取用户角色失败:', error);
      throw error;
    }
  }
}

export default UserService;