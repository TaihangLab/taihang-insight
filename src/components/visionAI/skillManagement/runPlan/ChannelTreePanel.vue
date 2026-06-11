<template>
  <div class="channel-tree-panel">
    <div class="channel-tree-panel__header">
      <div class="header-title">
        <i class="el-icon-video-camera"></i>
        <span>通道列表</span>
      </div>
      <div class="header-switch">
        <el-switch
          v-model="showRegion"
          active-color="#3b82f6"
          inactive-color="#10b981"
          active-text="行政区划"
          inactive-text="业务分组">
        </el-switch>
      </div>
    </div>
    <div class="channel-tree-panel__body">
      <RegionTree
        v-if="showRegion"
        :hasChannel="true"
        tree-height="auto"
        :clickEvent="onTreeClick">
      </RegionTree>
      <GroupTree
        v-else
        :hasChannel="true"
        tree-height="auto"
        :clickEvent="onTreeClick">
      </GroupTree>
    </div>

    <div v-if="activeChannel" class="channel-preview">
      <div class="channel-preview__main">
        <div class="channel-preview__name" :title="activeChannel.camera_name">{{ activeChannel.camera_name }}</div>
        <div class="channel-preview__status">
          <span class="status-dot" :class="activeChannel.online ? 'is-online' : 'is-offline'"></span>
          <span :class="activeChannel.online ? 'text-online' : 'text-offline'">
            {{ activeChannel.online ? '在线' : '离线' }}
          </span>
        </div>
      </div>
      <el-button
        size="mini"
        type="primary"
        plain
        icon="el-icon-picture-outline"
        :loading="snapshotLoading"
        @click="fetchSnapshot">
        获取截图
      </el-button>
    </div>
    <div v-else class="channel-preview channel-preview--empty">
      点击通道节点查看在线状态与截图
    </div>

    <el-dialog
      title="通道截图预览"
      :visible.sync="snapshotVisible"
      width="720px"
      append-to-body
      custom-class="channel-snapshot-dialog"
      @closed="onSnapshotClosed">
      <div v-loading="snapshotLoading" class="snapshot-dialog-body">
        <div v-if="snapshotError" class="snapshot-error">
          <i class="el-icon-warning-outline"></i>
          <p>{{ snapshotError }}</p>
          <el-button size="small" @click="fetchSnapshot">重试</el-button>
        </div>
        <div v-else-if="snapshotUrl" class="snapshot-img-wrap">
          <img :src="snapshotUrl" alt="通道截图" @load="snapshotLoading = false" @error="onSnapshotImgError" />
        </div>
        <div v-else class="snapshot-empty">暂无截图</div>
      </div>
      <div v-if="activeChannel" slot="footer" class="snapshot-dialog-footer">
        <span class="snapshot-meta">
          {{ activeChannel.camera_name }}
          <span class="status-dot" :class="activeChannel.online ? 'is-online' : 'is-offline'"></span>
          {{ activeChannel.online ? '在线' : '离线' }}
        </span>
        <el-button size="small" @click="snapshotVisible = false">关闭</el-button>
        <el-button size="small" type="primary" @click="fetchSnapshot">刷新截图</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import RegionTree from '../../monitoringWarning/components/RegionTree.vue';
import GroupTree from '../../monitoringWarning/components/GroupTree.vue';
import { runPlanAPI } from '@/components/service/VisionAIService.js';

/** 从树节点解析运行计划使用的点位 ID */
export function resolveTreeChannel(data) {
  if (!data) return null;
  // type=1 为通道叶子；id 为 WVP 全局通道数字 ID（playChannel / 抓图均用此字段）
  // deviceId 是国标编码字符串，不能用于截图 API
  const isChannel = data.type === 1 || data.leaf || data.isLeaf;
  if (!isChannel) return null;
  const cameraId = data.id != null && data.id !== '' ? data.id : data.gbId;
  if (cameraId == null || cameraId === '') return null;
  return {
    camera_id: cameraId,
    camera_name: data.name || data.label || String(cameraId),
    online: data.status === 'ON',
    status: data.status || 'OFF'
  };
}

export default {
  name: 'ChannelTreePanel',
  components: { RegionTree, GroupTree },
  data() {
    return {
      showRegion: true,
      activeChannel: null,
      snapshotVisible: false,
      snapshotLoading: false,
      snapshotUrl: '',
      snapshotError: ''
    };
  },
  methods: {
    onTreeClick(data) {
      this.$emit('node-click', data);
      const channel = resolveTreeChannel(data);
      if (channel) {
        this.activeChannel = channel;
        this.$emit('channel-click', channel, data);
      }
    },
    fetchSnapshot() {
      if (!this.activeChannel) return;
      this.snapshotLoading = true;
      this.snapshotError = '';
      this.snapshotVisible = true;
      this.snapshotUrl = runPlanAPI.getCameraSnapshotUrl(this.activeChannel.camera_id);
    },
    onSnapshotImgError() {
      this.snapshotLoading = false;
      this.snapshotError = '获取截图失败，请确认通道在线且支持抓图后重试';
      this.snapshotUrl = '';
    },
    onSnapshotClosed() {
      this.snapshotUrl = '';
      this.snapshotError = '';
    }
  }
};
</script>

<style scoped>
.channel-tree-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(59, 130, 246, 0.12);
  border-radius: 10px;
  overflow: hidden;
  text-align: left;
}

.channel-tree-panel__header {
  flex-shrink: 0;
  padding: 14px 12px 12px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-bottom: 1px solid rgba(59, 130, 246, 0.15);
}

.header-title {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #1e40af;
}

.header-title i {
  font-size: 16px;
  margin-right: 6px;
}

.header-switch >>> .el-switch__label {
  color: #1e40af !important;
  font-weight: 500 !important;
  font-size: 12px !important;
}

.channel-tree-panel__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 小面板内关闭虚拟滚动，外层滚动展示全部通道 */
.channel-tree-panel >>> #MonitorRegionTree,
.channel-tree-panel >>> #MonitorGroupTree,
.channel-tree-panel >>> .flow-tree,
.channel-tree-panel >>> .el-tree {
  height: auto !important;
  text-align: left;
}

.channel-preview {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid #ebeef5;
  background: #fafbfc;
}

.channel-preview--empty {
  justify-content: center;
  font-size: 12px;
  color: #c0c4cc;
}

.channel-preview__main {
  flex: 1;
  min-width: 0;
}

.channel-preview__name {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.channel-preview__status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.status-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.is-online {
  background: #67c23a;
  box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.25);
}

.status-dot.is-offline {
  background: #c0c4cc;
}

.text-online { color: #67c23a; }
.text-offline { color: #909399; }

.channel-tree-panel >>> .el-tree-node__content {
  height: 32px;
  border-radius: 4px;
}

.channel-tree-panel >>> .el-tree-node__content:hover {
  background: rgba(59, 130, 246, 0.08);
}

.channel-tree-panel >>> .is-current > .el-tree-node__content {
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
}

.channel-tree-panel >>> .custom-tree-node {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
}

.snapshot-dialog-body {
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1d2129;
  border-radius: 8px;
  overflow: hidden;
}

.snapshot-img-wrap {
  width: 100%;
  line-height: 0;
}

.snapshot-img-wrap img {
  width: 100%;
  max-height: 420px;
  object-fit: contain;
  display: block;
}

.snapshot-error,
.snapshot-empty {
  text-align: center;
  color: #909399;
  padding: 40px 20px;
}

.snapshot-error i {
  font-size: 36px;
  color: #e6a23c;
  margin-bottom: 12px;
}

.snapshot-error p {
  margin: 0 0 14px;
  font-size: 13px;
  color: #606266;
}

.snapshot-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.snapshot-meta {
  margin-right: auto;
  font-size: 13px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>

<style>
.channel-snapshot-dialog .el-dialog__body {
  padding: 16px 20px;
}
</style>
