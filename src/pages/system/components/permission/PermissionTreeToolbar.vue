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

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  filter: [text: string]
  expandAll: []
  collapseAll: []
}>()

const filterText = ref('')

const handleFilterInput = () => {
  emit('filter', filterText.value)
}

const handleExpandAll = () => {
  emit('expandAll')
}

const handleCollapseAll = () => {
  emit('collapseAll')
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
