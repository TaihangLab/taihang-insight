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
        params: { tenant_code: permissionData.tenant_code }
      });
    } catch (error) {
      console.error('创建权限失败:', error);
      throw error;
    }
  }

  // 更新权限
  static async updatePermission(permission_code, tenant_code, permissionData) {
    try {
      return await rbacAxios.put(`/api/v1/rbac/permissions/${permission_code}`, permissionData, {
        params: { tenant_code: tenant_code }
      });
    } catch (error) {
      console.error('更新权限失败:', error);
      throw error;
    }
  }

  // 删除权限
  static async deletePermission(permission_code, tenant_code) {
    try {
      return await rbacAxios.delete(`/api/v1/rbac/permissions/${permission_code}`, {
        params: { tenant_code: tenant_code }
      });
    } catch (error) {
      console.error('删除权限失败:', error);
      throw error;
    }
  }

  // 更新权限状态
  static async updatePermissionStatus(permission_code, tenant_code, status) {
    try {
      return await rbacAxios.patch(`/api/v1/rbac/permissions/${permission_code}/status`, { status }, {
        params: { tenant_code: tenant_code }
      });
    } catch (error) {
      console.error('更新权限状态失败:', error);
      throw error;
    }
  }

  // 获取权限树结构
  static async getPermissionTree(params = {}) {
    try {
      return await rbacAxios.get('/api/v1/rbac/permission-tree', { params });
    } catch (error) {
      console.error('获取权限树失败:', error);
      throw error;
    }
  }

  // 创建权限节点
  static async createPermissionNode(nodeData) {
    try {
      return await rbacAxios.post('/api/v1/rbac/permission-nodes', nodeData, {
        params: { tenant_code: nodeData.tenant_code }
      });
    } catch (error) {
      console.error('创建权限节点失败:', error);
      throw error;
    }
  }

  // 更新权限节点
  static async updatePermissionNode(nodeId, nodeData) {
    try {
      return await rbacAxios.put(`/api/v1/rbac/permission-nodes/${nodeId}`, nodeData, {
        params: { tenant_code: nodeData.tenant_code }
      });
    } catch (error) {
      console.error('更新权限节点失败:', error);
      throw error;
    }
  }

  // 删除权限节点
  static async deletePermissionNode(nodeId, force = false, tenant_code = null) {
    try {
      const params = { force: force };
      if (tenant_code) {
        params.tenant_code = tenant_code;
      }
      return await rbacAxios.delete(`/api/v1/rbac/permission-nodes/${nodeId}`, {
        params: params
      });
    } catch (error) {
      console.error('删除权限节点失败:', error);
      throw error;
    }
  }

  // 获取拥有指定权限的角色列表
  static async getRolesByPermission(permissionId, tenant_code) {
    try {
      return await rbacAxios.get(`/api/v1/rbac/role-permissions/roles/${permissionId}`, {
        params: { tenant_code: tenant_code }
      });
    } catch (error) {
      console.error('获取权限角色失败:', error);
      throw error;
    }
  }
}

export default PermissionService;