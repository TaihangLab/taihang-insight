<template>
  <div class="visual-center" ref="visualCenter">
    <div class="top-bar">
      <div class="time">{{ currentDetailTime }}</div>
      <div class="title">
        <span>太行视觉AI监控中心</span>
      </div>
      <div class="right-controls">
        <div class="location-info">
          <div v-if="locationInfo.loading" class="loading-indicator">
            <span>加载中...</span>
          </div>
          <template v-else>
            <div class="location">
              <i class="el-icon-location"></i>
              <span>{{ locationInfo.location }}</span>
            </div>
            <div class="weather-info">
              <i class="el-icon-sunny"></i>
              <span>{{ locationInfo.weather }}</span>
              <span class="air-quality">{{ locationInfo.airQuality }}</span>
            </div>
          </template>
        </div>
        <div class="fullscreen-btn" @click="toggleFullscreen">
          <i class="el-icon-full-screen"></i>
        </div>
      </div>
    </div>

    <div class="main-content">
      <el-row :gutter="20">
        <!-- 左侧统计 -->
        <el-col :span="6">
          <div class="stat-panel panel-box panel-equal-height">
            <div class="panel-title">预警趋势</div>
            <div class="trend-chart" ref="trendChartRef"></div>
          </div>
          <div class="type-panel panel-box panel-equal-height">
            <div class="panel-title">预警类型排名</div>
            <div v-loading="loading.types" class="type-list">
              <div v-for="(item, index) in warningTypes" :key="index" class="type-item">
                <span class="type-name">{{ item.name }}</span>
                <div class="type-bar">
                  <div class="bar-inner" :style="{ width: item.value + '%' }"></div>
                </div>
                <span class="type-count">{{ item.count }}个</span>
              </div>
            </div>
          </div>
        </el-col>

        <!-- 中间预警图片查看器 -->
        <el-col :span="12">
          <div class="map-panel panel-box">
            <!-- 预警图片查看器 -->
            <div class="warning-viewer">
              <!-- 主要显示区域 -->
              <div class="main-image-container">
                <img
                  :src="currentWarningImage.image"
                  :alt="currentWarningImage.event"
                  class="main-warning-image"
                />

                <!-- 顶部信息叠加层 -->
                <div class="top-info-overlay">
                  <div class="info-card warning-info-card">
                    <div class="info-icon warning-icon">
                  <i class="el-icon-warning"></i>
                </div>
                    <div class="info-content">
                      <div class="info-title">今日预警</div>
                      <div class="info-number">{{ todayWarnings }}<span class="info-unit">个</span></div>
                </div>
              </div>
                  <div class="info-card device-info-card">
                    <div class="info-icon device-icon">
                  <i class="el-icon-video-camera-solid"></i>
                </div>
                    <div class="info-content">
                      <div class="info-title">设备概览</div>
                      <div class="info-number">{{ deviceCount }}/{{ totalDevices }}</div>
                </div>
              </div>
                </div>

                <!-- 预警信息叠加层 -->
                <div class="warning-info-overlay">
                  <div class="warning-info-panel">
                    <div class="info-row">
                      <span class="info-label">预警时间：</span>
                      <span class="info-value">{{ currentWarningImage.time }}</span>
                </div>
                    <div class="info-row">
                      <span class="info-label">预警事件：</span>
                      <span class="info-value">{{ currentWarningImage.event }}</span>
              </div>
                    <div class="info-row">
                      <span class="info-label">预警等级：</span>
                      <span class="info-value" :class="'level-' + currentWarningImage.level">{{ currentWarningImage.levelText }}</span>
                </div>
                    <div class="info-row">
                      <span class="info-label">预警点位：</span>
                      <span class="info-value">{{ currentWarningImage.location }}</span>
                </div>
              </div>
            </div>
                </div>

              <!-- 底部缩略图滑动区域 -->
              <div class="thumbnail-container-bottom">
                <!-- 左侧导航按钮 -->
                <button
                  class="slider-btn prev-btn"
                  @click="slidePrev"
                  :disabled="currentImageIndex === 0"
                >
                  <i class="el-icon-arrow-left"></i>
                </button>

                <!-- 中间滑动区域 -->
                <div class="thumbnail-slider" ref="thumbnailSlider">
                  <div
                    v-for="(warning, index) in warningImages"
                    :key="index"
                    :class="['thumbnail-item', { active: currentImageIndex === index }]"
                    @click="selectWarningImage(index)"
                  >
                    <img :src="warning.image" :alt="warning.event" />
                </div>
              </div>

                <!-- 右侧导航按钮 -->
                <button
                  class="slider-btn next-btn"
                  @click="slideNext"
                  :disabled="currentImageIndex === warningImages.length - 1"
                >
                  <i class="el-icon-arrow-right"></i>
                </button>
            </div>
            </div>
          </div>
        </el-col>

        <!-- 右侧统计 -->
        <el-col :span="6">
          <div class="level-panel panel-box panel-equal-height">
            <div class="panel-title">预警等级占比</div>
            <div class="level-chart" ref="levelChartRef"></div>
          </div>
          <div class="top-panel panel-box panel-equal-height">
            <div class="panel-title">组织预警 Top 5</div>
            <div v-loading="loading.locations" class="top-list">
              <div v-for="(item, index) in topWarnings" :key="index" class="top-item">
                <span class="item-name">{{ item.name }}</span>
                <div class="item-bar">
                  <div class="bar-inner" :style="{ width: item.value + '%' }"></div>
                </div>
                <span class="item-count">{{ item.count }}个</span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 底部表格 -->
      <el-row class="bottom-section" :gutter="20">
        <el-col :span="6">
          <div class="status-panel panel-box panel-bottom-equal-height">
            <div class="panel-title">预警处理情况</div>
            <div class="status-tabs">
              <div
                v-for="(label, key) in { day: '本日', week: '本周', month: '本月' }"
                :key="key"
                :class="['tab-item', { active: statusTimeRange === key }]"
                @click="changeStatusTimeRange(key as 'day' | 'week' | 'month')"
              >
                {{ label }}
              </div>
            </div>
            <div class="status-chart" ref="statusChartRef"></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="list-panel panel-box panel-bottom-equal-height">
            <div class="panel-title">预警记录</div>
            <div class="warning-table">
              <el-table
                :data="warningList"
                style="width: 100%"
                :header-cell-style="headerCellStyle"
                :cell-style="{ background: 'transparent', color: '#7EAEE5', borderBottom: '1px solid rgba(35, 88, 148, 0.3)' }"
                :row-style="{ background: 'transparent' }"
                :row-class-name="'transparent-row'"
                :height="tableHeight">
                <el-table-column prop="event" label="预警事件" min-width="120" />
                <el-table-column prop="time" label="预警时间" width="180" />
                <el-table-column prop="status" label="处理状态" width="120">
                  <template #default="scope">
                    <span :class="['status-tag', scope.row.status]">{{ scope.row.statusText }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="device-panel panel-box panel-bottom-equal-height">
            <div class="panel-title">设备预警数量 Top 10</div>
            <div class="device-tabs">
              <div
                v-for="(label, key) in { day: '本日', week: '本周', month: '本月' }"
                :key="key"
                :class="['tab-item', { active: deviceTimeRange === key }]"
                @click="changeDeviceTimeRange(key as 'day' | 'week' | 'month')"
              >
                {{ label }}
              </div>
            </div>

            <div class="device-table">
              <el-table
                :data="deviceWarnings"
                :header-cell-style="headerCellStyle"
                :cell-style="{ background: 'transparent', color: '#7EAEE5', borderBottom: '1px solid rgba(35, 88, 148, 0.3)' }"
                :row-style="{ background: 'transparent' }"
                :row-class-name="'transparent-row'"
                style="width: 100%"
                :height="tableHeight"
              >
                <el-table-column prop="name" label="设备位置" />
                <el-table-column prop="count" label="预警数量" align="center" width="100" />
              </el-table>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, nextTick } from 'vue';
import * as echarts from 'echarts';
import type { ECharts } from 'echarts';
import centerAPI from '@/api/center';

// ============================================================================
// 类型定义
// ============================================================================

interface LocationInfo {
  location: string;
  weather: string;
  airQuality: string;
  loading: boolean;
}

interface LoadingState {
  summary: boolean;
  trend: boolean;
  types: boolean;
  level: boolean;
  locations: boolean;
  processing: boolean;
  deviceStatus: boolean;
  warningList: boolean;
  warningImages: boolean;
}

interface WarningType {
  name: string;
  count: number;
  value: number;
  color?: string;
}

interface TopWarning {
  name: string;
  count: number;
  value: number;
}

interface WarningImage {
  id: number;
  image: string;
  event: string;
  time: string;
  alert_time: string;
  level: string;
  levelText: string;
  location: string;
  camera_name: string;
}

interface CurrentWarningImage {
  image: string;
  event: string;
  time: string;
  level: string;
  levelText: string;
  location: string;
}

interface WarningListItem {
  event: string;
  time: string;
  status: string;
  statusText: string;
}

interface DeviceWarning {
  name: string;
  count: number;
}

interface StatusDataItem {
  value: number;
  name: string;
  itemStyle?: { color: string };
}

interface TrendData {
  timeLabels: string[];
  dataPoints: number[];
}

type TimeRange = 'day' | 'week' | 'month';

// ============================================================================
// 响应式状态
// ============================================================================

// 系统状态数据
const todayWarnings = ref<number>(0);
const deviceCount = ref<number>(0);
const totalDevices = ref<number>(0);
const currentDetailTime = ref<string>('');
const currentEvent = ref<string>('');
const currentDevice = ref<string>('');

// 天气和位置信息
const locationInfo = reactive<LocationInfo>({
  location: '',
  weather: '',
  airQuality: '',
  loading: true
});

// 加载状态
const loading = reactive<LoadingState>({
  summary: false,
  trend: false,
  types: false,
  level: false,
  locations: false,
  processing: false,
  deviceStatus: false,
  warningList: false,
  warningImages: false
});

// 全屏状态
const isFullscreen = ref<boolean>(false);

// 表格样式
const headerCellStyle = {
  background: 'linear-gradient(180deg, rgba(6, 30, 93, 0.9) 0%, rgba(4, 20, 63, 1) 100%)',
  color: '#00FFFF',
  borderBottom: '1px solid rgba(0, 255, 255, 0.3)',
  fontWeight: 'normal',
  padding: '12px 0',
  textShadow: '0 0 10px rgba(0, 255, 255, 0.3)'
};

// 预警类型数据
const warningTypes = ref<WarningType[]>([]);

// 图表引用
const trendChartRef = ref<HTMLElement | null>(null);
const levelChartRef = ref<HTMLElement | null>(null);
const statusChartRef = ref<HTMLElement | null>(null);
const thumbnailSlider = ref<HTMLElement | null>(null);
const visualCenter = ref<HTMLElement | null>(null);

let trendChart: ECharts | null = null;
let levelChart: ECharts | null = null;
let statusChart: ECharts | null = null;

// 预警列表
const warningList = ref<WarningListItem[]>([]);

// 设备预警
const deviceWarnings = ref<DeviceWarning[]>([]);

// 时间范围
const statusTimeRange = ref<TimeRange>('day');
const deviceTimeRange = ref<TimeRange>('day');

// 组织预警Top5
const topWarnings = ref<TopWarning[]>([]);

// 表格高度
const tableHeight = ref<number>(280);

// 预警图片相关数据
const currentWarningImage = ref<CurrentWarningImage>({
  image: '',
  event: '',
  time: '',
  level: '',
  levelText: '',
  location: ''
});
const warningImages = ref<WarningImage[]>([]);
const currentImageIndex = ref<number>(0);

// 预警趋势数据
const trendData = ref<TrendData>({
  timeLabels: [],
  dataPoints: []
});

// 定时器
let weatherTimer: number | null = null;
let dataRefreshTimer: number | null = null;
let timeTimer: number | null = null;

// ============================================================================
// 工具方法
// ============================================================================

/**
 * 将MinIO URL转换为本地静态文件路径（开发环境）
 * 用于在开发环境中使用本地图片替代MinIO
 */
function convertMinIOUrlToLocal(minioUrl: string): string {
  if (!minioUrl) {
    // 没有URL时返回默认图片
    return new URL('../monitoringWarning/images/1.jpg', import.meta.url).href;
  }

  // 开发环境：如果后端返回空字符串或无效URL，使用本地图片
  if (process.env.NODE_ENV === 'development') {
    // 本地测试图片列表
    const localImages = [
      new URL('../monitoringWarning/images/1.jpg', import.meta.url).href,
      new URL('../monitoringWarning/images/2.jpg', import.meta.url).href,
      new URL('../monitoringWarning/images/3.jpg', import.meta.url).href,
      new URL('../monitoringWarning/images/4.jpg', import.meta.url).href,
      new URL('../monitoringWarning/images/5.jpg', import.meta.url).href,
      new URL('../monitoringWarning/images/6.jpg', import.meta.url).href
    ];

    // 如果MinIO URL为空或无法访问，返回本地图片
    if (!minioUrl || minioUrl === '' || minioUrl.includes('192.168.0.14:9000')) {
      return localImages[Math.floor(Math.random() * localImages.length)];
    }

    // 生产环境或有效URL，保持原样
    return minioUrl;
  }

  // 生产环境保持原URL
  return minioUrl;
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

// ============================================================================
// 数据加载方法
// ============================================================================

/**
 * 加载所有统计数据
 */
async function loadAllStatistics(): Promise<void> {
  try {
    await Promise.all([
      loadSummaryData(),
      loadTrendData(),
      loadTypesData(),
      loadLevelData(),
      loadLocationsData(),
      loadProcessingStatusData(),
      loadDeviceWarningsData(),
      loadWarningImagesData(),
      loadWarningListData()
    ]);
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
}

/**
 * 加载预警统计摘要
 */
async function loadSummaryData(): Promise<void> {
  loading.summary = true;
  try {
    const response = await centerAPI.alertStatistics.getSummary('day');
    if (response.data?.code === 0 && response.data?.data) {
      const data = response.data.data;
      todayWarnings.value = data.total_alerts || 0;
      deviceCount.value = data.online_devices || 0;
      totalDevices.value = data.total_devices || 0;
    }
  } catch (error) {
    console.error('加载预警统计摘要失败:', error);
  } finally {
    loading.summary = false;
  }
}

/**
 * 加载预警趋势数据
 */
async function loadTrendData(): Promise<void> {
  loading.trend = true;
  try {
    const response = await centerAPI.alertStatistics.getTrend('24h', '1h');
    if (response.data?.code === 0 && response.data?.data) {
      const data = response.data.data;
      trendData.value = {
        timeLabels: data.time_labels || [],
        dataPoints: data.trend_data || []
      };
      // 更新趋势图表
      if (trendChart) {
        updateTrendChart(data.time_labels || [], data.trend_data || []);
      }
    }
  } catch (error) {
    console.error('加载预警趋势失败:', error);
  } finally {
    loading.trend = false;
  }
}

/**
 * 加载预警类型数据
 */
async function loadTypesData(): Promise<void> {
  loading.types = true;
  try {
    const response = await centerAPI.alertStatistics.getByType('day');
    if (response.data?.code === 0 && response.data?.data) {
      warningTypes.value = response.data.data.map((item: any) => ({
        name: item.name,
        count: item.count,
        value: item.value,
        color: item.color
      }));
    }
  } catch (error) {
    console.error('加载预警类型失败:', error);
  } finally {
    loading.types = false;
  }
}

/**
 * 加载预警等级数据
 */
async function loadLevelData(): Promise<void> {
  loading.level = true;
  try {
    const response = await centerAPI.alertStatistics.getByLevel('day');
    if (response.data?.code === 0 && response.data?.data) {
      // 更新等级图表
      if (levelChart) {
        updateLevelChart(response.data.data);
      }
    }
  } catch (error) {
    console.error('加载预警等级失败:', error);
  } finally {
    loading.level = false;
  }
}

/**
 * 加载预警位置数据
 */
async function loadLocationsData(): Promise<void> {
  loading.locations = true;
  try {
    const response = await centerAPI.alertStatistics.getByLocation('day', 5);
    if (response.data?.code === 0 && response.data?.data) {
      topWarnings.value = response.data.data.map((item: any) => ({
        name: item.name,
        count: item.count,
        value: item.value
      }));
    }
  } catch (error) {
    console.error('加载预警位置失败:', error);
  } finally {
    loading.locations = false;
  }
}

/**
 * 加载预警处理情况数据
 */
async function loadProcessingStatusData(): Promise<void> {
  loading.processing = true;
  try {
    const response = await centerAPI.alertStatistics.getProcessingStatus(statusTimeRange.value);
    if (response.data?.code === 0 && response.data?.data) {
      // 更新状态图表
      if (statusChart) {
        updateStatusChart(response.data.data);
      }
    }
  } catch (error) {
    console.error('加载预警处理情况失败:', error);
  } finally {
    loading.processing = false;
  }
}

/**
 * 加载设备预警数据
 */
async function loadDeviceWarningsData(): Promise<void> {
  loading.deviceStatus = true;
  try {
    const response = await centerAPI.alertStatistics.getByLocation(deviceTimeRange.value, 10);
    if (response.data?.code === 0 && response.data?.data) {
      deviceWarnings.value = response.data.data.map((item: any) => ({
        name: item.name,
        count: item.count
      }));
    }
  } catch (error) {
    console.error('加载设备预警失败:', error);
  } finally {
    loading.deviceStatus = false;
  }
}

/**
 * 加载预警图片数据
 */
async function loadWarningImagesData(): Promise<void> {
  loading.warningImages = true;
  try {
    const response = await centerAPI.alertStatistics.getLatestImages(10);
    if (response.data?.code === 0 && response.data?.data) {
      // 转换MinIO URL为本地路径
      const images = response.data.data.map((item: any) => ({
        ...item,
        image: convertMinIOUrlToLocal(item.image)
      }));

      warningImages.value = images;
      if (images.length > 0) {
        currentWarningImage.value = {
          image: images[0].image,
          event: images[0].event,
          time: images[0].time,
          level: images[0].level,
          levelText: images[0].levelText,
          location: images[0].location
        };
        currentImageIndex.value = 0;
      }
    }
  } catch (error) {
    console.error('加载预警图片失败:', error);
  } finally {
    loading.warningImages = false;
  }
}

/**
 * 加载预警列表数据
 */
async function loadWarningListData(): Promise<void> {
  loading.warningList = true;
  try {
    // 使用 alertAPI 获取预警列表
    const response = await centerAPI.alert.getRealTimeAlerts({ page: 1, limit: 10 });
    if (response.data?.code === 0 && response.data?.data) {
      warningList.value = response.data.data.map((item: any) => ({
        event: item.alert_name || item.name || '未知预警',
        time: item.alert_time || item.time || '',
        status: item.status || 'pending',
        statusText: getStatusText(item.status)
      }));
    }
  } catch (error) {
    console.error('加载预警列表失败:', error);
    // 使用模拟数据作为后备
    warningList.value = [
      { event: '未戴安全帽', time: '2024-01-15 10:30:25', status: 'pending', statusText: '待处理' },
      { event: '未穿工作服', time: '2024-01-15 10:28:15', status: 'pending', statusText: '待处理' },
      { event: '闲杂人员', time: '2024-01-15 10:15:42', status: 'pending', statusText: '待处理' },
      { event: '违规吸烟', time: '2024-01-15 09:58:30', status: 'completed', statusText: '已完成' },
      { event: '高空作业未系安全带', time: '2024-01-15 09:45:12', status: 'pending', statusText: '待处理' }
    ];
  } finally {
    loading.warningList = false;
  }
}

/**
 * 获取状态文本
 */
function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': '待处理',
    'processing': '处理中',
    'completed': '已完成'
  };
  return statusMap[status] || '未知';
}

/**
 * 获取天气数据
 */
async function fetchWeatherData(): Promise<void> {
  locationInfo.loading = true;
  try {
    // 使用模拟数据
    locationInfo.location = '太行工业园区';
    locationInfo.weather = '晴 26°C';
    locationInfo.airQuality = '空气质量: 良';
  } catch (error) {
    console.error('获取天气数据失败:', error);
    locationInfo.location = '太行工业园区';
    locationInfo.weather = '晴 26°C';
  } finally {
    locationInfo.loading = false;
  }
}

// ============================================================================
// 图表初始化方法
// ============================================================================

/**
 * 初始化趋势图表
 */
function initTrendChart(): void {
  if (!trendChartRef.value) return;

  trendChart = echarts.init(trendChartRef.value);

  const option = {
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
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
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
        data: [3, 5, 10, 14, 12, 7, 5],
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

  trendChart.setOption(option);
}

/**
 * 更新趋势图表
 */
function updateTrendChart(timeLabels: string[], dataPoints: number[]): void {
  if (!trendChart) return;

  trendChart.setOption({
    xAxis: {
      data: timeLabels
    },
    series: [
      {
        data: dataPoints
      }
    ]
  });
}

/**
 * 初始化等级图表
 */
function initLevelChart(): void {
  if (!levelChartRef.value) return;

  levelChart = echarts.init(levelChartRef.value);

  const option = {
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
    color: ['#FF4D4F', '#FF8746', '#44FF9B', '#00C5FF'],
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
        data: [
          { value: 8, name: '紧急' },
          { value: 15, name: '重要' },
          { value: 21, name: '普通' },
          { value: 11, name: '提示' }
        ]
      }
    ]
  };

  levelChart.setOption(option);
}

/**
 * 更新等级图表
 */
function updateLevelChart(data: any[]): void {
  if (!levelChart) return;

  levelChart.setOption({
    series: [
      {
        data: data
      }
    ]
  });
}

/**
 * 初始化状态图表
 */
function initStatusChart(): void {
  if (!statusChartRef.value) return;

  statusChart = echarts.init(statusChartRef.value);

  const option = {
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
        data: [
          { value: 5, name: '待处理', itemStyle: { color: '#FF8746' } },
          { value: 3, name: '处理中', itemStyle: { color: '#44FF9B' } },
          { value: 12, name: '已完成', itemStyle: { color: '#00FFFF' } }
        ]
      }
    ]
  };

  statusChart.setOption(option);
}

/**
 * 更新状态图表
 */
function updateStatusChart(data: StatusDataItem[]): void {
  if (!statusChart) return;

  statusChart.setOption({
    series: [
      {
        data: data
      }
    ]
  });
}

// ============================================================================
// 预警图片查看器方法
// ============================================================================

/**
 * 初始化预警图片查看器
 */
function initWarningViewer(): void {
  document.addEventListener('keydown', handleKeyboardNavigation);
}

/**
 * 处理键盘导航
 */
function handleKeyboardNavigation(event: KeyboardEvent): void {
  if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) {
    return;
  }

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault();
      slidePrev();
      break;
    case 'ArrowRight':
      event.preventDefault();
      slideNext();
      break;
    case 'Escape':
      event.preventDefault();
      break;
  }
}

/**
 * 选择预警图片
 */
function selectWarningImage(index: number): void {
  currentImageIndex.value = index;
  const warning = warningImages.value[index];
  if (warning) {
    currentWarningImage.value = {
      image: warning.image,
      event: warning.event,
      time: warning.time,
      level: warning.level,
      levelText: warning.levelText,
      location: warning.location
    };
    scrollToThumbnail(index);
  }
}

/**
 * 滚动到缩略图
 */
function scrollToThumbnail(index: number): void {
  if (!thumbnailSlider.value) return;

  const thumbnailItem = thumbnailSlider.value.children[index];
  if (thumbnailItem) {
    thumbnailItem.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  }
}

/**
 * 上一张图片
 */
function slidePrev(): void {
  if (currentImageIndex.value > 0) {
    selectWarningImage(currentImageIndex.value - 1);
  }
}

/**
 * 下一张图片
 */
function slideNext(): void {
  if (currentImageIndex.value < warningImages.value.length - 1) {
    selectWarningImage(currentImageIndex.value + 1);
  }
}

// ============================================================================
// 其他交互方法
// ============================================================================

/**
 * 切换状态时间范围
 */
function changeStatusTimeRange(range: TimeRange): void {
  statusTimeRange.value = range;
  loadProcessingStatusData();
}

/**
 * 切换设备时间范围
 */
function changeDeviceTimeRange(range: TimeRange): void {
  deviceTimeRange.value = range;
  loadDeviceWarningsData();
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

/**
 * 处理窗口大小变化
 */
function handleResize(): void {
  if (trendChart) trendChart.resize();
  if (levelChart) levelChart.resize();
  if (statusChart) statusChart.resize();
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

  // 加载所有统计数据
  loadAllStatistics();

  // 设置定时器
  weatherTimer = window.setInterval(fetchWeatherData, 5 * 60 * 1000);
  dataRefreshTimer = window.setInterval(loadAllStatistics, 30 * 1000);
  timeTimer = window.setInterval(updateCurrentTime, 1000);

  // 监听全屏变化
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement;
    if (isFullscreen.value) {
      tableHeight.value = 280;
      document.documentElement.style.setProperty('--panel-top-height', '240px');
      document.documentElement.style.setProperty('--panel-bottom-height', '320px');
    } else {
      tableHeight.value = 280;
      document.documentElement.style.setProperty('--panel-top-height', '24vh');
      document.documentElement.style.setProperty('--panel-bottom-height', '36vh');
    }
    setTimeout(() => {
      if (trendChart) trendChart.resize();
      if (levelChart) levelChart.resize();
      if (statusChart) statusChart.resize();
    }, 300);
  });

  // 初始化图表
  nextTick(() => {
    initTrendChart();
    initLevelChart();
    initStatusChart();
    initWarningViewer();
  });

  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  // 清理定时器
  if (weatherTimer) clearInterval(weatherTimer);
  if (dataRefreshTimer) clearInterval(dataRefreshTimer);
  if (timeTimer) clearInterval(timeTimer);

  // 移除事件监听
  document.removeEventListener('fullscreenchange', () => {});
  document.removeEventListener('keydown', handleKeyboardNavigation);
  window.removeEventListener('resize', handleResize);

  // 销毁图表
  if (trendChart) trendChart.dispose();
  if (levelChart) levelChart.dispose();
  if (statusChart) statusChart.dispose();
});
</script>

<style scoped>
/* Vue2项目中使用普通CSS样式 */
:root {
  --panel-top-height: 24vh;
  --panel-bottom-height: 36vh;
}

/* 全局隐藏滚动条样式 */
* {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}

*::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.visual-center {
  height: 100%;
  background: linear-gradient(135deg, #001529 0%, #000B18 100%);
  color: #fff;
  padding: 16px;
  margin: 0;
  position: relative;
  overflow-x: hidden; /* 隐藏水平滚动条 */
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  position: relative;
  z-index: 2;
  padding: 0 20px;
  height: 30px;
}

.top-bar .time {
  width: 300px;
  font-size: 18px;
  font-weight: bold;
  color: #00ffff;
  white-space: nowrap;
  line-height: 1;
}

.top-bar .title {
  flex: 1;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

.top-bar .title span {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
  position: relative;
}

.top-bar .title span::before,
.top-bar .title span::after {
  content: '';
  position: absolute;
  height: 2px;
  width: 70px;
  background: linear-gradient(90deg, transparent, #00ffff, transparent);
  top: 50%;
}

.top-bar .title span::before {
  right: calc(100% + 15px);
}

.top-bar .title span::after {
  left: calc(100% + 15px);
}

.right-controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 20px;
  flex: 0 0 auto;
  width: 300px;
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
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(6, 30, 93, 0.8);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 4px;
  color: #00FFFF;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.fullscreen-btn:hover {
  background: rgba(0, 30, 60, 0.7);
  border-color: rgba(0, 255, 255, 0.6);
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
}

.panel-box {
  background: linear-gradient(180deg, rgba(6, 30, 93, 0.8) 0%, rgba(4, 20, 63, 0.9) 100%);
  border: 1px solid rgba(35, 88, 148, 0.5);
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
  position: relative;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.panel-title {
  color: #00FFFF;
  font-size: 16px;
  margin-bottom: 8px;
  padding-left: 10px;
  border-left: 3px solid #00FFFF;
  text-align: left;
}

.panel-equal-height {
  height: var(--panel-top-height);
  overflow: hidden;
}

.panel-bottom-equal-height {
  height: var(--panel-bottom-height);
  overflow: hidden;
}

.map-panel {
  height: calc(var(--panel-top-height) + 52px + var(--panel-top-height) - 30px);
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
}

.trend-chart,
.level-chart,
.status-chart {
  height: calc(100% - 20px);
  width: 100%;
  position: relative;
  flex: 1;
}

.type-list,
.top-list {
  height: calc(100% - 20px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.type-list::-webkit-scrollbar,
.top-list::-webkit-scrollbar {
  display: none;
}

.type-item, .top-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.type-name, .item-name {
  width: 100px;
  color: #7EAEE5;
}

.type-bar, .item-bar {
  flex: 1;
  height: 6px;
  background: rgba(126, 174, 229, 0.1);
  margin: 0 10px;
  border-radius: 3px;
  overflow: hidden;
}

.bar-inner {
  height: 100%;
  background: #00FFFF;
  border-radius: 3px;
}

.type-count, .item-count {
  width: 50px;
  text-align: right;
  color: #7EAEE5;
}

.status-tabs,
.device-tabs {
  display: flex;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(0, 255, 255, 0.2);
}

.tab-item {
  padding: 8px 12px;
  cursor: pointer;
  color: #7EAEE5;
  font-size: 13px;
  position: relative;
  transition: all 0.3s ease;
}

.tab-item.active {
  color: #00FFFF;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #00FFFF;
}

.warning-table,
.device-table {
  height: calc(100% - 40px);
  flex: 1;
  overflow: hidden;
}

.warning-table {
  height: calc(100% - 10px) !important;
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;
  line-height: 1.5;
  text-align: center;
  min-width: 52px;
}

.status-tag.pending {
  color: #ff8746;
  background: rgba(255, 135, 70, 0.1);
  border: 1px solid rgba(255, 135, 70, 0.3);
}

.status-tag.processing {
  color: #44ff9b;
  background: rgba(68, 255, 155, 0.1);
  border: 1px solid rgba(68, 255, 155, 0.3);
}

.status-tag.completed {
  color: #00ffff;
  background: rgba(0, 255, 255, 0.1);
  border: 1px solid rgba(0, 255, 255, 0.3);
}

/* 预警图片查看器样式 */
.warning-viewer {
  height: 100%;
  background: transparent;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.main-image-container {
  flex: 1;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  height: calc(100% - 160px);
  border-radius: 25px;
  padding: 15px;
}

.main-warning-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: transparent;
  transition: opacity 0.3s ease;
  aspect-ratio: 4/3;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.warning-info-overlay {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px 15px;
  min-width: 200px;
  max-width: 280px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  animation: slideInRight 0.3s ease-out;
  z-index: 10;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.warning-info-panel {
  background: transparent;
  padding: 0;
  border-radius: 0;
  max-width: 100%;
  max-height: 100%;
  overflow: visible;
  text-align: left;
}

.info-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 6px;
  font-size: 13px;
  text-align: left;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #7EAEE5;
  font-weight: normal;
  white-space: nowrap;
  min-width: 70px;
  text-align: left;
}

.info-value {
  color: #FFFFFF;
  margin-left: 8px;
  flex: 1;
  text-align: left;
  word-break: break-word;
}

.info-value.level-urgent {
  color: #FF4D4F;
  font-weight: bold;
}

.info-value.level-high {
  color: #FF8746;
  font-weight: bold;
}

.info-value.level-medium {
  color: #44FF9B;
}

.info-value.level-low {
  color: #00FFFF;
}

.thumbnail-container-bottom {
  height: 100px;
  background: transparent;
  backdrop-filter: none;
  border-top: none;
  display: flex;
  align-items: center;
  padding: 0 20px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
  gap: 15px;
}

.thumbnail-slider {
  display: flex;
  align-items: center;
  gap: 20px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  flex: 1;
  padding: 15px 0;
  scroll-behavior: smooth;
}

.slider-btn {
  width: 45px;
  height: 45px;
  background: rgba(0, 255, 255, 0.15);
  border: 2px solid rgba(0, 255, 255, 0.4);
  border-radius: 50%;
  color: #00FFFF;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.slider-btn:hover:not(:disabled) {
  background: rgba(0, 255, 255, 0.25);
  border-color: rgba(0, 255, 255, 0.8);
  transform: scale(1.15);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.4);
}

.slider-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none;
}

.thumbnail-slider::-webkit-scrollbar {
  display: none;
}

.thumbnail-item {
  flex-shrink: 0;
  width: 110px;
  height: 62px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 3px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
  position: relative;
  background: transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.thumbnail-item:hover {
  border-color: rgba(0, 255, 255, 0.8);
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(0, 255, 255, 0.3);
}

.thumbnail-item.active {
  border-color: #00FFFF;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.6);
  transform: scale(1.08);
}

.thumbnail-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: transparent;
  aspect-ratio: 16/9;
}

/* 顶部信息叠加层样式 */
.top-info-overlay {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  z-index: 15;
  pointer-events: none;
}

.info-card {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
  pointer-events: auto;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.info-card:hover {
  background: rgba(0, 0, 0, 0.6);
  border-color: rgba(0, 255, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 255, 255, 0.2);
}

.info-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.warning-icon {
  background: linear-gradient(135deg, #FF4D4F, #FF8746);
  color: #fff;
  box-shadow: 0 0 10px rgba(255, 77, 79, 0.4);
}

.device-icon {
  background: linear-gradient(135deg, #00FFFF, #00C5FF);
  color: #fff;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.4);
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-title {
  font-size: 12px;
  color: #7EAEE5;
  opacity: 0.9;
  line-height: 1;
}

.info-number {
  font-size: 18px;
  font-weight: bold;
  color: #00FFFF;
  line-height: 1;
}

.info-unit {
  font-size: 12px;
  color: #7EAEE5;
  opacity: 0.8;
  margin-left: 2px;
}

/* 表格透明样式 */
.transparent-row {
  background-color: transparent !important;
}

.warning-table :deep(.el-table),
.device-table :deep(.el-table) {
  background-color: transparent;
  color: #7EAEE5;
  scrollbar-width: none;
  -ms-overflow-style: none;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

.warning-table :deep(.el-table::-webkit-scrollbar),
.device-table :deep(.el-table::-webkit-scrollbar) {
  display: none;
}

.warning-table :deep(.el-table__body-wrapper),
.device-table :deep(.el-table__body-wrapper) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.warning-table :deep(.el-table) tr,
.device-table :deep(.el-table) tr {
  background-color: transparent !important;
}

.warning-table :deep(.el-table--enable-row-hover) .el-table__body tr:hover > td,
.device-table :deep(.el-table--enable-row-hover) .el-table__body tr:hover > td {
  background-color: rgba(0, 255, 255, 0.1) !important;
}
</style>
