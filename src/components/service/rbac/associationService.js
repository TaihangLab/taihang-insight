import rbacAxios from './base';

class AssociationService {
  // 用户角色关联API
  // 分配角色给用户
  static async assignRoleToUser(userIdentifier, roleId, tenant_code) {
    try {
      return await rbacAxios.post('/api/v1/rbac/user-roles', {
        userIdentifier: userIdentifier,  // 可以是用户名或用户ID
        roleId: roleId,
        tenant_code: tenant_code
      });
    } catch (error) {
      console.error('分配角色给用户失败:', error);
      throw error;
    }
  }

  // 移除用户角色
  static async removeUserRole(userIdentifier, roleId, tenant_code) {
    try {
      return await rbacAxios.delete('/api/v1/rbac/user-roles', {
        data: {
          userIdentifier: userIdentifier,  // 可以是用户名或用户ID
          roleId: roleId,
          tenant_code: tenant_code
        }
      });
    } catch (error) {
      console.error('移除用户角色失败:', error);
      throw error;
    }
  }

  // 获取拥有指定角色的用户列表
  static async getUsersByRole(roleId, tenant_code) {
    try {
      return await rbacAxios.get(`/api/v1/rbac/user-roles/users/${roleId}`, {
        params: { tenant_code: tenant_code }
      });
    } catch (error) {
      console.error('获取角色用户失败:', error);
      throw error;
    }
  }

  // 角色权限关联API
  // 分配权限给角色
  static async assignPermissionToRole(roleId, permissionId, tenant_code) {
    try {
      return await rbacAxios.post('/api/v1/rbac/role-permissions', {
        roleId: roleId,
        permissionId: permissionId,
        tenant_code: tenant_code
      });
    } catch (error) {
      console.error('分配权限给角色失败:', error);
      throw error;
    }
  }

  // 移除角色权限
  static async removeRolePermission(roleId, permissionId, tenant_code) {
    try {
      return await rbacAxios.delete('/api/v1/rbac/role-permissions', {
        data: {
          roleId: roleId,
          permissionId: permissionId,
          tenant_code: tenant_code
        }
      });
    } catch (error) {
      console.error('移除角色权限失败:', error);
      throw error;
    }
  }

  // 权限验证API
  // 检查用户权限
  static async checkUserPermission(userId, tenant_code, url, method) {
    try {
      return await rbacAxios.post('/api/v1/rbac/permissions/check', {
        userId: userId,
        tenant_code: tenant_code,
        url,
        method
      });
    } catch (error) {
      console.error('检查用户权限失败:', error);
      throw error;
    }
  }

  // 批量分配角色给用户
  static async assignRolesToUser(userIdentifier, roleIds, tenant_code) {
    try {
      return await rbacAxios.post('/api/v1/rbac/user-roles/batch', {
        userIdentifier: userIdentifier,  // 可以是用户名或用户ID
        roleIds: roleIds,
        tenant_code: tenant_code
      });
    } catch (error) {
      console.error('批量分配角色给用户失败:', error);
      throw error;
    }
  }

  // 获取用户权限列表
  static async getUserPermissions(userId, tenant_code) {
    try {
      return await rbacAxios.get(`/api/v1/rbac/permissions/user/${userId}`, {
        params: { tenant_code: tenant_code }
      });
    } catch (error) {
      console.error('获取用户权限列表失败:', error);
      throw error;
    }
  }
}

export default AssociationService;