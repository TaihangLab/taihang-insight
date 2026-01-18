<template>
  <el-dialog
    :title="dialogTitle"
    :visible.sync="dialogVisible"
    width="600px"
    @close="closeDialog"
  >
    <el-form :model="positionForm" :rules="positionRules" ref="positionForm" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="岗位编码" prop="position_code">
            <el-input v-model="positionForm.position_code" :disabled="!!currentPosition" placeholder="请输入岗位编码"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="岗位名称" prop="position_name">
            <el-input v-model="positionForm.position_name" placeholder="请输入岗位名称"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="类别编码" prop="category_code">
            <el-input v-model="positionForm.category_code" placeholder="请输入类别编码"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="所属部门" prop="department">
            <el-select v-model="positionForm.department" placeholder="请选择部门" style="width: 100%">
              <el-option label="研发部门" value="研发部门"></el-option>
              <el-option label="XXX科技" value="XXX科技"></el-option>
              <el-option label="市场部门" value="市场部门"></el-option>
              <el-option label="财务部门" value="财务部门"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="显示排序" prop="order_num">
            <el-input-number v-model="positionForm.order_num" :min="0" :max="999" controls-position="right" style="width: 100%"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="岗位级别">
            <el-select v-model="positionForm.level" placeholder="请选择岗位级别" style="width: 100%">
              <el-option label="高层管理" value="high"></el-option>
              <el-option label="中层管理" value="middle"></el-option>
              <el-option label="基层管理" value="basic"></el-option>
              <el-option label="普通员工" value="staff"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="岗位职责">
            <el-input type="textarea" v-model="positionForm.responsibility" :rows="3" placeholder="请输入岗位职责"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="任职要求">
            <el-input type="textarea" v-model="positionForm.requirements" :rows="3" placeholder="请输入任职要求"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="岗位状态">
            <el-radio-group v-model="positionForm.status">
              <el-radio :label="1">正常</el-radio>
              <el-radio :label="0">停用</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <span slot="footer" class="dialog-footer">
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" @click="submitForm">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'PositionEditDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    currentPosition: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      positionForm: {
        id: null,
        position_code: '',
        category_code: '',
        position_name: '',
        department: '',
        order_num: 1,
        level: '',
        responsibility: '',
        requirements: '',
        status: 1
      },
      positionRules: {
        position_code: [
          { required: true, message: '请输入岗位编码', trigger: 'blur' }
        ],
        position_name: [
          { required: true, message: '请输入岗位名称', trigger: 'blur' }
        ],
        category_code: [
          { required: true, message: '请输入类别编码', trigger: 'blur' }
        ],
        department: [
          { required: true, message: '请选择部门', trigger: 'change' }
        ],
        order_num: [
          { required: true, message: '请输入显示排序', trigger: 'blur' }
        ]
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
    },
    dialogTitle() {
      return this.currentPosition ? '编辑岗位' : '新增岗位'
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.resetForm()
        if (this.currentPosition) {
          this.positionForm = { ...this.currentPosition }
        }
      }
    }
  },
  methods: {
    resetForm() {
      this.positionForm = {
        id: null,
        position_code: '',
        category_code: '',
        position_name: '',
        department: '',
        order_num: 1,
        level: '',
        responsibility: '',
        requirements: '',
        status: 1
      }
    },
    submitForm() {
      this.$refs.positionForm.validate((valid) => {
        if (valid) {
          this.$emit('submit', { ...this.positionForm })
        }
      })
    },
    closeDialog() {
      this.$emit('update:visible', false)
      this.$nextTick(() => {
        if (this.$refs.positionForm) {
          this.$refs.positionForm.clearValidate()
        }
      })
    },
    cancel() {
      this.closeDialog()
    }
  }
}
</script>

<style scoped>
/* 组件样式继承自父组件的全局样式 */
</style>
