/**
 * 数据转换器工具函数单元测试
 * 测试范围：字段映射、树形结构处理、数据格式转换
 */
import { describe, it, expect } from 'vitest';

describe('数据转换器工具函数', () => {
  describe('snake_case 转 camelCase', () => {
    const toCamelCase = (str: string): string => {
      return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    };

    it('应该正确转换各种 snake_case 字符串', () => {
      expect(toCamelCase('position_name')).toBe('positionName');
      expect(toCamelCase('position_code')).toBe('positionCode');
      expect(toCamelCase('order_num')).toBe('orderNum');
      expect(toCamelCase('tenant_id')).toBe('tenantId');
      expect(toCamelCase('create_time')).toBe('createTime');
      expect(toCamelCase('update_time')).toBe('updateTime');
    });

    it('应该处理已经是 camelCase 的字符串', () => {
      expect(toCamelCase('positionName')).toBe('positionName');
      expect(toCamelCase('userName')).toBe('userName');
    });

    it('应该处理连续的下划线', () => {
      expect(toCamelCase('some_long_field_name')).toBe('someLongFieldName');
    });

    it('应该处理空字符串', () => {
      expect(toCamelCase('')).toBe('');
    });
  });

  describe('camelCase 转 snake_case', () => {
    const toSnakeCase = (str: string): string => {
      return str.replace(/([A-Z])/g, '_$1').toLowerCase();
    };

    it('应该正确转换各种 camelCase 字符串', () => {
      expect(toSnakeCase('positionName')).toBe('position_name');
      expect(toSnakeCase('positionCode')).toBe('position_code');
      expect(toSnakeCase('orderNum')).toBe('order_num');
      expect(toSnakeCase('tenantId')).toBe('tenant_id');
      expect(toSnakeCase('createTime')).toBe('create_time');
    });

    it('应该处理已经是 snake_case 的字符串', () => {
      expect(toSnakeCase('position_name')).toBe('position_name');
      expect(toSnakeCase('user_name')).toBe('user_name');
    });
  });

  describe('批量对象字段转换', () => {
    const transformKeys = (obj: Record<string, any>, transformer: (s: string) => string) => {
      const result: Record<string, any> = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          result[transformer(key)] = obj[key];
        }
      }
      return result;
    };

    it('应该转换对象的所有键', () => {
      const input = {
        position_name: '工程师',
        position_code: 'ENG',
        order_num: 10,
      };

      const output = transformKeys(input, (s) => s.replace(/_([a-z])/g, (_, l) => l.toUpperCase()));

      expect(output).toEqual({
        positionName: '工程师',
        positionCode: 'ENG',
        orderNum: 10,
      });
    });

    it('应该保留非字符串键的值', () => {
      const input = {
        id: 123,
        name: 'test',
        count: 456,
      };

      const output = transformKeys(input, (s) => s);

      expect(output.id).toBe(123);
      expect(output.count).toBe(456);
    });
  });

  describe('树形结构处理', () => {
    const processTree = (
      nodes: any[],
      childrenKey = 'children',
      processor: (node: any) => any
    ): any[] => {
      return nodes.map(node => {
        const processed = processor(node);
        if (processed[childrenKey] && Array.isArray(processed[childrenKey])) {
          processed[childrenKey] = processTree(processed[childrenKey], childrenKey, processor);
        }
        return processed;
      });
    };

    it('应该递归处理树形结构', () => {
      const input = [
        {
          id: 1,
          name: 'Root',
          value: 100,
          children: [
            {
              id: 2,
              name: 'Child1',
              value: 50,
              children: [
                { id: 3, name: 'GrandChild', value: 25 },
              ],
            },
            { id: 4, name: 'Child2', value: 50 },
          ],
        },
      ];

      const result = processTree(input, 'children', (node) => ({
        ...node,
        value: node.value * 2, // 翻倍值
      }));

      expect(result[0].value).toBe(200);
      expect(result[0].children[0].value).toBe(100);
      expect(result[0].children[0].children![0].value).toBe(50);
      expect(result[0].children[1].value).toBe(100);
    });

    it('应该处理空树', () => {
      const result = processTree([], 'children', (node) => node);
      expect(result).toEqual([]);
    });

    it('应该处理没有子节点的树', () => {
      const input = [{ id: 1, name: 'Root' }];
      const result = processTree(input, 'children', (node) => node);

      expect(result).toEqual(input);
    });
  });

  describe('权限 node_type 规范化', () => {
    const normalizeNodeType = (nodeType: string): string => {
      const mapping: Record<string, string> = {
        'directory': 'folder',
      };
      return mapping[nodeType] || nodeType;
    };

    it('应该转换 directory 为 folder', () => {
      expect(normalizeNodeType('directory')).toBe('folder');
    });

    it('应该保持其他类型不变', () => {
      expect(normalizeNodeType('folder')).toBe('folder');
      expect(normalizeNodeType('menu')).toBe('menu');
      expect(normalizeNodeType('button')).toBe('button');
    });
  });

  describe('数组去重和合并', () => {
    it('应该根据唯一键去重', () => {
      const input = [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
        { id: 1, name: 'A' }, // 重复
        { id: 3, name: 'C' },
      ];

      const unique = Array.from(
        new Map(input.map(item => [item.id, item])).values()
      );

      expect(unique).toHaveLength(3);
      expect(unique.find((item: any) => item.id === 1)).toBeDefined();
    });
  });

  describe('分页参数计算', () => {
    const calculatePagination = (currentPage: number, pageSize: number) => ({
      skip: (currentPage - 1) * pageSize,
      limit: pageSize,
    });

    it('应该正确计算 skip 和 limit', () => {
      expect(calculatePagination(1, 10)).toEqual({ skip: 0, limit: 10 });
      expect(calculatePagination(2, 10)).toEqual({ skip: 10, limit: 10 });
      expect(calculatePagination(3, 20)).toEqual({ skip: 40, limit: 20 });
    });

    it('应该处理第一页的 skip 为 0', () => {
      const { skip } = calculatePagination(1, 10);
      expect(skip).toBe(0);
    });
  });

  describe('状态码映射', () => {
    const getStatusText = (status: number): string => {
      return status === 0 ? '启用' : '禁用';
    };

    it('应该正确映射状态码', () => {
      expect(getStatusText(0)).toBe('启用');
      expect(getStatusText(1)).toBe('禁用');
    });

    const getStatusType = (status: number): string => {
      return status === 0 ? 'success' : 'danger';
    };

    it('应该返回正确的标签类型', () => {
      expect(getStatusType(0)).toBe('success');
      expect(getStatusType(1)).toBe('danger');
    });
  });
});
