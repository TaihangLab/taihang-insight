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
    // 原始视频分辨率
    videoWidth: {
      type: Number,
      default: 1920
    },
    videoHeight: {
      type: Number,
      default: 1080
    }
  },
  data() {
    return {
      canvasWidth: 640,
      canvasHeight: 480,
      ctx: null,
      animationFrameId: null,
      lastDrawTime: 0,
      drawThrottle: 16 // 限制绘制频率为60fps
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
    detections: {
      handler() {
        this.drawDetections()
      },
      deep: true
    }
  },
  mounted() {
    this.updateCanvasSize()
  },
  beforeDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
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
     * 绘制检测框（使用requestAnimationFrame优化）
     */
    drawDetections() {
      // 节流：避免过于频繁的绘制
      const now = Date.now()
      if (now - this.lastDrawTime < this.drawThrottle) {
        return
      }
      this.lastDrawTime = now
      
      if (!this.ctx) {
        return
      }
      
      // 清空画布
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
      
      if (!this.detections || this.detections.length === 0) {
        return
      }
      
      // 计算缩放比例（从原始视频分辨率到Canvas显示尺寸）
      const scaleX = this.canvasWidth / this.videoWidth
      const scaleY = this.canvasHeight / this.videoHeight
      
      // 绘制每个检测框
      this.detections.forEach(detection => {
        this.drawSingleDetection(detection, scaleX, scaleY)
      })
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
     * 清空画布
     */
    clear() {
      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
      }
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

