// Mock数据管理
import mockService from './service';

const mockData = {
  tenant: {
    // 租户管理页面的模拟数据
    tenantManagement: () => ({
      tenant_id: 'TNT' + Math.floor(Math.random() * 10000),
      tenant_name: '测试租户' + Math.floor(Math.random() * 1000),
      company_name: '测试公司' + Math.floor(Math.random() * 1000),
      contact_person: '张三',
      contact_phone: '138' + Math.floor(100000000 + Math.random() * 900000000).toString().substring(0, 8),
      username: 'testuser' + Math.floor(Math.random() * 1000),
      password: 'TestPass123!',
      package: ['basic', 'standard', 'premium', 'enterprise'][Math.floor(Math.random() * 4)],
      expire_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      userCount: Math.floor(Math.random() * 100),
      domain: 'test' + Math.floor(Math.random() * 1000) + '.com',
      address: '北京市朝阳区测试街道' + Math.floor(Math.random() * 1000) + '号',
      companyCode: '91' + Math.random().toString().substring(2, 16),
      description: '这是一个测试公司的简介',
      remark: '测试备注信息'
    })
  },

  user: {
    // 用户管理页面的模拟数据
    userManagement: () => ({
      user_name: 'testuser' + Math.floor(Math.random() * 10000),
      nick_name: ['张三', '李四', '王五', '赵六', '钱七'][Math.floor(Math.random() * 5)],
      password: 'TestPass123!',
      email: `test${Math.floor(Math.random() * 1000)}@example.com`,
      phone: '138' + Math.floor(100000000 + Math.random() * 900000000).toString().substring(0, 8),
      dept_id: [1],
      status: [0, 1][Math.floor(Math.random() * 2)], // 0: 正常, 1: 停用
      gender: [0, 1, 2][Math.floor(Math.random() * 3)], // 0: 未知, 1: 男, 2: 女
      position: ['developer', 'tester', 'pm', 'designer', 'ops'][Math.floor(Math.random() * 5)],
      remark: '测试用户备注信息'
    })
  },

  role: {
    // 角色管理页面的模拟数据
    roleManagement: () => ({
      role_id: 'R' + Math.floor(Math.random() * 1000),
      role_name: ['管理员', '普通用户', '访客', '审核员', '编辑'][Math.floor(Math.random() * 5)] + Math.floor(Math.random() * 100),
      role_code: 'ROLE_' + ['ADMIN', 'USER', 'GUEST', 'REVIEWER', 'EDITOR'][Math.floor(Math.random() * 5)],
      permissions: ['user:create', 'user:read', 'user:update', 'user:delete'],
      description: '这是一个测试角色的描述',
      status: [0, 1][Math.floor(Math.random() * 2)], // 0: 启用, 1: 禁用
      remarks: '测试角色备注信息'
    })
  },

  department: {
    // 部门管理页面的模拟数据
    departmentManagement: () => ({
      name: ['技术部', '市场部', '财务部', '人事部', '运营部'][Math.floor(Math.random() * 5)] + Math.floor(Math.random() * 100),
      sort_order: Math.floor(Math.random() * 100),
      status: [0, 1][Math.floor(Math.random() * 2)], // 0: 启用, 1: 停用
      parent_id: [null, 1, 2, 3][Math.floor(Math.random() * 4)]
    })
  },

  permission: {
    // 权限管理页面的模拟数据
    permissionManagement: () => {
      const types = ['folder', 'menu', 'button']
      const type = types[Math.floor(Math.random() * types.length)]
      return {
        permission_type: type,
        permission_name: ['用户管理', '角色管理', '部门管理', '权限管理', '系统设置'][Math.floor(Math.random() * 5)],
        permission_code: 'system:' + ['user', 'role', 'dept', 'permission', 'setting'][Math.floor(Math.random() * 5)],
        path: '/system/' + ['user', 'role', 'dept', 'permission', 'setting'][Math.floor(Math.random() * 5)],
        component: '@/pages/system/' + ['userManagement', 'roleManagement', 'deptManagement', 'permissionManagement'][Math.floor(Math.random() * 4)] + '.vue',
        icon: ['User', 'Role', 'Dept', 'Permission', 'Setting'][Math.floor(Math.random() * 5)],
        sort_order: Math.floor(Math.random() * 100),
        description: '这是一个测试权限的描述',
        visible: Math.random() > 0.5,
        status: [0, 1][Math.floor(Math.random() * 2)], // 0: 启用, 1: 禁用
        api_path: type === 'button' ? '/api/system/test' : '',
        methods: type === 'button' ? ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)] : ''
      }
    }
  }
};

// 注册mock数据到服务
Object.keys(mockData).forEach(category => {
  Object.keys(mockData[category]).forEach(subCategory => {
    const dataGenerator = mockData[category][subCategory];
    mockService.registerData(`${category}.${subCategory}`, typeof dataGenerator === 'function' ? dataGenerator() : dataGenerator);
  });
});

export default mockData;