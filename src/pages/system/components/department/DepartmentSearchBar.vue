<template>
  <div class="department-search-bar">
    <el-form :inline="true" :model="formValue" @submit.native.prevent="handleSearch">
      <el-form-item label="租户">
        <TenantSelector
          ref="tenantSelectorRef"
          v-model="formValue.tenant_id"
          @change="handleTenantChange"
        />
      </el-form-item>
      <el-form-item label="部门名称">
        <el-input
          v-model="formValue.dept_name"
          placeholder="请输入部门名称"
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
          style="width: 120px"
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
import { ref, watch, onScopeDispose } from 'vue'
import TenantSelector from '@/pages/system/components/commons/TenantSelector.vue'

interface SearchValue {
  tenant_id: string | number | null
  dept_name: string
  status: number | null
}

const props = defineProps<{
  modelValue: SearchValue
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SearchValue]
  search: [value: SearchValue]
  reset: []
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
    tenant_id: currentTenantId || null,
    dept_name: '',
    status: null
  })
  emit('update:modelValue', { ...formValue.value })
  emit('reset')
}

const handleTenantChange = () => {
  emit('update:modelValue', { ...formValue.value })
  emit('tenantChange')
}
</script>

<style scoped>
.department-search-bar {
  padding: var(--design-spacing-md) var(--design-spacing-lg);
  background: var(--design-bg-primary);
  border-radius: var(--design-radius-lg);
  border: 1px solid var(--design-border-color);
  box-shadow: var(--design-shadow-sm);
  margin-bottom: var(--design-spacing-md);
}

.department-search-bar .el-form-item {
  margin-bottom: 0;
  margin-right: var(--design-spacing-md);
}

.department-search-bar .el-form-item__label {
  color: var(--design-text-primary);
  font-weight: var(--design-font-weight-medium);
  font-size: var(--design-font-size-sm);
}

.department-search-bar :deep(.el-input__wrapper) {
  border-radius: var(--design-radius-md);
  transition: all var(--design-transition-base);
}

.department-search-bar :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--design-primary-color) inset;
}

.department-search-bar :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--design-primary-color) inset;
}

.department-search-bar :deep(.el-select .el-input__wrapper) {
  width: 140px;
}

.department-search-bar :deep(.el-button) {
  border-radius: var(--design-radius-md);
  font-weight: var(--design-font-weight-medium);
  padding: 8px 20px;
  transition: all var(--design-transition-base);
}

.department-search-bar :deep(.el-button--primary) {
  background: var(--design-gradient-primary);
  border: none;
  box-shadow: var(--design-shadow-primary);
}

.department-search-bar :deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, var(--design-primary-hover) 0%, #1a45c9 100%);
  box-shadow: var(--design-shadow-primary-hover);
  transform: translateY(-1px);
}

.department-search-bar :deep(.el-button--default) {
  border-color: var(--design-border-color);
  color: var(--design-text-primary);
}

.department-search-bar :deep(.el-button--default:hover) {
  border-color: var(--design-primary-color);
  color: var(--design-primary-color);
  background-color: var(--design-primary-light);
}
</style>
