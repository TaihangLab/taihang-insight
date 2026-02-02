<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import * as echarts from 'echarts';
import type { ECharts } from 'echarts';
import alertStatisticsAPI from '@/api/center/alertStatistics';

interface ChartDataItem {
  name: string;
  value: number;
  itemStyle?: { color: string };
}

interface Props {
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  height: 200
});

const chartRef = ref<HTMLElement | null>(null);
let chart: ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

// 数据状态
const loading = ref<boolean>(false);
const chartData = ref<ChartDataItem[]>([]);

// 定时器
let refreshTimer: number | null = null;

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
    legend: {
      orient: 'vertical',
      right: 0,
      top: 'center',
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 20,
      textStyle: {
        color: '#7EAEE5'
      }
    },
    series: [
      {
        name: '预警等级',
        type: 'pie',
        radius: ['60%', '85%'],
        center: ['30%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: false
        },
        labelLine: {
          show: false
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
 * 加载预警等级数据
 */
async function loadData(): Promise<void> {
  loading.value = true;
  try {
    const response = await alertStatisticsAPI.getByLevel('24h');
    if (Array.isArray(response)) {
      chartData.value = response.map((item: any) => ({
        name: item.name || item.level_name,
        value: item.value || item.count,
        itemStyle: {
          color: item.color
        }
      }));
    }
  } catch (error) {
    console.error('加载预警等级失败:', error);
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
  loading
});
</script>

<template>
  <div ref="chartRef" class="w-full h-full relative" :style="{ height: props.height + 'px' }"></div>
</template>
