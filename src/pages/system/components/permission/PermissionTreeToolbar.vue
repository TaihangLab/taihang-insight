<template>
  <div class="permission-tree-toolbar">
    <el-input
      v-model="filterText"
      placeholder="搜索权限名称或权限码"
      prefix-icon="el-icon-search"
      clearable
      style="width: 300px"
      @input="handleFilterInput"
    />
    <div class="toolbar-actions">
      <el-button size="small" icon="el-icon-folder-opened" @click="handleExpandAll">展开全部</el-button>
      <el-button size="small" icon="el-icon-folder" @click="handleCollapseAll">收起全部</el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PermissionTreeToolbar',
  data() {
    return {
      filterText: ''
    }
  },
  methods: {
    handleFilterInput() {
      this.$emit('filter', this.filterText)
    },
    handleExpandAll() {
      this.$emit('expand-all')
    },
    handleCollapseAll() {
      this.$emit('collapse-all')
    }
  }
}
</script>

<style scoped>
.permission-tree-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}
</style>
