import { AxiosResponse } from 'axios'
import { type UnifiedResponse, authAxios } from '@/api/commons'
/**
 * 任务复判管理 API
 * 提供任务复判配置的管理功能
 */

/**
 * 任务复判配置
 */
export interface TaskReviewConfig {
  review_enabled: boolean
  review_skill_class_id?: number
  review_confidence_threshold?: number
  review_conditions?: Record<string, any>
}

/**
 * 任务复判 API 类
 */
class TaskReviewAPI {
  /**
   * 获取任务复判配置
   * @param taskType 任务类型 ('ai_task' 或 'llm_task')
   * @param taskId 任务ID
   */
  async getTaskReviewConfig(taskType: string, taskId: string | number): Promise<AxiosResponse<UnifiedResponse<TaskReviewConfig>>> {
    if (!taskType || !taskId) {
      console.error('获取任务复判配置失败: 缺少必要参数')
      return Promise.reject(new Error('缺少任务类型或任务ID'))
    }

    console.log('获取任务复判配置:', { taskType, taskId })

    try {
      const response = await authAxios.get(`/api/v1/tasks/${taskType}/${taskId}/review-config`)
      console.log('获取任务复判配置成功:', response.data)
      return response
    } catch (error) {
      console.error('获取任务复判配置失败:', error)
      throw error
    }
  }

  /**
   * 更新任务复判配置
   * @param taskType 任务类型 ('ai_task' 或 'llm_task')
   * @param taskId 任务ID
   * @param config 复判配置
   */
  async updateTaskReviewConfig(taskType: string, taskId: string | number, config: TaskReviewConfig): Promise<AxiosResponse> {
    if (!taskType || !taskId) {
      console.error('更新任务复判配置失败: 缺少必要参数')
      return Promise.reject(new Error('缺少任务类型或任务ID'))
    }

    console.log('更新任务复判配置:', { taskType, taskId, config })

    try {
      const response = await authAxios.put(`/api/v1/tasks/${taskType}/${taskId}/review-config`, config)
      console.log('更新任务复判配置成功:', response.data)
      return response
    } catch (error) {
      console.error('更新任务复判配置失败:', error)
      throw error
    }
  }

  /**
   * 删除任务复判配置
   * @param taskType 任务类型 ('ai_task' 或 'llm_task')
   * @param taskId 任务ID
   */
  async deleteTaskReviewConfig(taskType: string, taskId: string | number): Promise<AxiosResponse> {
    if (!taskType || !taskId) {
      console.error('删除任务复判配置失败: 缺少必要参数')
      return Promise.reject(new Error('缺少任务类型或任务ID'))
    }

    console.log('删除任务复判配置:', { taskType, taskId })

    try {
      const response = await authAxios.delete(`/api/v1/tasks/${taskType}/${taskId}/review-config`)
      console.log('删除任务复判配置成功:', response.data)
      return response
    } catch (error) {
      console.error('删除任务复判配置失败:', error)
      throw error
    }
  }

  /**
   * 获取可用的复判技能列表
   */
  async getAvailableReviewSkills(): Promise<AxiosResponse> {
    console.log('获取可用的复判技能列表')

    try {
      const response = await authAxios.get('/api/v1/review-skills/available')
      console.log('获取可用复判技能成功:', response.data)
      return response
    } catch (error) {
      console.error('获取可用复判技能失败:', error)
      throw error
    }
  }

  /**
   * 获取启用复判的任务列表
   */
  async getReviewEnabledTasks(): Promise<AxiosResponse> {
    console.log('获取启用复判的任务列表')

    try {
      const response = await authAxios.get('/api/v1/tasks/review-enabled')
      console.log('获取启用复判的任务成功:', response.data)
      return response
    } catch (error) {
      console.error('获取启用复判的任务失败:', error)
      throw error
    }
  }

  /**
   * 手动触发预警复判
   * @param alertId 预警ID
   */
  async triggerAlertReview(alertId: number): Promise<AxiosResponse> {
    if (!alertId) {
      console.error('触发预警复判失败: 缺少预警ID')
      return Promise.reject(new Error('缺少预警ID'))
    }

    console.log('手动触发预警复判:', alertId)

    try {
      const response = await authAxios.post('/api/v1/alerts/review', { alert_id: alertId })
      console.log('触发预警复判成功:', response.data)
      return response
    } catch (error) {
      console.error('触发预警复判失败:', error)
      throw error
    }
  }

  /**
   * 获取复判服务状态
   */
  async getReviewServiceStatus(): Promise<AxiosResponse> {
    console.log('获取复判服务状态')

    try {
      const response = await authAxios.get('/api/v1/review-service/status')
      console.log('获取复判服务状态成功:', response.data)
      return response
    } catch (error) {
      console.error('获取复判服务状态失败:', error)
      throw error
    }
  }

  /**
   * 启动复判服务
   */
  async startReviewService(): Promise<AxiosResponse> {
    console.log('启动复判服务')

    try {
      const response = await authAxios.post('/api/v1/review-service/start')
      console.log('启动复判服务成功:', response.data)
      return response
    } catch (error) {
      console.error('启动复判服务失败:', error)
      throw error
    }
  }

  /**
   * 停止复判服务
   */
  async stopReviewService(): Promise<AxiosResponse> {
    console.log('停止复判服务')

    try {
      const response = await authAxios.post('/api/v1/review-service/stop')
      console.log('停止复判服务成功:', response.data)
      return response
    } catch (error) {
      console.error('停止复判服务失败:', error)
      throw error
    }
  }

  /**
   * 获取AI任务列表（用于复判配置）
   * @param params 查询参数
   */
  async getAITasksForReview(params: Record<string, any> = {}): Promise<AxiosResponse> {
    console.log('获取AI任务列表（用于复判配置）')

    try {
      const response = await authAxios.get('/api/v1/ai-tasks', { params })
      console.log('获取AI任务列表成功:', response.data)
      return response
    } catch (error) {
      console.error('获取AI任务列表失败:', error)
      throw error
    }
  }
}

// 导出单例实例
export default new TaskReviewAPI()
