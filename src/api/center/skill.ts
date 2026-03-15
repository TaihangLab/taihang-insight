import { AxiosResponse } from 'axios'
import  { authAxios, type UnifiedResponse } from '@/api/commons'
import type { SkillClass, SkillQueryParams, AITask, LlmSkill, LlmTask } from '@/types/center.d'
import { normalizePageParams } from '@/api/utils/pageUtils'
/**
 * 技能管理 API
 * 提供技能类、AI任务、多模态LLM技能的增删改查操作
 */

/**
 * 技能管理 API 类
 */
class SkillAPI {
  // ============================================
  // 技能类管理
  // ============================================

  /**
   * 获取技能列表
   * @param params 查询参数
   * @returns 技能列表响应
   */
  async getSkillList(params: SkillQueryParams = {}): Promise<UnifiedResponse<SkillClass[]>> {
    const { page, limit } = normalizePageParams(params)
    const apiParams = { ...params, page, limit }

    return authAxios.get('/api/v1/skill-classes', { params: apiParams })
  }

  /**
   * 热加载技能类
   */
  async reloadSkillClasses(): Promise<AxiosResponse> {
    return authAxios.post('/api/v1/skill-classes/reload')
  }

  /**
   * 获取AI任务技能类列表
   * @param params 查询参数
   */
  async getAITaskSkillClasses(params: SkillQueryParams = {}): Promise<AxiosResponse<UnifiedResponse<SkillClass[]>>> {
    const apiParams = { ...params }

    if (params.page) {
      apiParams.page = params.page
    }

    if (params.limit) {
      apiParams.limit = Math.min(params.limit, 100)
    }

    if (params.query) {
      apiParams.query = params.query
    }

    if (params.status !== undefined) {
      apiParams.status = params.status
    } else {
      apiParams.status = true
    }

    return authAxios.get('/api/v1/ai-tasks/api/v1/skill-classes', { params: apiParams })
  }

  /**
   * 获取技能详情
   * @param skillClassId 技能类ID
   */
  async getSkillDetail(skillClassId: number): Promise<AxiosResponse> {
    return authAxios.get(`/api/v1/skill-classes/${skillClassId}`)
  }

  /**
   * 删除技能
   * @param skillClassId 技能类ID
   */
  async deleteSkill(skillClassId: number): Promise<AxiosResponse> {
    return authAxios.delete(`/api/v1/skill-classes/${skillClassId}`)
  }

  /**
   * 批量删除技能
   * @param ids 技能类ID数组
   */
  async batchDeleteSkills(ids: number[]): Promise<any> {
    return authAxios.delete('/api/v1/skill-classes/batch-delete', {
      data: { skill_class_ids: ids }
    })
  }

  /**
   * 导入技能
   * @param skillData 技能数据
   */
  async importSkill(skillData: Partial<SkillClass>): Promise<AxiosResponse> {
    return authAxios.post('/api/v1/skill-classes', skillData)
  }

  /**
   * 更新技能
   * @param skillClassId 技能类ID
   * @param skillData 技能数据
   */
  async updateSkill(skillClassId: number, skillData: Partial<SkillClass>): Promise<AxiosResponse> {
    return authAxios.put(`/api/v1/skill-classes/${skillClassId}`, skillData)
  }

  /**
   * 上传技能图片
   * @param skillClassId 技能类ID
   * @param imageFile 图片文件
   */
  async uploadSkillImage(skillClassId: number, imageFile: File): Promise<AxiosResponse> {
    if (!imageFile || !skillClassId) {
      return Promise.reject(new Error('缺少必要参数'))
    }

    const formData = new FormData()
    formData.append('file', imageFile)

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent: { loaded: number; total?: number }) => {
        // 上传进度回调（可用于UI进度显示）
        void Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
        // 这里可以触发进度事件
      }
    }

    return authAxios.post(`/api/v1/skill-classes/${skillClassId}/image`, formData, config)
  }

  /**
   * 获取技能关联的设备列表
   * @param skillClassId 技能类ID
   */
  async getSkillDevices(skillClassId: number): Promise<AxiosResponse> {
    if (!skillClassId) {
      return Promise.reject(new Error('缺少技能ID'))
    }

    return authAxios.get(`/api/v1/skill-classes/${skillClassId}/devices`)
  }

  // ============================================
  // AI任务管理
  // ============================================

  /**
   * 创建AI任务
   * @param taskData 任务数据
   */
  async createAITask(taskData: Partial<AITask>): Promise<AxiosResponse> {
    if (!taskData.camera_id || !taskData.skill_class_id) {
      return Promise.reject(new Error('缺少必要参数: 摄像头ID和技能类ID必须提供'))
    }

    return authAxios.post('/api/v1/ai-tasks', taskData)
  }

  /**
   * 获取AI任务详情
   * @param taskId 任务ID
   */
  async getAITaskDetail(taskId: number): Promise<AxiosResponse> {
    if (!taskId) {
      return Promise.reject(new Error('缺少任务ID'))
    }

    return authAxios.get(`/api/v1/ai-tasks/${taskId}`)
  }

  /**
   * 获取AI任务技能详情
   * @param skillClassId 技能类ID
   */
  async getAITaskSkillDetail(skillClassId: number): Promise<AxiosResponse> {
    return authAxios.get(`/api/v1/ai-tasks/api/v1/skill-classes/${skillClassId}`)
  }

  /**
   * 更新AI任务
   * @param taskId 任务ID
   * @param taskData 任务数据
   */
  async updateAITask(taskId: number, taskData: Partial<AITask>): Promise<AxiosResponse> {
    if (!taskId) {
      return Promise.reject(new Error('缺少任务ID'))
    }

    return authAxios.put(`/api/v1/ai-tasks/${taskId}`, taskData)
  }

  /**
   * 删除AI任务
   * @param taskId 任务ID
   */
  async deleteAITask(taskId: number): Promise<AxiosResponse> {
    if (!taskId) {
      return Promise.reject(new Error('缺少任务ID'))
    }

    return authAxios.delete(`/api/v1/ai-tasks/${taskId}`)
  }

  // ============================================
  // 多模态LLM技能管理
  // ============================================

  /**
   * 获取多模态LLM技能列表
   * @param params 查询参数
   */
  async getLlmSkillList(params: SkillQueryParams = {}): Promise<AxiosResponse<UnifiedResponse<LlmSkill[]>>> {
    const { page, limit } = normalizePageParams(params)
    const apiParams = { ...params, page, limit }

    return authAxios.get('/api/v1/llm-skills/api/v1/skill-classes', { params: apiParams })
  }

  /**
   * 获取多模态LLM技能详情
   * @param skillId 技能业务ID
   */
  async getLlmSkillDetail(skillId: string): Promise<AxiosResponse<UnifiedResponse<LlmSkill>>> {
    if (!skillId) {
      return Promise.reject(new Error('缺少技能ID'))
    }

    return authAxios.get(`/api/v1/llm-skills/api/v1/skill-classes/${skillId}`)
  }

  /**
   * 创建多模态大模型技能
   * @param skillData 技能数据
   */
  async createLlmSkill(skillData: LlmSkill): Promise<AxiosResponse> {
    if (!skillData.skill_name || !skillData.skill_id) {
      return Promise.reject(new Error('缺少必要参数: 技能名称和技能ID必须提供'))
    }

    const data = {
      skill_name: skillData.skill_name,
      skill_id: skillData.skill_id,
      application_scenario: skillData.application_scenario || 'video_analysis',
      skill_tags: skillData.skill_tags || [],
      skill_icon: skillData.skill_icon || null,
      skill_description: skillData.skill_description || '',
      prompt_template: skillData.prompt_template || '',
      output_parameters: skillData.output_parameters || [],
      alert_conditions: skillData.alert_conditions || null
    }

    return authAxios.post('/api/v1/llm-skills/api/v1/skill-classes', data)
  }

  /**
   * 更新多模态技能
   * @param skillId 技能业务ID
   * @param skillData 技能数据
   */
  async updateLlmSkill(skillId: string, skillData: Partial<LlmSkill>): Promise<AxiosResponse> {
    if (!skillId) {
      return Promise.reject(new Error('缺少技能ID'))
    }

    return authAxios.put(`/api/v1/llm-skills/api/v1/skill-classes/${skillId}`, skillData)
  }

  /**
   * 发布多模态技能
   * @param skillId 技能业务ID
   */
  async publishLlmSkill(skillId: string): Promise<AxiosResponse> {
    if (!skillId) {
      return Promise.reject(new Error('缺少技能ID'))
    }

    return authAxios.post(`/api/v1/llm-skills/api/v1/skill-classes/${skillId}/publish`)
  }

  /**
   * 下架多模态技能
   * @param skillId 技能业务ID
   */
  async unpublishLlmSkill(skillId: string): Promise<AxiosResponse> {
    if (!skillId) {
      return Promise.reject(new Error('缺少技能ID'))
    }

    return authAxios.post(`/api/v1/llm-skills/api/v1/skill-classes/${skillId}/unpublish`)
  }

  /**
   * 删除单个多模态技能
   * @param skillId 技能业务ID
   */
  async deleteLlmSkill(skillId: string): Promise<AxiosResponse> {
    if (!skillId) {
      return Promise.reject(new Error('缺少技能ID'))
    }

    return authAxios.delete(`/api/v1/llm-skills/api/v1/skill-classes/${skillId}`)
  }

  /**
   * 批量删除多模态技能
   * @param skillIds 技能业务ID数组
   */
  async batchDeleteLlmSkills(skillIds: string[]): Promise<AxiosResponse> {
    if (!skillIds || !Array.isArray(skillIds) || skillIds.length === 0) {
      return Promise.reject(new Error('缺少技能ID数组'))
    }

    return authAxios.post('/api/v1/llm-skills/api/v1/skill-classes/batch-delete', skillIds)
  }

  /**
   * 上传技能图标
   * @param iconFile 图标文件
   * @param skillId 技能ID（用于文件命名）
   */
  async uploadLlmSkillIcon(iconFile: File, skillId?: string | null): Promise<AxiosResponse> {
    if (!iconFile) {
      return Promise.reject(new Error('缺少图标文件'))
    }

    const formData = new FormData()
    formData.append('icon', iconFile)
    if (skillId) {
      formData.append('skill_id', skillId)
    }

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent: { loaded: number; total?: number }) => {
        // 上传进度回调（可用于UI进度显示）
        void Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
        // 这里可以触发进度事件
      }
    }

    return authAxios.post('/api/v1/llm-skills/upload/skill-icon', formData, config)
  }

  /**
   * 预览测试多模态技能
   * @param testImage 测试图片
   * @param promptTemplate 提示词模板
   * @param systemPrompt 系统提示词
   * @param outputParameters 输出参数配置
   */
  async previewTestLlmSkill(
    testImage: File,
    promptTemplate: string,
    systemPrompt?: string | null,
    outputParameters?: Record<string, unknown>[] | null
  ): Promise<AxiosResponse> {
    if (!testImage || !promptTemplate) {
      return Promise.reject(new Error('缺少测试图片或提示词模板'))
    }

    const formData = new FormData()
    formData.append('test_image', testImage)
    formData.append('prompt_template', promptTemplate)

    if (systemPrompt) {
      formData.append('system_prompt', systemPrompt)
    }

    if (outputParameters && outputParameters.length > 0) {
      formData.append('output_parameters', JSON.stringify(outputParameters))
    }

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000
    }

    return authAxios.post('/api/v1/llm-skills/api/v1/skill-classes/preview-test', formData, config)
  }

  // ============================================
  // 多模态LLM任务管理
  // ============================================

  /**
   * 创建多模态大模型任务
   * @param taskData 任务数据
   */
  async createLlmTask(taskData: Partial<LlmTask>): Promise<AxiosResponse> {
    if (!taskData.name || !taskData.skill_id) {
      return Promise.reject(new Error('缺少必要参数: 任务名称和技能ID必须提供'))
    }

    return authAxios.post('/api/v1/llm-skills/tasks', taskData)
  }

  /**
   * 删除多模态大模型任务
   * @param taskId 任务ID
   */
  async deleteLlmTask(taskId: number): Promise<AxiosResponse> {
    if (!taskId) {
      return Promise.reject(new Error('缺少任务ID'))
    }

    return authAxios.delete(`/api/v1/llm-skills/tasks/${taskId}`)
  }

  /**
   * 获取多模态大模型任务列表
   * @param params 查询参数
   */
  async getLlmTaskList(params: SkillQueryParams = {}): Promise<AxiosResponse<UnifiedResponse<LlmTask[]>>> {
    // LLM 任务列表默认显示更多，使用 100 作为最大值
    const { page, limit } = normalizePageParams(params)
    const apiParams = { ...params, page, limit: Math.min(limit, 100) }

    return authAxios.get('/api/v1/llm-skills/tasks', { params: apiParams })
  }

  /**
   * 更新多模态大模型任务
   * @param taskId 任务ID
   * @param taskData 任务数据
   */
  async updateLlmTask(taskId: number, taskData: Partial<LlmTask>): Promise<AxiosResponse> {
    if (!taskId) {
      return Promise.reject(new Error('缺少任务ID'))
    }

    return authAxios.put(`/api/v1/llm-skills/tasks/${taskId}`, taskData)
  }
}

// 导出单例实例
export default new SkillAPI()
