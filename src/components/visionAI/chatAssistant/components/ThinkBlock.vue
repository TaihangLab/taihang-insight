<template>
  <div class="th-think" :class="{ open: expanded }">
    <button type="button" class="th-think-toggle" @click="toggle">
      <span v-if="!done" class="th-think-label thinking">思考中…</span>
      <span v-else class="th-think-label">已深度思考</span>
      <i class="el-icon-arrow-down th-think-arrow" :class="{ flipped: expanded }" />
    </button>
    <div v-if="expanded" ref="body" class="th-think-body">{{ text }}</div>
  </div>
</template>

<script>
export default {
  name: 'ThinkBlock',
  props: {
    text: { type: String, default: '' },
    done: { type: Boolean, default: false },
  },
  data() {
    return {
      // 思考进行中默认展开，结束后默认折叠；用户手动操作后以用户为准
      userToggled: false,
      manualExpanded: false,
    };
  },
  computed: {
    expanded() {
      if (this.userToggled) return this.manualExpanded;
      return !this.done;
    },
  },
  watch: {
    text() {
      if (this.expanded && !this.done) {
        this.$nextTick(() => {
          const el = this.$refs.body;
          if (el) el.scrollTop = el.scrollHeight;
        });
      }
    },
  },
  methods: {
    toggle() {
      this.manualExpanded = !this.expanded;
      this.userToggled = true;
    },
  },
};
</script>

<style scoped>
.th-think {
  margin: 4px 0 12px;
}

.th-think-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: #8f8f8f;
}

.th-think-toggle:hover {
  color: #5d5d5d;
}

.th-think-label.thinking {
  background: linear-gradient(90deg, #8f8f8f 25%, #c8c8c8 50%, #8f8f8f 75%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: th-shimmer 1.6s linear infinite;
}

@keyframes th-shimmer {
  from { background-position: 200% 0; }
  to { background-position: 0 0; }
}

.th-think-arrow {
  font-size: 12px;
  transition: transform 0.2s;
}

.th-think-arrow.flipped {
  transform: rotate(180deg);
}

.th-think-body {
  margin-top: 6px;
  padding: 2px 0 2px 14px;
  border-left: 2px solid #e3e3e3;
  font-size: 13px;
  line-height: 1.7;
  color: #8f8f8f;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 280px;
  overflow-y: auto;
}
</style>
