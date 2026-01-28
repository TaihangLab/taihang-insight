import rbacAxios, { UnifiedResponse } from './base'
import type {
  Position,
  CreatePositionRequest,
  UpdatePositionRequest,
  PositionQueryParams
} from '@/types/rbac/position'

// ============================================
// PositionService 类
// ============================================

class PositionService {
  /**
   * 获取岗位列表
   */
  static async getPositions(params?: PositionQueryParams): Promise<UnifiedResponse<Position[]>> {
    try {
      return await rbacAxios.get('/api/v1/rbac/positions', { params })
    } catch (error) {
      console.error('获取岗位列表失败:', error)
      throw error
    }
  }

  /**
   * 创建岗位
   */
  static async createPosition(posData: CreatePositionRequest): Promise<UnifiedResponse<Position>> {
    try {
      return await rbacAxios.post('/api/v1/rbac/positions', posData)
    } catch (error) {
      console.error('创建岗位失败:', error)
      throw error
    }
  }

  /**
   * 更新岗位
   */
  static async updatePosition(
    positionId: number,
    posData: UpdatePositionRequest
  ): Promise<UnifiedResponse<Position>> {
    try {
      return await rbacAxios.put(`/api/v1/rbac/positions/${positionId}`, posData)
    } catch (error) {
      console.error('更新岗位失败:', error)
      throw error
    }
  }

  /**
   * 删除岗位
   */
  static async deletePosition(positionId: number): Promise<UnifiedResponse<void>> {
    try {
      return await rbacAxios.delete(`/api/v1/rbac/positions/${positionId}`)
    } catch (error) {
      console.error('删除岗位失败:', error)
      throw error
    }
  }
}

// 重新导出类型，方便使用
export type { Position, CreatePositionRequest, UpdatePositionRequest, PositionQueryParams }

export default PositionService
