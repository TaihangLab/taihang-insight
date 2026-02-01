import { AxiosResponse } from 'axios'
import visionAIAxios, { type UnifiedResponse } from './base'
/**
 * 复判记录管理 API
 * 提供复判记录的增删改查操作
 */

/**
 * 复判记录查询参数
 */
export interface ReviewRecordQueryParams {
  page?: number
  limit?: number
  alert_id?: number
  reviewer_id?: number
  start_time?: string
  end_time?: string
}

/**
 * 复判记录数据
 */
export interface ReviewRecord {
  id: number
  alert_id: number
  reviewer_id: number
  reviewer_name: string
  review_result: string
  review_notes?: string
  confidence?: number
  created_at?: string
  updated_at?: string
}

/**
 * 复判记录统计
 */
export interface ReviewRecordStatistics {
  total_reviews: number
  correct_reviews: number
  false_alarm_reviews: number
  accuracy_rate: number
}

/**
 * 复判记录管理 API 类
 */
class ReviewRecordAPI {
  /**
   * 获取复判记录列表
   * @param params 查询参数
   */
  async getReviewRecords(params: ReviewRecordQueryParams = {}): Promise<AxiosResponse<UnifiedResponse<ReviewRecord[]>>> {
    console.log('获取复判记录列表:', params)

    try {
      const response = await visionAIAxios.get('/api/v1/review-records/', { params })
      console.log('获取复判记录列表成功:', response.data)
      return response
    } catch (error) {
      console.error('获取复判记录列表失败:', error)
      throw error
    }
  }

  /**
   * 根据ID获取复判记录详情
   * @param reviewId 复判记录ID
   */
  async getReviewRecordById(reviewId: number): Promise<AxiosResponse<UnifiedResponse<ReviewRecord>>> {
    if (!reviewId) {
      console.error('获取复判记录详情失败: 缺少记录ID')
      return Promise.reject(new Error('缺少记录ID'))
    }

    console.log('获取复判记录详情:', reviewId)

    try {
      const response = await visionAIAxios.get(`/api/v1/review-records/${reviewId}`)
      console.log('获取复判记录详情成功:', response.data)
      return response
    } catch (error) {
      console.error('获取复判记录详情失败:', error)
      throw error
    }
  }

  /**
   * 根据预警ID获取复判记录列表
   * @param alertId 预警ID
   */
  async getReviewRecordsByAlertId(alertId: number): Promise<AxiosResponse<UnifiedResponse<ReviewRecord[]>>> {
    if (!alertId) {
      console.error('获取预警复判记录失败: 缺少预警ID')
      return Promise.reject(new Error('缺少预警ID'))
    }

    console.log('获取预警复判记录列表:', alertId)

    try {
      const response = await visionAIAxios.get(`/api/v1/review-records/alert/${alertId}`)
      console.log('获取预警复判记录列表成功:', response.data)
      return response
    } catch (error) {
      console.error('获取预警复判记录列表失败:', error)
      throw error
    }
  }

  /**
   * 创建复判记录
   * @param reviewData 复判记录数据
   */
  async createReviewRecord(reviewData: Partial<ReviewRecord>): Promise<AxiosResponse<UnifiedResponse<ReviewRecord>>> {
    if (!reviewData.alert_id || !reviewData.reviewer_id || !reviewData.review_result) {
      console.error('创建复判记录失败: 缺少必要参数')
      return Promise.reject(new Error('缺少必要参数：预警ID、复判人员ID和复判结果必须提供'))
    }

    console.log('创建复判记录:', reviewData)

    try {
      const response = await visionAIAxios.post('/api/v1/review-records/', reviewData)
      console.log('创建复判记录成功:', response.data)
      return response
    } catch (error) {
      console.error('创建复判记录失败:', error)
      throw error
    }
  }

  /**
   * 更新复判记录
   * @param reviewId 复判记录ID
   * @param updateData 更新数据
   */
  async updateReviewRecord(reviewId: number, updateData: Partial<ReviewRecord>): Promise<AxiosResponse<UnifiedResponse<ReviewRecord>>> {
    if (!reviewId) {
      console.error('更新复判记录失败: 缺少记录ID')
      return Promise.reject(new Error('缺少记录ID'))
    }

    console.log('更新复判记录:', reviewId, updateData)

    try {
      const response = await visionAIAxios.put(`/api/v1/review-records/${reviewId}`, updateData)
      console.log('更新复判记录成功:', response.data)
      return response
    } catch (error) {
      console.error('更新复判记录失败:', error)
      throw error
    }
  }

  /**
   * 删除复判记录
   * @param reviewId 复判记录ID
   */
  async deleteReviewRecord(reviewId: number): Promise<AxiosResponse> {
    if (!reviewId) {
      console.error('删除复判记录失败: 缺少记录ID')
      return Promise.reject(new Error('缺少记录ID'))
    }

    console.log('删除复判记录:', reviewId)

    try {
      const response = await visionAIAxios.delete(`/api/v1/review-records/${reviewId}`)
      console.log('删除复判记录成功:', response.data)
      return response
    } catch (error) {
      console.error('删除复判记录失败:', error)
      throw error
    }
  }

  /**
   * 获取复判记录统计信息
   * @param params 查询参数
   */
  async getReviewRecordStatistics(params: ReviewRecordQueryParams = {}): Promise<AxiosResponse<UnifiedResponse<ReviewRecordStatistics>>> {
    console.log('获取复判记录统计信息:', params)

    try {
      const response = await visionAIAxios.get('/api/v1/review-records/statistics', { params })
      console.log('获取复判记录统计信息成功:', response.data)
      return response
    } catch (error) {
      console.error('获取复判记录统计信息失败:', error)
      throw error
    }
  }
}

// 导出单例实例
export default new ReviewRecordAPI()
