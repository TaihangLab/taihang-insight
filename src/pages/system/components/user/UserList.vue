<template>
  <div class="user-list-container">
    <!-- 操作按钮区 -->
    <UserTableActions
      @add="handleAdd"
      @batch-delete="handleBatchDelete"
      @more-action="handleMoreAction"
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
import UserTableActions from '@/pages/system/components/user/UserTableActions.vue'
import UserTable from '@/pages/system/components/user/UserTable.vue'
import UserPagination from '@/pages/system/components/user/UserPagination.vue'

interface Pagination {
  currentPage: number
  pageSize: number
}

interface User {
  [key: string]: any
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
  batchDelete: []
  statusChange: [row: User, callback: (success: boolean) => void]
  resetPassword: [row: User]
  pageChange: [page: number]
  sizeChange: [size: number]
  moreAction: [command: string]
  advancedSearch: []
  refresh: []
  tableSetting: []
  authorization: [row: User]
}>()

const handleSelectionChange = (selection: User[]) => {
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
  emit('batchDelete')
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

const handleMoreAction = (command: string) => {
  emit('moreAction', command)
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
