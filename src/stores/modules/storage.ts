/**
 * 统一的 localStorage 管理模块
 *
 * 设计原则：
 * 1. 所有 localStorage 键名集中定义，避免魔数
 * 2. 提供类型安全的静态方法接口
 * 3. 支持 JSON 序列化/反序列化
 * 4. 统一错误处理
 * 5. 支持默认值
 */

/**
 * localStorage 键名枚举
 * 所有 localStorage 的键名必须在此定义
 */
export enum StorageKey {
  // ========== 认证相关 (已由 pinia-plugin-persistedstate 管理) ==========
  /** 认证数据（自动由 user store 管理） */
  AUTH = 'taihang-auth',

  // ========== 旧系统兼容 (用于向后兼容) ==========
  /** WVP Token (旧系统) */
  WVP_TOKEN = 'wvp-token',
  /** WVP 用户信息 (旧系统) */
  WVP_USER = 'wvp-user',
  /** 管理员 Token */
  ADMIN_TOKEN = 'Admin-Token',
  /** 通用 Token */
  TOKEN = 'token',

  // ========== 用户偏好设置 ==========
  /** 选中的租户 ID */
  SELECTED_TENANT = 'selectedTenant',
  /** 当前用户昵称（用于预警操作记录） */
  CURRENT_USER_NAME = 'nick_name',

  // ========== 临时数据（跨页面传递） ==========
  /** 技能编辑信息 */
  EDIT_SKILL_INFO = 'editSkillInfo',
  /** 临时技能信息 */
  TEMP_SKILL_INFO = 'tempSkillInfo',

  // ========== 业务数据 ==========
  /** 智能复判记录列表 */
  INTELLIGENT_REVIEW_RECORDS = 'intelligentReviewRecords',
  /** 还原的预警列表 */
  RESTORED_WARNINGS = 'restoredWarnings',
}

/**
 * 存储助手类
 * 提供类型安全的 localStorage 操作
 */
class StorageHelper {
  /**
   * 获取字符串值
   */
  getString(key: StorageKey, defaultValue: string = ''): string {
    try {
      const value = localStorage.getItem(key)
      return value ?? defaultValue
    } catch (error) {
      console.warn(`[Storage] 获取 ${key} 失败:`, error)
      return defaultValue
    }
  }

  /**
   * 设置字符串值
   */
  setString(key: StorageKey, value: string): void {
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      console.error(`[Storage] 设置 ${key} 失败:`, error)
    }
  }

  /**
   * 获取 JSON 对象
   */
  getJSON<T = any>(key: StorageKey, defaultValue: T | null = null): T | null {
    try {
      const value = localStorage.getItem(key)
      if (value === null) return defaultValue
      return JSON.parse(value) as T
    } catch (error) {
      console.warn(`[Storage] 解析 ${key} JSON 失败:`, error)
      return defaultValue
    }
  }

  /**
   * 设置 JSON 对象
   */
  setJSON<T = any>(key: StorageKey, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`[Storage] 设置 ${key} JSON 失败:`, error)
    }
  }

  /**
   * 移除指定键
   */
  remove(key: StorageKey): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`[Storage] 移除 ${key} 失败:`, error)
    }
  }

  /**
   * 检查键是否存在
   */
  has(key: StorageKey): boolean {
    try {
      return localStorage.getItem(key) !== null
    } catch (error) {
      console.error(`[Storage] 检查 ${key} 失败:`, error)
      return false
    }
  }

  /**
   * 清空所有存储
   */
  clear(): void {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('[Storage] 清空 localStorage 失败:', error)
    }
  }

  /**
   * 批量移除
   */
  removeMultiple(...keys: StorageKey[]): void {
    keys.forEach(key => this.remove(key))
  }
}

/**
 * 存储管理器单例
 */
const storageHelper = new StorageHelper()

/**
 * 导出类型安全的存储操作接口
 */
export const storage = {
  // ========== 基础操作 ==========
  /** 获取字符串 */
  getString: (key: StorageKey, defaultValue?: string) =>
    storageHelper.getString(key, defaultValue),
  /** 设置字符串 */
  setString: (key: StorageKey, value: string) =>
    storageHelper.setString(key, value),
  /** 获取 JSON */
  getJSON: <T = any>(key: StorageKey, defaultValue?: T | null) =>
    storageHelper.getJSON<T>(key, defaultValue),
  /** 设置 JSON */
  setJSON: <T = any>(key: StorageKey, value: T) =>
    storageHelper.setJSON<T>(key, value),
  /** 移除 */
  remove: (key: StorageKey) => storageHelper.remove(key),
  /** 检查是否存在 */
  has: (key: StorageKey) => storageHelper.has(key),
  /** 清空所有 */
  clear: () => storageHelper.clear(),
  /** 批量移除 */
  removeMultiple: (...keys: StorageKey[]) => storageHelper.removeMultiple(...keys),

  // ========== 快捷访问方法 ==========

  // --- 旧系统兼容 ---
  /** 获取 WVP Token */
  getWvpToken: () => storageHelper.getString(StorageKey.WVP_TOKEN),
  /** 设置 WVP Token */
  setWvpToken: (token: string) => storageHelper.setString(StorageKey.WVP_TOKEN, token),
  /** 获取 WVP 用户信息 */
  getWvpUser: () => storageHelper.getJSON<any>(StorageKey.WVP_USER),
  /** 设置 WVP 用户信息 */
  setWvpUser: (user: any) => storageHelper.setJSON(StorageKey.WVP_USER, user),
  /** 获取管理员 Token */
  getAdminToken: () => storageHelper.getString(StorageKey.ADMIN_TOKEN),
  /** 设置管理员 Token */
  setAdminToken: (token: string) => storageHelper.setString(StorageKey.ADMIN_TOKEN, token),
  /** 获取通用 Token */
  getToken: () => storageHelper.getString(StorageKey.TOKEN),
  /** 设置通用 Token */
  setToken: (token: string) => storageHelper.setString(StorageKey.TOKEN, token),

  // --- 用户偏好 ---
  /** 获取选中的租户 */
  getSelectedTenant: () => storageHelper.getString(StorageKey.SELECTED_TENANT),
  /** 设置选中的租户 */
  setSelectedTenant: (tenant: string) => storageHelper.setString(StorageKey.SELECTED_TENANT, tenant),
  /** 获取当前用户昵称 */
  getCurrentUserName: () => storageHelper.getString(StorageKey.CURRENT_USER_NAME),
  /** 设置当前用户昵称 */
  setCurrentUserName: (name: string) => storageHelper.setString(StorageKey.CURRENT_USER_NAME, name),

  // --- 临时数据 ---
  /** 获取技能编辑信息 */
  getEditSkillInfo: () => storageHelper.getJSON<any>(StorageKey.EDIT_SKILL_INFO),
  /** 设置技能编辑信息 */
  setEditSkillInfo: (info: any) => storageHelper.setJSON(StorageKey.EDIT_SKILL_INFO, info),
  /** 移除技能编辑信息 */
  removeEditSkillInfo: () => storageHelper.remove(StorageKey.EDIT_SKILL_INFO),
  /** 获取临时技能信息 */
  getTempSkillInfo: () => storageHelper.getJSON<any>(StorageKey.TEMP_SKILL_INFO),
  /** 设置临时技能信息 */
  setTempSkillInfo: (info: any) => storageHelper.setJSON(StorageKey.TEMP_SKILL_INFO, info),
  /** 移除临时技能信息 */
  removeTempSkillInfo: () => storageHelper.remove(StorageKey.TEMP_SKILL_INFO),

  // --- 业务数据 ---
  /** 获取智能复判记录 */
  getIntelligentReviewRecords: () => storageHelper.getJSON<any[]>(StorageKey.INTELLIGENT_REVIEW_RECORDS, []),
  /** 设置智能复判记录 */
  setIntelligentReviewRecords: (records: any[]) => storageHelper.setJSON(StorageKey.INTELLIGENT_REVIEW_RECORDS, records),
  /** 添加智能复判记录 */
  addIntelligentReviewRecord: (record: any) => {
    const records = storage.getIntelligentReviewRecords()
    records.unshift(record)
    // 限制记录数量
    if (records.length > 1000) {
      records.splice(1000)
    }
    storage.setIntelligentReviewRecords(records)
  },
  /** 获取还原的预警列表 */
  getRestoredWarnings: () => storageHelper.getJSON<any[]>(StorageKey.RESTORED_WARNINGS, []),
  /** 设置还原的预警列表 */
  setRestoredWarnings: (warnings: any[]) => storageHelper.setJSON(StorageKey.RESTORED_WARNINGS, warnings),
  /** 添加还原的预警 */
  addRestoredWarning: (warning: any) => {
    const warnings = storage.getRestoredWarnings()
    warnings.push({
      ...warning,
      restoredAt: new Date().toISOString(),
      restoredFrom: 'reviewRecords'
    })
    storage.setRestoredWarnings(warnings)
  },
}

export default storage
