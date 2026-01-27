/**
 * 角色管理类型定义
 * Role Management Types
 */

import type { BaseQueryParams, PaginatedResponse, ApiResponse } from './common';
import { Status } from './common';

// ============================================
// 枚举类型
// ============================================

/**
 * 数据权限范围枚举
 */
export enum DataScope {
  /** 全部数据权限 */
  ALL = '1',
  /** 自定数据权限 */
  CUSTOM = '2',
  /** 本部门数据权限 */
  DEPARTMENT = '3',
  /** 本部门及以下数据权限 */
  DEPARTMENT_AND_BELOW = '4'
}

// ============================================
// 查询参数类型
// ============================================

/**
 * 角色查询基础字段
 */
export interface RoleQueryFields {
  /** 角色名称（模糊查询） */
  role_name?: string;
  /** 角色编码/权限字符（模糊查询） */
  role_code?: string;
  /** 数据权限范围 */
  data_scope?: DataScope;
}

/**
 * 角色查询参数
 */
export type RoleQueryParams = BaseQueryParams & RoleQueryFields;

/**
 * 角色查询参数表单类型（用于表单筛选，所有字段可选）
 */
export type RoleQueryForm = Partial<RoleQueryFields>;

// ============================================
// 实体类型
// ============================================

/**
 * 角色信息
 */
export interface Role {
  /** 角色ID */
  id: number;
  /** 角色编码 */
  roleCode: string;
  /** 角色名称 */
  roleName: string;
  /** 数据权限范围 */
  dataScope: DataScope;
  /** 状态（1正常/0停用） */
  status: Status;
  /** 租户编码 */
  tenantCode: string;
  /** 创建时间 */
  createTime: string;
}

/**
 * 角色详情（包含更多信息）
 */
export interface RoleDetail extends Role {
  /** 角色描述 */
  description?: string;
  /** 排序 */
  sortOrder?: number;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
}

// ============================================
// 创建/更新类型
// ============================================

/**
 * 创建角色请求参数
 */
export interface CreateRoleRequest {
  /** 角色编码（必填） */
  roleCode: string;
  /** 角色名称（必填） */
  roleName: string;
  /** 数据权限范围 */
  dataScope?: DataScope;
  /** 状态 */
  status?: Status;
  /** 角色描述 */
  description?: string;
  /** 排序 */
  sortOrder?: number;
  /** 租户编码 */
  tenantCode: string;
}

/**
 * 更新角色请求参数
 */
export interface UpdateRoleRequest {
  /** 角色ID（必填） */
  id: number;
  /** 角色名称 */
  roleName?: string;
  /** 数据权限范围 */
  dataScope?: DataScope;
  /** 状态 */
  status?: Status;
  /** 角色描述 */
  description?: string;
  /** 排序 */
  sortOrder?: number;
}

// ============================================
// 响应类型
// ============================================

/**
 * 角色列表响应类型
 */
export type RoleListResponse = ApiResponse<PaginatedResponse<Role>>;

/**
 * 角色详情响应类型
 */
export type RoleDetailResponse = ApiResponse<RoleDetail>;

/**
 * 创建角色响应类型
 */
export type CreateRoleResponse = ApiResponse<Role>;

/**
 * 更新角色响应类型
 */
export type UpdateRoleResponse = ApiResponse<Role>;

// ============================================
// 角色-权限关联类型
// ============================================

/**
 * 角色权限信息
 */
export interface RolePermission {
  /** 角色ID */
  roleId: number;
  /** 角色名称 */
  roleName: string;
  /** 权限ID */
  permissionId: number;
  /** 权限编码 */
  permissionCode: string;
  /** 权限名称 */
  permissionName: string;
}

/**
 * 角色权限列表响应类型
 */
export type RolePermissionListResponse = ApiResponse<RolePermission[]>;

/**
 * 分配权限给角色请求参数
 */
export interface AssignPermissionToRoleRequest {
  /** 角色ID（必填） */
  roleId: number;
  /** 权限ID列表（必填） */
  permissionIds: number[];
}

/**
 * 移除角色权限请求参数
 */
export interface RemoveRolePermissionRequest {
  /** 角色ID（必填） */
  roleId: number;
  /** 权限ID（必填） */
  permissionId: number;
}
