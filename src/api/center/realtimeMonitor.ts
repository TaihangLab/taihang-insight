import { AxiosResponse } from "axios";
import { authAxios, type UnifiedResponse } from "@/api/commons";
import type {
  ChannelQueryParams,
  Channel,
  PlayStreamInfo,
  TreeQueryParams,
  TreeNode,
} from "@/types/center.d";
/**
 * 实时监控管理 API
 * 提供实时监控页面的通道管理和视频播放功能
 */

/**
 * 实时监控管理 API 类
 */
class RealtimeMonitorAPI {
  /**
   * 获取实时监控通道列表
   * @param params 查询参数
   */
  async getChannelList(
    params: ChannelQueryParams = {},
  ): Promise<AxiosResponse<UnifiedResponse<Channel[]>>> {
    return authAxios.get("/api/v1/realtime-monitor/channels", { params });
  }

  /**
   * 获取通道详情
   * @param channelId 通道ID
   */
  async getChannelDetail(channelId: number): Promise<AxiosResponse<UnifiedResponse<Channel>>> {
    if (!channelId) {
      return Promise.reject(new Error("缺少通道ID"));
    }

    return authAxios.get(`/api/v1/realtime-monitor/channels/${channelId}`);
  }

  /**
   * 播放通道视频
   * @param channelId 通道ID
   */
  async playChannel(channelId: number): Promise<AxiosResponse<UnifiedResponse<PlayStreamInfo>>> {
    if (!channelId) {
      return Promise.reject(new Error("缺少通道ID"));
    }

    return authAxios.get(`/api/v1/realtime-monitor/play/${channelId}`);
  }

  /**
   * 停止播放通道视频
   * @param channelId 通道ID
   */
  async stopChannel(channelId: number): Promise<AxiosResponse> {
    if (!channelId) {
      return Promise.reject(new Error("缺少通道ID"));
    }

    return authAxios.get(`/api/v1/realtime-monitor/stop/${channelId}`);
  }

  /**
   * 获取通道树结构
   * @param params 查询参数
   */
  async getChannelTree(
    params: TreeQueryParams = {},
  ): Promise<AxiosResponse<UnifiedResponse<TreeNode[]>>> {
    return authAxios.get("/api/v1/realtime-monitor/channels/tree", { params });
  }

  /**
   * 获取行政区划树
   * @param params 查询参数
   */
  async getRegionTree(
    params: TreeQueryParams = {},
  ): Promise<AxiosResponse<UnifiedResponse<TreeNode[]>>> {
    return authAxios.get("/api/v1/realtime-monitor/region/tree", { params });
  }

  /**
   * 获取业务分组树
   * @param params 查询参数
   */
  async getGroupTree(
    params: TreeQueryParams = {},
  ): Promise<AxiosResponse<UnifiedResponse<TreeNode[]>>> {
    return authAxios.get("/api/v1/realtime-monitor/group/tree", { params });
  }
}

// 导出单例实例
export default new RealtimeMonitorAPI();
