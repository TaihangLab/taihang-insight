<template>
  <div class="dashboard-card resource-statistics">
    <div class="card-header">
      <div class="title">资源统计</div>
    </div>
    <div class="card-content">
      <div class="server-info">
        <div class="server-type">
          <i class="el-icon-s-platform server-icon"></i>
          <span>Marster: 1个</span>
        </div>
        <div class="server-type">
          <i class="el-icon-s-grid server-icon"></i>
          <span>Node: 10个</span>
        </div>
      </div>

      <!-- 添加资源标签区域 -->
      <div class="resource-labels">
        <div class="resource-label">CPU使用率</div>
        <div class="resource-label">磁盘使用率</div>
        <div class="resource-label">内存使用率</div>
        <div class="resource-label">显存使用率</div>
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
          <div class="chart-title">CPU</div>
        </div>
        <div class="chart-item">
          <div class="chart-container">
            <div class="percentage-ring disk"
              :style="{ background: `conic-gradient(#ff9c38 ${memoryUsage * 3.6}deg, transparent 0deg)` }"></div>
            <div class="inner-circle">
              <div class="liquid-container disk">
                <div class="liquid-wave"></div>
              </div>
            </div>
            <div class="percentage-text disk">{{ memoryUsage }}<span class="percentage-symbol">%</span></div>
          </div>
          <div class="chart-title">磁盘</div>
        </div>
        <div class="chart-item">
          <div class="chart-container">
            <div class="percentage-ring memory"
              :style="{ background: `conic-gradient(#29de9c ${diskUsage * 3.6}deg, transparent 0deg)` }"></div>
            <div class="inner-circle">
              <div class="liquid-container memory">
                <div class="liquid-wave"></div>
              </div>
            </div>
            <div class="percentage-text memory">{{ diskUsage }}<span class="percentage-symbol">%</span></div>
          </div>
          <div class="chart-title">内存</div>
        </div>
        <div class="chart-item">
          <div class="chart-container">
            <div class="percentage-ring gpu"
              :style="{ background: `conic-gradient(#ff5a5a ${networkUsage * 3.6}deg, transparent 0deg)` }"></div>
            <div class="inner-circle">
              <div class="liquid-container gpu">
                <div class="liquid-wave"></div>
              </div>
            </div>
            <div class="percentage-text gpu">{{ networkUsage }}<span class="percentage-symbol">%</span></div>
          </div>
          <div class="chart-title">显存</div>
        </div>
      </div>

      <div class="resource-details-container">
        <div class="expanded-header">
          <div class="resource-detail-title">资源详情</div>
          <div class="resource-time">更新时间: {{ currentTime }}</div>
        </div>
        <div class="resource-details">
          <div class="detail-group">
            <div class="detail-item">
              <div class="detail-label">CPU平均温度</div>
              <div class="detail-value">46.5°C</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">CPU峰值温度</div>
              <div class="detail-value">68.2°C</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">CPU核心数</div>
              <div class="detail-value">32</div>
            </div>
          </div>
          <div class="detail-group">
            <div class="detail-item">
              <div class="detail-label">内存总量</div>
              <div class="detail-value">64GB</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">已用内存</div>
              <div class="detail-value">29.2GB</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">内存频率</div>
              <div class="detail-value">3200MHz</div>
            </div>
          </div>
          <div class="detail-group">
            <div class="detail-item">
              <div class="detail-label">存储总量</div>
              <div class="detail-value">2TB</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">已用存储</div>
              <div class="detail-value">1.2TB</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">存储类型</div>
              <div class="detail-value">NVMe SSD</div>
            </div>
          </div>
          <div class="detail-group">
            <div class="detail-item">
              <div class="detail-label">GPU型号</div>
              <div class="detail-value">RTX 3090</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">显存总量</div>
              <div class="detail-value">24GB</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">温度</div>
              <div class="detail-value">72.5°C</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ResourceStatistics',
  props: {
    cpuUsage: {
      type: Number,
      default: 0
    },
    memoryUsage: {
      type: Number,
      default: 0
    },
    diskUsage: {
      type: Number,
      default: 0
    },
    networkUsage: {
      type: Number,
      default: 0
    },
    currentTime: {
      type: String,
      default: ''
    }
  }
}
</script>

<style scoped>
/* 这里应该复制原文件中的相关CSS样式 */
.dashboard-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  color: #fff;
}

.card-header {
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card-content {
  padding: 24px;
}

.server-info {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.server-type {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  opacity: 0.9;
}

.server-icon {
  font-size: 20px;
  color: #3b82f6;
}

.resource-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.resource-label {
  font-size: 12px;
  opacity: 0.7;
  text-align: center;
}

.resource-charts {
  display: flex;
  justify-content: space-between;
  margin-bottom: 32px;
}

.chart-item {
  text-align: center;
  flex: 1;
  margin: 0 8px;
}

.chart-container {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 12px;
}

.percentage-ring {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cpu {
  background: conic-gradient(#3eaef9 0deg, transparent 0deg);
}

.disk {
  background: conic-gradient(#ff9c38 0deg, transparent 0deg);
}

.memory {
  background: conic-gradient(#29de9c 0deg, transparent 0deg);
}

.gpu {
  background: conic-gradient(#ff5a5a 0deg, transparent 0deg);
}

.inner-circle {
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.liquid-container {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
}

.liquid-wave {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 50%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50% 50% 0 0;
}

.percentage-text {
  position: relative;
  z-index: 2;
  font-size: 14px;
  font-weight: bold;
}

.percentage-symbol {
  font-size: 12px;
}

.chart-title {
  font-size: 14px;
  opacity: 0.8;
}

.resource-details-container {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 16px;
}

.expanded-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.resource-detail-title {
  font-size: 16px;
  font-weight: 600;
}

.resource-time {
  font-size: 12px;
  opacity: 0.7;
}

.resource-details {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.detail-group {
  background: rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-label {
  opacity: 0.7;
}

.detail-value {
  font-weight: 500;
}
</style>