import RBACService from '@/components/service/RBACService';
import cacheManager from '@/utils/cacheManager';

// Mock API services
jest.mock('@/components/service/rbac/userService', () => ({
  default: {
    getUsers: jest.fn(() => Promise.resolve({ data: { items: [], total: 0 } })),
    createUser: jest.fn(() => Promise.resolve({})),
    updateUser: jest.fn(() => Promise.resolve({})),
    deleteUser: jest.fn(() => Promise.resolve({})),
    resetUserPassword: jest.fn(() => Promise.resolve({})),
    getUserRoles: jest.fn(() => Promise.resolve({}))
  }
}));

jest.mock('@/components/service/rbac/roleService', () => ({
  default: {
    getRoles: jest.fn(() => Promise.resolve({ data: { items: [], total: 0 } })),
    createRole: jest.fn(() => Promise.resolve({})),
    updateRole: jest.fn(() => Promise.resolve({})),
    deleteRole: jest.fn(() => Promise.resolve({})),
    getRolePermissions: jest.fn(() => Promise.resolve({}))
  }
}));

jest.mock('@/components/service/rbac/departmentService', () => ({
  default: {
    getDepartments: jest.fn(() => Promise.resolve({ data: [] })),
    getDepartmentTree: jest.fn(() => Promise.resolve({})),
    createDepartment: jest.fn(() => Promise.resolve({})),
    updateDepartment: jest.fn(() => Promise.resolve({})),
    deleteDepartment: jest.fn(() => Promise.resolve({}))
  }
}));

jest.mock('@/components/service/rbac/positionService', () => ({
  default: {
    getPositions: jest.fn(() => Promise.resolve({ data: { items: [], total: 0 } })),
    createPosition: jest.fn(() => Promise.resolve({})),
    updatePosition: jest.fn(() => Promise.resolve({})),
    deletePosition: jest.fn(() => Promise.resolve({}))
  }
}));

jest.mock('@/components/service/rbac/tenantService', () => ({
  default: {
    getTenants: jest.fn(() => Promise.resolve({ data: { items: [], total: 0 } })),
    createTenant: jest.fn(() => Promise.resolve({})),
    updateTenant: jest.fn(() => Promise.resolve({})),
    deleteTenant: jest.fn(() => Promise.resolve({}))
  }
}));

jest.mock('@/components/service/rbac/permissionService', () => ({
  default: {
    getPermissions: jest.fn(() => Promise.resolve({ data: { items: [], total: 0 } })),
    getPermissionTree: jest.fn(() => Promise.resolve({})),
    addPermission: jest.fn(() => Promise.resolve({})),
    updatePermission: jest.fn(() => Promise.resolve({})),
    deletePermission: jest.fn(() => Promise.resolve({})),
    updatePermissionStatus: jest.fn(() => Promise.resolve({})),
    getRolesByPermission: jest.fn(() => Promise.resolve({}))
  }
}));

jest.mock('@/components/service/rbac/associationService', () => ({
  default: {
    assignRoleToUser: jest.fn(() => Promise.resolve({})),
    assignRolesToUser: jest.fn(() => Promise.resolve({})),
    removeUserRole: jest.fn(() => Promise.resolve({})),
    getUsersByRole: jest.fn(() => Promise.resolve({})),
    assignPermissionToRole: jest.fn(() => Promise.resolve({})),
    removeRolePermission: jest.fn(() => Promise.resolve({})),
    checkUserPermission: jest.fn(() => Promise.resolve({})),
    getUserPermissions: jest.fn(() => Promise.resolve({}))
  }
}));

// Import the actual modules after mocking
const UserService = require('@/components/service/rbac/userService').default;
const RoleService = require('@/components/service/rbac/roleService').default;
const DepartmentService = require('@/components/service/rbac/departmentService').default;
const PositionService = require('@/components/service/rbac/positionService').default;
const TenantService = require('@/components/service/rbac/tenantService').default;
const PermissionService = require('@/components/service/rbac/permissionService').default;
const AssociationService = require('@/components/service/rbac/associationService').default;

describe('RBACService', () => {
  beforeEach(() => {
    // 清空缓存
    cacheManager.clear();
  });

  describe('缓存功能', () => {
    test('应该缓存getUsers调用的结果', async () => {
      const mockUserData = { data: { items: [{ id: 1, name: 'Test User' }], total: 1 } };
      UserService.getUsers.mockResolvedValue(mockUserData);

      // 第一次调用，应该调用API
      const result1 = await RBACService.getUsers({ page: 1 });
      expect(UserService.getUsers).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(mockUserData);

      // 第二次调用相同参数，应该从缓存获取
      const result2 = await RBACService.getUsers({ page: 1 });
      expect(UserService.getUsers).toHaveBeenCalledTimes(1); // 调用次数不应增加
      expect(result2).toEqual(mockUserData);

      // 调用不同参数，应该调用API
      await RBACService.getUsers({ page: 2 });
      expect(UserService.getUsers).toHaveBeenCalledTimes(2);
    });

    test('应该缓存getRoles调用的结果', async () => {
      const mockRoleData = { data: { items: [{ id: 1, name: 'Admin' }], total: 1 } };
      RoleService.getRoles.mockResolvedValue(mockRoleData);

      // 第一次调用，应该调用API
      const result1 = await RBACService.getRoles({ page: 1 });
      expect(RoleService.getRoles).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(mockRoleData);

      // 第二次调用相同参数，应该从缓存获取
      const result2 = await RBACService.getRoles({ page: 1 });
      expect(RoleService.getRoles).toHaveBeenCalledTimes(1); // 调用次数不应增加
      expect(result2).toEqual(mockRoleData);
    });

    test('应该缓存getDepartments调用的结果', async () => {
      const mockDeptData = { data: [{ id: 1, name: 'IT Department' }] };
      DepartmentService.getDepartments.mockResolvedValue(mockDeptData);

      // 第一次调用，应该调用API
      const result1 = await RBACService.getDepartments();
      expect(DepartmentService.getDepartments).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(mockDeptData);

      // 第二次调用，应该从缓存获取
      const result2 = await RBACService.getDepartments();
      expect(DepartmentService.getDepartments).toHaveBeenCalledTimes(1); // 调用次数不应增加
      expect(result2).toEqual(mockDeptData);
    });

    test('创建用户后应该清除相关缓存', async () => {
      const userData = { name: 'New User', email: 'newuser@example.com' };
      
      // 模拟getUsers返回初始数据
      UserService.getUsers.mockResolvedValueOnce({ data: { items: [], total: 0 } });
      await RBACService.getUsers();
      
      // 验证缓存已填充
      expect(UserService.getUsers).toHaveBeenCalledTimes(1);
      
      // 再次调用getUsers，应该从缓存获取
      await RBACService.getUsers();
      expect(UserService.getUsers).toHaveBeenCalledTimes(1); // 调用次数不应增加
      
      // 创建用户，这应该清除缓存
      await RBACService.createUser(userData);
      
      // 再次调用getUsers，应该重新调用API
      await RBACService.getUsers();
      expect(UserService.getUsers).toHaveBeenCalledTimes(2); // 调用次数应增加
    });

    test('更新用户后应该清除相关缓存', async () => {
      const userData = { name: 'Updated User', email: 'updated@example.com' };
      
      // 模拟getUsers返回初始数据
      UserService.getUsers.mockResolvedValueOnce({ data: { items: [], total: 0 } });
      await RBACService.getUsers();
      
      // 验证缓存已填充
      expect(UserService.getUsers).toHaveBeenCalledTimes(1);
      
      // 再次调用getUsers，应该从缓存获取
      await RBACService.getUsers();
      expect(UserService.getUsers).toHaveBeenCalledTimes(1); // 调用次数不应增加
      
      // 更新用户，这应该清除缓存
      await RBACService.updateUser('user123', 'default', userData);
      
      // 再次调用getUsers，应该重新调用API
      await RBACService.getUsers();
      expect(UserService.getUsers).toHaveBeenCalledTimes(2); // 调用次数应增加
    });

    test('删除用户后应该清除相关缓存', async () => {
      // 模拟getUsers返回初始数据
      UserService.getUsers.mockResolvedValueOnce({ data: { items: [], total: 0 } });
      await RBACService.getUsers();
      
      // 验证缓存已填充
      expect(UserService.getUsers).toHaveBeenCalledTimes(1);
      
      // 再次调用getUsers，应该从缓存获取
      await RBACService.getUsers();
      expect(UserService.getUsers).toHaveBeenCalledTimes(1); // 调用次数不应增加
      
      // 删除用户，这应该清除缓存
      await RBACService.deleteUser('user123', 'default');
      
      // 再次调用getUsers，应该重新调用API
      await RBACService.getUsers();
      expect(UserService.getUsers).toHaveBeenCalledTimes(2); // 调用次数应增加
    });

    test('创建角色后应该清除相关缓存', async () => {
      const roleData = { role_name: 'New Role', role_code: 'new_role' };
      
      // 模拟getRoles返回初始数据
      RoleService.getRoles.mockResolvedValueOnce({ data: { items: [], total: 0 } });
      await RBACService.getRoles();
      
      // 验证缓存已填充
      expect(RoleService.getRoles).toHaveBeenCalledTimes(1);
      
      // 再次调用getRoles，应该从缓存获取
      await RBACService.getRoles();
      expect(RoleService.getRoles).toHaveBeenCalledTimes(1); // 调用次数不应增加
      
      // 创建角色，这应该清除缓存
      await RBACService.createRole(roleData);
      
      // 再次调用getRoles，应该重新调用API
      await RBACService.getRoles();
      expect(RoleService.getRoles).toHaveBeenCalledTimes(2); // 调用次数应增加
    });

    test('创建部门后应该清除相关缓存', async () => {
      const deptData = { name: 'New Department', id: '34557705324850' };
      
      // 模拟getDepartments返回初始数据
      DepartmentService.getDepartments.mockResolvedValueOnce({ data: [] });
      await RBACService.getDepartments();
      
      // 验证缓存已填充
      expect(DepartmentService.getDepartments).toHaveBeenCalledTimes(1);
      
      // 再次调用getDepartments，应该从缓存获取
      await RBACService.getDepartments();
      expect(DepartmentService.getDepartments).toHaveBeenCalledTimes(1); // 调用次数不应增加
      
      // 创建部门，这应该清除缓存
      await RBACService.createDepartment(deptData);
      
      // 再次调用getDepartments，应该重新调用API
      await RBACService.getDepartments();
      expect(DepartmentService.getDepartments).toHaveBeenCalledTimes(2); // 调用次数应增加
    });
  });

  describe('缓存管理方法', () => {
    test('clearCache方法应该清空所有缓存', async () => {
      // 先填充一些缓存
      UserService.getUsers.mockResolvedValueOnce({ data: { items: [{ id: 1 }], total: 1 } });
      await RBACService.getUsers();
      
      RoleService.getRoles.mockResolvedValueOnce({ data: { items: [{ id: 1 }], total: 1 } });
      await RBACService.getRoles();
      
      // 验证缓存已填充
      expect(UserService.getUsers).toHaveBeenCalledTimes(1);
      expect(RoleService.getRoles).toHaveBeenCalledTimes(1);
      
      // 清空缓存
      RBACService.clearCache();
      
      // 再次调用，应该重新调用API
      await RBACService.getUsers();
      await RBACService.getRoles();
      
      expect(UserService.getUsers).toHaveBeenCalledTimes(2); // 调用次数应增加
      expect(RoleService.getRoles).toHaveBeenCalledTimes(2); // 调用次数应增加
    });

    test('getCacheStats方法应该返回缓存统计信息', () => {
      const stats = RBACService.getCacheStats();
      expect(stats).toHaveProperty('memoryCacheSize');
      expect(stats).toHaveProperty('sessionStorageKeysCount');
      expect(stats).toHaveProperty('prefix');
    });
  });
});