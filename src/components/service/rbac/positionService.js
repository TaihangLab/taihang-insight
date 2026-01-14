import rbacAxios from './base';

class PositionService {
  // 获取岗位列表
  static async getPositions(params = {}) {
    try {
      return await rbacAxios.get('/api/v1/rbac/positions', { params });
    } catch (error) {
      console.error('获取岗位列表失败:', error);
      throw error;
    }
  }

  // 创建岗位
  static async createPosition(posData) {
    try {
      return await rbacAxios.post('/api/v1/rbac/positions', posData, {
        params: { tenant_code: posData.tenant_code }
      });
    } catch (error) {
      console.error('创建岗位失败:', error);
      throw error;
    }
  }

  // 更新岗位
  static async updatePosition(position_code, posData) {
    try {
      return await rbacAxios.put(`/api/v1/rbac/positions/${position_code}`, posData, {
        params: { tenant_code: posData.tenant_code }
      });
    } catch (error) {
      console.error('更新岗位失败:', error);
      throw error;
    }
  }

  // 删除岗位
  static async deletePosition(position_code, tenant_code) {
    try {
      return await rbacAxios.delete(`/api/v1/rbac/positions/${position_code}`, {
        params: { tenant_code: tenant_code }
      });
    } catch (error) {
      console.error('删除岗位失败:', error);
      throw error;
    }
  }
}

export default PositionService;