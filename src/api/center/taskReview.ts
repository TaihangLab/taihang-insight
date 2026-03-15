import { AxiosResponse } from "axios";
import { type UnifiedResponse, authAxios } from "@/api/commons";
import type { TaskReviewConfig } from "@/types/center.d";
/**
 * 任务复判管理 API
 * 提供任务复判配置的管理功能
 */

/**
 * 任务复判 API 类
 */
class TaskReviewAPI {
  /**
   * 获取任务复判配置
   * @param taskType 任务类型 ('ai_task' 或 'llm_task')
   * @param taskId 任务ID
   */
  async getTaskReviewConfig(
    taskType: string,
    taskId: string | number,
  ): Promise<AxiosResponse<UnifiedResponse<TaskReviewConfig>>> {
    if (!taskType || !taskId) {
      return Promise.reject(new Error("缺少任务类型或任务ID"));
    }

    return authAxios.get(`/api/v1/tasks/${taskType}/${taskId}/review-config`);
  }

  /**
   * 更新任务复判配置
   * @param taskType 任务类型 ('ai_task' 或 'llm_task')
   * @param taskId 任务ID
   * @param config 复判配置
   */
  async updateTaskReviewConfig(
    taskType: string,
    taskId: string | number,
    config: TaskReviewConfig,
  ): Promise<AxiosResponse> {
    if (!taskType || !taskId) {
      return Promise.reject(new Error("缺少任务类型或任务ID"));
    }

    return authAxios.put(`/api/v1/tasks/${taskType}/${taskId}/review-config`, config);
  }

  /**
   * 删除任务复判配置
   * @param taskType 任务类型 ('ai_task' 或 'llm_task')
   * @param taskId 任务ID
   */
  async deleteTaskReviewConfig(taskType: string, taskId: string | number): Promise<AxiosResponse> {
    if (!taskType || !taskId) {
      return Promise.reject(new Error("缺少任务类型或任务ID"));
    }

    return authAxios.delete(`/api/v1/tasks/${taskType}/${taskId}/review-config`);
  }

  /**
   * 获取可用的复判技能列表
   */
  async getAvailableReviewSkills(): Promise<AxiosResponse> {
    return authAxios.get("/api/v1/review-skills/available");
  }

  /**
   * 获取启用复判的任务列表
   */
  async getReviewEnabledTasks(): Promise<AxiosResponse> {
    return authAxios.get("/api/v1/tasks/review-enabled");
  }

  /**
   * 手动触发预警复判
   * @param alertId 预警ID
   */
  async triggerAlertReview(alertId: number): Promise<AxiosResponse> {
    if (!alertId) {
      return Promise.reject(new Error("缺少预警ID"));
    }

    return authAxios.post("/api/v1/alerts/review", { alert_id: alertId });
  }

  /**
   * 获取复判服务状态
   */
  async getReviewServiceStatus(): Promise<AxiosResponse> {
    return authAxios.get("/api/v1/review-service/status");
  }

  /**
   * 启动复判服务
   */
  async startReviewService(): Promise<AxiosResponse> {
    return authAxios.post("/api/v1/review-service/start");
  }

  /**
   * 停止复判服务
   */
  async stopReviewService(): Promise<AxiosResponse> {
    return authAxios.post("/api/v1/review-service/stop");
  }

  /**
   * 获取AI任务列表（用于复判配置）
   * @param params 查询参数
   */
  async getAITasksForReview(params: Record<string, any> = {}): Promise<AxiosResponse> {
    return authAxios.get("/api/v1/ai-tasks", { params });
  }
}

// 导出单例实例
export default new TaskReviewAPI();
