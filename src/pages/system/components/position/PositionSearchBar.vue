<template>
  <div class="position-search-bar">
    <el-form :inline="true" :model="formValue" class="search-form">
      <el-form-item v-permission="'tenant:list:view'" label="租户">
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
import { ref, watch, onScopeDispose } from 'vue'
import TenantSelector from '@/pages/system/components/commons/TenantSelector.vue'
import DeptTreeSelect from '@/pages/system/components/commons/DeptTreeSelect.vue'

interface SearchValue {
  tenant_id?: string | number | null
  position_code?: string
  position_name?: string
  category_code?: string
  status?: number | null
}

const props = defineProps<{
  modelValue: SearchValue
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SearchValue]
  search: [value: SearchValue]
  reset: [value: SearchValue]
  tenantChange: []
}>()

const tenantSelectorRef = ref()

// 使用 ref 替代 reactive，避免潜在的响应式问题
const formValue = ref<SearchValue>({ ...props.modelValue })

// 使用 watch 并添加清理逻辑
const stopWatch = watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      Object.assign(formValue.value, newVal)
    }
  },
  { deep: true }
)

// 组件卸载时停止监听
onScopeDispose(() => {
  stopWatch()
})

const handleSearch = () => {
  emit('update:modelValue', { ...formValue.value })
  emit('search', formValue.value)
}

const handleReset = () => {
  const currentTenantId = formValue.value.tenant_id
  Object.assign(formValue.value, {
    tenant_id: currentTenantId,
    position_code: '',
    position_name: '',
    category_code: '',
    status: null
  })
  emit('update:modelValue', { ...formValue.value })
  emit('reset', formValue.value)
}

const handleTenantChange = () => {
  emit('update:modelValue', { ...formValue.value })
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
