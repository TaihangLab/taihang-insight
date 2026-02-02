<template>
  <div class="rounded-lg overflow-hidden h-full flex flex-col" style="background: rgba(6, 30, 93, 0.8); border: 1px solid rgba(35, 88, 148, 0.5);">
    <div class="px-4 py-3" style="background: rgba(4, 20, 63, 0.8); border-bottom: 1px solid rgba(35, 88, 148, 0.3);">
      <div class="text-sm font-semibold" style="color: #00FFFF;">实时事件</div>
    </div>
    <div class="p-4 flex-1 flex flex-col gap-2.5">
      <!-- 加载状态 -->
      <div v-if="loading" class="flex-1 flex items-center justify-center" style="color: #7EAEE5;">
        <i class="i-carbon-circle-dash text-3xl animate-spin"></i>
        <p class="text-xs mt-2 ml-2">加载中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!latestEvent.hasData" class="flex-1 flex flex-col gap-2.5">
        <div class="flex-1 min-h-[120px] rounded flex items-center justify-center"
             style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(0, 255, 255, 0.2);">
          <div class="text-center" style="color: #7EAEE5;">
            <i class="i-carbon-events text-3xl"></i>
            <p class="text-xs mt-2">暂无最新事件</p>
          </div>
        </div>
        <div class="flex gap-1.5 h-[50px]">
          <div v-for="i in 3" :key="i" class="flex-1 rounded flex items-center justify-center"
               style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(0, 255, 255, 0.2);">
            <i class="i-carbon-image" style="color: rgba(0, 255, 255, 0.3);"></i>
          </div>
        </div>
        <div class="p-2.5 rounded text-xs"
             style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(0, 255, 255, 0.2);">
          <div class="flex mb-1">
            <span class="mr-2" style="color: #7EAEE5; min-width: 40px;">状态</span>
            <span class="flex-1" style="color: #44FF9B;">系统正常</span>
          </div>
          <div class="flex">
            <span class="mr-2" style="color: #7EAEE5; min-width: 40px;">说明</span>
            <span class="flex-1" style="color: #7EAEE5;">等待预警事件...</span>
          </div>
        </div>
      </div>

      <!-- 数据展示 -->
      <template v-else>
        <!-- 主图片区域 -->
        <div class="flex-1 min-h-[120px] rounded overflow-hidden relative"
             style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(0, 255, 255, 0.2);">
          <img v-if="latestEvent.imageUrl"
               :src="latestEvent.imageUrl"
               alt="最新预警"
               class="w-full h-full object-cover"
               @error="latestEvent.imageUrl = ''">
          <div v-else class="w-full h-full flex items-center justify-center"
               style="background: linear-gradient(135deg, rgba(27, 150, 255, 0.2) 0%, rgba(68, 255, 155, 0.2) 100%);">
            <i class="i-carbon-image-error text-4xl" style="color: rgba(0, 255, 255, 0.5);"></i>
          </div>
          <!-- 实时标记 -->
          <div class="absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-bold animate-pulse"
               style="background: rgba(255, 77, 79, 0.9); color: #fff;">
            LIVE
          </div>
        </div>

        <!-- 缩略图区域 -->
        <div class="flex gap-1.5 h-[50px]">
          <div v-for="(img, index) in recentImages" :key="index"
               class="flex-1 rounded overflow-hidden relative"
               style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(0, 255, 255, 0.2);">
            <img v-if="img.image_url"
                 :src="img.image_url"
                 alt="预警图片"
                 class="w-full h-full object-cover">
            <div v-else class="w-full h-full flex items-center justify-center">
              <i class="i-carbon-image" style="color: rgba(0, 255, 255, 0.3);"></i>
            </div>
          </div>
        </div>

        <!-- 事件信息 -->
        <div class="p-2.5 rounded text-xs"
             style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(0, 255, 255, 0.2);">
          <div class="flex mb-1">
            <span class="mr-2" style="color: #7EAEE5; min-width: 40px;">时间</span>
            <span class="flex-1 text-white">{{ latestEvent.time }}</span>
          </div>
          <div class="flex mb-1">
            <span class="mr-2" style="color: #7EAEE5; min-width: 40px;">地点</span>
            <span class="flex-1 text-white">{{ latestEvent.location }}</span>
          </div>
          <div class="flex items-center">
            <span class="mr-2" style="color: #7EAEE5; min-width: 40px;">事件</span>
            <span class="flex-1 text-white">{{ latestEvent.event }}</span>
            <span class="px-1.5 py-0.5 rounded text-[10px]" style="background: #FF4D4F; color: #fff;">报警</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import centerAPI from '@/api/center'
import type { AlertImage } from '@/types/center/alertStatistics'

// 接收 resizeTrigger prop
defineProps<{
  resizeTrigger?: number
}>()

interface LatestEvent {
  hasData: boolean
  time: string
  location: string
  event: string
  imageUrl: string
}

const latestEvent = reactive<LatestEvent>({
  hasData: false,
  time: '--',
  location: '暂无数据',
  event: '--',
  imageUrl: ''
})

const recentImages = ref<AlertImage[]>([])
const loading = ref(true)

async function loadLatestEvent(): Promise<void> {
  loading.value = true
  try {
    const images = await centerAPI.alertStatistics.getLatestImages(4)
    if (images && images.length > 0) {
      recentImages.value = images

      // 第一张作为最新事件
      const alert = images[0]
      latestEvent.hasData = true
      latestEvent.time = formatTime(alert.alert_time)
      latestEvent.location = alert.camera_name || alert.location || '未知位置'
      latestEvent.event = alert.alert_type || '未知事件'
      latestEvent.imageUrl = alert.image_url || ''
    } else {
      latestEvent.hasData = false
      recentImages.value = []
    }
  } catch (error) {
    console.error('加载最新事件失败:', error)
    latestEvent.hasData = false
    recentImages.value = []
  } finally {
    loading.value = false
  }
}

function formatTime(timeStr?: string): string {
  if (!timeStr) return '--'
  try {
    const date = new Date(timeStr)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return timeStr
  }
}

let refreshTimer: number | null = null

onMounted(() => {
  loadLatestEvent()
  // 每 30 秒刷新
  refreshTimer = window.setInterval(loadLatestEvent, 30000)
})

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>
