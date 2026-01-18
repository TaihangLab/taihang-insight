import rbacAxios from './base';

class TenantService {
  /**
   * 获取租户列表
   * @param {Object} params 查询参数
   * @returns {Promise<Object>} 租户列表数据
   */
  static async getTenants(params = {}) {
    try {
      console.log('[TenantService] 从服务器获取租户列表');
      const response = await rbacAxios.get('/api/v1/rbac/tenants', { params });
      return response;
    } catch (error) {
      console.error('获取租户列表失败:', error);
      throw error;
    }
  }

  /**
   * 创建租户
   * @param {Object} tenantData 租户数据
   * @returns {Promise<Object>}
   */
  static async createTenant(tenantData) {
    try {
      const response = await rbacAxios.post('/api/v1/rbac/tenants', tenantData);
      return response;
    } catch (error) {
      console.error('创建租户失败:', error);
      throw error;
    }
  }

  /**
   * 更新租户
   * @param {Number} tenantId 租户ID
   * @param {Object} tenantData 租户数据
   * @returns {Promise<Object>}
   */
  static async updateTenant(tenantId, tenantData) {
    try {
      const response = await rbacAxios.put(`/api/v1/rbac/tenants/${tenantId}`, tenantData);
      return response;
    } catch (error) {
      console.error('更新租户失败:', error);
      throw error;
    }
  }

  /**
   * 删除租户
   * @param {Number} tenantId 租户ID
   * @returns {Promise<Object>}
   */
  static async deleteTenant(tenantId) {
    try {
      const response = await rbacAxios.delete(`/api/v1/rbac/tenants/${tenantId}`);
      return response;
    } catch (error) {
      console.error('删除租户失败:', error);
      throw error;
    }
  }

  /**
   * 批量删除租户
   * @param {Array<Number>} tenantIds 租户ID列表
   * @returns {Promise<Object>}
   */
  static async batchDeleteTenants(tenantIds) {
    try {
      const response = await rbacAxios.post('/api/v1/rbac/tenants/batch-delete', {
        tenant_ids: tenantIds
      });
      return response;
    } catch (error) {
      console.error('批量删除租户失败:', error);
      throw error;
    }
  }
}

export default TenantService;