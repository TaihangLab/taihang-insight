import rbacAxios, { UnifiedResponse } from './base'
import type { User } from '@/types/rbac/user'
import type { Role } from '@/types/rbac/role'
import type { Permission } from '@/types/rbac/permission'

// 重新导出类型，方便外部使用
export type { User } from '@/types/rbac/user'
export type { Role } from '@/types/rbac/role'
export type { Permission } from '@/types/rbac/permission'

export interface AssignRoleToUserRequest {
  user_id: number
  role_id: number
}

export interface AssignRolesToUserRequest {
  user_id: number
  role_ids: number[]
}

export interface AssignPermissionToRoleRequest {
  role_id: number
  permission_id: number
}

export interface CheckPermissionRequest {
  user_id: number
  url: string
  method: string
}

export interface CheckPermissionResponse {
  has_permission: boolean
  [key: string]: any
}

// ============================================
// AssociationService 类
// ============================================

class AssociationService {
  // 用户角色关联API

  /**
   * 分配角色给用户
   */
  static async assignRoleToUser(
    userId: number,
    roleId: number
  ): Promise<UnifiedResponse<void>> {
    try {
      return await rbacAxios.post('/api/v1/rbac/user-roles', {
        user_id: userId,
        role_id: roleId
      })
    } catch (error) {
      console.error('分配角色给用户失败:', error)
      throw error
    }
  }

  /**
   * 批量分配角色给用户
   */
  static async assignRolesToUser(
    userId: number,
    roleIds: number[]
  ): Promise<UnifiedResponse<void>> {
    try {
      return await rbacAxios.post('/api/v1/rbac/user-roles', {
        user_id: userId,
        role_ids: roleIds
      })
    } catch (error) {
      console.error('批量分配角色给用户失败:', error)
      throw error
    }
  }

  /**
   * 移除用户角色
   */
  static async removeUserRole(
    userId: number,
    roleId: number
  ): Promise<UnifiedResponse<void>> {
    try {
      return await rbacAxios.delete('/api/v1/rbac/user-roles', {
        params: {
          user_id: userId,
          role_id: roleId
        }
      })
    } catch (error) {
      console.error('移除用户角色失败:', error)
      throw error
    }
  }

  /**
   * 获取拥有指定角色的用户列表
   */
  static async getUsersByRole(roleId: number): Promise<UnifiedResponse<User[]>> {
    try {
      return await rbacAxios.get('/api/v1/rbac/users', {
        params: { role_id: roleId }
      })
    } catch (error) {
      console.error('获取角色用户失败:', error)
      throw error
    }
  }

  // 角色权限关联API

  /**
   * 分配权限给角色
   */
  static async assignPermissionToRole(
    roleId: number,
    permissionId: number
  ): Promise<UnifiedResponse<void>> {
    try {
      return await rbacAxios.post('/api/v1/rbac/role-permissions', {
        role_id: roleId,
        permission_id: permissionId
      })
    } catch (error) {
      console.error('分配权限给角色失败:', error)
      throw error
    }
  }

  /**
   * 批量分配权限给角色
   */
  static async assignPermissionsToRole(
    roleId: number,
    permissionIds: number[]
  ): Promise<UnifiedResponse<void>> {
    try {
      return await rbacAxios.post('/api/v1/rbac/role-permissions', {
        role_id: roleId,
        permission_ids: permissionIds
      })
    } catch (error) {
      console.error('批量分配权限给角色失败:', error)
      throw error
    }
  }

  /**
   * 移除角色权限
   */
  static async removeRolePermission(
    roleId: number,
    permissionId: number
  ): Promise<UnifiedResponse<void>> {
    try {
      // 使用正确的后端端点：DELETE /role-permissions-by-id
      return await rbacAxios.delete('/api/v1/rbac/role-permissions-by-id', {
        params: {
          role_id: roleId,
          permission_id: permissionId
        }
      })
    } catch (error) {
      console.error('移除角色权限失败:', error)
      throw error
    }
  }

  // 权限验证API

  /**
   * 检查用户权限
   */
  static async checkUserPermission(
    userId: number,
    url: string,
    method: string
  ): Promise<UnifiedResponse<CheckPermissionResponse>> {
    try {
      return await rbacAxios.post('/api/v1/rbac/permissions/check', {
        user_id: userId,
        url,
        method
      })
    } catch (error) {
      console.error('检查用户权限失败:', error)
      throw error
    }
  }

  /**
   * 获取用户权限列表
   */
  static async getUserPermissions(userId: number): Promise<UnifiedResponse<Permission[]>> {
    try {
      return await rbacAxios.get(`/rbac/permissions/user/${userId}`)
    } catch (error) {
      console.error('获取用户权限列表失败:', error)
      throw error
    }
  }

  /**
   * 获取权限树
   */
  static async getPermissionTree(params?: number | { include_disabled?: boolean; tenant_id?: number }): Promise<UnifiedResponse<Permission[]>> {
    try {
      let queryParams: Record<string, unknown> = {};

      if (typeof params === 'number') {
        queryParams = { tenant_id: params };
      } else if (params && typeof params === 'object') {
        if ('tenant_id' in params) queryParams.tenant_id = params.tenant_id;
        if ('include_disabled' in params) queryParams.include_disabled = params.include_disabled;
      }

      return await rbacAxios.get('/api/v1/rbac/permissions/tree', { params: queryParams })
    } catch (error) {
      console.error('获取权限树失败:', error)
      throw error
    }
  }

  /**
   * 获取角色权限列表
   */
  static async getRolePermissions(roleId: number): Promise<UnifiedResponse<Permission[]>> {
    try {
      return await rbacAxios.get(`/rbac/permissions/role/${roleId}`)
    } catch (error) {
      console.error('获取角色权限失败:', error)
      throw error
    }
  }

  /**
   * 获取角色列表
   */
  static async getRoles(params?: { tenant_id?: number; page?: number; size?: number; skip?: number; limit?: number }): Promise<UnifiedResponse<Role[]>> {
    try {
      // 支持两种参数格式
      const queryParams: Record<string, unknown> = {};

      if (params) {
        // 支持 skip/limit 格式（映射到后端的 page/size）
        if ('skip' in params) queryParams.page = (params.skip / 10) + 1; // 假设每页10条
        if ('limit' in params) queryParams.size = params.limit;
        // 租户ID
        if ('tenant_id' in params) queryParams.tenant_id = params.tenant_id;
      }

      return await rbacAxios.get('/api/v1/rbac/roles', { params })
    } catch (error) {
      console.error('获取角色列表失败:', error)
      throw error
    }
  }

  /**
   * 获取用户角色列表
   */
  static async getUserRoles(userId: number): Promise<UnifiedResponse<Role[]>> {
    try {
      return await rbacAxios.get(`/rbac/user-roles/${userId}`)
    } catch (error) {
      console.error('获取用户角色失败:', error)
      throw error
    }
  }
}

export default AssociationService
