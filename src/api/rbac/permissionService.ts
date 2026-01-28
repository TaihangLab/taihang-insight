import rbacAxios, { UnifiedResponse } from './base'
import type {
  Permission,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  PermissionQueryParams
} from '@/types/rbac/permission'
import type { Role } from '@/types/rbac/role'

// ============================================
// PermissionService 类
// ============================================

class PermissionService {
  /**
   * 获取权限树
   */
  static async getPermissionTree(params?: PermissionQueryParams & { include_disabled?: boolean }): Promise<UnifiedResponse<Permission[]>> {
    try {
      return await rbacAxios.get('/api/v1/rbac/permissions/tree', { params })
    } catch (error) {
      console.error('获取权限树失败:', error)
      throw error
    }
  }

  /**
   * 获取权限列表（分页）
   */
  static async getPermissions(params?: PermissionQueryParams): Promise<UnifiedResponse<Permission[]>> {
    try {
      return await rbacAxios.get('/api/v1/rbac/permissions', { params })
    } catch (error) {
      console.error('获取权限列表失败:', error)
      throw error
    }
  }

  /**
   * 创建权限节点
   */
  static async createPermissionNode(nodeData: CreatePermissionRequest): Promise<UnifiedResponse<Permission>> {
    try {
      const response = await rbacAxios.post('/api/v1/rbac/permissions', nodeData)
      return response.data as UnifiedResponse<Permission>
    } catch (error) {
      console.error('创建权限节点失败:', error)
      throw error
    }
  }

  /**
   * 更新权限节点
   */
  static async updatePermissionNode(
    nodeId: number,
    nodeData: UpdatePermissionRequest
  ): Promise<UnifiedResponse<Permission>> {
    try {
      const response = await rbacAxios.put(`/api/v1/rbac/permissions/${nodeId}`, nodeData)
      return response.data as UnifiedResponse<Permission>
    } catch (error) {
      console.error('更新权限节点失败:', error)
      throw error
    }
  }

  /**
   * 删除权限节点
   */
  static async deletePermissionNode(nodeId: number, force: boolean = false): Promise<UnifiedResponse<void>> {
    try {
      const params = { force }
      await rbacAxios.delete(`/api/v1/rbac/permissions/${nodeId}`, { params })
      return { success: true, code: 0, message: '删除成功', data: undefined }
    } catch (error) {
      console.error('删除权限节点失败:', error)
      throw error
    }
  }

  /**
   * 获取权限节点详情
   */
  static async getPermissionNode(nodeId: number): Promise<UnifiedResponse<Permission>> {
    try {
      const response = await rbacAxios.get(`/api/v1/rbac/permissions/${nodeId}`)
      return response.data as UnifiedResponse<Permission>
    } catch (error) {
      console.error('获取权限节点详情失败:', error)
      throw error
    }
  }

  /**
   * 验证权限码唯一性
   */
  static async validateCode(code: string, excludeId?: number | null): Promise<UnifiedResponse<{ exists: boolean; code: string }>> {
    try {
      const params: any = { code }
      if (excludeId) {
        params.exclude_id = excludeId
      }
      const response = await rbacAxios.get('/api/v1/rbac/permissions/validate-code', { params })
      return response.data as UnifiedResponse<{ exists: boolean; code: string }>
    } catch (error) {
      console.error('验证权限码失败:', error)
      throw error
    }
  }

  /**
   * 更新权限节点状态
   */
  static async updatePermissionNodeStatus(nodeId: number, status: number): Promise<UnifiedResponse<void>> {
    try {
      await rbacAxios.patch(`/api/v1/rbac/permissions/${nodeId}/status`, { status })
      return { success: true, code: 0, message: '更新成功', data: undefined }
    } catch (error) {
      console.error('更新权限状态失败:', error)
      throw error
    }
  }

  /**
   * 获取拥有指定权限的角色列表
   */
  static async getRolesByPermission(permissionId: number): Promise<UnifiedResponse<Role[]>> {
    try {
      const response = await rbacAxios.get(`/api/v1/rbac/permissions/${permissionId}/roles`)
      return response.data as UnifiedResponse<Role[]>
    } catch (error) {
      console.error('获取权限角色失败:', error)
      throw error
    }
  }
}

// 重新导出类型，方便使用
export type { Permission, CreatePermissionRequest, UpdatePermissionRequest, PermissionQueryParams }

export default PermissionService
