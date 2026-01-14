import rbacAxios from './base';

class TenantService {
  // 获取租户列表
  static async getTenants(params = {}) {
    try {
      return await rbacAxios.get('/api/v1/rbac/tenants', { params });
    } catch (error) {
      console.error('获取租户列表失败:', error);
      throw error;
    }
  }

  // 创建租户
  static async createTenant(tenantData) {
    try {
      return await rbacAxios.post('/api/v1/rbac/tenants', tenantData);
    } catch (error) {
      console.error('创建租户失败:', error);
      throw error;
    }
  }

  // 更新租户
  static async updateTenant(tenantCode, tenantData) {
    try {
      return await rbacAxios.put(`/api/v1/rbac/tenants/${tenantCode}`, tenantData);
    } catch (error) {
      console.error('更新租户失败:', error);
      throw error;
    }
  }

  // 删除租户
  static async deleteTenant(tenantCode) {
    try {
      return await rbacAxios.delete(`/api/v1/rbac/tenants/${tenantCode}`);
    } catch (error) {
      console.error('删除租户失败:', error);
      throw error;
    }
  }
}

export default TenantService;