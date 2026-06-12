<template>
  <div class="th-chat-view">
    <!-- 空会话：欢迎态，输入框居中（ChatGPT 风格） -->
    <div v-if="showWelcome" class="th-welcome">
      <div class="th-welcome-inner">
        <h1 class="th-welcome-title">有什么可以帮您？</h1>
        <p class="th-welcome-desc">我是太行·问道，可以查询摄像头状态、预警信息和 AI 分析任务</p>
        <chat-composer
          ref="welcomeComposer"
          v-model="inputText"
          :streaming="isStreaming"
          @send="sendMessage"
          @stop="handleStop"
        />
        <div class="th-quick-row">
          <button
            v-for="item in quickActions"
            :key="item.text"
            type="button"
            class="th-quick-chip"
            @click="sendMessage(item.text)"
          >
            <span class="th-quick-icon">{{ item.icon }}</span>
            {{ item.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- 会话态：消息列表 + 底部输入框 -->
    <template v-else>
      <div ref="scrollHost" class="th-scroll" @scroll="onScroll">
        <div class="th-column">
          <message-item
            v-for="msg in messages"
            :key="msg.id"
            :message="msg"
          />
        </div>
      </div>

      <transition name="th-fade">
        <button
          v-if="!stickToBottom"
          type="button"
          class="th-to-bottom"
          title="回到底部"
          @click="scrollToBottom(true)"
        >
          <i class="el-icon-arrow-down" />
        </button>
      </transition>

      <div class="th-composer-bar">
        <div class="th-column">
          <chat-composer
            ref="composer"
            v-model="inputText"
            :streaming="isStreaming"
            @send="sendMessage"
            @stop="handleStop"
          />
          <p class="th-composer-hint">太行·问道可能会产生不准确的信息，重要决策请核实平台数据</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import chatApi from '../services/chatApi';
import MessageItem from './MessageItem.vue';
import ChatComposer from './ChatComposer.vue';
import {
  startStream,
  attachSession,
  detachSession,
  stopStream,
  getPartialText,
  getSessionSnapshot,
  subscribeStreamingIds,
  isConversationStreaming,
} from '../services/chatStreamManager';
import { apiMessagesToUi } from '../services/messageAdapter';
import { chatMessage } from '../services/chatUi';

let seq = 0;
function nextId(prefix) {
  seq += 1;
  return `${prefix}-${Date.now()}-${seq}`;
}

export default {
  name: 'ChatView',
  components: { MessageItem, ChatComposer },
  props: {
    conversationId: { type: String, default: null },
  },
  data() {
    return {
      inputText: '',
      messages: [],
      activeConversationId: null,
      assistantMessageId: null,
      streamingMsgId: null,
      historyLoaded: false,
      stickToBottom: true,
      streamingTick: 0,
      quickActions: [
        { icon: '📊', label: '查看系统监控状态', text: '查看系统监控状态' },
        { icon: '📹', label: '现在有多少摄像头在线？', text: '现在有多少摄像头在线？' },
        { icon: '⚠️', label: '最近有哪些预警？', text: '最近有哪些预警？' },
        { icon: '🔧', label: '列出所有 AI 分析任务', text: '列出所有 AI 分析任务' },
      ],
    };
  },
  computed: {
    isStreaming() {
      void this.streamingTick;
      return isConversationStreaming(this.activeConversationId);
    },
    showWelcome() {
      return this.historyLoaded && !this.messages.length && !this.isStreaming;
    },
  },
  watch: {
    conversationId: {
      immediate: true,
      handler(id, oldId) {
        // 新会话首条消息流式中拿到真实 ID：父组件回设 prop，不要清空已渲染消息
        const justCreatedInStream =
          !oldId && id && id === this.activeConversationId && this.messages.length > 0;

        if (!justCreatedInStream && (oldId || this.activeConversationId)) {
          detachSession(oldId || this.activeConversationId);
        }
        this.activeConversationId = id;

        if (justCreatedInStream) {
          this.historyLoaded = true;
          this.$nextTick(() => this.attachStreamingIfNeeded(id));
          return;
        }

        this.streamingMsgId = null;
        this.messages = [];
        this.historyLoaded = false;
        this.$nextTick(async () => {
          if (id) await this.loadHistory(id);
          else this.historyLoaded = true;
          this.attachStreamingIfNeeded(id);
        });
      },
    },
    messages: {
      deep: true,
      handler() {
        this.$nextTick(() => this.scrollToBottom());
      },
    },
  },
  mounted() {
    this._unsubStreaming = subscribeStreamingIds(() => {
      this.streamingTick += 1;
    });
  },
  beforeDestroy() {
    detachSession(this.activeConversationId);
    if (this._unsubStreaming) this._unsubStreaming();
  },
  methods: {
    /* ---------- 滚动 ---------- */
    onScroll() {
      const el = this.$refs.scrollHost;
      if (!el) return;
      this.stickToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    },
    scrollToBottom(force = false) {
      if (!force && !this.stickToBottom) return;
      const el = this.$refs.scrollHost;
      if (el) el.scrollTop = el.scrollHeight;
      if (force) this.stickToBottom = true;
    },

    /* ---------- 历史 ---------- */
    async loadHistory(conversationId) {
      try {
        const res = await chatApi.getMessages(conversationId);
        this.messages = apiMessagesToUi((res.data && res.data.messages) || []);

        // 该会话仍在后台流式中：恢复占位消息和已生成内容
        const snapshot = getSessionSnapshot(conversationId);
        if (snapshot) {
          this.appendPlaceholder();
          this.applyStreamPatch(snapshot);
        }
      } catch (e) {
        chatMessage(this, 'error', '加载历史消息失败');
      } finally {
        this.historyLoaded = true;
        this.$nextTick(() => this.scrollToBottom(true));
      }
    },

    /* ---------- 流式 ---------- */
    appendPlaceholder() {
      const id = nextId('stream');
      this.streamingMsgId = id;
      this.messages.push({
        id,
        role: 'assistant',
        blocks: [],
        streaming: true,
        error: false,
      });
      this.stickToBottom = true;
    },

    applyStreamPatch(patch) {
      const idx = this.messages.findIndex((m) => m.id === this.streamingMsgId);
      if (idx < 0) return;
      this.$set(this.messages, idx, {
        ...this.messages[idx],
        blocks: patch.blocks || [],
        streaming: patch.streaming !== false,
        error: !!patch.error,
      });
    },

    attachStreamingIfNeeded(conversationId) {
      if (!conversationId || !isConversationStreaming(conversationId)) return;

      if (!this.streamingMsgId) {
        const last = this.messages[this.messages.length - 1];
        if (last && last.role === 'assistant' && last.streaming) {
          this.streamingMsgId = last.id;
        } else {
          this.appendPlaceholder();
        }
      }

      attachSession(conversationId, {
        onUpdate: (patch) => this.applyStreamPatch(patch),
        onComplete: (result) => this.onStreamComplete(result),
      });
    },

    /* ---------- 发送 / 停止 ---------- */
    sendMessage(text) {
      const userText = (typeof text === 'string' ? text : this.inputText).trim();
      if (!userText || this.isStreaming) return;

      this.inputText = '';
      this.$emit('user-sent');
      this.messages.push({ id: nextId('user'), role: 'user', text: userText });
      this.appendPlaceholder();
      this.assistantMessageId = nextId('msg');

      startStream({
        baseUrl: chatApi.getBaseUrl(),
        token: chatApi.getToken(),
        message: userText,
        conversationId: this.activeConversationId,
        assistantMessageId: this.assistantMessageId,
        onConversationId: (id) => {
          this.activeConversationId = id;
          this.$emit('conversation-created', id);
        },
        onUpdate: (patch) => this.applyStreamPatch(patch),
        onComplete: (result) => this.onStreamComplete(result),
      });

      this.streamingTick += 1;
    },

    sendQuickMessage(text) {
      this.sendMessage(text);
    },

    onStreamComplete(result) {
      const idx = this.messages.findIndex((m) => m.id === this.streamingMsgId);
      if (idx >= 0) {
        const msg = this.messages[idx];
        if (!msg.blocks.length && !result.aborted) {
          this.$set(this.messages, idx, { ...msg, streaming: false, error: true });
        } else {
          this.$set(this.messages, idx, { ...msg, streaming: false, error: !!result.error });
        }
      }
      this.streamingMsgId = null;
      this.streamingTick += 1;

      this.$emit('message-complete', {
        conversationId: result.conversationId || this.activeConversationId,
        aborted: !!result.aborted,
      });
    },

    async handleStop() {
      const convId = this.activeConversationId;
      const partial = getPartialText(convId);
      stopStream(convId);

      // 通知服务端取消流；带 partial 时由服务端持久化已生成内容
      if (convId) {
        try {
          await chatApi.stopGeneration(convId, this.assistantMessageId, partial || null);
        } catch (e) {
          // 服务端取消失败不影响本地停止
        }
      }
      this.streamingTick += 1;
    },
  },
};
</script>

<style scoped>
.th-chat-view {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  overflow: hidden;
}

.th-column {
  max-width: 768px;
  margin: 0 auto;
  padding: 0 24px;
}

/* ---- 欢迎态 ---- */
.th-welcome {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow-y: auto;
}

.th-welcome-inner {
  width: 100%;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.th-welcome-title {
  margin: 0 0 6px;
  text-align: center;
  font-size: 28px;
  font-weight: 600;
  color: #0d0d0d;
  letter-spacing: -0.02em;
}

.th-welcome-desc {
  margin: 0 0 28px;
  text-align: center;
  font-size: 14px;
  color: #8f8f8f;
}

.th-quick-row {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.th-quick-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #fff;
  border: 1px solid #e3e3e3;
  border-radius: 999px;
  font-size: 13px;
  color: #5d5d5d;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.th-quick-chip:hover {
  background: #f7f7f8;
  border-color: #c8c8c8;
}

.th-quick-icon {
  font-size: 14px;
}

/* ---- 会话态 ---- */
.th-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.th-scroll .th-column {
  padding-top: 20px;
  padding-bottom: 24px;
}

.th-to-bottom {
  position: absolute;
  left: 50%;
  bottom: 124px;
  transform: translateX(-50%);
  width: 34px;
  height: 34px;
  border: 1px solid #e3e3e3;
  border-radius: 50%;
  background: #fff;
  color: #5d5d5d;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 3;
}

.th-to-bottom:hover {
  background: #f7f7f8;
}

.th-composer-bar {
  flex-shrink: 0;
  padding: 4px 0 12px;
  background: #fff;
}

.th-composer-hint {
  margin: 8px 0 0;
  text-align: center;
  font-size: 11px;
  color: #b4b4b4;
}

.th-fade-enter-active,
.th-fade-leave-active {
  transition: opacity 0.15s;
}

.th-fade-enter,
.th-fade-leave-to {
  opacity: 0;
}
</style>
