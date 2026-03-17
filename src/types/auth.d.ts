/**
 * 认证相关类型定义
 */

/**
 * 登录请求参数
 * 注意：后端字段使用蛇形命名（snake_case），需与后端保持一致
 */
export interface LoginRequest {
  username: string;
  password: string;
  tenant_id: string; // 后端期望 tenant_id 而非 tenantCode
}

/**
 * 用户信息（Store版本）
 */
export interface UserInfo {
  id: number | string;
  username: string;
  user_name?: string;
  nick_name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role?: string;
  tenantId?: string;
  tenant_id?: string;
  dept_id?: number;
  position_id?: number;
  status?: number;
  gender?: number;
}

/**
 * 登录响应数据
 */
export interface LoginResponseData {
  token: string;
  adminToken: string;
  userInfo: UserInfo;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  code: number;
  message: string;
  data: LoginResponseData;
}

/**
 * 用户基本信息响应（包含权限和菜单）
 */
export interface AuthInfoResponse {
  user_id: number | string;
  user_name: string;
  nick_name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  tenant_id?: string;
  dept_id?: number;
  position_id?: number;
  status?: number;
  gender?: number;
  create_time?: string;
  update_time?: string;
  permission_codes?: string[];
  menu_tree?: MenuItem[];
}

/**
 * 权限码响应
 */
export interface AuthPermissionsResponse {
  permission_codes: string[];
  user_id: number;
  user_name: string;
}

/**
 * 菜单项
 */
export interface MenuItem {
  id: number | string;
  parent_id?: number | string | null;
  menu_name: string;
  menu_type: "folder" | "menu" | "button";
  menu_code?: string;
  path?: string;
  component?: string;
  icon?: string;
  sort_order: number;
  visible?: boolean;
  status: number;
  method?: string;
  children?: MenuItem[];
  create_time?: string;
  update_time?: string;
}

/**
 * 后端返回的原始菜单项类型（使用 permission 前缀）
 * 用于接收后端数据，字段名可能与前端期望不同
 */
export interface RawMenuItem {
  id: number | string;
  parent_id?: number | string | null;
  permission_name?: string; // 后端字段（对应前端的 menu_name）
  menu_name?: string; // 前端期望字段
  permission_type?: string; // 后端字段（对应前端的 menu_type）
  menu_type?: string; // 前端期望字段
  permission_code?: string; // 后端字段（对应前端的 menu_code）
  menu_code?: string;
  path?: string;
  component?: string;
  icon?: string;
  sort_order: number;
  visible?: boolean;
  status: number;
  method?: string;
  children?: RawMenuItem[];
  create_time?: string;
  update_time?: string;
  node_type?: string;
  has_children?: boolean;
}

/**
 * 菜单树响应
 */
export interface AuthMenuResponse {
  data: MenuItem[];
  total?: number;
}

/**
 * 统一响应格式
 */
export interface UnifiedResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

// ==================== 新增接口类型 ====================

/**
 * 刷新令牌请求参数
 */
export interface RefreshTokenRequest {
  refresh_token: string;
}

/**
 * 刷新令牌响应
 */
export interface RefreshTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
}

/**
 * 刷新用户态响应
 */
export interface RefreshUserStateResponse {
  userInfo?: AuthInfoResponse;
  permissions?: string[];
  menuTree?: MenuItem[];
  success?: boolean;
  message?: string;
}

/**
 * 修改密码请求参数
 */
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

/**
 * 修改密码响应
 */
export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

/**
 * 重置密码请求参数
 */
export interface ResetPasswordRequest {
  userId: number | string;
  newPassword: string;
}

/**
 * 重置密码响应
 */
export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

/**
 * 缓存统计响应
 */
export interface CacheStatsResponse {
  totalKeys: number;
  hitRate: number;
  memoryUsage: string;
  keys?: Array<{
    key: string;
    ttl?: number;
    size: number;
  }>;
}

/**
 * 清除缓存请求参数
 */
export interface ClearCacheRequest {
  keys?: string[];
}

/**
 * 清除缓存响应
 */
export interface ClearCacheResponse {
  success: boolean;
  clearedKeys: string[];
  message?: string;
}

/**
 * 初始化权限响应
 */
export interface InitPermissionsResponse {
  success: boolean;
  message?: string;
  initializedPermissions?: number;
}
