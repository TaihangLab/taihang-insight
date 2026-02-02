<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { Expand } from '@element-plus/icons-vue'
import centerAPI from '@/api/center'
import type { LocationInfo } from '@/types/center/components'

interface Props {
  title?: string
  currentDetailTime?: string
  locationInfo?: LocationInfo
  showDecorations?: boolean
}

interface Emits {
  (e: 'toggleFullscreen'): void
}

const props = withDefaults(defineProps<Props>(), {
  title: '太行AI算法推理平台',
  showDecorations: false
})

const emit = defineEmits<Emits>()

// 如果没有传入时间，内部维护
const internalTime = ref<string>('')

// 如果没有传入位置信息，内部获取
const internalLocationInfo = reactive<LocationInfo>({
  location: '加载中...',
  weather: '--',
  airQuality: '--',
  loading: true
})

let timerID: number | null = null

function updateTime(): void {
  const now = new Date()
  internalTime.value = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0') + ':' +
    String(now.getSeconds()).padStart(2, '0')
}

async function loadLocationInfo(): Promise<void> {
  try {
    const response = await centerAPI.alertStatistics.getByLocation('7d', 1)
    if (Array.isArray(response) && response.length > 0) {
      const location = response[0].name
      internalLocationInfo.location = location.replace(/^摄像头\d+-/, '')
    } else {
      internalLocationInfo.location = '未知位置'
    }
  } catch (error) {
    console.error('加载位置信息失败:', error)
    internalLocationInfo.location = '未知位置'
  } finally {
    internalLocationInfo.loading = false
  }
}

// 显示的时间（优先使用 props）
const displayTime = props.currentDetailTime || internalTime
const displayLocationInfo = props.locationInfo || internalLocationInfo

onMounted(() => {
  if (!props.currentDetailTime) {
    updateTime()
    timerID = window.setInterval(updateTime, 1000)
  }
  if (!props.locationInfo) {
    loadLocationInfo()
  }
})

onBeforeUnmount(() => {
  if (timerID) clearInterval(timerID)
})
</script>

<template>
  <div class="top-bar flex justify-between items-center px-5 h-[60px]" style="background: linear-gradient(180deg, rgba(1, 19, 56, 0.8) 0%, rgba(1, 19, 56, 0.6) 100%);">
    <div class="text-lg font-bold" style="color: #00ffff;">{{ displayTime }}</div>
    <div class="flex-1 text-center">
      <span
        class="text-2xl font-bold text-white tracking-widest"
        :class="{ 'title-with-decorations': showDecorations }"
        style="text-shadow: 0 0 10px rgba(51, 255, 255, 0.5);"
      >
        {{ title }}
      </span>
    </div>
    <div v-if="displayLocationInfo.loading" class="text-sm" style="color: #7EAEE5;">加载中...</div>
    <div v-else class="flex items-center gap-5">
      <div class="flex items-center gap-2" style="color: #7EAEE5;">
        <i class="i-carbon-location text-base" style="color: #00FFFF;"></i>
        <span>{{ displayLocationInfo.location }}</span>
      </div>
      <div class="flex items-center gap-2" style="color: #7EAEE5;">
        <i class="i-carbon-sun text-base" style="color: #00FFFF;"></i>
        <span>{{ displayLocationInfo.weather }}</span>
        <span class="ml-2" style="color: #44FF9B;">{{ displayLocationInfo.airQuality }}</span>
      </div>
      <el-button
        :icon="Expand"
        circle
        style="background: rgba(0, 17, 53, 0.5); border: 1px solid rgba(0, 255, 255, 0.2);"
        @click="emit('toggleFullscreen')"
      />
    </div>
  </div>
</template>

<style scoped>
.title-with-decorations::before,
.title-with-decorations::after {
  content: '';
  position: absolute;
  height: 2px;
  width: 70px;
  background: linear-gradient(90deg, transparent, #00ffff, transparent);
  top: 50%;
}

.title-with-decorations::before {
  right: calc(100% + 15px);
}

.title-with-decorations::after {
  left: calc(100% + 15px);
}
</style>
