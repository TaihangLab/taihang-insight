import axios from 'axios';

class MediaServer{

  constructor() {
    this.$axios = axios;
  }

  getOnlineMediaServerList(callback){
    this.$axios({
      method: 'get',
      url:`/api/server/media_server/online/list`,
    }).then((res) => {
      if (typeof (callback) == "function") callback(res.data)
    }).catch((error) => {
      console.log(error);
    });
  }
  getMediaServerList(callback){
    this.$axios({
      method: 'get',
      url:`/api/server/media_server/list`,
    }).then(function (res) {
      if (typeof (callback) == "function") callback(res.data)
    }).catch(function (error) {
      console.log(error);
    });
  }

  getMediaServer(id, callback){
    this.$axios({
      method: 'get',
      url:`/api/server/media_server/one/` + id,
    }).then(function (res) {
      if (typeof (callback) == "function") callback(res.data)
    }).catch(function (error) {
      console.log(error);
    });
  }

  checkServer(param, callback){
    this.$axios({
      method: 'get',
      url:`/api/server/media_server/check`,
      params: {
        ip: param.ip,
        port: param.httpPort,
        secret: param.secret,
        type: param.type
      }
    }).then(function (res) {
      if (typeof (callback) == "function") callback(res.data)
    }).catch(function (error) {
      console.log(error);
    });
  }

  checkRecordServer(param, callback){
    this.$axios({
      method: 'get',
      url:`/api/server/media_server/record/check`,
      params: {
        ip: param.ip,
        port: param.recordAssistPort
      }
    }).then(function (res) {
      if (typeof (callback) == "function") callback(res.data)
    }).catch(function (error) {
      console.log(error);
    });
  }

  addServer(param, callback){
    this.$axios({
      method: 'post',
      url:`/api/server/media_server/save`,
      data: param
    }).then(function (res) {
      if (typeof (callback) == "function") callback(res.data)
    }).catch(function (error) {
      console.log(error);
    });
  }

  delete(id, callback) {
    this.$axios({
      method: 'delete',
      url:`/api/server/media_server/delete`,
      params: {
        id: id
      }
    }).then(function (res) {
      if (typeof (callback) == "function") callback(res.data)
    }).catch(function (error) {
      console.log(error);
    });
  }


  /**
   * 获取通道截图并直接返回图片
   * @param {string|number} channelId 通道ID
   * @param {Function} callback 回调函数，返回图片数据
   */
  getChannelSnapWithImage(channelId, callback) {
    if (!channelId) {
      if (typeof callback === 'function') callback({ success: false, message: '缺少通道ID' });
      return;
    }

    console.log('正在获取通道截图, channelId:', channelId);
    
    this.$axios({
      method: 'get',
      url: `/api/common/channel/snap/stream?channelId=${channelId}`,
      responseType: 'blob',
      timeout: 15000, // 15秒超时
    })
    .then(function (response) {
      console.log('获取通道截图成功, contentType:', response.headers['content-type'], 
                  ', size:', response.data.size);
      
      // 检查返回的数据是否是图像
      if (response.data instanceof Blob && response.data.type.startsWith('image/')) {
        console.log('成功获取图像数据，大小:', response.data.size, 'bytes');
        if (typeof callback === 'function') callback({ 
          success: true, 
          imageData: response.data
        });
      } else {
        console.error('返回的数据不是图像类型:', response.data.type);
        // 尝试读取错误内容
        const reader = new FileReader();
        reader.onload = function() {
          try {
            const textContent = reader.result;
            console.error('返回的非图像内容:', textContent);
          } catch (e) {
            console.error('无法读取返回内容');
          }
          if (typeof callback === 'function') callback({ 
            success: false, 
            message: '返回的数据不是图像类型'
          });
        };
        reader.readAsText(response.data);
      }
    })
    .catch(function (error) {
      console.error('获取通道截图错误:', error);
      if (typeof callback === 'function') callback({ 
        success: false, 
        message: error.message || '获取截图失败'
      });
    });
  }
}

export default MediaServer;
