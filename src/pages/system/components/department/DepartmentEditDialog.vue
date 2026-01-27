<template>
  <el-dialog
    :title="dialogTitle"
    v-model="dialogVisible"
    width="600px"
    @close="closeDialog"
  >
    <el-form :model="deptForm" :rules="deptRules" ref="deptFormRef" label-width="100px">
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

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import type { FormInstance } from 'element-plus'

interface DeptForm {
  id: string | number | null
  parent_id: number | null
  name: string
  sort_order: number
  status: number
}

interface DeptOption {
  id: number | string | null
  name: string
  value?: number | string | null
  label?: string
  children?: DeptOption[]
  [key: string]: any
}

interface CurrentDept {
  id?: string | number
  isSubDept?: boolean
  [key: string]: any
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    currentDept: CurrentDept | null
    parentDeptOptions: DeptOption[]
  }>(),
  {
    parentDeptOptions: () => []
  }
)

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [data: DeptForm]
}>()

const deptFormRef = ref<FormInstance>()

const deptForm = reactive<DeptForm>({
  id: null,
  parent_id: null,
  name: '',
  sort_order: 0,
  status: 0
})

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const dialogTitle = computed(() => {
  if (props.currentDept && props.currentDept.isSubDept) {
    return '添加子部门'
  }
  return props.currentDept ? '编辑部门' : '添加部门'
})

const isEdit = computed(() => !!props.currentDept && !props.currentDept.isSubDept)

const deptRules = {
  name: [
    { required: true, message: '请输入部门名称', trigger: 'blur' },
    { min: 2, max: 30, message: '部门名称长度在2到30个字符', trigger: 'blur' }
  ],
  sort_order: [
    { required: true, message: '请输入显示排序', trigger: 'blur' }
  ]
}

const cascaderProps = {
  value: 'id',
  label: 'name',
  children: 'children',
  checkStrictly: true,
  emitPath: false,
  expandTrigger: 'hover' as const
}

const parentDeptOptionsWithTreeStructure = computed(() => {
  const noneOption: DeptOption = {
    id: 0,
    name: '无上级部门',
    value: 0,
    label: '无上级部门',
    children: []
  }

  const filteredOptions = props.parentDeptOptions
    .filter((option) => option.id !== null && option.id !== 0)
    .map((option) => convertOptionToNumber(option))

  return [noneOption, ...filteredOptions]
})

const convertOptionToNumber = (option: DeptOption): DeptOption => {
  const converted: DeptOption = {
    ...option,
    id: option.id !== null ? Number(option.id) : null,
    value: option.value !== null ? Number(option.value) : null
  }

  if (option.children && option.children.length > 0) {
    converted.children = option.children.map((child) => convertOptionToNumber(child))
  }

  return converted
}

const resetForm = () => {
  Object.assign(deptForm, {
    id: null,
    parent_id: null,
    name: '',
    sort_order: 0,
    status: 0
  })
}

watch(
  () => props.currentDept,
  (newVal) => {
    console.log('DepartmentEditDialog - currentDept:', newVal)
    if (newVal) {
      Object.assign(deptForm, newVal)
      console.log('DepartmentEditDialog - deptForm:', deptForm)
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

const submitForm = async () => {
  if (!deptFormRef.value) return

  const valid = await deptFormRef.value.validate()
  if (valid) {
    emit('submit', { ...deptForm })
  }
}

const closeDialog = () => {
  emit('update:visible', false)
  nextTick(() => {
    if (deptFormRef.value) {
      deptFormRef.value.clearValidate()
    }
  })
}

const cancel = () => {
  closeDialog()
}
</script>

<style scoped>
/* 组件样式继承自父组件的全局样式 */
</style>
