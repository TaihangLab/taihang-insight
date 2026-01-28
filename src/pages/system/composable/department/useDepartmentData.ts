/**
 * 部门数据管理 Composable (TypeScript 版本)
 * 负责部门列表的获取、创建、更新、删除等数据操作
 */

import { ref, computed } from 'vue';
import type { DepartmentTreeNode } from '@/types/rbac';
import { Status } from '@/types/rbac';
import departmentService from '@/api/system/departmentService';

// ============================================
// 类型定义
// ============================================

/**
 * 部门查询条件
 */
export interface DepartmentSearchConditions {
  tenant_id: string | number | null;
  dept_name: string;
  name?: string; // 兼容旧代码
  id?: string | number;
  status: number | null;
}

/**
 * 部门实体（扩展基础类型）
 */
export interface DepartmentEntity extends Omit<DepartmentTreeNode, 'tenant_id' | 'children'> {
  // 扩展字段用于兼容
  tenant_id?: string | number;
  // 兼容 DepartmentTreeTable 的本地 Department 接口
  name: string;
  // 子节点数组，使用 DepartmentEntity 类型
  children?: DepartmentEntity[];
}

/**
 * 上级部门选项
 */
export interface ParentDeptOption {
  id: number;
  name: string;
  parentId?: number | null;
  parent_id: number | null;
  children?: ParentDeptOption[];
}

// ============================================
// Composable
// ============================================

export function useDepartmentData() {
  // ============================================
  // 状态
  // ============================================

  const departments = ref<DepartmentEntity[]>([]);
  const loading = ref(false);
  const parentDeptOptions = ref<ParentDeptOption[]>([]);

  // 计算属性
  const hasData = computed(() => departments.value.length > 0);

  // ============================================
  // 方法
  // ============================================

  /**
   * 获取部门列表（树形结构）
   */
  const fetchDepartments = async (params: DepartmentSearchConditions) => {
    loading.value = true;
    try {
      // 构建查询参数
      const queryParams: Record<string, unknown> = {};

      // 支持 dept_name 和 name 两种属性名
      const nameValue = params.dept_name || params.name;
      if (nameValue) queryParams.name = nameValue;
      if (params.id) queryParams.id = params.id;
      if (params.status !== undefined && params.status !== null) {
        queryParams.status = params.status;
      }
      if (params.tenant_id) queryParams.tenant_id = params.tenant_id;

      const response = await departmentService.getDepartmentTree(queryParams);

      if (response?.data) {
        // 安全地提取部门数据，支持多种返回格式
        let extractedDepartments: unknown[] = [];

        if (Array.isArray(response.data)) {
          extractedDepartments = response.data;
        } else {
          console.warn('API返回格式不符合预期:', response.data);
          throw new Error('API返回格式异常');
        }

        // 递归映射函数，为所有部门节点添加 name 属性
        const mapDepartmentNode = (node: Record<string, unknown>): DepartmentEntity => {
          const children = Array.isArray(node.children) ? node.children : [];
          const deptName = String(node.dept_name || node.name || '');
          return {
            id: Number(node.id),
            dept_code: String(node.dept_code || ''),
            dept_name: deptName,
            name: deptName, // 兼容 DepartmentTreeTable 的本地 Department 接口
            tenant_id: node.tenant_id !== null && node.tenant_id !== undefined
              ? Number(node.tenant_id)
              : undefined,
            parent_id: node.parent_id !== null && node.parent_id !== undefined
              ? Number(node.parent_id)
              : null,
            sort_order: Number(node.sort_order || 0),
            status: Number(node.status) as Status,
            path: String(node.path || ''),
            depth: Number(node.depth || 0),
            leader: node.leader ? String(node.leader) : undefined,
            phone: node.phone ? String(node.phone) : undefined,
            email: node.email ? String(node.email) : undefined,
            create_time: String(node.create_time || ''),
            update_time: node.update_time ? String(node.update_time) : undefined,
            remark: node.remark ? String(node.remark) : undefined,
            // 递归映射子节点
            children: children.map(child => mapDepartmentNode(child as Record<string, unknown>))
          } as DepartmentEntity;
        };

        // 映射数据库字段到前端使用的格式
        departments.value = extractedDepartments.map(dept => {
          return mapDepartmentNode(dept as Record<string, unknown>);
        });
      } else {
        throw new Error('API返回格式异常');
      }

      // 同时更新上级部门选项
      await fetchParentDeptOptions(params.tenant_id);

      return departments.value;
    } catch (error) {
      console.error('获取部门列表失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 获取上级部门选项
   */
  const fetchParentDeptOptions = async (tenantId?: string | number) => {
    try {
      const params = tenantId ? { tenant_id: Number(tenantId) } : {};
      const response = await departmentService.getDepartmentTree(params);

      let depts: unknown[] = [];

      if (response?.data) {
        if (Array.isArray(response.data)) {
          depts = response.data;
        }
      }

      // 递归转换数据
      const convertToNumber = (nodes: unknown[]): ParentDeptOption[] => {
        return nodes.map(node => {
          const n = node as Record<string, unknown>;
          return {
            id: Number(n.id),
            name: String(n.dept_name || n.name || ''),
            parentId: n.parent_id !== null && n.parent_id !== undefined
              ? Number(n.parent_id)
              : null,
            parent_id: n.parent_id !== null && n.parent_id !== undefined
              ? Number(n.parent_id)
              : null,
            children: n.children && Array.isArray(n.children) && n.children.length > 0
              ? convertToNumber(n.children)
              : []
          } as ParentDeptOption;
        });
      };

      const convertedDepts = convertToNumber(depts);

      // 添加"无上级部门"选项
      const noneOption: ParentDeptOption = {
        id: 0,
        name: '无上级部门',
        parentId: null,
        parent_id: null,
        children: []
      };

      parentDeptOptions.value = [noneOption, ...convertedDepts];

      return parentDeptOptions.value;
    } catch (error) {
      console.error('获取上级部门选项失败:', error);
      throw error;
    }
  };

  /**
   * 创建部门
   */
  const createDepartment = async (data: Record<string, unknown>) => {
    loading.value = true;
    try {
      // @ts-ignore - 数据由调用方验证，后端会进行验证
      await departmentService.createDepartment(data);
      return { success: true, message: '新增成功' };
    } catch (error) {
      console.error('创建部门失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新部门
   */
  const updateDepartment = async (deptId: number, data: Record<string, unknown>) => {
    loading.value = true;
    try {
      // @ts-ignore - 数据由调用方验证，后端会进行验证
      await departmentService.updateDepartment(deptId, data);
      return { success: true, message: '修改成功' };
    } catch (error) {
      console.error('更新部门失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除部门
   */
  const deleteDepartment = async (deptId: number) => {
    loading.value = true;
    try {
      await departmentService.deleteDepartment(deptId);
      return { success: true, message: '删除成功' };
    } catch (error) {
      console.error('删除部门失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 清空数据
   */
  const clearData = () => {
    departments.value = [];
    parentDeptOptions.value = [];
  };

  return {
    // 状态
    departments,
    loading,
    parentDeptOptions,
    hasData,

    // 方法
    fetchDepartments,
    fetchParentDeptOptions,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    clearData
  };
}
