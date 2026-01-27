/**
 * 部门管理类型定义
 * Department Management Types
 * 注意：部门使用树形结构，不支持传统分页
 */

import type { ApiResponse } from './common';
import { Status } from './common';

// ============================================
// 查询参数类型
// ============================================

/**
 * 部门查询基础字段
 */
export interface DepartmentQueryFields {
  /** 部门名称（模糊查询） */
  name?: string;
  /** 部门编码（精确匹配） */
  dept_code?: string;
}

/**
 * 部门查询参数（树形结构，无分页）
 */
export interface DepartmentQueryParams extends DepartmentQueryFields {
  /** 部门状态（0启用/1停用） */
  status?: Status;
  /** 租户编码（多租户隔离必填） */
  tenant_code: string;
}

/**
 * 部门查询参数表单类型（用于表单筛选，所有字段可选）
 */
export type DepartmentQueryForm = Partial<DepartmentQueryFields> & {
  status?: Status;
  tenant_code?: string;
};

// ============================================
// 实体类型
// ============================================

/**
 * 部门基础字段
 */
export interface DepartmentBase {
  /** 部门ID */
  id: number;
  /** 部门编码 */
  deptCode: string;
  /** 部门名称 */
  name: string;
  /** 父级部门ID */
  parentId: number | null;
  /** 显示排序 */
  sortOrder: number;
  /** 状态（0启用/1停用） */
  status: Status;
  /** 租户编码 */
  tenantCode: string;
  /** 部门路径 */
  path: string;
  /** 部门深度 */
  depth: number;
  /** 创建时间 */
  createTime: string;
}

/**
 * 部门树节点
 */
export interface DepartmentTreeNode extends DepartmentBase {
  /** 负责人 */
  leader?: string;
  /** 联系电话 */
  phone?: string;
  /** 邮箱 */
  email?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 子部门数组 */
  children?: DepartmentTreeNode[];
}

/**
 * 部门信息（非树形结构）
 */
export interface Department extends DepartmentBase {
  /** 负责人 */
  leader?: string;
  /** 联系电话 */
  phone?: string;
  /** 邮箱 */
  email?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
}

// ============================================
// 创建/更新类型
// ============================================

/**
 * 创建部门请求参数
 */
export interface CreateDepartmentRequest {
  /** 部门编码（必填） */
  deptCode: string;
  /** 部门名称（必填） */
  name: string;
  /** 父级部门ID */
  parentId?: number | null;
  /** 显示排序 */
  sortOrder?: number;
  /** 负责人 */
  leader?: string;
  /** 联系电话 */
  phone?: string;
  /** 邮箱 */
  email?: string;
  /** 状态 */
  status?: Status;
  /** 租户编码 */
  tenantCode: string;
  /** 备注 */
  remark?: string;
}

/**
 * 更新部门请求参数
 */
export interface UpdateDepartmentRequest {
  /** 部门ID（必填） */
  id: number;
  /** 部门名称 */
  name?: string;
  /** 父级部门ID */
  parentId?: number | null;
  /** 显示排序 */
  sortOrder?: number;
  /** 负责人 */
  leader?: string;
  /** 联系电话 */
  phone?: string;
  /** 邮箱 */
  email?: string;
  /** 状态 */
  status?: Status;
  /** 备注 */
  remark?: string;
}

/**
 * 移动部门请求参数（拖拽排序）
 */
export interface MoveDepartmentRequest {
  /** 部门ID（必填） */
  id: number;
  /** 新的父级部门ID */
  parentId: number | null;
  /** 新的排序位置 */
  sortOrder?: number;
}

// ============================================
// 响应类型
// ============================================

/**
 * 部门列表响应类型（树形结构）
 */
export type DepartmentListResponse = ApiResponse<{
  /** 总记录数 */
  total: number;
  /** 部门树节点列表 */
  items: DepartmentTreeNode[];
}>;

/**
 * 部门树响应类型
 */
export type DepartmentTreeResponse = ApiResponse<DepartmentTreeNode[]>;

/**
 * 部门详情响应类型
 */
export type DepartmentDetailResponse = ApiResponse<Department>;

/**
 * 创建部门响应类型
 */
export type CreateDepartmentResponse = ApiResponse<Department>;

/**
 * 更新部门响应类型
 */
export type UpdateDepartmentResponse = ApiResponse<Department>;

/**
 * 删除部门响应类型
 */
export type DeleteDepartmentResponse = ApiResponse<null>;
