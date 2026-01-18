import rbacAxios from './base';

class AssociationService {
  // 用户角色关联API
  // 分配角色给用户
  static async assignRoleToUser(userId, roleId) {
    try {
      return await rbacAxios.post('/api/v1/rbac/user-roles', {
        user_id: userId,
        role_id: roleId
      });
    } catch (error) {
      console.error('分配角色给用户失败:', error);
      throw error;
    }
  }

  // 移除用户角色
  static async removeUserRole(userId, roleId) {
    try {
      return await rbacAxios.delete('/api/v1/rbac/user-roles', {
        params: {
          user_id: userId,
          role_id: roleId
        }
      });
    } catch (error) {
      console.error('移除用户角色失败:', error);
      throw error;
    }
  }

  // 获取拥有指定角色的用户列表
  static async getUsersByRole(roleId) {
    try {
      return await rbacAxios.get('/api/v1/rbac/users', {
        params: { role_id: roleId }
      });
    } catch (error) {
      console.error('获取角色用户失败:', error);
      throw error;
    }
  }

  // 角色权限关联API
  // 分配权限给角色
  static async assignPermissionToRole(roleId, permissionId) {
    try {
      return await rbacAxios.post('/api/v1/rbac/role-permissions', {
        role_id: roleId,
        permission_id: permissionId
      });
    } catch (error) {
      console.error('分配权限给角色失败:', error);
      throw error;
    }
  }

  // 移除角色权限
  static async removeRolePermission(roleId, permissionId) {
    try {
      return await rbacAxios.delete('/api/v1/rbac/role-permissions', {
        params: {
          role_id: roleId,
          permission_id: permissionId
        }
      });
    } catch (error) {
      console.error('移除角色权限失败:', error);
      throw error;
    }
  }

  // 权限验证API
  // 检查用户权限
  static async checkUserPermission(userId, url, method) {
    try {
      return await rbacAxios.post('/api/v1/rbac/permissions/check', {
        user_id: userId,
        url,
        method
      });
    } catch (error) {
      console.error('检查用户权限失败:', error);
      throw error;
    }
  }

  // 批量分配角色给用户
  static async assignRolesToUser(userId, roleIds) {
    try {
      return await rbacAxios.post('/api/v1/rbac/user-roles', {
        user_id: userId,
        role_ids: roleIds
      });
    } catch (error) {
      console.error('批量分配角色给用户失败:', error);
      throw error;
    }
  }

  // 获取用户权限列表
  static async getUserPermissions(userId) {
    try {
      return await rbacAxios.get(`/api/v1/rbac/permissions/user/${userId}`);
    } catch (error) {
      console.error('获取用户权限列表失败:', error);
      throw error;
    }
  }
}

export default AssociationService;