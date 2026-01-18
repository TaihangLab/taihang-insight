<template>
  <div class="position-list-container">
    <!-- 表格操作区域 -->
    <PositionTableActions
      :selected-count="selectedCount"
      @add="handleAdd"
      @batch-delete="handleBatchDelete"
      @export="handleExport"
    />

    <!-- 表格 -->
    <PositionTable
      :data="data"
      :loading="loading"
      @selection-change="handleSelectionChange"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <!-- 分页 -->
    <PositionPagination
      :current-page="currentPage"
      :page-size="pageSize"
      :total="total"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    />
  </div>
</template>

<script>
import PositionTableActions from './PositionTableActions.vue'
import PositionTable from './PositionTable.vue'
import PositionPagination from './PositionPagination.vue'

export default {
  name: 'PositionList',
  components: {
    PositionTableActions,
    PositionTable,
    PositionPagination
  },
  props: {
    data: {
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
  computed: {
    currentPage() {
      return this.pagination.currentPage
    },
    pageSize() {
      return this.pagination.pageSize
    },
    selectedCount() {
      return this.data.filter(item => item._selected).length
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
    handleExport() {
      this.$emit('export')
    },
    handlePageChange(page) {
      this.$emit('page-change', page)
    },
    handleSizeChange(size) {
      this.$emit('size-change', size)
    }
  }
}
</script>

<style scoped>
.position-list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
