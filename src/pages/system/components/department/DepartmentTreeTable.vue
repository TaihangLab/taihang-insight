<template>
  <div class="department-tree-table">
    <el-table
      ref="treeTable"
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
            <el-button type="text" class="edit-btn" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="text" class="add-btn" @click="handleAddSub(scope.row)">添加</el-button>
            <el-button type="text" class="delete-btn" @click="handleDelete(scope.row)">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { calculateTreeDepth } from '@/utils/treeUtils'

export default {
  name: 'DepartmentTreeTable',
  props: {
    data: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    defaultExpandAll: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    processedData() {
      // 为树形数据计算深度，确保每个节点都有depth字段
      return calculateTreeDepth(this.data, 'children', 0);
    }
  },
  methods: {
    handleEdit(row) {
      this.$emit('edit', row)
    },
    handleAddSub(row) {
      this.$emit('add-sub', row)
    },
    handleDelete(row) {
      this.$emit('delete', row)
    },
    /**
     * 展开/折叠所有节点
     */
    async toggleExpandAll(expand) {
      await this.$nextTick()
      await this.setTableExpandState(this.processedData, expand)
    },
    /**
     * 递归设置表格展开状态
     */
    async setTableExpandState(data, expand) {
      for (const item of data) {
        if (item.children && item.children.length > 0) {
          // 先设置当前节点的展开状态
          if (this.$refs.treeTable) {
            this.$refs.treeTable.toggleRowExpansion(item, expand);
          }

          // 递归处理子节点
          await this.$nextTick();
          await this.setTableExpandState(item.children, expand);
        }
      }
    }
  }
}
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
  background: #f5f7fa !important;
  color: #303133 !important;
  border-bottom: 1px solid #ebeef5 !important;
}

.custom-table :deep(.el-table__row td) {
  text-align: center;
}

.custom-table :deep(.el-table .el-table__body tr:hover > td) {
  background: #f5f7fa !important;
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
  background: #f5f7fa !important;
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
