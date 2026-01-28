<template>
  <div class="department-pagination">
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

<script setup lang="ts">
defineProps<{
  currentPage: number
  pageSize: number
  total: number
}>()

const emit = defineEmits<{
  sizeChange: [size: number]
  pageChange: [page: number]
}>()

const handleSizeChange = (size: number) => {
  emit('sizeChange', size)
}

const handleCurrentChange = (page: number) => {
  emit('pageChange', page)
}
</script>

<style scoped>
.department-pagination {
  display: flex;
  justify-content: center;
  background: white;
  padding: 20px;
}

.department-pagination :deep(.el-pagination__total) {
  padding-top: 3px;
}

.department-pagination :deep(.el-pagination) {
  display: flex;
  justify-content: center;
}

.department-pagination :deep(.el-pagination .el-pager li) {
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 4px;
  color: #3b82f6;
  margin: 0 2px;
}

.department-pagination :deep(.el-pagination .el-pager li:hover) {
  color: #1d4ed8;
  border-color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.05);
}

.department-pagination :deep(.el-pagination .el-pager li.active) {
  background: #3b82f6 !important;
  border-color: #3b82f6 !important;
  color: white !important;
  font-weight: 600 !important;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

.department-pagination :deep(.el-pagination button) {
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.department-pagination :deep(.el-pagination button:hover) {
  color: #1d4ed8;
  border-color: #3b82f6;
}

.department-pagination :deep(.el-pagination .btn-prev),
.department-pagination :deep(.el-pagination .btn-next) {
  background-color: white !important;
  border: 1px solid #dcdfe6 !important;
  color: #606266 !important;
}
</style>
