/**
 * 岗位管理类型定义
 * Position Management Types
 */

import type { BaseQueryParams, PaginatedResponse, ApiResponse } from './common';
import { Status } from './common';

// ============================================
// 查询参数类型
// ============================================

/**
 * 岗位查询基础字段
 */
export interface PositionQueryFields {
  /** 岗位编码（模糊查询） */
  position_code?: string;
  /** 岗位名称（模糊查询） */
  position_name?: string;
  /** 类别编码（模糊查询） */
  category_code?: string;
  /** 所属部门（模糊查询） */
  department?: string;
}

/**
 * 岗位查询参数
 */
export type PositionQueryParams = BaseQueryParams & PositionQueryFields;

/**
 * 岗位查询参数表单类型（用于表单筛选，所有字段可选）
 */
export type PositionQueryForm = Partial<PositionQueryFields>;

// ============================================
// 实体类型
// ============================================

/**
 * 岗位信息
 */
export interface Position {
  /** 岗位ID */
  id: number;
  /** 岗位编码 */
  positionCode: string;
  /** 岗位名称 */
  positionName: string;
  /** 类别编码 */
  categoryCode: string;
  /** 类别名称 */
  categoryName?: string;
  /** 所属部门 */
  department: string;
  /** 排序 */
  sortOrder: number;
  /** 状态（1正常/0停用） */
  status: Status;
  /** 租户编码 */
  tenantCode: string;
  /** 创建时间 */
  createTime: string;
}

/**
 * 岗位详情（包含更多信息）
 */
export interface PositionDetail extends Position {
  /** 岗位描述 */
  description?: string;
  /** 岗位要求 */
  requirements?: string;
  /** 职级 */
  level?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
}

// ============================================
// 岗位类别类型
// ============================================

/**
 * 岗位类别
 */
export interface PositionCategory {
  /** 类别ID */
  id: number;
  /** 类别编码 */
  categoryCode: string;
  /** 类别名称 */
  categoryName: string;
  /** 排序 */
  sortOrder: number;
  /** 状态 */
  status: Status;
  /** 租户编码 */
  tenantCode: string;
  /** 创建时间 */
  createTime: string;
}

// ============================================
// 创建/更新类型
// ============================================

/**
 * 创建岗位请求参数
 */
export interface CreatePositionRequest {
  /** 岗位编码（必填） */
  positionCode: string;
  /** 岗位名称（必填） */
  positionName: string;
  /** 类别编码（必填） */
  categoryCode: string;
  /** 所属部门（必填） */
  department: string;
  /** 岗位描述 */
  description?: string;
  /** 岗位要求 */
  requirements?: string;
  /** 职级 */
  level?: string;
  /** 排序 */
  sortOrder?: number;
  /** 状态 */
  status?: Status;
  /** 租户编码 */
  tenantCode: string;
  /** 备注 */
  remark?: string;
}

/**
 * 更新岗位请求参数
 */
export interface UpdatePositionRequest {
  /** 岗位ID（必填） */
  id: number;
  /** 岗位名称 */
  positionName?: string;
  /** 类别编码 */
  categoryCode?: string;
  /** 所属部门 */
  department?: string;
  /** 岗位描述 */
  description?: string;
  /** 岗位要求 */
  requirements?: string;
  /** 职级 */
  level?: string;
  /** 排序 */
  sortOrder?: number;
  /** 状态 */
  status?: Status;
  /** 备注 */
  remark?: string;
}

// ============================================
// 响应类型
// ============================================

/**
 * 岗位列表响应类型
 */
export type PositionListResponse = ApiResponse<PaginatedResponse<Position>>;

/**
 * 岗位详情响应类型
 */
export type PositionDetailResponse = ApiResponse<PositionDetail>;

/**
 * 创建岗位响应类型
 */
export type CreatePositionResponse = ApiResponse<Position>;

/**
 * 更新岗位响应类型
 */
export type UpdatePositionResponse = ApiResponse<Position>;

/**
 * 删除岗位响应类型
 */
export type DeletePositionResponse = ApiResponse<null>;

/**
 * 岗位类别列表响应类型
 */
export type PositionCategoryListResponse = ApiResponse<PositionCategory[]>;
