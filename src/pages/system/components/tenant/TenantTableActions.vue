<template>
  <div class="tenant-table-actions">
    <el-button
      type="primary"
      icon="el-icon-plus"
      size="small"
      data-testid="btn-add-tenant"
      @click="handleAdd"
    >新增</el-button>
    <el-button
      icon="el-icon-delete"
      size="small"
      data-testid="btn-batch-delete"
      :disabled="!hasSelection"
      @click="handleBatchDelete"
    >删除</el-button>
    <el-button
      icon="el-icon-download"
      size="small"
      data-testid="btn-export"
      @click="handleExport"
    >导出</el-button>
  </div>
</template>

<script>
export default {
  name: 'TenantTableActions',
  props: {
    selectedCount: {
      type: Number,
      default: 0
    }
  },
  computed: {
    hasSelection() {
      return this.selectedCount > 0
    }
  },
  methods: {
    handleAdd() {
      this.$emit('add')
    },
    handleBatchDelete() {
      if (!this.hasSelection) {
        this.$message({
          message: '请选择要删除的租户',
          type: 'warning'
        })
        return
      }
      this.$emit('batch-delete')
    },
    handleExport() {
      this.$emit('export')
    }
  }
}
</script>

<style scoped>
.tenant-table-actions {
  padding: 18px 24px 18px 24px;
  text-align: left;
  border-bottom: none;
}
</style>
