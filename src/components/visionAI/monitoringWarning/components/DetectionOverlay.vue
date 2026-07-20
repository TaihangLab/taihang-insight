<template>
  <div class="detection-overlay-container">
    <!-- Canvas层用于绘制检测框（尺寸/位置由 syncToVideoElement 贴合真实 video 元素，命令式管理） -->
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
      // 待显示/正在淡出的检测批次队列：{ detections, startAt }
      batches: [],
      // 去重用：上一次已处理的帧时间戳 / 内容签名(后端无时间戳时回退)
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
    /**
     * 初始化Canvas（仅获取一次 2D 上下文；尺寸由 syncToVideoElement 命令式设置）
     */
    initCanvas() {
      const canvas = this.$refs.overlayCanvas
      if (!canvas) return
      
      this.ctx = canvas.getContext('2d', {
        alpha: true,
        desynchronized: true // 降低延迟
      })
      
      this.ctx.imageSmoothingEnabled = true
      this.ctx.imageSmoothingQuality = 'high'
    },
    
    /**
     * 将叠加 canvas 精确贴合到播放器真实的视频元素上。
     *
     * 不再依赖 CSS 居中 + 估算尺寸（视频盒子 margin:0 auto 只水平居中、垂直靠上，
     * flex 叠加层却上下都居中，二者在不同单元格宽高比下会错位）。
     * 直接用 getBoundingClientRect 读取视频元素的真实位置与尺寸，
     * 让 canvas 绝对定位覆盖到完全相同的矩形。
     * 播放器 isResize:false 视频拉伸铺满该元素，故视频内容矩形 == 视频元素矩形。
     */
    syncToVideoElement() {
      const canvas = this.$refs.overlayCanvas
      if (!canvas) return false
      const host = this.$el && this.$el.parentNode // .video-player-wrapper
      if (!host) return false
      
      // 找到播放器的视频元素（Jessibuca MSE 渲染为 <video>），排除本组件自己的 canvas
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
      
      // 相对叠加层容器的偏移
      canvas.style.position = 'absolute'
      canvas.style.left = Math.round(vRect.left - cRect.left) + 'px'
      canvas.style.top = Math.round(vRect.top - cRect.top) + 'px'
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      
      // 内部像素尺寸变化时重置（改 canvas.width 会清空并复位上下文）
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
     * 入队一个新批次。
     *
     * 对齐思路：画面此刻显示的是约 alignOffset 毫秒前采集的帧（视频链路延迟），
     * 而本批检测结果对应 age = (now - frameTimestamp) 毫秒前采集的帧。
     * 若 age < alignOffset（检测比画面先到），延后 alignOffset - age 再显示；
     * 若 age >= alignOffset（检测本身已落后于画面，常见情况），立即显示，不再追加延迟。
     * 依赖后端推送推理帧的真实采集时间戳，且前后端时钟大致同步。
     */
    pushBatch(detections) {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
      let delay = 0
      if (this.alignOffset > 0 && this.frameTimestamp > 0) {
        const age = Date.now() - this.frameTimestamp
        // age 为负或过大说明时钟不同步/时间戳异常，放弃对齐直接显示
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
      
      // 每帧贴合视频元素的位置/尺寸（视频加载、布局变化、全屏切换时都能跟上）
      if (!this.syncToVideoElement()) {
        // 视频元素尚未就绪：本帧不绘制
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
      
      // 后端在原始分辨率帧上用固定像素(线宽2/字体scale 0.5)画框再整帧缩放显示，
      // 前端直接画在显示尺寸的canvas上，需按相同缩放比换算，才能与后端观感一致（否则又粗又大）。
      const drawScale = (scaleX + scaleY) / 2
      
      // 绘制检测框：对应后端 cv2.rectangle thickness=2
      this.ctx.strokeStyle = rgbColor
      this.ctx.lineWidth = Math.max(1, 2 * drawScale)
      this.ctx.strokeRect(x1, y1, width, height)
      
      // 标签文本与后端保持一致：`类别: 0.xx`
      const labelText = `${label || 'Object'}: ${(confidence != null ? confidence : 0).toFixed(2)}`
      // 后端字体 FONT_HERSHEY_SIMPLEX、scale 0.5，字高约11px；换算到显示尺寸再画
      const fontPx = Math.max(9, Math.round(22 * 0.5 * drawScale))
      this.ctx.font = `${fontPx}px Arial`
      const textMetrics = this.ctx.measureText(labelText)
      const textWidth = textMetrics.width
      const padX = Math.max(2, Math.round(2 * drawScale))
      const textHeight = fontPx + padX
      
      // 标签背景
      this.ctx.fillStyle = rgbColor
      this.ctx.fillRect(x1, y1 - textHeight, textWidth + padX * 2, textHeight)
      
      // 标签文字
      this.ctx.textBaseline = 'alphabetic'
      this.ctx.fillStyle = '#FFFFFF'
      this.ctx.fillText(labelText, x1 + padX, y1 - padX)
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
  overflow: hidden;
}

.detection-canvas {
  /* 位置与尺寸由 syncToVideoElement 命令式设置（绝对定位贴合真实 video 元素） */
  position: absolute;
  left: 0;
  top: 0;
  background: transparent; /* Canvas本身也要透明 */
  transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;
}
</style>

