/**
 * 实时检测 WebSocket 统一连接工具
 *
 * 使用 default export，避免 vue2/babel/webpack3 下 named export 互操作失败。
 */

const config = require('../../../../../config/index.js')

function normalizeDashboardLocal (dashboard) {
  if (!dashboard) {
    return { title: '', lines: [] }
  }
  if (Array.isArray(dashboard)) {
    return {
      title: '',
      lines: dashboard
        .map(line => {
          if (typeof line === 'string') return line
          if (line && line.text != null) return String(line.text)
          if (line && line.label != null) {
            return `${line.label}${line.value == null ? '' : String(line.value)}`
          }
          return line == null ? '' : String(line)
        })
        .filter(Boolean)
    }
  }
  if (typeof dashboard === 'object') {
    const rawLines = Array.isArray(dashboard.lines) ? dashboard.lines : []
    return {
      title: dashboard.title ? String(dashboard.title) : '',
      lines: rawLines
        .map(line => {
          if (typeof line === 'string') return line
          if (line && line.text != null) return String(line.text)
          if (line && line.label != null) {
            return `${line.label}${line.value == null ? '' : String(line.value)}`
          }
          return line == null ? '' : String(line)
        })
        .filter(Boolean)
    }
  }
  return { title: '', lines: [] }
}

function buildDetectionWsUrl (taskId) {
  const backendUrl = config.API_BASE_URL
  const wsProtocol = backendUrl.startsWith('https') ? 'wss:' : 'ws:'
  const wsHost = backendUrl.replace(/^https?:\/\//, '')
  return `${wsProtocol}//${wsHost}/api/v1/realtime-detection/ws/detection/${taskId}`
}

function parseDetectionMessage (event) {
  const data = typeof event === 'string'
    ? JSON.parse(event)
    : (event && event.data != null ? JSON.parse(event.data) : event)

  const rawDashboard = data.dashboard != null ? data.dashboard : []
  const normalized = normalizeDashboardLocal(rawDashboard)

  return {
    detections: data.detections || [],
    statusTags: data.status_tags || [],
    dashboard: rawDashboard,
    dashboardLines: normalized.lines,
    dashboardTitle: normalized.title,
    debug: data.debug || null,
    generation: data.generation || (data.debug && data.debug.generation) || 0,
    stageReset: !!(data.stage_reset || (data.debug && data.debug.stage_reset)),
    frameSize: data.frame_size || { width: 1920, height: 1080 },
    frameIndex: data.frame_index || 0,
    frameTimestamp: data.frame_timestamp || 0
  }
}

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

function closeWebSocket (ws) {
  if (ws && ws.readyState <= WebSocket.OPEN) {
    ws.close()
  }
}

export default {
  buildDetectionWsUrl,
  parseDetectionMessage,
  createDetectionWebSocket,
  closeWebSocket
}
