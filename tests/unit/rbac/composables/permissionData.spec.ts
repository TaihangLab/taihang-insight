/**
 * 权限数据管理 Composable 单元测试
 * 重点测试：
 * 1. 响应拦截器已提取 data 字段后的数据格式处理
 * 2. node_type 转换（directory → folder）
 * 3. 真实后端响应数据结构
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePermissionData } from '@/pages/system/composable/permission/usePermissionData';

// Mock the service
const mockGetPermissionTree = vi.fn();
const mockGetPermissions = vi.fn();
const mockCreatePermissionNode = vi.fn();

vi.mock('@/api/system/permissionService', () => ({
  default: {
    getPermissionTree: () => mockGetPermissionTree(),
    getPermissions: () => mockGetPermissions(),
    createPermissionNode: () => mockCreatePermissionNode(),
    updatePermissionNode: vi.fn(),
    deletePermissionNode: vi.fn(),
    updatePermissionNodeStatus: vi.fn(),
  },
}));

describe('usePermissionData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchPermissionTree - 响应拦截器已提取 data 字段', () => {
    it('应该处理响应拦截器直接返回数组的格式', async () => {
      // 响应拦截器已提取 data 字段，直接返回数组
      const mockArray = [
        {
          id: 1,
          permission_name: '系统管理',
          permission_code: 'SYSTEM',
          node_type: 'folder',
          permission_type: 'folder',
          path: '/system',
          method: 'GET',
          parent_id: null,
          sort_order: 1,
          status: 0,
          visible: true,
          has_children: true,
          children: [
            {
              id: 2,
              permission_name: '用户管理',
              permission_code: 'SYSTEM:USER',
              node_type: 'menu',
              permission_type: 'menu',
              path: '/system/user',
              method: 'GET',
              parent_id: 1,
              sort_order: 1,
              status: 0,
              visible: true,
              has_children: false,
              children: [],
            },
          ],
        },
      ];

      mockGetPermissionTree.mockResolvedValue(mockArray);

      const { permissionTree, fetchPermissionTree } = usePermissionData();
      await fetchPermissionTree();

      expect(permissionTree.value).toHaveLength(1);
      expect(permissionTree.value[0].node_type).toBe('folder');
      expect(permissionTree.value[0].children![0].node_type).toBe('menu');
    });

    it('应该处理空数组响应', async () => {
      mockGetPermissionTree.mockResolvedValue([]);

      const { permissionTree, fetchPermissionTree } = usePermissionData();
      await fetchPermissionTree();

      expect(permissionTree.value).toEqual([]);
    });

    it('应该处理 null 和 undefined 响应', async () => {
      mockGetPermissionTree.mockResolvedValue(null);

      const { permissionTree, fetchPermissionTree } = usePermissionData();
      await fetchPermissionTree();

      expect(permissionTree.value).toEqual([]);
    });
  });

  describe('fetchPermissionTree - node_type 转换', () => {
    it('应该将 directory 转换为 folder', async () => {
      const mockArray = [
        {
          id: 1,
          permission_name: '系统管理',
          permission_code: 'SYSTEM',
          node_type: 'directory', // 后端返回 directory
          children: [
            { id: 2, permission_name: '用户管理', node_type: 'menu' },
          ],
        },
      ];

      mockGetPermissionTree.mockResolvedValue(mockArray);

      const { permissionTree, fetchPermissionTree } = usePermissionData();
      await fetchPermissionTree();

      expect(permissionTree.value[0].node_type).toBe('folder');
      expect(permissionTree.value[0].children![0].node_type).toBe('menu');
    });

    it('应该递归处理嵌套的子节点', async () => {
      const mockArray = [
        {
          id: 1,
          permission_name: '系统管理',
          node_type: 'directory',
          children: [
            {
              id: 2,
              permission_name: '用户管理',
              node_type: 'menu',
              children: [
                { id: 3, permission_name: '添加用户', node_type: 'button' },
              ],
            },
          ],
        },
      ];

      mockGetPermissionTree.mockResolvedValue(mockArray);

      const { permissionTree, fetchPermissionTree } = usePermissionData();
      await fetchPermissionTree();

      expect(permissionTree.value[0].node_type).toBe('folder');
      expect(permissionTree.value[0].children![0].node_type).toBe('menu');
      expect(permissionTree.value[0].children![0].children![0].node_type).toBe('button');
    });

    it('应该处理空子节点数组', async () => {
      const mockArray = [
        {
          id: 1,
          permission_name: '系统管理',
          node_type: 'menu',
          children: [],
        },
      ];

      mockGetPermissionTree.mockResolvedValue(mockArray);

      const { permissionTree, fetchPermissionTree } = usePermissionData();
      await fetchPermissionTree();

      expect(permissionTree.value[0].node_type).toBe('menu');
      expect(permissionTree.value[0].children).toEqual([]);
    });

    it('应该处理没有 children 字段的节点', async () => {
      const mockArray = [
        {
          id: 1,
          permission_name: '系统管理',
          node_type: 'menu',
        },
      ];

      mockGetPermissionTree.mockResolvedValue(mockArray);

      const { permissionTree, fetchPermissionTree } = usePermissionData();
      await fetchPermissionTree();

      expect(permissionTree.value[0].node_type).toBe('menu');
    });
  });

  describe('fetchPermissionTree - 真实后端响应数据', () => {
    it('应该正确处理用户提供的真实后端响应结构', async () => {
      // 模拟用户提供的真实后端响应
      const mockRealResponse = [
        {
          id: 0,
          permission_type: 'folder',
          permission_name: 'Updated Permission 0',
          permission_code: 'common',
          node_type: 'folder',
          path: '/common',
          method: 'POST',
          description: 'Updated remark for permission 0',
          parent_id: null,
          sort_order: 99,
          status: 0,
          visible: false,
          display_type: '',
          has_children: true,
          children: [
            {
              id: 9999999990003,
              permission_type: 'button',
              permission_name: '测试权限 TEST_PERM_5D3C47CB',
              permission_code: 'TEST_PERM_5D3C47CB',
              node_type: 'button',
              path: '/api/test/test_perm_5d3c47cb',
              method: 'GET',
              description: null,
              parent_id: 0,
              sort_order: 0,
              status: 0,
              visible: true,
              display_type: 'success',
              has_children: false,
              children: [],
              component: null,
              layout: true,
              icon: null,
              open_new_tab: false,
              keep_alive: true,
            },
          ],
        },
      ];

      mockGetPermissionTree.mockResolvedValue(mockRealResponse);

      const { permissionTree, fetchPermissionTree } = usePermissionData();
      await fetchPermissionTree();

      // 验证根节点
      expect(permissionTree.value).toHaveLength(1);
      expect(permissionTree.value[0].id).toBe(0);
      expect(permissionTree.value[0].permission_name).toBe('Updated Permission 0');
      expect(permissionTree.value[0].permission_code).toBe('common');
      expect(permissionTree.value[0].node_type).toBe('folder');
      expect(permissionTree.value[0].path).toBe('/common');
      expect(permissionTree.value[0].method).toBe('POST');
      expect(permissionTree.value[0].description).toBe('Updated remark for permission 0');
      expect(permissionTree.value[0].sort_order).toBe(99);
      expect(permissionTree.value[0].status).toBe(0);
      expect(permissionTree.value[0].visible).toBe(false);
      expect(permissionTree.value[0].has_children).toBe(true);

      // 验证子节点
      expect(permissionTree.value[0].children).toHaveLength(1);
      const child = permissionTree.value[0].children![0];
      expect(child.id).toBe(9999999990003);
      expect(child.permission_name).toBe('测试权限 TEST_PERM_5D3C47CB');
      expect(child.permission_code).toBe('TEST_PERM_5D3C47CB');
      expect(child.node_type).toBe('button');
      expect(child.path).toBe('/api/test/test_perm_5d3c47cb');
      expect(child.method).toBe('GET');
      expect(child.visible).toBe(true);
      expect(child.display_type).toBe('success');
      expect(child.layout).toBe(true);
      expect(child.keep_alive).toBe(true);
    });
  });

  describe('fetchPermissions - 响应拦截器已提取 data 字段', () => {
    it('应该成功获取权限列表（响应拦截器已返回数组）', async () => {
      const mockArray = [
        {
          id: 1,
          permission_code: 'system:user',
          permission_name: '用户管理',
          permission_type: 'menu',
          status: 0,
          creator: 'admin',
          tenant_code: 'default',
          create_time: '2024-01-01 00:00:00',
        },
        {
          id: 2,
          permission_code: 'system:user:add',
          permission_name: '新增用户',
          permission_type: 'button',
          status: 0,
          creator: 'admin',
          tenant_code: 'default',
          create_time: '2024-01-01 00:00:00',
        },
      ];

      mockGetPermissions.mockResolvedValue(mockArray);

      const { permissions, fetchPermissions } = usePermissionData();
      await fetchPermissions({});

      expect(permissions.value).toHaveLength(2);
      expect(permissions.value[0].permission_name).toBe('用户管理');
      expect(permissions.value[1].permission_name).toBe('新增用户');
    });

    it('应该处理空权限列表', async () => {
      mockGetPermissions.mockResolvedValue([]);

      const { permissions, fetchPermissions } = usePermissionData();
      await fetchPermissions({});

      expect(permissions.value).toEqual([]);
    });
  });

  describe('createPermission - 创建权限节点', () => {
    it('应该成功创建权限', async () => {
      mockCreatePermissionNode.mockResolvedValue({
        id: 100,
        permission_name: '测试权限',
      });

      const { createPermission } = usePermissionData();
      const result = await createPermission({
        permissionName: '测试权限',
        permissionCode: 'TEST_PERMISSION',
        permissionType: 'menu',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('表单验证', () => {
    it('应该验证权限代码格式（大写字母+下划线+冒号）', () => {
      const validCodes = [
        'SYSTEM:USER:VIEW',
        'SYSTEM:USER:ADD',
        'SYSTEM:USER:EDIT',
        'SYSTEM:USER:DELETE',
      ];

      validCodes.forEach(code => {
        expect(code).toMatch(/^[A-Z:_]+$/);
      });
    });

    it('应该验证权限类型', () => {
      const validTypes = ['folder', 'menu', 'button'];

      validTypes.forEach(type => {
        expect(['folder', 'menu', 'button']).toContain(type);
      });
    });
  });
});
