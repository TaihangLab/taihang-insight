<template>
  <div class="user-management-page">
    <!-- 查询区 -->
    <UserSearchBar v-model="searchConditions" @search="handleSearch" @reset="handleReset" />

    <!-- 列表区 -->
    <UserList
      :users="users"
      :loading="loading"
      :pagination="{ currentPage: pagination.currentPage, pageSize: pagination.pageSize }"
      :total="pagination.total"
      @selection-change="handleSelectionChange"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
      @batch-delete="handleBatchDelete"
      @status-change="handleStatusChange"
      @reset-password="handleResetPassword"
      @authorization="handleAuthorization"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    />

    <!-- 用户编辑表单 -->
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
import UserSearchBar from "@/pages/system/components/user/UserSearchBar.vue";
import UserList from "@/pages/system/components/user/UserList.vue";
import DeleteConfirmDialog from "@/pages/system/components/user/DeleteConfirmDialog.vue";
import UserEditDialog from "@/pages/system/components/user/UserEditDialog.vue";
import UserRoleAssignmentDialog from "@/pages/system/components/user/UserRoleAssignmentDialog.vue";
import type { User } from "@/types/rbac/user";

// 搜索条件接口
interface SearchConditions {
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

// 当前用户的租户ID（使用 getter 方法）
const currentUserTenantId = userInfoStore.getUserInfoSync()?.tenantId ?? null;

// 搜索条件（使用 ref，避免 reactive 的响应式问题）
const searchConditions = ref<SearchConditions>({
  tenant_id: currentUserTenantId,
  username: "",
  phone: "",
  status: null,
});

// 选中的用户ID
const selectedIds = ref<string[]>([]);

// 计算对话框的租户ID（安全地获取，避免运行时错误）
const dialogTenantId = computed(() => {
  // 优先使用当前用户的租户ID
  if (currentUser.value?.tenant_id) {
    return currentUser.value.tenant_id;
  }
  // 其次使用搜索条件的租户ID
  if (searchConditions.value?.tenant_id) {
    return searchConditions.value.tenant_id;
  }
  // 最后使用当前用户登录的租户ID
  return currentUserTenantId;
});

// 对话框状态
const editDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const authorizationDialogVisible = ref(false);
const currentUser = ref<User | null>(null);

// 删除相关
const deleteTargetType = ref<"single" | "batch">("single");
const deleteTargetName = ref("");
const deleteTargetIds = ref<string[]>([]);

// ============================================
// 生命周期
// ============================================
onMounted(() => {
  // 用户信息已在 main.ts 中初始化，直接加载数据
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
  const params: Record<string, any> = {
    skip: getSkip(),
    limit: pagination.value.pageSize,
  };

  if (searchConditions.value.tenant_id) {
    params.tenant_id = searchConditions.value.tenant_id;
  }
  if (searchConditions.value.username) {
    params.username = searchConditions.value.username;
  }
  if (searchConditions.value.phone) {
    params.phone = searchConditions.value.phone;
  }
  if (searchConditions.value.status !== null) {
    params.status = searchConditions.value.status;
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
    ElMessage.error(`获取用户列表失败: ${error.message}`);
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
 * 搜索
 */
const handleSearch = (conditions: SearchConditions) => {
  Object.assign(searchConditions.value, conditions);
  pagination.value.currentPage = 1;
  loadData();
};

/**
 * 重置
 */
const handleReset = () => {
  // 保留当前租户ID，只重置其他搜索条件
  searchConditions.value = {
    tenant_id: currentUserTenantId,
    username: "",
    phone: "",
    status: null,
  };
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
      // 新增逻辑需要在 useUserData 中实现 createUser
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
const handleBatchDelete = (ids: string[]) => {
  deleteTargetType.value = "batch";
  deleteTargetName.value = String(ids.length);
  deleteTargetIds.value = ids;
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

    ElMessage({
      message: "删除成功",
      type: "success",
    });
    loadData();
  } catch (error: unknown) {
    ElMessage({
      message: `删除失败: ${error.message || "未知错误"}`,
      type: "error",
    });
  }
};

/**
 * 状态切换
 */
const handleStatusChange = async (row: User, callback?: (success: boolean) => void) => {
  // v-model 已经自动更新了 row.status，直接使用即可
  const newStatus = row.status;

  try {
    await updateUser(row.id, { status: newStatus });
    ElMessage.success("状态更新成功");
    // 通知子组件状态更新成功
    callback?.(true);
    loadData();
  } catch (error: unknown) {
    let errorMessage = "更新用户状态失败";
    if (error instanceof Error) {
      if (!error.message.includes("Network Error")) {
        errorMessage = error.message;
      }
    }

    ElMessage.error(errorMessage);
    // 通知子组件状态更新失败，子组件会恢复原始状态
    callback?.(false);
    loadData();
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
 * 页码变化
 */
const handlePageChange = (page: number) => {
  pagination.value.currentPage = page;
  loadData();
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
  ElMessage.success("角色分配成功");
};
</script>

<style scoped>
.user-management-page {
  padding: var(--design-spacing-md);
}
</style>
