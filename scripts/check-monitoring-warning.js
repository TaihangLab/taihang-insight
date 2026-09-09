'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const babel = require('babel-core')
const vue = require('vue-template-compiler')

const projectRoot = path.resolve(__dirname, '..')
const monitoringRoot = path.join(
  projectRoot,
  'src',
  'components',
  'visionAI',
  'monitoringWarning'
)

function findVueFiles(directory) {
  return fs.readdirSync(directory).reduce((files, name) => {
    const file = path.join(directory, name)
    const stat = fs.statSync(file)
    if (stat.isDirectory()) return files.concat(findVueFiles(file))
    return name.endsWith('.vue') ? files.concat(file) : files
  }, [])
}

function checkVueFile(file) {
  const source = fs.readFileSync(file, 'utf8')
  const component = vue.parseComponent(source)
  assert(component.script, `${file}: missing script block`)

  if (component.template) {
    const templateResult = vue.compile(component.template.content)
    assert.deepStrictEqual(templateResult.errors, [], `${file}: template compile failed`)
  }
  babel.transform(component.script.content, { filename: file })
}

function checkJavaScriptFile(file) {
  babel.transformFileSync(file)
}

function loadEsModule(file) {
  const module = { exports: {} }
  const code = babel.transformFileSync(file, {
    babelrc: false,
    plugins: ['transform-es2015-modules-commonjs']
  }).code
  new Function('module', 'exports', 'require', code)(module, module.exports, require)
  return module.exports
}

const vueFiles = findVueFiles(monitoringRoot)
vueFiles.forEach(checkVueFile)

const serviceFile = path.join(projectRoot, 'src', 'components', 'service', 'VisionAIService.js')
const realtimeMonitoringFile = path.join(monitoringRoot, 'realTimeMonitoring.vue')
const formattingFile = path.join(monitoringRoot, 'utils', 'alertFormatting.js')
const processHistoryFile = path.join(monitoringRoot, 'utils', 'alertProcessHistory.js')
;[serviceFile, formattingFile, processHistoryFile].forEach(checkJavaScriptFile)

const realtimeMonitoringSource = fs.readFileSync(realtimeMonitoringFile, 'utf8')
assert.strictEqual(realtimeMonitoringSource.includes('saveToReviewRecords'), false)
assert.strictEqual(realtimeMonitoringSource.includes('intelligentReviewRecords'), false)

const formatting = loadEsModule(formattingFile)
const processHistory = loadEsModule(processHistoryFile)

assert.strictEqual(formatting.toAlertLevelKey(2), 'level2')
assert.strictEqual(formatting.toAlertLevelKey('三级预警'), 'level3')
assert.strictEqual(formatting.getAlertLevelName('level4'), '四级预警')
assert.strictEqual(formatting.getAlertLevelShortName('一级预警'), '一级')
assert.strictEqual(formatting.toAlertStatusKey('处理中'), 'processing')
assert.strictEqual(formatting.getAlertStatusName('false_alarm'), '误报')
assert.strictEqual(
  formatting.getCurrentAlertTime(new Date('2026-01-01T19:04:05Z')),
  '2026-01-02 03:04:05'
)
assert.strictEqual(
  formatting.normalizeAlertTimeString('2026-01-02T03:04:05.123Z'),
  '2026-01-02 11:04:05'
)
assert.strictEqual(
  formatting.formatAlertDateTime('2026-01-01T19:04:05Z'),
  '2026-01-02 03:04:05'
)
assert.strictEqual(
  formatting.formatAlertDateTime('2026-01-02T03:04:05+08:00'),
  '2026-01-02 03:04:05'
)
assert.strictEqual(
  formatting.formatAlertDateTime('2026-01-02 03:04:05'),
  '2026-01-02 03:04:05'
)

const historyOptions = {
  alertTime: '2026-01-02 03:04:05',
  processedAt: '2026-01-02 03:05:05',
  processedBy: '测试人',
  formatTime: value => value || 'NOW',
  currentTime: () => 'NOW'
}

const pendingHistory = processHistory.buildAlertProcessHistory({
  ...historyOptions,
  apiStatus: '1'
})
assert.strictEqual(pendingHistory.length, 1)
assert.strictEqual(pendingHistory[0].operationType, 'pending')

const reportHistory = processHistory.buildAlertProcessHistory({
  ...historyOptions,
  apiStatus: 2,
  processData: { steps: [{ step: '上报预警', time: '2026-01-02 03:04:30' }] }
})
assert.strictEqual(reportHistory[0].operationType, 'report')

const completedHistory = processHistory.buildAlertProcessHistory({
  ...historyOptions,
  apiStatus: '3',
  processingNotes: '已排除隐患'
})
assert.strictEqual(completedHistory[0].operationType, 'completed')
assert.strictEqual(completedHistory[0].operator, '测试人')

const falseAlarmHistory = processHistory.buildAlertProcessHistory({
  ...historyOptions,
  apiStatus: 5,
  processingNotes: '现场确认为误报'
})
assert.strictEqual(falseAlarmHistory[0].description, '现场确认为误报')

console.log(`monitoring-warning checks passed: ${vueFiles.length} Vue files, 19 assertions`)
