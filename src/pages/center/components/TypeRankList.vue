<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import alertStatisticsAPI from '@/api/center/alertStatistics';
import type { WarningType } from '@/types/center/components';

interface Props {
  // 不再需要 props，组件自己加载数据
}

defineProps<Props>();

// 数据状态
const warningTypes = ref<WarningType[]>([]);
const loading = ref<boolean>(false);

// 定时器
let refreshTimer: number | null = null;

/**
 * 加载预警类型数据
 */
async function loadData(): Promise<void> {
  loading.value = true;
  try {
    const response = await alertStatisticsAPI.getByType('24h', 10);
    if (Array.isArray(response)) {
      warningTypes.value = response.map((item: any) => ({
        name: item.name,
        count: item.count,
        value: item.value,
        color: item.color
      }));
    }
  } catch (error) {
    console.error('加载预警类型失败:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  // 加载数据
  loadData();

  // 设置定时刷新（每30秒）
  refreshTimer = window.setInterval(loadData, 30 * 1000);
});

onBeforeUnmount(() => {
  // 清理定时器
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});

defineExpose({
  refresh: loadData,
  loading
});
</script>

<template>
  <div class="flex-1 overflow-y-auto flex flex-col min-h-0">
    <div
      v-for="(item, index) in warningTypes"
      :key="index"
      class="flex items-center mb-2.5"
    >
      <span class="w-25 text-[#7EAEE5]">{{ item.name }}</span>
      <div class="flex-1 h-1.5 bg-[rgba(126,174,229,0.1)] mx-2.5 rounded-3 overflow-hidden">
        <div class="h-full bg-[#00FFFF] rounded-3" :style="{ width: item.value + '%' }"></div>
      </div>
      <span class="w-12 text-right text-[#7EAEE5]">{{ item.count }}个</span>
    </div>
  </div>
</template>
