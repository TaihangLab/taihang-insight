/**
 * 预警档案相关类型定义
 */

import type { WarningItem } from './alert';

// ============================================================================
// 档案列表类型
// ============================================================================

/**
 * 档案列表项（页面展示格式）
 */
export interface ArchiveListItem {
  /** 档案ID */
  id: number;
  /** 档案名称 */
  name: string;
  /** 位置 */
  location: string;
  /** 时间范围（格式化后） */
  timeRange: string;
  /** 创建时间（格式化后） */
  createTime: string;
  /** 描述 */
  description?: string;
  /** 预警数量 */
  alertCount?: number;
  /** 封面图片 */
  image?: string;
  /** 是否为当前选中 */
  isSelected?: boolean;
}

/**
 * 档案搜索表单
 */
export interface ArchiveSearchForm {
  /** 档案名称 */
  name: string;
  /** 位置 */
  location: string;
  /** 开始日期 */
  startDate: string;
  /** 结束日期 */
  endDate: string;
}

// ============================================================================
// 档案详情类型
// ============================================================================

/**
 * 档案详情信息
 */
export interface ArchiveDetailInfo {
  /** 档案ID */
  id: number;
  /** 档案名称 */
  name: string;
  /** 位置 */
  location: string;
  /** 时间范围（格式化后） */
  timeRange: string;
  /** 创建时间（格式化后） */
  createTime: string;
  /** 描述 */
  description?: string;
  /** 封面图片 */
  image?: string;
  /** 开始时间（原始） */
  start_time: string;
  /** 结束时间（原始） */
  end_time: string;
}

/**
 * 档案中的预警记录（页面格式）
 */
export interface ArchiveAlertRecord {
  /** 记录ID */
  id: number;
  /** 预警ID */
  alertId: number;
  /** 预警名称 */
  name: string;
  /** 设备名称 */
  deviceName: string;
  /** 违规图片 */
  imageUrl: string | null;
  /** 违规视频 */
  videoUrl?: string;
  /** 预警时间 */
  alertTime: string;
  /** 预警等级 */
  alertLevel: number;
  /** 预警等级文本 */
  alertLevelText: string;
  /** 预警类型 */
  alertType: string;
  /** 位置 */
  location: string;
  /** 技能名称 */
  skillName: string;
  /** 描述 */
  description: string;
  /** 是否选中 */
  isSelected?: boolean;
}

// ============================================================================
// 可用预警类型（添加到档案）
// ============================================================================

/**
 * 可用预警项（用于添加到档案）
 */
export interface AvailableAlertItem {
  /** 预警ID */
  alertId: number;
  /** 预警名称 */
  alertName: string;
  /** 设备名称 */
  cameraName: string;
  /** 预警时间 */
  alertTime: string;
  /** 预警等级 */
  alertLevel: number;
  /** 预警等级文本 */
  alertLevelText: string;
  /** 预警类型 */
  alertType: string;
  /** 位置 */
  location: string;
  /** 技能名称 */
  skillName: string;
  /** 违规图片 */
  imageUrl: string | null;
  /** 是否已选中 */
  isSelected?: boolean;
}

/**
 * 可用预警筛选条件
 */
export interface AvailableAlertFilters {
  /** 预警等级 */
  alertLevel: string;
  /** 预警类型 */
  alertType: string;
  /** 设备名称 */
  cameraName: string;
  /** 状态 */
  status: string;
  /** 开始时间 */
  startTime: string;
  /** 结束时间 */
  endTime: string;
  /** 技能名称 */
  skillName: string;
  /** 位置 */
  location: string;
  /** 预警ID */
  alertId: string;
}

// ============================================================================
// 表单类型
// ============================================================================

/**
 * 创建/编辑档案表单
 */
export interface ArchiveForm {
  /** 档案名称 */
  name: string;
  /** 位置 */
  location: string;
  /** 时间范围 */
  timeRange: [string, string];
  /** 描述 */
  description: string;
  /** 封面图片文件 */
  imageFile?: File | null;
}

/**
 * 图片上传记录
 */
export interface ImageUploadRecord {
  /** 记录ID */
  recordId: number;
  /** 图片URL */
  imageUrl: string;
}

// ============================================================================
// 常量定义
// ============================================================================

/**
 * 预警等级配置
 */
export const ALERT_LEVEL_OPTIONS = [
  { label: '全部等级', value: '' },
  { label: '一级预警', value: '1' },
  { label: '二级预警', value: '2' },
  { label: '三级预警', value: '3' },
  { label: '四级预警', value: '4' },
] as const;

/**
 * 预警状态配置（用于可用预警筛选）
 */
export const ALERT_STATUS_OPTIONS = [
  { label: '全部状态', value: '' },
  { label: '待处理', value: '1' },
  { label: '处理中', value: '2' },
  { label: '已处理', value: '3' },
  { label: '已归档', value: '4' },
  { label: '误报', value: '5' },
] as const;

/**
 * 删除类型
 */
export type DeleteType = 'single' | 'batch' | 'archive';
