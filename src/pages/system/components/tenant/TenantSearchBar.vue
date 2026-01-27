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
  padding: 18px 24px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.05);
}

.tenant-search-bar .el-form-item {
  margin-bottom: 0;
}

.tenant-search-bar .el-form-item__label {
  color: #303133;
  font-weight: 500;
}
</style>