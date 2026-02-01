import rbacAxios, { UnifiedResponse } from '@/api/commons'
import type {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  RoleQueryParams
} from '@/types/rbac/role'
import type { Permission } from '@/types/rbac/permission'

// ============================================
// RoleService 类
// ============================================

class RoleService {
  /**
   * 获取角色列表
   */
  static async getRoles(params?: RoleQueryParams): Promise<UnifiedResponse<Role[]>> {
    try {
      return await rbacAxios.get('/api/v1/rbac/roles', { params })
    } catch (error) {
      console.error('获取角色列表失败:', error)
      throw error
    }
  }

  /**
   * 创建角色
   */
  static async createRole(roleData: CreateRoleRequest): Promise<UnifiedResponse<Role>> {
    try {
      return await rbacAxios.post('/api/v1/rbac/roles', roleData)
    } catch (error) {
      console.error('创建角色失败:', error)
      throw error
    }
  }

  /**
   * 更新角色
   */
  static async updateRole(roleId: number, roleData: UpdateRoleRequest): Promise<UnifiedResponse<Role>> {
    try {
      return await rbacAxios.put(`/rbac/roles/${roleId}`, roleData)
    } catch (error) {
      console.error('更新角色失败:', error)
      throw error
    }
  }

  /**
   * 删除角色
   */
  static async deleteRole(roleId: number): Promise<UnifiedResponse<void>> {
    try {
      return await rbacAxios.delete(`/rbac/roles/${roleId}`)
    } catch (error) {
      console.error('删除角色失败:', error)
      throw error
    }
  }

  /**
   * 获取角色的权限列表
   */
  static async getRolePermissions(params: number | { role_id: number | string }): Promise<UnifiedResponse<Permission[]>> {
    try {
      // 如果传入的是对象，则从中提取role_id
      const roleId = typeof params === 'object' && params !== null ? params.role_id : params
      return await rbacAxios.get(`/rbac/role-permissions`, {
        params: { role_id: roleId }
      })
    } catch (error) {
      console.error('获取角色权限失败:', error)
      throw error
    }
  }
}

// 重新导出类型，方便使用
export type { Role, CreateRoleRequest, UpdateRoleRequest, RoleQueryParams }

export default RoleService
