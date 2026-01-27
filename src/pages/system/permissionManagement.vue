<!--
  权限管理页面
  使用 <script setup> + TypeScript
  支持树形视图和表格视图两种展示方式
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

    <!-- 视图切换和搜索 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="queryForm" inline>
        <el-form-item>
          <el-radio-group v-model="viewMode" @change="handleViewModeChange">
            <el-radio-button value="tree">树形视图</el-radio-button>
            <el-radio-button value="table">表格视图</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="权限名称">
          <el-input
            v-model="queryForm.permission_name"
            placeholder="请输入权限名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="权限编码">
          <el-input
            v-model="queryForm.permission_code"
            placeholder="请输入权限编码"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="权限类型">
          <el-select
            v-model="queryForm.permission_type"
            placeholder="请选择权限类型"
            clearable
            style="width: 150px"
          >
            <el-option label="目录" value="directory" />
            <el-option label="菜单" value="menu" />
            <el-option label="按钮" value="button" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select
            v-model="queryForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="启用" :value="Status.ENABLED" />
            <el-option label="停用" :value="Status.DISABLED" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">权限列表</span>
          <div class="card-actions">
            <el-button
              v-if="viewMode === 'tree'"
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

      <!-- 树形表格 -->
      <el-table
        v-if="viewMode === 'tree'"
        v-loading="loading"
        :data="permissionTree"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="false"
        ref="treeTableRef"
      >
        <el-table-column prop="permissionName" label="权限名称" width="250" />

        <el-table-column prop="permissionCode" label="权限编码" width="200" />

        <el-table-column prop="permissionType" label="权限类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getPermissionTypeTagType(row.permissionType)">
              {{ getPermissionTypeLabel(row.permissionType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="nodeType" label="节点类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getNodeTypeTagType(row.nodeType)">
              {{ getNodeTypeLabel(row.nodeType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="path" label="路由路径" width="200">
          <template #default="{ row }">
            <span>{{ row.path || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="icon" label="图标" width="100">
          <template #default="{ row }">
            <span>{{ row.icon || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="sortOrder" label="排序" width="80" />

        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === Status.ENABLED ? 'success' : 'danger'">
              {{ row.status === Status.ENABLED ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="visible" label="可见" width="80">
          <template #default="{ row }">
            <el-tag :type="row.visible ? 'success' : 'info'">
              {{ row.visible ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button
              link
              type="primary"
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

      <!-- 普通表格 -->
      <el-table
        v-else
        v-loading="loading"
        :data="permissions"
      >
        <el-table-column prop="permissionCode" label="权限编码" width="150" />

        <el-table-column prop="permissionName" label="权限名称" width="150" />

        <el-table-column prop="permissionType" label="权限类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getPermissionTypeTagType(row.permissionType)">
              {{ getPermissionTypeLabel(row.permissionType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === Status.ENABLED ? 'success' : 'danger'">
              {{ row.status === Status.ENABLED ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="创建时间" width="180" />

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 表格视图的分页 -->
      <div v-if="viewMode === 'table'" class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handleCurrentChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 权限管理页面
 * 使用 Composition API + TypeScript
 * 支持树形视图和表格视图
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { Permission } from '@/types/rbac';
import type { PermissionTreeNode, PermissionType, PermissionNodeType } from '@/types/rbac/permission';
import { Status } from '@/types/rbac';
import {
  PermissionSearchConditions,
  usePermissionData
} from '@/pages/system/composable/permission/usePermissionData';
import PermissionEditDialog from '@/pages/system/components/permission/PermissionEditDialog.vue';

// ============================================
// Composables
// ============================================

const {
  permissions,
  permissionTree,
  loading,
  pagination,
  fetchPermissions,
  fetchPermissionTree,
  createPermission,
  updatePermission,
  updatePermissionStatus,
  deletePermission
} = usePermissionData();

// ============================================
// 响应式状态
// ============================================

// 视图模式: 'tree' | 'table'
const viewMode = ref<'tree' | 'table'>('tree');

// 是否展开全部
const expandAll = ref(false);

// 树表格引用
const treeTableRef = ref();

// 查询表单
const queryForm = reactive<PermissionSearchConditions>({
  permission_name: '',
  permission_code: '',
  permission_type: undefined,
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
 * 获取权限类型标签颜色 (PermissionType: page, button, data)
 */
const getPermissionTypeTagType = (type: PermissionType) => {
  const typeMap: Record<PermissionType, string> = {
    page: 'info',
    button: 'success',
    data: 'warning'
  };
  return typeMap[type] || '';
};

/**
 * 获取权限类型标签文本 (PermissionType: page, button, data)
 */
const getPermissionTypeLabel = (type: PermissionType) => {
  const labelMap: Record<PermissionType, string> = {
    page: '页面',
    button: '按钮',
    data: '数据'
  };
  return labelMap[type] || '';
};

/**
 * 获取节点类型标签颜色
 */
const getNodeTypeTagType = (nodeType: PermissionNodeType) => {
  const typeMap: Record<PermissionNodeType, string> = {
    directory: 'info',
    menu: 'warning',
    button: 'success'
  };
  return typeMap[nodeType] || '';
};

/**
 * 获取节点类型标签文本
 */
const getNodeTypeLabel = (nodeType: PermissionNodeType) => {
  const labelMap: Record<PermissionNodeType, string> = {
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
 * 加载权限列表（表格视图）
 */
const loadPermissions = async () => {
  try {
    await fetchPermissions(queryForm);
  } catch (error: unknown) {
    const err = error as Error;
    ElMessage.error(`加载权限列表失败: ${err.message}`);
  }
};

/**
 * 加载权限树（树形视图）
 */
const loadPermissionTree = async () => {
  try {
    await fetchPermissionTree();
  } catch (error: unknown) {
    const err = error as Error;
    ElMessage.error(`加载权限树失败: ${err.message}`);
  }
};

/**
 * 视图模式切换
 */
const handleViewModeChange = () => {
  if (viewMode.value === 'tree') {
    loadPermissionTree();
  } else {
    loadPermissions();
  }
};

/**
 * 切换展开/收起全部
 */
const toggleExpandAll = () => {
  expandAll.value = !expandAll.value;
  // Element Plus 的 tree table 不直接支持 toggleExpandAll 方法
  // 这里需要使用其他方式实现，可以通过递归设置展开状态
  ElMessage.info(expandAll.value ? '展开全部' : '收起全部');
};

/**
 * 查询处理
 */
const handleSearch = () => {
  if (viewMode.value === 'table') {
    pagination.value.currentPage = 1;
    loadPermissions();
  } else {
    // 树形视图下的搜索可以过滤显示的节点
    ElMessage.info('树形视图下搜索功能暂未实现');
  }
};

/**
 * 重置处理
 */
const handleReset = () => {
  queryForm.permission_name = '';
  queryForm.permission_code = '';
  queryForm.permission_type = undefined;
  queryForm.status = undefined;
  if (viewMode.value === 'table') {
    pagination.value.currentPage = 1;
    loadPermissions();
  } else {
    loadPermissionTree();
  }
};

/**
 * 页码变化处理
 */
const handleCurrentChange = (page: number) => {
  pagination.value.currentPage = page;
  loadPermissions();
};

/**
 * 每页条数变化处理
 */
const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size;
  pagination.value.currentPage = 1;
  loadPermissions();
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
const handleEdit = (row: Permission | PermissionTreeNode) => {
  editMode.value = 'edit';
  currentNode.value = row as PermissionTreeNode;
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

    // 重新加载数据
    if (viewMode.value === 'tree') {
      loadPermissionTree();
    } else {
      loadPermissions();
    }
  } catch (error: unknown) {
    const err = error as Error;
    ElMessage.error(`保存失败: ${err.message}`);
  }
};

/**
 * 删除权限处理
 */
const handleDelete = async (row: Permission | PermissionTreeNode) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除权限 "${row.permissionName}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    await deletePermission(row.id);
    ElMessage.success('删除成功');

    if (viewMode.value === 'tree') {
      loadPermissionTree();
    } else {
      loadPermissions();
    }
  } catch {
    // 用户取消操作
  }
};

// ============================================
// 生命周期
// ============================================

onMounted(() => {
  if (viewMode.value === 'tree') {
    loadPermissionTree();
  } else {
    loadPermissions();
  }
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
  min-height: calc(100vh - 280px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.card-actions {
  display: flex;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
