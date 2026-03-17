<template>
  <el-select
    :model-value="modelValue"
    :placeholder="placeholder"
    :clearable="clearable"
    :style="customStyle"
    @update:model-value="handleUpdate"
    @change="handleChange"
    @focus="loadTenantsIfNeeded"
  >
    <el-option
      v-for="tenant in tenants"
      :key="tenant.id"
      :label="tenant.tenant_name"
      :value="tenant.id"
    ></el-option>
  </el-select>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { ElMessage } from "element-plus";
import tenantService from "@/api/system/tenantService";

interface Tenant {
  id: number;
  tenant_name: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null;
    placeholder?: string;
    clearable?: boolean;
    customStyle?: Record<string, any>;
    autoSelectFirst?: boolean;
  }>(),
  {
    modelValue: null,
    placeholder: "请选择租户",
    clearable: true,
    customStyle: () => ({ width: "200px" }),
    autoSelectFirst: true,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string | number | null];
  change: [value: string | number | null];
}>();

const tenants = ref<Tenant[]>([]);
const loaded = ref(false);

onMounted(async () => {
  await loadTenantsIfNeeded();
});

const loadTenants = async () => {
  if (loaded.value) return;

  try {
    // 传递分页参数以获取所有租户
    const response = await tenantService.getTenants({
      skip: 0,
      limit: 1000, // 获取所有租户
    });
    
    // 响应拦截器已处理格式，response.data 是租户数组
    // 响应格式：{ data: [...], total, page, limit }
    const tenantList = Array.isArray(response) ? response : (response?.data || []);

    if (Array.isArray(tenantList)) {
      // 过滤掉 id 或 tenant_name 为空的租户记录
      tenants.value = tenantList.filter((tenant) => tenant.id != null && tenant.tenant_name != null);
      loaded.value = true;

      if (props.autoSelectFirst && !props.modelValue && tenants.value.length > 0) {
        const firstTenant = tenants.value[0];
        if (firstTenant) {
          emit("update:modelValue", firstTenant.id);
          emit("change", firstTenant.id);
        }
      } else if (props.autoSelectFirst && !props.modelValue && tenants.value.length === 0) {
        ElMessage.warning("没有可用的租户，请先创建租户");
      }
    }
  } catch (error: unknown) {
    console.error("获取租户列表失败:", error);
    const err = error as { message?: string };
    ElMessage.error(err.message || "获取租户列表失败");
  }
};

const loadTenantsIfNeeded = async () => {
  if (!loaded.value) {
    await loadTenants();
  }
};

const handleUpdate = (value: string | number | null) => {
  emit("update:modelValue", value);
};

const handleChange = (value: string | number | null) => {
  emit("update:modelValue", value);
  emit("change", value);
};

watch(
  () => props.modelValue,
  (newValue) => {
    if (loaded.value && newValue && !tenants.value.some((t) => t.id === newValue)) {
      console.warn(`租户ID "${newValue}" 不存在于租户列表中`);
    }
  },
  { immediate: true },
);
</script>

<style scoped>
/* 可以在这里添加特定的样式 */
</style>
