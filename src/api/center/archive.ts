import { apiGet, apiPost, apiPut, apiDelete } from "@/api/utils/apiHelpers";
import type {
  AlertArchive,
  ArchiveQueryParams,
  CreateArchiveRequest,
  Alert,
  AlertRecordQueryParams,
  AlertRecord,
  ListWithPagination,
} from "@/types/center.d";
import { normalizePageParams } from "@/api/utils/pageUtils";

/**
 * 档案管理 API
 * 提供预警档案和预警记录的管理功能
 */

/**
 * 档案管理 API 类
 */
class ArchiveAPI {
  /**
   * 获取预警档案列表
   * @param params 查询参数
   */
  async getArchiveList(
    params: ArchiveQueryParams = {},
  ): Promise<ListWithPagination<AlertArchive>> {
    const { page, limit } = normalizePageParams(params);
    const apiParams = { ...params, page, limit };

    return apiGet<ListWithPagination<AlertArchive>>("/api/v1/alert-archives", {
      params: apiParams,
    });
  }

  /**
   * 获取预警档案详情
   * @param archiveId 档案ID
   */
  async getArchiveDetail(archiveId: number): Promise<AlertArchive> {
    if (!archiveId) {
      return Promise.reject(new Error("缺少档案ID"));
    }

    return apiGet<AlertArchive>(`/api/v1/alert-archives/${archiveId}`);
  }

  /**
   * 创建预警档案
   * @param archiveData 档案数据
   */
  async createArchive(archiveData: CreateArchiveRequest): Promise<AlertArchive> {
    if (
      !archiveData.name ||
      !archiveData.location ||
      !archiveData.start_time ||
      !archiveData.end_time
    ) {
      return Promise.reject(new Error("缺少必要参数：档案名称、位置、开始时间和结束时间必须提供"));
    }

    return apiPost<AlertArchive>("/api/v1/alert-archives", archiveData);
  }

  /**
   * 更新预警档案
   * @param archiveId 档案ID
   * @param archiveData 档案数据
   */
  async updateArchive(archiveId: number, archiveData: Partial<AlertArchive>): Promise<AlertArchive> {
    if (!archiveId) {
      return Promise.reject(new Error("缺少档案ID"));
    }

    return apiPut<AlertArchive>(`/api/v1/alert-archives/${archiveId}`, archiveData);
  }

  /**
   * 删除预警档案
   * @param archiveId 档案ID
   */
  async deleteArchive(archiveId: number): Promise<void> {
    if (!archiveId) {
      return Promise.reject(new Error("缺少档案ID"));
    }

    return apiDelete<void>(`/api/v1/alert-archives/${archiveId}`);
  }

  /**
   * 批量删除预警档案
   * @param archiveIds 档案ID数组
   */
  async batchDeleteArchives(archiveIds: number[]): Promise<void> {
    if (!archiveIds || !Array.isArray(archiveIds) || archiveIds.length === 0) {
      return Promise.reject(new Error("缺少档案ID数组"));
    }

    return apiDelete<void>("/api/v1/alert-archives/batch", {
      data: { archive_ids: archiveIds },
    });
  }

  /**
   * 获取档案下的预警记录列表
   * @param archiveId 档案ID
   * @param params 查询参数
   */
  async getArchiveAlerts(
    archiveId: number,
    params: AlertRecordQueryParams = {},
  ): Promise<ListWithPagination<Alert>> {
    if (!archiveId) {
      return Promise.reject(new Error("缺少档案ID"));
    }

    const { page, limit } = normalizePageParams(params);
    const apiParams = { ...params, page, limit };

    return apiGet<ListWithPagination<Alert>>(`/api/v1/alert-archives/${archiveId}/alerts`, {
      params: apiParams,
    });
  }

  /**
   * 添加预警记录到档案
   * @param recordData 预警记录数据
   */
  async addAlertRecord(recordData: Partial<AlertRecord>): Promise<AlertRecord> {
    if (
      !recordData.archive_id ||
      !recordData.name ||
      !recordData.device_name ||
      !recordData.alert_time ||
      !recordData.alert_level
    ) {
      return Promise.reject(
        new Error("缺少必要参数：档案ID、预警名称、设备名称、预警时间和预警等级必须提供"),
      );
    }

    return apiPost<AlertRecord>("/api/v1/alert-archives/alerts", recordData);
  }

  /**
   * 获取预警记录详情
   * @param recordId 记录ID
   */
  async getAlertRecordDetail(recordId: number): Promise<AlertRecord> {
    if (!recordId) {
      return Promise.reject(new Error("缺少记录ID"));
    }

    return apiGet<AlertRecord>(`/api/v1/alert-archives/alerts/${recordId}`);
  }

  /**
   * 更新预警记录
   * @param recordId 记录ID
   * @param recordData 记录数据
   */
  async updateAlertRecord(recordId: number, recordData: Partial<AlertRecord>): Promise<AlertRecord> {
    if (!recordId) {
      return Promise.reject(new Error("缺少记录ID"));
    }

    return apiPut<AlertRecord>(`/api/v1/alert-archives/alerts/${recordId}`, recordData);
  }

  /**
   * 删除预警记录
   * @param recordId 记录ID
   * @param archiveId 档案ID（可选）
   */
  async deleteAlertRecord(recordId: number, archiveId?: number | null): Promise<void> {
    if (!recordId) {
      return Promise.reject(new Error("缺少记录ID"));
    }

    let url = `/api/v1/alert-archives/alerts/${recordId}`;
    if (archiveId) {
      url += `?archive_id=${archiveId}`;
    }

    return apiDelete<void>(url);
  }

  /**
   * 批量删除预警记录
   * @param recordIds 记录ID数组
   */
  async batchDeleteAlertRecords(recordIds: number[]): Promise<void> {
    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return Promise.reject(new Error("缺少记录ID数组"));
    }

    return apiPost<void>("/api/v1/alert-archives/alerts/batch-delete", {
      record_ids: recordIds,
    });
  }

  /**
   * 上传档案图片
   * @param archiveId 档案ID
   * @param imageFile 图片文件
   */
  async uploadArchiveImage(archiveId: number, imageFile: File): Promise<void> {
    if (!archiveId || !imageFile) {
      return Promise.reject(new Error("缺少档案ID或图片文件"));
    }

    const formData = new FormData();
    formData.append("image", imageFile);

    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    // 上传接口使用完整的 axios 调用，因为需要特殊配置
    return apiPost<void>(`/api/v1/alert-archives/${archiveId}/upload/image`, formData, config);
  }

  /**
   * 上传预警记录图片
   * @param recordId 记录ID
   * @param imageFile 图片文件
   */
  async uploadRecordImage(recordId: number, imageFile: File): Promise<void> {
    if (!recordId || !imageFile) {
      return Promise.reject(new Error("缺少记录ID或图片文件"));
    }

    const formData = new FormData();
    formData.append("image", imageFile);

    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    return apiPost<void>(
      `/api/v1/alert-archives/alerts/${recordId}/upload/image`,
      formData,
      config,
    );
  }

  /**
   * 上传预警记录视频
   * @param recordId 记录ID
   * @param videoFile 视频文件
   */
  async uploadRecordVideo(recordId: number, videoFile: File): Promise<void> {
    if (!recordId || !videoFile) {
      return Promise.reject(new Error("缺少记录ID或视频文件"));
    }

    const formData = new FormData();
    formData.append("video", videoFile);

    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    return apiPost<void>(
      `/api/v1/alert-archives/alerts/${recordId}/upload/video`,
      formData,
      config,
    );
  }

  /**
   * 获取档案关联的预警列表
   * @param archiveId 档案ID
   * @param params 查询参数
   */
  async getArchiveLinkedAlerts(
    archiveId: number,
    params: AlertRecordQueryParams = {},
  ): Promise<ListWithPagination<Alert>> {
    if (!archiveId) {
      return Promise.reject(new Error("缺少档案ID"));
    }

    const { page, limit } = normalizePageParams(params);
    const apiParams = { ...params, page, limit };

    return apiGet<ListWithPagination<Alert>>(
      `/api/v1/alert-archives/linked-alerts/${archiveId}`,
      {
        params: apiParams,
      },
    );
  }

  /**
   * 从档案中移除预警关联
   * @param archiveId 档案ID
   * @param alertId 预警ID
   */
  async unlinkAlertFromArchive(archiveId: number, alertId: number): Promise<void> {
    if (!archiveId || !alertId) {
      return Promise.reject(new Error("缺少档案ID或预警ID"));
    }

    return apiDelete<void>(`/api/v1/alert-archives/unlink-alert/${archiveId}/${alertId}`);
  }

  /**
   * 获取可用的预警列表（用于添加到档案）
   * @param params 查询参数
   */
  async getAvailableAlerts(
    params: AlertRecordQueryParams = {},
  ): Promise<ListWithPagination<Alert>> {
    const { page, limit } = normalizePageParams(params);
    const apiParams = { ...params, page, limit, exclude_archived: true };

    return apiGet<ListWithPagination<Alert>>("/api/v1/alert-archives/available-alerts", {
      params: apiParams,
    });
  }

  /**
   * 将预警关联到档案
   * @param archiveId 档案ID
   * @param alertIds 预警ID列表
   * @param linkReason 关联原因（可选）
   */
  async linkAlertsToArchive(
    archiveId: number,
    alertIds: number[],
    linkReason?: string,
  ): Promise<void> {
    if (!archiveId || !alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      return Promise.reject(new Error("缺少档案ID或预警ID列表"));
    }

    const requestData = {
      alert_ids: alertIds,
      link_reason: linkReason || "批量关联预警到档案",
    };

    return apiPost<void>(`/api/v1/alert-archives/link-alerts/${archiveId}`, requestData);
  }
}

// 导出单例实例
export default new ArchiveAPI();
