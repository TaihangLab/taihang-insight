<template>
  <div class="visual-center" ref="visualCenter">
    <!-- 顶部栏 -->
    <TopBar
      :currentDetailTime="currentDetailTime"
      :locationInfo="locationInfo"
      @toggleFullscreen="toggleFullscreen"
    />

    <!-- 主内容网格 (3行 x 4列) -->
    <div class="main-content">
      <!-- 第1行第1列：预警趋势 (1x1) -->
      <div class="grid-panel">
        <Panel title="预警趋势">
          <TrendChart ref="trendChartRef" :height="chartHeight" />
        </Panel>
      </div>

      <!-- 第1行第2-3列，第2行第2-3列：预警图片查看器 (2x2) -->
      <div class="grid-panel grid-span-2x2">
        <Panel title="">
          <WarningViewer
            :todayWarnings="dashboardSummary?.alerts?.today_alerts ?? 0"
            :deviceCount="dashboardSummary?.devices?.online_cameras ?? 0"
            :totalDevices="dashboardSummary?.devices?.total_cameras ?? 0"
          />
        </Panel>
      </div>

      <!-- 第1行第4列：预警等级占比 (1x1) -->
      <div class="grid-panel">
        <Panel title="预警等级占比">
          <LevelChart ref="levelChartRef" :height="chartHeight" />
        </Panel>
      </div>

      <!-- 第2行第1列：预警类型排名 (1x1) -->
      <div class="grid-panel">
        <Panel title="预警类型排名">
          <TypeRankList />
        </Panel>
      </div>

      <!-- 第2行第4列：组织预警Top5 (1x1) -->
      <div class="grid-panel">
        <Panel title="组织预警 Top 5">
          <TopLocationList />
        </Panel>
      </div>

      <!-- 第3行第1列：预警处理情况 (1x1) -->
      <div class="grid-panel">
        <Panel title="预警处理情况">
          <StatusChart ref="statusChartRef" :height="chartHeight" />
        </Panel>
      </div>

      <!-- 第3行第2-3列：预警记录 (1x2) -->
      <div class="grid-panel grid-span-1x2">
        <Panel title="预警记录">
          <WarningList
            :tableHeight="tableHeight"
            :headerCellStyle="headerCellStyle"
          />
        </Panel>
      </div>

      <!-- 第3行第4列：设备预警数量Top10 (1x1) -->
      <div class="grid-panel">
        <Panel title="设备预警数量 Top 10">
          <DeviceWarningList
            :tableHeight="tableHeight"
            :headerCellStyle="headerCellStyle"
          />
        </Panel>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue';
import centerAPI from '@/api/center';

// 导入组件
import TopBar from './components/TopBar.vue';
import Panel from './components/Panel.vue';
import TrendChart from './components/TrendChart.vue';
import LevelChart from './components/LevelChart.vue';
import StatusChart from './components/StatusChart.vue';
import TypeRankList from './components/TypeRankList.vue';
import TopLocationList from './components/TopLocationList.vue';
import WarningViewer from './components/WarningViewer.vue';
import WarningList from './components/WarningList.vue';
import DeviceWarningList from './components/DeviceWarningList.vue';

// 导入类型
import type { LocationInfo } from '@/types/center/components';
import type { DashboardSummary } from '@/types/center/dashboard';

// ============================================================================
// 响应式状态
// ============================================================================

// 当前时间
const currentDetailTime = ref<string>('');

// 大屏摘要数据
const dashboardSummary = ref<DashboardSummary | null>(null);

// 天气和位置信息
const locationInfo = reactive<LocationInfo>({
  location: '',
  weather: '',
  airQuality: '',
  loading: true
});

// 全屏状态
const isFullscreen = ref<boolean>(false);

// 表格样式（保留，用于表格组件）
const headerCellStyle = {
  background: 'linear-gradient(180deg, rgba(6, 30, 93, 0.9) 0%, rgba(4, 20, 63, 1) 100%)',
  color: '#00FFFF',
  borderBottom: '1px solid rgba(0, 255, 255, 0.3)',
  fontWeight: 'normal',
  padding: '12px 0',
  textShadow: '0 0 10px rgba(0, 255, 255, 0.3)'
};

// 图表引用（保留，用于窗口resize时调用）
const trendChartRef = ref<InstanceType<typeof TrendChart> | null>(null);
const levelChartRef = ref<InstanceType<typeof LevelChart> | null>(null);
const statusChartRef = ref<InstanceType<typeof StatusChart> | null>(null);
const visualCenter = ref<HTMLElement | null>(null);

// 表格高度（保留，用于表格组件）
const tableHeight = ref<number>(280);

// 图表容器高度（动态计算）
const chartHeight = ref<number>(200);

// 定时器
let weatherTimer: number | null = null;
let timeTimer: number | null = null;
let dashboardRefreshTimer: number | null = null;

// ============================================================================
// 工具方法
// ============================================================================

/**
 * 计算图表容器高度
 */
function calculateChartHeight(): void {
  if (visualCenter.value) {
    const containerHeight = visualCenter.value.clientHeight;
    // 减去 TopBar 高度（约 60px）和 padding（32px）
    // 网格有 3 行，每行高度约为 (容器高度 - 顶部栏 - padding) / 3
    const availableHeight = containerHeight - 60 - 32;
    const rowHeight = Math.floor(availableHeight / 3);
    // 减去 Panel 的 padding 和标题高度（约 60px）
    chartHeight.value = Math.max(rowHeight - 60, 150); // 最小 150pxs
  }
}

/**
 * 格式化日期
 */
function formatDate(date: Date, formatStr: string): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return formatStr
    .replace('yyyy', String(year))
    .replace('MM', month)
    .replace('dd', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 更新当前时间
 */
function updateCurrentTime(): void {
  const now = new Date();
  currentDetailTime.value = formatDate(now, 'yyyy-MM-dd HH:mm:ss');
}

/**
 * 处理窗口大小变化
 */
function handleResize(): void {
  calculateChartHeight();
  trendChartRef.value?.resize?.();
  levelChartRef.value?.resize?.();
  statusChartRef.value?.resize?.();
}

// ============================================================================
// 数据加载方法
// ============================================================================

/**
 * 加载大屏摘要数据
 */
async function loadDashboardData(): Promise<void> {
  try {
    dashboardSummary.value = await centerAPI.dashboard.getSummary();
  } catch (error) {
    console.error('加载大屏摘要数据失败:', error);
  }
}

/**
 * 获取天气数据
 */
async function fetchWeatherData(): Promise<void> {
  locationInfo.loading = true;
  try {
    // TODO: 接入真实天气API
    locationInfo.location = '太行工业园区';
    locationInfo.weather = '晴 26°C';
    locationInfo.airQuality = '空气质量: 良';
  } catch (error) {
    console.error('获取天气数据失败:', error);
  } finally {
    locationInfo.loading = false;
  }
}

/**
 * 切换全屏
 */
async function toggleFullscreen(): Promise<void> {
  try {
    if (!document.fullscreenElement) {
      await visualCenter.value?.requestFullscreen();
      isFullscreen.value = true;
    } else {
      await document.exitFullscreen();
      isFullscreen.value = false;
    }
  } catch (err) {
    console.error('全屏切换失败:', err);
  }
}

// ============================================================================
// 生命周期
// ============================================================================

onMounted(() => {
  // 初始化CSS变量
  document.documentElement.style.setProperty('--panel-top-height', '24vh');
  document.documentElement.style.setProperty('--panel-bottom-height', '36vh');

  // 更新当前时间
  updateCurrentTime();

  // 初始化天气数据
  fetchWeatherData();

  // 加载大屏摘要数据
  loadDashboardData();

  // 计算图表高度（延迟执行，确保 DOM 渲染完成）
  nextTick(() => {
    setTimeout(() => {
      calculateChartHeight();
    }, 100);
  });

  // 设置定时器
  weatherTimer = window.setInterval(fetchWeatherData, 5 * 60 * 1000);
  timeTimer = window.setInterval(updateCurrentTime, 1000);
  dashboardRefreshTimer = window.setInterval(loadDashboardData, 30 * 1000);

  // 监听全屏变化
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement;
    setTimeout(() => {
      handleResize();
    }, 300);
  });

  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  // 清理定时器
  if (weatherTimer) clearInterval(weatherTimer);
  if (timeTimer) clearInterval(timeTimer);
  if (dashboardRefreshTimer) clearInterval(dashboardRefreshTimer);

  // 移除事件监听
  document.removeEventListener('fullscreenchange', () => {});
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
/* 全局隐藏滚动条样式 */
* {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

*::-webkit-scrollbar {
  display: none;
}

.visual-center {
  flex: 1;
  min-height: 0;
  background: linear-gradient(135deg, #001529 0%, #000B18 100%);
  color: #fff;
  padding: 16px;
  margin: 0;
  position: relative;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

/* 网格布局容器 */
.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 16px;
  min-height: 0;
  overflow: hidden;
}

/* 全屏模式下的网格 */
.visual-center:fullscreen {
  height: 100vh;
  overflow: hidden;
}

.visual-center:fullscreen .main-content {
  height: calc(100vh - 60px);
}

/* 网格面板基础样式 */
.grid-panel {
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* 跨越2行2列（中间预警图片查看器） */
.grid-span-2x2 {
  grid-column: span 2;
  grid-row: span 2;
}

/* 跨越1行2列（预警记录） */
.grid-span-1x2 {
  grid-column: span 2;
  grid-row: span 1;
}
</style>
