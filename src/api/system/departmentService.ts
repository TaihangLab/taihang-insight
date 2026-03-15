import rbacAxios, { UnifiedResponse } from "@/api/commons";
import type {
  Department,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  DepartmentQueryParams,
} from "@/types/rbac/department";

// ============================================
// DepartmentService 类
// ============================================

class DepartmentService {
  /**
   * 获取部门列表
   */
  static async getDepartments(
    params?: DepartmentQueryParams & { parent_id?: number },
  ): Promise<UnifiedResponse<Department[]>> {
    return rbacAxios.get("/api/v1/rbac/depts", { params });
  }

  /**
   * 获取部门树
   */
  static async getDepartmentTree(
    params?: DepartmentQueryParams & { tree?: boolean },
  ): Promise<UnifiedResponse<Department[]>> {
    return rbacAxios.get("/api/v1/rbac/depts/tree", { params });
  }

  /**
   * 根据租户ID和状态获取部门树
   */
  static async getDepartmentTreeByTenantAndStatus(
    tenantId: number,
    status: number = 0,
  ): Promise<UnifiedResponse<Department[]>> {
    const params = {
      status: status,
      tenant_id: tenantId,
    };
    return rbacAxios.get("/api/v1/rbac/depts/tree", { params });
  }

  /**
   * 创建部门
   */
  static async createDepartment(
    deptData: CreateDepartmentRequest,
  ): Promise<UnifiedResponse<Department>> {
    return rbacAxios.post("/api/v1/rbac/depts", deptData);
  }

  /**
   * 更新部门
   */
  static async updateDepartment(
    deptId: number,
    deptData: UpdateDepartmentRequest,
  ): Promise<UnifiedResponse<Department>> {
    return rbacAxios.put(`/api/v1/rbac/depts/${deptId}`, deptData);
  }

  /**
   * 删除部门
   */
  static async deleteDepartment(deptId: number): Promise<UnifiedResponse<void>> {
    return rbacAxios.delete(`/api/v1/rbac/depts/${deptId}`);
  }
}

// 重新导出类型，方便使用
export type { Department, CreateDepartmentRequest, UpdateDepartmentRequest, DepartmentQueryParams };

export default DepartmentService;
