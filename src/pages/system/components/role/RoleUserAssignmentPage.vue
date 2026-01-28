<template>
  <div class="role-assignment-container">
    <!-- 基本信息 -->
    <div class="basic-info-section">
      <h3 class="section-title">基本信息</h3>
      <div class="info-row">
        <div class="info-item">
          <span class="info-label">用户账号</span>
          <span class="info-value">{{ userInfo.nick_name }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">登录账号</span>
          <span class="info-value">{{ userInfo.user_name }}</span>
        </div>
      </div>
    </div>

    <!-- 角色信息 -->
    <div class="role-info-section">
      <h3 class="section-title">角色信息</h3>
      
      <!-- 角色表格 -->
      <el-table
        :data="roleData"
        v-loading="loading"
        style="width: 100%"
        class="role-table"
        @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center"></el-table-column>
        <el-table-column label="序号" type="index" width="80" align="center" :index="indexMethod"></el-table-column>
        <el-table-column prop="role_code" label="角色编号" min-width="180" align="center"></el-table-column>
        <el-table-column prop="role_name" label="角色名称" min-width="120" align="center"></el-table-column>
        <el-table-column prop="roleKey" label="权限字符" min-width="120" align="center"></el-table-column>
        <el-table-column prop="create_time" label="创建时间" min-width="160" align="center"></el-table-column>
      </el-table>

      <!-- 分页器 -->
      <div class="pagination-container">
        <el-pagination
          :current-page.sync="pagination.currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size.sync="pagination.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange">
        </el-pagination>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button type="primary" @click="submitAssignment">提交</el-button>
      <el-button @click="goBack">返回</el-button>
    </div>
  </div>
</template>

<script>
import associationService from '@/api/rbac/associationService'

export default {
  name: 'RoleAssignment',
  
  data() {
    return {
      loading: false,
      
      // 用户信息
      userInfo: {
        user_name: '',
        nick_name: ''
      },
      
      // 角色数据
      roleData: [],
      selectedRoles: [],
      
      // 分页
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      }
    }
  },
  
  created() {
    this.initUserInfo()
    this.fetchRoles()
  },
  
  methods: {
    // 初始化用户信息
    initUserInfo() {
      const { user_code, user_name } = this.$route.params
      this.userInfo.user_name = user_name || user_code

      // 根据用户Code获取用户详细信息
      this.fetchUserInfo()
    },
    
    // 获取用户详细信息
    async fetchUserInfo() {
      try {
        const response = await associationService.getUsers({ user_name: this.userInfo.user_name })

        if (response && response.data && Array.isArray(response.data.items) && response.data.items.length > 0) {
          const userData = response.data.items[0]
          this.userInfo.nick_name = userData.nick_name || userData.nickName || userData.user_name
          this.userInfo.user_name = userData.user_name
        } else {
          console.warn(`未找到用户信息: ${this.userInfo.user_name}`)
          this.userInfo.nick_name = this.userInfo.user_name // 使用用户名作为昵称
        }
      } catch (error) {
        console.error('获取用户信息失败:', error.message)
        this.$message.error(`获取用户信息失败: ${error.message}`)
        this.userInfo.nick_name = this.userInfo.user_name // 使用用户名作为昵称
      }
    },
    
    // 获取角色数据
    async fetchRoles() {
      this.loading = true
      
      try {
        // 尝试从API获取数据
        const skip = (this.pagination.currentPage - 1) * this.pagination.pageSize;
        const params = {
          skip: skip,
          limit: this.pagination.pageSize
        }
        
        const response = await associationService.getRoles(params)
        
        if (response && response.data && Array.isArray(response.data.items)) {
          // API调用成功，使用API数据
          console.log('✅ 使用API数据获取角色列表')
          this.roleData = response.data.items
          this.pagination.total = response.data.total || response.data.items.length || 0
        } else {
          // API返回格式异常，使用模拟数据
          throw new Error('API返回格式异常')
        }
      } catch (error) {
        // API调用失败
        console.error('⚠️ API调用失败:', error.message)
        this.$message.error(`获取角色列表失败: ${error.message}`)
        // 在API调用失败时清空表格数据
        this.roleData = []
        this.pagination.total = 0
      }
      
      this.loading = false
    },
    
    // 生成模拟角色数据
    generateMockRoles() {
      return [
        {
          id: 1,
          role_code: '194204879171796922',
          role_name: 'testwen',
          roleKey: 'testwen',
          create_time: '2025-07-07 10:31:28'
        },
        {
          id: 2,
          role_code: '3',
          role_name: '本部门以上',
          roleKey: 'test1',
          create_time: '2025-06-06 16:28:46'
        },
        {
          id: 3,
          role_code: '4',
          role_name: '仅本人',
          roleKey: 'test2',
          create_time: '2025-06-06 16:28:46'
        },
        {
          id: 4,
          role_code: '5',
          role_name: '管理员',
          roleKey: 'admin',
          create_time: '2025-06-05 14:20:30'
        },
        {
          id: 5,
          role_code: '6',
          role_name: '普通用户',
          roleKey: 'user',
          create_time: '2025-06-05 14:20:30'
        }
      ]
    },
    
    // 序号计算
    indexMethod(index) {
      return (this.pagination.currentPage - 1) * this.pagination.pageSize + index + 1
    },
    
    // 处理选择变化
    handleSelectionChange(selection) {
      this.selectedRoles = selection
    },
    
    // 处理分页
    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.fetchRoles()
    },
    
    handleCurrentChange(page) {
      this.pagination.currentPage = page
      this.fetchRoles()
    },
    
    // 提交分配
    async submitAssignment() {
      if (this.selectedRoles.length === 0) {
        this.$message({
          message: '请选择要分配的角色',
          type: 'warning'
        })
        return
      }
      
      this.loading = true
      
      try {
        // 准备角色数据，提取roleCode
        const roleCodes = this.selectedRoles.map(role => role.role_code)
        
        // 调用API提交角色分配
        await associationService.assignRolesToUser(this.userInfo.user_name, roleCodes)
        
        this.$message({
          message: `已为用户"${this.userInfo.user_name}"分配${this.selectedRoles.length}个角色`,
          type: 'success'
        })
        
        // 提交成功后返回
        setTimeout(() => {
          this.goBack()
        }, 1000)
      } catch (error) {
        console.error('角色分配失败:', error)
        this.$message({
          message: `角色分配失败: ${error.message || '未知错误'}`,
          type: 'error'
        })
      } finally {
        this.loading = false
      }
    },
    
    // 返回上一页
    goBack() {
      this.$router.go(-1)
    }
  }
}
</script>

<style scoped>
.role-assignment-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 90px);
}

/* 基本信息区域 */
.basic-info-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 15px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.info-row {
  display: flex;
  gap: 40px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-label {
  font-size: 14px;
  color: #606266;
  min-width: 80px;
}

.info-value {
  font-size: 14px;
  color: #303133;
  background: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

/* 角色信息区域 */
.role-info-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 表格样式 */
.role-table {
  margin-top: 15px;
}

.role-table :deep(.el-table__header-wrapper th) {
  background: #f5f7fa !important;
  color: #303133 !important;
  font-weight: 600;
}

.role-table :deep(.el-table__body .el-table__row:hover > td) {
  background: #f5f7fa !important;
}

/* 分页器 */
  .pagination-container {
  display: flex;
  justify-content: center;
  background: white;
  margin-top: 0!important;
  padding-bottom: 10px!important;
}

.pagination-container :deep(.el-pagination__total) {
  padding-top: 3px;
}

.pagination-container :deep(.el-pagination) {
  display: flex;
  justify-content: center;
}

.pagination-container :deep(.el-pagination .el-pager li) {
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 4px;
  color: #3b82f6;
  margin: 0 2px;
}

.pagination-container :deep(.el-pagination .el-pager li:hover) {
  color: #1d4ed8;
  border-color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.05);
}

.pagination-container :deep(.el-pagination .el-pager li.active) {
  background: #3b82f6 !important;
  border-color: #3b82f6 !important;
  color: white !important;
  font-weight: 600 !important;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

.pagination-container :deep(.el-pagination button) {
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.pagination-container :deep(.el-pagination button:hover) {
  color: #1d4ed8;
  border-color: #3b82f6;
}

.pagination-container :deep(.el-pagination .btn-prev),
.pagination-container :deep(.el-pagination .btn-next) {
  background-color: white !important;
  border: 1px solid #dcdfe6 !important;
  color: #606266 !important;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding: 20px 0;
}

.action-buttons :deep(.el-button) {
  padding: 12px 24px;
  font-size: 14px;
  border-radius: 6px;
  font-weight: 500;
  min-width: 80px;
}

/* .action-buttons :deep(.el-button--primary) {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  border: none;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
  color: white;
}

.action-buttons :deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%);
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4);
  transform: translateY(-1px);
}

.action-buttons :deep(.el-button--default) {
  background: white;
  border: 1px solid #d1d5db;
  color: #4b5563;
}

.action-buttons :deep(.el-button--default:hover) {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #3b82f6;
  color: #1e40af;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
} */

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .role-assignment-container {
    padding: 12px;
  }
  
  .info-row {
    flex-direction: column;
    gap: 15px;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .action-buttons :deep(.el-button) {
    width: 120px;
  }
}
</style> 