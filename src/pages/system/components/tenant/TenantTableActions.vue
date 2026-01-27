<template>
  <div class="tenant-table-actions">
    <el-button
      type="primary"
      size="default"
      data-testid="btn-add-tenant"
      @click="handleAdd"
    >
      <el-icon><Plus /></el-icon>
      <span>新增</span>
    </el-button>
    <el-button
      size="default"
      data-testid="btn-batch-delete"
      :disabled="!hasSelection"
      @click="handleBatchDelete"
    >
      <el-icon><Delete /></el-icon>
      <span>删除</span>
    </el-button>
    <el-button
      size="default"
      data-testid="btn-export"
      @click="handleExport"
    >
      <el-icon><Download /></el-icon>
      <span>导出</span>
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete, Download } from '@element-plus/icons-vue'

const props = defineProps<{
  selectedCount: number
}>()

const emit = defineEmits<{
  add: []
  batchDelete: []
  export: []
}>()

const hasSelection = computed(() => props.selectedCount > 0)

const handleAdd = () => {
  emit('add')
}

const handleBatchDelete = () => {
  if (!hasSelection.value) {
    ElMessage({
      message: '请选择要删除的租户',
      type: 'warning'
    })
    return
  }
  emit('batchDelete')
}

const handleExport = () => {
  emit('export')
}
</script>

<style scoped>
.tenant-table-actions {
  padding: 16px 24px;
  display: flex;
  gap: 12px;
  border-bottom: 1px solid var(--design-border-color);
}

/* 按钮样式 */
.tenant-table-actions :deep(.el-button) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 16px;
  font-size: var(--font-size-base);
  border-radius: var(--design-radius-md);
  font-weight: var(--font-weight-medium);
  transition: all var(--design-transition-base);
}

/* 主按钮样式 */
.tenant-table-actions :deep(.el-button--primary) {
  background: var(--design-gradient-primary);
  border: none;
  color: #ffffff;
  box-shadow: var(--design-shadow-primary);
}

.tenant-table-actions :deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, var(--design-primary-hover) 0%, #1a45c9 100%);
  box-shadow: var(--design-shadow-primary-hover);
  transform: translateY(-1px);
}

/* 默认按钮样式 */
.tenant-table-actions :deep(.el-button--default) {
  background: #ffffff;
  border: 1px solid var(--design-border-color);
  color: var(--design-text-primary);
}

.tenant-table-actions :deep(.el-button--default:hover:not(:disabled)) {
  border-color: var(--design-primary-color);
  color: var(--design-primary-color);
  background-color: var(--design-primary-light);
}

/* 禁用状态 */
.tenant-table-actions :deep(.el-button.is-disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 图标样式 */
.tenant-table-actions :deep(.el-icon) {
  font-size: 16px;
}
</style>