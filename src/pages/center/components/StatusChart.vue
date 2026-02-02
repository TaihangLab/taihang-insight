<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import * as echarts from 'echarts';
import type { ECharts } from 'echarts';
import alertStatisticsAPI from '@/api/center/alertStatistics';
import type { TimeRange } from '@/types/center/alertStatistics';
import type { UITimeRange } from '@/types/center/components';

// UI 层面的时间范围选择（用于界面切换）
const timeRangeMapping: Record<UITimeRange, TimeRange> = {
  day: '24h',
  week: '7d',
  month: '30d'
};

interface ChartDataItem {
  name: string;
  value: number;
  itemStyle?: { color: string };
}

interface Props {
  timeRange?: UITimeRange; // 父组件可以传入初始时间范围
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  timeRange: 'day',
  height: 200
});

const chartRef = ref<HTMLElement | null>(null);
let chart: ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

// 数据状态
const loading = ref<boolean>(false);
const chartData = ref<ChartDataItem[]>([]);
const currentTimeRange = ref<UITimeRange>(props.timeRange);

// 定时器
let refreshTimer: number | null = null;

const timeRangeLabels: Record<UITimeRange, string> = {
  day: '本日',
  week: '本周',
  month: '本月'
};

function getOption(data: ChartDataItem[]) {
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
      backgroundColor: 'rgba(0, 19, 40, 0.8)',
      borderColor: 'rgba(0, 255, 255, 0.3)',
      textStyle: {
        color: '#00FFFF'
      }
    },
    series: [
      {
        name: '状态分布',
        type: 'pie',
        radius: ['50%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{c}条',
          color: '#7EAEE5'
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 10,
          lineStyle: {
            color: 'rgba(35, 88, 148, 0.8)'
          }
        },
        data: data
      }
    ]
  };
}

function initChart() {
  if (!chartRef.value || chart) return;

  nextTick(() => {
    if (!chartRef.value || chart) return;

    // 直接初始化，不管尺寸是否为 0
    chart = echarts.init(chartRef.value);
    chart.setOption(getOption(chartData.value));

    // 监听容器尺寸变化
    resizeObserver = new ResizeObserver(() => {
      chart?.resize();
    });
    resizeObserver.observe(chartRef.value);
  });
}

/**
 * 改变时间范围
 */
function changeTimeRange(range: UITimeRange): void {
  currentTimeRange.value = range;
  loadData();
}

/**
 * 加载预警处理情况数据
 */
async function loadData(): Promise<void> {
  loading.value = true;
  try {
    const apiTimeRange = timeRangeMapping[currentTimeRange.value];
    const response = await alertStatisticsAPI.getProcessingStatus(apiTimeRange);
    if (Array.isArray(response)) {
      chartData.value = response.map((item: any) => ({
        name: item.status_name || item.name || item.status,
        value: item.count || item.value,
        itemStyle: item.color ? { color: item.color } : undefined
      }));
    }
  } catch (error) {
    console.error('加载预警处理情况失败:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  // 初始化图表
  initChart();

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

  // 清理图表
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  if (chart) {
    chart.dispose();
    chart = null;
  }
});

// 监听数据变化，更新图表
watch(() => chartData.value, (data) => {
  // 数据存在时确保图表显示
  if (data.length > 0) {
    if (chart) {
      chart.setOption(getOption(data));
    } else {
      // 图表未初始化，直接初始化
      initChart();
    }
  }
}, { deep: true });

defineExpose({
  resize: () => chart?.resize(),
  init: initChart,
  refresh: loadData,
  changeTimeRange,
  loading
});
</script>

<template>
  <div class="w-full h-full flex flex-col">
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

    <!-- 图表容器 -->
    <div ref="chartRef" class="w-full relative flex-1" :style="{ height: props.height + 'px' }"></div>
  </div>
</template>
