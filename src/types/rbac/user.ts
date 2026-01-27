/**
 * 用户管理类型定义
 * User Management Types
 */

import type { BaseQueryParams } from './common';
import { Status, Gender } from './common';

// ============================================
// 查询参数类型
// ============================================

/**
 * 用户查询基础字段（不含分页、租户、状态等通用字段）
 */
export interface UserQueryFields {
  /** 用户名称（模糊查询） */
  username?: string;
  /** 用户昵称（模糊查询） */
  nickname?: string;
  /** 手机号码（精确查询） */
  phone?: string;
  /** 用户角色代码（精确匹配） */
  role?: string;
  /** 归属部门ID（精确匹配） */
  department_id?: number;
  /** 用户岗位（模糊查询） */
  position?: string;
  /** 用户性别（male/female，精确匹配） */
  gender?: Gender;
}

/**
 * 用户查询参数（完整版，包含必填的租户ID）
 */
export interface UserQueryParams extends BaseQueryParams, UserQueryFields {
  /** 租户ID（多租户隔离必填） */
  tenant_id: number;
}

/**
 * 用户查询参数表单类型（用于表单筛选，所有字段可选）
 */
export type UserQueryForm = Partial<UserQueryFields> & {
  tenant_id?: number;
  status?: Status;
};

// ============================================
// 实体类型
// ============================================

/**
 * 用户基本信息
 */
export interface User {
  /** 用户ID */
  id: number;
  /** 用户名 */
  userName: string;
  /** 用户昵称 */
  userNickname: string;
  /** 手机号码 */
  phoneNumber: string;
  /** 邮箱 */
  email: string;
  /** 部门名称 */
  department: string;
  /** 部门ID */
  departmentId: number;
  /** 岗位 */
  position: string;
  /** 性别 */
  gender: Gender;
  /** 状态（1启用/0停用） */
  status: Status;
  /** 租户编码 */
  tenantCode: string;
  /** 创建时间 */
  createTime: string;
}

/**
 * 用户详情（包含更多信息）
 */
export interface UserDetail extends User {
  /** 真实姓名 */
  realName?: string;
  /** 头像 */
  avatar?: string;
  /** 最后登录时间 */
  lastLoginTime?: string;
  /** 最后登录IP */
  lastLoginIp?: string;
  /** 备注 */
  remark?: string;
}

// ============================================
// 创建/更新类型
// ============================================

/**
 * 创建用户请求参数
 */
export interface CreateUserRequest {
  /** 用户名（必填） */
  userName: string;
  /** 密码（必填） */
  password: string;
  /** 用户昵称 */
  userNickname?: string;
  /** 手机号码 */
  phoneNumber?: string;
  /** 邮箱 */
  email?: string;
  /** 部门ID */
  departmentId?: number;
  /** 岗位 */
  position?: string;
  /** 性别 */
  gender?: Gender;
  /** 状态 */
  status?: Status;
  /** 租户编码 */
  tenantCode: string;
}

/**
 * 更新用户请求参数
 */
export interface UpdateUserRequest {
  /** 用户ID（必填） */
  id: number;
  /** 用户昵称 */
  userNickname?: string;
  /** 手机号码 */
  phoneNumber?: string;
  /** 邮箱 */
  email?: string;
  /** 部门ID */
  departmentId?: number;
  /** 岗位 */
  position?: string;
  /** 性别 */
  gender?: Gender;
  /** 状态 */
  status?: Status;
}

/**
 * 重置密码请求参数
 */
export interface ResetPasswordRequest {
  /** 用户ID（必填） */
  userId: number;
  /** 新密码（必填） */
  newPassword: string;
}

// ============================================
// 响应类型
// ============================================

import type { PaginatedResponse, ApiResponse } from './common';

/**
 * 用户列表响应类型
 */
export type UserListResponse = ApiResponse<PaginatedResponse<User>>;

/**
 * 用户详情响应类型
 */
export type UserDetailResponse = ApiResponse<UserDetail>;

/**
 * 创建用户响应类型
 */
export type CreateUserResponse = ApiResponse<User>;

/**
 * 更新用户响应类型
 */
export type UpdateUserResponse = ApiResponse<User>;

// ============================================
// 用户-角色关联类型
// ============================================

/**
 * 用户角色信息
 */
export interface UserRole {
  /** 用户ID */
  userId: number;
  /** 用户名 */
  userName: string;
  /** 角色ID */
  roleId: number;
  /** 角色编码 */
  roleCode: string;
  /** 角色名称 */
  roleName: string;
}

/**
 * 分配角色给用户请求参数
 */
export interface AssignRoleToUserRequest {
  /** 用户ID（必填） */
  userId: number;
  /** 角色ID列表（必填） */
  roleIds: number[];
}

/**
 * 用户角色列表响应类型
 */
export type UserRoleListResponse = ApiResponse<UserRole[]>;
