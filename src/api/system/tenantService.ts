import rbacAxios, { UnifiedResponse } from "@/api/commons";
import type { PaginatedResponse } from "@/types/rbac/common";
import type {
  TenantAPI,
  CreateTenantRequest,
  UpdateTenantRequest,
  TenantQueryParams,
} from "@/types/rbac/tenant";

// ============================================
// TenantService 类
// ============================================

class TenantService {
  /**
   * 获取租户列表
   * 返回分页数据格式：{ data: { total, items: [...] } }
   */
  static async getTenants(
    params?: TenantQueryParams,
  ): Promise<UnifiedResponse<PaginatedResponse<TenantAPI>>> {
    return rbacAxios.get("/api/v1/rbac/tenants", { params });
  }

  /**
   * 创建租户
   */
  static async createTenant(tenantData: CreateTenantRequest): Promise<UnifiedResponse<TenantAPI>> {
    return rbacAxios.post("/api/v1/rbac/tenants", tenantData);
  }

  /**
   * 更新租户
   */
  static async updateTenant(
    tenantId: number,
    tenantData: UpdateTenantRequest,
  ): Promise<UnifiedResponse<TenantAPI>> {
    return rbacAxios.put(`/api/v1/rbac/tenants/${tenantId}`, tenantData);
  }

  /**
   * 删除租户
   */
  static async deleteTenant(tenantId: number): Promise<UnifiedResponse<void>> {
    return rbacAxios.delete(`/api/v1/rbac/tenants/${tenantId}`);
  }

  /**
   * 批量删除租户
   */
  static async batchDeleteTenants(tenantIds: number[]): Promise<UnifiedResponse<void>> {
    return rbacAxios.post("/api/v1/rbac/tenants/batch-delete", {
      tenant_ids: tenantIds,
    });
  }
}

// 重新导出类型，方便使用
export type { TenantAPI, CreateTenantRequest, UpdateTenantRequest, TenantQueryParams };

export default TenantService;
