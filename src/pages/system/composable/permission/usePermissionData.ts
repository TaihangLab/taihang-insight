/**
 * 权限数据管理 Composable (TypeScript 版本)
 * 负责权限列表的获取、创建、更新、删除等数据操作
 * 使用蛇形命名 (snake_case) 与后端保持一致
 */

import { ref, computed } from 'vue';
import type { Permission } from '@/types/rbac';
import type { PermissionTreeNode, PermissionType } from '@/types/rbac/permission';
import { Status } from '@/types/rbac';
import permissionService from '@/api/system/permissionService';

// ============================================
// 类型定义
// ============================================

/**
 * 权限查询条件
 */
export interface PermissionSearchConditions {
  tenant_code?: string;
  permission_name?: string;
  permission_code?: string;
  permission_type?: PermissionType;
  status?: Status;
  creator?: string;
}

/**
 * 权限分页参数
 */
export interface PermissionPagination {
  currentPage: number;
  pageSize: number;
  total: number;
}

/**
 * 权限实体（扩展基础类型，用于兼容）
 */
export interface PermissionEntity extends Permission {
  // 扩展字段用于兼容后端返回
  [key: string]: unknown;
}

// ============================================
// Composable
// ============================================

export function usePermissionData() {
  // ============================================
  // 状态
  // ============================================

  const permissions = ref<PermissionEntity[]>([]);
  const permissionTree = ref<PermissionTreeNode[]>([]);
  const loading = ref(false);

  // 分页信息
  const pagination = ref<PermissionPagination>({
    currentPage: 1,
    pageSize: 10,
    total: 0
  });

  // 计算属性
  const hasData = computed(() => permissions.value.length > 0);
  const hasTreeData = computed(() => permissionTree.value.length > 0);

  // ============================================
  // 方法
  // ============================================

  /**
   * 获取权限列表
   */
  const fetchPermissions = async (params: PermissionSearchConditions, page?: number, pageSize?: number) => {
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
      if (params.permission_name) queryParams.permission_name = params.permission_name;
      if (params.permission_code) queryParams.permission_code = params.permission_code;
      if (params.permission_type) queryParams.permission_type = params.permission_type;
      if (params.status !== undefined) queryParams.status = params.status;
      if (params.creator) queryParams.creator = params.creator;

      const response = await permissionService.getPermissions(queryParams);

      if (response?.data) {
        // response.data 是分页对象：{ items: [...], page, page_size, total, pages }
        const paginatedData = response.data as any;
        const items = Array.isArray(paginatedData.items) ? paginatedData.items : [];

        // 映射数据
        permissions.value = items.map(item => {
          return {
            id: Number(item.id),
            permission_code: String(item.permission_code || ''),
            permission_name: String(item.permission_name || ''),
            permission_type: (item.permission_type) as PermissionType,
            status: Number(item.status) as Status,
            creator: String(item.creator || ''),
            tenant_code: String(item.tenant_code || ''),
            create_time: String(item.create_time || ''),
            // 保留原始数据
            ...item
          } as PermissionEntity;
        });

        // 使用后端返回的总数
        pagination.value.total = Number(paginatedData.total || 0);
        pagination.value.currentPage = currentPage;
        pagination.value.pageSize = size;
      }

      return permissions.value;
    } catch (error) {
      console.error('获取权限列表失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 获取权限树
   * 后端直接返回树型结构，前端直接使用
   */
  const fetchPermissionTree = async () => {
    loading.value = true;
    try {
      const response = await permissionService.getPermissionTree();

      if (response?.data) {
        // 后端直接返回树型结构数据，包含 node_type 字段
        // 使用 unknown 作为中间类型，因为后端返回的数据结构与 PermissionTreeNode 兼容
        const treeData = Array.isArray(response.data) ? response.data : [];
        permissionTree.value = treeData as unknown as PermissionTreeNode[];
      }

      return permissionTree.value;
    } catch (error) {
      console.error('获取权限树失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 创建权限
   */
  const createPermission = async (data: Record<string, unknown>) => {
    loading.value = true;
    try {
      // @ts-ignore - 数据由调用方验证，后端会进行验证
      await permissionService.createPermissionNode(data);
      return { success: true, message: '新增成功' };
    } catch (error) {
      console.error('创建权限失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新权限
   */
  const updatePermission = async (permissionId: number, data: Record<string, unknown>) => {
    loading.value = true;
    try {
      // @ts-ignore - 数据由调用方验证，后端会进行验证
      await permissionService.updatePermissionNode(permissionId, data);
      return { success: true, message: '修改成功' };
    } catch (error) {
      console.error('更新权限失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新权限状态
   */
  const updatePermissionStatus = async (permissionId: number, status: Status) => {
    loading.value = true;
    try {
      await permissionService.updatePermissionNodeStatus(permissionId, status);
      return { success: true, message: '状态更新成功' };
    } catch (error) {
      console.error('更新权限状态失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除权限
   */
  const deletePermission = async (permissionId: number) => {
    loading.value = true;
    try {
      await permissionService.deletePermissionNode(permissionId);
      return { success: true, message: '删除成功' };
    } catch (error) {
      console.error('删除权限失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 清空数据
   */
  const clearData = () => {
    permissions.value = [];
    permissionTree.value = [];
    pagination.value = {
      currentPage: 1,
      pageSize: 10,
      total: 0
    };
  };

  return {
    // 状态
    permissions,
    permissionTree,
    loading,
    pagination,
    hasData,
    hasTreeData,

    // 方法
    fetchPermissions,
    fetchPermissionTree,
    createPermission,
    updatePermission,
    updatePermissionStatus,
    deletePermission,
    clearData
  };
}
