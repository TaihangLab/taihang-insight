<!--
  用户管理页面
  使用 <script setup> + TypeScript
  布局风格与角色管理保持一致
-->
<template>
  <div class="user-management-page p-6 bg-neutral-50 min-h-screen">
    <!-- 搜索表单 -->
    <el-card class="search-card mb-5 rounded-xl border border-neutral-200 shadow-sm" shadow="never">
      <el-form :model="queryForm" inline>
        <el-form-item v-permission="'tenant:list:view'" label="租户">
          <TenantSelector v-model="queryForm.tenant_id" @change="handleSearch" />
        </el-form-item>

        <el-form-item label="用户名">
          <el-input
            v-model="queryForm.username"
            placeholder="请输入用户名"
            clearable
            class="w-[200px]"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="手机号">
          <el-input
            v-model="queryForm.phone"
            placeholder="请输入手机号"
            clearable
            class="w-[200px]"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-select
            v-model="queryForm.status"
            placeholder="请选择状态"
            clearable
            class="w-[120px]"
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
    <el-card class="table-card rounded-xl border border-neutral-200 shadow-sm" shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-base font-medium text-text-primary">用户列表</span>
          <div class="flex gap-2">
            <el-button
              type="primary"
              icon="Plus"
              data-testid="btn-add-user"
              @click="handleAdd"
            >
              新增用户
            </el-button>
            <el-button
              :disabled="!hasSelection"
              data-testid="btn-batch-delete"
              @click="handleBatchDelete"
            >
              批量删除
            </el-button>
          </div>
        </div>
      </template>

      <!-- 用户表格 -->
      <el-table
        v-loading="loading"
        :data="users"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" align="center" width="55" />
        <el-table-column prop="user_name" label="用户名称" align="center" min-width="140" />
        <el-table-column prop="nick_name" label="用户昵称" align="center" min-width="150" />
        <el-table-column prop="dept_name" label="部门" align="center" min-width="120" />
        <el-table-column prop="phone" label="手机号码" align="center" min-width="130" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status"
              :active-value="Status.ENABLED"
              :inactive-value="Status.DISABLED"
              @change="() => handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" align="center" min-width="170" />
        <el-table-column label="操作" width="280" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="success" size="small" @click="handleAuthorization(row)">
              授权
            </el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
            <el-button link type="warning" size="small" @click="handleResetPassword(row)">
              重置
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="mt-5 flex justify-end">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadData"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 用户编辑对话框 -->
    <UserEditDialog
      v-model:visible="editDialogVisible"
      :current-user="currentUser"
      :tenant-id="dialogTenantId"
      @submit="handleUserSubmit"
    />

    <!-- 用户角色分配对话框 -->
    <UserRoleAssignmentDialog
      v-model:visible="authorizationDialogVisible"
      :user="currentUser"
      @submit="handleAuthorizationSubmit"
    />

    <!-- 删除确认对话框 -->
    <DeleteConfirmDialog
      v-model:visible="deleteDialogVisible"
      :target-name="deleteTargetName"
      :target-type="deleteTargetType"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage } from "element-plus";
import { useUserData } from "@/pages/system/composable/user/useUserData";
import { useUserInfoStore } from "@/stores/modules/userInfo";
import { Status } from "@/types/rbac";
import TenantSelector from "@/pages/system/components/commons/TenantSelector.vue";
import UserEditDialog from "@/pages/system/components/user/UserEditDialog.vue";
import UserRoleAssignmentDialog from "@/pages/system/components/user/UserRoleAssignmentDialog.vue";
import DeleteConfirmDialog from "@/pages/system/components/user/DeleteConfirmDialog.vue";
import type { User } from "@/types/rbac/user";

// ============================================
// 类型定义
// ============================================
interface QueryForm {
  tenant_id: string | number | null;
  username: string;
  phone: string;
  status: number | null;
}

// ============================================
// Composables
// ============================================
const {
  users,
  pagination,
  loading,
  fetchUsers,
  updateUser,
  deleteUser,
  deleteUsers,
  resetUserPassword,
} = useUserData();

const userInfoStore = useUserInfoStore();

// ============================================
// 响应式状态
// ============================================
const currentUserTenantId = userInfoStore.getUserInfoSync()?.tenantId ?? null;

const queryForm = reactive<QueryForm>({
  tenant_id: currentUserTenantId,
  username: "",
  phone: "",
  status: null,
});

const selectedIds = ref<string[]>([]);

const dialogTenantId = computed(() => {
  if (currentUser.value?.tenant_id) {
    return currentUser.value.tenant_id;
  }
  if (queryForm.tenant_id) {
    return queryForm.tenant_id;
  }
  return currentUserTenantId;
});

const editDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const authorizationDialogVisible = ref(false);
const currentUser = ref<User | null>(null);

const deleteTargetType = ref<"single" | "batch">("single");
const deleteTargetName = ref("");
const deleteTargetIds = ref<string[]>([]);

const hasSelection = computed(() => selectedIds.value.length > 0);

// ============================================
// 生命周期
// ============================================
onMounted(() => {
  loadData();
});

// ============================================
// 方法
// ============================================
/**
 * 计算当前页的 skip 值
 */
const getSkip = (): number => {
  return (pagination.value.currentPage - 1) * pagination.value.pageSize;
};

/**
 * 构建查询参数
 */
const buildParams = () => {
  const params: Record<string, unknown> = {
    skip: getSkip(),
    limit: pagination.value.pageSize,
  };

  if (queryForm.tenant_id) {
    params.tenant_id = queryForm.tenant_id;
  }
  if (queryForm.username) {
    params.username = queryForm.username;
  }
  if (queryForm.phone) {
    params.phone = queryForm.phone;
  }
  if (queryForm.status !== null) {
    params.status = queryForm.status;
  }

  return params;
};

/**
 * 加载数据
 */
const loadData = async () => {
  try {
    users.value = await fetchUsers(buildParams());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "未知错误";
    ElMessage.error(`获取用户列表失败: ${message}`);
    clearData();
  }
};

/**
 * 清空数据
 */
const clearData = () => {
  users.value = [];
};

/**
 * 查询处理
 */
const handleSearch = () => {
  pagination.value.currentPage = 1;
  loadData();
};

/**
 * 重置处理
 */
const handleReset = () => {
  queryForm.tenant_id = currentUserTenantId;
  queryForm.username = "";
  queryForm.phone = "";
  queryForm.status = null;
  pagination.value.currentPage = 1;
  loadData();
};

/**
 * 选择变化
 */
const handleSelectionChange = (selection: User[]) => {
  selectedIds.value = selection.map((user) => user.user_id).filter(Boolean) as string[];
};

/**
 * 新增
 */
const handleAdd = () => {
  currentUser.value = null;
  editDialogVisible.value = true;
};

/**
 * 编辑
 */
const handleEdit = (row: User) => {
  currentUser.value = row;
  editDialogVisible.value = true;
};

/**
 * 用户保存成功回调
 */
const handleUserSubmit = async (formData: Partial<User>) => {
  try {
    if (currentUser.value?.user_id) {
      await updateUser(currentUser.value.user_id, formData);
      ElMessage.success("用户修改成功");
    } else {
      ElMessage.success("用户添加成功");
    }
    editDialogVisible.value = false;
    loadData();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "未知错误";
    ElMessage.error(`保存失败: ${message}`);
  }
};

/**
 * 删除
 */
const handleDelete = (row: User) => {
  deleteTargetType.value = "single";
  deleteTargetName.value = row.user_name || row.user_id || "";
  deleteTargetIds.value = row.user_id ? [row.user_id] : [];
  deleteDialogVisible.value = true;
};

/**
 * 批量删除
 */
const handleBatchDelete = () => {
  if (!hasSelection.value) {
    ElMessage.warning("请选择要删除的用户");
    return;
  }
  deleteTargetType.value = "batch";
  deleteTargetName.value = String(selectedIds.value.length);
  deleteTargetIds.value = selectedIds.value;
  deleteDialogVisible.value = true;
};

/**
 * 确认删除
 */
const handleDeleteConfirm = async () => {
  try {
    if (deleteTargetType.value === "single") {
      await deleteUser(deleteTargetIds.value[0]);
    } else {
      await deleteUsers(deleteTargetIds.value);
    }

    ElMessage.success("删除成功");
    loadData();
  } catch (error: unknown) {
    ElMessage.error(`删除失败: ${error.message || "未知错误"}`);
  }
};

/**
 * 状态切换
 */
const handleStatusChange = async (row: User) => {
  const originalStatus = row.status;
  row.status = row.status === 0 ? 1 : 0;

  try {
    await updateUser(row.user_id!, { status: row.status });
    ElMessage.success("状态更新成功");
    loadData();
  } catch (error: unknown) {
    row.status = originalStatus;
    const errorMessage = error instanceof Error ? error.message : "更新用户状态失败";
    ElMessage.error(errorMessage);
  }
};

/**
 * 重置密码
 */
const handleResetPassword = async (row: User) => {
  try {
    await resetUserPassword(row.id, "123456");
    ElMessage.success("密码重置成功，新密码为：123456");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "未知错误";
    ElMessage.error(`重置密码失败: ${message}`);
  }
};

/**
 * 每页数量变化
 */
const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size;
  pagination.value.currentPage = 1;
  loadData();
};

/**
 * 授权
 */
const handleAuthorization = (row: User) => {
  currentUser.value = row;
  authorizationDialogVisible.value = true;
};

/**
 * 授权提交成功回调
 */
const handleAuthorizationSubmit = () => {
  authorizationDialogVisible.value = false;
  loadData();
};
</script>

<style scoped>
.user-management-page {
  min-height: calc(100vh - var(--header-height, 60px));
}

:deep(.el-table) {
  --el-table-header-bg-color: var(--design-bg-secondary);
  --el-table-header-text-color: var(--design-text-primary);
}

:deep(.el-table th) {
  background-color: var(--design-bg-secondary);
  color: var(--design-text-primary);
  font-weight: 500;
}
</style>
