/**
 * 角色管理类型定义
 * Role Management Types
 *
 * 字段统一使用蛇形命名（snake_case），与后端保持一致
 */

import type { BaseQueryParams, PaginatedResponse, ApiResponse } from './common'
import { Status } from './common'

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
  role_name?: string
  /** 角色编码/权限字符（模糊查询） */
  role_code?: string
  /** 数据权限范围 */
  data_scope?: DataScope
}

/**
 * 角色查询参数
 */
export type RoleQueryParams = BaseQueryParams & RoleQueryFields

/**
 * 角色查询参数表单类型（用于表单筛选，所有字段可选）
 */
export type RoleQueryForm = Partial<RoleQueryFields>

// ============================================
// 实体类型
// ============================================

/**
 * 角色信息
 * 字段统一使用蛇形命名（snake_case）
 */
export interface Role {
  /** 角色ID */
  id: number
  /** 租户ID */
  tenant_id?: number
  /** 角色编码 */
  role_code: string
  /** 角色名称 */
  role_name: string
  /** 数据权限范围 */
  data_scope?: DataScope
  /** 状态（0正常/1停用） */
  status: Status
  /** 排序 */
  sort_order?: number
  /** 备注 */
  remark?: string
  /** 创建时间 */
  create_time?: string
  /** 更新时间 */
  update_time?: string
}

/**
 * 角色详情（包含更多信息）
 */
export interface RoleDetail extends Role {
  /** 角色描述 */
  description?: string
}

// ============================================
// 创建/更新类型
// ============================================

/**
 * 创建角色请求参数
 */
export interface CreateRoleRequest {
  /** 角色编码（必填） */
  role_code: string
  /** 角色名称（必填） */
  role_name: string
  /** 数据权限范围 */
  data_scope?: DataScope
  /** 状态 */
  status?: Status
  /** 排序 */
  sort_order?: number
  /** 备注 */
  remark?: string
  /** 角色描述 */
  description?: string
  /** 租户ID */
  tenant_id: number
}

/**
 * 更新角色请求参数
 */
export interface UpdateRoleRequest {
  /** 角色名称 */
  role_name?: string
  /** 数据权限范围 */
  data_scope?: DataScope
  /** 状态 */
  status?: Status
  /** 排序 */
  sort_order?: number
  /** 备注 */
  remark?: string
  /** 角色描述 */
  description?: string
}

// ============================================
// 响应类型
// ============================================

/**
 * 角色列表响应类型
 */
export type RoleListResponse = ApiResponse<PaginatedResponse<Role>>

/**
 * 角色详情响应类型
 */
export type RoleDetailResponse = ApiResponse<RoleDetail>

/**
 * 创建角色响应类型
 */
export type CreateRoleResponse = ApiResponse<Role>

/**
 * 更新角色响应类型
 */
export type UpdateRoleResponse = ApiResponse<Role>

// ============================================
// 角色-权限关联类型
// ============================================

/**
 * 角色权限信息
 */
export interface RolePermission {
  /** 角色ID */
  role_id: number
  /** 角色名称 */
  role_name: string
  /** 权限ID */
  permission_id: number
  /** 权限编码 */
  permission_code: string
  /** 权限名称 */
  permission_name: string
}

/**
 * 角色权限列表响应类型
 */
export type RolePermissionListResponse = ApiResponse<RolePermission[]>

/**
 * 分配权限给角色请求参数
 */
export interface AssignPermissionToRoleRequest {
  /** 角色ID（必填） */
  role_id: number
  /** 权限ID列表（必填） */
  permission_ids: number[]
}

/**
 * 移除角色权限请求参数
 */
export interface RemoveRolePermissionRequest {
  /** 角色ID（必填） */
  role_id: number
  /** 权限ID（必填） */
  permission_id: number
}
