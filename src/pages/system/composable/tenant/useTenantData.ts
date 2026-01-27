/**
 * 租户数据管理 Composable (TypeScript 版本)
 * 负责租户列表的获取、创建、更新、删除等数据操作
 */

import { ref, computed } from 'vue';
import type { Tenant } from '@/types/rbac';
import { Status } from '@/types/rbac';
import RBACService from '@/components/service/RBACService';

// ============================================
// 类型定义
// ============================================

/**
 * 租户查询条件
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
 * 租户实体（扩展基础类型，用于兼容）
 */
export interface TenantEntity extends Tenant {
  // 扩展字段用于兼容后端返回
  [key: string]: unknown;
}

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

      const response = await RBACService.getTenants(queryParams);

      if (response?.data) {
        // 映射数据
        tenants.value = (response.data.items || []).map(item => {
          return {
            id: Number(item.id),
            companyCode: String(item.companyCode || item.company_code || ''),
            tenantCode: String(item.tenantCode || item.tenant_code || ''),
            tenantName: String(item.tenantName || item.tenant_name || ''),
            companyName: String(item.companyName || item.company_name || ''),
            contactPerson: String(item.contactPerson || item.contact_person || ''),
            contactPhone: String(item.contactPhone || item.contact_phone || ''),
            username: String(item.username || ''),
            package: String(item.package || 'standard'),
            expireTime: String(item.expireTime || item.expire_time || ''),
            userCount: Number(item.userCount || item.user_count || 0),
            domain: String(item.domain || ''),
            address: String(item.address || ''),
            description: String(item.description || ''),
            status: Number(item.status) as Status,
            createTime: String(item.createTime || item.create_time || ''),
            updateTime: String(item.updateTime || item.update_time || ''),
            createBy: String(item.createBy || item.create_by || ''),
            updateBy: String(item.updateBy || item.update_by || ''),
            remark: String(item.remark || ''),
            // 保留原始数据
            ...item
          } as TenantEntity;
        });

        pagination.value.total = Number(response.data.total || 0);
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
      await RBACService.createTenant(data);
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
      await RBACService.updateTenant(tenantId, data);
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
      await RBACService.deleteTenant(tenantId);
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
      await RBACService.batchDeleteTenants(tenantIds);
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
