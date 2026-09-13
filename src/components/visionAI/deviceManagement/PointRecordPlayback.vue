<template>
  <div id="recordPlayback" class="realtime-monitoring-container">
    <el-container class="main-container">
      <el-aside width="250px" class="device-tree-aside">
        <div class="custom-tree-header">
          <div class="header-title">
            <i class="el-icon-office-building"></i>
            <span>组织与点位</span>
          </div>
        </div>
        <div class="custom-tree-container">
          <OrgPointTree
            :hasChannel="true"
            tree-height="auto"
            :clickEvent="onTreeClick"
          />
        </div>
      </el-aside>

      <el-container class="video-main-container">
        <el-header height="50px" class="video-toolbar">
          <div class="toolbar-left">
            <span class="header-label">录像回放</span>
          </div>
          <div class="toolbar-right">
            <div class="current-time">
              <i class="el-icon-time"></i>
              <span>{{ date }} {{ timeText }}</span>
            </div>
            <el-tooltip content="点位录像计划" placement="bottom" effect="light">
              <i class="el-icon-film btn" @click="$router.push({ name: 'pointRecordPlan' })" />
            </el-tooltip>
          </div>
        </el-header>

        <el-main class="video-main">
          <div class="playback-stage">
            <div class="video-cell selected">
              <div class="video-slim-header">
                <span class="camera-name">{{ pointName || '未选择点位' }}</span>
                <div class="video-status" :class="activeClip ? 'online' : 'offline'">
                  <span class="status-dot"></span>
                  <span class="status-text">{{ headerStatus }}</span>
                </div>
              </div>
              <div class="video-content">
                <div class="video-placeholder">
                  <div v-if="!pointId" class="no-signal">
                    <i class="el-icon-video-camera-solid"></i>
                    <div>从左侧选择点位，进行录像回放</div>
                  </div>
                  <div v-else-if="loading" class="no-signal">
                    <i class="el-icon-loading"></i>
                    <div>正在加载录像...</div>
                  </div>
                  <div v-else-if="!activeClip" class="no-signal">
                    <i class="el-icon-film"></i>
                    <div>{{ emptyText }}</div>
                  </div>
                  <video
                    v-if="activeClip"
                    :key="activeClip.id"
                    ref="player"
                    class="playback-video"
                    :src="activeClip.url"
                    :muted="muted"
                    @loadedmetadata="onLoaded"
                    @timeupdate="onTimeUpdate"
                    @ended="onEnded"
                    @play="playing = true"
                    @pause="playing = false"
                    @click="togglePlay"
                  />
                  <div v-if="activeClip" class="player-tag" @click.stop="muted = !muted">
                    {{ muted ? '静音' : '有声' }}
                  </div>
                </div>
              </div>
            </div>

            <PlaybackTimeline
              :date="date"
              :time="timeText"
              :mode="mode"
              :playing="playing"
              :point-name="pointName"
              :current-ms="currentMs"
              :view-start-ms="viewStartMs"
              :view-end-ms="viewEndMs"
              :segments="clips"
              @toggle-play="togglePlay"
              @rewind="nudge(-10)"
              @forward="nudge(10)"
              @mode-change="onModeChange"
              @date-change="onDateChange"
              @time-change="onTimeChange"
              @seek="onSeek"
            />
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import OrgPointTree from '../monitoringWarning/components/OrgPointTree.vue';
import { assetAPI } from '../../service/AssetService.js';
import PlaybackTimeline from './PlaybackTimeline.vue';
import {
  formatYmd,
  formatHms,
  dayStartMs,
  dayEndMs,
  findClipAt,
  nearestClip,
} from './recordPlaybackStore.js';

export default {
  name: 'PointRecordPlayback',
  components: { OrgPointTree, PlaybackTimeline },
  data() {
    return {
      pointId: '',
      pointName: '',
      date: formatYmd(new Date()),
      currentMs: 0,
      mode: 'day',
      playing: false,
      muted: true,
      loading: false,
      clips: [],
      activeClip: null,
      pendingOffsetSec: 0,
      seeking: false,
    };
  },
  watch: {
    muted(val) {
      const el = this.$refs.player;
      if (el) el.muted = val;
    },
  },
  computed: {
    timeText() {
      return formatHms(this.currentMs || dayStartMs(this.date));
    },
    viewStartMs() {
      if (this.mode !== 'hour') return dayStartMs(this.date);
      const d = new Date(this.currentMs || dayStartMs(this.date));
      d.setMinutes(0, 0, 0);
      return d.getTime();
    },
    viewEndMs() {
      if (this.mode !== 'hour') return dayEndMs(this.date);
      return this.viewStartMs + 60 * 60 * 1000;
    },
    emptyText() {
      if (!this.clips.length) {
        return '当前日期此点位暂无录像';
      }
      return '该时刻暂无录像，请拖到蓝色时段';
    },
    headerStatus() {
      if (!this.pointId) return '未选择';
      if (this.loading) return '加载中';
      if (this.activeClip) return this.playing ? '回放中' : '已暂停';
      return '无录像';
    },
  },
  mounted() {
    this.bootFromQuery();
  },
  methods: {
    bootFromQuery() {
      const q = this.$route.query || {};
      if (q.date) this.date = q.date;
      if (q.pointId) {
        this.pointId = q.pointId;
        this.pointName = q.pointName || q.pointId;
        this.loadClips().then(() => {
          if (q.t) {
            const ms = Number(q.t);
            if (ms) this.onSeek(ms);
          } else {
            this.jumpToFirstClip();
          }
        });
        this.resolvePointName(q.pointId);
      } else {
        this.currentMs = dayStartMs(this.date);
      }
    },
    async resolvePointName(pointId) {
      try {
        const data = await assetAPI.fetchPoints({ page: 1, pageSize: 2000 });
        const found = (data.list || []).find(function (p) { return p.id === pointId; });
        if (found && found.name) this.pointName = found.name;
      } catch (e) {
        /* keep query name */
      }
    },
    onTreeClick(data) {
      const isChannel = data && (data.type === 1 || data.leaf || data.isLeaf);
      if (!isChannel || data.id == null || data.id === '') return;
      this.pointId = String(data.id);
      this.pointName = data.name || data.label || String(data.id);
      this.activeClip = null;
      this.playing = false;
      this.loadClips().then(this.jumpToFirstClip);
    },
    loadClips() {
      this.loading = true;
      if (!this.pointId) {
        this.clips = [];
        this.loading = false;
        return Promise.resolve();
      }
      return assetAPI.fetchRecordings({
        pointId: this.pointId,
        date: this.date,
      }).then((data) => {
        this.clips = (data && data.list) || [];
      }).catch((e) => {
        this.clips = [];
        this.$message.error((e && e.message) || '加载录像失败');
      }).finally(() => {
        this.loading = false;
      });
    },
    jumpToFirstClip() {
      if (!this.clips.length) {
        this.currentMs = dayStartMs(this.date);
        this.activeClip = null;
        return;
      }
      this.onSeek(this.clips[0].startMs);
    },
    onDateChange(val) {
      if (!val) return;
      this.date = val;
      this.activeClip = null;
      this.playing = false;
      this.loadClips().then(this.jumpToFirstClip);
    },
    onModeChange(val) {
      this.mode = val;
    },
    onTimeChange(val) {
      if (!val) return;
      const parts = val.split(':');
      const start = dayStartMs(this.date);
      const ms = start
        + Number(parts[0] || 0) * 3600000
        + Number(parts[1] || 0) * 60000
        + Number(parts[2] || 0) * 1000;
      this.onSeek(ms);
    },
    onSeek(ms) {
      const min = dayStartMs(this.date);
      const max = dayEndMs(this.date) - 1;
      const next = Math.min(Math.max(ms, min), max);
      this.currentMs = next;
      const clip = findClipAt(this.clips, next);
      if (!clip) {
        this.activeClip = null;
        this.playing = false;
        return;
      }
      this.openClip(clip, (next - clip.startMs) / 1000);
    },
    openClip(clip, offsetSec) {
      this.pendingOffsetSec = Math.max(offsetSec || 0, 0);
      this.seeking = true;
      if (!this.activeClip || this.activeClip.id !== clip.id) {
        this.activeClip = clip;
        this.$nextTick(() => {
          const el = this.$refs.player;
          if (el && el.readyState >= 1) this.applySeek();
        });
      } else {
        this.applySeek();
      }
    },
    applySeek() {
      const el = this.$refs.player;
      if (!el || !this.activeClip) {
        this.seeking = false;
        return;
      }
      const duration = el.duration;
      let t = this.pendingOffsetSec || 0;
      if (duration && isFinite(duration)) t = Math.min(t, Math.max(duration - 0.05, 0));
      try {
        el.currentTime = t;
      } catch (e) {
        /* ignore */
      }
      const playPromise = el.play();
      if (playPromise && playPromise.catch) playPromise.catch(function () {});
      this.playing = true;
      this.seeking = false;
    },
    onLoaded() {
      this.applySeek();
    },
    onTimeUpdate() {
      if (this.seeking || !this.activeClip) return;
      const el = this.$refs.player;
      if (!el) return;
      const next = this.activeClip.startMs + (el.currentTime || 0) * 1000;
      if (next >= this.activeClip.endMs) {
        this.playNextClip();
        return;
      }
      this.currentMs = next;
    },
    onEnded() {
      this.playNextClip();
    },
    playNextClip() {
      if (!this.activeClip) return;
      const idx = this.clips.findIndex((c) => c.id === this.activeClip.id);
      const next = this.clips[idx + 1];
      if (next) {
        this.onSeek(next.startMs);
      } else {
        this.playing = false;
        this.currentMs = this.activeClip.endMs;
      }
    },
    togglePlay() {
      if (!this.activeClip) {
        const clip = nearestClip(this.clips, this.currentMs);
        if (clip) this.onSeek(Math.max(this.currentMs, clip.startMs));
        return;
      }
      const el = this.$refs.player;
      if (!el) return;
      if (el.paused) {
        const p = el.play();
        if (p && p.catch) p.catch(function () {});
      } else {
        el.pause();
      }
    },
    nudge(seconds) {
      this.onSeek(this.currentMs + seconds * 1000);
    },
  },
};
</script>

<style scoped>
.realtime-monitoring-container {
  height: 100%;
  max-height: 100%;
  background: #f5f5f5;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.main-container {
  flex: 1;
  min-height: 0;
  height: 100% !important;
  max-height: 100%;
  background: #f5f5f5;
  overflow: hidden;
  position: relative;
  padding: 16px;
  box-sizing: border-box;
  align-items: stretch;
}
.device-tree-aside {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-right: 1px solid rgba(59, 130, 246, 0.1);
  height: 100% !important;
  align-self: stretch;
  overflow: hidden !important;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.05);
  border-radius: 16px;
  margin-right: 16px;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(59, 130, 246, 0.1);
}
.custom-tree-header {
  padding: 20px 16px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #1e40af;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  min-height: 80px;
  flex-shrink: 0;
  border-radius: 16px 16px 0 0;
}
.header-title {
  display: flex;
  align-items: center;
}
.header-title i {
  font-size: 18px;
  margin-right: 8px;
}
.header-title span {
  font-size: 16px;
  font-weight: bold;
}
.custom-tree-container {
  flex: 1;
  overflow: auto;
  min-height: 0;
  padding: 16px;
  background: linear-gradient(to bottom, #fafafa 0%, #f5f5f5 100%);
}
.custom-tree-container >>> #MonitorOrgPointTree,
.custom-tree-container >>> .flow-tree {
  height: 100%;
  min-height: 100%;
}
.video-main-container {
  flex: 1;
  min-width: 0;
  min-height: 0;
  height: 100% !important;
  align-self: stretch;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  margin: 0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.1);
  display: flex;
  flex-direction: column;
}
.video-toolbar {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-bottom: 1px solid rgba(59, 130, 246, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.header-label {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}
.current-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
  padding: 8px 16px;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(59, 130, 246, 0.1);
}
.current-time i { color: #3b82f6; font-size: 16px; }
.btn {
  margin: 0;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-size: 16px;
  color: #4b5563;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(59, 130, 246, 0.1);
}
.btn:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #3b82f6;
  color: #1e40af;
}
.video-main {
  flex: 1;
  min-height: 0;
  padding: 16px !important;
  margin: 0 !important;
  overflow: hidden !important;
  background: linear-gradient(to bottom, #fafafa 0%, #f5f5f5 100%) !important;
}
.playback-stage {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}
.video-cell {
  flex: 1;
  min-height: 0;
  background: #1e2430;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(59, 130, 246, 0.2);
}
.video-slim-header {
  height: 36px;
  padding: 0 16px;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  font-size: 13px;
  font-weight: 500;
  flex-shrink: 0;
}
.camera-name {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.video-status {
  display: flex;
  align-items: center;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.3);
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
  background: #f56c6c;
}
.video-status.online { color: #95ffa5; }
.video-status.online .status-dot {
  background: #67c23a;
  box-shadow: 0 0 4px #67c23a;
}
.video-status.offline { color: #ffbbbb; }
.video-content {
  flex: 1;
  min-height: 0;
  position: relative;
  background: #0a1526;
}
.video-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.no-signal {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.8);
  gap: 12px;
}
.no-signal i { font-size: 36px; color: rgba(255, 255, 255, 0.7); }
.no-signal div { font-size: 13px; font-weight: 500; }
.playback-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
  cursor: pointer;
}
.player-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  z-index: 3;
}
.playback-stage >>> .playback-timeline {
  margin: 0;
  height: 96px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.1);
}
</style>

<style>
.layout-main-inner > #recordPlayback {
  height: 100% !important;
  min-height: 0 !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
}
.layout-main-inner > #recordPlayback .el-container {
  height: 100%;
}
.layout-main-inner > #recordPlayback > .el-container {
  flex: 1;
  min-height: 0;
}
.layout-main-inner > #recordPlayback .el-aside {
  height: 100% !important;
}
</style>
