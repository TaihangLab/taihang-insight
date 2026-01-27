/**
 * 角色数据管理 Composable (TypeScript 版本)
 * 负责角色列表的获取、创建、更新、删除等数据操作
 */

import { ref, computed } from 'vue';
import type { Role } from '@/types/rbac';
import type { RolePermission } from '@/types/rbac/role';
import { Status, DataScope } from '@/types/rbac';
import RBACService from '@/components/service/RBACService';

// ============================================
// 类型定义
// ============================================

/**
 * 角色查询条件
 */
export interface RoleSearchConditions {
  tenant_code?: string;
  role_name?: string;
  role_code?: string;
  status?: Status;
  data_scope?: DataScope;
}

/**
 * 角色分页参数
 */
export interface RolePagination {
  currentPage: number;
  pageSize: number;
  total: number;
}

/**
 * 角色实体（扩展基础类型，用于兼容）
 */
export interface RoleEntity extends Role {
  // 扩展字段用于兼容后端返回
  [key: string]: unknown;
}

// ============================================
// Composable
// ============================================

export function useRoleData() {
  // ============================================
  // 状态
  // ============================================

  const roles = ref<RoleEntity[]>([]);
  const loading = ref(false);
  const rolePermissions = ref<RolePermission[]>([]);

  // 分页信息
  const pagination = ref<RolePagination>({
    currentPage: 1,
    pageSize: 10,
    total: 0
  });

  // 计算属性
  const hasData = computed(() => roles.value.length > 0);

  // ============================================
  // 方法
  // ============================================

  /**
   * 获取角色列表
   */
  const fetchRoles = async (params: RoleSearchConditions, page?: number, pageSize?: number) => {
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
      if (params.role_name) queryParams.role_name = params.role_name;
      if (params.role_code) queryParams.role_code = params.role_code;
      if (params.status !== undefined) queryParams.status = params.status;
      if (params.data_scope) queryParams.data_scope = params.data_scope;

      const response = await RBACService.getRoles(queryParams);

      if (response?.data) {
        // 映射数据
        roles.value = (response.data.items || []).map(item => {
          return {
            id: Number(item.id),
            roleCode: String(item.roleCode || item.role_code || ''),
            roleName: String(item.roleName || item.role_name || ''),
            dataScope: (item.dataScope || item.data_scope || DataScope.ALL) as DataScope,
            status: Number(item.status) as Status,
            tenantCode: String(item.tenantCode || item.tenant_code || ''),
            createTime: String(item.createTime || item.create_time || ''),
            // 保留原始数据
            ...item
          } as RoleEntity;
        });

        pagination.value.total = Number(response.data.total || 0);
        pagination.value.currentPage = currentPage;
        pagination.value.pageSize = size;
      }

      return roles.value;
    } catch (error) {
      console.error('获取角色列表失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 获取角色权限列表
   */
  const fetchRolePermissions = async (roleId: number) => {
    try {
      const response = await RBACService.getRolePermissions(roleId);

      if (response?.data) {
        rolePermissions.value = (Array.isArray(response.data) ? response.data : []).map(item => ({
          roleId: Number(item.roleId || item.role_id),
          roleName: String(item.roleName || item.role_name || ''),
          permissionId: Number(item.permissionId || item.permission_id),
          permissionCode: String(item.permissionCode || item.permission_code || ''),
          permissionName: String(item.permissionName || item.permission_name || '')
        }));
      }

      return rolePermissions.value;
    } catch (error) {
      console.error('获取角色权限失败:', error);
      throw error;
    }
  };

  /**
   * 创建角色
   */
  const createRole = async (data: Record<string, unknown>) => {
    loading.value = true;
    try {
      await RBACService.createRole(data);
      return { success: true, message: '新增成功' };
    } catch (error) {
      console.error('创建角色失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新角色
   */
  const updateRole = async (roleId: number, data: Record<string, unknown>) => {
    loading.value = true;
    try {
      await RBACService.updateRole(roleId, data);
      return { success: true, message: '修改成功' };
    } catch (error) {
      console.error('更新角色失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除角色
   */
  const deleteRole = async (roleId: number) => {
    loading.value = true;
    try {
      await RBACService.deleteRole(roleId);
      return { success: true, message: '删除成功' };
    } catch (error) {
      console.error('删除角色失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 分配权限给角色
   */
  const assignPermissionsToRole = async (roleId: number, permissionIds: number[]) => {
    loading.value = true;
    try {
      await RBACService.assignPermissionToRole(roleId, permissionIds);
      return { success: true, message: '权限分配成功' };
    } catch (error) {
      console.error('分配权限失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 移除角色权限
   */
  const removeRolePermission = async (roleId: number, permissionId: number) => {
    loading.value = true;
    try {
      await RBACService.removeRolePermission(roleId, permissionId);
      return { success: true, message: '权限移除成功' };
    } catch (error) {
      console.error('移除权限失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 清空数据
   */
  const clearData = () => {
    roles.value = [];
    rolePermissions.value = [];
    pagination.value = {
      currentPage: 1,
      pageSize: 10,
      total: 0
    };
  };

  return {
    // 状态
    roles,
    loading,
    rolePermissions,
    pagination,
    hasData,

    // 方法
    fetchRoles,
    fetchRolePermissions,
    createRole,
    updateRole,
    deleteRole,
    assignPermissionsToRole,
    removeRolePermission,
    clearData
  };
}
