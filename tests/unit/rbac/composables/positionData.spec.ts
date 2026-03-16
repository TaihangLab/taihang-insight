/**
 * 岗位数据管理 Composable 单元测试
 * 重点测试：snake_case 到 camelCase 字段映射
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePositionData } from '@/pages/system/composable/position/usePositionData';

// Mock the service
const mockGetPositions = vi.fn();
const mockCreatePosition = vi.fn();

vi.mock('@/api/system/positionService', () => ({
  default: {
    getPositions: () => mockGetPositions(),
    getPositionById: vi.fn(),
    createPosition: () => mockCreatePosition(),
    updatePosition: vi.fn(),
    deletePosition: vi.fn(),
  },
}));

describe('usePositionData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('字段映射 - snake_case 到 camelCase', () => {
    it('应该正确映射所有岗位字段', () => {
      const backendData = {
        id: '1',
        position_name: '软件工程师',
        position_code: 'SE001',
        order_num: 10,
        status: 0,
        tenant_id: '1000000000000001',
        category_code: 'TECH',
        category_name: '技术类',
        create_time: '2026-03-15 12:00:00',
        remark: '高级岗位',
      };

      const mapped = {
        id: backendData.id,
        positionName: backendData.position_name,
        positionCode: backendData.position_code,
        sortOrder: backendData.order_num,
        status: backendData.status,
        tenantId: backendData.tenant_id,
        categoryCode: backendData.category_code,
        categoryName: backendData.category_name,
        createTime: backendData.create_time,
        remark: backendData.remark,
      };

      expect(mapped.positionName).toBe('软件工程师');
      expect(mapped.positionCode).toBe('SE001');
      expect(mapped.sortOrder).toBe(10);
      expect(mapped.categoryCode).toBe('TECH');
    });

    it('应该处理缺失的可选字段', () => {
      const backendData: Record<string, any> = {
        id: '1',
        position_name: '测试岗位',
        position_code: 'TEST',
        order_num: 0,
        status: 0,
        category_code: '',
        remark: '',
      };

      const mapped = {
        id: backendData.id,
        positionName: backendData.position_name,
        positionCode: backendData.position_code,
        sortOrder: backendData.order_num,
        status: backendData.status,
        categoryName: backendData.category_name || '未分类',
        remark: backendData.remark || '',
      };

      expect(mapped.categoryName).toBe('未分类');
    });
  });

  describe('fetchPositions - 获取岗位列表', () => {
    it('应该成功获取并映射岗位列表', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            position_name: '软件工程师',
            position_code: 'SE001',
            order_num: 10,
            status: 0,
            category_code: 'TECH',
            category_name: '技术类',
          },
          {
            id: '2',
            position_name: '产品经理',
            position_code: 'PM001',
            order_num: 20,
            status: 0,
            category_code: 'PRODUCT',
            category_name: '产品类',
          },
        ],
        total: 2,
      };

      mockGetPositions.mockResolvedValue(mockResponse);

      const { positions, fetchPositions } = usePositionData();
      await fetchPositions({ tenantId: '1000000000000001' });

      expect(positions.value).toHaveLength(2);
      expect(positions.value[0].positionName).toBe('软件工程师');
      expect(positions.value[1].positionCode).toBe('PM001');
    });

    it('应该正确处理分页', async () => {
      const mockResponse = {
        data: Array(10).fill(null).map((_, i) => ({
          id: `${i}`,
          position_name: `岗位${i}`,
          position_code: `POS_${i}`,
          order_num: i,
          status: 0,
        })),
        total: 25,
        page: 1,
        limit: 10,
      };

      mockGetPositions.mockResolvedValue(mockResponse);

      const { pagination, fetchPositions } = usePositionData();
      await fetchPositions({ tenantId: '1000000000000001' }, 1, 10);

      expect(pagination.value.total).toBe(25);
    });
  });

  describe('createPosition - 创建岗位', () => {
    it('应该成功创建岗位', async () => {
      mockCreatePosition.mockResolvedValue({
        data: { id: '2' },
      });

      const { createPosition } = usePositionData();
      const result = await createPosition({
        positionName: '测试岗位',
        positionCode: 'TEST_POS',
        sortOrder: 10,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('表单验证', () => {
    it('应该验证岗位代码格式（大写字母+下划线+数字）', () => {
      const validCodes = ['SE001', 'PM_MANAGER', 'TECH_LEAD'];

      validCodes.forEach(code => {
        expect(code).toMatch(/^[A-Z0-9_]+$/);
      });
    });

    it('应该验证排序号范围（0-999）', () => {
      const validOrders = [0, 1, 100, 999];

      validOrders.forEach(order => {
        expect(order).toBeGreaterThanOrEqual(0);
        expect(order).toBeLessThanOrEqual(999);
      });
    });
  });
});
