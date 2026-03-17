<template>
  <div class="user-list-container flex flex-col flex-1">
    <!-- 操作按钮区 -->
    <div class="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
      <div class="flex gap-2">
        <el-button
          type="primary"
          size="small"
          data-testid="btn-add-user"
          @click="handleAdd"
        >
          <i class="i-carbon-add"></i>
          新增
        </el-button>
        <el-button
          size="small"
          :disabled="selectedCodes.length === 0"
          data-testid="btn-batch-delete"
          @click="handleBatchDelete"
        >
          <i class="i-carbon-trash-can"></i>
          删除
        </el-button>
      </div>
      <div class="flex gap-2">
        <el-button size="small" circle @click="handleAdvancedSearch">
          <i class="i-carbon-search"></i>
        </el-button>
        <el-button size="small" circle @click="handleRefresh">
          <i class="i-carbon-renew"></i>
        </el-button>
        <el-button size="small" circle @click="handleTableSetting">
          <i class="i-carbon-settings"></i>
        </el-button>
      </div>
    </div>

    <!-- 表格 -->
    <UserTable
      :data="users"
      :loading="loading"
      @selection-change="handleSelectionChange"
      @edit="handleEdit"
      @delete="handleDelete"
      @status-change="handleStatusChange"
      @reset-password="handleResetPassword"
      @authorization="handleAuthorization"
    />

    <!-- 分页 -->
    <div class="mt-5 text-center">
      <el-pagination
        :current-page="pagination.currentPage"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pagination.pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      ></el-pagination>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import UserTable from "@/pages/system/components/user/UserTable.vue";
import type { User } from "@/types/rbac/user";

interface Pagination {
  currentPage: number;
  pageSize: number;
}

defineProps<{
  users: User[];
  loading: boolean;
  pagination: Pagination;
  total: number;
}>();

const emit = defineEmits<{
  selectionChange: [selection: User[]];
  add: [];
  edit: [row: User];
  delete: [row: User];
  batchDelete: [ids: number[]];
  statusChange: [row: User, callback: (success: boolean) => void];
  resetPassword: [row: User];
  pageChange: [page: number];
  sizeChange: [size: number];
  advancedSearch: [];
  refresh: [];
  tableSetting: [];
  authorization: [row: User];
}>();

const selectedCodes = ref<number[]>([]);

const handleSelectionChange = (selection: User[]) => {
  const codes = selection.map((row) => row.id);
  selectedCodes.value = codes;
  emit("selectionChange", selection);
};

const handleAdd = () => {
  emit("add");
};

const handleEdit = (row: User) => {
  emit("edit", row);
};

const handleDelete = (row: User) => {
  emit("delete", row);
};

const handleBatchDelete = () => {
  emit("batchDelete", selectedCodes.value);
};

const handleStatusChange = (row: User, callback: (success: boolean) => void) => {
  emit("statusChange", row, callback);
};

const handleResetPassword = (row: User) => {
  emit("resetPassword", row);
};

const handlePageChange = (page: number) => {
  emit("pageChange", page);
};

const handleSizeChange = (size: number) => {
  emit("sizeChange", size);
};

const handleAdvancedSearch = () => {
  emit("advancedSearch");
};

const handleRefresh = () => {
  emit("refresh");
};

const handleTableSetting = () => {
  emit("tableSetting");
};

const handleAuthorization = (row: User) => {
  emit("authorization", row);
};
</script>

<style scoped>
/* 禁用状态下的按钮样式 */
.el-button:disabled {
  @apply opacity-50 cursor-not-allowed;
}
</style>
