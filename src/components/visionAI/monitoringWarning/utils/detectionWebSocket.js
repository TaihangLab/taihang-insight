/**
 * 实时检测 WebSocket 统一连接工具
 *
 * 集中管理 WebSocket URL 构建、连接生命周期和消息解析，
 * 供 realTimeMonitoring / EnhancedVideoCell 等复用。
 */

const config = require('../../../../../config/index.js')

/**
 * 构建检测 WebSocket URL（统一路径，使用后端配置地址）
 */
function buildDetectionWsUrl (taskId) {
  const backendUrl = config.API_BASE_URL
  const wsProtocol = backendUrl.startsWith('https') ? 'wss:' : 'ws:'
  const wsHost = backendUrl.replace(/^https?:\/\//, '')
  return `${wsProtocol}//${wsHost}/api/v1/realtime-detection/ws/detection/${taskId}`
}

/**
 * 解析检测 WebSocket 消息
 * @returns {{ detections: Array, frameSize: {width: number, height: number} }}
 */
function parseDetectionMessage (event) {
  const data = JSON.parse(event.data)
  return {
    detections: data.detections || [],
    frameSize: data.frame_size || { width: 1920, height: 1080 }
  }
}

/**
 * 创建检测 WebSocket 连接
 *
 * @param {number|string} taskId  AI任务ID
 * @param {Object} callbacks
 * @param {Function} callbacks.onOpen
 * @param {Function} callbacks.onMessage  - 接收 parseDetectionMessage 的结果
 * @param {Function} callbacks.onClose
 * @param {Function} callbacks.onError
 * @returns {WebSocket}
 */
function createDetectionWebSocket (taskId, { onOpen, onMessage, onClose, onError } = {}) {
  const url = buildDetectionWsUrl(taskId)
  const ws = new WebSocket(url)

  ws.onopen = () => {
    if (onOpen) onOpen(ws)
  }

  ws.onmessage = (event) => {
    try {
      const parsed = parseDetectionMessage(event)
      if (onMessage) onMessage(parsed, ws)
    } catch (e) {
      console.error('解析检测结果失败:', e)
    }
  }

  ws.onerror = (error) => {
    console.error(`WebSocket错误: task_id=${taskId}`, error)
    if (onError) onError(error, ws)
  }

  ws.onclose = () => {
    if (onClose) onClose(ws)
  }

  return ws
}

/**
 * 安全关闭 WebSocket（可传 null）
 */
function closeWebSocket (ws) {
  if (ws && ws.readyState <= WebSocket.OPEN) {
    ws.close()
  }
}

module.exports = {
  buildDetectionWsUrl,
  parseDetectionMessage,
  createDetectionWebSocket,
  closeWebSocket
}
