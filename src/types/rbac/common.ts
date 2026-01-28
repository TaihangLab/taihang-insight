/**
 * RBAC 通用类型定义
 * 包含所有模块共享的基础类型
 *
 * 字段统一使用蛇形命名（snake_case），与后端保持一致
 */

// ============================================
// 基础类型
// ============================================

/**
 * 统一分页参数
 */
export interface PaginationParams {
  /** 跳过的记录数，计算公式：(currentPage - 1) × pageSize，默认为0 */
  skip?: number
  /** 每页记录数，默认为10 */
  limit?: number
}

/**
 * 分页响应数据
 */
export interface PaginatedResponse<T> {
  /** 总记录数 */
  total: number
  /** 数据列表 */
  items: T[]
}

/**
 * 统一API响应格式
 */
export interface ApiResponse<T = unknown> {
  /** 请求是否成功 */
  success: boolean
  /** 响应状态码 */
  code: number
  /** 响应消息 */
  message: string
  /** 响应数据 */
  data?: T
}

// ============================================
// 枚举类型
// ============================================

/**
 * 状态值枚举
 * 0 = 启用/正常
 * 1 = 停用/禁用
 */
export enum Status {
  /** 启用/正常 */
  ENABLED = 0,
  /** 停用/禁用 */
  DISABLED = 1
}

/**
 * 性别枚别
 */
export enum Gender {
  /** 未知 */
  UNKNOWN = 0,
  /** 男 */
  MALE = 1,
  /** 女 */
  FEMALE = 2
}

// ============================================
// 基础查询参数类型
// ============================================

/**
 * 租户范围查询参数 - 包含租户ID
 */
export interface TenantScopedParams {
  /** 租户ID */
  tenant_id?: number
}

/**
 * 状态查询参数 - 包含状态筛选
 */
export interface StatusQueryParams {
  /** 状态（0启用/1停用） */
  status?: Status
}

/**
 * 基础查询参数 - 分页 + 租户 + 状态
 */
export interface BaseQueryParams extends PaginationParams, TenantScopedParams, StatusQueryParams {}

// ============================================
// 基础实体类型
// ============================================

/**
 * 基础实体字段
 * 字段统一使用蛇形命名（snake_case）
 */
export interface BaseEntity {
  /** ID */
  id: number
  /** 创建时间 */
  create_time?: string
}

/**
 * 带更新时间的实体
 */
export interface EntityWithTimestamp extends BaseEntity {
  /** 更新时间 */
  update_time?: string
}

/**
 * 带租户ID的实体
 */
export interface TenantScoped {
  /** 租户ID */
  tenant_id?: number
}

/**
 * 带状态的实体
 */
export interface StatusEnabled {
  /** 状态（0启用/1停用） */
  status: Status
}

// ============================================
// 前端分页状态类型
// ============================================

/**
 * 前端分页状态（用于 UI 组件分页控制）
 */
export interface PaginationState {
  /** 当前页码 */
  currentPage: number
  /** 每页记录数 */
  pageSize: number
  /** 总记录数 */
  total: number
}
