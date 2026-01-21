<template>
  <div class="permission-tree-table">
    <el-table
      ref="treeTable"
      :data="processedData"
      v-loading="loading"
      row-key="id"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      :default-expand-all="defaultExpandAll"
    >
      <!-- 权限类型图标 + 名称 -->
      <el-table-column label="权限名称"  min-width="200"  header-align="center">
        <template #default="scope">
            <span class="name-text">{{ scope.row.permission_name }}</span>
        </template>
      </el-table-column>


     <el-table-column label="权限图标" header-align="center">
        <template #default="scope">
           <i :class="getTypeIcon(scope.row.permission_type)" class="type-icon"></i>
        </template>
      </el-table-column>

      <!-- 权限码 -->
      <el-table-column prop="permission_code" label="权限码" min-width="200" align="center">
        <template #default="scope">
          <code class="permission-code">{{ scope.row.permission_code }}</code>
        </template>
      </el-table-column>

      <!-- 路由路径 -->
      <el-table-column prop="path" label="路由路径" min-width="180" align="center">
        <template #default="scope">
          <span class="path-text">{{ scope.row.path || '-' }}</span>
        </template>
      </el-table-column>

      <!-- 类型标签 -->
      <el-table-column label="类型" width="100" align="center">
        <template #default="scope">
          <el-tag :type="getTypeTagType(scope.row.permission_type)" size="small">
            {{ getTypeLabel(scope.row.permission_type) }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 排序 -->
      <el-table-column prop="sort_order" label="排序" width="80" align="center">
        <template #default="scope">
          {{ scope.row.sort_order || 0 }}
        </template>
      </el-table-column>

      <!-- 状态 -->
      <el-table-column label="状态" width="80" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === 0 ? 'success' : 'danger'" size="mini">
            {{ scope.row.status === 0 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 操作 -->
      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template #default="scope">
          <div class="operation-buttons">
            <el-button
              v-if="scope.row.permission_type !== 'button'"
              type="text"
              class="add-btn"
              @click="handleAddSub(scope.row)"
              title="添加子项"
            >添加</el-button>
            <el-button
              type="text"
              class="edit-btn"
              @click="handleEdit(scope.row)"
              title="编辑"
            >编辑</el-button>
            <el-button
              type="text"
              class="delete-btn"
              @click="handleDelete(scope.row)"
              title="删除"
            >删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { calculateTreeDepth } from '@/utils/treeUtils'

export default {
  name: 'PermissionTreeTable',
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
      return calculateTreeDepth(this.data, 'children', 0)
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
    getTypeIcon(type) {
      const icons = {
        folder: 'el-icon-folder',
        menu: 'el-icon-menu',
        button: 'el-icon-document'
      }
      return icons[type] || 'el-icon-document'
    },
    getTypeLabel(type) {
      const labels = {
        folder: '文件夹',
        menu: '页面',
        button: '按钮'
      }
      return labels[type] || type
    },
    getTypeTagType(type) {
      const types = {
        folder: '',
        menu: 'primary',
        button: 'info'
      }
      return types[type] || 'info'
    },
    getCategoryTagType(category) {
      const types = {
        READ: 'primary',
        WRITE: 'success',
        DELETE: 'danger',
        SPECIAL: 'warning'
      }
      return types[category] || 'info'
    },
    getCategoryLabel(category) {
      const labels = {
        READ: '读取',
        WRITE: '写入',
        DELETE: '删除',
        SPECIAL: '特殊'
      }
      return labels[category] || category
    },
    async toggleExpandAll(expand) {
      await this.$nextTick()
      await this.setTableExpandState(this.processedData, expand)
    },
    async setTableExpandState(data, expand) {
      for (const item of data) {
        if (item.children && item.children.length > 0) {
          if (this.$refs.treeTable) {
            this.$refs.treeTable.toggleRowExpansion(item, expand)
          }
          await this.$nextTick()
          await this.setTableExpandState(item.children, expand)
        }
      }
    }
  }
}
</script>

<style scoped>
</style>
