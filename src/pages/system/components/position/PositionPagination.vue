<template>
  <div class="pagination-container">
    <el-pagination
      :current-page="currentPage"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSize"
      :total="total"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handlePageChange"
    />
  </div>
</template>

<script>
export default {
  name: 'PositionPagination',
  props: {
    currentPage: {
      type: Number,
      default: 1
    },
    pageSize: {
      type: Number,
      default: 10
    },
    total: {
      type: Number,
      default: 0
    }
  },
  methods: {
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
.pagination-container {
  display: flex;
  justify-content: center;
  background: white;
  padding-bottom: 10px;
}
</style>
