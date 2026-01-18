<template>
  <div class="role-management-container">
    <h2>角色管理</h2>

    <!-- 搜索筛选区域 -->
    <RoleSearchBar
      ref="searchBar"
      v-model="searchForm"
      @search="handleSearch"
      @reset="resetSearch"
      @tenant-change="handleTenantChange"
    />

    <!-- 表格操作区域 -->
    <RoleTableActions
      :selected-count="selectedRows.length"
      @add="handleAdd"
      @batch-delete="handleBatchDelete"
      @refresh="handleRefresh"
    />

    <!-- 角色表格 -->
    <RoleTable
      :data="roles"
      :loading="loading"
      :pagination="pagination"
      :total="total"
      @selection-change="handleSelectionChange"
      @edit="handleEdit"
      @delete="handleDelete"
      @status-change="handleStatusChange"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    />

    <!-- 角色编辑对话框 -->
    <RoleEditDialog
      :visible.sync="roleDialogVisible"
      :current-role="currentRole"
      :tenant-code="searchForm.tenant_id"
      @submit="handleSaveRole"
    />

    <!-- 删除确认对话框 -->
    <DeleteConfirmDialog
      :visible.sync="deleteDialogVisible"
      :target-type="selectedRows.length > 1 ? 'batch' : 'single'"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script>
import RoleTableActions from './components/role/RoleTableActions.vue'
import RoleTable from './components/role/RoleTable.vue'
import RoleSearchBar from './components/role/RoleSearchBar.vue'
import RoleEditDialog from './components/role/RoleEditDialog.vue'
import DeleteConfirmDialog from './components/role/DeleteConfirmDialog.vue'
import { useRoleData } from './composable/role/useRoleData'

export default {
  name: 'RoleManagement',
  components: {
    RoleTableActions,
    RoleTable,
    RoleSearchBar,
    RoleEditDialog,
    DeleteConfirmDialog
  },

  data() {
    return {
      roleDialogVisible: false,
      deleteDialogVisible: false,
      currentRole: null,
      selectedRows: [],
      
      // 搜索表单
      searchForm: {
        tenant_id: '',
        role_code: '',
        role_name: '',
        status: null
      },
      
      // 分页
      pagination: {
        currentPage: 1,
        pageSize: 10
      }
    }
  },

  async created() {
    // 初始加载时不自动获取数据，等待用户选择租户
    // 租户选择器会在挂载时自动加载租户列表
  },

  methods: {
    // 刷新数据
    async handleRefresh() {
      await this.fetchRoles()
      this.$message.success('刷新成功')
    },

    // 处理选择变化
    handleSelectionChange(selection) {
      this.selectedRows = selection
    },

    // 新增角色
    handleAdd() {
      this.currentRole = null
      this.roleDialogVisible = true
    },

    // 编辑角色
    handleEdit(row) {
      this.currentRole = row
      this.roleDialogVisible = true
    },

    // 保存角色
    async handleSaveRole(roleData) {
      try {
        const data = {
          ...roleData,
          tenant_id: this.searchForm.tenant_id || roleData.tenant_id
        }
        
        if (this.currentRole) {
          await this.updateRole(this.currentRole.id, data)
          this.$message.success('角色更新成功')
        } else {
          await this.createRole(data)
          this.$message.success('角色创建成功')
        }
        this.roleDialogVisible = false
        await this.fetchRoles()
      } catch (error) {
        this.$message.error(`保存角色失败: ${error.message}`)
      }
    },

    // 删除角色
    handleDelete(row) {
      this.selectedRows = [row]
      this.deleteDialogVisible = true
    },

    // 批量删除
    handleBatchDelete() {
      if (this.selectedRows.length === 0) {
        this.$message({
          message: '请至少选择一个角色',
          type: 'warning'
        })
        return
      }
      this.deleteDialogVisible = true
    },

    // 确认删除
    async confirmDelete() {
      try {
        const roleIds = this.selectedRows.map(row => row.id)
        await this.deleteRoles(roleIds)
        this.$message.success('删除成功')
        this.deleteDialogVisible = false
        await this.fetchRoles()
      } catch (error) {
        this.$message.error(`删除角色失败: ${error.message}`)
      }
    },

    // 状态切换
    async handleStatusChange(row) {
      try {
        await this.updateRole(row.id, { status: row.status })
        this.$message.success('状态更新成功')
      } catch (error) {
        row.status = row.status === 0 ? 1 : 0
        this.$message.error(`更新状态失败: ${error.message}`)
      }
    },
    
    // 处理租户变化
    handleTenantChange() {
      this.pagination.currentPage = 1
      this.fetchRoles()
    },
    
    // 搜索角色
    handleSearch() {
      this.pagination.currentPage = 1
      this.fetchRoles()
    },
    
    // 重置搜索
    resetSearch() {
      const currentTenantCode = this.searchForm.tenant_id
      this.searchForm = {
        tenant_id: currentTenantCode,
        role_code: '',
        role_name: '',
        status: null
      }
      this.pagination.currentPage = 1
      this.fetchRoles()
    },
    
    // 分页变化
    handlePageChange(page) {
      this.pagination.currentPage = page
      this.fetchRoles()
    },
    
    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.pagination.currentPage = 1
      this.fetchRoles()
    },
    
    // 获取角色数据
    async fetchRoles() {
      if (!this.searchForm.tenant_id) {
        this.$message.warning('请先选择租户');
        this.roles = []
        this.total = 0
        return
      }

      const skip = (this.pagination.currentPage - 1) * this.pagination.pageSize
      const params = {
        skip: skip,
        limit: this.pagination.pageSize,
        role_code: this.searchForm.role_code || undefined,
        role_name: this.searchForm.role_name || undefined,
        status: this.searchForm.status || undefined,
        tenant_id: this.searchForm.tenant_id || undefined
      }

      await this.loadRoles(params)
    }
  },

  setup() {
    const { roles, total, loading, fetchRoles, createRole, updateRole, deleteRoles } = useRoleData()

    return {
      roles,
      total,
      loading,
      loadRoles: fetchRoles,
      createRole,
      updateRole,
      deleteRoles
    }
  }
}
</script>

<style scoped>
.role-management-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100%;
}

.role-management-container h2 {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}
</style>
