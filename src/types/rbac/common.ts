/**
 * RBAC 通用类型定义
 * 包含所有模块共享的基础类型
 */

// ============================================
// 基础类型
// ============================================

/**
 * 统一分页参数
 */
export interface PaginationParams {
  /** 跳过的记录数，计算公式：(currentPage - 1) × pageSize，默认为0 */
  skip?: number;
  /** 每页记录数，默认为10 */
  limit?: number;
}

/**
 * 分页响应数据
 */
export interface PaginatedResponse<T> {
  /** 总记录数 */
  total: number;
  /** 数据列表 */
  items: T[];
}

/**
 * 统一API响应格式
 */
export interface ApiResponse<T = unknown> {
  /** 请求是否成功 */
  success: boolean;
  /** 响应状态码 */
  code: number;
  /** 响应消息 */
  message: string;
  /** 响应数据 */
  data?: T;
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
  /** 男 */
  MALE = 'male',
  /** 女 */
  FEMALE = 'female'
}

// ============================================
// 基础查询参数类型
// ============================================

/**
 * 租户范围查询参数 - 包含租户编码
 */
export interface TenantScopedParams {
  /** 租户编码 */
  tenant_code?: string;
}

/**
 * 状态查询参数 - 包含状态筛选
 */
export interface StatusQueryParams {
  /** 状态（0启用/1停用） */
  status?: Status;
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
 */
export interface BaseEntity {
  /** ID */
  id: number;
  /** 创建时间 */
  createTime: string;
}

/**
 * 带更新时间的实体
 */
export interface EntityWithTimestamp extends BaseEntity {
  /** 更新时间 */
  updateTime: string;
}

/**
 * 带租户编码的实体
 */
export interface TenantScoped {
  /** 租户编码 */
  tenantCode: string;
}

/**
 * 带状态的实体
 */
export interface StatusEnabled {
  /** 状态（0启用/1停用） */
  status: Status;
}
