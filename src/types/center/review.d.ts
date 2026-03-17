/**
 * 审核记录相关类型定义
 */

// ============================================================================
// 复判记录相关类型
// ============================================================================

/**
 * 复判类型
 */
export type ReviewType = 'auto' | 'manual';

/**
 * 复判记录页面数据格式
 */
export interface ReviewRecordItem {
  /** 记录ID */
  id: string;
  /** 预警标题 */
  title: string;
  /** 违规图片 */
  image: string;
  /** 摄像头名称 */
  cameraName: string;
  /** 位置 */
  location: string;
  /** 开始时间 */
  startTime: string;
  /** 持续时间 */
  duration: string;
  /** 复判类型 */
  reviewType: ReviewType;
  /** 复判备注 */
  reviewNotes?: string;
  /** 复判人名称 */
  reviewerName?: string;
  /** 预警ID */
  alertId?: number;
}

/**
 * 复判记录搜索表单
 */
export interface ReviewRecordSearchForm {
  /** 开始日期 */
  startDate: string;
  /** 结束日期 */
  endDate: string;
  /** 复判类型 */
  reviewType: string;
  /** 预警技能 */
  warningSkill: string;
  /** 违规位置 */
  warningLocation: string;
  /** 预警名称 */
  warningName: string;
  /** 预警ID */
  warningId: string;
}

/**
 * 统计数据
 */
export interface ReviewStatistics {
  /** 已复判数量 */
  reviewed: number;
  /** 总数量 */
  total: number;
  /** 完成百分比 */
  percentage: number;
}

/**
 * TOP3排行数据
 */
export interface TopRankingItem {
  id: string;
  name: string;
  count: number;
  total: number;
  percentage: number;
  color: string;
}

/**
 * 复判类型选项
 */
export const REVIEW_TYPE_OPTIONS = [
  { label: '全部', value: '' },
  { label: '多模态大模型复判', value: 'auto' },
  { label: '人工审核', value: 'manual' },
] as const;

/**
 * 预警技能选项
 */
export const WARNING_SKILL_OPTIONS = [
  { label: '全部智能技能', value: '' },
  { label: '安全帽检测', value: 'safety_helmet_detection' },
  { label: '工作服检测', value: 'work_clothes_detection' },
  { label: '反光背心检测', value: 'reflective_vest_detection' },
  { label: '安全带检测', value: 'safety_belt_detection' },
  { label: '烟火检测', value: 'smoke_fire_detection' },
  { label: '人员入侵检测', value: 'personnel_intrusion_detection' },
  { label: '高空作业检测', value: 'high_altitude_work_detection' },
  { label: '区域入侵检测', value: 'area_intrusion_detection' },
] as const;
