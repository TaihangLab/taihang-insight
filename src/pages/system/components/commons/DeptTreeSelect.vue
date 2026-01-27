<!--
  DeptTreeSelect - 部门树级联选择器组件

  功能特性：
  - 支持部门树级联选择（多级部门）
  - 自动根据租户ID加载部门数据
  - 支持按状态过滤部门（默认只显示启用部门）
  - 自动转换API数据格式（name -> label）
  - 支持自定义级联选择器配置

  使用示例：
  <DeptTreeSelect
    v-model="formValue.dept_id"
    :tenant-id="formValue.tenant_id"
    :status="0"
    placeholder="选择部门"
    custom-style="width: 200px;"
  />

  API端点：
  GET /api/v1/rbac/depts/tree?status={status}&tenant_id={tenantId}

  注意事项：
  - tenantId 为必填项
  - status: 0=启用, 1=停用，默认为0
  - 返回值为数组，表示选择的部门路径
-->
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
import RBACService from '@/components/service/RBACService'

interface DeptNode {
  id: string | number
  name: string
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
    value: any
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

defineExpose({
  refresh
})

const emit = defineEmits<{
  input: [value: any]
  change: [value: any]
}>()

const treeData = ref<TransformedDeptNode[]>([])
const loading = ref(false)
const loaded = ref(false)

const innerValue = computed({
  get: () => props.value,
  set: (val) => {
    emit('input', val)
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

const fetchDepartmentTree = async () => {
  if (!props.tenantId) {
    treeData.value = []
    return
  }

  loading.value = true
  try {
    const response = await RBACService.getDepartmentTreeByTenantAndStatus(
      props.tenantId,
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

const transformDeptTree = (depts: DeptNode[]): TransformedDeptNode[] => {
  if (!Array.isArray(depts)) return []
  return depts.map((dept) => ({
    id: parseInt(String(dept.id)),
    label: dept.name,
    code: dept.id,
    children: dept.children ? transformDeptTree(dept.children) : []
  }))
}

const handleChange = (value: any) => {
  emit('change', value)
}

const refresh = () => {
  loaded.value = false
  fetchDepartmentTree()
}
</script>

<style scoped>
/* 可根据需要添加样式 */
</style>
