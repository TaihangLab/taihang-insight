<template>
  <div class="permission-management-container">
    <!-- 页面标题 -->
      <!-- 搜索和筛选区域 -->
    <div class="filter-section">
      <el-form :inline="true">
        <el-form-item label="租户">
          <TenantSelector
            ref="tenantSelector"
            v-model="searchForm.tenantCode"
            @change="handleTenantChange"/>
        </el-form-item>
        <el-form-item label="权限名称">
          <el-input
            v-model="searchForm.permissionName"
            placeholder="请输入权限名称"
            clearable
          ></el-input>
        </el-form-item>
        <el-form-item label="权限标识">
          <el-input
            v-model="searchForm.permissionCode"
            placeholder="请输入权限标识"
            clearable
          ></el-input>
        </el-form-item>
        <el-form-item label="权限类型">
          <el-select v-model="searchForm.permissionType" placeholder="请选择权限类型" clearable>
            <el-option label="页面权限" value="page"></el-option>
            <el-option label="按钮权限" value="button"></el-option>
            <el-option label="数据权限" value="data"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="创建者">
          <el-select v-model="searchForm.creator" placeholder="请选择创建者" clearable>
            <el-option label="admin" value="admin"></el-option>
            <el-option label="system" value="system"></el-option>
            <el-option label="manager" value="manager"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="正常" :value="1"></el-option>
            <el-option label="停用" :value="0"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchPermissions">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 权限列表表格 -->
    <div class="table-container">
      <div class="table-operations">
        <el-button type="primary" icon="el-icon-plus" @click="addPermission">新增权限</el-button>
        <el-button icon="el-icon-refresh" @click="fetchPermissions">刷新</el-button>
      </div>
      <el-table
        :data="tableData"
        v-loading="loading"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="permissionName" label="权限名称" width="200"></el-table-column>
        <el-table-column prop="permissionCode" label="权限标识" width="200"></el-table-column>
        <el-table-column prop="permissionType" label="权限类型" width="120">
          <template slot-scope="scope">
            <el-tag :type="getPermissionTypeTag(scope.row.permissionType)">
              {{ getPermissionTypeText(scope.row.permissionType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template slot-scope="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(scope.row)"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180"></el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" @click="editPermission(scope.row)">编辑</el-button>
            <el-button type="text" @click="deletePermission(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          :current-page.sync="pagination.currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size.sync="pagination.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        ></el-pagination>
      </div>
    </div>

    <!-- 新增/编辑权限对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="permissionDialogVisible"
      width="600px"
    >
      <el-form :model="permissionForm" :rules="permissionRules" ref="permissionForm" label-width="100px">
        <el-form-item label="权限名称" prop="permissionName">
          <el-input v-model="permissionForm.permissionName" placeholder="请输入权限名称"></el-input>
        </el-form-item>

        <el-form-item label="权限标识" prop="permissionCode">
          <el-input v-model="permissionForm.permissionCode" placeholder="请输入权限标识"></el-input>
        </el-form-item>

        <el-form-item label="权限类型" prop="permissionType">
          <el-select v-model="permissionForm.permissionType" placeholder="请选择权限类型">
            <el-option label="页面权限" value="page"></el-option>
            <el-option label="按钮权限" value="button"></el-option>
            <el-option label="数据权限" value="data"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="permissionForm.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePermission">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import RBACService from '@/components/service/RBACService'
import TenantSelector from '@/components/common/TenantSelector.vue'

export default {
  name: 'PermissionManagement',

  components: {
    TenantSelector
  },

  data() {
    return {
      // 表格数据
      tableData: [],
      loading: false,
      selectedRows: [],

      // 搜索表单
      searchForm: {
        permissionName: '',
        permissionCode: '',
        permissionType: '',
        status: '',
        creator: '',
        tenantCode: ''
      },

      // 分页
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },

      // 权限表单
      permissionForm: {
        permissionName: '',
        permissionCode: '',
        permissionType: 'button',
        status: 1,
        tenantCode: ''
      },

      // 表单验证规则
      permissionRules: {
        permissionName: [
          { required: true, message: '请输入权限名称', trigger: 'blur' }
        ],
        permissionCode: [
          { required: true, message: '请输入权限标识', trigger: 'blur' }
        ],
        permissionType: [
          { required: true, message: '请选择权限类型', trigger: 'change' }
        ]
      },

      // 对话框
      permissionDialogVisible: false,
      dialogTitle: '添加权限',
      currentPermission: null
    }
  },

  async mounted() {
    // 等待租户加载完成后再获取权限数据
    await this.waitForTenantLoaded();
    this.fetchPermissions();
  },

  methods: {
    // 处理租户变化
    handleTenantChange() {
      this.pagination.currentPage = 1
      this.fetchPermissions()
    },

    // 等待租户选择器加载完成
    async waitForTenantLoaded() {
      // 等待租户选择器组件加载完成
      if (this.$refs.tenantSelector && typeof this.$refs.tenantSelector.loadTenantsIfNeeded === 'function') {
        await this.$refs.tenantSelector.loadTenantsIfNeeded();
      }

      // 如果当前没有选择租户，但有租户列表，则自动选择第一个
      if (!this.searchForm.tenantCode && this.$refs.tenantSelector && this.$refs.tenantSelector.tenants && this.$refs.tenantSelector.tenants.length > 0) {
        this.searchForm.tenantCode = this.$refs.tenantSelector.tenants[0].tenantCode;
      }
    },

    // 获取权限数据
    async fetchPermissions() {
      this.loading = true

      try {
        // 构建请求参数
        const skip = (this.pagination.currentPage - 1) * this.pagination.pageSize;
        const params = {
          skip: skip,
          limit: this.pagination.pageSize,
          permission_name: this.searchForm.permissionName || undefined,
          permission_code: this.searchForm.permissionCode || undefined,
          permission_type: this.searchForm.permissionType || undefined,
          status: this.searchForm.status || undefined,
          creator: this.searchForm.creator || undefined,
          tenant_code: this.searchForm.tenantCode || 'default'  // 使用默认租户代码
        }

        // 调用API获取权限列表
        const response = await RBACService.getPermissions(params)

        if (response && response.data && Array.isArray(response.data.items)) {
          // API调用成功，使用API数据
          console.log('✅ 使用API数据获取权限列表')
          this.tableData = response.data.items
          this.pagination.total = response.data.total || response.data.items.length || 0
        } else {
          // API返回格式异常
          throw new Error('API返回格式异常')
        }
      } catch (error) {
        // API调用失败
        console.error('⚠️ API调用失败:', error.message)
        this.$message.error(`获取权限列表失败: ${error.message}`)
        // 在API调用失败时清空表格数据
        this.tableData = []
        this.pagination.total = 0
      }

      this.loading = false
    },

    // 搜索权限
    searchPermissions() {
      this.pagination.currentPage = 1
      this.fetchPermissions()
    },

    // 重置搜索
    resetSearch() {
      this.searchForm = {
        permissionName: '',
        permissionCode: '',
        permissionType: '',
        status: '',
        creator: '',
        tenantCode: ''
      }
      this.pagination.currentPage = 1
      this.fetchPermissions()
    },

    // 获取权限数据
    async fetchPermissions() {
      this.loading = true

      try {
        // 构建请求参数
        const skip = (this.pagination.currentPage - 1) * this.pagination.pageSize;
        const params = {
          skip: skip,
          limit: this.pagination.pageSize,
          permission_name: this.searchForm.permissionName || undefined,
          permission_code: this.searchForm.permissionCode || undefined,
          permission_type: this.searchForm.permissionType || undefined,
          status: this.searchForm.status || undefined,
          creator: this.searchForm.creator || undefined,
          tenant_code: this.searchForm.tenantCode || undefined
        }

        // 调用API获取权限列表
        const response = await RBACService.getPermissions(params)

        if (response && response.data && Array.isArray(response.data.items)) {
          // API调用成功，使用API数据
          console.log('✅ 使用API数据获取权限列表')
          this.tableData = response.data.items
          this.pagination.total = response.data.total || response.data.items.length || 0
        } else {
          // API返回格式异常
          throw new Error('API返回格式异常')
        }
      } catch (error) {
        // API调用失败
        console.error('⚠️ API调用失败:', error.message)
        this.$message.error(`获取权限列表失败: ${error.message}`)
        // 在API调用失败时清空表格数据
        this.tableData = []
        this.pagination.total = 0
      }

      this.loading = false
    },

    // 新增权限
    addPermission() {
      this.dialogTitle = '添加权限'
      this.currentPermission = null
      this.permissionForm = {
        permissionName: '',
        permissionCode: '',
        permissionType: 'button',
        status: 1
      }
      this.permissionDialogVisible = true
      this.$nextTick(() => {
        this.$refs.permissionForm.clearValidate()
      })
    },

    // 编辑权限
    editPermission(row) {
      this.dialogTitle = '修改权限'
      this.currentPermission = row
      this.permissionForm = {
        permissionName: row.permissionName,
        permissionCode: row.permissionCode,
        permissionType: row.permissionType,
        status: row.status
      }
      this.permissionDialogVisible = true
      this.$nextTick(() => {
        this.$refs.permissionForm.clearValidate()
      })
    },

    // 保存权限
    savePermission() {
      this.$refs.permissionForm.validate(async (valid) => {
        if (valid) {
          this.loading = true
          
          try {
            let response
            if (this.currentPermission) {
              // 编辑权限
              const tenantCode = this.currentPermission.tenantCode || 'default'
              response = await RBACService.updatePermission(this.currentPermission.permissionCode, tenantCode, this.permissionForm)
              this.$message({
                message: '权限更新成功',
                type: 'success'
              })
            } else {
              // 新增权限
              response = await RBACService.addPermission(this.permissionForm)
              this.$message({
                message: '权限添加成功',
                type: 'success'
              })
            }
            
            this.permissionDialogVisible = false
            this.fetchPermissions()
          } catch (error) {
            console.error('保存权限失败:', error)
            this.$message({
              message: '保存权限失败，请重试',
              type: 'error'
            })
          }
          
          this.loading = false
        }
      })
    },

    // 删除权限
    deletePermission(row) {
      this.$confirm(`确定要删除权限 "${row.permissionName}" 吗？`, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        this.loading = true
        
        try {
          const tenantCode = row.tenantCode || 'default'
          await RBACService.deletePermission(row.permissionCode, tenantCode)
          this.$message({
            message: '权限删除成功',
            type: 'success'
          })
          this.fetchPermissions()
        } catch (error) {
          console.error('删除权限失败:', error)
          this.$message({
            message: '删除权限失败，请重试',
            type: 'error'
          })
        }
        
        this.loading = false
      }).catch(() => {})
    },

    // 处理状态变化
    async handleStatusChange(row) {
      this.loading = true
      
      try {
        const tenantCode = row.tenantCode || 'default'
        await RBACService.updatePermissionStatus(row.permissionCode, tenantCode, row.status)
        const status = row.status === 1 ? '启用' : '停用'
        this.$message({
          message: `权限状态已${status}`,
          type: 'success'
        })
      } catch (error) {
        console.error('更新权限状态失败:', error)
        this.$message({
          message: '更新权限状态失败，请重试',
          type: 'error'
        })
        // 恢复原状态
        this.fetchPermissions()
      }
      
      this.loading = false
    },

    // 处理选择变化
    handleSelectionChange(selection) {
      this.selectedRows = selection
    },

    // 处理分页大小变化
    handleSizeChange(newSize) {
      this.pagination.pageSize = newSize
      this.fetchPermissions()
    },

    // 处理当前页变化
    handleCurrentChange(newPage) {
      this.pagination.currentPage = newPage
      this.fetchPermissions()
    },

    // 获取权限类型文本
    getPermissionTypeText(type) {
      const typeMap = {
        page: '页面权限',
        button: '按钮权限',
        data: '数据权限'
      }
      return typeMap[type] || '未知'
    },

    // 获取权限类型标签样式
    getPermissionTypeTag(type) {
      const tagMap = {
        page: 'primary',
        button: 'success',
        data: 'warning'
      }
      return tagMap[type] || ''
    }
  }
}
</script>

<style scoped>
.permission-management-container {
  padding: 20px;
}

.page-header {
  background-color: #fff;
  margin-bottom: 20px;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.table-container {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.pagination-container {
  margin-top: 20px;
  text-align: center;
}
</style>
