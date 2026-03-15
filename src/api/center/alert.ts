import type { AxiosResponse } from "axios";
import { authAxios, type UnifiedResponse } from "@/api/commons";
import type {
  Alert,
  AlertQueryParams,
  AlertStatusUpdate,
  ListWithPagination,
  SSEMessageCallback,
  SSEErrorCallback,
  SSECloseCallback,
} from "@/types/center.d";
import { useTokenStore } from "@/stores/modules/token";
import { normalizePageParams } from "@/api/utils/pageUtils";
import { apiGet } from "@/api/utils/apiHelpers";
/**
 * 预警管理 API
 * 提供预警的查询、更新、删除以及SSE实时推送功能
 */

/**
 * 预警管理 API 类
 */
class AlertAPI {
  /**
   * 获取实时预警列表
   * @param params 查询参数
   * @returns 包含数据和分页信息的响应
   *
   * 注意：分页和不分页使用相同的 apiGet 方法
   * 后端返回结构应该是一致的，分页信息是响应对象的一个字段
   */
  getRealTimeAlerts(params: AlertQueryParams = {}): Promise<ListWithPagination<Alert>> {
    const { page, limit } = normalizePageParams(params);
    const apiParams = { ...params, page, limit };

    return apiGet<ListWithPagination<Alert>>("/api/v1/alerts/real-time", { params: apiParams });
  }

  /**
   * 更新预警状态
   * @param alertId 预警ID
   * @param updateData 更新数据
   */
  async updateAlertStatus(alertId: number, updateData: AlertStatusUpdate): Promise<AxiosResponse> {
    if (!alertId) {
      return Promise.reject(new Error("缺少预警ID"));
    }

    return authAxios.put(`/api/v1/alerts/${alertId}/status`, updateData);
  }

  /**
   * 批量更新预警状态
   * @param alertIds 预警ID数组
   * @param updateData 更新数据
   */
  async batchUpdateAlertStatus(
    alertIds: number[],
    updateData: AlertStatusUpdate,
  ): Promise<AxiosResponse> {
    if (!alertIds || alertIds.length === 0) {
      return Promise.reject(new Error("缺少预警ID"));
    }

    return authAxios.put("/api/v1/alerts/batch-update", {
      alert_ids: alertIds,
      ...updateData,
    });
  }

  /**
   * 删除预警
   * @param alertId 预警ID
   */
  async deleteAlert(alertId: number): Promise<AxiosResponse> {
    if (!alertId) {
      return Promise.reject(new Error("缺少预警ID"));
    }

    return authAxios.delete(`/api/v1/alerts/${alertId}`);
  }

  /**
   * 批量删除预警
   * @param alertIds 预警ID数组
   */
  async batchDeleteAlerts(alertIds: number[]): Promise<AxiosResponse> {
    if (!alertIds || alertIds.length === 0) {
      return Promise.reject(new Error("缺少预警ID"));
    }

    return authAxios.post("/api/v1/alerts/batch-delete", {
      alert_ids: alertIds,
    });
  }

  /**
   * 根据ID获取单个预警详情
   * @param alertId 预警ID
   */
  async getAlertDetail(alertId: number | string): Promise<AxiosResponse<UnifiedResponse<Alert>>> {
    if (!alertId) {
      return Promise.reject(new Error("缺少预警ID"));
    }

    return authAxios.get(`/api/v1/alerts/${alertId}`);
  }

  /**
   * 创建SSE连接，监听实时预警推送
   * @param onMessage 接收到消息时的回调函数
   * @param onError 发生错误时的回调函数
   * @param onClose 连接关闭时的回调函数
   * @returns SSE连接对象
   */
  createAlertSSEConnection(
    onMessage?: SSEMessageCallback,
    onError?: SSEErrorCallback,
    onClose?: SSECloseCallback,
  ): EventSource {
    // 获取认证token
    const tokenStore = useTokenStore();
    const token = tokenStore.getAdminToken();

    // 将token作为URL参数传递（EventSource不支持自定义请求头）
    const sseUrl = `${authAxios.defaults.baseURL}/api/v1/alerts/stream?token=${encodeURIComponent(token)}`;

    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = function () {
      // SSE连接已建立
    };

    eventSource.onmessage = function (event) {
      if (!event.data || event.data.trim() === "") {
        return;
      }

      try {
        let jsonData = event.data;

        if (jsonData.startsWith("data: ")) {
          jsonData = jsonData.substring(6);
        }

        const data = JSON.parse(jsonData);
        if (onMessage) {
          onMessage(data);
        }
      } catch {
        if (onMessage) {
          onMessage({ raw: event.data });
        }
      }
    };

    eventSource.onerror = function (event) {
      if (onError) {
        onError(event as Event);
      }
    };

    // 添加关闭方法
    const originalClose = eventSource.close.bind(eventSource);
    eventSource.close = function () {
      originalClose();
      if (onClose) {
        onClose();
      }
    };

    return eventSource;
  }

  /**
   * 获取SSE连接状态
   */
  async getSSEStatus(): Promise<AxiosResponse> {
    return authAxios.get("/api/v1/alerts/sse/status");
  }

  /**
   * 获取当前连接的SSE客户端信息
   */
  async getConnectedClients(): Promise<AxiosResponse> {
    return authAxios.get("/api/v1/alerts/connected");
  }

  /**
   * 发送测试预警（仅供调试使用）
   */
  async sendTestAlert(): Promise<AxiosResponse> {
    return authAxios.post("/api/v1/alerts/test");
  }

  /**
   * 获取预警统计信息
   * @param days 统计天数
   */
  async getAlertStatistics(days = 7): Promise<AxiosResponse> {
    return authAxios.get("/api/v1/alerts/statistics", {
      params: { days },
    });
  }

  /**
   * 标记预警为误报
   * @param alertId 预警ID
   * @param reviewNotes 复判意见
   * @param reviewerName 复判人员姓名
   */
  async markAlertAsFalseAlarm(
    alertId: number,
    reviewNotes: string,
    reviewerName: string,
  ): Promise<AxiosResponse> {
    if (!alertId || !reviewNotes || !reviewerName) {
      return Promise.reject(new Error("缺少必要参数：预警ID、复判意见和复判人员姓名必须提供"));
    }

    return authAxios.post(`/api/v1/alerts/${alertId}/false-alarm`, null, {
      params: {
        review_notes: reviewNotes,
        reviewer_name: reviewerName,
      },
    });
  }

  /**
   * 批量标记预警为误报
   * @param alertIds 预警ID数组
   * @param reviewNotes 复判意见
   * @param reviewerName 复判人员姓名
   */
  async batchMarkAlertsAsFalseAlarm(
    alertIds: number[],
    reviewNotes: string,
    reviewerName: string,
  ): Promise<AxiosResponse> {
    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      return Promise.reject(new Error("缺少预警ID数组"));
    }

    if (!reviewNotes || !reviewerName) {
      return Promise.reject(new Error("缺少复判意见或复判人员姓名"));
    }

    return authAxios.post(
      "/api/v1/alerts/batch-false-alarm",
      {
        alert_ids: alertIds,
      },
      {
        params: {
          review_notes: reviewNotes,
          reviewer_name: reviewerName,
        },
      },
    );
  }

  /**
   * 导出预警数据
   * @param params 导出参数
   */
  async exportAlerts(params: Record<string, unknown> = {}): Promise<AxiosResponse> {
    const exportParams = { ...params };

    if (!exportParams.format) {
      exportParams.format = "csv";
    }

    if (exportParams.warningSkill) {
      exportParams.alert_type = exportParams.warningSkill;
      delete exportParams.warningSkill;
    }

    const alertIds = exportParams.alert_ids as unknown[] | undefined;
    if (!alertIds || alertIds.length === 0) {
      delete exportParams.alert_ids;
    }

    return authAxios.get("/api/v1/alerts/export", {
      params: exportParams,
      responseType: "blob",
      timeout: 60000,
    });
  }
}

// 导出单例实例
export default new AlertAPI();
