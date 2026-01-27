<template>
  <div class="permission-tree-header">
    <h2>权限码管理</h2>
    <p class="page-description">管理系统权限，支持三级权限结构：文件夹、页面、按钮</p>
    <div class="header-actions">
      <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增</el-button>
      <el-button icon="el-icon-edit" @click="handleEdit" :disabled="!selectedNode">编辑</el-button>
      <el-button icon="el-icon-delete" @click="handleDelete" :disabled="!selectedNode">删除</el-button>
      <el-button icon="el-icon-refresh" @click="handleRefresh">刷新</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface PermissionNode {
  [key: string]: any
}

defineProps<{
  selectedNode: PermissionNode | null
}>()

const emit = defineEmits<{
  add: []
  edit: []
  delete: []
  refresh: []
}>()

const handleAdd = () => {
  emit('add')
}

const handleEdit = () => {
  emit('edit')
}

const handleDelete = () => {
  emit('delete')
}

const handleRefresh = () => {
  emit('refresh')
}
</script>

<style scoped>
.permission-tree-header {
  margin-bottom: 20px;
}

.permission-tree-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.page-description {
  margin: 0 0 16px 0;
  color: #6b7280;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 10px;
}
</style>
