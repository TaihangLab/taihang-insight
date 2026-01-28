import rbacAxios, { UnifiedResponse } from './base'
import type { PaginatedResponse } from '@/types/rbac/common'
import type {
  TenantAPI,
  CreateTenantRequest,
  UpdateTenantRequest,
  TenantQueryParams
} from '@/types/rbac/tenant'

// ============================================
// TenantService 类
// ============================================

class TenantService {
  /**
   * 获取租户列表
   * 返回分页数据格式：{ data: { total, items: [...] } }
   */
  static async getTenants(params?: TenantQueryParams): Promise<UnifiedResponse<PaginatedResponse<TenantAPI>>> {
    try {
      return await rbacAxios.get('/api/v1/rbac/tenants', { params }) as UnifiedResponse<PaginatedResponse<TenantAPI>>
    } catch (error) {
      console.error('获取租户列表失败:', error)
      throw error
    }
  }

  /**
   * 创建租户
   */
  static async createTenant(tenantData: CreateTenantRequest): Promise<UnifiedResponse<TenantAPI>> {
    try {
      return await rbacAxios.post('/api/v1/rbac/tenants', tenantData) as UnifiedResponse<TenantAPI>
    } catch (error) {
      console.error('创建租户失败:', error)
      throw error
    }
  }

  /**
   * 更新租户
   */
  static async updateTenant(
    tenantId: number,
    tenantData: UpdateTenantRequest
  ): Promise<UnifiedResponse<TenantAPI>> {
    try {
      return await rbacAxios.put(`/rbac/tenants/${tenantId}`, tenantData) as UnifiedResponse<TenantAPI>
    } catch (error) {
      console.error('更新租户失败:', error)
      throw error
    }
  }

  /**
   * 删除租户
   */
  static async deleteTenant(tenantId: number): Promise<UnifiedResponse<void>> {
    try {
      return await rbacAxios.delete(`/rbac/tenants/${tenantId}`) as UnifiedResponse<void>
    } catch (error) {
      console.error('删除租户失败:', error)
      throw error
    }
  }

  /**
   * 批量删除租户
   */
  static async batchDeleteTenants(tenantIds: number[]): Promise<UnifiedResponse<void>> {
    try {
      return await rbacAxios.post('/api/v1/rbac/tenants/batch-delete', {
        tenant_ids: tenantIds
      }) as UnifiedResponse<void>
    } catch (error) {
      console.error('批量删除租户失败:', error)
      throw error
    }
  }
}

// 重新导出类型，方便使用
export type { TenantAPI, CreateTenantRequest, UpdateTenantRequest, TenantQueryParams }

export default TenantService
