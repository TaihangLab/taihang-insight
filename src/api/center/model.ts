import { AxiosResponse } from 'axios'
import { authAxios, type UnifiedResponse } from '@/api/commons'
import type { Model, ModelQueryParams } from '@/types/center'
/**
 * 模型管理 API
 * 提供模型的增删改查、加载卸载等操作
 */

/**
 * 模型管理 API 类
 */
class ModelAPI {
  /**
   * 获取模型列表
   * @param params 查询参数
   * @returns 模型列表响应
   */
  async getModelList(params: ModelQueryParams = {}): Promise<UnifiedResponse<Model[]>> {
    return authAxios.get('/api/v1/api/v1/models/list', { params })
  }

  /**
   * 获取模型详情
   * @param modelId 模型ID
   * @returns 模型详情响应
   */
  async getModelDetail(modelId: number): Promise<Model> {
    return authAxios.get(`/api/v1/models/${modelId}`)
  }

  /**
   * 更新模型信息
   * @param modelId 模型ID
   * @param modelData 模型数据
   * @returns 更新结果响应
   */
  async updateModel(modelId: number, modelData: Partial<Model>): Promise<AxiosResponse> {
    return authAxios.put(`/api/v1/models/${modelId}`, modelData)
  }

  /**
   * 删除模型
   * @param modelId 模型ID
   * @returns 删除结果响应
   */
  async deleteModel(modelId: number): Promise<AxiosResponse> {
    return authAxios.delete(`/api/v1/models/${modelId}`)
  }

  /**
   * 批量删除模型
   * @param ids 模型ID数组
   * @returns 删除结果响应
   */
  async batchDeleteModels(ids: number[]): Promise<any> {
    return authAxios.delete('/api/v1/models/batch-delete', {
      data: { model_ids: ids }
    })
  }

  /**
   * 加载模型
   * @param modelId 模型ID
   * @returns 加载结果响应
   */
  async loadModel(modelId: number): Promise<AxiosResponse> {
    return authAxios.post(`/api/v1/models/${modelId}/load`)
  }

  /**
   * 卸载模型
   * @param modelId 模型ID
   * @returns 卸载结果响应
   */
  async unloadModel(modelId: number): Promise<AxiosResponse> {
    return authAxios.post(`/api/v1/models/${modelId}/unload`)
  }
}

// 导出单例实例
export default new ModelAPI()
