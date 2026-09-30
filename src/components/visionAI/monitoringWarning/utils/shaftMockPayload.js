/**
 * 斜井检测 —— 仅开发测试用模拟 payload。
 * 不接入生产 WebSocket；由 verify 脚本或 ?shaft_dev_mock=1（非 production）触发。
 */

function buildShaftMockPayload (overrides) {
  const now = Date.now()
  const generation = (overrides && overrides.generation) || 1
  const frameIndex = (overrides && overrides.frame_index) || 150
  const stageReset = !!(overrides && overrides.stage_reset)

  const detections = (overrides && overrides.detections) || [
    {
      bbox: [420, 310, 520, 560],
      label: 'person',
      class_name: 'person',
      confidence: 0.93,
      color: [0, 255, 0],
      track_id: 'P001',
      in_fence: true
    },
    {
      bbox: [560, 300, 660, 550],
      label: 'person',
      class_name: 'person',
      confidence: 0.88,
      color: [0, 220, 80],
      track_id: 'P002',
      in_fence: true
    },
    {
      bbox: [700, 290, 790, 540],
      label: 'person',
      class_name: 'person',
      confidence: 0.81,
      color: [80, 200, 255],
      track_id: 'P004',
      in_fence: true
    },
    {
      bbox: [180, 360, 520, 720],
      label: 'vehicle',
      class_name: 'vehicle',
      confidence: 0.96,
      color: [0, 165, 255],
      track_id: 'V001',
      in_fence: true
    }
  ]

  const dashboardArray = [
    '模式：无固定乘车点｜摄像头：camera_01（parking）｜7.5秒',
    '当前人员：3｜当前车辆：1',
    '本帧检测：人员3｜车辆1；遮挡：人员0｜车辆0',
    '累计上车：1｜累计下车：0'
  ]

  const dashboardObject = {
    title: '斜井车辆人员综合分析',
    lines: dashboardArray.slice()
  }

  const dashboardMode = (overrides && overrides.dashboardMode) || 'array'
  const dashboard = overrides && Object.prototype.hasOwnProperty.call(overrides, 'dashboard')
    ? overrides.dashboard
    : (dashboardMode === 'object' ? dashboardObject : dashboardArray)

  return {
    detections,
    status_tags: (overrides && overrides.status_tags) || [
      { id: 'board', label: '上车', text: '1', active: true },
      { id: 'alight', label: '下车', text: '0', active: false }
    ],
    dashboard,
    frame_size: (overrides && overrides.frame_size) || { width: 1280, height: 784 },
    frame_index: frameIndex,
    frame_timestamp: (overrides && overrides.frame_timestamp) || now,
    generation,
    stage_reset: stageReset,
    debug: (overrides && overrides.debug) || {
      generation,
      stage_reset: stageReset,
      reason: (overrides && overrides.reason) || null
    }
  }
}

/** generation 切换后的首帧（先清空再应用） */
function buildShaftMockGenerationBump () {
  return buildShaftMockPayload({
    generation: 2,
    frame_index: 1,
    stage_reset: true,
    reason: 'video_loop_cut',
    detections: [
      {
        bbox: [200, 380, 480, 700],
        label: 'vehicle',
        class_name: 'vehicle',
        confidence: 0.91,
        color: [0, 165, 255],
        track_id: 'V001',
        in_fence: true
      }
    ],
    dashboard: [
      '模式：无固定乘车点｜摄像头：camera_01（parking）｜0.1秒',
      '当前人员：0｜当前车辆：1',
      '累计上车：0｜累计下车：0'
    ],
    status_tags: [
      { id: 'board', label: '上车', text: '0', active: false }
    ]
  })
}

/** 过期的旧 generation 消息（应被丢弃） */
function buildShaftMockStaleGeneration () {
  return buildShaftMockPayload({
    generation: 1,
    frame_index: 280,
    reason: 'stale'
  })
}

/** 连续空检 / empty_1s 清理 */
function buildShaftMockEmpty2s () {
  return buildShaftMockPayload({
    generation: 2,
    frame_index: 48,
    stage_reset: true,
    reason: 'empty_1s',
    detections: [],
    dashboard: ['模式：无固定乘车点｜1秒无检测目标，阶段统计已重置'],
    status_tags: []
  })
}

module.exports = {
  buildShaftMockPayload,
  buildShaftMockGenerationBump,
  buildShaftMockStaleGeneration,
  buildShaftMockEmpty2s
}
