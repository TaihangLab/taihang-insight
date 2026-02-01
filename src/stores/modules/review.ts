import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import storage from './storage'

/**
 * 智能复判记录接口
 */
export interface ReviewRecord {
  id?: string | number
  warningId?: string | number
  type?: string
  operator?: string
  timestamp?: string
  [key: string]: any
}

/**
 * 智能复判 Store
 *
 * 用于管理智能复判记录和预警还原记录
 */
export const useReviewStore = defineStore('review', () => {
  // ========== 本地状态 ==========

  /** 智能复判记录列表（内存状态，从 localStorage 加载） */
  const records = ref<ReviewRecord[]>([])

  /** 还原的预警列表（内存状态，从 localStorage 加载） */
  const restoredWarnings = ref<any[]>([])

  // ========== 计算属性 ==========

  /** 复判记录数量 */
  const recordCount = computed(() => records.value.length)

  /** 还原预警数量 */
  const restoredCount = computed(() => restoredWarnings.value.length)

  // ========== 数据加载方法 ==========

  /**
   * 从 localStorage 加载复判记录
   */
  function loadRecords(): void {
    records.value = storage.getIntelligentReviewRecords()
  }

  /**
   * 从 localStorage 加载还原预警
   */
  function loadRestoredWarnings(): void {
    restoredWarnings.value = storage.getRestoredWarnings()
  }

  /**
   * 加载所有数据
   */
  function loadAll(): void {
    loadRecords()
    loadRestoredWarnings()
  }

  // ========== 数据操作方法 ==========

  /**
   * 添加复判记录
   * @param record 复判记录
   */
  function addRecord(record: ReviewRecord): void {
    storage.addIntelligentReviewRecord(record)
    loadRecords() // 重新加载以保持同步
  }

  /**
   * 设置复判记录列表
   * @param newRecords 新的记录列表
   */
  function setRecords(newRecords: ReviewRecord[]): void {
    storage.setIntelligentReviewRecords(newRecords)
    loadRecords() // 重新加载以保持同步
  }

  /**
   * 清空复判记录
   */
  function clearRecords(): void {
    storage.setIntelligentReviewRecords([])
    records.value = []
  }

  /**
   * 添加还原的预警
   * @param warning 预警信息
   */
  function addRestoredWarning(warning: any): void {
    storage.addRestoredWarning(warning)
    loadRestoredWarnings() // 重新加载以保持同步
  }

  /**
   * 设置还原预警列表
   * @param warnings 预警列表
   */
  function setRestoredWarningsList(warnings: any[]): void {
    storage.setRestoredWarnings(warnings)
    loadRestoredWarnings() // 重新加载以保持同步
  }

  /**
   * 清空还原预警
   */
  function clearRestoredWarnings(): void {
    storage.setRestoredWarnings([])
    restoredWarnings.value = []
  }

  /**
   * 清空所有数据
   */
  function clearAll(): void {
    clearRecords()
    clearRestoredWarnings()
  }

  return {
    // 状态
    records,
    restoredWarnings,

    // 计算属性
    recordCount,
    restoredCount,

    // 加载方法
    loadRecords,
    loadRestoredWarnings,
    loadAll,

    // 操作方法
    addRecord,
    setRecords,
    clearRecords,
    addRestoredWarning,
    setRestoredWarningsList,
    clearRestoredWarnings,
    clearAll
  }
})
