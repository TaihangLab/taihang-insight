/**
 * 系统管理模块测试数据工厂
 *
 * 提供统一的测试数据，避免在测试文件中重复定义
 */

// ============================================
// 用户数据
// ============================================

export const testUsers = [
  {
    id: 1000000000000001,
    user_id: '1000000000000001',
    user_name: 'admin',
    nick_name: '管理员',
    email: 'admin@example.com',
    phone: '13800138000',
    status: 0,
    dept_id: 1,
    dept_name: '技术部',
    position_id: 1,
    position_name: '工程师',
    roles: ['ROLE_ADMIN'],
    tenant_id: '1000000000000001',
    tenant_code: 'default',
    create_time: '2024-01-01 00:00:00',
    update_time: '2024-01-01 00:00:00',
  },
  {
    id: 1000000000000002,
    user_id: '1000000000000002',
    user_name: 'user1',
    nick_name: '用户1',
    email: 'user1@example.com',
    phone: '13800138001',
    status: 0,
    dept_id: 2,
    dept_name: '产品部',
    position_id: 2,
    position_name: '产品经理',
    roles: ['ROLE_USER'],
    tenant_id: '1000000000000001',
    tenant_code: 'default',
    create_time: '2024-01-02 00:00:00',
    update_time: '2024-01-02 00:00:00',
  },
  {
    id: 1000000000000003,
    user_id: '1000000000000003',
    user_name: 'user2',
    nick_name: '用户2',
    email: 'user2@example.com',
    phone: '13800138002',
    status: 1, // 禁用
    dept_id: 1,
    dept_name: '技术部',
    position_id: 1,
    position_name: '工程师',
    roles: ['ROLE_USER'],
    tenant_id: '1000000000000001',
    tenant_code: 'default',
    create_time: '2024-01-03 00:00:00',
    update_time: '2024-01-03 00:00:00',
  },
];

// ============================================
// 角色数据
// ============================================

export const testRoles = [
  {
    id: 1,
    role_name: '管理员',
    role_code: 'ROLE_ADMIN',
    description: '系统管理员，拥有所有权限',
    status: 0,
    tenant_id: '1000000000000001',
    tenant_code: 'default',
    create_time: '2024-01-01 00:00:00',
    update_time: '2024-01-01 00:00:00',
  },
  {
    id: 2,
    role_name: '操作员',
    role_code: 'ROLE_OPERATOR',
    description: '系统操作员，拥有部分权限',
    status: 0,
    tenant_id: '1000000000000001',
    tenant_code: 'default',
    create_time: '2024-01-02 00:00:00',
    update_time: '2024-01-02 00:00:00',
  },
  {
    id: 3,
    role_name: '访客',
    role_code: 'ROLE_GUEST',
    description: '访客角色，只有只读权限',
    status: 1, // 禁用
    tenant_id: '1000000000000001',
    tenant_code: 'default',
    create_time: '2024-01-03 00:00:00',
    update_time: '2024-01-03 00:00:00',
  },
];

// ============================================
// 租户数据
// ============================================

export const testTenants = [
  {
    id: 1000000000000001,
    tenant_id: '1000000000000001',
    tenant_code: 'default',
    tenant_name: '默认租户',
    tenant_type: 'enterprise',
    contact_name: '张三',
    contact_phone: '13800138000',
    email: 'admin@example.com',
    address: '北京市',
    status: 0,
    expire_time: '2099-12-31 23:59:59',
    max_users: 1000,
    create_time: '2024-01-01 00:00:00',
    update_time: '2024-01-01 00:00:00',
  },
  {
    id: 1000000000000002,
    tenant_id: '1000000000000002',
    tenant_code: 'tenant2',
    tenant_name: '测试租户',
    tenant_type: 'trial',
    contact_name: '李四',
    contact_phone: '13800138001',
    email: 'tenant2@example.com',
    address: '上海市',
    status: 0,
    expire_time: '2025-12-31 23:59:59',
    max_users: 100,
    create_time: '2024-01-02 00:00:00',
    update_time: '2024-01-02 00:00:00',
  },
];

// ============================================
// 部门数据
// ============================================

export const testDepartments = [
  {
    id: 1,
    dept_name: '技术部',
    dept_code: 'TECH',
    parent_id: 0,
    sort_order: 1,
    status: 0,
    tenant_id: '1000000000000001',
    tenant_code: 'default',
    description: '负责技术研发工作',
    create_time: '2024-01-01 00:00:00',
    update_time: '2024-01-01 00:00:00',
  },
  {
    id: 2,
    dept_name: '产品部',
    dept_code: 'PRODUCT',
    parent_id: 0,
    sort_order: 2,
    status: 0,
    tenant_id: '1000000000000001',
    tenant_code: 'default',
    description: '负责产品规划工作',
    create_time: '2024-01-02 00:00:00',
    update_time: '2024-01-02 00:00:00',
  },
  {
    id: 3,
    dept_name: '研发组',
    dept_code: 'DEV_GROUP',
    parent_id: 1,
    sort_order: 1,
    status: 0,
    tenant_id: '1000000000000001',
    tenant_code: 'default',
    description: '技术研发小组',
    create_time: '2024-01-03 00:00:00',
    update_time: '2024-01-03 00:00:00',
  },
];

// ============================================
// 岗位数据
// ============================================

export const testPositions = [
  {
    id: 1,
    position_name: '工程师',
    position_code: 'ENGINEER',
    sort_order: 1,
    status: 0,
    tenant_id: '1000000000000001',
    tenant_code: 'default',
    description: '技术研发工程师',
    create_time: '2024-01-01 00:00:00',
    update_time: '2024-01-01 00:00:00',
  },
  {
    id: 2,
    position_name: '产品经理',
    position_code: 'PRODUCT_MANAGER',
    sort_order: 2,
    status: 0,
    tenant_id: '1000000000000001',
    tenant_code: 'default',
    description: '负责产品规划和管理',
    create_time: '2024-01-02 00:00:00',
    update_time: '2024-01-02 00:00:00',
  },
  {
    id: 3,
    position_name: '测试工程师',
    position_code: 'QA_ENGINEER',
    sort_order: 3,
    status: 1, // 禁用
    tenant_id: '1000000000000001',
    tenant_code: 'default',
    description: '负责质量保证测试',
    create_time: '2024-01-03 00:00:00',
    update_time: '2024-01-03 00:00:00',
  },
];

// ============================================
// 权限数据
// ============================================

export const testPermissions = [
  {
    id: 1,
    permission_name: '用户管理',
    permission_code: 'user_management',
    permission_type: 'menu',
    parent_id: 0,
    path: '/systemManage/userManagement',
    method: 'GET',
    sort_order: 1,
    status: 0,
    visible: true,
    tenant_id: '1000000000000001',
    tenant_code: 'default',
    create_time: '2024-01-01 00:00:00',
    update_time: '2024-01-01 00:00:00',
  },
  {
    id: 2,
    permission_name: '角色管理',
    permission_code: 'role_management',
    permission_type: 'menu',
    parent_id: 0,
    path: '/systemManage/roleManagement',
    method: 'GET',
    sort_order: 2,
    status: 0,
    visible: true,
    tenant_id: '1000000000000001',
    tenant_code: 'default',
    create_time: '2024-01-02 00:00:00',
    update_time: '2024-01-02 00:00:00',
  },
  {
    id: 100,
    permission_name: '新增用户',
    permission_code: 'user:create:add',
    permission_type: 'button',
    parent_id: 1,
    path: null,
    method: 'POST',
    sort_order: 1,
    status: 0,
    visible: true,
    tenant_id: '1000000000000001',
    tenant_code: 'default',
    create_time: '2024-01-01 00:00:00',
    update_time: '2024-01-01 00:00:00',
  },
];

// ============================================
// 分页数据
// ============================================

export const testPagination = {
  total: 100,
  page: 1,
  limit: 20,
  pages: 5,
};

export const testPaginationData = {
  data: testUsers,
  ...testPagination,
};

// ============================================
// 搜索条件
// ============================================

export const testSearchConditions = {
  user_name: '',
  phone: '',
  email: '',
  status: null,
  dept_id: null,
  tenant_id: '1000000000000001',
};

export const testRoleSearchConditions = {
  role_name: '',
  role_code: '',
  status: null,
  tenant_id: '1000000000000001',
};

export const testTenantSearchConditions = {
  tenant_name: '',
  tenant_code: '',
  contact_phone: '',
  status: null,
};

export const testDepartmentSearchConditions = {
  dept_name: '',
  dept_code: '',
  status: null,
  tenant_id: '1000000000000001',
};

export const testPositionSearchConditions = {
  position_name: '',
  position_code: '',
  status: null,
  tenant_id: '1000000000000001',
};

// ============================================
// 表单数据
// ============================================

export const testUserFormData = {
  user_name: 'testuser',
  nick_name: '测试用户',
  email: 'test@example.com',
  phone: '13800138000',
  password: 'Password123!',
  dept_id: 1,
  position_id: 1,
  role_ids: [1, 2],
  status: 0,
};

export const testRoleFormData = {
  role_name: '测试角色',
  role_code: 'TEST_ROLE',
  description: '这是一个测试角色',
  status: 0,
};

export const testTenantFormData = {
  tenant_name: '测试租户',
  tenant_code: 'test_tenant',
  tenant_type: 'trial',
  contact_name: '测试联系人',
  contact_phone: '13800138000',
  email: 'test@example.com',
  address: '测试地址',
  status: 0,
  max_users: 100,
};

export const testDepartmentFormData = {
  dept_name: '测试部门',
  dept_code: 'TEST_DEPT',
  parent_id: 0,
  sort_order: 1,
  description: '这是一个测试部门',
  status: 0,
};

export const testPositionFormData = {
  position_name: '测试岗位',
  position_code: 'TEST_POSITION',
  sort_order: 1,
  description: '这是一个测试岗位',
  status: 0,
};

// ============================================
// 错误数据
// ============================================

export const testErrors = {
  networkError: new Error('网络连接失败'),
  notFoundError: new Error('资源不存在'),
  unauthorizedError: new Error('未授权访问'),
  validationError: new Error('数据验证失败'),
};

// ============================================
// Mock 响应
// ============================================

export const mockSuccessResponse = {
  code: 0,
  message: '操作成功',
  data: testUsers[0],
};

export const mockListResponse = {
  code: 0,
  message: '查询成功',
  data: testUsers,
  total: testUsers.length,
};

export const mockPaginatedResponse = {
  code: 0,
  message: '查询成功',
  data: testUsers.slice(0, 20),
  total: 100,
  page: 1,
  limit: 20,
  pages: 5,
};

export const mockErrorResponse = {
  code: -1,
  message: '操作失败',
  data: null,
};
