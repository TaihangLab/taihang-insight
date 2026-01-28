<template>
  <div class="user-list-container">
    <!-- 操作按钮区 -->
    <UserTableActions
      :selected-count="selectedCodes.length"
      @add="handleAdd"
      @batch-delete="handleBatchDelete"
      @advanced-search="handleAdvancedSearch"
      @refresh="handleRefresh"
      @table-setting="handleTableSetting"
    />

    <!-- 表格 -->
    <UserTable
      :data="users"
      :loading="loading"
      @selection-change="handleSelectionChange"
      @edit="handleEdit"
      @delete="handleDelete"
      @status-change="handleStatusChange"
      @reset-password="handleResetPassword"
      @authorization="handleAuthorization"
    />

    <!-- 分页 -->
    <UserPagination
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
import UserTableActions from '@/pages/system/components/user/UserTableActions.vue'
import UserTable from '@/pages/system/components/user/UserTable.vue'
import UserPagination from '@/pages/system/components/user/UserPagination.vue'
import type { User } from '@/types/rbac/user'

interface Pagination {
  currentPage: number
  pageSize: number
}

defineProps<{
  users: User[]
  loading: boolean
  pagination: Pagination
  total: number
}>()

const emit = defineEmits<{
  selectionChange: [selection: User[]]
  add: []
  edit: [row: User]
  delete: [row: User]
  batchDelete: [ids: number[]]
  statusChange: [row: User, callback: (success: boolean) => void]
  resetPassword: [row: User]
  pageChange: [page: number]
  sizeChange: [size: number]
  advancedSearch: []
  refresh: []
  tableSetting: []
  authorization: [row: User]
}>()

const selectedCodes = ref<number[]>([])

const handleSelectionChange = (selection: User[]) => {
  const codes = selection.map((row) => row.id)
  selectedCodes.value = codes
  emit('selectionChange', selection)
}

const handleAdd = () => {
  emit('add')
}

const handleEdit = (row: User) => {
  emit('edit', row)
}

const handleDelete = (row: User) => {
  emit('delete', row)
}

const handleBatchDelete = () => {
  emit('batchDelete', selectedCodes.value)
}

const handleStatusChange = (row: User, callback: (success: boolean) => void) => {
  emit('statusChange', row, callback)
}

const handleResetPassword = (row: User) => {
  emit('resetPassword', row)
}

const handlePageChange = (page: number) => {
  emit('pageChange', page)
}

const handleSizeChange = (size: number) => {
  emit('sizeChange', size)
}

const handleAdvancedSearch = () => {
  emit('advancedSearch')
}

const handleRefresh = () => {
  emit('refresh')
}

const handleTableSetting = () => {
  emit('tableSetting')
}

const handleAuthorization = (row: User) => {
  emit('authorization', row)
}
</script>

<style scoped>
.user-list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
