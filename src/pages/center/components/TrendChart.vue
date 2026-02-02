<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import * as echarts from 'echarts';
import type { ECharts } from 'echarts';
import alertStatisticsAPI from '@/api/center/alertStatistics';

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
const timeLabels = ref<string[]>([]);
const dataPoints = ref<number[]>([]);

// 定时器
let refreshTimer: number | null = null;

function getOption(timeLabels: string[], dataPoints: number[]) {
  return {
    backgroundColor: 'transparent',
    grid: {
      top: 40,
      bottom: 20,
      left: 0,
      right: 20,
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: 'rgba(0, 255, 255, 0.3)',
          width: 1
        }
      },
      backgroundColor: 'rgba(0, 19, 40, 0.8)',
      borderColor: 'rgba(0, 255, 255, 0.3)',
      textStyle: {
        color: '#00FFFF'
      }
    },
    xAxis: {
      type: 'category',
      data: timeLabels,
      axisLine: {
        lineStyle: {
          color: 'rgba(0, 255, 255, 0.3)'
        }
      },
      axisLabel: {
        color: '#7EAEE5'
      },
      axisTick: {
        show: false
      },
      splitLine: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      axisLabel: {
        color: '#7EAEE5'
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(35, 88, 148, 0.3)',
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: '预警数量',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: dataPoints,
        lineStyle: {
          width: 3,
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#00FFFF' },
              { offset: 1, color: '#207FFF' }
            ]
          }
        },
        itemStyle: {
          color: '#00FFFF',
          borderColor: 'rgba(0, 255, 255, 0.3)',
          borderWidth: 6
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0, 255, 255, 0.3)' },
              { offset: 1, color: 'rgba(0, 255, 255, 0)' }
            ]
          }
        }
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
    chart.setOption(getOption(timeLabels.value, dataPoints.value));

    // 监听容器尺寸变化
    resizeObserver = new ResizeObserver(() => {
      chart?.resize();
    });
    resizeObserver.observe(chartRef.value);
  });
}

/**
 * 加载预警趋势数据
 */
async function loadData(): Promise<void> {
  loading.value = true;
  try {
    const response = await alertStatisticsAPI.getTrend('24h', 'hour');
    if (response) {
      // 兼容多种可能的字段名
      const labels = response.time_labels  || [];
      const data = response.trend_data || [];

      timeLabels.value = labels;
      dataPoints.value = data;
    }
  } catch (error) {
    console.error('[TrendChart] 加载预警趋势失败:', error);
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
watch(() => [timeLabels.value, dataPoints.value], ([labels, points]) => {
  if (labels && labels.length > 0 && points && points.length > 0 && chart) {
    chart.setOption(getOption(labels as string[], points as number[]));
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
  <div ref="chartRef" class="w-full relative" :style="{ height: props.height + 'px' }"></div>
</template>
