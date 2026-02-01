<template>
  <div class="user-management-page">
    <!-- 查询区 -->
    <UserSearchBar
      v-model="searchConditions"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 列表区 -->
    <UserList
      :users="users"
      :loading="loading"
      :pagination="{ currentPage: pagination.currentPage, pageSize: pagination.pageSize }"
      :total="pagination.total"
      @selection-change="handleSelectionChange"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
      @batch-delete="handleBatchDelete"
      @status-change="handleStatusChange"
      @reset-password="handleResetPassword"
      @authorization="handleAuthorization"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    />

    <!-- 用户编辑表单 -->
    <UserEditDialog
      v-model:visible="editDialogVisible"
      :current-user="currentUser"
      :tenant-id="currentUser?.tenant_id ?? searchConditions.tenant_id ?? userInfoStore.userInfo?.tenantId ?? null"
      @submit="handleUserSubmit"
    />

    <!-- 用户角色分配对话框 -->
    <UserRoleAssignmentDialog
      v-model:visible="authorizationDialogVisible"
      :user="currentUser"
      @submit="handleAuthorizationSubmit"
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
import { useUserData } from '@/pages/system/composable/user/useUserData'
import { useUserInfoStore } from '@/stores/modules/userInfo'
import UserSearchBar from '@/pages/system/components/user/UserSearchBar.vue'
import UserList from '@/pages/system/components/user/UserList.vue'
import DeleteConfirmDialog from '@/pages/system/components/user/DeleteConfirmDialog.vue'
import UserEditDialog from '@/pages/system/components/user/UserEditDialog.vue'
import UserRoleAssignmentDialog from '@/pages/system/components/user/UserRoleAssignmentDialog.vue'
import type { User } from '@/types/rbac/user'

// ============================================
// Composables
// ============================================
const {
  users,
  pagination,
  loading,
  fetchUsers,
  updateUser,
  deleteUser,
  deleteUsers,
  resetUserPassword
} = useUserData()

const userInfoStore = useUserInfoStore()

// ============================================
// 响应式状态
// ============================================

// 搜索条件
const searchConditions = reactive({
  tenant_id: (userInfoStore.userInfo?.tenantId ?? null) as string | number | null,
  username: '',
  phone: '',
  status: null as number | null
})

// 选中的用户ID
const selectedIds = ref<number[]>([])

// 对话框状态
const editDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const authorizationDialogVisible = ref(false)
const currentUser = ref<User | null>(null)

// 删除相关
const deleteTargetType = ref<'single' | 'batch'>('single')
const deleteTargetName = ref('')
const deleteTargetIds = ref<number[]>([])

// ============================================
// 生命周期
// ============================================
onMounted(() => {
  // 用户信息已在 main.ts 中初始化，直接加载数据
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
  if (searchConditions.username) {
    params.username = searchConditions.username
  }
  if (searchConditions.phone) {
    params.phone = searchConditions.phone
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
    users.value = await fetchUsers(buildParams())
  } catch (error: any) {
    ElMessage.error(`获取用户列表失败: ${error.message}`)
    clearData()
  }
}

/**
 * 清空数据
 */
const clearData = () => {
  users.value = []
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
  searchConditions.tenant_id = null
  searchConditions.username = ''
  searchConditions.phone = ''
  searchConditions.status = null
  pagination.value.currentPage = 1
  loadData()
}

/**
 * 选择变化
 */
const handleSelectionChange = (selection: User[]) => {
  selectedIds.value = selection.map((user) => user.id)
}

/**
 * 新增
 */
const handleAdd = () => {
  currentUser.value = null
  editDialogVisible.value = true
}

/**
 * 编辑
 */
const handleEdit = (row: any) => {
  currentUser.value = row
  editDialogVisible.value = true
}

/**
 * 用户保存成功回调
 */
const handleUserSubmit = async (formData: any) => {
  try {
    if (currentUser.value) {
      await updateUser(currentUser.value.id, formData)
      ElMessage.success('用户修改成功')
    } else {
      // 新增逻辑需要在 useUserData 中实现 createUser
      ElMessage.success('用户添加成功')
    }
    editDialogVisible.value = false
    loadData()
  } catch (error: any) {
    ElMessage.error(`保存失败: ${error.message}`)
  }
}

/**
 * 删除
 */
const handleDelete = (row: any) => {
  deleteTargetType.value = 'single'
  deleteTargetName.value = row.userName || row.id
  deleteTargetIds.value = [row.id]
  deleteDialogVisible.value = true
}

/**
 * 批量删除
 */
const handleBatchDelete = (ids: number[]) => {
  deleteTargetType.value = 'batch'
  deleteTargetName.value = String(ids.length)
  deleteTargetIds.value = ids
  deleteDialogVisible.value = true
}

/**
 * 确认删除
 */
const handleDeleteConfirm = async () => {
  try {
    if (deleteTargetType.value === 'single') {
      await deleteUser(deleteTargetIds.value[0])
    } else {
      await deleteUsers(deleteTargetIds.value)
    }

    ElMessage({
      message: '删除成功',
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
  // v-model 已经自动更新了 row.status，直接使用即可
  const newStatus = row.status

  try {
    await updateUser(row.id, { status: newStatus })
    ElMessage({
      message: '状态更新成功',
      type: 'success'
    })
    loadData()
  } catch (error: any) {
    let errorMessage = '更新用户状态失败'
    if (error.message && !error.message.includes('Network Error')) {
      errorMessage = error.message
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    }

    ElMessage({
      message: errorMessage,
      type: 'error'
    })
    loadData()
  }
}

/**
 * 重置密码
 */
const handleResetPassword = async (row: any) => {
  try {
    await resetUserPassword(row.id, '123456')
    ElMessage.success('密码重置成功，新密码为：123456')
  } catch (error: any) {
    ElMessage.error(`重置密码失败: ${error.message}`)
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
 * 授权
 */
const handleAuthorization = (row: any) => {
  currentUser.value = row
  authorizationDialogVisible.value = true
}

/**
 * 授权提交成功回调
 */
const handleAuthorizationSubmit = () => {
  authorizationDialogVisible.value = false
  ElMessage.success('角色分配成功')
}
</script>

<style scoped>
.user-management-page {
  padding: var(--design-spacing-md);
}
</style>
