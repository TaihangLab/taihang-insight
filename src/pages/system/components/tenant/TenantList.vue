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

<script>
import TenantTableActions from './TenantTableActions.vue'
import TenantTable from './TenantTable.vue'
import TenantPagination from './TenantPagination.vue'

export default {
  name: 'TenantList',
  components: {
    TenantTableActions,
    TenantTable,
    TenantPagination
  },
  props: {
    tenants: {
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
  data() {
    return {
      selectedCodes: []
    }
  },
  methods: {
    handleSelectionChange(codes) {
      this.selectedCodes = codes
      this.$emit('selection-change', codes)
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
      this.$emit('batch-delete', this.selectedCodes)
    },
    handleStatusChange(row) {
      this.$emit('status-change', row)
    },
    handlePageChange(page) {
      this.$emit('page-change', page)
    },
    handleSizeChange(size) {
      this.$emit('size-change', size)
    },
    handleExport() {
      this.$emit('export', this.selectedCodes)
    }
  }
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
