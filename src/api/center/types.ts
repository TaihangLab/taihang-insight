/**
 * VisionAI Center API 通用类型定义
 */

/**
 * 统一响应格式
 */
export interface UnifiedResponse<T = any> {
  code: number
  msg: string
  data: T
  total?: number
}

/**
 * 分页参数
 */
export interface PageParams {
  page?: number
  limit?: number
  size?: number
  [key: string]: any
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T = any> {
  items: T[]
  total: number
  page: number
  size: number
}
