/**
 * 权限管理类型定义
 * Permission Management Types
 * 使用蛇形命名 (snake_case) 与后端保持一致
 */

import type { BaseQueryParams, PaginatedResponse, ApiResponse } from './common';
import { Status } from './common';

// ============================================
// 枚举类型
// ============================================

/**
 * 权限类型枚举
 * 三级权限结构：folder（文件夹）> menu（页面菜单）> button（操作按钮）
 */
export enum PermissionType {
  /** 文件夹/目录权限 - 一级分类 */
  FOLDER = 'folder',
  /** 页面菜单权限 - 二级页面 */
  MENU = 'menu',
  /** 操作按钮权限 - 三级按钮 */
  BUTTON = 'button'
}

/**
 * 权限树节点类型枚举
 * 与 PermissionType 保持一致
 */
export enum PermissionNodeType {
  /** 文件夹 */
  FOLDER = 'folder',
  /** 页面菜单 */
  MENU = 'menu',
  /** 操作按钮 */
  BUTTON = 'button'
}

// ============================================
// 查询参数类型
// ============================================

/**
 * 权限查询基础字段
 */
export interface PermissionQueryFields {
  /** 权限名称（模糊查询） */
  permission_name?: string;
  /** 权限标识/权限码（模糊查询） */
  permission_code?: string;
  /** 权限类型 */
  permission_type?: PermissionType;
  /** 创建者（精确匹配） */
  creator?: string;
}

/**
 * 权限查询参数
 */
export type PermissionQueryParams = BaseQueryParams & PermissionQueryFields;

/**
 * 权限查询参数表单类型（用于表单筛选，所有字段可选）
 */
export type PermissionQueryForm = Partial<PermissionQueryFields>;

// ============================================
// 实体类型（使用蛇形命名）
// ============================================

/**
 * 权限基础信息
 */
export interface PermissionBase {
  /** 权限ID */
  id: number;
  /** 权限标识/权限码 */
  permission_code: string;
  /** 权限名称 */
  permission_name: string;
  /** 权限类型 */
  permission_type: PermissionType;
  /** 状态（0启用/1停用） */
  status: Status;
  /** 创建者 */
  creator: string;
  /** 租户编码 */
  tenant_code: string;
  /** 创建时间 */
  create_time: string;
}

/**
 * 权限信息
 */
export interface Permission extends PermissionBase {}

/**
 * 权限详情（包含更多信息）
 */
export interface PermissionDetail extends PermissionBase {
  /** 权限描述 */
  description?: string;
  /** 父级权限ID */
  parent_id?: number | null;
  /**
   * 路径字段（根据权限类型复用）
   * - folder/menu: 路由路径，如 /system/user
   * - button: API 路径，如 /api/v1/rbac/users
   */
  path?: string;
  /** 组件路径（仅 folder/menu 有效） */
  component?: string;
  /** 图标（仅 folder/menu 有效） */
  icon?: string;
  /** HTTP 方法（仅 button 有效） */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** 排序 */
  sort_order?: number;
  /** 是否可见 */
  visible?: boolean;
  /** 是否缓存 */
  keep_alive?: boolean;
  /** 更新时间 */
  update_time?: string;
  /** 备注 */
  remark?: string;
}

/**
 * 权限树节点（使用蛇形命名）
 */
export interface PermissionTreeNode {
  /** 权限ID */
  id: number;
  /** 权限标识/权限码 */
  permission_code: string;
  /** 权限名称 */
  permission_name: string;
  /** 权限类型 */
  permission_type: PermissionType;
  /** 节点类型 */
  node_type: PermissionNodeType;
  /** 父级权限ID */
  parent_id: number | null;
  /**
   * 路径字段（根据权限类型复用）
   * - folder/menu: 路由路径，如 /system/user
   * - button: API 路径，如 /api/v1/rbac/users
   */
  path?: string;
  /** 组件路径（仅 folder/menu 有效） */
  component?: string;
  /** 图标（仅 folder/menu 有效） */
  icon?: string;
  /** HTTP 方法（仅 button 有效） */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** 排序 */
  sort_order: number;
  /** 状态 */
  status: Status;
  /** 是否可见 */
  visible: boolean;
  /** 子权限数组 */
  children?: PermissionTreeNode[];
}

// ============================================
// 创建/更新类型
// ============================================

/**
 * 创建权限请求参数
 */
export interface CreatePermissionRequest {
  /** 权限标识/权限码（必填） */
  permission_code: string;
  /** 权限名称（必填） */
  permission_name: string;
  /** 权限类型（必填） */
  permission_type: PermissionType;
  /** 父级权限ID */
  parent_id?: number | null;
  /** 权限描述 */
  description?: string;
  /**
   * 路径字段（根据权限类型复用）
   * - folder/menu: 路由路径，如 /system/user
   * - button: API 路径，如 /api/v1/rbac/users
   */
  path?: string;
  /** 组件路径（仅 folder/menu 有效） */
  component?: string;
  /** 图标（仅 folder/menu 有效） */
  icon?: string;
  /** HTTP 方法（仅 button 有效） */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** 排序 */
  sort_order?: number;
  /** 是否可见 */
  visible?: boolean;
  /** 是否缓存 */
  keep_alive?: boolean;
  /** 状态 */
  status?: Status;
  /** 备注 */
  remark?: string;
}

/**
 * 更新权限请求参数
 */
export interface UpdatePermissionRequest {
  /** 权限ID（必填） */
  id: number;
  /** 权限名称 */
  permission_name?: string;
  /** 权限类型 */
  permission_type?: PermissionType;
  /** 父级权限ID */
  parent_id?: number | null;
  /** 权限描述 */
  description?: string;
  /**
   * 路径字段（根据权限类型复用）
   * - folder/menu: 路由路径，如 /system/user
   * - button: API 路径，如 /api/v1/rbac/users
   */
  path?: string;
  /** 组件路径（仅 folder/menu 有效） */
  component?: string;
  /** 图标（仅 folder/menu 有效） */
  icon?: string;
  /** HTTP 方法（仅 button 有效） */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** 排序 */
  sort_order?: number;
  /** 是否可见 */
  visible?: boolean;
  /** 是否缓存 */
  keep_alive?: boolean;
  /** 状态 */
  status?: Status;
  /** 备注 */
  remark?: string;
}

/**
 * 更新权限状态请求参数
 */
export interface UpdatePermissionStatusRequest {
  /** 权限ID（必填） */
  id: number;
  /** 状态（必填） */
  status: Status;
}

// ============================================
// 响应类型
// ============================================

/**
 * 权限列表响应类型
 */
export type PermissionListResponse = ApiResponse<PaginatedResponse<Permission>>;

/**
 * 权限详情响应类型
 */
export type PermissionDetailResponse = ApiResponse<PermissionDetail>;

/**
 * 权限树响应类型
 */
export type PermissionTreeResponse = ApiResponse<PermissionTreeNode[]>;

/**
 * 创建权限响应类型
 */
export type CreatePermissionResponse = ApiResponse<Permission>;

/**
 * 更新权限响应类型
 */
export type UpdatePermissionResponse = ApiResponse<Permission>;

/**
 * 删除权限响应类型
 */
export type DeletePermissionResponse = ApiResponse<null>;

/**
 * 更新权限状态响应类型
 */
export type UpdatePermissionStatusResponse = ApiResponse<null>;
