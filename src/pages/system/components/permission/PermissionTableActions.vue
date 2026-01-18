<template>
  <div class="permission-table-actions">
    <el-button type="primary" icon="el-icon-plus" @click="handleAdd">
      新增权限
    </el-button>
    <el-button icon="el-icon-refresh" @click="handleRefresh">
      刷新
    </el-button>
    <div class="expand-actions">
      <el-button icon="el-icon-folder-opened" @click="handleToggleExpand">
        {{ expandAll ? '全部折叠' : '全部展开' }}
      </el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PermissionTableActions',
  data() {
    return {
      expandAll: true
    }
  },
  methods: {
    handleAdd() {
      this.$emit('add')
    },
    handleRefresh() {
      this.$emit('refresh')
    },
    handleToggleExpand() {
      this.expandAll = !this.expandAll
      this.$emit('toggle-expand', this.expandAll)
    }
  }
}
</script>

<style scoped>
.permission-table-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
}

.expand-actions {
  margin-left: auto;
}
</style>
