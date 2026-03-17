/**
 * localStorage 键名枚举
 * 所有 localStorage 的键名必须在此定义
 *
 * 单独文件避免循环依赖
 */
export enum StorageKey {
  // ========== 认证相关 ==========
  /** 管理员 Token */
  ADMIN_TOKEN = "Admin-Token",
  PERMISSION = "taihang-permissions",
  MENUS = "taihang-menus",
  USER_INFO = "taihang-user-info",
  /** 应用 UI 状态（由 app store 管理） */
  APP = "taihang-app",

  // ========== 用户偏好设置 ==========
  /** 选中的租户 ID */
  SELECTED_TENANT = "selectedTenant",
  /** 当前用户昵称（用于预警操作记录） */
  CURRENT_USER_NAME = "nick_name",

  // ========== 临时数据（跨页面传递） ==========
  /** 技能编辑信息 */
  EDIT_SKILL_INFO = "editSkillInfo",
  /** 临时技能信息 */
  TEMP_SKILL_INFO = "tempSkillInfo",

  // ========== 业务数据 ==========
  /** 智能复判记录列表 */
  INTELLIGENT_REVIEW_RECORDS = "intelligentReviewRecords",
  /** 还原的预警列表 */
  RESTORED_WARNINGS = "restoredWarnings",
}
