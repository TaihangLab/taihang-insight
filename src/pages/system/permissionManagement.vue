<template>
  <div class="permission-management-page">
    <!-- 查询区 -->
    <PermissionSearchBar
      v-model="searchConditions"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 列表区 -->
    <div class="table-container">
      <PermissionTableActions
        @add="handleAdd"
        @refresh="handleRefresh"
        @toggle-expand="handleToggleExpand"
      />

      <PermissionTreeTable
        ref="treeTable"
        :data="permissionTree"
        :loading="loading"
        :default-expand-all="defaultExpandAll"
        @edit="handleEdit"
        @add-sub="handleAddSub"
        @delete="handleDelete"
      />
    </div>

    <!-- 权限编辑对话框 -->
    <PermissionEditDialog
      :visible.sync="editDialogVisible"
      :mode="dialogMode"
      :node="currentPermission"
      :parent-node="parentForNewNode"
      :permission-tree="permissionTree"
      @saved="handleSaved"
    />

    <!-- 删除确认对话框 -->
    <DeleteConfirmDialog
      :visible.sync="deleteDialogVisible"
      :target-name="deleteTargetName"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<script>
import PermissionSearchBar from './components/permission/PermissionSearchBar.vue'
import PermissionTableActions from './components/permission/PermissionTableActions.vue'
import PermissionTreeTable from './components/permission/PermissionTreeTable.vue'
import PermissionEditDialog from './components/permission/PermissionEditDialog.vue'
import DeleteConfirmDialog from './components/permission/DeleteConfirmDialog.vue'
import { usePermissionData } from './composable/permission/usePermissionData.js'

export default {
  name: 'PermissionManagement',
  components: {
    PermissionSearchBar,
    PermissionTableActions,
    PermissionTreeTable,
    PermissionEditDialog,
    DeleteConfirmDialog
  },
  setup() {
    const {
      permissionTree,
      loading,
      fetchPermissionTree,
      createPermission,
      updatePermission,
      deletePermission
    } = usePermissionData()

    return {
      permissionTree,
      loading,
      fetchPermissionTree,
      createPermission,
      updatePermission,
      deletePermission
    }
  },
  data() {
    return {
      // 搜索条件
      searchConditions: {
        name: '',
        code: '',
        type: '',
        status: null
      },
      // 展开控制
      defaultExpandAll: false,
      expandAll: true,
      // 对话框状态
      editDialogVisible: false,
      deleteDialogVisible: false,
      dialogMode: 'create',
      currentPermission: null,
      parentForNewNode: null,
      deleteTargetName: ''
    }
  },
  async created() {
    await this.loadData()
  },
  methods: {
    /**
     * 加载数据
     */
    async loadData() {
      try {
        await this.fetchPermissionTree(this.buildParams())
        // 数据加载完成后展开所有节点
        this.$nextTick(() => {
          if (this.$refs.treeTable) {
            this.$refs.treeTable.toggleExpandAll(true)
          }
        })
      } catch (error) {
        // 根据错误类型显示不同的提示
        if (error.code === 403 || error.status === 403) {
          this.$message.error('无权限访问权限管理功能')
        } else {
          this.$message.error(error.message || '获取权限列表失败')
        }
      }
    },

    /**
     * 构建查询参数
     */
    buildParams() {
      const params = {}
      if (this.searchConditions.name) {
        params.name = this.searchConditions.name
      }
      if (this.searchConditions.code) {
        params.code = this.searchConditions.code
      }
      if (this.searchConditions.type) {
        params.type = this.searchConditions.type
      }
      if (this.searchConditions.status !== null && this.searchConditions.status !== '') {
        params.status = this.searchConditions.status
      }
      return params
    },

    /**
     * 搜索
     */
    handleSearch(conditions) {
      this.searchConditions = { ...conditions }
      this.loadData()
    },

    /**
     * 重置
     */
    handleReset(conditions) {
      this.searchConditions = { ...conditions }
      this.loadData()
    },

    /**
     * 刷新
     */
    handleRefresh() {
      this.loadData()
    },

    /**
     * 展开/折叠
     */
    handleToggleExpand(expand) {
      if (this.$refs.treeTable) {
        this.$refs.treeTable.toggleExpandAll(expand)
      }
    },

    /**
     * 新增权限
     */
    handleAdd() {
      this.dialogMode = 'create'
      this.currentPermission = null
      this.parentForNewNode = null
      this.editDialogVisible = true
    },

    /**
     * 添加子权限
     */
    handleAddSub(row) {
      this.dialogMode = 'create'
      this.currentPermission = null
      this.parentForNewNode = row
      this.editDialogVisible = true
    },

    /**
     * 编辑权限
     */
    handleEdit(row) {
      this.dialogMode = 'edit'
      this.currentPermission = row
      this.parentForNewNode = null
      this.editDialogVisible = true
    },

    /**
     * 删除权限
     */
    handleDelete(row) {
      this.deleteTargetName = row.permission_name || row.permission_code
      this.currentPermission = row
      this.deleteDialogVisible = true
    },

    /**
     * 确认删除
     */
    async handleDeleteConfirm() {
      try {
        await this.deletePermission(this.currentPermission.id)
        this.$message.success('删除成功')
        this.deleteDialogVisible = false
        this.loadData()
      } catch (error) {
        this.$message.error(`删除失败: ${error.message}`)
      }
    },

    /**
     * 权限保存成功回调
     */
    async handleSaved(data) {
      try {
        if (this.dialogMode === 'create') {
          await this.createPermission(data)
          this.$message.success('创建成功')
        } else {
          await this.updatePermission(data.id, data)
          this.$message.success('更新成功')
        }
        this.editDialogVisible = false
        this.loadData()
      } catch (error) {
        this.$message.error(error.message || '保存失败')
        throw error
      }
    }
  }
}
</script>

<style scoped>
.permission-management-page {
  padding: 20px;
  background: linear-gradient(to bottom, #fafafa 0%, #f5f5f5 100%);
  min-height: calc(100vh - 100px);
}

.table-container {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #ebeef5;
  margin-top: 0;
  position: relative;
  overflow: hidden;
}
</style>
