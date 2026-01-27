<template>
  <div class="role-table-actions">
    <div class="left-buttons">
      <el-button type="primary" icon="el-icon-plus" size="small" @click="handleAdd">新增角色</el-button>
      <el-button icon="el-icon-delete" size="small" @click="handleBatchDelete" :disabled="selectedCount === 0">批量删除</el-button>
    </div>
    <div class="right-buttons">
      <el-button icon="el-icon-refresh" size="small" circle @click="handleRefresh"></el-button>
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
  refresh: []
}>()

const handleAdd = () => {
  emit('add')
}

const handleBatchDelete = () => {
  emit('batchDelete')
}

const handleRefresh = () => {
  emit('refresh')
}
</script>

<style scoped>
.role-table-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.left-buttons {
  display: flex;
  gap: 10px;
}

.right-buttons {
  display: flex;
  gap: 10px;
}
</style>
