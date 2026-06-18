<template>
  <div
    class="floating-launcher"
    :class="{
      expanded: isExpanded,
      hidden: isAutoHidden && !isHovering && !drawerOpen,
      'is-dragging': isDragging,
      'drawer-open': drawerOpen,
      'on-left': position.side === 'left',
      'on-right': position.side === 'right',
    }"
    :style="ballStyle"
    @mousedown="startDrag"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @click="onClick"
  >
    <div class="launcher-core">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 19L6 9L10 13L14 7L18 11L22 19H2Z" fill="currentColor" fill-opacity="0.15"/>
        <path d="M2 19L6 9L10 13L14 7L18 11L22 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="6" r="2" fill="currentColor" opacity="0.85"/>
      </svg>
      <span v-if="online !== null" class="launcher-status" :class="online ? 'online' : 'offline'" />
    </div>
    <div v-if="showTooltip" class="launcher-tooltip" :class="position.side">太行·问道</div>
  </div>
</template>

<script>
const BALL_SIZE = 56;
const SIDE_MARGIN = 10;

export default {
  name: 'FloatingLauncher',
  props: {
    online: { type: Boolean, default: null },
    drawerOpen: { type: Boolean, default: false },
  },
  data() {
    return {
      position: { x: 0, y: 100, side: 'right' },
      tempPosition: null,
      isDragging: false,
      dragged: false,
      dragStart: { x: 0, y: 0 },
      dragOffset: { x: 0, y: 0 },
      isExpanded: false,
      showTooltip: false,
      isHovering: false,
      isAutoHidden: false,
      hideTimer: null,
    };
  },
  computed: {
    ballStyle() {
      const pos = this.isDragging && this.tempPosition ? this.tempPosition : this.position;
      return { left: pos.x + 'px', top: pos.y + 'px' };
    },
  },
  watch: {
    drawerOpen(open) {
      if (open) {
        this.showAssistant();
      } else {
        this.startHideTimer();
      }
    },
  },
  mounted() {
    this.initializePosition();
    window.addEventListener('resize', this.handleWindowResize);
    this.startHideTimer();
    // 挂到 body，避免被全屏 Drawer 遮挡
    if (this.$el && this.$el.parentNode !== document.body) {
      document.body.appendChild(this.$el);
    }
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleWindowResize);
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.stopDrag);
    this.clearHideTimer();
    if (this.$el && this.$el.parentNode === document.body) {
      document.body.removeChild(this.$el);
    }
  },
  methods: {
    initializePosition() {
      this.snapToSide('right', 100);
    },

    snapToSide(side, y) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const clampedY = Math.max(SIDE_MARGIN, Math.min(y, windowHeight - BALL_SIZE - SIDE_MARGIN));
      this.position = {
        x: side === 'left' ? SIDE_MARGIN : windowWidth - BALL_SIZE - SIDE_MARGIN,
        y: clampedY,
        side,
      };
    },

    handleWindowResize() {
      const y = this.position.y;
      this.snapToSide(this.position.side, y);
    },

    onMouseEnter() {
      this.isHovering = true;
      this.showTooltip = true;
      this.isExpanded = true;
      this.showAssistant();
    },

    onMouseLeave() {
      this.isHovering = false;
      this.showTooltip = false;
      this.isExpanded = false;
      this.startHideTimer();
    },

    onClick() {
      if (!this.dragged) this.$emit('toggle');
    },

    startDrag(e) {
      this.isDragging = true;
      this.dragged = false;
      this.dragStart = { x: e.clientX, y: e.clientY };
      const pos = this.position;
      this.dragOffset = { x: e.clientX - pos.x, y: e.clientY - pos.y };
      this.tempPosition = { x: pos.x, y: pos.y };
      this.showAssistant();
      document.addEventListener('mousemove', this.onDrag);
      document.addEventListener('mouseup', this.stopDrag);
      e.preventDefault();
    },

    onDrag(e) {
      if (!this.isDragging) return;
      const dx = e.clientX - this.dragStart.x;
      const dy = e.clientY - this.dragStart.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) this.dragged = true;

      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      this.tempPosition = {
        x: Math.max(SIDE_MARGIN, Math.min(mouseX - this.dragOffset.x, windowWidth - BALL_SIZE - SIDE_MARGIN)),
        y: Math.max(SIDE_MARGIN, Math.min(mouseY - this.dragOffset.y, windowHeight - BALL_SIZE - SIDE_MARGIN)),
      };
    },

    stopDrag() {
      this.isDragging = false;
      document.removeEventListener('mousemove', this.onDrag);
      document.removeEventListener('mouseup', this.stopDrag);

      if (this.tempPosition) {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const centerX = this.tempPosition.x + BALL_SIZE / 2;
        const isLeft = centerX < windowWidth / 2;
        const y = Math.max(SIDE_MARGIN, Math.min(this.tempPosition.y, windowHeight - BALL_SIZE - SIDE_MARGIN));

        this.position = {
          x: isLeft ? SIDE_MARGIN : windowWidth - BALL_SIZE - SIDE_MARGIN,
          y,
          side: isLeft ? 'left' : 'right',
        };
        this.tempPosition = null;
      }

      setTimeout(() => { this.dragged = false; }, 150);
      this.startHideTimer();
    },

    startHideTimer() {
      if (this.drawerOpen || this.isHovering) return;
      this.clearHideTimer();
      this.hideTimer = setTimeout(() => this.hideAssistant(), 3000);
    },

    clearHideTimer() {
      if (this.hideTimer) {
        clearTimeout(this.hideTimer);
        this.hideTimer = null;
      }
    },

    showAssistant() {
      this.isAutoHidden = false;
      this.clearHideTimer();
    },

    hideAssistant() {
      if (this.isHovering || this.drawerOpen) return;
      this.isAutoHidden = true;
    },
  },
};
</script>

<style scoped>
.floating-launcher {
  position: fixed;
  z-index: 10050;
  width: 56px;
  height: 56px;
  cursor: pointer;
  transition: left 0.35s cubic-bezier(0.25, 0.8, 0.25, 1),
              top 0.35s cubic-bezier(0.25, 0.8, 0.25, 1),
              transform 0.2s,
              opacity 0.3s;
}
.floating-launcher.is-dragging {
  transition: transform 0.2s, opacity 0.3s;
}
.floating-launcher.hidden {
  opacity: 0.35;
  transform: translateX(0);
}
.floating-launcher.hidden.on-right {
  transform: translateX(calc(100% - 18px));
}
.floating-launcher.hidden.on-left {
  transform: translateX(calc(-100% + 18px));
}
.floating-launcher.drawer-open {
  opacity: 1;
  transform: none;
}
.floating-launcher.drawer-open.on-right {
  transform: none;
}
.floating-launcher.drawer-open.on-left {
  transform: none;
}
.floating-launcher.drawer-open.expanded {
  transform: scale(1.08);
}
.launcher-core {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409EFF, #337ecc);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.launcher-core svg { width: 28px; height: 28px; }
.launcher-status {
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid #fff;
}
.launcher-status.online { background: #10a37f; }
.launcher-status.offline { background: #f56c6c; }
.launcher-tooltip {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: #303133;
  color: #fff;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  white-space: nowrap;
  pointer-events: none;
}
.launcher-tooltip.right {
  right: 64px;
  left: auto;
}
.launcher-tooltip.left {
  left: 64px;
  right: auto;
}
</style>
