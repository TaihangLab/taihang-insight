<template>
  <div class="rounded-lg overflow-hidden h-full flex flex-col" style="background: rgba(6, 30, 93, 0.8); border: 1px solid rgba(35, 88, 148, 0.5);">
    <div class="px-4 py-3" style="background: rgba(4, 20, 63, 0.8); border-bottom: 1px solid rgba(35, 88, 148, 0.3);">
      <div class="text-sm font-semibold" style="color: #00FFFF;">我的算法</div>
    </div>
    <div class="p-4 flex-1 flex items-center justify-center">
      <!-- 加载状态 -->
      <div v-if="loading" class="text-center" style="color: #7EAEE5;">
        <i class="i-carbon-circle-dash text-3xl animate-spin"></i>
        <p class="text-xs mt-2">加载中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="algorithms.length === 0" class="text-center" style="color: #7EAEE5;">
        <i class="i-carbon-machine-learning text-3xl"></i>
        <p class="text-xs mt-2">暂无算法</p>
      </div>

      <!-- 算法列表 -->
      <div v-else class="w-full h-full overflow-y-auto algorithm-list">
        <div
          v-for="algo in displayAlgorithms"
          :key="algo.id"
          class="flex items-center justify-between p-2 mb-2 rounded"
          style="background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(0, 255, 255, 0.2);"
        >
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <div class="w-8 h-8 rounded flex items-center justify-center text-xs font-bold"
                 :style="{ background: algo.color || '#1B96FF', color: '#fff' }">
              {{ algo.name?.charAt(0) || '?' }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-xs font-medium truncate" style="color: #fff;">{{ algo.name }}</div>
              <div class="text-[10px] truncate" style="color: #7EAEE5;">{{ algo.type || '视觉模型' }}</div>
            </div>
          </div>
          <div class="text-right ml-2">
            <div class="text-xs font-bold" style="color: #44FF9B;">{{ algo.status }}</div>
            <div class="text-[10px]" style="color: #7EAEE5;">{{ algo.deviceCount }} 设备</div>
          </div>
        </div>
        <div v-if="algorithms.length > displayLimit" class="text-center mt-2">
          <span class="text-xs cursor-pointer hover:opacity-80" style="color: #1B96FF;" @click="toggleShowAll">
            {{ showAll ? '收起' : `查看全部 (${algorithms.length})` }}
          </span>
        </div>
      </div>
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

interface Algorithm {
  id: number
  name: string
  type?: string
  status: string
  deviceCount: number
  color?: string
}

const algorithms = ref<Algorithm[]>([])
const loading = ref(true)
const showAll = ref(false)
const displayLimit = 5

const displayAlgorithms = computed(() => {
  if (showAll.value) {
    return algorithms.value
  }
  return algorithms.value.slice(0, displayLimit)
})

const colors = ['#1B96FF', '#44FF9B', '#FFD700', '#FF6B6B', '#9B59B6', '#3498DB', '#E74C3C', '#2ECC71']

async function loadAlgorithms(): Promise<void> {
  loading.value = true
  try {
    // 获取已发布的技能列表
    const response = await centerAPI.skill.getSkillList({ status: true, limit: 100 })
    if (response?.data && Array.isArray(response.data)) {
      algorithms.value = response.data.map((skill: any, index: number) => ({
        id: skill.id || index,
        name: skill.name || skill.skill_name || `算法${index + 1}`,
        type: skill.skill_type || '视觉模型',
        status: skill.status === true || skill.status === 'published' ? '运行中' : '已停止',
        deviceCount: skill.device_count || skill.task_count || 0,
        color: colors[index % colors.length]
      }))
    } else {
      algorithms.value = []
    }
  } catch (error) {
    console.error('加载算法列表失败:', error)
    algorithms.value = []
  } finally {
    loading.value = false
  }
}

function toggleShowAll() {
  showAll.value = !showAll.value
}

let refreshTimer: number | null = null

onMounted(() => {
  loadAlgorithms()
  refreshTimer = window.setInterval(loadAlgorithms, 60000)
})

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style scoped>
.algorithm-list {
  max-height: calc(100% - 20px);
}

.algorithm-list::-webkit-scrollbar {
  width: 4px;
}

.algorithm-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.algorithm-list::-webkit-scrollbar-thumb {
  background: rgba(27, 150, 255, 0.5);
  border-radius: 2px;
}

.algorithm-list::-webkit-scrollbar-thumb:hover {
  background: rgba(27, 150, 255, 0.8);
}
</style>
