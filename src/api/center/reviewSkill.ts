import { AxiosResponse } from 'axios'
import { authAxios, handleSimpleResponse,  type UnifiedResponse, PageParams } from '@/api/commons'
import type { ReviewSkill, CreateReviewSkillRequest, UpdateReviewSkillRequest, PreviewTestResponse } from './types'
/**
 * 复判技能管理 API
 * 提供多模态复判技能的增删改查操作
 */

/**
 * 复判技能查询参数
 */
export interface ReviewSkillQueryParams extends PageParams {
  status?: boolean | string
  name?: string
  tag?: string
  searchKeyword?: string
  selectedCategory?: string
  selectedProvider?: string
}

/**
 * 复判技能管理 API 类
 */
class ReviewSkillAPI {
  /**
   * 创建多模态复判技能
   * @param skillData 技能数据
   */
  async createReviewSkill(skillData: CreateReviewSkillRequest): Promise<AxiosResponse<UnifiedResponse<ReviewSkill>>> {
    if (!skillData.skill_name || !skillData.description || !skillData.prompt_template) {
      console.error('创建复判技能失败: 缺少必要参数')
      return Promise.reject(new Error('缺少必要参数：技能名称、描述和提示词模板'))
    }

    console.log('创建多模态复判技能:', skillData)

    try {
      const response = await authAxios.post('/api/v1/llm-skill-review/review-skills', skillData)
      console.log('创建复判技能成功:', response.data)
      return response
    } catch (error) {
      console.error('创建复判技能失败:', error)
      let errorMessage = '创建复判技能失败'
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as any
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      throw new Error(errorMessage)
    }
  }

  /**
   * 预览测试复判技能
   * @param testImage 测试图片文件
   * @param userPrompt 用户提示词
   */
  async previewTestReviewSkill(testImage: File, userPrompt: string): Promise<AxiosResponse<PreviewTestResponse>> {
    if (!testImage || !userPrompt) {
      console.error('预览测试复判技能失败: 缺少测试图片或用户提示词')
      return Promise.reject(new Error('缺少测试图片或用户提示词'))
    }

    const formData = new FormData()
    formData.append('test_image', testImage)
    formData.append('user_prompt', userPrompt)

    console.log('预览测试复判技能:', { fileName: testImage.name, userPrompt })

    try {
      const response = await authAxios.post('/api/v1/llm-skill-review/review-skills/preview-test', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000
      })
      console.log('预览测试成功:', response.data)
      return response
    } catch (error) {
      console.error('预览测试失败:', error)
      let errorMessage = '预览测试失败'
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as any
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      throw new Error(errorMessage)
    }
  }

  /**
   * 更新复判技能
   * @param skillId 技能ID
   * @param updateData 更新数据
   */
  async updateReviewSkill(skillId: string, updateData: UpdateReviewSkillRequest): Promise<AxiosResponse<UnifiedResponse<ReviewSkill>>> {
    if (!skillId) {
      console.error('更新复判技能失败: 缺少技能ID')
      return Promise.reject(new Error('缺少技能ID'))
    }

    console.log('更新复判技能:', skillId, updateData)

    try {
      const response = await authAxios.put(`/api/v1/llm-skill-review/review-skills/${skillId}`, updateData)
      console.log('更新复判技能成功:', response.data)
      return response
    } catch (error) {
      console.error('更新复判技能失败:', error)
      let errorMessage = '更新复判技能失败'
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as any
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      throw new Error(errorMessage)
    }
  }

  /**
   * 获取复判技能列表
   * @param params 查询参数
   */
  async getReviewSkillList(params: ReviewSkillQueryParams = {}): Promise<AxiosResponse<UnifiedResponse<ReviewSkill[]>>> {
    const apiParams = { ...params }

    if (!apiParams.page) {
      apiParams.page = 1
    }

    if (!apiParams.limit) {
      apiParams.limit = 10
    } else {
      apiParams.limit = Math.min(params.limit || 10, 100)
    }

    // 处理状态过滤参数
    if (apiParams.status !== undefined) {
      if (typeof apiParams.status === 'string') {
        if (apiParams.status === 'online') {
          apiParams.status = true
        } else if (apiParams.status === 'offline') {
          apiParams.status = false
        } else {
          delete apiParams.status
        }
      }
    }

    // 处理名称搜索参数
    if (apiParams.name && typeof apiParams.name === 'string') {
      apiParams.name = apiParams.name.trim()
      if (!apiParams.name) {
        delete apiParams.name
      }
    }

    // 处理标签过滤参数
    if (apiParams.tag && typeof apiParams.tag === 'string') {
      apiParams.tag = apiParams.tag.trim()
      if (!apiParams.tag) {
        delete apiParams.tag
      }
    }

    // 处理前端传递的其他参数名映射
    if (apiParams.searchKeyword) {
      apiParams.name = apiParams.searchKeyword
      delete apiParams.searchKeyword
    }

    if (apiParams.selectedCategory) {
      apiParams.tag = apiParams.selectedCategory
      delete apiParams.selectedCategory
    }

    if (apiParams.selectedProvider) {
      if (apiParams.selectedProvider === 'online') {
        apiParams.status = true
      } else if (apiParams.selectedProvider === 'offline') {
        apiParams.status = false
      }
      delete apiParams.selectedProvider
    }

    console.log('获取复判技能列表, 处理后的参数:', apiParams)

    try {
      const response = await authAxios.get('/api/v1/llm-skill-review/review-skills', { params: apiParams })
      console.log('获取复判技能列表成功:', response.data)
      return response
    } catch (error) {
      console.error('获取复判技能列表失败:', error)
      let errorMessage = '获取复判技能列表失败'
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as any
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      throw new Error(errorMessage)
    }
  }

  /**
   * 获取复判技能详情
   * @param skillId 技能ID
   */
  async getReviewSkillDetail(skillId: string): Promise<AxiosResponse<UnifiedResponse<ReviewSkill>>> {
    if (!skillId) {
      console.error('获取复判技能详情失败: 缺少技能ID')
      return Promise.reject(new Error('缺少技能ID'))
    }

    console.log('获取复判技能详情:', skillId)

    try {
      const response = await authAxios.get(`/api/v1/llm-skill-review/review-skills/${skillId}`)
      console.log('获取复判技能详情成功:', response.data)
      return response
    } catch (error) {
      console.error('获取复判技能详情失败:', error)
      let errorMessage = '获取复判技能详情失败'
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as any
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      throw new Error(errorMessage)
    }
  }

  /**
   * 发布复判技能（上线）
   * @param skillId 技能ID
   */
  async publishReviewSkill(skillId: string): Promise<AxiosResponse> {
    if (!skillId) {
      console.error('发布复判技能失败: 缺少技能ID')
      return Promise.reject(new Error('缺少技能ID'))
    }

    console.log('发布复判技能:', skillId)

    try {
      const response = await authAxios.post(`/api/v1/llm-skill-review/review-skills/${skillId}/publish`)
      console.log('发布复判技能成功:', response.data)
      return response
    } catch (error) {
      console.error('发布复判技能失败:', error)
      let errorMessage = '发布复判技能失败'
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as any
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      throw new Error(errorMessage)
    }
  }

  /**
   * 下线复判技能
   * @param skillId 技能ID
   */
  async unpublishReviewSkill(skillId: string): Promise<AxiosResponse> {
    if (!skillId) {
      console.error('下线复判技能失败: 缺少技能ID')
      return Promise.reject(new Error('缺少技能ID'))
    }

    console.log('下线复判技能:', skillId)

    try {
      const response = await authAxios.post(`/api/v1/llm-skill-review/review-skills/${skillId}/unpublish`)
      console.log('下线复判技能成功:', response.data)
      return response
    } catch (error) {
      console.error('下线复判技能失败:', error)
      let errorMessage = '下线复判技能失败'
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as any
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      throw new Error(errorMessage)
    }
  }

  /**
   * 删除复判技能
   * @param skillId 技能ID
   */
  async deleteReviewSkill(skillId: string): Promise<AxiosResponse> {
    if (!skillId) {
      console.error('删除复判技能失败: 缺少技能ID')
      return Promise.reject(new Error('缺少技能ID'))
    }

    console.log('删除复判技能:', skillId)

    try {
      const response = await authAxios.delete(`/api/v1/llm-skill-review/review-skills/${skillId}`)
      console.log('删除复判技能成功:', response.data)
      return response
    } catch (error) {
      console.error('删除复判技能失败:', error)
      let errorMessage = '删除复判技能失败'
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as any
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      throw new Error(errorMessage)
    }
  }

  /**
   * 批量删除复判技能
   * @param skillIds 技能ID数组
   */
  async batchDeleteReviewSkills(skillIds: string[]): Promise<AxiosResponse> {
    if (!skillIds || !Array.isArray(skillIds) || skillIds.length === 0) {
      console.error('批量删除复判技能失败: 缺少技能ID数组')
      return Promise.reject(new Error('缺少技能ID数组'))
    }

    if (skillIds.length > 50) {
      console.error('批量删除复判技能失败: 一次最多删除50个技能')
      return Promise.reject(new Error('一次最多删除50个技能'))
    }

    console.log('批量删除复判技能, skill_ids:', skillIds)

    try {
      const response = await authAxios.post('/api/v1/llm-skill-review/review-skills/batch-delete', skillIds)
      console.log('批量删除复判技能成功:', response.data)
      return response
    } catch (error) {
      console.error('批量删除复判技能失败:', error)
      let errorMessage = '批量删除复判技能失败'
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as any
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      throw new Error(errorMessage)
    }
  }
}

// 导出单例实例
export default new ReviewSkillAPI()
