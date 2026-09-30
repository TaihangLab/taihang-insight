/**
 * 斜井检测前端兼容工具（仅展示/解析层，不改后端技能逻辑）
 *
 * 注意：此文件供 webpack 与 Node 脚本共用。
 * 禁止使用 `module.exports = { ... }` 整体赋值——在被 vue/babel 链路
 * 间接加载时会触发 “Cannot assign to read only property 'exports'”，
 * 导致选择技能后 detectionWebSocket 加载失败、WS 永远未连接。
 */

/**
 * 将 dashboard 统一为可显示行：
 * - string[]
 * - { title?, lines: string[] | {text|label,value}[] }
 * @returns {{ title: string, lines: string[] }}
 */
function normalizeDashboard (dashboard) {
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
    const lines = rawLines
      .map(line => {
        if (typeof line === 'string') return line
        if (line && line.text != null) return String(line.text)
        if (line && line.label != null) {
          return `${line.label}${line.value == null ? '' : String(line.value)}`
        }
        return line == null ? '' : String(line)
      })
      .filter(Boolean)
    return {
      title: dashboard.title ? String(dashboard.title) : '',
      lines
    }
  }

  return { title: '', lines: [] }
}

/**
 * 优先 detection.track_id；否则从 label 中提取 P001/V001 类编号。
 */
function resolveTrackId (detection) {
  if (!detection || typeof detection !== 'object') return ''
  const direct = detection.track_id != null && detection.track_id !== ''
    ? detection.track_id
    : detection.trackId
  if (direct != null && direct !== '') return String(direct)

  const label = String(detection.label || detection.class_name || '')
  const match = label.match(/\b([PV]\d{3})\b/i)
  return match ? match[1].toUpperCase() : ''
}

/**
 * 画框文字：明确带上 track_id。
 * 例：P001 person: 0.92
 */
function formatDetectionLabel (detection) {
  const trackId = resolveTrackId(detection)
  const raw = String(detection && (detection.label || detection.class_name) || 'Object')
  const conf = detection && detection.confidence != null ? Number(detection.confidence) : 0
  const inFence = !(detection && detection.in_fence === false)
  const suffix = inFence ? '' : ' 栏外'

  let name = raw
  if (trackId) {
    name = raw.replace(new RegExp(`\\b${trackId}\\b`, 'ig'), '').replace(/\s+/g, ' ').trim() || raw
    return `${trackId} ${name}${suffix}: ${conf.toFixed(2)}`
  }
  return `${name}${suffix}: ${conf.toFixed(2)}`
}

/**
 * 模拟父层 sessionRestart / 旧 generation 丢弃（与 realTimeMonitoring 同源规则）。
 * @returns {{ accept: boolean, sessionRestart: boolean, state: object }}
 */
function applyDetectionSession (previous, parsed) {
  const previousGeneration = Number(
    (previous && previous.debug && previous.debug.generation) ||
    (previous && previous.generation) ||
    0
  )
  const nextGeneration = Number(
    parsed.generation || (parsed.debug && parsed.debug.generation) || 0
  )
  const previousFrameIndex = Number((previous && previous.frame_index) || 0)
  const nextFrameIndex = Number(parsed.frameIndex || 0)
  const previousTs = Number((previous && previous.frame_timestamp) || 0)
  const nextTs = Number(parsed.frameTimestamp || 0)

  const staleGeneration = (
    previousGeneration > 0 &&
    nextGeneration > 0 &&
    nextGeneration < previousGeneration
  )
  if (staleGeneration) {
    return { accept: false, sessionRestart: false, state: previous || {} }
  }

  const sessionRestart = !!(
    parsed.stageReset ||
    (previousGeneration > 0 && nextGeneration > previousGeneration) ||
    (previousFrameIndex > 0 && nextFrameIndex > 0 && nextFrameIndex < previousFrameIndex) ||
    (previousTs > 0 && nextTs > 0 && nextTs + 50 < previousTs)
  )

  const state = {
    detections: parsed.detections || [],
    status_tags: parsed.statusTags || [],
    dashboard: parsed.dashboard != null ? parsed.dashboard : [],
    debug: parsed.debug || null,
    generation: nextGeneration,
    frame_size: parsed.frameSize,
    frame_index: nextFrameIndex,
    frame_timestamp: nextTs
  }

  return { accept: true, sessionRestart, state }
}

/**
 * Overlay 侧：是否应清空旧框/旧统计。
 */
function shouldResetSessionState (prev, next) {
  const prevGeneration = Number(prev.lastGeneration || 0)
  const generation = Number(
    (next.debugInfo && next.debugInfo.generation) || next.generation || 0
  )
  const frameIndex = Number(next.frameIndex || 0)
  const frameTimestamp = Number(next.frameTimestamp || 0)
  const stageReset = !!(
    next.stageReset ||
    (next.debugInfo && next.debugInfo.stage_reset)
  )

  if (generation > 0 && prevGeneration > 0 && generation !== prevGeneration) return true
  if (stageReset && generation > 0 && generation === prevGeneration && prevGeneration > 0) {
    return false
  }
  if (stageReset && (prevGeneration === 0 || generation !== prevGeneration)) return true
  if (prev.lastFrameIndex > 0 && frameIndex > 0 && frameIndex < prev.lastFrameIndex) return true
  if (prev.lastFrameTimestamp > 0 && frameTimestamp > 0 && frameTimestamp + 50 < prev.lastFrameTimestamp) {
    return true
  }
  return false
}

exports.normalizeDashboard = normalizeDashboard
exports.resolveTrackId = resolveTrackId
exports.formatDetectionLabel = formatDetectionLabel
exports.applyDetectionSession = applyDetectionSession
exports.shouldResetSessionState = shouldResetSessionState
