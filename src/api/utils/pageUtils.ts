/**
 * 分页参数工具函数
 * 提供分页参数的规范化处理
 */

import type { PageParams, RequiredPageParams } from '@/types/center.d'

/**
 * 分页默认值常量
 */
export const DEFAULT_PAGE = 1
export const DEFAULT_PAGE_SIZE = 20

/**
 * 规范化分页参数（填充默认值）
 * @param params 原始分页参数
 * @returns 填充了默认值的分页参数
 *
 * @example
 * ```typescript
 * const { page, limit } = normalizePageParams({ page: 2 })
 * // { page: 2, limit: 20 }
 *
 * const { page, limit } = normalizePageParams({})
 * // { page: 1, limit: 20 }
 *
 * const { page, limit } = normalizePageParams({ limit: 50 })
 * // { page: 1, limit: 50 }
 * ```
 */
export function normalizePageParams(params: PageParams = {}): RequiredPageParams {
  return {
    page: params.page ?? DEFAULT_PAGE,
    limit: params.limit ?? DEFAULT_PAGE_SIZE
  }
}
