import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 预警信息类型定义
 */
export interface Alert {
  id: string | number
  type: string
  level: string
  message: string
  deviceId?: string
  deviceName?: string
  timestamp: number
  status: 'pending' | 'processing' | 'resolved'
  image?: string
  videoUrl?: string
}

/**
 * 预警状态 Store
 */
export const useAlertStore = defineStore('alert', () => {
  // 实时预警列表
  const alerts = ref<Alert[]>([])

  // 未处理预警数量
  const pendingCount = ref(0)

  // 当前选中的预警
  const currentAlert = ref<Alert | null>(null)

  // SSE 连接状态
  const sseConnected = ref(false)
  const sseConnecting = ref(false)

  /**
   * 添加新预警
   */
  function addAlert(alert: Alert) {
    alerts.value.unshift(alert)
    if (alert.status === 'pending') {
      pendingCount.value++
    }
  }

  /**
   * 更新预警状态
   */
  function updateAlertStatus(alertId: string | number, status: Alert['status']) {
    const alert = alerts.value.find(a => a.id === alertId)
    if (alert) {
      const oldStatus = alert.status
      alert.status = status
      if (oldStatus === 'pending' && status !== 'pending') {
        pendingCount.value--
      } else if (oldStatus !== 'pending' && status === 'pending') {
        pendingCount.value++
      }
    }
  }

  /**
   * 清空预警列表
   */
  function clearAlerts() {
    alerts.value = []
    pendingCount.value = 0
  }

  /**
   * 设置当前预警
   */
  function setCurrentAlert(alert: Alert | null) {
    currentAlert.value = alert
  }

  /**
   * 设置 SSE 连接状态
   */
  function setSSEStatus(connected: boolean, connecting = false) {
    sseConnected.value = connected
    sseConnecting.value = connecting
  }

  return {
    alerts,
    pendingCount,
    currentAlert,
    sseConnected,
    sseConnecting,
    addAlert,
    updateAlertStatus,
    clearAlerts,
    setCurrentAlert,
    setSSEStatus
  }
})
