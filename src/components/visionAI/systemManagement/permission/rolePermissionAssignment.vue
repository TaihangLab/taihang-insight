<template>
  <div class="role-permission-assignment">
    <div class="page-header">
      <h2>角色权限分配</h2>
      <p class="page-description">为角色分配相应的权限</p>
    </div>

    <div class="main-content">
      <div class="content-wrapper">
        <!-- 左侧角色列表 -->
        <div class="role-list-panel">
          <div class="panel-header">
            <h3>角色列表</h3>
            <div class="panel-controls">
              <el-input
                v-model="roleFilter"
                placeholder="搜索角色"
                prefix-icon="el-icon-search"
                size="small"
                clearable
              />
            </div>
          </div>
          <div class="role-list-container">
            <el-table
              :data="filteredRoles"
              :highlight-current-row="true"
              @current-change="selectRole"
              v-loading="rolesLoading"
              height="100%"
            >
              <el-table-column prop="role_name" label="角色名称" />
              <el-table-column prop="role_code" label="角色编码" />
              <el-table-column prop="status" label="状态" width="80">
                <template #default="scope">
                  <el-tag :type="scope.row.status === 0 ? 'success' : 'danger'">
                    {{ scope.row.status === 0 ? '启用' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- 右侧权限分配 -->
        <div class="permission-assignment-panel">
          <div class="panel-header" v-if="selectedRole">
            <h3>{{ selectedRole.role_name }} ({{ selectedRole.role_code }}) - 权限分配</h3>
            <div class="panel-actions">
              <el-button size="small" @click="selectAllPermissions">全选</el-button>
              <el-button size="small" @click="unselectAllPermissions">全不选</el-button>
              <el-button type="primary" size="small" @click="saveRolePermissions">保存分配</el-button>
            </div>
          </div>
          
          <div class="no-selection" v-else>
            <i class="el-icon-info"></i>
            <p>请选择左侧角色以分配权限</p>
          </div>

          <div class="permission-assignment-content" v-if="selectedRole">
            <!-- 权限分类标签 -->
            <el-tabs v-model="activePermissionTab" type="card">
              <el-tab-pane label="菜单权限" name="menu">
                <div class="permission-grid">
                  <el-checkbox-group v-model="selectedMenuPermissions">
                    <el-row :gutter="15">
                      <el-col 
                        :xs="24" 
                        :sm="12" 
                        :md="8" 
                        :lg="6" 
                        v-for="permission in menuPermissions" 
                        :key="permission.code"
                      >
                        <el-checkbox :label="permission.code" class="permission-checkbox">
                          <div class="permission-item">
                            <div class="permission-name">{{ permission.name }}</div>
                            <div class="permission-code">{{ permission.code }}</div>
                            <div class="permission-desc">{{ permission.description }}</div>
                          </div>
                        </el-checkbox>
                      </el-col>
                    </el-row>
                  </el-checkbox-group>
                </div>
              </el-tab-pane>
              
              <el-tab-pane label="操作权限" name="action">
                <div class="permission-category-filters">
                  <el-radio-group v-model="selectedCategory" size="small">
                    <el-radio-button label="">全部</el-radio-button>
                    <el-radio-button label="READ">读取</el-radio-button>
                    <el-radio-button label="WRITE">写入</el-radio-button>
                    <el-radio-button label="DELETE">删除</el-radio-button>
                    <el-radio-button label="SPECIAL">特殊</el-radio-button>
                  </el-radio-group>
                </div>
                
                <div class="permission-grid">
                  <el-checkbox-group v-model="selectedActionPermissions">
                    <el-row :gutter="15">
                      <el-col 
                        :xs="24" 
                        :sm="12" 
                        :md="8" 
                        :lg="6" 
                        v-for="permission in filteredActionPermissions" 
                        :key="permission.code"
                      >
                        <el-checkbox :label="permission.code" class="permission-checkbox">
                          <div class="permission-item">
                            <div class="permission-name">{{ permission.name }}</div>
                            <div class="permission-code">{{ permission.code }}</div>
                            <div class="permission-desc">{{ permission.description }}</div>
                            <el-tag 
                              :type="getCategoryTagType(permission.category)" 
                              size="mini" 
                              class="permission-category-tag"
                            >
                              {{ getCategoryLabel(permission.category) }}
                            </el-tag>
                          </div>
                        </el-checkbox>
                      </el-col>
                    </el-row>
                  </el-checkbox-group>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import RBACService from '@/components/service/RBACService';

export default {
  name: 'RolePermissionAssignment',
  data() {
    return {
      // 角色相关
      roles: [],
      filteredRoles: [],
      roleFilter: '',
      rolesLoading: false,
      selectedRole: null,
      
      // 权限相关
      allPermissions: [],
      menuPermissions: [],
      actionPermissions: [],
      filteredActionPermissions: [],
      selectedCategory: '',
      activePermissionTab: 'menu',
      
      // 选中的权限
      selectedMenuPermissions: [],
      selectedActionPermissions: []
    }
  },
  
  watch: {
    roleFilter() {
      this.filterRoles();
    },
    selectedCategory() {
      this.filterActionPermissions();
    }
  },
  
  async created() {
    await this.loadRoles();
    await this.loadAllPermissions();
  },
  
  methods: {
    // 加载角色列表
    async loadRoles() {
      this.rolesLoading = true;
      try {
        // 从后端获取角色列表
        // const response = await RBACService.getRoles();
        // this.roles = response.data.items || [];
        
        // 模拟数据
        this.roles = [
          { id: 1, role_name: '系统管理员', role_code: 'admin', status: 1 },
          { id: 2, role_name: '普通用户', role_code: 'user', status: 1 },
          { id: 3, role_name: '审核员', role_code: 'reviewer', status: 1 },
          { id: 4, role_name: '访客', role_code: 'guest', status: 1 }
        ];
        
        this.filterRoles();
      } catch (error) {
        console.error('加载角色列表失败:', error);
        this.$message.error('加载角色列表失败');
      } finally {
        this.rolesLoading = false;
      }
    },
    
    // 加载所有权限
    async loadAllPermissions() {
      try {
        // 从后端获取所有权限
        // const response = await RBACService.getPermissions();
        // this.allPermissions = response.data.items || [];
        
        // 模拟权限数据
        this.allPermissions = [
          // 菜单权限
          { code: 'menu:monitoring:view', name: '监控预警菜单访问', description: '访问监控预警菜单的权限', category: 'MENU', type: 'menu' },
          { code: 'menu:systemManage:view', name: '系统管理菜单访问', description: '访问系统管理菜单的权限', category: 'MENU', type: 'menu' },
          { code: 'menu:systemManage:userManagement:view', name: '用户管理页面访问', description: '访问用户管理页面的权限', category: 'MENU', type: 'menu' },
          { code: 'menu:systemManage:roleManagement:view', name: '角色管理页面访问', description: '访问角色管理页面的权限', category: 'MENU', type: 'menu' },
          
          // 操作权限
          { code: 'system:user:read', name: '查看用户', description: '查看用户信息的权限', category: 'READ', type: 'action' },
          { code: 'system:user:create', name: '新增用户', description: '新增用户的权限', category: 'WRITE', type: 'action' },
          { code: 'system:user:update', name: '编辑用户', description: '编辑用户信息的权限', category: 'WRITE', type: 'action' },
          { code: 'system:user:delete', name: '删除用户', description: '删除用户的权限', category: 'DELETE', type: 'action' },
          { code: 'system:user:reset_password', name: '重置用户密码', description: '重置用户密码的权限', category: 'SPECIAL', type: 'action' },
          { code: 'system:user:grant', name: '分配用户角色', description: '为用户分配角色的权限', category: 'SPECIAL', type: 'action' },
          { code: 'system:role:read', name: '查看角色', description: '查看角色信息的权限', category: 'READ', type: 'action' },
          { code: 'system:role:create', name: '新增角色', description: '新增角色的权限', category: 'WRITE', type: 'action' },
          { code: 'system:role:update', name: '编辑角色', description: '编辑角色信息的权限', category: 'WRITE', type: 'action' },
          { code: 'system:role:delete', name: '删除角色', description: '删除角色的权限', category: 'DELETE', type: 'action' },
          { code: 'system:role:grant_permission', name: '分配角色权限', description: '为角色分配权限的权限', category: 'SPECIAL', type: 'action' },
          { code: 'system:permission:read', name: '查看权限', description: '查看权限信息的权限', category: 'READ', type: 'action' },
          { code: 'system:permission:create', name: '新增权限', description: '新增权限的权限', category: 'WRITE', type: 'action' },
          { code: 'system:permission:update', name: '编辑权限', description: '编辑权限信息的权限', category: 'WRITE', type: 'action' },
          { code: 'system:permission:delete', name: '删除权限', description: '删除权限的权限', category: 'DELETE', type: 'action' }
        ];
        
        this.separatePermissions();
      } catch (error) {
        console.error('加载权限列表失败:', error);
        this.$message.error('加载权限列表失败');
      }
    },
    
    // 分离权限
    separatePermissions() {
      this.menuPermissions = this.allPermissions.filter(p => p.type === 'menu');
      this.actionPermissions = this.allPermissions.filter(p => p.type === 'action');
      this.filterActionPermissions();
    },
    
    // 过滤角色
    filterRoles() {
      if (!this.roleFilter) {
        this.filteredRoles = this.roles;
      } else {
        const filter = this.roleFilter.toLowerCase();
        this.filteredRoles = this.roles.filter(role => 
          role.role_name.toLowerCase().includes(filter) || 
          role.role_code.toLowerCase().includes(filter)
        );
      }
    },
    
    // 过滤操作权限
    filterActionPermissions() {
      if (!this.selectedCategory) {
        this.filteredActionPermissions = this.actionPermissions;
      } else {
        this.filteredActionPermissions = this.actionPermissions.filter(
          perm => perm.category === this.selectedCategory
        );
      }
    },
    
    // 选择角色
    async selectRole(role) {
      if (!role) return;
      
      this.selectedRole = role;
      
      // 加载该角色已有的权限
      await this.loadRolePermissions(role);
    },
    
    // 加载角色权限
    async loadRolePermissions(role) {
      try {
        // 从后端获取角色的权限
        // const response = await RBACService.getRolePermissions(role.id);
        // const rolePermissions = response.data.items || [];
        
        // 模拟角色权限数据
        const rolePermissions = [
          'menu:systemManage:view',
          'menu:systemManage:userManagement:view',
          'system:user:read',
          'system:user:create',
          'system:user:update',
          'system:role:read'
        ];
        
        // 分离菜单权限和操作权限
        this.selectedMenuPermissions = rolePermissions.filter(code => 
          this.menuPermissions.some(p => p.code === code)
        );
        
        this.selectedActionPermissions = rolePermissions.filter(code => 
          this.actionPermissions.some(p => p.code === code)
        );
      } catch (error) {
        console.error('加载角色权限失败:', error);
        this.$message.error('加载角色权限失败');
      }
    },
    
    // 全选权限
    selectAllPermissions() {
      if (this.activePermissionTab === 'menu') {
        this.selectedMenuPermissions = this.menuPermissions.map(p => p.code);
      } else {
        this.selectedActionPermissions = this.actionPermissions.map(p => p.code);
      }
    },
    
    // 全不选权限
    unselectAllPermissions() {
      if (this.activePermissionTab === 'menu') {
        this.selectedMenuPermissions = [];
      } else {
        this.selectedActionPermissions = [];
      }
    },
    
    // 保存角色权限
    async saveRolePermissions() {
      if (!this.selectedRole) {
        this.$message.warning('请先选择一个角色');
        return;
      }
      
      try {
        // 构造权限列表
        const permissions = [
          ...this.selectedMenuPermissions,
          ...this.selectedActionPermissions
        ];
        
        // 调用后端API保存权限分配
        // await RBACService.assignPermissionsToRole(this.selectedRole.id, permissions);
        
        this.$message.success(`已成功为角色 "${this.selectedRole.role_name}" 分配权限`);
      } catch (error) {
        console.error('保存角色权限失败:', error);
        this.$message.error('保存角色权限失败');
      }
    },
    
    // 获取分类标签类型
    getCategoryTagType(category) {
      const types = {
        READ: 'primary',
        WRITE: 'success',
        DELETE: 'danger',
        SPECIAL: 'warning',
        MENU: 'info'
      };
      return types[category] || 'info';
    },
    
    // 获取分类标签
    getCategoryLabel(category) {
      const labels = {
        READ: '读取',
        WRITE: '写入',
        DELETE: '删除',
        SPECIAL: '特殊',
        MENU: '菜单'
      };
      return labels[category] || category;
    }
  }
}
</script>

<style scoped>
.role-permission-assignment {
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

.role-list-panel, .permission-assignment-panel {
  padding: 20px;
}

.role-list-panel {
  width: 300px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
}

.permission-assignment-panel {
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

.role-list-container {
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

.permission-assignment-content {
  flex: 1;
  overflow: auto;
}

.permission-category-filters {
  margin-bottom: 20px;
  padding: 0 10px;
}

.permission-grid {
  padding: 0 10px;
}

.permission-checkbox {
  width: 100%;
  margin-bottom: 15px;
}

.permission-item {
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #f9fafb;
  position: relative;
}

.permission-name {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
}

.permission-code {
  font-family: monospace;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.permission-desc {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 6px;
}

.permission-category-tag {
  position: absolute;
  top: 8px;
  right: 8px;
}
</style>