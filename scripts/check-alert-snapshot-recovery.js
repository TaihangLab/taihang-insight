'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const babel = require('babel-core')
const vue = require('vue-template-compiler')

const file = path.resolve(__dirname, '../src/components/visionAI/monitoringWarning/realTimeMonitoring.vue')
const script = vue.parseComponent(fs.readFileSync(file, 'utf8')).script.content
const code = babel.transform(script, {
  babelrc: false,
  parserOpts: { plugins: ['dynamicImport', 'objectRestSpread'] },
  plugins: ['transform-es2015-modules-commonjs']
}).code
const loaded = { exports: {} }
const intervals = new Map()
const documentStub = { hidden: false, addEventListener() {}, removeEventListener() {}, body: { classList: { remove() {} } } }
const windowStub = { addEventListener() {}, removeEventListener() {} }
let timerId = 0
new Function('module', 'exports', 'require', 'document', 'window', 'setInterval', 'clearInterval', code)(
  loaded, loaded.exports, () => ({}), documentStub, windowStub,
  (fn, ms) => { intervals.set(++timerId, { fn, ms }); return timerId },
  id => intervals.delete(id)
)
const component = loaded.exports.default
const vm = component.data()
Object.keys(component.methods).forEach(key => { vm[key] = component.methods[key].bind(vm) })
const calls = []
vm.loadWarningData = options => calls.push(options)
;['updateDateTime', 'refreshPlayingCameraAITasks', 'initVideoArrays', 'loadAvailableArchives',
  'initSSEConnection', 'invalidatePlaybackRequests', 'releaseAllPlaybackLeases', 'exitFullscreen',
  'cleanupSSEConnection', 'cleanupAllOSDResources'].forEach(key => { vm[key] = () => {} })
vm.$nextTick = () => {}
component.mounted.call(vm)
const timer = intervals.get(vm.warningSyncTimer)
assert.strictEqual(timer.ms, 30000)
calls.length = 0
timer.fn()
assert.deepStrictEqual(calls, [{ showError: false }])
documentStub.hidden = true
timer.fn()
assert.strictEqual(calls.length, 1)
documentStub.hidden = false
vm.apiDataLoading = true
timer.fn()
assert.strictEqual(calls.length, 1)
vm.apiDataLoading = false
vm.handleVisibilityChange()
vm.handleSSEOpen()
vm.handleSSEMessage({ event: 'resync_required' })
vm.handleSSEMessage({ event: 'connected', replayed: 0 })
assert.strictEqual(calls.length, 5)
component.beforeDestroy.call(vm)
assert.strictEqual(intervals.size, 0)
timer.fn()
assert.strictEqual(calls.length, 5)
console.log('alert snapshot recovery checks passed')
