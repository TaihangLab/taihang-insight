<template>
  <el-header height="50px" class="video-toolbar">
    <div class="toolbar-left">
      <span class="header-label">分屏:</span>
      <div class="view-mode-buttons">
        <i class="iconfont icon-a-mti-1fenpingshi btn" :class="{active: viewMode === 'single'}" @click="switchViewMode('single')"/>
        <i class="iconfont icon-a-mti-4fenpingshi btn" :class="{active: viewMode === 'four'}" @click="switchViewMode('four')"/>
        <i class="iconfont icon-a-mti-9fenpingshi btn" :class="{active: viewMode === 'nine'}" @click="switchViewMode('nine')"/>
      </div>
    </div>
    <div class="toolbar-right">
      <div class="current-time">
        <i class="el-icon-time"></i>
        <span>{{ currentDateTime }}</span>
      </div>
      <el-tooltip content="全屏" placement="bottom" effect="light">
        <i class="el-icon-full-screen btn fullscreen-btn" @click="toggleFullscreen"/>
      </el-tooltip>
    </div>
  </el-header>
</template>

<script>
export default {
  name: 'VideoToolbar',
  props: {
    viewMode: {
      type: String,
      default: 'single'
    },
    currentDateTime: {
      type: String,
      default: ''
    }
  },
  methods: {
    switchViewMode(mode) {
      this.$emit('update:viewMode', mode);
      this.$emit('switch-view-mode', mode);
    },
    toggleFullscreen() {
      this.$emit('toggle-fullscreen');
    }
  }
}
</script>

<style scoped>
.video-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(30, 30, 40, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0 16px;
  color: white;
}

.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-label {
  font-size: 14px;
  margin-right: 8px;
}

.view-mode-buttons {
  display: flex;
  gap: 8px;
}

.btn {
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: all 0.3s ease;
  font-size: 18px;
}

.btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn.active {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.current-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.fullscreen-btn {
  font-size: 18px;
}
</style>
</template>