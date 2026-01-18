<template>
  <div class="role-table-container">
    <el-table :data="data" class="role-table" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column prop="role_name" label="角色名称" min-width="150" align="center" />
      <el-table-column prop="role_code" label="角色代码" min-width="150" align="center" />
      <el-table-column prop="description" label="描述" min-width="200" align="center" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template slot-scope="scope">
          <el-switch
            v-model="scope.row.status"
            :active-value="0"
            :inactive-value="1"
            active-color="#3b82f6"
            inactive-color="#9ca3af"
            @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="180" fixed="right" align="center">
        <template slot-scope="scope">
          <div class="operation-buttons">
            <el-button type="text" class="edit-btn" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="text" class="delete-btn" @click="handleDelete(scope.row)">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <div class="role-pagination-container" v-if="total > 0">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        :current-page="pagination.currentPage"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pagination.pageSize"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoleTable',
  props: {
    data: {
      type: Array,
      default: () => []
    },
    pagination: {
      type: Object,
      default: () => ({
        currentPage: 1,
        pageSize: 10
      })
    },
    total: {
      type: Number,
      default: 0
    }
  },
  methods: {
    handleSelectionChange(selection) {
      this.$emit('selection-change', selection)
    },
    handleStatusChange(row) {
      this.$emit('status-change', row)
    },
    handleEdit(row) {
      this.$emit('edit', row)
    },
    handleDelete(row) {
      this.$emit('delete', row)
    },
    handleSizeChange(size) {
      this.$emit('size-change', size)
    },
    handlePageChange(page) {
      this.$emit('page-change', page)
    }
  }
}
</script>

<style scoped>
.role-table-container {
  width: 100%;
}

.role-table {
  width: 100%;
  margin-bottom: 20px;
}

.role-pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.operation-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.edit-btn {
  color: #409EFF;
}

.delete-btn {
  color: #F56C6C;
}
</style>
