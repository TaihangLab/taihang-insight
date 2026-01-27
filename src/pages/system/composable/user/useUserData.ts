/**
 * 用户数据管理 Composable (TypeScript 版本)
 * 负责用户列表的获取、创建、更新、删除等数据操作
 */

import { ref, computed } from 'vue';
import type { User } from '@/types/rbac';
import type { UserRole } from '@/types/rbac/user';
import { Status, Gender } from '@/types/rbac';
import RBACService from '@/components/service/RBACService';

// ============================================
// 类型定义
// ============================================

/**
 * 用户查询条件
 */
export interface UserSearchConditions {
  tenant_id?: number;
  username?: string;
  nickname?: string;
  phone?: string;
  department_id?: number;
  position?: string;
  role?: string;
  status?: Status;
  gender?: Gender;
}

/**
 * 用户分页参数
 */
export interface UserPagination {
  currentPage: number;
  pageSize: number;
  total: number;
}

/**
 * 用户实体（扩展基础类型，用于兼容）
 */
export interface UserEntity extends User {
  // 扩展字段用于兼容后端返回
  [key: string]: unknown;
}

// ============================================
// Composable
// ============================================

export function useUserData() {
  // ============================================
  // 状态
  // ============================================

  const users = ref<UserEntity[]>([]);
  const loading = ref(false);
  const userRoles = ref<UserRole[]>([]);

  // 分页信息
  const pagination = ref<UserPagination>({
    currentPage: 1,
    pageSize: 10,
    total: 0
  });

  // 计算属性
  const hasData = computed(() => users.value.length > 0);

  // ============================================
  // 方法
  // ============================================

  /**
   * 获取用户列表
   */
  const fetchUsers = async (params: UserSearchConditions, page?: number, pageSize?: number) => {
    loading.value = true;
    try {
      const currentPage = page ?? pagination.value.currentPage;
      const size = pageSize ?? pagination.value.pageSize;

      // 构建查询参数
      const queryParams: Record<string, unknown> = {
        skip: (currentPage - 1) * size,
        limit: size,
        tenant_id: params.tenant_id || 1
      };

      // 添加可选查询条件
      if (params.username) queryParams.username = params.username;
      if (params.nickname) queryParams.nickname = params.nickname;
      if (params.phone) queryParams.phone = params.phone;
      if (params.department_id) queryParams.department_id = params.department_id;
      if (params.position) queryParams.position = params.position;
      if (params.role) queryParams.role = params.role;
      if (params.status !== undefined) queryParams.status = params.status;
      if (params.gender) queryParams.gender = params.gender;

      const response = await RBACService.getUsers(queryParams);

      if (response?.data) {
        // 映射数据
        users.value = (response.data.items || []).map(item => {
          return {
            id: Number(item.id),
            userName: String(item.userName || item.user_name || ''),
            userNickname: String(item.userNickname || item.user_nickname || ''),
            phoneNumber: String(item.phoneNumber || item.phone_number || ''),
            email: String(item.email || ''),
            department: String(item.department || ''),
            departmentId: Number(item.departmentId || item.department_id || 0),
            position: String(item.position || ''),
            gender: (item.gender as Gender) || Gender.MALE,
            status: Number(item.status) as Status,
            tenantCode: String(item.tenantCode || item.tenant_code || ''),
            createTime: String(item.createTime || item.create_time || ''),
            // 保留原始数据
            ...item
          } as UserEntity;
        });

        pagination.value.total = Number(response.data.total || 0);
        pagination.value.currentPage = currentPage;
        pagination.value.pageSize = size;
      }

      return users.value;
    } catch (error) {
      console.error('获取用户列表失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 获取用户角色列表
   */
  const fetchUserRoles = async (userId: number) => {
    try {
      const response = await RBACService.getUserRoles(userId);

      if (response?.data) {
        userRoles.value = (Array.isArray(response.data) ? response.data : []).map(item => ({
          userId: Number(item.userId || item.user_id),
          userName: String(item.userName || item.user_name || ''),
          roleId: Number(item.roleId || item.role_id),
          roleCode: String(item.roleCode || item.role_code || ''),
          roleName: String(item.roleName || item.role_name || '')
        }));
      }

      return userRoles.value;
    } catch (error) {
      console.error('获取用户角色失败:', error);
      throw error;
    }
  };

  /**
   * 创建用户
   */
  const createUser = async (data: Record<string, unknown>) => {
    loading.value = true;
    try {
      await RBACService.createUser(data);
      return { success: true, message: '新增成功' };
    } catch (error) {
      console.error('创建用户失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新用户
   */
  const updateUser = async (userId: number, data: Record<string, unknown>) => {
    loading.value = true;
    try {
      await RBACService.updateUser(userId, data);
      return { success: true, message: '修改成功' };
    } catch (error) {
      console.error('更新用户失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除用户
   */
  const deleteUser = async (userId: number) => {
    loading.value = true;
    try {
      await RBACService.deleteUser(userId);
      return { success: true, message: '删除成功' };
    } catch (error) {
      console.error('删除用户失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 批量删除用户
   */
  const deleteUsers = async (userIds: number[]) => {
    loading.value = true;
    try {
      await RBACService.deleteUsers(userIds);
      return { success: true, message: '批量删除成功' };
    } catch (error) {
      console.error('批量删除用户失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 重置用户密码
   */
  const resetUserPassword = async (userId: number, newPassword: string) => {
    loading.value = true;
    try {
      await RBACService.resetUserPassword(userId, newPassword);
      return { success: true, message: '密码重置成功' };
    } catch (error) {
      console.error('重置密码失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 分配角色给用户
   */
  const assignRolesToUser = async (userId: number, roleIds: number[]) => {
    loading.value = true;
    try {
      await RBACService.assignRolesToUser(userId, roleIds);
      return { success: true, message: '角色分配成功' };
    } catch (error) {
      console.error('分配角色失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 清空数据
   */
  const clearData = () => {
    users.value = [];
    userRoles.value = [];
    pagination.value = {
      currentPage: 1,
      pageSize: 10,
      total: 0
    };
  };

  return {
    // 状态
    users,
    loading,
    userRoles,
    pagination,
    hasData,

    // 方法
    fetchUsers,
    fetchUserRoles,
    createUser,
    updateUser,
    deleteUser,
    deleteUsers,
    resetUserPassword,
    assignRolesToUser,
    clearData
  };
}
