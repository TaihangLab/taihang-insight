<template>
  <el-table
    :data="data"
    v-loading="loading"
    class="custom-table"
    style="width: 100%"
    table-layout="fixed"
    @selection-change="handleSelectionChange"
  >
    <el-table-column type="selection" width="50" align="center" />
    <el-table-column prop="id" label="ID" min-width="100" align="center" />
    <el-table-column prop="position_name" label="岗位名称" min-width="150" align="center" />
    <el-table-column prop="department" label="部门" min-width="120" align="center" />
    <el-table-column prop="order_num" label="排序" width="80" align="center" />
    <el-table-column prop="status" label="状态" width="80" align="center">
      <template #default="scope">
        <el-tag :type="scope.row.status === 0 ? 'success' : 'danger'" size="mini">
          {{ scope.row.status === 0 ? '启用' : '停用' }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="remark" label="备注" min-width="150" align="center" />
    <el-table-column prop="create_time" label="创建时间" min-width="160" align="center" />
    <el-table-column label="操作" width="150" fixed="right" align="center">
      <template #default="scope">
        <div class="operation-buttons">
          <el-button link class="edit-btn" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button link class="delete-btn" @click="handleDelete(scope.row)">删除</el-button>
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
interface Position {
  id: string | number
  status: number
  [key: string]: any
}

defineProps<{
  data: Position[]
  loading: boolean
}>()

const emit = defineEmits<{
  selectionChange: [selection: Position[]]
  edit: [row: Position]
  delete: [row: Position]
}>()

const handleSelectionChange = (selection: Position[]) => {
  emit('selectionChange', selection)
}

const handleEdit = (row: Position) => {
  emit('edit', row)
}

const handleDelete = (row: Position) => {
  emit('delete', row)
}
</script>

<style scoped>
.custom-table {
  width: 100%;
}

.operation-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.edit-btn {
  color: #409EFF;
}

.delete-btn {
  color: #F56C6C;
}
</style>
