/**
 * 用户数据管理 Composable 单元测试
 * @see .claude/rules/testing-guide.md
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the store to avoid Vue component imports
vi.mock('@/stores/modules/userInfo', () => ({
  useUserInfoStore: () => ({
    userInfo: { tenantCode: 'default', tenantId: '1000000000000001' },
    getUserInfoSync: () => ({ tenantCode: 'default', tenantId: '1000000000000001' }),
  }),
}));

// Mock the service - 使用 vi.hoisted 因为 vi.mock 会被提升
const mockGetUsers = vi.hoisted(() => vi.fn());
const mockCreateUser = vi.hoisted(() => vi.fn());
const mockResetUserPassword = vi.hoisted(() => vi.fn());
const mockUpdateUser = vi.hoisted(() => vi.fn());
const mockDeleteUser = vi.hoisted(() => vi.fn());
const mockDeleteUsers = vi.hoisted(() => vi.fn());

vi.mock('@/api/system/userService', () => ({
  default: {
    getUsers: mockGetUsers,
    createUser: mockCreateUser,
    updateUser: mockUpdateUser,
    deleteUser: mockDeleteUser,
    deleteUsers: mockDeleteUsers,
    resetUserPassword: mockResetUserPassword,
  },
}));

vi.mock('@/api/system/associationService', () => ({
  default: {
    assignRolesToUser: vi.fn(),
  },
}));

import { useUserData } from '@/pages/system/composable/user/useUserData';

describe('useUserData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('用户ID映射问题 - 修复 user_id → id 的映射', () => {
    it('应该正确处理后端返回 user_id 字段（而不是 id）', async () => {
      const mockResponse = {
        data: [
          {
            user_id: '1000000000000001',  // 后端返回 user_id
            user_name: 'admin',
            nick_name: '管理员',
            email: 'admin@example.com',
            phone: '13800138000',
            status: 0,
            tenant_id: '1000000000000001',
            dept_id: 1,
            create_time: '2026-03-15 12:00:00',
          },
        ],
        total: 1,
      };

      mockGetUsers.mockResolvedValue(mockResponse);

      const { users, fetchUsers } = useUserData();
      await fetchUsers({ tenant_id: '1000000000000001' });

      expect(users.value).toHaveLength(1);
      // 验证 id 字段被正确映射（从 user_id 转换为 id）
      expect(users.value[0].id).toBe(1000000000000001);
      // 验证 id 不是 NaN
      expect(users.value[0].id).not.toBeNaN();
      expect(users.value[0].user_name).toBe('admin');
    });

    it('应该正确处理后端返回 id 字段（兼容情况）', async () => {
      const mockResponse = {
        data: [
          {
            id: '1000000000000002',  // 后端返回 id（兼容情况）
            user_name: 'testuser',
            nick_name: '测试用户',
            email: 'test@example.com',
            phone: '13800138001',
            status: 0,
            tenant_id: '1000000000000001',
          },
        ],
        total: 1,
      };

      mockGetUsers.mockResolvedValue(mockResponse);

      const { users, fetchUsers } = useUserData();
      await fetchUsers({ tenant_id: '1000000000000001' });

      expect(users.value).toHaveLength(1);
      expect(users.value[0].id).toBe(1000000000000002);
      expect(users.value[0].id).not.toBeNaN();
    });

    it('应该优先使用 user_id 字段，当两者都存在时', async () => {
      const mockResponse = {
        data: [
          {
            user_id: '1000000000000003',  // 应该优先使用这个
            id: '9999999999999999',        // 而不是这个
            user_name: 'priorityuser',
            status: 0,
          },
        ],
        total: 1,
      };

      mockGetUsers.mockResolvedValue(mockResponse);

      const { users, fetchUsers } = useUserData();
      await fetchUsers({ tenant_id: '1000000000000001' });

      expect(users.value[0].id).toBe(1000000000000003);
    });

    it('应该处理后端返回的数字类型 user_id', async () => {
      const mockResponse = {
        data: [
          {
            user_id: 1000000000000004,  // 数字类型
            user_name: 'numberuser',
            status: 0,
          },
        ],
        total: 1,
      };

      mockGetUsers.mockResolvedValue(mockResponse);

      const { users, fetchUsers } = useUserData();
      await fetchUsers({ tenant_id: '1000000000000001' });

      expect(users.value[0].id).toBe(1000000000000004);
      expect(users.value[0].id).not.toBeNaN();
    });
  });

  describe('fetchUsers - 获取用户列表', () => {
    it('应该成功获取用户列表并正确映射字段', async () => {
      const mockResponse = {
        data: [
          {
            user_id: '1000000000000001',
            user_name: 'admin',
            nick_name: '管理员',
            email: 'admin@example.com',
            phone: '13800138000',
            status: 0,
            dept_id: 1,
            dept_name: '技术部',
            tenant_id: '1000000000000001',
            create_time: '2026-03-15 12:00:00',
          },
        ],
        total: 1,
      };

      mockGetUsers.mockResolvedValue(mockResponse);

      const { users, fetchUsers } = useUserData();
      await fetchUsers({ tenant_id: '1000000000000001' });

      expect(users.value).toHaveLength(1);
      expect(users.value[0].user_name).toBe('admin');
      expect(users.value[0].nick_name).toBe('管理员');
      expect(users.value[0].dept_id).toBe(1);
      expect(users.value[0].dept_name).toBe('技术部');
    });

    it('应该正确处理分页', async () => {
      const mockResponse = {
        data: Array(10).fill(null).map((_, i) => ({
          user_id: `${1000000000000001 + i}`,
          user_name: `user${i}`,
          status: 0,
        })),
        total: 30,
        page: 1,
        limit: 10,
      };

      mockGetUsers.mockResolvedValue(mockResponse);

      const { pagination, fetchUsers } = useUserData();
      await fetchUsers({ tenant_id: '1000000000000001' }, 1, 10);

      expect(pagination.value.total).toBe(30);
      expect(pagination.value.currentPage).toBe(1);
      expect(pagination.value.pageSize).toBe(10);
    });

    it('当没有租户ID时应该返回空数组', async () => {
      mockGetUsers.mockResolvedValue({ data: [], total: 0 });

      const { users, fetchUsers } = useUserData();
      // 不传 tenant_id
      const result = await fetchUsers({});

      expect(result).toEqual([]);
      expect(users.value).toHaveLength(0);
    });
  });

  describe('用户操作 - deleteUser, updateUser, resetUserPassword', () => {
    it('deleteUser 应该使用正确的用户ID', async () => {
      mockDeleteUser.mockResolvedValue({ data: null });

      const { deleteUser } = useUserData();
      await deleteUser(1000000000000001);

      expect(mockDeleteUser).toHaveBeenCalledWith(1000000000000001);
    });

    it('updateUser 应该使用正确的用户ID', async () => {
      mockUpdateUser.mockResolvedValue({ data: null });

      const { updateUser } = useUserData();
      await updateUser(1000000000000002, { nick_name: '新昵称' });

      expect(mockUpdateUser).toHaveBeenCalledWith(1000000000000002, {
        id: 1000000000000002,
        nick_name: '新昵称',
      });
    });

    it('resetUserPassword 应该使用正确的用户ID', async () => {
      mockResetUserPassword.mockResolvedValue({ data: null });

      const { resetUserPassword } = useUserData();
      await resetUserPassword(1000000000000003, '123456');

      expect(mockResetUserPassword).toHaveBeenCalledWith(1000000000000003, '123456');
    });
  });

  describe('字段类型转换', () => {
    it('应该正确转换 dept_id 为数字', async () => {
      const mockResponse = {
        data: [
          {
            user_id: '1000000000000001',
            dept_id: '5',  // 字符串
            user_name: 'test',
            status: 0,
          },
        ],
        total: 1,
      };

      mockGetUsers.mockResolvedValue(mockResponse);

      const { users, fetchUsers } = useUserData();
      await fetchUsers({ tenant_id: '1000000000000001' });

      expect(users.value[0].dept_id).toBe(5);
      expect(typeof users.value[0].dept_id).toBe('number');
    });

    it('应该正确转换 status 为数字', async () => {
      const mockResponse = {
        data: [
          {
            user_id: '1000000000000001',
            status: '0',  // 字符串
            user_name: 'test',
          },
        ],
        total: 1,
      };

      mockGetUsers.mockResolvedValue(mockResponse);

      const { users, fetchUsers } = useUserData();
      await fetchUsers({ tenant_id: '1000000000000001' });

      expect(users.value[0].status).toBe(0);
      expect(typeof users.value[0].status).toBe('number');
    });

    it('应该处理缺失的可选字段', async () => {
      const mockResponse = {
        data: [
          {
            user_id: '1000000000000001',
            user_name: 'test',
            status: 0,
            // dept_id, phone, email 等可选字段缺失
          },
        ],
        total: 1,
      };

      mockGetUsers.mockResolvedValue(mockResponse);

      const { users, fetchUsers } = useUserData();
      await fetchUsers({ tenant_id: '1000000000000001' });

      expect(users.value[0].dept_id).toBe(0);  // 默认值
      expect(users.value[0].phone).toBe('');   // 空字符串
      expect(users.value[0].email).toBe('');   // 空字符串
    });
  });
});
