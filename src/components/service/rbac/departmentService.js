import rbacAxios from './base';

class DepartmentService {
  // 获取部门列表
  static async getDepartments(params = {}) {
    try {
      return await rbacAxios.get('/api/v1/rbac/depts', { params });
    } catch (error) {
      console.error('获取部门列表失败:', error);
      throw error;
    }
  }

  // 获取部门树
  static async getDepartmentTree(params = {}) {
    try {
      return await rbacAxios.get('/api/v1/rbac/depts/tree', { params });
    } catch (error) {
      console.error('获取部门树失败:', error);
      throw error;
    }
  }

  // 创建部门
  static async createDepartment(deptData) {
    try {
      return await rbacAxios.post('/api/v1/rbac/depts', deptData);
    } catch (error) {
      console.error('创建部门失败:', error);
      throw error;
    }
  }

  // 更新部门
  static async updateDepartment(deptId, deptData) {
    try {
      return await rbacAxios.put(`/api/v1/rbac/depts/${deptId}`, deptData);
    } catch (error) {
      console.error('更新部门失败:', error);
      throw error;
    }
  }

  // 删除部门
  static async deleteDepartment(deptId) {
    try {
      return await rbacAxios.delete(`/api/v1/rbac/depts/${deptId}`);
    } catch (error) {
      console.error('删除部门失败:', error);
      throw error;
    }
  }
}

export default DepartmentService;