/**
 * RBAC 权限管理 CRUD 集成测试
 * 直接调用后端 API 测试新增和修改功能的完备性
 *
 * 测试流程：
 * 1. 登录获取 token → 设置到 token store
 * 2. 创建权限节点 → 验证创建成功
 * 3. 查询权限树 → 验证节点存在
 * 4. 修改权限节点 → 验证修改成功
 * 5. 再次查询 → 验证修改后的数据
 * 6. 更新权限状态 → 验证状态修改
 * 7. 删除权限节点 → 验证删除成功
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTokenStore } from '../../../src/stores/modules/token';
import authAxios from '../../../src/api/commons/index';
import axios from 'axios';
import PermissionService from '../../../src/api/system/permissionService';
import type { CreatePermissionRequest, UpdatePermissionRequest } from '../../../src/api/system/permissionService';

// 后端配置
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
const TEST_USER = {
  username: process.env.TEST_USERNAME || 'superadmin',
  password: process.env.TEST_PASSWORD || 'password',
  tenant_id: process.env.TEST_TENANT_ID || '0',  // 租户ID，默认为 '0'
};

// 测试用的唯一标识（避免重复）
const TEST_PREFIX = 'TEST_INTEGRATION';
const TEST_PERM_CODE = `${TEST_PREFIX}_${Date.now().toString(16).toUpperCase()}`;

describe('RBAC 权限管理 CRUD 集成测试（真实后端调用）', () => {
  let createdPermissionId: number | null = null;

  beforeAll(async () => {
    // 初始化 Pinia
    const pinia = createPinia();
    setActivePinia(pinia);

    // 配置测试超时
    vi.setConfig({ testTimeout: 60000 });

    // 修改 axios 默认 baseURL 指向后端（vitest node 环境需要完整 URL）
    (authAxios.defaults as any).baseURL = BACKEND_URL;

    // 登录获取 token
    const tokenStore = useTokenStore();

    try {
      // 调用登录 API 获取 token
      const response = await axios.post(`${BACKEND_URL}/api/v1/auth/login`, {
        username: TEST_USER.username,
        password: TEST_USER.password,
        tenant_id: TEST_USER.tenant_id,
      });

      if (response.data && response.data.code === 0) {
        // 后端返回格式可能是 NewLoginResponse (adminToken) 或 LoginResponse (access_token)
        const token = response.data.data?.adminToken || response.data.data?.access_token || response.data.data?.token;
        if (token) {
          tokenStore.setAdminToken(token);
          console.log('✓ 登录成功，获取 token');
        } else {
          console.warn('⚠️  登录响应中没有找到 token:', response.data);
        }
      } else {
        console.warn('⚠️  登录响应格式异常:', response.data);
      }
    } catch (error) {
      console.error('✗ 登录失败:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // 清理：如果测试失败，确保删除测试数据
    if (createdPermissionId) {
      try {
        await PermissionService.deletePermissionNode(createdPermissionId, true);
        console.log('✓ 清理测试数据完成');
      } catch (error) {
        console.warn('⚠️  清理测试数据失败:', error);
      }
    }
  });

  it('1. 创建权限节点 - 应该成功创建并返回完整数据', async () => {
    const createData: CreatePermissionRequest = {
      permission_name: `集成测试权限 ${TEST_PERM_CODE}`,
      permission_code: `TEST:${TEST_PERM_CODE}`,
      permission_type: 'menu',
      node_type: 'menu',
      path: `/test/integration/${TEST_PERM_CODE.toLowerCase()}`,
      method: 'GET',
      parent_id: 0,
      sort_order: 999,
      description: '这是一个集成测试创建的权限节点',
      status: 0,
      visible: true,
    };

    const response = await PermissionService.createPermissionNode(createData);

    // 验证响应
    expect(response).toBeDefined();
    expect(response.id).toBeDefined();
    expect(response.permission_name).toBe(createData.permission_name);
    expect(response.permission_code).toBe(createData.permission_code);
    expect(response.permission_type).toBe(createData.permission_type);
    expect(response.node_type).toBe(createData.node_type);
    expect(response.path).toBe(createData.path);
    expect(response.method).toBe(createData.method);
    expect(response.parent_id).toBe(createData.parent_id);
    expect(response.description).toBe(createData.description);
    expect(response.status).toBe(createData.status);
    expect(response.visible).toBe(createData.visible);
    expect(response.create_time).toBeDefined();

    // 保存 ID 用于后续测试
    createdPermissionId = response.id;
    expect(createdPermissionId).toBeGreaterThan(0);

    console.log('✓ 创建权限成功，ID:', createdPermissionId);
  });

  it('2. 获取权限树 - 应该能查到刚创建的权限节点', async () => {
    expect(createdPermissionId).not.toBeNull();

    const tree = await PermissionService.getPermissionTree({
      include_disabled: true,
    });

    expect(Array.isArray(tree)).toBe(true);

    // 在权限树中查找创建的节点
    function findNodeInTree(nodes: Array<unknown>): { permission_code: string; permission_name: string } | null {
      for (const node of nodes) {
        const n = node as { id?: number; children?: Array<unknown> };
        if (n.id === createdPermissionId) {
          return node as { permission_code: string; permission_name: string };
        }
        if (n.children && n.children.length > 0) {
          const found = findNodeInTree(n.children);
          if (found) return found;
        }
      }
      return null;
    }

    const foundNode = findNodeInTree(tree);
    expect(foundNode).toBeDefined();
    expect(foundNode!.permission_code).toBe(`TEST:${TEST_PERM_CODE}`);
    expect(foundNode!.permission_name).toBe(`集成测试权限 ${TEST_PERM_CODE}`);

    console.log('✓ 在权限树中找到创建的节点');
  });

  it('3. 获取权限列表 - 应该能查到刚创建的权限节点', async () => {
    expect(createdPermissionId).not.toBeNull();

    const permissions = await PermissionService.getPermissions({
      permission_code: TEST_PERM_CODE,
    });

    expect(Array.isArray(permissions)).toBe(true);

    const found = (permissions as Array<{ id: number }>).find(p => p.id === createdPermissionId);
    expect(found).toBeDefined();

    console.log('✓ 在权限列表中找到创建的节点');
  });

  it('4. 获取权限详情 - 应该返回正确的数据', async () => {
    expect(createdPermissionId).not.toBeNull();

    const response = await PermissionService.getPermissionNode(createdPermissionId!);

    expect(response).toBeDefined();
    expect(response.id).toBe(createdPermissionId);
    expect(response.permission_code).toBe(`TEST:${TEST_PERM_CODE}`);
    expect(response.permission_name).toBe(`集成测试权限 ${TEST_PERM_CODE}`);
    expect(response.description).toBe('这是一个集成测试创建的权限节点');

    console.log('✓ 获取权限详情成功');
  });

  it('5. 验证权限码唯一性 - 应该检测到已存在', async () => {
    expect(createdPermissionId).not.toBeNull();

    const response = await PermissionService.validateCode(`TEST:${TEST_PERM_CODE}`);

    expect(response).toBeDefined();
    expect(response.exists).toBe(true);

    // 排除自身后验证应该不存在冲突
    const responseExclude = await PermissionService.validateCode(
      `TEST:${TEST_PERM_CODE}`,
      createdPermissionId,
    );
    expect(responseExclude.exists).toBe(false);

    console.log('✓ 权限码唯一性验证正确');
  });

  it('6. 更新权限节点 - 应该成功修改并返回更新后数据', async () => {
    expect(createdPermissionId).not.toBeNull();

    const updateData: UpdatePermissionRequest = {
      permission_name: `集成测试权限 ${TEST_PERM_CODE} (已修改)`,
      description: '这是经过集成测试修改后的描述信息',
      sort_order: 1000,
      visible: false,
    };

    const response = await PermissionService.updatePermissionNode(
      createdPermissionId!,
      updateData,
    );

    expect(response).toBeDefined();
    expect(response.id).toBe(createdPermissionId);
    expect(response.permission_name).toBe(updateData.permission_name);
    expect(response.description).toBe(updateData.description);
    expect(response.sort_order).toBe(updateData.sort_order);
    expect(response.visible).toBe(updateData.visible);
    // 权限码不应该改变
    expect(response.permission_code).toBe(`TEST:${TEST_PERM_CODE}`);

    console.log('✓ 更新权限成功');
  });

  it('7. 再次获取权限详情 - 应该验证修改已生效', async () => {
    expect(createdPermissionId).not.toBeNull();

    const response = await PermissionService.getPermissionNode(createdPermissionId!);

    expect(response).toBeDefined();
    expect(response.id).toBe(createdPermissionId);
    expect(response.permission_name).toBe(`集成测试权限 ${TEST_PERM_CODE} (已修改)`);
    expect(response.description).toBe('这是经过集成测试修改后的描述信息');
    expect(response.sort_order).toBe(1000);
    expect(response.visible).toBe(false);
    // 验证未修改的字段保持不变
    expect(response.permission_code).toBe(`TEST:${TEST_PERM_CODE}`);
    expect(response.node_type).toBe('menu');
    expect(response.method).toBe('GET');

    console.log('✓ 修改已验证生效');
  });

  it('8. 更新权限状态 - 应该成功更新状态', async () => {
    expect(createdPermissionId).not.toBeNull();

    // 当前状态是 0（启用），改为 1（禁用）
    await PermissionService.updatePermissionNodeStatus(createdPermissionId!, 1);

    // 验证状态已更新
    const response = await PermissionService.getPermissionNode(createdPermissionId!);
    expect(response.status).toBe(1);

    console.log('✓ 状态更新成功');
  });

  it('9. 删除权限节点 - 应该成功删除', async () => {
    expect(createdPermissionId).not.toBeNull();

    // 删除节点
    await PermissionService.deletePermissionNode(createdPermissionId!, true);

    // 验证删除：再次获取应该返回 404 错误
    let errorOccurred = false;
    try {
      await PermissionService.getPermissionNode(createdPermissionId!);
    } catch (error) {
      errorOccurred = true;
      // 验证错误信息包含 404 或 不存在
      expect((error as Error).message).toContain('不存在');
    }

    expect(errorOccurred).toBe(true);

    console.log('✓ 删除成功验证');

    // 清理 ID
    createdPermissionId = null;
  });
});
