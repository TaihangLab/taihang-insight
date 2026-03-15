import rbacAxios, { UnifiedResponse } from "@/api/commons";
import type {
  User,
  UserDetail,
  CreateUserRequest,
  UpdateUserRequest,
  ResetPasswordRequest,
  UserQueryParams,
} from "@/types/rbac/user";
import type { Role } from "@/types/rbac/role";

// ============================================
// 用户权限信息类型（本地定义）
// ============================================

/**
 * 用户权限信息
 * 包含权限码和菜单树
 */
export interface UserAuthInfo {
  /** 用户ID */
  user_id: number;
  /** 用户名 */
  user_name: string;
  /** 权限码列表 */
  permissions: string[];
  /** 菜单树 */
  menu_tree: any[];
}

// ============================================
// UserService 类
// ============================================

class UserService {
  /**
   * 获取用户列表
   */
  static async getUsers(params?: UserQueryParams): Promise<UnifiedResponse<User[]>> {
    return rbacAxios.get("/api/v1/rbac/users", { params });
  }

  /**
   * 创建用户
   */
  static async createUser(userData: CreateUserRequest): Promise<UnifiedResponse<User>> {
    return rbacAxios.post("/api/v1/rbac/users", userData);
  }

  /**
   * 更新用户
   */
  static async updateUser(
    userId: number,
    userData: UpdateUserRequest,
  ): Promise<UnifiedResponse<User>> {
    return rbacAxios.put(`/api/v1/rbac/users/${userId}`, userData);
  }

  /**
   * 删除用户
   */
  static async deleteUser(userId: number): Promise<UnifiedResponse<void>> {
    return rbacAxios.delete(`/api/v1/rbac/users/${userId}`);
  }

  /**
   * 批量删除用户
   */
  static async deleteUsers(userIds: number[]): Promise<UnifiedResponse<void>> {
    return rbacAxios.post("/api/v1/rbac/users/batch-delete", {
      user_ids: userIds,
    });
  }

  /**
   * 重置用户密码
   */
  static async resetUserPassword(
    userId: number,
    newPassword: string,
  ): Promise<UnifiedResponse<void>> {
    return rbacAxios.post(`/api/v1/rbac/users/${userId}/reset-password`, {
      new_password: newPassword,
    });
  }

  /**
   * 获取用户的角色列表
   */
  static async getUserRoles(userId: number): Promise<UnifiedResponse<Role[]>> {
    return rbacAxios.get(`/api/v1/rbac/users/${userId}/roles`);
  }

  /**
   * 获取当前用户的权限信息（包含权限码和菜单树）
   */
  static async getUserAuthInfo(): Promise<UnifiedResponse<UserAuthInfo>> {
    return rbacAxios.get("/api/v1/auth/info");
  }
}

// 重新导出类型，方便使用
export type {
  User,
  UserDetail,
  CreateUserRequest,
  UpdateUserRequest,
  ResetPasswordRequest,
  UserQueryParams,
};

export default UserService;
