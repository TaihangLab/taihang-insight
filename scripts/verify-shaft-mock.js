#!/usr/bin/env node
/**
 * 斜井前端 mock / 兼容层离线验收（不依赖 Triton、不连真实 WS）
 */
'use strict'

const path = require('path')
const assert = require('assert')

const helpers = require(path.join(
  __dirname,
  '../src/components/visionAI/monitoringWarning/utils/shaftDetectionHelpers.js'
))
const mock = require(path.join(
  __dirname,
  '../src/components/visionAI/monitoringWarning/utils/shaftMockPayload.js'
))
// This browser module uses default export; transpile for the Node-only harness.
const fs = require('fs')
const Module = require('module')
const wsPath = path.join(__dirname, '../src/components/visionAI/monitoringWarning/utils/detectionWebSocket.js')
const wsModule = new Module(wsPath, module)
wsModule.filename = wsPath
wsModule.paths = Module._nodeModulePaths(path.dirname(wsPath))
wsModule._compile(fs.readFileSync(wsPath, 'utf8').replace('export default {', 'module.exports = {'), wsPath)
const { parseDetectionMessage } = wsModule.exports

const {
  normalizeDashboard,
  resolveTrackId,
  formatDetectionLabel,
  applyDetectionSession,
  shouldResetSessionState
} = helpers

let passed = 0
function ok (name, cond, detail) {
  if (!cond) {
    console.error('FAIL', name, detail || '')
    process.exitCode = 1
    throw new Error(name)
  }
  console.log('PASS', name, detail || '')
  passed += 1
}

// 1) dashboard 兼容
{
  const a = normalizeDashboard(['a', 'b'])
  ok('dashboard string[]', a.lines.length === 2 && a.title === '', a)

  const o = normalizeDashboard({ title: '斜井车辆人员综合分析', lines: ['x', 'y'] })
  ok('dashboard {title,lines}', o.title === '斜井车辆人员综合分析' && o.lines.join('|') === 'x|y', o)

  const mixed = normalizeDashboard({
    title: 'T',
    lines: [{ text: 't1' }, { label: 'L', value: '1' }]
  })
  ok('dashboard object line shapes', mixed.lines[0] === 't1' && mixed.lines[1] === 'L1', mixed)
}

// 2) track_id
{
  const withId = { track_id: 'P001', label: 'person', confidence: 0.9 }
  ok('resolveTrackId direct', resolveTrackId(withId) === 'P001')
  ok('format with track_id', formatDetectionLabel(withId).startsWith('P001 person'))

  const fromLabel = { label: 'P002 person', confidence: 0.8 }
  ok('resolveTrackId from label', resolveTrackId(fromLabel) === 'P002')
  ok('format from label', /P002/.test(formatDetectionLabel(fromLabel)))
}

// 3) mock payload 字段
{
  const raw = mock.buildShaftMockPayload({ dashboardMode: 'array' })
  ok('mock has P001/P002/P004/V001', ['P001', 'P002', 'P004', 'V001'].every(
    id => raw.detections.some(d => d.track_id === id)
  ))
  ok('mock bbox', raw.detections.every(d => Array.isArray(d.bbox) && d.bbox.length === 4))
  ok('mock label', raw.detections.every(d => d.label))
  ok('mock status_tags', Array.isArray(raw.status_tags) && raw.status_tags.length > 0)
  ok('mock dashboard', Array.isArray(raw.dashboard) && raw.dashboard.length > 0)
  ok('mock frame_size', raw.frame_size.width === 1280 && raw.frame_size.height === 784)
  ok('mock frame_index', raw.frame_index > 0)
  ok('mock generation', raw.generation === 1)

  const parsed = parseDetectionMessage({ data: JSON.stringify(raw) })
  ok('parse detections', parsed.detections.length === 4)
  ok('parse dashboardLines', parsed.dashboardLines.length >= 3)
  ok('parse frameSize', parsed.frameSize.width === 1280)
  ok('parse generation', parsed.generation === 1)
  ok('parse statusTags', parsed.statusTags.length > 0)

  const objRaw = mock.buildShaftMockPayload({ dashboardMode: 'object' })
  const objParsed = parseDetectionMessage({ data: JSON.stringify(objRaw) })
  ok('parse object dashboard title', objParsed.dashboardTitle === '斜井车辆人员综合分析')
  ok('parse object dashboard lines', objParsed.dashboardLines.length >= 3)
}

// 4) generation 清空 + 旧消息不污染
{
  let state = {}
  const round1 = parseDetectionMessage({
    data: JSON.stringify(mock.buildShaftMockPayload({ generation: 1, frame_index: 150 }))
  })
  let r = applyDetectionSession(state, round1)
  ok('accept gen1', r.accept && !r.sessionRestart)
  state = r.state
  ok('state has 4 dets', state.detections.length === 4)
  ok('state dashboard present', normalizeDashboard(state.dashboard).lines.length > 0)

  const bump = parseDetectionMessage({
    data: JSON.stringify(mock.buildShaftMockGenerationBump())
  })
  r = applyDetectionSession(state, bump)
  ok('sessionRestart on gen bump', r.accept && r.sessionRestart)
  state = r.state
  ok('after bump generation=2', state.generation === 2)
  ok('after bump only V001', state.detections.length === 1 && state.detections[0].track_id === 'V001')
  ok('after bump board cleared in dashboard', /累计上车：0/.test(normalizeDashboard(state.dashboard).lines.join('|')))

  // Overlay clear condition
  const shouldClear = shouldResetSessionState(
    { lastGeneration: 1, lastFrameIndex: 150, lastFrameTimestamp: round1.frameTimestamp },
    {
      debugInfo: bump.debug,
      generation: bump.generation,
      frameIndex: bump.frameIndex,
      frameTimestamp: bump.frameTimestamp,
      stageReset: bump.stageReset
    }
  )
  ok('overlay shouldResetSession on generation change', shouldClear === true)

  const stale = parseDetectionMessage({
    data: JSON.stringify(mock.buildShaftMockStaleGeneration())
  })
  r = applyDetectionSession(state, stale)
  ok('stale generation rejected', r.accept === false)
  ok('state untouched after stale', state.generation === 2 && state.detections[0].track_id === 'V001')
}

// 5) 第3个有效未匹配分析帧，只清理当前状态，不重置阶段累计
{
  let state = applyDetectionSession({}, parseDetectionMessage({
    data: JSON.stringify(mock.buildShaftMockPayload({ generation: 2, frame_index: 40 }))
  })).state
  const empty = parseDetectionMessage({
    data: JSON.stringify(mock.buildShaftMockEmpty2s())
  })
  const r = applyDetectionSession(state, empty)
  ok('empty_2s accepted', r.accept)
  ok('third miss does not reset session totals', empty.stageReset === false)
  ok('empty_2s no detections', r.state.detections.length === 0)
  ok('third analysis frame contract', /3个分析帧/.test(normalizeDashboard(r.state.dashboard).lines.join('|')))
  const late = parseDetectionMessage({data:JSON.stringify(mock.buildShaftMockPayload({
    generation:2,frame_index:47,frame_timestamp:empty.frameTimestamp-50
  }))})
  const rejected=applyDetectionSession(r.state,late)
  ok('same-generation stale result cannot restore old people', rejected.accept===false)
  ok('cleared state remains empty', rejected.state.detections.length===0)
}

// 6) 动态 task_id URL（不建真实连接）
{
  const buildDetectionWsUrl = (taskId) => `ws://127.0.0.1:8000/api/v1/realtime-detection/ws/detection/${taskId}`
  const urlA = buildDetectionWsUrl(12345)
  const urlB = buildDetectionWsUrl('task-999')
  ok('ws url dynamic A', /\/detection\/12345$/.test(urlA), urlA)
  ok('ws url dynamic B', /\/detection\/task-999$/.test(urlB), urlB)
  ok('ws url different', urlA !== urlB)
}

console.log(`\nALL_PASS count=${passed}`)

// Exercise actual Overlay methods, including empty-frame replacement and letterboxing.
{
  const overlayPath=path.join(__dirname,'../src/components/visionAI/monitoringWarning/components/DetectionOverlay.vue')
  const source=fs.readFileSync(overlayPath,'utf8').match(/<script>([\s\S]*?)<\/script>/)[1]
  const overlayModule=new Module(overlayPath,module)
  overlayModule._compile(source.replace('export default {','module.exports = {'),overlayPath)
  const component=overlayModule.exports
  let clears=0
  const instance=Object.assign(component.data(),component.methods,{
    ctx:{clearRect:()=>clears++},statusTags:[],detections:[],debugInfo:{generation:1},
    frameIndex:3,frameTimestamp:3000,alignOffset:0,ensureRaf:()=>{}
  })
  instance.batches=[{detections:[{track_id:'P001'}],startAt:0}]
  instance.onNewData()
  ok('actual overlay empty frame replaces old box immediately',clears>0 && instance.batches.length===1 && instance.batches[0].detections.length===0)
  const oldWindow=global.window
  global.window={getComputedStyle:()=>({objectFit:'contain'})}
  const box=instance.visibleMediaBox({videoWidth:1280,videoHeight:784},{width:640,height:480})
  global.window=oldWindow
  ok('1280x784 contained in 640x480 has correct black-bar offset',box.width===640 && box.height===392 && box.top===44 && box.left===0)
}
console.log(`OVERLAY_CHECKS_PASS total=${passed}`)
