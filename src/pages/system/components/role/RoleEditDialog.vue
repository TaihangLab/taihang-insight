<template>
  <el-dialog
    :title="dialogTitle"
    v-model="dialogVisible"
    width="600px"
    @close="closeDialog"
  >
    <el-form :model="roleForm" :rules="roleRules" ref="roleFormRef" label-width="100px">
      <el-form-item label="角色编码" prop="role_code" required>
        <el-input
          v-model="roleForm.role_code"
          placeholder="请输入角色编码（如：ROLE_ADMIN）"
          :disabled="isEdit"
        ></el-input>
        <div class="form-tip">角色编码创建后不可修改</div>
      </el-form-item>

      <el-form-item label="角色名称" prop="role_name" required>
        <el-input v-model="roleForm.role_name" placeholder="请输入角色名称"></el-input>
      </el-form-item>

      <el-form-item label="数据权限" prop="data_scope">
        <el-select v-model="roleForm.data_scope" placeholder="请选择数据权限" style="width: 100%;">
          <el-option label="全部数据权限" :value="'1'"></el-option>
          <el-option label="自定数据权限" :value="'2'"></el-option>
          <el-option label="本部门数据权限" :value="'3'"></el-option>
          <el-option label="本部门及以下数据权限" :value="'4'"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="排序" prop="sort_order">
        <el-input-number
          v-model="roleForm.sort_order"
          :min="0"
          :max="9999"
          placeholder="请输入排序号"
          style="width: 100%;"
        ></el-input-number>
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="roleForm.status">
          <el-radio :label="0">正常</el-radio>
          <el-radio :label="1">停用</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="roleForm.remark"
          type="textarea"
          :rows="3"
          placeholder="请输入备注信息">
        </el-input>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import type { Role } from '@/types/rbac'

interface RoleForm {
  role_code: string
  role_name: string
  data_scope: string
  sort_order: number
  status: number
  remark: string
}

const props = defineProps<{
  visible: boolean
  currentRole: Role | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [data: Record<string, unknown>]
}>()

const roleFormRef = ref<FormInstance>()
const submitting = ref(false)

const roleForm = ref<RoleForm>({
  role_code: '',
  role_name: '',
  data_scope: '1',
  sort_order: 0,
  status: 0,
  remark: ''
})

const roleRules: FormRules<RoleForm> = {
  role_code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { pattern: /^[A-Z][A-Z0-9_]*$/, message: '角色编码必须以大写字母开头，只能包含大写字母、数字和下划线', trigger: 'blur' }
  ],
  role_name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ]
}

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const dialogTitle = computed(() => props.currentRole ? '编辑角色' : '新增角色')

const isEdit = computed(() => !!props.currentRole)

const resetForm = () => {
  roleForm.value = {
    role_code: '',
    role_name: '',
    data_scope: '1',
    sort_order: 0,
    status: 0,
    remark: ''
  }
  nextTick(() => {
    roleFormRef.value?.clearValidate()
  })
}

watch(() => props.currentRole, (newVal) => {
  if (newVal) {
    roleForm.value = {
      role_code: newVal.roleCode || '',
      role_name: newVal.roleName || '',
      data_scope: newVal.dataScope || '1',
      sort_order: 0,
      status: newVal.status ?? 0,
      remark: ''
    }
  } else {
    resetForm()
  }
}, { immediate: true })

const submitForm = async () => {
  if (!roleFormRef.value) return

  try {
    await roleFormRef.value.validate()

    submitting.value = true

    // Transform data to match backend API
    const submitData: Record<string, unknown> = {
      role_code: roleForm.value.role_code,
      role_name: roleForm.value.role_name,
      data_scope: roleForm.value.data_scope,
      sort_order: roleForm.value.sort_order,
      status: roleForm.value.status
    }

    // Add remark only if not empty
    if (roleForm.value.remark) {
      submitData.remark = roleForm.value.remark
    }

    emit('submit', submitData)
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    submitting.value = false
  }
}

const closeDialog = () => {
  emit('update:visible', false)
  nextTick(() => {
    resetForm()
  })
}

const cancel = () => {
  closeDialog()
}
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
</style>
