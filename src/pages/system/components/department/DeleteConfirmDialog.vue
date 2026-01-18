<template>
  <el-dialog
    title="确认删除"
    :visible.sync="dialogVisible"
    width="400px"
    @close="handleClose"
  >
    <div class="confirm-message">
      <i class="el-icon-warning"></i>
      <span>{{ message }}</span>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定删除</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'DeleteConfirmDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    targetName: {
      type: String,
      default: ''
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
    },
    message() {
      return `确定要删除部门"${this.targetName}"吗？此操作不可恢复。`
    }
  },
  methods: {
    handleConfirm() {
      this.$emit('confirm')
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
