<template>
  <div class="tenant-management-page">
    <!-- 查询区 -->
    <TenantSearchBar v-model="searchConditions" @search="handleSearch" @reset="handleReset" />
    <!-- 列表区 -->
    <TenantList
      :tenants="tenants"
      :loading="loading"
      :pagination="{ currentPage: pagination.currentPage, pageSize: pagination.pageSize }"
      :total="pagination.total"
      @selection-change="handleSelectionChange"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
      @batch-delete="handleBatchDelete"
      @status-change="handleStatusChange"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    />

    <!-- 租户编辑表单 -->
    <TenantEditForm
      v-model:visible="editDialogVisible"
      :current-tenant="currentTenant"
      @saved="handleTenantSaved"
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
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { useTenantData } from "@/pages/system/composable/tenant/useTenantData";
import type { TenantAPI } from "@/types/rbac/tenant";
import TenantSearchBar from "@/pages/system/components/tenant/TenantSearchBar.vue";
import TenantList from "@/pages/system/components/tenant/TenantList.vue";
import DeleteConfirmDialog from "@/pages/system/components/tenant/DeleteConfirmDialog.vue";
import TenantEditForm from "@/pages/system/components/tenant/tenantEditForm.vue";

/**
 * 查询条件类型
 */
interface SearchConditions {
  tenant_id: string;
  tenant_name: string;
  company_name: string;
  status: number | null;
}

/**
 * API 查询参数类型
 */
interface QueryParams {
  skip?: number;
  limit?: number;
  tenant_id?: string;
  tenant_name?: string;
  company_name?: string;
  status?: number | null;
}

// ============================================
// Composables
// ============================================
const {
  tenants,
  pagination,
  loading,
  fetchTenants,
  updateTenant,
  deleteTenant,
  batchDeleteTenants,
} = useTenantData();

// ============================================
// 响应式状态
// ============================================

// 搜索条件（使用 let 声明，因为 v-model 需要修改整个对象）
let searchConditions = reactive({
  tenant_id: "",
  tenant_name: "",
  company_name: "",
  status: null as number | null,
});

// 选中的租户编码
const selectedCodes = ref<number[]>([]);

// 对话框状态
const editDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const currentTenant = ref<TenantAPI | null>(null);

// 删除相关
const deleteTargetType = ref<"single" | "batch">("single");
const deleteTargetName = ref("");
const deleteTargetCodes = ref<number[]>([]);

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
const buildParams = (): QueryParams => {
  const params: QueryParams = {
    skip: getSkip(),
    limit: pagination.value.pageSize,
  };

  if (searchConditions.tenant_id) {
    params.tenant_id = searchConditions.tenant_id;
  }
  if (searchConditions.tenant_name) {
    params.tenant_name = searchConditions.tenant_name;
  }
  if (searchConditions.company_name) {
    params.company_name = searchConditions.company_name;
  }
  if (searchConditions.status !== null) {
    params.status = searchConditions.status;
  }

  return params;
};

/**
 * 加载数据
 */
const loadData = async () => {
  try {
    tenants.value = await fetchTenants(
      buildParams(),
      pagination.value.currentPage,
      pagination.value.pageSize,
    );
  } catch (error: unknown) {
    ElMessage.error(`获取租户列表失败: ${error.message}`);
    clearData();
  }
};

/**
 * 清空数据
 */
const clearData = () => {
  tenants.value = [];
};

/**
 * 搜索
 */
const handleSearch = (conditions: SearchConditions) => {
  Object.assign(searchConditions, conditions);
  pagination.value.currentPage = 1;
  loadData();
};

/**
 * 重置
 */
const handleReset = () => {
  searchConditions.tenant_id = "";
  searchConditions.tenant_name = "";
  searchConditions.company_name = "";
  searchConditions.status = null;
  pagination.value.currentPage = 1;
  loadData();
};

/**
 * 选择变化
 */
const handleSelectionChange = (codes: number[]) => {
  selectedCodes.value = codes;
};

/**
 * 新增
 */
const handleAdd = () => {
  currentTenant.value = null;
  editDialogVisible.value = true;
};

/**
 * 编辑
 */
const handleEdit = (row: TenantAPI) => {
  currentTenant.value = row;
  editDialogVisible.value = true;
};

/**
 * 租户保存成功回调
 */
const handleTenantSaved = () => {
  loadData();
};

/**
 * 删除
 */
const handleDelete = (row: TenantAPI) => {
  deleteTargetType.value = "single";
  deleteTargetName.value = row.tenant_name || String(row.id);
  deleteTargetCodes.value = [row.id];
  deleteDialogVisible.value = true;
};

/**
 * 批量删除
 */
const handleBatchDelete = (codes: number[]) => {
  deleteTargetType.value = "batch";
  deleteTargetName.value = String(codes.length);
  deleteTargetCodes.value = codes;
  deleteDialogVisible.value = true;
};

/**
 * 确认删除
 */
const handleDeleteConfirm = async () => {
  try {
    let result: any;
    if (deleteTargetType.value === "single") {
      result = await deleteTenant(deleteTargetCodes.value[0]);
    } else {
      result = await batchDeleteTenants(deleteTargetCodes.value);
    }

    ElMessage({
      message: result.message,
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
 *
 * 修复：避免 v-model 立即修改状态，API 失败时恢复原值
 */
const handleStatusChange = async (row: TenantAPI, newStatus: number) => {
  const oldStatus = row.status;

  try {
    // 先更新 UI（乐观更新），如果失败则回滚
    await updateTenant(row.id, { status: newStatus });

    ElMessage({
      message: "状态更新成功",
      type: "success",
    });
  } catch (error: unknown) {
    // API 失败，恢复原状态
    row.status = oldStatus;

    let errorMessage = "更新租户状态失败";
    if (error instanceof Error && error.message && !error.message.includes("Network Error")) {
      errorMessage = error.message;
    } else if (error && typeof error === "object" && "response" in error) {
      const err = error as { response?: { data?: unknown } };
      const data = err.response?.data;
      if (data && typeof data === "object") {
        if ("message" in data && typeof data.message === "string") {
          errorMessage = data.message;
        } else if ("detail" in data && typeof data.detail === "string") {
          errorMessage = data.detail;
        } else if ("msg" in data && typeof data.msg === "string") {
          errorMessage = data.msg;
        }
      } else if (typeof data === "string") {
        errorMessage = data;
      }
    }

    ElMessage({
      message: errorMessage,
      type: "error",
    });
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
</script>

<style scoped>
.tenant-management-page {
  padding: var(--design-spacing-md);
}
</style>
