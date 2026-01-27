/**
 * 权限数据管理 Composable (TypeScript 版本)
 * 负责权限列表的获取、创建、更新、删除等数据操作
 */

import { ref, computed } from 'vue';
import type { Permission } from '@/types/rbac';
import type { PermissionTreeNode, PermissionType } from '@/types/rbac/permission';
import { PermissionNodeType } from '@/types/rbac/permission';
import { Status } from '@/types/rbac';
import RBACService from '@/components/service/RBACService';

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

      const response = await RBACService.getPermissions(queryParams);

      if (response?.data) {
        // 映射数据
        permissions.value = (response.data.items || []).map(item => {
          return {
            id: Number(item.id),
            permissionCode: String(item.permissionCode || item.permission_code || ''),
            permissionName: String(item.permissionName || item.permission_name || ''),
            permissionType: (item.permissionType || item.permission_type) as PermissionType,
            status: Number(item.status) as Status,
            creator: String(item.creator || ''),
            tenantCode: String(item.tenantCode || item.tenant_code || ''),
            createTime: String(item.createTime || item.create_time || ''),
            // 保留原始数据
            ...item
          } as PermissionEntity;
        });

        pagination.value.total = Number(response.data.total || 0);
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
   */
  const fetchPermissionTree = async () => {
    loading.value = true;
    try {
      const response = await RBACService.getPermissionTree();

      if (response?.data) {
        // 映射树形数据
        const mapTreeNode = (node: Record<string, unknown>): PermissionTreeNode => {
          // 映射节点类型字符串到枚举
          const nodeTypeStr = String(node.nodeType || node.node_type || 'directory');
          let nodeType: PermissionNodeType = PermissionNodeType.DIRECTORY;
          if (nodeTypeStr === 'menu') nodeType = PermissionNodeType.MENU;
          else if (nodeTypeStr === 'button') nodeType = PermissionNodeType.BUTTON;

          return {
            id: Number(node.id),
            permissionCode: String(node.permissionCode || node.permission_code || ''),
            permissionName: String(node.permissionName || node.permission_name || ''),
            permissionType: (node.permissionType || node.permission_type) as PermissionType,
            nodeType,
            parentId: node.parentId !== null && node.parentId !== undefined
              ? Number(node.parentId)
              : null,
            path: node.path ? String(node.path) : undefined,
            component: node.component ? String(node.component) : undefined,
            icon: node.icon ? String(node.icon) : undefined,
            sortOrder: Number(node.sortOrder || node.sort_order || 0),
            status: Number(node.status) as Status,
            visible: Boolean(node.visible ?? true),
            children: Array.isArray(node.children) && node.children.length > 0
              ? node.children.map(mapTreeNode)
              : []
          };
        };

        const treeData = Array.isArray(response.data) ? response.data : [];
        permissionTree.value = treeData.map(mapTreeNode);
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
      await RBACService.createPermission(data);
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
      await RBACService.updatePermission(permissionId, data);
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
      await RBACService.updatePermissionStatus(permissionId, status);
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
      await RBACService.deletePermission(permissionId);
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
