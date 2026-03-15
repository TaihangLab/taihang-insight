import rbacAxios, { UnifiedResponse } from "@/api/commons";
import type {
  Position,
  CreatePositionRequest,
  UpdatePositionRequest,
  PositionQueryParams,
} from "@/types/rbac/position";

// ============================================
// PositionService 类
// ============================================

class PositionService {
  /**
   * 获取岗位列表
   */
  static async getPositions(params?: PositionQueryParams): Promise<UnifiedResponse<Position[]>> {
    return rbacAxios.get("/api/v1/rbac/positions", { params });
  }

  /**
   * 创建岗位
   */
  static async createPosition(posData: CreatePositionRequest): Promise<UnifiedResponse<Position>> {
    return rbacAxios.post("/api/v1/rbac/positions", posData);
  }

  /**
   * 更新岗位
   */
  static async updatePosition(
    positionId: number,
    posData: UpdatePositionRequest,
  ): Promise<UnifiedResponse<Position>> {
    return rbacAxios.put(`/api/v1/rbac/positions/${positionId}`, posData);
  }

  /**
   * 删除岗位
   */
  static async deletePosition(positionId: number): Promise<UnifiedResponse<void>> {
    return rbacAxios.delete(`/api/v1/rbac/positions/${positionId}`);
  }
}

// 重新导出类型，方便使用
export type { Position, CreatePositionRequest, UpdatePositionRequest, PositionQueryParams };

export default PositionService;
