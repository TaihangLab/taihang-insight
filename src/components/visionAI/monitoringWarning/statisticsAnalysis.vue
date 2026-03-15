<template>
  <div class="statistics-analysis-container">
    <!-- 顶部统计卡片 -->
    <div class="summary-cards">
      <div class="summary-card">
        <div class="card-icon total">
          <i class="el-icon-s-data"></i>
        </div>
        <div class="card-content">
          <div class="card-value">{{ statisticsData.totalCount }}</div>
          <div class="card-label">预警总数</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="card-icon success">
          <i class="el-icon-success"></i>
        </div>
        <div class="card-content">
          <div class="card-value">{{ statisticsData.successRate }}%</div>
          <div class="card-label">处理成功率</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="card-icon warning">
          <i class="el-icon-warning"></i>
        </div>
        <div class="card-content">
          <div class="card-value">{{ statisticsData.warningCount }}</div>
          <div class="card-label">待处理预警</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="card-icon processed">
          <i class="el-icon-circle-check"></i>
        </div>
        <div class="card-content">
          <div class="card-value">{{ statisticsData.processedCount }}</div>
          <div class="card-label">今日已处理</div>
        </div>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <el-radio-group v-model="timeRange" @change="handleTimeRangeChange">
        <el-radio-button label="today">今日</el-radio-button>
        <el-radio-button label="week">本周</el-radio-button>
        <el-radio-button label="month">本月</el-radio-button>
        <el-radio-button label="custom">自定义</el-radio-button>
      </el-radio-group>
      <el-button v-if="timeRange === 'custom'" type="primary" size="small" @click="showDatePicker">
        选择日期
      </el-button>
      <el-button type="primary" size="small" :loading="refreshing" @click="refreshData">
        <i class="el-icon-refresh"></i>
        刷新
      </el-button>
    </div>

    <!-- 日期选择器弹窗 -->
    <el-dialog title="选择日期范围" :visible.sync="datePickerDialogVisible" width="400px">
      <el-date-picker
        v-model="customDateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        format="yyyy-MM-dd"
        value-format="yyyy-MM-dd"
        style="width: 100%"
      ></el-date-picker>
      <span slot="footer" class="dialog-footer">
        <el-button @click="datePickerDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="applyCustomDateRange">确定</el-button>
      </span>
    </el-dialog>

    <!-- 图表区域 -->
    <div class="charts-container">
      <!-- 预警趋势图 -->
      <div class="chart-panel">
        <div class="panel-header">
          <div class="panel-title">预警趋势</div>
        </div>
        <div id="trendChart" class="chart-content"></div>
      </div>

      <!-- 预警状态分布 -->
      <div class="chart-panel">
        <div class="panel-header">
          <div class="panel-title">预警状态分布</div>
        </div>
        <div id="warningStatusChart" class="chart-content"></div>
      </div>

      <!-- 预警等级分布 -->
      <div class="chart-panel">
        <div class="panel-header">
          <div class="panel-title">预警等级分布</div>
        </div>
        <div id="warningLevelChart" class="chart-content"></div>
      </div>

      <!-- 设备预警数量TOP10 -->
      <div class="chart-panel full-width">
        <div class="panel-header">
          <div class="panel-title">设备预警数量 TOP10</div>
        </div>
        <div id="topWarningTypeChart" class="chart-content"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import * as echarts from "echarts";
import dashboardAPI from "@/api/center/dashboard";
import type { DashboardSummary } from "@/types/center/dashboard";

// ==================== 响应式数据 ====================
const timeRange = ref<"today" | "week" | "month" | "custom">("today");
const customDateRange = ref<string[]>([]);
const datePickerDialogVisible = ref(false);
const refreshing = ref(false);

// 统计数据
const statisticsData = ref({
  totalCount: 0,
  successRate: 0,
  warningCount: 0,
  processedCount: 0,
});

// 设备预警 TOP10
const deviceWarnings = ref<Array<{ name: string; count: number; percent: number }>>([]);

// 图表实例
const charts = ref<{
  trendChart?: echarts.ECharts;
  warningStatusChart?: echarts.ECharts;
  warningLevelChart?: echarts.ECharts;
  topWarningTypeChart?: echarts.ECharts;
}>({});

// 后端数据
const dashboardData = ref<DashboardSummary | null>(null);

// ==================== 计算属性 ====================
// 计算成功率
const successRate = computed(() => {
  const total = dashboardData.value?.alerts?.total_alerts || 0;
  const processed = dashboardData.value?.alerts?.resolved_today || 0;
  return total > 0 ? ((processed / total) * 100).toFixed(2) : "0.00";
});

// 计算待处理数量
const warningCount = computed(() => {
  return dashboardData.value?.alerts?.pending_alerts || 0;
});

// 计算总数
const totalCount = computed(() => {
  return dashboardData.value?.alerts?.total_alerts || 0;
});

// 计算今日已处理
const processedCount = computed(() => {
  return dashboardData.value?.alerts?.resolved_today || 0;
});

// ==================== API 调用 ====================
/**
 * 加载统计数据
 */
async function loadStatistics() {
  refreshing.value = true;
  try {
    const data = await dashboardAPI.getSummary();
    dashboardData.value = data;
    console.log("[统计分析] 获取到统计数据:", data);

    // 更新统计数据
    updateStatisticsData();

    // 更新图表
    updateAllCharts();
  } catch (error) {
    console.error("[统计分析] 获取统计数据失败:", error);
  } finally {
    refreshing.value = false;
  }
}

/**
 * 更新统计数据
 */
function updateStatisticsData() {
  statisticsData.value = {
    totalCount: totalCount.value,
    successRate: parseFloat(successRate.value),
    warningCount: warningCount.value,
    processedCount: processedCount.value,
  };
}

/**
 * 生成设备预警 TOP10 数据
 */
function generateDeviceWarningsTop10() {
  // 从后端数据生成（如果没有后端数据，使用默认空数据）
  if (!dashboardData.value) {
    deviceWarnings.value = [];
    return;
  }

  // TODO: 如果后端提供了设备预警统计接口，可以调用
  // 目前使用模拟数据
  deviceWarnings.value = [];
}

// ==================== 时间范围处理 ====================
/**
 * 处理时间范围变化
 */
function handleTimeRangeChange() {
  // 重新加载数据
  loadStatistics();

  // 更新趋势图数据
  if (charts.value.trendChart) {
    const { xData, yData } = generateTimeData(timeRange.value);
    updateTrendChart(xData, yData);
  }
}

/**
 * 显示日期选择器
 */
function showDatePicker() {
  datePickerDialogVisible.value = true;
}

/**
 * 应用自定义日期范围
 */
function applyCustomDateRange() {
  if (customDateRange.value && customDateRange.value.length === 2) {
    datePickerDialogVisible.value = false;
    // 重新加载数据
    loadStatistics();
  }
}

/**
 * 生成时间范围数据
 */
function generateTimeData(range: string) {
  const now = new Date();
  let xData: string[] = [];
  let yData: number[] = [];

  if (range === "today") {
    // 今日24小时
    for (let i = 0; i < 24; i++) {
      xData.push(`${i}:00`);
      yData.push(Math.floor(Math.random() * 20));
    }
  } else if (range === "week") {
    // 本周7天
    const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      xData.push(weekDays[date.getDay()]);
      yData.push(Math.floor(Math.random() * 50));
    }
  } else if (range === "month") {
    // 本月30天
    for (let i = 1; i <= 30; i++) {
      xData.push(`${i}日`);
      yData.push(Math.floor(Math.random() * 100));
    }
  } else if (range === "custom") {
    // 自定义日期范围
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
/**
 * 初始化所有图表
 */
function initCharts() {
  nextTick(() => {
    initTrendChart();
    initWarningStatusChart();
    initWarningLevelChart();
    initTopWarningTypeChart();
  });
}

/**
 * 初始化预警趋势图
 */
function initTrendChart() {
  const chartDom = document.getElementById("trendChart");
  if (!chartDom) return;

  charts.value.trendChart = echarts.init(chartDom);
  const { xData, yData } = generateTimeData("today");
  updateTrendChart(xData, yData);
}

/**
 * 更新预警趋势图
 */
function updateTrendChart(xData: string[], yData: number[]) {
  if (!charts.value.trendChart) return;

  const option = {
    backgroundColor: "transparent",
    grid: {
      top: 40,
      bottom: 20,
      left: 0,
      right: 20,
      containLabel: true,
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "line",
        lineStyle: {
          color: "rgba(0, 255, 255, 0.3)",
        },
      },
      backgroundColor: "rgba(0, 19, 40, 0.8)",
      borderColor: "rgba(0, 255, 255, 0.3)",
      textStyle: {
        color: "#00FFFF",
      },
    },
    xAxis: {
      type: "category",
      data: xData,
      axisLine: {
        lineStyle: {
          color: "rgba(0, 255, 255, 0.3)",
        },
      },
      axisLabel: {
        color: "#7EAEE5",
        rotate: timeRange.value === "month" ? 45 : 0,
      },
    },
    yAxis: {
      type: "value",
      axisLine: {
        lineStyle: {
          color: "rgba(0, 255, 255, 0.3)",
        },
      },
      axisLabel: {
        color: "#7EAEE5",
      },
      splitLine: {
        lineStyle: {
          color: "rgba(0, 255, 255, 0.1)",
        },
      },
    },
    series: [
      {
        name: "预警数量",
        type: "line",
        data: yData,
        smooth: true,
        lineStyle: {
          color: "#00FFFF",
          width: 2,
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(0, 255, 255, 0.3)" },
            { offset: 1, color: "rgba(0, 255, 255, 0.05)" },
          ]),
        },
        itemStyle: {
          color: "#00FFFF",
        },
      },
    ],
  };

  charts.value.trendChart.setOption(option);
}

/**
 * 初始化预警状态图表
 */
function initWarningStatusChart() {
  const chartDom = document.getElementById("warningStatusChart");
  if (!chartDom) return;

  charts.value.warningStatusChart = echarts.init(chartDom);
  updateWarningStatusChart();
}

/**
 * 更新预警状态图表
 */
function updateWarningStatusChart() {
  if (!charts.value.warningStatusChart) return;

  // 使用后端数据
  const alertLevels = dashboardData.value?.alert_levels || [];

  // 将后端数据映射到状态分布
  const statusData = [
    {
      value: alertLevels.find((item: any) => item.level_name === "一般")?.count || 0,
      name: "待处理",
      count: alertLevels.find((item: any) => item.level_name === "一般")?.count || 0,
      itemStyle: { color: "#FF8746" },
    },
    {
      value: alertLevels.find((item: any) => item.level_name === "重要")?.count || 0,
      name: "处理中",
      count: alertLevels.find((item: any) => item.level_name === "重要")?.count || 0,
      itemStyle: { color: "#44FF9B" },
    },
    {
      value: alertLevels.find((item: any) => item.level_name === "紧急")?.count || 0,
      name: "已完成",
      count: alertLevels.find((item: any) => item.level_name === "紧急")?.count || 0,
      itemStyle: { color: "#00FFFF" },
    },
    {
      value: alertLevels.find((item: any) => item.level_name === "特急")?.count || 0,
      name: "已忽略",
      count: alertLevels.find((item: any) => item.level_name === "特急")?.count || 0,
      itemStyle: { color: "#ee6666" },
    },
  ];

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
      backgroundColor: "rgba(0, 19, 40, 0.8)",
      borderColor: "rgba(0, 255, 255, 0.3)",
      textStyle: {
        color: "#00FFFF",
      },
    },
    legend: {
      orient: "vertical",
      right: "0%",
      top: "center",
      textStyle: {
        color: "#7EAEE5",
      },
    },
    series: [
      {
        type: "pie",
        radius: ["50%", "70%"],
        center: ["30%", "50%"],
        label: { show: false },
        data: statusData,
      },
    ],
  };

  charts.value.warningStatusChart.setOption(option);
}

/**
 * 初始化预警等级图表
 */
function initWarningLevelChart() {
  const chartDom = document.getElementById("warningLevelChart");
  if (!chartDom) return;

  charts.value.warningLevelChart = echarts.init(chartDom);
  updateWarningLevelChart();
}

/**
 * 更新预警等级图表
 */
function updateWarningLevelChart() {
  if (!charts.value.warningLevelChart) return;

  // 使用后端数据
  const alertLevels = dashboardData.value?.alert_levels || [];

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      backgroundColor: "rgba(0, 19, 40, 0.8)",
      borderColor: "rgba(0, 255, 255, 0.3)",
      textStyle: {
        color: "#00FFFF",
      },
    },
    xAxis: {
      type: "category",
      data: alertLevels.map((item: any) => item.level_name),
      axisLine: {
        lineStyle: {
          color: "rgba(0, 255, 255, 0.3)",
        },
      },
      axisLabel: {
        color: "#7EAEE5",
      },
    },
    yAxis: {
      type: "value",
      axisLine: {
        lineStyle: {
          color: "rgba(0 255, 255, 0.3)",
        },
      },
      axisLabel: {
        color: "#7EAEE5",
      },
      splitLine: {
        lineStyle: {
          color: "rgba(0, 255, 255, 0.1)",
        },
      },
    },
    series: [
      {
        name: "预警数量",
        type: "bar",
        data: alertLevels.map((item: any) => ({
          value: item.count,
          itemStyle: { color: item.color },
        })),
        barWidth: "60%",
      },
    ],
  };

  charts.value.warningLevelChart.setOption(option);
}

/**
 * 初始化TOP10预警类型图表
 */
function initTopWarningTypeChart() {
  const chartDom = document.getElementById("topWarningTypeChart");
  if (!chartDom) return;

  charts.value.topWarningTypeChart = echarts.init(chartDom);
  updateTopWarningTypeChart();
}

/**
 * 更新TOP10预警类型图表
 */
function updateTopWarningTypeChart() {
  if (!charts.value.topWarningTypeChart) return;

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      backgroundColor: "rgba(0, 19, 40, 0.8)",
      borderColor: "rgba(0, 255, 255, 0.3)",
      textStyle: {
        color: "#00FFFF",
      },
      formatter: "{b}: {c}",
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      axisLine: {
        lineStyle: {
          color: "rgba(0, 255, 255, 0.3)",
        },
      },
      axisLabel: {
        color: "#7EAEE5",
      },
      splitLine: {
        lineStyle: {
          color: "rgba(0, 255, 255, 0.1)",
        },
      },
    },
    yAxis: {
      type: "category",
      data: deviceWarnings.value.map((item) => item.name),
      axisLine: {
        lineStyle: {
          color: "rgba(0, 255, 255, 0.3)",
        },
      },
      axisLabel: {
        color: "#7EAEE5",
      },
    },
    series: [
      {
        name: "预警数量",
        type: "bar",
        data: deviceWarnings.value.map((item) => ({
          value: item.count,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: "rgba(0, 255, 255, 0.8)" },
              { offset: 1, color: "rgba(0, 255, 255, 0.2)" },
            ]),
          },
        })),
        barWidth: "60%",
        label: {
          show: true,
          position: "right",
          color: "#7EAEE5",
          formatter: "{c}次",
        },
      },
    ],
  };

  charts.value.topWarningTypeChart.setOption(option);
}

/**
 * 更新所有图表
 */
function updateAllCharts() {
  // 状态图表
  updateWarningStatusChart();
  // 等级图表
  updateWarningLevelChart();
  // TOP10图表
  updateTopWarningTypeChart();
}

/**
 * 刷新数据
 */
function refreshData() {
  loadStatistics();
}

/**
 * 窗口大小变化处理
 */
function handleResize() {
  Object.values(charts.value).forEach((chart) => {
    if (chart) {
      chart.resize();
    }
  });
}

/**
 * 销毁图表
 */
function disposeCharts() {
  Object.values(charts.value).forEach((chart) => {
    if (chart) {
      chart.dispose();
    }
  });
}

// ==================== 生命周期 ====================
onMounted(() => {
  // 加载统计数据
  loadStatistics();

  // 初始化图表
  initCharts();

  // 监听窗口大小变化
  window.addEventListener("resize", handleResize);

  // 初始化CSS变量
  document.documentElement.style.setProperty("--panel-top-height", "35vh");
  document.documentElement.style.setProperty("--panel-bottom-height", "33vh");
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  disposeCharts();
});
</script>

<style scoped>
.statistics-analysis-container {
  width: 100%;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
}

/* 统计卡片 */
.summary-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.summary-card {
  flex: 1;
  background: linear-gradient(135deg, rgba(62, 119, 255, 0.2) 0%, rgba(58, 119, 246, 0.1) 100%);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.card-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.card-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card-icon.success {
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
}

.card-icon.warning {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.card-icon.processed {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.card-content {
  flex: 1;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  color: #00ffff;
  margin-bottom: 5px;
}

.card-label {
  font-size: 14px;
  color: #7eaee5;
}

/* 筛选区域 */
.filter-section {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(0, 19, 40, 0.3);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 8px;
}

/* 图表区域 */
.charts-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.chart-panel {
  background: rgba(0, 19, 40, 0.5);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 8px;
  padding: 15px;
}

.chart-panel.full-width {
  grid-column: 1 / -1;
}

.panel-header {
  margin-bottom: 15px;
}

.panel-title {
  font-size: 16px;
  font-weight: bold;
  color: #00ffff;
}

.chart-content {
  height: 300px;
}
</style>
