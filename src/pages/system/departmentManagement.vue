<!--
  部门管理页面
  使用 <script setup> + TypeScript
-->
<template>
  <div class="department-management-page">
    <!-- 查询区 -->
    <DepartmentSearchBar
      v-model="searchConditions"
      @search="handleSearch"
      @reset="handleReset"
      @tenant-change="handleTenantChange"
    />

    <!-- 列表区 -->
    <div class="table-container">
      <DepartmentTableActions
        @add="handleAdd"
        @toggle-expand="handleToggleExpand"
      />

      <DepartmentTreeTable
        ref="treeTableRef"
        :data="departments"
        :loading="loading"
        :default-expand-all="defaultExpandAll"
        @edit="handleEdit"
        @add-sub="handleAddSub"
        @delete="handleDelete"
      />
    </div>

    <!-- 部门编辑对话框 -->
    <DepartmentEditDialog
      :visible="editDialogVisible"
      :current-dept="currentDept"
      :parent-dept-options="parentDeptOptions"
      @update:visible="editDialogVisible = $event"
      @submit="handleSubmit"
    />

    <!-- 删除确认对话框 -->
    <DeleteConfirmDialog
      :visible="deleteDialogVisible"
      :target-name="deleteTargetName"
      @update:visible="deleteDialogVisible = $event"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 部门管理页面
 * 使用 Composition API + TypeScript
 */
import { ref, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import RBACService from '@/components/service/RBACService';
import {
  useDepartmentData,
  type DepartmentSearchConditions,
  type DepartmentEntity
} from '@/pages/system/composable/department/useDepartmentData';

// ============================================
// 组件引入
// ============================================

import DepartmentSearchBar from './components/department/DepartmentSearchBar.vue';
import DepartmentTableActions from './components/department/DepartmentTableActions.vue';
import DepartmentTreeTable from './components/department/DepartmentTreeTable.vue';
import DepartmentEditDialog from './components/department/DepartmentEditDialog.vue';
import DeleteConfirmDialog from './components/department/DeleteConfirmDialog.vue';

// ============================================
// Composables
// ============================================

const {
  departments,
  loading,
  parentDeptOptions,
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  clearData
} = useDepartmentData();

// ============================================
// 响应式状态
// ============================================

// 搜索条件
const searchConditions = ref<DepartmentSearchConditions>({
  tenant_id: undefined,
  name: '',
  id: undefined,
  status: undefined
});

// 展开控制
const defaultExpandAll = ref(false);
const expandAll = ref(true);

// 对话框状态
const editDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const currentDept = ref<DepartmentEntity | null>(null);
const deleteTargetName = ref('');

// TreeTable 引用
const treeTableRef = ref<{
  toggleExpandAll: (expand: boolean) => void;
} | null>(null);

// ============================================
// 方法
// ============================================

/**
 * 获取默认租户信息
 */
const getDefaultTenant = async () => {
  try {
    const response = await RBACService.getTenants();
    if (response?.data?.items && response.data.items.length > 0) {
      const firstTenant = response.data.items[0];
      searchConditions.value.tenant_id = firstTenant.tenant_id || firstTenant.id;
    }
  } catch (error) {
    console.error('获取租户信息失败:', error);
  }
};

/**
 * 加载数据
 */
const loadData = async () => {
  try {
    await fetchDepartments(searchConditions.value);

    // 数据加载完成后展开所有节点
    nextTick(() => {
      if (treeTableRef.value) {
        treeTableRef.value.toggleExpandAll(true);
      }
    });
  } catch (error: unknown) {
    const err = error as Error;
    ElMessage.error(`获取部门列表失败: ${err.message}`);
    clearData();
  }
};

/**
 * 搜索处理
 */
const handleSearch = (conditions: DepartmentSearchConditions) => {
  searchConditions.value = { ...conditions };
  loadData();
};

/**
 * 重置处理
 */
const handleReset = () => {
  searchConditions.value = {
    tenant_id: '',
    name: '',
    id: '',
    status: undefined
  };
  loadData();
};

/**
 * 租户变化处理
 */
const handleTenantChange = () => {
  loadData();
};

/**
 * 展开/折叠处理
 */
const handleToggleExpand = () => {
  expandAll.value = !expandAll.value;
  if (treeTableRef.value) {
    treeTableRef.value.toggleExpandAll(expandAll.value);
  }
};

/**
 * 新增部门处理
 */
const handleAdd = () => {
  currentDept.value = null;
  editDialogVisible.value = true;
};

/**
 * 添加子部门处理
 */
const handleAddSub = (row: DepartmentEntity) => {
  currentDept.value = {
    ...row,
    isSubDept: true,
    parent_id: row.id
  } as DepartmentEntity & { isSubDept: boolean };
  editDialogVisible.value = true;
};

/**
 * 编辑部门处理
 */
const handleEdit = (row: DepartmentEntity) => {
  console.log('handleEdit', row);
  currentDept.value = row;
  editDialogVisible.value = true;
};

/**
 * 提交部门表单处理
 */
const handleSubmit = async (formData: Record<string, unknown>) => {
  try {
    const submitData = { ...formData };

    // 处理 parent_id
    if (submitData.parent_id === null || submitData.parent_id === undefined || submitData.parent_id === '') {
      submitData.parent_id = null;
    }

    // 添加租户ID
    submitData.tenant_id = searchConditions.value.tenant_id;

    let result: { success: boolean; message: string };
    if (currentDept.value && !(currentDept.value as { isSubDept?: boolean }).isSubDept) {
      // 更新部门
      delete submitData.id;
      result = await updateDepartment(currentDept.value.id, submitData);
    } else {
      // 新增部门或添加子部门
      if (!currentDept.value) {
        delete submitData.id;
      }
      result = await createDepartment(submitData);
    }

    ElMessage.success(result.message);
    editDialogVisible.value = false;
    loadData();
  } catch (error: unknown) {
    const err = error as Error;
    ElMessage.error(`保存部门失败: ${err.message}`);
  }
};

/**
 * 删除部门处理
 */
const handleDelete = (row: DepartmentEntity) => {
  deleteTargetName.value = row.name || String(row.id);
  currentDept.value = row;
  deleteDialogVisible.value = true;
};

/**
 * 确认删除处理
 */
const handleDeleteConfirm = async () => {
  try {
    if (!currentDept.value) return;

    const result = await deleteDepartment(currentDept.value.id);
    ElMessage.success(result.message);
    deleteDialogVisible.value = false;
    loadData();
  } catch (error: unknown) {
    const err = error as Error;
    ElMessage.error(`删除部门失败: ${err.message}`);
  }
};

// ============================================
// 生命周期
// ============================================

onMounted(async () => {
  await getDefaultTenant();
  await loadData();
});
</script>

<style scoped>
.department-management-page {
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
