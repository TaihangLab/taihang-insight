<template>
  <div class="th-composer" :class="{ focused: focused }">
    <el-input
      ref="input"
      :value="value"
      type="textarea"
      :autosize="{ minRows: 1, maxRows: 8 }"
      :placeholder="placeholder"
      resize="none"
      class="th-composer-input"
      @input="$emit('input', $event)"
      @focus="focused = true"
      @blur="focused = false"
      @keydown.native="onKeydown"
    />
    <button
      v-if="streaming"
      type="button"
      class="th-composer-btn stop"
      title="停止生成"
      @click="$emit('stop')"
    >
      <span class="stop-square" />
    </button>
    <button
      v-else
      type="button"
      class="th-composer-btn send"
      :disabled="!canSend"
      title="发送"
      @click="trySend"
    >
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 20V5M12 5L5.5 11.5M12 5L18.5 11.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>
</template>

<script>
export default {
  name: 'ChatComposer',
  props: {
    value: { type: String, default: '' },
    streaming: { type: Boolean, default: false },
    placeholder: { type: String, default: '询问任何问题' },
  },
  data() {
    return { focused: false };
  },
  computed: {
    canSend() {
      return !!this.value.trim();
    },
  },
  methods: {
    onKeydown(e) {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) {
        e.preventDefault();
        this.trySend();
      }
    },
    trySend() {
      if (this.streaming || !this.canSend) return;
      this.$emit('send', this.value.trim());
    },
    focus() {
      const input = this.$refs.input;
      if (input) input.focus();
    },
  },
};
</script>

<style scoped>
.th-composer {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px 12px 12px 20px;
  background: #fff;
  border: 1px solid #e3e3e3;
  border-radius: 28px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.th-composer.focused {
  border-color: #c8c8c8;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.th-composer-input {
  flex: 1;
  min-width: 0;
}

.th-composer-input >>> .el-textarea__inner {
  border: none !important;
  background: transparent !important;
  padding: 4px 0 !important;
  font-size: 15px;
  line-height: 1.6;
  color: #0d0d0d;
  box-shadow: none !important;
  font-family: inherit;
}

.th-composer-input >>> .el-textarea__inner::placeholder {
  color: #9b9b9b;
}

.th-composer-btn {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, opacity 0.15s;
}

.th-composer-btn.send {
  background: #0d0d0d;
  color: #fff;
}

.th-composer-btn.send svg {
  width: 18px;
  height: 18px;
}

.th-composer-btn.send:hover:not(:disabled) {
  background: #3d3d3d;
}

.th-composer-btn.send:disabled {
  background: #ececec;
  color: #b4b4b4;
  cursor: not-allowed;
}

.th-composer-btn.stop {
  background: #0d0d0d;
}

.th-composer-btn.stop:hover {
  background: #3d3d3d;
}

.stop-square {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: #fff;
}
</style>
