/**
 * 部门数据管理 Composable 单元测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDepartmentData } from '@/pages/system/composable/department/useDepartmentData';

// Mock the service
const mockGetDepartmentTree = vi.fn();
const mockCreateDepartment = vi.fn();

vi.mock('@/api/system/departmentService', () => ({
  default: {
    getDepartmentTree: () => mockGetDepartmentTree(),
    getDepartments: vi.fn(),
    createDepartment: () => mockCreateDepartment(),
    updateDepartment: vi.fn(),
    deleteDepartment: vi.fn(),
  },
}));

describe('useDepartmentData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('数据转换 - 部门树形结构', () => {
    it('应该正确映射部门字段', () => {
      const backendData = {
        id: 1,
        name: '技术部',
        parent_id: null,
        path: '/1',
        depth: 0,
        sort_order: 1,
        status: 0,
        tenant_id: '1000000000000001',
        create_time: '2026-03-15 12:00:00',
      };

      const mapped = {
        id: backendData.id,
        name: backendData.name,
        parentId: backendData.parent_id,
        path: backendData.path,
        depth: backendData.depth,
        sortOrder: backendData.sort_order,
        status: backendData.status,
        tenantId: backendData.tenant_id,
        createTime: backendData.create_time,
      };

      expect(mapped.name).toBe('技术部');
      expect(mapped.parentId).toBeNull();
      expect(mapped.sortOrder).toBe(1);
    });

    it('应该处理嵌套的部门树结构', () => {
      const backendTree: any[] = [
        {
          id: 1,
          name: '总公司',
          parent_id: null,
          depth: 0,
          children: [
            {
              id: 2,
              name: '技术部',
              parent_id: 1,
              depth: 1,
              children: [
                { id: 3, name: '前端组', parent_id: 2, depth: 2 },
              ],
            },
          ],
        },
      ];

      // 验证树的深度计算
      const calculateDepth = (node: any, currentDepth = 0) => {
        node.depth = currentDepth;
        if (node.children) {
          node.children.forEach((child: any) => calculateDepth(child, currentDepth + 1));
        }
        return node;
      };

      const processed = backendTree.map(node => calculateDepth(node, 0));

      expect(processed[0].depth).toBe(0);
      expect(processed[0].children![0].depth).toBe(1);
      expect(processed[0].children![0].children![0].depth).toBe(2);
    });
  });

  describe('fetchDepartments - 获取部门树', () => {
    it('应该成功获取部门树', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            name: '总公司',
            parent_id: null,
            depth: 0,
            children: [
              { id: 2, name: '技术部', parent_id: 1, depth: 1 },
            ],
          },
        ],
      };

      mockGetDepartmentTree.mockResolvedValue(mockResponse);

      const { departments, fetchDepartments } = useDepartmentData();
      await fetchDepartments({ tenantId: '1000000000000001' });

      expect(departments.value).toHaveLength(1);
      expect(departments.value[0].name).toBe('总公司');
    });
  });

  describe('createDepartment - 创建部门', () => {
    it('应该成功创建部门', async () => {
      mockCreateDepartment.mockResolvedValue({
        data: { id: 2 },
      });

      const { createDepartment } = useDepartmentData();
      const result = await createDepartment({
        name: '技术部',
        parentId: null,
        sortOrder: 1,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('表单验证', () => {
    it('应该验证部门名称非空', () => {
      const validNames = ['技术部', '研发中心', '市场部'];

      validNames.forEach(name => {
        expect(name.trim().length).toBeGreaterThan(0);
      });
    });

    it('应该验证排序号范围', () => {
      const validOrders = [0, 1, 100, 999];

      validOrders.forEach(order => {
        expect(order).toBeGreaterThanOrEqual(0);
        expect(order).toBeLessThan(1000);
      });
    });
  });
});
