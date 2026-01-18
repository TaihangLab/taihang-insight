<template>
  <div class="position-management-container">
    <div class="content-layout">
      <!-- 左侧部门架构树 -->
      <div class="left-panel">
        <div class="tree-container">
          <el-input
            placeholder="请输入部门名称"
            v-model="filterText"
            prefix-icon="el-icon-search"
            size="small"
            class="tree-search"
          />
          <el-tree
            class="department-tree"
            :data="treeData"
            :props="defaultProps"
            :filter-node-method="filterNode"
            ref="tree"
            node-key="id"
            :expand-on-click-node="false"
            :highlight-current="true"
            @node-click="handleNodeClick"
          >
            <span class="custom-tree-node" slot-scope="{ node, data }">
              <span class="tree-label">{{ node.label }}</span>
            </span>
          </el-tree>
        </div>
      </div>

      <!-- 右侧岗位管理区域 -->
      <div class="right-panel">
        <!-- 搜索和筛选区域 -->
        <div class="filter-section">
          <el-form :inline="true" :model="searchForm" class="search-form">
            <el-form-item label="租户">
              <TenantSelector
                v-model="searchForm.tenant_id"
                @change="handleTenantChange"
              />
            </el-form-item>
            <el-form-item label="岗位编码">
              <el-input v-model="searchForm.position_code" placeholder="请输入岗位编码" clearable style="width: 180px;" />
            </el-form-item>
            <el-form-item label="岗位名称">
              <el-input v-model="searchForm.position_name" placeholder="请输入岗位名称" clearable style="width: 180px;" />
            </el-form-item>
            <el-form-item label="类别编码">
              <el-input v-model="searchForm.category_code" placeholder="请输入类别编码" clearable style="width: 180px;" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 120px;">
                <el-option label="正常" :value="1"></el-option>
                <el-option label="停用" :value="0"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
              <el-button icon="el-icon-refresh" @click="resetSearch">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

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
import TenantSelector from '@/components/common/TenantSelector.vue'
import PositionList from './components/position/PositionList.vue'
import PositionEditDialog from './components/position/PositionEditDialog.vue'
import DeleteConfirmDialog from './components/position/DeleteConfirmDialog.vue'
import ExportDialog from './components/position/ExportDialog.vue'
import { usePositionData } from './composable/position/usePositionData'
import { usePositionExport } from './composable/position/usePositionExport'

export default {
  name: 'PositionManagement',

  components: {
    TenantSelector,
    PositionList,
    PositionEditDialog,
    DeleteConfirmDialog,
    ExportDialog
  },

  data() {
    return {
      filterText: '',
      selectedDepartment: null,

      // 部门树数据
      treeData: [
        {
          id: 1,
          label: 'XXX科技',
          children: [
            {
              id: 11,
              label: '测试测试',
              children: [
                { id: 111, label: '子部门' }
              ]
            }
          ]
        },
        {
          id: 2,
          label: '深圳总公司',
          children: [
            {
              id: 21,
              label: '研发部门',
              children: [
                { id: 211, label: '测试研发部门' }
              ]
            },
            { id: 22, label: '市场部门' },
            { id: 23, label: '测试部门' },
            { id: 24, label: '财务部门' },
            { id: 25, label: '运维部门' }
          ]
        },
        {
          id: 3,
          label: '长沙分公司',
          children: [
            { id: 31, label: '市场部门' },
            {
              id: 32,
              label: '财务部门',
              children: [
                { id: 321, label: '财务测试' }
              ]
            }
          ]
        }
      ],

      defaultProps: {
        children: 'children',
        label: 'label'
      },

      // 搜索表单
      searchForm: {
        position_code: '',
        position_name: '',
        category_code: '',
        department: '',
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

    // 部门树相关方法
    filterNode(value, data) {
      if (!value) return true
      return data.label.indexOf(value) !== -1
    },

    handleNodeClick(data) {
      this.selectedDepartment = data
      this.searchForm.department = data.label
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
        department: this.searchForm.department || undefined,
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
        department: '',
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
          // 新增岗位
          await this.createPosition(positionData)
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
          department: this.searchForm.department || undefined,
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
  gap: 20px;
  height: calc(100vh - 100px);
  min-height: 600px;
}

/* 左侧面板 */
.left-panel {
  width: 280px;
  min-width: 280px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #ebeef5;
  overflow: hidden;
}

.tree-container {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tree-search {
  margin-bottom: 16px;
}

.department-tree {
  flex: 1;
  overflow: auto;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.tree-label {
  font-weight: 500;
}

/* 右侧面板 */
.right-panel {
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
