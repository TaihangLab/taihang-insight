<template>
  <div
    class="th-chat-item"
    :class="{ active: active, nested: nested }"
    @click="$emit('select')"
  >
    <span class="th-chat-title">{{ chat.title || '新对话' }}</span>
    <i v-if="streaming" class="el-icon-loading th-chat-streaming" title="正在回复" />
    <el-dropdown
      trigger="click"
      placement="bottom-start"
      class="th-chat-menu"
      @command="onCommand"
    >
      <button type="button" class="th-chat-menu-btn" title="更多" @click.stop>
        <i class="el-icon-more" />
      </button>
      <el-dropdown-menu slot="dropdown" class="th-dropdown-pop">
        <el-dropdown-item command="rename">
          <i class="el-icon-edit" /> 重命名
        </el-dropdown-item>
        <el-dropdown-item
          v-for="(g, i) in moveTargets"
          :key="g.id"
          :command="{ action: 'move', groupId: g.id }"
          :divided="i === 0"
        >
          <i class="el-icon-folder" /> 移入「{{ g.name }}」
        </el-dropdown-item>
        <el-dropdown-item v-if="chat.group_id" :command="{ action: 'move', groupId: null }">
          <i class="el-icon-folder-delete" /> 移出分组
        </el-dropdown-item>
        <el-dropdown-item command="delete" class="th-menu-danger" divided>
          <i class="el-icon-delete" /> 删除
        </el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>

<script>
export default {
  name: 'SidebarChatItem',
  props: {
    chat: { type: Object, required: true },
    active: { type: Boolean, default: false },
    streaming: { type: Boolean, default: false },
    groups: { type: Array, default: () => [] },
    nested: { type: Boolean, default: false },
  },
  computed: {
    moveTargets() {
      return this.groups.filter((g) => g.id !== this.chat.group_id);
    },
  },
  methods: {
    onCommand(cmd) {
      if (cmd === 'rename') this.$emit('rename');
      else if (cmd === 'delete') this.$emit('delete');
      else if (cmd && cmd.action === 'move') this.$emit('move', cmd.groupId);
    },
  },
};
</script>

<style scoped>
.th-chat-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.12s;
}

.th-chat-item.nested {
  padding-left: 30px;
}

.th-chat-item:hover {
  background: #ececec;
}

.th-chat-item.active {
  background: #e6e6e6;
}

.th-chat-title {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  color: #0d0d0d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.5;
}

.th-chat-streaming {
  flex-shrink: 0;
  font-size: 13px;
  color: #10a37f;
}

.th-chat-menu {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.12s;
}

.th-chat-item:hover .th-chat-menu,
.th-chat-item.active .th-chat-menu {
  opacity: 1;
}

.th-chat-menu-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #8f8f8f;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.th-chat-menu-btn:hover {
  background: #dcdcdc;
  color: #0d0d0d;
}
</style>

<style>
.th-menu-danger {
  color: #f56c6c !important;
}

/* 下拉菜单挂载在 body 上，需高于全屏面板（z-index 10000） */
.th-dropdown-pop {
  z-index: 10100 !important;
}
</style>
