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

<script>
import UserTableActions from './UserTableActions.vue'
import UserTable from './UserTable.vue'
import UserPagination from './UserPagination.vue'

export default {
  name: 'UserList',
  components: {
    UserTableActions,
    UserTable,
    UserPagination
  },
  props: {
    users: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    pagination: {
      type: Object,
      default: () => ({
        currentPage: 1,
        pageSize: 10
      })
    },
    total: {
      type: Number,
      default: 0
    }
  },
  methods: {
    handleSelectionChange(selection) {
      this.$emit('selection-change', selection)
    },
    handleAdd() {
      this.$emit('add')
    },
    handleEdit(row) {
      this.$emit('edit', row)
    },
    handleDelete(row) {
      this.$emit('delete', row)
    },
    handleBatchDelete() {
      this.$emit('batch-delete')
    },
    handleStatusChange(row) {
      this.$emit('status-change', row)
    },
    handleResetPassword(row) {
      this.$emit('reset-password', row)
    },
    handlePageChange(page) {
      this.$emit('page-change', page)
    },
    handleSizeChange(size) {
      this.$emit('size-change', size)
    },
    handleMoreAction(command) {
      this.$emit('more-action', command)
    },
    handleAdvancedSearch() {
      this.$emit('advanced-search')
    },
    handleRefresh() {
      this.$emit('refresh')
    },
    handleTableSetting() {
      this.$emit('table-setting')
    }
  }
}
</script>

<style scoped>
.user-list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
