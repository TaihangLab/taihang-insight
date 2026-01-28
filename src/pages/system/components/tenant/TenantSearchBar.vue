<template>
  <div class="tenant-search-bar">
    <el-form :inline="true" :model="formValue" @submit.native.prevent="handleSearch">
      <el-form-item label="租户名称">
        <el-input
          v-model="formValue.tenant_name"
          placeholder="请输入租户名称"
          clearable
          @clear="handleSearch"
        ></el-input>
      </el-form-item>
      <el-form-item label="企业名称">
        <el-input
          v-model="formValue.company_name"
          placeholder="请输入企业名称"
          clearable
          @clear="handleSearch"
        ></el-input>
      </el-form-item>
      <el-form-item label="租户状态">
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

interface SearchValue {
  tenant_id: string
  tenant_name: string
  company_name: string
  status: number | null
}

const props = defineProps<{
  modelValue: SearchValue
}>()

const emit = defineEmits<{
  'update:modelValue': [value: SearchValue]
  search: [value: SearchValue]
  reset: []
}>()

// 使用 ref 替代 reactive，避免潜在的响应式问题
const formValue = ref<SearchValue>({ ...props.modelValue })

// 使用 watch 并添加清理逻辑
const stopWatch = watch(
  () => props.modelValue,
  (newVal) => {
    // 确保在更新时检查组件是否仍然挂载
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
  Object.assign(formValue.value, {
    tenant_id: '',
    tenant_name: '',
    company_name: '',
    status: null
  })
  emit('update:modelValue', { ...formValue.value })
  emit('reset')
}
</script>

<style scoped>
.tenant-search-bar {
  padding: var(--design-spacing-md) var(--design-spacing-lg);
  background: var(--design-bg-primary);
  border-radius: var(--design-radius-lg);
  border: 1px solid var(--design-border-color);
  box-shadow: var(--design-shadow-sm);
  margin-bottom: var(--design-spacing-md);
}

.tenant-search-bar .el-form-item {
  margin-bottom: 0;
  margin-right: var(--design-spacing-md);
}

.tenant-search-bar .el-form-item__label {
  color: var(--design-text-primary);
  font-weight: var(--design-font-weight-medium);
  font-size: var(--design-font-size-sm);
}

.tenant-search-bar :deep(.el-input__wrapper) {
  border-radius: var(--design-radius-md);
  transition: all var(--design-transition-base);
}

.tenant-search-bar :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--design-primary-color) inset;
}

.tenant-search-bar :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--design-primary-color) inset;
}

.tenant-search-bar :deep(.el-select .el-input__wrapper) {
  width: 140px;
}

.tenant-search-bar :deep(.el-button) {
  border-radius: var(--design-radius-md);
  font-weight: var(--design-font-weight-medium);
  padding: 8px 20px;
  transition: all var(--design-transition-base);
}

.tenant-search-bar :deep(.el-button--primary) {
  background: var(--design-gradient-primary);
  border: none;
  box-shadow: var(--design-shadow-primary);
}

.tenant-search-bar :deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, var(--design-primary-hover) 0%, #1a45c9 100%);
  box-shadow: var(--design-shadow-primary-hover);
  transform: translateY(-1px);
}

.tenant-search-bar :deep(.el-button--default) {
  border-color: var(--design-border-color);
  color: var(--design-text-primary);
}

.tenant-search-bar :deep(.el-button--default:hover) {
  border-color: var(--design-primary-color);
  color: var(--design-primary-color);
  background-color: var(--design-primary-light);
}
</style>