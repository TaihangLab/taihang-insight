<template>
  <el-table
    :data="data"
    v-loading="loading"
    :border="false"
    class="custom-table"
    style="width: 100%"
    @selection-change="handleSelectionChange"
  >
    <el-table-column type="selection"  align="center"></el-table-column>
    <el-table-column prop="id" label="租户编号" align="center"></el-table-column>
    <el-table-column prop="tenant_name" label="租户名称" align="center"></el-table-column>
    <el-table-column prop="company_name" label="企业名称"  align="center"></el-table-column>
    <el-table-column prop="package" label="租户套餐" align="center">
      <template #default="scope">
        {{ packageLabels[scope.row.package] || scope.row.package || '-' }}
      </template>
    </el-table-column>
    <el-table-column prop="expire_time" label="过期时间" width="140" align="center">
      <template #default="scope">
        {{ formatDate(scope.row.expire_time) }}
      </template>
    </el-table-column>
    <el-table-column prop="status" label="状态" width="100" align="center">
      <template #default="scope">
        <el-switch
          :data-testid="'switch-status-' + scope.row.id"
          v-model="scope.row.status"
          :active-value="0"
          :inactive-value="1"
          active-color="var(--design-success-color)"
          inactive-color="var(--design-text-tertiary)"
          @change="handleStatusChange(scope.row)"
        ></el-switch>
      </template>
    </el-table-column>

    <el-table-column label="操作" width="300" fixed="right" align="center">
      <template #default="scope">
        <div class="operation-buttons">
          <el-button link class="edit-btn" @click="handleEdit(scope.row)">
            <el-icon><Edit /></el-icon>
            <span>编辑</span>
          </el-button>
          <el-button link class="delete-btn" @click="handleDelete(scope.row)">
            <el-icon><Delete /></el-icon>
            <span>删除</span>
          </el-button>
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Edit, Delete } from '@element-plus/icons-vue'
import type { TenantAPI } from '@/types/rbac/tenant'

const PACKAGE_LABELS: Record<string, string> = {
  basic: '基础版',
  standard: '标准版',
  premium: '高级版',
  enterprise: '企业版'
}

defineProps<{
  data: TenantAPI[]
  loading: boolean
  selectedCodes: number[]
}>()

const emit = defineEmits<{
  selectionChange: [codes: number[], selection: TenantAPI[]]
  statusChange: [row: TenantAPI]
  edit: [row: TenantAPI]
  delete: [row: TenantAPI]
}>()

const packageLabels = ref(PACKAGE_LABELS)

const formatDate = (timestamp: string | null | undefined): string => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const handleSelectionChange = (selection: TenantAPI[]) => {
  const codes = selection.map((row) => row.id)
  emit('selectionChange', codes, selection)
}

const handleStatusChange = (row: TenantAPI) => {
  emit('statusChange', row)
}

const handleEdit = (row: TenantAPI) => {
  emit('edit', row)
}

const handleDelete = (row: TenantAPI) => {
  emit('delete', row)
}
</script>

<style scoped>
.custom-table {
  font-size: var(--font-size-base);
}

/* 移除边框 */
.custom-table :deep(.el-table__cell) {
  border-right: none;
}

.custom-table :deep(.el-table::before) {
  height: 0;
}

/* 表头样式 */
.custom-table :deep(.el-table__header-wrapper th) {
  font-weight: var(--font-weight-semibold);
  text-align: center;
  background: var(--design-bg-secondary) !important;
  color: var(--design-text-primary) !important;
  border-bottom: 1px solid var(--design-border-color) !important;
  padding: 12px;
}

/* 表格行样式 */
.custom-table :deep(.el-table__row td) {
  text-align: center;
  padding: 12px;
}

.custom-table :deep(.el-table .el-table__body tr:hover > td) {
  background-color: var(--design-primary-lighter) !important;
}

/* 操作按钮容器 */
.operation-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}

/* 操作按钮样式 */
.edit-btn,
.delete-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px !important;
  font-size: var(--font-size-sm) !important;
  border-radius: var(--design-radius-sm) !important;
  font-weight: var(--font-weight-normal) !important;
  transition: all var(--design-transition-base) !important;
}

.edit-btn {
  color: var(--design-primary-color) !important;
}

.edit-btn:hover {
  background-color: var(--design-primary-light) !important;
}

.delete-btn {
  color: var(--design-danger-color) !important;
}

.delete-btn:hover {
  background-color: var(--design-danger-light) !important;
}

/* 按钮禁用状态 */
.edit-btn:disabled,
.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed !important;
}

/* 开关样式 */
:deep(.el-switch) {
  height: 22px;
}

:deep(.el-switch__core) {
  border-radius: 11px;
  height: 22px;
  min-width: 44px;
}

:deep(.el-switch__action) {
  top: 2px;
  left: 2px;
}
</style>
