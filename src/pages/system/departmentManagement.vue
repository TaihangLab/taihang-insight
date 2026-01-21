<template>
  <div class="department-management-page">
    <!-- 查询区 -->
    <DepartmentSearchBar
      v-model="searchConditions"
      @search="handleSearch"
      @reset="handleReset"
      @tenant-change="handleTenantChange"
    />

    <!-- 列表区 -->
    <div class="table-container">
      <DepartmentTableActions
        @add="handleAdd"
        @toggle-expand="handleToggleExpand"
      />

      <DepartmentTreeTable
        ref="treeTable"
        :data="departments"
        :loading="loading"
        :default-expand-all="defaultExpandAll"
        @edit="handleEdit"
        @add-sub="handleAddSub"
        @delete="handleDelete"
      />
    </div>

    <!-- 部门编辑对话框 -->
    <DepartmentEditDialog
      :visible.sync="editDialogVisible"
      :current-dept="currentDept"
      :parent-dept-options="parentDeptOptions"
      @submit="handleSubmit"
    />

    <!-- 删除确认对话框 -->
    <DeleteConfirmDialog
      :visible.sync="deleteDialogVisible"
      :target-name="deleteTargetName"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<script>
import _imported_1 from '@/components/service/RBACService';

import { useDepartmentData } from './composable/department/useDepartmentData.js'

import DepartmentSearchBar from './components/department/DepartmentSearchBar.vue'
import DepartmentTableActions from './components/department/DepartmentTableActions.vue'
import DepartmentTreeTable from './components/department/DepartmentTreeTable.vue'
import DepartmentEditDialog from './components/department/DepartmentEditDialog.vue'
import DeleteConfirmDialog from './components/department/DeleteConfirmDialog.vue'

export default {
  name: 'DepartmentManagement',
  components: {
    DepartmentSearchBar,
    DepartmentTableActions,
    DepartmentTreeTable,
    DepartmentEditDialog,
    DeleteConfirmDialog
  },
  setup() {
    // 使用 composables
    const {
      departments,
      loading,
      parentDeptOptions,
      fetchDepartments,
      fetchParentDeptOptions,
      createDepartment,
      updateDepartment,
      deleteDepartment,
      clearData
    } = useDepartmentData()

    return {
      departments,
      loading,
      parentDeptOptions,
      fetchDepartments,
      fetchParentDeptOptions,
      createDepartment,
      updateDepartment,
      deleteDepartment,
      clearData
    }
  },
  data() {
    return {
      // 搜索条件
      searchConditions: {
        tenant_id: null,
        name: '',
        id: null,
        status: null
      },

      // 展开控制
      defaultExpandAll: false,
      expandAll: true,

      // 对话框状态
      editDialogVisible: false,
      deleteDialogVisible: false,
      currentDept: null,
      deleteTargetName: ''
    }
  },
  async created() {
    // 先获取租户信息
    await this.getDefaultTenant()
    // 然后加载部门数据
    await this.loadData()
  },
  methods: {
    /**
     * 获取默认租户信息
     */
    async getDefaultTenant() {
      try {
        const RBACService = _imported_1
        const response = await RBACService.getTenants()
        if (response && response.data && Array.isArray(response.data.items) && response.data.items.length > 0) {
          // 设置第一个租户为默认值
          const firstTenant = response.data.items[0]
          this.searchConditions.tenant_id = firstTenant.tenant_id || firstTenant.id
        }
      } catch (error) {
        console.error('获取租户信息失败:', error)
      }
    },

    /**
     * 构建查询参数
     */
    buildParams() {
      const params = {}
      if (this.searchConditions.name) {
        params.name = this.searchConditions.name
      }
      if (this.searchConditions.id) {
        params.id = this.searchConditions.id
      }
      if (this.searchConditions.status !== null && this.searchConditions.status !== '') {
        params.status = this.searchConditions.status
      }
      if (this.searchConditions.tenant_id) {
        params.tenant_id = this.searchConditions.tenant_id
      }
      return params
    },

    /**
     * 加载数据
     */
    async loadData() {
      try {
        await this.fetchDepartments(this.buildParams())
        // 数据加载完成后展开所有节点
        this.$nextTick(() => {
          if (this.$refs.treeTable) {
            this.$refs.treeTable.toggleExpandAll(true)
          }
        })
      } catch (error) {
        this.$message.error(`获取部门列表失败: ${error.message}`)
        this.clearData()
      }
    },

    /**
     * 搜索
     */
    handleSearch(conditions) {
      this.searchConditions = { ...conditions }
      this.loadData()
    },

    /**
     * 重置
     */
    handleReset() {
      this.searchConditions = {
        tenant_id: '',
        name: '',
        id: '',
        status: null
      }
      this.loadData()
    },

    /**
     * 租户变化
     */
    handleTenantChange() {
      this.loadData()
    },

    /**
     * 展开/折叠
     */
    handleToggleExpand() {
      this.expandAll = !this.expandAll
      if (this.$refs.treeTable) {
        this.$refs.treeTable.toggleExpandAll(this.expandAll)
      }
    },

    /**
     * 新增部门
     */
    handleAdd() {
      this.currentDept = null
      this.editDialogVisible = true
    },

    /**
     * 添加子部门
     */
    handleAddSub(row) {
      this.currentDept = {
        isSubDept: true,
        parent_id: row.id  
      }
      this.editDialogVisible = true
    },

    /**
     * 编辑部门
     */
    handleEdit(row) {
      console.log('handleEdit', row)
      // 直接使用 row 数据，parent_id 已经是数据库的 id 值
      this.currentDept = row
      this.editDialogVisible = true
    },

    /**
     * 提交部门表单
     */
    async handleSubmit(formData) {
      try {
        const submitData = { ...formData }

        // 处理 parent_id - 直接使用 id 值，不需要转换
        if (submitData.parent_id === null || submitData.parent_id === undefined || submitData.parent_id === '') {
          submitData.parent_id = null
        }

        // 添加租户ID
        submitData.tenant_id = this.searchConditions.tenant_id

        let result
        if (this.currentDept && !this.currentDept.isSubDept) {
          // 更新部门 - 使用 id 作为标识
          delete submitData.id  // 不允许修改 id
          result = await this.updateDepartment(this.currentDept.id, submitData)
        } else {
          // 新增部门或添加子部门 - 如果是新增则不包含部门编码
          if (!this.currentDept) {
            delete submitData.id
          }
          result = await this.createDepartment(submitData)
        }

        this.$message.success(result.message)
        this.editDialogVisible = false
        this.loadData()
      } catch (error) {
        this.$message.error(`保存部门失败: ${error.message}`)
      }
    },

    /**
     * 删除部门
     */
    handleDelete(row) {
      this.deleteTargetName = row.name || row.id
      this.currentDept = row
      this.deleteDialogVisible = true
    },

    /**
     * 确认删除
     */
    async handleDeleteConfirm() {
      try {
        // 使用数据库的 bigint id 进行删除
        const result = await this.deleteDepartment(this.currentDept.id)
        this.$message.success(result.message)
        this.deleteDialogVisible = false
        this.loadData()
      } catch (error) {
        this.$message.error(`删除部门失败: ${error.message}`)
      }
    }
  }
}
</script>

<style scoped>
.department-management-page {
  padding: 20px;
  background: linear-gradient(to bottom, #fafafa 0%, #f5f5f5 100%);
  min-height: calc(100vh - 100px);
}

.table-container {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #ebeef5;
  margin-top: 0;
  position: relative;
  overflow: hidden;
}
</style>
