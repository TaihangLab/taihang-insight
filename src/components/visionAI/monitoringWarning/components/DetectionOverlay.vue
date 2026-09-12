<template>
  <div class="detection-overlay-container">
    <div v-if="currentStatusTags.length" class="status-tags">
      <div
        v-for="tag in currentStatusTags"
        :key="tag.id || tag.label"
        class="status-tag"
        :class="{ active: tag.active }"
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
    // 光流「运动状态」节点下发的运行/停止徽标；没配光流则为空
    statusTags: {
      type: Array,
      default: () => []
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
    holdDuration: {
      type: Number,
      default: 300
    },
    // 检测框淡出时长(ms)
    fadeDuration: {
      type: Number,
      default: 200
    },
    // 时间戳对齐偏移(ms)：视频画面相对"最快到达的检测结果"的延迟估计。
    // 检测框会按 (alignOffset - 本批次相对最快路径的额外延迟) 延后显示，
    // 使框与它对应的画面帧尽量同时出现。框比人超前则调大，落后则调小。
    alignOffset: {
      type: Number,
      default: 300
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
      lastSignature: ''
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
      if (!videoEl) return false

      const vRect = videoEl.getBoundingClientRect()
      const cRect = this.$el.getBoundingClientRect()
      const box = this.visibleMediaBox(videoEl, vRect)
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

    /**
     * 收到新数据：去重后决定是否作为“新的一帧检测”入队。
     * 后端按~30fps重复推送同一结果，必须去重，否则批次被反复重置、永不淡出。
     */
    onNewData() {
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
      if (isNew && this.detections && this.detections.length) {
        this.pushBatch(this.detections)
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
      this.batches.push({
        detections: detections ? detections.slice() : [],
        startAt: now + delay
      })
      this.ensureRaf()
    },

    computeSignature(dets, tags) {
      const dPart = (!dets || !dets.length)
        ? 'empty'
        : dets
          .map(d => (d.bbox || []).map(v => Math.round(v)).join(',') + ':' + (d.label || d.class_name || ''))
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
        this.clearCanvas()
        this.batches.shift()
        if (!this.batches.length) {
          this.stopRaf()
        }
        return
      }

      this.renderBatch(current.detections, alpha)
    },

    renderBatch(detections, alpha) {
      this.clearCanvas()
      if (!detections || detections.length === 0) {
        return
      }

      const scaleX = this.canvasWidth / this.videoWidth
      const scaleY = this.canvasHeight / this.videoHeight

      const prevAlpha = this.ctx.globalAlpha
      this.ctx.globalAlpha = alpha
      detections.forEach(detection => {
        this.drawSingleDetection(detection, scaleX, scaleY)
      })
      this.ctx.globalAlpha = prevAlpha
    },

    drawSingleDetection(detection, scaleX, scaleY) {
      const { bbox, label, confidence, color } = detection

      if (!bbox || bbox.length < 4) return

      let x1 = bbox[0] * scaleX
      let y1 = bbox[1] * scaleY
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

      if (width <= 0 || height <= 0) return

      const rgbColor = color ? `rgb(${color[2]}, ${color[1]}, ${color[0]})` : 'rgb(0, 255, 0)'
      const drawScale = (scaleX + scaleY) / 2
      const inFence = detection.in_fence !== false
      const prevAlpha = this.ctx.globalAlpha

      if (!inFence) {
        this.ctx.globalAlpha = prevAlpha * 0.55
        this.ctx.setLineDash([Math.max(4, 7 * drawScale), Math.max(3, 5 * drawScale)])
      } else {
        this.ctx.setLineDash([])
      }

      this.ctx.strokeStyle = rgbColor
      this.ctx.lineWidth = Math.max(1, 2 * drawScale)
      this.ctx.strokeRect(x1, y1, width, height)
      this.ctx.setLineDash([])

      const suffix = inFence ? '' : ' 栏外'
      const labelText = `${label || 'Object'}${suffix}: ${(confidence != null ? confidence : 0).toFixed(2)}`
      const fontPx = Math.max(9, Math.round(22 * 0.5 * drawScale))
      this.ctx.font = `${fontPx}px Arial`
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

    clear() {
      this.batches = []
      this.currentStatusTags = []
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

.status-tag-label {
  opacity: 0.9;
}

.status-tag-text {
  font-weight: 600;
}
</style>
