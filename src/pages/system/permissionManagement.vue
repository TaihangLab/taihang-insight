<template>
  <div class="permission-management">
    <!-- 页面头部 -->
    <PermissionTreeHeader
      :selected-node="selectedNode"
      @add="openCreateDialog"
      @edit="openEditDialog"
      @delete="deleteNode"
      @refresh="refreshTree"
    />

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 工具栏 -->
      <PermissionTreeToolbar
        ref="toolbar"
        @filter="handleFilter"
        @expand-all="expandAll"
        @collapse-all="collapseAll"
      />

      <!-- 权限树 -->
      <PermissionTreePanel
        ref="treePanel"
        :tree-data="permissionTree"
        :loading="loading"
        :filter-text="filterText"
        @node-click="onNodeClick"
        @add-child="addChildNode"
        @edit="editNode"
        @delete="deleteNode"
        @create-first="openCreateDialog"
      />
    </div>

    <!-- 编辑对话框 -->
    <permission-edit-dialog
      :visible.sync="dialogVisible"
      :mode="dialogMode"
      :node="editingNode"
      :parent-node="parentForNewNode"
      :permission-tree="permissionTree"
      @saved="onPermissionSaved"
    />
  </div>
</template>

<script>
import PermissionTreeHeader from './components/permission/PermissionTreeHeader.vue'
import PermissionTreeToolbar from './components/permission/PermissionTreeToolbar.vue'
import PermissionTreePanel from './components/permission/PermissionTreePanel.vue'
import PermissionEditDialog from './components/PermissionEditDialog.vue'
import { usePermissionData } from './composable/permission/usePermissionData'

export default {
  name: 'PermissionManagement',
  components: {
    PermissionTreeHeader,
    PermissionTreeToolbar,
    PermissionTreePanel,
    PermissionEditDialog
  },

  data() {
    return {
      selectedNode: null,
      filterText: '',
      dialogVisible: false,
      dialogMode: 'create',
      editingNode: null,
      parentForNewNode: null
    }
  },

  async created() {
    await this.fetchPermissionTree()
  },

  methods: {
    // 刷新权限树
    async refreshTree() {
      this.selectedNode = null
      await this.fetchPermissionTree()
      this.$message.success('刷新成功')
    },

    // 树节点点击事件
    onNodeClick(data) {
      this.selectedNode = data
    },

    // 搜索过滤
    handleFilter(text) {
      this.filterText = text
    },

    // 展开全部节点
    expandAll() {
      this.$refs.treePanel.expandAll()
    },

    // 收起全部节点
    collapseAll() {
      this.$refs.treePanel.collapseAll()
    },

    // 打开创建对话框
    openCreateDialog() {
      this.dialogMode = 'create'
      this.editingNode = null
      this.parentForNewNode = this.selectedNode
      this.dialogVisible = true
    },

    // 打开编辑对话框
    openEditDialog() {
      if (!this.selectedNode) {
        this.$message.warning('请先选择要编辑的权限节点')
        return
      }
      this.dialogMode = 'edit'
      this.editingNode = this.selectedNode
      this.parentForNewNode = null
      this.dialogVisible = true
    },

    // 添加子节点
    addChildNode(parentNode) {
      this.dialogMode = 'create'
      this.editingNode = null
      this.parentForNewNode = parentNode
      this.dialogVisible = true
    },

    // 编辑节点
    editNode(node) {
      this.dialogMode = 'edit'
      this.editingNode = node
      this.parentForNewNode = null
      this.selectedNode = node
      this.dialogVisible = true
    },

    // 删除节点
    deleteNode(node) {
      const targetNode = node || this.selectedNode
      if (!targetNode) {
        this.$message.warning('请先选择要删除的权限节点')
        return
      }

      const hasChildren = targetNode.children && targetNode.children.length > 0
      const confirmMessage = hasChildren
        ? `确定要删除权限 "${targetNode.name}" 吗？该节点包含 ${targetNode.children.length} 个子节点，将一并删除。`
        : `确定要删除权限 "${targetNode.name}" 吗？`

      this.$confirm(confirmMessage, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await this.deletePermission(targetNode.id, true)
          this.$message.success('删除成功')
          await this.fetchPermissionTree()
          this.selectedNode = null
        } catch (error) {
          this.$message.error(error.message || '删除失败')
        }
      }).catch(() => {
        // 用户取消
      })
    },

    // 权限保存成功回调
    async onPermissionSaved(data) {
      try {
        if (this.dialogMode === 'create') {
          await this.createPermission(data)
          this.$message.success('创建成功')
        } else {
          await this.updatePermission(data.id, data)
          this.$message.success('更新成功')
        }
        await this.fetchPermissionTree()
        this.selectedNode = null
      } catch (error) {
        this.$message.error(error.message || '保存失败')
        throw error
      }
    }
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
  }
}
</script>

<style scoped>
.permission-management {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100%;
}

.main-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  padding: 20px;
}
</style>
