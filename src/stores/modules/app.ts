import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 应用全局状态 Store
 */
export const useAppStore = defineStore('app', () => {
  // 侧边栏状态
  const sidebarCollapsed = ref(false)

  // 浏览器 ID
  const browserId = ref('')

  // 服务 ID
  const serverId = ref('')

  // 表格高度
  const tableHeight = ref(window.innerHeight - 170)

  // 设备类型列表
  const channelTypeList = ref({
    1: { id: 1, name: '国标设备', style: { color: '#409eff', borderColor: '#b3d8ff' } },
    2: { id: 2, name: '推流设备', style: { color: '#67c23a', borderColor: '#c2e7b0' } },
    3: { id: 3, name: '拉流代理', style: { color: '#e6a23c', borderColor: '#f5dab1' } }
  })

  // 切换侧边栏
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  // 设置浏览器 ID
  function setBrowserId(id: string) {
    browserId.value = id
  }

  // 设置服务 ID
  function setServerId(id: string) {
    serverId.value = id
  }

  return {
    sidebarCollapsed,
    browserId,
    serverId,
    tableHeight,
    channelTypeList,
    toggleSidebar,
    setBrowserId,
    setServerId
  }
})
