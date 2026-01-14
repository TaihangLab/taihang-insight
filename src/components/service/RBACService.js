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

// RBAC服务类 - 整合所有RBAC相关服务
class RBACService {
  constructor() {
    if (hasRealServices) {
      // 使用真实服务
      // 用户管理API
      this.getUsers = UserService.getUsers;
      this.createUser = UserService.createUser;
      this.updateUser = UserService.updateUser;
      this.deleteUser = UserService.deleteUser;
      this.resetUserPassword = UserService.resetUserPassword;
      this.getUserRoles = UserService.getUserRoles;

      // 角色管理API
      this.getRoles = RoleService.getRoles;
      this.createRole = RoleService.createRole;
      this.updateRole = RoleService.updateRole;
      this.deleteRole = RoleService.deleteRole;
      this.getRolePermissions = RoleService.getRolePermissions;

      // 部门管理API
      this.getDepartments = DepartmentService.getDepartments;
      this.getDepartmentTree = DepartmentService.getDepartmentTree;
      this.createDepartment = DepartmentService.createDepartment;
      this.updateDepartment = DepartmentService.updateDepartment;
      this.deleteDepartment = DepartmentService.deleteDepartment;

      // 岗位管理API
      this.getPositions = PositionService.getPositions;
      this.createPosition = PositionService.createPosition;
      this.updatePosition = PositionService.updatePosition;
      this.deletePosition = PositionService.deletePosition;

      // 租户管理API - 使用包装函数以保持正确的 this 上下文
      this.getTenants = (...args) => TenantService.getTenants(...args);
      this.createTenant = (...args) => TenantService.createTenant(...args);
      this.updateTenant = (...args) => TenantService.updateTenant(...args);
      this.deleteTenant = (...args) => TenantService.deleteTenant(...args);

      // 权限管理API
      this.getPermissions = PermissionService.getPermissions;
      this.addPermission = PermissionService.addPermission;
      this.updatePermission = PermissionService.updatePermission;
      this.deletePermission = PermissionService.deletePermission;
      this.updatePermissionStatus = PermissionService.updatePermissionStatus;
      this.getRolesByPermission = PermissionService.getRolesByPermission;

      // 关联管理API
      this.assignRoleToUser = AssociationService.assignRoleToUser;
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

      // 权限管理API
      this.getPermissions = MockRBACService.getPermissions.bind(MockRBACService);
      this.addPermission = MockRBACService.addPermission.bind(MockRBACService);
      this.updatePermission = MockRBACService.updatePermission.bind(MockRBACService);
      this.deletePermission = MockRBACService.deletePermission.bind(MockRBACService);
      this.updatePermissionStatus = MockRBACService.updatePermissionStatus.bind(MockRBACService);
      this.getRolesByPermission = MockRBACService.getRolesByPermission.bind(MockRBACService);

      // 关联管理API
      this.assignRoleToUser = MockRBACService.assignRoleToUser.bind(MockRBACService);
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
  removeUserRole: rbacServiceInstance.removeUserRole,
  getUsersByRole: rbacServiceInstance.getUsersByRole,
  assignPermissionToRole: rbacServiceInstance.assignPermissionToRole,
  removeRolePermission: rbacServiceInstance.removeRolePermission,
  checkUserPermission: rbacServiceInstance.checkUserPermission,
  getUserPermissions: rbacServiceInstance.getUserPermissions
};