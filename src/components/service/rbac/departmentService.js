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
  static async getDepartmentTree() {
    try {
      return await rbacAxios.get('/api/v1/rbac/depts/tree');
    } catch (error) {
      console.error('获取部门树失败:', error);
      throw error;
    }
  }

  // 创建部门
  static async createDepartment(deptData) {
    try {
      return await rbacAxios.post('/api/v1/rbac/depts', deptData, {
        params: { tenant_code: deptData.tenant_code }
      });
    } catch (error) {
      console.error('创建部门失败:', error);
      throw error;
    }
  }

  // 更新部门
  static async updateDepartment(dept_code, deptData) {
    try {
      return await rbacAxios.put(`/api/v1/rbac/depts/${dept_code}`, deptData, {
        params: { tenant_code: deptData.tenant_code }
      });
    } catch (error) {
      console.error('更新部门失败:', error);
      throw error;
    }
  }

  // 删除部门
  static async deleteDepartment(dept_code, tenant_code) {
    try {
      return await rbacAxios.delete(`/api/v1/rbac/depts/${dept_code}`, {
        params: { tenant_code: tenant_code }
      });
    } catch (error) {
      console.error('删除部门失败:', error);
      throw error;
    }
  }
}

export default DepartmentService;