/**
 * 岗位数据管理 Composable (TypeScript 版本)
 * 负责岗位列表的获取、创建、更新、删除等数据操作
 */

import { ref, computed } from 'vue';
import type { Position } from '@/types/rbac';
import type { PositionCategory } from '@/types/rbac/position';
import { Status } from '@/types/rbac';
import RBACService from '@/components/service/RBACService';

// ============================================
// 类型定义
// ============================================

/**
 * 岗位查询条件
 */
export interface PositionSearchConditions {
  tenant_code?: string;
  position_code?: string;
  position_name?: string;
  category_code?: string;
  department?: string;
  status?: Status;
}

/**
 * 岗位分页参数
 */
export interface PositionPagination {
  currentPage: number;
  pageSize: number;
  total: number;
}

/**
 * 岗位实体（扩展基础类型，用于兼容）
 */
export interface PositionEntity extends Position {
  // 扩展字段用于兼容后端返回
  [key: string]: unknown;
}

// ============================================
// Composable
// ============================================

export function usePositionData() {
  // ============================================
  // 状态
  // ============================================

  const positions = ref<PositionEntity[]>([]);
  const positionCategories = ref<PositionCategory[]>([]);
  const loading = ref(false);

  // 分页信息
  const pagination = ref<PositionPagination>({
    currentPage: 1,
    pageSize: 10,
    total: 0
  });

  // 计算属性
  const hasData = computed(() => positions.value.length > 0);

  // ============================================
  // 方法
  // ============================================

  /**
   * 获取岗位列表
   */
  const fetchPositions = async (params: PositionSearchConditions, page?: number, pageSize?: number) => {
    loading.value = true;
    try {
      const currentPage = page ?? pagination.value.currentPage;
      const size = pageSize ?? pagination.value.pageSize;

      // 构建查询参数
      const queryParams: Record<string, unknown> = {
        skip: (currentPage - 1) * size,
        limit: size
      };

      // 添加可选查询条件
      if (params.tenant_code) queryParams.tenant_code = params.tenant_code;
      if (params.position_code) queryParams.position_code = params.position_code;
      if (params.position_name) queryParams.position_name = params.position_name;
      if (params.category_code) queryParams.category_code = params.category_code;
      if (params.department) queryParams.department = params.department;
      if (params.status !== undefined) queryParams.status = params.status;

      const response = await RBACService.getPositions(queryParams);

      if (response?.data) {
        // 映射数据
        positions.value = (response.data.items || []).map(item => {
          return {
            id: Number(item.id),
            positionCode: String(item.positionCode || item.position_code || ''),
            positionName: String(item.positionName || item.position_name || ''),
            categoryCode: String(item.categoryCode || item.category_code || ''),
            categoryName: String(item.categoryName || ''),
            department: String(item.department || ''),
            sortOrder: Number(item.sortOrder || item.sort_order || 0),
            status: Number(item.status) as Status,
            tenantCode: String(item.tenantCode || item.tenant_code || ''),
            createTime: String(item.createTime || item.create_time || ''),
            // 保留原始数据
            ...item
          } as PositionEntity;
        });

        pagination.value.total = Number(response.data.total || 0);
        pagination.value.currentPage = currentPage;
        pagination.value.pageSize = size;
      }

      return positions.value;
    } catch (error) {
      console.error('获取岗位列表失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 获取岗位类别列表
   */
  const fetchPositionCategories = async () => {
    try {
      const response = await RBACService.getPositions({ skip: 0, limit: 1000 });

      // 提取唯一类别
      const categoryMap = new Map<string, PositionCategory>();

      if (response?.data?.items) {
        (response.data.items || []).forEach(item => {
          const categoryCode = String(item.categoryCode || item.category_code || '');
          const categoryName = String(item.categoryName || '');

          if (categoryCode && !categoryMap.has(categoryCode)) {
            categoryMap.set(categoryCode, {
              id: Number(item.id),
              categoryCode,
              categoryName,
              sortOrder: 0,
              status: Number(item.status) as Status,
              tenantCode: String(item.tenantCode || ''),
              createTime: ''
            });
          }
        });
      }

      positionCategories.value = Array.from(categoryMap.values());
      return positionCategories.value;
    } catch (error) {
      console.error('获取岗位类别失败:', error);
      throw error;
    }
  };

  /**
   * 创建岗位
   */
  const createPosition = async (data: Record<string, unknown>) => {
    loading.value = true;
    try {
      await RBACService.createPosition(data);
      return { success: true, message: '新增成功' };
    } catch (error) {
      console.error('创建岗位失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新岗位
   */
  const updatePosition = async (positionId: number, data: Record<string, unknown>) => {
    loading.value = true;
    try {
      await RBACService.updatePosition(positionId, data);
      return { success: true, message: '修改成功' };
    } catch (error) {
      console.error('更新岗位失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除岗位
   */
  const deletePosition = async (positionId: number) => {
    loading.value = true;
    try {
      await RBACService.deletePosition(positionId);
      return { success: true, message: '删除成功' };
    } catch (error) {
      console.error('删除岗位失败:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 清空数据
   */
  const clearData = () => {
    positions.value = [];
    positionCategories.value = [];
    pagination.value = {
      currentPage: 1,
      pageSize: 10,
      total: 0
    };
  };

  return {
    // 状态
    positions,
    positionCategories,
    loading,
    pagination,
    hasData,

    // 方法
    fetchPositions,
    fetchPositionCategories,
    createPosition,
    updatePosition,
    deletePosition,
    clearData
  };
}
