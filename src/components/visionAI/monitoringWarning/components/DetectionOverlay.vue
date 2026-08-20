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
    // 采集帧时间戳（仅用于去重）
    frameTimestamp: {
      type: Number,
      default: 0
    },
    // 收到结果后全亮停留时长(ms)；期间若有新结果会重置
    holdDuration: {
      type: Number,
      default: 200
    },
    // 停留结束后淡出时长(ms)
    fadeDuration: {
      type: Number,
      default: 120
    }
  },
  data() {
    return {
      canvasWidth: 640,
      canvasHeight: 480,
      ctx: null,
      rafId: null,
      currentDetections: [],
      currentStatusTags: [],
      // 本批开始显示的时间（performance.now）
      shownAt: 0,
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
      const w = Math.round(vRect.width)
      const h = Math.round(vRect.height)
      if (w <= 0 || h <= 0) return false

      canvas.style.position = 'absolute'
      canvas.style.left = Math.round(vRect.left - cRect.left) + 'px'
      canvas.style.top = Math.round(vRect.top - cRect.top) + 'px'
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
     * 收到新数据：去重后立即显示，并重置停留计时。
     */
    onNewData() {
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
      if (!isNew) return

      this.currentStatusTags = this.statusTags ? this.statusTags.slice() : []
      this.currentDetections = this.detections ? this.detections.slice() : []
      if (!this.currentDetections.length) {
        this.shownAt = 0
        this.clearCanvas()
        this.stopRaf()
        return
      }

      const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
      this.shownAt = now
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
     * 渲染：全亮 holdDuration → 淡出 fadeDuration → 自动清空。
     * 期间若有新结果，onNewData 会重置 shownAt。
     */
    renderLoop() {
      this.rafId = requestAnimationFrame(this.renderLoop)

      if (!this.ctx) {
        return
      }

      if (!this.syncToVideoElement()) {
        return
      }

      if (!this.currentDetections.length || !this.shownAt) {
        this.clearCanvas()
        this.stopRaf()
        return
      }

      const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
      const elapsed = now - this.shownAt
      const total = this.holdDuration + this.fadeDuration

      let alpha = 1
      if (elapsed > this.holdDuration) {
        if (elapsed >= total) {
          this.currentDetections = []
          this.shownAt = 0
          this.clearCanvas()
          this.stopRaf()
          return
        }
        alpha = 1 - (elapsed - this.holdDuration) / this.fadeDuration
      }

      this.renderBatch(this.currentDetections, alpha)
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
      this.currentDetections = []
      this.currentStatusTags = []
      this.shownAt = 0
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
