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
  static async updateUser(userId, userData) {
    try {
      // 使用ID而非code作为路径参数
      return await rbacAxios.put(`/api/v1/rbac/users/${userId}`, userData);
    } catch (error) {
      console.error('更新用户失败:', error);
      throw error;
    }
  }

  // 删除用户
  static async deleteUser(userId) {
    try {
      // 使用ID而非code作为路径参数
      return await rbacAxios.delete(`/api/v1/rbac/users/${userId}`);
    } catch (error) {
      console.error('删除用户失败:', error);
      throw error;
    }
  }

  // 批量删除用户
  static async deleteUsers(userIds) {
    try {
      // 使用ID列表进行批量删除
      return await rbacAxios.post('/api/v1/rbac/users/batch-delete', {
        user_ids: userIds
      });
    } catch (error) {
      console.error('批量删除用户失败:', error);
      throw error;
    }
  }

  // 重置用户密码
  static async resetUserPassword(userId, newPassword) {
    try {
      // 使用JSON请求体传递新密码
      return await rbacAxios.post(`/api/v1/rbac/users/${userId}/reset-password`, {
        new_password: newPassword
      });
    } catch (error) {
      console.error('重置用户密码失败:', error);
      throw error;
    }
  }

  // 获取用户的角色列表
  static async getUserRoles(userId) {
    try {
      // 使用ID而非code作为路径参数
      return await rbacAxios.get(`/api/v1/rbac/users/${userId}/roles`);
    } catch (error) {
      console.error('获取用户角色失败:', error);
      throw error;
    }
  }
}

export default UserService;