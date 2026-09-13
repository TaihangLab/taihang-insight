<template>
  <div class="playback-timeline">
    <div class="timeline-header">
      <div class="header-left">
        <button class="icon-btn" type="button" :title="playing ? '暂停' : '播放'" @click="$emit('toggle-play')">
          <i :class="playing ? 'el-icon-video-pause' : 'el-icon-video-play'" />
        </button>
        <span class="status-text">{{ pointName || '请从左侧选择点位' }}</span>
      </div>
      <div class="header-right">
        <el-select :value="storageType" size="mini" class="type-select" @change="$emit('type-change', $event)">
          <el-option label="云存储录像" value="cloud" />
          <el-option label="本地存储录像" value="local" />
        </el-select>
        <button class="icon-btn" type="button" title="后退10秒" @click="$emit('rewind')">
          <i class="el-icon-d-arrow-left" />
        </button>
        <button class="icon-btn" type="button" title="前进10秒" @click="$emit('forward')">
          <i class="el-icon-d-arrow-right" />
        </button>
        <el-select :value="mode" size="mini" class="mode-select" @change="$emit('mode-change', $event)">
          <el-option label="按天" value="day" />
          <el-option label="按小时" value="hour" />
        </el-select>
        <el-date-picker
          :value="date"
          type="date"
          size="mini"
          value-format="yyyy-MM-dd"
          format="yyyy-MM-dd"
          placeholder="选择日期"
          style="width: 140px;"
          @change="$emit('date-change', $event)"
        />
        <el-time-picker
          :value="time"
          size="mini"
          value-format="HH:mm:ss"
          format="HH:mm:ss"
          placeholder="时间"
          style="width: 120px;"
          @change="$emit('time-change', $event)"
        />
      </div>
    </div>

    <div
      ref="track"
      class="timeline-track"
      :class="{ dragging: dragging }"
      @mousedown="onTrackDown"
      @mousemove="onTrackHover"
      @mouseleave="hoverRatio = null"
    >
      <div class="time-ruler">
        <span v-for="tick in ticks" :key="tick.key" :style="{ left: tick.left }">{{ tick.label }}</span>
      </div>
      <div class="track-bar">
        <div
          v-for="seg in visibleSegments"
          :key="seg.id"
          class="track-seg"
          :style="{ left: seg.left, width: seg.width }"
        />
        <div
          v-if="hoverRatio != null"
          class="hover-tip"
          :style="{ left: (hoverRatio * 100) + '%' }"
        >{{ hoverLabel }}</div>
        <div class="slider-handle" :style="{ left: handleLeft }" @mousedown.stop="onHandleDown" />
      </div>
    </div>
  </div>
</template>

<script>
import { pad2 } from './recordPlaybackStore.js';

export default {
  name: 'PlaybackTimeline',
  props: {
    date: { type: String, default: '' },
    time: { type: String, default: '00:00:00' },
    mode: { type: String, default: 'day' },
    storageType: { type: String, default: 'cloud' },
    playing: { type: Boolean, default: false },
    pointName: { type: String, default: '' },
    currentMs: { type: Number, default: 0 },
    viewStartMs: { type: Number, default: 0 },
    viewEndMs: { type: Number, default: 1 },
    segments: { type: Array, default: function () { return []; } },
  },
  data() {
    return {
      dragging: false,
      hoverRatio: null,
    };
  },
  computed: {
    viewDuration() {
      return Math.max(this.viewEndMs - this.viewStartMs, 1);
    },
    handleLeft() {
      const ratio = (this.currentMs - this.viewStartMs) / this.viewDuration;
      const clamped = Math.min(Math.max(ratio, 0), 1);
      return (clamped * 100) + '%';
    },
    ticks() {
      const start = this.viewStartMs;
      const end = this.viewEndMs;
      const span = end - start;
      const step = this.mode === 'hour' ? 5 * 60 * 1000 : 2 * 60 * 60 * 1000;
      const out = [];
      let t = start;
      const startDate = new Date(start);
      if (this.mode === 'hour') {
        const m = startDate.getMinutes();
        t = start - (m % 5) * 60000 - startDate.getSeconds() * 1000 - startDate.getMilliseconds();
        if (t < start) t += step;
      } else {
        t = start;
      }
      for (; t <= end; t += step) {
        const d = new Date(t);
        const label = this.mode === 'hour'
          ? pad2(d.getHours()) + ':' + pad2(d.getMinutes())
          : d.getHours() + ':00';
        out.push({
          key: String(t),
          label: label,
          left: (((t - start) / span) * 100) + '%',
        });
      }
      return out;
    },
    visibleSegments() {
      const start = this.viewStartMs;
      const end = this.viewEndMs;
      const span = this.viewDuration;
      return (this.segments || []).filter(function (seg) {
        return seg.endMs > start && seg.startMs < end;
      }).map(function (seg) {
        const leftMs = Math.max(seg.startMs, start);
        const rightMs = Math.min(seg.endMs, end);
        return {
          id: seg.id,
          left: (((leftMs - start) / span) * 100) + '%',
          width: (Math.max(rightMs - leftMs, 0) / span * 100) + '%',
        };
      });
    },
    hoverLabel() {
      if (this.hoverRatio == null) return '';
      const ms = this.viewStartMs + this.hoverRatio * this.viewDuration;
      const d = new Date(ms);
      return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
    },
  },
  mounted() {
    this._onMove = this.onWindowMove.bind(this);
    this._onUp = this.onWindowUp.bind(this);
  },
  beforeDestroy() {
    this.unbindDrag();
  },
  methods: {
    ratioFromEvent(e) {
      const el = this.$refs.track;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return 0;
      return Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    },
    emitSeek(ratio) {
      const ms = this.viewStartMs + ratio * this.viewDuration;
      this.$emit('seek', ms);
    },
    onTrackDown(e) {
      if (e.button !== 0) return;
      e.preventDefault();
      this.dragging = true;
      this.emitSeek(this.ratioFromEvent(e));
      this.bindDrag();
    },
    onHandleDown(e) {
      if (e.button !== 0) return;
      e.preventDefault();
      this.dragging = true;
      this.bindDrag();
    },
    onTrackHover(e) {
      if (this.dragging) return;
      this.hoverRatio = this.ratioFromEvent(e);
    },
    bindDrag() {
      window.addEventListener('mousemove', this._onMove);
      window.addEventListener('mouseup', this._onUp);
    },
    unbindDrag() {
      window.removeEventListener('mousemove', this._onMove);
      window.removeEventListener('mouseup', this._onUp);
    },
    onWindowMove(e) {
      if (!this.dragging) return;
      this.hoverRatio = null;
      this.emitSeek(this.ratioFromEvent(e));
    },
    onWindowUp(e) {
      if (!this.dragging) return;
      this.dragging = false;
      this.emitSeek(this.ratioFromEvent(e));
      this.unbindDrag();
    },
  },
};
</script>

<style scoped>
.playback-timeline {
  height: 88px;
  background: #fff;
  border-radius: 8px;
  margin: 0;
  padding: 8px 16px 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
  user-select: none;
}
.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.icon-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #909399;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  font-size: 16px;
}
.icon-btn:hover {
  background: #f0f0f0;
  color: #409eff;
}
.status-text {
  font-size: 13px;
  color: #909399;
}
.type-select { width: 128px; }
.mode-select { width: 88px; }
.timeline-track {
  position: relative;
  height: 36px;
  cursor: pointer;
}
.timeline-track.dragging { cursor: grabbing; }
.time-ruler {
  position: relative;
  height: 18px;
  font-size: 11px;
  color: #c0c4cc;
}
.time-ruler span {
  position: absolute;
  transform: translateX(-50%);
  white-space: nowrap;
}
.track-bar {
  position: relative;
  height: 8px;
  background: #e8edf6;
  border-radius: 4px;
  margin-top: 4px;
}
.track-seg {
  position: absolute;
  top: 0;
  height: 100%;
  background: #409eff;
  border-radius: 4px;
}
.slider-handle {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  margin-left: -7px;
  transform: translateY(-50%);
  background: #409eff;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  cursor: grab;
  z-index: 2;
}
.hover-tip {
  position: absolute;
  top: -22px;
  transform: translateX(-50%);
  background: #303133;
  color: #fff;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 3px;
  pointer-events: none;
  white-space: nowrap;
  z-index: 3;
}
</style>
