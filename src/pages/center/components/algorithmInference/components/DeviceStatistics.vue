<template>
  <div class="rounded-lg overflow-hidden h-full flex flex-col" style="background: rgba(6, 30, 93, 0.8); border: 1px solid rgba(35, 88, 148, 0.5);">
    <div class="px-4 py-3" style="background: rgba(4, 20, 63, 0.8); border-bottom: 1px solid rgba(35, 88, 148, 0.3);">
      <div class="text-sm font-semibold" style="color: #00FFFF;">设备统计</div>
    </div>
    <div class="p-4 flex-1 flex flex-col">
      <div class="mb-5">
        <div class="text-xs mb-2.5" style="color: #7EAEE5;">设备接入总数</div>
        <div class="flex gap-1">
          <span v-for="(digit, index) in deviceTotalDigits" :key="index"
                class="flex items-center justify-center text-xl font-bold rounded w-[30px] h-10"
                style="background: linear-gradient(180deg, #1B96FF 0%, #0056B3 100%); border: 1px solid rgba(27, 150, 255, 0.3); color: #00FFFF;">
            {{ digit }}
          </span>
        </div>
      </div>
      <div class="flex flex-col gap-5 flex-1 justify-center">
        <div v-for="item in deviceTypeItems" :key="item.name" class="flex flex-col items-center gap-2">
          <div class="w-[60px] h-[60px] relative">
            <div class="absolute inset-0">
              <div class="absolute inset-0 border-2 rounded-full animate-pulse" style="border-color: #1B96FF;"></div>
              <div class="absolute inset-0 border-2 rounded-full animate-ping opacity-50" style="animation-delay: 0.5s; border-color: #1B96FF;"></div>
            </div>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-base font-bold" style="color: #00FFFF;">{{ item.value }}</span>
            </div>
          </div>
          <span class="text-xs" style="color: #7EAEE5;">{{ item.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import centerAPI from '@/api/center'

// 接收 resizeTrigger prop
defineProps<{
  resizeTrigger?: number
}>()

interface DeviceStats {
  total: number
  videoStreams: number
  captureServices: number
  wvpCalls: number
}

const deviceStats = ref<DeviceStats>({
  total: 0,
  videoStreams: 0,
  captureServices: 0,
  wvpCalls: 0
})

const deviceTotalDigits = computed(() => String(deviceStats.value.total).split(''))

const deviceTypeItems = computed(() => [
  { name: '视频流', value: deviceStats.value.videoStreams },
  { name: '抓图服务', value: deviceStats.value.captureServices },
  { name: 'NVR调用', value: deviceStats.value.wvpCalls }
])

async function loadDeviceStatistics(): Promise<void> {
  try {
    const response = await centerAPI.deviceStatistics.getConnectionSummary()
    if (response) {
      deviceStats.value = {
        total: response.total_connections || 0,
        videoStreams: response.video_streams || 0,
        captureServices: response.capture_services || 0,
        wvpCalls: response.nvr_calls || 0
      }
    }
  } catch (error) {
    console.error('加载设备统计失败:', error)
  }
}

onMounted(() => {
  loadDeviceStatistics()
  setInterval(loadDeviceStatistics, 60000)
})
</script>
