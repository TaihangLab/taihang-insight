<template>
  <el-dialog
    title="提示"
    :visible.sync="dialogVisible"
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
        style="margin-top: 15px;">
      </el-input>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'ResetPasswordDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    resetPasswordUser: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      newPassword: ''
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible
      },
      set(value) {
        this.$emit('update:visible', value)
      }
    }
  },
  watch: {
    visible(newVal) {
      if (!newVal) {
        this.newPassword = ''
      }
    }
  },
  methods: {
    handleConfirm() {
      if (!this.newPassword) {
        this.$message({
          message: '请输入新密码',
          type: 'warning'
        })
        return
      }
      this.$emit('confirm', this.newPassword)
      this.dialogVisible = false
    },
    handleCancel() {
      this.dialogVisible = false
    },
    handleClose() {
      this.dialogVisible = false
    }
  }
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
