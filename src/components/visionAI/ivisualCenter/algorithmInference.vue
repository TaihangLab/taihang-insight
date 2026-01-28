<template>
  <div class="algorithm-inference-platform">
    <!-- 顶部标题 -->
    <div class="top-bar">
      <div class="left-section">
        <div class="time">{{ currentTime }}</div>
      </div>
      <div class="title">
        <span>太行AI算法推理平台</span>
      </div>
      <div class="right-controls">
        <div class="location-info">
          <div v-if="locationInfo.loading" class="loading-indicator">
            <span>加载中...</span>
          </div>
          <template v-else>
            <div class="location" style="margin-right: -10px;">
              <i class="el-icon-location"></i>
              <span>{{ locationInfo.location }}</span>
            </div>
            <div class="weather-info">
              <i class="el-icon-sunny"></i>
              <span>{{ locationInfo.weather }}</span>
              <span class="air-quality">{{ locationInfo.airQuality }}</span>
            </div>
            <div class="fullscreen-btn" @click="toggleFullScreen">
              <i class="el-icon-full-screen"></i>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div class="dashboard-container">
      <!-- 资源统计模块 -->
      <ResourceStatistics
        :cpuUsage="cpuUsage"
        :memoryUsage="memoryUsage"
        :diskUsage="diskUsage"
        :networkUsage="networkUsage"
        :currentTime="currentTime"
      />

      <!-- 中间部分 - 数据展示 -->
      <div class="center-container">
        <!-- 上部数据展示和立方体模型 -->
        <div class="central-visualization">
          <!-- Three.js 3D场景容器占据整个区域 -->
          <div id="threejs-cube" class="threejs-container"></div>

          <!-- 底层平台结构（作为背景） -->
          <div class="platform-structure-bg"></div>
        </div>
      </div>

      <!-- 我的算法模块 -->
      <div class="dashboard-card my-algorithms">
        <div class="card-header">
          <div class="title">我的算法</div>
        </div>
        <div class="card-content">
          <div id="algorithm-sphere-container" class="algorithm-bubbles">
            <!-- Three.js 会渲染到这个容器 -->
          </div>
        </div>
      </div>

      <!-- 实时事件模块 -->
      <div class="dashboard-card realtime-events">
        <div class="card-header">
          <div class="title">实时事件</div>
        </div>
        <div class="card-content">
          <div class="event-layout">
            <!-- 上方视频区域 - 合并为一个大框 -->
            <div class="main-video-area"></div>
            <!-- 右侧缩略图列表 -->
            <div class="thumbnail-list">
              <div class="thumbnail-item"></div>
              <div class="thumbnail-item"></div>
              <div class="thumbnail-item"></div>
            </div>
            <!-- 下方事件信息 -->
            <div class="event-info-area">
              <div class="event-info-row">
                <span class="info-label">时间</span>
                <span class="info-value">{{ latestEvent.time }}</span>
              </div>
              <div class="event-info-row">
                <span class="info-label">地点</span>
                <span class="info-value">{{ latestEvent.location }}</span>
              </div>
              <div class="event-info-row">
                <span class="info-label">事件</span>
                <span class="info-value">{{ latestEvent.event }}</span>
                <span class="alarm-tag">报警</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 报警统计模块 -->
      <div class="dashboard-card alarm-statistics">
        <div class="card-header">
          <div class="title">报警统计</div>
        </div>
        <div class="card-content">
          <!-- 报警类型统计 -->
          <div class="alarm-chart-section">
            <!-- 圆环饼图 -->
            <div class="donut-container">
              <div class="donut-chart">
                <div
                  v-for="(section, index) in alarmSections"
                  :key="index"
                  :class="['chart-section', `section-${index + 1}`]"
                  @mouseover="showTooltip(section.name, section.value, $event)"
                  @mouseout="hideTooltip"
                ></div>
                <div class="chart-tooltip" v-if="tooltipVisible" :style="tooltipStyle">
                  {{ tooltipText }}
                </div>
              </div>
            </div>

            <!-- 图例 -->
            <div class="chart-legends">
              <div
                v-for="(legend, index) in alarmLegends"
                :key="index"
                class="legend-item"
              >
                <div :class="['legend-color', `type-${index + 1}`]"></div>
                <span class="legend-name">{{ legend.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 设备统计模块 -->
      <div class="dashboard-card device-statistics">
        <div class="card-header">
          <div class="title">设备统计</div>
        </div>
        <div class="card-content">
          <!-- 设备接入总数 -->
          <div class="device-total">
            <div class="total-label">设备接入总数</div>
            <div class="digital-counter">
              <span v-for="(digit, index) in deviceTotalDigits" :key="index" class="digit">{{ digit }}</span>
            </div>
          </div>
          <!-- 设备类型统计 -->
          <div class="device-types">
            <div class="type-item">
              <div class="type-circle">
                <div class="ripple-container">
                  <div class="ripple"></div>
                  <div class="ripple"></div>
                  <div class="ripple"></div>
                </div>
                <div class="circle-content">
                  <span class="number">{{ deviceStats.videoStreams }}</span>
                </div>
              </div>
              <div class="type-name">视频流</div>
            </div>
            <div class="type-item">
              <div class="type-circle">
                <div class="ripple-container">
                  <div class="ripple"></div>
                  <div class="ripple"></div>
                  <div class="ripple"></div>
                </div>
                <div class="circle-content">
                  <span class="number">{{ deviceStats.captureServices }}</span>
                </div>
              </div>
              <div class="type-name">抓图服务</div>
            </div>
            <div class="type-item">
              <div class="type-circle">
                <div class="ripple-container">
                  <div class="ripple"></div>
                  <div class="ripple"></div>
                  <div class="ripple"></div>
                </div>
                <div class="circle-content">
                  <span class="number">{{ deviceStats.wvpCalls }}</span>
                </div>
              </div>
              <div class="type-name">NVR调用</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 报警信息模块 -->
      <div class="dashboard-card alarm-info">
        <div class="card-header">
          <div class="title">报警信息</div>
        </div>
        <div class="card-content">
          <!-- 日期筛选 -->
          <div class="date-filter">
            <div class="date-filter-left">
              <span class="date-btn">今日</span>
              <span class="date-btn">近7天</span>
              <span class="date-btn active">本月</span>
              <span class="date-range">2021/05/01 - 2021/05/31</span>
            </div>
            <!-- 图表切换，移到右边 -->
            <div class="date-filter-right">
              <div class="chart-tabs">
                <div class="tab active">
                  <i class="el-icon-data-line"></i>
                  报警趋势
                </div>
                <div class="tab">
                  <i class="el-icon-map-location"></i>
                  报警位置
                </div>
              </div>
            </div>
          </div>
          <!-- 趋势图表 -->
          <div class="trend-chart">
            <div class="chart-header">
              <div class="trend-total">
                <span class="label">报警数量</span>
                <span class="value">{{ alertTrendTotal }}</span>
              </div>
              <div class="trend-time-selector">
                <span class="time-selector-label">时间范围:</span>
                <div class="selector-dropdown">
                  <span>近30天</span>
                  <i class="el-icon-arrow-down"></i>
                </div>
              </div>
            </div>
            <svg width="100%" height="150" viewBox="0 0 600 150" preserveAspectRatio="none">
              <!-- 横线 -->
              <g class="grid-lines">
                <line x1="0" y1="0" x2="600" y2="0" stroke="rgba(120, 140, 180, 0.2)" stroke-width="1" />
                <line x1="0" y1="30" x2="600" y2="30" stroke="rgba(120, 140, 180, 0.2)" stroke-width="1" />
                <line x1="0" y1="60" x2="600" y2="60" stroke="rgba(120, 140, 180, 0.2)" stroke-width="1" />
                <line x1="0" y1="90" x2="600" y2="90" stroke="rgba(120, 140, 180, 0.2)" stroke-width="1" />
                <line x1="0" y1="120" x2="600" y2="120" stroke="rgba(120, 140, 180, 0.2)" stroke-width="1" />
                <line x1="0" y1="150" x2="600" y2="150" stroke="rgba(120, 140, 180, 0.2)" stroke-width="1" />
              </g>

              <!-- 数据曲线 -->
              <path
                :d="trendPathData"
                stroke="#0095ff"
                stroke-width="2"
                fill="none"
              />

              <!-- 区域填充 -->
              <path
                :d="trendAreaData"
                fill="url(#gradient)"
              />

              <!-- 渐变定义 -->
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#0095ff" stop-opacity="0.5" />
                  <stop offset="100%" stop-color="#0095ff" stop-opacity="0.05" />
                </linearGradient>
              </defs>

              <!-- 数据点标记 -->
              <g class="data-points">
                <circle
                  v-for="(point, index) in trendDataPoints"
                  :key="index"
                  :cx="point.x"
                  :cy="point.y"
                  r="3"
                  fill="#ffffff"
                  stroke="#0095ff"
                  stroke-width="1"
                />
              </g>
            </svg>
          </div>
        </div>
      </div>

      <!-- 报警转发模块 -->
      <div class="dashboard-card alarm-forwarding">
        <div class="card-header">
          <div class="title">报警转发</div>
        </div>
        <div class="card-content">
          <!-- 柱状图 -->
          <div class="bar-chart">
            <svg width="100%" height="150" viewBox="0 0 350 150" preserveAspectRatio="none">
              <!-- 横线 -->
              <g class="grid-lines">
                <line x1="0" y1="0" x2="350" y2="0" stroke="rgba(120, 140, 180, 0.2)" stroke-width="1" />
                <line x1="0" y1="30" x2="350" y2="30" stroke="rgba(120, 140, 180, 0.2)" stroke-width="1" />
                <line x1="0" y1="60" x2="350" y2="60" stroke="rgba(120, 140, 180, 0.2)" stroke-width="1" />
                <line x1="0" y1="90" x2="350" y2="90" stroke="rgba(120, 140, 180, 0.2)" stroke-width="1" />
                <line x1="0" y1="120" x2="350" y2="120" stroke="rgba(120, 140, 180, 0.2)" stroke-width="1" />
                <line x1="0" y1="150" x2="350" y2="150" stroke="rgba(120, 140, 180, 0.2)" stroke-width="1" />
              </g>

              <!-- 柱状图 -->
              <g class="bars">
                <rect
                  v-for="(bar, index) in forwardBars"
                  :key="index"
                  :x="bar.x"
                  :y="bar.y"
                  :width="bar.width"
                  :height="bar.height"
                  fill="url(#bar-gradient)"
                  rx="2"
                />
              </g>

              <!-- 柱状图渐变 -->
              <defs>
                <linearGradient id="bar-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#1e90ff" stop-opacity="1" />
                  <stop offset="100%" stop-color="#1e90ff" stop-opacity="0.5" />
                </linearGradient>
              </defs>

              <!-- 数值标签 -->
              <g class="bar-values" fill="#ffffff" font-size="10" text-anchor="middle">
                <text
                  v-for="(bar, index) in forwardBars"
                  :key="index"
                  :x="bar.labelX"
                  :y="bar.labelY"
                >{{ bar.value }}</text>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue';
import ResourceStatistics from './components/ResourceStatistics.vue';
import { systemMonitorAPI, alertStatisticsAPI, deviceStatisticsAPI, alertForwardAPI, skillAPI } from '@/components/service/VisionAIService.js';

// ============================================================================
// 类型定义
// ============================================================================

interface LocationInfo {
  location: string;
  weather: string;
  airQuality: string;
  loading: boolean;
}

interface DeviceStats {
  total: number;
  videoStreams: number;
  captureServices: number;
  wvpCalls: number;
}

interface LatestEvent {
  time: string;
  location: string;
  event: string;
}

interface AlarmSection {
  name: string;
  value: number;
}

interface AlarmLegend {
  name: string;
}

interface TrendDataPoint {
  x: number;
  y: number;
}

interface ForwardBar {
  x: number;
  y: number;
  width: number;
  height: number;
  labelX: number;
  labelY: number;
  value: string;
}

// ============================================================================
// 响应式状态
// ============================================================================

// 时间和资源数据
const currentTime = ref<string>('');
const cpuUsage = ref<number>(0);
const memoryUsage = ref<number>(0);
const diskUsage = ref<number>(0);
const networkUsage = ref<number>(0);

// 定时器
let timerID: number | null = null;
let resourceRefreshTimer: number | null = null;

// 位置信息
const locationInfo = reactive<LocationInfo>({
  location: '太行山工业园区',
  weather: '晴 26°C',
  airQuality: '空气质量: 良',
  loading: false
});

// 设备统计
const deviceStats = ref<DeviceStats>({
  total: 0,
  videoStreams: 0,
  captureServices: 0,
  wvpCalls: 0
});

// 最新事件
const latestEvent = ref<LatestEvent>({
  time: '2022-12-12 15:28:46',
  location: '机场马路',
  event: '机动车超时停车'
});

// 报警统计
const alarmSections = ref<AlarmSection[]>([
  { name: '人员检测', value: 5 },
  { name: '交通拥堵', value: 40 },
  { name: '非机动车违规', value: 20 },
  { name: '违章停车', value: 35 }
]);

const alarmLegends = ref<AlarmLegend[]>([
  { name: '人员检测' },
  { name: '交通拥堵' },
  { name: '非机动车违规' },
  { name: '违章停车' }
]);

// Tooltip
const tooltipVisible = ref<boolean>(false);
const tooltipText = ref<string>('');
const tooltipStyle = reactive<Record<string, string | number>>({
  position: 'absolute',
  top: '0',
  left: '0',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  color: '#fff',
  padding: '5px',
  borderRadius: '5px',
  zIndex: 1000
});

// 报警趋势
const alertTrendTotal = ref<number>(25000);
const trendDataPoints = ref<TrendDataPoint[]>([]);

// 报警转发
const forwardBars = ref<ForwardBar[]>([]);

// 计算属性
const deviceTotalDigits = computed(() => {
  return String(deviceStats.value.total).split('');
});

const trendPathData = computed(() => {
  if (trendDataPoints.value.length === 0) return '';
  const points = trendDataPoints.value;
  let path = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` C${points[i - 1].x + 20},${points[i - 1].y} ${points[i].x - 20},${points[i].y} ${points[i].x},${points[i].y}`;
  }
  return path;
});

const trendAreaData = computed(() => {
  const path = trendPathData.value;
  if (!path) return '';
  return `${path} L600,150 L0,150 Z`;
});

// ============================================================================
// 数据加载方法
// ============================================================================

/**
 * 加载所有数据
 */
async function loadAllData(): Promise<void> {
  await Promise.all([
    loadResourceData(),
    loadDeviceStatistics(),
    loadAlertTrendData(),
    loadForwardData()
  ]);
}

/**
 * 加载资源数据
 */
async function loadResourceData(): Promise<void> {
  try {
    const response = await systemMonitorAPI.getCurrentResources();
    if (response.data?.code === 0 && response.data?.data) {
      const data = response.data.data;
      cpuUsage.value = data.cpu_usage || 0;
      memoryUsage.value = data.memory_usage || 0;
      diskUsage.value = data.disk_usage || 0;
      networkUsage.value = data.network_usage || 0;
    }
  } catch (error) {
    console.error('加载资源数据失败:', error);
  }
}

/**
 * 加载设备统计
 */
async function loadDeviceStatistics(): Promise<void> {
  try {
    const response = await deviceStatisticsAPI.getConnectionSummary();
    if (response.data?.code === 0 && response.data?.data) {
      const data = response.data.data;
      deviceStats.value = {
        total: data.total_connections || 0,
        videoStreams: data.video_streams || 0,
        captureServices: data.capture_services || 0,
        wvpCalls: data.nvr_calls || 0
      };
    }
  } catch (error) {
    console.error('加载设备统计失败:', error);
  }
}

/**
 * 加载报警趋势数据
 */
async function loadAlertTrendData(): Promise<void> {
  try {
    const response = await alertStatisticsAPI.getTrend('30d', '1d');
    if (response.data?.code === 0 && response.data?.data) {
      const data = response.data.data;
      const labels = data.time_labels || [];
      const points = data.trend_data || [];
      alertTrendTotal.value = points.reduce((a, b) => a + b, 0);

      // 生成图表数据点
      const xStep = 600 / (labels.length - 1 || 1);
      const maxValue = Math.max(...points, 1);
      const chartPoints: TrendDataPoint[] = points.map((value, index) => ({
        x: index * xStep,
        y: 150 - (value / maxValue) * 120
      }));

      trendDataPoints.value = chartPoints;
    }
  } catch (error) {
    console.error('加载报警趋势失败:', error);
  }
}

/**
 * 加载报警转发数据
 */
async function loadForwardData(): Promise<void> {
  try {
    const response = await alertForwardAPI.getForwardStatistics('7d');
    if (response.data?.code === 0 && response.data?.data) {
      const data = response.data.data;
      const counts = data.forward_counts || [];
      const maxValue = Math.max(...counts, 1);
      const barWidth = 20;
      const gap = 30;
      const startX = 25;

      const bars: ForwardBar[] = counts.map((value, index) => {
        const height = (value / maxValue) * 120;
        return {
          x: startX + index * (barWidth + gap),
          y: 150 - height,
          width: barWidth,
          height: height,
          labelX: startX + index * (barWidth + gap) + barWidth / 2,
          labelY: 150 - height - 5,
          value: String(value)
        };
      });

      forwardBars.value = bars.slice(0, 7);
    }
  } catch (error) {
    console.error('加载报警转发失败:', error);
  }
}

/**
 * 更新时间
 */
function updateTime(): void {
  const now = new Date();
  currentTime.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
}

/**
 * 显示 Tooltip
 */
function showTooltip(name: string, value: number, event: MouseEvent): void {
  tooltipText.value = `${name}: ${value}%`;
  tooltipStyle.left = `${event.clientX}px`;
  tooltipStyle.top = `${event.clientY}px`;
  tooltipVisible.value = true;
}

/**
 * 隐藏 Tooltip
 */
function hideTooltip(): void {
  tooltipVisible.value = false;
}

/**
 * 切换全屏
 */
async function toggleFullScreen(): Promise<void> {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen();
  } else {
    await document.exitFullscreen();
  }
}

// ============================================================================
// 生命周期
// ============================================================================

onMounted(() => {
  // 初始化时间更新
  updateTime();
  timerID = window.setInterval(updateTime, 1000);

  // 加载数据
  loadAllData();

  // 定时刷新资源数据
  resourceRefreshTimer = window.setInterval(loadResourceData, 5000);
});

onBeforeUnmount(() => {
  if (timerID) clearInterval(timerID);
  if (resourceRefreshTimer) clearInterval(resourceRefreshTimer);
});
</script>

<style scoped>
.algorithm-inference-platform {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #000B18 0%, #001529 100%);
  color: #fff;
  overflow-x: hidden;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  background: linear-gradient(180deg, rgba(1, 19, 56, 0.8) 0%, rgba(1, 19, 56, 0.6) 100%);
}

.left-section .time {
  font-size: 18px;
  font-weight: bold;
  color: #00ffff;
}

.title {
  flex: 1;
  text-align: center;
}

.title span {
  font-size: 24px;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 0 0 10px rgba(51, 255, 255, 0.5);
  letter-spacing: 4px;
}

.right-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.location-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.location, .weather-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #7EAEE5;
}

.location i, .weather-info i {
  color: #00FFFF;
  font-size: 16px;
}

.air-quality {
  margin-left: 8px;
  color: #44FF9B;
}

.fullscreen-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 17, 53, 0.5);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 4px;
  color: #1B96FF;
  cursor: pointer;
  transition: all 0.3s;
}

.fullscreen-btn:hover {
  background: rgba(27, 150, 255, 0.2);
  color: #33ffff;
  transform: scale(1.05);
}

.dashboard-container {
  padding: 20px;
  display: grid;
  grid-template-columns: 300px 1fr 280px 280px;
  grid-template-rows: auto auto;
  gap: 20px;
  grid-template-areas:
    "resource center algorithms realtime alarm"
    "resource center alarm alarm"
    "resource center alarm alarm";
}

.dashboard-card {
  background: rgba(6, 30, 93, 0.8);
  border: 1px solid rgba(35, 88, 148, 0.5);
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  padding: 12px 16px;
  background: rgba(4, 20, 63, 0.8);
  border-bottom: 1px solid rgba(35, 88, 148, 0.3);
}

.title {
  font-size: 14px;
  font-weight: 600;
  color: #00FFFF;
}

.card-content {
  padding: 16px;
}

.resource-statistics {
  grid-area: resource;
}

.center-container {
  grid-area: center;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.central-visualization {
  flex: 1;
  min-height: 400px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.threejs-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.platform-structure-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, rgba(27, 150, 255, 0.1) 0%, transparent 70%);
}

.my-algorithms {
  grid-area: algorithms;
}

.algorithm-bubbles {
  height: 200px;
  position: relative;
}

.realtime-events {
  grid-area: realtime;
}

.event-layout {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
}

.main-video-area {
  flex: 1;
  min-height: 120px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 4px;
}

.thumbnail-list {
  display: flex;
  gap: 5px;
  height: 50px;
}

.thumbnail-item {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 4px;
}

.event-info-area {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 4px;
  padding: 10px;
}

.event-info-row {
  display: flex;
  margin-bottom: 5px;
  font-size: 12px;
}

.info-label {
  color: #7EAEE5;
  margin-right: 8px;
  min-width: 40px;
}

.info-value {
  color: #fff;
  flex: 1;
}

.alarm-tag {
  background: #FF4D4F;
  color: #fff;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 10px;
}

.alarm-statistics {
  grid-area: alarm;
}

.alarm-chart-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.donut-container {
  width: 120px;
  height: 120px;
  margin-bottom: 10px;
}

.donut-chart {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-section {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  transition: all 0.3s;
}

.section-1 {
  background: conic-gradient(#FF4D4F 0deg 18deg, transparent 18deg 90deg);
  clip-path: polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 100%);
}

.section-2 {
  background: conic-gradient(#44FF9B 90deg 162deg, transparent 162deg 234deg);
  clip-path: polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 100%);
}

.section-3 {
  background: conic-gradient(#FFD700 234deg 306deg, transparent 306deg 378deg);
  clip-path: polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 100%);
}

.section-4 {
  background: conic-gradient(#00C5FF 378deg 450deg, transparent 450deg 540deg);
  clip-path: polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 100%);
}

.chart-legends {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.type-1 { background: #FF4D4F; }
.type-2 { background: #44FF9B; }
.type-3 { background: #FFD700; }
.type-4 { background: #00C5FF; }

.legend-name {
  font-size: 12px;
  color: #7EAEE5;
}

.device-statistics {
  grid-area: device;
}

.device-total {
  margin-bottom: 20px;
}

.total-label {
  font-size: 12px;
  color: #7EAEE5;
  margin-bottom: 10px;
}

.digital-counter {
  display: flex;
  gap: 4px;
}

.digit {
  width: 30px;
  height: 40px;
  background: linear-gradient(180deg, #1B96FF 0%, #0056B3 100%);
  border: 1px solid rgba(27, 150, 255, 0.3);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  color: #00FFFF;
}

.device-types {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.type-circle {
  width: 60px;
  height: 60px;
  position: relative;
}

.ripple-container {
  position: absolute;
  width: 100%;
  height: 100%;
}

.ripple {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 2px solid #1B96FF;
  border-radius: 50%;
  animation: ripple 2s infinite;
  opacity: 0;
}

.ripple:nth-child(2) {
  animation-delay: 0.5s;
}

.ripple:nth-child(3) {
  animation-delay: 1s;
}

@keyframes ripple {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.circle-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.number {
  font-size: 16px;
  font-weight: bold;
  color: #00FFFF;
}

.type-name {
  font-size: 12px;
  color: #7EAEE5;
}

.alarm-info {
  grid-area: alarm;
}

.date-filter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.date-filter-left {
  display: flex;
  gap: 10px;
}

.date-btn {
  padding: 4px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 4px;
  font-size: 12px;
  color: #7EAEE5;
  cursor: pointer;
  transition: all 0.3s;
}

.date-btn.active {
  background: rgba(0, 255, 255, 0.1);
  border-color: #00FFFF;
  color: #00FFFF;
}

.date-range {
  font-size: 12px;
  color: #7EAEE5;
}

.chart-tabs {
  display: flex;
  gap: 10px;
}

.tab {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 4px;
  font-size: 12px;
  color: #7EAEE5;
  cursor: pointer;
  transition: all 0.3s;
}

.tab.active {
  background: rgba(0, 255, 255, 0.1);
  border-color: #00FFFF;
  color: #00FFFF;
}

.trend-chart {
  flex: 1;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.trend-total {
  display: flex;
  gap: 5px;
  font-size: 12px;
  color: #7EAEE5;
}

.trend-total .value {
  font-size: 16px;
  font-weight: bold;
  color: #00FFFF;
}

.trend-time-selector {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #7EAEE5;
}

.selector-dropdown {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 4px;
}

.alarm-forwarding {
  grid-area: forwarding;
}

.bar-chart {
  flex: 1;
}

.chart-footer {
  margin-top: 10px;
}

.chart-hint {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #7EAEE5;
}
</style>
