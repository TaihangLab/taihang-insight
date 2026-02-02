<template>
  <div class="dashboard-card h-full">
    <div class="card-header">
      <div class="title">资源统计</div>
    </div>
    <div class="card-content h-full">
      <!-- 加载状态 -->
      <div v-if="loading" class="flex items-center justify-center h-full">
        <i class="i-carbon-circle-dash text-4xl animate-spin" style="color: #3eaef9;"></i>
        <p class="text-sm mt-2 ml-2" style="color: #fff;">加载中...</p>
      </div>

      <!-- 数据展示 -->
      <template v-else>
        <div class="server-info">
          <div class="server-type">
            <i class="el-icon-s-platform server-icon"></i>
            <span>Master: {{ resourceData.servers.master }}个</span>
          </div>
          <div class="server-type">
            <i class="el-icon-s-grid server-icon"></i>
            <span>Node: {{ resourceData.servers.nodes }}个</span>
          </div>
        </div>

        <!-- 添加资源标签区域 -->
        <div class="resource-labels">
          <div class="resource-label">CPU使用率</div>
          <div class="resource-label">内存使用率</div>
          <div class="resource-label">磁盘使用率</div>
          <div class="resource-label">显存使用率</div>
        </div>

        <div class="resource-charts">
          <div class="chart-item">
            <div class="chart-container">
              <div class="percentage-ring cpu"
                :style="{ background: `conic-gradient(#3eaef9 ${resourceData.cpu.usage * 3.6}deg, transparent 0deg)` }"></div>
              <div class="inner-circle">
                <div class="liquid-container cpu">
                  <div class="liquid-wave"></div>
                </div>
              </div>
              <div class="percentage-text cpu">{{ resourceData.cpu.usage }}<span class="percentage-symbol">%</span></div>
            </div>
            <div class="chart-title">CPU</div>
          </div>
          <div class="chart-item">
            <div class="chart-container">
              <div class="percentage-ring disk"
                :style="{ background: `conic-gradient(#ff9c38 ${resourceData.memory.usage * 3.6}deg, transparent 0deg)` }"></div>
              <div class="inner-circle">
                <div class="liquid-container disk">
                  <div class="liquid-wave"></div>
                </div>
              </div>
              <div class="percentage-text disk">{{ resourceData.memory.usage }}<span class="percentage-symbol">%</span></div>
            </div>
            <div class="chart-title">内存</div>
          </div>
          <div class="chart-item">
            <div class="chart-container">
              <div class="percentage-ring memory"
                :style="{ background: `conic-gradient(#29de9c ${resourceData.disk.usage * 3.6}deg, transparent 0deg)` }"></div>
              <div class="inner-circle">
                <div class="liquid-container memory">
                  <div class="liquid-wave"></div>
                </div>
              </div>
              <div class="percentage-text memory">{{ resourceData.disk.usage }}<span class="percentage-symbol">%</span></div>
            </div>
            <div class="chart-title">磁盘</div>
          </div>
          <div class="chart-item">
            <div class="chart-container">
              <div class="percentage-ring gpu"
                :style="{ background: `conic-gradient(#ff5a5a ${resourceData.gpu.usage * 3.6}deg, transparent 0deg)` }"></div>
              <div class="inner-circle">
                <div class="liquid-container gpu">
                  <div class="liquid-wave"></div>
                </div>
              </div>
              <div class="percentage-text gpu">{{ resourceData.gpu.usage }}<span class="percentage-symbol">%</span></div>
            </div>
            <div class="chart-title">显存</div>
          </div>
        </div>

        <div class="resource-details-container">
          <div class="expanded-header">
            <div class="resource-detail-title">资源详情</div>
            <div class="resource-time">更新时间: {{ formattedTime }}</div>
          </div>
          <div class="resource-details">
            <div class="detail-group">
              <div class="detail-item">
                <div class="detail-label">CPU平均温度</div>
                <div class="detail-value">{{ resourceData.cpu.avg_temp }}°C</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">CPU峰值温度</div>
                <div class="detail-value">{{ resourceData.cpu.max_temp }}°C</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">CPU核心数</div>
                <div class="detail-value">{{ resourceData.cpu.cores }}</div>
              </div>
            </div>
            <div class="detail-group">
              <div class="detail-item">
                <div class="detail-label">内存总量</div>
                <div class="detail-value">{{ resourceData.memory.total }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">已用内存</div>
                <div class="detail-value">{{ resourceData.memory.used }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">内存频率</div>
                <div class="detail-value">3200MHz</div>
              </div>
            </div>
            <div class="detail-group">
              <div class="detail-item">
                <div class="detail-label">存储总量</div>
                <div class="detail-value">{{ resourceData.disk.total }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">已用存储</div>
                <div class="detail-value">{{ resourceData.disk.used }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">存储类型</div>
                <div class="detail-value">{{ resourceData.disk.type }}</div>
              </div>
            </div>
            <div class="detail-group">
              <div class="detail-item">
                <div class="detail-label">GPU型号</div>
                <div class="detail-value">{{ resourceData.gpu.model }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">显存总量</div>
                <div class="detail-value">{{ resourceData.gpu.vram_total }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">温度</div>
                <div class="detail-value">{{ resourceData.gpu.temperature }}°C</div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import systemMonitorAPI from '@/api/center/systemMonitor'
import type { SystemResourcesData } from '@/api/center/systemMonitor'

// 接收 resizeTrigger prop
defineProps<{
  resizeTrigger?: number
}>()

// 响应式数据
const loading = ref(true)
const resourceData = ref<SystemResourcesData>({
  cpu: { usage: 0, cores: 0, avg_temp: 0, max_temp: 0 },
  memory: { usage: 0, total: '0GB', used: '0GB' },
  disk: { usage: 0, total: '0GB', used: '0GB', type: 'Unknown' },
  gpu: { usage: 0, model: 'Unknown', vram_total: '0GB', temperature: 0 },
  servers: { master: 0, nodes: 0 },
  timestamp: new Date().toISOString()
})

// 格式化时间
const formattedTime = computed(() => {
  if (!resourceData.value.timestamp) return '--'
  try {
    const date = new Date(resourceData.value.timestamp)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return '--'
  }
})

// 加载资源数据
async function loadResources(): Promise<void> {
  try {
    const data = await systemMonitorAPI.getSystemResources()
    console.log('[ResourceStatistics] 获取到资源数据:', data)

    // 确保数据结构完整，使用默认值填充缺失字段
    resourceData.value = {
      cpu: {
        usage: data?.cpu?.usage ?? 0,
        cores: data?.cpu?.cores ?? 0,
        avg_temp: data?.cpu?.avg_temp ?? 0,
        max_temp: data?.cpu?.max_temp ?? 0
      },
      memory: {
        usage: data?.memory?.usage ?? 0,
        total: data?.memory?.total ?? '0GB',
        used: data?.memory?.used ?? '0GB'
      },
      disk: {
        usage: data?.disk?.usage ?? 0,
        total: data?.disk?.total ?? '0GB',
        used: data?.disk?.used ?? '0GB',
        type: data?.disk?.type ?? 'Unknown'
      },
      gpu: {
        usage: data?.gpu?.usage ?? 0,
        model: data?.gpu?.model ?? 'Unknown',
        vram_total: data?.gpu?.vram_total ?? '0GB',
        temperature: data?.gpu?.temperature ?? 0
      },
      servers: {
        master: data?.servers?.master ?? 0,
        nodes: data?.servers?.nodes ?? 0
      },
      timestamp: data?.timestamp ?? new Date().toISOString()
    }
  } catch (error) {
    console.error('加载系统资源失败:', error)
  } finally {
    loading.value = false
  }
}

let refreshTimer: number | null = null

onMounted(() => {
  loadResources()
  // 每 30 秒刷新一次
  refreshTimer = window.setInterval(loadResources, 30000)
})

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style scoped>
.dashboard-card {
  background: rgba(6, 30, 93, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(35, 88, 148, 0.5);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  color: #fff;
}

.card-header {
  padding: 16px 24px;
  border-bottom: 1px solid rgba(35, 88, 148, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(90deg, #00FFFF, #1B96FF);
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
  color: #1B96FF;
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
  background: rgba(0, 0, 0, 0.3);
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
  border-top: 1px solid rgba(35, 88, 148, 0.3);
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
  color: #00FFFF;
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
  background: rgba(0, 0, 0, 0.3);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(0, 255, 255, 0.2);
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
  color: #7EAEE5;
}

.detail-value {
  font-weight: 500;
  color: #fff;
}
</style>
