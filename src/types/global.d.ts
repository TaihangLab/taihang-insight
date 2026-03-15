/**
 * 全局类型声明
 * 定义项目中通用的类型接口
 */

/**
 * 统一响应格式（后端新格式）
 * code === 0 表示成功，非 0 表示失败
 * message 为 null 时表示成功或无消息
 */
export interface UnifiedResponse<T = any> {
  code: number
  message: string | null
  data: T
  total?: number
  page?: number
  page_size?: number
  limit?: number
  pages?: number
}

/**
 * RBAC API 统一响应格式（已废弃，使用 UnifiedResponse）
 * @deprecated 使用 UnifiedResponse 替代
 */
export interface RBACResponse<T = any> {
  code: number
  message: string | null
  data: T
}

/**
 * 分页参数
 */
export interface PageParams {
  page?: number
  limit?: number
  page_size?: number
}

/**
 * 扁平分页响应（直接匹配后端格式）
 * 后端返回格式：{ data: T[], total, page, page_size }
 */
export interface FlatPaginationResponse<T = any> {
  data: T[]
  total: number
  page: number
  page_size?: number
  limit?: number
  pages?: number
}

/**
 * 分页数据（向后兼容的别名）
 */
export type PaginationData<T = any> = FlatPaginationResponse<T>

/**
 * 通用的键值对类型
 */
export type RecordType<T = any> = Record<string, T>

/**
 * ID 类型
 */
export type ID = string | number

/**
 * 时间戳类型
 */
export type Timestamp = string | number | Date

/**
 * 可选的异步函数类型
 */
export type AsyncFunction<T = any> = (...args: any[]) => Promise<T>
