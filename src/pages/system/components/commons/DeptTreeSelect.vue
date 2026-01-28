<template>
  <el-cascader
    v-model="innerValue"
    :options="treeData"
    :props="cascaderProps"
    :placeholder="placeholder"
    :clearable="clearable"
    :disabled="disabled"
    :style="customStyle"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import departmentService from '@/api/system/departmentService'
import type { Department } from '@/types/rbac/department'

interface DeptNode {
  id: string | number
  dept_name?: string
  name?: string
  children?: DeptNode[]
}

interface TransformedDeptNode {
  id: number
  label: string
  code: string | number
  children: TransformedDeptNode[]
}

const props = withDefaults(
  defineProps<{
    modelValue?: any
    value?: any  // For backward compatibility with Options API v-model
    tenantId: string | number
    status?: number
    placeholder?: string
    clearable?: boolean
    disabled?: boolean
    customStyle?: string | Record<string, any>
    props?: Record<string, any>
  }>(),
  {
    status: 0,
    placeholder: '选择部门',
    clearable: true,
    disabled: false,
    customStyle: '',
    props: () => ({})
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: any]
  'update:value': [value: any]
  input: [value: any]
  change: [value: any]
}>()

const treeData = ref<TransformedDeptNode[]>([])
const loading = ref(false)
const loaded = ref(false)

// Support both Vue 3 modelValue and legacy value prop
const innerValue = computed({
  get: () => props.modelValue !== undefined ? props.modelValue : props.value,
  set: (val) => {
    // Emit both events for compatibility
    if (props.modelValue !== undefined) {
      emit('update:modelValue', val)
    } else {
      emit('update:value', val)
      emit('input', val)
    }
  }
})

const cascaderProps = computed(() => {
  return {
    value: 'id',
    label: 'label',
    children: 'children',
    checkStrictly: true,
    expandTrigger: 'hover' as const,
    renderFormat: (labels: string[], selectedOptions: any[]) => {
      return selectedOptions
        .map((option) => {
          return `${option.code} - ${option.label}`
        })
        .join('/')
    },
    ...props.props
  }
})

const transformDeptTree = (depts: DeptNode[] | Department[]): TransformedDeptNode[] => {
  if (!Array.isArray(depts)) return []
  return depts.map((dept) => ({
    id: parseInt(String(dept.id)),
    label: dept.dept_name || dept.name || '',
    code: dept.id,
    children: dept.children ? transformDeptTree(dept.children) : []
  }))
}

const fetchDepartmentTree = async () => {
  if (!props.tenantId) {
    treeData.value = []
    return
  }

  loading.value = true
  try {
    const tenantIdNum = typeof props.tenantId === 'number' ? props.tenantId : parseInt(String(props.tenantId))
    const response = await departmentService.getDepartmentTreeByTenantAndStatus(
      tenantIdNum,
      props.status
    )
    treeData.value = transformDeptTree(response.data)
    loaded.value = true
  } catch (error: any) {
    console.error('获取部门树失败:', error)
    ElMessage.error(`获取部门树失败: ${error.message}`)
    treeData.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => props.tenantId,
  (newVal) => {
    if (newVal) {
      fetchDepartmentTree()
    } else {
      treeData.value = []
    }
  },
  { immediate: true }
)

watch(
  () => props.status,
  () => {
    if (props.tenantId) {
      fetchDepartmentTree()
    }
  }
)

const handleChange = (value: any) => {
  emit('change', value)
}

const refresh = () => {
  loaded.value = false
  fetchDepartmentTree()
}

defineExpose({
  refresh
})
</script>

<style scoped>
/* 可根据需要添加样式 */
</style>
