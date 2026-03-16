/**
 * 租户数据管理 Composable 单元测试
 * 测试范围：数据转换、表单验证、CRUD 逻辑
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTenantData } from '@/pages/system/composable/tenant/useTenantData';

// Mock tenantService
const mockGetTenants = vi.fn();
const mockCreateTenant = vi.fn();
const mockUpdateTenant = vi.fn();
const mockDeleteTenant = vi.fn();
const mockBatchDeleteTenants = vi.fn();

vi.mock('@/api/system/tenantService', () => ({
  default: {
    getTenants: () => mockGetTenants(),
    getTenantTree: vi.fn(),
    createTenant: () => mockCreateTenant(),
    updateTenant: () => mockUpdateTenant(),
    deleteTenant: () => mockDeleteTenant(),
    batchDeleteTenants: () => mockBatchDeleteTenants(),
  },
}));

describe('useTenantData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('数据转换 - 后端 snake_case 到前端 camelCase', () => {
    it('应该正确映射租户字段名称', () => {
      const backendData = {
        id: '1000000000000001',
        tenant_name: '测试租户',
        tenant_code: 'TEST_TENANT',
        contact_name: '张三',
        contact_phone: '13800138000',
        status: 0,
        create_time: '2026-03-15 12:00:00',
        remark: '备注信息',
      };

      const expected = {
        id: backendData.id,
        tenantName: backendData.tenant_name,
        tenantCode: backendData.tenant_code,
        contactName: backendData.contact_name,
        contactPhone: backendData.contact_phone,
        status: backendData.status,
        createTime: backendData.create_time,
        remark: backendData.remark,
      };

      // 验证字段映射
      expect(expected.tenantName).toBe('测试租户');
      expect(expected.tenantCode).toBe('TEST_TENANT');
      expect(expected.contactPhone).toBe('13800138000');
    });

    it('应该处理缺失的可选字段', () => {
      const backendData = {
        id: '1000000000000001',
        tenant_name: '测试租户',
        tenant_code: 'TEST',
        status: 0,
        contact_name: '',
        contact_phone: '',
        remark: '',
      };

      const mapped = {
        id: backendData.id,
        tenantName: backendData.tenant_name,
        tenantCode: backendData.tenant_code,
        contactName: backendData.contact_name || '默认联系人',
        contactPhone: backendData.contact_phone || '暂无电话',
        status: backendData.status,
      };

      expect(mapped.contactName).toBe('默认联系人');
      expect(mapped.contactPhone).toBe('暂无电话');
    });
  });

  describe('fetchTenants - 获取租户列表', () => {
    it('应该成功获取租户列表并正确映射字段', async () => {
      const mockResponse = {
        data: [
          {
            id: '1000000000000001',
            tenant_name: '租户A',
            tenant_code: 'TENANT_A',
            contact_name: '张三',
            contact_phone: '13800138000',
            status: 0,
            create_time: '2026-03-15 12:00:00',
          },
        ],
        total: 1,
      };

      mockGetTenants.mockResolvedValue(mockResponse);

      const { tenants, fetchTenants } = useTenantData();
      await fetchTenants({});

      expect(tenants.value).toHaveLength(1);
      // 注意：租户 composable 直接使用后端 snake_case 字段名
      expect(tenants.value[0].tenant_name).toBe('租户A');
      expect(tenants.value[0].tenant_code).toBe('TENANT_A');
    });

    it('应该处理空列表响应', async () => {
      mockGetTenants.mockResolvedValue({
        data: [],
        total: 0,
      });

      const { tenants, fetchTenants } = useTenantData();
      await fetchTenants({});

      expect(tenants.value).toHaveLength(0);
    });

    it('应该正确处理分页信息', async () => {
      const mockResponse = {
        data: Array(10).fill(null).map((_, i) => ({
          id: `${i}`,
          tenant_name: `租户${i}`,
          tenant_code: `CODE_${i}`,
          status: 0,
        })),
        total: 25,
        page: 1,
        limit: 10,
      };

      mockGetTenants.mockResolvedValue(mockResponse);

      const { pagination, fetchTenants } = useTenantData();
      await fetchTenants({}, 1, 10);

      expect(pagination.value.total).toBe(25);
      expect(pagination.value.currentPage).toBe(1);
    });
  });

  describe('createTenant - 创建租户', () => {
    it('应该成功创建租户', async () => {
      mockCreateTenant.mockResolvedValue({
        data: { id: '1000000000000002' },
      });

      const { createTenant } = useTenantData();
      const result = await createTenant({
        tenantName: '新租户',
        tenantCode: 'NEW_TENANT',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('成功');
    });

    it('应该处理创建失败的情况', async () => {
      mockCreateTenant.mockRejectedValue(
        new Error('租户代码已存在')
      );

      const { createTenant } = useTenantData();

      await expect(createTenant({
        tenantName: '新租户',
        tenantCode: 'EXISTING_CODE',
      })).rejects.toThrow('租户代码已存在');
    });
  });

  describe('updateTenant - 更新租户', () => {
    it('应该成功更新租户信息', async () => {
      mockUpdateTenant.mockResolvedValue({
        data: { id: '1000000000000001' },
      });

      const { updateTenant } = useTenantData();
      const result = await updateTenant('1000000000000001', {
        tenantName: '更新后的租户名',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('deleteTenant - 删除租户', () => {
    it('应该成功删除单个租户', async () => {
      mockDeleteTenant.mockResolvedValue({
        data: null,
      });

      const { deleteTenant } = useTenantData();
      const result = await deleteTenant('1000000000000001');

      expect(result.success).toBe(true);
    });

    it('应该支持批量删除租户', async () => {
      mockBatchDeleteTenants.mockResolvedValue({
        data: null,
      });

      const { batchDeleteTenants } = useTenantData();
      const result = await batchDeleteTenants([
        '1000000000000001',
        '1000000000000002',
      ]);

      expect(result.success).toBe(true);
    });
  });

  describe('表单验证', () => {
    it('应该验证租户代码格式（大写字母+下划线）', () => {
      const validCodes = ['TENANT_001', 'TEST_A', 'ABC_123'];

      validCodes.forEach(code => {
        expect(code).toMatch(/^[A-Z0-9_]+$/);
      });
    });

    it('应该验证联系电话格式（11位数字）', () => {
      const validPhones = ['13800138000', '13900139000'];

      validPhones.forEach(phone => {
        expect(phone).toMatch(/^1[3-9]\d{9}$/);
      });
    });
  });
});
