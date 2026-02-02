<template>
  <div class="rounded-lg overflow-hidden h-full flex flex-col" style="background: rgba(6, 30, 93, 0.8); border: 1px solid rgba(35, 88, 148, 0.5);">
    <div class="px-4 py-3" style="background: rgba(4, 20, 63, 0.8); border-bottom: 1px solid rgba(35, 88, 148, 0.3);">
      <div class="text-sm font-semibold" style="color: #00FFFF;">报警统计</div>
    </div>
    <div class="p-4 flex-1 flex flex-col items-center justify-center">
      <!-- 加载状态 -->
      <div v-if="loading" class="text-center" style="color: #7EAEE5;">
        <i class="i-carbon-circle-dash text-3xl animate-spin"></i>
        <p class="text-xs mt-2">加载中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="alarmSections.length === 0" class="text-center" style="color: #7EAEE5;">
        <i class="i-carbon-chart-bar text-3xl"></i>
        <p class="text-xs mt-2">暂无数据</p>
      </div>

      <!-- 数据展示 -->
      <template v-else>
        <div class="w-[120px] h-[120px] mb-2.5 relative flex items-center justify-center">
          <svg class="w-full h-full" viewBox="0 0 100 100">
            <circle v-for="(section, index) in alarmSectionsWithAngles" :key="index"
                    cx="50" cy="50" r="40"
                    fill="none"
                    :stroke="colors[index]"
                    :stroke-width="index === alarmSections.length - 1 ? '20' : '20'"
                    :stroke-dasharray="getStrokeDashArray(section.startAngle, section.endAngle)"
                    stroke-dashoffset="0"
                    transform="rotate(-90 50 50)"
                    class="cursor-pointer"
                    style="transition: all 0.3s;"
                    @mouseenter="showTooltip(section)"
                    @mouseleave="hideTooltip" />
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-lg font-bold" style="color: #00FFFF;">{{ totalCount }}</span>
          </div>
          <div v-if="tooltipVisible" class="absolute px-2 py-1 rounded text-xs z-50 whitespace-nowrap" style="background: rgba(0, 0, 0, 0.8); color: #fff;">
            {{ tooltipText }}
          </div>
        </div>
        <div class="w-full flex flex-col gap-2">
          <div v-for="(legend, index) in alarmLegends" :key="index" class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-sm" :style="{ background: getLegendColor(index) }"></div>
              <span class="text-xs" style="color: #7EAEE5;">{{ legend.name }}</span>
            </div>
            <span class="text-xs font-bold" style="color: #00FFFF;">{{ alarmSections[index]?.value || 0 }}</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import centerAPI from '@/api/center'

// 接收 resizeTrigger prop
defineProps<{
  resizeTrigger?: number
}>()

interface AlarmSection {
  name: string
  value: number
  startAngle?: number
  endAngle?: number
}

interface AlarmLegend {
  name: string
}

const alarmSections = ref<AlarmSection[]>([])
const alarmLegends = ref<AlarmLegend[]>([])
const tooltipVisible = ref<boolean>(false)
const tooltipText = ref<string>('')
const loading = ref<boolean>(true)

const colors = ['#FF4D4F', '#44FF9B', '#FFD700', '#00C5FF']

const totalCount = computed(() => {
  return alarmSections.value.reduce((sum, item) => sum + item.value, 0)
})

const alarmSectionsWithAngles = computed(() => {
  if (alarmSections.value.length === 0) return []

  const total = totalCount.value
  if (total === 0) return []

  let currentAngle = 0
  return alarmSections.value.map((item) => {
    const percentage = item.value / total
    const angle = percentage * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle = endAngle
    return {
      ...item,
      startAngle,
      endAngle
    }
  })
})

async function loadAlarmStatistics(): Promise<void> {
  loading.value = true
  try {
    const response = await centerAPI.alertStatistics.getByType('7d')
    if (Array.isArray(response) && response.length > 0) {
      const stats = response.slice(0, 4)
      alarmSections.value = stats.map((item: any) => ({
        name: item.name,
        value: item.count || item.value || 0
      }))
      alarmLegends.value = stats.map((item: any) => ({ name: item.name }))
    } else {
      alarmSections.value = []
      alarmLegends.value = []
    }
  } catch (error) {
    console.error('加载报警统计失败:', error)
    alarmSections.value = []
    alarmLegends.value = []
  } finally {
    loading.value = false
  }
}

function getStrokeDashArray(startAngle: number, endAngle: number): string {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const startPercent = startAngle / 360
  const endPercent = endAngle / 360
  const dashLength = (endPercent - startPercent) * circumference
  const gapLength = circumference - dashLength
  return `${dashLength} ${gapLength}`
}

function getLegendColor(index: number): string {
  return colors[index] || '#999'
}

function showTooltip(section: AlarmSection) {
  const total = totalCount.value
  const percentage = total > 0 ? Math.round((section.value / total) * 100) : 0
  tooltipText.value = `${section.name}: ${section.value} (${percentage}%)`
  tooltipVisible.value = true
}

function hideTooltip() {
  tooltipVisible.value = false
}

let refreshTimer: number | null = null

onMounted(() => {
  loadAlarmStatistics()
  refreshTimer = window.setInterval(loadAlarmStatistics, 60000)
})

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>
