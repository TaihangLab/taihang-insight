import { apiGet } from "@/api/utils/apiHelpers";
import type { AITask, DetectionResult } from "@/types/center.d";

/**
 * 实时检测管理 API
 * 提供 OSD 检测框叠加功能
 */

/**
 * 实时检测管理 API 类
 */
class RealtimeDetectionAPI {
  /**
   * 获取指定摄像头的运行中AI任务列表
   * @param cameraId 摄像头ID
   */
  async getTasksByCamera(cameraId: number): Promise<AITask[]> {
    if (!cameraId) {
      return Promise.reject(new Error("缺少摄像头ID"));
    }

    return apiGet<AITask[]>(`/api/v1/realtime-detection/detection/tasks/by_camera/${cameraId}`);
  }

  /**
   * 获取指定任务的当前检测结果（HTTP轮询方式）
   * @param taskId 任务ID
   */
  async getDetectionResult(taskId: number): Promise<DetectionResult> {
    if (!taskId) {
      return Promise.reject(new Error("缺少任务ID"));
    }

    return apiGet<DetectionResult>(`/api/v1/realtime-detection/detection/result/${taskId}`);
  }
}

// 导出单例实例
export default new RealtimeDetectionAPI();
