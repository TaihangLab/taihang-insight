<template>
  <div class="user-table flex-1">
    <el-table
      :data="data"
      v-loading="loading"
      class="custom-table"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="50" align="center"></el-table-column>
      <el-table-column
        prop="user_name"
        label="用户名称"
        min-width="140"
        align="center"
      ></el-table-column>
      <el-table-column
        prop="nick_name"
        label="用户昵称"
        min-width="150"
        align="center"
      ></el-table-column>
      <el-table-column
        prop="department"
        label="部门"
        min-width="80"
        align="center"
      ></el-table-column>
      <el-table-column
        prop="phone"
        label="手机号码"
        min-width="120"
        align="center"
      ></el-table-column>
      <el-table-column prop="status" label="状态" width="80" align="center">
        <template #default="scope">
          <el-switch
            v-model="scope.row.status"
            :active-value="0"
            :inactive-value="1"
            active-color="#3b82f6"
            inactive-color="#9ca3af"
            @change="handleStatusChange(scope.row)"
          ></el-switch>
        </template>
      </el-table-column>
      <el-table-column
        prop="create_time"
        label="创建时间"
        min-width="140"
        align="center"
      ></el-table-column>
      <el-table-column label="操作" min-width="240" fixed="right" align="center">
        <template #default="scope">
          <div class="flex justify-center gap-2">
            <el-button link class="text-green-500" @click="handleAuthorization(scope.row)">
              授权
            </el-button>
            <el-button link class="text-blue-500" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button link class="text-red-500" @click="handleDelete(scope.row)">删除</el-button>
            <el-button link class="text-amber-500" @click="handleResetPassword(scope.row)">
              重置
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import type { User } from "@/types/rbac/user";

defineProps<{
  data: User[];
  loading: boolean;
}>();

const emit = defineEmits<{
  selectionChange: [selection: User[]];
  statusChange: [row: User, callback: (success: boolean) => void];
  edit: [row: User];
  delete: [row: User];
  resetPassword: [row: User];
  authorization: [row: User];
}>();

const handleSelectionChange = (selection: User[]) => {
  emit("selectionChange", selection);
};

const handleStatusChange = (row: User) => {
  // 记录原始状态值
  const originalStatus = row.status;

  // 立即将状态切换，提供即时反馈
  row.status = row.status === 0 ? 1 : 0;

  // 定义一个回调函数来处理状态更新结果
  const callback = (success: boolean) => {
    if (!success) {
      // 如果更新失败，恢复原始状态
      row.status = originalStatus;
    }
  };

  // 发送状态变更请求给父组件，并传递回调函数
  emit("statusChange", row, callback);
};

const handleEdit = (row: User) => {
  emit("edit", row);
};

const handleDelete = (row: User) => {
  emit("delete", row);
};

const handleResetPassword = (row: User) => {
  emit("resetPassword", row);
};

const handleAuthorization = (row: User) => {
  emit("authorization", row);
};
</script>

<style scoped>
/* 表格容器 */
.user-table {
  @apply flex-1;
}

/* 表格样式 */
.custom-table {
  @apply rounded-lg overflow-hidden border border-gray-200 shadow-sm;
}

.custom-table :deep(.el-table__cell) {
  @apply border-r-0;
}

.custom-table :deep(.el-table::before) {
  @apply h-0;
}

.custom-table :deep(.el-table__header-wrapper th) {
  @apply font-bold text-center bg-gray-50 text-gray-800 border-b border-gray-200;
}

.custom-table :deep(.el-table__row td) {
  @apply text-center;
}

.custom-table :deep(.el-table .el-table__body tr:hover > td) {
  background-color: var(--design-bg-secondary) !important;
}
</style>
