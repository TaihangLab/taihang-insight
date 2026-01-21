<template>
  <div class="user-table">
    <el-table
      :data="data"
      v-loading="loading"
      style="width: 100%"
      class="custom-table"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="50" align="center"></el-table-column>
      <el-table-column prop="user_name" label="用户名称" min-width="140" align="center"></el-table-column>
      <el-table-column prop="nick_name" label="用户昵称" min-width="150" align="center"></el-table-column>
      <el-table-column prop="department" label="部门" min-width="80" align="center"></el-table-column>
      <el-table-column prop="phone" label="手机号码" min-width="120" align="center"></el-table-column>
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
      <el-table-column prop="create_time" label="创建时间" min-width="140" align="center"></el-table-column>
      <el-table-column label="操作" min-width="240" fixed="right" align="center">
        <template #default="scope">
          <div class="operation-buttons">
            <el-button type="text" class="auth-btn" @click="handleAuthorization(scope.row)">授权</el-button>
            <el-button type="text" class="edit-btn" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="text" class="delete-btn" @click="handleDelete(scope.row)">删除</el-button>
            <el-button type="text" class="reset-btn" @click="handleResetPassword(scope.row)">重置</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  name: 'UserTable',
  props: {
    data: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    handleSelectionChange(selection) {
      this.$emit('selection-change', selection)
    },
    handleStatusChange(row) {
      // 记录原始状态值
      const originalStatus = row.status;

      // 立即将状态切换，提供即时反馈
      row.status = row.status === 0 ? 1 : 0;

      // 定义一个回调函数来处理状态更新结果
      const callback = (success) => {
        if (!success) {
          // 如果更新失败，恢复原始状态
          row.status = originalStatus;
        }
      };

      // 发送状态变更请求给父组件，并传递回调函数
      this.$emit('status-change', row, callback);
    },
    handleEdit(row) {
      this.$emit('edit', row)
    },
    handleDelete(row) {
      this.$emit('delete', row)
    },
    handleResetPassword(row) {
      this.$emit('reset-password', row)
    },
    handleAuthorization(row) {
      this.$emit('authorization', row)
    }
  }
}
</script>

<style scoped>
.user-table {
  flex: 1;
}

.custom-table {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.custom-table :deep(.el-table__cell) {
  border-right: none;
}

.custom-table :deep(.el-table::before) {
  height: 0;
}

.custom-table :deep(.el-table__header-wrapper th) {
  font-weight: bold;
  text-align: center;
  background: #f5f7fa !important;
  color: #303133 !important;
  border-bottom: 1px solid #ebeef5 !important;
}

.custom-table :deep(.el-table__row td) {
  text-align: center;
}

.custom-table :deep(.el-table .el-table__body tr:hover > td) {
  background: #f5f7fa !important;
}

.operation-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.auth-btn {
  color: #67C23A;
}

.edit-btn {
  color: #409EFF;
}

.delete-btn {
  color: #F56C6C;
}

.reset-btn {
  color: #E6A23C;
}
</style>
