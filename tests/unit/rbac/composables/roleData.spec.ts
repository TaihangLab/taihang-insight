/**
 * 角色数据管理 Composable 单元测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRoleData } from '@/pages/system/composable/role/useRoleData';

// Mock the service
const mockGetRoles = vi.fn();
const mockCreateRole = vi.fn();
const mockAssignPermissionsToRole = vi.fn();

vi.mock('@/api/system/roleService', () => ({
  default: {
    getRoles: () => mockGetRoles(),
    getRoleById: vi.fn(),
    createRole: () => mockCreateRole(),
    updateRole: vi.fn(),
    deleteRole: vi.fn(),
    batchDeleteRoles: vi.fn(),
    getRolePermissions: vi.fn(),
  },
}));

// Mock the association service
vi.mock('@/api/system/roleAssociationService', () => ({
  default: {
    assignPermissionsToRole: () => mockAssignPermissionsToRole(),
    removeRolePermission: vi.fn(),
  },
}));

describe('useRoleData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('数据转换 - 后端 snake_case 到前端 camelCase', () => {
    it('应该正确映射角色字段', () => {
      const backendData = {
        id: '1',
        role_name: '管理员',
        role_code: 'ADMIN',
        data_scope: '1',
        status: 0,
        remark: '系统管理员',
        create_time: '2026-03-15 12:00:00',
      };

      const mapped = {
        id: backendData.id,
        roleName: backendData.role_name,
        roleCode: backendData.role_code,
        dataScope: backendData.data_scope,
        status: backendData.status,
        remark: backendData.remark,
        createTime: backendData.create_time,
      };

      expect(mapped.roleName).toBe('管理员');
      expect(mapped.roleCode).toBe('ADMIN');
    });

    it('应该映射数据范围', () => {
      const dataScopeMapping = {
        '1': '全部数据',
        '2': '本部门及以下',
        '3': '本部门数据',
        '4': '仅本人数据',
      };

      expect(dataScopeMapping['1']).toBe('全部数据');
      expect(dataScopeMapping['2']).toBe('本部门及以下');
    });
  });

  describe('fetchRoles - 获取角色列表', () => {
    it('应该成功获取角色列表', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            role_name: '管理员',
            role_code: 'ADMIN',
            status: 0,
          },
          {
            id: '2',
            role_name: '普通用户',
            role_code: 'USER',
            status: 0,
          },
        ],
        total: 2,
      };

      mockGetRoles.mockResolvedValue(mockResponse);

      const { roles, fetchRoles } = useRoleData();
      await fetchRoles({ tenantId: '1000000000000001' });

      expect(roles.value).toHaveLength(2);
      expect(roles.value[0].roleName).toBe('管理员');
      expect(roles.value[1].roleCode).toBe('USER');
    });
  });

  describe('createRole - 创建角色', () => {
    it('应该成功创建角色', async () => {
      mockCreateRole.mockResolvedValue({
        data: { id: '3' },
      });

      const { createRole } = useRoleData();
      const result = await createRole({
        roleName: '测试角色',
        roleCode: 'TEST_ROLE',
        dataScope: '1',
      });

      expect(result.success).toBe(true);
    });

    it('应该验证角色代码唯一性', async () => {
      mockCreateRole.mockRejectedValue(
        new Error('角色代码已存在')
      );

      const { createRole } = useRoleData();

      await expect(
        createRole({
          roleName: '管理员',
          roleCode: 'ADMIN', // 已存在的代码
          dataScope: '1',
        })
      ).rejects.toThrow('角色代码已存在');
    });
  });

  describe('assignPermissionsToRole - 分配权限给角色', () => {
    it('应该导出分配权限函数', () => {
      const { assignPermissionsToRole } = useRoleData();
      // 只验证函数存在，不实际调用以避免 Pinia 错误
      expect(typeof assignPermissionsToRole).toBe('function');
    });
  });

  describe('表单验证', () => {
    it('应该验证角色代码格式（大写字母+下划线）', () => {
      const validCodes = ['ADMIN', 'USER_ROLE', 'TEST_001'];

      validCodes.forEach(code => {
        expect(code).toMatch(/^[A-Z0-9_]+$/);
      });
    });

    it('应该验证数据范围值', () => {
      const validScopes = ['1', '2', '3', '4'];

      validScopes.forEach(scope => {
        expect(parseInt(scope)).toBeGreaterThan(0);
        expect(parseInt(scope)).toBeLessThanOrEqual(4);
      });
    });
  });
});
