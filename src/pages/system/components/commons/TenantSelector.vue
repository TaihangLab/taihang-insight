<template>
  <el-select
    :value="value"
    :placeholder="placeholder"
    :clearable="clearable"
    :style="customStyle"
    @change="handleChange"
    @focus="loadTenantsIfNeeded">
    <el-option
      v-for="tenant in tenants"
      :key="getTenantValue(tenant)"
      :label="tenant.tenant_name"
      :value="getTenantValue(tenant)">
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import RBACService from '@/components/service/RBACService'

interface Tenant {
  id?: string | number
  tenant_code?: string
  tenant_name: string
}

const props = withDefaults(
  defineProps<{
    value: string | number | null
    placeholder?: string
    clearable?: boolean
    customStyle?: Record<string, any>
    autoSelectFirst?: boolean
  }>(),
  {
    value: null,
    placeholder: '请选择租户',
    clearable: true,
    customStyle: () => ({ width: '200px' }),
    autoSelectFirst: true
  }
)

const emit = defineEmits<{
  input: [value: string | number]
  change: [value: string | number]
}>()

const tenants = ref<Tenant[]>([])
const loaded = ref(false)

onMounted(async () => {
  await loadTenantsIfNeeded()
})

const loadTenants = async () => {
  if (loaded.value) return

  try {
    const response = await RBACService.getTenants()
    if (response && response.data && Array.isArray(response.data.items)) {
      tenants.value = response.data.items
      loaded.value = true

      if (props.autoSelectFirst && (props.value === null || props.value === undefined || props.value === '') && tenants.value.length > 0) {
        const firstTenantCode = getTenantValue(tenants.value[0])
        emit('input', firstTenantCode)
        emit('change', firstTenantCode)
      } else if (props.autoSelectFirst && (props.value === null || props.value === undefined || props.value === '') && tenants.value.length === 0) {
        console.warn('没有可用的租户，请先创建租户')
        ElMessage({
          message: '没有可用的租户，请先创建租户',
          type: 'warning'
        })
      }
    }
  } catch (error: any) {
    console.error('获取租户列表失败:', error)
    ElMessage({
      message: error.message || '获取租户列表失败',
      type: 'error'
    })
  }
}

const loadTenantsIfNeeded = async () => {
  if (!loaded.value) {
    await loadTenants()
  }
}

const handleChange = (value: string | number) => {
  emit('input', value)
  emit('change', value)
}

const getTenantValue = (tenant: Tenant) => {
  return tenant.id !== undefined ? tenant.id : (tenant.tenant_code || '')
}

watch(
  () => props.value,
  (newValue) => {
    if (loaded.value && newValue && !tenants.value.some((t) => getTenantValue(t) === newValue)) {
      console.warn(`租户代码 "${newValue}" 不存在于租户列表中`)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
/* 可以在这里添加特定的样式 */
</style>
