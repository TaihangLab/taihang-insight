import rbacAxios from './base';

class AssociationService {
  // 用户角色关联API
  // 分配角色给用户
  static async assignRoleToUser(userId, roleId, tenantCode) {
    try {
      return await rbacAxios.post('/api/v1/rbac/user-roles', {
        userId: userId,
        roleId: roleId,
        tenantCode: tenantCode
      });
    } catch (error) {
      console.error('分配角色给用户失败:', error);
      throw error;
    }
  }

  // 移除用户角色
  static async removeUserRole(userId, roleId, tenantCode) {
    try {
      return await rbacAxios.delete('/api/v1/rbac/user-roles', {
        data: {
          userId: userId,
          roleId: roleId,
          tenantCode: tenantCode
        }
      });
    } catch (error) {
      console.error('移除用户角色失败:', error);
      throw error;
    }
  }

  // 获取拥有指定角色的用户列表
  static async getUsersByRole(roleId, tenantCode) {
    try {
      return await rbacAxios.get(`/api/v1/rbac/user-roles/users/${roleId}`, {
        params: { tenantCode: tenantCode }
      });
    } catch (error) {
      console.error('获取角色用户失败:', error);
      throw error;
    }
  }

  // 角色权限关联API
  // 分配权限给角色
  static async assignPermissionToRole(roleId, permissionId, tenantCode) {
    try {
      return await rbacAxios.post('/api/v1/rbac/role-permissions', {
        roleId: roleId,
        permissionId: permissionId,
        tenantCode: tenantCode
      });
    } catch (error) {
      console.error('分配权限给角色失败:', error);
      throw error;
    }
  }

  // 移除角色权限
  static async removeRolePermission(roleId, permissionId, tenantCode) {
    try {
      return await rbacAxios.delete('/api/v1/rbac/role-permissions', {
        data: {
          roleId: roleId,
          permissionId: permissionId,
          tenantCode: tenantCode
        }
      });
    } catch (error) {
      console.error('移除角色权限失败:', error);
      throw error;
    }
  }

  // 权限验证API
  // 检查用户权限
  static async checkUserPermission(userId, tenantCode, url, method) {
    try {
      return await rbacAxios.post('/api/v1/rbac/permissions/check', {
        userId: userId,
        tenantCode: tenantCode,
        url,
        method
      });
    } catch (error) {
      console.error('检查用户权限失败:', error);
      throw error;
    }
  }

  // 获取用户权限列表
  static async getUserPermissions(userId, tenantCode) {
    try {
      return await rbacAxios.get(`/api/v1/rbac/permissions/user/${userId}`, {
        params: { tenantCode: tenantCode }
      });
    } catch (error) {
      console.error('获取用户权限列表失败:', error);
      throw error;
    }
  }
}

export default AssociationService;