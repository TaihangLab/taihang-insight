<template>
  <el-select
    v-if="shouldShow"
    :model-value="modelValue"
    :placeholder="placeholder"
    :clearable="clearable"
    :style="customStyle"
    @update:model-value="handleUpdate"
    @change="handleChange"
    @focus="loadTenantsIfNeeded">
    <el-option
      v-for="tenant in tenants"
      :key="tenant.id"
      :label="tenant.tenant_name"
      :value="tenant.id">
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import tenantService from '@/api/system/tenantService'
import { usePermissionsStore } from '@/stores/modules/permissions'

interface Tenant {
  id: number
  tenant_name: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null
    placeholder?: string
    clearable?: boolean
    customStyle?: Record<string, any>
    autoSelectFirst?: boolean
  }>(),
  {
    modelValue: null,
    placeholder: '请选择租户',
    clearable: true,
    customStyle: () => ({ width: '200px' }),
    autoSelectFirst: true
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
  change: [value: string | number | null]
}>()

const permissionsStore = usePermissionsStore()

const tenants = ref<Tenant[]>([])
const loaded = ref(false)

// 判断是否应该显示租户选择器
// 有 tenant:list:view 权限的用户（超级管理员）不显示选择器
// 没有 tenant:list:view 权限的用户（普通租户用户）显示选择器
const shouldShow = computed(() => {
  return !permissionsStore.hasPermission('tenant:list:view')
})

onMounted(async () => {
  await loadTenantsIfNeeded()
})

const loadTenants = async () => {
  if (loaded.value) return

  try {
    const response = await tenantService.getTenants()
    if (response?.data?.items && Array.isArray(response.data.items)) {
      tenants.value = response.data.items
      loaded.value = true

      if (props.autoSelectFirst && !props.modelValue && tenants.value.length > 0) {
        const firstTenantId = tenants.value[0].id
        emit('update:modelValue', firstTenantId)
        emit('change', firstTenantId)
      } else if (props.autoSelectFirst && !props.modelValue && tenants.value.length === 0) {
        ElMessage.warning('没有可用的租户，请先创建租户')
      }
    }
  } catch (error: any) {
    console.error('获取租户列表失败:', error)
    ElMessage.error(error.message || '获取租户列表失败')
  }
}

const loadTenantsIfNeeded = async () => {
  if (!loaded.value) {
    await loadTenants()
  }
}

const handleUpdate = (value: string | number | null) => {
  emit('update:modelValue', value)
}

const handleChange = (value: string | number | null) => {
  emit('update:modelValue', value)
  emit('change', value)
}

watch(
  () => props.modelValue,
  (newValue) => {
    if (loaded.value && newValue && !tenants.value.some((t) => t.id === newValue)) {
      console.warn(`租户ID "${newValue}" 不存在于租户列表中`)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
/* 可以在这里添加特定的样式 */
</style>
