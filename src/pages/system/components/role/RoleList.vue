<template>
  <div class="role-list-container">
    <!-- 操作按钮区 -->
    <RoleTableActions
      :selected-count="selectedCodes.length"
      @add="handleAdd"
    />

    <!-- 表格 -->
    <RoleTable
      :data="roles"
      :loading="loading"
      :pagination="pagination"
      :total="total"
      @selection-change="handleSelectionChange"
      @edit="handleEdit"
      @delete="handleDelete"
      @authorization="handleAuthorization"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    />

    <!-- 分页 -->
    <RolePagination
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
import RoleTableActions from '@/pages/system/components/role/RoleTableActions.vue'
import RoleTable from '@/pages/system/components/role/RoleTable.vue'
import RolePagination from '@/pages/system/components/role/RolePagination.vue'

interface Pagination {
  currentPage: number
  pageSize: number
}

defineProps<{
  roles: any[]
  loading: boolean
  pagination: Pagination
  total: number
}>()

const emit = defineEmits<{
  selectionChange: [codes: number[], selection: any[]]
  add: []
  edit: [row: any]
  delete: [row: any]
  authorization: [row: any]
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

const handleAuthorization = (row: any) => {
  emit('authorization', row)
}

const handlePageChange = (page: number) => {
  emit('pageChange', page)
}

const handleSizeChange = (size: number) => {
  emit('sizeChange', size)
}
</script>

<style scoped>
.role-list-container {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #ebeef5;
  margin-top: 0;
  position: relative;
  overflow: hidden;
}
</style>
