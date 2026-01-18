<template>
  <div class="user-pagination">
    <el-pagination
      :current-page="currentPage"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    ></el-pagination>
  </div>
</template>

<script>
export default {
  name: 'UserPagination',
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
    handleSizeChange(size) {
      this.$emit('size-change', size)
    },
    handleCurrentChange(page) {
      this.$emit('page-change', page)
    }
  }
}
</script>

<style scoped>
.user-pagination {
  margin-top: 20px;
  text-align: center;
}
</style>
