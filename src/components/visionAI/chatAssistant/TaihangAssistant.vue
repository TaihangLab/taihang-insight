<template>
  <div class="taihang-assistant-root">
    <floating-launcher
      :online="assistantOnline"
      :drawer-open="panelVisible"
      @toggle="togglePanel"
    />

    <transition name="th-panel-fade">
      <div v-if="panelVisible" class="th-panel">
        <header class="th-header">
          <div class="th-header-left">
            <button
              type="button"
              class="th-icon-btn"
              :title="sidebarVisible ? '收起侧栏' : '展开侧栏'"
              @click="sidebarVisible = !sidebarVisible"
            >
              <i :class="sidebarVisible ? 'el-icon-s-fold' : 'el-icon-s-unfold'" />
            </button>
            <span class="th-title">太行·问道</span>
            <span class="th-status" :class="statusClass" :title="statusText" />
          </div>
          <button type="button" class="th-icon-btn" title="关闭" @click="panelVisible = false">
            <i class="el-icon-close" />
          </button>
        </header>

        <div class="th-body">
          <conversation-sidebar
            v-show="sidebarVisible"
            :conversations="conversations"
            :groups="groups"
            :current-chat-id="currentChatId"
            :streaming-chat-ids="streamingChatIds"
            @new-chat="startNewChat"
            @select-chat="selectChat"
            @delete-chat="deleteChat"
            @rename-chat="renameChat"
            @create-group="createGroup"
            @delete-group="deleteGroup"
            @move-chat="moveChat"
          />

          <chat-view
            :conversation-id="currentChatId"
            @conversation-created="onConversationCreated"
            @message-complete="onMessageComplete"
          />
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import FloatingLauncher from './components/FloatingLauncher.vue';
import ConversationSidebar from './components/ConversationSidebar.vue';
import ChatView from './components/ChatView.vue';
import chatApi from './services/chatApi';
import { chatConfirm, chatPrompt, chatMessage } from './services/chatUi';
import { subscribeStreamingIds } from './services/chatStreamManager';

export default {
  name: 'TaihangAssistant',
  components: { FloatingLauncher, ConversationSidebar, ChatView },
  data() {
    return {
      panelVisible: false,
      sidebarVisible: true,
      assistantOnline: null,
      healthTimer: null,
      conversations: [],
      groups: [],
      currentChatId: null,
      streamingChatIds: [],
    };
  },
  computed: {
    statusText() {
      if (this.assistantOnline === true) return '服务在线';
      if (this.assistantOnline === false) return '服务离线';
      return '正在检测服务状态';
    },
    statusClass() {
      if (this.assistantOnline === true) return 'online';
      if (this.assistantOnline === false) return 'offline';
      return 'checking';
    },
  },
  mounted() {
    this.checkHealth();
    this.healthTimer = setInterval(() => this.checkHealth(), 60000);
    this._unsubStreaming = subscribeStreamingIds((ids) => {
      this.streamingChatIds = ids;
    });
  },
  beforeDestroy() {
    if (this.healthTimer) clearInterval(this.healthTimer);
    if (this._unsubStreaming) this._unsubStreaming();
  },
  methods: {
    togglePanel() {
      if (this.panelVisible) {
        this.panelVisible = false;
        return;
      }
      this.panelVisible = true;
      this.loadConversations();
      this.checkHealth();
    },

    startNewChat() {
      this.currentChatId = null;
    },

    selectChat(id) {
      this.currentChatId = id;
    },

    async deleteChat(id) {
      try {
        await chatConfirm(this, '确定删除该对话？删除后不可恢复。');
      } catch (e) {
        return;
      }
      try {
        await chatApi.deleteConversation(id);
        if (this.currentChatId === id) this.currentChatId = null;
        await this.loadConversations();
      } catch (e) {
        chatMessage(this, 'error', '删除失败');
      }
    },

    async renameChat(chat) {
      let value;
      try {
        const res = await chatPrompt(this, '输入新的对话名称', '重命名', chat.title || '');
        value = (res.value || '').trim();
      } catch (e) {
        return;
      }
      if (!value || value === chat.title) return;
      try {
        await chatApi.updateConversationTitle(chat.id, value);
        await this.loadConversations();
      } catch (e) {
        chatMessage(this, 'error', '重命名失败');
      }
    },

    onConversationCreated(id) {
      if (!this.currentChatId || this.currentChatId === id) {
        this.currentChatId = id;
      }
      this.loadConversations();
    },

    async onMessageComplete({ conversationId, aborted }) {
      if (!conversationId) return;
      if (!aborted) {
        try {
          await chatApi.autoGenerateTitle(conversationId);
        } catch (e) {
          // 后端流结束时也会自动生成标题，失败时仅刷新列表
        }
      }
      await this.loadConversations();
    },

    async loadConversations() {
      try {
        const [convRes, groupRes] = await Promise.all([
          chatApi.getConversations({ limit: 50 }),
          chatApi.getGroups(),
        ]);
        this.conversations = (convRes.data && convRes.data.conversations) || [];
        this.groups = (groupRes.data && groupRes.data.groups) || [];
      } catch (e) {
        // 列表加载失败保持现状，健康检查会反映服务状态
      }
    },

    async createGroup() {
      let name;
      try {
        const res = await chatPrompt(this, '输入分组名称', '新建分组');
        name = (res.value || '').trim();
      } catch (e) {
        return;
      }
      if (!name) return;
      try {
        await chatApi.createGroup(name);
        await this.loadConversations();
      } catch (e) {
        chatMessage(this, 'error', '创建分组失败');
      }
    },

    async deleteGroup(group) {
      try {
        await chatConfirm(this, `确定删除分组「${group.name}」？组内对话会保留并移出分组。`);
      } catch (e) {
        return;
      }
      try {
        await chatApi.deleteGroup(group.id);
        await this.loadConversations();
      } catch (e) {
        chatMessage(this, 'error', '删除分组失败');
      }
    },

    async moveChat({ chatId, groupId }) {
      try {
        await chatApi.updateConversationGroup(chatId, groupId);
        await this.loadConversations();
      } catch (e) {
        chatMessage(this, 'error', '移动失败');
      }
    },

    async checkHealth() {
      try {
        const res = await chatApi.healthCheck();
        const d = res.data || {};
        this.assistantOnline = d.status === 'healthy' && d.llm_service !== false;
      } catch (e) {
        this.assistantOnline = false;
      }
    },
  },
};
</script>

<style scoped>
.th-panel {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.th-header {
  height: 52px;
  padding: 0 12px;
  border-bottom: 1px solid #ececec;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.th-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.th-title {
  font-size: 16px;
  font-weight: 600;
  color: #0d0d0d;
}

.th-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #b4b4b4;
}

.th-status.online { background: #10a37f; }
.th-status.offline { background: #f56c6c; }
.th-status.checking { background: #e6a23c; }

.th-icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #5d5d5d;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.th-icon-btn:hover {
  background: #ececec;
  color: #0d0d0d;
}

.th-body {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.th-panel-fade-enter-active,
.th-panel-fade-leave-active {
  transition: opacity 0.2s ease;
}

.th-panel-fade-enter,
.th-panel-fade-leave-to {
  opacity: 0;
}
</style>
