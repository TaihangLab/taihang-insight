/**
 * 预警管理相关类型定义
 */

/**
 * 预警等级
 */
export type AlertLevel = 1 | 2 | 3 | 4;

/**
 * 预警状态
 */
export type AlertStatus = 1 | 2 | 3 | 4 | 5; // pending | processing | completed | archived | falseAlarm

/**
 * 预警状态字符串
 */
export type AlertStatusString = 'pending' | 'processing' | 'completed' | 'archived' | 'falseAlarm';

/**
 * 搜索表单
 */
export interface WarningSearchForm {
  device_name: string;
  start_date: string;
  end_date: string;
  alert_type: string;
  alert_level: string;
  warningSkill: string;
  warningName: string;
  warningId: string;
  status: string;
  location: string;
}

/**
 * 操作历史记录
 */
export interface OperationHistory {
  id: number;
  status: 'active' | 'completed';
  statusText: string;
  time: string;
  description: string;
  operationType: 'create' | 'process' | 'pending' | 'processing' | 'completed' | 'archive' | 'report' | 'falseAlarm';
  operator: string;
  archiveInfo?: {
    archiveId: string | number;
    archiveName: string;
  };
}

/**
 * 预警项（页面格式）
 */
export interface WarningItem {
  id: string;
  deviceName: string;
  imageUrl: string | null;
  value: number;
  unit: string;
  level: string;
  time: string;
  status: AlertStatusString;
  cameraId: string;
  deviceInfo: {
    name: string;
    position: string;
  };
  device: string;
  type: string;
  location: string;
  locationId: string;
  description: string;
  skill: string;
  remark: string;
  operationHistory: OperationHistory[];
  _apiData: ApiAlertData;
  archiveId?: string;
  archiveTime?: string;
  isFalseAlarm?: boolean;
}

/**
 * API 预警数据格式
 */
export interface ApiAlertData {
  alert_id: number;
  alert_time: string;
  alert_type: string;
  alert_level: AlertLevel;
  alert_name: string;
  alert_description: string;
  location: string;
  camera_id: number;
  camera_name: string;
  task_id: number;
  electronic_fence?: any;
  result?: any;
  minio_frame_url?: string;
  minio_video_url?: string;
  skill_class_id?: number;
  skill_name_zh?: string;
  status: AlertStatus;
  status_display?: string;
  processed_at?: string;
  processed_by?: string;
  processing_notes?: string;
  created_at: string;
  updated_at: string;
  process?: {
    steps?: Array<{
      step: string;
      desc: string;
      time: string;
      operator?: string;
    }>;
  };
}

/**
 * 档案项
 */
export interface ArchiveItem {
  archive_id?: string | number;
  id?: string | number;
  name: string;
  location?: string;
  isDefault?: boolean;
  status?: number;
}

/**
 * 预警等级配置
 */
export const ALERT_LEVEL_OPTIONS = [
  { label: '一级预警', value: 'level1' },
  { label: '二级预警', value: 'level2' },
  { label: '三级预警', value: 'level3' },
  { label: '四级预警', value: 'level4' },
] as const;

/**
 * 预警类型配置
 */
export const ALERT_TYPE_OPTIONS = [
  { label: '安全帽违规', value: 'safety_helmet' },
  { label: '安全带违规', value: 'safety_belt' },
  { label: '防护服违规', value: 'protective_clothing' },
  { label: '无关人员', value: 'unauthorized_personnel' },
  { label: '吸烟违规', value: 'smoking' },
  { label: '高空作业违规', value: 'high_altitude' },
] as const;

/**
 * 预警状态配置
 */
export const ALERT_STATUS_OPTIONS = [
  { label: '待处理', value: 'pending' },
  { label: '处理中', value: 'processing' },
  { label: '已处理', value: 'completed' },
] as const;

/**
 * 导出格式
 */
export type ExportFormat = 'csv' | 'excel';
