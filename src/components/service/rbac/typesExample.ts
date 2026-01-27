/**
 * RBAC 类型使用示例
 * 展示如何在组件和服务中使用 RBAC 类型定义
 */

import type {
  UserQueryParams,
  UserListResponse,
  CreateUserRequest
} from '@/types/rbac';
import { Status, Gender, DataScope, PermissionType } from '@/types/rbac';

// ============================================
// 示例 1: 在服务层中使用类型
// ============================================

/**
 * 用户服务示例
 */
export class UserServiceExample {
  /**
   * 获取用户列表
   */
  async getUsers(params: UserQueryParams): Promise<UserListResponse> {
    // params 现在有了完整的类型约束
    const { skip = 0, limit = 10, tenant_code, ...filters } = params;

    // 构建查询参数
    const queryParams = new URLSearchParams({
      skip: String(skip),
      limit: String(limit),
      tenant_code
    });

    // 添加可选过滤参数
    if (filters.username) queryParams.append('username', filters.username);
    if (filters.status !== undefined) queryParams.append('status', String(filters.status));
    if (filters.gender) queryParams.append('gender', filters.gender);

    // 发送请求...
    const response = await fetch(`/api/v1/rbac/users?${queryParams}`);
    return response.json();
  }

  /**
   * 创建用户
   */
  async createUser(userData: CreateUserRequest): Promise<UserListResponse> {
    // userData 参数现在有明确的类型约束
    const response = await fetch('/api/v1/rbac/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  }
}

// ============================================
// 示例 2: 在 Vue 3 组件中使用类型
// ============================================

import { ref, reactive } from 'vue';

/**
 * 用户管理组件示例 (使用 Composition API)
 */
export function useUserManagement() {
  // 列表数据
  const userList = ref<UserListResponse['data'] | null>(null);
  const loading = ref(false);

  // 查询参数 - 使用类型约束
  const queryParams = reactive<UserQueryParams>({
    skip: 0,
    limit: 10,
    tenant_code: 'default', // 必填字段
    // 可选字段
    username: undefined,
    status: undefined
  });

  // 分页信息
  const pagination = reactive({
    currentPage: 1,
    pageSize: 10,
    total: 0
  });

  /**
   * 加载用户列表
   */
  const loadUsers = async () => {
    loading.value = true;
    try {
      // 计算分页参数
      queryParams.skip = (pagination.currentPage - 1) * pagination.pageSize;
      queryParams.limit = pagination.pageSize;

      // 调用服务
      const response = await new UserServiceExample().getUsers(queryParams);

      if (response.success && response.data) {
        userList.value = response.data;
        pagination.total = response.data.total;
      }
    } finally {
      loading.value = false;
    }
  };

  /**
   * 搜索用户
   */
  const searchUsers = async (filters: Partial<Omit<UserQueryParams, 'tenant_code'>>) => {
    // 合并过滤条件，类型安全
    Object.assign(queryParams, filters);
    pagination.currentPage = 1; // 重置到第一页
    await loadUsers();
  };

  return {
    userList,
    loading,
    queryParams,
    pagination,
    loadUsers,
    searchUsers
  };
}

// ============================================
// 示例 3: 类型约束的实际应用
// ============================================

/**
 * 构建安全的查询参数
 */
export function buildUserQueryParams(
  tenantCode: string,
  filters?: Partial<Omit<UserQueryParams, 'tenant_code'>>
): UserQueryParams {
  // 确保必填字段存在
  const params: UserQueryParams = {
    skip: 0,
    limit: 10,
    tenant_code: tenantCode
  };

  // 安全地添加可选参数
  if (filters?.username) params.username = filters.username;
  if (filters?.status !== undefined) params.status = filters.status;
  if (filters?.gender) params.gender = filters.gender;

  return params;
}

/**
 * 类型守卫示例 - 验证状态值
 */
export function isValidStatus(status: number): status is Status {
  return status === Status.ENABLED || status === Status.DISABLED;
}

/**
 * 类型守卫示例 - 验证性别值
 */
export function isValidGender(gender: string): gender is Gender {
  return gender === Gender.MALE || gender === Gender.FEMALE;
}

// ============================================
// 示例 4: 枚举类型的使用
// ============================================

/**
 * 状态选项映射
 */
export const STATUS_OPTIONS = [
  { label: '启用', value: Status.ENABLED },
  { label: '停用', value: Status.DISABLED }
] as const;

/**
 * 性别选项映射
 */
export const GENDER_OPTIONS = [
  { label: '男', value: Gender.MALE },
  { label: '女', value: Gender.FEMALE }
] as const;

/**
 * 数据权限范围选项映射
 */
export const DATA_SCOPE_OPTIONS = [
  { label: '全部数据权限', value: DataScope.ALL },
  { label: '自定数据权限', value: DataScope.CUSTOM },
  { label: '本部门数据权限', value: DataScope.DEPARTMENT },
  { label: '本部门及以下数据权限', value: DataScope.DEPARTMENT_AND_BELOW }
] as const;

/**
 * 权限类型选项映射
 * 根据文档定义的权限类型
 */
export const PERMISSION_TYPE_OPTIONS = [
  { label: '页面权限', value: PermissionType.PAGE },
  { label: '按钮权限', value: PermissionType.BUTTON },
  { label: '数据权限', value: PermissionType.DATA }
] as const;

// ============================================
// 示例 5: API 响应类型转换
// ============================================

/**
 * 将后端响应转换为前端类型
 */
export function transformUserResponse(backendResponse: unknown): UserListResponse {
  // 这里可以进行数据验证和转换
  // 实际使用时可能需要使用 zod 或类似库进行运行时验证

  return backendResponse as UserListResponse;
}

/**
 * 安全地获取用户列表数据
 */
export function getUserListData(
  response: UserListResponse
): UserListResponse['data']['items'] | null {
  if (response.success && response.data) {
    return response.data.items;
  }
  return null;
}

// ============================================
// 示例 6: 组合查询参数（使用 Builder 模式）
// ============================================

import type { RoleQueryParams } from '@/types/rbac';

/**
 * 角色查询参数构建器
 */
export class RoleQueryBuilder {
  private params: RoleQueryParams = {
    skip: 0,
    limit: 10
  };

  withPagination(skip: number, limit: number): this {
    this.params.skip = skip;
    this.params.limit = limit;
    return this;
  }

  withStatus(status: Status): this {
    this.params.status = status;
    return this;
  }

  withDataScope(dataScope: DataScope): this {
    this.params.data_scope = dataScope;
    return this;
  }

  withTenantCode(tenantCode: string): this {
    this.params.tenant_code = tenantCode;
    return this;
  }

  withNameFilter(name: string): this {
    this.params.role_name = name;
    return this;
  }

  build(): RoleQueryParams {
    return { ...this.params };
  }
}

// 使用示例:
// const queryParams = new RoleQueryBuilder()
//   .withPagination(0, 20)
//   .withStatus(Status.ENABLED)
//   .withDataScope(DataScope.ALL)
//   .build();

export default {
  UserServiceExample,
  useUserManagement,
  buildUserQueryParams,
  isValidStatus,
  isValidGender,
  STATUS_OPTIONS,
  GENDER_OPTIONS,
  DATA_SCOPE_OPTIONS,
  PERMISSION_TYPE_OPTIONS,
  RoleQueryBuilder
};
