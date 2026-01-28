<template>
  <div class="department-list-container">
    <!-- 操作按钮区 -->
    <DepartmentTableActions
      :selected-count="selectedCodes.length"
      @add="handleAdd"
    />

    <!-- 表格 -->
    <DepartmentTreeTable
      :data="departments"
      :loading="loading"
      :default-expand-all="true"
      :pagination="pagination"
      :total="total"
      @selection-change="handleSelectionChange"
      @edit="handleEdit"
      @delete="handleDelete"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    />

    <!-- 分页 -->
    <DepartmentPagination
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
import DepartmentTableActions from '@/pages/system/components/department/DepartmentTableActions.vue'
import DepartmentTreeTable from '@/pages/system/components/department/DepartmentTreeTable.vue'
import DepartmentPagination from '@/pages/system/components/department/DepartmentPagination.vue'

interface Pagination {
  currentPage: number
  pageSize: number
}

defineProps<{
  departments: any[]
  loading: boolean
  pagination: Pagination
  total: number
}>()

const emit = defineEmits<{
  selectionChange: [codes: number[], selection: any[]]
  add: []
  edit: [row: any]
  delete: [row: any]
  pageChange: [page: number]
  sizeChange: [size: number]
}>()

const selectedCodes = ref<number[]>([])

const handleSelectionChange = (selection: any[]) => {
  const codes = selection.map((row) => row.id)
  emit('selectionChange', codes, selection)
}

const handleAdd = () => {
  emit('add')
}

const handleEdit = (row: any) => {
  emit('edit', row)
}

const handleDelete = (row: any) => {
  emit('delete', row)
}

const handlePageChange = (page: number) => {
  emit('pageChange', page)
}

const handleSizeChange = (size: number) => {
  emit('sizeChange', size)
}
</script>

<style scoped>
.department-list-container {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #ebeef5;
  margin-top: 0;
  position: relative;
  overflow: hidden;
}
</style>
