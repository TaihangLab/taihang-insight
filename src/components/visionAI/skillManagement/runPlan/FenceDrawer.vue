<template>
  <el-dialog
    :visible.sync="innerVisible"
    width="1180px"
    :custom-class="dialogClass"
    append-to-body
    :close-on-click-modal="false"
    :show-close="false"
    top="4vh"
    @opened="onOpened"
    @closed="onClosed">
    <div slot="title" class="fence-header">
      <span class="fence-header__title">电子围栏绘制</span>
      <button type="button" class="fence-header__guide" @click="showGuide = !showGuide">
        <i class="el-icon-question"></i> 绘制说明
      </button>
      <i class="el-icon-close fence-header__close" @click="innerVisible = false"></i>
    </div>

    <div class="fence-body">
      <!-- 画布区 -->
      <div class="canvas-section">
        <div class="canvas-toolbar">
          <div class="canvas-toolbar__left">
            <span v-for="t in tools" :key="t.key" class="tool-item">
              <span v-if="t.dividerBefore" class="tool-divider"></span>
              <span
                class="tool-btn-wrap"
                @mouseenter="showFloatingTip($event, t.tip || t.title)"
                @mouseleave="hideFloatingTip">
                <div
                  class="tool-btn"
                  :class="{ active: tool === t.key, disabled: t.disabled }"
                  @click="onToolClick(t)">
                  <span class="tool-btn__icon" v-html="t.icon"></span>
                  <span class="tool-btn__label">{{ t.title }}</span>
                </div>
              </span>
            </span>
          </div>
          <button type="button" class="refresh-btn" @click="refreshImage">
            <i class="el-icon-refresh"></i> 刷新图片
          </button>
        </div>

        <div
          ref="canvasViewport"
          class="canvas-viewport"
          :class="{ 'is-panning': panning }"
          @mousedown="onViewportMouseDown"
          @mousemove="onViewportMouseMove"
          @mouseup="onViewportMouseUp"
          @mouseleave="onViewportMouseUp"
          @dblclick="onViewportDblClick">
          <div class="roi-badge">
            <svg class="roi-badge__icon" viewBox="0 0 24 24" width="14" height="14">
              <path fill="currentColor" d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z"/>
            </svg>
            <span class="roi-badge__label">{{ allowPolygon ? (allowTripwire ? 'roi+line' : 'roi') : 'line' }}</span>
            <span class="roi-badge__dot" :class="hasDrawn ? 'is-drawn' : ''"></span>
            <span class="roi-badge__status">{{ hasDrawn ? '已绘制' : '未绘制' }}</span>
          </div>
          <canvas
            ref="canvas"
            :width="canvasW"
            :height="canvasH"
            class="fence-canvas"
            :style="{ cursor: canvasCursor }">
          </canvas>
          <div v-if="drawing && tool === 'tripwire'" class="canvas-tip">已落下 A 点，再单击落下 B 点完成绊线；双击取消</div>
          <div v-else-if="drawing" class="canvas-tip">单击添加顶点，双击或靠近起点闭合；不足 3 点双击将取消</div>
          <div v-else-if="selectedIndex >= 0 && tool !== 'pan'" class="canvas-tip canvas-tip--muted">单击空白区域取消选中</div>
        </div>
      </div>

      <!-- 围栏列表 -->
      <div class="fence-list">
        <div class="fence-list__head">
          电子围栏列表 ({{ visibleRegionCount }}/{{ totalItemCount }})
        </div>
        <div class="fence-list__desc">
          说明：绘制的电子围栏区域为识别区域，技能使用后作为预置信息生效
        </div>

        <div v-if="regions.length" class="fence-items">
          <div
            v-for="(r, i) in regions"
            :key="i"
            class="fence-item"
            :class="{ active: selectedIndex === i, hidden: !r.visible }"
            @click="selectRegion(i)">
            <div class="fence-item__head">
              <el-checkbox v-model="r.visible" @change="redraw" @click.native.stop>
                <span class="fence-item__type">多边形电子围栏</span>
              </el-checkbox>
              <div class="fence-item__ops">
                <i class="el-icon-view" :class="{ off: !r.visible }" @click.stop="toggleVisible(i)"></i>
                <i class="el-icon-delete" @click.stop="removeRegion(i)"></i>
              </div>
            </div>
            <div class="fence-item__body">
              <div class="fence-field fence-field--row">
                <label class="fence-field__label"><span class="req">*</span> 名称：</label>
                <div class="fence-field__control">
                  <el-input
                    v-model="r.name"
                    size="mini"
                    placeholder="如 M3"
                    @input="redraw"
                    @click.native.stop>
                  </el-input>
                  <span v-if="r.invert" class="invert-tag">（反选）</span>
                </div>
              </div>
              <div class="fence-field fence-field--row">
                <label class="fence-field__label">
                  <span class="req">*</span> 占比：
                  <span
                    class="field-help-wrap"
                    @mouseenter="showFloatingTip($event, ratioTipText)"
                    @mouseleave="hideFloatingTip"
                    @click.stop>
                    <i class="el-icon-question field-help"></i>
                  </span>
                </label>
                <el-input-number
                  v-model="r.ratio"
                  :min="0" :max="1" :step="0.1" :precision="2"
                  size="mini"
                  controls-position="right"
                  class="fence-field__ratio"
                  @click.native.stop>
                </el-input-number>
              </div>
              <div class="fence-field fence-field--row">
                <label class="fence-field__label">区域反选：</label>
                <el-checkbox
                  v-model="r.invert"
                  @change="onInvertChange(i)"
                  @click.native.stop
                  class="fence-field__invert">反选</el-checkbox>
              </div>
            </div>
          </div>
        </div>

        <div v-if="tripwires.length" class="fence-items">
          <div
            v-for="(t, i) in tripwires"
            :key="'tw-' + i"
            class="fence-item"
            :class="{ active: selectedTripwireIndex === i, hidden: !t.visible }"
            @click="selectTripwire(i)">
            <div class="fence-item__head">
              <el-checkbox v-model="t.visible" @change="redraw" @click.native.stop>
                <span class="fence-item__type">绊线电子围栏</span>
              </el-checkbox>
              <div class="fence-item__ops">
                <i class="el-icon-view" :class="{ off: !t.visible }" @click.stop="toggleTripwireVisible(i)"></i>
                <i class="el-icon-delete" @click.stop="removeTripwire(i)"></i>
              </div>
            </div>
            <div class="fence-item__body">
              <div class="fence-field fence-field--row">
                <label class="fence-field__label"><span class="req">*</span> 名称：</label>
                <div class="fence-field__control">
                  <el-input
                    v-model="t.name"
                    size="mini"
                    placeholder="如 L1"
                    @input="redraw"
                    @click.native.stop>
                  </el-input>
                </div>
              </div>
              <div class="fence-field fence-field--row">
                <label class="fence-field__label"><span class="req">*</span> 方向：</label>
                <el-select
                  v-model="t.direction"
                  size="mini"
                  class="fence-field__control"
                  @change="redraw"
                  @click.native.stop>
                  <el-option label="从A到B" value="ab"></el-option>
                  <el-option label="从B到A" value="ba"></el-option>
                  <el-option label="双向" value="both"></el-option>
                </el-select>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!regions.length && !tripwires.length" class="fence-empty">
          <svg viewBox="0 0 48 48" width="48" height="48" class="fence-empty__icon">
            <path fill="#dcdfe6" d="M8 40l32-32 4 4-32 32H8v-4zm28-28l4-4 4 4-4 4-4-4zM12 12h8v8h-8V12z"/>
          </svg>
          <p>{{ allowPolygon ? '请点击画布区域开始绘制' : '请在画布上点两个点绘制绊线' }}</p>
        </div>
      </div>

      <!-- 绘制说明 -->
      <transition name="guide-slide">
        <div v-if="showGuide" class="guide-panel">
          <div class="guide-panel__head">
            <span>绘制说明</span>
            <i class="el-icon-close" @click="showGuide = false"></i>
          </div>
          <div class="guide-panel__body">
            <p class="guide-intro">在进行表计配置前请先完成电子围栏绘制。原则如下：</p>
            <ol class="guide-list">
              <li>针对指针表，请使用矩形电子围栏进行表盘框选；</li>
              <li>针对数字表，使用矩形电子围栏进行表盘框选。框选时需尽量保证电子围栏边与数字平行；</li>
              <li>针对液位表，使用矩形电子围栏进行预警范围框选。若液位表存在刻度，请尽量保证电子围栏边与刻度平行；</li>
              <li>框选时需将目标表计的所有信息包含进去，并尽量减少包含其他表计的信息。</li>
            </ol>
            <div class="guide-carousel">
              <div class="guide-carousel__tabs">
                <button
                  v-for="(item, i) in guideExamples"
                  :key="'tab-' + i"
                  type="button"
                  class="guide-carousel__tab"
                  :class="{ active: guideExampleIndex === i }"
                  @click="guideExampleIndex = i">
                  {{ item.tab }}
                </button>
              </div>
              <div class="guide-carousel__viewer">
                <button type="button" class="guide-carousel__arrow" @click="prevGuideExample">
                  <i class="el-icon-arrow-left"></i>
                </button>
                <div class="guide-carousel__slide">
                  <img
                    :src="currentGuideExample.img"
                    :alt="currentGuideExample.caption"
                    class="guide-carousel__img" />
                  <p class="guide-carousel__caption">{{ currentGuideExample.caption }}</p>
                </div>
                <button type="button" class="guide-carousel__arrow" @click="nextGuideExample">
                  <i class="el-icon-arrow-right"></i>
                </button>
              </div>
              <div class="guide-carousel__dots">
                <span
                  v-for="(item, i) in guideExamples"
                  :key="'dot-' + i"
                  class="guide-carousel__dot"
                  :class="{ active: guideExampleIndex === i }"
                  @click="guideExampleIndex = i">
                </span>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <div slot="footer" class="fence-footer">
      <el-button @click="innerVisible = false">取消</el-button>
      <el-button type="primary" @click="confirm">提交</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { runPlanAPI } from '@/components/service/VisionAIService.js';

const RATIO_TIP_TEXT = '目标占比：指目标在电子围栏中的部分占目标总体的比例，当目标进入电子围栏占比超过所设置占比值时，系统即产生报警，反之将不产生报警。填写时，支持输入 0.00-1.00 的数字。';

const ICON_POLYGON = '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 2l8 6v8l-8 6-8-6V8l8-6z" fill-opacity="0.15" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>';
const ICON_TRIPWIRE = '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="5" cy="19" r="2" fill="currentColor"/><circle cx="19" cy="5" r="2" fill="currentColor"/><line x1="6.5" y1="17.5" x2="17.5" y2="6.5" stroke="currentColor" stroke-width="1.8"/></svg>';
const ICON_PAN = '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 2l1.5 4.5H18l-3.7 2.7 1.4 4.3L12 12.8 8.3 13.5l1.4-4.3L6 6.5h4.5L12 2zm-7 14h2v6H5v-6zm12 0h2v6h-2v-6zm-6 0h2v6h-2v-6z"/></svg>';
const ICON_ZOOM_IN = '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><line x1="15" y1="15" x2="20" y2="20" stroke="currentColor" stroke-width="1.8"/><line x1="7.5" y1="10" x2="12.5" y2="10" stroke="currentColor" stroke-width="1.8"/><line x1="10" y1="7.5" x2="10" y2="12.5" stroke="currentColor" stroke-width="1.8"/></svg>';
const ICON_ZOOM_OUT = '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><line x1="15" y1="15" x2="20" y2="20" stroke="currentColor" stroke-width="1.8"/><line x1="7.5" y1="10" x2="12.5" y2="10" stroke="currentColor" stroke-width="1.8"/></svg>';
const ICON_RESET = '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="3" fill="currentColor"/><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" stroke-width="1.5"/><line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" stroke-width="1.5"/><line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="1.5"/></svg>';
const ICON_FULLSCREEN = '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="none" stroke="currentColor" stroke-width="1.6" d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>';
const ICON_FULLSCREEN_EXIT = '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="none" stroke="currentColor" stroke-width="1.6" d="M9 4H4v5M20 9V4h-5M4 15v5h5M15 20h5v-5"/></svg>';

export default {
  name: 'FenceDrawer',
  props: {
    visible: { type: Boolean, default: false },
    initFence: { type: Object, default: null },
    cameraId: { type: [Number, String], default: null },
    // 技能声明的输入决定可绘制内容：声明 ROI → 多边形围栏；声明 Tripwire → 绊线
    allowPolygon: { type: Boolean, default: true },
    allowTripwire: { type: Boolean, default: false }
  },
  data() {
    return {
      innerVisible: this.visible,
      canvasW: 740,
      canvasH: 416,
      regions: [],
      tripwires: [],
      selectedTripwireIndex: -1,
      tool: 'polygon',
      selectedIndex: -1,
      drawing: false,
      currentPoints: [],
      hoverPoint: null,
      bgImage: null,
      showGuide: false,
      guideExampleIndex: 0,
      ratioTipText: RATIO_TIP_TEXT,
      viewScale: 1,
      viewOffsetX: 0,
      viewOffsetY: 0,
      panning: false,
      panStart: null,
      isFullscreen: false,
      _lastPolyDown: 0,
      tools: [
        { key: 'polygon', title: '多边形', tip: '绘制多边形电子围栏', icon: ICON_POLYGON, disabled: false },
        {
          key: 'tripwire',
          title: '绊线',
          tip: '绊线用于跨线方向检测；技能输入声明了绊线(Tripwire)类型才可绘制',
          icon: ICON_TRIPWIRE,
          disabled: true,
          dividerBefore: false
        },
        { key: 'pan', title: '移动', tip: '拖动画布，图片与围栏同步移动', icon: ICON_PAN, disabled: false, dividerBefore: true },
        { key: 'zoomIn', title: '放大', tip: '放大画布视图', icon: ICON_ZOOM_IN, disabled: false },
        { key: 'zoomOut', title: '缩小', tip: '缩小画布视图', icon: ICON_ZOOM_OUT, disabled: false },
        { key: 'resetView', title: '复位', tip: '恢复默认视图位置与缩放', icon: ICON_RESET, disabled: false },
        { key: 'fullscreen', title: '全屏', tip: '绘制窗口全屏显示', icon: ICON_FULLSCREEN, disabled: false }
      ],
      guideExamples: [
        {
          tab: '指针表',
          img: '/static/img/fence-guide/pointer-meter.png',
          caption: '指针表：使用矩形电子围栏框选表盘区域'
        },
        {
          tab: '数字表',
          img: '/static/img/fence-guide/digital-meter.png',
          caption: '数字表：围栏边尽量与数字平行'
        },
        {
          tab: '液位表',
          img: '/static/img/fence-guide/liquid-level.png',
          caption: '液位表：框选预警范围，边尽量与刻度平行'
        }
      ]
    };
  },
  computed: {
    dialogClass() {
      return this.isFullscreen ? 'fence-dialog is-dialog-fullscreen' : 'fence-dialog';
    },
    hasDrawn() {
      return this.regions.some(r => r.points && r.points.length >= 3)
        || this.tripwires.some(t => t.line && t.line.length >= 2);
    },
    visibleRegionCount() {
      return this.regions.filter(r => r.visible).length + this.tripwires.filter(t => t.visible).length;
    },
    totalItemCount() {
      return this.regions.length + this.tripwires.length;
    },
    canvasCursor() {
      if (this.tool === 'pan') return this.panning ? 'grabbing' : 'grab';
      if (this.tool === 'polygon' || this.tool === 'tripwire') return 'crosshair';
      return 'default';
    },
    currentGuideExample() {
      return this.guideExamples[this.guideExampleIndex] || this.guideExamples[0];
    }
  },
  watch: {
    isFullscreen(v) {
      this.syncFullscreenTool(v);
      document.body.classList.toggle('fence-drawer-fullscreen', v);
      this.$nextTick(this.redraw);
    },
    visible(v) {
      this.innerVisible = v;
      if (v) this.initFromProp();
    },
    innerVisible(v) {
      this.$emit('update:visible', v);
    }
  },
  beforeDestroy() {
    this.hideFloatingTip();
    document.body.classList.remove('fence-drawer-fullscreen');
  },
  methods: {
    showFloatingTip(e, text) {
      if (!text) return;
      this.hideFloatingTip();
      const el = document.createElement('div');
      el.className = 'fence-float-tip';
      el.textContent = text;
      const pad = 12;
      const maxW = 280;
      let left = e.clientX - maxW / 2;
      left = Math.max(pad, Math.min(left, window.innerWidth - maxW - pad));
      const top = Math.min(e.clientY + 16, window.innerHeight - 80);
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
      document.body.appendChild(el);
      this._floatTipEl = el;
    },
    hideFloatingTip() {
      if (this._floatTipEl && this._floatTipEl.parentNode) {
        this._floatTipEl.parentNode.removeChild(this._floatTipEl);
      }
      this._floatTipEl = null;
    },
    onOpened() {
      this.resetViewState();
      this.loadSnapshot();
      this.redraw();
    },
    onClosed() {
      this.hideFloatingTip();
      this.showGuide = false;
      this.guideExampleIndex = 0;
      this.drawing = false;
      this.currentPoints = [];
      this.hoverPoint = null;
      this.selectedIndex = -1;
      this._lastPolyDown = 0;
      this.resetViewState();
      if (this.isFullscreen) {
        this.isFullscreen = false;
        document.body.classList.remove('fence-drawer-fullscreen');
      }
    },
    resetViewState() {
      this.viewScale = 1;
      this.viewOffsetX = 0;
      this.viewOffsetY = 0;
      this.panning = false;
      this.panStart = null;
    },
    loadSnapshot() {
      this.bgImage = null;
      if (!this.cameraId) { this.redraw(); return; }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { this.bgImage = img; this.redraw(); };
      img.onerror = () => { this.bgImage = null; this.redraw(); };
      img.src = runPlanAPI.getCameraSnapshotUrl(this.cameraId);
    },
    refreshImage() {
      this.loadSnapshot();
    },
    initFromProp() {
      // 按技能输入声明启用工具：声明 ROI → 多边形；声明 Tripwire → 绊线
      const polyTool = this.tools.find(t => t.key === 'polygon');
      const tripTool = this.tools.find(t => t.key === 'tripwire');
      if (polyTool) polyTool.disabled = !this.allowPolygon;
      if (tripTool) tripTool.disabled = !this.allowTripwire;
      this.tool = this.allowPolygon ? 'polygon' : (this.allowTripwire ? 'tripwire' : 'pan');
      this.drawing = false;
      this.currentPoints = [];
      this.selectedIndex = -1;
      this.selectedTripwireIndex = -1;
      this.resetViewState();
      if (this.initFence && this.initFence.regions) {
        this.regions = JSON.parse(JSON.stringify(this.initFence.regions)).map((r, idx) => ({
          name: this.normalizeRegionName(r.name, idx),
          ratio: r.ratio != null ? r.ratio : 1.0,
          invert: !!r.invert,
          visible: r.visible !== false,
          points: r.points || []
        }));
      } else {
        this.regions = [];
      }
      if (this.initFence && this.initFence.tripwires) {
        this.tripwires = JSON.parse(JSON.stringify(this.initFence.tripwires)).map((t, idx) => ({
          name: this.normalizeRegionName(t.name, idx),
          direction: t.direction || 'ab',
          visible: t.visible !== false,
          line: t.line || t.points || []
        }));
      } else {
        this.tripwires = [];
      }
      this.$nextTick(this.redraw);
    },
    onToolClick(t) {
      if (t.disabled) return;
      if (t.key === 'zoomIn') { this.zoomAt(1.25); return; }
      if (t.key === 'zoomOut') { this.zoomAt(0.8); return; }
      if (t.key === 'resetView') { this.resetView(); return; }
      if (t.key === 'fullscreen') { this.toggleFullscreen(); return; }
      if (t.key === 'polygon' || t.key === 'tripwire') {
        this.tool = t.key;
        this.drawing = false;
        this.currentPoints = [];
        this.hoverPoint = null;
        this.redraw();
        return;
      }
      if (t.key === 'pan') {
        this.tool = 'pan';
        this.drawing = false;
        this.currentPoints = [];
        this.hoverPoint = null;
        this.redraw();
      }
    },
    zoomAt(factor) {
      const W = this.canvasW;
      const H = this.canvasH;
      const cx = W / 2;
      const cy = H / 2;
      const newScale = Math.max(0.4, Math.min(6, this.viewScale * factor));
      this.viewOffsetX = cx - (cx - this.viewOffsetX) * (newScale / this.viewScale);
      this.viewOffsetY = cy - (cy - this.viewOffsetY) * (newScale / this.viewScale);
      this.viewScale = newScale;
      this.redraw();
    },
    resetView() {
      this.viewScale = 1;
      this.viewOffsetX = 0;
      this.viewOffsetY = 0;
      this.redraw();
    },
    toggleFullscreen() {
      this.isFullscreen = !this.isFullscreen;
    },
    syncFullscreenTool(full) {
      const item = this.tools.find(t => t.key === 'fullscreen');
      if (!item) return;
      item.title = full ? '退出全屏' : '全屏';
      item.tip = full ? '退出绘制窗口全屏' : '绘制窗口全屏显示';
      item.icon = full ? ICON_FULLSCREEN_EXIT : ICON_FULLSCREEN;
    },
    selectRegion(i) {
      this.selectedIndex = i;
      this.redraw();
    },
    toggleVisible(i) {
      this.regions[i].visible = !this.regions[i].visible;
      this.redraw();
    },
    getCanvasCoords(e) {
      const canvas = this.$refs.canvas;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const px = (e.clientX - rect.left) * (this.canvasW / rect.width);
      const py = (e.clientY - rect.top) * (this.canvasH / rect.height);
      return { px, py, rect };
    },
    toNormalized(px, py) {
      const wx = (px - this.viewOffsetX) / this.viewScale;
      const wy = (py - this.viewOffsetY) / this.viewScale;
      return {
        x: +Math.max(0, Math.min(1, wx / this.canvasW)).toFixed(4),
        y: +Math.max(0, Math.min(1, wy / this.canvasH)).toFixed(4)
      };
    },
    onViewportMouseDown(e) {
      if (e.button !== 0) return;
      const coords = this.getCanvasCoords(e);
      if (!coords) return;

      if (this.tool === 'pan') {
        this.panning = true;
        this.panStart = {
          x: e.clientX,
          y: e.clientY,
          ox: this.viewOffsetX,
          oy: this.viewOffsetY,
          rect: coords.rect
        };
        e.preventDefault();
        return;
      }

      if (this.tool === 'tripwire') {
        this.addTripwirePoint(coords);
        return;
      }

      if (this.tool !== 'polygon') {
        if (this.selectedIndex >= 0 && !this.drawing) {
          this.selectedIndex = -1;
          this.redraw();
        }
        return;
      }

      const now = Date.now();
      if (now - this._lastPolyDown < 320) {
        this._lastPolyDown = now;
        return;
      }
      this._lastPolyDown = now;
      this.addPolygonPoint(coords);
    },
    addTripwirePoint(coords) {
      const norm = this.toNormalized(coords.px, coords.py);
      if (!this.drawing) {
        this.drawing = true;
        this.currentPoints = [norm];
        this.selectedIndex = -1;
        this.selectedTripwireIndex = -1;
        this.redraw();
        return;
      }
      // 第二个点：完成一条绊线
      const idx = this.tripwires.length;
      this.tripwires.push({
        name: this.nextTripwireName(),
        direction: 'ab',
        visible: true,
        line: [this.currentPoints[0], norm]
      });
      this.selectedTripwireIndex = idx;
      this.drawing = false;
      this.currentPoints = [];
      this.hoverPoint = null;
      this.redraw();
    },
    nextTripwireName() {
      const used = new Set(this.tripwires.map(t => (t.name || '').trim()));
      for (let i = 0; i < 80; i += 1) {
        const name = this.randomRegionName();
        if (!used.has(name)) return name;
      }
      return 'L' + this.tripwires.length;
    },
    selectTripwire(i) {
      this.selectedTripwireIndex = i;
      this.selectedIndex = -1;
      this.redraw();
    },
    toggleTripwireVisible(i) {
      this.tripwires[i].visible = !this.tripwires[i].visible;
      this.redraw();
    },
    removeTripwire(i) {
      this.tripwires.splice(i, 1);
      if (this.selectedTripwireIndex === i) this.selectedTripwireIndex = -1;
      else if (this.selectedTripwireIndex > i) this.selectedTripwireIndex -= 1;
      this.redraw();
    },
    addPolygonPoint(coords) {
      if (this.tool !== 'polygon') return;

      if (!this.drawing && this.selectedIndex >= 0) {
        this.selectedIndex = -1;
        this.redraw();
        return;
      }

      const norm = this.toNormalized(coords.px, coords.py);

      if (this.drawing && this.currentPoints.length >= 3) {
        const first = this.currentPoints[0];
        const dx = (norm.x - first.x) * this.canvasW;
        const dy = (norm.y - first.y) * this.canvasH;
        if (Math.sqrt(dx * dx + dy * dy) < 12 / this.viewScale) {
          this.finishPolygon();
          return;
        }
      }

      if (!this.drawing) {
        this.drawing = true;
        this.currentPoints = [];
        this.selectedIndex = -1;
      }
      this.currentPoints.push(norm);
      this.redraw();
    },
    onViewportMouseMove(e) {
      const coords = this.getCanvasCoords(e);
      if (!coords) return;

      if (this.panning && this.panStart) {
        const scaleX = this.canvasW / this.panStart.rect.width;
        const scaleY = this.canvasH / this.panStart.rect.height;
        this.viewOffsetX = this.panStart.ox + (e.clientX - this.panStart.x) * scaleX;
        this.viewOffsetY = this.panStart.oy + (e.clientY - this.panStart.y) * scaleY;
        this.redraw();
        return;
      }

      if (this.drawing && this.currentPoints.length) {
        this.hoverPoint = this.toNormalized(coords.px, coords.py);
        this.redraw();
      }
    },
    onViewportMouseUp() {
      this.panning = false;
      this.panStart = null;
    },
    onViewportDblClick(e) {
      e.preventDefault();
      this._lastPolyDown = 0;
      if (!this.drawing) return;
      if (this.tool === 'tripwire') {
        this.cancelDrawing();
        return;
      }
      if (this.tool !== 'polygon') return;
      if (this.currentPoints.length >= 3) {
        this.finishPolygon();
      } else {
        this.cancelDrawing();
      }
    },
    cancelDrawing() {
      this.drawing = false;
      this.currentPoints = [];
      this.hoverPoint = null;
      this.redraw();
    },
    finishPolygon() {
      if (!this.drawing) return;
      if (this.currentPoints.length < 3) {
        this.cancelDrawing();
        return;
      }
      const idx = this.regions.length;
      this.regions.push({
        name: this.nextName(),
        ratio: 1.0,
        invert: false,
        visible: true,
        points: this.currentPoints.slice()
      });
      this.selectedIndex = idx;
      this.drawing = false;
      this.currentPoints = [];
      this.hoverPoint = null;
      this.redraw();
    },
    randomRegionName() {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const letter = letters[Math.floor(Math.random() * letters.length)];
      const digit = Math.floor(Math.random() * 10);
      return letter + digit;
    },
    nextName() {
      const used = new Set(this.regions.map(r => (r.name || '').replace(/（反选）\s*$/, '').trim()));
      for (let i = 0; i < 80; i += 1) {
        const name = this.randomRegionName();
        if (!used.has(name)) return name;
      }
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const available = [];
      for (let li = 0; li < letters.length; li += 1) {
        for (let d = 0; d <= 9; d += 1) {
          const name = letters[li] + d;
          if (!used.has(name)) available.push(name);
        }
      }
      if (available.length) {
        return available[Math.floor(Math.random() * available.length)];
      }
      return 'Z9';
    },
    normalizeRegionName(name, index) {
      const base = (name || '').replace(/（反选）\s*$/, '').trim();
      if (base) return base;
      return this.defaultRegionName(index);
    },
    defaultRegionName(index) {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      return letters[index % letters.length] + (index % 10);
    },
    regionBaseName(r, index) {
      const base = (r.name || '').trim();
      return base || this.defaultRegionName(index);
    },
    displayRegionName(r, index) {
      const base = this.regionBaseName(r, index);
      return r.invert ? `${base}（反选）` : base;
    },
    onInvertChange(index) {
      this.redraw();
    },
    removeRegion(i) {
      this.regions.splice(i, 1);
      if (this.selectedIndex === i) this.selectedIndex = -1;
      else if (this.selectedIndex > i) this.selectedIndex -= 1;
      this.redraw();
    },
    prevGuideExample() {
      const len = this.guideExamples.length;
      this.guideExampleIndex = (this.guideExampleIndex - 1 + len) % len;
    },
    nextGuideExample() {
      const len = this.guideExamples.length;
      this.guideExampleIndex = (this.guideExampleIndex + 1) % len;
    },
    redraw() {
      const canvas = this.$refs.canvas;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = this.canvasW;
      const H = this.canvasH;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#12151c';
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.translate(this.viewOffsetX, this.viewOffsetY);
      ctx.scale(this.viewScale, this.viewScale);

      if (this.bgImage) {
        try { ctx.drawImage(this.bgImage, 0, 0, W, H); } catch (e) { /* ignore */ }
      } else {
        ctx.fillStyle = '#1a2030';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#8a94a6';
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('加载点位画面中…', W / 2, H / 2 - 8);
        ctx.fillStyle = '#5c6678';
        ctx.font = '12px sans-serif';
        ctx.fillText('若长时间无画面，请检查点位是否在线', W / 2, H / 2 + 14);
        ctx.textAlign = 'start';
      }

      this.regions.forEach((r, i) => {
        if (!r.visible) return;
        const selected = i === this.selectedIndex;
        const invert = !!r.invert;
        const stroke = invert
          ? (selected ? '#fa8c16' : '#e6a23c')
          : (selected ? '#ff4d4f' : '#ff4d4f');
        const fill = invert ? 'rgba(250,140,22,0.24)' : 'rgba(255,77,79,0.22)';
        this.drawPolygon(ctx, r.points, fill, stroke, true, invert);
        this.drawVertexHandles(ctx, r.points, selected, invert ? '#fa8c16' : undefined);
        this.drawRegionLabel(ctx, r.points, this.displayRegionName(r, i), invert);
      });

      this.tripwires.forEach((t, i) => {
        if (!t.visible) return;
        this.drawTripwire(ctx, t, i === this.selectedTripwireIndex);
      });

      if (this.drawing && this.currentPoints.length) {
        if (this.tool === 'tripwire') {
          const preview = {
            name: '',
            direction: 'ab',
            line: [this.currentPoints[0], this.hoverPoint || this.currentPoints[0]]
          };
          this.drawTripwire(ctx, preview, true, true);
        } else {
          const pts = this.currentPoints.slice();
          const preview = this.hoverPoint ? pts.concat([this.hoverPoint]) : pts;
          this.drawPolygon(ctx, preview, 'rgba(64,158,255,0.16)', '#409eff', false);
          this.drawVertexHandles(ctx, pts, true, '#409eff');
        }
      }

      ctx.restore();
    },
    drawTripwire(ctx, t, selected, isPreview) {
      const line = t.line || [];
      if (line.length < 2) return;
      const W = this.canvasW;
      const H = this.canvasH;
      const ax = line[0].x * W; const ay = line[0].y * H;
      const bx = line[1].x * W; const by = line[1].y * H;
      const color = isPreview ? '#409eff' : (selected ? '#10b981' : '#52c41a');

      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.lineWidth = (selected ? 2.5 : 2) / this.viewScale;
      ctx.strokeStyle = color;
      ctx.setLineDash(isPreview ? [7 / this.viewScale, 5 / this.viewScale] : []);
      ctx.stroke();
      ctx.setLineDash([]);

      // 方向箭头：画在线段中点，沿跨线方向（线段法向）
      const mx = (ax + bx) / 2; const my = (ay + by) / 2;
      const len = Math.hypot(bx - ax, by - ay) || 1;
      // 与后端叉积判定一致：ab = 从负侧跨到正侧，正侧法向 = (-(by-ay), bx-ax)
      let nx = -(by - ay) / len; let ny = (bx - ax) / len;
      if (t.direction === 'ba') { nx = -nx; ny = -ny; }
      const drawArrow = (dirx, diry) => {
        const alen = 16 / this.viewScale;
        const tipx = mx + dirx * alen; const tipy = my + diry * alen;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(tipx, tipy);
        ctx.stroke();
        const head = 5 / this.viewScale;
        ctx.beginPath();
        ctx.moveTo(tipx, tipy);
        ctx.lineTo(tipx - dirx * head - diry * head * 0.6, tipy - diry * head + dirx * head * 0.6);
        ctx.lineTo(tipx - dirx * head + diry * head * 0.6, tipy - diry * head - dirx * head * 0.6);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      };
      ctx.lineWidth = 1.6 / this.viewScale;
      drawArrow(nx, ny);
      if (t.direction === 'both') drawArrow(-nx, -ny);

      // 端点 A / B 标记
      const drawEndpoint = (x, y, label) => {
        ctx.beginPath();
        ctx.arc(x, y, 4.5 / this.viewScale, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.lineWidth = 2 / this.viewScale;
        ctx.strokeStyle = color;
        ctx.stroke();
        const fs = 10 / this.viewScale;
        ctx.font = `bold ${fs}px sans-serif`;
        const tw2 = ctx.measureText(label).width;
        const pad = 3 / this.viewScale;
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(x + 6 / this.viewScale, y - fs - pad, tw2 + pad * 2, fs + pad * 2);
        ctx.fillStyle = '#fff';
        ctx.fillText(label, x + 6 / this.viewScale + pad, y - pad);
      };
      drawEndpoint(ax, ay, 'A');
      drawEndpoint(bx, by, 'B');

      if (t.name) {
        const fs = 11 / this.viewScale;
        ctx.font = `${fs}px sans-serif`;
        const tw3 = ctx.measureText(t.name).width;
        const pad = 4 / this.viewScale;
        ctx.fillStyle = color;
        ctx.fillRect(mx + 8 / this.viewScale, my + 6 / this.viewScale, tw3 + pad * 2, fs + pad * 2);
        ctx.fillStyle = '#fff';
        ctx.fillText(t.name, mx + 8 / this.viewScale + pad, my + 6 / this.viewScale + fs + pad / 2);
      }
    },
    drawPolygon(ctx, points, fill, stroke, close, dashed) {
      if (!points || !points.length) return;
      const W = this.canvasW;
      const H = this.canvasH;
      ctx.beginPath();
      points.forEach((p, i) => {
        const x = p.x * W;
        const y = p.y * H;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      if (close && points.length >= 3) ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = 2 / this.viewScale;
      ctx.strokeStyle = stroke;
      if (dashed) {
        ctx.setLineDash([7 / this.viewScale, 5 / this.viewScale]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    },
    drawVertexHandles(ctx, points, highlight, color) {
      if (!points || !points.length) return;
      const W = this.canvasW;
      const H = this.canvasH;
      const stroke = color || (highlight ? '#ff4d4f' : '#ff7875');
      const radius = (highlight ? 5 : 4) / this.viewScale;
      points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.lineWidth = 2 / this.viewScale;
        ctx.strokeStyle = stroke;
        ctx.stroke();
      });
    },
    drawRegionLabel(ctx, points, text, invert) {
      if (!points || !points.length || !text) return;
      const W = this.canvasW;
      const H = this.canvasH;
      let maxY = -Infinity;
      let anchor = points[0];
      points.forEach(p => {
        if (p.y > maxY) {
          maxY = p.y;
          anchor = p;
        }
      });
      const x = anchor.x * W + 6 / this.viewScale;
      const y = anchor.y * H - 6 / this.viewScale;
      const padX = 6 / this.viewScale;
      const padY = 3 / this.viewScale;
      const fontSize = 11 / this.viewScale;
      ctx.font = `${fontSize}px sans-serif`;
      const tw = ctx.measureText(text).width;
      ctx.fillStyle = invert ? '#fa8c16' : '#ff4d4f';
      ctx.fillRect(x - padX, y - fontSize - padY, tw + padX * 2, fontSize + 3 / this.viewScale + padY * 2);
      ctx.fillStyle = '#fff';
      ctx.fillText(text, x, y);
    },
    confirm() {
      if (this.drawing && this.tool === 'polygon') this.finishPolygon();
      if (this.drawing && this.tool === 'tripwire') this.cancelDrawing();
      const fence = {
        regions: this.regions.map((r, i) => ({
          name: this.regionBaseName(r, i),
          ratio: r.ratio,
          invert: r.invert,
          visible: r.visible,
          points: r.points
        }))
      };
      if (this.tripwires.length) {
        fence.tripwires = this.tripwires.map((t, i) => ({
          name: (t.name || '').trim() || `L${i + 1}`,
          direction: t.direction || 'ab',
          visible: t.visible,
          line: t.line
        }));
      }
      this.$emit('confirm', fence);
      this.innerVisible = false;
    }
  }
};
</script>

<style scoped>
.fence-header {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 16px;
}
.fence-header__title {
  font-size: 17px;
  font-weight: 600;
  color: #1f2329;
  flex: 1;
  letter-spacing: 0.2px;
}
.fence-header__guide {
  border: none;
  background: none;
  color: #3370ff;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 6px;
  transition: background 0.15s;
}
.fence-header__guide:hover { background: #eef3ff; }
.fence-header__close {
  font-size: 18px;
  color: #8f959e;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.15s;
}
.fence-header__close:hover { color: #1f2329; background: #f2f3f5; }

.fence-body {
  display: flex;
  gap: 14px;
  height: 560px;
  position: relative;
  text-align: left;
}

.canvas-section {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(31, 35, 41, 0.04);
}

.canvas-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #fafbfc;
  border-bottom: 1px solid #eef0f3;
  flex-shrink: 0;
}
.canvas-toolbar__left {
  display: flex;
  align-items: center;
  gap: 4px;
}
.tool-item { display: contents; }
.tool-divider {
  width: 1px;
  height: 28px;
  background: #e5e6eb;
  margin: 0 6px;
}
.tool-btn-wrap { display: inline-flex; }
.tool-btn {
  min-width: 52px;
  height: 52px;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border-radius: 6px;
  cursor: pointer;
  color: #646a73;
  transition: all 0.15s;
  padding: 4px 6px;
}
.tool-btn:hover:not(.disabled) { background: #eef3ff; color: #3370ff; }
.tool-btn.active { background: #e8f0ff; color: #3370ff; }
.tool-btn.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.tool-btn.disabled:hover { background: #f5f6f7; color: #646a73; }
.tool-btn__icon { display: flex; align-items: center; justify-content: center; line-height: 1; }
.tool-btn__label {
  font-size: 11px;
  line-height: 1;
  transform: scale(0.92);
  white-space: nowrap;
}

.refresh-btn {
  border: 1px solid #dbeafe;
  background: #fff;
  color: #3370ff;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.15s;
}
.refresh-btn:hover { background: #eef3ff; border-color: #3370ff; }

.canvas-viewport {
  position: relative;
  flex: 1;
  min-height: 0;
  background: #111318;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.canvas-viewport.is-panning { user-select: none; }

.roi-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  font-size: 12px;
  color: #646a73;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(4px);
}
.roi-badge__icon { color: #8f959e; }
.roi-badge__label { font-weight: 600; color: #1f2329; }
.roi-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c9cdd4;
}
.roi-badge__dot.is-drawn { background: #34c759; }
.roi-badge__status { color: #8f959e; }

.fence-canvas {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}

.canvas-tip {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.72);
  color: #fff;
  font-size: 12px;
  padding: 7px 16px;
  border-radius: 18px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 2;
}
.canvas-tip--muted { background: rgba(0, 0, 0, 0.5); }

.fence-list {
  width: 318px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 2px rgba(31, 35, 41, 0.04);
}
.fence-list__head {
  font-size: 14px;
  font-weight: 600;
  color: #1f2329;
  margin-bottom: 6px;
}
.fence-list__desc {
  font-size: 11px;
  color: #8f959e;
  line-height: 1.6;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f1f3;
}

.fence-items {
  flex: 1;
  overflow-y: auto;
  padding-right: 2px;
}
.fence-items::-webkit-scrollbar { width: 3px; }
.fence-items::-webkit-scrollbar-thumb { background: #dcdfe6; border-radius: 3px; }

.fence-item {
  border: 1px solid #e8eaed;
  border-radius: 6px;
  margin-bottom: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, opacity 0.15s;
  background: #fff;
}
.fence-item:hover { border-color: #c9cdd4; }
.fence-item.active {
  border-color: #3370ff;
  box-shadow: 0 0 0 1px #3370ff;
}
.fence-item.hidden { opacity: 0.45; }

.fence-item__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #fafbfc;
  border-bottom: 1px solid #f0f1f3;
}
.fence-item__head >>> .el-checkbox {
  display: flex;
  align-items: center;
  margin-right: 0;
}
.fence-item__head >>> .el-checkbox__label {
  padding-left: 6px;
  line-height: 1;
}
.fence-item__type {
  font-size: 13px;
  font-weight: 600;
  color: #1f2329;
}
.fence-item__ops {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}
.fence-item__ops i {
  cursor: pointer;
  color: #a8abb2;
  font-size: 15px;
  transition: color 0.15s;
}
.fence-item__ops i:hover { color: #3370ff; }
.fence-item__ops i.off { opacity: 0.35; }
.fence-item__ops .el-icon-delete:hover { color: #f54a45; }

.fence-item__body {
  padding: 10px 12px 12px;
}
.fence-field--row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.fence-field--row:last-child { margin-bottom: 0; }
.fence-field__label {
  width: 78px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  color: #606266;
  margin: 0;
}
.fence-field__control {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}
.fence-field__control >>> .el-input__inner {
  height: 28px;
  line-height: 28px;
  font-size: 12px;
}
.fence-field__ratio {
  flex: 1;
  width: auto !important;
}
.fence-field__ratio >>> .el-input__inner {
  height: 28px;
  line-height: 28px;
  padding-left: 8px;
  padding-right: 32px;
  font-size: 12px;
}
.fence-field__invert >>> .el-checkbox__label {
  font-size: 12px;
  color: #606266;
  padding-left: 6px;
}
.invert-tag {
  flex-shrink: 0;
  font-size: 11px;
  color: #fa8c16;
  white-space: nowrap;
}
.req { color: #f54a45; }
.field-help-wrap {
  display: inline-flex;
  align-items: center;
  cursor: help;
  line-height: 1;
}
.field-help {
  color: #a8abb2;
  font-size: 13px;
  cursor: help;
}
.field-help:hover { color: #3370ff; }

.fence-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 16px;
  border: 1px dashed #e5e6eb;
  border-radius: 8px;
  background: #fafbfc;
}
.fence-empty__icon { margin-bottom: 14px; opacity: 0.7; }
.fence-empty p { font-size: 13px; color: #8f959e; margin: 0; }

.guide-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 380px;
  background: linear-gradient(180deg, #1e2433 0%, #171b26 100%);
  color: #e8eaed;
  z-index: 20;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.18);
  border-left: 1px solid rgba(255, 255, 255, 0.06);
}
.guide-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 15px;
  font-weight: 600;
}
.guide-panel__head i {
  cursor: pointer;
  color: rgba(255, 255, 255, 0.55);
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
}
.guide-panel__head i:hover { color: #fff; background: rgba(255, 255, 255, 0.08); }
.guide-panel__body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 18px 20px;
}
.guide-intro {
  font-size: 13px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.88);
  margin: 0 0 12px;
}
.guide-list {
  margin: 0 0 16px;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.85;
  color: rgba(255, 255, 255, 0.76);
}
.guide-list li { margin-bottom: 8px; }

.guide-carousel {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 14px;
}
.guide-carousel__tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}
.guide-carousel__tab {
  flex: 1;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.65);
  font-size: 12px;
  padding: 6px 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}
.guide-carousel__tab:hover {
  color: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.2);
}
.guide-carousel__tab.active {
  color: #fff;
  background: rgba(51, 112, 255, 0.35);
  border-color: rgba(51, 112, 255, 0.6);
}
.guide-carousel__viewer {
  display: flex;
  align-items: center;
  gap: 6px;
}
.guide-carousel__arrow {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.guide-carousel__arrow:hover {
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
}
.guide-carousel__slide {
  flex: 1;
  min-width: 0;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  overflow: hidden;
}
.guide-carousel__img {
  display: block;
  width: 100%;
  height: 160px;
  object-fit: contain;
  background: #0f1218;
}
.guide-carousel__caption {
  margin: 0;
  padding: 8px 10px;
  font-size: 11px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.68);
  text-align: center;
}
.guide-carousel__dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 10px;
}
.guide-carousel__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  cursor: pointer;
  transition: all 0.15s;
}
.guide-carousel__dot.active {
  width: 16px;
  border-radius: 3px;
  background: #3370ff;
}
.guide-carousel__dot:hover { background: rgba(255, 255, 255, 0.45); }

.guide-slide-enter-active,
.guide-slide-leave-active { transition: transform 0.22s ease, opacity 0.22s ease; }
.guide-slide-enter,
.guide-slide-leave-to { transform: translateX(16px); opacity: 0; }

.fence-footer { padding-top: 2px; }
</style>

<style>
.fence-dialog .el-dialog__header {
  padding: 14px 20px;
  border-bottom: 1px solid #eef0f3;
  text-align: left;
  background: #fff;
}
.fence-dialog .el-dialog__body {
  padding: 14px 16px;
  text-align: left;
  background: #f7f8fa;
}
.fence-dialog .el-dialog__footer {
  border-top: 1px solid #eef0f3;
  padding: 12px 20px;
  text-align: right;
  background: #fff;
}

/* 绘制窗口全屏 */
body.fence-drawer-fullscreen .v-modal {
  opacity: 1;
}
body.fence-drawer-fullscreen .el-dialog__wrapper {
  overflow: hidden;
}
.fence-dialog.is-dialog-fullscreen {
  width: 100vw !important;
  max-width: 100vw !important;
  height: 100vh !important;
  margin: 0 !important;
  top: 0 !important;
  left: 0 !important;
  transform: none !important;
  border-radius: 0 !important;
  display: flex;
  flex-direction: column;
}
.fence-dialog.is-dialog-fullscreen .el-dialog__header,
.fence-dialog.is-dialog-fullscreen .el-dialog__footer {
  flex-shrink: 0;
}
.fence-dialog.is-dialog-fullscreen .el-dialog__body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 10px 14px !important;
}
.fence-dialog.is-dialog-fullscreen .fence-body {
  flex: 1;
  height: auto !important;
  min-height: 0;
}
.fence-dialog.is-dialog-fullscreen .canvas-section {
  min-height: 0;
}
.fence-dialog.is-dialog-fullscreen .canvas-viewport {
  min-height: 0;
}
.fence-dialog.is-dialog-fullscreen .fence-list {
  max-height: none;
}
.fence-dialog.is-dialog-fullscreen .fence-items {
  max-height: none;
}

.fence-ratio-tooltip {
  max-width: 320px;
  line-height: 1.7;
  font-size: 12px;
  z-index: 99999 !important;
}
body > .fence-float-tip {
  position: fixed;
  z-index: 99999;
  max-width: 280px;
  padding: 8px 12px;
  background: #303133;
  color: #fff;
  font-size: 12px;
  line-height: 1.6;
  border-radius: 4px;
  pointer-events: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.18);
}
</style>
