<template>
  <el-dialog
    :title="dialogTitle"
    v-model="dialogVisible"
    width="700px"
    @close="closeDialog"
  >
    <DevTools v-if="dialogVisible" v-model="userForm" type="user" :enabled="isDev" />

    <el-form :model="userForm" :rules="userRules" ref="userFormRef" label-width="80px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="用户昵称" prop="nick_name" required>
            <el-input v-model="userForm.nick_name" placeholder="请输入用户昵称"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="归属部门" prop="dept_id">
            <DeptTreeSelect
              v-model="userForm.dept_id"
              :tenant-id="userForm.tenant_id || props.tenantId"
              :status="0"
              placeholder="选择部门"
              style="width: 100%;"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="手机号码" prop="phone">
            <el-input v-model="userForm.phone" placeholder="请输入手机号码"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="userForm.email" placeholder="请输入邮箱"></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="用户名称" prop="user_name" required>
            <el-input v-model="userForm.user_name" placeholder="请输入用户名称"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="用户密码" :prop="props.currentUser ? '' : 'password'" :required="!props.currentUser">
            <el-input
              v-model="userForm.password"
              :placeholder="props.currentUser ? '留空则不修改密码' : '请输入用户密码'"
              type="password"
              show-password
            >
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="用户性别" prop="gender">
            <el-select v-model="userForm.gender" placeholder="请选择" style="width: 100%;">
              <el-option label="未知" :value="0"></el-option>
              <el-option label="男" :value="1"></el-option>
              <el-option label="女" :value="2"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="userForm.status">
              <el-radio :value="0">正常</el-radio>
              <el-radio :value="1">停用</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="userForm.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入内容"
            >
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="cancel">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import DevTools from '@/components/common/DevTools.vue'
import DeptTreeSelect from '@/pages/system/components/commons/DeptTreeSelect.vue'
import type { User } from '@/types/rbac/user'

interface UserForm {
  tenant_id: number | null
  user_name: string
  nick_name: string
  phone: string
  email: string
  dept_id: number | number[] | null
  password: string
  gender: number | null
  status: number
  remark: string
}

const props = withDefaults(
  defineProps<{
    visible: boolean
    currentUser?: User | null
    tenantId: string | number | null
  }>(),
  {
    visible: false,
    currentUser: null,
    tenantId: null
  }
)

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [data: Partial<User>]
}>()

const userFormRef = ref<FormInstance>()

const defaultForm: UserForm = {
  tenant_id: typeof props.tenantId === 'number' ? props.tenantId : null,
  user_name: '',
  nick_name: '',
  phone: '',
  email: '',
  dept_id: null,
  password: '',
  gender: null,
  status: 0,
  remark: ''
}

const userForm = reactive<UserForm>({ ...defaultForm })

const userRules: FormRules<UserForm> = {
  user_name: [
    { required: true, message: '请输入用户名称', trigger: 'blur' }
  ],
  nick_name: [
    { required: true, message: '请输入用户昵称', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const dialogTitle = computed(() => {
  return props.currentUser ? '编辑用户' : '新增用户'
})

// 检测是否为开发环境
const isDev = computed(() => {
  return import.meta.env.DEV
})

const normalizeGenderValue = (gender: any): number => {
  if (typeof gender === 'string') {
    switch (gender.toLowerCase()) {
      case 'male':
      case '男':
        return 1
      case 'female':
      case '女':
        return 2
      default:
        return 0
    }
  }
  if (typeof gender === 'number') {
    return [0, 1, 2].includes(gender) ? gender : 0
  }
  return 0
}

const resetForm = () => {
  Object.assign(userForm, {
    ...defaultForm,
    tenant_id: typeof props.tenantId === 'number' ? props.tenantId : null
  })
}

const closeDialog = () => {
  emit('update:visible', false)
  nextTick(() => {
    userFormRef.value?.clearValidate()
  })
}

const cancel = () => {
  closeDialog()
}

const submitForm = async () => {
  if (!userFormRef.value) return

  try {
    await userFormRef.value.validate()

    // Transform data to match backend API
    const submitData: Partial<UserForm> = { ...userForm }

    // 处理 dept_id：级联选择器返回数组，取最后一个元素作为最终选择的部门ID
    if (Array.isArray(submitData.dept_id)) {
      if (submitData.dept_id.length > 0) {
        submitData.dept_id = submitData.dept_id[submitData.dept_id.length - 1]
      } else {
        submitData.dept_id = null
      }
    } else if (submitData.dept_id === undefined || submitData.dept_id === null) {
      submitData.dept_id = null
    } else if (typeof submitData.dept_id === 'string') {
      submitData.dept_id = submitData.dept_id === '' ? null : (parseInt(submitData.dept_id) || null)
    }

    emit('submit', submitData as Partial<User>)
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

watch(
  () => props.currentUser,
  (newVal) => {
    if (newVal) {
      Object.assign(userForm, {
        ...newVal,
        tenant_id: newVal.tenant_id || props.tenantId,
        dept_id: newVal.dept_id || null,
        password: '',
        gender: normalizeGenderValue(newVal.gender),
        status: newVal.status || 0
      })
    } else {
      resetForm()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
/* 组件样式继承自父组件的全局样式 */
</style>
