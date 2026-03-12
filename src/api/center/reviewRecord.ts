import { AxiosResponse } from 'axios'
import { authAxios, type UnifiedResponse } from '@/api/commons'
import type { ReviewRecordQueryParams, ReviewRecord, ReviewRecordStatistics } from '@/types/center.d'
/**
 * 复判记录管理 API
 * 提供复判记录的增删改查操作
 */

/**
 * 复判记录管理 API 类
 */
class ReviewRecordAPI {
  /**
   * 获取复判记录列表
   * @param params 查询参数
   */
  async getReviewRecords(params: ReviewRecordQueryParams = {}): Promise<AxiosResponse<UnifiedResponse<ReviewRecord[]>>> {
    return authAxios.get('/api/v1/review-records/', { params })
  }

  /**
   * 根据ID获取复判记录详情
   * @param reviewId 复判记录ID
   */
  async getReviewRecordById(reviewId: number): Promise<AxiosResponse<UnifiedResponse<ReviewRecord>>> {
    if (!reviewId) {
      return Promise.reject(new Error('缺少记录ID'))
    }

    return authAxios.get(`/api/v1/review-records/${reviewId}`)
  }

  /**
   * 根据预警ID获取复判记录列表
   * @param alertId 预警ID
   */
  async getReviewRecordsByAlertId(alertId: number): Promise<AxiosResponse<UnifiedResponse<ReviewRecord[]>>> {
    if (!alertId) {
      return Promise.reject(new Error('缺少预警ID'))
    }

    return authAxios.get(`/api/v1/review-records/alert/${alertId}`)
  }

  /**
   * 创建复判记录
   * @param reviewData 复判记录数据
   */
  async createReviewRecord(reviewData: Partial<ReviewRecord>): Promise<AxiosResponse<UnifiedResponse<ReviewRecord>>> {
    if (!reviewData.alert_id || !reviewData.reviewer_id || !reviewData.review_result) {
      return Promise.reject(new Error('缺少必要参数：预警ID、复判人员ID和复判结果必须提供'))
    }

    return authAxios.post('/api/v1/review-records/', reviewData)
  }

  /**
   * 更新复判记录
   * @param reviewId 复判记录ID
   * @param updateData 更新数据
   */
  async updateReviewRecord(reviewId: number, updateData: Partial<ReviewRecord>): Promise<AxiosResponse<UnifiedResponse<ReviewRecord>>> {
    if (!reviewId) {
      return Promise.reject(new Error('缺少记录ID'))
    }

    return authAxios.put(`/api/v1/review-records/${reviewId}`, updateData)
  }

  /**
   * 删除复判记录
   * @param reviewId 复判记录ID
   */
  async deleteReviewRecord(reviewId: number): Promise<AxiosResponse> {
    if (!reviewId) {
      return Promise.reject(new Error('缺少记录ID'))
    }

    return authAxios.delete(`/api/v1/review-records/${reviewId}`)
  }

  /**
   * 获取复判记录统计信息
   * @param params 查询参数
   */
  async getReviewRecordStatistics(params: ReviewRecordQueryParams = {}): Promise<AxiosResponse<UnifiedResponse<ReviewRecordStatistics>>> {
    return authAxios.get('/api/v1/review-records/statistics', { params })
  }
}

// 导出单例实例
export default new ReviewRecordAPI()
