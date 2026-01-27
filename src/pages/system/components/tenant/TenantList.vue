<template>
  <div class="tenant-list-container">
    <!-- 操作按钮区 -->
    <TenantTableActions
      :selected-count="selectedCodes.length"
      @add="handleAdd"
      @batch-delete="handleBatchDelete"
      @export="handleExport"
    />

    <!-- 表格 -->
    <TenantTable
      :data="tenants"
      :loading="loading"
      :selected-codes="selectedCodes"
      @edit="handleEdit"
      @delete="handleDelete"
      @selection-change="handleSelectionChange"
      @status-change="handleStatusChange"
    />

    <!-- 分页 -->
    <TenantPagination
      :current-page="pagination.currentPage"
      :page-size="pagination.pageSize"
      :total="total"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TenantTableActions from '@/pages/system/components/tenant/TenantTableActions.vue'
import TenantTable from '@/pages/system/components/tenant/TenantTable.vue'
import TenantPagination from '@/pages/system/components/tenant/TenantPagination.vue'
import type { Tenant } from '@/types/rbac/tenant'

interface Pagination {
  currentPage: number
  pageSize: number
}

defineProps<{
  tenants: Tenant[]
  loading: boolean
  pagination: Pagination
  total: number
}>()

const emit = defineEmits<{
  selectionChange: [codes: number[]]
  add: []
  edit: [row: Tenant]
  delete: [row: Tenant]
  batchDelete: [codes: number[]]
  statusChange: [row: Tenant]
  pageChange: [page: number]
  sizeChange: [size: number]
  export: [codes: number[]]
}>()

const selectedCodes = ref<number[]>([])

const handleSelectionChange = (codes: number[]) => {
  selectedCodes.value = codes
  emit('selectionChange', codes)
}

const handleAdd = () => {
  emit('add')
}

const handleEdit = (row: Tenant) => {
  emit('edit', row)
}

const handleDelete = (row: Tenant) => {
  emit('delete', row)
}

const handleBatchDelete = () => {
  emit('batchDelete', selectedCodes.value)
}

const handleStatusChange = (row: Tenant) => {
  emit('statusChange', row)
}

const handlePageChange = (page: number) => {
  emit('pageChange', page)
}

const handleSizeChange = (size: number) => {
  emit('sizeChange', size)
}

const handleExport = () => {
  emit('export', selectedCodes.value)
}
</script>

<style scoped>
.tenant-list-container {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #ebeef5;
  margin-top: 0;
  position: relative;
  overflow: hidden;
}
</style>
