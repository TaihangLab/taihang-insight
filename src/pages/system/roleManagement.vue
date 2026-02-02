<!--
  角色管理页面
  使用 <script setup> + TypeScript
-->
<template>
  <div class="role-management-page">
    <!-- 搜索表单 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="queryForm" inline>
        <el-form-item v-permission="'tenant:list:view'" label="租户">
          <TenantSelector
            v-model="queryForm.tenant_id"
            @change="handleSearch"
          />
        </el-form-item>

        <el-form-item label="角色名称">
          <el-input
            v-model="queryForm.role_name"
            placeholder="请输入角色名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="角色编码">
          <el-input
            v-model="queryForm.role_code"
            placeholder="请输入角色编码"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="数据权限">
          <el-select
            v-model="queryForm.data_scope"
            placeholder="请选择数据权限"
            clearable
            style="width: 180px"
          >
            <el-option label="全部数据权限" :value="DataScope.ALL" />
            <el-option label="自定数据权限" :value="DataScope.CUSTOM" />
            <el-option label="本部门数据权限" :value="DataScope.DEPARTMENT" />
            <el-option label="本部门及以下数据权限" :value="DataScope.DEPARTMENT_AND_BELOW" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select
            v-model="queryForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="正常" :value="Status.ENABLED" />
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
          <span class="card-title">角色列表</span>
          <div class="card-actions">
            <el-button type="primary" icon="Plus" @click="handleAdd">新增角色</el-button>
          </div>
        </div>
      </template>

      <!-- 角色表格 -->
      <el-table
        v-loading="loading"
        :data="roles"
      >
        <el-table-column prop="roleName" label="角色名称" width="150" />

        <el-table-column prop="roleCode" label="角色编码" width="150" />

        <el-table-column prop="dataScope" label="数据权限范围" width="180">
          <template #default="{ row }">
            <el-tag :type="getDataScopeTagType(row.dataScope)">
              {{ getDataScopeLabel(row.dataScope) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === Status.ENABLED ? 'success' : 'danger'">
              {{ row.status === Status.ENABLED ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="创建时间" width="180" />

        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button link type="primary" size="small" @click="handleAssignPermissions(row)">
              分配权限
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
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

    <!-- 角色编辑对话框 -->
    <RoleEditDialog
      v-model:visible="editDialogVisible"
      :current-role="currentRole"
      :tenant-id="queryForm.tenant_id"
      @submit="handleRoleSubmit"
    />

    <!-- 角色权限分配对话框 -->
    <RolePermissionDialog
      v-model:visible="permissionDialogVisible"
      :current-role="currentRole"
      @submit="handlePermissionSubmit"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 角色管理页面
 * 使用 Composition API + TypeScript
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { Role } from '@/types/rbac';
import type { RoleEntity } from '@/pages/system/composable/role/useRoleData';
import { Status, DataScope } from '@/types/rbac';
import { useRoleData } from '@/pages/system/composable/role/useRoleData';
import TenantSelector from '@/pages/system/components/commons/TenantSelector.vue';
import RoleEditDialog from '@/pages/system/components/role/RoleEditDialog.vue';
import RolePermissionDialog from '@/pages/system/components/role/RolePermissionDialog.vue';

// ============================================
// Composables
// ============================================

const {
  roles,
  loading,
  pagination,
  fetchRoles,
  createRole,
  updateRole,
  deleteRole,
  assignPermissionsToRole
} = useRoleData();

// ============================================
// 响应式状态
// ============================================

// 查询表单
const queryForm = reactive<{
  tenant_id?: string | number | null;
  role_name?: string;
  role_code?: string;
  data_scope?: DataScope;
  status?: Status;
}>({
  tenant_id: null,
  role_name: '',
  role_code: '',
  data_scope: undefined,
  status: undefined
});

// 对话框状态
const editDialogVisible = ref(false);
const permissionDialogVisible = ref(false);
const currentRole = ref<RoleEntity | null>(null);

// ============================================
// 辅助函数
// ============================================

/**
 * 获取数据权限标签类型
 */
const getDataScopeTagType = (scope: DataScope) => {
  const typeMap: Record<DataScope, string> = {
    [DataScope.ALL]: 'danger',
    [DataScope.CUSTOM]: 'warning',
    [DataScope.DEPARTMENT]: 'info',
    [DataScope.DEPARTMENT_AND_BELOW]: 'success'
  };
  return typeMap[scope] || '';
};

/**
 * 获取数据权限标签文本
 */
const getDataScopeLabel = (scope: DataScope) => {
  const labelMap: Record<DataScope, string> = {
    [DataScope.ALL]: '全部数据',
    [DataScope.CUSTOM]: '自定义',
    [DataScope.DEPARTMENT]: '本部门',
    [DataScope.DEPARTMENT_AND_BELOW]: '本部门及以下'
  };
  return labelMap[scope] || '';
};

// ============================================
// 方法
// ============================================

/**
 * 加载角色列表
 */
const loadRoles = async () => {
  try {
    roles.value = await fetchRoles(queryForm);
  } catch (error: unknown) {
    const err = error as Error;
    ElMessage.error(`加载角色列表失败: ${err.message}`);
  }
};

/**
 * 查询处理
 */
const handleSearch = () => {
  pagination.value.currentPage = 1;
  loadRoles();
};

/**
 * 重置处理
 */
const handleReset = () => {
  queryForm.tenant_id = null;
  queryForm.role_name = '';
  queryForm.role_code = '';
  queryForm.data_scope = undefined;
  queryForm.status = undefined;
  pagination.value.currentPage = 1;
  loadRoles();
};

/**
 * 页码变化处理
 */
const handleCurrentChange = (page: number) => {
  pagination.value.currentPage = page;
  loadRoles();
};

/**
 * 每页条数变化处理
 */
const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size;
  pagination.value.currentPage = 1;
  loadRoles();
};

/**
 * 新增角色处理
 */
const handleAdd = () => {
  currentRole.value = null;
  editDialogVisible.value = true;
};

/**
 * 编辑角色处理
 */
const handleEdit = (row: RoleEntity) => {
  currentRole.value = row;
  editDialogVisible.value = true;
};

/**
 * 删除角色处理
 */
const handleDelete = async (row: RoleEntity) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除角色 "${row.roleName}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    await deleteRole(row.id);
    ElMessage.success('删除成功');
    loadRoles();
  } catch {
    // 用户取消操作
  }
};

/**
 * 分配权限处理
 */
const handleAssignPermissions = (row: RoleEntity) => {
  currentRole.value = row;
  permissionDialogVisible.value = true;
};

/**
 * 角色表单提交处理
 */
const handleRoleSubmit = async (formData: Record<string, unknown>) => {
  try {
    if (currentRole.value) {
      // 编辑角色
      await updateRole(currentRole.value.id, formData);
      ElMessage.success('角色修改成功');
    } else {
      // 新增角色
      await createRole(formData);
      ElMessage.success('角色添加成功');
    }
    editDialogVisible.value = false;
    loadRoles();
  } catch (error: unknown) {
    const err = error as Error;
    ElMessage.error(`保存失败: ${err.message}`);
  }
};

/**
 * 权限分配提交处理
 */
const handlePermissionSubmit = async (roleId: number, permissionIds: number[]) => {
  try {
    await assignPermissionsToRole(roleId, permissionIds);
    ElMessage.success('权限分配成功');
    permissionDialogVisible.value = false;
  } catch (error: unknown) {
    const err = error as Error;
    ElMessage.error(`权限分配失败: ${err.message}`);
  }
};

// ============================================
// 生命周期
// ============================================

onMounted(() => {
  loadRoles();
});
</script>

<style scoped>
.role-management-page {
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
