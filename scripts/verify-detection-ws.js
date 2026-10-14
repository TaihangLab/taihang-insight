'use strict'
// Test actual component methods without a browser, login, or starting AI tasks.
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const Module = require('module')
const assert = require('assert')
const compiler = require('vue-template-compiler')
const parser = require('babylon')
const root = path.resolve(__dirname, '..')
const wsPath = path.join(root, 'src/components/visionAI/monitoringWarning/utils/detectionWebSocket.js')
const wsModule = new Module(wsPath, module)
wsModule.filename = wsPath
wsModule.paths = Module._nodeModulePaths(path.dirname(wsPath))
wsModule._compile(fs.readFileSync(wsPath, 'utf8').replace('export default {', 'module.exports = {'), wsPath)
let running = []
let transportError = null
let sockets = []
let timers = new Map()
let timerId = 0
const deps = {
  cameraAPI: {getCameraAITasks: async () => ({data: {tasks: []}})},
  realtimeDetectionAPI: {getTasksByCamera: async () => {
    if (transportError) throw transportError
    return {data: {code: 0, data: running}}
  }},
  detectionWs: {
    createDetectionWebSocket: (id, handlers) => {
      const socket = {readyState: 0, handlers, id}
      sockets.push(socket)
      return socket
    },
    closeWebSocket: socket => {
      if (!socket) return
      socket.readyState = 3
      socket.handlers.onClose(socket, {code: 1000})
    }
  }
}
let source = compiler.parseComponent(fs.readFileSync(path.join(root,
  'src/components/visionAI/monitoringWarning/realTimeMonitoring.vue'), 'utf8')).script.content
const ast = parser.parse(source, {sourceType: 'module', plugins: ['objectRestSpread', 'dynamicImport']})
ast.program.body.filter(n => n.type === 'ImportDeclaration').reverse().forEach(n => {
  const replacement = n.specifiers.map(s => `const ${s.local.name}=deps[${JSON.stringify(s.local.name)}] || {};`).join('\n')
  source = source.slice(0, n.start) + replacement + source.slice(n.end)
})
source = source.replace('export default {', 'module.exports = {')
const context = {module: {exports: {}}, deps, require: () => ({}),
  process: {env: {NODE_ENV: 'test'}}, console: {log() {}, warn() {}, error() {}},
  WebSocket: {CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3},
  setTimeout: cb => { const id = ++timerId; timers.set(id, cb); return id },
  clearTimeout: id => timers.delete(id)}
vm.runInNewContext(source, context)
const methods = context.module.exports.methods
function instance() {
  return Object.assign({}, methods, {selectedAITasks: {0: 63}, cameraIdMapping: {0: 'cam'},
    availableAITasks: {}, aiTasksLoading: {}, aiTasksEmptyConfirmed: {},
    wsConnections: {}, wsReadyState: {}, wsStatusReason: {}, wsReconnectTimers: {},
    wsCheckTokens: {}, wsHasDetection: {}, detectionResults: {},
    $set: (obj, key, value) => { obj[key] = value },
    applyParsedDetectionResult: function(index, data) { this.detectionResults[index] = data }})
}
async function main() {
  assert.strictEqual(wsModule.exports.buildDetectionWsUrl(63),
    'ws://127.0.0.1:8000/api/v1/realtime-detection/ws/detection/63')
  const stopped = instance()
  await stopped.connectDetectionWebSocket(0, 63)
  assert.strictEqual(sockets.length, 0)
  assert.strictEqual(stopped.getWsStatusText(0), '任务未运行')
  await stopped.softRefreshAITasks('cam')
  assert.strictEqual(stopped.selectedAITasks[0], null)
  assert.strictEqual(stopped.getWsStatusText(0), '暂无运行任务')
  const refreshed = instance()
  await refreshed.connectDetectionWebSocket(0, 63)
  assert.strictEqual(refreshed.getWsStatusText(0), '任务未运行')
  running = [{task_id: 63, is_running: true}]
  const page = instance()
  await page.connectDetectionWebSocket(0, 63)
  const first = page.wsConnections[0]
  first.readyState = 1
  first.handlers.onOpen(first)
  assert.strictEqual(page.getWsStatusText(0), '已连接，等待检测数据')
  await page.connectDetectionWebSocket(0, 63)
  assert.strictEqual(sockets.length, 1)
  first.handlers.onMessage({taskId: 63, hasDetectionData: false})
  assert.strictEqual(page.wsHasDetection[0], false)
  const frame = wsModule.exports.parseDetectionMessage({task_id: 63, frame_index: 1,
    frame_timestamp: 1000, detections: [], frame_size: {width: 1280, height: 784}})
  first.handlers.onMessage(frame)
  assert.strictEqual(page.getWsStatusText(0), '已连接')
  first.readyState = 3
  first.handlers.onClose(first, {code: 1006})
  assert.strictEqual(timers.size, 1)
  const retry = Array.from(timers.values())[0]
  timers.clear()
  retry()
  await new Promise(resolve => setImmediate(resolve))
  assert.strictEqual(sockets.length, 2)
  const second = page.wsConnections[0]
  second.readyState = 1
  second.handlers.onOpen(second)
  first.handlers.onClose(first, {code: 1006})
  assert.strictEqual(page.wsConnections[0], second)
  running = []
  second.readyState = 3
  second.handlers.onClose(second, {code: 1000})
  const stopRetry = Array.from(timers.values())[0]
  timers.clear(); stopRetry()
  await new Promise(resolve => setImmediate(resolve))
  assert.strictEqual(sockets.length, 2)
  assert.strictEqual(page.getWsStatusText(0), '任务未运行')
  assert.strictEqual(timers.size, 0)
  const replacement = instance()
  replacement.availableAITasks.cam = [{task_id: 63, skill_name: 'free'}]
  running = [{task_id: 65, is_running: true, skill_name: 'free'}]
  await replacement.softRefreshAITasks('cam')
  await new Promise(resolve => setImmediate(resolve))
  assert.strictEqual(replacement.selectedAITasks[0], 65)
  assert.strictEqual(replacement.wsConnections[0].id, 65)
  const old = replacement.wsConnections[0]
  running = [{task_id: 66, is_running: true, skill_name: 'free'}]
  await replacement.softRefreshAITasks('cam')
  await new Promise(resolve => setImmediate(resolve))
  assert.strictEqual(old.readyState, 3)
  assert.strictEqual(replacement.selectedAITasks[0], 66)
  assert.strictEqual(replacement.wsConnections[0].id, 66)
  old.handlers.onClose(old, {code: 1006})
  assert.strictEqual(replacement.wsConnections[0].id, 66)
  replacement.cleanupAllOSDResources()
  const ambiguous = instance()
  running = [{task_id: 67, is_running: true}, {task_id: 68, is_running: true}]
  await ambiguous.softRefreshAITasks('cam')
  assert.strictEqual(ambiguous.selectedAITasks[0], null)
  assert.strictEqual(ambiguous.getWsStatusText(0), '请选择运行任务')
  const unknown = instance()
  running = [{task_id: 63}]
  await unknown.connectDetectionWebSocket(0, 63)
  assert.strictEqual(unknown.getWsStatusText(0), '任务未运行')
  transportError = {response: {status: 401}}
  await page.connectDetectionWebSocket(0, 63)
  assert.strictEqual(page.getWsStatusText(0), '登录或权限异常')
  page.cleanupAllOSDResources()
  assert.strictEqual(timers.size, 0)
  const merged = instance()
  merged.detectionUpdateTime = {}
  merged.videoResolutions = {}
  const combined = wsModule.exports.parseDetectionMessage({task_id: 65, frame_index: 1,
    detections: [], overlay_lines: [{points: [[0, 0], [10, 10]]}], enter_count: 2,
    gate_direction: 'in', person_statistics: {current_person_count: 1}, timing: {capture_to_publish_ms: 100}})
  methods.applyParsedDetectionResult.call(merged, 0, combined)
  assert.strictEqual(merged.detectionResults[0].enter_count, 2)
  assert.strictEqual(merged.detectionResults[0].gate_direction, 'in')
  assert.strictEqual(merged.detectionResults[0].overlay_lines.length, 1)
  assert.strictEqual(merged.detectionResults[0].person_statistics.current_person_count, 1)
  assert.strictEqual(merged.detectionResults[0].timing.capture_to_publish_ms, 100)
  console.log('PASS: actual URL; stopped/deleted task; ID replacement; first-data status; duplicate guard; reconnect; stale close; login error; cleanup; colleague crossing fields. No AI task started.')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
