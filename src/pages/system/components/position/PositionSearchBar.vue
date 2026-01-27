<template>
  <div class="position-search-bar">
    <el-form :inline="true" :model="formValue" class="search-form">
      <el-form-item label="租户">
        <TenantSelector
          ref="tenantSelectorRef"
          v-model="formValue.tenant_id"
          @change="handleTenantChange"
        />
      </el-form-item>
      <el-form-item label="岗位编码">
        <el-input
          v-model="formValue.position_code"
          placeholder="请输入岗位编码"
          clearable
          style="width: 200px;"
        ></el-input>
      </el-form-item>
      <el-form-item label="岗位名称">
        <el-input
          v-model="formValue.position_name"
          placeholder="请输入岗位名称"
          clearable
          style="width: 200px;"
        ></el-input>
      </el-form-item>
      <el-form-item label="类别编码">
        <el-input
          v-model="formValue.category_code"
          placeholder="请输入类别编码"
          clearable
          style="width: 200px;"
        ></el-input>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="formValue.status" placeholder="岗位状态" clearable style="width: 120px;">
          <el-option label="正常" :value="1"></el-option>
          <el-option label="停用" :value="0"></el-option>
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
  position_code: string
  position_name: string
  category_code: string
  status: number | null
}

const props = defineProps<{
  value: SearchValue
}>()

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
    tenant_id: currentTenantCode,
    position_code: '',
    position_name: '',
    category_code: '',
    status: null
  })
  emit('reset', formValue)
}

const handleTenantChange = () => {
  emit('input', formValue)
  emit('tenantChange')
}
</script>

<style scoped>
.position-search-bar {
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
