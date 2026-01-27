<template>
  <div class="department-search-bar">
    <el-form :inline="true" :model="formValue" @submit.native.prevent="handleSearch">
      <el-form-item label="租户">
        <TenantSelector
          v-model="formValue.tenant_id"
          @change="handleTenantChange"
        />
      </el-form-item>
      <el-form-item label="部门名称">
        <el-input
          v-model="formValue.name"
          placeholder="请输入部门名称"
          clearable
          @clear="handleSearch"
        ></el-input>
      </el-form-item>
      <el-form-item label="部门编码">
        <el-input
          v-model="formValue.id"
          placeholder="请输入部门编码"
          clearable
          @clear="handleSearch"
        ></el-input>
      </el-form-item>
      <el-form-item label="状态">
        <el-select
          v-model="formValue.status"
          placeholder="请选择状态"
          clearable
          @clear="handleSearch"
        >
          <el-option label="启用" :value="0"></el-option>
          <el-option label="停用" :value="1"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" data-testid="btn-search" @click="handleSearch">搜索</el-button>
        <el-button data-testid="btn-reset" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import TenantSelector from '@/pages/system/components/commons/TenantSelector.vue'

interface SearchValue {
  tenant_id: string | number | null
  name: string
  id: string | null
  status: number | null
}

const props = withDefaults(
  defineProps<{
    value: SearchValue
  }>(),
  {
    value: () => ({
      tenant_id: null,
      name: '',
      id: null,
      status: null
    })
  }
)

const emit = defineEmits<{
  search: [value: SearchValue]
  reset: []
  tenantChange: []
}>()

const formValue = reactive<SearchValue>({ ...props.value })

watch(
  () => props.value,
  (newVal) => {
    Object.assign(formValue, newVal)
  },
  { deep: true }
)

const handleSearch = () => {
  emit('search', formValue)
}

const handleReset = () => {
  Object.assign(formValue, {
    tenant_id: null,
    name: '',
    id: null,
    status: null
  })
  emit('reset')
}

const handleTenantChange = () => {
  emit('tenantChange')
}
</script>

<style scoped>
.department-search-bar {
  padding: 18px 24px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.05);
}

.department-search-bar .el-form-item {
  margin-bottom: 0;
}

.department-search-bar .el-form-item__label {
  color: #303133;
  font-weight: 500;
}
</style>
