<template>
  <div class="user-table-actions">
    <div class="left-buttons">
      <el-button type="primary" icon="el-icon-plus" size="small" data-testid="btn-add-user" @click="handleAdd">新增</el-button>
      <el-button icon="el-icon-delete" size="small" data-testid="btn-batch-delete" @click="handleBatchDelete">删除</el-button>
      <el-dropdown @command="handleMoreAction" class="more-dropdown">
        <el-button size="small">
          更多<i class="el-icon-arrow-down el-icon--right"></i>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="download_template">下载模板</el-dropdown-item>
            <el-dropdown-item command="import_data">导入数据</el-dropdown-item>
            <el-dropdown-item command="export_data">导出数据</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <div class="right-buttons">
      <el-button icon="el-icon-search" size="small" circle @click="handleAdvancedSearch"></el-button>
      <el-button icon="el-icon-refresh" size="small" circle @click="handleRefresh"></el-button>
      <el-button icon="el-icon-setting" size="small" circle @click="handleTableSetting"></el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  add: []
  batchDelete: []
  moreAction: [command: string]
  advancedSearch: []
  refresh: []
  tableSetting: []
}>()

const handleAdd = () => {
  emit('add')
}

const handleBatchDelete = () => {
  emit('batchDelete')
}

const handleMoreAction = (command: string) => {
  emit('moreAction', command)
}

const handleAdvancedSearch = () => {
  emit('advancedSearch')
}

const handleRefresh = () => {
  emit('refresh')
}

const handleTableSetting = () => {
  emit('tableSetting')
}
</script>

<style scoped>
.user-table-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.left-buttons {
  display: flex;
  gap: 10px;
}

.right-buttons {
  display: flex;
  gap: 10px;
}

.more-dropdown :deep(.el-button) {
  border: 1px solid #dcdfe6;
  background: white;
  color: #606266;
}
</style>
