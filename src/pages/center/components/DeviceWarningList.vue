<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import alertStatisticsAPI from '@/api/center/alertStatistics';
import type { DeviceWarning, UITimeRange } from '@/types/center/components';
import type { TimeRange } from '@/types/center/alertStatistics';

// UI 层面的时间范围选择（用于界面切换）
const timeRangeMapping: Record<UITimeRange, TimeRange> = {
  day: '24h',
  week: '7d',
  month: '30d'
};

interface Props {
  tableHeight: number;
  headerCellStyle: any;
  deviceTimeRange?: UITimeRange; // 父组件可以传入初始时间范围
}

const props = withDefaults(defineProps<Props>(), {
  deviceTimeRange: 'day'
});

// 数据状态
const deviceWarnings = ref<DeviceWarning[]>([]);
const loading = ref<boolean>(false);
const currentTimeRange = ref<UITimeRange>(props.deviceTimeRange);

// 定时器
let refreshTimer: number | null = null;

const timeRangeLabels: Record<UITimeRange, string> = {
  day: '本日',
  week: '本周',
  month: '本月'
};

/**
 * 改变时间范围
 */
function changeTimeRange(range: UITimeRange): void {
  currentTimeRange.value = range;
  loadData();
}

/**
 * 加载设备预警数据
 */
async function loadData(): Promise<void> {
  loading.value = true;
  try {
    const apiTimeRange = timeRangeMapping[currentTimeRange.value];
    const response = await alertStatisticsAPI.getByLocation(apiTimeRange, 10);
    if (Array.isArray(response)) {
      deviceWarnings.value = response.map((item: any) => ({
        name: item.name,
        count: item.count
      }));
    }
  } catch (error) {
    console.error('加载设备预警失败:', error);
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
  changeTimeRange,
  loading
});
</script>

<template>
  <div class="flex-1 overflow-hidden min-h-0 flex flex-col">
    <!-- 标签切换 -->
    <div class="flex mb-2 border-b border-[rgba(0,255,255,0.2)]">
      <div
        v-for="(label, key) in timeRangeLabels"
        :key="key"
        :class="[
          'py-2 px-3 cursor-pointer text-13px relative transition-all duration-300',
          currentTimeRange === key ? 'text-[#00FFFF]' : 'text-[#7EAEE5]'
        ]"
        @click="changeTimeRange(key)"
      >
        {{ label }}
        <div
          v-if="currentTimeRange === key"
          class="absolute bottom--0.25 left-0 w-full h-0.5 bg-[#00FFFF]"
        ></div>
      </div>
    </div>

    <!-- 表格 -->
    <el-table
      :data="deviceWarnings"
      :header-cell-style="headerCellStyle"
      :cell-style="{ background: 'transparent', color: '#7EAEE5', borderBottom: '1px solid rgba(35, 88, 148, 0.3)' }"
      :row-style="{ background: 'transparent' }"
      :row-class-name="'transparent-row'"
      style="width: 100%"
      :height="tableHeight"
      v-loading="loading"
      element-loading-text="加载中..."
    >
      <el-table-column prop="name" label="设备位置" />
      <el-table-column prop="count" label="预警数量" align="center" width="100" />
    </el-table>
  </div>
</template>

<style scoped>
/* 表格透明样式 */
:deep(.transparent-row) {
  background-color: transparent !important;
}

:deep(.el-table) {
  background-color: transparent;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

:deep(.el-table::-webkit-scrollbar) {
  display: none;
}

:deep(.el-table tr) {
  background-color: transparent !important;
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td) {
  background-color: rgba(0, 255, 255, 0.1) !important;
}
</style>
