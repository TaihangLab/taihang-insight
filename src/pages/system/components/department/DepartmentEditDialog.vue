<template>
  <el-dialog
    :title="dialogTitle"
    :visible.sync="dialogVisible"
    width="600px"
    @close="closeDialog"
  >
    <el-form :model="deptForm" :rules="deptRules" ref="deptForm" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="上级部门">
            <el-cascader
              v-model="deptForm.parent_id"
              :options="parentDeptOptionsWithTreeStructure"
              :props="cascaderProps"
              placeholder="选择上级部门"
              clearable
              filterable
              style="width: 100%">
            </el-cascader>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="部门名称" prop="name" required>
            <el-input v-model="deptForm.name" placeholder="请输入部门名称"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="部门编码" prop="id" v-if="isEdit">
            <el-input v-model="deptForm.id" disabled></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="显示排序" prop="sort_order" required>
            <el-input-number
              v-model="deptForm.sort_order"
              :min="0"
              :max="999"
              controls-position="right"
              style="width: 100%">
            </el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="部门状态">
            <el-radio-group v-model="deptForm.status">
              <el-radio :label="0">启用</el-radio>
              <el-radio :label="1">停用</el-radio>
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
  name: 'DepartmentEditDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    currentDept: {
      type: Object,
      default: null
    },
    parentDeptOptions: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      deptForm: {
        id: null,
        parent_id: null,
        name: '',
        sort_order: 0,
        status: 0
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
      if (this.currentDept && this.currentDept.isSubDept) {
        return '添加子部门'
      }
      return this.currentDept ? '编辑部门' : '添加部门'
    },
    isEdit() {
      return !!this.currentDept && !this.currentDept.isSubDept
    },
    deptRules() {
      const rules = {
        name: [
          { required: true, message: '请输入部门名称', trigger: 'blur' },
          { min: 2, max: 30, message: '部门名称长度在2到30个字符', trigger: 'blur' }
        ],
        sort_order: [
          { required: true, message: '请输入显示排序', trigger: 'blur' }
        ]
      };

      return rules;
    },
    parentDeptOptionsWithNone() {
      // 直接使用从API获取的树形结构数据，添加"无上级部门"选项
      const noneOption = { id: null, name: '无上级部门', value: null, label: '无上级部门' };
      return [noneOption, ...this.parentDeptOptions.slice(1)]; // 跳过原有的"无上级部门"选项
    },
    parentDeptOptionsWithTreeStructure() {
      // 为el-cascader准备数据，确保树形结构正确
      const noneOption = {
        id: null,
        name: '无上级部门',
        value: null,
        label: '无上级部门',
        children: []
      };

      // 过滤掉"无上级部门"选项（如果存在于parentDeptOptions中），然后添加到前面
      const filteredOptions = this.parentDeptOptions.filter(option => option.id !== null);
      return [noneOption, ...parentDeptOptions];
    },
    cascaderProps() {
      return {
        value: 'id',
        label: 'name',
        children: 'children',
        checkStrictly: true, // 允许选择任意一级
        emitPath: false, // 只返回选中节点的值，而不是路径
        expandTrigger: 'hover'
      }
    }
  },
  watch: {
    currentDept: {
      handler(newVal) {
        if (newVal) {
          this.deptForm = {
            id: newVal.id || null,
            parent_id: newVal.parent_id || null,
            name: newVal.name || '',
            sort_order: newVal.sort_order || 0,
            status: newVal.status !== undefined ? newVal.status : 0
          }
        } else {
          this.resetForm()
        }
      },
      immediate: true
    }
  },
  methods: {
    resetForm() {
      this.deptForm = {
        id: null,
        parent_id: null,
        name: '',
        sort_order: 0,
        status: 0
      }
    },
    submitForm() {
      this.$refs.deptForm.validate((valid) => {
        if (valid) {
          this.$emit('submit', { ...this.deptForm })
        }
      })
    },
    closeDialog() {
      this.$emit('update:visible', false)
      this.$nextTick(() => {
        if (this.$refs.deptForm) {
          this.$refs.deptForm.clearValidate()
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
