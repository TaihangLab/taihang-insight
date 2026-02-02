<template>
  <div class="rounded-lg overflow-hidden h-full flex flex-col" style="background: rgba(6, 30, 93, 0.8); border: 1px solid rgba(35, 88, 148, 0.5);">
    <div class="px-4 py-3" style="background: rgba(4, 20, 63, 0.8); border-bottom: 1px solid rgba(35, 88, 148, 0.3);">
      <div class="text-sm font-semibold" style="color: #00FFFF;">报警信息</div>
    </div>
    <div class="p-4 flex-1 flex flex-col">
      <div class="flex justify-between items-center mb-4">
        <div class="flex gap-2.5">
          <span v-for="filter in dateFilters" :key="filter.value"
                class="px-3 py-1 text-xs rounded cursor-pointer transition-all"
                :class="dateFilter === filter.value ? 'active' : ''"
                :style="dateFilter === filter.value ? activeStyle : inactiveStyle"
                @click="dateFilter = filter.value">
            {{ filter.label }}
          </span>
        </div>
        <span class="text-xs" style="color: #7EAEE5;">{{ dateRangeText }}</span>
      </div>

      <div class="flex justify-between items-center mb-2.5">
        <div class="flex gap-1 text-xs" style="color: #7EAEE5;">
          <span>报警数量</span>
          <span class="text-base font-bold" style="color: #00FFFF;">{{ alertTrendTotal }}</span>
        </div>
        <div class="flex items-center gap-1.5 px-2 py-1 rounded text-xs" style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(0, 255, 255, 0.2); color: #7EAEE5;">
          <span>时间范围:</span>
          <span>近30天</span>
          <i class="i-carbon-caret-down text-xs"></i>
        </div>
      </div>

      <svg class="flex-1 w-full" viewBox="0 0 600 150" preserveAspectRatio="none">
        <g class="grid-lines">
          <line v-for="i in 6" :key="'grid-' + i" :y1="(i - 1) * 30" :y2="(i - 1) * 30"
                x1="0" x2="600" stroke="rgba(120, 140, 180, 0.2)" stroke-width="1" />
        </g>
        <path :d="trendPathData" stroke="#0095ff" stroke-width="2" fill="none" />
        <path :d="trendAreaData" fill="url(#gradient)" />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0095ff" stop-opacity="0.5" />
            <stop offset="100%" stop-color="#0095ff" stop-opacity="0.05" />
          </linearGradient>
        </defs>
        <g class="data-points">
          <circle v-for="(point, index) in trendDataPoints" :key="index"
                  :cx="point.x" :cy="point.y" r="3" fill="#ffffff" stroke="#0095ff" stroke-width="1" />
        </g>
      </svg>
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

interface TrendDataPoint {
  x: number
  y: number
}

const dateFilter = ref('month')
const alertTrendTotal = ref<number>(0)
const trendDataPoints = ref<TrendDataPoint[]>([])

const dateFilters = [
  { label: '今日', value: 'today' },
  { label: '近7天', value: 'week' },
  { label: '本月', value: 'month' }
]

const activeStyle = 'background: rgba(0, 255, 255, 0.1); border: 1px solid #00FFFF; color: #00FFFF;'
const inactiveStyle = 'background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(0, 255, 255, 0.2); color: #7EAEE5;'

const dateRangeText = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}/${month}/01 - ${year}/${month}/31`
})

const trendPathData = computed(() => {
  if (trendDataPoints.value.length === 0) return ''
  const points = trendDataPoints.value
  let path = 'M' + points[0].x + ',' + points[0].y
  for (let i = 1; i < points.length; i++) {
    path += ' C' + (points[i - 1].x + 20) + ',' + points[i - 1].y + ' ' + (points[i].x - 20) + ',' + points[i].y + ' ' + points[i].x + ',' + points[i].y
  }
  return path
})

const trendAreaData = computed(() => {
  const path = trendPathData.value
  if (!path) return ''
  return path + ' L600,150 L0,150 Z'
})

async function loadAlertTrendData(): Promise<void> {
  try {
    const response = await centerAPI.alertStatistics.getTrend('30d', 'day')
    if (response) {
      const points = response.trend_data || []
      alertTrendTotal.value = points.reduce((a: number, b: number) => a + b, 0)
      const labels = response.time_labels || []
      const xStep = 600 / (labels.length - 1 || 1)
      const maxValue = Math.max(...points, 1)
      trendDataPoints.value = points.map((value: number, index: number) => ({
        x: index * xStep,
        y: 150 - (value / maxValue) * 120
      }))
    }
  } catch (error) {
    console.error('加载报警趋势失败:', error)
  }
}

onMounted(() => {
  loadAlertTrendData()
  setInterval(loadAlertTrendData, 60000)
})
</script>
