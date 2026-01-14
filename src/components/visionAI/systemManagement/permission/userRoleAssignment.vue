<template>
  <div class="user-role-assignment">
    <div class="page-header">
      <h2>用户角色分配</h2>
      <p class="page-description">为用户分配相应的角色</p>
    </div>

    <div class="main-content">
      <div class="content-wrapper">
        <!-- 左侧用户列表 -->
        <div class="user-list-panel">
          <div class="panel-header">
            <h3>用户列表</h3>
            <div class="panel-controls">
              <el-input
                v-model="userFilter"
                placeholder="搜索用户"
                prefix-icon="el-icon-search"
                size="small"
                clearable
              />
            </div>
          </div>
          <div class="user-list-container">
            <el-table
              :data="filteredUsers"
              :highlight-current-row="true"
              @current-change="selectUser"
              v-loading="usersLoading"
              height="100%"
            >
              <el-table-column prop="user_name" label="用户名" />
              <el-table-column prop="nickName" label="昵称" />
              <el-table-column prop="email" label="邮箱" />
              <el-table-column prop="status" label="状态" width="80">
                <template slot-scope="scope">
                  <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
                    {{ scope.row.status === 1 ? '启用' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- 右侧角色分配 -->
        <div class="role-assignment-panel">
          <div class="panel-header" v-if="selectedUser">
            <h3>{{ selectedUser.nickName || selectedUser.user_name }} - 角色分配</h3>
            <div class="panel-actions">
              <el-button size="small" @click="selectAllRoles">全选</el-button>
              <el-button size="small" @click="unselectAllRoles">全不选</el-button>
              <el-button type="primary" size="small" @click="saveUserRoles">保存分配</el-button>
            </div>
          </div>
          
          <div class="no-selection" v-else>
            <i class="el-icon-info"></i>
            <p>请选择左侧用户以分配角色</p>
          </div>

          <div class="role-assignment-content" v-if="selectedUser">
            <div class="role-grid">
              <el-checkbox-group v-model="selectedUserRoles">
                <el-row :gutter="15">
                  <el-col 
                    :xs="24" 
                    :sm="12" 
                    :md="8" 
                    :lg="6" 
                    v-for="role in roles" 
                    :key="role.id"
                  >
                    <el-checkbox :label="role.id" class="role-checkbox">
                      <div class="role-item">
                        <div class="role-name">{{ role.role_name }}</div>
                        <div class="role-code">{{ role.role_code }}</div>
                        <div class="role-desc">{{ role.description || '暂无描述' }}</div>
                        <el-tag 
                          :type="role.status === 1 ? 'success' : 'danger'" 
                          size="mini" 
                          class="role-status-tag"
                        >
                          {{ role.status === 1 ? '启用' : '禁用' }}
                        </el-tag>
                      </div>
                    </el-checkbox>
                  </el-col>
                </el-row>
              </el-checkbox-group>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import RBACService from '@/components/service/RBACService';

export default {
  name: 'UserRoleAssignment',
  data() {
    return {
      // 用户相关
      users: [],
      filteredUsers: [],
      userFilter: '',
      usersLoading: false,
      selectedUser: null,
      
      // 角色相关
      roles: [],
      
      // 选中的角色
      selectedUserRoles: []
    }
  },
  
  watch: {
    userFilter() {
      this.filterUsers();
    }
  },
  
  async created() {
    await this.loadUsers();
    await this.loadRoles();
  },
  
  methods: {
    // 加载用户列表
    async loadUsers() {
      this.usersLoading = true;
      try {
        // 从后端获取用户列表
        // const response = await RBACService.getUsers();
        // this.users = response.data.items || [];
        
        // 模拟数据
        this.users = [
          { id: 1, user_name: 'admin', nickName: '系统管理员', email: 'admin@example.com', status: 1 },
          { id: 2, user_name: 'user1', nickName: '普通用户1', email: 'user1@example.com', status: 1 },
          { id: 3, user_name: 'user2', nickName: '普通用户2', email: 'user2@example.com', status: 1 },
          { id: 4, user_name: 'reviewer1', nickName: '审核员1', email: 'reviewer1@example.com', status: 1 },
          { id: 5, user_name: 'guest1', nickName: '访客1', email: 'guest1@example.com', status: 1 }
        ];
        
        this.filterUsers();
      } catch (error) {
        console.error('加载用户列表失败:', error);
        this.$message.error('加载用户列表失败');
      } finally {
        this.usersLoading = false;
      }
    },
    
    // 加载角色列表
    async loadRoles() {
      try {
        // 从后端获取角色列表
        // const response = await RBACService.getRoles();
        // this.roles = response.data.items || [];
        
        // 模拟数据
        this.roles = [
          { id: 1, role_name: '系统管理员', role_code: 'admin', status: 1, description: '拥有系统最高权限' },
          { id: 2, role_name: '普通用户', role_code: 'user', status: 1, description: '基本用户权限' },
          { id: 3, role_name: '审核员', role_code: 'reviewer', status: 1, description: '负责审核相关内容' },
          { id: 4, role_name: '访客', role_code: 'guest', status: 1, description: '只读权限' },
          { id: 5, role_name: '运营专员', role_code: 'operator', status: 1, description: '负责日常运营工作' },
          { id: 6, role_name: '数据分析员', role_code: 'analyst', status: 1, description: '负责数据分析工作' }
        ];
      } catch (error) {
        console.error('加载角色列表失败:', error);
        this.$message.error('加载角色列表失败');
      }
    },
    
    // 过滤用户
    filterUsers() {
      if (!this.userFilter) {
        this.filteredUsers = this.users;
      } else {
        const filter = this.userFilter.toLowerCase();
        this.filteredUsers = this.users.filter(user => 
          user.user_name.toLowerCase().includes(filter) || 
          user.nickName.toLowerCase().includes(filter) ||
          user.email.toLowerCase().includes(filter)
        );
      }
    },
    
    // 选择用户
    async selectUser(user) {
      if (!user) return;
      
      this.selectedUser = user;
      
      // 加载该用户已有的角色
      await this.loadUserRoles(user);
    },
    
    // 加载用户角色
    async loadUserRoles(user) {
      try {
        // 从后端获取用户的角色
        // const response = await RBACService.getUserRoles(user.id);
        // const userRoles = response.data.items || [];
        
        // 模拟用户角色数据
        const userRoles = [2, 4]; // 普通用户和访客角色
        
        // 设置选中的角色
        this.selectedUserRoles = userRoles;
      } catch (error) {
        console.error('加载用户角色失败:', error);
        this.$message.error('加载用户角色失败');
      }
    },
    
    // 全选角色
    selectAllRoles() {
      this.selectedUserRoles = this.roles
        .filter(role => role.status === 1) // 只选择启用的角色
        .map(role => role.id);
    },
    
    // 全不选角色
    unselectAllRoles() {
      this.selectedUserRoles = [];
    },
    
    // 保存用户角色
    async saveUserRoles() {
      if (!this.selectedUser) {
        this.$message.warning('请先选择一个用户');
        return;
      }
      
      try {
        // 调用后端API保存用户角色分配
        // await RBACService.assignRolesToUser(this.selectedUser.id, this.selectedUserRoles);
        
        this.$message.success(`已成功为用户 "${this.selectedUser.nickName || this.selectedUser.user_name}" 分配角色`);
      } catch (error) {
        console.error('保存用户角色失败:', error);
        this.$message.error('保存用户角色失败');
      }
    }
  }
}
</script>

<style scoped>
.user-role-assignment {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100%;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.page-description {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.main-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  overflow: hidden;
  min-height: 600px;
}

.content-wrapper {
  display: flex;
  height: 600px;
}

.user-list-panel, .role-assignment-panel {
  padding: 20px;
}

.user-list-panel {
  width: 300px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
}

.role-assignment-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.panel-actions {
  display: flex;
  gap: 10px;
}

.user-list-container {
  flex: 1;
  overflow: auto;
}

.no-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #9ca3af;
  text-align: center;
}

.no-selection i {
  font-size: 48px;
  margin-bottom: 16px;
}

.role-assignment-content {
  flex: 1;
  overflow: auto;
}

.role-grid {
  padding: 0 10px;
}

.role-checkbox {
  width: 100%;
  margin-bottom: 15px;
}

.role-item {
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #f9fafb;
  position: relative;
}

.role-name {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
}

.role-code {
  font-family: monospace;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.role-desc {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 6px;
}

.role-status-tag {
  position: absolute;
  top: 8px;
  right: 8px;
}
</style>