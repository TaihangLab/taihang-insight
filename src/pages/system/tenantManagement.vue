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
      :pagination="pagination"
      :total="total"
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
      :visible.sync="editDialogVisible"
      :current-tenant="currentTenant"
      @saved="handleTenantSaved"
    />

    <!-- 删除确认对话框 -->
    <DeleteConfirmDialog
      :visible.sync="deleteDialogVisible"
      :target-name="deleteTargetName"
      :target-type="deleteTargetType"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<script>
import { useTenantData } from './composable/tenant/useTenantData'
import { useTenantExport } from './composable/tenant/useTenantExport'
import TenantSearchBar from './components/tenant/TenantSearchBar.vue'
import TenantList from './components/tenant/TenantList.vue'
import DeleteConfirmDialog from './components/tenant/DeleteConfirmDialog.vue'
import TenantEditForm from './components/tenant/tenantEditForm.vue'

export default {
  name: 'TenantManagement',
  components: {
    TenantSearchBar,
    TenantList,
    DeleteConfirmDialog,
    TenantEditForm
  },
  setup() {
    // 使用 composables
    const {
      tenants,
      total,
      loading,
      fetchTenants,
      toggleTenantStatus,
      deleteTenant,
      batchDeleteTenants
    } = useTenantData()

    const { exportTenants } = useTenantExport()

    return {
      tenants,
      total,
      loading,
      fetchTenants,
      toggleTenantStatus,
      deleteTenant,
      batchDeleteTenants,
      exportTenants
    }
  },
  data() {
    return {
      // 搜索条件
      searchConditions: {
        tenant_id: '',
        tenant_name: '',
        company_name: '',
        status: null
      },

      // 分页
      pagination: {
        currentPage: 1,
        pageSize: 10
      },

      // 选中的租户编码
      selectedCodes: [],

      // 对话框状态
      editDialogVisible: false,
      deleteDialogVisible: false,
      currentTenant: null,

      // 删除相关
      deleteTargetType: 'single', // 'single' | 'batch'
      deleteTargetName: '',
      deleteTargetCodes: []
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    /**
     * 计算当前页的 skip 值
     */
    getSkip() {
      return (this.pagination.currentPage - 1) * this.pagination.pageSize
    },

    /**
     * 构建查询参数
     */
    buildParams() {
      const params = {
        skip: this.getSkip(),
        limit: this.pagination.pageSize
      }

      if (this.searchConditions.tenant_id) {
        params.tenant_id = this.searchConditions.tenant_id
      }
      if (this.searchConditions.tenant_name) {
        params.tenant_name = this.searchConditions.tenant_name
      }
      if (this.searchConditions.company_name) {
        params.company_name = this.searchConditions.company_name
      }
      if (this.searchConditions.status !== null && this.searchConditions.status !== '') {
        params.status = this.searchConditions.status
      }

      return params
    },

    /**
     * 加载数据
     */
    async loadData() {
      try {
        await this.fetchTenants(this.buildParams())
      } catch (error) {
        this.$message.error(`获取租户列表失败: ${error.message}`)
        this.clearData()
      }
    },

    /**
     * 清空数据
     */
    clearData() {
      // 通过直接修改内部状态来清空
      this.tenants.splice(0, this.tenants.length)
      this.total = 0
    },

    /**
     * 搜索
     */
    handleSearch(conditions) {
      this.searchConditions = { ...conditions }
      this.pagination.currentPage = 1
      this.loadData()
    },

    /**
     * 重置
     */
    handleReset() {
      this.searchConditions = {
        tenant_id: '',
        tenant_name: '',
        company_name: '',
        status: null
      }
      this.pagination.currentPage = 1
      this.loadData()
    },

    /**
     * 选择变化
     */
    handleSelectionChange(codes) {
      this.selectedCodes = codes
    },

    /**
     * 新增
     */
    handleAdd() {
      this.currentTenant = null
      this.editDialogVisible = true
    },

    /**
     * 编辑
     */
    handleEdit(row) {
      this.currentTenant = row
      this.editDialogVisible = true
    },

    /**
     * 租户保存成功回调
     */
    handleTenantSaved() {
      this.loadData()
    },


    /**
     * 删除
     */
    handleDelete(row) {
      this.deleteTargetType = 'single'
      this.deleteTargetName = row.tenant_name || row.id
      this.deleteTargetCodes = [row.id]
      this.deleteDialogVisible = true
    },


    /**
     * 批量删除
     */
    handleBatchDelete(codes) {
      this.deleteTargetType = 'batch'
      this.deleteTargetName = String(codes.length)
      this.deleteTargetCodes = codes
      this.deleteDialogVisible = true
    },

    /**
     * 确认删除
     */
    async handleDeleteConfirm() {
      try {
        let result
        if (this.deleteTargetType === 'single') {
          result = await this.deleteTenant(this.deleteTargetCodes[0])
        } else {
          result = await this.batchDeleteTenants(this.deleteTargetCodes)
        }

        this.$message({
          message: result.message,
          type: 'success'
        })
        this.loadData()
      } catch (error) {
        this.$message({
          message: `删除失败: ${error.message || '未知错误'}`,
          type: 'error'
        })
      }
    },

    /**
     * 状态切换
     */
    async handleStatusChange(row) {
      // 先备份原始状态
      const originalStatus = row.status;
      // 立即更新本地状态，提供即时反馈
      row.status = row.status === 0 ? 1 : 0;

      try {
        const result = await this.toggleTenantStatus(row)
        this.$message({
          message: result.message,
          type: 'success'
        })
        // 成功更新后刷新数据以显示最新状态
        this.loadData()
      } catch (error) {
        // 如果更新失败，恢复原始状态
        row.status = originalStatus;
        
        // 提取错误消息，优先使用后端返回的具体错误信息
        let errorMessage = '更新租户状态失败';
        if (error.message && !error.message.includes('Network Error')) {
          // 如果错误消息不是网络错误，使用错误消息
          errorMessage = error.message;
        } else if (error.response && error.response.data) {
          // 尝试从响应数据中提取消息
          const data = error.response.data;
          if (data && typeof data === 'object') {
            if (data.message) {
              errorMessage = data.message;
            } else if (data.detail) {
              errorMessage = data.detail;
            } else if (data.msg) {
              errorMessage = data.msg;
            }
          } else if (typeof data === 'string') {
            errorMessage = data;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.$message({
          message: errorMessage,
          type: 'error'
        })
        // 恢复原状态
        this.loadData()
      }
    },

    /**
     * 页码变化
     */
    handlePageChange(page) {
      this.pagination.currentPage = page
      this.loadData()
    },

    /**
     * 每页数量变化
     */
    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.pagination.currentPage = 1
      this.loadData()
    },

    /**
     * 导出
     */
    async handleExport(selectedCodes) {
      const result = await this.exportTenants({
        selectedCodes,
        searchConditions: this.searchConditions
      })

      if (result.success) {
        this.$message({
          message: result.message,
          type: 'success'
        })
      } else {
        this.$message({
          message: result.message,
          type: 'error'
        })
      }
    }
  }
}
</script>

<style scoped>
.tenant-management-page {
  padding: 20px;
  background: linear-gradient(to bottom, #fafafa 0%, #f5f5f5 100%);
  min-height: calc(100vh - 100px);
}
</style>
