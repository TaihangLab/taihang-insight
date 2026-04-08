<script>
import * as echarts from "echarts";
import { alertAPI } from "../../service/VisionAIService.js";

export default {
  name: "StatisticsAnalysis",
  data() {
    return {
      statisticsData: {
        totalCount: 0,
        successRate: 0,
        processedCount: 0,
        pendingCount: 0,
      },

      timeRange: "today",
      customDateRange: [],
      datePickerDialogVisible: false,

      exportLoading: false,

      charts: {
        trendChart: null,
        warningStatusChart: null,
        warningLevelChart: null,
        topWarningTypeChart: null,
      },

      deviceWarnings: [],
      refreshing: false,
      loading: false,

      statusChartEmpty: true,
      levelChartEmpty: true,
      typeChartEmpty: true,
    };
  },
  mounted() {
    this.computePanelHeights();
    window.addEventListener("resize", this.handleResize);
    this.$nextTick(() => {
      this.initEmptyCharts();
      this.fetchStatistics();
    });
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.handleResize);
    this.disposeCharts();
  },
  watch: {},
  methods: {
    // ──────────────────────────── 时间范围计算 ──────────────────────────────

    /**
     * 根据当前 timeRange 计算 start_date, end_date, granularity
     */
    getTimeParams() {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const fmt = (d) =>
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

      switch (this.timeRange) {
        case "today":
          return { start_date: fmt(now), end_date: fmt(now), granularity: "hour" };

        case "week": {
          const start = new Date(now);
          start.setDate(now.getDate() - 6);
          return { start_date: fmt(start), end_date: fmt(now), granularity: "day" };
        }

        case "month": {
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          return { start_date: fmt(start), end_date: fmt(now), granularity: "day" };
        }

        case "year": {
          const start = new Date(now.getFullYear(), 0, 1);
          return { start_date: fmt(start), end_date: fmt(now), granularity: "month" };
        }

        case "custom":
          if (this.customDateRange && this.customDateRange.length === 2) {
            return {
              start_date: this.customDateRange[0],
              end_date: this.customDateRange[1],
              granularity: "day",
            };
          }
          return null;

        default:
          return null;
      }
    },

    // ──────────────────────────── 数据获取 ──────────────────────────────────

    async fetchStatistics() {
      const params = this.getTimeParams();
      if (!params) return;

      this.loading = true;
      try {
        const res = await alertAPI.getAlertStatistics(params);
        const stats = res.data && res.data.statistics ? res.data.statistics : null;
        if (!stats) return;

        // 更新顶部卡片
        const s = stats.summary || {};
        this.statisticsData = {
          totalCount: s.total_alerts || 0,
          successRate: s.processed_rate || 0,
          processedCount: s.processed_count || 0,
          pendingCount: s.pending_count || 0,
        };

        // 更新各图表
        this.renderTrendChart(stats.trend || []);
        this.renderStatusChart(stats.by_status || {});
        this.renderLevelChart(stats.by_level || {});
        this.renderTypeChart(stats.by_type || []);

        // 更新设备列表
        this.deviceWarnings = (stats.top_cameras || []).map((c) => ({
          name: c.name,
          count: c.count,
          percent: c.percent,
        }));
      } catch (e) {
        console.error("获取统计数据失败:", e);
        this.$message.error("获取统计数据失败，请稍后重试");
      } finally {
        this.loading = false;
      }
    },

    // ──────────────────────────── 图表初始化（空壳）────────────────────────

    initEmptyCharts() {
      this.initTrendChart([], []);
      this.statusChartEmpty = true;
      this.levelChartEmpty = true;
      this.typeChartEmpty = true;
    },

    disposeCharts() {
      Object.keys(this.charts).forEach((key) => {
        if (this.charts[key]) {
          this.charts[key].dispose();
          this.charts[key] = null;
        }
      });
    },

    // 根据视口高度动态计算面板高度，确保页面在任意窗口尺寸下铺满屏幕
    computePanelHeights() {
      // 不再硬算，由 CSS flex 自动分配
    },

    handleResize() {
      this.$nextTick(() => {
        Object.keys(this.charts).forEach((key) => {
          if (this.charts[key]) this.charts[key].resize();
        });
      });
    },

    // ──────────────────────────── 趋势折线图 ────────────────────────────────

    initTrendChart(xData, yData) {
      const el = document.getElementById("trendChart");
      if (!el) return;
      if (!this.charts.trendChart) {
        this.charts.trendChart = echarts.init(el);
      }
      const needRotate =
        this.timeRange === "month" ||
        (this.timeRange === "custom" && xData.length > 10);
      const option = {
        backgroundColor: "transparent",
        grid: { top: 40, bottom: 20, left: 10, right: 20, containLabel: true },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "line", lineStyle: { color: "rgba(0,255,255,0.3)", width: 1 } },
          backgroundColor: "rgba(0,19,40,0.8)",
          borderColor: "rgba(0,255,255,0.3)",
          textStyle: { color: "#00FFFF" },
          formatter: (params) => {
            const p = params[0];
            return `${p.name}<br/>预警数量: <b>${p.value}</b>`;
          },
        },
        xAxis: {
          type: "category",
          data: xData,
          axisLine: { lineStyle: { color: "rgba(0,255,255,0.3)" } },
          axisLabel: {
            color: "#7EAEE5",
            rotate: needRotate ? 45 : 0,
            interval: needRotate ? "auto" : xData.length > 20 ? "auto" : 0,
          },
          axisTick: { show: false },
          splitLine: { show: false },
        },
        yAxis: {
          type: "value",
          name: "预警数量",
          min: 0,
          minInterval: 1,
          nameTextStyle: { color: "#7EAEE5", padding: [0, 0, 0, 10] },
          axisLine: { show: false },
          axisLabel: { color: "#7EAEE5" },
          splitLine: { lineStyle: { color: "rgba(35,88,148,0.3)", type: "dashed" } },
        },
        series: [
          {
            name: "预警数量",
            data: yData,
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 8,
            lineStyle: {
              width: 3,
              color: { type: "linear", x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: "#00FFFF" }, { offset: 1, color: "#207FFF" }] },
            },
            itemStyle: { color: "#00FFFF", borderColor: "rgba(0,255,255,0.3)", borderWidth: 6 },
            areaStyle: {
              color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "rgba(0,255,255,0.3)" }, { offset: 1, color: "rgba(0,255,255,0)" }] },
            },
          },
        ],
      };
      this.charts.trendChart.setOption(option, true);
    },

    renderTrendChart(trend) {
      const xData = trend.map((t) => t.label);
      const yData = trend.map((t) => t.count);
      this.initTrendChart(xData, yData);
    },

    // ──────────────────────────── 预警状态饼图 ──────────────────────────────

    /**
     * statusMap: { 待处理: N, 处理中: N, 已处理: N, 已归档: N, 误报: N }
     * 前端合并展示为 4 项（已归档+误报 → 已忽略）
     */
    initWarningStatusChart(pieData) {
      const el = document.getElementById("warningStatusChart");
      if (!el) return;
      if (!this.charts.warningStatusChart) {
        this.charts.warningStatusChart = echarts.init(el);
      }
      this.charts.warningStatusChart.setOption({
        backgroundColor: "transparent",
        tooltip: {
          trigger: "item",
          formatter: (p) => `${p.name}<br/>数量: <b>${p.data.count}</b>次 (${p.percent.toFixed(1)}%)`,
          backgroundColor: "rgba(0,19,40,0.8)",
          borderColor: "rgba(0,255,255,0.3)",
          textStyle: { color: "#00FFFF" },
        },
        legend: {
          orient: "vertical",
          right: "0%",
          top: "center",
          itemWidth: 10,
          itemHeight: 10,
          textStyle: { color: "#7EAEE5" },
          formatter: (name) => {
            const item = pieData.find((d) => d.name === name);
            if (!item) return name;
            return `${name}  ${item.count}次`;
          },
        },
        series: [{
          type: "pie",
          radius: ["50%", "70%"],
          center: ["30%", "50%"],
          label: { show: false },
          data: pieData,
        }],
      }, true);
    },

    renderStatusChart(byStatus) {
      const colorMap = {
        待处理: "#FF8746",
        处理中: "#44FF9B",
        已处理: "#00FFFF",
        已归档: "#6677AA",
        误报: "#ee6666",
      };
      const pieData = Object.entries(byStatus)
        .filter(([, cnt]) => cnt >= 0)
        .map(([name, cnt]) => ({
          name,
          value: cnt,
          count: cnt,
          itemStyle: { color: colorMap[name] || "#999" },
        }));
      this.statusChartEmpty = pieData.length === 0 || pieData.every((d) => d.count === 0);
      if (this.statusChartEmpty) return;
      this.$nextTick(() => this.initWarningStatusChart(pieData));
    },

    // ──────────────────────────── 预警等级饼图 ──────────────────────────────

    initWarningLevelChart(pieData) {
      const el = document.getElementById("warningLevelChart");
      if (!el) return;
      if (!this.charts.warningLevelChart) {
        this.charts.warningLevelChart = echarts.init(el);
      }
      this.charts.warningLevelChart.setOption({
        backgroundColor: "transparent",
        tooltip: {
          trigger: "item",
          formatter: (p) => `${p.name}<br/>数量: <b>${p.data.count}</b>次 (${p.percent.toFixed(1)}%)`,
          backgroundColor: "rgba(0,19,40,0.8)",
          borderColor: "rgba(0,255,255,0.3)",
          textStyle: { color: "#00FFFF" },
        },
        legend: {
          orient: "vertical",
          right: "0%",
          top: "center",
          itemWidth: 10,
          itemHeight: 10,
          textStyle: { color: "#7EAEE5" },
          formatter: (name) => {
            const item = pieData.find((d) => d.name === name);
            if (!item) return name;
            return `${name}  ${item.count}次`;
          },
        },
        series: [{
          type: "pie",
          radius: "60%",
          center: ["30%", "50%"],
          label: { show: false },
          data: pieData,
        }],
      }, true);
    },

    renderLevelChart(byLevel) {
      const colorMap = {
        一级预警: "#FF4D4F",
        二级预警: "#FF8746",
        三级预警: "#44FF9B",
        四级预警: "#00C5FF",
      };
      const pieData = Object.entries(byLevel).map(([name, cnt]) => ({
        name,
        value: cnt,
        count: cnt,
        itemStyle: { color: colorMap[name] || "#999" },
      }));
      this.levelChartEmpty = pieData.length === 0 || pieData.every((d) => d.count === 0);
      if (this.levelChartEmpty) return;
      this.$nextTick(() => this.initWarningLevelChart(pieData));
    },

    // ──────────────────────────── 预警类型横向柱状图 ─────────────────────────

    initTopWarningTypeChart(categories, counts) {
      const el = document.getElementById("topWarningTypeChart");
      if (!el) return;
      if (!this.charts.topWarningTypeChart) {
        this.charts.topWarningTypeChart = echarts.init(el);
      }
      this.charts.topWarningTypeChart.setOption({
        backgroundColor: "transparent",
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          backgroundColor: "rgba(0,19,40,0.8)",
          borderColor: "rgba(0,255,255,0.3)",
          textStyle: { color: "#00FFFF" },
          formatter: (params) => {
            const p = params[0];
            return `${p.name}<br/>预警数: <b>${p.value}</b>`;
          },
        },
        grid: { left: "3%", right: "4%", bottom: "3%", top: "10px", containLabel: true },
        xAxis: {
          type: "value",
          min: 0,
          minInterval: 1,
          axisTick: { show: false },
          axisLine: { show: false },
          axisLabel: { color: "#7EAEE5" },
          splitLine: { lineStyle: { color: "rgba(35,88,148,0.3)", type: "dashed" } },
        },
        yAxis: {
          type: "category",
          data: categories,
          axisTick: { show: false },
          axisLine: { lineStyle: { color: "rgba(0,255,255,0.3)" } },
          axisLabel: { color: "#7EAEE5" },
        },
        series: [{
          name: "预警数",
          type: "bar",
          data: counts,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: "#00FFFF" },
              { offset: 1, color: "#207FFF" },
            ]),
          },
          barWidth: "60%",
          barMinHeight: 2,
        }],
      }, true);
    },

    renderTypeChart(byType) {
      const categories = byType.map((t) => t.name);
      const counts = byType.map((t) => t.count);
      this.typeChartEmpty = counts.length === 0 || counts.every((v) => v === 0);
      if (this.typeChartEmpty) return;
      this.$nextTick(() => this.initTopWarningTypeChart(categories, counts));
    },

    // ──────────────────────────── 交互处理 ──────────────────────────────────

    handleTimeRangeChange(value) {
      this.timeRange = value;
      if (value === "custom") {
        this.datePickerDialogVisible = true;
      } else {
        this.fetchStatistics();
      }
    },

    onCustomClick() {
      if (this.timeRange === "custom") {
        this.datePickerDialogVisible = true;
      }
    },

    handleCustomDateChange() {
      if (this.customDateRange && this.customDateRange.length === 2) {
        this.datePickerDialogVisible = false;
        this.fetchStatistics();
      }
    },

    cancelDatePicker() {
      this.datePickerDialogVisible = false;
      if (!this.customDateRange || this.customDateRange.length !== 2) {
        this.timeRange = "today";
      }
    },

    async refreshData() {
      if (this.refreshing) return;
      this.refreshing = true;
      const loadingInstance = this.$loading({
        lock: true,
        text: "正在刷新数据...",
        spinner: "el-icon-loading",
        background: "rgba(0,0,0,0.7)",
      });
      try {
        await this.fetchStatistics();
        this.$message.success("数据刷新成功");
      } finally {
        loadingInstance.close();
        this.refreshing = false;
      }
    },

    exportData() {
      if (!this.deviceWarnings.length) {
        this.$message.warning("暂无设备数据可导出");
        return;
      }
      this.exportLoading = true;
      const headers = ["设备名称", "预警数量", "占比(%)"];
      const rows = this.deviceWarnings.map((d) => [d.name, d.count, d.percent]);
      let csv = headers.join(",") + "\n";
      rows.forEach((r) => { csv += r.join(",") + "\n"; });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.setAttribute("href", URL.createObjectURL(blob));
      link.setAttribute("download", `预警统计数据_${Date.now()}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.exportLoading = false;
      this.$message.success(`数据已导出`);
    },

    getTotalWarnings() {
      return this.statisticsData.totalCount;
    },
  },
};
</script>

<template>
  <div class="visual-statistics">
    <!-- 顶部标题栏和时间选择器 -->
    <div class="header-bar">
      <div class="time-filter">
        <el-radio-group
          v-model="timeRange"
          size="small"
          @change="handleTimeRangeChange"
        >
          <el-radio-button label="today">日</el-radio-button>
          <el-radio-button label="week">周</el-radio-button>
          <el-radio-button label="month">月</el-radio-button>
          <el-radio-button label="year">年</el-radio-button>
          <el-radio-button label="custom" @click.native="onCustomClick">自定义</el-radio-button>
        </el-radio-group>
      </div>

      <div class="page-title">
        <span>太行视觉AI预警统计分析</span>
      </div>

      <div class="action-buttons">
        <el-button
          type="primary"
          size="small"
          icon="el-icon-download"
          @click="exportData"
          >导出</el-button
        >
        <el-button size="small" icon="el-icon-refresh" @click="refreshData"
          >刷新</el-button
        >
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
        :picker-options="{
          disabledDate(time) {
            return time.getTime() > Date.now();
          },
        }"
        popper-class="date-picker-dropdown"
      >
      </el-date-picker>
      <span slot="footer" class="dialog-footer">
        <el-button @click="cancelDatePicker" size="small">取 消</el-button>
        <el-button type="primary" @click="handleCustomDateChange" size="small"
          >确 定</el-button
        >
      </span>
    </el-dialog>

    <!-- 顶部统计数据卡片 -->
    <div class="statistics-header">
      <div class="stat-card">
        <div class="stat-icon alert-icon">
          <i class="el-icon-warning"></i>
        </div>
        <div class="stat-info">
          <div class="stat-title">预警总数</div>
          <div class="stat-value">
            {{ statisticsData.totalCount }}<span class="unit">个</span>
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon rate-icon">
          <i class="el-icon-data-analysis"></i>
        </div>
        <div class="stat-info">
          <div class="stat-title">预警处理率</div>
          <div class="stat-value">
            {{ statisticsData.successRate }}<span class="unit">%</span>
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon process-icon">
          <i class="el-icon-finished"></i>
        </div>
        <div class="stat-info">
          <div class="stat-title">已处理预警数</div>
          <div class="stat-value">
            {{ statisticsData.processedCount }}<span class="unit">个</span>
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon pending-icon">
          <i class="el-icon-bell"></i>
        </div>
        <div class="stat-info">
          <div class="stat-title">未处理预警数</div>
          <div class="stat-value">
            {{ statisticsData.pendingCount }}<span class="unit">个</span>
          </div>
        </div>
      </div>
    </div>

    <div class="main-content">
      <!-- 上方面板：预警趋势和预警类型TOP5 -->
      <el-row :gutter="20">
        <!-- 左侧 - 预警趋势图表 -->
        <el-col :span="12">
          <div class="panel-box panel-equal-height">
            <div class="panel-title">预警趋势</div>
            <div id="trendChart" class="trend-chart"></div>
          </div>
        </el-col>

        <!-- 右侧 - 预警类型TOP5 -->
        <el-col :span="12">
          <div class="panel-box panel-equal-height">
            <div class="panel-title">预警类型TOP5</div>
            <div v-show="!typeChartEmpty" id="topWarningTypeChart" class="top-chart"></div>
            <div v-show="typeChartEmpty" class="empty-data-placeholder">
              <i class="el-icon-s-data"></i>
              <span>暂无类型数据</span>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 下方面板：预警状态、预警等级和设备预警数量TOP10 -->
      <el-row :gutter="20" class="bottom-section">
        <!-- 左侧 - 预警状态饼图 -->
        <el-col :span="8">
          <div class="panel-box panel-bottom-equal-height">
            <div class="panel-title">预警状态</div>
            <div v-show="!statusChartEmpty" id="warningStatusChart" class="status-chart"></div>
            <div v-show="statusChartEmpty" class="empty-data-placeholder">
              <i class="el-icon-finished"></i>
              <span>暂无状态数据</span>
            </div>
          </div>
        </el-col>

        <!-- 中间 - 预警等级饼图 -->
        <el-col :span="8">
          <div class="panel-box panel-bottom-equal-height">
            <div class="panel-title">预警等级</div>
            <div v-show="!levelChartEmpty" id="warningLevelChart" class="level-chart"></div>
            <div v-show="levelChartEmpty" class="empty-data-placeholder">
              <i class="el-icon-pie-chart"></i>
              <span>暂无等级数据</span>
            </div>
          </div>
        </el-col>

        <!-- 右侧 - 设备预警数量TOP10 -->
        <el-col :span="8">
          <div class="panel-box panel-bottom-equal-height">
            <div class="panel-title">设备预警数量TOP10</div>
            <div class="device-top-list">
              <template v-if="deviceWarnings.length > 0">
                <div
                  v-for="(device, index) in deviceWarnings"
                  :key="index"
                  class="device-item"
                >
                  <span class="device-rank">{{ index + 1 }}</span>
                  <span class="device-name">{{ device.name }}</span>
                  <div class="device-progress">
                    <div
                      class="progress-bar"
                      :style="{ width: device.percent + '%' }"
                    ></div>
                  </div>
                  <span class="device-count">{{ device.count }}</span>
                </div>
              </template>
              <div v-else class="empty-data-placeholder">
                <i class="el-icon-video-camera-solid"></i>
                <span>暂无设备数据</span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style scoped>
.visual-statistics {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #001529 0%, #000b18 100%);
  color: #fff;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部标题栏 */
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #001529;
  padding: 12px 20px;
  position: relative;
  border-bottom: 1px solid #002140;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.page-title {
  flex: 1;
  text-align: center;
  display: flex;
  justify-content: center;
}

.page-title span {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
  letter-spacing: 1px;
  position: relative;
  padding: 0 10px;
}

.page-title span::before,
.page-title span::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 60px;
  height: 2px;
  background: linear-gradient(
    90deg,
    rgba(0, 255, 255, 0) 0%,
    #00ffff 50%,
    rgba(0, 255, 255, 0) 100%
  );
  transform: translateY(-50%);
}

.page-title span::before {
  right: 100%;
}

.page-title span::after {
  left: 100%;
}

/* 时间筛选器和操作按钮 */
.time-filter {
  display: flex;
  justify-content: flex-start;
  width: 330px;
  align-items: center;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  width: 330px;
}

.time-filter >>> .el-radio-button__inner {
  background-color: rgba(6, 30, 93, 0.5) !important;
  border-color: rgba(0, 255, 255, 0.3) !important;
  color: #7eaee5 !important;
}

.time-filter
  >>> .el-radio-button__orig-radio:checked
  + .el-radio-button__inner {
  background-color: rgba(0, 255, 255, 0.2) !important;
  border-color: #00ffff !important;
  color: #00ffff !important;
  box-shadow: -1px 0 0 0 #00ffff !important;
}

.action-buttons >>> .el-button--primary {
  background-color: rgba(0, 255, 255, 0.2) !important;
  border-color: #00ffff !important;
  color: #00ffff !important;
}

.action-buttons >>> .el-button {
  background-color: rgba(6, 30, 93, 0.5) !important;
  border-color: rgba(0, 255, 255, 0.3) !important;
  color: #7eaee5 !important;
}

.action-buttons >>> .el-button:hover {
  background-color: rgba(0, 255, 255, 0.1) !important;
  border-color: #00ffff !important;
  color: #00ffff !important;
}

/* 自定义对话框样式 */
.visual-statistics >>> .custom-dialog {
  background: linear-gradient(
    180deg,
    rgba(6, 30, 93, 0.95) 0%,
    rgba(4, 20, 63, 0.98) 100%
  );
  border: 1px solid rgba(0, 255, 255, 0.3);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.7);
  border-radius: 4px;
}

.visual-statistics >>> .custom-dialog .el-dialog__header {
  background: rgba(6, 30, 93, 0.9);
  border-bottom: 1px solid rgba(0, 255, 255, 0.2);
  padding: 12px 20px;
}

.visual-statistics >>> .custom-dialog .el-dialog__title {
  color: #00ffff;
  font-size: 16px;
  font-weight: bold;
}

.visual-statistics >>> .custom-dialog .el-dialog__headerbtn .el-dialog__close {
  color: #7eaee5;
}

.visual-statistics
  >>> .custom-dialog
  .el-dialog__headerbtn:hover
  .el-dialog__close {
  color: #00ffff;
}

.visual-statistics >>> .custom-dialog .el-dialog__body {
  background: transparent;
  padding: 20px;
  color: #7eaee5;
}

.visual-statistics >>> .custom-dialog .el-dialog__footer {
  background: rgba(6, 30, 93, 0.9);
  border-top: 1px solid rgba(0, 255, 255, 0.2);
  padding: 10px 20px;
}

/* 日期选择器组件样式 */
.visual-statistics >>> .el-range-editor.el-input__inner {
  background-color: rgba(0, 30, 60, 0.3) !important;
  border: 1px solid rgba(0, 255, 255, 0.3) !important;
  color: #7eaee5 !important;
}

.visual-statistics >>> .el-range-editor.el-input__inner:hover,
.visual-statistics >>> .el-range-editor.el-input__inner:focus {
  border-color: #00ffff !important;
}

.visual-statistics >>> .el-range-editor .el-range-input {
  background-color: transparent !important;
  color: #7eaee5 !important;
}

.visual-statistics >>> .el-range-editor .el-range-separator {
  color: #7eaee5 !important;
}

.visual-statistics >>> .el-range-editor .el-range__icon,
.visual-statistics >>> .el-range-editor .el-range__close-icon {
  color: #00ffff !important;
}

/* 日期选择面板样式 */
.visual-statistics >>> .date-picker-dropdown.el-picker-panel {
  background: linear-gradient(
    180deg,
    rgba(6, 30, 93, 0.98) 0%,
    rgba(4, 20, 63, 0.98) 100%
  ) !important;
  border: 1px solid rgba(0, 255, 255, 0.4) !important;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.8) !important;
  border-radius: 4px !important;
}

.visual-statistics >>> .date-picker-dropdown .el-date-picker__header {
  margin: 8px 12px !important;
}

.visual-statistics >>> .date-picker-dropdown .el-date-picker__header-label {
  color: #00ffff !important;
  font-weight: bold !important;
}

.visual-statistics >>> .date-picker-dropdown .el-picker-panel__icon-btn {
  color: #7eaee5 !important;
}

.visual-statistics >>> .date-picker-dropdown .el-picker-panel__icon-btn:hover {
  color: #00ffff !important;
}

.visual-statistics >>> .date-picker-dropdown .el-date-table {
  margin: 5px 0 !important;
}

.visual-statistics >>> .date-picker-dropdown .el-date-table th {
  color: #00ffff !important;
  font-weight: 600 !important;
  border-bottom-color: rgba(0, 255, 255, 0.2) !important;
  padding: 5px 0 !important;
}

.visual-statistics >>> .date-picker-dropdown .el-date-table td {
  padding: 2px 0 !important;
}

.visual-statistics >>> .date-picker-dropdown .el-date-table td div {
  padding: 0 !important;
}

.visual-statistics >>> .date-picker-dropdown .el-date-table td span {
  width: 28px !important;
  height: 28px !important;
  line-height: 28px !important;
  border-radius: 50% !important;
}

.visual-statistics >>> .date-picker-dropdown .el-date-table td.available span {
  color: #7eaee5 !important;
}

.visual-statistics
  >>> .date-picker-dropdown
  .el-date-table
  td.available:hover
  span {
  background-color: rgba(0, 255, 255, 0.15) !important;
  color: #fff !important;
}

.visual-statistics >>> .date-picker-dropdown .el-date-table td.today span {
  color: #00ffff !important;
  border: 1px solid rgba(0, 255, 255, 0.5) !important;
}

.visual-statistics
  >>> .date-picker-dropdown
  .el-date-table
  td.current:not(.disabled)
  span {
  background: linear-gradient(
    135deg,
    rgba(0, 255, 255, 0.3) 0%,
    rgba(0, 127, 255, 0.4) 100%
  ) !important;
  color: #ffffff !important;
}

.visual-statistics >>> .date-picker-dropdown .el-date-range-picker__header {
  margin-bottom: 8px !important;
  color: #00ffff !important;
  font-weight: bold !important;
}

.visual-statistics >>> .date-picker-dropdown .el-date-range-picker__content {
  padding: 5px 0 !important;
}

.visual-statistics
  >>> .date-picker-dropdown
  .el-date-range-picker__content.is-left {
  border-right: 1px solid rgba(0, 255, 255, 0.2) !important;
}

.visual-statistics >>> .date-picker-dropdown .el-picker-panel__footer {
  background-color: rgba(6, 30, 93, 0.9) !important;
  border-top: 1px solid rgba(0, 255, 255, 0.2) !important;
  padding: 8px 15px !important;
}

.visual-statistics
  >>> .date-picker-dropdown
  .el-picker-panel__footer
  .el-button--default {
  background-color: rgba(6, 30, 93, 0.5) !important;
  border-color: rgba(0, 255, 255, 0.3) !important;
  color: #7eaee5 !important;
}

.visual-statistics
  >>> .date-picker-dropdown
  .el-picker-panel__footer
  .el-button--default:hover {
  background-color: rgba(0, 255, 255, 0.1) !important;
  border-color: #00ffff !important;
  color: #00ffff !important;
}

.visual-statistics
  >>> .date-picker-dropdown
  .el-picker-panel__footer
  .el-button--primary {
  background-color: rgba(0, 255, 255, 0.2) !important;
  border-color: #00ffff !important;
  color: #00ffff !important;
}

/* 面板盒子样式 */
.panel-box {
  background: linear-gradient(
    180deg,
    rgba(6, 30, 93, 0.8) 0%,
    rgba(4, 20, 63, 0.9) 100%
  );
  border: 1px solid rgba(35, 88, 148, 0.5);
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 12px;
  position: relative;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.panel-box:hover {
  border-color: rgba(0, 255, 255, 0.6);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
}

.panel-title {
  color: #00ffff;
  font-size: 16px;
  margin-bottom: 15px;
  padding-left: 10px;
  border-left: 3px solid #00ffff;
  text-align: left;
}

.panel-equal-height {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}

.panel-bottom-equal-height {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}

/* 顶部统计卡片 */
.statistics-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 16px;
  flex-shrink: 0;
}

.stat-card {
  flex: 1;
  background: linear-gradient(
    180deg,
    rgba(6, 30, 93, 0.8) 0%,
    rgba(4, 20, 63, 0.9) 100%
  );
  border: 1px solid rgba(35, 88, 148, 0.5);
  border-radius: 4px;
  padding: 15px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  border-color: rgba(0, 255, 255, 0.6);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.3);
}

.stat-icon {
  width: 50px;
  height: 50px;
  margin-right: 15px;
  background: rgba(0, 30, 60, 0.5);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.alert-icon {
  color: #ff8746;
}

.rate-icon {
  color: #00ffff;
}

.process-icon {
  color: #44ff9b;
}

.pending-icon {
  color: #ff4d4f;
}

.stat-info {
  flex: 1;
}

.stat-title {
  color: #7eaee5;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
}

.stat-value .unit {
  font-size: 14px;
  color: #7eaee5;
  margin-left: 2px;
}

/* 主内容区域：flex 伸展填满剩余空间 */
.main-content {
  padding: 0;
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 两行 el-row 各占一半 */
.main-content > .el-row {
  flex: 1 1 0;
  min-height: 0;
}

/* el-col 也要撑满行高 */
.main-content > .el-row > .el-col {
  height: 100%;
}

/* panel-box 在 flex 行内撑满 */
.main-content .panel-box {
  height: 100%;
  margin-bottom: 0;
}

/* 图表样式 */
.trend-chart,
.status-chart,
.level-chart,
.top-chart {
  height: calc(100% - 20px);
  width: 100%;
  position: relative;
  flex: 1;
}

/* 设备TOP10列表 */
.device-top-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.device-top-list::-webkit-scrollbar {
  width: 0;
  display: none; /* Chrome, Safari and Opera */
}

.device-top-list.no-scroll {
  overflow-y: auto;
}

.device-item {
  padding: 10px 16px;
  border-bottom: 1px solid rgba(35, 88, 148, 0.3);
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.device-item:hover {
  background: rgba(0, 255, 255, 0.05);
}

.device-rank {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  border-radius: 50%;
  background: rgba(0, 255, 255, 0.1);
  color: #00ffff;
  font-size: 12px;
  font-weight: bold;
}

.device-name {
  font-size: 14px;
  color: #7eaee5;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.device-progress {
  width: 120px;
  height: 8px;
  background: rgba(35, 88, 148, 0.3);
  border-radius: 4px;
  margin: 0 12px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #00ffff 0%, #207fff 100%);
}

.device-count {
  width: 40px;
  font-size: 14px;
  color: #00ffff;
  font-weight: bold;
  text-align: right;
}

/* 底部分区 */
.bottom-section {
  margin-top: 0 !important;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .header-bar {
    flex-direction: column;
    align-items: center;
    gap: 15px;
    padding: 15px 10px;
  }

  .page-title {
    order: -1;
    margin-bottom: 10px;
  }

  .time-filter,
  .action-buttons {
    width: 100%;
    justify-content: center;
  }

  .time-filter {
    flex-wrap: wrap;
  }

  .statistics-header {
    flex-wrap: wrap;
  }

  .stat-card {
    flex: 1 1 calc(50% - 20px);
  }
}

@media (max-width: 768px) {
  .statistics-header {
    flex-direction: column;
  }

  .stat-card {
    width: 100%;
  }

  .panel-equal-height,
  .panel-bottom-equal-height {
    height: auto;
    min-height: 300px;
  }

  .trend-chart,
  .status-chart,
  .level-chart,
  .top-chart {
    height: 300px;
  }
}

/* 添加媒体查询确保在任何屏幕尺寸下内容都能充满整个宽度 */
@media (min-width: 1200px) {
  .visual-statistics {
    padding: 16px 0;
  }

  .header-bar,
  .statistics-header,
  .main-content {
    padding-left: 16px;
    padding-right: 16px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
}

/* 自定义对话框按钮样式 */
.visual-statistics >>> .custom-dialog .el-button--primary {
  background-color: rgba(0, 255, 255, 0.2) !important;
  border-color: #00ffff !important;
  color: #00ffff !important;
}

.visual-statistics >>> .custom-dialog .el-button {
  background-color: rgba(6, 30, 93, 0.5) !important;
  border-color: rgba(0, 255, 255, 0.3) !important;
  color: #7eaee5 !important;
}

.visual-statistics >>> .custom-dialog .el-button:hover {
  background-color: rgba(0, 255, 255, 0.1) !important;
  border-color: #00ffff !important;
  color: #00ffff !important;
}

.visual-statistics >>> .date-picker-dropdown .el-date-table td.next-month span,
.visual-statistics >>> .date-picker-dropdown .el-date-table td.prev-month span {
  color: rgba(126, 174, 229, 0.2) !important;
  background: transparent !important;
}

.visual-statistics >>> .date-picker-dropdown .el-date-table td.in-range div {
  background: linear-gradient(
    90deg,
    rgba(0, 255, 255, 0.05) 0%,
    rgba(0, 127, 255, 0.1) 100%
  ) !important;
}

.visual-statistics >>> .date-picker-dropdown .el-date-table td.start-date span,
.visual-statistics >>> .date-picker-dropdown .el-date-table td.end-date span {
  background: linear-gradient(
    90deg,
    rgba(0, 255, 255, 0.3) 0%,
    rgba(0, 127, 255, 0.5) 100%
  ) !important;
  color: #ffffff !important;
  font-weight: bold !important;
}

.visual-statistics
  >>> .date-picker-dropdown
  .el-date-table
  td.disabled
  div
  span {
  color: rgba(126, 174, 229, 0.2) !important;
  background: transparent !important;
}

.visual-statistics >>> .date-picker-dropdown .el-month-table td .cell {
  color: #7eaee5 !important;
}

.visual-statistics >>> .date-picker-dropdown .el-month-table td.current .cell {
  color: #00ffff !important;
  background-color: rgba(0, 255, 255, 0.2) !important;
}

.visual-statistics >>> .date-picker-dropdown .el-year-table td .cell {
  color: #7eaee5 !important;
}

.visual-statistics >>> .date-picker-dropdown .el-year-table td.current .cell {
  color: #00ffff !important;
  background-color: rgba(0, 255, 255, 0.2) !important;
}

/* 解决选择时间界面被覆盖的问题 */
::v-deep .date-picker-dropdown {
  position: absolute !important;
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
</style>
