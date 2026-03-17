/**
 * 本地视频 API
 *
 * 接口说明：
 * - GET /api/v1/videos/local/list - 获取本地视频列表（使用 skip/limit 分页）
 * - POST /api/v1/videos/local/upload - 上传本地视频
 * - PUT /api/v1/videos/local/{id} - 更新本地视频
 * - DELETE /api/v1/videos/local/{id} - 删除本地视频
 * - GET /api/v1/videos/local/{id}/stream-status - 获取推流状态
 * - POST /api/v1/videos/local/{id}/stream/start - 启动推流
 * - POST /api/v1/videos/local/{id}/stream/stop - 停止推流
 */

import { apiGet, apiPost, apiPut, apiDelete } from "@/api/utils/apiHelpers";
import { normalizePageParams } from "@/api/utils/pageUtils";
import type { LocalVideo, PageParams, StreamStatus } from "@/types/center.d";

/**
 * 本地视频查询参数
 */
export interface LocalVideoQueryParams extends PageParams {
  /** 视频名称筛选 */
  name?: string;
  /** 是否正在推流 */
  is_streaming?: boolean;
}

/**
 * 本地视频列表响应（后端使用 skip/limit 分页）
 */
export interface LocalVideoListResponse {
  data: LocalVideo[];
  total: number;
  skip: number;
  limit: number;
}

/**
 * 本地视频 API 类
 */
class LocalVideoAPI {
  /**
   * 获取本地视频列表
   *
   * @param params 查询参数（使用标准的 page/limit，内部自动转换为 skip/limit）
   * @returns 视频列表和分页信息
   */
  getVideoList(params: LocalVideoQueryParams = {}): Promise<LocalVideoListResponse> {
    // 使用 normalizePageParams 处理分页默认值
    const { page, limit } = normalizePageParams(params);

    // 转换：page/limit → skip/limit（后端使用 MongoDB 风格分页）
    const apiParams = {
      skip: (page - 1) * limit,
      limit,
      name: params.name,
      is_streaming: params.is_streaming,
    };

    return apiGet<LocalVideoListResponse>("/api/v1/videos/local/list", { params: apiParams });
  }

  /**
   * 上传本地视频
   */
  uploadVideo(formData: FormData): Promise<LocalVideo> {
    return apiPost<LocalVideo>("/api/v1/videos/local/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  /**
   * 更新本地视频
   */
  updateVideo(
    videoId: number,
    updateData: {
      name?: string;
      description?: string;
      stream_fps?: number;
    },
  ): Promise<LocalVideo> {
    return apiPut<LocalVideo>(`/api/v1/videos/local/${videoId}`, updateData);
  }

  /**
   * 删除本地视频
   */
  deleteVideo(videoId: number): Promise<void> {
    return apiDelete<void>(`/api/v1/videos/local/${videoId}`);
  }

  /**
   * 获取推流状态
   */
  getStreamStatus(videoId: number): Promise<StreamStatus> {
    return apiGet<StreamStatus>(`/api/v1/videos/local/${videoId}/stream-status`);
  }

  /**
   * 启动推流
   */
  startStream(videoId: number, streamFps?: number): Promise<StreamStatus> {
    const data = streamFps !== undefined ? { stream_fps: streamFps } : {};
    return apiPost<StreamStatus>(`/api/v1/videos/local/${videoId}/stream/start`, data);
  }

  /**
   * 停止推流
   */
  stopStream(videoId: number): Promise<void> {
    return apiPost<void>(`/api/v1/videos/local/${videoId}/stream/stop`);
  }
}

// 导出单例实例
export default new LocalVideoAPI();
