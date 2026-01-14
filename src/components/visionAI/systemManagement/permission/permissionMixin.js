/**
 * 权限控制混入
 * 提供权限检查和控制的相关方法
 */
import RBACService from '@/components/service/RBACService';

export default {
  data() {
    return {
      userPermissions: [] // 用户拥有的权限列表
    }
  },
  
  async created() {
    await this.loadUserPermissions();
  },
  
  methods: {
    /**
     * 加载用户权限
     */
    async loadUserPermissions() {
      try {
        // 获取当前用户ID（这里需要根据实际情况获取）
        const userId = localStorage.getItem('userId') || 'default';
        const tenantId = localStorage.getItem('tenantId') || 'default';
        
        // 从后端获取用户权限列表
        // const response = await RBACService.getUserPermissions(userId, tenantId);
        // this.userPermissions = response.data.items || [];
        
        // 模拟权限数据
        this.userPermissions = [
          'menu:systemManage:view',
          'menu:systemManage:userManagement:view',
          'system:user:read',
          'system:user:create',
          'system:user:update',
          'system:user:delete',
          'system:user:reset_password',
          'system:user:grant',
          'menu:systemManage:roleManagement:view',
          'system:role:read',
          'system:role:create',
          'system:role:update',
          'system:role:delete',
          'system:role:grant_permission'
        ];
      } catch (error) {
        console.error('加载用户权限失败:', error);
        this.userPermissions = []; // 初始化为空数组
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
     * 根据权限过滤菜单
     * @param {Array} menus - 菜单数组
     * @returns {Array} 过滤后的菜单数组
     */
    filterMenusByPermission(menus) {
      return menus.filter(menu => {
        // 如果菜单有权限要求，检查用户是否拥有权限
        if (menu.permissions && menu.permissions.length > 0) {
          if (!this.hasAnyPermission(menu.permissions)) {
            return false;
          }
        }
        
        // 递归过滤子菜单
        if (menu.children && menu.children.length > 0) {
          menu.children = this.filterMenusByPermission(menu.children);
        }
        
        // 如果是叶子节点且没有权限要求，或者有子节点，则保留
        return true;
      }).filter(menu => {
        // 过滤掉没有子项的空菜单
        return (menu.children && menu.children.length > 0) || !menu.children;
      });
    },
    
    /**
     * 根据权限显示/隐藏元素的指令
     */
    permissionDirective: {
      bind(el, binding) {
        const permission_code = binding.value;
        const hasPermission = this.hasPermission(permission_code);
        
        if (!hasPermission) {
          el.style.display = 'none';
        }
      },
      update(el, binding) {
        const permission_code = binding.value;
        const hasPermission = this.hasPermission(permission_code);
        
        if (hasPermission) {
          el.style.display = '';
        } else {
          el.style.display = 'none';
        }
      }
    }
  },
  
  computed: {
    /**
     * 检查是否有系统管理权限
     */
    hasSystemManagePermission() {
      return this.hasPermission('menu:systemManage:view');
    },
    
    /**
     * 检查是否有用户管理权限
     */
    hasUserManagePermission() {
      return this.hasPermission('menu:systemManage:userManagement:view');
    },
    
    /**
     * 检查是否有角色管理权限
     */
    hasRoleManagePermission() {
      return this.hasPermission('menu:systemManage:roleManagement:view');
    }
  }
}