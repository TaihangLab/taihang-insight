/**
 * 全局类型声明
 * 定义项目中通用的类型接口
 */

/**
 * VisionAI Center API 统一响应格式
 * 用于大部分业务 API 接口
 */
export interface UnifiedResponse<T = any> {
  code: number
  msg: string
  data: T
  total?: number
  page?: number
  limit?: number
  pages?: number
  pagination?: any
}

/**
 * RBAC API 统一响应格式
 * 用于 RBAC 权限管理系统接口
 */
export interface RBACResponse<T = any> {
  success: boolean
  code: number
  message: string
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
 * 分页数据
 */
export interface PaginationData<T = any> {
  data: T[]
  total: number
  page: number
  limit: number
  pages: number
}

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
