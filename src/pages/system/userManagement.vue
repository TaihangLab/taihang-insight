<template>
  <div class="user-management-container">
    <div class="content-layout">
      <!-- 右侧用户管理区域 -->
      <div class="right-panel">
        <!-- 租户选择器 -->
        <div class="tenant-selector-wrapper">
          <TenantSelector
            ref="tenantSelector"
            v-model="searchForm.tenant_id"
            @change="handleTenantChange"
            :auto-select-first="true"
          />
        </div>

        <!-- 搜索筛选区域 -->
    <UserSearchBar
      v-model="searchForm"
      :department-options="departmentOptions"
      @search="handleSearch"
      @reset="resetSearch"
    />

        <!-- 表格操作区域 -->
        <UserList
          :users="users"
          :loading="loading"
          :pagination="pagination"
          :total="total"
          @selection-change="handleSelectionChange"
          @edit="handleEdit"
          @delete="handleDelete"
          @status-change="handleStatusChange"
          @reset-password="handleResetPassword"
          @add="handleAdd"
          @batch-delete="handleBatchDelete"
          @more-action="handleMoreAction"
          @advanced-search="toggleAdvancedSearch"
          @refresh="refreshData"
          @table-setting="showTableSetting"
          @page-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <!-- 新增/编辑用户对话框 -->
    <UserEditDialog
      :visible.sync="userDialogVisible"
      :current-user="currentUser"
      :department-options="departmentOptions"
      @submit="handleSaveUser"
    />

    <!-- 删除确认对话框 -->
    <DeleteConfirmDialog
      :visible.sync="deleteDialogVisible"
      :target-type="selectedRows.length > 1 ? 'batch' : 'single'"
      @confirm="confirmDelete"
    />

    <!-- 重置密码对话框 -->
    <ResetPasswordDialog
      :visible.sync="resetPasswordDialogVisible"
      :reset-password-user="resetPasswordUser"
      @confirm="handleResetPasswordConfirm"
    />
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue'
import UserSearchBar from './components/user/UserSearchBar.vue'
import UserList from './components/user/UserList.vue'
import UserEditDialog from './components/user/UserEditDialog.vue'
import DeleteConfirmDialog from './components/user/DeleteConfirmDialog.vue'
import ResetPasswordDialog from './components/user/ResetPasswordDialog.vue'
import { useUserData } from './composable/user/useUserData'
import { useUserExport } from './composable/user/useUserExport'
import TenantSelector from '@/components/common/TenantSelector.vue'

export default {
  name: 'UserManagement',

  components: {
      UserSearchBar,
      UserList,
      UserEditDialog,
      DeleteConfirmDialog,
      ResetPasswordDialog,
      TenantSelector
    },

  data() {
    return {

      // 筛选相关
      filterText: '',


      // 搜索表单
      searchForm: {
        user_name: '',
        nick_name: '',
        phone: '',
        status: '',
        dept_id: [],
        position: '',
        gender: '',
        create_time_range: [],
        tenant_id: ''
      },

      // 组织架构树数据（后续需要从API获取）
      treeData: [
        {
          id: 1,
          code: 'ROOT',
          label: 'XXX科技',
          children: [
            {
              id: 2,
              code: 'SZ_HQ',
              label: '深圳总公司',
              children: [
                { id: 3, code: 'DEV', label: '研发部门' },
                { id: 4, code: 'MARKET', label: '市场部门' },
                { id: 5, code: 'TEST', label: '测试部门' },
                { id: 6, code: 'FINANCE', label: '财务部门' },
                { id: 7, code: 'OPS', label: '运维部门' }
              ]
            },
            {
              id: 8,
              code: 'CS_BRANCH',
              label: '长沙分公司',
              children: [
                { id: 9, code: 'CS_MARKET', label: '市场部门' },
                { id: 10, code: 'CS_FINANCE', label: '财务部门' }
              ]
            }
          ]
        }
      ],

      // 级联选择器配置
      cascaderProps: {
        value: 'id',
        label: 'label',
        children: 'children',
        checkStrictly: true,
        // 自定义显示模板，显示部门编码（编码在前，名称在后）
        renderFormat: (labels, selectedOptions) => {
          return selectedOptions.map(option => {
            return `${option.code} - ${option.label}`;
          }).join('/');
        }
      },

      // 对话框状态
      userDialogVisible: false,
      deleteDialogVisible: false,
      resetPasswordDialogVisible: false,
      currentUser: null,
      resetPasswordUser: null,
      selectedRows: [],

      // 分页
      pagination: {
        currentPage: 1,
        pageSize: 10
      },

      // 租户缓存
      cachedTenants: []
    }
  },

  computed: {
    departmentOptions() {
      return this.treeData
    }
  },

  async created() {
    // 加载租户信息，TenantSelector 的 autoSelectFirst 会触发 change 事件
    await this.loadTenantsIfNeeded()
  },

  methods: {
    // 加载租户信息（如果尚未加载）
    async loadTenantsIfNeeded() {
      if (this.cachedTenants && this.cachedTenants.length > 0) {
        return
      }

      const tenantSelector = this.$refs.tenantSelector
      if (tenantSelector && typeof tenantSelector.loadTenantsIfNeeded === 'function') {
        await tenantSelector.loadTenantsIfNeeded()
        this.cachedTenants = [...tenantSelector.tenants]
      }
    },

    // 处理租户变化
    handleTenantChange() {
      this.pagination.currentPage = 1
      this.fetchUsers()
    },



    // 获取用户数据
    async fetchUsers() {
      if (!this.searchForm.tenant_id) {
        this.$message.warning('请先选择租户')
        this.users = []
        this.total = 0
        return
      }

      const skip = (this.pagination.currentPage - 1) * this.pagination.pageSize
      const params = {
        skip: skip,
        limit: this.pagination.pageSize,
        user_name: this.searchForm.user_name || undefined,
        nick_name: this.searchForm.nick_name || undefined,
        phone: this.searchForm.phone || undefined,
        status: this.searchForm.status || undefined,
        dept_id: this.searchForm.dept_id && this.searchForm.dept_id.length > 0
          ? this.searchForm.dept_id[this.searchForm.dept_id.length - 1]
          : undefined,
        position_code: this.searchForm.position || undefined,
        gender: this.searchForm.gender !== '' ? this.searchForm.gender : undefined,
        tenant_id: this.searchForm.tenant_id || undefined
      }

      await this.fetchUsersFromComposable(params)
    },

    // 搜索用户
    handleSearch() {
      this.pagination.currentPage = 1
      this.fetchUsers()
    },

    // 重置搜索
    resetSearch() {
      const currentTenantCode = this.searchForm.tenant_id
      this.searchForm = {
        user_name: '',
        nick_name: '',
        phone: '',
        status: '',
        dept_id: [],
        position: '',
        gender: '',
        create_time_range: [],
        tenant_id: currentTenantCode
      }
      this.pagination.currentPage = 1
      this.fetchUsers()
    },

    // 刷新数据
    refreshData() {
      this.fetchUsers()
    },

    // 切换高级搜索
    toggleAdvancedSearch() {
      this.$message({
        message: '高级搜索功能开发中',
        type: 'info'
      })
    },

    // 显示表格设置
    showTableSetting() {
      this.$message({
        message: '表格设置功能开发中',
        type: 'info'
      })
    },

    // 处理分页
    handlePageChange(page) {
      this.pagination.currentPage = page
      this.fetchUsers()
    },

    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.pagination.currentPage = 1
      this.fetchUsers()
    },

    // 处理选择变化
    handleSelectionChange(selection) {
      this.selectedRows = selection
    },

    // 新增用户
    handleAdd() {
      this.currentUser = null
      this.userDialogVisible = true
    },

    // 编辑用户
    handleEdit(row) {
      this.currentUser = row
      this.userDialogVisible = true
    },

    // 保存用户
    async handleSaveUser(userData) {
      try {
        const data = {
          ...userData,
          tenant_id: this.searchForm.tenant_id || userData.tenant_id,
          dept_id: userData.dept_id && userData.dept_id.length > 0
            ? userData.dept_id[userData.dept_id.length - 1]
            : undefined
        }

        if (this.currentUser) {
          await this.updateUserFromComposable(this.currentUser.id, data)
          this.$message({
            message: '用户信息修改成功',
            type: 'success'
          })
        } else {
          if (!this.searchForm.tenant_id) {
            this.$message.error('请选择租户后再添加用户')
            return
          }
          await this.createUserFromComposable(data)
          this.$message({
            message: '用户添加成功',
            type: 'success'
          })
        }

        this.userDialogVisible = false
        this.fetchUsers()
      } catch (error) {
        this.$message({
          message: `保存用户失败: ${error.message}`,
          type: 'error'
        })
      }
    },

    // 删除用户
    handleDelete(row) {
      this.selectedRows = [row]
      this.deleteDialogVisible = true
    },

    // 批量删除
    handleBatchDelete() {
      if (this.selectedRows.length === 0) {
        this.$message({
          message: '请至少选择一个用户',
          type: 'warning'
        })
        return
      }
      this.deleteDialogVisible = true
    },

    // 确认删除
    async confirmDelete() {
      try {
        const userIds = this.selectedRows.map(row => row.id)
        await this.deleteUsersFromComposable(userIds)
        this.$message({
          message: '删除成功',
          type: 'success'
        })
        this.deleteDialogVisible = false
        this.fetchUsers()
      } catch (error) {
        this.$message({
          message: `删除用户失败: ${error.message}`,
          type: 'error'
        })
      }
    },

    // 状态切换
    async handleStatusChange(row) {
      try {
        await this.updateUserFromComposable(row.id, { status: row.status })
        this.$message({
          message: '用户状态更新成功',
          type: 'success'
        })
      } catch (error) {
        row.status = row.status === 0 ? 1 : 0
        this.$message({
          message: `更新用户状态失败: ${error.message}`,
          type: 'error'
        })
      }
    },

    // 重置密码
    handleResetPassword(row) {
      this.resetPasswordUser = row
      this.resetPasswordDialogVisible = true
    },

    // 确认重置密码
    async handleResetPasswordConfirm(newPassword) {
      try {
        await this.resetUserPasswordFromComposable(this.resetPasswordUser.id, newPassword)
        this.$message({
          message: '密码重置成功',
          type: 'success'
        })
        this.resetPasswordDialogVisible = false
        this.resetPasswordUser = null
      } catch (error) {
        this.$message({
          message: `重置密码失败: ${error.message}`,
          type: 'error'
        })
      }
    },

    // 更多操作
    handleMoreAction(command) {
      switch (command) {
        case 'download_template':
          this.$message({
            message: '下载模板功能开发中',
            type: 'info'
          })
          break
        case 'import_data':
          this.$message({
            message: '导入数据功能开发中',
            type: 'info'
          })
          break
        case 'export_data':
          this.handleExport()
          break
      }
    },

    // 导出数据
    async handleExport() {
      try {
        const searchConditions = {
          user_name: this.searchForm.user_name || undefined,
          nick_name: this.searchForm.nick_name || undefined,
          phone: this.searchForm.phone || undefined,
          status: this.searchForm.status || undefined,
          dept_id: this.searchForm.dept_id && this.searchForm.dept_id.length > 0
            ? this.searchForm.dept_id[this.searchForm.dept_id.length - 1]
            : undefined,
          position_code: this.searchForm.position || undefined,
          gender: this.searchForm.gender !== '' ? this.searchForm.gender : undefined,
          tenant_id: this.searchForm.tenant_id || undefined
        }

        const selectedUsers = this.selectedRows.length > 0 ? this.selectedRows : []
        const result = await this.exportUsersFromComposable(searchConditions, selectedUsers)

        if (result.success) {
          this.$message({
            message: result.message,
            type: 'success'
          })
        }
      } catch (error) {
        this.$message({
          message: `导出数据失败: ${error.message}`,
          type: 'error'
        })
      }
    }
  },

  setup() {
    const { users, total, loading, fetchUsers, createUser, updateUser, deleteUsers, resetUserPassword } = useUserData()
    const { exporting, exportUsers } = useUserExport()

    // 包装 composable 方法以供 methods 使用
    const fetchUsersFromComposable = async (params) => {
      await fetchUsers(params)
    }

    const createUserFromComposable = async (data) => {
      await createUser(data)
    }

    const updateUserFromComposable = async (userId, data) => {
      await updateUser(userId, data)
    }

    const deleteUsersFromComposable = async (userIds) => {
      await deleteUsers(userIds)
    }

    const resetUserPasswordFromComposable = async (userId, newPassword) => {
      await resetUserPassword(userId, newPassword)
    }

    const exportUsersFromComposable = async (searchConditions, selectedUsers) => {
      return await exportUsers(searchConditions, selectedUsers)
    }

    return {
      users,
      total,
      loading,
      exporting,
      fetchUsersFromComposable,
      createUserFromComposable,
      updateUserFromComposable,
      deleteUsersFromComposable,
      resetUserPasswordFromComposable,
      exportUsersFromComposable
    }
  }
}
</script>

<style scoped>
.user-management-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 40px);
}

.content-layout {
  display: flex;
  gap: 20px;
  height: 100%;
}

.right-panel {
  flex: 1;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.tenant-selector-wrapper {
  margin-bottom: 20px;
}
</style>
