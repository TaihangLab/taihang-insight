<template>
  <div class="detection-overlay-container" :class="{ 'shaft-mode': dashboardLines.length }">
    <div v-if="currentStatusTags.length" class="status-tags" :class="{ 'status-tags-side': dashboardLines.length }">
      <div
        v-for="tag in currentStatusTags"
        :key="tag.id || tag.label"
        class="status-tag"
        :class="{ active: tag.active && tag.kind !== 'alert', 'alert-active': tag.kind === 'alert' && tag.active }"
      >
        <span class="status-tag-dot"></span>
        <span class="status-tag-label">{{ tag.label }}</span>
        <span class="status-tag-text">{{ tag.text }}</span>
      </div>
    </div>
    <!-- Canvas层用于绘制检测框（尺寸/位置由 syncToVideoElement 贴合真实 video 元素） -->
    <canvas
      ref="overlayCanvas"
      class="detection-canvas">
    </canvas>
  </div>
</template>

<script>
export default {
  name: 'DetectionOverlay',
  props: {
    containerWidth: {
      type: Number,
      default: 640
    },
    containerHeight: {
      type: Number,
      default: 480
    },
    detections: {
      type: Array,
      default: () => []
    },
    // 左上角标签：运动状态徽标，以及技能图结束节点的画面提示（如疑似尾随）
    statusTags: {
      type: Array,
      default: () => []
    },
    // 兼容 string[] 与 { title, lines }
    dashboard: {
      type: [Array, Object],
      default: null
    },
    frameIndex: {
      type: Number,
      default: 0
    },
    debugInfo: {
      type: Object,
      default: null
    },
    // 原始视频分辨率（bbox 坐标所参照的检测帧分辨率，由后端 frame_size 提供）
    videoWidth: {
      type: Number,
      default: 1920
    },
    videoHeight: {
      type: Number,
      default: 1080
    },
    // 采集帧时间戳(epoch ms)。后端按~30fps重复推同一结果，用它去重，
    // 仅当时间戳变化时才视为“新的一帧检测”，从而正确触发短保持+淡出。
    frameTimestamp: {
      type: Number,
      default: 0
    },
    // 检测框全亮保持时长(ms)。调小可减少旧框"钉在原地"的时间；
    // 若检测帧率很低(如1fps)出现闪烁，可适当调大。
    // 仅为无新消息时的显示期限；业务清理由后端3个有效分析帧决定。
    holdDuration: {
      type: Number,
      default: 800
    },
    // 检测框淡出时长(ms)
    fadeDuration: {
      type: Number,
      default: 200
    },
    overlayLines: {
      type: Array,
      default: () => []
    },
    // 运行计划区域绘制结果（电子围栏）：选中 AI 任务后常驻显示，不随检测批次淡出
    fence: {
      type: Object,
      default: null
    },
    hideTrackId: {
      type: Boolean,
      default: false
    },
    // 播放器是 WebRTC/FLV 直播，没有和检测帧共用的帧号。
    // 这里不再额外推迟画框；检测结果晚到时立即画，避免把旧框再拖后。
    alignOffset: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      canvasWidth: 640,
      canvasHeight: 480,
      ctx: null,
      rafId: null,
      currentStatusTags: [],
      // 待显示/正在淡出的检测批次队列：{ detections, startAt }
      batches: [],
      lastFrameTimestamp: 0,
      lastSignature: '',
      lastGeneration: 0,
      lastFrameIndex: 0
    }
  },
  computed: {
    normalizedDashboard() {
      const dashboard = this.dashboard
      if (!dashboard) return { title: '', lines: [] }
      if (Array.isArray(dashboard)) {
        return {
          title: '',
          lines: dashboard.map(line => {
            if (typeof line === 'string') return line
            if (line && line.text != null) return String(line.text)
            if (line && line.label != null) return String(line.label) + (line.value == null ? '' : String(line.value))
            return line == null ? '' : String(line)
          }).filter(Boolean)
        }
      }
      if (typeof dashboard === 'object') {
        const rawLines = Array.isArray(dashboard.lines) ? dashboard.lines : []
        return {
          title: dashboard.title ? String(dashboard.title) : '',
          lines: rawLines.map(line => {
            if (typeof line === 'string') return line
            if (line && line.text != null) return String(line.text)
            if (line && line.label != null) return String(line.label) + (line.value == null ? '' : String(line.value))
            return line == null ? '' : String(line)
          }).filter(Boolean)
        }
      }
      return { title: '', lines: [] }
    },
    dashboardTitle() {
      return this.normalizedDashboard.title || ''
    },
    dashboardLines() {
      return this.normalizedDashboard.lines
    }
  },
  watch: {
    frameTimestamp() {
      this.onNewData()
    },
    detections: {
      handler() {
        this.onNewData()
      },
      deep: true
    },
    statusTags: {
      handler() {
        this.onNewData()
      },
      deep: true
    },
    frameIndex() {
      this.onNewData()
    },
    debugInfo: {
      handler() {
        this.onNewData()
      },
      deep: true
    },
    dashboard: {
      handler() {
        this.onNewData()
      },
      deep: true
    },
    overlayLines: {
      handler() {
        this.onNewData()
      },
      deep: true
    },
    fence: {
      handler() {
        this.onNewData()
      },
      deep: true
    }
  },
  mounted() {
    this.initCanvas()
    this.syncToVideoElement()
    this.onNewData()
  },
  beforeDestroy() {
    this.stopRaf()
  },
  methods: {
    initCanvas() {
      const canvas = this.$refs.overlayCanvas
      if (!canvas) return

      this.ctx = canvas.getContext('2d', {
        alpha: true,
        desynchronized: true
      })

      this.ctx.imageSmoothingEnabled = true
      this.ctx.imageSmoothingQuality = 'high'
    },

    /**
     * 视频在元素内可能有 contain/cover 黑边，框要贴实际画面而不是整个 video 标签。
     */
    visibleMediaBox(mediaEl, vRect) {
      const empty = { left: 0, top: 0, width: vRect.width, height: vRect.height }
      const iw = mediaEl.videoWidth || mediaEl.naturalWidth || 0
      const ih = mediaEl.videoHeight || mediaEl.naturalHeight || 0
      if (!iw || !ih) return empty
      let fit = 'fill'
      try {
        fit = (window.getComputedStyle(mediaEl).objectFit || 'fill').toLowerCase()
      } catch (e) {}
      if (fit === 'fill' || fit === 'none') return empty
      const scaleX = vRect.width / iw
      const scaleY = vRect.height / ih
      const scale = fit === 'cover' ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY)
      const width = iw * scale
      const height = ih * scale
      return {
        left: (vRect.width - width) / 2,
        top: (vRect.height - height) / 2,
        width,
        height
      }
    },

    /**
     * 将叠加 canvas 精确贴合到播放器真实的视频元素上。
     */
    syncToVideoElement() {
      const canvas = this.$refs.overlayCanvas
      if (!canvas) return false
      const host = this.$el && this.$el.parentNode // .video-player-wrapper
      if (!host) return false

      let videoEl = host.querySelector('video')
      if (!videoEl) {
        const cs = host.querySelectorAll('canvas')
        for (let i = 0; i < cs.length; i++) {
          if (cs[i] !== canvas) { videoEl = cs[i]; break }
        }
      }
      let mediaRect = videoEl ? videoEl.getBoundingClientRect() : null
      if (!mediaRect || mediaRect.width < 8 || mediaRect.height < 8) {
        videoEl = this.$el
        mediaRect = videoEl.getBoundingClientRect()
      }
      if (!mediaRect || mediaRect.width < 8 || mediaRect.height < 8) return false

      const vRect = mediaRect
      const cRect = this.$el.getBoundingClientRect()
      const box = videoEl === this.$el
        ? { left: 0, top: 0, width: vRect.width, height: vRect.height }
        : this.visibleMediaBox(videoEl, vRect)
      const w = Math.round(box.width)
      const h = Math.round(box.height)
      if (w <= 0 || h <= 0) return false

      canvas.style.position = 'absolute'
      canvas.style.left = Math.round(vRect.left - cRect.left + box.left) + 'px'
      canvas.style.top = Math.round(vRect.top - cRect.top + box.top) + 'px'
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        this.canvasWidth = w
        this.canvasHeight = h
        if (this.ctx) {
          this.ctx.imageSmoothingEnabled = true
          this.ctx.imageSmoothingQuality = 'high'
        }
      }
      return true
    },

    shouldResetSession() {
      const debug = this.debugInfo || {}
      const generation = Number(debug.generation || 0)
      const frameIndex = Number(this.frameIndex || 0)
      const frameTimestamp = Number(this.frameTimestamp || 0)
      if (generation > 0 && this.lastGeneration > 0 && generation !== this.lastGeneration) return true
      if (debug.stage_reset && generation > 0 && generation === this.lastGeneration && this.lastGeneration > 0) {
        // 同一代里重复收到 stage_reset 标记时不再反复清空，避免刚入队的新框被冲掉
        return false
      }
      if (debug.stage_reset && (this.lastGeneration === 0 || generation !== this.lastGeneration)) return true
      if (this.lastFrameIndex > 0 && frameIndex > 0 && frameIndex < this.lastFrameIndex) return true
      if (this.lastFrameTimestamp > 0 && frameTimestamp > 0 && frameTimestamp + 50 < this.lastFrameTimestamp) return true
      return false
    },

    /**
     * 收到新数据：去重后决定是否作为“新的一帧检测”入队。
     * 后端按~30fps重复推送同一结果，必须去重，否则批次被反复重置、永不淡出。
     */
    onNewData() {
      const debug = this.debugInfo || {}
      const generation = Number(debug.generation || 0)
      if (this.shouldResetSession()) {
        this.clear()
      }
      if (generation > 0) this.lastGeneration = generation
      if (this.frameIndex) this.lastFrameIndex = Number(this.frameIndex)

      this.currentStatusTags = this.statusTags ? this.statusTags.slice() : []

      const ft = this.frameTimestamp || 0
      let isNew = false
      if (ft > 0) {
        if (ft !== this.lastFrameTimestamp) {
          isNew = true
          this.lastFrameTimestamp = ft
        }
      } else {
        const sig = this.computeSignature(this.detections, this.statusTags)
        if (sig !== this.lastSignature) {
          isNew = true
          this.lastSignature = sig
        }
      }
      if (isNew) {
        this.pushBatch(this.detections || [])
      }
      if (this.hasOverlayLines() || this.hasFenceGeometry()) {
        this.ensureRaf()
      } else if (!this.batches.length) {
        this.clearCanvas()
      }
    },

    /**
     * 入队一个新批次。
     *
     * 对齐思路：画面此刻显示的是约 alignOffset 毫秒前采集的帧（视频链路延迟），
     * 而本批检测结果对应 age = (now - frameTimestamp) 毫秒前采集的帧。
     * 若 age < alignOffset（检测比画面先到），延后 alignOffset - age 再显示；
     * 若 age >= alignOffset（检测本身已落后于画面，常见情况），立即显示，不再追加延迟。
     */
    pushBatch(detections) {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
      let delay = 0
      if (this.alignOffset > 0 && this.frameTimestamp > 0) {
        const age = Date.now() - this.frameTimestamp
        if (age >= 0 && age < 10000) {
          delay = Math.max(0, this.alignOffset - age)
        }
      }
      this.batches = [{
        detections: detections ? detections.slice() : [],
        startAt: now + delay
      }]
      if (!detections || !detections.length) this.clearCanvas()
      this.ensureRaf()
    },

    computeSignature(dets, tags) {
      const dPart = (!dets || !dets.length)
        ? 'empty'
        : dets
          .map(d => (d.bbox || []).map(v => Math.round(v)).join(',') + ':' + (d.track_id || d.trackId || d.label || d.class_name || ''))
          .join('|')
      const tPart = (!tags || !tags.length)
        ? ''
        : tags.map(t => `${t.id || ''}:${t.active ? 1 : 0}:${t.text || ''}`).join('|')
      return dPart + '#' + tPart
    },

    ensureRaf() {
      if (this.rafId == null) {
        this.rafId = requestAnimationFrame(this.renderLoop)
      }
    },

    stopRaf() {
      if (this.rafId != null) {
        cancelAnimationFrame(this.rafId)
        this.rafId = null
      }
    },

    clearCanvas() {
      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
      }
    },

    /**
     * 渲染主循环：短保持 + 淡出，由 requestAnimationFrame 驱动。
     */
    renderLoop() {
      this.rafId = requestAnimationFrame(this.renderLoop)

      if (!this.ctx) {
        return
      }

      if (!this.syncToVideoElement()) {
        return
      }

      const now = typeof performance !== 'undefined' ? performance.now() : Date.now()

      // 若已有更新的批次到达其显示时刻，丢弃被取代的旧批次（保证不出现空窗）
      while (this.batches.length > 1 && this.batches[1].startAt <= now) {
        this.batches.shift()
      }

      let current = null
      if (this.batches.length && this.batches[0].startAt <= now) {
        current = this.batches[0]
      }

      if (!current) {
        if (this.hasPersistentOverlay()) {
          this.clearCanvas()
          this.drawPersistentOverlay()
          return
        }
        this.clearCanvas()
        if (!this.batches.length) {
          this.stopRaf()
        }
        return
      }

      const elapsed = now - current.startAt
      const total = this.holdDuration + this.fadeDuration
      let alpha
      if (elapsed <= this.holdDuration) {
        alpha = 1
      } else if (elapsed <= total) {
        alpha = 1 - (elapsed - this.holdDuration) / this.fadeDuration
      } else {
        alpha = 0
      }

      if (alpha <= 0) {
        this.batches.shift()
        if (this.hasPersistentOverlay()) {
          this.clearCanvas()
          this.drawPersistentOverlay()
          return
        }
        this.clearCanvas()
        if (!this.batches.length) {
          this.stopRaf()
        }
        return
      }

      this.renderBatch(current.detections, alpha)
      this.drawOverlayLines()
    },

    hasOverlayLines() {
      return Array.isArray(this.overlayLines) && this.overlayLines.length > 0
    },

    fenceRegions() {
      const f = this.fence || {}
      if (Array.isArray(f.regions) && f.regions.length) return f.regions
      if (Array.isArray(f.points) && f.points.length >= 3) {
        return [{ name: '', points: f.points }]
      }
      return []
    },

    fenceTripwires() {
      const f = this.fence || {}
      return Array.isArray(f.tripwires) ? f.tripwires : []
    },

    fencePixelLineGroups() {
      const f = this.fence || {}
      const specs = [
        { key: 'count_line', side: 'enter_point', color: '#3d9b6e', label: '过线' },
        { key: 'bypass_line', side: 'bypass_point', color: '#e6a23c', label: '绕行' }
      ]
      return specs.map(spec => {
        const cfg = f[spec.key] || {}
        const lines = Array.isArray(cfg.lines) ? cfg.lines : []
        return Object.assign({}, spec, {
          lines,
          iw: Number(cfg.image_width) || 0,
          ih: Number(cfg.image_height) || 0
        })
      }).filter(g => g.lines.length)
    },

    hasFenceGeometry() {
      return this.fenceRegions().some(r => (r.points || []).length >= 3)
        || this.fenceTripwires().some(t => (t.line || t.points || []).length >= 2)
        || this.fencePixelLineGroups().length > 0
    },

    hasPersistentOverlay() {
      return this.hasOverlayLines() || this.hasFenceGeometry()
    },

    drawPersistentOverlay() {
      this.drawFenceGeometry()
      this.drawOverlayLines()
    },

    drawOverlayLines() {
      if (!this.ctx || !this.hasOverlayLines() || !this.videoWidth || !this.videoHeight) return
      const scaleX = this.canvasWidth / this.videoWidth
      const scaleY = this.canvasHeight / this.videoHeight
      const prevAlpha = this.ctx.globalAlpha
      this.ctx.globalAlpha = 1
      this.ctx.setLineDash([])
      this.overlayLines.forEach(item => {
        const line = item && item.line
        if (!Array.isArray(line) || line.length < 2) return
        const color = item.kind === 'bypass' ? '#f56c6c' : '#e6a23c'
        const ax = line[0].x * scaleX
        const ay = line[0].y * scaleY
        const bx = line[1].x * scaleX
        const by = line[1].y * scaleY
        this.ctx.beginPath()
        this.ctx.moveTo(ax, ay)
        this.ctx.lineTo(bx, by)
        this.ctx.strokeStyle = color
        this.ctx.lineWidth = Math.max(2, 3 * ((scaleX + scaleY) / 2))
        this.ctx.stroke()
        ;[line[0], line[1], item.side].forEach(p => {
          if (!p || typeof p.x !== 'number') return
          this.ctx.beginPath()
          this.ctx.arc(p.x * scaleX, p.y * scaleY, 4, 0, Math.PI * 2)
          this.ctx.fillStyle = color
          this.ctx.fill()
        })
        if (item.label) {
          this.ctx.font = '12px sans-serif'
          this.ctx.fillStyle = '#fff'
          this.ctx.fillText(String(item.label), ax + 6, ay - 6)
        }
      })
      this.ctx.globalAlpha = prevAlpha
    },

    /** 运行计划区域绘制：归一化坐标 → 贴合视频的 canvas（与 FencePreview 样式一致） */
    drawFenceGeometry() {
      if (!this.ctx || !this.hasFenceGeometry()) return
      const W = this.canvasWidth
      const H = this.canvasHeight
      if (!W || !H) return
      const k = Math.max(1, Math.min(W, H) / 480)
      const prevAlpha = this.ctx.globalAlpha
      this.ctx.globalAlpha = 1
      this.fenceRegions().forEach((r, i) => {
        if (r.visible === false) return
        const points = r.points || []
        if (points.length < 3) return
        this.drawFenceRegion(r, points, W, H, k, i)
      })
      this.fenceTripwires().forEach(t => {
        if (t.visible === false) return
        const line = t.line || t.points || []
        if (line.length < 2) return
        this.drawFenceTripwire(t, line, W, H, k)
      })
      this.fencePixelLineGroups().forEach(g => this.drawFencePixelLines(g, W, H, k))
      this.ctx.globalAlpha = prevAlpha
    },

    drawFenceRegion(r, points, W, H, k, index) {
      const invert = !!r.invert
      const bound = !!(r.bind_node || r.bind_node_name)
      const stroke = invert ? '#e6a23c' : (bound ? '#3370ff' : '#ff4d4f')
      const fill = invert ? 'rgba(250,140,22,0.24)' : (bound ? 'rgba(51,112,255,0.22)' : 'rgba(255,77,79,0.22)')
      const tag = invert ? '#fa8c16' : (bound ? '#3370ff' : '#ff4d4f')
      const ctx = this.ctx

      ctx.beginPath()
      points.forEach((p, i) => {
        const x = Number(p.x) * W
        const y = Number(p.y) * H
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.closePath()
      ctx.fillStyle = fill
      ctx.fill()
      ctx.lineWidth = 2 * k
      ctx.strokeStyle = stroke
      ctx.setLineDash(invert ? [7 * k, 5 * k] : [])
      ctx.stroke()
      ctx.setLineDash([])

      points.forEach(p => {
        ctx.beginPath()
        ctx.arc(Number(p.x) * W, Number(p.y) * H, 4 * k, 0, Math.PI * 2)
        ctx.fillStyle = '#fff'
        ctx.fill()
        ctx.lineWidth = 2 * k
        ctx.strokeStyle = stroke
        ctx.stroke()
      })

      const name = (r.name || '').trim()
      const bits = []
      if (name) bits.push(name)
      if (r.bind_node_name) bits.push(r.bind_node_name)
      if (invert) bits.push('反选')
      const text = bits.length > 1 && name ? `${name}（${bits.slice(1).join('·')}）` : (bits[0] || '')
      if (!text) return
      let anchor = points[0]
      points.forEach(p => { if (Number(p.y) > Number(anchor.y)) anchor = p })
      const fontSize = 11 * k
      const padX = 6 * k
      const padY = 3 * k
      const x = Number(anchor.x) * W + 6 * k
      const y = Number(anchor.y) * H - 6 * k
      ctx.font = `${fontSize}px "Microsoft YaHei", "PingFang SC", sans-serif`
      const tw = ctx.measureText(text).width
      ctx.fillStyle = tag
      ctx.fillRect(x - padX, y - fontSize - padY, tw + padX * 2, fontSize + 3 * k + padY * 2)
      ctx.fillStyle = '#fff'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText(text, x, y)
    },

    drawFenceTripwire(t, line, W, H, k) {
      const ctx = this.ctx
      const ax = Number(line[0].x) * W
      const ay = Number(line[0].y) * H
      const bx = Number(line[1].x) * W
      const by = Number(line[1].y) * H
      const color = '#52c41a'

      ctx.beginPath()
      ctx.moveTo(ax, ay)
      ctx.lineTo(bx, by)
      ctx.lineWidth = 2 * k
      ctx.strokeStyle = color
      ctx.setLineDash([])
      ctx.stroke()

      const mx = (ax + bx) / 2
      const my = (ay + by) / 2
      const len = Math.hypot(bx - ax, by - ay) || 1
      let nx = -(by - ay) / len
      let ny = (bx - ax) / len
      if (t.direction === 'ba') { nx = -nx; ny = -ny }
      const drawArrow = (dirx, diry) => {
        const alen = 16 * k
        const tipx = mx + dirx * alen
        const tipy = my + diry * alen
        ctx.beginPath()
        ctx.moveTo(mx, my)
        ctx.lineTo(tipx, tipy)
        ctx.lineWidth = 1.6 * k
        ctx.strokeStyle = color
        ctx.stroke()
        const head = 5 * k
        ctx.beginPath()
        ctx.moveTo(tipx, tipy)
        ctx.lineTo(tipx - dirx * head - diry * head * 0.6, tipy - diry * head + dirx * head * 0.6)
        ctx.lineTo(tipx - dirx * head + diry * head * 0.6, tipy - diry * head - dirx * head * 0.6)
        ctx.closePath()
        ctx.fillStyle = color
        ctx.fill()
      }
      drawArrow(nx, ny)
      if (t.direction === 'both') drawArrow(-nx, -ny)

      const drawEndpoint = (x, y, label) => {
        ctx.beginPath()
        ctx.arc(x, y, 4.5 * k, 0, Math.PI * 2)
        ctx.fillStyle = '#fff'
        ctx.fill()
        ctx.lineWidth = 2 * k
        ctx.strokeStyle = color
        ctx.stroke()
        const fs = 10 * k
        ctx.font = `bold ${fs}px sans-serif`
        const tw = ctx.measureText(label).width
        const pad = 3 * k
        ctx.fillStyle = '#1f2937'
        ctx.fillRect(x + 6 * k, y - fs - pad, tw + pad * 2, fs + pad * 2)
        ctx.fillStyle = '#fff'
        ctx.textBaseline = 'alphabetic'
        ctx.fillText(label, x + 6 * k + pad, y - pad)
      }
      drawEndpoint(ax, ay, 'A')
      drawEndpoint(bx, by, 'B')

      const name = (t.name || '').trim()
      if (name) {
        const fs = 11 * k
        ctx.font = `${fs}px "Microsoft YaHei", "PingFang SC", sans-serif`
        const tw = ctx.measureText(name).width
        const pad = 4 * k
        ctx.fillStyle = color
        ctx.fillRect(mx + 8 * k, my + 6 * k, tw + pad * 2, fs + pad * 2)
        ctx.fillStyle = '#fff'
        ctx.textBaseline = 'alphabetic'
        ctx.fillText(name, mx + 8 * k + pad, my + 6 * k + fs + pad / 2)
      }
    },

    drawFencePixelLines(group, W, H, k) {
      const ctx = this.ctx
      const sx = group.iw ? W / group.iw : 1
      const sy = group.ih ? H / group.ih : 1
      group.lines.forEach((it, idx) => {
        const line = it && it.line
        if (!Array.isArray(line) || line.length < 2) return
        const ax = line[0].x * sx
        const ay = line[0].y * sy
        const bx = line[1].x * sx
        const by = line[1].y * sy
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(bx, by)
        ctx.lineWidth = 3 * k
        ctx.strokeStyle = group.color
        ctx.setLineDash([])
        ctx.stroke()
        ;[line[0], line[1], it[group.side]].forEach(p => {
          if (!p || typeof p.x !== 'number') return
          ctx.beginPath()
          ctx.arc(p.x * sx, p.y * sy, 4 * k, 0, Math.PI * 2)
          ctx.fillStyle = group.color
          ctx.fill()
        })
        ctx.font = `${12 * k}px "Microsoft YaHei", "PingFang SC", sans-serif`
        ctx.fillStyle = '#fff'
        ctx.textBaseline = 'alphabetic'
        ctx.fillText(`${group.label}#${idx + 1}`, ax + 8 * k, ay - 8 * k)
      })
    },

    renderBatch(detections, alpha) {
      this.clearCanvas()
      // 围栏常驻层画在检测框之下
      this.drawFenceGeometry()
      if (!detections || detections.length === 0) {
        return
      }

      const scaleX = this.canvasWidth / this.videoWidth
      const scaleY = this.canvasHeight / this.videoHeight

      const prevAlpha = this.ctx.globalAlpha
      this.ctx.globalAlpha = alpha
      detections.forEach(detection => {
        this.drawTrackHistory(detection, scaleX, scaleY)
      })
      detections.forEach(detection => {
        this.drawSingleDetection(detection, scaleX, scaleY)
      })
      this.ctx.globalAlpha = prevAlpha
    },

    drawSingleDetection(detection, scaleX, scaleY) {
      // 静态场景区域：停车区、固定乘车点、固定下车点。
      // 它不是人员/车辆框，因此单独绘制多边形；上下车统计仍由右侧状态标签显示。
      if (detection && detection.is_region === true && Array.isArray(detection.points)) {
        this.drawRegion(detection, scaleX, scaleY)
        return
      }

      // 斜井车辆子区域(zone/auxiliary)不在 OSD 再画一层，避免与主目标框叠成“双框”；
      // 其他技能通常不下发 class_name=zone，不受影响。
      if (!detection) return
      if (detection.auxiliary === true || detection.class_name === 'zone') return

      const { bbox, label, confidence, color, points } = detection
      const rgbColor = color ? `rgb(${color[2]}, ${color[1]}, ${color[0]})` : 'rgb(0, 255, 0)'
      const drawScale = (scaleX + scaleY) / 2
      const isInFence = detection.in_fence !== false
      const stateText = String((detection && detection.state) || '')
      const held = detection.observed === false || stateText.indexOf('保持') >= 0 || stateText.indexOf('遮挡') >= 0 || stateText.indexOf('待确认') >= 0
      const prevAlpha = this.ctx.globalAlpha
      const poly = Array.isArray(points) && points.length >= 3
        ? points.map(p => ({
          x: Math.floor((Array.isArray(p) ? p[0] : p.x) * scaleX) + 0.5,
          y: Math.floor((Array.isArray(p) ? p[1] : p.y) * scaleY) + 0.5
        }))
        : null

      if (!poly && (!bbox || bbox.length < 4)) return

      if (held) {
        this.ctx.globalAlpha = prevAlpha * 0.75
        this.ctx.setLineDash([Math.max(4, 7 * drawScale), Math.max(3, 5 * drawScale)])
      } else if (!isInFence) {
        this.ctx.globalAlpha = prevAlpha * 0.55
        this.ctx.setLineDash([Math.max(4, 7 * drawScale), Math.max(3, 5 * drawScale)])
      } else {
        this.ctx.setLineDash([])
      }

      this.ctx.strokeStyle = rgbColor
      this.ctx.lineWidth = Math.max(1, 2 * drawScale)

      let x1
      let y1
      if (poly) {
        this.ctx.beginPath()
        poly.forEach((pt, i) => {
          if (i === 0) this.ctx.moveTo(pt.x, pt.y)
          else this.ctx.lineTo(pt.x, pt.y)
        })
        this.ctx.closePath()
        this.ctx.stroke()
        x1 = Math.min.apply(null, poly.map(p => p.x))
        y1 = Math.min.apply(null, poly.map(p => p.y))
      } else {
        x1 = bbox[0] * scaleX
        y1 = bbox[1] * scaleY
        let x2 = bbox[2] * scaleX
        let y2 = bbox[3] * scaleY

        x1 = Math.max(0, Math.min(x1, this.canvasWidth))
        y1 = Math.max(0, Math.min(y1, this.canvasHeight))
        x2 = Math.max(0, Math.min(x2, this.canvasWidth))
        y2 = Math.max(0, Math.min(y2, this.canvasHeight))

        x1 = Math.floor(x1) + 0.5
        y1 = Math.floor(y1) + 0.5
        x2 = Math.floor(x2) + 0.5
        y2 = Math.floor(y2) + 0.5

        const width = x2 - x1
        const height = y2 - y1
        if (width <= 0 || height <= 0) {
          this.ctx.setLineDash([])
          this.ctx.globalAlpha = prevAlpha
          return
        }
        this.ctx.strokeRect(x1, y1, width, height)
      }
      this.ctx.setLineDash([])

      const trackId = detection && (detection.track_id || detection.trackId) ? String(detection.track_id || detection.trackId) : ''
      const raw = String((detection && (detection.label || detection.class_name)) || 'Object')
      const conf = detection && detection.confidence != null ? Number(detection.confidence) : 0
      const suffix = (isInFence ? '' : ' 栏外') + (stateText.indexOf('保持') >= 0 || stateText.indexOf('待确认') >= 0 ? '' : (held ? ' 遮挡保持' : ''))
      let name = raw
      if (detection.class_name === 'person' && detection.progress != null) {
        name += ' 面积交叠' + Math.round(Number(detection.progress) * 100) + '%'
      }
      if (trackId) {
        name = name.replace(new RegExp('\\b' + trackId + '\\b', 'ig'), '').replace(/\s+/g, ' ').trim() || raw
      }
      const showId = trackId && !this.hideTrackId
      const labelText = showId ? (trackId + ' ' + name + suffix + ': ' + conf.toFixed(2)) : (name + suffix + ': ' + conf.toFixed(2))
      const fontPx = Math.max(9, Math.round(22 * 0.5 * drawScale))
      this.ctx.font = `${fontPx}px "Microsoft YaHei", "PingFang SC", Arial`
      const textMetrics = this.ctx.measureText(labelText)
      const textWidth = textMetrics.width
      const padX = Math.max(2, Math.round(2 * drawScale))
      const textHeight = fontPx + padX

      this.ctx.fillStyle = rgbColor
      this.ctx.fillRect(x1, y1 - textHeight, textWidth + padX * 2, textHeight)
      this.ctx.textBaseline = 'alphabetic'
      this.ctx.fillStyle = '#FFFFFF'
      this.ctx.fillText(labelText, x1 + padX, y1 - padX)
      this.ctx.globalAlpha = prevAlpha
    },

    drawTrackHistory(detection, scaleX, scaleY) {
      const history = detection && detection.track_history
      if (!Array.isArray(history) || history.length < 2) return
      const color = detection.color
        ? `rgb(${detection.color[2]}, ${detection.color[1]}, ${detection.color[0]})`
        : 'rgb(0, 220, 255)'
      const pts = history.map(p => {
        const x = Array.isArray(p) ? p[0] : p && p.x
        const y = Array.isArray(p) ? p[1] : p && p.y
        if (typeof x !== 'number' || typeof y !== 'number') return null
        return { x: x * scaleX, y: y * scaleY }
      }).filter(Boolean)
      if (pts.length < 2) return
      const prevAlpha = this.ctx.globalAlpha
      this.ctx.beginPath()
      this.ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) {
        this.ctx.lineTo(pts[i].x, pts[i].y)
      }
      this.ctx.strokeStyle = color
      this.ctx.lineWidth = Math.max(2, 2 * ((scaleX + scaleY) / 2))
      this.ctx.lineJoin = 'round'
      this.ctx.lineCap = 'round'
      this.ctx.setLineDash([])
      this.ctx.stroke()
      this.ctx.globalAlpha = prevAlpha
    },

    drawRegion(region, scaleX, scaleY) {
      const points = Array.isArray(region.points) ? region.points : []
      if (points.length < 3) return

      const rgbColor = region.color
        ? `rgb(${region.color[2]}, ${region.color[1]}, ${region.color[0]})`
        : 'rgb(255, 190, 0)'
      const scaled = points.map(point => [
        Math.max(0, Math.min(this.canvasWidth, Number(point[0]) * scaleX)),
        Math.max(0, Math.min(this.canvasHeight, Number(point[1]) * scaleY))
      ])

      const prevAlpha = this.ctx.globalAlpha
      this.ctx.strokeStyle = rgbColor
      this.ctx.lineWidth = Math.max(2, 2.5 * ((scaleX + scaleY) / 2))
      this.ctx.setLineDash([10, 6])
      this.ctx.beginPath()
      this.ctx.moveTo(scaled[0][0], scaled[0][1])
      for (let i = 1; i < scaled.length; i++) {
        this.ctx.lineTo(scaled[i][0], scaled[i][1])
      }
      this.ctx.closePath()
      this.ctx.stroke()
      this.ctx.setLineDash([])

      const first = scaled[0]
      const label = String(region.label || '区域')
      const fontPx = Math.max(12, Math.round(16 * ((scaleX + scaleY) / 2)))
      this.ctx.font = `${fontPx}px "Microsoft YaHei", Arial`
      const pad = 4
      const textWidth = this.ctx.measureText(label).width
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.68)'
      this.ctx.fillRect(first[0], Math.max(0, first[1] - fontPx - pad * 2), textWidth + pad * 2, fontPx + pad * 2)
      this.ctx.fillStyle = '#FFFFFF'
      this.ctx.textBaseline = 'alphabetic'
      this.ctx.fillText(label, first[0] + pad, Math.max(fontPx, first[1] - pad))
      this.ctx.globalAlpha = prevAlpha
    },

    clear() {
      this.batches = []
      this.currentStatusTags = []
      this.lastSignature = ''
      this.lastFrameTimestamp = 0
      this.stopRaf()
      this.clearCanvas()
    }
  }
}
</script>

<style scoped>
.detection-overlay-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
  background: transparent;
  overflow: hidden;
}

.detection-canvas {
  position: absolute;
  left: 0;
  top: 0;
  background: transparent;
  transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;
}

.status-tags {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 12;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 1.2;
  color: #fff;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.status-tag.active {
  background: rgba(6, 95, 70, 0.78);
  border-color: rgba(52, 211, 153, 0.65);
}

.status-tag-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #94a3b8;
}

.status-tag.active .status-tag-dot {
  background: #34d399;
  box-shadow: 0 0 8px #34d399;
}

.status-tag.alert-active {
  background: rgba(127, 29, 29, 0.86);
  border-color: rgba(248, 113, 113, 0.85);
}

.status-tag.alert-active .status-tag-dot {
  background: #f87171;
  box-shadow: 0 0 8px #f87171;
}

.status-tag-label {
  opacity: 0.9;
}

.status-tag-text {
  font-weight: 600;
}

.shaft-dashboard {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 14;
  width: 410px;
  max-width: calc(100% - 24px);
  padding: 13px 16px;
  color: #fff;
  background: rgba(4, 8, 15, 0.86);
  border: 1px solid rgba(255, 214, 76, 0.8);
  border-radius: 6px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45);
  font: 14px/1.55 "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
  white-space: normal;
  pointer-events: none;
}

.shaft-dashboard-title {
  margin-bottom: 6px;
  color: #ffd84d;
  font-size: 17px;
  font-weight: 700;
}

.shaft-dashboard-line {
  color: #fff;
  white-space: normal;
  word-break: break-all;
}

.shaft-dashboard-line:nth-child(3n) {
  color: #ffe66d;
}

.status-tags-side {
  left: auto;
  right: 12px;
  align-items: flex-end;
}

.detection-overlay-container.shaft-mode .status-tags-side {
  left: auto;
  right: 12px;
}
</style>
