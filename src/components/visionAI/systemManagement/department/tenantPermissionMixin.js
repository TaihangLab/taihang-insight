/**
 * 租户权限控制混入
 * 提供多租户环境下的权限检查和控制方法
 */
import RBACService from '@/components/service/RBACService';

export default {
  data() {
    return {
      currentUser: null,        // 当前用户信息
      userTenants: [],          // 用户可访问的租户列表
      currentTenant: null,      // 当前选中的租户
      isSuperAdmin: false,      // 是否为超管
      userPermissions: []       // 用户权限列表
    }
  },
  
  async created() {
    await this.initializeTenantPermission();
  },
  
  methods: {
    /**
     * 初始化租户权限
     */
    async initializeTenantPermission() {
      try {
        // 获取当前用户信息
        this.currentUser = this.getCurrentUser();
        
        // 检查是否为超管
        this.isSuperAdmin = this.checkSuperAdmin();
        
        // 获取用户可访问的租户列表
        await this.loadUserTenants();
        
        // 设置当前租户
        this.setCurrentTenant();
        
        // 加载用户权限
        await this.loadUserPermissions();
      } catch (error) {
        console.error('初始化租户权限失败:', error);
        throw error;
      }
    },
    
    /**
     * 获取当前用户信息
     */
    getCurrentUser() {
      // 从localStorage或vuex中获取用户信息
      const userInfoStr = localStorage.getItem('userInfo');
      return userInfoStr ? JSON.parse(userInfoStr) : null;
    },
    
    /**
     * 检查是否为超管
     */
    checkSuperAdmin() {
      // 检查用户角色是否为超管
      if (!this.currentUser) return false;
      
      // 检查角色或权限标识
      return this.currentUser.roles?.includes('super_admin') || 
             this.currentUser.permissions?.includes('system:super_admin') ||
             this.currentUser.isSuperAdmin === true;
    },
    
    /**
     * 加载用户可访问的租户列表
     */
    async loadUserTenants() {
      try {
        if (this.isSuperAdmin) {
          // 超管可以访问所有租户
          // const response = await RBACService.getTenants();
          // this.userTenants = response.data.items || [];
          
          // 模拟数据
          this.userTenants = [
            { id: 1, tenantId: 'company_a', tenant_name: 'A公司', status: 1 },
            { id: 2, tenantId: 'company_b', tenant_name: 'B公司', status: 1 },
            { id: 3, tenantId: 'company_c', tenant_name: 'C公司', status: 1 }
          ];
        } else {
          // 普通用户只能访问所属租户
          // 从用户信息中获取租户ID
          const userTenantId = this.currentUser?.tenantId || localStorage.getItem('tenantId');
          if (userTenantId) {
            // const response = await RBACService.getTenantById(userTenantId);
            // this.userTenants = [response.data] || [];
            
            // 模拟数据
            this.userTenants = [{
              id: 1,
              tenantId: userTenantId,
              tenant_name: `${userTenantId}公司`,
              status: 1
            }];
          } else {
            this.userTenants = [];
          }
        }
      } catch (error) {
        console.error('加载用户租户列表失败:', error);
        this.userTenants = [];
        throw error;
      }
    },
    
    /**
     * 设置当前租户
     */
    setCurrentTenant() {
      if (this.userTenants.length === 0) {
        this.currentTenant = null;
        return;
      }
      
      // 优先使用之前保存的租户选择
      const savedTenantId = localStorage.getItem('selectedTenantId');
      if (savedTenantId && this.userTenants.some(t => t.tenantId === savedTenantId)) {
        this.currentTenant = this.userTenants.find(t => t.tenantId === savedTenantId);
        return;
      }
      
      // 否则使用第一个租户
      this.currentTenant = this.userTenants[0];
      
      // 保存选择
      localStorage.setItem('selectedTenantId', this.currentTenant.tenantId);
    },
    
    /**
     * 切换租户
     * @param {string} tenantId - 租户ID
     */
    async switchTenant(tenantId) {
      if (!this.canAccessTenant(tenantId)) {
        throw new Error('无权访问该租户');
      }
      
      const tenant = this.userTenants.find(t => t.tenantId === tenantId);
      if (tenant) {
        this.currentTenant = tenant;
        localStorage.setItem('selectedTenantId', tenantId);
        
        // 触发租户切换事件
        this.$emit && this.$emit('tenant-switched', tenant);
        
        return true;
      }
      
      return false;
    },
    
    /**
     * 检查用户是否有权限访问指定租户
     * @param {string} tenantId - 租户ID
     * @returns {boolean} 是否有权访问
     */
    canAccessTenant(tenantId) {
      if (this.isSuperAdmin) {
        // 超管可以访问任何租户
        return true;
      }
      
      // 普通用户只能访问自己的租户
      return this.userTenants.some(t => t.tenantId === tenantId);
    },
    
    /**
     * 检查当前用户是否为指定租户的管理员
     * @param {string} tenantId - 租户ID，默认为当前租户
     * @returns {boolean} 是否为租户管理员
     */
    isTenantAdmin(tenantId = null) {
      const targetTenantId = tenantId || this.currentTenant?.tenantId;
      if (!targetTenantId) return false;
      
      // 检查用户在该租户中的角色
      const userRoles = this.currentUser?.roles || [];
      return userRoles.some(role => 
        role.includes('admin') && 
        (role.includes(targetTenantId) || this.isSuperAdmin)
      );
    },
    
    /**
     * 加载用户权限
     */
    async loadUserPermissions() {
      if (!this.currentUser || !this.currentTenant) {
        this.userPermissions = [];
        return;
      }
      
      try {
        // 从后端获取用户权限
        // const response = await RBACService.getUserPermissions(
        //   this.currentUser.userId, 
        //   this.currentTenant.tenantId
        // );
        // this.userPermissions = response.data.items || [];
        
        // 模拟权限数据
        this.userPermissions = [
          'tenant:access',
          'department:create',
          'department:read',
          'department:update',
          'department:delete',
          'department:manage',
          'user:read',
          'user:create',
          'user:update',
          'user:delete'
        ];
      } catch (error) {
        console.error('加载用户权限失败:', error);
        this.userPermissions = [];
      }
    },
    
    /**
     * 检查用户是否拥有指定权限
     * @param {string} permission_code - 权限码
     * @returns {boolean} 是否拥有权限
     */
    hasPermission(permission_code) {
      return this.userPermissions.includes(permission_code);
    },
    
    /**
     * 检查用户是否拥有任意一个权限
     * @param {Array<string>} permissionCodes - 权限码数组
     * @returns {boolean} 是否拥有任一权限
     */
    hasAnyPermission(permissionCodes) {
      return permissionCodes.some(code => this.hasPermission(code));
    },
    
    /**
     * 检查用户是否拥有所有权限
     * @param {Array<string>} permissionCodes - 权限码数组
     * @returns {boolean} 是否拥有所有权限
     */
    hasAllPermissions(permissionCodes) {
      return permissionCodes.every(code => this.hasPermission(code));
    },
    
    /**
     * 检查是否可以进行跨租户操作
     * @returns {boolean} 是否可以跨租户操作
     */
    canCrossTenantOperation() {
      return this.isSuperAdmin;
    },
    
    /**
     * 根据租户权限过滤数据
     * @param {Array} data - 数据列表
     * @param {string} tenantField - 租户字段名，默认为'tenantId'
     * @returns {Array} 过滤后的数据
     */
    filterDataByTenant(data, tenantField = 'tenantId') {
      if (this.isSuperAdmin) {
        // 超管可以看到所有数据
        return data;
      }
      
      if (!this.currentTenant) {
        // 没有当前租户时返回空数组
        return [];
      }
      
      // 普通用户只能看到自己租户的数据
      return data.filter(item => item[tenantField] === this.currentTenant.tenantId);
    },
    
    /**
     * 验证数据是否属于当前租户
     * @param {Object} data - 数据对象
     * @param {string} tenantField - 租户字段名，默认为'tenantId'
     * @returns {boolean} 是否属于当前租户
     */
    isDataInCurrentTenant(data, tenantField = 'tenantId') {
      if (this.isSuperAdmin) {
        // 超管可以访问任何数据
        return true;
      }
      
      return data[tenantField] === this.currentTenant?.tenantId;
    },
    
    /**
     * 为数据添加租户标识
     * @param {Object} data - 数据对象
     * @param {string} tenantField - 租户字段名，默认为'tenantId'
     * @returns {Object} 添加租户标识后的数据
     */
    addTenantToData(data, tenantField = 'tenantId') {
      return {
        ...data,
        [tenantField]: this.currentTenant?.tenantId
      };
    }
  },
  
  computed: {
    /**
     * 当前租户ID
     */
    currentTenantId() {
      return this.currentTenant?.tenantId;
    },
    
    /**
     * 当前租户名称
     */
    currentTenantName() {
      return this.currentTenant?.tenant_name;
    },
    
    /**
     * 用户可访问的租户ID列表
     */
    accessibleTenantIds() {
      return this.userTenants.map(t => t.tenantId);
    },
    
    /**
     * 是否已选择租户
     */
    hasSelectedTenant() {
      return !!this.currentTenant;
    }
  }
}