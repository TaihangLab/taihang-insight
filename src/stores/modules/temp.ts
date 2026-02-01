import { defineStore } from 'pinia'
import storage from './storage'
import { StorageKey } from './storageKeys'

/**
 * 临时数据 Store
 *
 * 用于管理跨页面传递的临时数据，例如：
 * - 技能编辑信息
 * - 临时技能信息
 *
 * 这些数据通过 localStorage 持久化，以便在页面跳转时保留
 */
export const useTempStore = defineStore('temp', () => {
  // ========== 技能编辑相关 ==========

  /**
   * 获取技能编辑信息
   */
  function getEditSkillInfo(): any | null {
    return storage.getEditSkillInfo()
  }

  /**
   * 设置技能编辑信息
   */
  function setEditSkillInfo(info: any): void {
    storage.setEditSkillInfo(info)
  }

  /**
   * 清除技能编辑信息
   */
  function clearEditSkillInfo(): void {
    storage.removeEditSkillInfo()
  }

  /**
   * 获取临时技能信息
   */
  function getTempSkillInfo(): any | null {
    return storage.getTempSkillInfo()
  }

  /**
   * 设置临时技能信息
   */
  function setTempSkillInfo(info: any): void {
    storage.setTempSkillInfo(info)
  }

  /**
   * 清除临时技能信息
   */
  function clearTempSkillInfo(): void {
    storage.removeTempSkillInfo()
  }

  /**
   * 清除所有临时数据
   */
  function clearAllTempData(): void {
    storage.removeMultiple(
      StorageKey.EDIT_SKILL_INFO,
      StorageKey.TEMP_SKILL_INFO
    )
  }

  return {
    // 技能编辑
    getEditSkillInfo,
    setEditSkillInfo,
    clearEditSkillInfo,

    // 临时技能
    getTempSkillInfo,
    setTempSkillInfo,
    clearTempSkillInfo,

    // 清除所有
    clearAllTempData
  }
})
