<template>
  <div class="role-table-container">
    <el-table :data="data" class="role-table" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column prop="role_name" label="角色名称" min-width="150" align="center" />
      <el-table-column prop="role_code" label="角色代码" min-width="150" align="center" />
      <el-table-column prop="description" label="描述" min-width="200" align="center" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="scope">
          <el-switch
            v-model="scope.row.status"
            :active-value="0"
            :inactive-value="1"
            active-color="#3b82f6"
            inactive-color="#9ca3af"
            @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="250" fixed="right" align="center">
        <template #default="scope">
          <div class="operation-buttons">
            <el-button link class="auth-btn" @click="handleAuthorization(scope.row)">授权</el-button>
            <el-button link class="edit-btn" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button link class="delete-btn" @click="handleDelete(scope.row)">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <div class="role-pagination-container" v-if="total > 0">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        :current-page="pagination.currentPage"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pagination.pageSize"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Role {
  id: string | number
  status: number
  [key: string]: any
}

interface Pagination {
  currentPage: number
  pageSize: number
}

defineProps<{
  data: Role[]
  pagination: Pagination
  total: number
}>()

const emit = defineEmits<{
  selectionChange: [selection: Role[]]
  statusChange: [row: Role]
  edit: [row: Role]
  delete: [row: Role]
  authorization: [row: Role]
  sizeChange: [size: number]
  pageChange: [page: number]
}>()

const handleSelectionChange = (selection: Role[]) => {
  emit('selectionChange', selection)
}

const handleStatusChange = (row: Role) => {
  emit('statusChange', row)
}

const handleEdit = (row: Role) => {
  emit('edit', row)
}

const handleDelete = (row: Role) => {
  emit('delete', row)
}

const handleAuthorization = (row: Role) => {
  emit('authorization', row)
}

const handleSizeChange = (size: number) => {
  emit('sizeChange', size)
}

const handlePageChange = (page: number) => {
  emit('pageChange', page)
}
</script>

<style scoped>
.role-table-container {
  width: 100%;
}

.role-table {
  width: 100%;
  margin-bottom: 20px;
}

.role-pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.operation-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.auth-btn {
  color: #67c23a;
}

.edit-btn {
  color: #409eff;
}

.delete-btn {
  color: #f56c6c;
}
</style>
