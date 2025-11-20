import axios from 'axios';

/**
 * 通道服务类 - 封装通道相关的所有API请求
 */
class ChannelService {
  constructor() {
    this.$axios = axios;
  }

  /**
   * 获取通道播放地址
   * @param {string|number} channelId 通道ID
   * @param {Function} callback 回调函数
   */
  getChannelPlayUrl(channelId, callback) {
    if (!channelId) {
      if (typeof callback === 'function') {
        callback({ code: -1, msg: '缺少通道ID' });
      }
      return;
    }

    this.$axios({
      method: 'get',
      url: '/api/common/channel/play',
      params: {
        channelId: channelId
      }
    })
    .then((res) => {
      if (typeof callback === 'function') {
        callback(res.data);
      }
    })
    .catch((error) => {
      console.error('获取通道播放地址错误:', error);
      if (typeof callback === 'function') {
        callback({ code: -1, msg: error.message || '网络错误' });
      }
    });
  }

  /**
   * 停止通道播放
   * @param {string|number} channelId 通道ID
   * @param {Function} callback 回调函数
   */
  stopChannelPlay(channelId, callback) {
    if (!channelId) {
      if (typeof callback === 'function') {
        callback({ code: -1, msg: '缺少通道ID' });
      }
      return;
    }

    this.$axios({
      method: 'get',
      url: '/api/common/channel/stop',
      params: {
        channelId: channelId
      }
    })
    .then((res) => {
      if (typeof callback === 'function') {
        callback(res.data);
      }
    })
    .catch((error) => {
      console.error('停止通道播放错误:', error);
      if (typeof callback === 'function') {
        callback({ code: -1, msg: error.message || '网络错误' });
      }
    });
  }

  /**
   * 获取通道列表
   * @param {Object} params 查询参数
   * @param {Function} callback 回调函数
   */
  getChannelList(params, callback) {
    this.$axios({
      method: 'get',
      url: '/api/common/channel/list',
      params: params
    })
    .then((res) => {
      if (typeof callback === 'function') {
        callback(res.data);
      }
    })
    .catch((error) => {
      console.error('获取通道列表错误:', error);
      if (typeof callback === 'function') {
        callback({ code: -1, msg: error.message || '网络错误' });
      }
    });
  }

  /**
   * 获取通道详情
   * @param {string|number} channelId 通道ID
   * @param {Function} callback 回调函数
   */
  getChannelDetail(channelId, callback) {
    if (!channelId) {
      if (typeof callback === 'function') {
        callback({ code: -1, msg: '缺少通道ID' });
      }
      return;
    }

    this.$axios({
      method: 'get',
      url: `/api/common/channel/one`,
      params: {
        id: channelId
      }
    })
    .then((res) => {
      if (typeof callback === 'function') {
        callback(res.data);
      }
    })
    .catch((error) => {
      console.error('获取通道详情错误:', error);
      if (typeof callback === 'function') {
        callback({ code: -1, msg: error.message || '网络错误' });
      }
    });
  }

  /**
   * 更新通道信息
   * @param {Object} channelData 通道数据
   * @param {Function} callback 回调函数
   */
  updateChannel(channelData, callback) {
    this.$axios({
      method: 'post',
      url: '/api/common/channel/update',
      data: channelData
    })
    .then((res) => {
      if (typeof callback === 'function') {
        callback(res.data);
      }
    })
    .catch((error) => {
      console.error('更新通道信息错误:', error);
      if (typeof callback === 'function') {
        callback({ code: -1, msg: error.message || '网络错误' });
      }
    });
  }

  /**
   * 添加通道
   * @param {Object} channelData 通道数据
   * @param {Function} callback 回调函数
   */
  addChannel(channelData, callback) {
    this.$axios({
      method: 'post',
      url: '/api/common/channel/add',
      data: channelData
    })
    .then((res) => {
      if (typeof callback === 'function') {
        callback(res.data);
      }
    })
    .catch((error) => {
      console.error('添加通道错误:', error);
      if (typeof callback === 'function') {
        callback({ code: -1, msg: error.message || '网络错误' });
      }
    });
  }

  /**
   * 删除通道
   * @param {string|number} channelId 通道ID
   * @param {Function} callback 回调函数
   */
  deleteChannel(channelId, callback) {
    if (!channelId) {
      if (typeof callback === 'function') {
        callback({ code: -1, msg: '缺少通道ID' });
      }
      return;
    }

    this.$axios({
      method: 'delete',
      url: '/api/common/channel/delete',
      params: {
        id: channelId
      }
    })
    .then((res) => {
      if (typeof callback === 'function') {
        callback(res.data);
      }
    })
    .catch((error) => {
      console.error('删除通道错误:', error);
      if (typeof callback === 'function') {
        callback({ code: -1, msg: error.message || '网络错误' });
      }
    });
  }
}

export default ChannelService;

