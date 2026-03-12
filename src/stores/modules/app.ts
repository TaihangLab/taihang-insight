import { defineStore } from 'pinia'
import { ref } from 'vue'
import { StorageKey } from './storageKeys'

/**
 * 动态路由记录
 */
interface DynamicRouteRecord {
  name: string
  path: string
}

/**
 * 应用全局状态 Store
 */
export const useAppStore = defineStore('app', () => {
  // ==================== UI 状态 ====================
  // 侧边栏状态
  const sidebarCollapsed = ref(false)

  // 表格高度
  const tableHeight = ref(window.innerHeight - 170)

  // ==================== 设备相关 ====================
  // 浏览器 ID
  const browserId = ref('')

  // 服务 ID
  const serverId = ref('')

  // 设备类型列表
  const channelTypeList = ref({
    1: { id: 1, name: '国标设备', style: { color: '#409eff', borderColor: '#b3d8ff' } },
    2: { id: 2, name: '推流设备', style: { color: '#67c23a', borderColor: '#c2e7b0' } },
    3: { id: 3, name: '拉流代理', style: { color: '#e6a23c', borderColor: '#f5dab1' } }
  })

  // ==================== 动态路由状态 ====================
  // 动态路由是否已添加
  const asyncRoutesAdded = ref(false)

  // 已添加的动态路由记录（用于清理）
  const dynamicRouteRecords = ref<DynamicRouteRecord[]>([])

  // ==================== UI 方法 ====================
  /**
   * 切换侧边栏
   */
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  // ==================== 设备方法 ====================
  /**
   * 设置浏览器 ID
   */
  function setBrowserId(id: string) {
    browserId.value = id
  }

  /**
   * 设置服务 ID
   */
  function setServerId(id: string) {
    serverId.value = id
  }

  // ==================== 路由方法 ====================
  /**
   * 设置动态路由已添加状态
   */
  function setAsyncRoutesAdded(added: boolean) {
    asyncRoutesAdded.value = added
  }

  /**
   * 检查动态路由是否已添加
   */
  function isAsyncRoutesAdded(): boolean {
    return asyncRoutesAdded.value
  }

  /**
   * 添加动态路由记录
   */
  function addDynamicRouteRecord(record: DynamicRouteRecord) {
    dynamicRouteRecords.value.push(record)
  }

  /**
   * 清空动态路由记录
   */
  function clearDynamicRouteRecords() {
    dynamicRouteRecords.value = []
  }

  /**
   * 获取所有动态路由记录
   */
  function getDynamicRouteRecords(): DynamicRouteRecord[] {
    return dynamicRouteRecords.value
  }

  /**
   * 重置动态路由状态（用于登出）
   */
  function resetDynamicRoutes() {
    asyncRoutesAdded.value = false
    dynamicRouteRecords.value = []
  }

  return {
    // UI 状态
    sidebarCollapsed,
    tableHeight,
    // 设备状态
    browserId,
    serverId,
    channelTypeList,
    // 路由状态
    asyncRoutesAdded,
    dynamicRouteRecords,
    // UI 方法
    toggleSidebar,
    // 设备方法
    setBrowserId,
    setServerId,
    // 路由方法
    setAsyncRoutesAdded,
    isAsyncRoutesAdded,
    addDynamicRouteRecord,
    clearDynamicRouteRecords,
    getDynamicRouteRecords,
    resetDynamicRoutes
  }
}, {
  persist: {
    key: StorageKey.APP,
    storage: localStorage,
    pick: ['sidebarCollapsed'] // 只持久化 UI 偏好状态
  }
})
