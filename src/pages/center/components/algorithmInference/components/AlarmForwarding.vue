<template>
  <div class="rounded-lg overflow-hidden h-full flex flex-col" style="background: rgba(6, 30, 93, 0.8); border: 1px solid rgba(35, 88, 148, 0.5);">
    <div class="px-4 py-3" style="background: rgba(4, 20, 63, 0.8); border-bottom: 1px solid rgba(35, 88, 148, 0.3);">
      <div class="text-sm font-semibold" style="color: #00FFFF;">报警转发</div>
    </div>
    <div class="p-4 flex-1 flex items-center justify-center">
      <!-- 加载状态 -->
      <div v-if="loading" class="text-center" style="color: #7EAEE5;">
        <i class="i-carbon-circle-dash text-3xl animate-spin"></i>
        <p class="text-xs mt-2">加载中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="forwardBars.length === 0" class="text-center" style="color: #7EAEE5;">
        <i class="i-carbon-chart-bar text-3xl"></i>
        <p class="text-xs mt-2">暂无数据</p>
      </div>

      <!-- 柱状图 -->
      <svg v-else class="w-full h-full" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="bar-gradient-fwd" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#1B96FF" stop-opacity="1" />
            <stop offset="100%" stop-color="#1B96FF" stop-opacity="0.5" />
          </linearGradient>
        </defs>
        <!-- 背景网格线 -->
        <g class="grid-lines">
          <line v-for="i in 4" :key="'grid-' + i"
                :x1="10" :y1="10 + (i - 1) * 25"
                :x2="190" :y2="10 + (i - 1) * 25"
                stroke="rgba(120, 140, 180, 0.12)" stroke-width="0.5" stroke-dasharray="2,2" />
        </g>
        <!-- 柱状图 -->
        <g class="bars">
          <rect v-for="(bar, index) in forwardBars" :key="index"
                :x="bar.x" :y="bar.y"
                :width="bar.width" :height="bar.height"
                fill="url(#bar-gradient-fwd)" rx="2" />
        </g>
        <!-- 数值标签 -->
        <g fill="#ffffff" text-anchor="middle" font-weight="bold">
          <text v-for="(bar, index) in forwardBars" :key="'label-' + index"
                :x="bar.labelX" :y="bar.labelY"
                font-size="2">{{ bar.value }}</text>
        </g>
        <!-- 日期标签 -->
        <g fill="#7EAEE5" text-anchor="middle">
          <text v-for="(bar, index) in forwardBars" :key="'date-' + index"
                :x="bar.labelX" :y="115"
                font-size="2">{{ bar.date }}</text>
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import centerAPI from '@/api/center'

// 接收 resizeKey prop 用于强制重新计算
defineProps<{
  resizeTrigger?: number
}>()

interface ForwardBar {
  x: number
  y: number
  width: number
  height: number
  labelX: number
  labelY: number
  value: string
  date: string
}

const forwardBars = ref<ForwardBar[]>([])
const loading = ref(true)

async function loadForwardData(): Promise<void> {
  loading.value = true
  try {
    const response = await centerAPI.alertForward.getForwardStatistics('7d')
    if (response && response.forward_counts && response.forward_counts.length > 0) {
      const counts = response.forward_counts
      const dates = response.date_labels || []
      const maxValue = Math.max(...counts, 1)

      // SVG viewBox 尺寸: 200 x 120
      const svgWidth = 200
      const svgHeight = 120
      const chartTop = 15
      const chartBottom = 105
      const chartHeight = chartBottom - chartTop

      const barWidth = 14
      const gap = 8
      const totalWidth = counts.length * barWidth + (counts.length - 1) * gap
      const startX = (svgWidth - totalWidth) / 2

      forwardBars.value = counts.map((value: number, index: number) => {
        const height = (value / maxValue) * chartHeight
        const y = chartBottom - height
        const x = startX + index * (barWidth + gap)
        return {
          x,
          y,
          width: barWidth,
          height,
          labelX: x + barWidth / 2,
          labelY: y - 3,
          value: value >= 1000 ? Math.floor(value / 1000) + 'k' : String(value),
          date: dates[index] || ''
        }
      })
    } else {
      forwardBars.value = []
    }
  } catch (error) {
    console.error('加载报警转发失败:', error)
    forwardBars.value = []
  } finally {
    loading.value = false
  }
}

let refreshTimer: number | null = null

onMounted(() => {
  loadForwardData()
  refreshTimer = window.setInterval(loadForwardData, 60000)
})

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>
