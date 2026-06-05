<template>
  <div class="detection-overlay-container">
    <!-- Canvas层用于绘制检测框 -->
    <canvas 
      ref="overlayCanvas"
      class="detection-canvas"
      :width="canvasWidth"
      :height="canvasHeight">
    </canvas>
  </div>
</template>

<script>
export default {
  name: 'DetectionOverlay',
  props: {
    // 视频容器的宽度和高度
    containerWidth: {
      type: Number,
      default: 640
    },
    containerHeight: {
      type: Number,
      default: 480
    },
    // 检测结果数据
    detections: {
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
    // 检测框全亮保持时长(ms)
    holdDuration: {
      type: Number,
      default: 700
    },
    // 检测框淡出时长(ms)
    fadeDuration: {
      type: Number,
      default: 500
    },
    // 时间戳对齐偏移(ms)：将检测框延后显示以匹配视频播放延迟。
    // 0 表示不延后；可按实际视频延迟(如 FLV 缓冲)调大。
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
      // 待显示/正在淡出的检测批次队列：{ detections, startAt }
      batches: [],
      // 去重用：上一次已处理的帧时间戳 / 内容签名(后端无时间戳时回退)
      lastFrameTimestamp: 0,
      lastSignature: ''
    }
  },
  watch: {
    containerWidth() {
      this.updateCanvasSize()
    },
    containerHeight() {
      this.updateCanvasSize()
    },
    videoWidth() {
      this.updateCanvasSize()
    },
    videoHeight() {
      this.updateCanvasSize()
    },
    frameTimestamp() {
      this.onNewData()
    },
    detections: {
      handler() {
        this.onNewData()
      },
      deep: true
    }
  },
  mounted() {
    this.updateCanvasSize()
    this.onNewData()
  },
  beforeDestroy() {
    this.stopRaf()
  },
  methods: {
    /**
     * 更新Canvas尺寸以匹配视频实际显示尺寸（考虑aspect ratio）
     */
    updateCanvasSize() {
      // 计算视频的宽高比
      const videoAspect = this.videoWidth / this.videoHeight
      const containerAspect = this.containerWidth / this.containerHeight
      
      let displayWidth, displayHeight
      
      if (containerAspect > videoAspect) {
        // 容器更宽，视频高度占满，宽度按比例缩放
        displayHeight = this.containerHeight
        displayWidth = displayHeight * videoAspect
      } else {
        // 容器更高，视频宽度占满，高度按比例缩放
        displayWidth = this.containerWidth
        displayHeight = displayWidth / videoAspect
      }
      
      this.canvasWidth = Math.round(displayWidth)
      this.canvasHeight = Math.round(displayHeight)
      
      this.$nextTick(() => {
        this.initCanvas()
      })
    },
    
    /**
     * 初始化Canvas
     */
    initCanvas() {
      const canvas = this.$refs.overlayCanvas
      if (!canvas) return
      
      this.ctx = canvas.getContext('2d', {
        alpha: true,
        desynchronized: true // 降低延迟
      })
      
      // 启用图像平滑以获得更好的渲染质量
      this.ctx.imageSmoothingEnabled = true
      this.ctx.imageSmoothingQuality = 'high'
      
      // 设置画布背景为透明
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
    },
    
    /**
     * 收到新数据：去重后决定是否作为“新的一帧检测”入队。
     * 后端按~30fps重复推送同一结果，必须去重，否则批次被反复重置、永不淡出。
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
        // 后端未提供时间戳时的回退：用检测内容签名去重
        const sig = this.computeSignature(this.detections)
        if (sig !== this.lastSignature) {
          isNew = true
          this.lastSignature = sig
        }
      }
      if (isNew) {
        this.pushBatch(this.detections)
      }
    },
    
    /**
     * 计算检测内容签名（仅用于无时间戳的回退去重）
     */
    computeSignature(dets) {
      if (!dets || !dets.length) return 'empty'
      return dets
        .map(d => (d.bbox || []).map(v => Math.round(v)).join(',') + ':' + (d.label || d.class_name || ''))
        .join('|')
    },
    
    /**
     * 入队一个新批次。startAt 加上 alignOffset 以延后显示、对齐视频延迟。
     */
    pushBatch(detections) {
      const startAt = (typeof performance !== 'undefined' ? performance.now() : Date.now()) + this.alignOffset
      this.batches.push({
        detections: detections ? detections.slice() : [],
        startAt
      })
      this.ensureRaf()
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
     * 渲染主循环：短保持 + 淡出，由 requestAnimationFrame 驱动（随显示刷新率）。
     */
    renderLoop() {
      this.rafId = requestAnimationFrame(this.renderLoop)
      
      if (!this.ctx) {
        return
      }
      
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
      
      // 若已有更新的批次到达其显示时刻，丢弃被取代的旧批次（保证不出现空窗）
      while (this.batches.length > 1 && this.batches[1].startAt <= now) {
        this.batches.shift()
      }
      
      // 选出当前应显示的批次（已到 startAt）
      let current = null
      if (this.batches.length && this.batches[0].startAt <= now) {
        current = this.batches[0]
      }
      
      if (!current) {
        // 没有到显示时刻的批次：清空；若队列也空则停止循环省CPU
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
        // 当前批次淡出完毕：移除；若无后续批次则停止循环
        this.clearCanvas()
        this.batches.shift()
        if (!this.batches.length) {
          this.stopRaf()
        }
        return
      }
      
      this.renderBatch(current.detections, alpha)
    },
    
    /**
     * 以指定透明度绘制一个批次的所有检测框
     */
    renderBatch(detections, alpha) {
      this.clearCanvas()
      if (!detections || detections.length === 0) {
        return
      }
      
      // 缩放比例：从检测帧分辨率(videoWidth/Height)到Canvas显示尺寸
      const scaleX = this.canvasWidth / this.videoWidth
      const scaleY = this.canvasHeight / this.videoHeight
      
      const prevAlpha = this.ctx.globalAlpha
      this.ctx.globalAlpha = alpha
      detections.forEach(detection => {
        this.drawSingleDetection(detection, scaleX, scaleY)
      })
      this.ctx.globalAlpha = prevAlpha
    },
    
    /**
     * 绘制单个检测框
     */
    drawSingleDetection(detection, scaleX, scaleY) {
      const { bbox, label, confidence, color } = detection
      
      if (!bbox || bbox.length < 4) return
      
      // 转换坐标：从原始视频坐标到Canvas坐标
      // 使用Math.floor和Math.ceil来避免亚像素模糊
      let x1 = bbox[0] * scaleX
      let y1 = bbox[1] * scaleY
      let x2 = bbox[2] * scaleX
      let y2 = bbox[3] * scaleY
      
      // 边界检查和修正
      x1 = Math.max(0, Math.min(x1, this.canvasWidth))
      y1 = Math.max(0, Math.min(y1, this.canvasHeight))
      x2 = Math.max(0, Math.min(x2, this.canvasWidth))
      y2 = Math.max(0, Math.min(y2, this.canvasHeight))
      
      // 对齐到整数像素以避免模糊（关键trick！）
      x1 = Math.floor(x1) + 0.5
      y1 = Math.floor(y1) + 0.5
      x2 = Math.floor(x2) + 0.5
      y2 = Math.floor(y2) + 0.5
      
      const width = x2 - x1
      const height = y2 - y1
      
      // 检查框是否有效
      if (width <= 0 || height <= 0) return
      
      // 将BGR颜色转换为RGB (OpenCV使用BGR，Canvas使用RGB)
      const rgbColor = color ? `rgb(${color[2]}, ${color[1]}, ${color[0]})` : 'rgb(0, 255, 0)'
      
      // 绘制检测框
      this.ctx.strokeStyle = rgbColor
      this.ctx.lineWidth = 2
      this.ctx.strokeRect(x1, y1, width, height)
      
      // 绘制标签背景
      const labelText = `${label || 'Object'} ${(confidence * 100).toFixed(1)}%`
      this.ctx.font = 'bold 14px Arial'
      const textMetrics = this.ctx.measureText(labelText)
      const textWidth = textMetrics.width
      const textHeight = 20
      
      // 标签背景
      this.ctx.fillStyle = rgbColor
      this.ctx.fillRect(x1, y1 - textHeight - 5, textWidth + 10, textHeight + 5)
      
      // 标签文字
      this.ctx.fillStyle = '#FFFFFF'
      this.ctx.fillText(labelText, x1 + 5, y1 - 8)
      
      // 绘制角点装饰（科技感）
      this.drawCornerDecorations(x1, y1, x2, y2, rgbColor)
    },
    
    /**
     * 绘制角点装饰
     */
    drawCornerDecorations(x1, y1, x2, y2, color) {
      const cornerLength = 15
      this.ctx.strokeStyle = color
      this.ctx.lineWidth = 4
      
      // 左上角
      this.ctx.beginPath()
      this.ctx.moveTo(x1, y1 + cornerLength)
      this.ctx.lineTo(x1, y1)
      this.ctx.lineTo(x1 + cornerLength, y1)
      this.ctx.stroke()
      
      // 右上角
      this.ctx.beginPath()
      this.ctx.moveTo(x2 - cornerLength, y1)
      this.ctx.lineTo(x2, y1)
      this.ctx.lineTo(x2, y1 + cornerLength)
      this.ctx.stroke()
      
      // 左下角
      this.ctx.beginPath()
      this.ctx.moveTo(x1, y2 - cornerLength)
      this.ctx.lineTo(x1, y2)
      this.ctx.lineTo(x1 + cornerLength, y2)
      this.ctx.stroke()
      
      // 右下角
      this.ctx.beginPath()
      this.ctx.moveTo(x2 - cornerLength, y2)
      this.ctx.lineTo(x2, y2)
      this.ctx.lineTo(x2, y2 - cornerLength)
      this.ctx.stroke()
    },
    
    /**
     * 清空画布并重置批次队列
     */
    clear() {
      this.batches = []
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
  pointer-events: none; /* 不阻止下层视频的交互 */
  z-index: 10;
  background: transparent; /* 明确设置透明背景 */
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.detection-canvas {
  /* 不使用width/height 100%，而是让Canvas自己的尺寸决定 */
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  background: transparent; /* Canvas本身也要透明 */
  /* 关键trick：禁用图像平滑以获得精确的像素对齐 */
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  /* 确保Canvas不会被缩放导致模糊 */
  transform: translateZ(0);
  will-change: transform;
  /* 亚像素渲染优化 */
  -webkit-font-smoothing: subpixel-antialiased;
  backface-visibility: hidden;
}
</style>

