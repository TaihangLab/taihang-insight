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
          <div class="alarm-chart-section" style="position:relative">
            <div ref="alarmDistChart" class="alarm-dist-chart"></div>
            <div v-if="alarmDistEmpty" class="empty-data-placeholder"
              style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;flex-direction:column;background:#0a1630;z-index:1">
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
      latestAlerts: [],
      alertTrendTotal: 0,
      todayAlertCount: 0,
      timeRange: 'day',
      customDateRange: [],
      datePickerDialogVisible: false,
      alertTrendLoading: false,
      statsRefreshTimer: null,
      reviewStats: {
        total: 0,
        online: 0,
        reviewSkills: 0,
        reviewEnabled: 0,
      },
      trendChartInstance: null
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
      this.renderTrendChart([], []);
      this.renderAlarmDistChart([]);
      this.fetchAll().then(() => {
        this.$nextTick(() => {
          this.handleTrendChartResize();
          this.handleAlarmDistChartResize();
        });
      });
      this.startSkillCarousel();

      this._debouncedResize = this._debounce(() => {
        this.handleTrendChartResize();
        this.handleAlarmDistChartResize();
        this.handleBrainResize();
      }, 300);
      window.addEventListener('resize', this._debouncedResize);

      setTimeout(() => {
        this.handleTrendChartResize();
        this.handleAlarmDistChartResize();
      }, 500);
    });

    this.resourceTimer = setInterval(() => {
      this.fetchSystemResources();
    }, 10000);

    this.statsRefreshTimer = setInterval(() => {
      this.fetchAllStats();
    }, 30000);
  },
  beforeDestroy() {
    if (this.timer) clearInterval(this.timer);
    if (this.skillCarouselTimer) {
      clearInterval(this.skillCarouselTimer);
      this.skillCarouselTimer = null;
    }
    if (this.resourceTimer) clearInterval(this.resourceTimer);
    if (this.statsRefreshTimer) clearInterval(this.statsRefreshTimer);

    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    if (this._debouncedResize) {
      window.removeEventListener('resize', this._debouncedResize);
    }

    if (this.trendChartInstance) {
      this.trendChartInstance.dispose();
      this.trendChartInstance = null;
    }
    if (this.alarmDistChart) {
      this.alarmDistChart.dispose();
      this.alarmDistChart = null;
    }

    this.disposeBrainScene();
  },
  methods: {
    _debounce(fn, delay) {
      let timer = null;
      return function (...args) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
      };
    },
    async fetchWeather() {
      this.locationInfo.loading = true;
      try {
        const ipResp = await fetch('http://ip-api.com/json/?lang=zh-CN&fields=city,regionName,lat,lon');
        const ipData = await ipResp.json();
        const province = ipData.regionName || '';
        const city = ipData.city || '';
        const lat = ipData.lat;
        const lon = ipData.lon;
        if (province && city && province !== city) {
          this.locationInfo.location = `${province} ${city}`;
        } else {
          this.locationInfo.location = city || province || '未知地区';
        }

        let weatherOk = false;
        try {
          const weatherCity = encodeURIComponent(city || '');
          const wttrResp = await fetch(`https://wttr.in/${weatherCity}?format=j1&lang=zh`);
          const wttrData = await wttrResp.json();
          const cur = wttrData && wttrData.current_condition && wttrData.current_condition[0];
          if (cur) {
            const tempC = cur.temp_C || '--';
            const desc = (cur.lang_zh && cur.lang_zh[0] && cur.lang_zh[0].value)
              || (cur.weatherDesc && cur.weatherDesc[0] && cur.weatherDesc[0].value) || '';
            const humidity = cur.humidity || '--';
            this.locationInfo.weather = `${desc} ${tempC}°C`;
            this.locationInfo.airQuality = `湿度 ${humidity}%`;
            weatherOk = true;
          }
        } catch (_) { /* wttr.in 失败，走备用 */ }

        if (!weatherOk && lat && lon) {
          try {
            const meteoResp = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code`
            );
            const meteo = await meteoResp.json();
            const c = meteo && meteo.current;
            if (c) {
              const wmoMap = {0:'晴',1:'大部晴朗',2:'多云',3:'阴天',45:'雾',48:'雾凇',51:'小毛毛雨',53:'毛毛雨',55:'密毛毛雨',61:'小雨',63:'中雨',65:'大雨',71:'小雪',73:'中雪',75:'大雪',77:'雪粒',80:'小阵雨',81:'阵雨',82:'大阵雨',85:'小阵雪',86:'大阵雪',95:'雷暴',96:'雷暴伴冰雹',99:'强雷暴伴冰雹'};
              const desc = wmoMap[c.weather_code] || '未知';
              this.locationInfo.weather = `${desc} ${Math.round(c.temperature_2m)}°C`;
              this.locationInfo.airQuality = `湿度 ${Math.round(c.relative_humidity_2m)}%`;
            }
          } catch (_) { /* 备用也失败，保持默认值 */ }
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
      ]);
      await Promise.all([
        this.fetchRecentAlerts().catch(e => console.error('fetchRecentAlerts:', e)),
        this.fetchSystemResources().then(() => this.fetchCameraStats()).catch(e => console.error('fetchCameraStats:', e)),
        this.fetchSkillList().catch(e => console.error('fetchSkillList:', e)),
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
        this.alarmDistEmpty = pieData.length === 0 || pieData.every(d => d.value === 0);
        this.renderAlarmDistChart(this.alarmDistEmpty ? [] : pieData);
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

        const analyzingSet = this._analyzingSet;
        const analyzing = analyzingSet
          ? cameras.filter(c => analyzingSet.has(Number(c.id))).length
          : 0;

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
