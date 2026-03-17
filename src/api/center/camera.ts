import type { Camera, CameraQueryParams, AITask, ListWithPagination } from "@/types/center.d";
import { normalizePageParams } from "@/api/utils/pageUtils";
import { apiGet, apiPut } from "@/api/utils/apiHelpers";

/**
 * 摄像头管理 API
 * 提供摄像头的增删改查操作
 */

/**
 * 摄像头管理 API 类
 */
class CameraAPI {
  /**
   * 获取摄像头列表
   * @param params 查询参数
   */
  async getCameraList(params: CameraQueryParams = {}): Promise<ListWithPagination<Camera>> {
    // 复制所有参数并应用分页默认值
    const { page, limit } = normalizePageParams(params);
    const apiParams = {
      ...params,
      page,
      limit: Math.min(limit, 100), // 摄像头列表限制最大值为 100
    };

    return apiGet<ListWithPagination<Camera>>("/api/v1/cameras/ai/list", { params: apiParams });
  }

  /**
   * 获取摄像头详情
   * @param cameraId 摄像头ID
   */
  async getCameraDetail(cameraId: number | string): Promise<Camera> {
    if (!cameraId) {
      return Promise.reject(new Error("缺少摄像头ID"));
    }

    return apiGet<Camera>(`/api/v1/cameras/${cameraId}`);
  }

  /**
   * 更新摄像头信息
   * @param cameraId 摄像头ID
   * @param updateData 更新数据
   */
  async updateCamera(cameraId: number | string, updateData: Partial<Camera>): Promise<Camera> {
    if (!cameraId) {
      return Promise.reject(new Error("缺少摄像头ID"));
    }

    return apiPut<Camera>(`/api/v1/cameras/${cameraId}`, updateData);
  }

  /**
   * 获取摄像头关联的AI任务
   * @param cameraId 摄像头ID
   */
  async getCameraAITasks(cameraId: number | string): Promise<AITask[]> {
    if (!cameraId) {
      return Promise.reject(new Error("缺少摄像头ID"));
    }

    return apiGet<AITask[]>(`/api/v1/ai-tasks/camera/id/${cameraId}`);
  }
}

// 导出单例实例
export default new CameraAPI();
