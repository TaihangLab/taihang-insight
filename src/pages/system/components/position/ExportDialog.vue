<template>
  <el-dialog
    title="导出岗位数据"
    :visible.sync="dialogVisible"
    width="500px"
    @close="handleClose"
  >
    <el-form label-width="100px">
      <el-form-item label="导出格式">
        <el-radio-group v-model="exportForm.format">
          <el-radio label="excel">Excel格式</el-radio>
          <el-radio label="csv">CSV格式</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="导出范围">
        <el-radio-group v-model="exportForm.range">
          <el-radio label="all">全部数据</el-radio>
          <el-radio label="selected">选中数据</el-radio>
          <el-radio label="current">当前页面</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="包含字段">
        <el-checkbox-group v-model="exportForm.fields">
          <el-checkbox label="position_code">岗位编码</el-checkbox>
          <el-checkbox label="category_code">类别编码</el-checkbox>
          <el-checkbox label="position_name">岗位名称</el-checkbox>
          <el-checkbox label="department">部门</el-checkbox>
          <el-checkbox label="order_num">排序</el-checkbox>
          <el-checkbox label="status">状态</el-checkbox>
          <el-checkbox label="create_time">创建时间</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定导出</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'ExportDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      exportForm: {
        format: 'excel',
        range: 'all',
        fields: ['position_code', 'category_code', 'position_name', 'department', 'order_num', 'status', 'create_time']
      }
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
  methods: {
    handleConfirm() {
      this.$emit('confirm', { ...this.exportForm })
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
/* 组件样式继承自父组件的全局样式 */
</style>
