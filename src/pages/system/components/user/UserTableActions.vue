<template>
  <div class="user-table-actions">
    <div class="left-buttons">
      <el-button type="primary" size="small" data-testid="btn-add-user" @click="handleAdd">
        <i class="i-carbon-add"></i>新增
      </el-button>
      <el-button size="small" data-testid="btn-batch-delete" @click="handleBatchDelete">
        <i class="i-carbon-trash-can"></i>删除
      </el-button>
    </div>
    <div class="right-buttons">
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
</template>

<script setup lang="ts">
interface Props {
  selectedCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  selectedCount: 0
})

const emit = defineEmits<{
  add: []
  batchDelete: []
  advancedSearch: []
  refresh: []
  tableSetting: []
}>()

const handleAdd = () => {
  emit('add')
}

const handleBatchDelete = () => {
  if (props.selectedCount === 0) {
    return
  }
  emit('batchDelete')
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
</style>
