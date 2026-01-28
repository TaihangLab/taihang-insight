import rbacAxios, { UnifiedResponse } from './base'
import type {
  Department,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  DepartmentQueryParams
} from '@/types/rbac/department'

// ============================================
// DepartmentService 类
// ============================================

class DepartmentService {
  /**
   * 获取部门列表
   */
  static async getDepartments(params?: DepartmentQueryParams & { parent_id?: number }): Promise<UnifiedResponse<Department[]>> {
    try {
      return await rbacAxios.get('/api/v1/rbac/depts', { params })
    } catch (error) {
      console.error('获取部门列表失败:', error)
      throw error
    }
  }

  /**
   * 获取部门树
   */
  static async getDepartmentTree(params?: DepartmentQueryParams & { tree?: boolean }): Promise<UnifiedResponse<Department[]>> {
    try {
      return await rbacAxios.get('/api/v1/rbac/depts/tree', { params })
    } catch (error) {
      console.error('获取部门树失败:', error)
      throw error
    }
  }

  /**
   * 根据租户ID和状态获取部门树
   */
  static async getDepartmentTreeByTenantAndStatus(
    tenantId: number,
    status: number = 0
  ): Promise<UnifiedResponse<Department[]>> {
    try {
      const params = {
        status: status,
        tenant_id: tenantId
      }
      return await rbacAxios.get('/api/v1/rbac/depts/tree', { params })
    } catch (error) {
      console.error('根据租户ID和状态获取部门树失败:', error)
      throw error
    }
  }

  /**
   * 创建部门
   */
  static async createDepartment(deptData: CreateDepartmentRequest): Promise<UnifiedResponse<Department>> {
    try {
      return await rbacAxios.post('/api/v1/rbac/depts', deptData)
    } catch (error) {
      console.error('创建部门失败:', error)
      throw error
    }
  }

  /**
   * 更新部门
   */
  static async updateDepartment(
    deptId: number,
    deptData: UpdateDepartmentRequest
  ): Promise<UnifiedResponse<Department>> {
    try {
      return await rbacAxios.put(`/api/v1/rbac/depts/${deptId}`, deptData)
    } catch (error) {
      console.error('更新部门失败:', error)
      throw error
    }
  }

  /**
   * 删除部门
   */
  static async deleteDepartment(deptId: number): Promise<UnifiedResponse<void>> {
    try {
      return await rbacAxios.delete(`/api/v1/rbac/depts/${deptId}`)
    } catch (error) {
      console.error('删除部门失败:', error)
      throw error
    }
  }
}

// 重新导出类型，方便使用
export type { Department, CreateDepartmentRequest, UpdateDepartmentRequest, DepartmentQueryParams }

export default DepartmentService
