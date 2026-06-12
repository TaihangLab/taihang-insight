<template>
  <div class="th-tool" :class="{ done: block.done }">
    <button type="button" class="th-tool-chip" @click="toggleDetail">
      <i v-if="!block.done" class="el-icon-loading th-tool-icon" />
      <i v-else class="el-icon-circle-check th-tool-icon done" />
      <span class="th-tool-name">{{ displayName }}</span>
      <span class="th-tool-state">{{ block.done ? '已完成' : '执行中' }}</span>
      <i v-if="block.done && block.detail" class="el-icon-arrow-down th-tool-arrow" :class="{ flipped: showDetail }" />
    </button>
    <div v-if="showDetail && block.detail" class="th-tool-detail">{{ block.detail }}</div>
  </div>
</template>

<script>
const TOOL_LABELS = {
  list_cameras: '查询摄像头列表',
  get_camera_stats: '统计摄像头状态',
  query_recent_alerts: '查询最近预警',
  get_alert_statistics: '统计预警数据',
  list_ai_tasks: '查询 AI 分析任务',
  get_system_overview: '获取系统总览',
};

export default {
  name: 'ToolCallChip',
  props: {
    block: { type: Object, required: true },
  },
  data() {
    return { showDetail: false };
  },
  computed: {
    displayName() {
      return TOOL_LABELS[this.block.name] || this.block.name || '平台工具';
    },
  },
  methods: {
    toggleDetail() {
      if (this.block.done && this.block.detail) {
        this.showDetail = !this.showDetail;
      }
    },
  },
};
</script>

<style scoped>
.th-tool {
  margin: 6px 0;
}

.th-tool-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #f7f7f8;
  border: 1px solid #e3e3e3;
  border-radius: 999px;
  font-size: 13px;
  color: #5d5d5d;
  cursor: default;
}

.th-tool.done .th-tool-chip {
  cursor: pointer;
}

.th-tool.done .th-tool-chip:hover {
  background: #ececec;
}

.th-tool-icon {
  font-size: 14px;
  color: #8f8f8f;
}

.th-tool-icon.done {
  color: #10a37f;
}

.th-tool-name {
  font-weight: 500;
  color: #0d0d0d;
}

.th-tool-state {
  color: #8f8f8f;
  font-size: 12px;
}

.th-tool-arrow {
  font-size: 12px;
  color: #8f8f8f;
  transition: transform 0.2s;
}

.th-tool-arrow.flipped {
  transform: rotate(180deg);
}

.th-tool-detail {
  margin-top: 6px;
  padding: 10px 12px;
  background: #f7f7f8;
  border: 1px solid #ececec;
  border-radius: 10px;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  color: #5d5d5d;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 180px;
  overflow-y: auto;
}
</style>
