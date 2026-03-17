import rbacAxios from "@/api/system/base";
import type { UnifiedResponse } from "@/api/commons";
import type { User } from "@/types/rbac/user";
import type { Role } from "@/types/rbac/role";
import type { Permission } from "@/types/rbac/permission";

// 重新导出类型，方便外部使用
export type { User } from "@/types/rbac/user";
export type { Role } from "@/types/rbac/role";
export type { Permission } from "@/types/rbac/permission";

export interface AssignRoleToUserRequest {
  user_id: string;
  role_id: number;
}

export interface AssignRolesToUserRequest {
  user_id: string;
  role_ids: number[];
}

export interface AssignPermissionToRoleRequest {
  role_id: number;
  permission_id: number;
}

export interface CheckPermissionRequest {
  user_id: string;
  url: string;
  method: string;
}

export interface CheckPermissionResponse {
  has_permission: boolean;
  [key: string]: any;
}

// ============================================
// AssociationService 类
// ============================================

class AssociationService {
  // 用户角色关联API

  /**
   * 分配角色给用户
   */
  static async assignRoleToUser(userId: string, roleId: number): Promise<UnifiedResponse<void>> {
    return rbacAxios.post("/api/v1/rbac/user-roles", {
      user_id: userId,
      role_id: roleId,
    });
  }

  /**
   * 批量分配角色给用户
   */
  static async assignRolesToUser(
    userId: string,
    roleIds: number[],
  ): Promise<UnifiedResponse<void>> {
    return rbacAxios.post("/api/v1/rbac/user-roles", {
      user_id: userId,
      role_ids: roleIds,
    });
  }

  /**
   * 移除用户角色
   */
  static async removeUserRole(userId: string, roleId: number): Promise<UnifiedResponse<void>> {
    return rbacAxios.delete("/api/v1/rbac/user-roles", {
      params: {
        user_id: userId,
        role_id: roleId,
      },
    });
  }

  /**
   * 获取拥有指定角色的用户列表
   */
  static async getUsersByRole(roleId: number): Promise<UnifiedResponse<User[]>> {
    return rbacAxios.get("/api/v1/rbac/users", {
      params: { role_id: roleId },
    });
  }

  // 角色权限关联API

  /**
   * 分配权限给角色
   */
  static async assignPermissionToRole(
    roleId: number,
    permissionId: number,
  ): Promise<UnifiedResponse<void>> {
    return rbacAxios.post("/api/v1/rbac/role-permissions", {
      role_id: roleId,
      permission_id: permissionId,
    });
  }

  /**
   * 批量分配权限给角色
   */
  static async assignPermissionsToRole(
    roleId: number,
    permissionIds: number[],
  ): Promise<UnifiedResponse<void>> {
    return rbacAxios.post("/api/v1/rbac/role-permissions", {
      role_id: roleId,
      permission_ids: permissionIds,
    });
  }

  /**
   * 移除角色权限
   */
  static async removeRolePermission(
    roleId: number,
    permissionId: number,
  ): Promise<UnifiedResponse<void>> {
    // 使用正确的后端端点：DELETE /role-permissions-by-id
    return rbacAxios.delete("/api/v1/rbac/role-permissions-by-id", {
      params: {
        role_id: roleId,
        permission_id: permissionId,
      },
    });
  }

  // 权限验证API

  /**
   * 检查用户权限
   */
  static async checkUserPermission(
    userId: string,
    url: string,
    method: string,
  ): Promise<UnifiedResponse<CheckPermissionResponse>> {
    return rbacAxios.post("/api/v1/rbac/permissions/check", {
      user_id: userId,
      url,
      method,
    });
  }

  /**
   * 获取用户权限列表
   */
  static async getUserPermissions(userId: string): Promise<UnifiedResponse<Permission[]>> {
    return rbacAxios.get(`/api/v1/rbac/permissions/user/${userId}`);
  }

  /**
   * 获取权限树
   * 使用 /permission-tree 端点，不需要权限检查
   * 用于角色分配权限对话框，避免权限循环依赖问题
   */
  static async getPermissionTree(
    params?: number | { include_disabled?: boolean; tenant_id?: number },
  ): Promise<UnifiedResponse<Permission[]>> {
    let queryParams: Record<string, unknown> = {};

    if (typeof params === "number") {
      queryParams = { tenant_id: params };
    } else if (params && typeof params === "object") {
      if ("tenant_id" in params) queryParams.tenant_id = params.tenant_id;
      if ("include_disabled" in params) queryParams.include_disabled = params.include_disabled;
    }

    // 使用不需要权限检查的端点，避免权限循环依赖
    return rbacAxios.get("/api/v1/rbac/permission-tree", { params: queryParams });
  }

  /**
   * 获取角色权限列表
   */
  static async getRolePermissions(roleId: number): Promise<UnifiedResponse<Permission[]>> {
    return rbacAxios.get(`/api/v1/rbac/permissions/role/${roleId}`);
  }

  /**
   * 获取角色列表
   */
  static async getRoles(params?: {
    tenant_id?: string;
    page?: number;
    size?: number;
    skip?: number;
    limit?: number;
  }): Promise<UnifiedResponse<Role[]>> {
    // 支持两种参数格式
    const queryParams: Record<string, unknown> = {};

    if (params) {
      // 支持 skip/limit 格式（映射到后端的 page/size）
      if ("skip" in params && params.skip !== undefined) {
        queryParams.page = params.skip / 10 + 1; // 假设每页10条
      }
      if ("limit" in params && params.limit !== undefined) {
        queryParams.size = params.limit;
      }
      // 租户ID（字符串类型）
      if ("tenant_id" in params && params.tenant_id !== undefined && params.tenant_id !== null && params.tenant_id !== "") {
        queryParams.tenant_id = params.tenant_id;
      }
    }

    return rbacAxios.get("/api/v1/rbac/roles", { params });
  }

  /**
   * 获取用户角色列表
   * 使用查询参数而非路径参数：/api/v1/rbac/user-roles?user_id=xxx
   */
  static async getUserRoles(userId: string): Promise<UnifiedResponse<Role[]>> {
    return rbacAxios.get("/api/v1/rbac/user-roles", {
      params: { user_id: userId }
    });
  }
}

export default AssociationService;
