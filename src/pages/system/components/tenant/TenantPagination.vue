<template>
  <div class="tenant-pagination">
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
  name: 'TenantPagination',
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
.tenant-pagination {
  display: flex;
  justify-content: center;
  background: white;
  padding-bottom: 10px;
}

.tenant-pagination >>> .el-pagination__total {
  padding-top: 3px;
}

.tenant-pagination >>> .el-pagination {
  display: flex;
  justify-content: center;
}

.tenant-pagination >>> .el-pagination .el-pager li {
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 4px;
  color: #3b82f6;
  margin: 0 2px;
}

.tenant-pagination >>> .el-pagination .el-pager li:hover {
  color: #1d4ed8;
  border-color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.05);
}

.tenant-pagination >>> .el-pagination .el-pager li.active {
  background: #3b82f6 !important;
  border-color: #3b82f6 !important;
  color: white !important;
  font-weight: 600 !important;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

.tenant-pagination >>> .el-pagination button {
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.tenant-pagination >>> .el-pagination button:hover {
  color: #1d4ed8;
  border-color: #3b82f6;
}

.tenant-pagination >>> .el-pagination .btn-prev,
.tenant-pagination >>> .el-pagination .btn-next {
  background-color: white !important;
  border: 1px solid #dcdfe6 !important;
  color: #606266 !important;
}
</style>
