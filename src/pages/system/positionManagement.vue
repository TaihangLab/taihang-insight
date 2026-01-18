<template>
  <div class="position-management-container">
    <div class="content-layout">
      <!-- 右侧岗位管理区域 -->
      <div class="right-panel-full">
        <!-- 搜索和筛选区域 -->
        <PositionSearchBar v-model="searchForm" @search="handleSearch"
          @reset="resetSearch" @tenant-change="handleTenantChange" />

        <!-- 岗位列表表格 -->
        <PositionList
          :data="positions"
          :loading="loading"
          :pagination="pagination"
          :total="total"
          @selection-change="handleSelectionChange"
          @edit="handleEdit"
          @delete="handleDelete"
          @add="handleAdd"
          @batch-delete="handleBatchDelete"
          @export="handleExport"
          @page-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <!-- 新增/编辑岗位对话框 -->
    <PositionEditDialog
      :visible.sync="positionDialogVisible"
      :current-position="currentPosition"
      :tenant-id="searchForm.tenant_id"
      @submit="handleSavePosition"
    />

    <!-- 删除确认对话框 -->
    <DeleteConfirmDialog
      :visible.sync="deleteDialogVisible"
      :target-type="selectedRows.length > 1 ? 'batch' : 'single'"
      @confirm="confirmDelete"
    />

    <!-- 导出对话框 -->
    <ExportDialog
      :visible.sync="exportDialogVisible"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<script>
import TenantSelector from './components/commons/TenantSelector.vue'
import PositionList from './components/position/PositionList.vue'
import PositionEditDialog from './components/position/PositionEditDialog.vue'
import DeleteConfirmDialog from './components/position/DeleteConfirmDialog.vue'
import ExportDialog from './components/position/ExportDialog.vue'
import PositionSearchBar from './components/position/PositionSearchBar.vue'
import { usePositionData } from './composable/position/usePositionData'
import { usePositionExport } from './composable/position/usePositionExport'

export default {
  name: 'PositionManagement',

  components: {
    TenantSelector,
    PositionList,
    PositionEditDialog,
    DeleteConfirmDialog,
    ExportDialog,
    PositionSearchBar
  },

  data() {
    return {
      // 无需额外数据

      // 搜索表单
      searchForm: {
        position_code: '',
        position_name: '',
        category_code: '',
        status: '',
        tenant_id: ''
      },

      // 对话框控制
      positionDialogVisible: false,
      deleteDialogVisible: false,
      exportDialogVisible: false,
      currentPosition: null,
      selectedRows: [],

      // 分页
      pagination: {
        currentPage: 1,
        pageSize: 10
      }
    }
  },

  created() {
    // TenantSelector 的 autoSelectFirst 会触发 change 事件
    // 由 handleTenantChange 来调用 fetchPositions()
  },

  methods: {
    // 处理租户变化
    handleTenantChange() {
      this.pagination.currentPage = 1
      this.fetchPositionsData()
    },

    // 搜索岗位
    async fetchPositionsData() {
      const skip = (this.pagination.currentPage - 1) * this.pagination.pageSize
      const params = {
        skip: skip,
        limit: this.pagination.pageSize,
        position_code: this.searchForm.position_code || undefined,
        position_name: this.searchForm.position_name || undefined,
        category_code: this.searchForm.category_code || undefined,
        status: this.searchForm.status || undefined,
        tenant_id: this.searchForm.tenant_id || undefined
      }

      await this.fetchPositions(params)
    },

    // 搜索
    handleSearch() {
      this.pagination.currentPage = 1
      this.fetchPositionsData()
    },

    // 重置搜索
    resetSearch() {
      const currentTenantCode = this.searchForm.tenant_id
      this.searchForm = {
        position_code: '',
        position_name: '',
        category_code: '',
        status: '',
        tenant_id: currentTenantCode
      }
      this.pagination.currentPage = 1
      this.fetchPositionsData()
    },

    // 处理选择变化
    handleSelectionChange(selection) {
      this.selectedRows = selection
    },

    // 新增岗位
    handleAdd() {
      this.currentPosition = null
      this.positionDialogVisible = true
    },

    // 编辑岗位
    handleEdit(row) {
      this.currentPosition = row
      this.positionDialogVisible = true
    },

    // 保存岗位
    async handleSavePosition(positionData) {
      try {
        if (this.currentPosition) {
          // 编辑岗位 - 使用 id 进行更新
          const updateData = { ...positionData }
          delete updateData.id  // 不允许修改 id
          await this.updatePosition(this.currentPosition.id, updateData)
          this.$message.success('岗位信息更新成功')
        } else {
          // 新增岗位 - 确保包含租户ID
          const createData = {
            ...positionData,
            tenant_id: this.searchForm.tenant_id  // 自动添加当前页面的租户ID
          }
          await this.createPosition(createData)
          this.$message.success('岗位添加成功')
        }
        this.positionDialogVisible = false
        this.fetchPositionsData()
      } catch (error) {
        this.$message.error(`保存失败: ${error.message || '未知错误'}`)
      }
    },

    // 删除岗位
    handleDelete(row) {
      this.selectedRows = [row]
      this.deleteDialogVisible = true
    },

    // 批量删除
    handleBatchDelete() {
      if (this.selectedRows.length === 0) {
        this.$message({
          message: '请至少选择一个岗位',
          type: 'warning'
        })
        return
      }
      this.deleteDialogVisible = true
    },

    // 确认删除
    async confirmDelete() {
      try {
        if (this.selectedRows.length === 1) {
          await this.deletePosition(this.selectedRows[0].id)
          this.$message.success('岗位删除成功')
        } else {
          await this.deletePositions(this.selectedRows)
          this.$message.success(`成功删除 ${this.selectedRows.length} 个岗位`)
        }
        this.deleteDialogVisible = false
        this.fetchPositionsData()
      } catch (error) {
        this.$message.error(`删除失败: ${error.message || '未知错误'}`)
      }
    },

    // 导出岗位
    handleExport() {
      this.exportDialogVisible = true
    },

    // 确认导出
    async handleExportConfirm(exportOptions) {
      try {
        const searchConditions = {
          position_code: this.searchForm.position_code || undefined,
          position_name: this.searchForm.position_name || undefined,
          category_code: this.searchForm.category_code || undefined,
          status: this.searchForm.status || undefined,
          tenant_id: this.searchForm.tenant_id || undefined
        }

        const selectedPositions = exportOptions.range === 'selected' ? this.selectedRows : []
        const result = await this.exportPositionsData(searchConditions, selectedPositions, exportOptions)

        if (result.success) {
          this.$message.success(result.message)
        }
      } catch (error) {
        this.$message.error(`导出失败: ${error.message || '未知错误'}`)
      }
    },

    // 分页
    handlePageChange(page) {
      this.pagination.currentPage = page
      this.fetchPositionsData()
    },

    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.pagination.currentPage = 1
      this.fetchPositionsData()
    }
  },

  setup() {
    const {
      positions,
      total,
      loading,
      fetchPositions,
      createPosition,
      updatePosition,
      deletePosition,
      deletePositions
    } = usePositionData()

    const { exportPositions: exportPositionsData } = usePositionExport()

    return {
      positions,
      total,
      loading,
      fetchPositions,
      createPosition,
      updatePosition,
      deletePosition,
      deletePositions,
      exportPositionsData
    }
  }
}
</script>

<style scoped>
/* 整体容器 */
.position-management-container {
  padding: 20px 20px 5px 20px;
  background: linear-gradient(to bottom, #fafafa 0%, #f5f5f5 100%);
  min-height: calc(100vh - 90px);
  height: calc(100vh - 90px);
  overflow: hidden;
}

/* 主要布局 */
.content-layout {
  display: flex;
  height: calc(100vh - 100px);
  min-height: 600px;
}

/* 右侧面板 */
.right-panel-full {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 搜索区卡片 */
.filter-section {
  margin-bottom: 12px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.05);
  flex-shrink: 0;
}

.search-form .el-form-item {
  margin-bottom: 12px;
}
</style>
