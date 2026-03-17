import { AxiosResponse } from "axios";
import { authAxios } from "@/api/commons";
import type { LocalVideo, StreamStatus } from "@/types/center.d";

/**
 * 本地视频 API 类
 */
class LocalVideoAPI {
  /**
   * 获取本地视频列表
   */
  getVideoList(
    params: {
      skip?: number;
      limit?: number;
      name?: string;
      is_streaming?: boolean;
    } = {},
  ): Promise<AxiosResponse<LocalVideo[]>> {
    const apiParams = {
      skip: 0,
      limit: 1000,
      ...params,
    };

    return authAxios.get("/api/v1/videos/local/list", { params: apiParams });
  }

  /**
   * 上传本地视频
   */
  uploadVideo(formData: FormData): Promise<AxiosResponse<LocalVideo>> {
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    return authAxios.post("/api/v1/videos/local/upload", formData, config);
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
  ): Promise<AxiosResponse<LocalVideo>> {
    return authAxios.put(`/api/v1/videos/local/${videoId}`, updateData);
  }

  /**
   * 删除本地视频
   */
  deleteVideo(videoId: number): Promise<AxiosResponse> {
    return authAxios.delete(`/api/v1/videos/local/${videoId}`);
  }

  /**
   * 获取推流状态
   */
  getStreamStatus(videoId: number): Promise<AxiosResponse<StreamStatus>> {
    return authAxios.get(`/api/v1/videos/local/${videoId}/stream-status`);
  }

  /**
   * 启动推流
   */
  startStream(videoId: number, streamFps?: number): Promise<AxiosResponse<StreamStatus>> {
    const data = streamFps !== undefined ? { stream_fps: streamFps } : {};
    return authAxios.post(`/api/v1/videos/local/${videoId}/stream/start`, data);
  }

  /**
   * 停止推流
   */
  stopStream(videoId: number): Promise<AxiosResponse> {
    return authAxios.post(`/api/v1/videos/local/${videoId}/stream/stop`);
  }
}

// 导出单例实例
export default new LocalVideoAPI();
