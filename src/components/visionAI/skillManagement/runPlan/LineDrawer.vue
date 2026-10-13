<template>
  <el-dialog
    :visible.sync="innerVisible"
    width="1080px"
    custom-class="line-drawer-dialog"
    append-to-body
    :close-on-click-modal="false"
    :show-close="false"
    top="4vh"
    @opened="onOpened"
    @closed="onClosed">
    <div slot="title" class="line-header">
      <span class="line-header__title">计数线绘制</span>
      <span class="line-header__sub">先点两个端点画出线段，再点第三下标出参考侧</span>
      <i class="el-icon-close line-header__close" @click="innerVisible = false"></i>
    </div>

    <div class="line-body">
      <div class="line-stage">
        <div class="line-toolbar">
          <el-radio-group v-model="activeKey" size="mini" @change="draftPts = []">
            <el-radio-button v-for="f in fields" :key="f.key" :label="f.key">{{ f.label }}</el-radio-button>
          </el-radio-group>
          <span class="line-hint">{{ hint }}</span>
          <span class="line-size" v-if="imgSize.w">{{ imgSize.w }}×{{ imgSize.h }}</span>
          <el-button size="mini" icon="el-icon-refresh" @click="loadSnapshot">刷新画面</el-button>
        </div>
        <div class="line-viewport">
          <canvas ref="canvas" class="line-canvas" @click="onCanvasClick"></canvas>
          <div v-if="!img && !loading" class="line-empty">点位画面加载失败，请刷新后重试</div>
          <div v-if="loading" class="line-empty"><i class="el-icon-loading"></i> 正在截取画面…</div>
        </div>
      </div>
      <div class="line-side">
        <div class="line-side__head">{{ activeField ? activeField.label : '线段' }}（{{ activeItems.length }}）</div>
        <p class="line-side__desc">{{ activeField && activeField.hint ? activeField.hint : '参考侧决定人员从哪一侧穿过才计数。' }}</p>
        <div v-if="!activeItems.length" class="line-side__empty">尚未绘制</div>
        <div v-for="(it, i) in activeItems" :key="i" class="line-item">
          <span>#{{ i + 1 }} 线段 + {{ sideLabel }}</span>
          <i v-if="!readonly" class="el-icon-delete" @click="removeItem(i)"></i>
        </div>
        <div class="line-side__ops" v-if="!readonly">
          <el-button size="mini" :disabled="!draftPts.length && !activeItems.length" @click="undo">撤销</el-button>
          <el-button size="mini" :disabled="!activeItems.length" @click="clearActive">清空当前</el-button>
        </div>
      </div>
    </div>

    <span slot="footer">
      <el-button @click="innerVisible = false">{{ readonly ? '关闭' : '取消' }}</el-button>
      <el-button v-if="!readonly" type="primary" @click="confirm">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { runPlanAPI } from '@/components/service/VisionAIService.js';

const COLORS = {
  count_line: '#3d9b6e',
  bypass_line: '#e6a23c'
};

function sideKeyOf(field) {
  if (field && field.sideKey) return field.sideKey;
  return field && field.key === 'bypass_line' ? 'bypass_point' : 'enter_point';
}

function parseLines(cfg, sideKey) {
  const lines = cfg && Array.isArray(cfg.lines) ? cfg.lines : [];
  const out = [];
  lines.forEach(it => {
    const line = it && it.line;
    const side = it && it[sideKey];
    if (!Array.isArray(line) || line.length < 2 || !side) return;
    const a = line[0];
    const b = line[1];
    if ([a && a.x, a && a.y, b && b.x, b && b.y, side.x, side.y].some(v => typeof v !== 'number')) return;
    out.push({
      line: [
        { x: Math.round(a.x), y: Math.round(a.y) },
        { x: Math.round(b.x), y: Math.round(b.y) }
      ],
      side: { x: Math.round(side.x), y: Math.round(side.y) }
    });
  });
  return out;
}

export default {
  name: 'LineDrawer',
  props: {
    visible: { type: Boolean, default: false },
    cameraId: { default: null },
    fields: { type: Array, default: () => [] },
    initFence: { type: Object, default: null },
    readonly: { type: Boolean, default: false }
  },
  data() {
    return {
      innerVisible: this.visible,
      activeKey: '',
      items: {},
      draftPts: [],
      img: null,
      imgSize: { w: 0, h: 0 },
      loading: false,
      loadToken: 0
    };
  },
  computed: {
    activeField() {
      return (this.fields || []).find(f => f.key === this.activeKey) || this.fields[0] || null;
    },
    sideLabel() {
      return sideKeyOf(this.activeField);
    },
    activeItems() {
      return this.items[this.activeKey] || [];
    },
    hint() {
      if (this.draftPts.length === 0) return '点击第 1 个端点';
      if (this.draftPts.length === 1) return '点击第 2 个端点完成线段';
      return `点击 ${this.sideLabel}（参考侧）`;
    }
  },
  watch: {
    visible(val) {
      this.innerVisible = val;
    },
    innerVisible(val) {
      this.$emit('update:visible', val);
    },
    items: { deep: true, handler() { this.redraw(); } },
    draftPts() { this.redraw(); },
    activeKey() { this.redraw(); }
  },
  methods: {
    onOpened() {
      const fence = this.initFence || {};
      const items = {};
      (this.fields || []).forEach(f => {
        items[f.key] = parseLines(fence[f.key], sideKeyOf(f));
      });
      this.items = items;
      this.activeKey = (this.fields[0] && this.fields[0].key) || '';
      this.draftPts = [];
      this.loadSnapshot();
    },
    onClosed() {
      this.img = null;
      this.draftPts = [];
    },
    loadSnapshot() {
      const token = ++this.loadToken;
      this.img = null;
      this.imgSize = { w: 0, h: 0 };
      if (!this.cameraId) return;
      this.loading = true;
      const img = new Image();
      img.onload = () => {
        if (token !== this.loadToken) return;
        this.img = img;
        this.imgSize = { w: img.naturalWidth || 0, h: img.naturalHeight || 0 };
        this.loading = false;
        this.redraw();
      };
      img.onerror = () => {
        if (token !== this.loadToken) return;
        this.img = null;
        this.loading = false;
        this.redraw();
      };
      img.src = runPlanAPI.getCameraSnapshotUrl(this.cameraId);
    },
    redraw() {
      const canvas = this.$refs.canvas;
      const img = this.img;
      if (!canvas) return;
      const w = (img && img.naturalWidth) || 960;
      const h = (img && img.naturalHeight) || 540;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      if (img) {
        ctx.drawImage(img, 0, 0, w, h);
      } else {
        ctx.fillStyle = '#1a2030';
        ctx.fillRect(0, 0, w, h);
      }
      (this.fields || []).forEach(f => {
        const color = COLORS[f.key] || '#3d9b6e';
        (this.items[f.key] || []).forEach((it, idx) => {
          this.drawSeg(ctx, it.line[0], it.line[1], color);
          this.drawPt(ctx, it.side, color, 6);
          ctx.fillStyle = '#fff';
          ctx.font = '14px sans-serif';
          ctx.fillText(`${f.label}#${idx + 1}`, it.line[0].x + 8, it.line[0].y - 8);
        });
      });
      this.draftPts.forEach((p, i) => {
        this.drawPt(ctx, p, '#fff', 4);
        if (i > 0) {
          ctx.beginPath();
          ctx.moveTo(this.draftPts[i - 1].x, this.draftPts[i - 1].y);
          ctx.lineTo(p.x, p.y);
          ctx.setLineDash([6, 4]);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });
    },
    drawPt(ctx, p, color, r) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    },
    drawSeg(ctx, a, b, color) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();
      this.drawPt(ctx, a, color, 4);
      this.drawPt(ctx, b, color, 4);
    },
    eventPoint(e) {
      const canvas = this.$refs.canvas;
      if (!canvas || !this.imgSize.w) return null;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      return {
        x: Math.round((e.clientX - rect.left) * (this.imgSize.w / rect.width)),
        y: Math.round((e.clientY - rect.top) * (this.imgSize.h / rect.height))
      };
    },
    onCanvasClick(e) {
      if (this.readonly || !this.activeKey) return;
      const p = this.eventPoint(e);
      if (!p) return;
      const next = this.draftPts.concat([p]);
      if (next.length < 3) {
        this.draftPts = next;
        return;
      }
      const list = (this.items[this.activeKey] || []).concat([{
        line: [next[0], next[1]],
        side: next[2]
      }]);
      this.$set(this.items, this.activeKey, list);
      this.draftPts = [];
    },
    removeItem(index) {
      const list = (this.items[this.activeKey] || []).slice();
      list.splice(index, 1);
      this.$set(this.items, this.activeKey, list);
    },
    undo() {
      if (this.draftPts.length) {
        this.draftPts = this.draftPts.slice(0, -1);
        return;
      }
      const list = (this.items[this.activeKey] || []).slice();
      list.pop();
      this.$set(this.items, this.activeKey, list);
    },
    clearActive() {
      this.draftPts = [];
      this.$set(this.items, this.activeKey, []);
    },
    confirm() {
      const fence = Object.assign({}, this.initFence || {});
      (this.fields || []).forEach(f => {
        const sideKey = sideKeyOf(f);
        const lines = (this.items[f.key] || []).map(it => ({
          line: it.line,
          [sideKey]: it.side
        }));
        if (!lines.length) {
          delete fence[f.key];
          return;
        }
        fence[f.key] = {
          lines,
          image_width: this.imgSize.w,
          image_height: this.imgSize.h
        };
      });
      this.$emit('confirm', fence);
      this.innerVisible = false;
    }
  }
};
</script>

<style scoped>
.line-header { display: flex; align-items: center; gap: 12px; }
.line-header__title { font-size: 16px; font-weight: 600; color: #1f2d3d; }
.line-header__sub { flex: 1; font-size: 12px; color: #909399; }
.line-header__close { cursor: pointer; color: #909399; font-size: 16px; }
.line-body { display: flex; gap: 16px; min-height: 520px; }
.line-stage { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.line-toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.line-hint { flex: 1; font-size: 12px; color: #606266; }
.line-size { font-size: 12px; color: #909399; }
.line-viewport {
  position: relative;
  flex: 1;
  background: #111820;
  border-radius: 8px;
  overflow: hidden;
  min-height: 460px;
}
.line-canvas { display: block; width: 100%; height: auto; cursor: crosshair; }
.line-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 13px;
}
.line-side { width: 240px; flex: none; }
.line-side__head { font-weight: 600; color: #303133; margin-bottom: 6px; }
.line-side__desc { font-size: 12px; color: #909399; line-height: 1.5; margin: 0 0 10px; }
.line-side__empty { font-size: 12px; color: #c0c4cc; }
.line-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
  font-size: 13px;
  color: #303133;
}
.line-item i { cursor: pointer; color: #f56c6c; }
.line-side__ops { margin-top: 12px; display: flex; gap: 8px; }
</style>
