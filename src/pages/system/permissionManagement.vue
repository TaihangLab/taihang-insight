<!--
  权限管理页面
  使用 <script setup> + TypeScript
  仅支持树形视图
  使用蛇形命名 (snake_case) 与后端保持一致
-->
<template>
  <div class="permission-management-page">
    <!-- 权限编辑对话框 -->
    <PermissionEditDialog
      v-model:visible="editDialogVisible"
      :mode="editMode"
      :node="currentNode"
      :parent-node="parentNode"
      :permission-tree="permissionTree"
      @submit="handlePermissionSubmit"
    />

    <!-- 搜索和操作栏 -->
    <el-card class="search-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="card-actions">
            <el-button
              type="info"
              icon="Expand"
              @click="toggleExpandAll"
            >
              {{ expandAll ? '收起全部' : '展开全部' }}
            </el-button>
            <el-button type="primary" icon="Plus" @click="handleAdd">新增权限</el-button>
          </div>
        </div>
      </template>

      <el-form :model="queryForm" inline>
        <el-form-item label="权限名称">
          <el-input
            v-model="queryForm.permission_name"
            placeholder="请输入权限名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="权限编码">
          <el-input
            v-model="queryForm.permission_code"
            placeholder="请输入权限编码"
            clearable
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-select
            v-model="queryForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="启用" :value="0" />
            <el-option label="停用" :value="1" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 权限树表格 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="permissionTree"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="false"
        ref="treeTableRef"
      >
        <el-table-column prop="id" label="id" width="220" />

        <el-table-column prop="permission_name" label="权限名称" width="220" >
          <template #default="{ row }">
            <span v-if="row.icon">
              <el-icon><component :is="row.icon" /></el-icon>
              {{ row.permission_name }}
            </span>
            <span v-else>{{ row.permission_name }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="permission_code" label="权限编码" width="220" />

        <el-table-column prop="node_type" label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getNodeTypeTagType(row.node_type)" size="small">
              {{ getNodeTypeLabel(row.node_type) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="path" label="路由路径" min-width="180">
          <template #default="{ row }">
            <span>{{ row.path || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="sort_order" label="排序" width="100" align="center" />

        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="0"
              :inactive-value="1"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>

        <el-table-column prop="visible" label="可见" width="100" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.visible"><View /></el-icon>
            <el-icon v-else><Hide /></el-icon>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="250" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button
              link
              type="success"
              size="small"
              @click="handleAddChild(row)"
            >
              新增子节点
            </el-button>
            <el-button
              v-if="!row.children || row.children.length === 0"
              link
              type="danger"
              size="small"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 权限管理页面
 * 使用 Composition API + TypeScript
 * 仅支持树形视图
 * 使用蛇形命名 (snake_case) 与后端保持一致
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { View, Hide } from '@element-plus/icons-vue'
import type { PermissionTreeNode } from '@/types/rbac/permission';
import { PermissionNodeType } from '@/types/rbac/permission';
import {
  PermissionSearchConditions,
  usePermissionData
} from '@/pages/system/composable/permission/usePermissionData';
import PermissionEditDialog from '@/pages/system/components/permission/PermissionEditDialog.vue';

// ============================================
// Composables
// ============================================

const {
  permissionTree,
  loading,
  fetchPermissionTree,
  createPermission,
  updatePermission,
  updatePermissionStatus,
  deletePermission
} = usePermissionData();

// ============================================
// 响应式状态
// ============================================

// 是否展开全部
const expandAll = ref(false);

// 树表格引用
const treeTableRef = ref();

// 查询表单
const queryForm = reactive<PermissionSearchConditions>({
  permission_name: '',
  permission_code: '',
  status: undefined
});

// 对话框状态
const editDialogVisible = ref(false);
const editMode = ref<'create' | 'edit'>('create');
const currentNode = ref<PermissionTreeNode | null>(null);
const parentNode = ref<PermissionTreeNode | null>(null);

// ============================================
// 辅助函数
// ============================================

/**
 * 获取节点类型标签颜色
 * Element Plus el-tag type: 'primary' | 'success' | 'info' | 'warning' | 'danger'
 */
const getNodeTypeTagType = (nodeType: string) => {
  const typeMap: Record<string, string> = {
    directory: 'info',     // 目录使用 info (蓝色)
    menu: 'warning',        // 菜单使用 warning (橙色)
    button: 'success'       // 按钮使用 success (绿色)
  };
  return typeMap[nodeType] || 'info';
};

/**
 * 获取节点类型标签文本
 */
const getNodeTypeLabel = (nodeType: string) => {
  const labelMap: Record<string, string> = {
    directory: '目录',
    menu: '菜单',
    button: '按钮'
  };
  return labelMap[nodeType] || '';
};

// ============================================
// 方法
// ============================================

/**
 * 加载权限树
 */
const loadPermissionTree = async () => {
  try {
    permissionTree.value= await fetchPermissionTree();
  } catch (error: unknown) {
    const err = error as Error;
    ElMessage.error(`加载权限树失败: ${err.message}`);
  }
};

/**
 * 切换展开/收起全部
 */
const toggleExpandAll = () => {
  expandAll.value = !expandAll.value;
  if (treeTableRef.value) {
    // 递归展开/收起所有行
    const toggleRow = (data: PermissionTreeNode[], expanded: boolean) => {
      data.forEach(row => {
        if (treeTableRef.value) {
          treeTableRef.value.toggleRowExpansion(row, expanded);
        }
        if (row.children && row.children.length > 0) {
          toggleRow(row.children, expanded);
        }
      });
    };
    toggleRow(permissionTree.value, expandAll.value);
  }
};

/**
 * 查询处理（前端过滤）
 */
const handleSearch = () => {
  // 树形视图下使用前端过滤
  loadPermissionTree();
};

/**
 * 重置处理
 */
const handleReset = () => {
  queryForm.permission_name = '';
  queryForm.permission_code = '';
  queryForm.status = undefined;
  loadPermissionTree();
};

/**
 * 新增权限处理
 */
const handleAdd = () => {
  editMode.value = 'create';
  currentNode.value = null;
  parentNode.value = null;
  editDialogVisible.value = true;
};

/**
 * 编辑权限处理
 */
const handleEdit = (row: PermissionTreeNode) => {
  editMode.value = 'edit';
  currentNode.value = row;
  parentNode.value = null;
  editDialogVisible.value = true;
};

/**
 * 新增子节点处理
 */
const handleAddChild = (row: PermissionTreeNode) => {
  editMode.value = 'create';
  currentNode.value = null;
  parentNode.value = row;
  editDialogVisible.value = true;
};

/**
 * 权限表单提交处理
 */
const handlePermissionSubmit = async (formData: Record<string, unknown>) => {
  try {
    if (editMode.value === 'edit' && currentNode.value) {
      // 编辑权限
      await updatePermission(currentNode.value.id, formData);
      ElMessage.success('权限修改成功');
    } else {
      // 新增权限
      await createPermission(formData);
      ElMessage.success('权限添加成功');
    }
    editDialogVisible.value = false;
    loadPermissionTree();
  } catch (error: unknown) {
    const err = error as Error;
    ElMessage.error(`保存失败: ${err.message}`);
  }
};

/**
 * 状态切换处理
 */
const handleStatusChange = async (row: PermissionTreeNode) => {
  try {
    await updatePermissionStatus(row.id, row.status);
    ElMessage.success('状态更新成功');
    loadPermissionTree();
  } catch (error: unknown) {
    const err = error as Error;
    ElMessage.error(`状态更新失败: ${err.message}`);
    // 恢复原状态
    row.status = row.status === 0 ? 1 : 0;
  }
};

/**
 * 删除权限处理
 */
const handleDelete = async (row: PermissionTreeNode) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除权限 "${row.permission_name}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    await deletePermission(row.id);
    ElMessage.success('删除成功');
    loadPermissionTree();
  } catch {
    // 用户取消操作
  }
};

// ============================================
// 生命周期
// ============================================

onMounted(() => {
  loadPermissionTree();
});
</script>

<style scoped>
.permission-management-page {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  min-height: calc(100vh - 240px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-actions {
  display: flex;
  gap: 10px;
}
</style>
