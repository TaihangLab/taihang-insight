<!--
  租户管理页面
  使用 <script setup> + TypeScript
  布局风格与角色管理保持一致
-->
<template>
  <div class="tenant-management-page p-6 bg-neutral-50 min-h-screen">
    <!-- 搜索表单 -->
    <el-card class="search-card mb-5 rounded-xl border border-neutral-200 shadow-sm" shadow="never">
      <el-form :model="queryForm" inline>
        <el-form-item label="租户名称">
          <el-input
            v-model="queryForm.tenant_name"
            placeholder="请输入租户名称"
            clearable
            class="w-[200px]"
            data-testid="input-tenant-name"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="企业名称">
          <el-input
            v-model="queryForm.company_name"
            placeholder="请输入企业名称"
            clearable
            class="w-[200px]"
            data-testid="input-company-name"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-select
            v-model="queryForm.status"
            placeholder="请选择状态"
            clearable
            class="w-[120px]"
            data-testid="select-status"
          >
            <el-option label="启用" :value="Status.ENABLED" />
            <el-option label="停用" :value="Status.DISABLED" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" data-testid="btn-search" @click="handleSearch">
            查询
          </el-button>
          <el-button data-testid="btn-reset" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮 -->
    <el-card class="table-card rounded-xl border border-neutral-200 shadow-sm" shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-base font-medium text-text-primary">租户列表</span>
          <div class="flex gap-2">
            <el-button
              type="primary"
              icon="Plus"
              data-testid="btn-add-tenant"
              @click="handleAdd"
            >
              新增租户
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

      <!-- 租户表格 -->
      <el-table
        v-loading="loading"
        :data="tenants"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" align="center" width="55" />
        <el-table-column prop="id" label="租户编号" align="center" width="120" />
        <el-table-column prop="tenant_name" label="租户名称" align="center" min-width="150" />
        <el-table-column prop="company_name" label="企业名称" align="center" min-width="180" />
        <el-table-column prop="package" label="租户套餐" align="center" width="120">
          <template #default="{ row }">
            {{ packageLabels[row.package] || row.package || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="expire_time" label="过期时间" width="140" align="center">
          <template #default="{ row }">
            {{ formatDate(row.expire_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              :data-testid="'switch-status-' + row.id"
              :model-value="row.status"
              :active-value="Status.ENABLED"
              :inactive-value="Status.DISABLED"
              @change="(val) => handleStatusChange(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
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
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage } from "element-plus";
import { useTenantData } from "@/pages/system/composable/tenant/useTenantData";
import { Status } from "@/types/rbac";
import type { TenantAPI } from "@/types/rbac/tenant";
import TenantEditForm from "@/pages/system/components/tenant/tenantEditForm.vue";
import DeleteConfirmDialog from "@/pages/system/components/tenant/DeleteConfirmDialog.vue";

// ============================================
// 类型定义
// ============================================
interface QueryForm {
  tenant_name: string;
  company_name: string;
  status: number | null;
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
const queryForm = reactive<QueryForm>({
  tenant_name: "",
  company_name: "",
  status: null,
});

const selectedCodes = ref<number[]>([]);
const editDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const currentTenant = ref<TenantAPI | null>(null);
const deleteTargetType = ref<"single" | "batch">("single");
const deleteTargetName = ref("");
const deleteTargetCodes = ref<number[]>([]);

// 租户套餐标签映射
const packageLabels: Record<string, string> = {
  basic: "基础版",
  standard: "标准版",
  premium: "高级版",
  enterprise: "企业版",
};

// 是否有选中项
const hasSelection = computed(() => selectedCodes.value.length > 0);

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
 * 加载数据
 */
const loadData = async () => {
  try {
    const params: Record<string, unknown> = {
      skip: getSkip(),
      limit: pagination.value.pageSize,
    };

    if (queryForm.tenant_name) {
      params.tenant_name = queryForm.tenant_name;
    }
    if (queryForm.company_name) {
      params.company_name = queryForm.company_name;
    }
    if (queryForm.status !== null) {
      params.status = queryForm.status;
    }

    await fetchTenants(
      params,
      pagination.value.currentPage,
      pagination.value.pageSize,
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "未知错误";
    ElMessage.error(`获取租户列表失败: ${message}`);
  }
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
  queryForm.tenant_name = "";
  queryForm.company_name = "";
  queryForm.status = null;
  pagination.value.currentPage = 1;
  loadData();
};

/**
 * 选择变化
 */
const handleSelectionChange = (selection: TenantAPI[]) => {
  selectedCodes.value = selection.map((row) => row.id);
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
const handleBatchDelete = () => {
  if (!hasSelection.value) {
    ElMessage.warning("请选择要删除的租户");
    return;
  }
  deleteTargetType.value = "batch";
  deleteTargetName.value = String(selectedCodes.value.length);
  deleteTargetCodes.value = selectedCodes.value;
  deleteDialogVisible.value = true;
};

/**
 * 确认删除
 */
const handleDeleteConfirm = async () => {
  try {
    if (deleteTargetType.value === "single") {
      await deleteTenant(deleteTargetCodes.value[0]);
    } else {
      await batchDeleteTenants(deleteTargetCodes.value);
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
const handleStatusChange = async (row: TenantAPI, newStatus: number) => {
  const oldStatus = row.status;

  try {
    await updateTenant(row.id, { status: newStatus });
    ElMessage.success("状态更新成功");
  } catch (error: unknown) {
    // API 失败，恢复原状态
    row.status = oldStatus;
    const message = error instanceof Error ? error.message : "更新租户状态失败";
    ElMessage.error(message);
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
 * 格式化日期
 */
const formatDate = (timestamp: string | null | undefined): string => {
  if (!timestamp) return "-";
  const date = new Date(timestamp);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};
</script>

<style scoped>
.tenant-management-page {
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
