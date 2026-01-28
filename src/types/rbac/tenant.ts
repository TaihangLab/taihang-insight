/**
 * 租户管理类型定义
 * Tenant Management Types
 */

import type { PaginationParams, PaginatedResponse, ApiResponse } from './common';
import { Status, EntityWithTimestamp, TenantScoped, StatusEnabled } from './common';

// ============================================
// API 原始响应类型（snake_case）
// ============================================

/**
 * 租户 API 原始响应（后端返回格式）
 */
export interface TenantAPI {
  /** 租户ID */
  id: number;
  /** 租户ID（别名，用于关联） */
  tenant_id: number;
  /** 租户名称 */
  tenant_name: string;
  /** 企业名称 */
  company_name: string;
  /** 企业编码 */
  company_code: string;
  /** 联系人 */
  contact_person: string;
  /** 联系电话 */
  contact_phone: string;
  /** 用户名（登录账号） */
  username: string;
  /** 租户套餐（basic/standard/premium/enterprise） */
  package: string;
  /** 过期时间 */
  expire_time: string | null;
  /** 用户数量 */
  user_count: number;
  /** 企业域名 */
  domain: string | null;
  /** 企业地址 */
  address: string | null;
  /** 描述 */
  description: string | null;
  /** 状态（0启用/1停用） */
  status: number;
  /** 创建时间 */
  create_time: string;
  /** 更新时间 */
  update_time: string;
  /** 创建人 */
  create_by: string;
  /** 更新人 */
  update_by: string;
  /** 备注 */
  remark: string;
}

// ============================================
// 查询参数类型
// ============================================

/**
 * 租户查询基础字段（不含分页、状态等通用字段）
 */
export interface TenantQueryFields {
  /** 租户编号（精确查询，不支持模糊） */
  tenant_code?: string;
  /** 租户名称（模糊查询） */
  tenant_name?: string;
  /** 企业名称（模糊查询） */
  company_name?: string;
}

/**
 * 租户查询参数
 */
export type TenantQueryParams = PaginationParams & TenantQueryFields & {
  /** 租户状态（0启用/1停用） */
  status?: Status;
};

/**
 * 租户查询参数表单类型（用于表单筛选，所有字段可选）
 */
export type TenantQueryForm = Partial<TenantQueryFields> & {
  status?: Status;
};

// ============================================
// 实体类型
// ============================================

/**
 * 租户信息（前端使用，camelCase）
 */
export interface Tenant extends EntityWithTimestamp, TenantScoped, StatusEnabled {
  /** 租户ID */
  id: number;
  /** 租户编码 */
  companyCode: string;
  /** 租户编码（别名，用于 TenantScoped） */
  tenantCode: string;
  /** 租户名称 */
  tenantName: string;
  /** 企业名称 */
  companyName: string;
  /** 联系人 */
  contactPerson: string;
  /** 联系电话 */
  contactPhone: string;
  /** 用户名（登录账号） */
  username: string;
  /** 租户套餐（basic/standard/premium/enterprise） */
  package: string;
  /** 过期时间 */
  expireTime: string | null;
  /** 用户数量 */
  userCount: number;
  /** 企业域名 */
  domain: string | null;
  /** 企业地址 */
  address: string | null;
  /** 描述 */
  description: string | null;
  /** 创建人 */
  createBy: string;
  /** 更新人 */
  updateBy: string;
  /** 备注 */
  remark: string;
}

/**
 * 租户详情（包含更多信息）
 */
export interface TenantDetail extends Tenant {
  /** 最大用户数 */
  maxUsers?: number;
  /** 已使用用户数 */
  usedUsers?: number;
  /** 最大存储空间（GB） */
  maxStorage?: number;
  /** 已使用存储空间（GB） */
  usedStorage?: number;
}

// ============================================
// 创建/更新类型
// ============================================

/**
 * 创建租户请求参数
 */
export interface CreateTenantRequest {
  /** 租户名称（必填） */
  tenant_name: string;
  /** 企业名称（必填） */
  company_name: string;
  /** 企业编码（必填） */
  company_code: string;
  /** 联系人 */
  contact_person?: string;
  /** 联系电话 */
  contact_phone?: string;
  /** 用户名（登录账号） */
  username: string;
  /** 租户套餐 */
  package?: string;
  /** 过期时间 */
  expire_time?: string;
  /** 企业域名 */
  domain?: string;
  /** 企业地址 */
  address?: string;
  /** 描述 */
  description?: string;
  /** 状态 */
  status?: Status;
  /** 备注 */
  remark?: string;
}

/**
 * 更新租户请求参数
 */
export interface UpdateTenantRequest {
  /** 租户名称 */
  tenant_name?: string;
  /** 企业名称 */
  company_name?: string;
  /** 联系人 */
  contact_person?: string;
  /** 联系电话 */
  contact_phone?: string;
  /** 租户套餐 */
  package?: string;
  /** 过期时间 */
  expire_time?: string;
  /** 企业域名 */
  domain?: string;
  /** 企业地址 */
  address?: string;
  /** 描述 */
  description?: string;
  /** 状态 */
  status?: Status;
  /** 备注 */
  remark?: string;
}

/**
 * 批量删除租户请求参数
 */
export interface BatchDeleteTenantsRequest {
  /** 租户ID列表（必填） */
  ids: number[];
}

// ============================================
// 响应类型
// ============================================

/**
 * 租户列表响应类型
 */
export type TenantListResponse = ApiResponse<PaginatedResponse<Tenant>>;

/**
 * 租户详情响应类型
 */
export type TenantDetailResponse = ApiResponse<TenantDetail>;

/**
 * 创建租户响应类型
 */
export type CreateTenantResponse = ApiResponse<Tenant>;

/**
 * 更新租户响应类型
 */
export type UpdateTenantResponse = ApiResponse<Tenant>;

/**
 * 删除租户响应类型
 */
export type DeleteTenantResponse = ApiResponse<null>;

/**
 * 批量删除租户响应类型
 */
export type BatchDeleteTenantsResponse = ApiResponse<null>;

// ============================================
// 数据转换函数
// ============================================

/**
 * 将 API 响应（snake_case）转换为前端格式（camelCase）
 */
export function convertAPIToTenant(api: TenantAPI): Tenant {
  return {
    id: api.id,
    companyCode: api.company_code,
    tenantCode: api.company_code, // TenantScoped - 使用企业编码作为租户编码
    tenantName: api.tenant_name,
    companyName: api.company_name,
    contactPerson: api.contact_person || '',
    contactPhone: api.contact_phone || '',
    username: api.username,
    package: api.package,
    expireTime: api.expire_time,
    userCount: api.user_count,
    domain: api.domain,
    address: api.address,
    description: api.description,
    status: api.status,
    create_time: api.create_time,
    update_time: api.update_time,
    createBy: api.create_by,
    updateBy: api.update_by,
    remark: api.remark,
  };
}

/**
 * 将前端格式（camelCase）转换为 API 请求格式（snake_case）
 */
export function convertTenantToAPI(tenant: Partial<Tenant>): Partial<TenantAPI> {
  const result: Partial<TenantAPI> = {};

  if (tenant.tenantName !== undefined) result.tenant_name = tenant.tenantName;
  if (tenant.companyName !== undefined) result.company_name = tenant.companyName;
  if (tenant.companyCode !== undefined) result.company_code = tenant.companyCode;
  if (tenant.contactPerson !== undefined) result.contact_person = tenant.contactPerson;
  if (tenant.contactPhone !== undefined) result.contact_phone = tenant.contactPhone;
  if (tenant.username !== undefined) result.username = tenant.username;
  if (tenant.package !== undefined) result.package = tenant.package;
  if (tenant.expireTime !== undefined) result.expire_time = tenant.expireTime;
  if (tenant.domain !== undefined) result.domain = tenant.domain;
  if (tenant.address !== undefined) result.address = tenant.address;
  if (tenant.description !== undefined) result.description = tenant.description;
  if (tenant.status !== undefined) result.status = tenant.status;
  if (tenant.remark !== undefined) result.remark = tenant.remark;

  return result;
}

/**
 * 批量转换 API 响应
 */
export function convertAPITenantList(apiList: TenantAPI[]): Tenant[] {
  return apiList.map(convertAPIToTenant);
}
