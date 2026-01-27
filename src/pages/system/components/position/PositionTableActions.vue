<template>
  <div class="position-table-actions">
    <div class="left-buttons">
      <el-button type="primary" icon="el-icon-plus" size="small" @click="handleAdd">新增</el-button>
      <el-button icon="el-icon-delete" size="small" @click="handleBatchDelete" :disabled="selectedCount === 0">删除</el-button>
      <el-button icon="el-icon-download" size="small" @click="handleExport">导出</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  selectedCount: number
}>()

const emit = defineEmits<{
  add: []
  batchDelete: []
  export: []
}>()

const handleAdd = () => {
  emit('add')
}

const handleBatchDelete = () => {
  emit('batchDelete')
}

const handleExport = () => {
  emit('export')
}
</script>

<style scoped>
.position-table-actions {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.left-buttons {
  display: flex;
  gap: 8px;
}
</style>
