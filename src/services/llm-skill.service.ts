/**
 * 大模型技能管理服务
 */

import axiosInstance from './config/axios'
import type {
  ApiResponse,
  PaginatedResponse,
  LlmSkill,
  CreateLlmSkillParams,
  LlmSkillListParams
} from './types'

export class LlmSkillService {
  private readonly basePath = '/api/v1/llm-skills'

  /**
   * 创建 LLM 技能
   */
  async createLlmSkill(skillData: CreateLlmSkillParams): Promise<ApiResponse<LlmSkill>> {
    const response = await axiosInstance.post<any, ApiResponse<LlmSkill>>(this.basePath, skillData)
    return response
  }

  /**
   * 上传 LLM 技能图标
   */
  async uploadLlmSkillIcon(iconFile: File, skillId?: string | null): Promise<ApiResponse<{ icon_url: string }>> {
    const formData = new FormData()
    formData.append('icon', iconFile)
    if (skillId) {
      formData.append('skill_id', skillId)
    }

    const response = await axiosInstance.post<any, ApiResponse<{ icon_url: string }>>(
      `${this.basePath}/upload-icon`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    )
    return response
  }

  /**
   * 预览测试 LLM 技能
   */
  async previewTestLlmSkill(
    testImage: File,
    promptTemplate: string,
    systemPrompt?: string | null,
    outputParameters?: Array<{ name: string; type: string; description?: string }> | null
  ): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('test_image', testImage)
    formData.append('prompt_template', promptTemplate)
    if (systemPrompt) {
      formData.append('system_prompt', systemPrompt)
    }
    if (outputParameters && outputParameters.length > 0) {
      formData.append('output_parameters', JSON.stringify(outputParameters))
    }

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
   * 获取 LLM 技能列表
   */
  async getLlmSkillList(params?: LlmSkillListParams): Promise<PaginatedResponse<LlmSkill>> {
    const response = await axiosInstance.get<any, PaginatedResponse<LlmSkill>>(this.basePath, { params })
    return response
  }

  /**
   * 获取 LLM 技能详情
   */
  async getLlmSkillDetail(skillId: string): Promise<ApiResponse<LlmSkill>> {
    const response = await axiosInstance.get<any, ApiResponse<LlmSkill>>(`${this.basePath}/${skillId}`)
    return response
  }

  /**
   * 更新 LLM 技能
   */
  async updateLlmSkill(skillId: string, skillData: Partial<CreateLlmSkillParams>): Promise<ApiResponse<LlmSkill>> {
    const response = await axiosInstance.put<any, ApiResponse<LlmSkill>>(
      `${this.basePath}/${skillId}`,
      skillData
    )
    return response
  }

  /**
   * 发布 LLM 技能
   */
  async publishLlmSkill(skillId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await axiosInstance.post<any, ApiResponse<{ message: string }>>(
      `${this.basePath}/${skillId}/publish`
    )
    return response
  }

  /**
   * 取消发布 LLM 技能
   */
  async unpublishLlmSkill(skillId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await axiosInstance.post<any, ApiResponse<{ message: string }>>(
      `${this.basePath}/${skillId}/unpublish`
    )
    return response
  }

  /**
   * 删除 LLM 技能
   */
  async deleteLlmSkill(skillId: string): Promise<ApiResponse<void>> {
    const response = await axiosInstance.delete<any, ApiResponse<void>>(`${this.basePath}/${skillId}`)
    return response
  }

  /**
   * 批量删除 LLM 技能
   */
  async batchDeleteLlmSkills(skillIds: string[]): Promise<ApiResponse<void>> {
    const response = await axiosInstance.post<any, ApiResponse<void>>(
      `${this.basePath}/batch-delete`,
      { ids: skillIds }
    )
    return response
  }
}

// 导出单例
export default new LlmSkillService()
