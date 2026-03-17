<template>
  <div class="statistics-analysis-page">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="summary-cards">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="summary-card total">
          <div class="card-content">
            <el-icon class="card-icon" :size="32"><DataAnalysis /></el-icon>
            <div class="card-info">
              <div class="card-value">{{ statisticsData.totalCount }}</div>
              <div class="card-label">预警总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="summary-card success">
          <div class="card-content">
            <el-icon class="card-icon" :size="32"><SuccessFilled /></el-icon>
            <div class="card-info">
              <div class="card-value">{{ statisticsData.successRate }}%</div>
              <div class="card-label">处理成功率</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="summary-card warning">
          <div class="card-content">
            <el-icon class="card-icon" :size="32"><WarningFilled /></el-icon>
            <div class="card-info">
              <div class="card-value">{{ statisticsData.warningCount }}</div>
              <div class="card-label">待处理预警</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="summary-card processed">
          <div class="card-content">
            <el-icon class="card-icon" :size="32"><CircleCheckFilled /></el-icon>
            <div class="card-info">
              <div class="card-value">{{ statisticsData.processedCount }}</div>
              <div class="card-label">今日已处理</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选工具栏 -->
    <el-card shadow="never" class="filter-card">
      <div class="filter-toolbar">
        <el-radio-group v-model="timeRange" @change="handleTimeRangeChange">
          <el-radio-button label="today">今日</el-radio-button>
          <el-radio-button label="week">本周</el-radio-button>
          <el-radio-button label="week">本月</el-radio-button>
          <el-radio-button label="custom">自定义</el-radio-button>
        </el-radio-group>
        <el-date-picker
          v-if="timeRange === 'custom'"
          v-model="customDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="applyCustomDateRange"
          class="ml-3"
        />
        <el-divider direction="vertical" />
        <el-button type="primary" :loading="refreshing" :icon="Refresh" @click="refreshData">
          刷新
        </el-button>
      </div>
    </el-card>

    <!-- 图表区域 -->
    <el-row :gutter="16">
      <!-- 预警趋势图 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">预警趋势</span>
            </div>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 预警状态分布 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">预警状态分布</span>
            </div>
          </template>
          <div ref="warningStatusChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 预警等级分布 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">预警等级分布</span>
            </div>
          </template>
          <div ref="warningLevelChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 设备预警数量 TOP10 -->
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">设备预警数量 TOP10</span>
            </div>
          </template>
          <div ref="topWarningTypeChartRef" class="chart-container"></div>
          <el-empty v-if="deviceWarnings.length === 0" description="暂无数据" :image-size="80" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts";
import { ElMessage } from "element-plus";
import { DataAnalysis, SuccessFilled, WarningFilled, CircleCheckFilled, Refresh } from "@element-plus/icons-vue";
import dashboardAPI from "@/api/center/dashboard";
import type {
  AlertSummary,
  AlertLevel,
  AlertStatus,
  DeviceTopWarning,
  SystemStatus,
  TimeRange,
} from "@/types/center/dashboard";

// ==================== 响应式数据 ====================
const timeRange = ref<"today" | "week" | "month" | "custom">("today");
const customDateRange = ref<string[]>([]);
const refreshing = ref(false);

// 统计数据
const statisticsData = ref({
  totalCount: 0,
  successRate: 0,
  warningCount: 0,
  processedCount: 0,
});

// 后端分别返回的数据
const alertSummary = ref<AlertSummary | null>(null);
const alertLevels = ref<AlertLevel[]>([]);
const alertStatus = ref<AlertStatus[]>([]);
const deviceTopWarnings = ref<DeviceTopWarning[]>([]);
const systemStatus = ref<SystemStatus | null>(null);

// 处理后的设备预警 TOP10（适配图表格式）
const deviceWarnings = computed(() => {
  return deviceTopWarnings.value.map(item => ({
    name: item.camera_name,
    count: item.count,
    percent: 0,
  }));
});

// 图表 DOM 引用
const trendChartRef = ref<HTMLElement>();
const warningStatusChartRef = ref<HTMLElement>();
const warningLevelChartRef = ref<HTMLElement>();
const topWarningTypeChartRef = ref<HTMLElement>();

// 图表实例
const charts = ref<{
  trendChart?: echarts.ECharts;
  warningStatusChart?: echarts.ECharts;
  warningLevelChart?: echarts.ECharts;
  topWarningTypeChart?: echarts.ECharts;
}>({});

// 前端时间范围映射到后端参数
const mapFrontendTimeRange = (frontend: string): TimeRange => {
  switch (frontend) {
    case "today":
      return "24h";
    case "week":
      return "7d";
    case "month":
      return "30d";
    default:
      return "7d";
  }
};

// ==================== 计算属性 ====================
const successRate = computed(() => {
  const total = alertSummary.value?.total_alerts || 0;
  // 后端直接返回 resolution_rate 百分比 (0-100)
  return alertSummary.value?.resolution_rate?.toFixed(2) || "0.00";
});

const warningCount = computed(() => {
  return alertSummary.value?.pending_alerts || 0;
});

const totalCount = computed(() => {
  return alertSummary.value?.total_alerts || 0;
});

const processedCount = computed(() => {
  return alertSummary.value?.resolved_today || 0;
});

// ==================== API 调用 ====================
async function loadStatistics() {
  refreshing.value = true;
  try {
    const backendRange = mapFrontendTimeRange(timeRange.value);

    // 并行加载所有接口，提升加载速度
    const [summary, levels, status, topWarnings, system] = await Promise.all([
      dashboardAPI.getAlertSummary(),
      dashboardAPI.getAlertLevels(backendRange),
      dashboardAPI.getAlertStatus(backendRange),
      dashboardAPI.getDeviceTopWarnings(backendRange, 10),
      dashboardAPI.getSystemStatus(),
    ]);

    // 保存各个接口返回的数据
    alertSummary.value = summary;
    alertLevels.value = levels;
    alertStatus.value = status;
    deviceTopWarnings.value = topWarnings;
    systemStatus.value = system;

    console.log("[统计分析] 获取到统计数据:", {
      summary, levels, status, topWarnings, system
    });

    updateStatisticsData();
    updateAllCharts();
  } catch (error: unknown) {
    console.error("[统计分析] 获取统计数据失败:", error);

    // 改进错误消息处理：不显示后端的"成功"消息作为错误
    let errorMessage = "获取统计数据失败";
    if (error instanceof Error) {
      const message = error.message;
      // 如果错误消息包含"成功"字样，说明是后端返回的成功消息被错误处理了
      if (message && !message.includes("成功")) {
        errorMessage = `获取统计数据失败: ${message}`;
      } else {
        errorMessage = "获取统计数据失败，请稍后重试";
      }
    }
    ElMessage.error(errorMessage);
  } finally {
    refreshing.value = false;
  }
}

function updateStatisticsData() {
  statisticsData.value = {
    totalCount: totalCount.value,
    successRate: parseFloat(successRate.value),
    warningCount: warningCount.value,
    processedCount: processedCount.value,
  };
}

// ==================== 时间范围处理 ====================
function handleTimeRangeChange() {
  loadStatistics();
  if (charts.value.trendChart) {
    const { xData, yData } = generateTimeData(timeRange.value);
    updateTrendChart(xData, yData);
  }
}

function applyCustomDateRange() {
  if (customDateRange.value && customDateRange.value.length === 2) {
    loadStatistics();
  }
}

function generateTimeData(range: string) {
  const now = new Date();
  let xData: string[] = [];
  let yData: number[] = [];

  if (range === "today") {
    for (let i = 0; i < 24; i++) {
      xData.push(`${i}:00`);
      yData.push(Math.floor(Math.random() * 20));
    }
  } else if (range === "week") {
    const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      xData.push(weekDays[date.getDay()]);
      yData.push(Math.floor(Math.random() * 50));
    }
  } else if (range === "month") {
    for (let i = 1; i <= 30; i++) {
      xData.push(`${i}日`);
      yData.push(Math.floor(Math.random() * 100));
    }
  } else if (range === "custom") {
    if (customDateRange.value && customDateRange.value.length === 2) {
      const startDate = new Date(customDateRange.value[0]);
      const endDate = new Date(customDateRange.value[1]);
      const daysDiff = Math.floor(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      for (let i = 0; i <= daysDiff; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        xData.push(`${date.getMonth() + 1}/${date.getDate()}`);
        yData.push(Math.floor(Math.random() * 50));
      }
    }
  }

  return { xData, yData };
}

// ==================== 图表初始化 ====================
function initCharts() {
  nextTick(() => {
    initTrendChart();
    initWarningStatusChart();
    initWarningLevelChart();
    initTopWarningTypeChart();
  });
}

function initTrendChart() {
  if (!trendChartRef.value) return;
  charts.value.trendChart = echarts.init(trendChartRef.value);
  const { xData, yData } = generateTimeData("today");
  updateTrendChart(xData, yData);
}

function updateTrendChart(xData: string[], yData: number[]) {
  if (!charts.value.trendChart) return;

  const option: echarts.EChartsOption = {
    grid: {
      top: 20,
      bottom: 20,
      left: 40,
      right: 20,
      containLabel: true,
    },
    tooltip: {
      trigger: "axis",
    },
    xAxis: {
      type: "category",
      data: xData,
      axisLine: { lineStyle: { color: "#E5E7EB" } },
      axisLabel: { color: "#6B7280" },
    },
    yAxis: {
      type: "value",
      axisLine: { lineStyle: { color: "#E5E7EB" } },
      axisLabel: { color: "#6B7280" },
      splitLine: { lineStyle: { color: "#F3F4F6" } },
    },
    series: [
      {
        name: "预警数量",
        type: "line",
        data: yData,
        smooth: true,
        lineStyle: { color: "#4185F7", width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(65, 133, 247, 0.3)" },
            { offset: 1, color: "rgba(65, 133, 247, 0.05)" },
          ]),
        },
        itemStyle: { color: "#4185F7" },
      },
    ],
  };

  charts.value.trendChart.setOption(option);
}

function initWarningStatusChart() {
  if (!warningStatusChartRef.value) return;
  charts.value.warningStatusChart = echarts.init(warningStatusChartRef.value);
  updateWarningStatusChart();
}

function updateWarningStatusChart() {
  if (!charts.value.warningStatusChart) return;

  if (alertStatus.value.length === 0) {
    console.warn("[统计分析] 预警状态数据未加载");
    return;
  }

  // 直接使用后端返回的状态数据（包含每个状态的名称、数量、颜色）
  const statusData = alertStatus.value.map(item => ({
    value: item.count,
    name: item.status_name,
    itemStyle: { color: item.color || getDefaultStatusColor(item.status) },
  }));

  // 为没有颜色的状态提供默认颜色
  function getDefaultStatusColor(status: number): string {
    switch (status) {
      case 1: return "#faad14"; // 待处理 - 黄色
      case 2: return "#1890ff"; // 处理中 - 蓝色
      case 3: return "#52c41a"; // 已处理 - 绿色
      case 4: return "#d9d9d9"; // 已归档 - 灰色
      case 5: return "#ff4d4f"; // 误报 - 红色
      default: return "#4185F7";
    }
  }

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
    },
    legend: {
      orient: "vertical",
      right: 10,
      top: "center",
    },
    series: [
      {
        type: "pie",
        radius: ["50%", "70%"],
        center: ["35%", "50%"],
        label: { show: false },
        data: statusData,
      },
    ],
  };

  charts.value.warningStatusChart.setOption(option);
}

function initWarningLevelChart() {
  if (!warningLevelChartRef.value) return;
  charts.value.warningLevelChart = echarts.init(warningLevelChartRef.value);
  updateWarningLevelChart();
}

function updateWarningLevelChart() {
  if (!charts.value.warningLevelChart) return;

  const alertLevelsData = alertLevels.value || [];

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    xAxis: {
      type: "category",
      data: alertLevelsData.map((item: any) => item.level_name),
      axisLine: { lineStyle: { color: "#E5E7EB" } },
      axisLabel: { color: "#6B7280" },
    },
    yAxis: {
      type: "value",
      axisLine: { lineStyle: { color: "#E5E7EB" } },
      axisLabel: { color: "#6B7280" },
      splitLine: { lineStyle: { color: "#F3F4F6" } },
    },
    series: [
      {
        name: "预警数量",
        type: "bar",
        data: alertLevelsData.map((item: any) => ({
          value: item.count,
          itemStyle: { color: item.color || "#4185F7" },
        })),
        barWidth: "60%",
      },
    ],
  };

  charts.value.warningLevelChart.setOption(option);
}

function initTopWarningTypeChart() {
  if (!topWarningTypeChartRef.value) return;
  charts.value.topWarningTypeChart = echarts.init(topWarningTypeChartRef.value);
  updateTopWarningTypeChart();
}

function updateTopWarningTypeChart() {
  if (!charts.value.topWarningTypeChart) return;

  const option: echarts.EChartsOption = {
    grid: {
      left: 10,
      right: 60,
      bottom: 10,
      top: 10,
      containLabel: true,
    },
    xAxis: {
      type: "value",
      axisLine: { lineStyle: { color: "#E5E7EB" } },
      axisLabel: { color: "#6B7280" },
      splitLine: { lineStyle: { color: "#F3F4F6" } },
    },
    yAxis: {
      type: "category",
      data: deviceWarnings.value.map((item) => item.name),
      axisLine: { lineStyle: { color: "#E5E7EB" } },
      axisLabel: { color: "#6B7280" },
    },
    series: [
      {
        name: "预警数量",
        type: "bar",
        data: deviceWarnings.value.map((item) => ({
          value: item.count,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: "rgba(65, 133, 247, 0.8)" },
              { offset: 1, color: "rgba(65, 133, 247, 0.2)" },
            ]),
          },
        })),
        barWidth: "60%",
        label: {
          show: true,
          position: "right",
          formatter: "{c}次",
        },
      },
    ],
  };

  charts.value.topWarningTypeChart.setOption(option);
}

function updateAllCharts() {
  updateWarningStatusChart();
  updateWarningLevelChart();
  updateTopWarningTypeChart();
}

function refreshData() {
  loadStatistics();
}

function handleResize() {
  Object.values(charts.value).forEach((chart) => {
    if (chart) {
      chart.resize();
    }
  });
}

function disposeCharts() {
  Object.values(charts.value).forEach((chart) => {
    if (chart) {
      chart.dispose();
    }
  });
}

// ==================== 生命周期 ====================
onMounted(() => {
  loadStatistics();
  initCharts();
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  disposeCharts();
});
</script>

<style scoped>
.statistics-analysis-page {
  padding: 16px;
  background: var(--el-bg-color-page);
  min-height: 100%;
}

/* 统计卡片 */
.summary-cards {
  margin-bottom: 16px;
}

.summary-card {
  border-radius: var(--el-border-radius-base);
  transition: all 0.3s;
}

.summary-card.total :deep(.el-card__body) {
  border-left: 4px solid var(--el-color-primary);
}

.summary-card.success :deep(.el-card__body) {
  border-left: 4px solid var(--el-color-success);
}

.summary-card.warning :deep(.el-card__body) {
  border-left: 4px solid var(--el-color-warning);
}

.summary-card.processed :deep(.el-card__body) {
  border-left: 4px solid var(--el-color-info);
}

.card-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-icon {
  flex-shrink: 0;
  opacity: 0.8;
}

.summary-card.total .card-icon {
  color: var(--el-color-primary);
}

.summary-card.success .card-icon {
  color: var(--el-color-success);
}

.summary-card.warning .card-icon {
  color: var(--el-color-warning);
}

.summary-card.processed .card-icon {
  color: var(--el-color-info);
}

.card-info {
  flex: 1;
}

.card-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}

.card-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

/* 筛选卡片 */
.filter-card {
  margin-bottom: 16px;
}

.filter-card :deep(.el-card__body) {
  padding: 12px 16px;
}

.filter-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

/* 图表卡片 */
.chart-card {
  margin-bottom: 16px;
  min-height: 400px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.chart-container {
  width: 100%;
  height: 300px;
}

/* 响应式 */
@media (max-width: 768px) {
  .statistics-analysis-page {
    padding: 8px;
  }

  .summary-cards {
    margin-bottom: 8px;
  }

  .filter-card,
  .chart-card {
    margin-bottom: 8px;
  }

  .filter-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .ml-3 {
    margin-left: 0 !important;
    margin-top: 8px;
  }
}
</style>
