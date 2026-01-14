/**
 * 模拟RBAC服务 - 用于在后端没有提供RBAC API时提供模拟数据
 */
class MockRBACService {
  constructor() {
    // 初始化模拟数据
    this.users = [
      {
        id: 1,
        userCode: 'admin',
        userName: 'admin',
        userNickname: '超级管理员',
        departmentId: 1,
        position: 'admin',
        tenantId: 1,
        phoneNumber: '13800138000',
        email: 'admin@example.com',
        gender: 'male',
        status: 1,
        roleId: 1,
        createTime: '2024-01-01 10:00:00',
        remark: '超级管理员账户',
        tenantCode: 'default'
      },
      {
        id: 2,
        userCode: 'user001',
        userName: 'zhangsan',
        userNickname: '张三',
        departmentId: 2,
        position: 'developer',
        tenantId: 1,
        phoneNumber: '13800138001',
        email: 'zhangsan@example.com',
        gender: 'male',
        status: 1,
        roleId: 2,
        createTime: '2024-01-02 10:00:00',
        remark: '开发工程师',
        tenantCode: 'default'
      },
      {
        id: 3,
        userCode: 'user002',
        userName: 'lisi',
        userNickname: '李四',
        departmentId: 3,
        position: 'tester',
        tenantId: 1,
        phoneNumber: '13800138002',
        email: 'lisi@example.com',
        gender: 'female',
        status: 1,
        roleId: 3,
        createTime: '2024-01-03 10:00:00',
        remark: '测试工程师',
        tenantCode: 'default'
      }
    ];

    this.roles = [
      {
        id: 1,
        roleCode: 'superadmin',
        roleName: '超级管理员',
        sortOrder: 1,
        status: 1,
        remark: '系统最高权限',
        tenantCode: 'default',
        createTime: '2024-01-01 10:00:00'
      },
      {
        id: 2,
        roleCode: 'admin',
        roleName: '管理员',
        sortOrder: 2,
        status: 1,
        remark: '系统管理权限',
        tenantCode: 'default',
        createTime: '2024-01-01 10:00:00'
      },
      {
        id: 3,
        roleCode: 'user',
        roleName: '普通用户',
        sortOrder: 3,
        status: 1,
        remark: '普通用户权限',
        tenantCode: 'default',
        createTime: '2024-01-01 10:00:00'
      }
    ];

    this.permissions = [
      {
        id: 1,
        permissionCode: 'system:user:page',
        permissionName: '用户管理页面',
        permissionType: 'page',
        status: 1,
        createTime: '2024-01-01 10:00:00',
        tenantCode: 'default'
      },
      {
        id: 2,
        permissionCode: 'system:role:page',
        permissionName: '角色管理页面',
        permissionType: 'page',
        status: 1,
        createTime: '2024-01-01 10:00:00',
        tenantCode: 'default'
      },
      {
        id: 3,
        permissionCode: 'system:permission:page',
        permissionName: '权限管理页面',
        permissionType: 'page',
        status: 1,
        createTime: '2024-01-01 10:00:00',
        tenantCode: 'default'
      },
      {
        id: 4,
        permissionCode: 'system:user:add',
        permissionName: '用户新增',
        permissionType: 'button',
        status: 1,
        createTime: '2024-01-01 10:00:00',
        tenantCode: 'default'
      },
      {
        id: 5,
        permissionCode: 'system:user:edit',
        permissionName: '用户编辑',
        permissionType: 'button',
        status: 1,
        createTime: '2024-01-01 10:00:00',
        tenantCode: 'default'
      }
    ];

    this.departments = [
      {
        id: 1,
        deptCode: 'dept001',
        deptName: '总部',
        parentId: 0,
        status: 1,
        sort: 1,
        leader: 'admin',
        phone: '010-12345678',
        email: 'headquarters@example.com',
        createTime: '2024-01-01 10:00:00',
        tenantCode: 'default'
      },
      {
        id: 2,
        deptCode: 'dept002',
        deptName: '技术部',
        parentId: 1,
        status: 1,
        sort: 1,
        leader: 'zhangsan',
        phone: '010-12345679',
        email: 'tech@example.com',
        createTime: '2024-01-01 10:00:00',
        tenantCode: 'default'
      },
      {
        id: 3,
        deptCode: 'dept003',
        deptName: '测试部',
        parentId: 1,
        status: 1,
        sort: 2,
        leader: 'lisi',
        phone: '010-12345680',
        email: 'test@example.com',
        createTime: '2024-01-01 10:00:00',
        tenantCode: 'default'
      }
    ];

    this.positions = [
      {
        id: 1,
        positionCode: 'pos001',
        positionName: '总经理',
        status: 1,
        createTime: '2024-01-01 10:00:00',
        tenantCode: 'default'
      },
      {
        id: 2,
        positionCode: 'pos002',
        positionName: '开发工程师',
        status: 1,
        createTime: '2024-01-01 10:00:00',
        tenantCode: 'default'
      },
      {
        id: 3,
        positionCode: 'pos003',
        positionName: '测试工程师',
        status: 1,
        createTime: '2024-01-01 10:00:00',
        tenantCode: 'default'
      }
    ];

    this.tenants = [
      {
        id: 1,
        tenantCode: 'default',
        tenantName: '默认租户',
        contactPerson: 'admin',
        contactPhone: '13800138000',
        status: 1,
        createTime: '2024-01-01 10:00:00'
      }
    ];
  }

  // 模拟延迟
  async delay(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 模拟API响应格式
  createResponse(data) {
    return {
      success: true,
      code: 200,
      message: '操作成功',
      data: data
    };
  }

  // 用户相关API
  async getUsers(params = {}) {
    await this.delay();

    let result = [...this.users];

    // 应用过滤条件
    if (params.username) {
      result = result.filter(user => user.userName.includes(params.username));
    }
    if (params.nickname) {
      result = result.filter(user => user.userNickname.includes(params.nickname));
    }
    if (params.phone) {
      result = result.filter(user => user.phoneNumber.includes(params.phone));
    }
    if (params.status !== undefined) {
      result = result.filter(user => user.status == params.status);
    }

    // 分页处理
    const skip = params.skip || 0;
    const limit = params.limit || 10;
    const pagedResult = result.slice(skip, skip + limit);

    return this.createResponse({
      items: pagedResult,
      total: result.length,
      skip: skip,
      limit: limit
    });
  }

  async createUser(userData) {
    await this.delay();

    const newUser = {
      ...userData,
      id: Math.max(...this.users.map(u => u.id), 0) + 1,
      userCode: userData.userName,
      createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      tenantCode: userData.tenantCode || 'default'
    };

    this.users.push(newUser);
    return this.createResponse(newUser);
  }

  async updateUser(userCode, tenantCode, userData) {
    await this.delay();

    const index = this.users.findIndex(u => u.userCode === userCode && u.tenantCode === tenantCode);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...userData };
      return this.createResponse(this.users[index]);
    }

    throw new Error('用户不存在');
  }

  async deleteUser(userCode, tenantCode) {
    await this.delay();

    const index = this.users.findIndex(u => u.userCode === userCode && u.tenantCode === tenantCode);
    if (index !== -1) {
      this.users.splice(index, 1);
      return this.createResponse({ message: '用户删除成功' });
    }

    throw new Error('用户不存在');
  }

  async resetUserPassword(userCode) {
    await this.delay();
    
    const user = this.users.find(u => u.userCode === userCode);
    if (user) {
      // 模拟重置密码操作
      return this.createResponse({ message: '密码重置成功' });
    }

    throw new Error('用户不存在');
  }

  async getUserRoles(userId, tenantCode) {
    await this.delay();

    const user = this.users.find(u => u.id === userId && u.tenantCode === tenantCode);
    if (user) {
      const role = this.roles.find(r => r.id === user.roleId);
      return this.createResponse([role]);
    }

    throw new Error('用户不存在');
  }

  // 角色相关API
  async getRoles(params = {}) {
    await this.delay();

    let result = [...this.roles];

    // 应用过滤条件
    if (params.role_name) {
      result = result.filter(role => role.roleName.includes(params.role_name));
    }
    if (params.role_code) {
      result = result.filter(role => role.roleCode.includes(params.role_code));
    }
    if (params.status !== undefined) {
      result = result.filter(role => role.status == params.status);
    }
    if (params.tenant_code) {
      result = result.filter(role => role.tenantCode === params.tenant_code);
    }

    // 分页处理
    const skip = params.skip || 0;
    const limit = params.limit || 10;
    const pagedResult = result.slice(skip, skip + limit);

    return this.createResponse({
      items: pagedResult,
      total: result.length,
      skip: skip,
      limit: limit
    });
  }

  async createRole(roleData) {
    await this.delay();

    const newRole = {
      ...roleData,
      id: Math.max(...this.roles.map(r => r.id), 0) + 1,
      createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      tenantCode: roleData.tenantCode || 'default'
    };

    this.roles.push(newRole);
    return this.createResponse(newRole);
  }

  async updateRole(roleCode, tenantCode, roleData) {
    await this.delay();

    const index = this.roles.findIndex(r => r.roleCode === roleCode && r.tenantCode === tenantCode);
    if (index !== -1) {
      this.roles[index] = { ...this.roles[index], ...roleData };
      return this.createResponse(this.roles[index]);
    }

    throw new Error('角色不存在');
  }

  async deleteRole(roleCode, tenantCode) {
    await this.delay();

    const index = this.roles.findIndex(r => r.roleCode === roleCode && r.tenantCode === tenantCode);
    if (index !== -1) {
      this.roles.splice(index, 1);
      return this.createResponse({ message: '角色删除成功' });
    }

    throw new Error('角色不存在');
  }

  async getRolePermissions(roleId, tenantCode) {
    await this.delay();

    // 返回与角色相关的权限
    return this.createResponse(this.permissions);
  }

  // 权限相关API
  async getPermissions(params = {}) {
    await this.delay();

    let result = [...this.permissions];

    // 分页处理
    const skip = params.skip || 0;
    const limit = params.limit || 10;
    const pagedResult = result.slice(skip, skip + limit);

    return this.createResponse({
      items: pagedResult,
      total: result.length,
      skip: skip,
      limit: limit
    });
  }

  async addPermission(permissionData) {
    await this.delay();

    const newPermission = {
      ...permissionData,
      id: Math.max(...this.permissions.map(p => p.id), 0) + 1,
      createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      tenantCode: permissionData.tenantCode || 'default'
    };

    this.permissions.push(newPermission);
    return this.createResponse(newPermission);
  }

  async updatePermission(permissionCode, tenantCode, permissionData) {
    await this.delay();

    const index = this.permissions.findIndex(p => p.permissionCode === permissionCode && p.tenantCode === tenantCode);
    if (index !== -1) {
      this.permissions[index] = { ...this.permissions[index], ...permissionData };
      return this.createResponse(this.permissions[index]);
    }

    throw new Error('权限不存在');
  }

  async deletePermission(permissionCode, tenantCode) {
    await this.delay();

    const index = this.permissions.findIndex(p => p.permissionCode === permissionCode && p.tenantCode === tenantCode);
    if (index !== -1) {
      this.permissions.splice(index, 1);
      return this.createResponse({ message: '权限删除成功' });
    }

    throw new Error('权限不存在');
  }

  async updatePermissionStatus(permissionCode, tenantCode, status) {
    await this.delay();

    const index = this.permissions.findIndex(p => p.permissionCode === permissionCode && p.tenantCode === tenantCode);
    if (index !== -1) {
      this.permissions[index].status = status;
      return this.createResponse(this.permissions[index]);
    }

    throw new Error('权限不存在');
  }

  async getRolesByPermission(permissionId, tenantCode) {
    await this.delay();

    return this.createResponse(this.roles);
  }

  // 部门相关API
  async getDepartments(params = {}) {
    await this.delay();

    let result = [...this.departments];

    // 分页处理
    const skip = params.skip || 0;
    const limit = params.limit || 10;
    const pagedResult = result.slice(skip, skip + limit);

    return this.createResponse({
      items: pagedResult,
      total: result.length,
      skip: skip,
      limit: limit
    });
  }

  async getDepartmentTree() {
    await this.delay();

    // 构建部门树结构
    const tree = [];
    const deptMap = {};

    // 先建立映射关系
    this.departments.forEach(dept => {
      deptMap[dept.id] = { ...dept, children: [] };
    });

    // 构建树结构
    this.departments.forEach(dept => {
      if (dept.parentId === 0) {
        tree.push(deptMap[dept.id]);
      } else {
        const parent = deptMap[dept.parentId];
        if (parent) {
          parent.children.push(deptMap[dept.id]);
        }
      }
    });

    return this.createResponse(tree);
  }

  async createDepartment(deptData) {
    await this.delay();

    const newDept = {
      ...deptData,
      id: Math.max(...this.departments.map(d => d.id), 0) + 1,
      deptCode: deptData.deptName.toLowerCase().replace(/\s+/g, ''),
      createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      tenantCode: deptData.tenantCode || 'default'
    };

    this.departments.push(newDept);
    return this.createResponse(newDept);
  }

  async updateDepartment(deptCode, deptData) {
    await this.delay();

    const index = this.departments.findIndex(d => d.deptCode === deptCode);
    if (index !== -1) {
      this.departments[index] = { ...this.departments[index], ...deptData };
      return this.createResponse(this.departments[index]);
    }

    throw new Error('部门不存在');
  }

  async deleteDepartment(deptCode, tenantCode) {
    await this.delay();

    const index = this.departments.findIndex(d => d.deptCode === deptCode && d.tenantCode === tenantCode);
    if (index !== -1) {
      this.departments.splice(index, 1);
      return this.createResponse({ message: '部门删除成功' });
    }

    throw new Error('部门不存在');
  }

  // 岗位相关API
  async getPositions(params = {}) {
    await this.delay();

    let result = [...this.positions];

    // 分页处理
    const skip = params.skip || 0;
    const limit = params.limit || 10;
    const pagedResult = result.slice(skip, skip + limit);

    return this.createResponse({
      items: pagedResult,
      total: result.length,
      skip: skip,
      limit: limit
    });
  }

  async createPosition(posData) {
    await this.delay();

    const newPosition = {
      ...posData,
      id: Math.max(...this.positions.map(p => p.id), 0) + 1,
      positionCode: posData.positionName.toLowerCase().replace(/\s+/g, ''),
      createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      tenantCode: posData.tenantCode || 'default'
    };

    this.positions.push(newPosition);
    return this.createResponse(newPosition);
  }

  async updatePosition(positionCode, posData) {
    await this.delay();

    const index = this.positions.findIndex(p => p.positionCode === positionCode);
    if (index !== -1) {
      this.positions[index] = { ...this.positions[index], ...posData };
      return this.createResponse(this.positions[index]);
    }

    throw new Error('岗位不存在');
  }

  async deletePosition(positionCode, tenantCode) {
    await this.delay();

    const index = this.positions.findIndex(p => p.positionCode === positionCode && p.tenantCode === tenantCode);
    if (index !== -1) {
      this.positions.splice(index, 1);
      return this.createResponse({ message: '岗位删除成功' });
    }

    throw new Error('岗位不存在');
  }

  // 租户相关API
  async getTenants(params = {}) {
    await this.delay();

    let result = [...this.tenants];

    // 分页处理
    const skip = params.skip || 0;
    const limit = params.limit || 10;
    const pagedResult = result.slice(skip, skip + limit);

    return this.createResponse({
      items: pagedResult,
      total: result.length,
      skip: skip,
      limit: limit
    });
  }

  async createTenant(tenantData) {
    await this.delay();

    const newTenant = {
      ...tenantData,
      id: Math.max(...this.tenants.map(t => t.id), 0) + 1,
      createTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    this.tenants.push(newTenant);
    return this.createResponse(newTenant);
  }

  async updateTenant(tenantCode, tenantData) {
    await this.delay();

    const index = this.tenants.findIndex(t => t.tenantCode === tenantCode);
    if (index !== -1) {
      this.tenants[index] = { ...this.tenants[index], ...tenantData };
      return this.createResponse(this.tenants[index]);
    }

    throw new Error('租户不存在');
  }

  async deleteTenant(tenantCode) {
    await this.delay();

    const index = this.tenants.findIndex(t => t.tenantCode === tenantCode);
    if (index !== -1) {
      this.tenants.splice(index, 1);
      return this.createResponse({ message: '租户删除成功' });
    }

    throw new Error('租户不存在');
  }

  // 关联管理API
  async assignRoleToUser(userId, roleId, tenantCode) {
    await this.delay();

    const user = this.users.find(u => u.id === userId && u.tenantCode === tenantCode);
    if (user) {
      user.roleId = roleId;
      return this.createResponse({ message: '角色分配成功' });
    }

    throw new Error('用户不存在');
  }

  async removeUserRole(userId, roleId, tenantCode) {
    await this.delay();

    const user = this.users.find(u => u.id === userId && u.tenantCode === tenantCode && u.roleId === roleId);
    if (user) {
      user.roleId = null;
      return this.createResponse({ message: '角色移除成功' });
    }

    throw new Error('用户角色关联不存在');
  }

  async getUsersByRole(roleId, tenantCode) {
    await this.delay();

    const users = this.users.filter(u => u.roleId === roleId && u.tenantCode === tenantCode);
    return this.createResponse(users);
  }

  async assignPermissionToRole(roleId, permissionId, tenantCode) {
    await this.delay();

    return this.createResponse({ message: '权限分配成功' });
  }

  async removeRolePermission(roleId, permissionId, tenantCode) {
    await this.delay();

    return this.createResponse({ message: '权限移除成功' });
  }

  async checkUserPermission(userId, tenantCode, url, method) {
    await this.delay();

    return this.createResponse({ hasPermission: true });
  }

  async getUserPermissions(userId, tenantCode) {
    await this.delay();

    // 返回用户拥有的权限
    const user = this.users.find(u => u.id === userId && u.tenantCode === tenantCode);
    if (user) {
      const role = this.roles.find(r => r.id === user.roleId);
      if (role) {
        // 根据角色返回相应权限
        return this.createResponse(this.permissions);
      }
    }

    return this.createResponse([]);
  }
}

export default new MockRBACService();