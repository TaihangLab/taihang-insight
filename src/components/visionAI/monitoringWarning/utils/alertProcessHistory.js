const GENERIC_FALSE_ALARM_DESCRIPTIONS = [
  '预警已标记为误报',
  '误报',
  '标记为误报'
]

export function resolveFalseAlarmDescription(stepDescription, processingNotes) {
  const description = String(stepDescription || '').trim()
  if (description && !GENERIC_FALSE_ALARM_DESCRIPTIONS.includes(description)) {
    return description
  }

  const notes = String(processingNotes || '').trim()
  return notes || description || '预警已标记为误报'
}

function getOperationType(stepName) {
  if (['上报预警', '预警上报'].includes(stepName)) return 'report'
  if (stepName === '预警产生') return 'pending'
  if (stepName === '误报') return 'false_alarm'
  if (['已处理', '完成预警处理', '结束处理'].includes(stepName)) return 'completed'
  if (['归档', '归档预警'].includes(stepName)) return 'archive'
  if (['移出档案', '重新处理', '重新打开'].includes(stepName)) return 'processing'
  return 'processing'
}

export function buildAlertProcessHistory({
  processData,
  apiStatus,
  alertTime,
  processedBy,
  processedAt,
  processingNotes,
  formatTime,
  currentTime
}) {
  const format = typeof formatTime === 'function' ? formatTime : value => value
  const now = typeof currentTime === 'function' ? currentTime : () => ''
  const fallbackRecord = () => ({
    id: Date.now() + Math.random(),
    status: 'active',
    statusText: '待处理',
    time: alertTime || now(),
    description: '系统检测到异常情况，等待处理人员确认并开始处理',
    operationType: 'pending',
    operator: '系统'
  })

  try {
    const history = []
    const defaultOperator = processedBy || '系统'
    const processTime = processedAt || now()
    const normalizedStatus = apiStatus == null ? null : Number(apiStatus)
    const steps = processData && Array.isArray(processData.steps) ? processData.steps : []

    steps.forEach((step, index) => {
      const stepName = step.step || ''
      const operationType = getOperationType(stepName)
      history.push({
        id: step.id || (Date.now() + index + 100),
        status: 'completed',
        statusText: stepName || '处理中',
        time: format(step.time),
        description: operationType === 'false_alarm'
          ? resolveFalseAlarmDescription(step.desc || step.description, processingNotes)
          : (step.desc || step.description || ''),
        operationType,
        operator: step.operator || '系统'
      })
    })

    if (normalizedStatus == null || normalizedStatus === 1) {
      if (history.length === 0) history.push(fallbackRecord())
    } else if (normalizedStatus === 3) {
      const hasCompletedRecord = history.some(record => record.operationType === 'completed')
      if (!hasCompletedRecord) {
        history.push({
          id: Date.now() + Math.random(),
          status: 'completed',
          statusText: '已处理',
          time: processTime,
          description: processingNotes || '未填写处理意见',
          operationType: 'completed',
          operator: defaultOperator
        })
      }
    } else if (normalizedStatus === 4) {
      const hasArchiveRecord = history.some(record => record.operationType === 'archive')
      if (!hasArchiveRecord) {
        history.push({
          id: Date.now() + Math.random(),
          status: 'completed',
          statusText: '已归档',
          time: processTime,
          description: '预警已归档',
          operationType: 'archive',
          operator: defaultOperator
        })
      }
    } else if (normalizedStatus === 5) {
      const hasFalseAlarmRecord = history.some(record =>
        record.operationType === 'false_alarm' || record.statusText === '误报'
      )
      if (!hasFalseAlarmRecord) {
        history.push({
          id: Date.now() + Math.random(),
          status: 'completed',
          statusText: '误报',
          time: processTime,
          description: resolveFalseAlarmDescription('', processingNotes),
          operationType: 'false_alarm',
          operator: defaultOperator
        })
      }
    }

    return history
  } catch (error) {
    console.error('转换预警处理历史失败:', error)
    return [fallbackRecord()]
  }
}
