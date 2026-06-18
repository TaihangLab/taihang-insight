<template>
  <!-- 用户消息：右侧浅灰气泡 -->
  <div v-if="message.role === 'user'" class="th-msg th-msg-user">
    <div class="th-user-bubble">{{ message.text }}</div>
    <div class="th-msg-actions user">
      <button type="button" class="th-action-btn" title="复制" @click="copyText(message.text)">
        <i class="el-icon-document-copy" />
      </button>
    </div>
  </div>

  <!-- 助手消息：平铺块时间线 -->
  <div v-else class="th-msg th-msg-assistant">
    <template v-for="(block, idx) in message.blocks">
      <think-block
        v-if="block.type === 'think'"
        :key="'b' + idx"
        :text="block.text"
        :done="block.done"
      />
      <tool-call-chip
        v-else-if="block.type === 'tool'"
        :key="'b' + idx"
        :block="block"
      />
      <div
        v-else
        :key="'b' + idx"
        class="th-md"
        @click="onContentClick"
        v-html="block.html"
      />
    </template>

    <div v-if="showTyping" class="th-typing">
      <span /><span /><span />
    </div>

    <div v-if="message.error" class="th-msg-error">
      <i class="el-icon-warning-outline" />
      回答生成失败，请检查助手服务后重试
    </div>

    <div v-if="!message.streaming && answerText" class="th-msg-actions">
      <button type="button" class="th-action-btn" :title="copied ? '已复制' : '复制'" @click="copyText(answerText)">
        <i :class="copied ? 'el-icon-check' : 'el-icon-document-copy'" />
      </button>
    </div>
  </div>
</template>

<script>
import ThinkBlock from './ThinkBlock.vue';
import ToolCallChip from './ToolCallChip.vue';
import { extractAnswerText } from '../services/messageAdapter';
import '../styles/markdown.css';

function writeClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      resolve();
    } catch (e) {
      reject(e);
    } finally {
      document.body.removeChild(ta);
    }
  });
}

export default {
  name: 'MessageItem',
  components: { ThinkBlock, ToolCallChip },
  props: {
    message: { type: Object, required: true },
  },
  data() {
    return { copied: false };
  },
  computed: {
    answerText() {
      return extractAnswerText(this.message.blocks);
    },
    showTyping() {
      if (!this.message.streaming) return false;
      const blocks = this.message.blocks || [];
      const last = blocks[blocks.length - 1];
      // 尚无任何输出，或工具执行中等待下一轮回答
      return !last || (last.type === 'tool' && !last.done);
    },
  },
  methods: {
    copyText(text) {
      if (!text) return;
      writeClipboard(text).then(() => {
        this.copied = true;
        setTimeout(() => { this.copied = false; }, 1500);
      }).catch(() => {});
    },
    onContentClick(e) {
      const copyBtn = e.target.closest && e.target.closest('.th-code-copy');
      if (!copyBtn) return;
      const codeBlock = copyBtn.closest('.th-code-block');
      const code = codeBlock && codeBlock.querySelector('code');
      if (!code) return;
      writeClipboard(code.textContent || '').then(() => {
        const original = copyBtn.textContent;
        copyBtn.textContent = '已复制';
        setTimeout(() => { copyBtn.textContent = original; }, 1500);
      }).catch(() => {});
    },
  },
};
</script>

<style scoped>
.th-msg {
  margin: 18px 0;
}

/* ---- 用户消息 ---- */
.th-msg-user {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.th-user-bubble {
  max-width: 72%;
  padding: 10px 18px;
  background: #f4f4f4;
  color: #0d0d0d;
  font-size: 15px;
  line-height: 1.7;
  border-radius: 22px;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ---- 助手消息 ---- */
.th-msg-assistant {
  color: #0d0d0d;
}

/* ---- 操作按钮 ---- */
.th-msg-actions {
  display: flex;
  gap: 4px;
  margin-top: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.th-msg:hover .th-msg-actions {
  opacity: 1;
}

.th-action-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: #8f8f8f;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.th-action-btn:hover {
  background: #ececec;
  color: #0d0d0d;
}

/* ---- 打字指示 ---- */
.th-typing {
  display: inline-flex;
  gap: 5px;
  padding: 8px 0;
}

.th-typing span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #c8c8c8;
  animation: th-bounce 1.2s ease-in-out infinite;
}

.th-typing span:nth-child(2) { animation-delay: 0.15s; }
.th-typing span:nth-child(3) { animation-delay: 0.3s; }

@keyframes th-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
  30% { transform: translateY(-4px); opacity: 1; }
}

/* ---- 错误提示 ---- */
.th-msg-error {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 8px 14px;
  background: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 10px;
  font-size: 13px;
  color: #f56c6c;
}
</style>
