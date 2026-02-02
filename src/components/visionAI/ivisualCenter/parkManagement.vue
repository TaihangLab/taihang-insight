<template>
  <div class="park-management">
    <!-- 标题区域 -->
    <div class="header-box">
      <div class="header-wrapper">
        <!-- 左侧装饰 -->
        <div class="left-decoration">
          <div class="decoration-line-group">
            <div class="decoration-line line1"></div>
            <div class="decoration-line line2"></div>
            <div class="decoration-line line3"></div>
          </div>
        </div>

        <!-- 中间标题 -->
        <div class="title-container">
          <div class="title-wrapper">
            <div class="title-text">园区封闭管理平台</div>
          </div>
        </div>

        <!-- 右侧装饰 -->
        <div class="right-decoration">
          <div class="decoration-line-group">
            <div class="decoration-line line1"></div>
            <div class="decoration-line line2"></div>
            <div class="decoration-line line3"></div>
          </div>
          <!-- 全屏按钮 -->
          <div class="fullscreen-btn" @click="toggleFullScreen">
            <i :class="isFullScreen ? 'el-icon-close' : 'el-icon-full-screen'"></i>
          </div>
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="main-content">
        <!-- 左侧面板 -->
        <div class="left-panel">
          <!-- 设备树状图 -->
          <div class="panel device-panel">
            <div class="panel-header">
              <span>设备树状图</span>
            </div>
            <div class="device-tree">
              <el-tree
                :data="treeData"
                :props="defaultProps"
                node-key="id"
                :default-expanded-keys="['1']"
                class="custom-tree"
              >
              </el-tree>
            </div>
          </div>

          <!-- CPU使用率 -->
          <div class="panel cpu-panel">
            <div class="panel-header">
              <span>内存/CPU</span>
            </div>
            <div id="cpuChart" class="chart-container"></div>
          </div>

          <!-- 存储使用 -->
          <div class="panel storage-panel">
            <div class="panel-header">
              <span>存储使用</span>
            </div>
            <div id="storageChart" class="chart-container"></div>
          </div>
        </div>

        <!-- 中间视频区域 -->
        <div class="center-panel">
          <div class="video-container">
            <div class="panel-header">
              <span>实时画面</span>
              <div class="screen-controls">
                <span>分屏：</span>
                <i class="el-icon-menu active"></i>
                <i class="el-icon-s-grid"></i>
              </div>
            </div>
            <div class="video-grid">
              <div v-for="i in 4" :key="i" class="video-item">
                <div class="video-content">
                  <div class="video-placeholder">
                    <div class="placeholder-icon">
                      <i class="el-icon-video-camera"></i>
                    </div>
                    <div class="placeholder-text">无视频信号</div>
                    <div class="placeholder-hint">请配置视频通道</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧预警区域 -->
        <div class="right-panel">
          <div class="panel alert-panel">
            <div class="panel-header">
              <span>预警抓拍</span>
            </div>
            <div class="alert-list">
              <div v-for="(alert, index) in alertSnapshots" :key="index" class="alert-item">
                <div class="category-label">{{ alert.category }}</div>
                <div class="alert-image-container">
                  <img :src="alert.image" alt="预警抓拍">
                </div>
                <div class="alert-info single-line">
                  <div class="info-content">
                    <p>抓拍时间: {{ alert.time }}</p>
                    <p>布点名称: {{ alert.location }}</p>
                  </div>
                  <div class="view-btn">
                    <span class="view-large" @click="showLargeImage(alert)">查看大图</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部状态区域 -->
      <div class="bottom-container">
        <div class="bottom-area">
          <!-- 设备状态 -->
          <div class="panel status-panel">
            <div class="panel-header">
              <span>设备状态</span>
            </div>
            <div class="status-content">
              <div class="status-item">
                <div class="status-chart" id="status-chart-1"></div>
                <div class="status-text">
                  <p>总数量: {{ deviceStatus.total }}</p>
                  <p>在线: {{ deviceStatus.online }}</p>
                </div>
              </div>
              <div class="status-item">
                <div class="status-chart" id="status-chart-2"></div>
                <div class="status-text">
                  <p>总数量: {{ deviceStatus.total2 }}</p>
                  <p>在线: {{ deviceStatus.online2 }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 带宽使用 -->
          <div class="panel bandwidth-panel">
            <div class="panel-header">
              <span>带宽使用(Mbps)</span>
            </div>
            <div id="bandwidthChart" class="chart-container"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 大图查看模态框 -->
    <div class="modal-overlay" v-if="showModal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-title">
            <span :class="['category-badge', modalType]">{{ modalTitle }}</span>
          </div>
          <span class="close-modal" @click="closeModal">&times;</span>
        </div>
        <div class="modal-body">
          <img :src="largeImage" alt="大图查看">
        </div>
        <div class="modal-footer">
          <div class="info-row">
            <span class="info-label">抓拍时间:</span>
            <span class="info-value">{{ currentAlert.time }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">布点名称:</span>
            <span class="info-value">{{ currentAlert.location }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import type { ECharts } from 'echarts';
import centerAPI from '@/api/center';

// ============================================================================
// 类型定义
// ============================================================================

interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  status?: string;
}

interface AlertSnapshot {
  image: string;
  category: string;
  time: string;
  location: string;
  event?: string;
  level?: string;
}

interface DeviceStatus {
  total: number;
  online: number;
  total2: number;
  online2: number;
}

// ============================================================================
// 响应式状态
// ============================================================================

const isFullScreen = ref<boolean>(false);

// 设备树数据
const treeData = ref<TreeNode[]>([]);

const defaultProps = {
  children: 'children' as keyof TreeNode,
  label: 'label'
};

// 图表引用
const cpuChartRef = ref<HTMLElement | null>(null);
const storageChartRef = ref<HTMLElement | null>(null);
const bandwidthChartRef = ref<HTMLElement | null>(null);
let cpuChart: ECharts | null = null;
let storageChart: ECharts | null = null;
let bandwidthChart: ECharts | null = null;

// 预警抓拍数据
const alertSnapshots = ref<AlertSnapshot[]>([]);

// 模态框状态
const showModal = ref<boolean>(false);
const largeImage = ref<string>('');
const modalTitle = ref<string>('');
const modalType = ref<string>('');
const currentAlert = ref<AlertSnapshot>({
  image: '',
  category: '',
  time: '',
  location: ''
});

// 设备状态
const deviceStatus = ref<DeviceStatus>({
  total: 30,
  online: 27,
  total2: 27,
  online2: 18
});

// ============================================================================
// 数据加载方法
// ============================================================================

/**
 * 加载所有数据
 */
async function loadAllData(): Promise<void> {
  await Promise.all([
    loadDeviceTree(),
    loadResourceHistory(),
    loadStorageUsage(),
    loadBandwidthUsage(),
    loadAlertSnapshots(),
    loadDeviceStatus()
  ]);
}

/**
 * 加载设备树
 */
async function loadDeviceTree(): Promise<void> {
  try {
    const response = await centerAPI.deviceStatistics.getDeviceTree();
    // 响应拦截器已经提取了 data 字段，response 直接是数据对象
    if (response) {
      treeData.value = response;
    }
  } catch (error) {
    console.error('加载设备树失败:', error);
  }
}

/**
 * 加载资源历史数据（CPU/内存）
 */
async function loadResourceHistory(): Promise<void> {
  try {
    const response = await centerAPI.systemMonitor.getResourceHistory('cpu', '1h');
    // 响应拦截器已经提取了 data 字段，response 直接是数据对象
    if (response) {
      initCpuChart(response.time_labels || [], response.data_points || []);
    }
  } catch (error) {
    console.error('加载CPU数据失败:', error);
  }
}

/**
 * 加载存储使用情况
 */
async function loadStorageUsage(): Promise<void> {
  try {
    const response = await centerAPI.systemMonitor.getStorageUsage();
    // 响应拦截器已经提取了 data 字段，response 直接是数据对象
    if (response) {
      initStorageChart(response.storage_list || []);
    }
  } catch (error) {
    console.error('加载存储数据失败:', error);
  }
}

/**
 * 加载带宽使用情况
 */
async function loadBandwidthUsage(): Promise<void> {
  try {
    const response = await centerAPI.systemMonitor.getBandwidthUsage('1h');
    // 响应拦截器已经提取了 data 字段，response 直接是数据对象
    if (response) {
      initBandwidthChart(response.time_labels || [], response.upstream_bandwidth || [], response.downstream_bandwidth || []);
    }
  } catch (error) {
    console.error('加载带宽数据失败:', error);
  }
}

/**
 * 加载预警抓拍
 */
async function loadAlertSnapshots(): Promise<void> {
  try {
    const images = await centerAPI.alertStatistics.getLatestImages(4);
    if (images && images.length > 0) {
      alertSnapshots.value = images.map((item: any) => ({
        image: item.image_url || item.image,
        category: item.alert_type || '未知类型',
        time: item.alert_time || item.time,
        location: item.camera_name || item.location || '未知位置'
      }));
    } else {
      alertSnapshots.value = [];
    }
  } catch (error) {
    console.error('加载预警抓拍失败:', error);
    // 失败时使用空数组
    alertSnapshots.value = [];
  }
}

/**
 * 加载设备状态
 */
async function loadDeviceStatus(): Promise<void> {
  try {
    const response = await centerAPI.deviceStatistics.getStatusStatistics();
    // 响应拦截器已经提取了 data 字段，response 直接是数据对象
    if (response) {
      deviceStatus.value = {
        total: response.total_devices || 0,
        online: response.online_devices || 0,
        total2: response.device_groups?.[0]?.total || 0,
        online2: response.device_groups?.[0]?.online || 0
      };
      // 更新设备状态图表
      updateDeviceStatusCharts();
    }
  } catch (error) {
    console.error('加载设备状态失败:', error);
  }
}

// ============================================================================
// 图表初始化方法
// ============================================================================

/**
 * 初始化CPU图表
 */
function initCpuChart(timeLabels: string[], dataPoints: number[]): void {
  if (!document.getElementById('cpuChart')) return;

  cpuChart = echarts.init(document.getElementById('cpuChart'));

  const option = {
    grid: {
      left: '5%',
      right: '5%',
      top: '10%',
      bottom: '20%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: timeLabels,
      axisLine: {
        lineStyle: { stroke: '#1B96FF' }
      },
      axisLabel: {
        textStyle: { color: '#fff' }
      }
    },
    yAxis: {
      type: 'value',
      splitLine: {
        show: true,
        lineStyle: { stroke: 'rgba(27,150,255,0.1)' }
      },
      axisLine: {
        lineStyle: { stroke: '#1B96FF' }
      },
      axisLabel: {
        textStyle: { color: '#fff' }
      }
    },
    series: [{
      type: 'line',
      data: dataPoints,
      smooth: true,
      lineStyle: { stroke: '#1B96FF', width: 2 },
      areaStyle: { fill: 'rgba(27,150,255,0.3)' }
    }]
  };

  cpuChart.setOption(option);
}

/**
 * 初始化存储图表
 */
function initStorageChart(storageList: Array<{ name: string; usage: number; total: number }>): void {
  if (!document.getElementById('storageChart')) return;

  storageChart = echarts.init(document.getElementById('storageChart'));

  const option = {
    grid: {
      left: '5%',
      right: '5%',
      top: '10%',
      bottom: '20%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: storageList.map(item => item.name),
      axisLine: {
        lineStyle: { stroke: '#1B96FF' }
      },
      axisLabel: {
        textStyle: { color: '#fff' }
      }
    },
    yAxis: {
      type: 'value',
      splitLine: {
        show: true,
        lineStyle: { stroke: 'rgba(27,150,255,0.1)' }
      },
      axisLine: {
        lineStyle: { stroke: '#1B96FF' }
      },
      axisLabel: {
        textStyle: { color: '#fff' }
      }
    },
    series: [{
      type: 'bar',
      data: storageList.map(item => item.usage),
      barWidth: 20,
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(27,150,255,0.8)' },
            { offset: 1, color: 'rgba(27,150,255,0.3)' }
          ]
        }
      }
    }]
  };

  storageChart.setOption(option);
}

/**
 * 初始化带宽图表
 */
function initBandwidthChart(timeLabels: string[], upstreamData: number[], downstreamData: number[]): void {
  if (!document.getElementById('bandwidthChart')) return;

  bandwidthChart = echarts.init(document.getElementById('bandwidthChart'));

  const option = {
    grid: {
      left: '5%',
      right: '5%',
      top: '5%',
      bottom: '20%',
      containLabel: true
    },
    legend: {
      data: ['上行带宽', '下行带宽'],
      textStyle: { fill: '#fff' },
      right: 0,
      top: 0
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: timeLabels,
      axisLine: {
        lineStyle: { stroke: '#1B96FF' }
      },
      axisLabel: {
        textStyle: { color: '#fff' }
      }
    },
    yAxis: {
      type: 'value',
      splitLine: {
        show: true,
        lineStyle: { stroke: 'rgba(27,150,255,0.1)' }
      },
      axisLine: {
        lineStyle: { stroke: '#1B96FF' }
      },
      axisLabel: {
        textStyle: { color: '#fff' }
      }
    },
    series: [
      {
        name: '上行带宽',
        type: 'line',
        data: upstreamData,
        smooth: true,
        lineStyle: { stroke: '#1B96FF' }
      },
      {
        name: '下行带宽',
        type: 'line',
        data: downstreamData,
        smooth: true,
        lineStyle: { stroke: '#FFD700' }
      }
    ]
  };

  bandwidthChart.setOption(option);
}

/**
 * 更新设备状态图表
 */
function updateDeviceStatusCharts(): void {
  const chart1Element = document.getElementById(`status-chart-0`);
  const chart2Element = document.getElementById(`status-chart-2`);

  if (chart1Element) {
    const chart1 = echarts.init(chart1Element);
    chart1.setOption({
      series: [{
        type: 'pie',
        radius: ['60%', '70%'],
        data: [
          { name: '在线', value: deviceStatus.value.online },
          { name: '离线', value: deviceStatus.value.total - deviceStatus.value.online }
        ]
      }]
    });
  }

  if (chart2Element) {
    const chart2 = echarts.init(chart2Element);
    chart2.setOption({
      series: [{
        type: 'pie',
        radius: ['60%', '70%'],
        data: [
          { name: '在线', value: deviceStatus.value.online2 },
          { name: '离线', value: deviceStatus.value.total2 - deviceStatus.value.online2 }
        ]
      }]
    });
  }
}

// ============================================================================
// 辅助方法
// ============================================================================

/**
 * 获取视频占位符（无信号时显示）
 */
function getVideoPlaceholder(): string {
  // 返回空字符串，由模板中的占位符元素处理
  return '';
}

/**
 * 显示大图
 */
function showLargeImage(alert: AlertSnapshot): void {
  largeImage.value = alert.image;
  currentAlert.value = alert;

  // 设置标题和类型
  if (alert.category.includes('在岗')) {
    modalTitle.value = '在岗检测';
    modalType.value = 'duty';
  } else if (alert.category.includes('安全帽')) {
    modalTitle.value = '安全帽检测';
    modalType.value = 'helmet';
  } else {
    modalTitle.value = '预警详情';
    modalType.value = 'parking';
  }

  showModal.value = true;
  document.body.style.overflow = 'hidden';
}

/**
 * 关闭模态框
 */
function closeModal(): void {
  showModal.value = false;
  largeImage.value = '';
  document.body.style.overflow = 'auto';
}

/**
 * 切换全屏
 */
async function toggleFullScreen(): Promise<void> {
  isFullScreen.value = !isFullScreen.value;

  const navBar = document.querySelector('.el-header');
  const parkManagement = document.querySelector('.park-management');

  if (isFullScreen.value) {
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
    if (navBar) (navBar as HTMLElement).style.display = 'none';
    if (parkManagement) parkManagement.classList.add('fullscreen-mode');
  } else {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    }
    if (navBar) (navBar as HTMLElement).style.display = '';
    if (parkManagement) parkManagement.classList.remove('fullscreen-mode');
  }
}

// ============================================================================
// 生命周期
// ============================================================================

onMounted(() => {
  // 加载数据
  loadAllData();

  // 窗口大小变化监听
  window.addEventListener('resize', () => {
    if (cpuChart) cpuChart.resize();
    if (storageChart) storageChart.resize();
    if (bandwidthChart) bandwidthChart.resize();
  });
});

onBeforeUnmount(() => {
  // 销毁图表
  if (cpuChart) cpuChart.dispose();
  if (storageChart) storageChart.dispose();
  if (bandwidthChart) bandwidthChart.dispose();
});

onUnmounted(() => {
  window.removeEventListener('resize', () => {});
});
</script>

<style scoped>
.park-management {
  width: 100%;
  height: 100vh;
  background-color: #000B2A;
  color: #fff;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.header-box {
  width: 100%;
  height: 80px;
  margin: 0;
  background: linear-gradient(180deg, rgba(1,19,56,0.8) 0%, rgba(1,19,56,0.6) 100%);
}

.header-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.left-decoration,
.right-decoration {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 300px;
}

.decoration-line-group {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.decoration-line {
  width: 2px;
  height: 40px;
  background: linear-gradient(180deg, rgba(51,255,255,0.8) 0%, rgba(51,255,255,0) 100%);
  position: relative;
}

.decoration-line::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 6px;
  background: #33ffff;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(51,255,255,0.8);
}

.decoration-line.line1 { height: 40px; }
.decoration-line.line2 { height: 25px; margin-top: 15px; }
.decoration-line.line3 { height: 15px; margin-top: 25px; }

.right-decoration .decoration-line-group {
  transform: scaleX(-1);
}

.title-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title-wrapper {
  display: flex;
  align-items: center;
}

.title-text {
  font-size: 32px;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 0 0 10px rgba(51,255,255,0.5);
  letter-spacing: 4px;
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  gap: 10px;
  padding: 0 20px;
  height: calc(100vh - 290px);
  position: relative;
  z-index: 1;
}

.left-panel {
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
}

.device-panel {
  flex: 3;
}

.cpu-panel, .storage-panel {
  flex: 2;
}

.panel {
  background: #001135;
  border: 1px solid #0a2550;
  border-radius: 4px;
  overflow: hidden;
}

.panel-header {
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 15px;
  background: linear-gradient(90deg, #001135 0%, rgba(0,17,53,0.8) 100%);
  border-bottom: 1px solid #0a2550;
  font-size: 14px;
  position: relative;
}

.panel-header::before {
  content: '';
  width: 4px;
  height: 16px;
  background: #1B96FF;
  position: absolute;
  left: 0;
  margin-left: -15px;
}

.device-tree {
  padding: 10px;
  height: calc(100% - 36px);
  overflow: auto;
}

.custom-tree {
  background: transparent;
  color: #fff;
  font-size: 12px;
}

.custom-tree :deep(.el-tree-node__content) {
  background: transparent;
  color: #7a8baa;
  height: 32px;
  border-bottom: 1px solid rgba(10,37,80,0.5);
}

.custom-tree :deep(.el-tree-node__content:hover) {
  background: rgba(27,150,255,0.1);
  color: #fff;
}

.chart-container {
  height: calc(100% - 36px);
  width: 100%;
  position: relative;
}

.center-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.video-container {
  flex: 1;
  background: #001135;
  border: 1px solid #0a2550;
  border-radius: 4px;
  overflow: hidden;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 10px;
  padding: 10px;
  background: #001135;
  height: calc(100% - 36px);
  min-height: 400px;
}

.video-item {
  position: relative;
  background: #000;
  border: 1px solid #0a2550;
  border-radius: 2px;
  overflow: hidden;
  height: 100%;
  width: 100%;
}

.video-content {
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
}

.video-placeholder {
  flex: 1;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #000814 0%, #001529 100%);
  border: 1px dashed rgba(27, 150, 255, 0.3);
}

.placeholder-icon {
  font-size: 48px;
  color: rgba(27, 150, 255, 0.4);
  margin-bottom: 12px;
}

.placeholder-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 4px;
}

.placeholder-hint {
  font-size: 12px;
  color: rgba(27, 150, 255, 0.4);
}

.right-panel {
  width: 310px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.alert-panel {
  height: 100%;
}

.alert-list {
  height: calc(100% - 36px);
  padding: 10px;
  padding-bottom: 5px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.alert-item {
  background: #000B2A;
  border: 1px solid #0a2550;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  height: auto;
  flex: 0 0 auto;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  position: relative;
  width: 100%;
}

.category-label {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: #000B2A;
  color: #fff;
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 2px;
  z-index: 1;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.alert-image-container {
  width: 100%;
  padding: 0;
  position: relative;
  overflow: hidden;
  height: 180px;
}

.alert-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.alert-info {
  padding: 8px 12px;
  font-size: 12px;
  background: #000B2A;
  border-top: 1px solid rgba(10,37,80,0.5);
}

.alert-info.single-line {
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-content {
  flex: 1;
}

.view-btn {
  width: auto;
}

.alert-info p {
  margin: 4px 0;
  color: #7a8baa;
}

.view-large {
  color: #1B96FF;
  cursor: pointer;
  font-size: 12px;
  font-weight: normal;
  padding: 2px 5px;
  border-radius: 2px;
  transition: all 0.3s;
}

.view-large:hover {
  text-decoration: underline;
  color: #33ffff;
  background: rgba(27, 150, 255, 0.1);
}

.screen-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.screen-controls span {
  font-size: 12px;
  color: #7a8baa;
}

.screen-controls i {
  cursor: pointer;
  font-size: 16px;
  color: #7a8baa;
  transition: color 0.3s;
}

.screen-controls i.active {
  color: #1B96FF;
}

.bottom-container {
  position: relative;
  height: 180px;
  padding: 0 20px;
  margin-top: 10px;
  z-index: 2;
}

.bottom-area {
  display: flex;
  gap: 10px;
  height: 100%;
  margin-left: 310px;
  width: calc(100% - 630px);
}

.status-panel, .bandwidth-panel {
  flex: 1;
  height: 100%;
}

.status-content, .bandwidth-content {
  height: calc(100% - 36px);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 5px;
}

.status-item {
  text-align: center;
}

.status-text {
  margin-top: 10px;
  font-size: 12px;
  color: #7a8baa;
}

.status-text p {
  margin: 5px 0;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
  transition: all 0.3s ease;
}

.modal-content {
  background: #001642;
  border: 1px solid #0a2550;
  border-radius: 4px;
  width: 80%;
  max-width: 1000px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(0, 11, 42, 0.8);
  animation: modalFadeIn 0.3s ease;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header {
  padding: 12px 15px;
  background: linear-gradient(90deg, #001135 0%, rgba(0,17,53,0.8) 100%);
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #0a2550;
}

.modal-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
}

.close-modal {
  cursor: pointer;
  font-size: 24px;
  color: #7a8baa;
  transition: color 0.3s;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-modal:hover {
  color: #1B96FF;
  background: rgba(27, 150, 255, 0.1);
}

.modal-body {
  padding: 0;
  overflow: hidden;
  text-align: center;
  background: #000;
}

.modal-body img {
  width: 100%;
  max-height: calc(90vh - 120px);
  object-fit: contain;
}

.modal-footer {
  padding: 12px 15px;
  background: rgba(0,17,53,0.9);
  border-top: 1px solid #0a2550;
}

.info-row {
  display: flex;
  margin-bottom: 5px;
}

.info-label {
  width: 80px;
  color: #7a8baa;
  font-size: 13px;
}

.info-value {
  color: #fff;
  font-size: 13px;
}

.category-badge {
  display: inline-block;
  padding: 3px 8px;
  color: #fff;
  border-radius: 2px;
  font-size: 13px;
  margin-right: 10px;
}

.category-badge.parking {
  background-color: #1B96FF;
}

.category-badge.helmet {
  background-color: #FF6B00;
}

.category-badge.duty {
  background-color: #00B42A;
}

.fullscreen-btn {
  position: absolute;
  top: 22px;
  right: 20px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 17, 53, 0.5);
  border: 1px solid #0a2550;
  border-radius: 4px;
  color: #1B96FF;
  font-size: 22px;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 10;
}

.fullscreen-btn:hover {
  background: rgba(27, 150, 255, 0.2);
  color: #33ffff;
  transform: scale(1.05);
}

/* 全屏模式下的样式调整 */
.park-management.fullscreen-mode .main-content {
  height: calc(100vh - 130px);
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

::-webkit-scrollbar-track {
  background: #001135;
}

::-webkit-scrollbar-thumb {
  background: #0a2550;
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: #1B96FF;
}
</style>
