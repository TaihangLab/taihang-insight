/**
 * 技能管理服务
 */

import axiosInstance from './config/axios'
import type { ApiResponse, PaginatedResponse, SkillClass, SkillListParams, AITaskSkillClass } from './types'

export class SkillService {
  private readonly basePath = '/api/v1/skill-classes'

  /**
   * 获取技能列表
   */
  async getSkillList(params?: SkillListParams): Promise<PaginatedResponse<SkillClass>> {
    const response = await axiosInstance.get<any, PaginatedResponse<SkillClass>>(this.basePath, { params })
    return response
  }

  /**
   * 获取 AI 任务技能列表
   */
  async getAITaskSkillClasses(params?: SkillListParams): Promise<PaginatedResponse<AITaskSkillClass>> {
    const response = await axiosInstance.get<any, PaginatedResponse<AITaskSkillClass>>(
      `${this.basePath}/ai-tasks`,
      { params }
    )
    return response
  }

  /**
   * 重新加载技能类
   */
  async reloadSkillClasses(): Promise<ApiResponse<{ message: string }>> {
    const response = await axiosInstance.post<any, ApiResponse<{ message: string }>>(
      `${this.basePath}/reload`
    )
    return response
  }

  /**
   * 获取技能详情
   */
  async getSkillDetail(skillClassId: string): Promise<ApiResponse<SkillClass>> {
    const response = await axiosInstance.get<any, ApiResponse<SkillClass>>(
      `${this.basePath}/${skillClassId}`
    )
    return response
  }

  /**
   * 获取 AI 任务技能详情
   */
  async getAITaskSkillDetail(skillClassId: string): Promise<ApiResponse<AITaskSkillClass>> {
    const response = await axiosInstance.get<any, ApiResponse<AITaskSkillClass>>(
      `${this.basePath}/ai-tasks/${skillClassId}`
    )
    return response
  }

  /**
   * 创建 AI 任务
   */
  async createAITask(taskData: {
    name: string
    camera_id: string
    skill_class_id: string
    config?: Record<string, any>
    running_period?: {
      enabled: boolean
      periods?: Array<{ start: string; end: string }>
    }
  }): Promise<ApiResponse<{ message: string }>> {
    const response = await axiosInstance.post<any, ApiResponse<{ message: string }>>(
      `/api/v1/ai-tasks`,
      taskData
    )
    return response
  }

  /**
   * 删除技能
   */
  async deleteSkill(skillClassId: string): Promise<ApiResponse<void>> {
    const response = await axiosInstance.delete<any, ApiResponse<void>>(`${this.basePath}/${skillClassId}`)
    return response
  }

  /**
   * 批量删除技能
   */
  async batchDeleteSkills(ids: string[]): Promise<ApiResponse<void>> {
    const response = await axiosInstance.post<any, ApiResponse<void>>(
      `${this.basePath}/batch-delete`,
      { ids }
    )
    return response
  }

  /**
   * 导入技能
   */
  async importSkill(skillData: Partial<SkillClass>): Promise<ApiResponse<SkillClass>> {
    const formData = new FormData()
    Object.keys(skillData).forEach(key => {
      const value = (skillData as any)[key]
      if (value !== undefined) {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value))
        } else {
          formData.append(key, value as string)
        }
      }
    })

    const response = await axiosInstance.post<any, ApiResponse<SkillClass>>(
      `${this.basePath}/import`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    )
    return response
  }

  /**
   * 更新技能
   */
  async updateSkill(skillClassId: string, skillData: Partial<SkillClass>): Promise<ApiResponse<SkillClass>> {
    const response = await axiosInstance.put<any, ApiResponse<SkillClass>>(
      `${this.basePath}/${skillClassId}`,
      skillData
    )
    return response
  }

  /**
   * 上传技能图片
   */
  async uploadSkillImage(skillClassId: string, imageFile: File): Promise<ApiResponse<{ image_url: string }>> {
    const formData = new FormData()
    formData.append('image', imageFile)

    const response = await axiosInstance.post<any, ApiResponse<{ image_url: string }>>(
      `${this.basePath}/${skillClassId}/image`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    )
    return response
  }

  /**
   * 获取技能设备列表
   */
  async getSkillDevices(skillClassId: string): Promise<ApiResponse<any[]>> {
    const response = await axiosInstance.get<any, ApiResponse<any[]>>(
      `${this.basePath}/${skillClassId}/devices`
    )
    return response
  }
}

// 导出单例
export default new SkillService()
