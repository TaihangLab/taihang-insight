/**
 * 权限管理类型定义
 * Permission Management Types
 */

import type { BaseQueryParams, PaginatedResponse, ApiResponse } from './common';
import { Status } from './common';

// ============================================
// 枚举类型
// ============================================

/**
 * 权限类型枚举
 */
export enum PermissionType {
  /** 页面权限 */
  PAGE = 'page',
  /** 按钮权限 */
  BUTTON = 'button',
  /** 数据权限 */
  DATA = 'data'
}

/**
 * 权限树节点类型枚举
 */
export enum PermissionNodeType {
  /** 目录 */
  DIRECTORY = 'directory',
  /** 菜单 */
  MENU = 'menu',
  /** 按钮 */
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
// 实体类型
// ============================================

/**
 * 权限基础信息
 */
export interface PermissionBase {
  /** 权限ID */
  id: number;
  /** 权限标识/权限码 */
  permissionCode: string;
  /** 权限名称 */
  permissionName: string;
  /** 权限类型 */
  permissionType: PermissionType;
  /** 状态（1正常/0停用） */
  status: Status;
  /** 创建者 */
  creator: string;
  /** 租户编码 */
  tenantCode: string;
  /** 创建时间 */
  createTime: string;
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
  parentId?: number | null;
  /** 路由地址 */
  path?: string;
  /** 组件路径 */
  component?: string;
  /** 图标 */
  icon?: string;
  /** 排序 */
  sortOrder?: number;
  /** 是否可见 */
  visible?: boolean;
  /** 是否缓存 */
  keepAlive?: boolean;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
}

/**
 * 权限树节点
 */
export interface PermissionTreeNode {
  /** 权限ID */
  id: number;
  /** 权限标识/权限码 */
  permissionCode: string;
  /** 权限名称 */
  permissionName: string;
  /** 权限类型 */
  permissionType: PermissionType;
  /** 节点类型 */
  nodeType: PermissionNodeType;
  /** 父级权限ID */
  parentId: number | null;
  /** 路由地址 */
  path?: string;
  /** 组件路径 */
  component?: string;
  /** 图标 */
  icon?: string;
  /** 排序 */
  sortOrder: number;
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
  permissionCode: string;
  /** 权限名称（必填） */
  permissionName: string;
  /** 权限类型（必填） */
  permissionType: PermissionType;
  /** 父级权限ID */
  parentId?: number | null;
  /** 权限描述 */
  description?: string;
  /** 路由地址 */
  path?: string;
  /** 组件路径 */
  component?: string;
  /** 图标 */
  icon?: string;
  /** 排序 */
  sortOrder?: number;
  /** 是否可见 */
  visible?: boolean;
  /** 是否缓存 */
  keepAlive?: boolean;
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
  permissionName?: string;
  /** 权限类型 */
  permissionType?: PermissionType;
  /** 父级权限ID */
  parentId?: number | null;
  /** 权限描述 */
  description?: string;
  /** 路由地址 */
  path?: string;
  /** 组件路径 */
  component?: string;
  /** 图标 */
  icon?: string;
  /** 排序 */
  sortOrder?: number;
  /** 是否可见 */
  visible?: boolean;
  /** 是否缓存 */
  keepAlive?: boolean;
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
