<template>
  <el-dialog
    title="提示"
    v-model="dialogVisible"
    width="400px"
    @close="handleClose"
  >
    <div class="reset-password-content">
      <div class="reset-password-message">
        请输入"{{ resetPasswordUser ? resetPasswordUser.user_name : '' }}"的新密码
      </div>
      <el-input
        v-model="newPassword"
        type="password"
        placeholder="请输入新密码"
        show-password
        style="margin-top: 15px;"
      ></el-input>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </span>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

interface User {
  user_name?: string
  [key: string]: any
}

const props = defineProps<{
  visible: boolean
  resetPasswordUser: User | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  confirm: [password: string]
}>()

const newPassword = ref('')

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

watch(
  () => props.visible,
  (newVal) => {
    if (!newVal) {
      newPassword.value = ''
    }
  }
)

const handleConfirm = () => {
  if (!newPassword.value) {
    ElMessage({
      message: '请输入新密码',
      type: 'warning'
    })
    return
  }
  emit('confirm', newPassword.value)
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
.reset-password-content {
  text-align: center;
}

.reset-password-message {
  margin-bottom: 15px;
  font-size: 14px;
  color: #606266;
}
</style>
