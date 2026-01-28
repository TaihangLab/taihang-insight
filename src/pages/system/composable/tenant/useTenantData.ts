/**
 * 租户数据管理 Composable (TypeScript 版本)
 * 负责租户列表的获取、创建、更新、删除等数据操作
 * 前后端统一使用 snake_case
 */

import { ref, computed } from 'vue';
import type { TenantAPI } from '@/types/rbac/tenant';
import { Status } from '@/types/rbac';
import tenantService from '@/api/rbac/tenantService';

// ============================================
// 类型定义
// ============================================

/**
 * 租户查询条件（snake_case）
 */
export interface TenantSearchConditions {
  tenant_code?: string;
  tenant_name?: string;
  company_name?: string;
  status?: Status;
}

/**
 * 租户分页参数
 */
export interface TenantPagination {
  currentPage: number;
  pageSize: number;
  total: number;
}

/**
 * 租户实体（统一使用 snake_case 格式）
 */
export type TenantEntity = TenantAPI;

// ============================================
// Composable
// ============================================

export function useTenantData() {
  // ============================================
  // 状态
  // ============================================

  const tenants = ref<TenantEntity[]>([]);
  const loading = ref(false);

  // 分页信息
  const pagination = ref<TenantPagination>({
    currentPage: 1,
    pageSize: 10,
    total: 0
  });

  // 计算属性
  const hasData = computed(() => tenants.value.length > 0);

  // ============================================
  // 方法
  // ============================================

  /**
   * 获取租户列表
   */
  const fetchTenants = async (params: TenantSearchConditions, page?: number, pageSize?: number) => {
    loading.value = true;
    try {
      const currentPage = page ?? pagination.value.currentPage;
      const size = pageSize ?? pagination.value.pageSize;

      // 构建查询参数
      const queryParams: Record<string, unknown> = {
        skip: (currentPage - 1) * size,
        limit: size
      };

      // 添加可选查询条件
      if (params.tenant_code) queryParams.tenant_code = params.tenant_code;
      if (params.tenant_name) queryParams.tenant_name = params.tenant_name;
      if (params.company_name) queryParams.company_name = params.company_name;
      if (params.status !== undefined) queryParams.status = params.status;

      const response = await tenantService.getTenants(queryParams);

      if (response?.data) {
        // response.data 是分页对象：{ items: [...], page, page_size, total, pages }
        const paginatedData = response.data as any;
        const items = Array.isArray(paginatedData.items) ? paginatedData.items : [];

        // 直接使用后端返回的 snake_case 数据，不做转换
        tenants.value = items as TenantEntity[];

        // 使用后端返回的总数
        pagination.value.total = Number(paginatedData.total || 0);
        pagination.value.currentPage = currentPage;
        pagination.value.pageSize = size;
      }

      return tenants.value;
    } catch (error) {
      console.error('获取租户列表失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 创建租户
   */
  const createTenant = async (data: Record<string, unknown>) => {
    loading.value = true;
    try {
      // @ts-ignore - 数据由调用方验证，后端会进行验证
      await tenantService.createTenant(data);
      return { success: true, message: '新增成功' };
    } catch (error) {
      console.error('创建租户失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新租户
   */
  const updateTenant = async (tenantId: number, data: Record<string, unknown>) => {
    loading.value = true;
    try {
      // @ts-ignore - 数据由调用方验证，后端会进行验证
      await tenantService.updateTenant(tenantId, data);
      return { success: true, message: '修改成功' };
    } catch (error) {
      console.error('更新租户失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除租户
   */
  const deleteTenant = async (tenantId: number) => {
    loading.value = true;
    try {
      await tenantService.deleteTenant(tenantId);
      return { success: true, message: '删除成功' };
    } catch (error) {
      console.error('删除租户失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 批量删除租户
   */
  const batchDeleteTenants = async (tenantIds: number[]) => {
    loading.value = true;
    try {
      await tenantService.batchDeleteTenants(tenantIds);
      return { success: true, message: '批量删除成功' };
    } catch (error) {
      console.error('批量删除租户失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 清空数据
   */
  const clearData = () => {
    tenants.value = [];
    pagination.value = {
      currentPage: 1,
      pageSize: 10,
      total: 0
    };
  };

  return {
    // 状态
    tenants,
    loading,
    pagination,
    hasData,

    // 方法
    fetchTenants,
    createTenant,
    updateTenant,
    deleteTenant,
    batchDeleteTenants,
    clearData
  };
}
