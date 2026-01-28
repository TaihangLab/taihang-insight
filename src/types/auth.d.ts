/**
 * 认证相关类型定义
 */

/**
 * 登录请求参数
 */
export interface LoginRequest {
  username: string
  password: string
  tenantCode: string
}

/**
 * 用户信息
 */
export interface UserInfo {
  id: number
  username: string
  user_name: string
  tenant_id?: number
  [key: string]: any
}

/**
 * 登录响应数据
 */
export interface LoginResponseData {
  token: string
  adminToken: string
  userInfo: UserInfo
}

/**
 * 登录响应
 */
export interface LoginResponse {
  code: number
  message: string
  data: LoginResponseData
}

/**
 * 用户基本信息响应（包含权限和菜单）
 */
export interface AuthInfoResponse {
  user_id: number | string
  user_name: string
  nick_name?: string
  email?: string
  phone?: string
  avatar?: string
  tenant_id?: number | string
  dept_id?: number
  position_id?: number
  status?: number
  gender?: number
  create_time?: string
  update_time?: string
  permission_codes?: string[]
  menu_tree?: MenuItem[]
}

/**
 * 权限码响应
 */
export interface AuthPermissionsResponse {
  permissions: string[]
  total?: number
}

/**
 * 菜单项
 */
export interface MenuItem {
  id: number | string
  parent_id?: number | string | null
  menu_name: string
  menu_type: 'folder' | 'menu' | 'button'
  menu_code?: string
  path?: string
  component?: string
  icon?: string
  sort_order: number
  visible?: boolean
  status: number
  method?: string
  children?: MenuItem[]
  create_time?: string
  update_time?: string
}

/**
 * 菜单树响应
 */
export interface AuthMenuResponse {
  data: MenuItem[]
  total?: number
}

/**
 * 统一响应格式
 */
export interface UnifiedResponse<T> {
  success: boolean
  code: number
  message: string
  data: T
}
