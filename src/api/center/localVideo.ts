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
  async getVideoList(
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

    return authAxios.get("/api/v1/local-videos/list", { params: apiParams });
  }

  /**
   * 上传本地视频
   */
  async uploadVideo(formData: FormData): Promise<AxiosResponse<LocalVideo>> {
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    return authAxios.post("/api/v1/local-videos/upload", formData, config);
  }

  /**
   * 更新本地视频
   */
  async updateVideo(
    videoId: number,
    updateData: {
      name?: string;
      description?: string;
      stream_fps?: number;
    },
  ): Promise<AxiosResponse<LocalVideo>> {
    return authAxios.put(`/api/v1/local-videos/${videoId}`, updateData);
  }

  /**
   * 删除本地视频
   */
  async deleteVideo(videoId: number): Promise<AxiosResponse> {
    return authAxios.delete(`/api/v1/local-videos/${videoId}`);
  }

  /**
   * 获取推流状态
   */
  async getStreamStatus(videoId: number): Promise<AxiosResponse<StreamStatus>> {
    return authAxios.get(`/api/v1/local-videos/${videoId}/stream-status`);
  }

  /**
   * 启动推流
   */
  async startStream(videoId: number, streamFps?: number): Promise<AxiosResponse<StreamStatus>> {
    const data = streamFps !== undefined ? { stream_fps: streamFps } : {};
    return authAxios.post(`/api/v1/local-videos/${videoId}/stream/start`, data);
  }

  /**
   * 停止推流
   */
  async stopStream(videoId: number): Promise<AxiosResponse> {
    return authAxios.post(`/api/v1/local-videos/${videoId}/stream/stop`);
  }
}

// 导出单例实例
export default new LocalVideoAPI();
