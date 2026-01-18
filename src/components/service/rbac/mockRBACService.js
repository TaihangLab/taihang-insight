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
        tenant_id: 'default'
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
        tenant_id: 'default'
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
        tenant_id: 'default'
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
        tenant_id: 'default',
        create_time: '2024-01-01 10:00:00'
      },
      {
        id: 2,
        role_code: 'admin',
        role_name: '管理员',
        sort_order: 2,
        status: 1,
        remark: '系统管理权限',
        tenant_id: 'default',
        create_time: '2024-01-01 10:00:00'
      },
      {
        id: 3,
        role_code: 'user',
        role_name: '普通用户',
        sort_order: 3,
        status: 1,
        remark: '普通用户权限',
        tenant_id: 'default',
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
        tenant_id: 'default'
      },
      {
        id: 2,
        permission_code: 'system:role:page',
        permission_name: '角色管理页面',
        permission_type: 'page',
        status: 1,
        create_time: '2024-01-01 10:00:00',
        tenant_id: 'default'
      },
      {
        id: 3,
        permission_code: 'system:permission:page',
        permission_name: '权限管理页面',
        permission_type: 'page',
        status: 1,
        create_time: '2024-01-01 10:00:00',
        tenant_id: 'default'
      },
      {
        id: 4,
        permission_code: 'system:user:add',
        permission_name: '用户新增',
        permission_type: 'button',
        status: 1,
        create_time: '2024-01-01 10:00:00',
        tenant_id: 'default'
      },
      {
        id: 5,
        permission_code: 'system:user:edit',
        permission_name: '用户编辑',
        permission_type: 'button',
        status: 1,
        create_time: '2024-01-01 10:00:00',
        tenant_id: 'default'
      }
    ];

    // 树形权限数据（新的三级权限结构）
    this.permissionTree = [
      {
        id: 'folder_system',
        code: 'system_manage',
        name: '系统管理',
        description: '系统管理模块',
        type: 'folder',
        parentId: null,
        path: '/systemManage',
        icon: 'el-icon-setting',
        visible: true,
        sortOrder: 1,
        status: 0,
        isSystem: true,
        children: [
          {
            id: 'menu_user',
            code: 'system:user:view',
            name: '用户管理',
            description: '用户管理页面访问权限',
            type: 'menu',
            parentId: 'folder_system',
            path: '/systemManage/userManagement',
            icon: 'el-icon-user',
            visible: true,
            sortOrder: 1,
            status: 0,
            isSystem: true,
            children: [
              {
                id: 'btn_user_add',
                code: 'system:user:add',
                name: '新增用户',
                description: '新增用户的权限',
                type: 'button',
                parentId: 'menu_user',
                api_path: '/api/v1/rbac/users',
                methods: ['POST'],
                category: 'WRITE',
                resource: 'user',
                action: 'add',
                sortOrder: 1,
                status: 0,
                isSystem: false
              },
              {
                id: 'btn_user_edit',
                code: 'system:user:edit',
                name: '编辑用户',
                description: '编辑用户的权限',
                type: 'button',
                parentId: 'menu_user',
                api_path: '/api/v1/rbac/users/{user_code}',
                methods: ['PUT'],
                category: 'WRITE',
                resource: 'user',
                action: 'edit',
                sortOrder: 2,
                status: 0,
                isSystem: false
              },
              {
                id: 'btn_user_delete',
                code: 'system:user:delete',
                name: '删除用户',
                description: '删除用户的权限',
                type: 'button',
                parentId: 'menu_user',
                api_path: '/api/v1/rbac/users/{user_code}',
                methods: ['DELETE'],
                category: 'DELETE',
                resource: 'user',
                action: 'delete',
                sortOrder: 3,
                status: 0,
                isSystem: false
              },
              {
                id: 'btn_user_reset',
                code: 'system:user:reset_password',
                name: '重置密码',
                description: '重置用户密码的权限',
                type: 'button',
                parentId: 'menu_user',
                api_path: '/api/v1/rbac/users/{user_code}/reset-password',
                methods: ['POST'],
                category: 'SPECIAL',
                resource: 'user',
                action: 'reset_password',
                sortOrder: 4,
                status: 0,
                isSystem: false
              }
            ]
          },
          {
            id: 'menu_role',
            code: 'system:role:view',
            name: '角色管理',
            description: '角色管理页面访问权限',
            type: 'menu',
            parentId: 'folder_system',
            path: '/systemManage/roleManagement',
            icon: 'el-icon-s-custom',
            visible: true,
            sortOrder: 2,
            status: 0,
            isSystem: true,
            children: [
              {
                id: 'btn_role_add',
                code: 'system:role:add',
                name: '新增角色',
                description: '新增角色的权限',
                type: 'button',
                parentId: 'menu_role',
                api_path: '/api/v1/rbac/roles',
                methods: ['POST'],
                category: 'WRITE',
                resource: 'role',
                action: 'add',
                sortOrder: 1,
                status: 0,
                isSystem: false
              },
              {
                id: 'btn_role_edit',
                code: 'system:role:edit',
                name: '编辑角色',
                description: '编辑角色的权限',
                type: 'button',
                parentId: 'menu_role',
                api_path: '/api/v1/rbac/roles/{role_code}',
                methods: ['PUT'],
                category: 'WRITE',
                resource: 'role',
                action: 'edit',
                sortOrder: 2,
                status: 0,
                isSystem: false
              },
              {
                id: 'btn_role_delete',
                code: 'system:role:delete',
                name: '删除角色',
                description: '删除角色的权限',
                type: 'button',
                parentId: 'menu_role',
                api_path: '/api/v1/rbac/roles/{role_code}',
                methods: ['DELETE'],
                category: 'DELETE',
                resource: 'role',
                action: 'delete',
                sortOrder: 3,
                status: 0,
                isSystem: false
              }
            ]
          },
          {
            id: 'menu_permission',
            code: 'system:permission:view',
            name: '权限管理',
            description: '权限管理页面访问权限',
            type: 'menu',
            parentId: 'folder_system',
            path: '/systemManage/permissionManagement',
            icon: 'el-icon-lock',
            visible: true,
            sortOrder: 3,
            status: 0,
            isSystem: true,
            children: []
          }
        ]
      },
      {
        id: 'folder_monitoring',
        code: 'monitoring',
        name: '监控预警',
        description: '监控预警模块',
        type: 'folder',
        parentId: null,
        path: '/monitoring',
        icon: 'el-icon-video-camera',
        visible: true,
        sortOrder: 2,
        status: 0,
        isSystem: true,
        children: [
          {
            id: 'menu_realtime',
            code: 'monitoring:realtime:view',
            name: '实时监控',
            description: '实时监控页面访问权限',
            type: 'menu',
            parentId: 'folder_monitoring',
            path: '/monitoring/realtime',
            icon: 'el-icon-monitor',
            visible: true,
            sortOrder: 1,
            status: 0,
            isSystem: true,
            children: [
              {
                id: 'btn_monitoring_start',
                code: 'monitoring:realtime:start',
                name: '开始监控',
                description: '开始监控的权限',
                type: 'button',
                parentId: 'menu_realtime',
                api_path: '/api/v1/monitoring/realtime/start',
                methods: ['POST'],
                category: 'WRITE',
                resource: 'realtime',
                action: 'start',
                sortOrder: 1,
                status: 0,
                isSystem: false
              },
              {
                id: 'btn_monitoring_stop',
                code: 'monitoring:realtime:stop',
                name: '停止监控',
                description: '停止监控的权限',
                type: 'button',
                parentId: 'menu_realtime',
                api_path: '/api/v1/monitoring/realtime/stop',
                methods: ['POST'],
                category: 'WRITE',
                resource: 'realtime',
                action: 'stop',
                sortOrder: 2,
                status: 0,
                isSystem: false
              }
            ]
          }
        ]
      }
    ];

    this.departments = [
      {
        id: 1,
        name: '总部',
        parent_id: 0,
        status: 1,
        sort: 1,
        leader: 'admin',
        phone: '010-12345678',
        email: 'headquarters@example.com',
        create_time: '2024-01-01 10:00:00',
        tenant_id: 'default'
      },
      {
        id: 2,
        name: '技术部',
        parent_id: 1,
        status: 1,
        sort: 1,
        leader: 'zhangsan',
        phone: '010-12345679',
        email: 'tech@example.com',
        create_time: '2024-01-01 10:00:00',
        tenant_id: 'default'
      },
      {
        id: 3,
        name: '测试部',
        parent_id: 1,
        status: 1,
        sort: 2,
        leader: 'lisi',
        phone: '010-12345680',
        email: 'test@example.com',
        create_time: '2024-01-01 10:00:00',
        tenant_id: 'default'
      }
    ];

    this.positions = [
      {
        id: 1,
        position_code: 'pos001',
        position_name: '总经理',
        status: 1,
        create_time: '2024-01-01 10:00:00',
        tenant_id: 'default'
      },
      {
        id: 2,
        position_code: 'pos002',
        position_name: '开发工程师',
        status: 1,
        create_time: '2024-01-01 10:00:00',
        tenant_id: 'default'
      },
      {
        id: 3,
        position_code: 'pos003',
        position_name: '测试工程师',
        status: 1,
        create_time: '2024-01-01 10:00:00',
        tenant_id: 'default'
      }
    ];

    this.tenants = [
      {
        id: 1,
        tenant_id: 'default',
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
      tenant_id: userData.tenant_id || 'default'
    };

    this.users.push(newUser);
    return this.createResponse(newUser);
  }

  async updateUser(user_identifier, tenant_id, userData) {
    await this.delay();

    // 尝试按 user_code 或 user_name 查找用户
    const index = this.users.findIndex(u =>
      (u.user_code === user_identifier || u.user_name === user_identifier) &&
      u.tenant_id === tenant_id
    );
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...userData };
      return this.createResponse(this.users[index]);
    }

    throw new Error('用户不存在');
  }

  async deleteUser(user_identifier, tenant_id) {
    await this.delay();

    // 尝试按 user_code 或 user_name 查找用户
    const index = this.users.findIndex(u =>
      (u.user_code === user_identifier || u.user_name === user_identifier) &&
      u.tenant_id === tenant_id
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

  async getUserRoles(userId, tenant_id) {
    await this.delay();

    const user = this.users.find(u => u.id === userId && u.tenant_id === tenant_id);
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
    if (params.tenant_id) {
      result = result.filter(role => role.tenant_id === params.tenant_id);
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
      tenant_id: roleData.tenant_id || 'default'
    };

    this.roles.push(newRole);
    return this.createResponse(newRole);
  }

  async updateRole(role_code, tenant_id, roleData) {
    await this.delay();

    const index = this.roles.findIndex(r => r.role_code === role_code && r.tenant_id === tenant_id);
    if (index !== -1) {
      this.roles[index] = { ...this.roles[index], ...roleData };
      return this.createResponse(this.roles[index]);
    }

    throw new Error('角色不存在');
  }

  async deleteRole(role_code, tenant_id) {
    await this.delay();

    const index = this.roles.findIndex(r => r.role_code === role_code && r.tenant_id === tenant_id);
    if (index !== -1) {
      this.roles.splice(index, 1);
      return this.createResponse({ message: '角色删除成功' });
    }

    throw new Error('角色不存在');
  }

  async getRolePermissions(params) {
    await this.delay();

    // 如果传入的是对象，则从中提取role_id
    const roleId = typeof params === 'object' && params !== null ? params.role_id : params;

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
      tenant_id: permissionData.tenant_id || 'default'
    };

    this.permissions.push(newPermission);
    return this.createResponse(newPermission);
  }

  async updatePermission(permission_code, tenant_id, permissionData) {
    await this.delay();

    const index = this.permissions.findIndex(p => p.permission_code === permission_code && p.tenant_id === tenant_id);
    if (index !== -1) {
      this.permissions[index] = { ...this.permissions[index], ...permissionData };
      return this.createResponse(this.permissions[index]);
    }

    throw new Error('权限不存在');
  }

  async deletePermission(permission_code, tenant_id) {
    await this.delay();

    const index = this.permissions.findIndex(p => p.permission_code === permission_code && p.tenant_id === tenant_id);
    if (index !== -1) {
      this.permissions.splice(index, 1);
      return this.createResponse({ message: '权限删除成功' });
    }

    throw new Error('权限不存在');
  }

  async updatePermissionStatus(permission_code, tenant_id, status) {
    await this.delay();

    const index = this.permissions.findIndex(p => p.permission_code === permission_code && p.tenant_id === tenant_id);
    if (index !== -1) {
      this.permissions[index].status = status;
      return this.createResponse(this.permissions[index]);
    }

    throw new Error('权限不存在');
  }

  async getRolesByPermission(permissionId, tenant_id) {
    await this.delay();

    return this.createResponse(this.roles);
  }

  // ==================== 树形权限相关 API ====================

  /**
   * 获取权限树结构
   */
  async getPermissionTree(params = {}) {
    await this.delay();

    // 权限管理功能与租户无关，从参数中移除租户代码
    const { tenant_id, ...otherParams } = params;

    // 返回树形结构
    return this.createResponse(this.permissionTree);
  }

  /**
   * 创建权限节点
   */
  async createPermissionNode(nodeData) {
    await this.delay();

    // 权限管理功能与租户无关，从数据中移除租户代码
    const { tenant_id, ...otherData } = nodeData;

    const newNode = {
      ...otherData,
      id: `node_${Date.now()}`,
      children: otherData.children || []
    };

    // 如果有父节点，添加到父节点的children中
    if (nodeData.parentId) {
      const parentNode = this.findNodeInTree(this.permissionTree, nodeData.parentId);
      if (parentNode) {
        if (!parentNode.children) {
          parentNode.children = [];
        }
        parentNode.children.push(newNode);
      }
    } else {
      // 没有父节点，添加到根节点
      this.permissionTree.push(newNode);
    }

    return this.createResponse(newNode);
  }

  /**
   * 更新权限节点
   */
  async updatePermissionNode(nodeId, nodeData) {
    await this.delay();

    // 权限管理功能与租户无关，从数据中移除租户代码
    const { tenant_id, ...otherData } = nodeData;

    const node = this.findNodeInTree(this.permissionTree, nodeId);
    if (node) {
      Object.assign(node, otherData);
      return this.createResponse(node);
    }

    throw new Error('权限节点不存在');
  }

  /**
   * 删除权限节点
   */
  async deletePermissionNode(nodeId, force = false) {
    await this.delay();

    const result = this.removeNodeFromTree(this.permissionTree, nodeId, force);
    if (result) {
      return this.createResponse({ message: '权限节点删除成功' });
    }

    throw new Error('权限节点不存在');
  }

  /**
   * 在树中查找节点（辅助方法）
   */
  findNodeInTree(tree, nodeId) {
    for (const node of tree) {
      if (node.id === nodeId) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const found = this.findNodeInTree(node.children, nodeId);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * 从树中删除节点（辅助方法）
   */
  removeNodeFromTree(tree, nodeId, force = false) {
    for (let i = 0; i < tree.length; i++) {
      const node = tree[i];
      if (node.id === nodeId) {
        // 如果有子节点且不是强制删除，则不允许删除
        if (node.children && node.children.length > 0 && !force) {
          throw new Error('该节点有子节点，无法删除');
        }
        tree.splice(i, 1);
        return true;
      }
      if (node.children && node.children.length > 0) {
        const removed = this.removeNodeFromTree(node.children, nodeId, force);
        if (removed) return true;
      }
    }
    return false;
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
      create_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      tenant_id: deptData.tenant_id || 'default'
    };

    this.departments.push(newDept);
    return this.createResponse(newDept);
  }

  async updateDepartment(id, deptData) {
    await this.delay();

    const index = this.departments.findIndex(d => d.id === id);
    if (index !== -1) {
      this.departments[index] = { ...this.departments[index], ...deptData };
      return this.createResponse(this.departments[index]);
    }

    throw new Error('部门不存在');
  }

  async deleteDepartment(id, tenant_id) {
    await this.delay();

    const index = this.departments.findIndex(d => d.id === id && d.tenant_id === tenant_id);
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
      tenant_id: posData.tenant_id || 'default'
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

  async deletePosition(position_code, tenant_id) {
    await this.delay();

    const index = this.positions.findIndex(p => p.position_code === position_code && p.tenant_id === tenant_id);
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

  async updateTenant(tenant_id, tenantData) {
    await this.delay();

    const index = this.tenants.findIndex(t => t.tenant_id === tenant_id);
    if (index !== -1) {
      this.tenants[index] = { ...this.tenants[index], ...tenantData };
      return this.createResponse(this.tenants[index]);
    }

    throw new Error('租户不存在');
  }

  async deleteTenant(tenant_id) {
    await this.delay();

    const index = this.tenants.findIndex(t => t.tenant_id === tenant_id);
    if (index !== -1) {
      this.tenants.splice(index, 1);
      return this.createResponse({ message: '租户删除成功' });
    }

    throw new Error('租户不存在');
  }

  async batchDeleteTenants(tenant_ids) {
    await this.delay();

    let deletedCount = 0;
    const notFoundCodes = [];

    tenant_ids.forEach(code => {
      const index = this.tenants.findIndex(t => t.tenant_id === code);
      if (index !== -1) {
        this.tenants.splice(index, 1);
        deletedCount++;
      } else {
        notFoundCodes.push(code);
      }
    });

    return this.createResponse({
      message: `成功删除 ${deletedCount} 个租户`,
      deleted_count: deletedCount,
      not_found_codes: notFoundCodes
    });
  }

  // 关联管理API
  async assignRoleToUser(userIdentifier, roleId, tenant_id) {
    await this.delay();

    // 尝试按 user_code 或 user_name 查找用户
    const user = this.users.find(u =>
      (u.user_code === userIdentifier || u.user_name === userIdentifier) &&
      u.tenant_id === tenant_id
    );
    if (user) {
      user.roleId = roleId;
      return this.createResponse({ message: '角色分配成功' });
    }

    throw new Error('用户不存在');
  }

  async removeUserRole(userIdentifier, roleId, tenant_id) {
    await this.delay();

    // 尝试按 user_code 或 user_name 查找用户
    const user = this.users.find(u =>
      (u.user_code === userIdentifier || u.user_name === userIdentifier) &&
      u.tenant_id === tenant_id && u.roleId === roleId
    );
    if (user) {
      user.roleId = null;
      return this.createResponse({ message: '角色移除成功' });
    }

    throw new Error('用户角色关联不存在');
  }

  async getUsersByRole(roleId, tenant_id) {
    await this.delay();

    const users = this.users.filter(u => u.roleId === roleId && u.tenant_id === tenant_id);
    return this.createResponse(users);
  }

  async assignPermissionToRole(roleId, permissionId, tenant_id) {
    await this.delay();

    return this.createResponse({ message: '权限分配成功' });
  }

  async removeRolePermission(roleId, permissionId, tenant_id) {
    await this.delay();

    return this.createResponse({ message: '权限移除成功' });
  }

  async checkUserPermission(userId, tenant_id, url, method) {
    await this.delay();

    return this.createResponse({ hasPermission: true });
  }

  async getUserPermissions(userId, tenant_id) {
    await this.delay();

    // 返回用户拥有的权限
    const user = this.users.find(u => u.id === userId && u.tenant_id === tenant_id);
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
  async assignRolesToUser(userIdentifier, roleIds, tenant_id) {
    await this.delay();

    // 尝试按 user_code 或 user_name 查找用户
    const user = this.users.find(u =>
      (u.user_code === userIdentifier || u.user_name === userIdentifier) &&
      u.tenant_id === tenant_id
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