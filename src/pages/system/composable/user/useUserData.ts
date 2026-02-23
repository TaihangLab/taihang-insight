/**
 * 用户数据管理 Composable
 * 负责用户列表的获取、创建、更新、删除等数据操作
 */

import { ref, computed } from 'vue'
import type { User, UserQueryForm, UserRole, CreateUserRequest, UpdateUserRequest } from '@/types/rbac/user'
import type { PaginationState } from '@/types/rbac/common'
import { useUserInfoStore } from '@/stores/modules/userInfo'
import userService from '@/api/system/userService'
import associationService from '@/api/system/associationService'

// ============================================
// Composable
// ============================================

export function useUserData() {
  // ============================================
  // 依赖
  // ============================================
  const userInfoStore = useUserInfoStore()

  // ============================================
  // 状态
  // ============================================

  const users = ref<User[]>([])
  const userRoles = ref<UserRole[]>([])
  const loading = ref(false)
  const pagination = ref<PaginationState>({
    currentPage: 1,
    pageSize: 10,
    total: 0
  })

  const hasData = computed(() => users.value.length > 0)

  // ============================================
  // 方法
  // ============================================

  /**
   * 获取用户列表
   */
  const fetchUsers = async (params: UserQueryForm, page?: number, pageSize?: number) => {
    loading.value = true
    try {
      const currentPage = page ?? pagination.value.currentPage
      const size = pageSize ?? pagination.value.pageSize

      // 从用户上下文获取 tenant_id，如果没有传入则使用当前用户的租户
      const currentUserInfo = userInfoStore.getUserInfoSync()
      const tenantId = params.tenant_id ?? currentUserInfo?.tenantId
      if (!tenantId) {
        console.warn('[useUserData] 未指定租户ID，跳过获取用户列表')
        users.value = []
        return []
      }

      const queryParams = {
        skip: (currentPage - 1) * size,
        limit: size,
        tenant_id: typeof tenantId === 'number' ? tenantId : Number(tenantId),
        ...(params.username && { username: params.username }),
        ...(params.nick_name && { nick_name: params.nick_name }),
        ...(params.phone && { phone: params.phone }),
        ...(params.dept_id && { dept_id: params.dept_id }),
        ...(params.role && { role: params.role }),
        ...(params.status !== undefined && { status: params.status }),
        ...(params.gender && { gender: params.gender })
      }

      const response = await userService.getUsers(queryParams)

      if (response?.data) {
        // 使用 any 处理后端返回的动态结构
        const paginatedData = response.data as { items?: unknown[]; total?: number }
        const items = Array.isArray(paginatedData.items) ? paginatedData.items : []

        users.value = items.map((item: unknown) => {
          const data = item as Record<string, unknown>
          return {
            id: Number(data.id),
            user_name: String(data.user_name || ''),
            nick_name: String(data.nick_name || ''),
            phone: String(data.phone || ''),
            email: String(data.email || ''),
            dept_id: Number(data.dept_id || 0),
            gender: data.gender ?? 0,
            status: Number(data.status),
            tenant_id: Number(data.tenant_id || 0),
            create_time: String(data.create_time || ''),
            update_time: String(data.update_time || ''),
            ...(data.dept_name && { dept_name: String(data.dept_name) })
          }
        }) as User[]

        pagination.value.total = Number(paginatedData.total || 0)
        pagination.value.currentPage = currentPage
        pagination.value.pageSize = size
      }

      return users.value
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取用户角色列表
   */
  const fetchUserRoles = async (userId: number) => {
    const response = await userService.getUserRoles(userId)

    if (response?.data) {
      // 使用 any 处理后端返回的动态结构
      const roles = Array.isArray(response.data) ? response.data : [response.data]
      userRoles.value = roles.map((item: unknown) => {
        const data = item as Record<string, unknown>
        return {
          user_id: Number(data.userId || data.user_id),
          user_name: String(data.userName || data.user_name || ''),
          role_id: Number(data.roleId || data.role_id),
          role_code: String(data.roleCode || data.role_code || ''),
          role_name: String(data.roleName || data.role_name || '')
        }
      }) as UserRole[]
    }

    return userRoles.value
  }

  /**
   * 创建用户
   */
  const createUser = async (data: CreateUserRequest) => {
    await userService.createUser(data)
  }

  /**
   * 更新用户
   */
  const updateUser = async (userId: number, data: Omit<UpdateUserRequest, 'id'>) => {
    await userService.updateUser(userId, { id: userId, ...data })
  }

  /**
   * 删除用户
   */
  const deleteUser = async (userId: number) => {
    await userService.deleteUser(userId)
  }

  /**
   * 批量删除用户
   */
  const deleteUsers = async (userIds: number[]) => {
    await userService.deleteUsers(userIds)
  }

  /**
   * 重置用户密码
   */
  const resetUserPassword = async (userId: number, newPassword: string) => {
    await userService.resetUserPassword(userId, newPassword)
  }

  /**
   * 分配角色给用户
   */
  const assignRolesToUser = async (userId: number, roleIds: number[]) => {
    await associationService.assignRolesToUser(userId, roleIds)
  }

  /**
   * 清空数据
   */
  const clearData = () => {
    users.value = []
    userRoles.value = []
    pagination.value = {
      currentPage: 1,
      pageSize: 10,
      total: 0
    }
  }

  return {
    users,
    userRoles,
    loading,
    pagination,
    hasData,
    fetchUsers,
    fetchUserRoles,
    createUser,
    updateUser,
    deleteUser,
    deleteUsers,
    resetUserPassword,
    assignRolesToUser,
    clearData
  }
}
