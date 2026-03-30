<template>
  <div class="visual-center" ref="visualCenter">
    <div class="top-bar">
      <div class="time">{{ currentDetailTime }}</div>
      <div class="title">
        <span>太行视觉AI平台</span>
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
            <div class="panel-header">
              <div class="panel-title">预警趋势</div>
              <div class="panel-tabs">
                <div v-for="(label, key) in { day: '本日', week: '本周', month: '本月' }" :key="key"
                  :class="['tab-item', { active: trendTimeRange === key }]"
                  @click="changeTrendTimeRange(key)">{{ label }}</div>
              </div>
            </div>
            <div class="trend-chart" ref="trendChart"></div>
          </div>
          <div class="type-panel panel-box panel-equal-height">
            <div class="panel-header">
              <div class="panel-title">预警类型排名</div>
              <div class="panel-tabs">
                <div v-for="(label, key) in { day: '本日', week: '本周', month: '本月' }" :key="key"
                  :class="['tab-item', { active: typeTimeRange === key }]"
                  @click="changeTypeTimeRange(key)">{{ label }}</div>
              </div>
            </div>
            <div class="type-list">
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
                  v-if="currentWarningImage.image"
                  :src="currentWarningImage.image" 
                  :alt="currentWarningImage.event"
                  class="main-warning-image"
                  @error="$event.target.style.display='none'"
                />
                <div v-else class="no-image-placeholder">
                  <i class="el-icon-picture-outline"></i>
                  <span>暂无预警图片</span>
                </div>
                
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
            <div class="panel-header">
              <div class="panel-title">预警等级占比</div>
              <div class="panel-tabs">
                <div v-for="(label, key) in { day: '本日', week: '本周', month: '本月' }" :key="key"
                  :class="['tab-item', { active: levelTimeRange === key }]"
                  @click="changeLevelTimeRange(key)">{{ label }}</div>
              </div>
            </div>
            <div class="level-chart" ref="levelChart"></div>
          </div>
          <div class="top-panel panel-box panel-equal-height">
            <div class="panel-header">
              <div class="panel-title">点位预警 Top 5</div>
              <div class="panel-tabs">
                <div v-for="(label, key) in { day: '本日', week: '本周', month: '本月' }" :key="key"
                  :class="['tab-item', { active: locationTimeRange === key }]"
                  @click="changeLocationTimeRange(key)">{{ label }}</div>
              </div>
            </div>
            <div class="top-list">
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
            <div class="panel-header">
              <div class="panel-title">预警处理情况</div>
              <div class="panel-tabs">
                <div v-for="(label, key) in { day: '本日', week: '本周', month: '本月' }" :key="key"
                  :class="['tab-item', { active: statusTimeRange === key }]"
                  @click="changeStatusTimeRange(key)">{{ label }}</div>
              </div>
            </div>
            <div class="status-chart" ref="statusChart"></div>
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
                  <template slot-scope="scope">
                    <span :class="['status-tag', scope.row.status]">{{ scope.row.statusText }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="device-panel panel-box panel-bottom-equal-height">
            <div class="panel-header">
              <div class="panel-title">设备预警数量 Top 10</div>
              <div class="panel-tabs">
                <div v-for="(label, key) in { day: '本日', week: '本周', month: '本月' }" :key="key"
                  :class="['tab-item', { active: deviceTimeRange === key }]"
                  @click="changeDeviceTimeRange(key)">{{ label }}</div>
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

<script>
import * as echarts from 'echarts';
import { alertAPI, cameraAPI } from '../../service/VisionAIService.js';

// 预警等级映射
const LEVEL_MAP = { 1: 'urgent', 2: 'high', 3: 'medium', 4: 'low' };
const LEVEL_TEXT_MAP = { 1: '一级', 2: '二级', 3: '三级', 4: '四级' };
const STATUS_CLASS_MAP = { 1: 'pending', 2: 'processing', 3: 'completed', 4: 'completed', 5: 'completed' };
const STATUS_TEXT_MAP = { 1: '待处理', 2: '处理中', 3: '已处理', 4: '已归档', 5: '误报' };

/** 统计接口：axios 体可能是 { statistics } 或嵌套在 { data: { statistics } } */
function statisticsFromResponse(res) {
  const d = res && res.data;
  if (!d) return null;
  if (d.statistics) return d.statistics;
  if (d.data && d.data.statistics) return d.data.statistics;
  return null;
}

/** 实时预警：VisionAIService 把列表放在 response.data.data，与 warningManagement 一致 */
function alertsFromRealTimeResponse(res) {
  const d = res && res.data;
  if (!d) return [];
  if (Array.isArray(d.data)) return d.data;
  if (Array.isArray(d.alerts)) return d.alerts;
  return [];
}

export default {
  name: 'VisualCenter',
  data() {
    return {
      todayWarnings: 0,
      deviceCount: 0,
      totalDevices: 0,
      currentDetailTime: '',

      locationInfo: { location: '太行工业园区', weather: '-- --', airQuality: '', loading: false },

      isFullscreen: false,
      headerCellStyle: {
        background: 'linear-gradient(180deg, rgba(6, 30, 93, 0.9) 0%, rgba(4, 20, 63, 1) 100%)',
        color: '#00FFFF',
        borderBottom: '1px solid rgba(0, 255, 255, 0.3)',
        fontWeight: 'normal',
        padding: '12px 0',
        textShadow: '0 0 10px rgba(0, 255, 255, 0.3)'
      },

      warningTypes: [],
      topWarnings: [],
      warningList: [],
      deviceWarnings: [],
      
      trendTimeRange: 'day',
      typeTimeRange: 'day',
      levelTimeRange: 'day',
      locationTimeRange: 'day',
      statusTimeRange: 'day',
      deviceTimeRange: 'day',
      tableHeight: 280,

      warningImages: [],
      currentWarningImage: { image: '', event: '', time: '', level: '', levelText: '', location: '' },
      currentImageIndex: 0,

      // 图表实例
      trendChart: null,
      levelChart: null,
      statusChart: null,

      // 定时器
      refreshTimer: null,
      timeTimer: null,
    };
  },

  mounted() {
    this.updateCurrentTime();
    this.timeTimer = setInterval(this.updateCurrentTime, 1000);

    this.computePanelHeights();
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    window.addEventListener('resize', this.handleResize);
    
    this.$nextTick(() => {
      this.initEmptyCharts();
      this.fetchAll();
      document.addEventListener('keydown', this.handleKeyboardNavigation);
    });

    this.refreshTimer = setInterval(this.fetchAll, 30 * 1000);
  },

  beforeDestroy() {
    clearInterval(this.refreshTimer);
    clearInterval(this.timeTimer);
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('keydown', this.handleKeyboardNavigation);
    window.removeEventListener('resize', this.handleResize);
    if (this.trendChart) this.trendChart.dispose();
    if (this.levelChart) this.levelChart.dispose();
    if (this.statusChart) this.statusChart.dispose();
  },

  watch: {
    trendTimeRange() { this.fetchTrendData(); },
    typeTimeRange() { this.fetchTypeData(); },
    levelTimeRange() { this.fetchLevelData(); },
    locationTimeRange() { this.fetchLocationData(); },
    statusTimeRange() { this.fetchStatusStats(); },
    deviceTimeRange() { this.fetchDeviceTop10(); },
  },

  methods: {
    // ── 工具 ────────────────────────────────────────────────────────────────

    formatDate(date, fmt) {
      if (!date) return '';
      const y = date.getFullYear();
      const M = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const H = String(date.getHours()).padStart(2, '0');
      const m = String(date.getMinutes()).padStart(2, '0');
      const s = String(date.getSeconds()).padStart(2, '0');
      return fmt.replace('yyyy', y).replace('MM', M).replace('dd', d)
                .replace('HH', H).replace('mm', m).replace('ss', s);
    },

    updateCurrentTime() {
      this.currentDetailTime = this.formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss');
    },

    /** 根据时间范围标识返回 {start_date, end_date} */
    getDateRange(range) {
      const now = new Date();
      const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const today = fmt(now);
      if (range === 'day') return { start_date: today, end_date: today };
      if (range === 'week') {
        const start = new Date(now); start.setDate(now.getDate() - 6);
        return { start_date: fmt(start), end_date: today };
      }
      // month
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start_date: fmt(start), end_date: today };
    },

    // ── 数据获取总入口 ───────────────────────────────────────────────────────

    async fetchAll() {
      const today = this.getDateRange('day');
      await Promise.all([
        this.fetchTodayCount(today).catch(e => console.error('fetchTodayCount:', e)),
        this.fetchTrendData().catch(e => console.error('fetchTrendData:', e)),
        this.fetchTypeData().catch(e => console.error('fetchTypeData:', e)),
        this.fetchLevelData().catch(e => console.error('fetchLevelData:', e)),
        this.fetchLocationData().catch(e => console.error('fetchLocationData:', e)),
        this.fetchStatusStats().catch(e => console.error('fetchStatusStats:', e)),
        this.fetchDeviceTop10().catch(e => console.error('fetchDeviceTop10:', e)),
        this.fetchRecentAlerts().catch(e => console.error('fetchRecentAlerts:', e)),
        this.fetchCameraCount().catch(e => console.error('fetchCameraCount:', e)),
      ]);
    },

    // ── 今日预警总数（顶部卡片，始终取当天） ─────────────────────────────────

    async fetchTodayCount(today) {
      try {
        const dateRange = today || this.getDateRange('day');
        const res = await alertAPI.getAlertStatistics({ granularity: 'hour', ...dateRange });
        const stats = statisticsFromResponse(res);
        if (!stats) return;
        this.todayWarnings = (stats.summary || {}).total_alerts || 0;
      } catch (e) {
        console.error('获取今日预警总数失败:', e);
      }
    },

    // ── 预警趋势（支持 day/week/month）───────────────────────────────────────

    async fetchTrendData() {
      try {
        const range = this.trendTimeRange;
        const granularity = range === 'day' ? 'hour' : range === 'month' ? 'month' : 'day';
        const dateRange = this.getDateRange(range);
        const res = await alertAPI.getAlertStatistics({ granularity, ...dateRange });
        const stats = statisticsFromResponse(res);
        if (!stats) return;
        const trend = stats.trend || [];
        this.renderTrendChart(trend.map(t => t.label), trend.map(t => t.count));
      } catch (e) {
        console.error('获取趋势数据失败:', e);
      }
    },

    // ── 预警类型排名（支持 day/week/month）───────────────────────────────────

    async fetchTypeData() {
      try {
        const dateRange = this.getDateRange(this.typeTimeRange);
        const res = await alertAPI.getAlertStatistics({ granularity: 'day', ...dateRange });
        const stats = statisticsFromResponse(res);
        if (!stats) return;
        const byType = stats.by_type || [];
        const maxTypeCount = byType.length > 0 ? Math.max(...byType.map(t => t.count), 1) : 1;
        this.warningTypes = byType.map(t => ({
          name: t.name,
          count: t.count,
          value: Math.round(t.count / maxTypeCount * 100),
        }));
      } catch (e) {
        console.error('获取类型排名失败:', e);
      }
    },

    // ── 预警等级占比（支持 day/week/month）───────────────────────────────────

    async fetchLevelData() {
      try {
        const dateRange = this.getDateRange(this.levelTimeRange);
        const res = await alertAPI.getAlertStatistics({ granularity: 'day', ...dateRange });
        const stats = statisticsFromResponse(res);
        if (!stats) return;
        this.renderLevelChart(stats.by_level || {});
      } catch (e) {
        console.error('获取等级统计失败:', e);
      }
    },

    // ── 点位预警 Top5（支持 day/week/month）──────────────────────────────────

    async fetchLocationData() {
      try {
        const dateRange = this.getDateRange(this.locationTimeRange);
        const res = await alertAPI.getAlertStatistics({ granularity: 'day', ...dateRange });
        const stats = statisticsFromResponse(res);
        if (!stats) return;
        const locs = stats.by_location || [];
        this.topWarnings = locs.map(l => ({
          name: l.name,
          count: l.count,
          value: l.percent,
        }));
      } catch (e) {
        console.error('获取点位排名失败:', e);
      }
    },

    // ── 状态处理饼图（支持 day/week/month）─────────────────────────────────

    async fetchStatusStats() {
      try {
        const dateRange = this.getDateRange(this.statusTimeRange);
        const res = await alertAPI.getAlertStatistics({ granularity: 'day', ...dateRange });
        const stats = statisticsFromResponse(res);
        if (!stats) return;
        this.renderStatusChart(stats.by_status || {});
      } catch (e) {
        console.error('获取状态统计失败:', e);
      }
    },

    // ── 设备 Top10（支持 day/week/month）────────────────────────────────────

    async fetchDeviceTop10() {
      try {
        const dateRange = this.getDateRange(this.deviceTimeRange);
        const res = await alertAPI.getAlertStatistics({ granularity: 'day', ...dateRange });
        const stats = statisticsFromResponse(res);
        if (!stats) return;
        this.deviceWarnings = (stats.top_cameras || []).slice(0, 10)
          .map(c => ({ name: c.name, count: c.count }));
      } catch (e) {
        console.error('获取设备Top10失败:', e);
      }
    },

    // ── 最近预警记录 + 图片查看器 ────────────────────────────────────────────

    async fetchRecentAlerts() {
      try {
        const res = await alertAPI.getRealTimeAlerts({ page: 1, limit: 15 });
        const alerts = alertsFromRealTimeResponse(res);

        // 预警记录表格
        this.warningList = alerts.map(a => ({
          event: a.alert_name || a.skill_name_zh || a.alert_type || '未知预警',
          time: a.alert_time ? a.alert_time.replace('T', ' ').slice(0, 19) : '--',
          status: STATUS_CLASS_MAP[a.status] || 'pending',
          statusText: STATUS_TEXT_MAP[a.status] || '待处理',
        }));

        // 图片查看器 - 取有图片的条目
        const withImages = alerts.filter(a => a.minio_frame_url);
        this.warningImages = withImages.map(a => ({
          image: a.minio_frame_url,
          event: a.alert_name || a.skill_name_zh || a.alert_type || '未知预警',
          time: a.alert_time ? a.alert_time.replace('T', ' ').slice(0, 16) : '--',
          level: LEVEL_MAP[a.alert_level] || 'medium',
          levelText: LEVEL_TEXT_MAP[a.alert_level] || '--',
          location: a.location || a.camera_name || '--',
        }));

        // 重置到第一张
        if (this.warningImages.length > 0) {
          this.currentImageIndex = 0;
          this.currentWarningImage = this.warningImages[0];
        } else {
          this.currentWarningImage = { image: '', event: '暂无预警图片', time: '--', level: '', levelText: '--', location: '--' };
        }
      } catch (e) {
        console.error('获取预警记录失败:', e);
      }
    },

    // ── 摄像头总数 ───────────────────────────────────────────────────────────

    async fetchCameraCount() {
      try {
        const res = await cameraAPI.getCameraList({ limit: 1 });
        const data = res.data;
        const total = (data && (data.total || (data.data && data.data.length) || 0)) || 0;
        this.totalDevices = total;
        // deviceCount = 有任务在跑的摄像头，暂用总数作近似
        this.deviceCount = total;
      } catch (e) {
        console.error('获取摄像头数量失败:', e);
      }
    },

    // ── 图表初始化（空壳）────────────────────────────────────────────────────

    initEmptyCharts() {
      this.renderTrendChart([], []);
      this.renderLevelChart({});
      this.renderStatusChart({});
    },

    // ── 趋势折线图 ───────────────────────────────────────────────────────────

    renderTrendChart(xData, yData) {
      const dom = this.$refs.trendChart;
      if (!dom) return;
      if (!this.trendChart) this.trendChart = echarts.init(dom);

      this.trendChart.setOption({
        backgroundColor: 'transparent',
        grid: { top: 30, bottom: 20, left: 0, right: 15, containLabel: true },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'line', lineStyle: { color: 'rgba(0,255,255,0.3)', width: 1 } },
          backgroundColor: 'rgba(0,19,40,0.8)',
          borderColor: 'rgba(0,255,255,0.3)',
          textStyle: { color: '#00FFFF' },
          formatter: params => `${params[0].name}<br/>预警数: <b>${params[0].value}</b>`,
        },
        xAxis: {
          type: 'category',
          data: xData.length > 0 ? xData : ['--'],
          axisLine: { lineStyle: { color: 'rgba(0,255,255,0.3)' } },
          axisLabel: { color: '#7EAEE5', interval: xData.length > 12 ? 'auto' : 0 },
          axisTick: { show: false },
          splitLine: { show: false },
        },
        yAxis: {
          type: 'value',
          min: 0,
          minInterval: 1,
          axisLine: { show: false },
          axisLabel: { color: '#7EAEE5' },
          splitLine: { lineStyle: { color: 'rgba(35,88,148,0.3)', type: 'dashed' } },
        },
        series: [{
          name: '预警数量', type: 'line', smooth: true, symbol: 'circle', symbolSize: 6,
          data: yData.length > 0 ? yData : [0],
          lineStyle: { width: 2, color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#00FFFF' }, { offset: 1, color: '#207FFF' }] } },
          itemStyle: { color: '#00FFFF', borderColor: 'rgba(0,255,255,0.3)', borderWidth: 4 },
          areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(0,255,255,0.3)' }, { offset: 1, color: 'rgba(0,255,255,0)' }] } },
        }],
      }, true);
    },

    // ── 等级占比饼图 ─────────────────────────────────────────────────────────

    renderLevelChart(byLevel) {
      const dom = this.$refs.levelChart;
      if (!dom) return;
      if (!this.levelChart) this.levelChart = echarts.init(dom);

      const colorMap = { '一级预警': '#FF4D4F', '二级预警': '#FF8746', '三级预警': '#44FF9B', '四级预警': '#00C5FF' };
      const entries = Object.entries(byLevel);
      const isEmpty = entries.length === 0 || entries.every(([, v]) => v === 0);

      const pieData = isEmpty
        ? [{ value: 1, name: '暂无数据', itemStyle: { color: 'rgba(35,88,148,0.2)' }, tooltip: { show: false }, emphasis: { disabled: true } }]
        : entries.map(([name, val]) => ({ value: val, name, itemStyle: { color: colorMap[name] || '#999' } }));

      this.levelChart.setOption({
        backgroundColor: 'transparent',
        graphic: isEmpty ? [{ type: 'text', left: '28%', top: 'middle', style: { text: '暂无数据', fill: 'rgba(126,174,229,0.4)', fontSize: 13 } }] : [],
        tooltip: {
          trigger: 'item',
          formatter: p => `${p.name}<br/>数量: <b>${p.value}</b>次 (${p.percent.toFixed(1)}%)`,
          backgroundColor: 'rgba(0,19,40,0.8)',
          borderColor: 'rgba(0,255,255,0.3)',
          textStyle: { color: '#00FFFF' },
        },
        legend: {
          orient: 'vertical', right: 0, top: 'center',
          itemWidth: 12, itemHeight: 12, itemGap: 16,
          textStyle: { color: '#7EAEE5' },
          formatter: name => {
            const item = pieData.find(d => d.name === name);
            return item ? `${name}  ${item.value}次` : name;
          },
        },
        series: [{
          name: '预警等级', type: 'pie',
          radius: ['60%', '85%'], center: ['30%', '50%'],
            avoidLabelOverlap: false,
          label: { show: false }, labelLine: { show: false },
          emphasis: { label: { show: false } },
          data: pieData,
        }],
      }, true);
    },

    // ── 状态处理饼图 ─────────────────────────────────────────────────────────

    renderStatusChart(byStatus) {
      const dom = this.$refs.statusChart;
      if (!dom) return;
      if (!this.statusChart) this.statusChart = echarts.init(dom);

      const colorMap = { '待处理': '#FF8746', '处理中': '#44FF9B', '已处理': '#00FFFF', '已归档': '#6677AA', '误报': '#ee6666' };
      const allStatuses = ['待处理', '处理中', '已处理', '已归档', '误报'];
      const total = allStatuses.reduce((s, k) => s + (byStatus[k] || 0), 0);
      const isEmpty = total === 0;

      const pieData = isEmpty
        ? [{ value: 1, name: '暂无数据', itemStyle: { color: 'rgba(35,88,148,0.2)' }, tooltip: { show: false }, emphasis: { disabled: true } }]
        : allStatuses.map(name => ({ value: byStatus[name] || 0, name, itemStyle: { color: colorMap[name] } }));

      this.statusChart.setOption({
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          formatter: p => `${p.name}: <b>${p.value}</b>条 (${p.percent.toFixed(1)}%)`,
          backgroundColor: 'rgba(0,19,40,0.8)',
          borderColor: 'rgba(0,255,255,0.3)',
          textStyle: { color: '#00FFFF' },
        },
        legend: {
          show: !isEmpty,
          orient: 'vertical',
          right: 0,
          top: 'center',
          itemWidth: 12,
          itemHeight: 12,
          itemGap: 16,
          textStyle: { color: '#7EAEE5' },
          formatter: name => {
            const item = pieData.find(d => d.name === name);
            return item ? `${name}  ${item.value}条` : name;
          },
        },
        series: [{
          name: '状态分布', type: 'pie',
          radius: ['45%', '65%'], center: ['35%', '50%'],
          avoidLabelOverlap: false,
          label: { show: false },
          labelLine: { show: false },
          emphasis: { label: { show: false } },
          data: pieData,
        }],
      }, true);
    },

    // ── 全屏 / 布局 ──────────────────────────────────────────────────────────

    async toggleFullscreen() {
      try {
        if (!document.fullscreenElement) {
          await this.$refs.visualCenter.requestFullscreen();
        } else {
          await document.exitFullscreen();
        }
      } catch (err) {
        console.error('全屏切换失败:', err);
      }
    },

    handleFullscreenChange() {
      this.isFullscreen = !!document.fullscreenElement;
      this.computePanelHeights();
      setTimeout(() => {
        if (this.trendChart) this.trendChart.resize();
        if (this.levelChart) this.levelChart.resize();
        if (this.statusChart) this.statusChart.resize();
      }, 300);
    },

    computePanelHeights() {
      // 由 CSS flex 自动分配，仅计算 tableHeight
      this.$nextTick(() => {
        const bottomRow = this.$el && this.$el.querySelector('.bottom-section');
        if (bottomRow) {
          this.tableHeight = Math.max(120, bottomRow.clientHeight - 80);
        }
      });
    },

    handleResize() {
      this.computePanelHeights();
      this.$nextTick(() => {
        if (this.trendChart) this.trendChart.resize();
        if (this.levelChart) this.levelChart.resize();
        if (this.statusChart) this.statusChart.resize();
      });
    },

    // ── 时间范围切换 ─────────────────────────────────────────────────────────

    changeTrendTimeRange(range) {
      this.trendTimeRange = range;
    },

    changeTypeTimeRange(range) {
      this.typeTimeRange = range;
    },

    changeLevelTimeRange(range) {
      this.levelTimeRange = range;
    },

    changeLocationTimeRange(range) {
      this.locationTimeRange = range;
    },

    changeStatusTimeRange(range) {
      this.statusTimeRange = range;
    },

    changeDeviceTimeRange(range) {
      this.deviceTimeRange = range;
    },

    // ── 图片查看器导航 ───────────────────────────────────────────────────────

    scrollToThumbnail(index) {
      const slider = this.$refs.thumbnailSlider;
      if (slider && slider.children[index]) {
        slider.children[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    },

    selectWarningImage(index) {
      this.currentImageIndex = index;
      this.currentWarningImage = this.warningImages[index];
      this.scrollToThumbnail(index);
    },
    
    slidePrev() {
      if (this.currentImageIndex > 0) {
        this.currentImageIndex--;
        this.currentWarningImage = this.warningImages[this.currentImageIndex];
        this.scrollToThumbnail(this.currentImageIndex);
      }
    },
    
    slideNext() {
      if (this.currentImageIndex < this.warningImages.length - 1) {
        this.currentImageIndex++;
        this.currentWarningImage = this.warningImages[this.currentImageIndex];
        this.scrollToThumbnail(this.currentImageIndex);
      }
    },

    handleKeyboardNavigation(event) {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      if (event.key === 'ArrowLeft') { event.preventDefault(); this.slidePrev(); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); this.slideNext(); }
    },
  },
}
</script>

<style scoped>
/* Vue2项目中使用普通CSS样式 */

/* 全局隐藏滚动条样式 */
* {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}

*::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

/* 标题与内容一体：高度跟随视口，内容溢出时可隐藏滚动条滚动 */
.visual-center {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #001529 0%, #000B18 100%);
  color: #fff;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  position: relative;
  z-index: 2;
  padding: 0 12px;
  height: 30px;
  flex-shrink: 0;
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

.exit-fullscreen-tip {
  color: #7EAEE5;
  font-size: 14px;
}

.exit-fullscreen-tip kbd {
  background-color: #061E5D;
  border: 1px solid #00FFFF;
  border-radius: 3px;
  padding: 2px 4px;
  margin: 0 2px;
  color: #00FFFF;
}

/* 主内容区与顶栏一体，不单独滚动 */
.main-content {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

/* 两行 el-row 按 55:45 分配 */
.main-content > .el-row:first-child {
  flex: 55 1 0;
  min-height: 0;
}
.main-content > .el-row.bottom-section {
  flex: 45 1 0;
  min-height: 0;
}

/* el-col 撑满行高 */
.main-content > .el-row > .el-col {
  height: 100%;
}

.panel-box {
  background: linear-gradient(180deg, rgba(6, 30, 93, 0.8) 0%, rgba(4, 20, 63, 0.9) 100%);
  border: 1px solid rgba(35, 88, 148, 0.5);
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
  position: relative;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.panel-title {
  color: #00FFFF;
  font-size: 16px;
  padding-left: 10px;
  border-left: 3px solid #00FFFF;
  text-align: left;
  flex-shrink: 0;
}

.panel-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
}

.panel-equal-height {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}

.panel-bottom-equal-height {
  height: 100%;
  overflow: hidden;
  margin-bottom: 0;
}

/* 中间大图面板撑满整行高度 */
.map-panel {
  height: 100%;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}

/* 左、右列用 flex 列布局，两个面板各占一半 */
.main-content > .el-row:first-child > .el-col:first-child,
.main-content > .el-row:first-child > .el-col:last-child {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.main-content > .el-row:first-child > .el-col:first-child .panel-box,
.main-content > .el-row:first-child > .el-col:last-child .panel-box {
  margin-bottom: 0;
}

.map-container {
  flex: 1;
  min-height: 0;
  background: rgba(6, 30, 93, 0.3);
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  box-shadow: inset 0 0 20px rgba(0, 255, 255, 0.2);
}

.stat-value {
  color: #00FFFF;
  font-size: 18px;
  font-weight: bold;
}

.stat-value .unit {
  font-size: 14px;
  opacity: 0.8;
  margin-left: 2px;
}

.tab-item {
  padding: 4px 8px;
  cursor: pointer;
  color: #7EAEE5;
  font-size: 12px;
  border-radius: 3px;
  transition: all 0.3s ease;
}

.tab-item:hover {
  color: #00FFFF;
}

.tab-item.active {
  color: #00FFFF;
  background: rgba(0, 255, 255, 0.12);
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;
  line-height: 1.5;
  position: relative;
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

.warning-table,
.device-table {
  height: calc(100% - 40px);
  flex: 1;
  overflow: hidden;
}

/* 特别针对预警记录表格的高度调整 */
.warning-table {
  height: calc(100% - 10px) !important;
}

/* 表格边框处理 */
.warning-table >>> .el-table,
.device-table >>> .el-table {
  border: none !important;
}

/* 完全移除表格边框和白边 */
.warning-table >>> .el-table,
.device-table >>> .el-table {
  border: none !important;
  border-collapse: collapse !important;
  border-spacing: 0 !important;
}

/* 移除表格容器边框 */
.warning-table >>> .el-table__border-left-patch,
.warning-table >>> .el-table__border-right-patch,
.device-table >>> .el-table__border-left-patch,
.device-table >>> .el-table__border-right-patch {
  display: none !important;
}

/* 移除表格外边框伪元素 */
.warning-table >>> .el-table::before,
.warning-table >>> .el-table::after,
.device-table >>> .el-table::before,
.device-table >>> .el-table::after {
  display: none !important;
}

/* 删除所有表格边框 */
.warning-table >>> .el-table td,
.warning-table >>> .el-table th,
.device-table >>> .el-table td,
.device-table >>> .el-table th {
  background-color: transparent;
  border: none !important; /* 删除所有边框 */
  border-left: none !important;
  border-right: none !important;
  border-top: none !important;
  border-bottom: 1px solid rgba(35, 88, 148, 0.3) !important; /* 只保留底部分隔线 */
}

/* 删除表格最后一行的底部边框 */
.warning-table >>> .el-table tbody tr:last-child td,
.device-table >>> .el-table tbody tr:last-child td {
  border-bottom: none !important;
}

/* 删除表格底部边框 */
.warning-table >>> .el-table__append-wrapper,
.device-table >>> .el-table__append-wrapper {
  border: none !important;
}

/* 删除表格所有可能的边框 */
.warning-table >>> .el-table__header,
.warning-table >>> .el-table__body,
.warning-table >>> .el-table__footer,
.device-table >>> .el-table__header,
.device-table >>> .el-table__body,
.device-table >>> .el-table__footer {
  border: none !important;
}

/* 删除表格固定列边框 */
.warning-table >>> .el-table__fixed,
.warning-table >>> .el-table__fixed-right,
.device-table >>> .el-table__fixed,
.device-table >>> .el-table__fixed-right {
  border: none !important;
  box-shadow: none !important;
}

.warning-table >>> .el-table__fixed::before,
.warning-table >>> .el-table__fixed-right::before,
.device-table >>> .el-table__fixed::before,
.device-table >>> .el-table__fixed-right::before {
  display: none !important;
}

/* 统一表格高度 - 两个表格底边完全对齐 */
.warning-table {
  height: calc(100% - 15px) !important; /* 进一步增加预警记录表格高度，确保显示5行数据 */
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

.device-table {
  height: calc(100% - 45px) !important; /* 设备表格有Tab，需要减去更多高度以对齐底部 */
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

/* 移除表格包装器的边框和阴影 */
.warning-table >>> .el-table__body-wrapper,
.device-table >>> .el-table__body-wrapper {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

.warning-table >>> .el-table__header-wrapper,
.device-table >>> .el-table__header-wrapper {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

/* 移除表格内部所有可能的边框线 */
.warning-table >>> .el-table__empty-block,
.device-table >>> .el-table__empty-block {
  border: none !important;
}

.warning-table >>> .el-table__empty-text,
.device-table >>> .el-table__empty-text {
  border: none !important;
}

/* 强制移除所有可能的白色边框 */
.warning-table >>> *,
.device-table >>> * {
  border-color: transparent !important;
  outline-color: transparent !important;
}

/* 特别处理可能存在的边框伪元素 */
.warning-table >>> .el-table--border .el-table__cell:first-child::before,
.warning-table >>> .el-table--border .el-table__cell:last-child::after,
.device-table >>> .el-table--border .el-table__cell:first-child::before,
.device-table >>> .el-table--border .el-table__cell:last-child::after {
  display: none !important;
}

/* 移除表格分组相关的边框 */
.warning-table >>> .el-table--group::after,
.warning-table >>> .el-table--group::before,
.device-table >>> .el-table--group::after,
.device-table >>> .el-table--group::before {
  display: none !important;
}

.type-list,
.top-list {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

/* 隐藏自定义滚动条 */
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

/* 全屏按钮样式 */
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

.trend-chart,
.level-chart {
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  position: relative;
}
.status-chart {
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  position: relative;
  overflow: hidden;
}

/* 更新图表组件样式 */
.status-chart >>> .ve-pie {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 调整饼图系列的位置 */
.status-chart >>> .echarts-for-vue {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100% !important;
}

/* 预警图片查看器样式 */
.warning-viewer {
  height: 100%; /* 占满整个面板高度 */
  background: transparent; /* 改为透明背景，去掉黑色边框 */
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 全屏模式下的特殊样式 */
.visual-center:fullscreen .warning-viewer {
  height: calc(100% - 30px);
}

.visual-center:fullscreen .main-image-container {
  min-height: 350px;
}

.visual-center:fullscreen .thumbnail-container-bottom {
  height: 100px;
}

.visual-center:fullscreen .thumbnail-item {
  width: 110px; /* 全屏下保持适中的缩略图尺寸 */  
  height: 62px; /* 保持16:9比例 */
}

.main-image-container {
  flex: 1;
  min-height: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  border-radius: 25px;
  padding: 15px;
}

  .main-warning-image {
    width: 100%; /* 占容器100%宽度 */
    height: 100%; /* 占容器100%高度 */
    object-fit: cover; /* 保持比例的同时填充 */
    background: transparent; /* 改为透明背景 */
    transition: opacity 0.3s ease;
    aspect-ratio: 4/3; /* 强制4:3比例 */
    border-radius: 10px; /* 适当的圆角，与容器配合 */
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5); /* 添加阴影效果 */
  }

.main-warning-image.loading {
  opacity: 0.5;
}

.no-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(6, 30, 93, 0.4);
  color: rgba(126, 174, 229, 0.5);
  font-size: 14px;
  gap: 10px;
}

.no-image-placeholder i {
  font-size: 48px;
}

.warning-info-overlay {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.4); /* 降低背景透明度，从0.8改为0.4 */
  backdrop-filter: blur(8px); /* 减少模糊效果 */
  border: 1px solid rgba(0, 255, 255, 0.2); /* 降低边框透明度 */
  border-radius: 8px;
  padding: 12px 15px; /* 减少padding */
  min-width: 200px; /* 减少最小宽度 */
  max-width: 280px; /* 添加最大宽度限制 */
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); /* 减轻阴影 */
  animation: slideInRight 0.3s ease-out;
  z-index: 10; /* 确保信息叠加层在最上层 */
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
  text-align: left; /* 确保内容居左 */
}

.info-row {
  display: flex;
  align-items: flex-start; /* 改为顶部对齐 */
  margin-bottom: 6px; /* 减少行间距 */
  font-size: 13px; /* 稍微减小字体 */
  text-align: left;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #7EAEE5;
  font-weight: normal;
  white-space: nowrap;
  min-width: 70px; /* 减少标签最小宽度 */
  text-align: left;
}

.info-value {
  color: #FFFFFF;
  margin-left: 8px; /* 减少左边距 */
  flex: 1;
  text-align: left;
  word-break: break-word; /* 允许长文本换行 */
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
  height: 100px; /* 增加缩略图区域高度 */
  background: transparent; /* 改为透明背景 */
  backdrop-filter: none; /* 去掉模糊效果 */
  border-top: none; /* 去掉顶部边框 */
  display: flex;
  align-items: center;
  padding: 0 20px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0; /* 不允许收缩 */
  gap: 15px; /* 按钮和滑块之间的间距 */
}

.thumbnail-slider {
  display: flex;
  align-items: center;
  gap: 20px; /* 增大缩略图间距 */
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
  flex: 1; /* 占据剩余空间 */
  padding: 15px 0; /* 增大上下padding */
  scroll-behavior: smooth; /* 平滑滚动 */
}

.slider-btn {
  width: 45px; /* 增大按钮尺寸 */
  height: 45px;
  background: rgba(0, 255, 255, 0.15);
  border: 2px solid rgba(0, 255, 255, 0.4);
  border-radius: 50%;
  color: #00FFFF;
  font-size: 18px; /* 增大图标尺寸 */
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  flex-shrink: 0; /* 按钮不收缩 */
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
  display: none; /* Chrome, Safari, Opera */
}

.thumbnail-item {
  flex-shrink: 0;
  width: 110px; /* 增大缩略图尺寸 */
  height: 62px; /* 16:9 比例 */
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 3px solid rgba(255, 255, 255, 0.3); /* 默认白色半透明边框 */
  transition: all 0.3s ease;
  position: relative;
  background: transparent; /* 改为透明背景 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.thumbnail-item:hover {
  border-color: rgba(0, 255, 255, 0.8);
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(0, 255, 255, 0.3);
}

.thumbnail-item.active {
  border-color: #00FFFF; /* 蓝色高亮边框 */
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.6);
  transform: scale(1.08);
}

.thumbnail-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: transparent; /* 改为透明背景 */
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
  z-index: 15; /* 提高z-index确保在图片之上 */
  pointer-events: none; /* 允许点击穿透到图片 */
}

.info-card {
  background: rgba(0, 0, 0, 0.4); /* 降低背景透明度，从0.7改为0.4 */
  backdrop-filter: blur(8px); /* 减少模糊效果 */
  border: 1px solid rgba(0, 255, 255, 0.2); /* 降低边框透明度 */
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
  pointer-events: auto; /* 恢复卡片的点击事件 */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); /* 减轻阴影 */
}

.info-card:hover {
  background: rgba(0, 0, 0, 0.6); /* 降低悬停状态的背景透明度 */
  border-color: rgba(0, 255, 255, 0.4); /* 降低悬停状态的边框透明度 */
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

/* 全屏模式下图表高度 */
.visual-center:fullscreen .trend-chart,
.visual-center:fullscreen .level-chart,
.visual-center:fullscreen .status-chart {
  height: calc(100% - 15px);
}

/* 全屏模式：与算法推理页一致，根 100vh + 顶栏 fixed + 主内容 100vh 铺满 */
.visual-center:fullscreen,
.visual-center:-webkit-full-screen,
.visual-center:-moz-full-screen,
.visual-center:-ms-fullscreen {
  width: 100vw !important;
  height: 100vh !important;
  padding: 0 !important;
  margin: 0 !important;
  box-sizing: border-box;
  overflow: hidden;
  background: linear-gradient(135deg, #001529 0%, #000B18 100%);
}

/* 全屏下顶栏固定到顶部，不占文档流，避免底部留白 */
.visual-center:fullscreen .top-bar,
.visual-center:-webkit-full-screen .top-bar,
.visual-center:-moz-full-screen .top-bar,
.visual-center:-ms-fullscreen .top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  margin-bottom: 0;
  padding: 10px 20px;
  background: linear-gradient(180deg, rgba(0, 20, 45, 0.95) 0%, rgba(0, 10, 25, 0.9) 100%);
}

/* 全屏下主内容区 flex 填满视口，无底部空白 */
.visual-center:fullscreen .main-content,
.visual-center:-webkit-full-screen .main-content,
.visual-center:-moz-full-screen .main-content,
.visual-center:-ms-fullscreen .main-content {
  flex: 1 1 0 !important;
  min-height: 0 !important;
  height: auto !important;
  margin: 0 !important;
  padding: 52px 12px 12px 12px !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
}
/* 全屏下两行按比例分配：上排约 55%，下排约 45%，避免下排被拉得过长 */
.visual-center:fullscreen .main-content > .el-row:first-child {
  flex: 1.2 1 0 !important;
  min-height: 0 !important;
  display: flex !important;
}
.visual-center:fullscreen .main-content > .el-row.bottom-section {
  flex: 0.85 1 0 !important; /* 下排占比略小，避免图标被拉长 */
  min-height: 0 !important;
  display: flex !important;
}
.visual-center:fullscreen .main-content > .el-row .el-col {
  display: flex !important;
  flex-direction: column !important;
}
.visual-center:fullscreen .main-content .panel-box {
  flex: 1 1 0 !important;
  min-height: 0 !important;
  margin-bottom: 8px !important;
}
.visual-center:fullscreen .main-content .panel-equal-height,
.visual-center:fullscreen .main-content .panel-bottom-equal-height {
  height: auto !important;
  flex: 1 1 0 !important;
  min-height: 0 !important;
}
.visual-center:fullscreen .main-content .map-panel {
  height: auto !important;
  flex: 1 1 0 !important;
  min-height: 0 !important;
}
.visual-center:fullscreen .main-content .trend-chart,
.visual-center:fullscreen .main-content .level-chart,
.visual-center:fullscreen .main-content .status-chart {
  flex: 1 1 0 !important;
  min-height: 0 !important;
  height: auto !important;
}
.visual-center:fullscreen .main-content .type-list,
.visual-center:fullscreen .main-content .top-list {
  flex: 1 1 0 !important;
  min-height: 0 !important;
  height: auto !important;
  overflow-y: auto !important;
}
.visual-center:fullscreen .main-content .warning-viewer {
  flex: 1 1 0 !important;
  min-height: 0 !important;
  height: auto !important;
}
.visual-center:fullscreen .main-content .main-image-container {
  flex: 1 1 0 !important;
  min-height: 0 !important;
}
.visual-center:fullscreen .main-content .thumbnail-container-bottom {
  flex-shrink: 0 !important;
}

.visual-center:fullscreen .panel-box,
.visual-center:-webkit-full-screen .panel-box,
.visual-center:-moz-full-screen .panel-box,
.visual-center:-ms-fullscreen .panel-box {
  margin-bottom: 12px;
}

/* 全屏下最后一排面板贴底 */
.visual-center:fullscreen .main-content > .el-row:last-child .panel-box,
.visual-center:-webkit-full-screen .main-content > .el-row:last-child .panel-box,
.visual-center:-moz-full-screen .main-content > .el-row:last-child .panel-box,
.visual-center:-ms-fullscreen .main-content > .el-row:last-child .panel-box {
  margin-bottom: 0;
}

/* 表格透明样式 */
.transparent-row {
  background-color: transparent !important;
}

.warning-table >>> .el-table,
.device-table >>> .el-table {
  background-color: transparent;
  color: #7EAEE5;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

.warning-table >>> .el-table::-webkit-scrollbar,
.device-table >>> .el-table::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

/* 确保Element UI表格内部滚动条也隐藏 */
.warning-table >>> .el-table__body-wrapper::-webkit-scrollbar,
.device-table >>> .el-table__body-wrapper::-webkit-scrollbar {
  display: none;
}

.warning-table >>> .el-table__body-wrapper,
.device-table >>> .el-table__body-wrapper {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.warning-table >>> .el-table tr,
.device-table >>> .el-table tr {
  background-color: transparent !important;
}

.warning-table >>> .el-table--enable-row-hover .el-table__body tr:hover > td,
.device-table >>> .el-table--enable-row-hover .el-table__body tr:hover > td {
  background-color: rgba(0, 255, 255, 0.1) !important;
}

.warning-table >>> .el-table--striped .el-table__body tr.el-table__row--striped td,
.device-table >>> .el-table--striped .el-table__body tr.el-table__row--striped td {
  background-color: rgba(6, 30, 93, 0.3) !important;
}
</style>

