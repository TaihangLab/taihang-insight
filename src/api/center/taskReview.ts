import { apiGet, apiPost, apiPut, apiDelete } from "@/api/utils/apiHelpers";
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
  getTaskReviewConfig(taskType: string, taskId: string | number): Promise<TaskReviewConfig> {
    if (!taskType || !taskId) {
      return Promise.reject(new Error("缺少任务类型或任务ID"));
    }

    return apiGet<TaskReviewConfig>(`/api/v1/review/tasks/${taskType}/${taskId}/review-config`);
  }

  /**
   * 更新任务复判配置
   * @param taskType 任务类型 ('ai_task' 或 'llm_task')
   * @param taskId 任务ID
   * @param config 复判配置
   */
  updateTaskReviewConfig(
    taskType: string,
    taskId: string | number,
    config: TaskReviewConfig,
  ): Promise<void> {
    if (!taskType || !taskId) {
      return Promise.reject(new Error("缺少任务类型或任务ID"));
    }

    return apiPut<void>(`/api/v1/review/tasks/${taskType}/${taskId}/review-config`, config);
  }

  /**
   * 删除任务复判配置
   * @param taskType 任务类型 ('ai_task' 或 'llm_task')
   * @param taskId 任务ID
   */
  deleteTaskReviewConfig(taskType: string, taskId: string | number): Promise<void> {
    if (!taskType || !taskId) {
      return Promise.reject(new Error("缺少任务类型或任务ID"));
    }

    return apiDelete<void>(`/api/v1/review/tasks/${taskType}/${taskId}/review-config`);
  }

  /**
   * 获取可用的复判技能列表
   */
  getAvailableReviewSkills(): Promise<any[]> {
    return apiGet<any[]>("/api/v1/skills/review/available");
  }

  /**
   * 获取启用复判的任务列表
   */
  getReviewEnabledTasks(): Promise<any[]> {
    return apiGet<any[]>("/api/v1/ai/tasks/review-enabled");
  }

  /**
   * 手动触发预警复判
   * @param alertId 预警ID
   */
  triggerAlertReview(alertId: number): Promise<void> {
    if (!alertId) {
      return Promise.reject(new Error("缺少预警ID"));
    }

    return apiPost<void>("/api/v1/alerts/review", { alert_id: alertId });
  }

  /**
   * 获取复判服务状态
   */
  getReviewServiceStatus(): Promise<any> {
    return apiGet<any>("/api/v1/review/service/status");
  }

  /**
   * 启动复判服务
   */
  startReviewService(): Promise<void> {
    return apiPost<void>("/api/v1/review/service/start");
  }

  /**
   * 停止复判服务
   */
  stopReviewService(): Promise<void> {
    return apiPost<void>("/api/v1/review/service/stop");
  }

  /**
   * 获取AI任务列表（用于复判配置）
   * @param params 查询参数
   */
  getAITasksForReview(params: Record<string, any> = {}): Promise<any[]> {
    return apiGet<any[]>("/api/v1/ai/tasks", { params });
  }
}

// 导出单例实例
export default new TaskReviewAPI();
