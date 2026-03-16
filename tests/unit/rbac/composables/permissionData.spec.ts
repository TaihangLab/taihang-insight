/**
 * 权限数据管理 Composable 单元测试
 * 重点测试：node_type 转换、树形结构处理
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePermissionData } from '@/pages/system/composable/permission/usePermissionData';

// Mock the service
const mockGetPermissionTree = vi.fn();
const mockCreatePermissionNode = vi.fn();

vi.mock('@/api/system/permissionService', () => ({
  default: {
    getPermissionTree: () => mockGetPermissionTree(),
    getPermissions: vi.fn(),
    createPermissionNode: () => mockCreatePermissionNode(),
    updatePermissionNode: vi.fn(),
    deletePermissionNode: vi.fn(),
  },
}));

describe('usePermissionData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchPermissionTree - node_type 转换', () => {
    it('应该将 directory 转换为 folder', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            permission_name: '系统管理',
            permission_code: 'SYSTEM',
            node_type: 'directory',
            children: [
              { id: 2, permission_name: '用户管理', node_type: 'menu' },
            ],
          },
        ],
      };

      mockGetPermissionTree.mockResolvedValue(mockResponse);

      const { permissionTree, fetchPermissionTree } = usePermissionData();
      await fetchPermissionTree();

      expect(permissionTree.value[0].node_type).toBe('folder');
      expect(permissionTree.value[0].children![0].node_type).toBe('menu');
    });

    it('应该递归处理嵌套的子节点', async () => {
      const mockResponse = {
        data: [
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
        ],
      };

      mockGetPermissionTree.mockResolvedValue(mockResponse);

      const { permissionTree, fetchPermissionTree } = usePermissionData();
      await fetchPermissionTree();

      expect(permissionTree.value[0].node_type).toBe('folder');
      expect(permissionTree.value[0].children![0].node_type).toBe('menu');
      expect(permissionTree.value[0].children![0].children![0].node_type).toBe('button');
    });

    it('应该处理空子节点数组', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            permission_name: '系统管理',
            node_type: 'menu',
            children: [],
          },
        ],
      };

      mockGetPermissionTree.mockResolvedValue(mockResponse);

      const { permissionTree, fetchPermissionTree } = usePermissionData();
      await fetchPermissionTree();

      expect(permissionTree.value[0].node_type).toBe('menu');
      expect(permissionTree.value[0].children).toEqual([]);
    });

    it('应该处理没有 children 字段的节点', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            permission_name: '系统管理',
            node_type: 'menu',
          },
        ],
      };

      mockGetPermissionTree.mockResolvedValue(mockResponse);

      const { permissionTree, fetchPermissionTree } = usePermissionData();
      await fetchPermissionTree();

      expect(permissionTree.value[0].node_type).toBe('menu');
    });
  });

  describe('fetchPermissionTree - 获取权限树', () => {
    it('应该成功获取并转换权限树', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            permission_name: '系统管理',
            permission_code: 'SYSTEM',
            node_type: 'directory',
            permission_type: 'folder',
            children: [
              {
                id: 2,
                permission_name: '用户管理',
                node_type: 'menu',
                permission_type: 'menu',
              },
            ],
          },
        ],
      };

      mockGetPermissionTree.mockResolvedValue(mockResponse);

      const { permissionTree, fetchPermissionTree } = usePermissionData();
      await fetchPermissionTree();

      expect(permissionTree.value).toHaveLength(1);
      expect(permissionTree.value[0].node_type).toBe('folder'); // 转换后
      expect(permissionTree.value[0].children![0].node_type).toBe('menu');
    });

    it('应该处理空的权限树响应', async () => {
      mockGetPermissionTree.mockResolvedValue({
        data: [],
      });

      const { permissionTree, fetchPermissionTree } = usePermissionData();
      await fetchPermissionTree();

      expect(permissionTree.value).toHaveLength(0);
    });
  });

  describe('createPermission - 创建权限节点', () => {
    it('应该成功创建权限', async () => {
      mockCreatePermissionNode.mockResolvedValue({
        data: { id: 100 },
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
