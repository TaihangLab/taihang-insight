<template>
  <div class="tenant-management-page">
    <!-- 查询区 -->
    <TenantSearchBar
      v-model="searchConditions"
      @search="handleSearch"
      @reset="handleReset"
    />
    <!-- 列表区 -->
    <TenantList
      :tenants="tenants"
      :loading="loading"
      :pagination="{ currentPage: pagination.currentPage, pageSize: pagination.pageSize }"
      :total="pagination.total"
      @selection-change="handleSelectionChange"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
      @batch-delete="handleBatchDelete"
      @status-change="handleStatusChange"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
      @export="handleExport"
    />

    <!-- 租户编辑表单 -->
    <TenantEditForm
      v-model:visible="editDialogVisible"
      :current-tenant="currentTenant"
      @saved="handleTenantSaved"
    />

    <!-- 删除确认对话框 -->
    <DeleteConfirmDialog
      v-model:visible="deleteDialogVisible"
      :target-name="deleteTargetName"
      :target-type="deleteTargetType"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useTenantData } from './composable/tenant/useTenantData.js'
import { useTenantExport } from './composable/tenant/useTenantExport.js'
import TenantSearchBar from './components/tenant/TenantSearchBar.vue'
import TenantList from './components/tenant/TenantList.vue'
import DeleteConfirmDialog from './components/tenant/DeleteConfirmDialog.vue'
import TenantEditForm from './components/tenant/tenantEditForm.vue'

// ============================================
// Composables
// ============================================
const {
  tenants,
  pagination,
  loading,
  fetchTenants,
  updateTenant,
  deleteTenant,
  batchDeleteTenants
} = useTenantData()

const { exportTenants } = useTenantExport()

// ============================================
// 响应式状态
// ============================================

// 搜索条件
const searchConditions = reactive({
  tenant_id: '',
  tenant_name: '',
  company_name: '',
  status: null as number | null
})

// 选中的租户编码
const selectedCodes = ref<number[]>([])

// 对话框状态
const editDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const currentTenant = ref<any>(null)

// 删除相关
const deleteTargetType = ref<'single' | 'batch'>('single')
const deleteTargetName = ref('')
const deleteTargetCodes = ref<number[]>([])

// ============================================
// 生命周期
// ============================================
onMounted(() => {
  loadData()
})

// ============================================
// 方法
// ============================================

/**
 * 计算当前页的 skip 值
 */
const getSkip = (): number => {
  return (pagination.value.currentPage - 1) * pagination.value.pageSize
}

/**
 * 构建查询参数
 */
const buildParams = () => {
  const params: Record<string, any> = {
    skip: getSkip(),
    limit: pagination.value.pageSize
  }

  if (searchConditions.tenant_id) {
    params.tenant_id = searchConditions.tenant_id
  }
  if (searchConditions.tenant_name) {
    params.tenant_name = searchConditions.tenant_name
  }
  if (searchConditions.company_name) {
    params.company_name = searchConditions.company_name
  }
  if (searchConditions.status !== null) {
    params.status = searchConditions.status
  }

  return params
}

/**
 * 加载数据
 */
const loadData = async () => {
  try {
    await fetchTenants(
      buildParams(),
      pagination.value.currentPage,
      pagination.value.pageSize
    )
  } catch (error: any) {
    ElMessage.error(`获取租户列表失败: ${error.message}`)
    clearData()
  }
}

/**
 * 清空数据
 */
const clearData = () => {
  tenants.value = []
}

/**
 * 搜索
 */
const handleSearch = (conditions: any) => {
  Object.assign(searchConditions, conditions)
  pagination.value.currentPage = 1
  loadData()
}

/**
 * 重置
 */
const handleReset = () => {
  searchConditions.tenant_id = ''
  searchConditions.tenant_name = ''
  searchConditions.company_name = ''
  searchConditions.status = null
  pagination.value.currentPage = 1
  loadData()
}

/**
 * 选择变化
 */
const handleSelectionChange = (codes: number[]) => {
  selectedCodes.value = codes
}

/**
 * 新增
 */
const handleAdd = () => {
  currentTenant.value = null
  editDialogVisible.value = true
}

/**
 * 编辑
 */
const handleEdit = (row: any) => {
  currentTenant.value = row
  editDialogVisible.value = true
}

/**
 * 租户保存成功回调
 */
const handleTenantSaved = () => {
  loadData()
}

/**
 * 删除
 */
const handleDelete = (row: any) => {
  deleteTargetType.value = 'single'
  deleteTargetName.value = row.tenant_name || row.id
  deleteTargetCodes.value = [row.id]
  deleteDialogVisible.value = true
}

/**
 * 批量删除
 */
const handleBatchDelete = (codes: number[]) => {
  deleteTargetType.value = 'batch'
  deleteTargetName.value = String(codes.length)
  deleteTargetCodes.value = codes
  deleteDialogVisible.value = true
}

/**
 * 确认删除
 */
const handleDeleteConfirm = async () => {
  try {
    let result: any
    if (deleteTargetType.value === 'single') {
      result = await deleteTenant(deleteTargetCodes.value[0])
    } else {
      result = await batchDeleteTenants(deleteTargetCodes.value)
    }

    ElMessage({
      message: result.message,
      type: 'success'
    })
    loadData()
  } catch (error: any) {
    ElMessage({
      message: `删除失败: ${error.message || '未知错误'}`,
      type: 'error'
    })
  }
}

/**
 * 状态切换
 */
const handleStatusChange = async (row: any) => {
  // 先备份原始状态
  const originalStatus = row.status
  // 立即更新本地状态，提供即时反馈
  const newStatus = row.status === 0 ? 1 : 0
  row.status = newStatus

  try {
    await updateTenant(row.id, { status: newStatus })
    ElMessage({
      message: '状态更新成功',
      type: 'success'
    })
    // 成功更新后刷新数据以显示最新状态
    loadData()
  } catch (error: any) {
    // 如果更新失败，恢复原始状态
    row.status = originalStatus

    // 提取错误消息，优先使用后端返回的具体错误信息
    let errorMessage = '更新租户状态失败'
    if (error.message && !error.message.includes('Network Error')) {
      errorMessage = error.message
    } else if (error.response?.data) {
      const data = error.response.data
      if (typeof data === 'object') {
        if (data.message) {
          errorMessage = data.message
        } else if (data.detail) {
          errorMessage = data.detail
        } else if (data.msg) {
          errorMessage = data.msg
        }
      } else if (typeof data === 'string') {
        errorMessage = data
      }
    } else if (error.message) {
      errorMessage = error.message
    }

    ElMessage({
      message: errorMessage,
      type: 'error'
    })
    // 恢复原状态
    loadData()
  }
}

/**
 * 页码变化
 */
const handlePageChange = (page: number) => {
  pagination.value.currentPage = page
  loadData()
}

/**
 * 每页数量变化
 */
const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.currentPage = 1
  loadData()
}

/**
 * 导出
 */
const handleExport = async () => {
  const result = await exportTenants({
    selectedCodes: selectedCodes.value,
    searchConditions
  })

  if (result.success) {
    ElMessage({
      message: result.message,
      type: 'success'
    })
  } else {
    ElMessage({
      message: result.message,
      type: 'error'
    })
  }
}
</script>

<style scoped>

</style>
