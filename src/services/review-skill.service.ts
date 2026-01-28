/**
 * 复判技能管理服务
 */

import axiosInstance from './config/axios'
import type {
  ApiResponse,
  PaginatedResponse,
  ReviewSkill,
  CreateReviewSkillParams,
  ReviewSkillListParams
} from './types'

export class ReviewSkillService {
  private readonly basePath = '/api/v1/llm-skills/review'

  /**
   * 创建复判技能
   */
  async createReviewSkill(skillData: CreateReviewSkillParams): Promise<ApiResponse<ReviewSkill>> {
    const formData = new FormData()
    Object.keys(skillData).forEach(key => {
      const value = (skillData as any)[key]
      if (value !== undefined) {
        formData.append(key, value)
      }
    })

    const response = await axiosInstance.post<any, ApiResponse<ReviewSkill>>(
      this.basePath,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    )
    return response
  }

  /**
   * 预览测试复判技能
   */
  async previewTestReviewSkill(
    testImage: File,
    userPrompt: string
  ): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('test_image', testImage)
    formData.append('user_prompt', userPrompt)

    const response = await axiosInstance.post<any, ApiResponse<any>>(
      `${this.basePath}/preview-test`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    )
    return response
  }

  /**
   * 更新复判技能
   */
  async updateReviewSkill(skillId: string, updateData: Partial<CreateReviewSkillParams>): Promise<ApiResponse<ReviewSkill>> {
    const formData = new FormData()
    Object.keys(updateData).forEach(key => {
      const value = (updateData as any)[key]
      if (value !== undefined) {
        formData.append(key, value)
      }
    })

    const response = await axiosInstance.put<any, ApiResponse<ReviewSkill>>(
      `${this.basePath}/${skillId}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    )
    return response
  }

  /**
   * 获取复判技能列表
   */
  async getReviewSkillList(params?: ReviewSkillListParams): Promise<PaginatedResponse<ReviewSkill>> {
    const response = await axiosInstance.get<any, PaginatedResponse<ReviewSkill>>(this.basePath, { params })
    return response
  }

  /**
   * 获取复判技能详情
   */
  async getReviewSkillDetail(skillId: string): Promise<ApiResponse<ReviewSkill>> {
    const response = await axiosInstance.get<any, ApiResponse<ReviewSkill>>(`${this.basePath}/${skillId}`)
    return response
  }

  /**
   * 发布复判技能
   */
  async publishReviewSkill(skillId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await axiosInstance.post<any, ApiResponse<{ message: string }>>(
      `${this.basePath}/${skillId}/publish`
    )
    return response
  }

  /**
   * 取消发布复判技能
   */
  async unpublishReviewSkill(skillId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await axiosInstance.post<any, ApiResponse<{ message: string }>>(
      `${this.basePath}/${skillId}/unpublish`
    )
    return response
  }

  /**
   * 删除复判技能
   */
  async deleteReviewSkill(skillId: string): Promise<ApiResponse<void>> {
    const response = await axiosInstance.delete<any, ApiResponse<void>>(`${this.basePath}/${skillId}`)
    return response
  }

  /**
   * 批量删除复判技能
   */
  async batchDeleteReviewSkills(skillIds: string[]): Promise<ApiResponse<void>> {
    const response = await axiosInstance.post<any, ApiResponse<void>>(
      `${this.basePath}/batch-delete`,
      { ids: skillIds }
    )
    return response
  }
}

// 导出单例
export default new ReviewSkillService()
