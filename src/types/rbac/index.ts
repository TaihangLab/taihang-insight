/**
 * RBAC 类型定义统一导出
 * RBAC Type Definitions - Central Export
 *
 * 使用示例:
 * import type { User, UserQueryParams, UserQueryForm } from '@/types/rbac';
 * import { Status, Gender } from '@/types/rbac';
 */

// ============================================
// 通用类型
// ============================================
export * from './common';

// ============================================
// 用户管理类型
// ============================================
export type {
  UserQueryFields,
  UserQueryParams,
  UserQueryForm,
  User,
  UserDetail,
  CreateUserRequest,
  UpdateUserRequest,
  ResetPasswordRequest,
  UserListResponse,
  UserDetailResponse,
  CreateUserResponse,
  UpdateUserResponse,
  UserRole,
  AssignRoleToUserRequest,
  UserRoleListResponse
} from './user';

// ============================================
// 角色管理类型
// ============================================
export type {
  RoleQueryFields,
  RoleQueryParams,
  RoleQueryForm,
  Role,
  RoleDetail,
  CreateRoleRequest,
  UpdateRoleRequest,
  RoleListResponse,
  RoleDetailResponse,
  CreateRoleResponse,
  UpdateRoleResponse,
  RolePermission,
  RolePermissionListResponse,
  AssignPermissionToRoleRequest,
  RemoveRolePermissionRequest
} from './role';

export { DataScope } from './role';

// ============================================
// 租户管理类型
// ============================================
export type {
  TenantQueryFields,
  TenantQueryParams,
  TenantQueryForm,
  Tenant,
  TenantDetail,
  CreateTenantRequest,
  UpdateTenantRequest,
  BatchDeleteTenantsRequest,
  TenantListResponse,
  TenantDetailResponse,
  CreateTenantResponse,
  UpdateTenantResponse,
  DeleteTenantResponse,
  BatchDeleteTenantsResponse
} from './tenant';

// ============================================
// 部门管理类型
// ============================================
export type {
  DepartmentQueryFields,
  DepartmentQueryParams,
  DepartmentQueryForm,
  DepartmentBase,
  DepartmentTreeNode,
  Department,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  MoveDepartmentRequest,
  DepartmentListResponse,
  DepartmentTreeResponse,
  DepartmentDetailResponse,
  CreateDepartmentResponse,
  UpdateDepartmentResponse,
  DeleteDepartmentResponse
} from './department';

// ============================================
// 岗位管理类型
// ============================================
export type {
  PositionQueryFields,
  PositionQueryParams,
  PositionQueryForm,
  Position,
  PositionDetail,
  PositionCategory,
  CreatePositionRequest,
  UpdatePositionRequest,
  PositionListResponse,
  PositionDetailResponse,
  CreatePositionResponse,
  UpdatePositionResponse,
  DeletePositionResponse,
  PositionCategoryListResponse
} from './position';

// ============================================
// 权限管理类型
// ============================================
export type {
  PermissionQueryFields,
  PermissionQueryParams,
  PermissionQueryForm,
  PermissionBase,
  Permission,
  PermissionDetail,
  PermissionTreeNode,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  UpdatePermissionStatusRequest,
  PermissionListResponse,
  PermissionDetailResponse,
  PermissionTreeResponse,
  CreatePermissionResponse,
  UpdatePermissionResponse,
  DeletePermissionResponse,
  UpdatePermissionStatusResponse
} from './permission';

export { PermissionType, PermissionNodeType } from './permission';
