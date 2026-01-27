<template>
  <div class="department-tree-table">
    <el-table
      ref="treeTableRef"
      :data="processedData"
      v-loading="loading"
      row-key="id"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      style="width: 100%"
      :default-expand-all="defaultExpandAll"
    >
      <el-table-column prop="id" label="部门编码" min-width="140" align="center"></el-table-column>
      <el-table-column prop="name" label="部门名称" min-width="200" align="left" header-align="center">
        <template #default="scope">
          <span :style="{ paddingLeft: (scope.row.depth || 0) * 20 + 'px' }">{{ scope.row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="sort_order" label="排序" width="80" align="center"></el-table-column>
      <el-table-column prop="status" label="状态" width="80" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === 0 ? 'success' : 'danger'" size="mini">
            {{ scope.row.status === 0 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="create_time" label="创建时间" min-width="160" align="center"></el-table-column>
      <el-table-column label="操作" width="180" fixed="right" align="center">
        <template #default="scope">
          <div class="operation-buttons">
            <el-button link class="edit-btn" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button link class="add-btn" @click="handleAddSub(scope.row)">添加</el-button>
            <el-button link class="delete-btn" @click="handleDelete(scope.row)">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { ElTable } from 'element-plus'
import { calculateTreeDepth } from '@/utils/treeUtils'

interface Department {
  id: string | number
  name: string
  sort_order: number
  status: number
  children?: Department[]
  depth?: number
  [key: string]: any
}

const props = withDefaults(
  defineProps<{
    data: Department[]
    loading: boolean
    defaultExpandAll: boolean
  }>(),
  {
    data: () => [],
    loading: false,
    defaultExpandAll: true
  }
)

const emit = defineEmits<{
  edit: [row: Department]
  addSub: [row: Department]
  delete: [row: Department]
}>()

const treeTableRef = ref<InstanceType<typeof ElTable>>()

const processedData = computed(() => {
  return calculateTreeDepth(props.data, 'children', 0)
})

const handleEdit = (row: Department) => {
  emit('edit', row)
}

const handleAddSub = (row: Department) => {
  emit('addSub', row)
}

const handleDelete = (row: Department) => {
  emit('delete', row)
}

const toggleExpandAll = async (expand: boolean) => {
  await nextTick()
  await setTableExpandState(processedData.value, expand)
}

const setTableExpandState = async (data: Department[], expand: boolean) => {
  for (const item of data) {
    if (item.children && item.children.length > 0) {
      if (treeTableRef.value) {
        treeTableRef.value.toggleRowExpansion(item, expand)
      }

      await nextTick()
      await setTableExpandState(item.children, expand)
    }
  }
}

// Define expose after function definitions
defineExpose({
  toggleExpandAll
})
</script>

<style scoped>
.department-tree-table {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.custom-table :deep(.el-table__cell) {
  border-right: none;
}

.custom-table :deep(.el-table::before) {
  height: 0;
}

.custom-table :deep(.el-table__header-wrapper th) {
  font-weight: bold;
  text-align: center;
  background: var(--design-bg-secondary) !important;
  color: #303133 !important;
  border-bottom: 1px solid #ebeef5 !important;
}

.custom-table :deep(.el-table__row td) {
  text-align: center;
}

.custom-table :deep(.el-table .el-table__body tr:hover > td) {
  background: var(--design-bg-secondary) !important;
}

/* 部门名称列左对齐 */
.custom-table :deep(.el-table__row td:first-child) {
  text-align: left !important;
  padding-left: 16px !important;
}

.custom-table :deep(.el-table__header-wrapper th:first-child) {
  text-align: left !important;
  padding-left: 16px !important;
}

/* 折叠展开图标样式 */
.custom-table :deep(.el-table__expand-icon) {
  width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  margin-right: 8px;
  color: #3b82f6;
  font-size: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 3px;
  background: #f8fafc;
  transition: all 0.3s ease;
}

.custom-table :deep(.el-table__expand-icon:hover) {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.custom-table :deep(.el-table__expand-icon--expanded) {
  transform: rotate(90deg);
}

.operation-buttons {
  display: flex;
  justify-content: center;
  gap: 4px;
  flex-wrap: nowrap;
}

.edit-btn,
.delete-btn,
.add-btn {
  padding: 2px 6px !important;
  font-size: 11px !important;
  border-radius: 4px !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  background: var(--design-bg-secondary) !important;
  border-color: #e4e7ed !important;
  color: #606266 !important;
  height: 24px !important;
  min-width: 45px !important;
}

.edit-btn:hover,
.delete-btn:hover,
.add-btn:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  border-color: #3b82f6 !important;
  color: #1e3a8a !important;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2) !important;
  transform: translateY(-1px) !important;
}

/* 状态标签样式 */
.custom-table :deep(.el-tag) {
  border-radius: 6px !important;
  font-weight: 500 !important;
  font-size: 12px !important;
  padding: 0 8px !important;
  height: 24px !important;
  line-height: 22px !important;
}

.custom-table :deep(.el-tag.el-tag--success) {
  background-color: #f0f9ff !important;
  border-color: #b3d8ff !important;
  color: #2e7acc !important;
}

.custom-table :deep(.el-tag.el-tag--danger) {
  background-color: #fef0f0 !important;
  border-color: #fbc4c4 !important;
  color: #f56c6c !important;
}
</style>
