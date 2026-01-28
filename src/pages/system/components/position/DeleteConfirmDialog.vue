<template>
  <el-dialog
    title="确认删除"
    v-model="dialogVisible"
    width="400px"
    @close="handleClose"
  >
    <div class="confirm-message">
      <i class="el-icon-warning"></i>
      <span>确定要删除选中的岗位吗？此操作不可恢复。</span>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="danger" @click="handleConfirm">确定删除</el-button>
    </span>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  visible: boolean
  targetType?: 'single' | 'batch'
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  confirm: []
}>()

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const handleConfirm = () => {
  emit('confirm')
  dialogVisible.value = false
}

const handleCancel = () => {
  dialogVisible.value = false
}

const handleClose = () => {
  dialogVisible.value = false
}
</script>

<style scoped>
.confirm-message {
  display: flex;
  align-items: center;
}

.confirm-message i {
  font-size: 20px;
  color: #e6a23c;
  margin-right: 10px;
}

.confirm-message span {
  font-size: 14px;
  color: #606266;
}
</style>
