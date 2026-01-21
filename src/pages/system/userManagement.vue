<template>
  <div class="user-management-container">
    <div class="content-layout">
      <!-- 右侧用户管理区域 -->
      <div class="right-panel">
        <!-- 搜索筛选区域 -->
        <UserSearchBar v-model="searchForm" @search="handleSearch"
          @reset="resetSearch" @tenant-change="handleTenantChange" />

        <!-- 表格操作区域 -->
        <UserList :users="users" :loading="loading" :pagination="pagination" :total="total"
          @selection-change="handleSelectionChange" @edit="handleEdit" @delete="handleDelete"
          @status-change="handleStatusChange" @reset-password="handleResetPassword" @add="handleAdd"
          @batch-delete="handleBatchDelete" @more-action="handleMoreAction" @advanced-search="toggleAdvancedSearch"
          @refresh="refreshData" @table-setting="showTableSetting" @page-change="handlePageChange"
          @size-change="handleSizeChange" @authorization="handleAuthorization" />
      </div>
    </div>

    <!-- 新增/编辑用户对话框 -->
    <UserEditDialog :visible.sync="userDialogVisible" :current-user="currentUser"
      :tenant-id="searchForm.tenant_id" @submit="handleSaveUser" />

    <!-- 删除确认对话框 -->
    <DeleteConfirmDialog :visible.sync="deleteDialogVisible" :target-type="selectedRows.length > 1 ? 'batch' : 'single'"
      @confirm="confirmDelete" />

    <!-- 重置密码对话框 -->
    <ResetPasswordDialog :visible.sync="resetPasswordDialogVisible" :reset-password-user="resetPasswordUser"
      @confirm="handleResetPasswordConfirm" />
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue'
import UserSearchBar from './components/user/UserSearchBar.vue'
import UserList from './components/user/UserList.vue'
import UserEditDialog from './components/user/UserEditDialog.vue'
import DeleteConfirmDialog from './components/user/DeleteConfirmDialog.vue'
import ResetPasswordDialog from './components/user/ResetPasswordDialog.vue'
import { useUserData } from './composable/user/useUserData.js'
import { useUserExport } from './composable/user/useUserExport.js'

export default {
  name: 'UserManagement',

  components: {
    UserSearchBar,
    UserList,
    UserEditDialog,
    DeleteConfirmDialog,
    ResetPasswordDialog
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
        gender: '',
        create_time_range: [],
        tenant_id: null
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
      }
    }
  },

  async created() {
    // TenantSelector 组件内部会自动加载租户并触发 change 事件
  },

  methods: {
    // 处理租户变化
    async handleTenantChange() {
      this.pagination.currentPage = 1
      this.fetchUsers();
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
        gender: this.searchForm.gender !== '' ? this.searchForm.gender : undefined,
        tenant_id: this.searchForm.tenant_id != null ? this.searchForm.tenant_id : undefined
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
        gender: '',
        create_time_range: [],
        tenant_id: currentTenantCode || null
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
          tenant_id: this.searchForm.tenant_id != null ? this.searchForm.tenant_id : userData.tenant_id,
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
    async handleStatusChange(row, callback) {
      try {
        await this.updateUserFromComposable(row.id, { status: row.status });
        this.$message({
          message: '用户状态更新成功',
          type: 'success'
        });
        // 调用回调函数，通知更新成功
        if (callback) callback(true);
      } catch (error) {
        this.$message({
          message: `更新用户状态失败: ${error.message}`,
          type: 'error'
        });
        // 调用回调函数，通知更新失败
        if (callback) callback(false);
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
          gender: this.searchForm.gender !== '' ? this.searchForm.gender : undefined,
          tenant_id: this.searchForm.tenant_id != null ? this.searchForm.tenant_id : undefined
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
    },

    // 处理用户授权
    handleAuthorization(row) {
      // 跳转到角色分配页面，传递用户信息
      this.$router.push({
        name: 'RoleAssignment',
        params: {
          user_code: row.user_name,
          user_name: row.nick_name || row.user_name
        }
      })
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
