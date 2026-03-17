import { apiGet, apiPost, apiPut, apiDelete } from "@/api/utils/apiHelpers";
import type { Model, ModelQueryParams } from "@/types/center.d";
import { normalizePageParams } from "@/api/utils/pageUtils";

/**
 * 模型管理 API
 * 提供模型的增删改查、加载卸载等操作
 */

/**
 * 模型列表响应
 */
export interface ModelListResponse {
  data: Model[];
  total: number;
  page: number;
  limit: number;
}

/**
 * 模型管理 API 类
 */
class ModelAPI {
  /**
   * 获取模型列表
   * @param params 查询参数
   * @returns 模型列表响应
   */
  getModelList(params: ModelQueryParams = {}): Promise<Model[]> {
    const { page, limit } = normalizePageParams(params);
    const apiParams = { ...params, page, limit };

    return apiGet<Model[]>("/api/v1/ai/models/list", { params: apiParams });
  }

  /**
   * 获取模型详情
   * @param modelId 模型ID
   * @returns 模型详情响应
   */
  getModelDetail(modelId: number): Promise<Model> {
    if (!modelId) {
      return Promise.reject(new Error("缺少模型ID"));
    }

    return apiGet<Model>(`/api/v1/ai/models/${modelId}`);
  }

  /**
   * 更新模型信息
   * @param modelId 模型ID
   * @param modelData 模型数据
   * @returns 更新结果响应
   */
  updateModel(modelId: number, modelData: Partial<Model>): Promise<Model> {
    if (!modelId) {
      return Promise.reject(new Error("缺少模型ID"));
    }

    return apiPut<Model>(`/api/v1/ai/models/${modelId}`, modelData);
  }

  /**
   * 删除模型
   * @param modelId 模型ID
   * @returns 删除结果响应
   */
  deleteModel(modelId: number): Promise<void> {
    if (!modelId) {
      return Promise.reject(new Error("缺少模型ID"));
    }

    return apiDelete<void>(`/api/v1/ai/models/${modelId}`);
  }

  /**
   * 批量删除模型
   * @param ids 模型ID数组
   * @returns 删除结果响应
   */
  batchDeleteModels(ids: number[]): Promise<void> {
    return apiDelete<void>("/api/v1/ai/models/batch-delete", {
      data: { model_ids: ids },
    });
  }

  /**
   * 同步模型从 Triton
   * @returns 同步结果响应
   */
  syncModels(): Promise<{ message: string }> {
    return apiPost<{ message: string }>("/api/v1/ai/models/sync");
  }

  /**
   * 加载模型
   * @param modelId 模型ID
   * @returns 加载结果响应
   */
  loadModel(modelId: number): Promise<{ message: string }> {
    if (!modelId) {
      return Promise.reject(new Error("缺少模型ID"));
    }

    return apiPost<{ message: string }>(`/api/v1/ai/models/${modelId}/load`);
  }

  /**
   * 卸载模型
   * @param modelId 模型ID
   * @returns 卸载结果响应
   */
  unloadModel(modelId: number): Promise<{ message: string }> {
    if (!modelId) {
      return Promise.reject(new Error("缺少模型ID"));
    }

    return apiPost<{ message: string }>(`/api/v1/ai/models/${modelId}/unload`);
  }

  /**
   * 导入模型
   * @param formData 模型文件和元数据
   * @returns 导入结果响应
   */
  importModel(formData: FormData): Promise<Model> {
    return apiPost<Model>("/api/v1/ai/models/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }
}

// 导出单例实例
export default new ModelAPI();
