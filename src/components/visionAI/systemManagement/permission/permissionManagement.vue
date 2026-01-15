<template>
  <div class="permission-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>权限码管理</h2>
      <p class="page-description">管理系统权限，支持三级权限结构：文件夹、页面、按钮</p>
      <div class="header-actions">
        <el-button type="primary" icon="el-icon-plus" @click="openCreateDialog">新增</el-button>
        <el-button icon="el-icon-edit" @click="openEditDialog" :disabled="!selectedNode">编辑</el-button>
        <el-button icon="el-icon-delete" @click="deleteNode" :disabled="!selectedNode">删除</el-button>
        <el-button icon="el-icon-refresh" @click="refreshTree">刷新</el-button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 工具栏 -->
      <div class="toolbar">
        <el-input
          v-model="filterText"
          placeholder="搜索权限名称或权限码"
          prefix-icon="el-icon-search"
          clearable
          style="width: 300px"
          @input="handleFilterInput"
        />
        <div class="toolbar-actions">
          <el-button size="small" icon="el-icon-folder-opened" @click="expandAll">展开全部</el-button>
          <el-button size="small" icon="el-icon-folder" @click="collapseAll">收起全部</el-button>
        </div>
      </div>

      <!-- 权限树 -->
      <div class="tree-container" v-loading="loading">
        <el-tree
          ref="permissionTree"
          :data="permissionTreeData"
          :props="treeProps"
          :filter-node-method="filterNode"
          :expand-on-click-node="false"
          highlight-current
          node-key="id"
          default-expand-all
          @node-click="onNodeClick"
        >
          <span class="tree-node-content" slot-scope="{ node, data }">
            <span class="node-left">
              <i :class="getNodeIconClass(data.type)" class="node-icon"></i>
              <span class="node-label">{{ data.name }}</span>
              <span class="node-code">{{ data.code }}</span>
              <el-tag v-if="data.type === 'button'" size="mini" :type="getCategoryTagType(data.category)">
                {{ getCategoryLabel(data.category) }}
              </el-tag>
              <el-tag v-if="data.type === 'menu' && !data.visible" size="mini" type="info">隐藏</el-tag>
              <el-tag v-if="data.status === 1" size="mini" type="danger">禁用</el-tag>
            </span>
            <span class="node-actions">
              <!-- 文件夹和页面可以添加子项 -->
              <el-button
                v-if="data.type !== 'button'"
                type="text"
                size="mini"
                icon="el-icon-plus"
                @click.stop="addChildNode(data)"
                title="添加子项"
              >子项</el-button>
              <el-button
                type="text"
                size="mini"
                icon="el-icon-edit"
                @click.stop="editNode(data)"
                title="编辑"
              >编辑</el-button>
              <el-button
                type="text"
                size="mini"
                icon="el-icon-delete"
                class="delete-btn"
                @click.stop="deleteNode(data)"
                title="删除"
              >删除</el-button>
            </span>
          </span>
        </el-tree>

        <!-- 空状态 -->
        <div v-if="!loading && (!permissionTreeData || permissionTreeData.length === 0)" class="empty-state">
          <i class="el-icon-folder-opened"></i>
          <p>暂无权限数据</p>
          <el-button type="primary" size="small" @click="openCreateDialog">创建第一个权限</el-button>
        </div>
      </div>
    </div>

    <!-- 编辑对话框 -->
    <permission-edit-dialog
      :visible.sync="dialogVisible"
      :mode="dialogMode"
      :node="editingNode"
      :parent-node="parentForNewNode"
      @saved="onPermissionSaved"
    />
  </div>
</template>

<script>
import RBACService from '@/components/service/RBACService';
import PermissionEditDialog from './components/PermissionEditDialog';

export default {
  name: 'PermissionManagement',
  components: {
    PermissionEditDialog
  },
  data() {
    return {
      // 权限树数据
      permissionTreeData: [],
      loading: false,

      // 选中的节点
      selectedNode: null,

      // 搜索过滤
      filterText: '',

      // 对话框相关
      dialogVisible: false,
      dialogMode: 'create', // create | edit
      editingNode: null,
      parentForNewNode: null,

      // 树组件配置
      treeProps: {
        children: 'children',
        label: 'name'
      }
    };
  },

  async created() {
    await this.loadPermissionTree();
  },

  methods: {
    /**
     * 加载权限树
     */
    async loadPermissionTree() {
      this.loading = true;
      try {
        const response = await RBACService.getPermissionTree();
        this.permissionTreeData = response.data || [];
      } catch (error) {
        console.error('加载权限树失败:', error);
        this.$message.error('加载权限树失败');
      } finally {
        this.loading = false;
      }
    },

    /**
     * 刷新权限树
     */
    async refreshTree() {
      this.selectedNode = null;
      await this.loadPermissionTree();
      this.$message.success('刷新成功');
    },

    /**
     * 树节点点击事件
     */
    onNodeClick(data) {
      this.selectedNode = data;
    },

    /**
     * 搜索过滤
     */
    handleFilterInput() {
      this.$refs.permissionTree.filter(this.filterText);
    },

    filterNode(value, data) {
      if (!value) return true;
      const searchText = value.toLowerCase();
      return (
        (data.name && data.name.toLowerCase().includes(searchText)) ||
        (data.code && data.code.toLowerCase().includes(searchText))
      );
    },

    /**
     * 展开全部节点
     */
    expandAll() {
      const nodes = this.$refs.permissionTree.store.nodesMap;
      for (const key in nodes) {
        nodes[key].expanded = true;
      }
    },

    /**
     * 收起全部节点
     */
    collapseAll() {
      const nodes = this.$refs.permissionTree.store.nodesMap;
      for (const key in nodes) {
        nodes[key].expanded = false;
      }
    },

    /**
     * 获取节点图标类名
     */
    getNodeIconClass(type) {
      const icons = {
        folder: 'el-icon-folder',
        menu: 'el-icon-menu',
        button: 'el-icon-document'
      };
      return icons[type] || 'el-icon-document';
    },

    /**
     * 获取分类标签类型
     */
    getCategoryTagType(category) {
      const types = {
        READ: 'primary',
        WRITE: 'success',
        DELETE: 'danger',
        SPECIAL: 'warning'
      };
      return types[category] || 'info';
    },

    /**
     * 获取分类标签
     */
    getCategoryLabel(category) {
      const labels = {
        READ: '读取',
        WRITE: '写入',
        DELETE: '删除',
        SPECIAL: '特殊'
      };
      return labels[category] || category;
    },

    /**
     * 打开创建对话框
     */
    openCreateDialog() {
      this.dialogMode = 'create';
      this.editingNode = null;
      this.parentForNewNode = this.selectedNode;
      this.dialogVisible = true;
    },

    /**
     * 打开编辑对话框
     */
    openEditDialog() {
      if (!this.selectedNode) {
        this.$message.warning('请先选择要编辑的权限节点');
        return;
      }
      this.dialogMode = 'edit';
      this.editingNode = this.selectedNode;
      this.parentForNewNode = null;
      this.dialogVisible = true;
    },

    /**
     * 添加子节点
     */
    addChildNode(parentNode) {
      this.dialogMode = 'create';
      this.editingNode = null;
      this.parentForNewNode = parentNode;
      this.dialogVisible = true;
    },

    /**
     * 编辑节点
     */
    editNode(node) {
      this.dialogMode = 'edit';
      this.editingNode = node;
      this.parentForNewNode = null;
      // 选中的节点也要更新
      this.selectedNode = node;
      this.dialogVisible = true;
    },

    /**
     * 删除节点
     */
    deleteNode(node) {
      const targetNode = node || this.selectedNode;
      if (!targetNode) {
        this.$message.warning('请先选择要删除的权限节点');
        return;
      }

      const hasChildren = targetNode.children && targetNode.children.length > 0;
      const confirmMessage = hasChildren
        ? `确定要删除权限 "${targetNode.name}" 吗？该节点包含 ${targetNode.children.length} 个子节点，将一并删除。`
        : `确定要删除权限 "${targetNode.name}" 吗？`;

      this.$confirm(confirmMessage, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await RBACService.deletePermissionNode(targetNode.id, true);
          this.$message.success('删除成功');
          await this.loadPermissionTree();
          this.selectedNode = null;
        } catch (error) {
          console.error('删除失败:', error);
          this.$message.error(error.message || '删除失败');
        }
      }).catch(() => {
        // 用户取消
      });
    },

    /**
     * 权限保存成功回调
     */
    async onPermissionSaved(data) {
      try {
        if (this.dialogMode === 'create') {
          await RBACService.createPermissionNode(data);
          this.$message.success('创建成功');
        } else {
          await RBACService.updatePermissionNode(data.id, data);
          this.$message.success('更新成功');
        }
        await this.loadPermissionTree();
        this.selectedNode = null;
      } catch (error) {
        console.error('保存失败:', error);
        this.$message.error(error.message || '保存失败');
        throw error; // 重新抛出错误，让对话框不关闭
      }
    }
  }
};
</script>

<style scoped>
.permission-management {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100%;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.page-description {
  margin: 0 0 16px 0;
  color: #6b7280;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.main-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  padding: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.tree-container {
  min-height: 400px;
  position: relative;
}

.tree-node-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 8px;
}

.node-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  overflow: hidden;
}

.node-icon {
  font-size: 16px;
  color: #409eff;
}

.node-label {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.node-code {
  font-size: 12px;
  color: #909399;
  font-family: 'Courier New', monospace;
}

.node-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.tree-node-content:hover .node-actions {
  opacity: 1;
}

.delete-btn {
  color: #f56c6c;
}

.delete-btn:hover {
  color: #ff8d8d;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #909399;
}

.empty-state i {
  font-size: 64px;
  margin-bottom: 16px;
  color: #c0c4cc;
}

.empty-state p {
  font-size: 14px;
  margin-bottom: 20px;
}
</style>
