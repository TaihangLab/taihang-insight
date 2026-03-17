import { apiGet } from "@/api/utils/apiHelpers";
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
  getChannelList(params: ChannelQueryParams = {}): Promise<Channel[]> {
    return apiGet<Channel[]>("/api/v1/monitor/realtime/channels", { params });
  }

  /**
   * 获取通道详情
   * @param channelId 通道ID
   */
  getChannelDetail(channelId: number): Promise<Channel> {
    if (!channelId) {
      return Promise.reject(new Error("缺少通道ID"));
    }

    return apiGet<Channel>(`/api/v1/monitor/realtime/channels/${channelId}`);
  }

  /**
   * 播放通道视频
   * @param channelId 通道ID
   */
  playChannel(channelId: number): Promise<PlayStreamInfo> {
    if (!channelId) {
      return Promise.reject(new Error("缺少通道ID"));
    }

    return apiGet<PlayStreamInfo>(`/api/v1/monitor/realtime/play/${channelId}`);
  }

  /**
   * 停止播放通道视频
   * @param channelId 通道ID
   */
  stopChannel(channelId: number): Promise<void> {
    if (!channelId) {
      return Promise.reject(new Error("缺少通道ID"));
    }

    return apiGet<void>(`/api/v1/monitor/realtime/stop/${channelId}`);
  }

  /**
   * 获取通道树结构
   * @param params 查询参数
   */
  getChannelTree(params: TreeQueryParams = {}): Promise<TreeNode[]> {
    return apiGet<TreeNode[]>("/api/v1/monitor/realtime/channels/tree", { params });
  }

  /**
   * 获取行政区划树
   * @param params 查询参数
   */
  getRegionTree(params: TreeQueryParams = {}): Promise<TreeNode[]> {
    return apiGet<TreeNode[]>("/api/v1/monitor/realtime/region/tree", { params });
  }

  /**
   * 获取业务分组树
   * @param params 查询参数
   */
  getGroupTree(params: TreeQueryParams = {}): Promise<TreeNode[]> {
    return apiGet<TreeNode[]>("/api/v1/monitor/realtime/group/tree", { params });
  }
}

// 导出单例实例
export default new RealtimeMonitorAPI();
