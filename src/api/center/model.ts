/**
 * 模型管理 API
 * 提供模型的增删改查、加载卸载等操作
 */

import { AxiosResponse } from 'axios'
import visionAIAxios, { handleSimpleResponse } from './base'
import type { Model, ModelQueryParams } from './base'

/**
 * 模型管理 API 类
 */
class ModelAPI {
  /**
   * 获取模型列表
   * @param params 查询参数
   * @returns 模型列表响应
   */
  async getModelList(params: ModelQueryParams = {}): Promise<AxiosResponse<UnifiedResponse<Model[]>>> {
    // 转换前端参数为后端API所需格式
    const apiParams = { ...params }

    // 处理模型名称搜索参数
    if (params.name) {
      (apiParams as any).query_name = params.name
      delete apiParams.name
    }

    // 处理使用状态筛选参数
    if (params.usage_status) {
      (apiParams as any).query_used = params.usage_status === 'using'
      delete apiParams.usage_status
    }

    try {
      const response = await visionAIAxios.get('/api/v1/api/v1/models/list', { params: apiParams })
      return this.transformModelListResponse(response)
    } catch (error) {
      console.error('获取模型列表失败:', error)
      throw error
    }
  }

  /**
   * 转换模型列表响应数据
   */
  private transformModelListResponse(response: AxiosResponse): AxiosResponse {
    const originalData = response.data

    // 如果已经是期望的格式，直接返回
    if (originalData && originalData.code !== undefined) {
      return response
    }

    // 转换为前端期望的格式
    const transformedData: UnifiedResponse<Model[]> = {
      code: 0,
      msg: 'success',
      data: [],
      total: 0
    }

    // 检查是否包含models数组（模型列表接口）
    if (originalData && originalData.models) {
      transformedData.data = originalData.models.map((model: any) => ({
        id: model.id,
        name: model.name,
        version: model.version,
        description: model.description,
        model_status: model.model_status ? 'loaded' : 'unloaded',
        usage_status: model.usage_status ? 'using' : 'unused',
        created_at: model.created_at,
        updated_at: model.updated_at
      }))
      transformedData.total = originalData.total || transformedData.data.length
    } else {
      transformedData.data = originalData
    }

    response.data = transformedData
    console.log('模型列表响应转换完成:', response.data)

    return response
  }

  /**
   * 获取模型详情
   * @param modelId 模型ID
   * @returns 模型详情响应
   */
  async getModelDetail(modelId: number): Promise<AxiosResponse<UnifiedResponse<Model>>> {
    try {
      const response = await visionAIAxios.get(`/api/v1/models/${modelId}`)
      return this.transformModelDetailResponse(response)
    } catch (error) {
      console.error('获取模型详情失败:', error)
      throw error
    }
  }

  /**
   * 转换模型详情响应数据
   */
  private transformModelDetailResponse(response: AxiosResponse): AxiosResponse {
    const originalData = response.data

    // 如果已经是期望的格式，直接返回
    if (originalData && originalData.code !== undefined) {
      return response
    }

    // 转换为前端期望的格式
    const transformedData: UnifiedResponse<Model> = {
      code: 0,
      msg: 'success',
      data: {} as Model,
      total: 0
    }

    // 检查是否为单个模型详情
    if (originalData && originalData.model) {
      const model = originalData.model
      transformedData.data = {
        id: model.id,
        name: model.name,
        version: model.version,
        description: model.description,
        model_status: model.status ? 'loaded' : 'unloaded',
        usage_status: model.usage_status ? 'using' : 'unused',
        created_at: model.created_at,
        updated_at: model.updated_at,
        config: model.model_metadata,
        server_metadata: model.server_metadata,
        model_config: model.model_config,
        skill_classes: model.skill_classes
      }

      // 如果包含success字段（更新模型接口）
      if (originalData.success !== undefined) {
        transformedData.code = originalData.success ? 0 : -1
        transformedData.msg = originalData.success ? '更新成功' : '更新失败'
      }
    } else {
      transformedData.data = originalData
    }

    response.data = transformedData
    console.log('模型详情响应转换完成:', response.data)

    return response
  }

  /**
   * 更新模型信息
   * @param modelId 模型ID
   * @param modelData 模型数据
   * @returns 更新结果响应
   */
  async updateModel(modelId: number, modelData: Partial<Model>): Promise<AxiosResponse> {
    try {
      return await visionAIAxios.put(`/api/v1/models/${modelId}`, modelData)
        .then(response => handleSimpleResponse(response, '更新模型'))
    } catch (error) {
      console.error('更新模型失败:', error)
      throw error
    }
  }

  /**
   * 删除模型
   * @param modelId 模型ID
   * @returns 删除结果响应
   */
  async deleteModel(modelId: number): Promise<AxiosResponse> {
    try {
      return await visionAIAxios.delete(`/api/v1/models/${modelId}`)
        .then(response => handleSimpleResponse(response, '删除模型'))
    } catch (error) {
      console.error('删除模型失败:', error)
      throw error
    }
  }

  /**
   * 批量删除模型
   * @param ids 模型ID数组
   * @returns 删除结果响应
   */
  async batchDeleteModels(ids: number[]): Promise<AxiosResponse> {
    try {
      const response = await visionAIAxios.delete('/api/v1/models/batch-delete', {
        data: { model_ids: ids }
      })

      const originalData = response.data

      // 如果是批量删除模型的响应（包含detail字段），直接返回不进行转换
      if (originalData && originalData.detail && originalData.success !== undefined) {
        return response
      }

      // 如果已经是期望的格式，直接返回
      if (originalData && originalData.code !== undefined) {
        return response
      }

      // 转换为前端期望的格式
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
      console.log('批量删除模型响应转换完成:', response.data)

      return response
    } catch (error) {
      console.error('批量删除模型失败:', error)
      throw error
    }
  }

  /**
   * 加载模型
   * @param modelId 模型ID
   * @returns 加载结果响应
   */
  async loadModel(modelId: number): Promise<AxiosResponse> {
    try {
      return await visionAIAxios.post(`/api/v1/models/${modelId}/load`)
        .then(response => handleSimpleResponse(response, '加载模型'))
    } catch (error) {
      console.error('加载模型失败:', error)
      throw error
    }
  }

  /**
   * 卸载模型
   * @param modelId 模型ID
   * @returns 卸载结果响应
   */
  async unloadModel(modelId: number): Promise<AxiosResponse> {
    try {
      return await visionAIAxios.post(`/api/v1/models/${modelId}/unload`)
        .then(response => handleSimpleResponse(response, '卸载模型'))
    } catch (error) {
      console.error('卸载模型失败:', error)
      throw error
    }
  }
}

// 导出单例实例
export default new ModelAPI()
