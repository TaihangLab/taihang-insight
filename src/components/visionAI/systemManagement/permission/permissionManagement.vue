<template>
  <div class="permission-management">
    <div class="page-header">
      <h2>权限码管理</h2>
      <p class="page-description">管理系统中所有的权限码</p>
    </div>

    <div class="main-content">
      <!-- 搜索和操作区域 -->
      <div class="search-and-actions">
        <div class="search-section">
          <el-input
            v-model="searchQuery"
            placeholder="搜索权限码、名称或描述"
            prefix-icon="el-icon-search"
            clearable
            @keyup.enter.native="searchPermissions"
            style="width: 300px;"
          />
          <el-button type="primary" icon="el-icon-search" @click="searchPermissions">搜索</el-button>
        </div>
        <div class="actions-section">
          <el-button type="primary" icon="el-icon-plus" @click="openCreateDialog">新增权限</el-button>
          <el-button icon="el-icon-refresh" @click="refreshPermissions">刷新</el-button>
        </div>
      </div>

      <!-- 权限列表 -->
      <div class="permissions-table">
        <el-table
          :data="filteredPermissions"
          v-loading="loading"
          border
          stripe
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="code" label="权限码" min-width="200">
            <template slot-scope="scope">
              <el-tag type="info" size="medium">{{ scope.row.code }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="权限名称" min-width="150" />
          <el-table-column prop="description" label="描述" min-width="200" />
          <el-table-column prop="category" label="分类" width="120">
            <template slot-scope="scope">
              <el-tag :type="getCategoryTagType(scope.row.category)" size="small">
                {{ getCategoryLabel(scope.row.category) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="100">
            <template slot-scope="scope">
              <el-tag size="small">{{ getTypeLabel(scope.row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="resource" label="资源" width="120" />
          <el-table-column prop="action" label="操作" width="120" />
          <el-table-column label="操作" width="200" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="editPermission(scope.row)">编辑</el-button>
              <el-button type="text" size="small" @click="copyPermissionCode(scope.row.code)">复制</el-button>
              <el-button type="text" size="small" class="delete-btn" @click="deletePermission(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalPermissions"
        />
      </div>
    </div>

    <!-- 权限创建/编辑对话框 -->
    <el-dialog
      :title="isEditing ? '编辑权限' : '创建权限'"
      :visible.sync="permissionDialogVisible"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="permissionForm" :rules="permissionRules" ref="permissionForm" label-width="100px">
        <el-form-item label="权限码" prop="code">
          <el-input 
            v-model="permissionForm.code" 
            :disabled="isEditing"
            placeholder="如：system:user:read"
          />
          <div class="form-tip">权限码唯一标识，一旦创建不可修改</div>
        </el-form-item>
        <el-form-item label="权限名称" prop="name">
          <el-input v-model="permissionForm.name" placeholder="如：查看用户" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="permissionForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="权限的详细描述"
          />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="permissionForm.category" placeholder="选择权限分类" style="width: 100%;">
            <el-option label="读取权限" value="READ" />
            <el-option label="写入权限" value="WRITE" />
            <el-option label="删除权限" value="DELETE" />
            <el-option label="特殊权限" value="SPECIAL" />
            <el-option label="菜单权限" value="MENU" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="permissionForm.type" placeholder="选择权限类型" style="width: 100%;">
            <el-option label="菜单" value="menu" />
            <el-option label="操作" value="action" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源" prop="resource">
          <el-input v-model="permissionForm.resource" placeholder="如：user, role, permission" />
        </el-form-item>
        <el-form-item label="操作" prop="action">
          <el-input v-model="permissionForm.action" placeholder="如：read, create, update, delete" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePermission">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import RBACService from '@/components/service/RBACService';

export default {
  name: 'PermissionManagement',
  data() {
    return {
      // 权限列表相关
      permissions: [],
      filteredPermissions: [],
      loading: false,
      selectedPermissions: [],
      
      // 分页相关
      currentPage: 1,
      pageSize: 10,
      totalPermissions: 0,
      
      // 搜索相关
      searchQuery: '',
      
      // 权限表单相关
      permissionDialogVisible: false,
      isEditing: false,
      permissionForm: {
        code: '',
        name: '',
        description: '',
        category: '',
        type: '',
        resource: '',
        action: ''
      },
      
      // 表单验证规则
      permissionRules: {
        code: [
          { required: true, message: '请输入权限码', trigger: 'blur' },
          { min: 5, max: 100, message: '权限码长度应在5到100个字符之间', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入权限名称', trigger: 'blur' },
          { min: 2, max: 50, message: '权限名称长度应在2到50个字符之间', trigger: 'blur' }
        ],
        category: [
          { required: true, message: '请选择权限分类', trigger: 'change' }
        ],
        type: [
          { required: true, message: '请选择权限类型', trigger: 'change' }
        ]
      }
    }
  },
  
  async created() {
    await this.loadPermissions();
  },
  
  methods: {
    // 加载权限列表
    async loadPermissions() {
      this.loading = true;
      try {
        // 从后端获取权限列表
        // const response = await RBACService.getPermissions();
        // this.permissions = response.data.items || [];
        // this.totalPermissions = response.data.total || this.permissions.length;
        
        // 模拟数据
        this.permissions = [
          { code: 'menu:monitoring:view', name: '监控预警菜单访问', description: '访问监控预警菜单的权限', category: 'MENU', type: 'menu', resource: 'monitoring', action: 'view' },
          { code: 'menu:systemManage:view', name: '系统管理菜单访问', description: '访问系统管理菜单的权限', category: 'MENU', type: 'menu', resource: 'system', action: 'view' },
          { code: 'system:user:read', name: '查看用户', description: '查看用户信息的权限', category: 'READ', type: 'action', resource: 'user', action: 'read' },
          { code: 'system:user:create', name: '新增用户', description: '新增用户的权限', category: 'WRITE', type: 'action', resource: 'user', action: 'create' },
          { code: 'system:user:update', name: '编辑用户', description: '编辑用户信息的权限', category: 'WRITE', type: 'action', resource: 'user', action: 'update' },
          { code: 'system:user:delete', name: '删除用户', description: '删除用户的权限', category: 'DELETE', type: 'action', resource: 'user', action: 'delete' },
          { code: 'system:user:reset_password', name: '重置用户密码', description: '重置用户密码的权限', category: 'SPECIAL', type: 'action', resource: 'user', action: 'reset_password' },
          { code: 'system:role:read', name: '查看角色', description: '查看角色信息的权限', category: 'READ', type: 'action', resource: 'role', action: 'read' },
          { code: 'system:role:create', name: '新增角色', description: '新增角色的权限', category: 'WRITE', type: 'action', resource: 'role', action: 'create' },
          { code: 'system:role:update', name: '编辑角色', description: '编辑角色信息的权限', category: 'WRITE', type: 'action', resource: 'role', action: 'update' },
          { code: 'system:role:delete', name: '删除角色', description: '删除角色的权限', category: 'DELETE', type: 'action', resource: 'role', action: 'delete' },
          { code: 'system:permission:read', name: '查看权限', description: '查看权限信息的权限', category: 'READ', type: 'action', resource: 'permission', action: 'read' },
          { code: 'system:permission:create', name: '新增权限', description: '新增权限的权限', category: 'WRITE', type: 'action', resource: 'permission', action: 'create' },
          { code: 'system:permission:update', name: '编辑权限', description: '编辑权限信息的权限', category: 'WRITE', type: 'action', resource: 'permission', action: 'update' },
          { code: 'system:permission:delete', name: '删除权限', description: '删除权限的权限', category: 'DELETE', type: 'action', resource: 'permission', action: 'delete' }
        ];
        
        this.totalPermissions = this.permissions.length;
        this.applyFilters();
      } catch (error) {
        console.error('加载权限列表失败:', error);
        this.$message.error('加载权限列表失败');
      } finally {
        this.loading = false;
      }
    },
    
    // 应用过滤器
    applyFilters() {
      let result = this.permissions;
      
      // 应用搜索过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        result = result.filter(perm => 
          perm.code.toLowerCase().includes(query) ||
          perm.name.toLowerCase().includes(query) ||
          (perm.description && perm.description.toLowerCase().includes(query))
        );
      }
      
      // 应用分页
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      this.filteredPermissions = result.slice(start, end);
      this.totalPermissions = result.length;
    },
    
    // 搜索权限
    searchPermissions() {
      this.currentPage = 1;
      this.applyFilters();
    },
    
    // 刷新权限列表
    refreshPermissions() {
      this.searchQuery = '';
      this.currentPage = 1;
      this.loadPermissions();
    },
    
    // 处理每页大小变化
    handleSizeChange(size) {
      this.pageSize = size;
      this.currentPage = 1;
      this.applyFilters();
    },
    
    // 处理当前页变化
    handleCurrentChange(page) {
      this.currentPage = page;
      this.applyFilters();
    },
    
    // 处理选择变化
    handleSelectionChange(selection) {
      this.selectedPermissions = selection;
    },
    
    // 打开创建对话框
    openCreateDialog() {
      this.isEditing = false;
      this.permissionForm = {
        code: '',
        name: '',
        description: '',
        category: '',
        type: '',
        resource: '',
        action: ''
      };
      this.permissionDialogVisible = true;
    },
    
    // 编辑权限
    editPermission(permission) {
      this.isEditing = true;
      this.permissionForm = { ...permission };
      this.permissionDialogVisible = true;
    },
    
    // 复制权限码
    copyPermissionCode(code) {
      this.$copyText(code).then(() => {
        this.$message.success('权限码已复制到剪贴板');
      }).catch(() => {
        this.$message.error('复制失败');
      });
    },
    
    // 保存权限
    async savePermission() {
      this.$refs.permissionForm.validate(async (valid) => {
        if (!valid) {
          return;
        }
        
        try {
          if (this.isEditing) {
            // 更新权限
            // await RBACService.updatePermission(this.permissionForm.code, this.permissionForm);
            this.$message.success('权限更新成功');
          } else {
            // 创建权限
            // await RBACService.addPermission(this.permissionForm);
            this.permissions.push({ ...this.permissionForm });
            this.$message.success('权限创建成功');
          }
          
          this.permissionDialogVisible = false;
          this.refreshPermissions();
        } catch (error) {
          console.error('保存权限失败:', error);
          this.$message.error('保存权限失败');
        }
      });
    },
    
    // 删除权限
    deletePermission(permission) {
      this.$confirm(`确定要删除权限 "${permission.name}" 吗？`, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          // 从后端删除权限
          // await RBACService.deletePermission(permission.code);
          
          // 从本地列表中移除
          this.permissions = this.permissions.filter(p => p.code !== permission.code);
          this.$message.success('权限删除成功');
          this.refreshPermissions();
        } catch (error) {
          console.error('删除权限失败:', error);
          this.$message.error('删除权限失败');
        }
      }).catch(() => {
        // 用户取消删除
      });
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
    
    // 获取类型标签
    getTypeLabel(type) {
      const labels = {
        menu: '菜单',
        action: '操作'
      };
      return labels[type] || type;
    }
  }
}
</script>

<style scoped>
.permission-management {
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
  padding: 20px;
}

.search-and-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.search-section {
  display: flex;
  gap: 10px;
}

.actions-section {
  display: flex;
  gap: 10px;
}

.permissions-table {
  margin-bottom: 20px;
}

.pagination-section {
  text-align: right;
}

.delete-btn {
  color: #f56c6c;
}

.delete-btn:hover {
  color: #ff8d8d;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.dialog-footer {
  text-align: right;
}
</style>