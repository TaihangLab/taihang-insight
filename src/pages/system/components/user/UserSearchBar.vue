<template>
  <div class="user-search-bar">
    <el-form :inline="true" :model="formValue" class="search-form">
      <el-form-item label="租户">
        <TenantSelector
          ref="tenantSelectorRef"
          v-model="formValue.tenant_id"
          @change="handleTenantChange"
        />
      </el-form-item>
      <el-form-item label="用户名称">
        <el-input
          v-model="formValue.user_name"
          placeholder="请输入用户名称"
          clearable
          style="width: 200px;"
        ></el-input>
      </el-form-item>
      <el-form-item label="用户昵称">
        <el-input
          v-model="formValue.nick_name"
          placeholder="请输入用户昵称"
          clearable
          style="width: 200px;"
        ></el-input>
      </el-form-item>
      <el-form-item label="手机号码">
        <el-input
          v-model="formValue.phone"
          placeholder="请输入手机号码"
          clearable
          style="width: 200px;"
        ></el-input>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="formValue.status" placeholder="用户状态" clearable style="width: 120px;">
          <el-option label="启用" :value="0"></el-option>
          <el-option label="禁用" :value="1"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="部门">
        <DeptTreeSelect
          v-model="formValue.dept_id"
          :tenant-id="formValue.tenant_id"
          :status="0"
          placeholder="选择部门"
          custom-style="width: 200px;"
        />
      </el-form-item>
      <el-form-item label="性别">
        <el-select v-model="formValue.gender" placeholder="选择性别" clearable style="width: 100px;">
          <el-option label="未知" :value="0"></el-option>
          <el-option label="男" :value="1"></el-option>
          <el-option label="女" :value="2"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" data-testid="btn-search" @click="handleSearch">搜索</el-button>
        <el-button icon="el-icon-refresh" data-testid="btn-reset" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, ref } from 'vue'
import TenantSelector from '@/pages/system/components/commons/TenantSelector.vue'
import DeptTreeSelect from '@/pages/system/components/commons/DeptTreeSelect.vue'

interface SearchValue {
  tenant_id: string | number | null
  user_name: string
  nick_name: string
  phone: string
  status: number | null
  dept_id: any
  position?: string
  gender: number | null
}

const props = withDefaults(
  defineProps<{
    value: SearchValue
  }>(),
  {
    value: () => ({
      tenant_id: null,
      user_name: '',
      nick_name: '',
      phone: '',
      status: null,
      dept_id: [],
      gender: null
    })
  }
)

const emit = defineEmits<{
  search: [value: SearchValue]
  reset: [value: SearchValue]
  input: [value: SearchValue]
  tenantChange: []
}>()

const tenantSelectorRef = ref()
const formValue = reactive<SearchValue>({ ...props.value })

watch(
  () => props.value,
  (newVal) => {
    console.log('value change', newVal)
    Object.assign(formValue, newVal)
  },
  { deep: true }
)

const handleSearch = () => {
  emit('search', formValue)
}

const handleReset = () => {
  const currentTenantCode = formValue.tenant_id
  Object.assign(formValue, {
    tenant_id: currentTenantCode || null,
    user_name: '',
    nick_name: '',
    phone: '',
    status: null,
    dept_id: [],
    position: '',
    gender: null
  })
  emit('reset', formValue)
}

const handleTenantChange = () => {
  emit('input', formValue)
  emit('tenantChange')
}
</script>

<style scoped>
.user-search-bar {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.search-form .el-form-item {
  margin-bottom: 10px;
  margin-right: 10px;
}
</style>
