import MockRBACService from './rbac/mockRBACService';
import cacheManager from '@/utils/cacheManager';

// 尝试导入真实服务，如果失败则使用模拟服务
let hasRealServices = false;
let UserService, RoleService, DepartmentService, PositionService, TenantService, PermissionService, AssociationService;

try {
  // 尝试导入真实服务
  UserService = require('./rbac/userService').default;
  RoleService = require('./rbac/roleService').default;
  DepartmentService = require('./rbac/departmentService').default;
  PositionService = require('./rbac/positionService').default;
  TenantService = require('./rbac/tenantService').default;
  PermissionService = require('./rbac/permissionService').default;
  AssociationService = require('./rbac/associationService').default;

  hasRealServices = true;
} catch (error) {
  console.warn('⚠️ 真实RBAC服务不可用，使用模拟服务:', error.message);
  hasRealServices = false;
}

// RBAC服务类 - 整合所有RBAC相关服务
class RBACService {
  constructor() {
    if (hasRealServices) {
      // 使用真实服务
      // 用户管理API - 使用包装函数以保持正确的 this 上下文并集成缓存
      this.getUsers = this._createCachedFunction(UserService.getUsers, 'users_list');
      this.createUser = (...args) => {
        // 创建用户后清除相关缓存
        const result = UserService.createUser.apply(UserService, args);
        cacheManager.delete('users_list');
        return result;
      };
      this.updateUser = (...args) => {
        // 更新用户后清除相关缓存
        const result = UserService.updateUser.apply(UserService, args);
        cacheManager.delete('users_list');
        return result;
      };
      this.deleteUser = (...args) => {
        // 删除用户后清除相关缓存
        const result = UserService.deleteUser.apply(UserService, args);
        cacheManager.delete('users_list');
        return result;
      };
      this.resetUserPassword = UserService.resetUserPassword;
      this.getUserRoles = UserService.getUserRoles;

      // 角色管理API - 使用包装函数以保持正确的 this 上下文并集成缓存
      this.getRoles = this._createCachedFunction(RoleService.getRoles, 'roles_list');
      this.createRole = (...args) => {
        // 创建角色后清除相关缓存
        const result = RoleService.createRole.apply(RoleService, args);
        cacheManager.delete('roles_list');
        return result;
      };
      this.updateRole = (...args) => {
        // 更新角色后清除相关缓存
        const result = RoleService.updateRole.apply(RoleService, args);
        cacheManager.delete('roles_list');
        return result;
      };
      this.deleteRole = (...args) => {
        // 删除角色后清除相关缓存
        const result = RoleService.deleteRole.apply(RoleService, args);
        cacheManager.delete('roles_list');
        return result;
      };
      this.getRolePermissions = RoleService.getRolePermissions;

      // 部门管理API - 使用包装函数以保持正确的 this 上下文并集成缓存
      this.getDepartments = this._createCachedFunction(DepartmentService.getDepartments, 'departments_list');
      this.getDepartmentTree = this._createCachedFunction(DepartmentService.getDepartmentTree, 'departments_tree');
      this.createDepartment = (...args) => {
        // 创建部门后清除相关缓存
        const result = DepartmentService.createDepartment.apply(DepartmentService, args);
        cacheManager.delete('departments_list');
        cacheManager.delete('departments_tree');
        return result;
      };
      this.updateDepartment = (...args) => {
        // 更新部门后清除相关缓存
        const result = DepartmentService.updateDepartment.apply(DepartmentService, args);
        cacheManager.delete('departments_list');
        cacheManager.delete('departments_tree');
        return result;
      };
      this.deleteDepartment = (...args) => {
        // 删除部门后清除相关缓存
        const result = DepartmentService.deleteDepartment.apply(DepartmentService, args);
        cacheManager.delete('departments_list');
        cacheManager.delete('departments_tree');
        return result;
      };

      // 岗位管理API - 使用包装函数以保持正确的 this 上下文并集成缓存
      this.getPositions = this._createCachedFunction(PositionService.getPositions, 'positions_list');
      this.createPosition = (...args) => {
        // 创建岗位后清除相关缓存
        const result = PositionService.createPosition.apply(PositionService, args);
        cacheManager.delete('positions_list');
        return result;
      };
      this.updatePosition = (...args) => {
        // 更新岗位后清除相关缓存
        const result = PositionService.updatePosition.apply(PositionService, args);
        cacheManager.delete('positions_list');
        return result;
      };
      this.deletePosition = (...args) => {
        // 删除岗位后清除相关缓存
        const result = PositionService.deletePosition.apply(PositionService, args);
        cacheManager.delete('positions_list');
        return result;
      };

      // 租户管理API - 使用包装函数以保持正确的 this 上下文并集成缓存
      this.getTenants = this._createCachedFunction(TenantService.getTenants, 'tenants_list');
      this.createTenant = (...args) => {
        // 创建租户后清除缓存
        const result = TenantService.createTenant.apply(TenantService, args);
        cacheManager.delete('tenants_list');
        return result;
      };
      this.updateTenant = (...args) => {
        // 更新租户后清除缓存
        const result = TenantService.updateTenant.apply(TenantService, args);
        cacheManager.delete('tenants_list');
        return result;
      };
      this.deleteTenant = (...args) => {
        // 删除租户后清除缓存
        const result = TenantService.deleteTenant.apply(TenantService, args);
        cacheManager.delete('tenants_list');
        return result;
      };

      // 权限管理API - 使用包装函数以保持正确的 this 上下文并集成缓存
      this.getPermissions = this._createCachedFunction(PermissionService.getPermissions, 'permissions_list');
      this.addPermission = (...args) => {
        // 添加权限后清除相关缓存
        const result = PermissionService.addPermission.apply(PermissionService, args);
        cacheManager.delete('permissions_list');
        return result;
      };
      this.updatePermission = (...args) => {
        // 更新权限后清除相关缓存
        const result = PermissionService.updatePermission.apply(PermissionService, args);
        cacheManager.delete('permissions_list');
        return result;
      };
      this.deletePermission = (...args) => {
        // 删除权限后清除相关缓存
        const result = PermissionService.deletePermission.apply(PermissionService, args);
        cacheManager.delete('permissions_list');
        return result;
      };
      this.updatePermissionStatus = (...args) => {
        // 更新权限状态后清除相关缓存
        const result = PermissionService.updatePermissionStatus.apply(PermissionService, args);
        cacheManager.delete('permissions_list');
        return result;
      };
      this.getRolesByPermission = PermissionService.getRolesByPermission;

      // 关联管理API
      this.assignRoleToUser = AssociationService.assignRoleToUser;
      this.assignRolesToUser = AssociationService.assignRolesToUser;
      this.removeUserRole = AssociationService.removeUserRole;
      this.getUsersByRole = this._createCachedFunction(AssociationService.getUsersByRole, 'users_by_role');
      this.assignPermissionToRole = (...args) => {
        // 分配权限给角色后清除相关缓存
        const result = AssociationService.assignPermissionToRole.apply(AssociationService, args);
        cacheManager.delete('users_by_role');
        cacheManager.delete('roles_list'); // 可能影响角色权限
        return result;
      };
      this.removeRolePermission = (...args) => {
        // 移除角色权限后清除相关缓存
        const result = AssociationService.removeRolePermission.apply(AssociationService, args);
        cacheManager.delete('users_by_role');
        cacheManager.delete('roles_list'); // 可能影响角色权限
        return result;
      };
      this.checkUserPermission = AssociationService.checkUserPermission;
      this.getUserPermissions = AssociationService.getUserPermissions;
    } else {
      // 使用模拟服务
      // 用户管理API
      this.getUsers = MockRBACService.getUsers.bind(MockRBACService);
      this.createUser = MockRBACService.createUser.bind(MockRBACService);
      this.updateUser = MockRBACService.updateUser.bind(MockRBACService);
      this.deleteUser = MockRBACService.deleteUser.bind(MockRBACService);
      this.resetUserPassword = MockRBACService.resetUserPassword.bind(MockRBACService);
      this.getUserRoles = MockRBACService.getUserRoles.bind(MockRBACService);

      // 角色管理API
      this.getRoles = MockRBACService.getRoles.bind(MockRBACService);
      this.createRole = MockRBACService.createRole.bind(MockRBACService);
      this.updateRole = MockRBACService.updateRole.bind(MockRBACService);
      this.deleteRole = MockRBACService.deleteRole.bind(MockRBACService);
      this.getRolePermissions = MockRBACService.getRolePermissions.bind(MockRBACService);

      // 部门管理API
      this.getDepartments = MockRBACService.getDepartments.bind(MockRBACService);
      this.getDepartmentTree = MockRBACService.getDepartmentTree.bind(MockRBACService);
      this.createDepartment = MockRBACService.createDepartment.bind(MockRBACService);
      this.updateDepartment = MockRBACService.updateDepartment.bind(MockRBACService);
      this.deleteDepartment = MockRBACService.deleteDepartment.bind(MockRBACService);

      // 岗位管理API
      this.getPositions = MockRBACService.getPositions.bind(MockRBACService);
      this.createPosition = MockRBACService.createPosition.bind(MockRBACService);
      this.updatePosition = MockRBACService.updatePosition.bind(MockRBACService);
      this.deletePosition = MockRBACService.deletePosition.bind(MockRBACService);

      // 租户管理API
      this.getTenants = MockRBACService.getTenants.bind(MockRBACService);
      this.createTenant = MockRBACService.createTenant.bind(MockRBACService);
      this.updateTenant = MockRBACService.updateTenant.bind(MockRBACService);
      this.deleteTenant = MockRBACService.deleteTenant.bind(MockRBACService);

      // 权限管理API
      this.getPermissions = MockRBACService.getPermissions.bind(MockRBACService);
      this.addPermission = MockRBACService.addPermission.bind(MockRBACService);
      this.updatePermission = MockRBACService.updatePermission.bind(MockRBACService);
      this.deletePermission = MockRBACService.deletePermission.bind(MockRBACService);
      this.updatePermissionStatus = MockRBACService.updatePermissionStatus.bind(MockRBACService);
      this.getRolesByPermission = MockRBACService.getRolesByPermission.bind(MockRBACService);

      // 关联管理API
      this.assignRoleToUser = MockRBACService.assignRoleToUser.bind(MockRBACService);
      this.assignRolesToUser = MockRBACService.assignRolesToUser.bind(MockRBACService);
      this.removeUserRole = MockRBACService.removeUserRole.bind(MockRBACService);
      this.getUsersByRole = MockRBACService.getUsersByRole.bind(MockRBACService);
      this.assignPermissionToRole = MockRBACService.assignPermissionToRole.bind(MockRBACService);
      this.removeRolePermission = MockRBACService.removeRolePermission.bind(MockRBACService);
      this.checkUserPermission = MockRBACService.checkUserPermission.bind(MockRBACService);
      this.getUserPermissions = MockRBACService.getUserPermissions.bind(MockRBACService);
    }
  }

  /**
   * 创建带缓存的函数包装器
   * @param {Function} fn - 原始函数
   * @param {string} cacheKey - 缓存键
   * @param {number} ttl - 缓存时间（毫秒）
   * @returns {Function} 包装后的函数
   */
  _createCachedFunction(fn, cacheKey, ttl) {
    return async (...args) => {
      // 生成基于参数的缓存键
      const params = args[0] || {};
      const paramStr = JSON.stringify(params);
      const fullCacheKey = `${cacheKey}_${paramStr}`;

      // 尝试从缓存获取
      const cachedResult = cacheManager.get(fullCacheKey);
      if (cachedResult) {
        console.log(`[RBACService] 从缓存获取 ${cacheKey} 数据`);
        return cachedResult;
      }

      // 调用原始函数获取数据
      console.log(`[RBACService] 从服务器获取 ${cacheKey} 数据`);
      const result = await fn.apply(null, args);

      // 存储到缓存
      cacheManager.set(fullCacheKey, result, ttl || 10 * 60 * 1000); // 默认10分钟

      return result;
    };
  }
}

// 创建一个实例并导出
const rbacServiceInstance = new RBACService();

// 导出静态方法以保持原有调用方式
export default {
  // 用户管理API
  getUsers: rbacServiceInstance.getUsers,
  createUser: rbacServiceInstance.createUser,
  updateUser: rbacServiceInstance.updateUser,
  deleteUser: rbacServiceInstance.deleteUser,
  resetUserPassword: rbacServiceInstance.resetUserPassword,
  getUserRoles: rbacServiceInstance.getUserRoles,

  // 角色管理API
  getRoles: rbacServiceInstance.getRoles,
  createRole: rbacServiceInstance.createRole,
  updateRole: rbacServiceInstance.updateRole,
  deleteRole: rbacServiceInstance.deleteRole,
  getRolePermissions: rbacServiceInstance.getRolePermissions,

  // 部门管理API
  getDepartments: rbacServiceInstance.getDepartments,
  getDepartmentTree: rbacServiceInstance.getDepartmentTree,
  createDepartment: rbacServiceInstance.createDepartment,
  updateDepartment: rbacServiceInstance.updateDepartment,
  deleteDepartment: rbacServiceInstance.deleteDepartment,

  // 岗位管理API
  getPositions: rbacServiceInstance.getPositions,
  createPosition: rbacServiceInstance.createPosition,
  updatePosition: rbacServiceInstance.updatePosition,
  deletePosition: rbacServiceInstance.deletePosition,

  // 租户管理API
  getTenants: rbacServiceInstance.getTenants,
  createTenant: rbacServiceInstance.createTenant,
  updateTenant: rbacServiceInstance.updateTenant,
  deleteTenant: rbacServiceInstance.deleteTenant,

  // 权限管理API
  getPermissions: rbacServiceInstance.getPermissions,
  addPermission: rbacServiceInstance.addPermission,
  updatePermission: rbacServiceInstance.updatePermission,
  deletePermission: rbacServiceInstance.deletePermission,
  updatePermissionStatus: rbacServiceInstance.updatePermissionStatus,
  getRolesByPermission: rbacServiceInstance.getRolesByPermission,

  // 关联管理API
  assignRoleToUser: rbacServiceInstance.assignRoleToUser,
  assignRolesToUser: rbacServiceInstance.assignRolesToUser,
  removeUserRole: rbacServiceInstance.removeUserRole,
  getUsersByRole: rbacServiceInstance.getUsersByRole,
  assignPermissionToRole: rbacServiceInstance.assignPermissionToRole,
  removeRolePermission: rbacServiceInstance.removeRolePermission,
  checkUserPermission: rbacServiceInstance.checkUserPermission,
  getUserPermissions: rbacServiceInstance.getUserPermissions,

  // 缓存管理方法
  clearCache: () => {
    cacheManager.clear();
  },
  getCacheStats: () => {
    return cacheManager.getStats();
  },
  // 直接暴露缓存管理器以供更细粒度的控制
  cacheManager
};