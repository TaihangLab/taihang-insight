import rbacAxios from './base';

/**
 * 权限管理服务
 * 提供权限节点的 CRUD 操作
 */
class PermissionService {
  /**
   * 获取权限树
   * @param {Object} params - 查询参数
   * @param {boolean} params.include_disabled - 是否包含禁用的权限
   * @returns {Promise<Array>} 权限树结构
   */
  static async getPermissionTree(params = {}) {
    try {
      // 权限管理功能与租户无关，从参数中移除租户代码
      const { tenant_id, ...otherParams } = params;
      const response = await rbacAxios.get('/api/v1/rbac/permissions/tree', { params: otherParams });
      return response.data;
    } catch (error) {
      console.error('获取权限树失败:', error);
      throw error;
    }
  }

  /**
   * 创建权限节点
   * @param {Object} nodeData - 权限节点数据
   * @returns {Promise<Object>} 创建的权限节点
   */
  static async createPermissionNode(nodeData) {
    try {
      // 权限管理功能与租户无关，从数据中移除租户代码
      const { tenant_id, ...otherData } = nodeData;
      const response = await rbacAxios.post('/api/v1/rbac/permissions', otherData);
      return response.data;
    } catch (error) {
      console.error('创建权限节点失败:', error);
      throw error;
    }
  }

  /**
   * 更新权限节点
   * @param {string} nodeId - 权限节点 ID
   * @param {Object} nodeData - 权限节点数据
   * @returns {Promise<Object>} 更新后的权限节点
   */
  static async updatePermissionNode(nodeId, nodeData) {
    try {
      // 权限管理功能与租户无关，从数据中移除租户代码
      const { tenant_id, ...otherData } = nodeData;
      const response = await rbacAxios.put(`/api/v1/rbac/permissions/${nodeId}`, otherData);
      return response.data;
    } catch (error) {
      console.error('更新权限节点失败:', error);
      throw error;
    }
  }

  /**
   * 删除权限节点
   * @param {string} nodeId - 权限节点 ID
   * @param {boolean} force - 是否强制删除（含子节点）
   * @returns {Promise<void>}
   */
  static async deletePermissionNode(nodeId, force = false) {
    try {
      const params = { force };
      await rbacAxios.delete(`/api/v1/rbac/permissions/${nodeId}`, { params });
    } catch (error) {
      console.error('删除权限节点失败:', error);
      throw error;
    }
  }

  /**
   * 获取权限节点详情
   * @param {string} nodeId - 权限节点 ID
   * @returns {Promise<Object>} 权限节点详情
   */
  static async getPermissionNode(nodeId) {
    try {
      const response = await rbacAxios.get(`/api/v1/rbac/permissions/${nodeId}`);
      return response.data;
    } catch (error) {
      console.error('获取权限节点详情失败:', error);
      throw error;
    }
  }

  /**
   * 验证权限码唯一性
   * @param {string} code - 权限码
   * @param {string} excludeId - 排除的节点 ID（编辑时使用）
   * @returns {Promise<Object>} { exists: boolean, code: string }
   */
  static async validateCode(code, excludeId = null) {
    try {
      const params = { code };
      if (excludeId) {
        params.exclude_id = excludeId;
      }
      const response = await rbacAxios.get('/api/v1/rbac/permissions/validate-code', { params });
      return response.data;
    } catch (error) {
      console.error('验证权限码失败:', error);
      throw error;
    }
  }

  /**
   * 更新权限节点状态
   * @param {string} nodeId - 权限节点 ID
   * @param {number} status - 状态 0启用 1禁用
   * @returns {Promise<void>}
   */
  static async updatePermissionNodeStatus(nodeId, status) {
    try {
      await rbacAxios.patch(`/api/v1/rbac/permissions/${nodeId}/status`, { status });
    } catch (error) {
      console.error('更新权限状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取拥有指定权限的角色列表
   * @param {string} permissionId - 权限节点 ID
   * @returns {Promise<Array>} 角色列表
   */
  static async getRolesByPermission(permissionId) {
    try {
      const response = await rbacAxios.get(`/api/v1/rbac/permissions/${permissionId}/roles`);
      return response.data;
    } catch (error) {
      console.error('获取权限角色失败:', error);
      throw error;
    }
  }

  // ============ 以下为兼容旧版本的接口方法 ============

  /**
   * 获取权限列表（分页）
   * @deprecated 建议使用 getPermissionTree
   */
  static async getPermissions(params = {}) {
    try {
      return await rbacAxios.get('/api/v1/rbac/permissions', { params });
    } catch (error) {
      console.error('获取权限列表失败:', error);
      throw error;
    }
  }

  /**
   * 创建权限
   * @deprecated 建议使用 createPermissionNode
   */
  static async addPermission(permissionData) {
    try {
      return await rbacAxios.post('/api/v1/rbac/permissions', permissionData);
    } catch (error) {
      console.error('创建权限失败:', error);
      throw error;
    }
  }

  /**
   * 更新权限
   * @deprecated 建议使用 updatePermissionNode
   */
  static async updatePermission(permissionId, permissionData) {
    try {
      return await rbacAxios.put(`/api/v1/rbac/permissions/${permissionId}`, permissionData);
    } catch (error) {
      console.error('更新权限失败:', error);
      throw error;
    }
  }

  /**
   * 删除权限
   * @deprecated 建议使用 deletePermissionNode
   */
  static async deletePermission(permissionId) {
    try {
      return await rbacAxios.delete(`/api/v1/rbac/permissions/${permissionId}`);
    } catch (error) {
      console.error('删除权限失败:', error);
      throw error;
    }
  }

  /**
   * 更新权限状态
   * @deprecated 建议使用 updatePermissionNodeStatus
   */
  static async updatePermissionStatus(permissionId, status) {
    try {
      return await rbacAxios.patch(`/api/v1/rbac/permissions/${permissionId}/status`, { status });
    } catch (error) {
      console.error('更新权限状态失败:', error);
      throw error;
    }
  }
}

export default PermissionService;
