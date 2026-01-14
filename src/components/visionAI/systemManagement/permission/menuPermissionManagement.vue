<template>
  <div class="menu-permission-management">
    <div class="page-header">
      <h2>菜单权限管理</h2>
      <p class="page-description">配置系统菜单与权限的对应关系</p>
    </div>

    <div class="main-content">
      <!-- 菜单树和权限配置区域 -->
      <div class="content-wrapper">
        <!-- 左侧菜单树 -->
        <div class="menu-tree-panel">
          <div class="panel-header">
            <h3>系统菜单</h3>
            <div class="panel-controls">
              <el-button size="mini" @click="expandAll">展开全部</el-button>
              <el-button size="mini" @click="collapseAll">收起全部</el-button>
            </div>
          </div>
          <div class="tree-container">
            <el-input
              v-model="filterText"
              placeholder="输入关键字进行过滤"
              size="small"
              prefix-icon="el-icon-search"
              class="tree-filter-input"
            />
            <el-tree
              ref="menuTree"
              :data="menuTreeData"
              :props="treeProps"
              :filter-node-method="filterNode"
              :expand-on-click-node="false"
              highlight-current
              @node-click="onMenuSelect"
              class="menu-tree"
            >
              <span class="tree-node-content" slot-scope="{ node, data }">
                <i :class="data.icon" class="tree-node-icon" v-if="data.icon"></i>
                <span class="tree-node-label">{{ node.label }}</span>
                <el-tag 
                  v-if="data.type" 
                  :type="getTypeTagType(data.type)"
                  size="mini"
                  class="tree-node-type"
                >
                  {{ getMenuTypeLabel(data.type) }}
                </el-tag>
              </span>
            </el-tree>
          </div>
        </div>

        <!-- 右侧权限配置 -->
        <div class="permission-config-panel" v-if="selectedMenu">
          <div class="panel-header">
            <h3>{{ selectedMenu.label }} - 权限配置</h3>
          </div>
          
          <div class="permission-config-content">
            <!-- 菜单权限 -->
            <div class="permission-section">
              <h4>菜单权限</h4>
              <div class="permission-list">
                <el-checkbox-group v-model="selectedMenuPermissions">
                  <el-row :gutter="20">
                    <el-col :span="12" v-for="perm in menuPermissions" :key="perm.code">
                      <el-checkbox 
                        :label="perm.code" 
                        :disabled="!canModifyPermission(perm)"
                      >
                        <div class="permission-item">
                          <div class="permission-name">{{ perm.name }}</div>
                          <div class="permission-code">{{ perm.code }}</div>
                          <div class="permission-desc">{{ perm.description }}</div>
                        </div>
                      </el-checkbox>
                    </el-col>
                  </el-row>
                </el-checkbox-group>
              </div>
            </div>

            <!-- 操作权限 -->
            <div class="permission-section">
              <h4>操作权限</h4>
              <div class="permission-list">
                <el-checkbox-group v-model="selectedActionPermissions">
                  <el-row :gutter="20">
                    <el-col :span="12" v-for="perm in actionPermissions" :key="perm.code">
                      <el-checkbox 
                        :label="perm.code" 
                        :disabled="!canModifyPermission(perm)"
                      >
                        <div class="permission-item">
                          <div class="permission-name">{{ perm.name }}</div>
                          <div class="permission-code">{{ perm.code }}</div>
                          <div class="permission-desc">{{ perm.description }}</div>
                          <el-tag 
                            :type="getCategoryTagType(perm.category)" 
                            size="mini" 
                            class="permission-category"
                          >
                            {{ getCategoryLabel(perm.category) }}
                          </el-tag>
                        </div>
                      </el-checkbox>
                    </el-col>
                  </el-row>
                </el-checkbox-group>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="permission-actions">
              <el-button type="primary" @click="savePermissionConfig">保存配置</el-button>
              <el-button @click="resetPermissionConfig">重置</el-button>
            </div>
          </div>
        </div>

        <!-- 提示信息：当未选择菜单时显示 -->
        <div class="no-selection-panel" v-else>
          <div class="no-selection-content">
            <i class="el-icon-info no-selection-icon"></i>
            <p class="no-selection-text">请选择左侧菜单以配置权限</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import RBACService from '@/components/service/RBACService';

export default {
  name: 'MenuPermissionManagement',
  data() {
    return {
      // 菜单树相关
      menuTreeData: [],
      treeProps: {
        children: 'children',
        label: 'label'
      },
      filterText: '',
      
      // 选中的菜单
      selectedMenu: null,
      
      // 权限相关
      allPermissions: [], // 所有权限列表
      selectedMenuPermissions: [], // 选中的菜单权限
      selectedActionPermissions: [], // 选中的操作权限
      menuPermissions: [], // 当前菜单可用的菜单权限
      actionPermissions: [], // 当前菜单可用的操作权限
    }
  },
  
  watch: {
    filterText(val) {
      this.$refs.menuTree.filter(val);
    }
  },
  
  async created() {
    await this.loadMenuTree();
    await this.loadAllPermissions();
  },
  
  methods: {
    // 加载菜单树
    async loadMenuTree() {
      try {
        // 这里应该从路由配置或其他地方获取菜单树结构
        // 模拟数据，实际应从系统配置中获取
        this.menuTreeData = [
          {
            id: 'monitoring',
            label: '监控预警',
            path: '/monitoring',
            icon: 'el-icon-video-camera',
            type: 'module',
            permissions: ['menu:monitoring:view'],
            children: [
              {
                id: 'realtime',
                label: '实时监控',
                path: '/monitoring/realtime',
                icon: 'el-icon-monitor',
                type: 'page',
                permissions: ['menu:monitoring:realtime:view'],
                actions: [
                  { id: 'read', name: '查看', code: 'monitoring:realtime:read', category: 'READ' },
                  { id: 'control', name: '控制', code: 'monitoring:realtime:control', category: 'WRITE' }
                ]
              },
              {
                id: 'statistics',
                label: '统计分析',
                path: '/monitoring/statistics',
                icon: 'el-icon-data-analysis',
                type: 'page',
                permissions: ['menu:monitoring:statistics:view'],
                actions: [
                  { id: 'read', name: '查看', code: 'monitoring:statistics:read', category: 'READ' },
                  { id: 'export', name: '导出', code: 'monitoring:statistics:export', category: 'SPECIAL' }
                ]
              }
            ]
          },
          {
            id: 'systemManage',
            label: '系统管理',
            path: '/systemManage',
            icon: 'el-icon-setting',
            type: 'module',
            permissions: ['menu:systemManage:view'],
            children: [
              {
                id: 'userManagement',
                label: '用户管理',
                path: '/systemManage/userManagement',
                icon: 'el-icon-user',
                type: 'page',
                permissions: ['menu:systemManage:userManagement:view'],
                actions: [
                  { id: 'read', name: '查看', code: 'system:user:read', category: 'READ' },
                  { id: 'create', name: '新增', code: 'system:user:create', category: 'WRITE' },
                  { id: 'update', name: '编辑', code: 'system:user:update', category: 'WRITE' },
                  { id: 'delete', name: '删除', code: 'system:user:delete', category: 'DELETE' },
                  { id: 'reset_password', name: '重置密码', code: 'system:user:reset_password', category: 'SPECIAL' },
                  { id: 'grant', name: '分配角色', code: 'system:user:grant', category: 'SPECIAL' }
                ]
              },
              {
                id: 'roleManagement',
                label: '角色管理',
                path: '/systemManage/roleManagement',
                icon: 'el-icon-s-custom',
                type: 'page',
                permissions: ['menu:systemManage:roleManagement:view'],
                actions: [
                  { id: 'read', name: '查看', code: 'system:role:read', category: 'READ' },
                  { id: 'create', name: '新增', code: 'system:role:create', category: 'WRITE' },
                  { id: 'update', name: '编辑', code: 'system:role:update', category: 'WRITE' },
                  { id: 'delete', name: '删除', code: 'system:role:delete', category: 'DELETE' },
                  { id: 'grant_permission', name: '分配权限', code: 'system:role:grant_permission', category: 'SPECIAL' }
                ]
              }
            ]
          }
        ];
      } catch (error) {
        console.error('加载菜单树失败:', error);
        this.$message.error('加载菜单树失败');
      }
    },
    
    // 加载所有权限
    async loadAllPermissions() {
      try {
        // 从后端获取所有权限列表
        // const response = await RBACService.getPermissions();
        // this.allPermissions = response.data.items || [];
        
        // 模拟权限数据
        this.allPermissions = [
          // 菜单权限
          { code: 'menu:monitoring:view', name: '监控预警菜单访问', description: '访问监控预警菜单的权限', category: 'MENU', type: 'menu' },
          { code: 'menu:monitoring:realtime:view', name: '实时监控页面访问', description: '访问实时监控页面的权限', category: 'MENU', type: 'menu' },
          { code: 'menu:monitoring:statistics:view', name: '统计分析页面访问', description: '访问统计分析页面的权限', category: 'MENU', type: 'menu' },
          { code: 'menu:systemManage:view', name: '系统管理菜单访问', description: '访问系统管理菜单的权限', category: 'MENU', type: 'menu' },
          { code: 'menu:systemManage:userManagement:view', name: '用户管理页面访问', description: '访问用户管理页面的权限', category: 'MENU', type: 'menu' },
          { code: 'menu:systemManage:roleManagement:view', name: '角色管理页面访问', description: '访问角色管理页面的权限', category: 'MENU', type: 'menu' },
          
          // 操作权限
          { code: 'monitoring:realtime:read', name: '查看实时监控', description: '查看实时监控数据的权限', category: 'READ', type: 'action' },
          { code: 'monitoring:realtime:control', name: '控制实时监控', description: '控制实时监控的权限', category: 'WRITE', type: 'action' },
          { code: 'monitoring:statistics:read', name: '查看统计分析', description: '查看统计分析数据的权限', category: 'READ', type: 'action' },
          { code: 'monitoring:statistics:export', name: '导出统计分析', description: '导出统计分析数据的权限', category: 'SPECIAL', type: 'action' },
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
          { code: 'system:role:grant_permission', name: '分配角色权限', description: '为角色分配权限的权限', category: 'SPECIAL', type: 'action' }
        ];
      } catch (error) {
        console.error('加载权限列表失败:', error);
        this.$message.error('加载权限列表失败');
      }
    },
    
    // 过滤树节点
    filterNode(value, data) {
      if (!value) return true;
      return data.label.indexOf(value) !== -1 || 
             (data.path && data.path.indexOf(value) !== -1) ||
             (data.id && data.id.indexOf(value) !== -1);
    },
    
    // 展开全部
    expandAll() {
      this.expandNode(this.menuTreeData, true);
    },
    
    // 收起全部
    collapseAll() {
      this.expandNode(this.menuTreeData, false);
    },
    
    // 展开或收起节点
    expandNode(nodes, expand) {
      nodes.forEach(node => {
        this.$refs.menuTree.store.nodesMap[node.id].expanded = expand;
        if (node.children) {
          this.expandNode(node.children, expand);
        }
      });
    },
    
    // 选中菜单
    onMenuSelect(menu) {
      this.selectedMenu = menu;
      this.loadPermissionConfigForMenu(menu);
    },
    
    // 加载菜单的权限配置
    loadPermissionConfigForMenu(menu) {
      // 加载菜单权限
      this.menuPermissions = this.allPermissions
        .filter(p => p.type === 'menu' && menu.permissions && menu.permissions.includes(p.code));
      
      // 加载操作权限
      this.actionPermissions = this.allPermissions
        .filter(p => p.type === 'action' && menu.actions && menu.actions.some(a => a.code === p.code));
      
      // 设置已选中的权限
      this.selectedMenuPermissions = menu.permissions ? [...menu.permissions] : [];
      this.selectedActionPermissions = menu.actions ? menu.actions.map(a => a.code) : [];
    },
    
    // 保存权限配置
    async savePermissionConfig() {
      if (!this.selectedMenu) {
        this.$message.warning('请先选择一个菜单');
        return;
      }
      
      try {
        // 这里应该调用后端API保存权限配置
        // await RBACService.updateMenuPermissions(this.selectedMenu.id, {
        //   menuPermissions: this.selectedMenuPermissions,
        //   actionPermissions: this.selectedActionPermissions
        // });
        
        // 更新本地数据
        this.selectedMenu.permissions = [...this.selectedMenuPermissions];
        if (this.selectedMenu.actions) {
          this.selectedMenu.actions = this.selectedMenu.actions.map(action => {
            const exists = this.selectedActionPermissions.includes(action.code);
            return { ...action, enabled: exists };
          });
        } else {
          this.selectedMenu.actions = this.allPermissions
            .filter(p => this.selectedActionPermissions.includes(p.code))
            .map(p => ({ code: p.code, name: p.name }));
        }
        
        this.$message.success('权限配置保存成功');
      } catch (error) {
        console.error('保存权限配置失败:', error);
        this.$message.error('保存权限配置失败');
      }
    },
    
    // 重置权限配置
    resetPermissionConfig() {
      if (this.selectedMenu) {
        this.loadPermissionConfigForMenu(this.selectedMenu);
      }
    },
    
    // 获取菜单类型标签
    getMenuTypeLabel(type) {
      const labels = {
        module: '模块',
        page: '页面',
        button: '按钮'
      };
      return labels[type] || type;
    },
    
    // 获取类型标签类型
    getTypeTagType(type) {
      const types = {
        module: 'primary',
        page: 'success',
        button: 'warning'
      };
      return types[type] || 'info';
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
    },
    
    // 检查是否可以修改权限
    canModifyPermission(permission) {
      // 这里可以根据用户权限判断是否可以修改特定权限
      // 暂时返回true，表示都可以修改
      return true;
    }
  }
}
</script>

<style scoped>
.menu-permission-management {
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
}

.content-wrapper {
  display: flex;
  min-height: 600px;
}

.menu-tree-panel, .permission-config-panel, .no-selection-panel {
  padding: 20px;
  border-right: 1px solid #e5e7eb;
}

.menu-tree-panel {
  width: 350px;
  background-color: #fafafa;
  display: flex;
  flex-direction: column;
}

.permission-config-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.no-selection-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
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

.panel-controls {
  display: flex;
  gap: 8px;
}

.tree-filter-input {
  margin-bottom: 16px;
}

.tree-container {
  flex: 1;
  overflow: auto;
}

.menu-tree {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.tree-node-content {
  flex: 1;
  display: flex;
  align-items: center;
  font-size: 14px;
}

.tree-node-icon {
  margin-right: 8px;
  width: 20px;
  text-align: center;
}

.tree-node-type {
  margin-left: 8px;
}

.permission-config-content {
  flex: 1;
  overflow-y: auto;
}

.permission-section {
  margin-bottom: 30px;
}

.permission-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.permission-list {
  padding: 0 10px;
}

.permission-item {
  padding: 8px;
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

.permission-category {
  position: absolute;
  top: 8px;
  right: 8px;
}

.permission-actions {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
  text-align: right;
}

.no-selection-content {
  text-align: center;
}

.no-selection-icon {
  font-size: 48px;
  color: #9ca3af;
  margin-bottom: 16px;
}

.no-selection-text {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}
</style>