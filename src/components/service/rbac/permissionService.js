import rbacAxios from './base';

class PermissionService {
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
        params: { tenantCode: permissionData.tenantCode }
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
        params: { tenantCode: tenantCode }
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
        params: { tenantCode: tenantCode }
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
        params: { tenantCode: tenantCode }
      });
    } catch (error) {
      console.error('更新权限状态失败:', error);
      throw error;
    }
  }

  // 获取拥有指定权限的角色列表
  static async getRolesByPermission(permissionId, tenantCode) {
    try {
      return await rbacAxios.get(`/api/v1/rbac/role-permissions/roles/${permissionId}`, {
        params: { tenantCode: tenantCode }
      });
    } catch (error) {
      console.error('获取权限角色失败:', error);
      throw error;
    }
  }
}

export default PermissionService;