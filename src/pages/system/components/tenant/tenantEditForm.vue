<template>
  <el-dialog
    :title="dialogTitle"
    v-model="dialogVisible"
    width="700px"
    @close="closeDialog"
  >
    <DevTools v-if="dialogVisible && isDev" v-model="tenantForm" type="tenant" :enabled="true" />

    <el-form :model="tenantForm" :rules="tenantRules" ref="tenantFormRef" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="租户名称" prop="tenant_name" required>
            <el-input v-model="tenantForm.tenant_name" placeholder="请输入租户名称"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="企业名称" prop="company_name" required>
            <el-input v-model="tenantForm.company_name" placeholder="请输入企业名称"></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="联系人" prop="contact_person" required>
            <el-input v-model="tenantForm.contact_person" placeholder="请输入联系人"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="联系电话" prop="contact_phone" required>
            <el-input v-model="tenantForm.contact_phone" placeholder="请输入联系电话"></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="用户名" prop="username" required>
            <el-input v-model="tenantForm.username" placeholder="请输入系统用户名"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="用户密码" :prop="currentTenant ? '' : 'password'" :required="!currentTenant">
            <el-input
              v-model="tenantForm.password"
              :placeholder="currentTenant ? '留空则不修改密码' : '请输入系统用户密码'"
              type="password"
              show-password
            ></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="租户套餐">
            <el-select v-model="tenantForm.package" placeholder="请选择租户套餐" style="width: 100%">
              <el-option label="基础版" value="basic"></el-option>
              <el-option label="标准版" value="standard"></el-option>
              <el-option label="高级版" value="premium"></el-option>
              <el-option label="企业版" value="enterprise"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="过期时间">
            <el-date-picker
              v-model="tenantForm.expire_time"
              type="date"
              placeholder="请选择过期时间"
              format="yyyy-MM-dd"
              value-format="yyyy-MM-dd"
              style="width: 100%"
              :picker-options="pickerOptions"
            ></el-date-picker>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="用户数量">
            <el-input v-model.number="tenantForm.user_count" placeholder="0" type="number"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="绑定域名">
            <el-input v-model="tenantForm.domain" placeholder="请输入绑定域名"></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="企业地址">
        <el-input v-model="tenantForm.address" placeholder="请输入企业地址"></el-input>
      </el-form-item>
      <el-form-item label="企业代码">
        <el-input v-model="tenantForm.company_code" placeholder="请输入统一社会信用代码"></el-input>
      </el-form-item>
      <el-form-item label="企业简介">
        <el-input
          v-model="tenantForm.description"
          type="textarea"
          :rows="3"
          placeholder="请输入企业简介"
        ></el-input>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="tenantForm.remark" placeholder="请输入备注"></el-input>
      </el-form-item>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" @click="submitForm">确定</el-button>
    </span>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import type { FormInstance } from 'element-plus'
import DevTools from '@/components/common/DevTools.vue'
import tenantService from '@/api/system/tenantService'
import type { TenantAPI } from '@/types/rbac/tenant'

interface TenantForm {
  tenant_id: string
  tenant_name: string
  company_name: string
  contact_person: string
  contact_phone: string
  username: string
  password: string
  package: string
  expire_time: string | null
  user_count: number
  domain: string
  address: string
  company_code: string
  description: string
  remark: string
}

const props = defineProps<{
  visible: boolean
  currentTenant: TenantAPI | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  saved: []
}>()

const tenantFormRef = ref<FormInstance>()

const pickerOptions = {
  disabledDate: (time: Date) => {
    return time.getTime() < Date.now() - 86400000
  }
}

const getDefaultExpireTime = (): string => {
  const now = new Date()
  const oneYearLater = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
  return oneYearLater.toISOString().split('T')[0]
}

const createDefaultForm = (): TenantForm => ({
  tenant_id: '',
  tenant_name: '',
  company_name: '',
  contact_person: '',
  contact_phone: '',
  username: '',
  password: '',
  package: 'standard',
  expire_time: getDefaultExpireTime(),
  user_count: 10,
  domain: '',
  address: '',
  company_code: '',
  description: '',
  remark: ''
})

const tenantForm = reactive<TenantForm>(createDefaultForm())

const tenantRules = {
  tenant_id: [
    { required: true, message: '请输入租户编码', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_-]+$/,
      message: '租户编码只能包含字母、数字、下划线和横线',
      trigger: 'blur'
    }
  ],
  tenant_name: [{ required: true, message: '请输入租户名称', trigger: 'blur' }],
  company_name: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
  contact_person: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  contact_phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  username: [{ required: true, message: '请输入系统用户名', trigger: 'blur' }],
  password: [{ min: 6, message: '密码长度不能少于6位', trigger: 'blur' }]
}

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const dialogTitle = computed(() => (props.currentTenant ? '编辑租户' : '添加租户'))

// 检测是否为开发环境
const isDev = computed(() => {
  return import.meta.env.DEV
})

const resetForm = () => {
  Object.assign(tenantForm, createDefaultForm())
}

watch(
  () => props.currentTenant,
  (newVal) => {
    if (newVal) {
      Object.assign(tenantForm, {
        tenant_id: String(newVal.tenant_id || newVal.id || ''),
        tenant_name: newVal.tenant_name || '',
        company_name: newVal.company_name || '',
        contact_person: newVal.contact_person || '',
        contact_phone: newVal.contact_phone || '',
        username: newVal.username || '',
        password: '',
        package: newVal.package || 'standard',
        expire_time: newVal.expire_time || null,
        user_count: newVal.user_count || 10,
        domain: newVal.domain || '',
        address: newVal.address || '',
        company_code: newVal.company_code || '',
        description: newVal.description || '',
        remark: newVal.remark || ''
      })
    } else {
      resetForm()
      nextTick(() => {
        tenantForm.package = 'standard'
        tenantForm.expire_time = getDefaultExpireTime()
        tenantForm.user_count = 10
      })
    }
  },
  { immediate: true }
)

const submitForm = async () => {
  if (!tenantFormRef.value) return

  try {
    await tenantFormRef.value.validate()

    if (props.currentTenant) {
      const tenantId = Number(props.currentTenant.tenant_id || props.currentTenant.id)
      if (!tenantId) {
        throw new Error('租户ID不能为空')
      }

      const updateData: Record<string, any> = {
        id: tenantId,
        tenant_name: tenantForm.tenant_name,
        company_name: tenantForm.company_name,
        contact_person: tenantForm.contact_person,
        contact_phone: tenantForm.contact_phone,
        username: tenantForm.username,
        package: tenantForm.package,
        expire_time: tenantForm.expire_time || null,
        user_count: tenantForm.user_count || 0,
        domain: tenantForm.domain,
        address: tenantForm.address,
        company_code: tenantForm.company_code,
        description: tenantForm.description,
        remark: tenantForm.remark
      }

      if (tenantForm.password) {
        updateData.password = tenantForm.password
      }

      await tenantService.updateTenant(tenantId, updateData)
      ElMessage({
        message: '租户信息修改成功',
        type: 'success'
      })
    } else {
      const createData = {
        tenant_id: tenantForm.tenant_id,
        tenant_name: tenantForm.tenant_name,
        company_name: tenantForm.company_name,
        contact_person: tenantForm.contact_person,
        contact_phone: tenantForm.contact_phone,
        username: tenantForm.username,
        password: tenantForm.password,
        package: tenantForm.package,
        expire_time: tenantForm.expire_time || null,
        user_count: tenantForm.user_count || 0,
        domain: tenantForm.domain,
        address: tenantForm.address,
        company_code: tenantForm.company_code,
        description: tenantForm.description,
        remark: tenantForm.remark
      }

      await tenantService.createTenant(createData)
      ElMessage({
        message: '租户添加成功',
        type: 'success'
      })
    }

    emit('saved')
    closeDialog()
  } catch (error: any) {
    console.error('保存租户失败:', error)

    let errorMessage = '未知错误'
    if (error.response && error.response.data) {
      const errorData = error.response.data
      if (errorData && typeof errorData === 'object' && errorData.message) {
        errorMessage = errorData.message
      } else if (typeof errorData === 'string') {
        errorMessage = errorData
      }
    } else if (error.message) {
      errorMessage = error.message
    }

    ElMessage.error(`保存失败: ${errorMessage}`)
  }
}

const closeDialog = () => {
  emit('update:visible', false)
  nextTick(() => {
    tenantFormRef.value?.clearValidate()
  })
}

const cancel = () => {
  closeDialog()
}
</script>

<style scoped>
/* 组件样式继承自父组件的全局样式 */
</style>
