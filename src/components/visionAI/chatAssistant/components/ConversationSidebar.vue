<template>
  <aside class="th-sidebar">
    <div class="th-sidebar-top">
      <button type="button" class="th-new-chat" @click="$emit('new-chat')">
        <i class="el-icon-edit-outline" />
        <span>新对话</span>
      </button>
      <el-input
        v-model="searchQuery"
        size="small"
        placeholder="搜索对话"
        prefix-icon="el-icon-search"
        clearable
        class="th-search"
      />
    </div>

    <div class="th-sidebar-list">
      <!-- 分组：折叠文件夹，组内会话不在下方日期列表出现 -->
      <div class="th-groups">
        <div class="th-section-label th-groups-head">
          <span>分组</span>
          <button type="button" class="th-mini-btn" title="新建分组" @click="$emit('create-group')">
            <i class="el-icon-plus" />
          </button>
        </div>

        <div v-for="g in groups" :key="g.id" class="th-group">
          <div class="th-group-item" @click="toggleGroup(g.id)">
            <i
              class="el-icon-arrow-right th-group-arrow"
              :class="{ expanded: isExpanded(g.id) }"
            />
            <i :class="isExpanded(g.id) ? 'el-icon-folder-opened' : 'el-icon-folder'" class="th-group-icon" />
            <span class="th-group-name">{{ g.name }}</span>
            <span class="th-group-count">{{ (chatsByGroup[g.id] || []).length }}</span>
            <button
              type="button"
              class="th-mini-btn th-group-del"
              title="删除分组"
              @click.stop="$emit('delete-group', g)"
            >
              <i class="el-icon-close" />
            </button>
          </div>

          <template v-if="isExpanded(g.id)">
            <div v-if="!(chatsByGroup[g.id] || []).length" class="th-group-empty">
              组内暂无对话
            </div>
            <sidebar-chat-item
              v-for="chat in chatsByGroup[g.id]"
              :key="chat.id"
              :chat="chat"
              :active="chat.id === currentChatId"
              :streaming="streamingChatIds.includes(chat.id)"
              :groups="groups"
              nested
              @select="$emit('select-chat', chat.id)"
              @rename="$emit('rename-chat', chat)"
              @delete="$emit('delete-chat', chat.id)"
              @move="(groupId) => $emit('move-chat', { chatId: chat.id, groupId })"
            />
          </template>
        </div>
      </div>

      <!-- 未分组会话（按日期分区） -->
      <div v-if="!sections.length && !groups.length" class="th-sidebar-empty">
        <i class="el-icon-chat-dot-round" />
        <p>暂无对话</p>
      </div>

      <div v-for="section in sections" :key="section.label" class="th-section">
        <div class="th-section-label">{{ section.label }}</div>
        <sidebar-chat-item
          v-for="chat in section.items"
          :key="chat.id"
          :chat="chat"
          :active="chat.id === currentChatId"
          :streaming="streamingChatIds.includes(chat.id)"
          :groups="groups"
          @select="$emit('select-chat', chat.id)"
          @rename="$emit('rename-chat', chat)"
          @delete="$emit('delete-chat', chat.id)"
          @move="(groupId) => $emit('move-chat', { chatId: chat.id, groupId })"
        />
      </div>
    </div>
  </aside>
</template>

<script>
import SidebarChatItem from './SidebarChatItem.vue';

const DAY_MS = 24 * 60 * 60 * 1000;

export default {
  name: 'ConversationSidebar',
  components: { SidebarChatItem },
  props: {
    conversations: { type: Array, default: () => [] },
    groups: { type: Array, default: () => [] },
    currentChatId: { type: String, default: null },
    streamingChatIds: { type: Array, default: () => [] },
  },
  data() {
    return {
      searchQuery: '',
      expandedGroupIds: [],
    };
  },
  computed: {
    searched() {
      const q = this.searchQuery.trim().toLowerCase();
      if (!q) return this.conversations;
      return this.conversations.filter((c) => (c.title || '').toLowerCase().includes(q));
    },
    chatsByGroup() {
      const map = {};
      for (const c of this.searched) {
        if (!c.group_id) continue;
        if (!map[c.group_id]) map[c.group_id] = [];
        map[c.group_id].push(c);
      }
      return map;
    },
    ungrouped() {
      return this.searched.filter((c) => !c.group_id);
    },
    /** ChatGPT 式日期分区：今天 / 昨天 / 7 天内 / 30 天内 / 更早（仅未分组会话） */
    sections() {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const buckets = [
        { label: '今天', items: [] },
        { label: '昨天', items: [] },
        { label: '7 天内', items: [] },
        { label: '30 天内', items: [] },
        { label: '更早', items: [] },
      ];

      for (const chat of this.ungrouped) {
        const t = Date.parse(chat.updated_at || chat.last_message_time || chat.created_at || '');
        let idx = 4;
        if (!Number.isNaN(t)) {
          if (t >= todayStart) idx = 0;
          else if (t >= todayStart - DAY_MS) idx = 1;
          else if (t >= todayStart - 7 * DAY_MS) idx = 2;
          else if (t >= todayStart - 30 * DAY_MS) idx = 3;
        }
        buckets[idx].items.push(chat);
      }
      return buckets.filter((b) => b.items.length);
    },
  },
  watch: {
    // 当前会话在某个分组里时自动展开该分组（如刚移入、或从别处选中）
    currentChatId: {
      immediate: true,
      handler() {
        this.expandCurrentChatGroup();
      },
    },
    conversations() {
      this.expandCurrentChatGroup();
    },
    // 搜索时展开有命中的分组，方便看到结果
    searchQuery(q) {
      if (!q.trim()) return;
      Object.keys(this.chatsByGroup).forEach((gid) => this.expandGroup(gid));
    },
  },
  methods: {
    expandCurrentChatGroup() {
      if (!this.currentChatId) return;
      const chat = this.conversations.find((c) => c.id === this.currentChatId);
      if (chat && chat.group_id) this.expandGroup(chat.group_id);
    },
    isExpanded(id) {
      return this.expandedGroupIds.indexOf(id) >= 0;
    },
    expandGroup(id) {
      if (!this.isExpanded(id)) this.expandedGroupIds.push(id);
    },
    toggleGroup(id) {
      const idx = this.expandedGroupIds.indexOf(id);
      if (idx >= 0) this.expandedGroupIds.splice(idx, 1);
      else this.expandedGroupIds.push(id);
    },
  },
};
</script>

<style scoped>
.th-sidebar {
  width: 264px;
  min-width: 264px;
  height: 100%;
  background: #f9f9f9;
  border-right: 1px solid #ececec;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.th-sidebar-top {
  padding: 12px 12px 8px;
}

.th-new-chat {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: #0d0d0d;
  cursor: pointer;
  transition: background 0.15s;
}

.th-new-chat:hover {
  background: #ececec;
}

.th-new-chat i {
  font-size: 16px;
}

.th-search {
  margin-top: 6px;
}

.th-search >>> .el-input__inner {
  border-radius: 10px;
  border-color: transparent;
  background: #ececec;
  font-size: 13px;
}

.th-search >>> .el-input__inner:focus {
  border-color: #c8c8c8;
  background: #fff;
}

.th-sidebar-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 12px 16px;
}

.th-sidebar-empty {
  text-align: center;
  padding: 40px 0;
  color: #b4b4b4;
}

.th-sidebar-empty i {
  font-size: 30px;
  display: block;
  margin-bottom: 8px;
}

.th-sidebar-empty p {
  margin: 0;
  font-size: 13px;
}

.th-section-label {
  padding: 14px 8px 6px;
  font-size: 12px;
  font-weight: 600;
  color: #8f8f8f;
}

/* ---- 分组 ---- */
.th-groups {
  padding-bottom: 4px;
}

.th-groups-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.th-mini-btn {
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #8f8f8f;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.th-mini-btn:hover {
  background: #dcdcdc;
  color: #0d0d0d;
}

.th-group-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.12s;
  user-select: none;
}

.th-group-item:hover {
  background: #ececec;
}

.th-group-arrow {
  font-size: 12px;
  color: #8f8f8f;
  transition: transform 0.15s;
  flex-shrink: 0;
}

.th-group-arrow.expanded {
  transform: rotate(90deg);
}

.th-group-icon {
  font-size: 15px;
  color: #8f8f8f;
  flex-shrink: 0;
}

.th-group-name {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  color: #0d0d0d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.th-group-count {
  font-size: 12px;
  color: #b4b4b4;
  flex-shrink: 0;
}

.th-group-del {
  opacity: 0;
  transition: opacity 0.12s;
  flex-shrink: 0;
}

.th-group-item:hover .th-group-del {
  opacity: 1;
}

.th-group-empty {
  padding: 4px 8px 6px 30px;
  font-size: 12px;
  color: #b4b4b4;
}
</style>
