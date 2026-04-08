<template>
  <div class="algorithm-inference-platform">
    <!-- 顶部标题 -->
    <div class="top-bar">
      <span class="top-time">{{ currentTime }}</span>
      <el-radio-group
        class="time-tabs"
        v-model="timeRange"
        size="mini"
        :style="{ display: 'inline-flex', alignItems: 'center', flexWrap: 'nowrap' }"
        @change="handleTimeRangeChange"
      >
        <el-radio-button label="day">日</el-radio-button>
        <el-radio-button label="week">周</el-radio-button>
        <el-radio-button label="month">月</el-radio-button>
        <el-radio-button label="year">年</el-radio-button>
        <el-radio-button label="custom">自定义</el-radio-button>
      </el-radio-group>
      <div class="title"><span>太行AI智算中心</span></div>
      <div class="right-controls">
        <div class="location-info">
          <div v-if="locationInfo && locationInfo.loading" class="loading-indicator">
            <span>加载中...</span>
          </div>
          <template v-else>
            <span class="location"><i class="el-icon-location"></i> {{ locationInfo.location }}</span>
            <span class="weather-divider">|</span>
            <span class="weather-info"><i class="el-icon-sunny"></i> {{ locationInfo.weather }}</span>
            <span class="weather-divider">|</span>
            <span class="air-quality">{{ locationInfo.airQuality }}</span>
            <div class="fullscreen-btn" @click="toggleFullScreen">
              <i class="el-icon-full-screen"></i>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 自定义日期选择弹框 -->
    <el-dialog
      title="选择日期范围"
      :visible.sync="datePickerDialogVisible"
      width="420px"
      custom-class="custom-dialog"
      :append-to-body="true"
      :close-on-click-modal="false"
      :modal-append-to-body="false"
    >
      <el-date-picker
        v-model="customDateRange"
        type="daterange"
        value-format="yyyy-MM-dd"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        :append-to-body="false"
        style="width: 100%"
        :picker-options="{ disabledDate(time) { return time.getTime() > Date.now(); } }"
        popper-class="date-picker-dropdown"
      />
      <span slot="footer" class="dialog-footer">
        <el-button @click="cancelDatePicker" size="small">取 消</el-button>
        <el-button type="primary" @click="handleCustomDateChange" size="small">确 定</el-button>
      </span>
    </el-dialog>

    <div class="dashboard-container">
      <!-- 推理服务资源模块 -->
      <div class="dashboard-card resource-statistics">
        <div class="card-header">
          <div class="title">推理服务资源</div>
        </div>
        <div class="card-content">
          <div class="server-info">
            <div class="server-type">
              <i class="el-icon-connection server-icon"></i>
              <span>AI推理服务: <em style="color:#44FF9B;font-style:normal">运行中</em></span>
            </div>
          </div>

          <div class="resource-charts-wrap">
            <div class="resource-labels">
              <div class="resource-label">CPU</div>
              <div class="resource-label">内存</div>
              <div class="resource-label">存储</div>
              <div class="resource-label">GPU显存</div>
            </div>
            <div class="resource-charts">
            <div class="chart-item">
              <div class="chart-container">
                <div class="percentage-ring cpu"
                  :style="{ background: `conic-gradient(#3eaef9 ${cpuUsage * 3.6}deg, transparent 0deg)` }"></div>
                <div class="inner-circle">
                  <div class="liquid-container cpu">
                    <div class="liquid-wave"></div>
                  </div>
                </div>
                <div class="percentage-text cpu">{{ cpuUsage }}<span class="percentage-symbol">%</span></div>
              </div>
            </div>
            <div class="chart-item">
              <div class="chart-container">
                <div class="percentage-ring memory"
                  :style="{ background: `conic-gradient(#29de9c ${memoryUsage * 3.6}deg, transparent 0deg)` }"></div>
                <div class="inner-circle">
                  <div class="liquid-container memory">
                    <div class="liquid-wave"></div>
                  </div>
                </div>
                <div class="percentage-text memory">{{ memoryUsage }}<span class="percentage-symbol">%</span></div>
              </div>
            </div>
            <div class="chart-item">
              <div class="chart-container">
                <div class="percentage-ring disk"
                  :style="{ background: `conic-gradient(#ff9c38 ${diskUsage * 3.6}deg, transparent 0deg)` }"></div>
                <div class="inner-circle">
                  <div class="liquid-container disk">
                    <div class="liquid-wave"></div>
                  </div>
                </div>
                <div class="percentage-text disk">{{ diskUsage }}<span class="percentage-symbol">%</span></div>
              </div>
            </div>
            <div class="chart-item">
              <div class="chart-container">
                <div class="percentage-ring gpu"
                  :style="{ background: `conic-gradient(#ff5a5a ${gpuUsage * 3.6}deg, transparent 0deg)` }"></div>
                <div class="inner-circle">
                  <div class="liquid-container gpu">
                    <div class="liquid-wave"></div>
                  </div>
                </div>
                <div class="percentage-text gpu">{{ gpuUsage }}<span class="percentage-symbol">%</span></div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      <!-- 中间部分 - AI智慧大脑：可切换 3D 或 大脑图片 -->
      <div class="center-container">
        <div class="ai-brain-section">
          <div class="brain-display-wrap">
            <div id="threejs-brain" class="threejs-brain-container" v-show="!brainShowImage"></div>
            <div class="brain-image-wrap" v-show="brainShowImage">
              <div class="brain-image-bg"></div>
              <img :src="brainImageUrl" alt="智慧大脑" class="brain-static-img" />
            </div>
            <div class="brain-view-toggle" @click="brainShowImage = !brainShowImage" title="切换 2D / 3D">
              {{ brainShowImage ? '3D' : '2D' }}
            </div>
          </div>
          <div class="brain-stats">
            <div class="brain-stat-item">
              <div class="stat-value">{{ runningTasks }}</div>
              <div class="stat-label">运行任务</div>
            </div>
            <div class="brain-stat-item">
              <div class="stat-value">{{ loadedModels }}</div>
              <div class="stat-label">加载模型</div>
            </div>
            <div class="brain-stat-item">
              <div class="stat-value">{{ skillCount }}</div>
              <div class="stat-label">AI技能</div>
            </div>
            <div class="brain-stat-item">
              <div class="stat-value">{{ cameraStats.analyzing }}</div>
              <div class="stat-label">分析中</div>
            </div>
            <div class="brain-stat-item">
              <div class="stat-value">{{ todayAlertCount }}</div>
              <div class="stat-label">今日预警</div>
            </div>
          </div>
        </div>
      </div>

      <!-- AI技能：卡片网格 -->
      <div class="dashboard-card my-algorithms ai-skill-panel">
        <div class="card-header">
          <div class="title">AI技能</div>
          <span class="skill-count-badge">{{ myAlgorithms.length }}个</span>
        </div>
        <div class="card-content ai-skill-body">
          <div class="ai-skill-grid">
            <div class="ai-skill-card" v-for="item in displayedSkills" :key="item.id">
              <div class="ai-skill-name">{{ item.name }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最新预警模块 -->
      <div class="dashboard-card realtime-events">
        <div class="card-header">
          <div class="title">最新预警</div>
        </div>
        <div class="card-content">
          <div class="alert-preview-layout">
            <div class="alert-main-image" @click="showAlertImageDialog = true">
              <img :src="selectedAlert ? selectedAlert.image : ''" alt="" @error="e => e.target.src='/static/img/ai-brain.png'" />
              <div class="alert-image-overlay">
                <span class="alert-image-timestamp">{{ selectedAlert ? selectedAlert.time : '' }}</span>
                <span v-if="selectedAlert" class="alert-image-level-tag" :class="'alarm-level-' + selectedAlert.level">{{ selectedAlert.levelText }}</span>
              </div>
            </div>
            <div class="alert-thumb-column">
              <div class="alert-thumb-item"
                   v-for="(alert, index) in latestAlerts" :key="index"
                   :class="{ active: selectedAlert === alert }"
                   @click="selectedAlert = alert">
                <img :src="alert.image" alt="" @error="e => e.target.src='/static/img/ai-brain.png'" />
              </div>
            </div>
          </div>
          <div class="alert-info-bar" v-if="selectedAlert">
            <div class="alert-info-row">
              <span class="alert-info-label">时间</span>
              <span class="alert-info-value">{{ selectedAlert.time }}</span>
            </div>
            <div class="alert-info-row">
              <span class="alert-info-label">地点</span>
              <span class="alert-info-value">{{ selectedAlert.camera }}</span>
            </div>
            <div class="alert-info-row">
              <span class="alert-info-label">事件</span>
              <span class="alert-info-value alert-event-name">{{ selectedAlert.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 预警类型分布：饼图 + 底部图例 -->
      <div class="dashboard-card alarm-statistics">
        <div class="card-header">
          <div class="title">预警类型分布</div>
        </div>
        <div class="card-content">
          <div class="alarm-chart-section">
            <div v-show="!alarmDistEmpty" ref="alarmDistChart" class="alarm-dist-chart"></div>
            <div v-show="alarmDistEmpty" class="empty-data-placeholder">
              <i class="el-icon-pie-chart"></i>
              <span>暂无预警数据</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 摄像头概览模块 -->
      <div class="dashboard-card device-statistics">
        <div class="card-header">
          <div class="title">摄像头概览</div>
        </div>
        <div class="card-content">
          <div class="cam-total">
            <span class="cam-total-label">接入总数</span>
            <span class="cam-total-num">{{ cameraStats.total }}</span>
          </div>
          <div class="cam-circles">
            <div class="cam-circle-item">
              <div class="cam-ring online-ring">
                <svg viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" class="ring-bg" />
                  <circle cx="40" cy="40" r="34" class="ring-fg online-fg"
                    :style="{ strokeDasharray: (2 * Math.PI * 34), strokeDashoffset: (2 * Math.PI * 34) * (1 - (cameraStats.total ? cameraStats.online / cameraStats.total : 0)) }" />
                </svg>
                <span class="cam-ring-num online-num">{{ cameraStats.online }}</span>
              </div>
              <span class="cam-circle-label">在线</span>
            </div>
            <div class="cam-circle-item">
              <div class="cam-ring analyzing-ring">
                <svg viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" class="ring-bg" />
                  <circle cx="40" cy="40" r="34" class="ring-fg analyzing-fg"
                    :style="{ strokeDasharray: (2 * Math.PI * 34), strokeDashoffset: (2 * Math.PI * 34) * (1 - (cameraStats.total ? cameraStats.analyzing / cameraStats.total : 0)) }" />
                </svg>
                <span class="cam-ring-num analyzing-num">{{ cameraStats.analyzing }}</span>
              </div>
              <span class="cam-circle-label">分析中</span>
            </div>
            <div class="cam-circle-item">
              <div class="cam-ring offline-ring">
                <svg viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" class="ring-bg" />
                  <circle cx="40" cy="40" r="34" class="ring-fg offline-fg"
                    :style="{ strokeDasharray: (2 * Math.PI * 34), strokeDashoffset: (2 * Math.PI * 34) * (1 - (cameraStats.total ? cameraStats.offline / cameraStats.total : 0)) }" />
                </svg>
                <span class="cam-ring-num offline-num">{{ cameraStats.offline }}</span>
              </div>
              <span class="cam-circle-label">离线</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 预警趋势模块 -->
      <div class="dashboard-card alarm-info">
        <div class="card-header">
          <div class="title">预警趋势</div>
        </div>
        <div class="card-content">
          <div class="trend-chart">
            <div class="chart-header">
              <div class="trend-total">
                <span class="label">预警总数</span>
                <span class="value">{{ alertTrendLoading ? '...' : alertTrendTotal }}</span>
              </div>
            </div>
            <div ref="trendChartEl" class="trend-chart-echarts"></div>
          </div>
        </div>
      </div>

      <!-- 任务与复判概览（任务总数含离线；在线=已开启任务；复判技能=已发布；已启用复判=配置表开启数） -->
      <div class="dashboard-card alarm-forwarding">
        <div class="card-header">
          <div class="title">任务与复判概览</div>
        </div>
        <div class="card-content review-overview-content">
          <div class="review-kpi-grid">
            <div class="review-kpi" v-for="item in reviewKpiItems" :key="item.key">
              <div class="review-kpi-value">{{ item.value }}</div>
              <div class="review-kpi-label">{{ item.label }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片放大弹窗 -->
    <el-dialog :visible.sync="showAlertImageDialog" width="70%" top="5vh" custom-class="alert-image-dialog" append-to-body>
      <div class="dialog-image-wrap" v-if="selectedAlert">
        <img :src="selectedAlert.image" alt="预警截图" />
        <div class="dialog-alert-info">
          <span>{{ selectedAlert.name }}</span>
          <span>{{ selectedAlert.camera }}</span>
          <span>{{ selectedAlert.time }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as echarts from 'echarts';
import { alertAPI, cameraAPI, skillAPI, systemMonitorAPI } from '@/components/service/VisionAIService.js';

const LEVEL_MAP = { 1: 'urgent', 2: 'high', 3: 'medium', 4: 'low' };
const LEVEL_TEXT_MAP = { 1: '一级预警', 2: '二级预警', 3: '三级预警', 4: '四级预警' };

function statisticsFromResponse(res) {
  const d = res && res.data;
  if (!d) return null;
  if (d.statistics) return d.statistics;
  if (d.data && d.data.statistics) return d.data.statistics;
  return null;
}

function alertsFromRealTimeResponse(res) {
  const d = res && res.data;
  if (!d) return [];
  if (Array.isArray(d.data)) return d.data;
  if (Array.isArray(d.alerts)) return d.alerts;
  return [];
}

const _inflightStats = {};
function fetchStatsDedupe(params) {
  const key = `${params.granularity}:${params.start_date}:${params.end_date}`;
  if (_inflightStats[key]) return _inflightStats[key];
  const promise = alertAPI.getAlertStatistics(params).finally(() => {
    delete _inflightStats[key];
  });
  _inflightStats[key] = promise;
  return promise;
}

export default {
  name: 'AlgorithmInference',
  data() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const initTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    return {
      currentTime: initTime,
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      gpuUsage: 0,
      loadedModels: 0,
      runningTasks: 0,
      skillCount: 0,
      timerID: null,
      cubeRotateID: null,
      locationInfo: {
        location: '--',
        weather: '-- --',
        airQuality: '',
        loading: false
      },
      myAlgorithms: [],
      alarmDistChart: null,
      alarmDistEmpty: true,
      skillDisplayOffset: 0,
      skillCarouselTimer: null,
      brainShowImage: false,
      brainImageUrl: '/static/img/ai-brain.png',
      cameraStats: {
        total: 0,
        online: 0,
        analyzing: 0,
        offline: 0
      },
      selectedAlert: null,
      showAlertImageDialog: false,
      skillIcons: [
        'el-icon-aim', 'el-icon-view', 'el-icon-lightning',
        'el-icon-warning-outline', 'el-icon-lock', 'el-icon-discover',
        'el-icon-position', 'el-icon-search'
      ],
      latestAlerts: [],
      alertTrendTotal: 0,
      todayAlertCount: 0,
      timeRange: 'day',
      customDateRange: [],
      datePickerDialogVisible: false,
      alertTrendLoading: false,
      reviewStats: {
        total: 0,
        online: 0,
        reviewSkills: 0,
        reviewEnabled: 0,
      },
      trendChartInstance: null,
      // Three.js相关变量
      cubeScene: null,
      cubeCamera: null,
      cubeRenderer: null,
      cube: null,
      cubeBase: null,
      lightBeams: null,
      cubeParticles: null,
      cubeAnimationId: null,
      controls: null,
      labelGroup: null,
      particles: null,
      dataColumn: null,
      scanningLight: null,
      circuitGroup: null,
      spiralGroup: null,
      branchGroup: null,
      nodeGroup: null,
      spreadParticles: null,
      scanningRing: null,
      energyField: null,
      energyBeam: null,
      hexaStar: null,
      topRingGroup: null,
      bottomRingGroup: null,
      labelElements: null,
      modelContainer: null,
      currentDragIndex: null,
      initialX: null,
      initialY: null,
      initialPosX: null,
      initialPosY: null,
      algoScene: null,
      algoCamera: null,
      algoRenderer: null,
      algoSphereGroup: null,
      algoAnimationId: null,
      algoControls: null,
      tooltipVisible: false,
      tooltipText: '',
      tooltipStyle: {
        position: 'absolute',
        top: '0',
        left: '0',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: '#fff',
        padding: '5px',
        borderRadius: '5px',
        zIndex: 1000
      }
    }
  },
  computed: {
    displayedSkills() {
      const list = this.myAlgorithms || [];
      const n = 8;
      if (list.length <= n) return list;
      const o = this.skillDisplayOffset % list.length;
      if (o + n <= list.length) return list.slice(o, o + n);
      return [...list.slice(o), ...list.slice(0, o + n - list.length)];
    },
    reviewKpiItems() {
      const s = this.reviewStats;
      return [
        { key: 'total', label: '任务总数', value: s.total },
        { key: 'online', label: '在线任务数', value: s.online },
        { key: 'reviewSkills', label: '可用复判技能', value: s.reviewSkills },
        { key: 'reviewEnabled', label: '已启用复判', value: s.reviewEnabled },
      ];
    },
  },
  watch: {},
  mounted() {
    this.updateTime();
    this.timer = setInterval(this.updateTime, 1000);

    document.addEventListener('fullscreenchange', this.handleFullscreenChange);

    this.fetchWeather();

    this.$nextTick(() => {
      this.initBrainScene();
      this.fetchAll().then(() => {
        this.$nextTick(() => {
          this.handleTrendChartResize();
          this.handleAlarmDistChartResize();
        });
      });
      this.startSkillCarousel();
      window.addEventListener('resize', this.handleResize);
      window.addEventListener('resize', this.handleAlarmDistChartResize);
      window.addEventListener('resize', this.handleTrendChartResize);

      setTimeout(() => {
        this.handleResize();
        this.handleTrendChartResize();
        this.handleAlarmDistChartResize();
      }, 500);
    });

    this.resourceTimer = setInterval(() => {
      this.fetchSystemResources();
    }, 10000);
  },
  beforeDestroy() {
    // 清除定时器
    if (this.timer) {
      clearInterval(this.timer);
    }
    if (this.skillCarouselTimer) {
      clearInterval(this.skillCarouselTimer);
      this.skillCarouselTimer = null;
    }

    // 移除全屏变化事件监听器
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);

    // 清除动画循环
    if (this.cubeAnimationId) {
      cancelAnimationFrame(this.cubeAnimationId);
    }
    if (this.algoAnimationId) {
      cancelAnimationFrame(this.algoAnimationId);
    }
    if (this.resourceTimer) clearInterval(this.resourceTimer);
    if (this.trendChartInstance) this.trendChartInstance.dispose();
    if (this.alarmDistChart) this.alarmDistChart.dispose();
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('resize', this.handleTrendChartResize);
    window.removeEventListener('resize', this.handleAlgoResize);
    window.removeEventListener('resize', this.handleAlarmDistChartResize);

    if (this.alarmDistChart) {
      this.alarmDistChart.dispose();
      this.alarmDistChart = null;
    }

    // 清除资源图表
    if (this.resourceChart) {
      this.resourceChart.dispose();
    }

    // 清除Three.js资源
    if (this.algoRenderer) {
      this.algoRenderer.dispose();
    }

    // 清除大脑场景
    this.disposeBrainScene();
  },
  methods: {
    async fetchWeather() {
      this.locationInfo.loading = true;
      try {
        const ipResp = await fetch('http://ip-api.com/json/?lang=zh-CN&fields=city,regionName');
        const ipData = await ipResp.json();
        const province = ipData.regionName || '';
        const city = ipData.city || '';
        if (province && city && province !== city) {
          this.locationInfo.location = `${province} ${city}`;
        } else {
          this.locationInfo.location = city || province || '未知地区';
        }
        const weatherCity = encodeURIComponent(city || '');
        const wttrResp = await fetch(`https://wttr.in/${weatherCity}?format=j1&lang=zh`);
        const wttrData = await wttrResp.json();
        const cur = wttrData.current_condition && wttrData.current_condition[0];
        if (cur) {
          const tempC = cur.temp_C || '--';
          const desc = (cur.lang_zh && cur.lang_zh[0] && cur.lang_zh[0].value)
            || (cur.weatherDesc && cur.weatherDesc[0] && cur.weatherDesc[0].value) || '';
          const humidity = cur.humidity || '--';
          this.locationInfo.weather = `${desc} ${tempC}°C`;
          this.locationInfo.airQuality = `湿度 ${humidity}%`;
        }
      } catch (e) {
        console.error('获取天气失败:', e);
      } finally {
        this.locationInfo.loading = false;
      }
    },
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
    getDateRange(range) {
      const now = new Date();
      const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const today = fmt(now);
      if (range === 'day') return { start_date: today, end_date: today };
      if (range === 'week') {
        const start = new Date(now); start.setDate(now.getDate() - 6);
        return { start_date: fmt(start), end_date: today };
      }
      if (range === 'year') {
        const start = new Date(now.getFullYear(), 0, 1);
        return { start_date: fmt(start), end_date: today };
      }
      if (range === 'custom') {
        if (this.customDateRange && this.customDateRange.length === 2) {
          return { start_date: this.customDateRange[0], end_date: this.customDateRange[1] };
        }
        return null;
      }
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start_date: fmt(start), end_date: today };
    },
    handleTimeRangeChange(value) {
      if (value === 'custom') {
        this.datePickerDialogVisible = true;
      } else {
        this.fetchAllStats();
      }
    },
    handleCustomDateChange() {
      if (this.customDateRange && this.customDateRange.length === 2) {
        this.datePickerDialogVisible = false;
        this.fetchAllStats();
      }
    },
    cancelDatePicker() {
      this.datePickerDialogVisible = false;
      if (!this.customDateRange || this.customDateRange.length !== 2) {
        this.timeRange = 'day';
      }
    },
    async fetchAllStats() {
      await Promise.all([
        this.fetchTrendData().catch(e => console.error('fetchTrendData:', e)),
        this.fetchAlarmDistData().catch(e => console.error('fetchAlarmDistData:', e)),
      ]);
    },
    async fetchAll() {
      await Promise.all([
        this.fetchTodayCount().catch(e => console.error('fetchTodayCount:', e)),
        this.fetchTrendData().catch(e => console.error('fetchTrendData:', e)),
        this.fetchAlarmDistData().catch(e => console.error('fetchAlarmDistData:', e)),
        this.fetchRecentAlerts().catch(e => console.error('fetchRecentAlerts:', e)),
        this.fetchSystemResources().catch(e => console.error('fetchSystemResources:', e)),
        this.fetchSkillList().catch(e => console.error('fetchSkillList:', e)),
        this.fetchCameraStats().catch(e => console.error('fetchCameraStats:', e)),
      ]);
    },
    async fetchTodayCount() {
      try {
        const dateRange = this.getDateRange('day');
        const res = await fetchStatsDedupe({ granularity: 'hour', ...dateRange });
        const stats = statisticsFromResponse(res);
        if (!stats) return;
        this.todayAlertCount = (stats.summary || {}).total_alerts || 0;
      } catch (e) {
        console.error('获取今日预警总数失败:', e);
      }
    },
    async fetchTrendData() {
      this.alertTrendLoading = true;
      try {
        const range = this.timeRange;
        const granularity = range === 'day' ? 'hour' : range === 'year' ? 'month' : 'day';
        const dateRange = this.getDateRange(range);
        const res = await fetchStatsDedupe({ granularity, ...dateRange });
        const stats = statisticsFromResponse(res);
        if (!stats) return;
        this.alertTrendTotal = (stats.summary || {}).total_alerts || 0;
        const trend = stats.trend || [];
        this.renderTrendChart(trend.map(t => t.label), trend.map(t => t.count));
      } catch (e) {
        console.error('获取趋势数据失败:', e);
      } finally {
        this.alertTrendLoading = false;
      }
    },
    async fetchAlarmDistData() {
      try {
        const dateRange = this.getDateRange(this.timeRange);
        const res = await fetchStatsDedupe({ granularity: 'day', ...dateRange });
        const stats = statisticsFromResponse(res);
        if (!stats) return;
        const byType = stats.by_type || [];
        const colors = ['#447CF9', '#FF9500', '#FF2D55', '#4CD964', '#9b59b6', '#06b6d4', '#e74c3c', '#f1c40f'];
        const pieData = byType.map((t, i) => ({
          value: t.count,
          name: t.name,
          itemStyle: { color: colors[i % colors.length] }
        }));
        const wasEmpty = this.alarmDistEmpty;
        this.alarmDistEmpty = pieData.length === 0 || pieData.every(d => d.value === 0);
        if (!this.alarmDistEmpty) {
          if (wasEmpty) {
            this.$nextTick(() => {
              this.renderAlarmDistChart(pieData);
              if (this.alarmDistChart) this.alarmDistChart.resize();
            });
          } else {
            this.renderAlarmDistChart(pieData);
          }
        }
      } catch (e) {
        console.error('获取类型分布失败:', e);
      }
    },
    async fetchRecentAlerts() {
      try {
        const res = await alertAPI.getRealTimeAlerts({ page: 1, limit: 6 });
        const alerts = alertsFromRealTimeResponse(res);
        this.latestAlerts = alerts.map(a => ({
          name: a.alert_name || a.skill_name_zh || a.alert_type || '未知预警',
          camera: a.camera_name || a.location || '--',
          location: a.location || '--',
          time: a.alert_time ? a.alert_time.replace('T', ' ').slice(0, 19) : '--',
          level: a.alert_level || 3,
          levelText: LEVEL_TEXT_MAP[a.alert_level] || '三级预警',
          image: a.minio_frame_url || '/static/img/ai-brain.png',
        }));
        this.selectedAlert = this.latestAlerts[0] || null;
      } catch (e) {
        console.error('获取最新预警失败:', e);
      }
    },
    async fetchSystemResources() {
      try {
        const res = await systemMonitorAPI.getSystemResources();
        const d = res && res.data;
        if (!d) return;
        this.cpuUsage = d.cpu_percent != null ? d.cpu_percent : 0;
        this.memoryUsage = d.memory ? d.memory.percent : 0;
        this.diskUsage = d.disk ? d.disk.percent : 0;
        if (d.gpu && d.gpu.available && d.gpu.devices && d.gpu.devices.length > 0) {
          this.gpuUsage = d.gpu.devices[0].utilization_percent || 0;
        } else {
          this.gpuUsage = 0;
        }
        if (typeof d.running_tasks === 'number') this.runningTasks = d.running_tasks;
        if (typeof d.loaded_models === 'number') this.loadedModels = d.loaded_models;
        if (typeof d.skill_count === 'number') this.skillCount = d.skill_count;
        this.reviewStats = {
          total: typeof d.ai_task_total === 'number' ? d.ai_task_total : 0,
          online: typeof d.ai_task_online === 'number' ? d.ai_task_online : 0,
          reviewSkills: typeof d.available_review_skills === 'number' ? d.available_review_skills : 0,
          reviewEnabled: typeof d.ai_tasks_review_enabled === 'number' ? d.ai_tasks_review_enabled : 0,
        };

        // 同步更新"分析中"摄像头数（如果已有摄像头列表）
        if (this.cameraStats.total > 0 && Array.isArray(d.analyzing_camera_ids)) {
          const analyzingSet = new Set(d.analyzing_camera_ids.map(Number));
          this._analyzingSet = analyzingSet;
          this.cameraStats = {
            ...this.cameraStats,
            analyzing: d.analyzing_camera_ids.length,
          };
        }
      } catch (e) {
        console.error('获取系统资源失败:', e);
      }
    },
    async fetchSkillList() {
      try {
        const res = await skillAPI.getSkillList({ page: 1, limit: 100, is_detail: false });
        const d = res && res.data;
        const list = (d && Array.isArray(d.data)) ? d.data : [];
        this.myAlgorithms = list.map(s => ({
          id: String(s.id || s.skill_class_id || ''),
          name: s.name_zh || s.name || s.skill_name || '未知技能',
          size: 1,
        }));
        this.skillCount = this.myAlgorithms.length;
      } catch (e) {
        console.error('获取技能列表失败:', e);
      }
    },
    async fetchCameraStats() {
      try {
        const cameraRes = await cameraAPI.getCameraList({ page: 1, limit: 100 });
        const d = cameraRes && cameraRes.data;
        const cameras = (d && Array.isArray(d.data)) ? d.data : [];
        const total = d.total || cameras.length;
        const online = cameras.filter(c => c.status === true || c.status === 'online').length;
        const offline = cameras.filter(c => c.status === false || c.status === 'offline').length;

        let analyzing = 0;
        try {
          const sysRes = await systemMonitorAPI.getSystemResources();
          const analyzingIds = (sysRes && sysRes.data && sysRes.data.analyzing_camera_ids) || [];
          const analyzingSet = new Set(analyzingIds.map(Number));
          analyzing = cameras.filter(c => analyzingSet.has(Number(c.id))).length;
        } catch (_) {
          analyzing = 0;
        }

        this.cameraStats = { total, online, analyzing, offline };
      } catch (e) {
        console.error('获取摄像头统计失败:', e);
      }
    },
    renderTrendChart(xData, yData) {
      const dom = this.$refs.trendChartEl;
      if (!dom) return;
      if (!this.trendChartInstance) this.trendChartInstance = echarts.init(dom);

      const needRotate = this.timeRange === 'month'
        || (this.timeRange === 'custom' && xData.length > 10);

      this.trendChartInstance.setOption({
        backgroundColor: 'transparent',
        grid: { top: 30, bottom: needRotate ? 40 : 20, left: 0, right: 15, containLabel: true },
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(0,19,40,0.8)',
          borderColor: 'rgba(0,149,255,0.3)',
          textStyle: { color: '#00BFFF' },
          formatter: params => `${params[0].name}<br/>预警数: <b>${params[0].value}</b>`,
        },
        xAxis: {
          type: 'category', data: xData, boundaryGap: false,
          axisLine: { lineStyle: { color: 'rgba(120,140,180,0.3)' } },
          axisLabel: {
            color: '#7888a8',
            fontSize: 10,
            rotate: needRotate ? 45 : 0,
            interval: needRotate ? 'auto' : xData.length > 20 ? 'auto' : 0,
          },
        },
        yAxis: {
          type: 'value', min: 0, minInterval: 1,
          splitLine: { lineStyle: { color: 'rgba(120,140,180,0.15)' } },
          axisLabel: { color: '#7888a8', fontSize: 10 },
        },
        series: [{
          type: 'line', data: yData, smooth: true, symbol: 'circle', symbolSize: 5,
          lineStyle: { color: '#0095ff', width: 2 },
          itemStyle: { color: '#0095ff', borderColor: '#fff', borderWidth: 1 },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0,149,255,0.4)' },
            { offset: 1, color: 'rgba(0,149,255,0.02)' },
          ]) },
        }],
      }, true);
    },
    handleTrendChartResize() {
      if (this.trendChartInstance) this.trendChartInstance.resize();
    },
    updateTime() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      this.currentTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    toggleFullScreen() {
      const navBar = document.querySelector('.el-header'); // 选择顶部导航栏元素

      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
          // 进入全屏后隐藏导航栏
          if (navBar) navBar.style.display = 'none';
        }).catch(err => {
          console.error('全屏切换失败:', err);
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().then(() => {
            // 退出全屏后显示导航栏
            if (navBar) navBar.style.display = '';
          }).catch(err => {
            console.error('退出全屏失败:', err);
          });
        }
      }
    },
    initBrainScene() {
      const container = document.getElementById('threejs-brain');
      if (!container) {
        console.warn('[Brain] container #threejs-brain not found');
        return;
      }

      const width = container.clientWidth || container.offsetWidth || 400;
      const height = container.clientHeight || container.offsetHeight || 400;
      if (width < 10 || height < 10) {
        if (!this._brainRetries) this._brainRetries = 0;
        if (this._brainRetries < 10) {
          this._brainRetries++;
          setTimeout(() => this.initBrainScene(), 300);
        } else {
          console.warn('[Brain] container still has no size after retries:', width, height);
        }
        return;
      }

      try {
      this.brainScene = new THREE.Scene();

      this.brainCamera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
      this.brainCamera.position.set(0, 2, 18);
      this.brainCamera.lookAt(0, 0, 0);

      this.brainRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.brainRenderer.setSize(width, height);
      this.brainRenderer.setPixelRatio(window.devicePixelRatio);
      this.brainRenderer.setClearColor(0x000000, 0);
      container.appendChild(this.brainRenderer.domElement);

      this.brainControls = new OrbitControls(this.brainCamera, this.brainRenderer.domElement);
      this.brainControls.enableDamping = true;
      this.brainControls.dampingFactor = 0.05;
      this.brainControls.enableZoom = true;
      this.brainControls.enableRotate = true;
      this.brainControls.minDistance = 12;
      this.brainControls.maxDistance = 55;
      this.brainControls.target.set(0, 1.5, 0);
      this.brainControls.rotateSpeed = 0.5;

      const brainGroup = new THREE.Group();
      this.brainScene.add(brainGroup);
      this.brainGroup = brainGroup;

      const brainPoints = [];
      const brainSurfacePoints = [];

      const brainShape = (u, v) => {
        const theta = u * Math.PI;
        const phi = v * 2 * Math.PI;

        let rx = 7.5, ry = 6.0, rz = 8.5;

        const fissureDepth = 0.9 + 0.1 * Math.cos(phi * 3);
        const topBulge = theta < Math.PI * 0.5 ? 1.0 + 0.25 * Math.sin(theta * 2) : 1.0;
        const asymmetry = 1.0 + 0.08 * Math.sin(phi * 2 + 0.5);

        let x = rx * Math.sin(theta) * Math.cos(phi) * fissureDepth * asymmetry;
        let y = ry * Math.cos(theta) * topBulge;
        let z = rz * Math.sin(theta) * Math.sin(phi);

        const fissure = Math.abs(Math.cos(phi));
        if (fissure < 0.15 && theta < Math.PI * 0.8) {
          const indent = (0.15 - fissure) / 0.15 * 2.5;
          y -= indent * Math.sin(theta);
        }

        const gyrus = 0.3 * Math.sin(theta * 6 + phi * 4) + 0.2 * Math.sin(theta * 8 - phi * 3);
        x += gyrus * Math.sin(theta) * Math.cos(phi) * 0.5;
        y += gyrus * Math.cos(theta) * 0.3;
        z += gyrus * Math.sin(theta) * Math.sin(phi) * 0.5;

        y += 1.5;

        return new THREE.Vector3(x, y, z);
      };

      const surfRes = 50;
      for (let i = 0; i <= surfRes; i++) {
        for (let j = 0; j <= surfRes; j++) {
          const p = brainShape(i / surfRes, j / surfRes);
          brainSurfacePoints.push(p);
        }
      }

      const particleCount = 3000;
      for (let i = 0; i < particleCount; i++) {
        const u = Math.random();
        const v = Math.random();
        const depth = 0.3 + Math.random() * 0.7;
        const surfPoint = brainShape(u, v);
        brainPoints.push(new THREE.Vector3(
          surfPoint.x * depth,
          surfPoint.y * depth + (1 - depth) * 1.5,
          surfPoint.z * depth
        ));
      }
      for (let i = 0; i < 1200; i++) {
        const u = Math.random();
        const v = Math.random();
        const surfPoint = brainShape(u, v);
        const jitter = 0.92 + Math.random() * 0.16;
        brainPoints.push(new THREE.Vector3(
          surfPoint.x * jitter,
          surfPoint.y * jitter,
          surfPoint.z * jitter
        ));
      }

      const particleGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(brainPoints.length * 3);
      const colors = new Float32Array(brainPoints.length * 3);
      const sizes = new Float32Array(brainPoints.length);

      brainPoints.forEach((p, i) => {
        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;

        const dist = p.length() / 10;
        const r = 0.05 + dist * 0.25;
        const g = 0.75 + Math.random() * 0.25;
        const b = 0.95 + Math.random() * 0.05;
        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;

        sizes[i] = 0.15 + Math.random() * 0.25;
      });

      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      const particleMaterial = new THREE.ShaderMaterial({
        uniforms: {},
        vertexShader: [
          'attribute float size;',
          'attribute vec3 color;',
          'varying vec3 vColor;',
          'void main() {',
          '  vColor = color;',
          '  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);',
          '  gl_PointSize = size * (500.0 / -mvPosition.z);',
          '  gl_Position = projectionMatrix * mvPosition;',
          '}'
        ].join('\n'),
        fragmentShader: [
          'varying vec3 vColor;',
          'void main() {',
          '  float d = length(gl_PointCoord - vec2(0.5));',
          '  if (d > 0.5) discard;',
          '  float alpha = 1.0 - smoothstep(0.0, 0.5, d);',
          '  gl_FragColor = vec4(vColor * 1.5, alpha * 0.9);',
          '}'
        ].join('\n'),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });

      const particles = new THREE.Points(particleGeometry, particleMaterial);
      brainGroup.add(particles);
      this.brainParticles = particles;

      const lineCount = 600;
      const linePositions = [];
      const lineColors = [];

      for (let i = 0; i < lineCount; i++) {
        const idx1 = Math.floor(Math.random() * brainPoints.length);
        let idx2 = Math.floor(Math.random() * brainPoints.length);
        const p1 = brainPoints[idx1];
        const p2 = brainPoints[idx2];
        const dist = p1.distanceTo(p2);
        if (dist > 0.5 && dist < 4.0) {
          linePositions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
          const alpha = 1.0 - dist / 4.0;
          lineColors.push(0.1, 0.85 * alpha, 1.0 * alpha, 0.1, 0.85 * alpha, 1.0 * alpha);
        }
      }

      if (linePositions.length > 0) {
        const lineGeometry = new THREE.BufferGeometry();
        lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));
        const lineMaterial = new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0.45,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
        brainGroup.add(lines);
        this.brainLines = lines;
      }

      const surfaceGeometry = new THREE.BufferGeometry();
      const surfPositions = [];
      const surfColors2 = [];
      brainSurfacePoints.forEach(p => {
        surfPositions.push(p.x, p.y, p.z);
        surfColors2.push(0.1, 0.7, 1.0);
      });
      surfaceGeometry.setAttribute('position', new THREE.Float32BufferAttribute(surfPositions, 3));
      surfaceGeometry.setAttribute('color', new THREE.Float32BufferAttribute(surfColors2, 3));

      const surfMaterial = new THREE.PointsMaterial({
        size: 0.06,
        vertexColors: true,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const surfaceParticles = new THREE.Points(surfaceGeometry, surfMaterial);
      brainGroup.add(surfaceParticles);

      const pulseCount = 15;
      this.brainPulses = [];
      for (let i = 0; i < pulseCount; i++) {
        const idx = Math.floor(Math.random() * brainPoints.length);
        const origin = brainPoints[idx].clone();
        const pulseGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const pulseMat = new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending
        });
        const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
        pulseMesh.position.copy(origin);
        brainGroup.add(pulseMesh);
        this.brainPulses.push({
          mesh: pulseMesh,
          origin: origin,
          target: brainPoints[Math.floor(Math.random() * brainPoints.length)].clone(),
          progress: Math.random(),
          speed: 0.003 + Math.random() * 0.008
        });
      }

      this.brainPoints = brainPoints;
      this.brainClock = new THREE.Clock();

      this.animateBrain();

      window.addEventListener('resize', this.handleBrainResize);
      } catch (e) {
        console.error('[Brain] initBrainScene failed:', e);
      }
    },

    animateBrain() {
      this.brainAnimationId = requestAnimationFrame(this.animateBrain);

      const elapsed = this.brainClock.getElapsedTime();

      this.brainGroup.rotation.y = elapsed * 0.15;
      this.brainGroup.rotation.x = Math.sin(elapsed * 0.2) * 0.05;

      const sizes = this.brainParticles.geometry.attributes.size.array;
      for (let i = 0; i < sizes.length; i++) {
        sizes[i] = 0.15 + 0.12 * Math.sin(elapsed * 2 + i * 0.1);
      }
      this.brainParticles.geometry.attributes.size.needsUpdate = true;

      if (this.brainLines) {
        this.brainLines.material.opacity = 0.4 + 0.2 * Math.sin(elapsed * 1.5);
      }

      this.brainPulses.forEach(pulse => {
        pulse.progress += pulse.speed;
        if (pulse.progress >= 1) {
          pulse.progress = 0;
          pulse.origin = pulse.target.clone();
          pulse.target = this.brainPoints[Math.floor(Math.random() * this.brainPoints.length)].clone();
        }
        pulse.mesh.position.lerpVectors(pulse.origin, pulse.target, pulse.progress);
        pulse.mesh.material.opacity = 0.8 * Math.sin(pulse.progress * Math.PI);
        const s = 0.8 + 0.4 * Math.sin(pulse.progress * Math.PI);
        pulse.mesh.scale.setScalar(s);
      });

      if (this.brainControls) this.brainControls.update();
      this.brainRenderer.render(this.brainScene, this.brainCamera);
    },

    handleBrainResize() {
      const container = document.getElementById('threejs-brain');
      if (!container || !this.brainRenderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      this.brainCamera.aspect = w / h;
      this.brainCamera.updateProjectionMatrix();
      this.brainRenderer.setSize(w, h);
    },

    disposeBrainScene() {
      if (this.brainAnimationId) {
        cancelAnimationFrame(this.brainAnimationId);
      }
      window.removeEventListener('resize', this.handleBrainResize);
      if (this.brainControls) {
        this.brainControls.dispose();
        this.brainControls = null;
      }
      if (this.brainRenderer) {
        this.brainRenderer.dispose();
        const container = document.getElementById('threejs-brain');
        if (container && this.brainRenderer.domElement.parentNode === container) {
          container.removeChild(this.brainRenderer.domElement);
        }
      }
      if (this.brainScene) {
        this.brainScene.traverse(obj => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
            else obj.material.dispose();
          }
        });
      }
    },

    startSkillCarousel() {
      if (this.skillCarouselTimer) return;
      this.skillCarouselTimer = setInterval(() => {
        const len = this.myAlgorithms.length;
        if (len <= 8) return;
        this.skillDisplayOffset = (this.skillDisplayOffset + 8) % len;
      }, 3000);
    },
    renderAlarmDistChart(data) {
      const el = this.$refs.alarmDistChart;
      if (!el) return;
      if (!this.alarmDistChart) this.alarmDistChart = echarts.init(el);
      this.alarmDistChart.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item', formatter: '{b}: {c}条 ({d}%)' },
        legend: {
          orient: 'vertical',
          right: '2%',
          top: 'middle',
          textStyle: { color: '#9eb3d4', fontSize: 11 },
          itemWidth: 10,
          itemHeight: 10,
          itemGap: 10,
          formatter: name => {
            const item = data.find(d => d.name === name);
            return item ? `${name}  ${item.value}` : name;
          },
          data: data.map(d => d.name)
        },
        series: [{
          type: 'pie',
          radius: ['40%', '65%'],
          center: ['30%', '50%'],
          data: data,
          label: { show: false },
          labelLine: { show: false },
          emphasis: { scale: true, itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.3)' } }
        }]
      }, true);
    },
    handleAlarmDistChartResize() {
      if (this.alarmDistChart) this.alarmDistChart.resize();
    },

    initCubeScene() {
      // 获取容器
      const container = document.getElementById('threejs-cube');
      if (!container) return;

      // 创建场景
      this.cubeScene = new THREE.Scene();
      this.cubeScene.background = new THREE.Color(0x000611); // 更深的黑蓝色背景

      // 创建一个总容器，用于整体移动模型
      this.modelContainer = new THREE.Group();
      this.cubeScene.add(this.modelContainer);
      this.modelContainer.position.y = 1; // 整体向下移动2个单位

      // 创建相机 - 调整位置更好地观察场景
      this.cubeCamera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
      this.cubeCamera.position.set(0, 5, 35); // 更正面的视角
      this.cubeCamera.lookAt(0, 8, 0); // 向上看一点，聚焦在中心点

      // 创建渲染器
      this.cubeRenderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        logarithmicDepthBuffer: true  // 提高深度缓冲精度
      });
      this.cubeRenderer.setSize(container.clientWidth, container.clientHeight);
      this.cubeRenderer.setPixelRatio(window.devicePixelRatio);
      this.cubeRenderer.shadowMap.enabled = true;
      container.appendChild(this.cubeRenderer.domElement);

      // 增强环境光
      const ambientLight = new THREE.AmbientLight(0x0a1a2a, 0.4);
      this.cubeScene.add(ambientLight);

      // 添加多个方向光以增强效果
      const directionalLight = new THREE.DirectionalLight(0x4e79ff, 0.8);
      directionalLight.position.set(5, 10, 5);
      directionalLight.castShadow = true;
      this.cubeScene.add(directionalLight);

      const directionalLight2 = new THREE.DirectionalLight(0x4e79ff, 0.5);
      directionalLight2.position.set(-5, 8, -5);
      this.cubeScene.add(directionalLight2);

      // 添加更亮的点光源在中心
      const pointLight = new THREE.PointLight(0x3a9eff, 2.5, 50);
      pointLight.position.set(0, 5, 0);
      this.cubeScene.add(pointLight);

      // 添加第二个点光源
      const pointLight2 = new THREE.PointLight(0x66ffff, 1.5, 30);
      pointLight2.position.set(0, 15, 0);
      this.cubeScene.add(pointLight2);

      // 添加相机控制
      const controls = new OrbitControls(this.cubeCamera, this.cubeRenderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enableZoom = true; // 允许缩放
      controls.minDistance = 20; // 设置最小距离
      controls.maxDistance = 50; // 设置最大距离
      controls.enablePan = true; // 允许平移
      controls.rotateSpeed = 0.2;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.2; // 降低旋转速度使其更加平滑
      controls.target.set(0, 8, 0); // 设置旋转中心点更高

      // 设置更合适的相机限制
      controls.minPolarAngle = Math.PI * 0.15; // 限制俯仰角最小值
      controls.maxPolarAngle = Math.PI * 0.45; // 限制俯仰角最大值

      // 设置初始视角旋转角度
      this.cubeCamera.position.x = Math.cos(-Math.PI / 6) * this.cubeCamera.position.z;
      this.cubeCamera.position.z = Math.sin(-Math.PI / 6) * this.cubeCamera.position.z * 1.2;

      this.controls = controls;

      // 创建数据柱和标签
      this.createDataColumn();
      this.createDataLabels();
      this.createBaseCircle();
      this.createBackgroundCircuitEffects(); // 添加背景电路效果

      // 开始动画循环
      this.animateCube();
    },

    // 创建底部圆环
    createBaseCircle() {
      // 创建底部主圆环
      const ringGeometry = new THREE.RingGeometry(12, 14, 64);
      const ringMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0.0 },
          color1: { value: new THREE.Color(0x0055ff) },
          color2: { value: new THREE.Color(0x00d9ff) }
        },
        vertexShader: `
          varying vec2 vUv;
          
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform vec3 color1;
          uniform vec3 color2;
          varying vec2 vUv;
          
          void main() {
            float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
            float normalizedAngle = (angle + 3.14159) / (2.0 * 3.14159);
            float wave = sin(normalizedAngle * 20.0 + time * 2.0) * 0.5 + 0.5;
            
            // 创建渐变和脉冲效果
            vec3 finalColor = mix(color1, color2, wave);
            
            // 外圈透明度渐变
            float edgeGlow = 0.8 + sin(time * 3.0) * 0.2;
            
            gl_FragColor = vec4(finalColor, 0.7 * edgeGlow);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide
      });

      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -0.5;
      this.modelContainer.add(ring);

      // 存储引用以便动画更新
      this.baseRing = ring;

      // 创建内环 - 更光滑的过渡
      const innerRingGeometry = new THREE.RingGeometry(9, 9.5, 64);
      const innerRingMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0.0 },
          color1: { value: new THREE.Color(0x0066ff) },
          color2: { value: new THREE.Color(0x00a5ff) }
        },
        vertexShader: `
          varying vec2 vUv;
          
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform vec3 color1;
          uniform vec3 color2;
          varying vec2 vUv;
          
          void main() {
            // 旋转发光效果
            float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
            float dist = length(vec2(vUv.x - 0.5, vUv.y - 0.5));
            float pulse = 0.5 + sin(time * 2.0) * 0.5;
            float innerGlow = smoothstep(0.4, 0.5, dist) * pulse;
            
            // 环形扫描线
            float scan = mod(angle + time, 3.14159 * 2.0) / (3.14159 * 2.0);
            float scanLine = smoothstep(0.0, 0.02, scan) * smoothstep(0.04, 0.02, scan);
            
            vec3 finalColor = mix(color1, color2, innerGlow + scanLine);
            
            gl_FragColor = vec4(finalColor, 0.8 + scanLine * 0.2);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide
      });

      const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
      innerRing.rotation.x = Math.PI / 2;
      innerRing.position.y = -0.4;
      this.modelContainer.add(innerRing);

      // 存储引用以便动画更新
      this.baseInnerRing = innerRing;

      // 添加中心圆形平台 - 高科技底盘
      const platformGeometry = new THREE.CircleGeometry(9, 64);
      const platformMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0.0 },
          baseColor: { value: new THREE.Color(0x002040) },
          glowColor: { value: new THREE.Color(0x0088ff) }
        },
        vertexShader: `
          varying vec2 vUv;
          
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform vec3 baseColor;
          uniform vec3 glowColor;
          varying vec2 vUv;
          
          float hexPattern(vec2 p, float scale) {
            p *= scale;
            vec2 grid = floor(p);
            vec2 f = fract(p);
            
            // 创建六边形网格
            float d = 2.0;
            for (int y = -1; y <= 1; y++) {
              for (int x = -1; x <= 1; x++) {
                vec2 offset = vec2(float(x), float(y));
                vec2 center = grid + offset + vec2(0.5);
                vec2 diff = p - center;
                float dist = max(abs(diff.x) + abs(diff.y) * 0.866, abs(diff.y / 0.866));
                d = min(d, dist);
              }
            }
            
            return smoothstep(0.2, 0.3, d) * 0.8;
          }
          
          void main() {
            vec2 centeredUV = vUv - 0.5;
            float dist = length(centeredUV);
            
            // 基础颜色
            vec3 color = baseColor;
            
            // 创建电路板图案
            float circuit1 = hexPattern(centeredUV * 10.0 + vec2(time * 0.2), 1.0);
            float circuit2 = hexPattern(centeredUV * 15.0 - vec2(time * 0.1), 1.0);
            
            // 添加扫描线效果
            float scanLine = smoothstep(0.48, 0.5, mod(dist * 10.0 - time * 0.5, 1.0)) * 0.5;
            
            // 边缘光晕
            float edge = smoothstep(0.9, 0.4, dist);
            float edgePulse = (0.7 + sin(time) * 0.3) * edge;
            
            // 内部脉冲
            float innerPulse = sin(dist * 10.0 - time * 2.0) * 0.1 + 0.1;
            
            // 将所有效果结合
            vec3 finalColor = mix(color, glowColor, circuit1 + circuit2 + scanLine + innerPulse);
            
            gl_FragColor = vec4(finalColor, 0.2 + edge * 0.1 + circuit1 * 0.3 + scanLine * 0.4);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide
      });

      const platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.rotation.x = -Math.PI / 2;
      platform.position.y = -0.48;
      this.modelContainer.add(platform);

      // 存储引用以便动画更新
      this.basePlatform = platform;

      // 添加底座发光效果
      const glowGeometry = new THREE.CircleGeometry(14.5, 64);
      const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0.0 },
          glowColor: { value: new THREE.Color(0x0088ff) }
        },
        vertexShader: `
          varying vec2 vUv;
          
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform vec3 glowColor;
          varying vec2 vUv;
          
          void main() {
            vec2 centeredUV = vUv - 0.5;
            float dist = length(centeredUV);
            
            // 创建辐射状外发光
            float radialGlow = smoothstep(0.5, 0.2, dist) * 0.2;
            float pulseFactor = 0.5 + sin(time * 1.5) * 0.5;
            
            gl_FragColor = vec4(glowColor, radialGlow * pulseFactor);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });

      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.rotation.x = Math.PI / 2;
      glow.position.y = -0.55;
      this.modelContainer.add(glow);

      // 存储引用以便动画更新
      this.baseGlow = glow;
    },

    // 创建能量场效果
    createEnergyField(parent) {
      // 创建粒子系统模拟能量场
      const particleCount = 800;
      const particles = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);

      // 创建柱状分布的粒子 - 调整位置使其更靠近圆盘
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        // 调整高度范围，使底部粒子更靠近圆盘
        const height = Math.random() * 16;
        const radius = 1.5 + Math.random() * 1.5; // 保持半径

        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = height;
        positions[i * 3 + 2] = Math.sin(angle) * radius;

        // 颜色渐变效果 - 从底到顶
        const heightFactor = height / 16;
        colors[i * 3] = 0.2 + heightFactor * 0.3; // R
        colors[i * 3 + 1] = 0.7 + heightFactor * 0.3; // G
        colors[i * 3 + 2] = 0.9; // B

        // 粒子大小变化
        sizes[i] = 0.1 + Math.random() * 0.2;
      }

      particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      // 使用着色器材质
      const particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0.0 }
        },
        vertexShader: `
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          uniform float time;
          
          void main() {
            vColor = color;
            
            // 添加随时间变化的微小运动
            vec3 pos = position;
            float moveAmount = sin(time * 2.0 + position.y * 2.0) * 0.1;
            pos.x += sin(time + position.y) * moveAmount;
            pos.z += cos(time + position.y) * moveAmount;
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = size * (40.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          
          void main() {
            // 创建圆形粒子
            float r = distance(gl_PointCoord, vec2(0.5, 0.5));
            if (r > 0.5) discard;
            
            // 添加光晕效果
            float intensity = 1.0 - r * 2.0;
            intensity = pow(intensity, 1.5);
            
            gl_FragColor = vec4(vColor, intensity);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexColors: true
      });

      const energyField = new THREE.Points(particles, particleMaterial);
      // 将整个能量场向下移动，使其紧贴圆盘
      energyField.position.y = 0;
      parent.add(energyField);
      this.energyField = energyField;

      // 添加内部光束效果，同样下移
      const beamGeometry = new THREE.CylinderGeometry(0.3, 0.3, 16, 16, 1, true);
      const beamMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0.0 }
        },
        vertexShader: `
          varying vec2 vUv;
          varying float vHeight;
          
          void main() {
            vUv = uv;
            vHeight = position.y;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          varying vec2 vUv;
          varying float vHeight;
          
          void main() {
            // 创建上下移动的光束效果
            float beam = mod(vHeight + time * 3.0, 16.0) / 16.0;
            beam = smoothstep(0.0, 0.2, beam) * smoothstep(1.0, 0.8, beam);
            
            // 边缘辉光效果
            float edge = smoothstep(0.4, 0.5, vUv.x) * smoothstep(0.6, 0.5, vUv.x);
            
            // 组合效果
            float intensity = edge * 0.3 + beam * 0.7;
            
            vec3 color = mix(vec3(0.2, 0.8, 1.0), vec3(0.4, 1.0, 1.0), beam);
            gl_FragColor = vec4(color, intensity * 0.4);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });

      const beam = new THREE.Mesh(beamGeometry, beamMaterial);
      beam.position.y = 0.5; // 调整位置使光束从圆盘开始向上
      parent.add(beam);
      this.energyBeam = beam;
    },

    // 创建中央数据柱
    createDataColumn() {
      // 创建中央结构组
      const columnGroup = new THREE.Group();
      columnGroup.scale.set(1.2, 1.2, 1.2); // 整体放大模型尺寸
      this.columnGroup = columnGroup;
      this.modelContainer.add(columnGroup); // 改为添加到modelContainer

      // 创建六角星体
      this.createHexaStar(columnGroup);

      // 创建上下光环
      this.createLightRings(columnGroup);

      // 创建能量场效果
      this.createEnergyField(columnGroup);

      // 创建垂直线分支
      this.createVerticalBranches(columnGroup);

      // 创建电路节点和连接线
      this.createCircuitNodes(columnGroup);

      // 创建扩散粒子
      this.createSpreadParticles();

      // 添加底部和顶部平台
      this.createPlatforms();

      // 创建背景电路网络
      this.createBackgroundCircuitEffects();

      // 添加电路图案扫描效果
      this.createCircuitScanEffect();
    },


    // 创建六角星体
    createHexaStar(parent) {
      // 创建六角星组
      const starGroup = new THREE.Group();

      // 创建中心立方体
      const cubeGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      const cubeMaterial = new THREE.MeshPhongMaterial({
        color: 0x3a9eff,
        transparent: true,
        opacity: 0.7,
        emissive: 0x1a4a7a,
        emissiveIntensity: 0.5,
        side: THREE.DoubleSide
      });

      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      starGroup.add(cube);

      // 创建六个三角形延伸
      const triangleShape = new THREE.Shape();
      triangleShape.moveTo(0, 0);
      triangleShape.lineTo(0.8, 0);
      triangleShape.lineTo(0.4, 1.2);
      triangleShape.lineTo(0, 0);

      const extrudeSettings = {
        steps: 1,
        depth: 0.3,
        bevelEnabled: false
      };

      const triangleGeometry = new THREE.ExtrudeGeometry(triangleShape, extrudeSettings);

      // 创建六个方向的三角形
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const triangleMaterial = new THREE.MeshPhongMaterial({
          color: 0x5badff,
          transparent: true,
          opacity: 0.8,
          emissive: 0x2a6a9a,
          emissiveIntensity: 0.5,
          side: THREE.DoubleSide
        });

        const triangle = new THREE.Mesh(triangleGeometry, triangleMaterial);
        triangle.position.set(0.6, 0, 0);
        triangle.rotation.z = angle;
        starGroup.add(triangle);
      }

      // 创建上下两个方向的三角形
      const verticalTriangleGeometry = triangleGeometry.clone();

      const topTriangle = new THREE.Mesh(verticalTriangleGeometry, new THREE.MeshPhongMaterial({
        color: 0x5badff,
        transparent: true,
        opacity: 0.8,
        emissive: 0x2a6a9a,
        emissiveIntensity: 0.5,
        side: THREE.DoubleSide
      }));
      topTriangle.position.set(0, 0.6, 0);
      topTriangle.rotation.z = Math.PI / 2;
      topTriangle.rotation.x = Math.PI / 2;
      starGroup.add(topTriangle);

      const bottomTriangle = new THREE.Mesh(verticalTriangleGeometry, new THREE.MeshPhongMaterial({
        color: 0x5badff,
        transparent: true,
        opacity: 0.8,
        emissive: 0x2a6a9a,
        emissiveIntensity: 0.5,
        side: THREE.DoubleSide
      }));
      bottomTriangle.position.set(0, -0.6, 0);
      bottomTriangle.rotation.z = Math.PI / 2;
      bottomTriangle.rotation.x = -Math.PI / 2;
      starGroup.add(bottomTriangle);

      // 添加中心红色点
      const coreGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0xff3a3a,
        transparent: true,
        opacity: 0.9
      });

      const core = new THREE.Mesh(coreGeometry, coreMaterial);
      starGroup.add(core);

      // 将星形悬浮在空中
      starGroup.position.y = 8;

      // 添加旋转动画
      this.hexaStar = starGroup;
      parent.add(starGroup);
    },

    // 创建上下光环效果
    createLightRings(parent) {
      // 创建上下两个光环组
      const topRingGroup = new THREE.Group();
      const bottomRingGroup = new THREE.Group();

      // 创建光环 - 使用两个不同的光环，可以互相缠绕，顶部环尺寸缩小
      const topRingGeometry1 = new THREE.RingGeometry(4, 4.5, 64);
      const topRingGeometry2 = new THREE.RingGeometry(4.5, 5, 64);

      // 底部环尺寸保持不变
      const bottomRingGeometry1 = new THREE.RingGeometry(6, 7, 64);
      const bottomRingGeometry2 = new THREE.RingGeometry(7, 8, 64);

      const ringMaterial1 = new THREE.MeshBasicMaterial({
        color: 0x3a9eff,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });

      const ringMaterial2 = new THREE.MeshBasicMaterial({
        color: 0x66ccff,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
      });

      // 第一个光环
      const topRing1 = new THREE.Mesh(topRingGeometry1, ringMaterial1);
      topRing1.rotation.x = Math.PI / 2;
      topRing1.rotation.y = Math.PI * 0.1;
      topRingGroup.add(topRing1);

      // 第二个光环
      const topRing2 = new THREE.Mesh(topRingGeometry2, ringMaterial2);
      topRing2.rotation.x = Math.PI / 2;
      topRing2.rotation.y = -Math.PI * 0.1;
      topRingGroup.add(topRing2);

      // 添加内环 - 顶部内环也要相应缩小
      const topInnerRingGeometry = new THREE.RingGeometry(3, 3.2, 64);
      const innerRingMaterial = new THREE.MeshBasicMaterial({
        color: 0x66ccff,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });

      const topInnerRing = new THREE.Mesh(topInnerRingGeometry, innerRingMaterial);
      topInnerRing.rotation.x = Math.PI / 2;
      topRingGroup.add(topInnerRing);

      // 创建光晕效果 - 顶部光晕也要缩小
      const topGlowGeometry = new THREE.CircleGeometry(5, 64);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x3a9eff,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide
      });

      const topGlow = new THREE.Mesh(topGlowGeometry, glowMaterial);
      topGlow.rotation.x = Math.PI / 2;
      topRingGroup.add(topGlow);

      // 底部双环结构
      const bottomRing1 = new THREE.Mesh(bottomRingGeometry1, ringMaterial1);
      bottomRing1.rotation.x = Math.PI / 2;
      bottomRing1.rotation.y = Math.PI * 0.15;
      bottomRingGroup.add(bottomRing1);

      const bottomRing2 = new THREE.Mesh(bottomRingGeometry2, ringMaterial2);
      bottomRing2.rotation.x = Math.PI / 2;
      bottomRing2.rotation.y = -Math.PI * 0.15;
      bottomRingGroup.add(bottomRing2);

      // 添加内环 - 底部
      const bottomInnerRingGeometry = new THREE.RingGeometry(4, 4.5, 64);
      const bottomInnerRing = new THREE.Mesh(bottomInnerRingGeometry, innerRingMaterial);
      bottomInnerRing.rotation.x = Math.PI / 2;
      bottomRingGroup.add(bottomInnerRing);

      // 创建光晕效果 - 底部
      const bottomGlowGeometry = new THREE.CircleGeometry(8, 64);
      const bottomGlow = new THREE.Mesh(bottomGlowGeometry, glowMaterial);
      bottomGlow.rotation.x = Math.PI / 2;
      bottomRingGroup.add(bottomGlow);

      // 设置光环位置
      topRingGroup.position.y = 14;
      bottomRingGroup.position.y = 2;

      // 添加到父组
      parent.add(topRingGroup);
      parent.add(bottomRingGroup);

      // 保存引用以便动画
      this.topRingGroup = topRingGroup;
      this.bottomRingGroup = bottomRingGroup;

      // 保存引用到单独的环，以便在动画中控制
      this.topRing1 = topRing1;
      this.topRing2 = topRing2;
      this.bottomRing1 = bottomRing1;
      this.bottomRing2 = bottomRing2;
    },

    // 更新扩散粒子效果
    createSpreadParticles() {
      // 增加粒子数量
      const particleCount = 800;
      const particleGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);
      const speeds = new Float32Array(particleCount); // 添加速度属性

      for (let i = 0; i < particleCount; i++) {
        // 创建三种类型的粒子: 围绕六角星的, 围绕光环的, 自由漂浮的
        const particleType = Math.random();
        let angle, height, radius;

        if (particleType < 0.35) {
          // 围绕六角星的粒子
          angle = Math.random() * Math.PI * 2;
          height = 6 + Math.random() * 4; // 大部分在六角星附近
          radius = 1.5 + Math.random() * 2.5;
        } else if (particleType < 0.7) {
          // 围绕光环的粒子
          angle = Math.random() * Math.PI * 2;

          // 一半在上环，一半在下环
          if (Math.random() > 0.5) {
            height = 12 + Math.random() * 4; // 上光环
          } else {
            height = 1 + Math.random() * 3; // 下光环
          }

          radius = 5 + Math.random() * 3;
        } else {
          // 自由漂浮的粒子
          angle = Math.random() * Math.PI * 2;
          height = Math.random() * 16;

          // 距离中心的距离，大部分集中在周围，少量分散更远
          if (Math.random() > 0.8) {
            // 远距离粒子
            radius = 7.0 + Math.random() * 8.0;
          } else {
            // 近距离粒子
            radius = 2.0 + Math.random() * 6.0;
          }
        }

        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = height;
        positions[i * 3 + 2] = Math.sin(angle) * radius;

        // 设置颜色 - 根据类型和位置设置不同颜色
        if (particleType < 0.35) {
          // 靠近六角星的粒子 - 带有淡蓝色
          colors[i * 3] = 0.2 + Math.random() * 0.1;
          colors[i * 3 + 1] = 0.7 + Math.random() * 0.3;
          colors[i * 3 + 2] = 1.0;
        } else if (particleType < 0.7) {
          // 靠近光环的粒子 - 更蓝一些
          colors[i * 3] = 0.1 + Math.random() * 0.1;
          colors[i * 3 + 1] = 0.6 + Math.random() * 0.2;
          colors[i * 3 + 2] = 0.9 + Math.random() * 0.1;
        } else {
          // 自由粒子 - 带有一点白色
          colors[i * 3] = 0.3 + Math.random() * 0.2;
          colors[i * 3 + 1] = 0.5 + Math.random() * 0.3;
          colors[i * 3 + 2] = 0.8 + Math.random() * 0.2;
        }

        // 粒子大小 - 近处的稍大，远处的较小
        const distanceFromCenter = Math.sqrt(
          positions[i * 3] * positions[i * 3] +
          positions[i * 3 + 2] * positions[i * 3 + 2]
        );

        if (distanceFromCenter < 4) {
          sizes[i] = 0.12 + Math.random() * 0.16; // 近处粒子较大
        } else {
          sizes[i] = 0.08 + Math.random() * 0.12; // 远处粒子较小
        }

        // 设置粒子速度 - 越靠近中心的粒子速度越快
        speeds[i] = 0.2 + (10 - Math.min(10, distanceFromCenter)) / 10 * 0.8 + Math.random() * 0.2;
      }

      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      particleGeometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1)); // 添加速度属性

      // 创建更高级的着色器材质
      const particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          pointTexture: { value: this.createParticleTexture() }
        },
        vertexShader: `
          attribute float size;
          attribute float speed;
          varying vec3 vColor;
          uniform float time;
          
          void main() {
            vColor = color;
            
            // 粒子运动效果
            vec3 pos = position;
            
            // 上下浮动
            pos.y += sin(time * speed + position.x * 10.0) * 0.1;
            
            // 轻微水平运动
            float angle = time * speed * 0.2 + pos.y * 0.5;
            pos.x += sin(angle) * 0.05;
            pos.z += cos(angle) * 0.05;
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            
            // 动态大小 - 随时间略微变化
            float sizePulse = sin(time * 2.0 + pos.x * 10.0 + pos.y * 5.0) * 0.1 + 1.0;
            
            gl_PointSize = size * sizePulse * (300.0 / length(mvPosition.xyz));
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform sampler2D pointTexture;
          varying vec3 vColor;
          
          void main() {
            // 使用纹理创建更柔和的粒子
            vec4 texColor = texture2D(pointTexture, gl_PointCoord);
            
            // 颜色混合效果
            vec3 finalColor = vColor * texColor.rgb;
            
            // 应用透明度
            float alpha = texColor.a;
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true,
        vertexColors: true
      });

      const particles = new THREE.Points(particleGeometry, particleMaterial);
      particles.position.y = 0;
      this.modelContainer.add(particles);
      this.spreadParticles = particles;
    },

    // 创建粒子纹理
    createParticleTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;

      const context = canvas.getContext('2d');

      // 创建渐变
      const gradient = context.createRadialGradient(
        32, 32, 0, 32, 32, 32
      );

      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.3, 'rgba(120, 180, 255, 0.8)');
      gradient.addColorStop(0.7, 'rgba(70, 120, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(40, 80, 255, 0)');

      // 绘制粒子
      context.fillStyle = gradient;
      context.fillRect(0, 0, 64, 64);

      // 创建纹理
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;

      return texture;
    },

    // 扩大垂直分支线效果
    createVerticalBranches(parent) {
      const branchGroup = new THREE.Group();

      // 增加分支数量
      const branchCount = 12;
      for (let i = 0; i < branchCount; i++) {
        const angle = (i / branchCount) * Math.PI * 2;
        const radius = 1.8 + Math.random() * 1.2; // 扩大半径
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        // 创建线段 - 调整起点位置从圆盘开始
        const lineGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array([
          x, 0, z, // 底部贴着圆盘
          x, 14.5, z  // 顶部
        ]);

        lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const lineMaterial = new THREE.LineBasicMaterial({
          color: 0x3a9eff,
          transparent: true,
          opacity: 0.4
        });

        const line = new THREE.Line(lineGeometry, lineMaterial);
        branchGroup.add(line);

        // 增加节点数量
        const nodeCount = 3 + Math.floor(Math.random() * 3);
        for (let j = 0; j < nodeCount; j++) {
          // 调整节点位置，从0开始
          const y = j * 5 + Math.random() * 2;
          if (y > 14.5) continue;

          const nodeGeometry = new THREE.SphereGeometry(0.08, 8, 8); // 更大的节点
          const nodeMaterial = new THREE.MeshBasicMaterial({
            color: 0x66ffff,
            transparent: true,
            opacity: 0.9
          });

          const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
          node.position.set(x, y, z);
          branchGroup.add(node);

          // 添加水平连接线
          if (Math.random() > 0.5) {
            const hLineLength = 0.4 + Math.random() * 0.6; // 更长的连接线
            const hDirection = Math.random() > 0.5 ? 1 : -1;
            const hAngle = angle + Math.PI / 2 * hDirection;

            const hEndX = x + Math.cos(hAngle) * hLineLength;
            const hEndZ = z + Math.sin(hAngle) * hLineLength;

            const hLineGeometry = new THREE.BufferGeometry();
            const hPositions = new Float32Array([
              x, y, z,
              hEndX, y, hEndZ
            ]);

            hLineGeometry.setAttribute('position', new THREE.BufferAttribute(hPositions, 3));

            const hLineMaterial = new THREE.LineBasicMaterial({
              color: 0x3a9eff,
              transparent: true,
              opacity: 0.6
            });

            const hLine = new THREE.Line(hLineGeometry, hLineMaterial);
            branchGroup.add(hLine);

            // 末端节点
            const endNodeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const endNodeMaterial = new THREE.MeshBasicMaterial({
              color: 0x66ffff,
              transparent: true,
              opacity: 0.8
            });

            const endNode = new THREE.Mesh(endNodeGeometry, endNodeMaterial);
            endNode.position.set(hEndX, y, hEndZ);
            branchGroup.add(endNode);
          }
        }
      }

      // 增加水平环线，从0高度开始
      for (let i = 0; i < 6; i++) {
        const y = i * 2.5;
        const radius = 2.3 + Math.random() * 0.5; // 更大的环半径

        const ringGeometry = new THREE.BufferGeometry();
        const ringPoints = [];

        // 创建环形
        for (let j = 0; j <= 64; j++) {
          const angle = (j / 64) * Math.PI * 2;
          ringPoints.push(
            Math.cos(angle) * radius,
            y,
            Math.sin(angle) * radius
          );
        }

        ringGeometry.setAttribute('position', new THREE.Float32BufferAttribute(ringPoints, 3));

        const ringMaterial = new THREE.LineBasicMaterial({
          color: 0x3a9eff,
          transparent: true,
          opacity: 0.6
        });

        const ring = new THREE.Line(ringGeometry, ringMaterial);
        branchGroup.add(ring);
      }

      // 将整个分支组下移，使其从圆盘开始
      branchGroup.position.y = 0;
      parent.add(branchGroup);
      this.branchGroup = branchGroup;
    },

    // 增强电路节点效果
    createCircuitNodes(parent) {
      const nodeGroup = new THREE.Group();

      // 创建更多的节点
      const nodePositions = [];
      const nodeCount = 24; // 增加节点数量

      for (let i = 0; i < nodeCount; i++) {
        // 分层分布节点，从0高度开始
        const layerIndex = Math.floor(i / 6);
        const baseHeight = (layerIndex / 4) * 15;
        const height = baseHeight + Math.random() * 1;

        // 圆周分布，半径更大
        const angle = ((i % 6) / 6) * Math.PI * 2 + (layerIndex * Math.PI / 6);
        const radius = 2.5 + Math.random() * 1.2; // 更大的半径

        nodePositions.push({
          position: new THREE.Vector3(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius
          ),
          size: 0.1 + Math.random() * 0.1, // 更大的节点尺寸
          layerIndex
        });
      }

      // 创建节点和连接线
      nodePositions.forEach((node, index) => {
        // 创建节点球体
        const nodeGeometry = new THREE.SphereGeometry(node.size, 8, 8);
        const nodeMaterial = new THREE.MeshBasicMaterial({
          color: 0x66ffff,
          transparent: true,
          opacity: 0.9
        });

        const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
        nodeMesh.position.copy(node.position);
        nodeGroup.add(nodeMesh);

        // 连接到中心的概率提高
        if (index % 3 === 0 || Math.random() > 0.7) {
          const centerPoint = new THREE.Vector3(0, node.position.y, 0);
          const midPoint = new THREE.Vector3().lerpVectors(
            node.position, centerPoint, 0.3
          );
          midPoint.y += 0.5 + Math.random() * 0.5; // 中点向上弯曲更多

          // 创建到中心的曲线
          const curve = new THREE.QuadraticBezierCurve3(
            node.position,
            midPoint,
            centerPoint
          );

          const curveGeometry = new THREE.BufferGeometry().setFromPoints(
            curve.getPoints(20)
          );

          const curveMaterial = new THREE.LineBasicMaterial({
            color: 0x3a9eff,
            transparent: true,
            opacity: 0.6
          });

          const curveLine = new THREE.Line(curveGeometry, curveMaterial);
          nodeGroup.add(curveLine);
        }

        // 增加节点间连接的概率
        nodePositions.forEach((otherNode, otherIndex) => {
          if (otherIndex <= index) return;
          if (Math.abs(otherNode.layerIndex - node.layerIndex) > 1) return; // 只连接邻近层
          if (Math.random() > 0.5) return; // 50%概率连接

          const midPoint = new THREE.Vector3().lerpVectors(
            node.position, otherNode.position, 0.5
          );
          midPoint.y += 0.3 + Math.random() * 0.4; // 让中点向上弯曲

          // 创建节点间的曲线
          const curve = new THREE.QuadraticBezierCurve3(
            node.position,
            midPoint,
            otherNode.position
          );

          const curveGeometry = new THREE.BufferGeometry().setFromPoints(
            curve.getPoints(20)
          );

          const curveMaterial = new THREE.LineBasicMaterial({
            color: 0x3a9eff,
            transparent: true,
            opacity: 0.4
          });

          const curveLine = new THREE.Line(curveGeometry, curveMaterial);
          nodeGroup.add(curveLine);
        });
      });

      // 将整个节点组下移，使其从圆盘开始
      nodeGroup.position.y = 0;
      parent.add(nodeGroup);
      this.nodeGroup = nodeGroup;
    },

    // 更强大的分散粒子效果
    createSpreadParticles() {
      const particleCount = 500;
      const particleGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);

      for (let i = 0; i < particleCount; i++) {
        // 创建分散分布在空间中的粒子
        const angle = Math.random() * Math.PI * 2;
        // 将高度调整为从圆盘开始，不要超过原有高度
        const height = Math.random() * 15;

        // 距离中心的距离，大部分集中在周围，少量分散更远
        let radius;
        if (Math.random() > 0.6) {
          // 远距离粒子
          radius = 2.0 + Math.random() * 6.0; // 扩大范围
        } else {
          // 近距离粒子
          radius = 1.0 + Math.random() * 2.0; // 扩大范围
        }

        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = height;
        positions[i * 3 + 2] = Math.sin(angle) * radius;

        // 设置颜色 - 靠近中心的较亮，远离的较暗
        const distanceFactor = Math.min(1.0, 3.0 / radius);
        colors[i * 3] = 0.2 * distanceFactor;
        colors[i * 3 + 1] = 0.7 * distanceFactor;
        colors[i * 3 + 2] = 1.0 * distanceFactor;

        // 设置粒子大小 - 变大
        sizes[i] = 0.08 + Math.random() * 0.12;
      }

      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      // 创建着色器材质
      const particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 }
        },
        vertexShader: `
          attribute float size;
          varying vec3 vColor;
          uniform float time;
          void main() {
            vColor = color;
            // 轻微的上下浮动动画
            vec3 pos = position;
            pos.y += sin(time + position.x * 10.0) * 0.08;
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = size * (300.0 / length(mvPosition.xyz));
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          void main() {
            // 创建圆形粒子
            float r = distance(gl_PointCoord, vec2(0.5, 0.5));
            if (r > 0.5) discard;
            
            // 添加光晕效果
            float intensity = 1.0 - r * 2.0;
            intensity = pow(intensity, 1.5);
            
            gl_FragColor = vec4(vColor, intensity);
          }
        `,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true,
        vertexColors: true
      });

      const particles = new THREE.Points(particleGeometry, particleMaterial);
      // 将粒子系统下移，紧贴圆盘
      particles.position.y = 0;
      this.modelContainer.add(particles);
      this.spreadParticles = particles;
    },

    // 创建底部和顶部平台
    createPlatforms() {
      // 创建底部圆环
      const ringGeometry = new THREE.RingGeometry(12, 14, 64);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x3a9eff,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
      });

      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -0.5;
      this.modelContainer.add(ring);

      // 创建内环
      const innerRingGeometry = new THREE.RingGeometry(9, 9.5, 64);
      const innerRingMaterial = new THREE.MeshBasicMaterial({
        color: 0x3a9eff,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });

      const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
      innerRing.rotation.x = Math.PI / 2;
      innerRing.position.y = -0.4;
      this.modelContainer.add(innerRing);

      // 添加中心圆形平台
      const platformGeometry = new THREE.CircleGeometry(9, 64);
      const platformMaterial = new THREE.MeshBasicMaterial({
        color: 0x3a9eff,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
      });

      const platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.rotation.x = -Math.PI / 2;
      platform.position.y = -0.48;
      this.modelContainer.add(platform);
    },

    // 创建电路扫描效果
    createCircuitScanEffect() {
      // 创建电路扫描光环
      const scanGeometry = new THREE.RingGeometry(0.3, 0.5, 32);
      const scanMaterial = new THREE.MeshBasicMaterial({
        color: 0x66ccff,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });

      this.scanningRing = new THREE.Mesh(scanGeometry, scanMaterial);
      this.scanningRing.rotation.x = Math.PI / 2;
      this.scanningRing.position.y = 0;
      this.columnGroup.add(this.scanningRing);
    },

    // 创建数据标签
    createDataLabels() {
      // 创建标签位置和内容
      const labelData = [
        // 标签位置和内容 - 使用更合理的屏幕位置
        { id: '报警事件总数', value: '2342325', position: { left: '6%', top: '17%' } },
        { id: '算法总数', value: '90280', position: { right: '6%', top: '17%' } },
        { id: '视频类', value: '2901', position: { left: '4%', top: '39%' } },
        { id: '视频类设备', value: '5249', position: { right: '4%', top: '39%' } },
        { id: '图片类', value: '2901', position: { left: '5%', top: '61%' } },
        { id: '图片类设备', value: '5249', position: { right: '5%', top: '61%' } },
        { id: '运行中算法', value: '2901', position: { left: '7%', top: '83%' } },
        { id: '已停止算法', value: '2880', position: { right: '7%', top: '83%' } }
      ];

      // 固定位置的标签容器
      const labelContainer = document.createElement('div');
      labelContainer.className = 'data-labels-container';
      labelContainer.style.position = 'absolute';
      labelContainer.style.top = '0';
      labelContainer.style.left = '0';
      labelContainer.style.width = '100%';
      labelContainer.style.height = '100%';
      labelContainer.style.overflow = 'hidden';
      labelContainer.style.pointerEvents = 'none';
      document.getElementById('threejs-cube').appendChild(labelContainer);

      // 添加标签到HTML容器
      labelData.forEach((data, index) => {
        // 创建标签元素
        const labelElement = document.createElement('div');
        labelElement.className = 'fixed-data-label';
        labelElement.style.position = 'absolute';
        labelElement.style.padding = '5px 8px';
        labelElement.style.color = '#fff';
        labelElement.style.background = 'rgba(0, 20, 50, 0.65)';
        labelElement.style.border = '1px solid rgba(58, 158, 255, 0.6)';
        labelElement.style.borderRadius = '2px';
        labelElement.style.boxShadow = '0 0 6px rgba(58, 158, 255, 0.4)';
        labelElement.style.width = '140px';
        labelElement.style.fontSize = '10px';
        labelElement.style.transition = 'all 0.3s';
        labelElement.style.opacity = '0';
        labelElement.style.transform = 'scale(0.85)';
        labelElement.style.backdropFilter = 'blur(2px)';
        labelElement.style.WebkitBackdropFilter = 'blur(2px)';
        labelElement.style.pointerEvents = 'auto';

        // 设置固定位置
        Object.keys(data.position).forEach(key => {
          labelElement.style[key] = data.position[key];
        });

        // 根据标签不同类型调整样式
        if (index < 2) { // 顶部标签 - 报警事件总数和算法总数
          labelElement.style.minHeight = '44px';
        } else {
          labelElement.style.minHeight = '36px';
        }

        // 添加科技感标签内容
        labelElement.innerHTML = `
          <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
            <span style="font-size:9px; color:rgba(255,255,255,0.8); position:relative; padding-left:11px;">
              <span style="position:absolute; left:0; top:50%; transform:translateY(-50%); width:5px; height:5px; background:rgba(58,158,255,0.8); border-radius:1px;"></span>
              ${data.id}
            </span>
          </div>
          <div style="display:flex; justify-content:center; align-items:center;">
            <span style="color:#3a9eff; font-family:'Digital-7',monospace; font-size:16px; font-weight:bold; text-shadow:0 0 4px rgba(58,158,255,0.4); letter-spacing:1px;">${data.value}</span>
          </div>
          <div style="position:absolute; top:0; left:0; width:6px; height:6px; border-top:1px solid #3a9eff; border-left:1px solid #3a9eff;"></div>
          <div style="position:absolute; top:0; right:0; width:6px; height:6px; border-top:1px solid #3a9eff; border-right:1px solid #3a9eff;"></div>
          <div style="position:absolute; bottom:0; left:0; width:6px; height:6px; border-bottom:1px solid #3a9eff; border-left:1px solid #3a9eff;"></div>
          <div style="position:absolute; bottom:0; right:0; width:6px; height:6px; border-bottom:1px solid #3a9eff; border-right:1px solid #3a9eff;"></div>
          <div style="position:absolute; top:0; left:25%; right:25%; height:1px; background:linear-gradient(to right, rgba(58,158,255,0), rgba(58,158,255,0.3), rgba(58,158,255,0));"></div>
        `;

        // 添加连接线
        const lineElement = document.createElement('div');
        lineElement.className = 'connector-line';
        lineElement.style.position = 'absolute';
        lineElement.style.height = '1px';
        lineElement.style.width = '30px';
        lineElement.style.top = '50%';

        // 设置左右两侧线条样式
        if (index % 2 === 0) { // 左侧标签
          lineElement.style.right = '-30px';
          lineElement.style.background = 'linear-gradient(to right, rgba(58,158,255,0.8), rgba(58,158,255,0))';
        } else { // 右侧标签
          lineElement.style.left = '-30px';
          lineElement.style.background = 'linear-gradient(to left, rgba(58,158,255,0.8), rgba(58,158,255,0))';
        }

        // 添加脉冲点
        const pulseElement = document.createElement('div');
        pulseElement.className = 'pulse-dot';
        pulseElement.style.position = 'absolute';
        pulseElement.style.width = '4px';
        pulseElement.style.height = '4px';
        pulseElement.style.borderRadius = '50%';
        pulseElement.style.backgroundColor = '#3a9eff';
        pulseElement.style.top = '50%';
        pulseElement.style.transform = 'translateY(-50%)';
        pulseElement.style.boxShadow = '0 0 4px #3a9eff';
        pulseElement.style.animation = `pulse-${index} 2s infinite`;

        if (index % 2 === 0) { // 左侧标签
          pulseElement.style.right = '-2px';
        } else { // 右侧标签
          pulseElement.style.left = '-2px';
        }

        // 创建扫描线效果
        const scanElement = document.createElement('div');
        scanElement.className = 'scan-line';
        scanElement.style.position = 'absolute';
        scanElement.style.top = '0';
        scanElement.style.bottom = '0';
        scanElement.style.left = '0';
        scanElement.style.width = '100%';
        scanElement.style.background = 'linear-gradient(to bottom, rgba(58,158,255,0) 0%, rgba(58,158,255,0.1) 50%, rgba(58,158,255,0) 100%)';
        scanElement.style.animation = `scan-${index} 3s linear infinite`;
        scanElement.style.pointerEvents = 'none';
        scanElement.style.opacity = '0.6';

        // 创建动画样式
        const styleElement = document.createElement('style');
        styleElement.textContent = `
          @keyframes pulse-${index} {
            0% { box-shadow: 0 0 4px rgba(58, 158, 255, 0.7); }
            50% { box-shadow: 0 0 8px rgba(58, 158, 255, 1); }
            100% { box-shadow: 0 0 4px rgba(58, 158, 255, 0.7); }
          }
          
          @keyframes scan-${index} {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
          }
        `;
        document.head.appendChild(styleElement);

        labelElement.appendChild(lineElement);
        labelElement.appendChild(pulseElement);
        labelElement.appendChild(scanElement);
        labelContainer.appendChild(labelElement);

        // 标签悬停效果
        labelElement.addEventListener('mouseenter', () => {
          labelElement.style.transform = 'scale(1)';
          labelElement.style.zIndex = '10';
          labelElement.style.background = 'rgba(0, 30, 70, 0.85)';
          labelElement.style.boxShadow = '0 0 12px rgba(58, 158, 255, 0.7)';
        });

        labelElement.addEventListener('mouseleave', () => {
          labelElement.style.transform = 'scale(0.85)';
          labelElement.style.zIndex = '1';
          labelElement.style.background = 'rgba(0, 20, 50, 0.65)';
          labelElement.style.boxShadow = '0 0 6px rgba(58, 158, 255, 0.4)';
        });
      });

      // 保存标签元素引用
      this.labelElements = Array.from(labelContainer.querySelectorAll('.fixed-data-label'));

      // 延迟显示标签，产生淡入效果
      setTimeout(() => {
        this.labelElements.forEach((el, index) => {
          setTimeout(() => {
            el.style.opacity = '1';
          }, index * 120); // 依次显示标签
        });
      }, 500);
    },

    // 创建单个标签实体
    createLabelEntity(id, value, sub, sub2) {
      // 创建Canvas用于绘制标签
      const canvas = document.createElement('canvas');

      // 所有标签使用相同大小
      canvas.width = 256;
      canvas.height = 128;

      const context = canvas.getContext('2d');

      // 绘制背景 - 透明度降低
      context.fillStyle = 'rgba(0, 10, 25, 0.4)';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // 添加边框和装饰元素
      context.strokeStyle = '#3a9eff';
      context.lineWidth = 1;
      context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

      // 上边的小线条装饰
      const lineCount = 10;
      const lineWidth = (canvas.width - 40) / (lineCount * 2 - 1);
      for (let i = 0; i < lineCount; i++) {
        context.fillStyle = '#3a9eff';
        context.fillRect(20 + i * lineWidth * 2, 2, lineWidth, 2);
      }

      // 下边的小线条装饰
      for (let i = 0; i < lineCount; i++) {
        context.fillStyle = '#3a9eff';
        context.fillRect(20 + i * lineWidth * 2, canvas.height - 4, lineWidth, 2);
      }

      // 左上角装饰
      context.beginPath();
      context.moveTo(2, 15);
      context.lineTo(15, 2);
      context.stroke();

      // 右上角装饰
      context.beginPath();
      context.moveTo(canvas.width - 2, 15);
      context.lineTo(canvas.width - 15, 2);
      context.stroke();

      // 左下角装饰
      context.beginPath();
      context.moveTo(2, canvas.height - 15);
      context.lineTo(15, canvas.height - 2);
      context.stroke();

      // 右下角装饰
      context.beginPath();
      context.moveTo(canvas.width - 2, canvas.height - 15);
      context.lineTo(canvas.width - 15, canvas.height - 2);
      context.stroke();

      // 添加文本 - ID
      context.font = '16px "Microsoft YaHei", Arial, sans-serif';
      context.fillStyle = '#FFFFFF';
      context.textAlign = 'center';
      context.fillText(id, canvas.width / 2, 25);

      // 添加数值 - 大号字体
      context.fillStyle = '#3a9eff';
      context.font = 'bold 38px "Digital-7", Arial, sans-serif';
      context.fillText(value, canvas.width / 2, 70);

      // 添加左侧子项
      if (sub) {
        context.font = '14px "Microsoft YaHei", Arial, sans-serif';
        context.fillStyle = '#FFFFFF';
        context.textAlign = 'left';
        context.fillText(sub.name, 20, 100);

        context.fillStyle = '#3a9eff';
        context.fillText(sub.value, 20, 118);
      }

      // 添加右侧子项
      if (sub2) {
        context.font = '14px "Microsoft YaHei", Arial, sans-serif';
        context.fillStyle = '#FFFFFF';
        context.textAlign = 'right';
        context.fillText(sub2.name, canvas.width - 20, 100);

        context.fillStyle = '#3a9eff';
        context.fillText(sub2.value, canvas.width - 20, 118);
      }

      // 创建纹理
      const texture = new THREE.CanvasTexture(canvas);

      // 创建平面 - 所有标签使用相同大小
      const labelGeometry = new THREE.PlaneGeometry(6, 3);

      const labelMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      });

      return new THREE.Mesh(labelGeometry, labelMaterial);
    },

    // 创建背景电路效果
    createBackgroundCircuitEffects() {
      // 创建随机分布的电路路径点
      const circuitPoints = [];
      const circuitCount = 0; // 将电路数量设置为0以移除散线效果

      for (let i = 0; i < circuitCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 12 + Math.random() * 15;

        // 创建起点
        const startX = Math.cos(angle) * radius;
        const startZ = Math.sin(angle) * radius;
        const startY = Math.random() * 15 - 3;

        // 创建终点 - 有几率连接到中心柱
        const connectToCenter = Math.random() > 0.7;
        let endX, endZ;
        if (connectToCenter) {
          const innerRadius = 2 + Math.random() * 3;
          endX = Math.cos(angle) * innerRadius;
          endZ = Math.sin(angle) * innerRadius;
        } else {
          const endAngle = angle + (Math.random() * 0.5 - 0.25);
          const endRadius = radius + (Math.random() * 10 - 5);
          endX = Math.cos(endAngle) * endRadius;
          endZ = Math.sin(endAngle) * endRadius;
        }
        const endY = startY + (Math.random() * 6 - 3);

        // 创建中间点
        const midX = (startX + endX) / 2 + (Math.random() * 2 - 1);
        const midZ = (startZ + endZ) / 2 + (Math.random() * 2 - 1);
        const midY = (startY + endY) / 2 + (Math.random() * 2 - 1);

        circuitPoints.push({
          start: new THREE.Vector3(startX, startY, startZ),
          mid: new THREE.Vector3(midX, midY, midZ),
          end: new THREE.Vector3(endX, endY, endZ)
        });
      }

      // 创建电路线
      const circuitGroup = new THREE.Group();

      circuitPoints.forEach(points => {
        // 创建曲线
        const curve = new THREE.QuadraticBezierCurve3(
          points.start,
          points.mid,
          points.end
        );

        // 创建几何体
        const geometry = new THREE.BufferGeometry().setFromPoints(
          curve.getPoints(20)
        );

        // 创建材质 - 随机颜色
        const colorIntensity = 0.5 + Math.random() * 0.5;
        const material = new THREE.LineBasicMaterial({
          color: new THREE.Color(0.2 * colorIntensity, 0.6 * colorIntensity, 1.0 * colorIntensity),
          transparent: true,
          opacity: 0.3 + Math.random() * 0.3
        });

        // 创建线条
        const line = new THREE.Line(geometry, material);
        circuitGroup.add(line);

        // 在连接到中心的电路末端添加发光点
        if (points.end.distanceTo(new THREE.Vector3(0, points.end.y, 0)) < 5) {
          const dotGeometry = new THREE.SphereGeometry(0.1, 8, 8);
          const dotMaterial = new THREE.MeshBasicMaterial({
            color: 0x66ccff,
            transparent: true,
            opacity: 0.8
          });
          const dot = new THREE.Mesh(dotGeometry, dotMaterial);
          dot.position.copy(points.end);
          circuitGroup.add(dot);
        }
      });

      this.modelContainer.add(circuitGroup);
      this.circuitGroup = circuitGroup;
    },

    // 更新动画循环
    animateCube() {
      this.cubeAnimationId = requestAnimationFrame(this.animateCube);

      // 更新控制器
      if (this.controls) {
        this.controls.update();
      }

      // 更新时间
      const time = Date.now() * 0.001;

      // 更新底座材质
      if (this.baseRing && this.baseRing.material.uniforms) {
        this.baseRing.material.uniforms.time.value = time;
      }

      if (this.baseInnerRing && this.baseInnerRing.material.uniforms) {
        this.baseInnerRing.material.uniforms.time.value = time;
      }

      if (this.basePlatform && this.basePlatform.material.uniforms) {
        this.basePlatform.material.uniforms.time.value = time;
      }

      if (this.baseGlow && this.baseGlow.material.uniforms) {
        this.baseGlow.material.uniforms.time.value = time;
      }

      // 更新能量场效果
      if (this.energyField && this.energyField.material.uniforms) {
        this.energyField.material.uniforms.time.value = time;
      }

      // 更新能量光束效果
      if (this.energyBeam && this.energyBeam.material.uniforms) {
        this.energyBeam.material.uniforms.time.value = time;
      }

      // 更新分散粒子系统
      if (this.spreadParticles && this.spreadParticles.material.uniforms) {
        this.spreadParticles.material.uniforms.time.value = time;
      }

      // 更新六角星旋转效果
      if (this.hexaStar) {
        this.hexaStar.rotation.y = time * 0.2;
        this.hexaStar.rotation.z = Math.sin(time * 0.3) * 0.1;

        // 轻微上下浮动
        this.hexaStar.position.y = 8 + Math.sin(time * 0.5) * 0.3;

        // 脉冲效果 - 通过缩放实现
        const pulse = 1 + Math.sin(time * 2) * 0.05;
        this.hexaStar.scale.set(pulse, pulse, pulse);

        // 更新中心核心的发光效果
        if (this.hexaStar.children.length > 0) {
          const core = this.hexaStar.children[this.hexaStar.children.length - 1];
          if (core.material) {
            core.material.opacity = 0.7 + Math.sin(time * 3) * 0.3;
          }
        }
      }

      // 更新光环旋转效果
      if (this.topRingGroup) {
        // 整体光环组缓慢旋转
        this.topRingGroup.rotation.y = time * 0.05;

        // 光环1和光环2以不同的速度和方向旋转，形成缠绕效果
        if (this.topRing1) {
          // 让第一个环围绕自身倾斜旋转
          this.topRing1.rotation.z = Math.sin(time * 0.3) * 0.2;
          this.topRing1.rotation.y = Math.sin(time * 0.2) * 0.4;
        }

        if (this.topRing2) {
          // 让第二个环以相反的方向旋转，形成交错效果
          this.topRing2.rotation.z = Math.sin(time * 0.3 + Math.PI) * 0.2;
          this.topRing2.rotation.y = Math.sin(time * 0.2 + Math.PI) * 0.4;
        }

        // 轻微上下浮动
        this.topRingGroup.position.y = 14 + Math.sin(time * 0.3) * 0.2;
      }

      if (this.bottomRingGroup) {
        // 底部光环组以不同方向旋转
        this.bottomRingGroup.rotation.y = -time * 0.07;

        // 底部光环也实现缠绕效果，但方向和速度与顶部不同
        if (this.bottomRing1) {
          this.bottomRing1.rotation.z = Math.sin(time * 0.2) * 0.15;
          this.bottomRing1.rotation.y = Math.sin(time * 0.25) * 0.3;
        }

        if (this.bottomRing2) {
          this.bottomRing2.rotation.z = Math.sin(time * 0.2 + Math.PI) * 0.15;
          this.bottomRing2.rotation.y = Math.sin(time * 0.25 + Math.PI) * 0.3;
        }

        // 轻微上下浮动，与上环相反
        this.bottomRingGroup.position.y = 2 + Math.sin(time * 0.3 + Math.PI) * 0.2;
      }

      // 更新扫描环
      if (this.scanningRing) {
        // 从底部向顶部移动并循环
        this.scanningRing.position.y = ((time * 2) % 15) - 0.5;

        // 当到达顶部时，降低透明度
        if (this.scanningRing.position.y > 13) {
          const fadeOut = (15 - this.scanningRing.position.y) / 2;
          this.scanningRing.material.opacity = fadeOut * 0.8;
        } else {
          this.scanningRing.material.opacity = 0.8;
        }

        // 随高度变化缩放
        const heightFactor = Math.min(1.5, 1 + this.scanningRing.position.y / 15);
        this.scanningRing.scale.set(heightFactor, 1, heightFactor);
      }

      // 渲染场景
      this.cubeRenderer.render(this.cubeScene, this.cubeCamera);
    },
    handleResize() {
      // 更新渲染器和相机
      if (this.cubeRenderer && this.cubeCamera) {
        const container = document.getElementById('threejs-cube');
        if (container) {
          this.cubeCamera.aspect = container.clientWidth / container.clientHeight;
          this.cubeCamera.updateProjectionMatrix();
          this.cubeRenderer.setSize(container.clientWidth, container.clientHeight);
        }
      }

      // 重新初始化算法球体
      this.reinitAlgorithmSphere();
    },
    toggleResourcePanel() {
      this.isResourceExpanded = !this.isResourceExpanded;
    },
    // 拖拽气泡开始
    startDrag(event, index) {
      event.preventDefault();

      // 记录当前拖拽的算法索引
      this.currentDragIndex = index;

      // 记录起始位置
      this.initialX = event.clientX;
      this.initialY = event.clientY;

      // 记录元素初始位置百分比
      this.initialPosX = this.myAlgorithms[index].x;
      this.initialPosY = this.myAlgorithms[index].y;

      // 添加移动和停止拖拽的事件监听
      document.addEventListener('mousemove', this.onDrag);
      document.addEventListener('mouseup', this.stopDrag);

      // 设置被拖拽的元素样式
      const element = event.target.closest('.algorithm-bubble');
      if (element) {
        element.style.animation = 'none';
        element.style.transform = 'scale(1.1)';
        element.style.zIndex = '100';
        element.style.boxShadow = '0 0 20px rgba(30, 144, 255, 0.8)';
      }
    },

    // 拖拽过程中
    onDrag(event) {
      if (this.currentDragIndex === undefined) return;

      // 获取容器
      const container = document.getElementById('algorithm-container');
      if (!container) return;

      // 计算容器的尺寸
      const rect = container.getBoundingClientRect();

      // 计算移动距离
      const deltaX = event.clientX - this.initialX;
      const deltaY = event.clientY - this.initialY;

      // 计算新位置（百分比）
      let newX = this.initialPosX + (deltaX / rect.width) * 100;
      let newY = this.initialPosY + (deltaY / rect.height) * 100;

      // 限制在容器范围内
      newX = Math.max(5, Math.min(95, newX));
      newY = Math.max(5, Math.min(95, newY));

      // 更新位置
      this.myAlgorithms[this.currentDragIndex].x = newX;
      this.myAlgorithms[this.currentDragIndex].y = newY;
    },

    // 停止拖拽
    stopDrag(event) {
      if (this.currentDragIndex === undefined) return;

      // 恢复动画
      const element = document.querySelector(`.algorithm-bubble:nth-child(${this.currentDragIndex + 1})`);
      if (element) {
        const algo = this.myAlgorithms[this.currentDragIndex];
        element.style.animation = `floating ${algo.animTime}s ease-in-out infinite`;
        element.style.transform = '';
        element.style.zIndex = '';
        element.style.boxShadow = '';
      }

      // 移除事件监听
      document.removeEventListener('mousemove', this.onDrag);
      document.removeEventListener('mouseup', this.stopDrag);

      // 重置当前拖拽索引
      this.currentDragIndex = undefined;
    },
    // 初始化算法球体
    initAlgorithmSphere() {
      const container = document.getElementById('algorithm-sphere-container');
      if (!container) return;

      // 创建场景
      this.algoScene = new THREE.Scene();

      // 创建相机，调整视场角使效果更突出
      const width = container.clientWidth;
      const height = container.clientHeight;
      this.algoCamera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000); // 增大视场角为60度
      this.algoCamera.position.z = 12; // 调整相机距离，使气泡能够完全显示在视野中

      // 创建渲染器，启用抗锯齿提高清晰度
      this.algoRenderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance' // 提高性能
      });
      this.algoRenderer.setSize(width, height);
      this.algoRenderer.setClearColor(0x000000, 0);
      this.algoRenderer.setPixelRatio(window.devicePixelRatio); // 根据设备像素比设置
      container.innerHTML = ''; // 清空容器，防止重复添加
      container.appendChild(this.algoRenderer.domElement);

      // 创建球体组
      this.algoSphereGroup = new THREE.Group();
      this.algoScene.add(this.algoSphereGroup);

      // 添加更亮的环境光和方向光
      const ambientLight = new THREE.AmbientLight(0x404040, 2.5);
      this.algoScene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0x6688ff, 2.0);
      directionalLight.position.set(1, 1, 1);
      this.algoScene.add(directionalLight);

      // 创建气泡
      this.createAlgorithmBubbles();

      // 添加交互控制，减慢自动旋转速度
      this.algoControls = new OrbitControls(this.algoCamera, this.algoRenderer.domElement);
      this.algoControls.enableDamping = true;
      this.algoControls.dampingFactor = 0.1;
      this.algoControls.rotateSpeed = 0.6;
      this.algoControls.autoRotate = true;
      this.algoControls.autoRotateSpeed = 0.2;

      // 移除旋转角度限制
      // this.algoControls.minPolarAngle = Math.PI * 0.2;
      // this.algoControls.maxPolarAngle = Math.PI * 0.8;

      // 监听窗口大小变化
      window.addEventListener('resize', this.handleAlgoResize);

      // 开始动画循环
      this.animateAlgorithmSphere();
    },

    // 创建算法气泡
    createAlgorithmBubbles() {
      // 生成均匀分布在球面上的点，减小半径使气泡更紧密
      const points = this.generateSpherePoints(this.myAlgorithms.length, 5); // 缩小半径从7到5

      // 创建每个气泡
      this.myAlgorithms.forEach((algo, index) => {
        // 位置
        const position = points[index];

        // 创建气泡几何体和材质，增加细分以提高平滑度
        const size = Math.min(algo.size, 1.5); // 限制最大气泡大小为1.5
        const geometry = new THREE.SphereGeometry(size, 48, 48);

        // 随机颜色，但保持在蓝色系
        const hue = 0.58 + Math.random() * 0.12; // 蓝色系
        const saturation = 0.75 + Math.random() * 0.25;
        const lightness = 0.55 + Math.random() * 0.2;

        const color = new THREE.Color().setHSL(hue, saturation, lightness);

        // 创建着色器材质，增强发光效果
        const material = new THREE.ShaderMaterial({
          uniforms: {
            color: { value: color },
            time: { value: 0 }
          },
          vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
              vUv = uv;
              vNormal = normalize(normalMatrix * normal);
              vPosition = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform vec3 color;
            uniform float time;
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
              // 边缘发光效果
              float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 3.0);
              vec3 glow = color * intensity * 2.5;
              
              // 随时间变化的脉冲效果
              float pulse = 0.5 + 0.5 * sin(time * 1.5);
              vec3 finalColor = mix(color, color * 1.8, pulse * intensity);
              
              // 增加中心亮度和光泽
              vec2 center = vUv - 0.5;
              float centerDist = length(center);
              float centerGlow = smoothstep(0.5, 0.0, centerDist);
              finalColor = mix(finalColor, vec3(1.0, 1.0, 1.0), centerGlow * 0.7);
              
              // 添加一些噪点以提高视觉丰富度
              float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233)) * time * 0.1) * 43758.5453);
              finalColor += vec3(noise * 0.03);
              
              gl_FragColor = vec4(finalColor + glow, 0.92);
            }
          `,
          transparent: true
        });

        // 创建气泡
        const bubble = new THREE.Mesh(geometry, material);
        bubble.position.set(position.x, position.y, position.z);
        bubble.userData = { algorithm: algo };
        this.algoSphereGroup.add(bubble);

        // 创建文本标签
        this.createTextLabel(algo, bubble);
      });
    },

    // 创建文本标签
    createTextLabel(algo, bubble) {
      // 创建2D画布
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 512; // 保持高分辨率
      canvas.height = 256;

      // 透明背景，不再绘制半透明圆形背景
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 绘制算法ID，不使用阴影
      ctx.font = 'bold 72px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'white';
      ctx.fillText(algo.id, canvas.width / 2, 110);

      // 绘制算法名称，不使用阴影
      ctx.font = 'bold 40px Arial';
      ctx.fillStyle = 'white';
      ctx.fillText(algo.name, canvas.width / 2, 170);

      // 创建纹理
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      // 创建精灵材质
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        sizeAttenuation: true
      });

      // 创建精灵
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(6, 3, 1);
      sprite.position.copy(bubble.position);
      sprite.position.multiplyScalar(1.02); // 微调位置，使标签更贴近气泡

      this.algoSphereGroup.add(sprite);
    },

    // 生成均匀分布在球面上的点
    generateSpherePoints(n, radius) {
      const points = [];
      const phi = Math.PI * (3 - Math.sqrt(5)); // 黄金角

      for (let i = 0; i < n; i++) {
        const y = 1 - (i / (n - 1)) * 2;  // y从1到-1
        const radiusAtY = Math.sqrt(1 - y * y); // 半径在该y位置

        const theta = phi * i; // 黄金角旋转

        const x = Math.cos(theta) * radiusAtY;
        const z = Math.sin(theta) * radiusAtY;

        points.push(new THREE.Vector3(x * radius, y * radius, z * radius));
      }

      return points;
    },

    // 处理窗口大小变化
    handleAlgoResize() {
      if (!this.algoRenderer || !this.algoCamera) return;

      const container = document.getElementById('algorithm-sphere-container');
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      // 更新相机和渲染器参数
      this.algoCamera.aspect = width / height;
      this.algoCamera.updateProjectionMatrix();
      this.algoRenderer.setSize(width, height);

      // 调整相机位置以适应新的容器尺寸
      if (width < 300) {
        // 如果容器宽度较小，拉远相机使整个场景可见
        this.algoCamera.position.z = 15;
      } else {
        // 否则使用标准距离
        this.algoCamera.position.z = 12;
      }

      this.algoCamera.updateProjectionMatrix();
    },

    // 动画循环
    animateAlgorithmSphere() {
      if (!this.algoRenderer) return;

      this.algoAnimationId = requestAnimationFrame(this.animateAlgorithmSphere);

      // 更新控制器
      if (this.algoControls) {
        this.algoControls.update();
      }

      // 更新着色器中的时间
      const time = performance.now() * 0.001;
      this.algoSphereGroup.children.forEach(child => {
        if (child.material && child.material.uniforms && child.material.uniforms.time) {
          child.material.uniforms.time.value = time;
        }

        // 更新精灵标签，始终面向相机
        if (child.isSprite) {
          child.lookAt(this.algoCamera.position);
        }
      });

      // 渲染
      this.algoRenderer.render(this.algoScene, this.algoCamera);
    },

    // 处理全屏变化事件
    handleFullscreenChange() {
      const navBar = document.querySelector('.el-header');

      if (!document.fullscreenElement) {
        // 退出全屏时显示导航栏
        if (navBar) navBar.style.display = '';
      } else {
        // 进入全屏时隐藏导航栏
        if (navBar) navBar.style.display = 'none';
      }
    },

    // 重新初始化算法球体
    reinitAlgorithmSphere() {
      // 清除现有的动画和渲染器
      if (this.algoAnimationId) {
        cancelAnimationFrame(this.algoAnimationId);
        this.algoAnimationId = null;
      }

      // 重新初始化
      this.initAlgorithmSphere();
    },
    showTooltip(text, percentage, event) {
      this.tooltipText = `${text}: ${percentage}%`;
      this.tooltipVisible = true;
      
      if (event) {
        const donutChart = event.target.closest('.donut-chart');
        if (donutChart) {
          const donutRect = donutChart.getBoundingClientRect();
          const centerX = donutRect.width / 2;
          const centerY = donutRect.height / 2;
          
          // 计算鼠标相对于圆心的位置
          const mouseX = event.clientX - donutRect.left;
          const mouseY = event.clientY - donutRect.top;
          
          // 计算鼠标到圆心的向量
          const vectorX = mouseX - centerX;
          const vectorY = mouseY - centerY;
          
          // 归一化向量并延长到圆环外
          const length = Math.sqrt(vectorX * vectorX + vectorY * vectorY);
          const normalizedX = vectorX / length;
          const normalizedY = vectorY / length;
          
          // 计算tooltip位置，将其放在圆环外一定距离
          const radius = donutRect.width / 2;
          const tooltipX = centerX + normalizedX * (radius * 1.5);
          const tooltipY = centerY + normalizedY * (radius * 1.5);
          
          // 覆盖默认样式，删除居中定位
          this.tooltipStyle = {
            position: 'absolute',
            top: `${tooltipY}px`,
            left: `${tooltipX}px`,
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 20, 40, 0.9)',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            zIndex: '100',
            border: '1px solid rgba(65, 120, 255, 0.5)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'none'
          };
        }
      }
    },
    hideTooltip() {
      this.tooltipVisible = false;
    }
  }
}
</script>

<style scoped>
/* 基础样式和全局设置：非全屏用 100% 填满布局主区域，避免底部被裁需滚动 */
.algorithm-inference-platform {
  width: 100%;
  height: 100%;
  min-height: 0;
  background: linear-gradient(135deg, #001529 0%, #000B18 50%, #001020 100%);
  color: #ffffff;
  font-family: "Microsoft YaHei", Arial, sans-serif;
  position: relative;
  overflow: hidden;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* 为 Chrome、Safari 和 Opera 隐藏滚动条 */
.algorithm-inference-platform::-webkit-scrollbar {
  display: none;
  width: 0;
}

/* 确保所有内容容器也使用同样的滚动条隐藏方式；非全屏收紧间距便于一屏显示 */
.dashboard-container {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  grid-gap: 6px;
  flex: 1;
  min-height: 0;
  padding: 6px;
  overflow: hidden;
}

/* 所有卡片的内容区域隐藏滚动条但保留滚动功能 */
.card-content {
  padding: 4px 8px;
  height: calc(100% - 36px);
  /* 减去标题高度，与 card-header 收紧后一致 */
  overflow-y: auto !important;
  overflow-x: hidden !important;
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

.card-content::-webkit-scrollbar {
  display: none !important;
  /* Chrome, Safari and Opera 隐藏滚动条 */
  width: 0 !important;
  /* 确保滚动条宽度为0 */
}

.main-title {
  text-align: center;
  font-size: 24px;
  color: #ffffff;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(30, 144, 255, 0.7);
  padding: 8px 0;
  position: relative;
  z-index: 10;
  background: linear-gradient(to right,
      rgba(0, 0, 0, 0),
      rgba(10, 35, 75, 0.7) 20%,
      rgba(10, 35, 75, 0.7) 80%,
      rgba(0, 0, 0, 0));
  flex: 0 0 auto;
}

.current-time {
  position: absolute;
  top: 10px;
  left: 20px;
  color: #91a7cc;
  font-size: 12px;
  z-index: 10;
}

/* fullscreen-btn 样式在 top-bar 区域定义 */

/* 仪表板布局 */
.dashboard-container {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  grid-gap: 6px;
  flex: 1;
  min-height: 0;
  padding: 6px;
  overflow: hidden;
}

/* 卡片样式 */
.dashboard-card {
  background: linear-gradient(180deg, rgba(6, 30, 63, 0.85) 0%, rgba(3, 15, 35, 0.9) 100%);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(35, 88, 148, 0.4);
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(75, 216, 255, 0.08);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.dashboard-card:hover {
  border-color: rgba(35, 88, 148, 0.6);
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(75, 216, 255, 0.12);
}

/* 卡片头部蓝色边框 */
.dashboard-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.6), rgba(30, 144, 255, 0.8), rgba(0, 255, 255, 0.6), transparent);
  z-index: 1;
}

/* 卡片蓝色边角 */
.dashboard-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 20px;
  height: 20px;
  border-top: 2px solid rgba(0, 255, 255, 0.6);
  border-left: 2px solid rgba(0, 255, 255, 0.6);
  border-radius: 4px 0 0 0;
  z-index: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  flex-shrink: 0;
  background: linear-gradient(180deg, rgba(6, 30, 93, 0.9) 0%, rgba(4, 20, 63, 0.95) 100%);
  border-bottom: 1px solid rgba(0, 255, 255, 0.15);
}

.card-header .title {
  font-size: 14px;
  font-weight: bold;
  color: #00FFFF;
  position: relative;
  padding-left: 15px;
  text-shadow: 0 0 8px rgba(0, 255, 255, 0.4);
}

.card-header .title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  height: 16px;
  width: 3px;
  background: linear-gradient(180deg, #00FFFF, #1e90ff);
  border-radius: 2px;
  box-shadow: 0 0 6px rgba(0, 255, 255, 0.5);
}

.card-header i {
  color: #7EAEE5;
  cursor: pointer;
  transition: color 0.3s ease;
}

.card-header i:hover {
  color: #00FFFF;
  text-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
}

.panel-tabs {
  display: flex;
  gap: 4px;
}

.tab-item {
  padding: 2px 8px;
  font-size: 11px;
  color: #7EAEE5;
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: transparent;
}

.tab-item:hover {
  color: #00FFFF;
  border-color: rgba(0, 255, 255, 0.5);
}

.tab-item.active {
  color: #00FFFF;
  border-color: #00FFFF;
  background: rgba(0, 255, 255, 0.12);
  text-shadow: 0 0 6px rgba(0, 255, 255, 0.4);
}

.card-content {
  padding: 4px 8px;
  height: calc(100% - 36px);
  /* 减去标题高度，与 card-header 收紧后一致 */
  overflow: auto;
}

/* 资源统计模块样式 */
.resource-statistics {
  grid-column: 1;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  height: 100%;
  /* 确保高度占满整个网格单元格 */
}

.resource-statistics .card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 8px;
  min-height: 0;
  justify-content: center;
}

.server-info {
  display: flex;
  justify-content: space-around;
  margin-bottom: 15px;
  margin-top: 10px;
  padding: 0 5px;
  flex-shrink: 0;
  /* 防止顶部元素收缩 */
}

/* 推理服务资源卡片：占满高度，无底部 summary 时图表区撑满 */
.resource-statistics .server-info {
  margin-bottom: 0;
  margin-top: 12px;
  flex-shrink: 0;
}
/* 标签+图表为一组紧贴，与上方「运行中」只留小间距；不撑满避免下方空白过大 */
.resource-statistics .resource-charts-wrap {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  margin-top: 24px;
}
.resource-statistics .resource-labels {
  margin: 0 0 4px 0;
  flex-shrink: 0;
}
.resource-statistics .resource-label {
  font-size: 11px;
}
.resource-statistics .resource-charts {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0;
  padding: 0 0 4px 0;
}
.resource-statistics .chart-container {
  width: 56px;
  height: 56px;
  padding-bottom: 2px;
  flex-shrink: 0;
}
.resource-statistics .percentage-text {
  font-size: 15px;
}
.resource-statistics .percentage-text .percentage-symbol {
  font-size: 11px;
}
.resource-statistics .server-type {
  font-size: 12px;
  padding: 4px 10px;
}

.server-type {
  display: flex;
  align-items: center;
  color: #7888a8;
  font-size: 13px;
  background: rgba(0, 24, 40, 0.4);
  padding: 6px 15px;
  border-radius: 4px;
  border: 1px solid rgba(30, 144, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.server-icon {
  display: inline-block;
  width: 18px;
  height: 18px;
  margin-right: 8px;
  color: #3eaef9;
  font-size: 18px;
}

.master-icon::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%233eaef9"><path d="M4,1H20a1,1,0,0,1,1,1V22a1,1,0,0,1-1,1H4a1,1,0,0,1-1-1V2A1,1,0,0,1,4,1Z" opacity="0.5"/><path d="M5,12.5a1.5,1.5,0,1,0,1.5-1.5A1.5,1.5,0,0,0,5,12.5Zm6.5-1.5a1.5,1.5,0,1,0,1.5,1.5A1.5,1.5,0,0,0,11.5,11Zm5,0a1.5,1.5,0,1,0,1.5,1.5A1.5,1.5,0,0,0,16.5,11ZM5,6.5A1.5,1.5,0,1,0,6.5,5,1.5,1.5,0,0,0,5,6.5Zm6.5-1.5a1.5,1.5,0,1,0,1.5,1.5A1.5,1.5,0,0,0,11.5,5Zm5,0a1.5,1.5,0,1,0,1.5,1.5A1.5,1.5,0,0,0,16.5,5ZM5,18.5A1.5,1.5,0,1,0,6.5,17,1.5,1.5,0,0,0,5,18.5Zm6.5-1.5a1.5,1.5,0,1,0,1.5,1.5A1.5,1.5,0,0,0,11.5,17Zm5,0a1.5,1.5,0,1,0,1.5,1.5A1.5,1.5,0,0,0,16.5,17Z"/></svg>');
  background-size: cover;
}

.node-icon::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%233eaef9"><path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity="0.5"/><path d="M17,11H13V7a1,1,0,0,0-2,0v4H7a1,1,0,0,0,0,2h4v4a1,1,0,0,0,2,0V13h4a1,1,0,0,0,0-2Z"/></svg>');
  background-size: cover;
}

.resource-charts {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding: 0 5px;
  position: relative;
}

.resource-charts::before {
  content: "";
  position: absolute;
  top: -5px;
  left: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, 
    rgba(30, 80, 150, 0) 0%, 
    rgba(65, 120, 255, 0.5) 20%, 
    rgba(65, 120, 255, 0.8) 50%, 
    rgba(65, 120, 255, 0.5) 80%, 
    rgba(30, 80, 150, 0) 100%);
}

.resource-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 5px;
  margin: 15px 0 5px 0;
  position: relative;
}

.resource-label {
  width: 22%;
  text-align: center;
  color: #7888a8;
  font-size: 13px;
  padding: 0 2px;
}

.chart-item {
  width: 22%;
  position: relative;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chart-container {
  position: relative;
  width: 65px;
  height: 65px;
  margin: 0 auto;
  padding-bottom: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 隐藏原有的图表标题，由新添加的标签替代 */
.chart-title {
  display: none;
}

/* 图表容器 */
.chart-container {
  width: 65px;
  height: 65px;
  margin: 0;
  border-radius: 50%;
  background: rgba(5, 16, 39, 0.2);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  box-shadow: 0 0 15px rgba(0, 10, 30, 0.5),
    inset 0 0 15px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(5px);
}

/* 百分比环样式 */
.percentage-ring {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 50%;
  transform: rotate(-90deg);
  z-index: 2;
  -webkit-mask: radial-gradient(transparent 60%, #fff 61%, #fff 63%, transparent 64%);
  mask: radial-gradient(transparent 60%, #fff 61%, #fff 63%, transparent 64%);
}

.percentage-ring.cpu {
  background: conic-gradient(rgba(62, 174, 249, 0.95) var(--progress, 74.484deg),
      rgba(62, 174, 249, 0.15) var(--progress, 74.484deg));
  box-shadow: 0 0 20px rgba(62, 174, 249, 0.3);
}

.percentage-ring.disk {
  background: conic-gradient(rgba(255, 156, 56, 0.95) var(--progress, 231.66deg),
      rgba(255, 156, 56, 0.15) var(--progress, 231.66deg));
  box-shadow: 0 0 20px rgba(255, 156, 56, 0.3);
}

.percentage-ring.memory {
  background: conic-gradient(rgba(41, 222, 156, 0.95) var(--progress, 164.16deg),
      rgba(41, 222, 156, 0.15) var(--progress, 164.16deg));
  box-shadow: 0 0 20px rgba(41, 222, 156, 0.3);
}

.percentage-ring.gpu {
  background: conic-gradient(rgba(255, 90, 90, 0.95) var(--progress, 332.424deg),
      rgba(255, 90, 90, 0.15) var(--progress, 332.424deg));
  box-shadow: 0 0 20px rgba(255, 90, 90, 0.3);
}

/* 内部圆圈 */
.inner-circle {
  width: 85%;
  height: 85%;
  border-radius: 50%;
  background: linear-gradient(145deg,
      rgba(5, 16, 39, 0.9),
      rgba(5, 20, 50, 0.7));
  position: relative;
  z-index: 3;
  overflow: hidden;
  box-shadow:
    inset 0 0 15px rgba(0, 0, 0, 0.6),
    0 0 8px rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(3px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 液体容器 */
.liquid-container {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 33%;
  overflow: hidden;
  border-bottom-left-radius: 100px;
  border-bottom-right-radius: 100px;
}

.liquid-container.cpu {
  background: linear-gradient(to bottom,
      rgba(62, 174, 249, 0.1),
      rgba(62, 174, 249, 0.3));
  box-shadow: 0 0 10px rgba(62, 174, 249, 0.2);
}

.liquid-container.disk {
  background: linear-gradient(to bottom,
      rgba(255, 156, 56, 0.1),
      rgba(255, 156, 56, 0.3));
  box-shadow: 0 0 10px rgba(255, 156, 56, 0.2);
}

.liquid-container.memory {
  background: linear-gradient(to bottom,
      rgba(41, 222, 156, 0.1),
      rgba(41, 222, 156, 0.3));
  box-shadow: 0 0 10px rgba(41, 222, 156, 0.2);
}

.liquid-container.gpu {
  background: linear-gradient(to bottom,
      rgba(255, 90, 90, 0.1),
      rgba(255, 90, 90, 0.3));
  box-shadow: 0 0 10px rgba(255, 90, 90, 0.2);
}

/* 波浪效果 */
.liquid-wave {
  position: absolute;
  top: -10px;
  left: -50%;
  width: 200%;
  height: 20px;
  border-radius: 43%;
  animation: wave 4s infinite ease-in-out;
  opacity: 0.8;
  filter: blur(1px);
}

.liquid-container.cpu .liquid-wave {
  background: rgba(62, 174, 249, 0.4);
  animation: wave 4s infinite ease-in-out;
}

.liquid-container.disk .liquid-wave {
  background: rgba(255, 156, 56, 0.4);
  animation: wave 4.2s infinite ease-in-out reverse;
}

.liquid-container.memory .liquid-wave {
  background: rgba(41, 222, 156, 0.4);
  animation: wave 3.8s infinite ease-in-out;
}

.liquid-container.gpu .liquid-wave {
  background: rgba(255, 90, 90, 0.4);
  animation: wave 4.4s infinite ease-in-out reverse;
}

/* 波浪动画 */
@keyframes wave {
  0% {
    transform: translateX(0) scale(1, 0.8);
  }

  50% {
    transform: translateX(-25%) scale(1, 1.2);
  }

  100% {
    transform: translateX(-50%) scale(1, 0.8);
  }
}

.liquid-container.cpu .liquid-wave::before {
  animation-direction: reverse;
}

.liquid-container.disk .liquid-wave::before {
  animation-direction: normal;
}

.liquid-container.memory .liquid-wave::before {
  animation-direction: alternate-reverse;
}

.liquid-container.gpu .liquid-wave::before {
  animation-direction: alternate;
}

.liquid-container.cpu .liquid-wave::after {
  animation-direction: alternate;
}

.liquid-container.disk .liquid-wave::after {
  animation-direction: alternate-reverse;
}

.liquid-container.memory .liquid-wave::after {
  animation-direction: normal;
}

.liquid-container.gpu .liquid-wave::after {
  animation-direction: reverse;
}

/* 百分比文本 */
.percentage-text {
  position: absolute;
  z-index: 6;
  font-size: 16px;
  font-weight: bold;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: baseline;
  justify-content: center;
  letter-spacing: 1px;
}

.percentage-text.cpu {
  color: #3eaef9;
  text-shadow: 0 0 8px rgba(62, 174, 249, 0.5);
}

.percentage-text.disk {
  color: #ff9c38;
  text-shadow: 0 0 8px rgba(255, 156, 56, 0.5);
}

.percentage-text.memory {
  color: #29de9c;
  text-shadow: 0 0 8px rgba(41, 222, 156, 0.5);
}

.percentage-text.gpu {
  color: #ff5a5a;
  text-shadow: 0 0 8px rgba(255, 90, 90, 0.5);
}

.percentage-symbol {
  font-size: 9px;
  margin-left: 1px;
}

/* 科技感增强 */
.chart-container::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 60%);
  z-index: 1;
  pointer-events: none;
}

.chart-container::before {
  content: '';
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  bottom: -1px;
  border-radius: 50%;
  box-shadow: 0 0 5px rgba(255, 255, 255, 0.1);
  z-index: 1;
  opacity: 0.8;
}

.more-btn {
  display: none;
  align-items: center;
  justify-content: center;
  margin-top: 15px;
  margin-bottom: 5px;
  color: #7888a8;
  font-size: 12px;
  cursor: pointer;
  padding: 5px 0;
  background: rgba(30, 144, 255, 0.1);
  border-radius: 2px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.more-btn::before {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(to right,
      rgba(30, 144, 255, 0),
      rgba(30, 144, 255, 0.5),
      rgba(30, 144, 255, 0));
}

.more-btn:hover {
  color: #ffffff;
  background: rgba(30, 144, 255, 0.2);
}

.more-btn i {
  margin-left: 8px;
  font-size: 12px;
}

.expanded-content {
  background: rgba(0, 11, 24, 0.8);
  border-top: 1px solid rgba(30, 80, 150, 0.5);
  padding: 10px;
  max-height: 250px;
  overflow-y: auto;
  animation: slideDown 0.3s forwards;
}

@keyframes slideDown {
  from {
    max-height: 0;
    opacity: 0;
  }

  to {
    max-height: 250px;
    opacity: 1;
  }
}

.expanded-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid rgba(30, 80, 150, 0.3);
}

.resource-detail-title {
  color: #a0b4d0;
  font-size: 13px;
  font-weight: 500;
}

.resource-time {
  color: #7888a8;
  font-size: 11px;
}

.resource-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  /* 确保宽度填满容器 */
}

.detail-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: space-between;
  padding-bottom: 8px;
  margin-bottom: 2px;
  border-bottom: 1px dashed rgba(30, 80, 150, 0.2);
}

.detail-group:last-child {
  border-bottom: none;
  padding-bottom: 0;
  margin-bottom: 0;
}

.detail-item {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 90px;
}

.detail-label {
  color: #7888a8;
  font-size: 12px;
  margin-bottom: 4px;
}

.detail-value {
  color: #e0e6f0;
  font-size: 13px;
  font-weight: 500;
}

/* 中心显示区域：负边距盖住网格缝隙，实色背景遮住两侧蓝条 */
.center-container {
  grid-column: 2;
  grid-row: 1 / 3;
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 0;
  overflow: hidden;
  border: none;
  outline: none;
  box-shadow: none;
  margin: 0 -10px;
  background: #000d1a;
  z-index: 1;
}

.top-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.stat-box {
  width: 48%;
  background-color: rgba(0, 11, 24, 0.8);
  text-align: center;
  padding: 10px;
  border: 1px solid rgba(30, 80, 150, 0.5);
  position: relative;
}

.stat-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(30, 80, 150, 0.8);
}

.stat-title {
  font-size: 14px;
  color: #91a7cc;
  margin-bottom: 5px;
}

.digital-number {
  font-family: 'Digital-7', monospace;
  font-size: 24px;
  color: #ffffff;
  letter-spacing: 2px;
}

/* 中央立方体样式 */
.central-visualization {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  height: 100%;
  width: 100%;
  perspective: 1200px;
  overflow: visible;
  background-color: transparent;
  border: none;
}

/* 顶部数据框 */
.top-stats {
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
  z-index: 10;
}

.stat-box {
  width: 220px;
  background-color: rgba(0, 31, 63, 0.5);
  text-align: center;
  padding: 10px;
  border: 1px solid rgba(0, 149, 255, 0.7);
  position: relative;
  box-shadow: 0 0 15px rgba(0, 100, 255, 0.3);
  z-index: 5;
}

.stat-box::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, rgba(0, 149, 255, 0), rgba(0, 149, 255, 0.9), rgba(0, 149, 255, 0));
  top: 0;
  left: 0;
}

.stat-title {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 5px;
}

.digital-number {
  font-family: 'Digital-7', 'Orbitron', monospace;
  font-size: 28px;
  color: #2bbdff;
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(43, 189, 255, 0.6);
}

.central-cube-container {
  width: 70%;
  height: 380px;
  /* 减小高度 */
  margin: 0 auto;
  margin-bottom: 0;
  /* 确保底部没有边距 */
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  /* 内容靠下对齐 */
}

/* 连接线样式 */
.stat-connector {
  position: absolute;
  bottom: -20px;
  display: flex;
  align-items: center;
  z-index: 1;
}

.stat-connector .dot {
  width: 6px;
  height: 6px;
  background-color: #2bbdff;
  border-radius: 50%;
  box-shadow: 0 0 8px #2bbdff;
}

.stat-connector .line {
  height: 1px;
  background: linear-gradient(90deg, rgba(43, 189, 255, 0.9), rgba(43, 189, 255, 0.1));
  width: 60px;
}

.stat-connector.left {
  right: 20px;
}

.stat-connector.left .line {
  background: linear-gradient(90deg, rgba(43, 189, 255, 0.1), rgba(43, 189, 255, 0.9));
}

.stat-connector.right {
  left: 20px;
}

/* 3D立方体 */
.floating-cube {
  width: 70px;
  height: 70px;
  position: absolute;
  top: 25px;
  left: 25px;
  transform-style: preserve-3d;
  animation: floatCube 6s ease-in-out infinite;
  transform: rotateX(-20deg) rotateY(45deg);
}

@keyframes floatCube {
  0% {
    transform: rotateX(-20deg) rotateY(45deg) translateY(0);
  }

  50% {
    transform: rotateX(-20deg) rotateY(45deg) translateY(-10px);
  }

  100% {
    transform: rotateX(-20deg) rotateY(45deg) translateY(0);
  }
}

.cube {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  animation: rotate 12s linear infinite;
}

@keyframes rotate {
  0% {
    transform: rotateY(0);
  }

  100% {
    transform: rotateY(360deg);
  }
}

.cube-face {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: rgba(43, 189, 255, 0.1);
  border: 1px solid rgba(43, 189, 255, 0.7);
  box-shadow: 0 0 10px rgba(43, 189, 255, 0.5) inset;
  backface-visibility: visible;
}

.cube-face::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-image: linear-gradient(135deg,
      rgba(43, 189, 255, 0.3) 0%,
      rgba(43, 189, 255, 0.1) 50%,
      rgba(43, 189, 255, 0.3) 100%);
  opacity: 0.4;
}

.cube-face::after {
  content: '';
  position: absolute;
  width: 90%;
  height: 90%;
  top: 5%;
  left: 5%;
  border: 1px dashed rgba(43, 189, 255, 0.5);
  opacity: 0.3;
}

.cube-face.front {
  transform: translateZ(35px);
}

.cube-face.back {
  transform: rotateY(180deg) translateZ(35px);
}

.cube-face.right {
  transform: rotateY(90deg) translateZ(35px);
}

.cube-face.left {
  transform: rotateY(-90deg) translateZ(35px);
}

.cube-face.top {
  transform: rotateX(90deg) translateZ(35px);
}

.cube-face.bottom {
  transform: rotateX(-90deg) translateZ(35px);
}

.cube-inner {
  position: absolute;
  width: 40px;
  height: 40px;
  top: 15px;
  left: 15px;
  transform-style: preserve-3d;
  transform: translateZ(0px);
}

.cube-icon {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transform: translateZ(5px) rotateX(0deg) rotateY(0deg);
  animation: glow 3s ease-in-out infinite alternate;
}

.cube-icon::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: rgba(43, 189, 255, 0.3);
  border: 1px solid rgba(43, 189, 255, 0.5);
  transform: translateZ(0);
}

.cube-icon::after {
  content: '数据';
  position: absolute;
  width: 80%;
  height: 80%;
  top: 10%;
  left: 10%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  font-weight: bold;
  background-color: rgba(43, 189, 255, 0.2);
  transform: translateZ(2px);
  border: 1px dashed rgba(255, 255, 255, 0.5);
}

@keyframes glow {
  0% {
    box-shadow: 0 0 5px rgba(43, 189, 255, 0.5);
  }

  100% {
    box-shadow: 0 0 20px rgba(43, 189, 255, 0.9);
  }
}

/* 平台结构 */
.platform-structure {
  width: 100%;
  height: 400px;
  position: relative;
  transform-style: preserve-3d;
  transform: perspective(1500px) rotateX(45deg);
  margin-top: 40px;
}

.platform {
  position: absolute;
  width: 400px;
  height: 400px;
  left: 50%;
  transform-style: preserve-3d;
  transform: translateX(-50%);
}

.platform-surface {
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(9, 30, 66, 0.4);
  border: 2px solid rgba(43, 189, 255, 0.7);
  box-shadow: 0 0 20px rgba(43, 189, 255, 0.3);
  transform: translateZ(1px);
}

.platform-surface::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-image: radial-gradient(circle at 50% 50%, rgba(43, 189, 255, 0.2) 0%, rgba(43, 189, 255, 0.1) 20%, rgba(9, 30, 66, 0.1) 60%);
  pointer-events: none;
}

.platform-surface::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-image:
    linear-gradient(90deg, rgba(43, 189, 255, 0.1) 1px, transparent 1px),
    linear-gradient(180deg, rgba(43, 189, 255, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
}

.top-platform .platform-surface {
  box-shadow: 0 0 30px rgba(43, 189, 255, 0.4);
  background: rgba(9, 30, 66, 0.5);
}

.mid-platform .platform-surface {
  box-shadow: 0 0 25px rgba(43, 189, 255, 0.35);
  background: rgba(9, 30, 66, 0.45);
}

.bottom-platform .platform-surface {
  box-shadow: 0 0 20px rgba(43, 189, 255, 0.3);
  background: rgba(9, 30, 66, 0.4);
}

.platform-side {
  position: absolute;
  background: rgba(7, 22, 45, 0.6);
  border: 1px solid rgba(43, 189, 255, 0.5);
}

.platform-side.front,
.platform-side.back {
  width: 100%;
  height: 10px;
}

.platform-side.left,
.platform-side.right {
  width: 10px;
  height: 100%;
}

.platform-side.front {
  transform: rotateX(90deg) translateZ(5px) translateY(-5px);
  bottom: 0;
}

.platform-side.back {
  transform: rotateX(90deg) translateZ(-5px) translateY(-5px);
  top: 0;
}

.platform-side.right {
  transform: rotateY(90deg) translateZ(5px) translateX(-5px);
  right: 0;
}

.platform-side.left {
  transform: rotateY(90deg) translateZ(-395px) translateX(-5px);
  left: 0;
}

.top-platform {
  transform: translateX(-50%) translateZ(60px);
  width: 300px;
  height: 300px;
  left: 50%;
}

.mid-platform {
  transform: translateX(-50%) translateZ(30px);
  width: 350px;
  height: 350px;
  left: 50%;
}

.bottom-platform {
  transform: translateX(-50%) translateZ(0);
  width: 400px;
  height: 400px;
  left: 50%;
}

/* 数据标签 */
.data-tag {
  position: absolute;
  display: flex;
  align-items: center;
  z-index: 10;
}

.tag-content {
  background-color: rgba(0, 31, 63, 0.7);
  border: 1px solid #2bbdff;
  padding: 5px 10px;
  display: flex;
  box-shadow: 0 0 10px rgba(43, 189, 255, 0.4);
  position: relative;
  width: 200px;
  overflow: hidden;
}

.tag-content::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
      rgba(43, 189, 255, 0.05) 0%,
      rgba(43, 189, 255, 0.1) 10%,
      rgba(43, 189, 255, 0.05) 20%,
      rgba(43, 189, 255, 0.05) 30%,
      rgba(43, 189, 255, 0.1) 40%,
      rgba(43, 189, 255, 0.05) 50%,
      rgba(43, 189, 255, 0.05) 60%,
      rgba(43, 189, 255, 0.1) 70%,
      rgba(43, 189, 255, 0.05) 80%,
      rgba(43, 189, 255, 0.1) 90%,
      rgba(43, 189, 255, 0.05) 100%);
  top: 0;
  left: 0;
  opacity: 0.5;
}

.tag-content::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 30px;
  height: 100%;
  background: linear-gradient(90deg, rgba(43, 189, 255, 0), rgba(43, 189, 255, 0.2));
}

.tag-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin-right: 15px;
}

.tag-value {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  margin-left: auto;
}

.tag-connector {
  display: flex;
  align-items: center;
}

.tag-connector .dot {
  width: 6px;
  height: 6px;
  background-color: #2bbdff;
  border-radius: 50%;
  box-shadow: 0 0 8px #2bbdff;
}

.tag-connector .line {
  height: 1px;
  background: linear-gradient(90deg, rgba(43, 189, 255, 0.9), rgba(43, 189, 255, 0.1));
  width: 30px;
}

.tag-connector.orange .dot {
  background-color: #ff9933;
  box-shadow: 0 0 8px #ff9933;
}

.tag-connector.orange .line {
  background: linear-gradient(90deg, rgba(255, 153, 51, 0.9), rgba(255, 153, 51, 0.1));
}

/* 数据标签位置 */
.data-tag.left {
  left: -230px;
  top: 50%;
  transform: translateY(-50%);
}

.data-tag.left .tag-connector {
  margin-left: 10px;
}

.data-tag.right {
  right: -230px;
  top: 50%;
  transform: translateY(-50%);
}

.data-tag.right .tag-connector {
  margin-right: 10px;
  flex-direction: row-reverse;
}

.data-tag.right .tag-connector .line {
  background: linear-gradient(90deg, rgba(43, 189, 255, 0.1), rgba(43, 189, 255, 0.9));
}

/* 装饰立方体 */
.deco-cube {
  position: absolute;
  width: 20px;
  height: 20px;
  transform-style: preserve-3d;
  animation: decoGlow 4s ease-in-out infinite alternate;
}

@keyframes decoGlow {
  0% {
    box-shadow: 0 0 5px rgba(43, 189, 255, 0.3);
  }

  100% {
    box-shadow: 0 0 15px rgba(43, 189, 255, 0.7);
  }
}

.deco-cube-face {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: rgba(43, 189, 255, 0.1);
  border: 1px solid rgba(43, 189, 255, 0.7);
  backface-visibility: visible;
}

.deco-cube-face.front {
  transform: translateZ(10px);
}

.deco-cube-face.back {
  transform: rotateY(180deg) translateZ(10px);
}

.deco-cube-face.right {
  transform: rotateY(90deg) translateZ(10px);
}

.deco-cube-face.left {
  transform: rotateY(-90deg) translateZ(10px);
}

.deco-cube-face.top {
  transform: rotateX(90deg) translateZ(10px);
}

.deco-cube-face.bottom {
  transform: rotateX(-90deg) translateZ(10px);
}

.deco-cube.top-right {
  right: 30px;
  top: 30px;
  animation-delay: 0.5s;
}

.deco-cube.mid-left {
  left: 40px;
  top: 40px;
  animation-delay: 1s;
}

/* 装饰方块 */
.decoration-elements {
  position: absolute;
  width: 100%;
  height: 100%;
}

.deco-square {
  position: absolute;
  width: 30px;
  height: 30px;
  background-color: rgba(255, 153, 51, 0.3);
  border: 1px solid rgba(255, 153, 51, 0.7);
  bottom: 40px;
  right: 80px;
  animation: squareFloat 5s ease-in-out infinite;
  box-shadow: 0 0 10px rgba(255, 153, 51, 0.5);
}

.deco-square-2 {
  width: 20px;
  height: 20px;
  bottom: 30px;
  right: 120px;
  animation-delay: 0.7s;
}

.deco-square-3 {
  width: 15px;
  height: 15px;
  bottom: 50px;
  right: 70px;
  animation-delay: 1.2s;
}

@keyframes squareFloat {
  0% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }

  100% {
    transform: translateY(0);
  }
}

/* 连接线 */
.connection-lines {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 1;
}

.vertical-line {
  position: absolute;
  width: 1px;
  height: 300px;
  background: linear-gradient(to bottom,
      rgba(43, 189, 255, 0),
      rgba(43, 189, 255, 0.7),
      rgba(43, 189, 255, 0.4),
      rgba(43, 189, 255, 0));
  animation: linePulse 4s ease-in-out infinite;
}

@keyframes linePulse {
  0% {
    opacity: 0.3;
  }

  50% {
    opacity: 0.7;
  }

  100% {
    opacity: 0.3;
  }
}

.line-1 {
  left: 30%;
  top: 50px;
  animation-delay: 0.2s;
}

.line-2 {
  left: 40%;
  top: 20px;
  animation-delay: 0.8s;
}

.line-3 {
  right: 35%;
  top: 30px;
  animation-delay: 0.5s;
}

.line-4 {
  right: 25%;
  top: 60px;
  animation-delay: 1.1s;
}

/* 我的算法模块样式 */
.my-algorithms {
  grid-column: 1;
  grid-row: 2;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.algorithm-bubbles {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: rgba(0, 15, 30, 0.6);
  overflow: hidden;
  background-image: radial-gradient(circle at center, rgba(10, 50, 100, 0.3) 0%, rgba(0, 15, 30, 0.8) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.algorithm-bubble {
  position: absolute;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: move;
  transition: transform 0.2s ease-out;
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  box-shadow: 0 0 15px rgba(30, 144, 255, 0.4);
  background: radial-gradient(ellipse at center, rgba(90, 140, 250, 0.9) 0%, rgba(30, 100, 200, 0.8) 70%);
  user-select: none;
  border: 1px solid rgba(120, 160, 255, 0.5);
}

.algorithm-bubble:hover {
  transform: scale(1.1);
  box-shadow: 0 0 20px rgba(30, 144, 255, 0.6);
  z-index: 10;
}

.algo-id {
  font-weight: bold;
  font-size: 12px;
  margin-bottom: 3px;
  color: #ffffff;
}

.algo-name {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
}

@keyframes floating {
  0% {
    transform: translateY(0) scale(1);
  }

  50% {
    transform: translateY(-10px) scale(1.05);
  }

  100% {
    transform: translateY(0) scale(1);
  }
}

/* 实时事件模块样式 */
.realtime-events {
  grid-column: 3;
  grid-row: 1;
  height: 100%;
  overflow: hidden;
}

.event-layout {
  display: grid;
  grid-template-columns: 3fr 1fr;
  grid-template-rows: 5fr 1fr;
  gap: 5px;
  height: 100%;
}

.main-video-area {
  grid-column: 1;
  grid-row: 1;
  background-color: #0c1932;
  background-image: url('/static/img/traffic.jpg');
  background-size: cover;
  background-position: center;
  border: 1px solid #1c3f6e;
  min-height: 152px;
  height: 100%;
}

.thumbnail-list {
  grid-column: 2;
  grid-row: 1 / 4;
  display: flex;
  flex-direction: column;
  gap: 5px;
  height: 100%;
}

.thumbnail-item {
  flex: 1;
  background-color: #0c1932;
  background-image: url('/static/img/traffic-3.jpg');
  background-size: cover;
  background-position: center;
  border: 1px solid #1c3f6e;
}

.thumbnail-item:nth-child(2) {
  background-image: url('/static/img/traffic-1.jpg');
}

.thumbnail-item:nth-child(3) {
  background-image: url('/static/img/traffic-2.jpg');
}

.event-info-area {
  grid-column: 1;
  grid-row: 3;
  background-color: #0c1932;
  border: 1px solid #1c3f6e;
  padding: 5px 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-height: 80px;
}

.event-info-row {
  display: flex;
  align-items: center;
  margin-bottom: 3px;
}

.info-label {
  color: #8aa3c8;
  width: 50px;
  font-size: 14px;
}

.info-value {
  color: #ffffff;
  flex: 1;
  font-size: 14px;
}

.alarm-tag {
  background-color: #ff5a5a;
  color: #ffffff;
  padding: 1px 5px;
  border-radius: 2px;
  font-size: 12px;
  margin-left: auto;
}

/* 设备统计模块样式 */
.device-statistics {
  grid-column: 1;
  grid-row: 3;
  height: 100%;
  overflow: hidden;
}

.device-total {
  text-align: center;
  margin: 15px 0;
  padding: 15px;
  background: rgba(0, 20, 40, 0.3);
  border: 1px solid rgba(30, 144, 255, 0.2);
  border-radius: 4px;
}

.total-label {
  font-size: 13px;
  color: #91a7cc;
  margin-bottom: 12px;
  position: relative;
  display: inline-block;
}

.total-label::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 2px;
  background: linear-gradient(to right, rgba(30, 144, 255, 0), rgba(30, 144, 255, 0.8), rgba(30, 144, 255, 0));
}

.digital-counter {
  display: flex;
  justify-content: center;
  align-items: center;
}

.digit {
  width: 28px;
  height: 40px;
  background: linear-gradient(180deg, rgba(0, 40, 80, 0.8), rgba(0, 20, 40, 0.8));
  border: 1px solid rgba(30, 144, 255, 0.3);
  color: #3a9eff;
  font-size: 24px;
  font-family: 'Digital-7', monospace;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 2px;
  position: relative;
  text-shadow: 0 0 8px rgba(58, 158, 255, 0.5);
}

.digit::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(to right, rgba(30, 144, 255, 0), rgba(30, 144, 255, 0.5), rgba(30, 144, 255, 0));
}

.digit::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(to right, rgba(30, 144, 255, 0), rgba(30, 144, 255, 0.5), rgba(30, 144, 255, 0));
}

.unit {
  margin-left: 8px;
  color: #91a7cc;
  font-size: 14px;
  align-self: flex-end;
  padding-bottom: 8px;
}

.device-types {
  display: flex;
  justify-content: space-around;
  padding: 10px 5px;
}

.type-item {
  text-align: center;
  position: relative;
}

.type-circle {
  width: 70px;
  height: 70px;
  position: relative;
  margin: 0 auto 5px;
}

.ripple-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  border: 2px solid rgba(0, 149, 255, 0.8);
  border-radius: 50%;
  animation: ripple 3s cubic-bezier(0.1, 0.85, 0.5, 1) infinite;
}

.ripple:nth-child(1) {
  animation-delay: 0s;
}

.ripple:nth-child(2) {
  animation-delay: 0.3s;
}

.ripple:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes ripple {
  0% {
    width: 0;
    height: 0;
    opacity: 0.8;
  }

  100% {
    width: 100%;
    height: 100%;
    opacity: 0;
  }
}

.circle-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: radial-gradient(circle at center,
      rgba(0, 149, 255, 0.3) 0%,
      rgba(0, 149, 255, 0.2) 100%);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 149, 255, 0.5);
  box-shadow: 0 0 10px rgba(0, 149, 255, 0.3);
  z-index: 1;
}

.circle-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  background: radial-gradient(circle at center,
      rgba(0, 149, 255, 0.2) 0%,
      transparent 70%);
  z-index: -1;
}

.number {
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
  line-height: 1;
  margin-bottom: 2px;
}

.unit {
  color: #ffffff;
  font-size: 12px;
  opacity: 0.8;
}

.type-name {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  margin-top: 8px;
}

/* 报警信息模块样式 */
.alarm-info {
  grid-column: 2;
  grid-row: 3;
  height: 100%;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.date-filter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 11px;
  position: relative;
  z-index: 10;
  pointer-events: auto;
}

.date-filter-left {
  display: flex;
  align-items: center;
  position: relative;
  z-index: 2;
}

.date-btn {
  padding: 3px 8px;
  background-color: rgba(0, 15, 30, 0.7);
  color: #91a7cc;
  margin-right: 6px;
  cursor: pointer;
  border: 1px solid rgba(30, 80, 150, 0.5);
  border-radius: 2px;
  transition: all 0.2s ease;
  position: relative;
  z-index: 3;
  user-select: none;
}

.date-btn:hover {
  background-color: rgba(30, 144, 255, 0.2);
}

.date-btn.active {
  background-color: #1e90ff;
  color: #ffffff;
  box-shadow: 0 0 8px rgba(30, 144, 255, 0.5);
}

.date-range {
  margin-left: 2px;
  color: #91a7cc;
  background-color: rgba(0, 15, 30, 0.7);
  padding: 3px 8px;
  border: 1px solid rgba(30, 80, 150, 0.5);
  border-radius: 2px;
}

.date-filter-right {
  display: flex;
  align-items: center;
}

.chart-tabs {
  display: flex;
}

.trend-chart {
  background-color: rgba(0, 15, 30, 0.4);
  margin-bottom: 5px;
  padding: 10px;
  border: 1px solid rgba(30, 80, 150, 0.5);
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.trend-chart-svg-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.trend-chart-svg-wrap svg {
  width: 100%;
  height: 100%;
  display: block;
}

.trend-chart-echarts {
  flex: 1;
  min-height: 0;
  width: 100%;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.trend-total {
  display: flex;
  align-items: center;
}

.trend-total .label {
  color: #91a7cc;
  font-size: 12px;
  margin-right: 8px;
}

.trend-total .value {
  color: #ffffff;
  font-size: 16px;
  font-weight: bold;
}

.trend-time-selector {
  display: flex;
  align-items: center;
}

.time-selector-label {
  color: #91a7cc;
  font-size: 12px;
  margin-right: 8px;
}

.selector-dropdown {
  background-color: rgba(0, 15, 30, 0.7);
  color: #91a7cc;
  font-size: 12px;
  padding: 2px 8px;
  border: 1px solid rgba(30, 80, 150, 0.5);
  border-radius: 2px;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.selector-dropdown i {
  margin-left: 4px;
  font-size: 10px;
}

.chart-tabs {
  display: flex;

}

.tab {
  padding: 4px 10px;
  background-color: rgba(0, 15, 30, 0.7);
  color: #91a7cc;
  margin-right: 8px;
  cursor: pointer;
  font-size: 11px;
  border: 1px solid rgba(30, 80, 150, 0.5);
  border-radius: 2px;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.tab i {
  margin-right: 4px;
  font-size: 12px;
}

.tab:hover {
  background-color: rgba(30, 144, 255, 0.2);
}

.tab.active {
  background-color: #1e90ff;
  color: #ffffff;
  box-shadow: 0 0 8px rgba(30, 144, 255, 0.5);
}

/* 数据点悬停效果 */
.data-points circle {
  transition: r 0.2s ease;
  cursor: pointer;
}

.data-points circle:hover {
  r: 5;
  fill: #1e90ff;
}

/* 报警转发模块样式 */
.alarm-forwarding {
  grid-column: 3;
  grid-row: 3;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.alarm-forwarding .card-content {
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.chart-title {
  color: #91a7cc;
  font-size: 12px;
  display: flex;
  align-items: center;
}

.chart-actions {
  display: flex;
}

.chart-action-btn {
  background-color: rgba(0, 15, 30, 0.7);
  color: #91a7cc;
  font-size: 11px;
  padding: 2px 8px;
  border: 1px solid rgba(30, 80, 150, 0.5);
  border-radius: 2px;
  display: flex;
  align-items: center;
  margin-left: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chart-action-btn:hover {
  background-color: rgba(30, 144, 255, 0.2);
  color: #ffffff;
}

.chart-action-btn i {
  margin-right: 4px;
  font-size: 12px;
}

.bar-chart {
  flex: 1;
  background-color: rgba(0, 15, 30, 0.4);
  padding: 10px;
  border: 1px solid rgba(30, 80, 150, 0.5);
  overflow: hidden;
  height: auto;
}

.bars rect {
  transition: height 0.5s ease, y 0.5s ease;
  cursor: pointer;
  filter: drop-shadow(0px 0px 3px rgba(30, 144, 255, 0.3));
}

.bars rect:hover {
  filter: drop-shadow(0px 0px 8px rgba(30, 144, 255, 0.6));
}

.chart-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 11px;
}

.chart-hint {
  display: flex;
  align-items: center;
  color: #91a7cc;
}

.chart-hint i {
  margin-right: 4px;
  color: #3a9eff;
}

.chart-pagination {
  display: flex;
  align-items: center;
  color: #91a7cc;
}

.chart-pagination i {
  cursor: pointer;
  font-size: 12px;
  padding: 2px;
  transition: all 0.2s ease;
}

.chart-pagination i:hover {
  color: #ffffff;
}

.chart-pagination span {
  margin: 0 8px;
}

/* 响应式设计 */
@media (max-width: 1440px) {
  .dashboard-container {
    grid-gap: 8px;
  }

  .chart-circle {
    width: 60px;
    height: 60px;
  }

  .chart-inner {
    width: 40px;
    height: 40px;
  }

  .digit {
    width: 18px;
    height: 25px;
    font-size: 16px;
  }

  .type-circle {
    width: 50px;
    height: 50px;
  }

  .type-circle::before {
    width: 35px;
    height: 35px;
  }

  .indicator-value {
    font-size: 14px;
  }

  .digital-number {
    font-size: 22px;
  }
}

/* 底部面板公共样式 */
.alarm-info,
.alarm-forwarding,
.device-statistics {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.alarm-info .card-content,
.alarm-forwarding .card-content,
.device-statistics .card-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 5px 10px;
}

.trend-chart {
  background-color: rgba(0, 15, 30, 0.4);
  margin-bottom: 5px;
  padding: 5px;
  border: 1px solid rgba(30, 80, 150, 0.5);
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chart-tabs {
  flex: 0 0 auto;
  margin-top: 5px;
}

.date-filter {
  flex: 0 0 auto;
  margin-bottom: 5px;
}

.bar-chart {
  flex: 1;
  background-color: rgba(0, 15, 30, 0.4);
  padding: 5px;
  border: 1px solid rgba(30, 80, 150, 0.5);
  overflow: hidden;
}

.device-total {
  flex: 0 0 auto;
  text-align: center;
  margin-bottom: 5px;
}

.device-types {
  flex: 1;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

/* 响应式设计 */
@media (max-height: 800px) {
  .main-title {
    padding: 5px 0;
    font-size: 20px;
  }

  .dashboard-container {
    grid-gap: 5px;
    padding: 5px;
  }

  .card-header {
    padding: 4px 10px;
  }

  .card-content {
    padding: 4px 8px;
    height: calc(100% - 32px);
  }

  .chart-circle {
    width: 45px;
    height: 45px;
  }

  .chart-inner {
    width: 32px;
    height: 32px;
  }

  .chart-value {
    font-size: 12px;
  }

  .chart-label {
    font-size: 8px;
  }

  .chart-title {
    font-size: 10px;
  }
}

/* 添加底部投影 */
.floating-cube::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 10px;
  background: radial-gradient(ellipse at center, rgba(43, 189, 255, 0.5) 0%, rgba(43, 189, 255, 0) 70%);
  bottom: -40px;
  left: 0;
  transform: rotateX(90deg) scale(1.2, 1);
  opacity: 0.5;
  animation: shadowPulse 6s ease-in-out infinite;
}

@keyframes shadowPulse {
  0% {
    opacity: 0.3;
    transform: rotateX(90deg) scale(1.2, 1);
  }

  50% {
    opacity: 0.5;
    transform: rotateX(90deg) scale(1.3, 1);
  }

  100% {
    opacity: 0.3;
    transform: rotateX(90deg) scale(1.2, 1);
  }
}

/* 设置停止算法的橙色样式 */
.data-tag.stopped-algo .tag-content {
  border-color: #ff9933;
  box-shadow: 0 0 10px rgba(255, 153, 51, 0.4);
}

.data-tag.stopped-algo .tag-content::before {
  background: linear-gradient(90deg,
      rgba(255, 153, 51, 0.05) 0%,
      rgba(255, 153, 51, 0.1) 10%,
      rgba(255, 153, 51, 0.05) 20%,
      rgba(255, 153, 51, 0.05) 30%,
      rgba(255, 153, 51, 0.1) 40%,
      rgba(255, 153, 51, 0.05) 50%,
      rgba(255, 153, 51, 0.05) 60%,
      rgba(255, 153, 51, 0.1) 70%,
      rgba(255, 153, 51, 0.05) 80%,
      rgba(255, 153, 51, 0.1) 90%,
      rgba(255, 153, 51, 0.05) 100%);
}

.data-tag.stopped-algo .tag-content::after {
  background: linear-gradient(90deg, rgba(255, 153, 51, 0), rgba(255, 153, 51, 0.2));
}

.chart-bubble.cpu .chart-progress {
  background: conic-gradient(#3eaef9 var(--progress), transparent 0);
}

.chart-bubble.disk .chart-progress {
  background: conic-gradient(#ff9c38 var(--progress), transparent 0);
}

.chart-bubble.memory .chart-progress {
  background: conic-gradient(#29de9c var(--progress), transparent 0);
}

.chart-bubble.gpu .chart-progress {
  background: conic-gradient(#ff5a5a var(--progress), transparent 0);
}

/* 科技感光效果 */
.chart-container::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 50%;
  background: linear-gradient(45deg,
      rgba(255, 255, 255, 0.1),
      rgba(255, 255, 255, 0.05) 20%,
      rgba(255, 255, 255, 0) 30%);
  z-index: 4;
  pointer-events: none;
}

.chart-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  box-shadow:
    inset 0 0 20px rgba(255, 255, 255, 0.05),
    0 0 15px rgba(255, 255, 255, 0.1);
  z-index: 5;
  pointer-events: none;
}

/* 添加扫光动画 */
@keyframes scanlight {
  0% {
    transform: translateX(-100%) rotate(45deg);
    opacity: 0;
  }

  50% {
    opacity: 0.5;
  }

  100% {
    transform: translateX(200%) rotate(45deg);
    opacity: 0;
  }
}

.chart-container {
  position: relative;
  overflow: hidden;
}

.chart-container::before {
  animation: scanlight 4s linear infinite;
}

.threejs-container {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  perspective: 1200px;
}

.central-cube-container {
  width: 70%;
  height: 380px;
  /* 减小高度 */
  margin: 0 auto;
  margin-bottom: 0;
  /* 确保底部没有边距 */
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  /* 内容靠下对齐 */
}

.platform-structure-bg {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100px;
  background: radial-gradient(circle at center, rgba(30, 80, 150, 0.2), transparent 70%);
  z-index: 0;
}

.top-bar {
  display: flex;
  align-items: center;
  height: 42px;
  padding: 0 14px;
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  background: linear-gradient(180deg, rgba(0, 30, 60, 0.95) 0%, rgba(0, 15, 35, 0.85) 100%);
  border-bottom: 1px solid rgba(0, 255, 255, 0.15);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(0, 255, 255, 0.1);
}

.top-bar::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.4), transparent);
}

.top-time {
  font-size: 18px;
  font-weight: bold;
  color: #00ffff;
  white-space: nowrap;
  line-height: 42px;
  margin-right: 14px;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

.time-tabs >>> .el-radio-button__inner {
  background-color: rgba(6, 30, 93, 0.5);
  border-color: rgba(0, 149, 255, 0.3);
  color: #7888a8;
  padding: 4px 10px;
  font-size: 12px;
  line-height: 1;
}

.time-tabs >>> .el-radio-button__orig-radio:checked + .el-radio-button__inner {
  background-color: rgba(0, 149, 255, 0.2);
  border-color: #0095ff;
  color: #00BFFF;
  box-shadow: -1px 0 0 0 #0095ff;
}

/* 自定义日期选择弹框 */
.algorithm-inference-platform >>> .custom-dialog {
  background: linear-gradient(180deg, rgba(6, 30, 93, 0.95) 0%, rgba(4, 20, 63, 0.98) 100%);
  border: 1px solid rgba(0, 149, 255, 0.3);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.7);
  border-radius: 4px;
}

.algorithm-inference-platform >>> .custom-dialog .el-dialog__header {
  background: rgba(6, 30, 93, 0.9);
  border-bottom: 1px solid rgba(0, 149, 255, 0.2);
  padding: 12px 20px;
}

.algorithm-inference-platform >>> .custom-dialog .el-dialog__title {
  color: #00BFFF;
  font-size: 16px;
  font-weight: bold;
}

.algorithm-inference-platform >>> .custom-dialog .el-dialog__headerbtn .el-dialog__close {
  color: #7888a8;
}

.algorithm-inference-platform >>> .custom-dialog .el-dialog__headerbtn:hover .el-dialog__close {
  color: #00BFFF;
}

.algorithm-inference-platform >>> .custom-dialog .el-dialog__body {
  background: transparent;
  padding: 20px;
  color: #7888a8;
}

.algorithm-inference-platform >>> .custom-dialog .el-dialog__footer {
  background: rgba(6, 30, 93, 0.9);
  border-top: 1px solid rgba(0, 149, 255, 0.2);
  padding: 10px 20px;
}

.algorithm-inference-platform >>> .custom-dialog .el-button--primary {
  background-color: rgba(0, 149, 255, 0.2) !important;
  border-color: #0095ff !important;
  color: #00BFFF !important;
}

.algorithm-inference-platform >>> .custom-dialog .el-button {
  background-color: rgba(6, 30, 93, 0.5) !important;
  border-color: rgba(0, 149, 255, 0.3) !important;
  color: #7888a8 !important;
}

.algorithm-inference-platform >>> .custom-dialog .el-button:hover {
  background-color: rgba(0, 149, 255, 0.1) !important;
  border-color: #0095ff !important;
  color: #00BFFF !important;
}

.algorithm-inference-platform >>> .el-range-editor.el-input__inner {
  background-color: rgba(0, 30, 60, 0.3) !important;
  border: 1px solid rgba(0, 149, 255, 0.3) !important;
  color: #7888a8 !important;
}

.algorithm-inference-platform >>> .el-range-editor .el-range-input {
  background-color: transparent !important;
  color: #7888a8 !important;
}

.algorithm-inference-platform >>> .el-range-editor .el-range-separator {
  color: #7888a8 !important;
}

.algorithm-inference-platform >>> .el-range-editor .el-range__icon,
.algorithm-inference-platform >>> .el-range-editor .el-range__close-icon {
  color: #0095ff !important;
}

.algorithm-inference-platform >>> .date-picker-dropdown.el-picker-panel {
  background: linear-gradient(180deg, rgba(6, 30, 93, 0.98) 0%, rgba(4, 20, 63, 0.98) 100%) !important;
  border: 1px solid rgba(0, 149, 255, 0.4) !important;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.8) !important;
}

.algorithm-inference-platform >>> .date-picker-dropdown .el-date-picker__header-label,
.algorithm-inference-platform >>> .date-picker-dropdown .el-date-range-picker__header {
  color: #00BFFF !important;
  font-weight: bold !important;
}

.algorithm-inference-platform >>> .date-picker-dropdown .el-picker-panel__icon-btn {
  color: #7888a8 !important;
}

.algorithm-inference-platform >>> .date-picker-dropdown .el-picker-panel__icon-btn:hover {
  color: #00BFFF !important;
}

.algorithm-inference-platform >>> .date-picker-dropdown .el-date-table th {
  color: #00BFFF !important;
  border-bottom-color: rgba(0, 149, 255, 0.2) !important;
}

.algorithm-inference-platform >>> .date-picker-dropdown .el-date-table td.available span {
  color: #7888a8 !important;
}

.algorithm-inference-platform >>> .date-picker-dropdown .el-date-table td.available:hover span {
  background-color: rgba(0, 149, 255, 0.15) !important;
  color: #fff !important;
}

.algorithm-inference-platform >>> .date-picker-dropdown .el-date-table td.today span {
  color: #00BFFF !important;
  border: 1px solid rgba(0, 149, 255, 0.5) !important;
}

.algorithm-inference-platform >>> .date-picker-dropdown .el-date-table td.current:not(.disabled) span {
  background: linear-gradient(135deg, rgba(0, 149, 255, 0.3), rgba(0, 95, 200, 0.4)) !important;
  color: #ffffff !important;
}

.algorithm-inference-platform >>> .date-picker-dropdown .el-date-table td.in-range div {
  background: linear-gradient(90deg, rgba(0, 149, 255, 0.05), rgba(0, 95, 200, 0.1)) !important;
}

.algorithm-inference-platform >>> .date-picker-dropdown .el-date-table td.start-date span,
.algorithm-inference-platform >>> .date-picker-dropdown .el-date-table td.end-date span {
  background: linear-gradient(90deg, rgba(0, 149, 255, 0.3), rgba(0, 95, 200, 0.5)) !important;
  color: #ffffff !important;
  font-weight: bold !important;
}

.algorithm-inference-platform >>> .date-picker-dropdown .el-date-table td.disabled div span {
  color: rgba(120, 136, 168, 0.2) !important;
}

.algorithm-inference-platform >>> .date-picker-dropdown .el-date-table td.next-month span,
.algorithm-inference-platform >>> .date-picker-dropdown .el-date-table td.prev-month span {
  color: rgba(120, 136, 168, 0.2) !important;
}

.algorithm-inference-platform >>> .date-picker-dropdown .el-date-range-picker__content.is-left {
  border-right: 1px solid rgba(0, 149, 255, 0.2) !important;
}

::v-deep .date-picker-dropdown {
  position: absolute !important;
}

.top-bar .title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

.right-controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 15px;
  flex: 0 0 auto;
  margin-left: auto;
}

.top-bar .title span {
  font-size: 26px;
  font-weight: bold;
  color: #fff;
  position: relative;
  letter-spacing: 4px;
  text-shadow: 0 0 15px rgba(0, 255, 255, 0.6), 0 0 30px rgba(0, 150, 255, 0.3);
  background: linear-gradient(180deg, #ffffff 0%, #b0d8ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.top-bar .title span::before,
.top-bar .title span::after {
  content: '';
  position: absolute;
  height: 2px;
  width: 80px;
  background: linear-gradient(90deg, transparent, #00ffff, transparent);
  top: 50%;
}

.top-bar .title span::before {
  right: calc(100% + 20px);
}

.top-bar .title span::after {
  left: calc(100% + 20px);
}

.location-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.location,
.weather-info {
  color: #7EAEE5;
}

.location i,
.weather-info i {
  color: #00FFFF;
  font-size: 16px;
  text-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
  margin-right: 4px;
}

.weather-divider {
  color: rgba(126, 174, 229, 0.4);
}

.air-quality {
  color: #44FF9B;
}

.fullscreen-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(0, 20, 40, 0.6);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.fullscreen-btn i {
  color: #00FFFF;
  font-size: 18px;
}

.fullscreen-btn:hover {
  background: rgba(0, 30, 60, 0.8);
  border-color: rgba(0, 255, 255, 0.6);
  transform: scale(1.08);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
}

.loading-indicator {
  color: #7EAEE5;
  font-size: 14px;
}

.realtime-events .card-content {
  height: calc(100% - 40px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.alarm-total-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
}

.digital-alarm-counter {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.counter-value {
  font-size: 24px;
  font-weight: bold;
}

.counter-trend {
  display: flex;
  align-items: center;
}

.trend-up {
  color: #28a745;
  margin-left: 5px;
}

.trend-down {
  color: #dc3545;
  margin-left: 5px;
}

.alarm-chart-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-bottom: 20px;
}

.alarm-chart {
  width: 100%;
  height: 100px;
  position: relative;
}

.half-ring-chart-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.half-ring-chart {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 10px solid rgba(30, 80, 150, 0.2);
  transform: rotate(-135deg);
  overflow: hidden;
}

.half-ring-chart path {
  fill: none;
  stroke: #FF5A5A;
  stroke-width: 10;
  stroke-linecap: round;
}

.half-ring-chart path:nth-child(2) {
  stroke: #FFAA33;
}

.half-ring-chart path:nth-child(3) {
  stroke: #3EAEF9;
}

.half-ring-chart path:nth-child(4) {
  stroke: #29DE9C;
}

.half-ring-chart path:nth-child(5) {
  stroke: #B980FF;
}

.half-ring-chart circle {
  fill: rgba(0, 20, 40, 0.6);
  stroke: none;
  stroke-width: 1;
}

.half-ring-chart text {
  fill: #ffffff;
  font-size: 12px;
  text-anchor: middle;
}

.half-ring-chart .pulse-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 10px solid rgba(58, 158, 255, 0.3);
  transform: rotate(-135deg);
  overflow: hidden;
}

.half-ring-chart .pulse-ring path {
  fill: none;
  stroke: rgba(58, 158, 255, 0.3);
  stroke-width: 10;
  stroke-linecap: round;
}

.alarm-types-legend {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
  padding: 15px 5px;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  background-color: rgba(0, 20, 50, 0.2);
  border: 1px solid rgba(30, 80, 150, 0.3);
}

/* 圆环饼图容器 */
.donut-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  perspective: 1000px;
  overflow: hidden;
}

/* 圆环饼图 */
.donut-chart {
  width: 220px;
  height: 220px;
  border-radius: 50%;
  position: relative;
  margin: 0 auto;
  background: conic-gradient(
    #4CD964 0 5%, 
    #447CF9 5% 45%, 
    #FF9500 45% 65%, 
    #FF2D55 65% 100%
  );
  transform: perspective(800px) rotateX(60deg);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  /* 创建真正的圆环效果 */
  -webkit-mask: radial-gradient(transparent 35%, #fff 36%);
  mask: radial-gradient(transparent 35%, #fff 36%);
}

/* 环内部阴影效果 */
.donut-chart::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(130deg, 
    rgba(255, 255, 255, 0) 0%, 
    rgba(255, 255, 255, 0.4) 45%, 
    rgba(255, 255, 255, 0.7) 50%, 
    rgba(255, 255, 255, 0.4) 55%, 
    rgba(255, 255, 255, 0) 100%
  );
  border-radius: 50%;
  transform: rotate(0deg) translateX(-150%) skewX(-45deg);
  animation: lightSweep 8s ease-in-out infinite;
  z-index: 10;
  pointer-events: none;
  -webkit-mask: radial-gradient(transparent 35%, #fff 36%);
  mask: radial-gradient(transparent 35%, #fff 36%);
}

/* 底部阴影增强立体感 */
.donut-chart::before {
  content: "";
  position: absolute;
  width: 100%;
  height: 20px;
  background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 70%);
  bottom: -20px;
  left: 0;
  filter: blur(5px);
  transform: rotateX(90deg) scale(0.9, 0.2);
  z-index: -1;
  opacity: 0.5;
}

/* 百分比标签 */
.percent-label {
  position: absolute;
  color: #ffffff;
  font-size: 18px;
  font-weight: bold;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
  z-index: 10;
}

.label-1 {
  top: 20%;
  right: 45%;
}

.label-2 {
  top: 20%;
  right: 20%;
}

.label-3 {
  bottom: 30%;
  right: 15%;
}

.label-4 {
  bottom: 25%;
  left: 30%;
}

/* 图例 */
.chart-legends {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 15px;
  padding: 8px 0;
  background: transparent;
}

.legend-item {
  display: flex;
  align-items: center;
}

.legend-color {
  width: 15px;
  height: 15px;
  border-radius: 3px;
  margin-right: 5px;
}

.type-1 {
  background-color: #4CD964;
  /* 人员检测 */
}

.type-2 {
  background-color: #447CF9;
  /* 交通拥堵 */
}

.type-3 {
  background-color: #FF9500;
  /* 非机动车违规 */
}

.type-4 {
  background-color: #FF2D55;
  /* 违章停车 */
}

.legend-name {
  font-size: 12px;
  color: #fff;
  white-space: nowrap;
}

.legend-percent {
  font-size: 12px;
  color: #00FFFF;
  font-weight: 600;
  margin-left: 4px;
  text-shadow: 0 0 6px rgba(0, 255, 255, 0.3);
}

/* 报警统计模块样式 */
.alarm-statistics {
  grid-column: 3;
  grid-row: 2;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.alarm-statistics .card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 5px 10px;
}

.alarm-chart-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.alarm-dist-chart {
  width: 100%;
  flex: 1;
  min-height: 180px;
}

.empty-data-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(126, 174, 229, 0.4);
  padding: 20px 0;
}
.empty-data-placeholder i {
  font-size: 32px;
}
.empty-data-placeholder span {
  font-size: 12px;
  letter-spacing: 1px;
}

/* 圆环饼图容器（已改用 ECharts，保留样式兼容） */
.donut-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  perspective: 1000px;
  overflow: hidden;
}

/* 圆环饼图 */
.donut-chart {
  width: 220px;
  height: 220px;
  border-radius: 50%;
  position: relative;
  margin: 0 auto;
  background: conic-gradient(
    #4CD964 0 5%, 
    #447CF9 5% 45%, 
    #FF9500 45% 65%, 
    #FF2D55 65% 100%
  );
  transform: perspective(800px) rotateX(60deg);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

/* 全屏模式下的样式 */
:fullscreen .algorithm-inference-platform,
:-webkit-full-screen .algorithm-inference-platform,
:-moz-full-screen .algorithm-inference-platform,
:-ms-fullscreen .algorithm-inference-platform {
  width: 100vw;
  height: 100vh;
  padding: 0;
  margin: 0;
  background-color: #000;
  overflow: hidden;
}

/* 全屏模式下内容调整 */
:fullscreen .top-bar,
:-webkit-full-screen .top-bar,
:-moz-full-screen .top-bar,
:-ms-fullscreen .top-bar {
  padding: 0 20px;
  height: 42px;
  background: linear-gradient(180deg, rgba(0, 20, 45, 0.95) 0%, rgba(0, 10, 25, 0.9) 100%);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
}

/* 全屏模式下面板容器调整 */
:fullscreen .dashboard-container,
:-webkit-full-screen .dashboard-container,
:-moz-full-screen .dashboard-container,
:-ms-fullscreen .dashboard-container {
  height: 100vh;
  padding: 60px 10px 10px 10px;
  box-sizing: border-box;
}

/* 全屏按钮补充样式 */
.fullscreen-btn {
  cursor: pointer;
}

.resource-details-container {
  background: rgba(0, 11, 24, 0.8);
  border-top: 1px solid rgba(30, 80, 150, 0.5);
  padding: 10px;
  margin-top: 15px;
  margin-bottom: 10px;
  max-height: 170px;
  overflow-y: auto;
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  /* IE and Edge */
  flex-shrink: 0;
  /* 防止资源详情收缩 */
}

.resource-details-container::-webkit-scrollbar {
  display: none;
  /* Chrome, Safari and Opera */
  width: 0;
  /* 确保滚动条宽度为0 */
}

/* 添加自定义容器确保标题正确对齐 */
.resource-charts {
  display: flex;
  justify-content: space-around;
  margin-top: 15px;
  padding: 0 5px;
  position: relative;
  flex-shrink: 0;
  /* 防止顶部元素收缩 */
}

/* 为实现红框中的标签对齐，添加一个额外的标签容器 */
.resource-labels {
  display: flex;
  justify-content: space-around;
  width: 100%;
  padding: 5px 0;
  margin-top: 5px;
  position: relative;
}

.resource-label {
  flex: 1;
  text-align: center;
  color: #7888a8;
  font-size: 13px;
}

.chart-tooltip {
  position: absolute;
  background-color: rgba(0, 20, 40, 0.9);
  color: #fff;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  white-space: nowrap;
  z-index: 100;
  border: 1px solid rgba(65, 120, 255, 0.5);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  pointer-events: none;
}

/* 百分比标签 */
.percent-label {
  display: none;
}

/* 添加区域样式 */
.chart-section {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  z-index: 5;
  cursor: pointer;
  transition: all 0.3s ease;
}

.section-1 {
  clip-path: polygon(50% 50%, 50% 0, 59% 0, 59% 0, 50% 50%);
}

.section-2 {
  clip-path: polygon(50% 50%, 50% 0, 0 0, 0 50%, 50% 50%);
}

.section-3 {
  clip-path: polygon(50% 50%, 0 50%, 0 100%, 33% 100%, 50% 50%);
}

.section-4 {
  clip-path: polygon(50% 50%, 33% 100%, 100% 100%, 100% 0, 59% 0, 50% 50%);
}

.chart-section:hover {
  filter: brightness(1.3) contrast(1.1);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
}

/* 添加扫光效果增强立体感 */
@keyframes lightSweep {
  0% {
    transform: rotate(0deg) translateX(-150%) skewX(-45deg);
    opacity: 0;
  }
  25% {
    opacity: 0.3;
  }
  50% {
    opacity: 0;
  }
  100% {
    transform: rotate(90deg) translateX(150%) skewX(-45deg);
    opacity: 0;
  }
}

.donut-chart::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(130deg, 
    rgba(255, 255, 255, 0) 0%, 
    rgba(255, 255, 255, 0.4) 45%, 
    rgba(255, 255, 255, 0.7) 50%, 
    rgba(255, 255, 255, 0.4) 55%, 
    rgba(255, 255, 255, 0) 100%
  );
  border-radius: 50%;
  transform: rotate(0deg) translateX(-150%) skewX(-45deg);
  animation: lightSweep 8s ease-in-out infinite;
  z-index: 10;
  pointer-events: none;
  -webkit-mask: radial-gradient(transparent 35%, #fff 36%);
  mask: radial-gradient(transparent 35%, #fff 36%);
}

.chart-tooltip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 20, 40, 0.9);
  color: #fff;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  white-space: nowrap;
  z-index: 100;
  border: 1px solid rgba(65, 120, 255, 0.5);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  pointer-events: none;
}

/* ========== AI智慧大脑区域 ========== */
.ai-brain-section {
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #000d1a;
  position: relative;
  overflow: hidden;
  border: none;
}

.brain-display-wrap {
  width: 100%;
  flex: 1;
  min-height: 200px;
  position: relative;
  overflow: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.brain-display-wrap::-webkit-scrollbar {
  display: none;
  width: 0;
}

.threejs-brain-container {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.threejs-brain-container canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

.brain-image-wrap {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  box-shadow: none;
  border: none;
}

.brain-image-bg {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: #000d1a;
  z-index: 0;
}

.brain-static-img {
  position: relative;
  z-index: 1;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  animation: brain-2d-float 5s ease-in-out infinite;
}

@keyframes brain-2d-float {
  0%, 100% { transform: scale(1) translateY(0); }
  50% { transform: scale(1.03) translateY(-4px); }
}

.brain-view-toggle {
  position: absolute;
  right: 12px;
  bottom: 12px;
  padding: 4px 10px;
  font-size: 12px;
  color: rgba(0, 255, 255, 0.95);
  background: rgba(0, 40, 80, 0.7);
  border: 1px solid rgba(0, 255, 255, 0.35);
  border-radius: 6px;
  cursor: pointer;
  z-index: 10;
  transition: background 0.2s, border-color 0.2s;
}

.brain-view-toggle:hover {
  background: rgba(0, 60, 120, 0.8);
  border-color: rgba(0, 255, 255, 0.6);
}

.brain-stats {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 10px;
  padding: 10px 20px;
  background: rgba(0, 20, 50, 0.4);
  border: 1px solid rgba(0, 255, 255, 0.15);
  border-radius: 8px;
  z-index: 2;
}

.brain-stat-item { text-align: center; }

.brain-stat-item .stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #00FFFF;
  text-shadow: 0 0 12px rgba(0, 255, 255, 0.5);
  line-height: 1.2;
}

.brain-stat-item .stat-label {
  font-size: 12px;
  color: #7EAEE5;
  margin-top: 2px;
}

/* ========== 技能气泡 ========== */
.skill-count-badge {
  font-size: 12px;
  color: #00FFFF;
  background: rgba(0, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid rgba(0, 255, 255, 0.2);
}

/* AI技能全新布局：固定 4x2，不依赖旧样式 */
.ai-skill-panel {
  min-height: 0;
}

.ai-skill-panel .ai-skill-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: auto !important;
  padding: 8px 10px !important;
  overflow: hidden !important;
}

.ai-skill-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.ai-skill-card {
  min-width: 0;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 6px;
  text-align: center;
  border-radius: 10px;
  border: 1px solid rgba(76, 155, 255, 0.42);
  background:
    linear-gradient(145deg, rgba(19, 53, 98, 0.78) 0%, rgba(10, 31, 58, 0.92) 100%);
  box-shadow:
    0 3px 10px rgba(0, 20, 50, 0.36),
    inset 0 1px 0 rgba(178, 228, 255, 0.12),
    inset 0 -10px 16px rgba(5, 16, 36, 0.24);
  overflow: hidden;
  position: relative;
  transition: transform 0.2s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}

.ai-skill-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, rgba(45, 225, 255, 0.9), rgba(86, 144, 255, 0.58));
  opacity: 0.9;
}

.ai-skill-card::after {
  content: '';
  position: absolute;
  left: 8px;
  right: 8px;
  top: 0;
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(173, 227, 255, 0.55), rgba(255, 255, 255, 0));
}

.ai-skill-card:hover {
  transform: translateY(-1px);
  border-color: rgba(96, 193, 255, 0.75);
  box-shadow:
    0 6px 16px rgba(16, 66, 124, 0.32),
    0 0 14px rgba(55, 176, 255, 0.16),
    inset 0 1px 0 rgba(193, 236, 255, 0.2);
}

.ai-skill-name {
  font-size: 12px;
  line-height: 1.3;
  color: rgba(238, 248, 255, 0.98);
  font-weight: 500;
  letter-spacing: 0.02em;
  word-break: break-word;
  overflow: hidden;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  text-shadow: 0 1px 3px rgba(2, 12, 30, 0.65);
  padding: 0 2px;
}

/* ========== 预警行内缩略图 ========== */
.alert-thumb {
  width: 52px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  cursor: pointer;
  position: relative;
  border: 1px solid rgba(35, 88, 148, 0.3);
  transition: all 0.3s ease;
}

.alert-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.alert-thumb .thumb-zoom {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.2s ease;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
}

.alert-thumb:hover {
  border-color: rgba(0, 255, 255, 0.5);
  box-shadow: 0 0 8px rgba(0, 255, 255, 0.2);
}

.alert-thumb:hover .thumb-zoom {
  opacity: 1;
}

.alert-thumb:hover img {
  filter: brightness(0.7);
}

/* 图片放大弹窗 */
.dialog-image-wrap {
  position: relative;
}

.dialog-image-wrap img {
  width: 100%;
  height: auto;
  display: block;
}

.dialog-alert-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 20px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.85));
  display: flex;
  gap: 20px;
  color: #fff;
  font-size: 14px;
}

/* ========== 摄像头概览圆圈 ========== */
.cam-total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0 5px;
  margin-bottom: 10px;
}

.cam-total-label {
  color: #7EAEE5;
  font-size: 13px;
}

.cam-total-num {
  font-size: 28px;
  font-weight: bold;
  color: #00FFFF;
  text-shadow: 0 0 12px rgba(0, 255, 255, 0.5);
}

.cam-circles {
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex: 1;
}

.cam-circle-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.cam-ring {
  position: relative;
  width: 68px;
  height: 68px;
}

.cam-ring svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  fill: none;
  stroke: rgba(30, 80, 150, 0.2);
  stroke-width: 5;
}

.ring-fg {
  fill: none;
  stroke-width: 5;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s ease;
}

.online-fg { stroke: #44FF9B; filter: drop-shadow(0 0 4px rgba(68, 255, 155, 0.5)); }
.analyzing-fg { stroke: #3eaef9; filter: drop-shadow(0 0 4px rgba(62, 174, 249, 0.5)); }
.offline-fg { stroke: #ff5a5a; filter: drop-shadow(0 0 4px rgba(255, 90, 90, 0.5)); }

.cam-ring-num {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 18px;
  font-weight: bold;
}

.cam-ring-num.online-num { color: #44FF9B; }
.cam-ring-num.analyzing-num { color: #3eaef9; }
.cam-ring-num.offline-num { color: #ff5a5a; }

.cam-circle-label {
  color: #7EAEE5;
  font-size: 12px;
}

/* 资源概要区域 */
.resource-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  padding: 10px;
  background: rgba(0, 20, 50, 0.3);
  border: 1px solid rgba(35, 88, 148, 0.3);
  border-radius: 4px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.summary-label {
  color: #7EAEE5;
  font-size: 13px;
}

.summary-value {
  color: #CCD6F6;
  font-size: 13px;
  font-weight: bold;
}

.summary-value.highlight {
  color: #00FFFF;
  text-shadow: 0 0 8px rgba(0, 255, 255, 0.4);
  font-size: 16px;
}

/* 预警预览布局 */
.alert-preview-layout {
  display: flex;
  gap: 6px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.alert-main-image {
  flex: 1;
  min-width: 0;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid rgba(35, 88, 148, 0.4);
  background: rgba(0, 10, 30, 0.5);
}

.alert-main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.alert-image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 6px 8px;
  background: linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.alert-image-timestamp {
  color: rgba(255, 255, 255, 0.85);
  font-size: 11px;
  font-family: monospace;
  text-shadow: 0 1px 3px rgba(0,0,0,0.8);
}

.alert-image-level-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 3px;
  font-weight: 500;
  flex-shrink: 0;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}
.alert-image-level-tag.alarm-level-1 { color: #fff; background: #ff2d55; }
.alert-image-level-tag.alarm-level-2 { color: #fff; background: #ff9500; }
.alert-image-level-tag.alarm-level-3 { color: #fff; background: #3eaef9; }
.alert-image-level-tag.alarm-level-4 { color: #fff; background: #44FF9B; }

.alert-thumb-column {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 60px;
  flex-shrink: 0;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.alert-thumb-column::-webkit-scrollbar { display: none; }

.alert-thumb-item {
  width: 60px;
  height: 42px;
  border-radius: 3px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid rgba(35, 88, 148, 0.3);
  flex-shrink: 0;
  transition: all 0.2s ease;
  opacity: 0.6;
}

.alert-thumb-item.active {
  border-color: rgba(0, 200, 255, 0.6);
  box-shadow: 0 0 8px rgba(0, 200, 255, 0.25);
  opacity: 1;
}

.alert-thumb-item:hover {
  opacity: 0.9;
  border-color: rgba(0, 200, 255, 0.4);
}

.alert-thumb-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 预警信息栏 */
.alert-info-bar {
  padding: 8px 0 0;
  border-top: 1px solid rgba(35, 88, 148, 0.3);
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alert-info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.alert-info-label {
  color: #7888a8;
  width: 32px;
  flex-shrink: 0;
  font-weight: 500;
}

.alert-info-value {
  color: #CCD6F6;
  flex: 1;
}

.alert-event-name {
  color: #ff4757;
  font-weight: 600;
}

.alert-alarm-tag {
  font-size: 11px;
  padding: 1px 10px;
  border-radius: 3px;
  font-weight: 500;
  flex-shrink: 0;
}

.alert-alarm-tag.alarm-level-1 { color: #fff; background: #ff2d55; }
.alert-alarm-tag.alarm-level-2 { color: #fff; background: #ff9500; }
.alert-alarm-tag.alarm-level-3 { color: #fff; background: #3eaef9; }
.alert-alarm-tag.alarm-level-4 { color: #fff; background: #44FF9B; }

/* 任务与复判概览：铺满 card-content 剩余区域 */
.alarm-forwarding .review-overview-content {
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-self: stretch;
}

.review-kpi-grid {
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 8px;
  align-content: stretch;
}

.review-kpi {
  min-height: 0;
  min-width: 0;
  box-sizing: border-box;
  background: rgba(0, 20, 50, 0.35);
  border: 1px solid rgba(35, 88, 148, 0.35);
  border-radius: 6px;
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.review-kpi-value {
  color: #00ffff;
  font-size: clamp(18px, 2.8vh, 26px);
  font-weight: bold;
  line-height: 1.2;
  text-shadow: 0 0 8px rgba(0, 255, 255, 0.25);
}

.review-kpi-label {
  margin-top: 6px;
  color: #7eaee5;
  font-size: clamp(10px, 1.5vh, 12px);
  line-height: 1.25;
  padding: 0 4px;
}

/* 摄像头圆环颜色 */
.online-circle .ripple { border-color: rgba(68, 255, 155, 0.4) !important; }
.analyzing-circle .ripple { border-color: rgba(62, 174, 249, 0.4) !important; }
.offline-circle .ripple { border-color: rgba(255, 90, 90, 0.4) !important; }

.online-circle .number { color: #44FF9B !important; }
.analyzing-circle .number { color: #3eaef9 !important; }
.offline-circle .number { color: #ff5a5a !important; }

/* 修复整个页面的滚动条 */
html,
body {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
  overflow-x: hidden !important;
}

html::-webkit-scrollbar,
body::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
}
</style>

<style>
.alert-image-dialog .el-dialog {
  background: linear-gradient(180deg, #001529 0%, #000B18 100%) !important;
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 8px;
  overflow: hidden;
}

.alert-image-dialog .el-dialog__header {
  display: none;
}

.alert-image-dialog .el-dialog__body {
  padding: 0 !important;
}
</style>
