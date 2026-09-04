const LEVEL_KEYS = {
  1: 'level1',
  2: 'level2',
  3: 'level3',
  4: 'level4'
}

export const ALERT_LEVEL_CODE_BY_KEY = Object.freeze({
  level1: 1,
  level2: 2,
  level3: 3,
  level4: 4
})

const LEVEL_NAMES = {
  1: '一级预警',
  2: '二级预警',
  3: '三级预警',
  4: '四级预警'
}

const LEVEL_KEY_BY_NAME = Object.freeze(
  Object.keys(LEVEL_NAMES).reduce((result, code) => {
    result[LEVEL_NAMES[code]] = LEVEL_KEYS[code]
    return result
  }, {})
)

const LEVEL_SHORT_NAMES = {
  1: '一级',
  2: '二级',
  3: '三级',
  4: '四级',
  level1: '一级',
  level2: '二级',
  level3: '三级',
  level4: '四级',
  一级预警: '一级',
  二级预警: '二级',
  三级预警: '三级',
  四级预警: '四级'
}

export const ALERT_STATUS_KEY_BY_CODE = Object.freeze({
  1: 'pending',
  2: 'processing',
  3: 'completed',
  4: 'archived',
  5: 'false_alarm'
})

export const ALERT_STATUS_NAME_BY_CODE = Object.freeze({
  1: '待处理',
  2: '处理中',
  3: '已处理',
  4: '已归档',
  5: '误报'
})

export const ALERT_STATUS_NAME_BY_KEY = Object.freeze({
  pending: '待处理',
  processing: '处理中',
  completed: '已处理',
  archived: '已归档',
  false_alarm: '误报'
})

const ALERT_STATUS_KEY_BY_NAME = Object.freeze(
  Object.keys(ALERT_STATUS_NAME_BY_KEY).reduce((result, key) => {
    result[ALERT_STATUS_NAME_BY_KEY[key]] = key
    return result
  }, {})
)

export function toAlertLevelKey(level, fallback = 'level1') {
  if (LEVEL_KEYS[Number(level)]) return LEVEL_KEYS[Number(level)]
  if (LEVEL_KEY_BY_NAME[level]) return LEVEL_KEY_BY_NAME[level]
  if (ALERT_LEVEL_CODE_BY_KEY[level]) return level
  return fallback
}

export function getAlertLevelName(level, fallback = '未知等级') {
  if (LEVEL_KEY_BY_NAME[level]) return level
  const key = toAlertLevelKey(level, '')
  return LEVEL_NAMES[ALERT_LEVEL_CODE_BY_KEY[key]] || fallback
}

export function getAlertLevelShortName(level, fallback = '未知') {
  return LEVEL_SHORT_NAMES[level] || LEVEL_SHORT_NAMES[Number(level)] || fallback
}

export function toAlertStatusKey(status, statusDisplay, fallback = 'pending') {
  if (statusDisplay && ALERT_STATUS_KEY_BY_NAME[statusDisplay]) {
    return ALERT_STATUS_KEY_BY_NAME[statusDisplay]
  }
  if (ALERT_STATUS_NAME_BY_KEY[status]) return status
  return ALERT_STATUS_KEY_BY_CODE[Number(status)] || ALERT_STATUS_KEY_BY_NAME[status] || fallback
}

export function getAlertStatusName(status, fallback = '未知状态') {
  if (ALERT_STATUS_KEY_BY_NAME[status]) return status
  return ALERT_STATUS_NAME_BY_CODE[Number(status)] || ALERT_STATUS_NAME_BY_KEY[status] || fallback
}

const SHANGHAI_OFFSET_MILLISECONDS = 8 * 60 * 60 * 1000
const NAIVE_DATE_TIME_PATTERN = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(?:\.\d+)?$/
const EXPLICIT_TIMEZONE_PATTERN = /(Z|[+-]\d{2}:?\d{2})$/i

function formatInstantInShanghai(date) {
  const shanghaiTime = new Date(date.getTime() + SHANGHAI_OFFSET_MILLISECONDS)
  const year = shanghaiTime.getUTCFullYear()
  const month = String(shanghaiTime.getUTCMonth() + 1).padStart(2, '0')
  const day = String(shanghaiTime.getUTCDate()).padStart(2, '0')
  const hours = String(shanghaiTime.getUTCHours()).padStart(2, '0')
  const minutes = String(shanghaiTime.getUTCMinutes()).padStart(2, '0')
  const seconds = String(shanghaiTime.getUTCSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export function getCurrentAlertTime(now = new Date()) {
  return formatInstantInShanghai(now)
}

export function formatAlertDateTime(timeString, fallback = getCurrentAlertTime()) {
  if (!timeString) return fallback

  try {
    if (typeof timeString === 'string') {
      const value = timeString.trim()
      const naiveMatch = value.match(NAIVE_DATE_TIME_PATTERN)
      // Existing naive API values are Shanghai wall time. Do not let the
      // browser reinterpret them using the workstation's timezone.
      if (naiveMatch && !EXPLICIT_TIMEZONE_PATTERN.test(value)) {
        return `${naiveMatch[1]} ${naiveMatch[2]}`
      }
    }
    const date = timeString instanceof Date ? timeString : new Date(timeString)
    return isNaN(date.getTime()) ? String(timeString) : formatInstantInShanghai(date)
  } catch (error) {
    return String(timeString || fallback)
  }
}

export function normalizeAlertTimeString(timeString) {
  if (!timeString) return ''
  return formatAlertDateTime(timeString, '')
}
