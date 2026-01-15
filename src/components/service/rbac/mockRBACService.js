/**
 * 模拟RBAC服务 - 用于在后端没有提供RBAC API时提供模拟数据
 */
class MockRBACService {
  constructor() {
    // 初始化模拟数据
    this.users = [
      {
        id: 1,
        user_code: 'admin',
        user_name: 'admin',
        nick_name: '超级管理员',
        dept_id: 1,
        position: 'admin',
        tenantId: 1,
        phone: '13800138000',
        email: 'admin@example.com',
        gender: 'male',
        status: 1,
        roleId: 1,
        create_time: '2024-01-01 10:00:00',
        remark: '超级管理员账户',
        tenant_code: 'default'
      },
      {
        id: 2,
        user_code: 'user001',
        user_name: 'zhangsan',
        nick_name: '张三',
        dept_id: 2,
        position: 'developer',
        tenantId: 1,
        phone: '13800138001',
        email: 'zhangsan@example.com',
        gender: 'male',
        status: 1,
        roleId: 2,
        create_time: '2024-01-02 10:00:00',
        remark: '开发工程师',
        tenant_code: 'default'
      },
      {
        id: 3,
        user_code: 'user002',
        user_name: 'lisi',
        nick_name: '李四',
        dept_id: 3,
        position: 'tester',
        tenantId: 1,
        phone: '13800138002',
        email: 'lisi@example.com',
        gender: 'female',
        status: 1,
        roleId: 3,
        create_time: '2024-01-03 10:00:00',
        remark: '测试工程师',
        tenant_code: 'default'
      }
    ];

    this.roles = [
      {
        id: 1,
        role_code: 'superadmin',
        role_name: '超级管理员',
        sort_order: 1,
        status: 1,
        remark: '系统最高权限',
        tenant_code: 'default',
        create_time: '2024-01-01 10:00:00'
      },
      {
        id: 2,
        role_code: 'admin',
        role_name: '管理员',
        sort_order: 2,
        status: 1,
        remark: '系统管理权限',
        tenant_code: 'default',
        create_time: '2024-01-01 10:00:00'
      },
      {
        id: 3,
        role_code: 'user',
        role_name: '普通用户',
        sort_order: 3,
        status: 1,
        remark: '普通用户权限',
        tenant_code: 'default',
        create_time: '2024-01-01 10:00:00'
      }
    ];

    this.permissions = [
      {
        id: 1,
        permission_code: 'system:user:page',
        permission_name: '用户管理页面',
        permission_type: 'page',
        status: 1,
        create_time: '2024-01-01 10:00:00',
        tenant_code: 'default'
      },
      {
        id: 2,
        permission_code: 'system:role:page',
        permission_name: '角色管理页面',
        permission_type: 'page',
        status: 1,
        create_time: '2024-01-01 10:00:00',
        tenant_code: 'default'
      },
      {
        id: 3,
        permission_code: 'system:permission:page',
        permission_name: '权限管理页面',
        permission_type: 'page',
        status: 1,
        create_time: '2024-01-01 10:00:00',
        tenant_code: 'default'
      },
      {
        id: 4,
        permission_code: 'system:user:add',
        permission_name: '用户新增',
        permission_type: 'button',
        status: 1,
        create_time: '2024-01-01 10:00:00',
        tenant_code: 'default'
      },
      {
        id: 5,
        permission_code: 'system:user:edit',
        permission_name: '用户编辑',
        permission_type: 'button',
        status: 1,
        create_time: '2024-01-01 10:00:00',
        tenant_code: 'default'
      }
    ];

    this.departments = [
      {
        id: 1,
        dept_code: 'dept001',
        dept_name: '总部',
        parent_id: 0,
        status: 1,
        sort: 1,
        leader: 'admin',
        phone: '010-12345678',
        email: 'headquarters@example.com',
        create_time: '2024-01-01 10:00:00',
        tenant_code: 'default'
      },
      {
        id: 2,
        dept_code: 'dept002',
        dept_name: '技术部',
        parent_id: 1,
        status: 1,
        sort: 1,
        leader: 'zhangsan',
        phone: '010-12345679',
        email: 'tech@example.com',
        create_time: '2024-01-01 10:00:00',
        tenant_code: 'default'
      },
      {
        id: 3,
        dept_code: 'dept003',
        dept_name: '测试部',
        parent_id: 1,
        status: 1,
        sort: 2,
        leader: 'lisi',
        phone: '010-12345680',
        email: 'test@example.com',
        create_time: '2024-01-01 10:00:00',
        tenant_code: 'default'
      }
    ];

    this.positions = [
      {
        id: 1,
        position_code: 'pos001',
        position_name: '总经理',
        status: 1,
        create_time: '2024-01-01 10:00:00',
        tenant_code: 'default'
      },
      {
        id: 2,
        position_code: 'pos002',
        position_name: '开发工程师',
        status: 1,
        create_time: '2024-01-01 10:00:00',
        tenant_code: 'default'
      },
      {
        id: 3,
        position_code: 'pos003',
        position_name: '测试工程师',
        status: 1,
        create_time: '2024-01-01 10:00:00',
        tenant_code: 'default'
      }
    ];

    this.tenants = [
      {
        id: 1,
        tenant_code: 'default',
        tenant_name: '默认租户',
        contact_person: 'admin',
        contact_phone: '13800138000',
        status: 1,
        create_time: '2024-01-01 10:00:00'
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
      result = result.filter(user => user.user_name.includes(params.username));
    }
    if (params.nickname) {
      result = result.filter(user => user.nick_name.includes(params.nickname));
    }
    if (params.phone) {
      result = result.filter(user => user.phone.includes(params.phone));
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
      user_code: userData.user_name,
      create_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      tenant_code: userData.tenant_code || 'default'
    };

    this.users.push(newUser);
    return this.createResponse(newUser);
  }

  async updateUser(user_identifier, tenant_code, userData) {
    await this.delay();

    // 尝试按 user_code 或 user_name 查找用户
    const index = this.users.findIndex(u =>
      (u.user_code === user_identifier || u.user_name === user_identifier) &&
      u.tenant_code === tenant_code
    );
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...userData };
      return this.createResponse(this.users[index]);
    }

    throw new Error('用户不存在');
  }

  async deleteUser(user_identifier, tenant_code) {
    await this.delay();

    // 尝试按 user_code 或 user_name 查找用户
    const index = this.users.findIndex(u =>
      (u.user_code === user_identifier || u.user_name === user_identifier) &&
      u.tenant_code === tenant_code
    );
    if (index !== -1) {
      this.users.splice(index, 1);
      return this.createResponse({ message: '用户删除成功' });
    }

    throw new Error('用户不存在');
  }

  async resetUserPassword(user_identifier) {
    await this.delay();

    // 尝试按 user_code 或 user_name 查找用户
    const user = this.users.find(u =>
      u.user_code === user_identifier || u.user_name === user_identifier
    );
    if (user) {
      // 模拟重置密码操作
      return this.createResponse({ message: '密码重置成功' });
    }

    throw new Error('用户不存在');
  }

  async getUserRoles(userId, tenant_code) {
    await this.delay();

    const user = this.users.find(u => u.id === userId && u.tenant_code === tenant_code);
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
      result = result.filter(role => role.role_name.includes(params.role_name));
    }
    if (params.role_code) {
      result = result.filter(role => role.role_code.includes(params.role_code));
    }
    if (params.status !== undefined) {
      result = result.filter(role => role.status == params.status);
    }
    if (params.tenant_code) {
      result = result.filter(role => role.tenant_code === params.tenant_code);
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
      create_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      tenant_code: roleData.tenant_code || 'default'
    };

    this.roles.push(newRole);
    return this.createResponse(newRole);
  }

  async updateRole(role_code, tenant_code, roleData) {
    await this.delay();

    const index = this.roles.findIndex(r => r.role_code === role_code && r.tenant_code === tenant_code);
    if (index !== -1) {
      this.roles[index] = { ...this.roles[index], ...roleData };
      return this.createResponse(this.roles[index]);
    }

    throw new Error('角色不存在');
  }

  async deleteRole(role_code, tenant_code) {
    await this.delay();

    const index = this.roles.findIndex(r => r.role_code === role_code && r.tenant_code === tenant_code);
    if (index !== -1) {
      this.roles.splice(index, 1);
      return this.createResponse({ message: '角色删除成功' });
    }

    throw new Error('角色不存在');
  }

  async getRolePermissions(roleId, tenant_code) {
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
      create_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      tenant_code: permissionData.tenant_code || 'default'
    };

    this.permissions.push(newPermission);
    return this.createResponse(newPermission);
  }

  async updatePermission(permission_code, tenant_code, permissionData) {
    await this.delay();

    const index = this.permissions.findIndex(p => p.permission_code === permission_code && p.tenant_code === tenant_code);
    if (index !== -1) {
      this.permissions[index] = { ...this.permissions[index], ...permissionData };
      return this.createResponse(this.permissions[index]);
    }

    throw new Error('权限不存在');
  }

  async deletePermission(permission_code, tenant_code) {
    await this.delay();

    const index = this.permissions.findIndex(p => p.permission_code === permission_code && p.tenant_code === tenant_code);
    if (index !== -1) {
      this.permissions.splice(index, 1);
      return this.createResponse({ message: '权限删除成功' });
    }

    throw new Error('权限不存在');
  }

  async updatePermissionStatus(permission_code, tenant_code, status) {
    await this.delay();

    const index = this.permissions.findIndex(p => p.permission_code === permission_code && p.tenant_code === tenant_code);
    if (index !== -1) {
      this.permissions[index].status = status;
      return this.createResponse(this.permissions[index]);
    }

    throw new Error('权限不存在');
  }

  async getRolesByPermission(permissionId, tenant_code) {
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
      if (dept.parent_id === 0) {
        tree.push(deptMap[dept.id]);
      } else {
        const parent = deptMap[dept.parent_id];
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
      dept_code: deptData.dept_name.toLowerCase().replace(/\s+/g, ''),
      create_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      tenant_code: deptData.tenant_code || 'default'
    };

    this.departments.push(newDept);
    return this.createResponse(newDept);
  }

  async updateDepartment(dept_code, deptData) {
    await this.delay();

    const index = this.departments.findIndex(d => d.dept_code === dept_code);
    if (index !== -1) {
      this.departments[index] = { ...this.departments[index], ...deptData };
      return this.createResponse(this.departments[index]);
    }

    throw new Error('部门不存在');
  }

  async deleteDepartment(dept_code, tenant_code) {
    await this.delay();

    const index = this.departments.findIndex(d => d.dept_code === dept_code && d.tenant_code === tenant_code);
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
      position_code: posData.position_name.toLowerCase().replace(/\s+/g, ''),
      create_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      tenant_code: posData.tenant_code || 'default'
    };

    this.positions.push(newPosition);
    return this.createResponse(newPosition);
  }

  async updatePosition(position_code, posData) {
    await this.delay();

    const index = this.positions.findIndex(p => p.position_code === position_code);
    if (index !== -1) {
      this.positions[index] = { ...this.positions[index], ...posData };
      return this.createResponse(this.positions[index]);
    }

    throw new Error('岗位不存在');
  }

  async deletePosition(position_code, tenant_code) {
    await this.delay();

    const index = this.positions.findIndex(p => p.position_code === position_code && p.tenant_code === tenant_code);
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
      create_time: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    this.tenants.push(newTenant);
    return this.createResponse(newTenant);
  }

  async updateTenant(tenant_code, tenantData) {
    await this.delay();

    const index = this.tenants.findIndex(t => t.tenant_code === tenant_code);
    if (index !== -1) {
      this.tenants[index] = { ...this.tenants[index], ...tenantData };
      return this.createResponse(this.tenants[index]);
    }

    throw new Error('租户不存在');
  }

  async deleteTenant(tenant_code) {
    await this.delay();

    const index = this.tenants.findIndex(t => t.tenant_code === tenant_code);
    if (index !== -1) {
      this.tenants.splice(index, 1);
      return this.createResponse({ message: '租户删除成功' });
    }

    throw new Error('租户不存在');
  }

  // 关联管理API
  async assignRoleToUser(userIdentifier, roleId, tenant_code) {
    await this.delay();

    // 尝试按 user_code 或 user_name 查找用户
    const user = this.users.find(u =>
      (u.user_code === userIdentifier || u.user_name === userIdentifier) &&
      u.tenant_code === tenant_code
    );
    if (user) {
      user.roleId = roleId;
      return this.createResponse({ message: '角色分配成功' });
    }

    throw new Error('用户不存在');
  }

  async removeUserRole(userIdentifier, roleId, tenant_code) {
    await this.delay();

    // 尝试按 user_code 或 user_name 查找用户
    const user = this.users.find(u =>
      (u.user_code === userIdentifier || u.user_name === userIdentifier) &&
      u.tenant_code === tenant_code && u.roleId === roleId
    );
    if (user) {
      user.roleId = null;
      return this.createResponse({ message: '角色移除成功' });
    }

    throw new Error('用户角色关联不存在');
  }

  async getUsersByRole(roleId, tenant_code) {
    await this.delay();

    const users = this.users.filter(u => u.roleId === roleId && u.tenant_code === tenant_code);
    return this.createResponse(users);
  }

  async assignPermissionToRole(roleId, permissionId, tenant_code) {
    await this.delay();

    return this.createResponse({ message: '权限分配成功' });
  }

  async removeRolePermission(roleId, permissionId, tenant_code) {
    await this.delay();

    return this.createResponse({ message: '权限移除成功' });
  }

  async checkUserPermission(userId, tenant_code, url, method) {
    await this.delay();

    return this.createResponse({ hasPermission: true });
  }

  async getUserPermissions(userId, tenant_code) {
    await this.delay();

    // 返回用户拥有的权限
    const user = this.users.find(u => u.id === userId && u.tenant_code === tenant_code);
    if (user) {
      const role = this.roles.find(r => r.id === user.roleId);
      if (role) {
        // 根据角色返回相应权限
        return this.createResponse(this.permissions);
      }
    }

    return this.createResponse([]);
  }

  // 批量分配角色给用户
  async assignRolesToUser(userIdentifier, roleIds, tenant_code) {
    await this.delay();

    // 尝试按 user_code 或 user_name 查找用户
    const user = this.users.find(u =>
      (u.user_code === userIdentifier || u.user_name === userIdentifier) &&
      u.tenant_code === tenant_code
    );
    if (user) {
      // 为用户分配多个角色（这里简化为只保留最后一个角色）
      user.roleId = roleIds[roleIds.length - 1]; // 或者可以实现为多角色分配
      return this.createResponse({ message: '角色分配成功' });
    }

    throw new Error('用户不存在');
  }
}

export default new MockRBACService();