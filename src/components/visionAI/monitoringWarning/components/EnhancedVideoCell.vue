<template>
  <div class="enhanced-video-cell">
    <!-- 超薄标题栏 -->
    <div class="video-slim-header">
      <span class="camera-name">{{ cameraName }}</span>
      <div class="video-status" :class="statusClass">
        <span class="status-dot"></span>
        <span class="status-text">{{ statusText }}</span>
      </div>
    </div>

    <!-- 视频内容区域 -->
    <div class="video-content" ref="videoContent">
      <!-- AI任务选择下拉框 -->
      <div v-if="videoUrl && availableTasks.length > 0" 
           class="ai-task-selector">
        <el-select 
          v-model="selectedTaskId" 
          size="mini" 
          placeholder="选择AI任务"
          @change="onTaskChange"
          clearable>
          <el-option
            v-for="task in availableTasks"
            :key="task.task_id"
            :label="`${task.task_name}`"
            :value="task.task_id">
            <span style="float: left">{{ task.task_name }}</span>
            <span style="float: right; color: #8492a6; font-size: 12px">{{ task.skill_name }}</span>
          </el-option>
        </el-select>
      </div>
      
      <!-- 视频播放器容器 -->
      <div class="video-placeholder" 
           :data-timestamp="timestamp" 
           :data-camera="cameraName">
        <!-- 无信号状态 -->
        <div v-if="!videoUrl" class="no-signal">
          <i class="el-icon-video-camera-solid"></i>
          <div>{{ tip || "无信号" }}</div>
        </div>
        
        <!-- 视频播放器 + OSD叠加 -->
        <div v-else class="video-player-wrapper">
          <!-- 视频播放器 -->
          <slot name="player"></slot>
          
          <!-- 检测框OSD叠加层 -->
          <detection-overlay
            v-if="selectedTaskId && detections.length > 0"
            :container-width="containerWidth"
            :container-height="containerHeight"
            :video-width="videoWidth"
            :video-height="videoHeight"
            :detections="detections">
          </detection-overlay>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import DetectionOverlay from './DetectionOverlay.vue'

export default {
  name: 'EnhancedVideoCell',
  components: {
    DetectionOverlay
  },
  props: {
    // 摄像头名称
    cameraName: {
      type: String,
      default: '摄像头'
    },
    // 摄像头ID
    cameraId: {
      type: [Number, String],
      default: null
    },
    // 视频URL
    videoUrl: {
      type: String,
      default: ''
    },
    // 视频状态
    statusClass: {
      type: String,
      default: 'offline'
    },
    // 状态文本
    statusText: {
      type: String,
      default: '离线'
    },
    // 提示信息
    tip: {
      type: String,
      default: ''
    },
    // 时间戳
    timestamp: {
      type: String,
      default: ''
    },
    // 可用的AI任务列表
    availableTasks: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      selectedTaskId: null,
      wsConnection: null,
      detections: [],
      videoWidth: 1920,
      videoHeight: 1080,
      containerWidth: 640,
      containerHeight: 480,
      resizeObserver: null
    }
  },
  watch: {
    cameraId(newId, oldId) {
      if (newId !== oldId) {
        // 摄像头切换，清理资源
        this.cleanup()
      }
    },
    videoUrl(newUrl, oldUrl) {
      if (!newUrl && oldUrl) {
        // 视频停止，清理资源
        this.cleanup()
      }
    }
  },
  mounted() {
    // 初始化容器尺寸
    this.updateContainerSize()
    
    // 监听容器尺寸变化
    this.setupResizeObserver()
  },
  beforeDestroy() {
    this.cleanup()
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
  },
  methods: {
    /**
     * 任务选择变化
     */
    onTaskChange(taskId) {
      // 断开旧连接
      this.disconnectWebSocket()
      
      // 清空检测结果
      this.detections = []
      
      // 如果选择了任务，建立新连接
      if (taskId) {
        this.connectWebSocket(taskId)
      }
      
      // 触发事件
      this.$emit('task-change', taskId)
    },
    
    /**
     * 连接WebSocket
     */
    connectWebSocket(taskId) {
      try {
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
        const wsUrl = `${protocol}//${location.host}/api/realtime-detection/ws/detection/${taskId}`
        
        console.log(`🔌 连接检测WebSocket: ${wsUrl}`)
        
        this.wsConnection = new WebSocket(wsUrl)
        
        this.wsConnection.onopen = () => {
          console.log(`✅ WebSocket连接成功: task_id=${taskId}`)
        }
        
        this.wsConnection.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            // 更新检测结果
            this.detections = data.detections || []
            
            // 更新视频分辨率
            if (data.frame_size) {
              this.videoWidth = data.frame_size.width
              this.videoHeight = data.frame_size.height
            }
          } catch (error) {
            console.error('❌ 解析检测结果失败:', error)
          }
        }
        
        this.wsConnection.onerror = (error) => {
          console.error(`❌ WebSocket错误: task_id=${taskId}`, error)
        }
        
        this.wsConnection.onclose = () => {
          console.log(`🔌 WebSocket已断开: task_id=${taskId}`)
        }
        
      } catch (error) {
        console.error('❌ 创建WebSocket连接失败:', error)
      }
    },
    
    /**
     * 断开WebSocket
     */
    disconnectWebSocket() {
      if (this.wsConnection) {
        this.wsConnection.close()
        this.wsConnection = null
      }
    },
    
    /**
     * 更新容器尺寸
     */
    updateContainerSize() {
      if (this.$refs.videoContent) {
        this.containerWidth = this.$refs.videoContent.clientWidth || 640
        this.containerHeight = this.$refs.videoContent.clientHeight || 480
      }
    },
    
    /**
     * 设置尺寸监听
     */
    setupResizeObserver() {
      if (!window.ResizeObserver) return
      
      this.resizeObserver = new ResizeObserver(() => {
        this.updateContainerSize()
      })
      
      if (this.$refs.videoContent) {
        this.resizeObserver.observe(this.$refs.videoContent)
      }
    },
    
    /**
     * 清理资源
     */
    cleanup() {
      this.disconnectWebSocket()
      this.detections = []
      this.selectedTaskId = null
    }
  }
}
</script>

<style scoped>
.enhanced-video-cell {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.video-slim-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1));
  border-bottom: 1px solid rgba(59, 130, 246, 0.3);
  height: 36px;
  flex-shrink: 0;
}

.camera-name {
  font-size: 13px;
  color: #e0e0e0;
  font-weight: 500;
}

.video-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.video-status.online .status-dot {
  background-color: #10b981;
  box-shadow: 0 0 4px rgba(16, 185, 129, 0.8);
}

.video-status.offline .status-dot {
  background-color: #6b7280;
}

.status-text {
  color: #e0e0e0;
}

.video-content {
  position: relative;
  flex: 1;
  overflow: hidden;
  background: #1a1a1a;
}

/* AI任务选择器 */
.ai-task-selector {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 20;
  background: rgba(0, 0, 0, 0.75);
  padding: 6px;
  border-radius: 6px;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.ai-task-selector :deep(.el-select) {
  width: 200px;
}

.ai-task-selector :deep(.el-input__inner) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(59, 130, 246, 0.5);
  color: #fff;
}

.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0a;
}

.no-signal {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 14px;
}

.no-signal i {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.video-player-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>

