/**
 * 技能管理 API
 * 提供技能类、AI任务、多模态LLM技能的增删改查操作
 */

import { AxiosResponse } from 'axios'
import visionAIAxios, { handleSimpleResponse } from './base'
import type {
  SkillClass,
  SkillQueryParams,
  AITask,
  LlmSkill,
  LlmTask
} from './base'

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
  async getSkillList(params: SkillQueryParams = {}): Promise<AxiosResponse<UnifiedResponse<SkillClass[]>>> {
    const apiParams = { ...params }

    // 处理技能名称搜索参数
    if (params.name) {
      (apiParams as any).query_name = params.name
      delete apiParams.name
    }

    // 处理技能类型参数
    if (params.type) {
      (apiParams as any).query_type = params.type
      delete apiParams.type
    }

    // 处理状态筛选参数
    if (params.status !== undefined) {
      apiParams.status = params.status === 'published'
      if (typeof params.status === 'boolean') {
        apiParams.status = params.status
      }
    }

    // 处理分页参数
    if (params.page) {
      apiParams.page = params.page
    }

    if (params.limit) {
      apiParams.limit = Math.min(params.limit, 100)
    }

    try {
      const response = await visionAIAxios.get('/api/v1/skill-classes', { params: apiParams })
      return this.transformSkillListResponse(response)
    } catch (error) {
      console.error('获取技能列表失败:', error)
      throw error
    }
  }

  /**
   * 转换技能列表响应数据
   */
  private transformSkillListResponse(response: AxiosResponse): AxiosResponse {
    const originalData = response.data

    if (originalData && originalData.code !== undefined) {
      return response
    }

    const transformedData: UnifiedResponse<SkillClass[]> = {
      code: 0,
      msg: 'success',
      data: [],
      total: 0
    }

    if (originalData && originalData.skill_classes) {
      transformedData.data = originalData.skill_classes
      transformedData.total = originalData.total || transformedData.data.length

      if (originalData.page) transformedData.page = originalData.page
      if (originalData.limit) transformedData.limit = originalData.limit
      if (originalData.pages) transformedData.pages = originalData.pages
    } else {
      transformedData.data = originalData
    }

    response.data = transformedData
    console.log('技能列表响应转换完成:', response.data)

    return response
  }

  /**
   * 热加载技能类
   */
  async reloadSkillClasses(): Promise<AxiosResponse> {
    try {
      return await visionAIAxios.post('/api/v1/skill-classes/reload')
        .then(response => handleSimpleResponse(response, '热加载技能类'))
    } catch (error) {
      console.error('热加载技能类失败:', error)
      throw error
    }
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

    try {
      const response = await visionAIAxios.get('/api/v1/ai-tasks/api/v1/skill-classes', { params: apiParams })
      return this.transformSkillListResponse(response)
    } catch (error) {
      console.error('获取AI任务技能类列表失败:', error)
      throw error
    }
  }

  /**
   * 获取技能详情
   * @param skillClassId 技能类ID
   */
  async getSkillDetail(skillClassId: number): Promise<AxiosResponse> {
    try {
      return await visionAIAxios.get(`/api/v1/skill-classes/${skillClassId}`)
        .then(response => handleSimpleResponse(response, '获取技能详情'))
    } catch (error) {
      console.error('获取技能详情失败:', error)
      throw error
    }
  }

  /**
   * 删除技能
   * @param skillClassId 技能类ID
   */
  async deleteSkill(skillClassId: number): Promise<AxiosResponse> {
    try {
      return await visionAIAxios.delete(`/api/v1/skill-classes/${skillClassId}`)
        .then(response => handleSimpleResponse(response, '删除技能'))
    } catch (error) {
      console.error('删除技能失败:', error)
      throw error
    }
  }

  /**
   * 批量删除技能
   * @param ids 技能类ID数组
   */
  async batchDeleteSkills(ids: number[]): Promise<AxiosResponse> {
    try {
      const response = await visionAIAxios.delete('/api/v1/skill-classes/batch-delete', {
        data: { skill_class_ids: ids }
      })

      const originalData = response.data

      if (originalData && originalData.detail && originalData.success !== undefined) {
        return response
      }

      if (originalData && originalData.code !== undefined) {
        return response
      }

      const transformedData = {
        code: 0,
        msg: 'success',
        data: {},
        total: 0
      }

      if (originalData && originalData.success !== undefined) {
        transformedData.code = originalData.success ? 0 : -1
        transformedData.msg = originalData.message || (originalData.success ? 'success' : 'failed')
        transformedData.data = originalData
      } else {
        transformedData.data = originalData
      }

      response.data = transformedData
      console.log('批量删除技能响应转换完成:', response.data)

      return response
    } catch (error) {
      console.error('批量删除技能失败:', error)
      throw error
    }
  }

  /**
   * 导入技能
   * @param skillData 技能数据
   */
  async importSkill(skillData: Partial<SkillClass>): Promise<AxiosResponse> {
    try {
      return await visionAIAxios.post('/api/v1/skill-classes', skillData)
        .then(response => handleSimpleResponse(response, '导入技能'))
    } catch (error) {
      console.error('导入技能失败:', error)
      throw error
    }
  }

  /**
   * 更新技能
   * @param skillClassId 技能类ID
   * @param skillData 技能数据
   */
  async updateSkill(skillClassId: number, skillData: Partial<SkillClass>): Promise<AxiosResponse> {
    try {
      return await visionAIAxios.put(`/api/v1/skill-classes/${skillClassId}`, skillData)
        .then(response => handleSimpleResponse(response, '更新技能'))
    } catch (error) {
      console.error('更新技能失败:', error)
      throw error
    }
  }

  /**
   * 上传技能图片
   * @param skillClassId 技能类ID
   * @param imageFile 图片文件
   */
  async uploadSkillImage(skillClassId: number, imageFile: File): Promise<AxiosResponse> {
    if (!imageFile || !skillClassId) {
      console.error('上传图片失败: 缺少必要参数', { skillClassId, imageFile: !!imageFile })
      return Promise.reject(new Error('缺少必要参数'))
    }

    console.log('准备上传图片到服务器:', skillClassId, imageFile.name, imageFile.type, imageFile.size)

    const formData = new FormData()
    formData.append('file', imageFile)

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent: any) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        console.log('上传进度:', percentCompleted + '%')
      }
    }

    try {
      return await visionAIAxios.post(`/api/v1/skill-classes/${skillClassId}/image`, formData, config)
        .then(response => {
          console.log('图片上传成功:', response.data)
          return handleSimpleResponse(response, '上传技能图片')
        })
    } catch (error) {
      console.error('图片上传请求失败:', error)
      throw error
    }
  }

  /**
   * 获取技能关联的设备列表
   * @param skillClassId 技能类ID
   */
  async getSkillDevices(skillClassId: number): Promise<AxiosResponse> {
    if (!skillClassId) {
      console.error('获取技能关联设备失败: 缺少技能ID')
      return Promise.reject(new Error('缺少技能ID'))
    }

    try {
      return await visionAIAxios.get(`/api/v1/skill-classes/${skillClassId}/devices`)
        .then(response => handleSimpleResponse(response, '获取技能关联设备'))
    } catch (error) {
      console.error('获取技能关联设备失败:', error)
      throw error
    }
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
      console.error('创建AI任务失败: 缺少必要参数', {
        camera_id: taskData.camera_id,
        skill_class_id: taskData.skill_class_id
      })
      return Promise.reject(new Error('缺少必要参数: 摄像头ID和技能类ID必须提供'))
    }

    const data = {
      ...taskData,
      running_period: taskData.running_period || {
        enabled: true,
        periods: [{ start: '00:00', end: '23:59' }]
      },
      electronic_fence: taskData.electronic_fence || {
        enabled: false,
        points: []
      },
      status: taskData.status !== undefined ? taskData.status : true
    }

    console.log('创建AI任务请求数据:', data)

    try {
      return await visionAIAxios.post('/api/v1/ai-tasks', data)
        .then(response => handleSimpleResponse(response, '创建AI任务'))
    } catch (error) {
      console.error('创建AI任务失败:', error)
      throw error
    }
  }

  /**
   * 获取AI任务详情
   * @param taskId 任务ID
   */
  async getAITaskDetail(taskId: number): Promise<AxiosResponse> {
    if (!taskId) {
      console.error('获取AI任务详情失败: 缺少任务ID')
      return Promise.reject(new Error('缺少任务ID'))
    }

    try {
      return await visionAIAxios.get(`/api/v1/ai-tasks/${taskId}`)
        .then(response => handleSimpleResponse(response, '获取AI任务详情'))
    } catch (error) {
      console.error('获取AI任务详情失败:', error)
      throw error
    }
  }

  /**
   * 获取AI任务技能详情
   * @param skillClassId 技能类ID
   */
  async getAITaskSkillDetail(skillClassId: number): Promise<AxiosResponse> {
    try {
      return await visionAIAxios.get(`/api/v1/ai-tasks/api/v1/skill-classes/${skillClassId}`)
        .then(response => handleSimpleResponse(response, '获取AI任务技能详情'))
    } catch (error) {
      console.error('获取AI任务技能详情失败:', error)
      throw error
    }
  }

  /**
   * 更新AI任务
   * @param taskId 任务ID
   * @param taskData 任务数据
   */
  async updateAITask(taskId: number, taskData: Partial<AITask>): Promise<AxiosResponse> {
    if (!taskId) {
      console.error('更新AI任务失败: 缺少任务ID')
      return Promise.reject(new Error('缺少任务ID'))
    }

    console.log('更新AI任务请求数据:', taskData)

    try {
      return await visionAIAxios.put(`/api/v1/ai-tasks/${taskId}`, taskData)
        .then(response => handleSimpleResponse(response, '更新AI任务'))
    } catch (error) {
      console.error('更新AI任务失败:', error)
      throw error
    }
  }

  /**
   * 删除AI任务
   * @param taskId 任务ID
   */
  async deleteAITask(taskId: number): Promise<AxiosResponse> {
    if (!taskId) {
      console.error('删除AI任务失败: 缺少任务ID')
      return Promise.reject(new Error('缺少任务ID'))
    }

    console.log('删除AI任务:', taskId)

    try {
      return await visionAIAxios.delete(`/api/v1/ai-tasks/${taskId}`)
        .then(response => handleSimpleResponse(response, '删除AI任务'))
    } catch (error) {
      console.error('删除AI任务失败:', error)
      throw error
    }
  }

  // ============================================
  // 多模态LLM技能管理
  // ============================================

  /**
   * 获取多模态LLM技能列表
   * @param params 查询参数
   */
  async getLlmSkillList(params: SkillQueryParams = {}): Promise<AxiosResponse<UnifiedResponse<LlmSkill[]>>> {
    const apiParams = { ...params }

    if (!apiParams.page) {
      apiParams.page = 1
    }

    if (!apiParams.limit) {
      apiParams.limit = 10
    } else {
      apiParams.limit = Math.min(params.limit || 10, 100)
    }

    console.log('获取多模态技能列表API调用参数:', apiParams)

    try {
      const response = await visionAIAxios.get('/api/v1/llm-skills/api/v1/skill-classes', { params: apiParams })
      console.log('获取多模态技能列表成功:', response.data)
      return response
    } catch (error) {
      console.error('获取多模态技能列表失败:', error)
      throw error
    }
  }

  /**
   * 获取多模态LLM技能详情
   * @param skillId 技能业务ID
   */
  async getLlmSkillDetail(skillId: string): Promise<AxiosResponse<UnifiedResponse<LlmSkill>>> {
    if (!skillId) {
      console.error('获取技能详情失败: 缺少技能ID')
      return Promise.reject(new Error('缺少技能ID'))
    }

    console.log('获取多模态技能详情, skill_id:', skillId)

    try {
      const response = await visionAIAxios.get(`/api/v1/llm-skills/api/v1/skill-classes/${skillId}`)
      console.log('获取多模态技能详情成功:', response.data)
      return response
    } catch (error) {
      console.error('获取多模态技能详情失败:', error)
      throw error
    }
  }

  /**
   * 创建多模态大模型技能
   * @param skillData 技能数据
   */
  async createLlmSkill(skillData: LlmSkill): Promise<AxiosResponse> {
    if (!skillData.skill_name || !skillData.skill_id) {
      console.error('创建多模态技能失败: 缺少必要参数', {
        skill_name: skillData.skill_name,
        skill_id: skillData.skill_id
      })
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

    console.log('创建多模态大模型技能请求数据:', data)

    try {
      return await visionAIAxios.post('/api/v1/llm-skills/api/v1/skill-classes', data)
    } catch (error) {
      console.error('创建多模态技能失败:', error)
      throw error
    }
  }

  /**
   * 更新多模态技能
   * @param skillId 技能业务ID
   * @param skillData 技能数据
   */
  async updateLlmSkill(skillId: string, skillData: Partial<LlmSkill>): Promise<AxiosResponse> {
    if (!skillId) {
      console.error('更新多模态技能失败: 缺少技能ID')
      return Promise.reject(new Error('缺少技能ID'))
    }

    console.log('更新多模态技能, skill_id:', skillId, '数据:', skillData)

    try {
      const response = await visionAIAxios.put(`/api/v1/llm-skills/api/v1/skill-classes/${skillId}`, skillData)
      console.log('更新多模态技能成功:', response.data)
      return response
    } catch (error) {
      console.error('更新多模态技能失败:', error)
      throw error
    }
  }

  /**
   * 发布多模态技能
   * @param skillId 技能业务ID
   */
  async publishLlmSkill(skillId: string): Promise<AxiosResponse> {
    if (!skillId) {
      console.error('发布多模态技能失败: 缺少技能ID')
      return Promise.reject(new Error('缺少技能ID'))
    }

    console.log('发布多模态技能, skill_id:', skillId)

    try {
      const response = await visionAIAxios.post(`/api/v1/llm-skills/api/v1/skill-classes/${skillId}/publish`)
      console.log('发布多模态技能成功:', response.data)
      return response
    } catch (error) {
      console.error('发布多模态技能失败:', error)
      throw error
    }
  }

  /**
   * 下架多模态技能
   * @param skillId 技能业务ID
   */
  async unpublishLlmSkill(skillId: string): Promise<AxiosResponse> {
    if (!skillId) {
      console.error('下架多模态技能失败: 缺少技能ID')
      return Promise.reject(new Error('缺少技能ID'))
    }

    console.log('下架多模态技能, skill_id:', skillId)

    try {
      const response = await visionAIAxios.post(`/api/v1/llm-skills/api/v1/skill-classes/${skillId}/unpublish`)
      console.log('下架多模态技能成功:', response.data)
      return response
    } catch (error) {
      console.error('下架多模态技能失败:', error)
      throw error
    }
  }

  /**
   * 删除单个多模态技能
   * @param skillId 技能业务ID
   */
  async deleteLlmSkill(skillId: string): Promise<AxiosResponse> {
    if (!skillId) {
      console.error('删除多模态技能失败: 缺少技能ID')
      return Promise.reject(new Error('缺少技能ID'))
    }

    console.log('删除多模态技能, skill_id:', skillId)

    try {
      const response = await visionAIAxios.delete(`/api/v1/llm-skills/api/v1/skill-classes/${skillId}`)
      console.log('删除多模态技能成功:', response.data)
      return response
    } catch (error) {
      console.error('删除多模态技能失败:', error)
      throw error
    }
  }

  /**
   * 批量删除多模态技能
   * @param skillIds 技能业务ID数组
   */
  async batchDeleteLlmSkills(skillIds: string[]): Promise<AxiosResponse> {
    if (!skillIds || !Array.isArray(skillIds) || skillIds.length === 0) {
      console.error('批量删除多模态技能失败: 缺少技能ID数组')
      return Promise.reject(new Error('缺少技能ID数组'))
    }

    console.log('批量删除多模态技能, skill_ids:', skillIds)

    try {
      const response = await visionAIAxios.post('/api/v1/llm-skills/api/v1/skill-classes/batch-delete', skillIds)
      console.log('批量删除多模态技能成功:', response.data)
      return response
    } catch (error) {
      console.error('批量删除多模态技能失败:', error)
      let errorMessage = '批量删除复判技能失败'
      if (error.response && error.response.data) {
        if (error.response.data.detail) {
          errorMessage = error.response.data.detail
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message
        }
      } else if ((error as Error).message) {
        errorMessage = (error as Error).message
      }
      throw new Error(errorMessage)
    }
  }

  /**
   * 上传技能图标
   * @param iconFile 图标文件
   * @param skillId 技能ID（用于文件命名）
   */
  async uploadLlmSkillIcon(iconFile: File, skillId?: string | null): Promise<AxiosResponse> {
    if (!iconFile) {
      console.error('上传技能图标失败: 缺少图标文件')
      return Promise.reject(new Error('缺少图标文件'))
    }

    console.log('准备上传技能图标:', iconFile.name, iconFile.type, iconFile.size)

    const formData = new FormData()
    formData.append('icon', iconFile)
    if (skillId) {
      formData.append('skill_id', skillId)
    }

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent: any) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        console.log('上传进度:', percentCompleted + '%')
      }
    }

    try {
      const response = await visionAIAxios.post('/api/v1/llm-skills/upload/skill-icon', formData, config)
      console.log('技能图标上传成功:', response.data)
      return response
    } catch (error) {
      console.error('技能图标上传失败:', error)
      throw error
    }
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
    outputParameters?: any[] | null
  ): Promise<AxiosResponse> {
    if (!testImage || !promptTemplate) {
      console.error('预览测试技能失败: 缺少必要参数')
      return Promise.reject(new Error('缺少测试图片或提示词模板'))
    }

    console.log('准备预览测试技能:', testImage.name, promptTemplate)

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

    try {
      const response = await visionAIAxios.post('/api/v1/llm-skills/api/v1/skill-classes/preview-test', formData, config)
      console.log('技能预览测试成功:', response.data)
      return response
    } catch (error) {
      console.error('技能预览测试失败:', error)
      throw error
    }
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
      console.error('创建大模型任务失败: 缺少必要参数', {
        name: taskData.name,
        skill_id: taskData.skill_id
      })
      return Promise.reject(new Error('缺少必要参数: 任务名称和技能ID必须提供'))
    }

    const data = {
      name: taskData.name,
      description: taskData.description || '',
      skill_id: taskData.skill_id,
      camera_id: taskData.camera_id || null,
      frame_rate: taskData.frame_rate || 30,
      status: taskData.status !== undefined ? taskData.status : true,
      alert_level: taskData.alert_level !== undefined ? taskData.alert_level : 0,
      running_period: taskData.running_period || null
    }

    console.log('创建大模型任务请求数据:', data)

    try {
      const response = await visionAIAxios.post('/api/v1/llm-skills/tasks', data)
      console.log('创建大模型任务成功:', response.data)
      return response
    } catch (error) {
      console.error('创建大模型任务失败:', error)
      throw error
    }
  }

  /**
   * 删除多模态大模型任务
   * @param taskId 任务ID
   */
  async deleteLlmTask(taskId: number): Promise<AxiosResponse> {
    if (!taskId) {
      console.error('删除大模型任务失败: 缺少任务ID')
      return Promise.reject(new Error('缺少任务ID'))
    }

    console.log('删除大模型任务:', taskId)

    try {
      const response = await visionAIAxios.delete(`/api/v1/llm-skills/tasks/${taskId}`)
      console.log('删除大模型任务成功:', response.data)
      return response
    } catch (error) {
      console.error('删除大模型任务失败:', error)
      throw error
    }
  }

  /**
   * 获取多模态大模型任务列表
   * @param params 查询参数
   */
  async getLlmTaskList(params: SkillQueryParams = {}): Promise<AxiosResponse<UnifiedResponse<LlmTask[]>>> {
    const apiParams = { ...params }

    if (!apiParams.page) {
      apiParams.page = 1
    }
    if (!apiParams.limit) {
      apiParams.limit = 100
    }

    console.log('获取大模型任务列表API调用参数:', apiParams)

    try {
      const response = await visionAIAxios.get('/api/v1/llm-skills/tasks', { params: apiParams })
      console.log('获取大模型任务列表成功:', response.data)
      return response
    } catch (error) {
      console.error('获取大模型任务列表失败:', error)
      throw error
    }
  }

  /**
   * 更新多模态大模型任务
   * @param taskId 任务ID
   * @param taskData 任务数据
   */
  async updateLlmTask(taskId: number, taskData: Partial<LlmTask>): Promise<AxiosResponse> {
    if (!taskId) {
      console.error('更新大模型任务失败: 缺少任务ID')
      return Promise.reject(new Error('缺少任务ID'))
    }

    const data: any = {}
    if (taskData.name !== undefined) data.name = taskData.name
    if (taskData.description !== undefined) data.description = taskData.description
    if (taskData.camera_id !== undefined) data.camera_id = taskData.camera_id
    if (taskData.frame_rate !== undefined) data.frame_rate = taskData.frame_rate
    if (taskData.status !== undefined) data.status = taskData.status
    if (taskData.alert_level !== undefined) data.alert_level = taskData.alert_level
    if (taskData.running_period !== undefined) data.running_period = taskData.running_period

    console.log('更新大模型任务请求数据:', { taskId, data })

    try {
      const response = await visionAIAxios.put(`/api/v1/llm-skills/tasks/${taskId}`, data)
      console.log('更新大模型任务成功:', response.data)
      return response
    } catch (error) {
      console.error('更新大模型任务失败:', error)
      throw error
    }
  }
}

// 导出单例实例
export default new SkillAPI()
