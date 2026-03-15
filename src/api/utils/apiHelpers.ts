/**
 * 类型安全的 API 请求辅助函数
 * 解决响应拦截器导致的类型推断问题
 *
 * 设计原则：
 * 1. 分页和不分页使用相同的 API 方法
 * 2. 后端返回结构一致，分页信息只是响应的一个字段
 * 3. 不区分 "分页 API" 和 "非分页 API"
 */

import type { AxiosRequestConfig } from "axios";
import { authAxios } from "../commons";

/**
 * 发起 GET 请求
 * @param url 请求 URL
 * @param config 请求配置
 * @returns 响应数据（经过拦截器处理）
 *
 * @example
 * ```typescript
 * // 获取列表（可能包含分页信息）
 * const alerts = apiGet<{ data: Alert[], total: number, page: number }>('/api/alerts')
 *
 * // 获取单个对象
 * const user = apiGet<User>('/api/users/1')
 *
 * // 获取简单数组
 * const items = apiGet<Item[]>('/api/items')
 * ```
 */
export function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return authAxios.get<unknown, T>(url, config);
}

/**
 * 发起 POST 请求
 */
export function apiPost<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return authAxios.post<unknown, T>(url, data, config);
}

/**
 * 发起 PUT 请求
 */
export function apiPut<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return authAxios.put<unknown, T>(url, data, config);
}

/**
 * 发起 DELETE 请求
 */
export function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return authAxios.delete<unknown, T>(url, config);
}
