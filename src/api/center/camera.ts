import type { Camera, CameraQueryParams, AITask, ListWithPagination } from "@/types/center.d";
import { normalizePageParams } from "@/api/utils/pageUtils";
import { apiGet, apiPut } from "@/api/utils/apiHelpers";

/**
 * 摄像头管理 API
 * 提供摄像头的增删改查操作
 */

/**
 * 摄像头管理 API 类
 */
class CameraAPI {
  /**
   * 获取设备摘要统计
   * 获取设备总数、在线数、离线数
   */
  getDevicesSummary(): Promise<{
    total: number;
    online: number;
    offline: number;
  }> {
    return apiGet("/api/v1/devices/cameras/devices/summary");
  }

  /**
   * 获取摄像头列表
   * @param params 查询参数
   */
  getCameraList(params: CameraQueryParams = {}): Promise<ListWithPagination<Camera>> {
    // 复制所有参数并应用分页默认值
    const { page, limit } = normalizePageParams(params);
    const apiParams = {
      ...params,
      page,
      limit: Math.min(limit, 100), // 摄像头列表限制最大值为 100
    };

    return apiGet<ListWithPagination<Camera>>("/api/v1/devices/cameras/ai/list", { params: apiParams });
  }

  /**
   * 获取摄像头详情
   * @param cameraId 摄像头ID
   */
  getCameraDetail(cameraId: number | string): Promise<Camera> {
    if (!cameraId) {
      return Promise.reject(new Error("缺少摄像头ID"));
    }

    return apiGet<Camera>(`/api/v1/devices/cameras/${cameraId}`);
  }

  /**
   * 更新摄像头信息
   * @param cameraId 摄像头ID
   * @param updateData 更新数据
   */
  updateCamera(cameraId: number | string, updateData: Partial<Camera>): Promise<Camera> {
    if (!cameraId) {
      return Promise.reject(new Error("缺少摄像头ID"));
    }

    return apiPut<Camera>(`/api/v1/devices/cameras/${cameraId}`, updateData);
  }

  /**
   * 获取摄像头关联的AI任务
   * @param cameraId 摄像头ID
   */
  getCameraAITasks(cameraId: number | string): Promise<AITask[]> {
    if (!cameraId) {
      return Promise.reject(new Error("缺少摄像头ID"));
    }

    return apiGet<AITask[]>(`/api/v1/devices/cameras/ai-tasks/camera/id/${cameraId}`);
  }

  /**
   * 获取WVP国标设备列表
   */
  getWvpGbDeviceList(): Promise<any> {
    return apiGet("/api/v1/devices/cameras/wvp/gb28181_list");
  }

  /**
   * 获取WVP推流设备列表
   */
  getWvpPushDeviceList(): Promise<any> {
    return apiGet("/api/v1/devices/cameras/wvp/push_list");
  }

  /**
   * 获取WVP代理设备列表
   */
  getWvpProxyDeviceList(): Promise<any> {
    return apiGet("/api/v1/devices/cameras/wvp/proxy_list");
  }

  /**
   * 获取WVP通道列表
   */
  getWvpChannelList(): Promise<any> {
    return apiGet("/api/v1/devices/cameras/wvp/channel/list");
  }
}

// 导出单例实例
export default new CameraAPI();
