import MockRBACService from './rbac/mockRBACService';

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

// 缓存管理器
const cacheManager = {
  cache: new Map(),

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  },

  set(key, value, ttl = 600000) { // 默认10分钟过期
    this.cache.set(key, {
      value: value,
      timestamp: Date.now(),
      ttl: ttl
    });
  },

  delete(key) {
    this.cache.delete(key);
  },

  clear() {
    this.cache.clear();
  },

  // 清理过期缓存
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
};

// RBAC服务类 - 整合所有RBAC相关服务
class RBACService {
  constructor() {
    if (hasRealServices) {
      // 使用真实服务
      // 用户管理API - 直接调用，无缓存
      this.getUsers = UserService.getUsers;
      this.createUser = UserService.createUser;
      this.updateUser = UserService.updateUser;
      this.deleteUser = UserService.deleteUser;
      this.deleteUsers = UserService.deleteUsers;
      this.resetUserPassword = UserService.resetUserPassword;
      this.getUserRoles = UserService.getUserRoles;

      // 角色管理API - 直接调用，无缓存
      this.getRoles = RoleService.getRoles;
      this.createRole = RoleService.createRole;
      this.updateRole = RoleService.updateRole;
      this.deleteRole = RoleService.deleteRole;
      this.getRolePermissions = RoleService.getRolePermissions;

      // 部门管理API - 直接调用，无缓存
      this.getDepartments = DepartmentService.getDepartments;
      this.getDepartmentTree = DepartmentService.getDepartmentTree;

      // 部门管理API - 直接调用，不带自动缓存失效
      this.createDepartment = DepartmentService.createDepartment;
      this.updateDepartment = DepartmentService.updateDepartment;
      this.deleteDepartment = DepartmentService.deleteDepartment;

      // 部门管理API - 带缓存的版本
      this.getDepartmentTreeWithCache = async (params = {}) => {
        // 生成缓存键
        const cacheKey = `depts_tree_${JSON.stringify(params)}`;

        // 尝试从缓存获取
        let cachedResult = cacheManager.get(cacheKey);
        if (cachedResult) {
          console.log(`[RBACService] 从缓存获取部门树数据: ${cacheKey}`);
          return cachedResult;
        }

        console.log(`[RBACService] 从服务器获取部门树数据: ${cacheKey}`);

        // 从服务器获取数据
        const result = await DepartmentService.getDepartmentTree(params);

        // 存入缓存（默认10分钟过期）
        cacheManager.set(cacheKey, result);

        return result;
      };

      // 部门管理API - 根据租户ID和状态获取部门树（带缓存）
      this.getDepartmentTreeByTenantAndStatus = async (tenantId, status = 0) => {
        // 生成缓存键
        const cacheKey = `depts_tree_tenant_${tenantId}_status_${status}`;

        // 尝试从缓存获取
        let cachedResult = cacheManager.get(cacheKey);
        if (cachedResult) {
          console.log(`[RBACService] 从缓存获取部门树数据: ${cacheKey}`);
          return cachedResult;
        }

        console.log(`[RBACService] 从服务器获取部门树数据: ${cacheKey}`);

        // 从服务器获取数据
        const result = await DepartmentService.getDepartmentTreeByTenantAndStatus(tenantId, status);

        // 存入缓存（默认10分钟过期）
        cacheManager.set(cacheKey, result);

        return result;
      };

      // 部门管理API - 缓存失效相关方法
      this.invalidateDepartmentCache = (params = {}) => {
        // 生成对应的缓存键并删除
        const cacheKey = `depts_tree_${JSON.stringify(params)}`;
        cacheManager.delete(cacheKey);
        console.log(`[RBACService] 已使部门树缓存失效: ${cacheKey}`);
      };

      this.clearAllDepartmentCache = () => {
        // 清除所有部门相关的缓存
        for (const key of cacheManager.cache.keys()) {
          if (key.startsWith('depts_tree_')) {
            cacheManager.delete(key);
          }
        }
        console.log('[RBACService] 已清除所有部门树缓存');
      };

      this.clearAllTenantCache = () => {
        // 清除所有租户相关的缓存
        for (const key of cacheManager.cache.keys()) {
          if (key.startsWith('tenants_') || key === 'tenants_list') {
            cacheManager.delete(key);
          }
        }
        console.log('[RBACService] 已清除所有租户缓存');
      };

      this.clearAllCache = () => {
        // 清除所有缓存
        cacheManager.clear();
        console.log('[RBACService] 已清除所有缓存');
      };

      // 岗位管理API - 直接调用，无缓存
      this.getPositions = PositionService.getPositions;
      this.createPosition = PositionService.createPosition;
      this.updatePosition = PositionService.updatePosition;
      this.deletePosition = PositionService.deletePosition;

      // 租户管理API - 不使用缓存，每次直接从服务器获取数据
      this.getTenants = async (...args) => {
        // 直接调用原始函数，不使用缓存
        console.log(`[RBACService] 从服务器获取 tenants_list 数据`);
        return await TenantService.getTenants.apply(TenantService, args);
      };
      this.createTenant = async (...args) => {
        try {
          // 创建租户
          const result = await TenantService.createTenant.apply(TenantService, args);
          // 创建租户后清除相关缓存
          cacheManager.delete('tenants_list');
          return result;
        } catch (error) {
          // 确保错误被正确抛出以供上层处理
          throw error;
        }
      };
      this.updateTenant = async (...args) => {
        try {
          // 更新租户
          const result = await TenantService.updateTenant.apply(TenantService, args);
          // 更新租户后清除相关缓存
          cacheManager.delete('tenants_list');
          return result;
        } catch (error) {
          // 确保错误被正确抛出以供上层处理
          throw error;
        }
      };
      this.deleteTenant = async (...args) => {
        try {
          // 删除租户
          const result = await TenantService.deleteTenant.apply(TenantService, args);
          // 删除租户后清除相关缓存
          cacheManager.delete('tenants_list');
          return result;
        } catch (error) {
          // 确保错误被正确抛出以供上层处理
          throw error;
        }
      };
      this.batchDeleteTenants = async (...args) => {
        try {
          // 批量删除租户
          const result = await TenantService.batchDeleteTenants.apply(TenantService, args);
          // 批量删除租户后清除相关缓存
          cacheManager.delete('tenants_list');
          return result;
        } catch (error) {
          // 确保错误被正确抛出以供上层处理
          throw error;
        }
      };

      // 权限管理API - 直接调用，无缓存
      this.getPermissions = PermissionService.getPermissions;
      this.getPermissionTree = PermissionService.getPermissionTree;
      this.addPermission = PermissionService.addPermission;
      this.createPermissionNode = PermissionService.createPermissionNode;
      this.updatePermission = PermissionService.updatePermission;
      this.updatePermissionNode = PermissionService.updatePermissionNode;
      this.deletePermission = PermissionService.deletePermission;
      this.deletePermissionNode = PermissionService.deletePermissionNode;
      this.updatePermissionStatus = PermissionService.updatePermissionStatus;
      this.getRolesByPermission = PermissionService.getRolesByPermission;

      // 关联管理API
      this.assignRoleToUser = AssociationService.assignRoleToUser;
      this.assignRolesToUser = AssociationService.assignRolesToUser;
      this.removeUserRole = AssociationService.removeUserRole;
      this.getUsersByRole = AssociationService.getUsersByRole;
      this.assignPermissionToRole = AssociationService.assignPermissionToRole;
      this.removeRolePermission = AssociationService.removeRolePermission;
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
      this.batchDeleteTenants = MockRBACService.batchDeleteTenants.bind(MockRBACService);

      // 权限管理API
      this.getPermissions = MockRBACService.getPermissions.bind(MockRBACService);
      this.getPermissionTree = MockRBACService.getPermissionTree.bind(MockRBACService);
      this.addPermission = MockRBACService.addPermission.bind(MockRBACService);
      this.createPermissionNode = MockRBACService.createPermissionNode.bind(MockRBACService);
      this.updatePermission = MockRBACService.updatePermission.bind(MockRBACService);
      this.updatePermissionNode = MockRBACService.updatePermissionNode.bind(MockRBACService);
      this.deletePermission = MockRBACService.deletePermission.bind(MockRBACService);
      this.deletePermissionNode = MockRBACService.deletePermissionNode.bind(MockRBACService);
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
  deleteUsers: rbacServiceInstance.deleteUsers,
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
  getDepartmentTreeWithCache: rbacServiceInstance.getDepartmentTreeWithCache,
  getDepartmentTreeByTenantAndStatus: rbacServiceInstance.getDepartmentTreeByTenantAndStatus,
  createDepartment: rbacServiceInstance.createDepartment,
  updateDepartment: rbacServiceInstance.updateDepartment,
  deleteDepartment: rbacServiceInstance.deleteDepartment,
  invalidateDepartmentCache: rbacServiceInstance.invalidateDepartmentCache,
  clearAllDepartmentCache: rbacServiceInstance.clearAllDepartmentCache,

  // 缓存管理API
  clearAllTenantCache: rbacServiceInstance.clearAllTenantCache,
  clearAllCache: rbacServiceInstance.clearAllCache,

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
  batchDeleteTenants: rbacServiceInstance.batchDeleteTenants,

  // 权限管理API
  getPermissions: rbacServiceInstance.getPermissions,
  getPermissionTree: rbacServiceInstance.getPermissionTree,
  addPermission: rbacServiceInstance.addPermission,
  createPermissionNode: rbacServiceInstance.createPermissionNode,
  updatePermission: rbacServiceInstance.updatePermission,
  updatePermissionNode: rbacServiceInstance.updatePermissionNode,
  deletePermission: rbacServiceInstance.deletePermission,
  deletePermissionNode: rbacServiceInstance.deletePermissionNode,
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
  getUserPermissions: rbacServiceInstance.getUserPermissions
};