/**
 * 行政区划和业务分组通道服务类 - 封装通道相关的所有API请求
 */
import {
  getCivilCodeChannelList as apiGetCivilCodeChannelList,
  getParentChannelList as apiGetParentChannelList,
  addChannelToRegion as apiAddChannelToRegion,
  deleteChannelFromRegion as apiDeleteChannelFromRegion,
  addChannelToGroup as apiAddChannelToGroup,
  deleteChannelFromGroup as apiDeleteChannelFromGroup
} from '@/api/channel'
import { getRegionPath } from '@/api/region'
import { getGroupPath } from '@/api/group'
import { getDeviceList as apiGetDeviceList } from '@/api/device'

class RegionChannelService {
  /**
   * 获取行政区划通道列表
   * @param {Object} params - 查询参数
   * @param {Function} callback - 成功回调
   * @param {Function} errorCallback - 错误回调
   */
  getCivilCodeChannelList(params, callback, errorCallback) {
    apiGetCivilCodeChannelList(params)
      .then((res) => {
        if (typeof callback === 'function') {
          callback(res.data);
        }
      })
      .catch((error) => {
        console.error('获取行政区划通道列表错误:', error);
        if (typeof errorCallback === 'function') {
          errorCallback(error);
        }
      });
  }

  /**
   * 获取业务分组通道列表
   * @param {Object} params - 查询参数
   * @param {Function} callback - 成功回调
   * @param {Function} errorCallback - 错误回调
   */
  getParentChannelList(params, callback, errorCallback) {
    apiGetParentChannelList(params)
      .then((res) => {
        if (typeof callback === 'function') {
          callback(res.data);
        }
      })
      .catch((error) => {
        console.error('获取业务分组通道列表错误:', error);
        if (typeof errorCallback === 'function') {
          errorCallback(error);
        }
      });
  }

  /**
   * 添加通道到行政区划
   * @param {Object} data - 数据
   * @param {Function} callback - 成功回调
   * @param {Function} errorCallback - 错误回调
   */
  addChannelToRegion(data, callback, errorCallback) {
    apiAddChannelToRegion(data)
      .then((res) => {
        if (typeof callback === 'function') {
          callback(res.data);
        }
      })
      .catch((error) => {
        console.error('添加通道到行政区划错误:', error);
        if (typeof errorCallback === 'function') {
          errorCallback(error);
        }
      });
  }

  /**
   * 从行政区划删除通道
   * @param {Object} data - 数据
   * @param {Function} callback - 成功回调
   * @param {Function} errorCallback - 错误回调
   */
  deleteChannelFromRegion(data, callback, errorCallback) {
    apiDeleteChannelFromRegion(data)
      .then((res) => {
        if (typeof callback === 'function') {
          callback(res.data);
        }
      })
      .catch((error) => {
        console.error('从行政区划删除通道错误:', error);
        if (typeof errorCallback === 'function') {
          errorCallback(error);
        }
      });
  }

  /**
   * 添加通道到业务分组
   * @param {Object} data - 数据
   * @param {Function} callback - 成功回调
   * @param {Function} errorCallback - 错误回调
   */
  addChannelToGroup(data, callback, errorCallback) {
    apiAddChannelToGroup(data)
      .then((res) => {
        if (typeof callback === 'function') {
          callback(res.data);
        }
      })
      .catch((error) => {
        console.error('添加通道到业务分组错误:', error);
        if (typeof errorCallback === 'function') {
          errorCallback(error);
        }
      });
  }

  /**
   * 从业务分组删除通道
   * @param {Object} data - 数据
   * @param {Function} callback - 成功回调
   * @param {Function} errorCallback - 错误回调
   */
  deleteChannelFromGroup(data, callback, errorCallback) {
    apiDeleteChannelFromGroup(data)
      .then((res) => {
        if (typeof callback === 'function') {
          callback(res.data);
        }
      })
      .catch((error) => {
        console.error('从业务分组删除通道错误:', error);
        if (typeof errorCallback === 'function') {
          errorCallback(error);
        }
      });
  }

  /**
   * 获取行政区划路径
   * @param {string} deviceId - 设备ID
   * @param {Function} callback - 成功回调
   * @param {Function} errorCallback - 错误回调
   */
  getRegionPath(deviceId, callback, errorCallback) {
    getRegionPath(deviceId)
      .then((res) => {
        if (typeof callback === 'function') {
          callback(res.data);
        }
      })
      .catch((error) => {
        console.error('获取行政区划路径错误:', error);
        if (typeof errorCallback === 'function') {
          errorCallback(error);
        }
      });
  }

  /**
   * 获取业务分组路径
   * @param {string} deviceId - 设备ID
   * @param {string} businessGroup - 业务分组
   * @param {Function} callback - 成功回调
   * @param {Function} errorCallback - 错误回调
   */
  getGroupPath(deviceId, businessGroup, callback, errorCallback) {
    getGroupPath(deviceId, businessGroup)
      .then((res) => {
        if (typeof callback === 'function') {
          callback(res.data);
        }
      })
      .catch((error) => {
        console.error('获取业务分组路径错误:', error);
        if (typeof errorCallback === 'function') {
          errorCallback(error);
        }
      });
  }

  /**
   * 获取设备列表
   * @param {Object} params - 查询参数
   * @param {Function} callback - 成功回调
   * @param {Function} errorCallback - 错误回调
   */
  getDeviceList(params, callback, errorCallback) {
    apiGetDeviceList(params)
      .then((res) => {
        if (typeof callback === 'function') {
          callback(res.data);
        }
      })
      .catch((error) => {
        console.error('获取设备列表错误:', error);
        if (typeof errorCallback === 'function') {
          errorCallback(error);
        }
      });
  }
}

export default new RegionChannelService();


