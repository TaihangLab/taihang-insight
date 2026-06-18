<template>
  <div class="fence-preview" v-show="ready">
    <canvas ref="canvas" class="fence-preview__canvas"></canvas>
  </div>
</template>

<script>
/**
 * 围栏预览：在点位快照上叠加渲染已绘制的电子围栏（多边形区域 + 绊线）。
 * 坐标为相对图像内容的归一化值（0~1），与 FenceDrawer 绘制时一致。
 * 快照加载失败但已有围栏时，退化为深色底图继续渲染围栏；
 * 两者都没有时整体隐藏，露出父容器的占位提示。
 */
const FALLBACK_W = 1280;
const FALLBACK_H = 720;

export default {
  name: 'FencePreview',
  props: {
    src: { type: String, default: '' },
    fence: { type: Object, default: null }
  },
  data() {
    return {
      ready: false,
      img: null,
      loadToken: 0
    };
  },
  computed: {
    regions() {
      const f = this.fence || {};
      if (Array.isArray(f.regions) && f.regions.length) return f.regions;
      // 兼容旧格式：仅有 points 的单区域围栏
      if (Array.isArray(f.points) && f.points.length >= 3) {
        return [{ name: '', points: f.points }];
      }
      return [];
    },
    tripwires() {
      const f = this.fence || {};
      return Array.isArray(f.tripwires) ? f.tripwires : [];
    },
    hasFence() {
      return this.regions.some(r => (r.points || []).length >= 3)
        || this.tripwires.some(t => (t.line || t.points || []).length >= 2);
    }
  },
  watch: {
    src: {
      handler() { this.loadImage(); },
      immediate: true
    },
    fence: {
      handler() { this.draw(); },
      deep: true
    }
  },
  methods: {
    loadImage() {
      const token = ++this.loadToken;
      this.img = null;
      if (!this.src) { this.draw(); return; }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (token !== this.loadToken) return;
        this.img = img;
        this.draw();
      };
      img.onerror = () => {
        if (token !== this.loadToken) return;
        this.img = null;
        this.draw();
      };
      img.src = this.src;
    },
    draw() {
      if (!this.img && !this.hasFence) {
        this.ready = false;
        return;
      }
      this.ready = true;
      this.$nextTick(() => this.render());
    },
    render() {
      const canvas = this.$refs.canvas;
      if (!canvas) return;
      const img = this.img;
      const W = img ? (img.naturalWidth || FALLBACK_W) : FALLBACK_W;
      const H = img ? (img.naturalHeight || FALLBACK_H) : FALLBACK_H;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      if (img) {
        try { ctx.drawImage(img, 0, 0, W, H); } catch (e) { /* ignore */ }
      } else {
        ctx.fillStyle = '#1a2030';
        ctx.fillRect(0, 0, W, H);
      }
      // 线宽/字号随图像分辨率等比放大，保证显示尺寸下观感一致
      const k = Math.max(1, W / 740);
      this.regions.forEach((r, i) => {
        if (r.visible === false) return;
        const points = r.points || [];
        if (points.length < 3) return;
        this.drawRegion(ctx, r, points, W, H, k, i);
      });
      this.tripwires.forEach(t => {
        if (t.visible === false) return;
        const line = t.line || t.points || [];
        if (line.length < 2) return;
        this.drawTripwire(ctx, t, line, W, H, k);
      });
    },
    drawRegion(ctx, r, points, W, H, k, index) {
      const invert = !!r.invert;
      const stroke = invert ? '#e6a23c' : '#ff4d4f';
      const fill = invert ? 'rgba(250,140,22,0.24)' : 'rgba(255,77,79,0.22)';

      ctx.beginPath();
      points.forEach((p, i) => {
        const x = p.x * W;
        const y = p.y * H;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = 2 * k;
      ctx.strokeStyle = stroke;
      ctx.setLineDash(invert ? [7 * k, 5 * k] : []);
      ctx.stroke();
      ctx.setLineDash([]);

      // 顶点
      points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, 4 * k, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.lineWidth = 2 * k;
        ctx.strokeStyle = stroke;
        ctx.stroke();
      });

      // 名称标签：跟随最低顶点
      const name = (r.name || '').trim();
      const text = name ? (invert ? `${name}（反选）` : name) : '';
      if (!text) return;
      let anchor = points[0];
      points.forEach(p => { if (p.y > anchor.y) anchor = p; });
      const fontSize = 11 * k;
      const padX = 6 * k;
      const padY = 3 * k;
      const x = anchor.x * W + 6 * k;
      const y = anchor.y * H - 6 * k;
      ctx.font = `${fontSize}px sans-serif`;
      const tw = ctx.measureText(text).width;
      ctx.fillStyle = invert ? '#fa8c16' : '#ff4d4f';
      ctx.fillRect(x - padX, y - fontSize - padY, tw + padX * 2, fontSize + 3 * k + padY * 2);
      ctx.fillStyle = '#fff';
      ctx.fillText(text, x, y);
    },
    drawTripwire(ctx, t, line, W, H, k) {
      const ax = line[0].x * W; const ay = line[0].y * H;
      const bx = line[1].x * W; const by = line[1].y * H;
      const color = '#52c41a';

      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.lineWidth = 2 * k;
      ctx.strokeStyle = color;
      ctx.stroke();

      // 方向箭头：线段中点，沿跨线方向（与 FenceDrawer / 后端叉积判定一致）
      const mx = (ax + bx) / 2; const my = (ay + by) / 2;
      const len = Math.hypot(bx - ax, by - ay) || 1;
      let nx = -(by - ay) / len; let ny = (bx - ax) / len;
      if (t.direction === 'ba') { nx = -nx; ny = -ny; }
      const drawArrow = (dirx, diry) => {
        const alen = 16 * k;
        const tipx = mx + dirx * alen; const tipy = my + diry * alen;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(tipx, tipy);
        ctx.lineWidth = 1.6 * k;
        ctx.strokeStyle = color;
        ctx.stroke();
        const head = 5 * k;
        ctx.beginPath();
        ctx.moveTo(tipx, tipy);
        ctx.lineTo(tipx - dirx * head - diry * head * 0.6, tipy - diry * head + dirx * head * 0.6);
        ctx.lineTo(tipx - dirx * head + diry * head * 0.6, tipy - diry * head - dirx * head * 0.6);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      };
      drawArrow(nx, ny);
      if (t.direction === 'both') drawArrow(-nx, -ny);

      // 端点 A / B 标记
      const drawEndpoint = (x, y, label) => {
        ctx.beginPath();
        ctx.arc(x, y, 4.5 * k, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.lineWidth = 2 * k;
        ctx.strokeStyle = color;
        ctx.stroke();
        const fs = 10 * k;
        ctx.font = `bold ${fs}px sans-serif`;
        const tw = ctx.measureText(label).width;
        const pad = 3 * k;
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(x + 6 * k, y - fs - pad, tw + pad * 2, fs + pad * 2);
        ctx.fillStyle = '#fff';
        ctx.fillText(label, x + 6 * k + pad, y - pad);
      };
      drawEndpoint(ax, ay, 'A');
      drawEndpoint(bx, by, 'B');

      const name = (t.name || '').trim();
      if (name) {
        const fs = 11 * k;
        ctx.font = `${fs}px sans-serif`;
        const tw = ctx.measureText(name).width;
        const pad = 4 * k;
        ctx.fillStyle = color;
        ctx.fillRect(mx + 8 * k, my + 6 * k, tw + pad * 2, fs + pad * 2);
        ctx.fillStyle = '#fff';
        ctx.fillText(name, mx + 8 * k + pad, my + 6 * k + fs + pad / 2);
      }
    }
  }
};
</script>

<style scoped>
.fence-preview {
  position: absolute;
  inset: 0;
  z-index: 1;
}
.fence-preview__canvas {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
