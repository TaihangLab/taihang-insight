<template>
  <div class="p-4 px-5 mb-4 bg-white rounded-lg border border-gray-200 shadow-sm">
    <el-form :inline="true" :model="formValue" class="search-form" @submit.prevent="handleSearch">
      <el-form-item v-permission="'tenant:list:view'" label="租户">
        <TenantSelector
          ref="tenantSelectorRef"
          v-model="formValue.tenant_id"
          @change="handleTenantChange"
        />
      </el-form-item>
      <el-form-item label="用户名">
        <el-input
          v-model="formValue.username"
          placeholder="请输入用户名"
          clearable
          class="search-input"
          @clear="handleSearch"
        ></el-input>
      </el-form-item>
      <el-form-item label="手机号">
        <el-input
          v-model="formValue.phone"
          placeholder="请输入手机号"
          clearable
          class="search-input"
          @clear="handleSearch"
        ></el-input>
      </el-form-item>
      <el-form-item label="状态">
        <el-select
          v-model="formValue.status"
          placeholder="请选择状态"
          clearable
          class="w-35"
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
import { ref, watch, onScopeDispose } from "vue";
import TenantSelector from "@/pages/system/components/commons/TenantSelector.vue";

interface SearchValue {
  tenant_id: string | number | null;
  username: string;
  phone: string;
  status: number | null;
}

const props = defineProps<{
  modelValue: SearchValue;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: SearchValue];
  search: [value: SearchValue];
  reset: [];
  tenantChange: [];
}>();

const tenantSelectorRef = ref();

// 使用 ref 替代 reactive，避免潜在的响应式问题
const formValue = ref<SearchValue>({ ...props.modelValue });

// 使用 watch 并添加清理逻辑
const stopWatch = watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      Object.assign(formValue.value, newVal);
    }
  },
  { deep: true },
);

// 组件卸载时停止监听
onScopeDispose(() => {
  stopWatch();
});

const handleSearch = () => {
  emit("update:modelValue", { ...formValue.value });
  emit("search", formValue.value);
};

const handleReset = () => {
  const currentTenantId = formValue.value.tenant_id;
  Object.assign(formValue.value, {
    tenant_id: currentTenantId || null,
    username: "",
    phone: "",
    status: null,
  });
  emit("update:modelValue", { ...formValue.value });
  emit("reset");
};

const handleTenantChange = () => {
  emit("update:modelValue", { ...formValue.value });
  emit("tenantChange");
};
</script>

<style scoped>
/* 表单项间距和标签样式 */
.search-form .el-form-item {
  @apply mb-0 mr-4;
}

.search-form .el-form-item__label {
  @apply text-gray-800 font-medium text-sm;
}

/* 输入框样式 */
.search-input :deep(.el-input__wrapper) {
  @apply rounded-md transition-all duration-200;
}

.search-input :deep(.el-input__wrapper:hover),
.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--design-primary-color) inset;
}
</style>
