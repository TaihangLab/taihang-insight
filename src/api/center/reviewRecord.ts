import { apiGet, apiPost, apiPut, apiDelete } from "@/api/utils/apiHelpers";
import type {
  ReviewRecordQueryParams,
  ReviewRecord,
  ReviewRecordStatistics,
} from "@/types/center.d";
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
  getReviewRecords(params: ReviewRecordQueryParams = {}): Promise<ReviewRecord[]> {
    return apiGet<ReviewRecord[]>("/api/v1/review/records", { params });
  }

  /**
   * 根据ID获取复判记录详情
   * @param reviewId 复判记录ID
   */
  getReviewRecordById(reviewId: number): Promise<ReviewRecord> {
    if (!reviewId) {
      return Promise.reject(new Error("缺少记录ID"));
    }

    return apiGet<ReviewRecord>(`/api/v1/review/records/${reviewId}`);
  }

  /**
   * 根据预警ID获取复判记录列表
   * @param alertId 预警ID
   */
  getReviewRecordsByAlertId(alertId: number): Promise<ReviewRecord[]> {
    if (!alertId) {
      return Promise.reject(new Error("缺少预警ID"));
    }

    return apiGet<ReviewRecord[]>(`/api/v1/review/records/alert/${alertId}`);
  }

  /**
   * 创建复判记录
   * @param reviewData 复判记录数据
   */
  createReviewRecord(reviewData: Partial<ReviewRecord>): Promise<ReviewRecord> {
    if (!reviewData.alert_id || !reviewData.reviewer_id || !reviewData.review_result) {
      return Promise.reject(new Error("缺少必要参数：预警ID、复判人员ID和复判结果必须提供"));
    }

    return apiPost<ReviewRecord>("/api/v1/review/records", reviewData);
  }

  /**
   * 更新复判记录
   * @param reviewId 复判记录ID
   * @param updateData 更新数据
   */
  updateReviewRecord(reviewId: number, updateData: Partial<ReviewRecord>): Promise<ReviewRecord> {
    if (!reviewId) {
      return Promise.reject(new Error("缺少记录ID"));
    }

    return apiPut<ReviewRecord>(`/api/v1/review/records/${reviewId}`, updateData);
  }

  /**
   * 删除复判记录
   * @param reviewId 复判记录ID
   */
  deleteReviewRecord(reviewId: number): Promise<void> {
    if (!reviewId) {
      return Promise.reject(new Error("缺少记录ID"));
    }

    return apiDelete<void>(`/api/v1/review/records/${reviewId}`);
  }

  /**
   * 获取复判记录统计信息
   * @param params 查询参数
   */
  getReviewRecordStatistics(params: ReviewRecordQueryParams = {}): Promise<ReviewRecordStatistics> {
    return apiGet<ReviewRecordStatistics>("/api/v1/review/records/statistics", { params });
  }
}

// 导出单例实例
export default new ReviewRecordAPI();
