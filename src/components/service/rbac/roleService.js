import rbacAxios from './base';

class RoleService {
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
      return await rbacAxios.post('/api/v1/rbac/roles', roleData);
    } catch (error) {
      console.error('创建角色失败:', error);
      throw error;
    }
  }

  // 更新角色
  static async updateRole(roleId, roleData) {
    try {
      return await rbacAxios.put(`/api/v1/rbac/roles/${roleId}`, roleData);
    } catch (error) {
      console.error('更新角色失败:', error);
      throw error;
    }
  }

  // 删除角色
  static async deleteRole(roleId) {
    try {
      return await rbacAxios.delete(`/api/v1/rbac/roles/${roleId}`);
    } catch (error) {
      console.error('删除角色失败:', error);
      throw error;
    }
  }

  // 获取角色的权限列表
  static async getRolePermissions(roleId) {
    try {
      return await rbacAxios.get(`/api/v1/rbac/roles/${roleId}/permissions`);
    } catch (error) {
      console.error('获取角色权限失败:', error);
      throw error;
    }
  }
}

export default RoleService;