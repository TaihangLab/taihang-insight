<template>
  <div class="department-table-actions">
    <el-button
      type="primary"
      icon="el-icon-plus"
      size="small"
      data-testid="btn-add-department"
      @click="handleAdd"
    >新增</el-button>
    <el-button
      icon="el-icon-s-unfold"
      size="small"
      data-testid="btn-toggle-expand"
      @click="handleToggleExpand"
    >展开/折叠</el-button>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  add: []
  toggleExpand: []
}>()

const handleAdd = () => {
  emit('add')
}

const handleToggleExpand = () => {
  emit('toggleExpand')
}
</script>

<style scoped>
.department-table-actions {
  padding: 18px 24px 18px 24px;
  text-align: left;
  border-bottom: none;
}
</style>
