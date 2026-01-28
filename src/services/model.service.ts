/**
 * 模型管理服务
 */

import axiosInstance from './config/axios'
import type { ApiResponse, PaginatedResponse, Model, ModelListParams } from './types'

export class ModelService {
  private readonly basePath = '/api/v1/models'

  /**
   * 获取模型列表
   */
  async getModelList(params?: ModelListParams): Promise<PaginatedResponse<Model>> {
    const response = await axiosInstance.get<any, PaginatedResponse<Model>>(this.basePath, { params })
    return response
  }

  /**
   * 获取模型详情
   */
  async getModelDetail(modelId: string): Promise<ApiResponse<Model>> {
    const response = await axiosInstance.get<any, ApiResponse<Model>>(`${this.basePath}/${modelId}`)
    return response
  }

  /**
   * 更新模型
   */
  async updateModel(modelId: string, modelData: Partial<Model>): Promise<ApiResponse<Model>> {
    const response = await axiosInstance.put<any, ApiResponse<Model>>(
      `${this.basePath}/${modelId}`,
      modelData
    )
    return response
  }

  /**
   * 删除模型
   */
  async deleteModel(modelId: string): Promise<ApiResponse<void>> {
    const response = await axiosInstance.delete<any, ApiResponse<void>>(`${this.basePath}/${modelId}`)
    return response
  }

  /**
   * 批量删除模型
   */
  async batchDeleteModels(ids: string[]): Promise<ApiResponse<void>> {
    const response = await axiosInstance.post<any, ApiResponse<void>>(
      `${this.basePath}/batch-delete`,
      { ids }
    )
    return response
  }

  /**
   * 加载模型到 Triton
   */
  async loadModel(modelId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await axiosInstance.post<any, ApiResponse<{ message: string }>>(
      `${this.basePath}/${modelId}/load`
    )
    return response
  }

  /**
   * 从 Triton 卸载模型
   */
  async unloadModel(modelId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await axiosInstance.post<any, ApiResponse<{ message: string }>>(
      `${this.basePath}/${modelId}/unload`
    )
    return response
  }
}

// 导出单例
export default new ModelService()
