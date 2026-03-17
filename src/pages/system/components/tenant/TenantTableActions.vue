<template>
  <div class="tenant-table-actions">
    <el-button type="primary" size="default" data-testid="btn-add-tenant" @click="handleAdd">
      <el-icon><Plus /></el-icon>
      <span>新增</span>
    </el-button>
    <el-button
      size="default"
      data-testid="btn-batch-delete"
      :disabled="!hasSelection"
      @click="handleBatchDelete"
    >
      <el-icon><Delete /></el-icon>
      <span>删除</span>
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElMessage } from "element-plus";
import { Plus, Delete } from "@element-plus/icons-vue";

const props = defineProps<{
  selectedCount: number;
}>();

const emit = defineEmits<{
  add: [];
  batchDelete: [];
}>();

const hasSelection = computed(() => props.selectedCount > 0);

const handleAdd = () => {
  emit("add");
};

const handleBatchDelete = () => {
  if (!hasSelection.value) {
    ElMessage({
      message: "请选择要删除的租户",
      type: "warning",
    });
    return;
  }
  emit("batchDelete");
};
</script>

<style scoped>
.tenant-table-actions {
  /* 使用 flex 布局和间距 */
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--el-border-color);
}
</style>
