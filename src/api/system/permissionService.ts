import rbacAxios, { UnifiedResponse } from "@/api/commons";
import type {
  Permission,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  PermissionQueryParams,
} from "@/types/rbac/permission";
import type { Role } from "@/types/rbac/role";

// ============================================
// PermissionService 类
// ============================================

class PermissionService {
  /**
   * 获取权限树
   */
  static async getPermissionTree(
    params?: PermissionQueryParams & { include_disabled?: boolean },
  ): Promise<UnifiedResponse<Permission[]>> {
    return rbacAxios.get("/api/v1/rbac/permissions/tree", { params });
  }

  /**
   * 获取权限列表（分页）
   */
  static async getPermissions(
    params?: PermissionQueryParams,
  ): Promise<UnifiedResponse<Permission[]>> {
    return rbacAxios.get("/api/v1/rbac/permissions", { params });
  }

  /**
   * 创建权限节点
   */
  static async createPermissionNode(
    nodeData: CreatePermissionRequest,
  ): Promise<UnifiedResponse<Permission>> {
    return rbacAxios.post("/api/v1/rbac/permissions", nodeData);
  }

  /**
   * 更新权限节点
   */
  static async updatePermissionNode(
    nodeId: number,
    nodeData: UpdatePermissionRequest,
  ): Promise<UnifiedResponse<Permission>> {
    return rbacAxios.put(`/api/v1/rbac/permissions/${nodeId}`, nodeData);
  }

  /**
   * 删除权限节点
   */
  static async deletePermissionNode(
    nodeId: number,
    force: boolean = false,
  ): Promise<UnifiedResponse<void>> {
    return rbacAxios.delete(`/api/v1/rbac/permissions/${nodeId}`, { params: { force } });
  }

  /**
   * 获取权限节点详情
   */
  static async getPermissionNode(nodeId: number): Promise<UnifiedResponse<Permission>> {
    return rbacAxios.get(`/api/v1/rbac/permissions/${nodeId}`);
  }

  /**
   * 验证权限码唯一性
   */
  static async validateCode(
    code: string,
    excludeId?: number | null,
  ): Promise<UnifiedResponse<{ exists: boolean; code: string }>> {
    const params: Record<string, string | number | boolean> = { code };
    if (excludeId) {
      params.exclude_id = excludeId;
    }
    return rbacAxios.get("/api/v1/rbac/permissions/validate-code", { params });
  }

  /**
   * 更新权限节点状态
   */
  static async updatePermissionNodeStatus(
    nodeId: number,
    status: number,
  ): Promise<UnifiedResponse<void>> {
    return rbacAxios.patch(`/api/v1/rbac/permissions/${nodeId}/status`, { status });
  }

  /**
   * 获取拥有指定权限的角色列表
   */
  static async getRolesByPermission(permissionId: number): Promise<UnifiedResponse<Role[]>> {
    return rbacAxios.get(`/api/v1/rbac/permissions/${permissionId}/roles`);
  }
}

// 重新导出类型，方便使用
export type { Permission, CreatePermissionRequest, UpdatePermissionRequest, PermissionQueryParams };

export default PermissionService;
