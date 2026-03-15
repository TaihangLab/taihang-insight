import rbacAxios, { UnifiedResponse } from "@/api/commons";
import type {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  RoleQueryParams,
} from "@/types/rbac/role";
import type { Permission } from "@/types/rbac/permission";

// ============================================
// RoleService 类
// ============================================

class RoleService {
  /**
   * 获取角色列表
   */
  static async getRoles(params?: RoleQueryParams): Promise<UnifiedResponse<Role[]>> {
    return rbacAxios.get("/api/v1/rbac/roles", { params });
  }

  /**
   * 创建角色
   */
  static async createRole(roleData: CreateRoleRequest): Promise<UnifiedResponse<Role>> {
    return rbacAxios.post("/api/v1/rbac/roles", roleData);
  }

  /**
   * 更新角色
   */
  static async updateRole(
    roleId: number,
    roleData: UpdateRoleRequest,
  ): Promise<UnifiedResponse<Role>> {
    return rbacAxios.put(`/api/v1/rbac/roles/${roleId}`, roleData);
  }

  /**
   * 删除角色
   */
  static async deleteRole(roleId: number): Promise<UnifiedResponse<void>> {
    return rbacAxios.delete(`/api/v1/rbac/roles/${roleId}`);
  }

  /**
   * 获取角色的权限列表
   */
  static async getRolePermissions(
    params: number | { role_id: number | string },
  ): Promise<UnifiedResponse<Permission[]>> {
    // 如果传入的是对象，则从中提取role_id
    const roleId = typeof params === "object" && params !== null ? params.role_id : params;
    return rbacAxios.get(`/api/v1/rbac/role-permissions`, {
      params: { role_id: roleId },
    });
  }
}

// 重新导出类型，方便使用
export type { Role, CreateRoleRequest, UpdateRoleRequest, RoleQueryParams };

export default RoleService;
