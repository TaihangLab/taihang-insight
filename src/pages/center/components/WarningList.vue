<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import alertAPI from '@/api/center/alert';
import type { WarningListItem } from '@/types/center/components';

interface Props {
  tableHeight: number;
  headerCellStyle: any;
}

defineProps<Props>();

// 数据状态
const warningList = ref<WarningListItem[]>([]);
const loading = ref<boolean>(false);

// 定时器
let refreshTimer: number | null = null;

/**
 * 将状态映射为字符串（用于 CSS 类名）
 */
function mapStatusToString(status: string | number): string {
  const statusMap: Record<string | number, string> = {
    1: 'pending',
    2: 'processing',
    3: 'completed',
    'pending': 'pending',
    'processing': 'processing',
    'completed': 'completed'
  };
  return statusMap[status] || 'pending';
}

/**
 * 获取状态文本
 */
function getStatusText(status: string | number): string {
  const statusMap: Record<string | number, string> = {
    'pending': '待处理',
    'processing': '处理中',
    'completed': '已完成',
    1: '待处理',
    2: '处理中',
    3: '已完成',
    '待处理': '待处理',
    '处理中': '处理中',
    '已完成': '已完成'
  };
  return statusMap[status] || '未知';
}

/**
 * 加载预警列表数据
 */
async function loadData(): Promise<void> {
  loading.value = true;
  try {
    const apiResponse = await alertAPI.getRealTimeAlerts({ page: 1, limit: 10 });

    // 提取 data 数组（优先使用新格式，兼容旧格式直接返回数组）
    const alertsData = apiResponse?.data ? apiResponse.data : (Array.isArray(apiResponse) ? apiResponse : []);
    const alerts = alertsData as any[];

    if (alerts && alerts.length > 0) {
      warningList.value = alerts.map((item: any) => ({
        event: item.alert_name || item.name || '未知预警',
        time: item.alert_time || item.time || '',
        status: mapStatusToString(item.status),
        statusText: getStatusText(item.status)
      }));
    } else {
      console.log('[WarningList] 没有预警数据');
      warningList.value = [];
    }
  } catch (error) {
    console.error('[WarningList] 加载预警列表失败:', error);
    warningList.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  // 加载数据
  loadData();

  // 设置定时刷新（每30秒）
  refreshTimer = window.setInterval(loadData, 30 * 1000);
});

onBeforeUnmount(() => {
  // 清理定时器
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});

defineExpose({
  refresh: loadData,
  loading
});
</script>

<template>
  <div class="flex-1 overflow-hidden min-h-0 flex flex-col">
    <el-table
      :data="warningList"
      style="width: 100%"
      :header-cell-style="headerCellStyle"
      :cell-style="{ background: 'transparent', color: '#7EAEE5', borderBottom: '1px solid rgba(35, 88, 148, 0.3)' }"
      :row-style="{ background: 'transparent' }"
      :row-class-name="'transparent-row'"
      :height="tableHeight"
      v-loading="loading"
      element-loading-text="加载中..."
    >
      <el-table-column prop="event" label="预警事件" min-width="200" />
      <el-table-column prop="time" label="预警时间" width="200" />
      <el-table-column prop="status" label="处理状态" width="120">
        <template #default="scope">
          <span
            :class="[
              'inline-block py-0.5 px-2 rounded-0.25 text-12px leading-1.5 text-center min-w-13',
              {
                'text-[#ff8746] bg-[rgba(255,135,70,0.1)] border border-[rgba(255,135,70,0.3)]': scope.row.status === 'pending',
                'text-[#44ff9b] bg-[rgba(68,255,155,0.1)] border border-[rgba(68,255,155,0.3)]': scope.row.status === 'processing',
                'text-[#00ffff] bg-[rgba(0,255,255,0.1)] border border-[rgba(0,255,255,0.3)]': scope.row.status === 'completed'
              }
            ]"
          >
            {{ scope.row.statusText }}
          </span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
/* 表格透明样式 - 使用最小化的自定义样式 */
:deep(.transparent-row) {
  background-color: transparent !important;
}

:deep(.el-table) {
  background-color: transparent;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

:deep(.el-table::-webkit-scrollbar) {
  display: none;
}

:deep(.el-table tr) {
  background-color: transparent !important;
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td) {
  background-color: rgba(0, 255, 255, 0.1) !important;
}
</style>
