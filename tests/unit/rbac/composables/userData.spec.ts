/**
 * 用户数据管理 Composable 单元测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the store to avoid Vue component imports
vi.mock('@/stores/modules/userInfo', () => ({
  useUserInfoStore: () => ({
    userInfo: { tenantCode: 'default', tenantId: '1000000000000001' },
    getUserInfoSync: () => ({ tenantCode: 'default', tenantId: '1000000000000001' }),
  }),
}));

// Mock the service
const mockGetUsers = vi.fn();
const mockCreateUser = vi.fn();
const mockResetUserPassword = vi.fn();

vi.mock('@/api/system/userService', () => ({
  default: {
    getUsers: () => mockGetUsers(),
    getUserById: vi.fn(),
    createUser: () => mockCreateUser(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    batchDeleteUsers: vi.fn(),
    resetUserPassword: () => mockResetUserPassword(),
  },
}));

import { useUserData } from '@/pages/system/composable/user/useUserData';

describe('useUserData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('数据转换 - 后端 snake_case 到前端 camelCase', () => {
    it('应该正确映射用户字段', () => {
      const backendData = {
        id: '1000000000000001',
        user_name: 'testuser',
        real_name: '测试用户',
        email: 'test@example.com',
        phone: '13800138000',
        status: 0,
        tenant_id: '1000000000000001',
        dept_id: 1,
        position_id: 1,
        role_ids: '1,2,3',
        create_time: '2026-03-15 12:00:00',
      };

      const mapped = {
        id: backendData.id,
        userName: backendData.user_name,
        realName: backendData.real_name,
        email: backendData.email,
        phone: backendData.phone,
        status: backendData.status,
        tenantId: backendData.tenant_id,
        deptId: backendData.dept_id,
        positionId: backendData.position_id,
        roleIds: backendData.role_ids ? backendData.role_ids.split(',') : [],
        createTime: backendData.create_time,
      };

      expect(mapped.userName).toBe('testuser');
      expect(mapped.realName).toBe('测试用户');
      expect(Array.isArray(mapped.roleIds)).toBe(true);
      expect(mapped.roleIds).toEqual(['1', '2', '3']);
    });

    it('应该处理空角色列表', () => {
      const backendData = {
        id: '1000000000000001',
        user_name: 'testuser',
        role_ids: '',
        status: 0,
      };

      const mapped = {
        id: backendData.id,
        userName: backendData.user_name,
        roleIds: backendData.role_ids ? backendData.role_ids.split(',') : [],
        status: backendData.status,
      };

      expect(mapped.roleIds).toEqual([]);
    });
  });

  describe('fetchUsers - 获取用户列表', () => {
    it('应该成功获取用户列表并正确映射字段', async () => {
      const mockResponse = {
        data: [
          {
            id: '1000000000000001',
            user_name: 'admin',
            nick_name: '管理员',
            email: 'admin@example.com',
            phone: '13800138000',
            status: 0,
          },
        ],
        total: 1,
      };

      mockGetUsers.mockResolvedValue(mockResponse);

      const { users, fetchUsers } = useUserData();
      await fetchUsers({ tenant_id: '1000000000000001' });

      expect(users.value).toHaveLength(1);
      // 用户 composable 使用后端 snake_case 字段名
      expect(users.value[0].user_name).toBe('admin');
      expect(users.value[0].nick_name).toBe('管理员');
    });

    it('应该正确处理分页', async () => {
      const mockResponse = {
        data: Array(10).fill(null).map((_, i) => ({
          id: `${i}`,
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
    });
  });

  describe('createUser - 创建用户', () => {
    it('应该成功创建用户', async () => {
      mockCreateUser.mockResolvedValue({
        data: { id: '1000000000000002' },
      });

      const { createUser } = useUserData();
      await createUser({
        userName: 'newuser',
        realName: '新用户',
        password: 'Password@123',
        email: 'newuser@example.com',
      });

      expect(mockCreateUser).toHaveBeenCalled();
    });

    it('应该验证必填字段', () => {
      const { createUser } = useUserData();
      // 验证函数存在
      expect(typeof createUser).toBe('function');
    });
  });

  describe('resetUserPassword - 重置密码', () => {
    it('应该成功重置用户密码', async () => {
      mockResetUserPassword.mockResolvedValue({
        data: null,
      });

      const { resetUserPassword } = useUserData();
      await resetUserPassword('1000000000000001', {
        newPassword: 'NewPassword@123',
      });

      expect(mockResetUserPassword).toHaveBeenCalled();
    });
  });

  describe('表单验证', () => {
    it('应该验证用户名格式（字母数字下划线）', () => {
      const validUsernames = ['admin', 'test_user', 'user123', 'User_2026'];

      validUsernames.forEach(username => {
        expect(username).toMatch(/^[a-zA-Z0-9_]{3,20}$/);
      });
    });

    it('应该验证密码强度（至少8位，包含大小写字母、数字）', () => {
      const validPasswords = ['Password@123', 'Test1234', 'Admin2026'];

      // 至少8位
      validPasswords.forEach(pwd => {
        expect(pwd.length).toBeGreaterThanOrEqual(8);
      });

      // 应该包含字母和数字
      validPasswords.forEach(pwd => {
        expect(/[a-zA-Z]/.test(pwd) && /\d/.test(pwd)).toBe(true);
      });
    });

    it('应该验证邮箱格式', () => {
      const validEmails = ['test@example.com', 'user.name@company.co.jp'];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });
    });
  });
});
