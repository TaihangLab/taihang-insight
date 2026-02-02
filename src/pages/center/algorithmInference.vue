<template>
  <div ref="algorithmInferenceRef" class="algorithm-inference" :class="{ 'is-fullscreen': isFullscreen }">
    <!-- 3D 背景层 -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <!-- <CentralVisualization /> -->
    </div>

    <!-- 内容层 -->
    <div class="relative z-10 flex flex-col h-full">
      <TopBar @toggleFullscreen="toggleFullscreen" />

      <!-- 主内容区 - 明确的网格布局 -->
      <div ref="mainContentRef" class="p-5 grid gap-5 flex-1 main-content" style="
        grid-template-columns: 1fr 1fr 1fr 280px;
        grid-template-rows: 300px 300px 240px;
        grid-template-areas:
          'resource resource resource realtime'
          'resource resource resource algorithms'
          'alarm device alarminfo alarmforward';
      ">
        <!-- 资源统计 - 2行 x 3列 -->
        <div style="grid-area: resource;" class="h-full">
          <ResourceStatistics :resizeTrigger="resizeKey" />
        </div>

        <!-- 实时事件 - 第1行第4列 -->
        <div style="grid-area: realtime;" class="h-full min-h-0">
          <RealtimeEvents :resizeTrigger="resizeKey" />
        </div>

        <!-- 我的算法 - 第2行第4列 -->
        <div style="grid-area: algorithms;" class="h-full min-h-0">
          <MyAlgorithms :resizeTrigger="resizeKey" />
        </div>

        <!-- 报警统计 - 第3行第1列 -->
        <div style="grid-area: alarm;" class="h-full min-h-0">
          <AlarmStatistics :resizeTrigger="resizeKey" />
        </div>

        <!-- 设备统计 - 第3行第2列 -->
        <div style="grid-area: device;" class="h-full min-h-0">
          <DeviceStatistics :resizeTrigger="resizeKey" />
        </div>

        <!-- 报警信息 - 第3行第3列 -->
        <div style="grid-area: alarminfo;" class="h-full min-h-0">
          <AlarmInfo :resizeTrigger="resizeKey" />
        </div>

        <!-- 报警转发 - 第3行第4列 -->
        <div style="grid-area: alarmforward;" class="h-full min-h-0">
          <AlarmForwarding :resizeTrigger="resizeKey" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import TopBar from '@/pages/center/components/TopBar.vue'
import MyAlgorithms from './components/algorithmInference/components/MyAlgorithms.vue'
import RealtimeEvents from './components/algorithmInference/components/RealtimeEvents.vue'
import AlarmStatistics from './components/algorithmInference/components/AlarmStatistics.vue'
import DeviceStatistics from './components/algorithmInference/components/DeviceStatistics.vue'
import AlarmInfo from './components/algorithmInference/components/AlarmInfo.vue'
import AlarmForwarding from './components/algorithmInference/components/AlarmForwarding.vue'
import CentralVisualization from './components/algorithmInference/components/CentralVisualization.vue'
import ResourceStatistics from '@/components/visionAI/ivisualCenter/components/ResourceStatistics.vue'

// 全屏状态
const isFullscreen = ref(false)
const algorithmInferenceRef = ref<HTMLElement | null>(null)
const mainContentRef = ref<HTMLElement | null>(null)
const resizeKey = ref(0)

/**
 * 切换全屏
 */
async function toggleFullscreen(): Promise<void> {
  try {
    if (!document.fullscreenElement) {
      await algorithmInferenceRef.value?.requestFullscreen()
      isFullscreen.value = true
    } else {
      await document.exitFullscreen()
      isFullscreen.value = false
    }
  } catch (err) {
    console.error('全屏切换失败:', err)
  }
}

/**
 * 处理全屏变化，通知组件重新调整大小
 */
const handleFullscreenChange = () => {
  const wasFullscreen = isFullscreen.value
  isFullscreen.value = !!document.fullscreenElement

  // 如果全屏状态发生变化，强制组件重新渲染
  if (wasFullscreen !== isFullscreen.value) {
    // 延迟更新，等待 DOM 完成全屏切换
    setTimeout(() => {
      resizeKey.value++
    }, 300)
  }

  console.log('[AlgorithmInference] 全屏状态变化:', isFullscreen.value)
}

// 监听全屏变化
onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
</script>

<style scoped>
/* 全局隐藏滚动条 */
* {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

*::-webkit-scrollbar {
  display: none;
}

.algorithm-inference {
  flex: 1;
  min-height: 0;
  background: linear-gradient(135deg, #000B18 0%, #001529 100%);
  color: #fff;
  padding: 16px;
  margin: 0;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 全屏模式 */
.algorithm-inference:fullscreen {
  height: 100vh;
  overflow: hidden;
}

.algorithm-inference:fullscreen .main-content {
  height: calc(100vh - 60px);
}

/* 全屏状态类（用于响应式调整） */
.algorithm-inference.is-fullscreen .main-content {
  /* 全屏时可能需要调整间距 */
}
</style>
