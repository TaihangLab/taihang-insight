/**
 * 流媒体服务器服务类
 * 使用封装的API方法，不直接暴露axios
 */
import { 
  getOnlineMediaServerList,
  getMediaServerList,
  getMediaServerInfo,
  checkMediaServer as apiCheckMediaServer,
  checkRecordServer as apiCheckRecordServer,
  saveMediaServer,
  deleteMediaServerByParams
} from '@/api/mediaServer'
import { getChannelSnap } from '@/api/channel'

class MediaServer {
  /**
   * 获取在线流媒体服务器列表
   */
  getOnlineMediaServerList(callback) {
    getOnlineMediaServerList().then((res) => {
      if (typeof (callback) == "function") callback(res.data)
    }).catch((error) => {
      console.log(error);
    });
  }

  /**
   * 获取流媒体服务器列表
   */
  getMediaServerList(callback) {
    getMediaServerList().then((res) => {
      if (typeof (callback) == "function") callback(res.data)
    }).catch((error) => {
      console.log(error);
    });
  }

  /**
   * 获取流媒体服务器详情
   */
  getMediaServer(id, callback) {
    getMediaServerInfo(id).then((res) => {
      if (typeof (callback) == "function") callback(res.data)
    }).catch((error) => {
      console.log(error);
    });
  }

  /**
   * 检查流媒体服务器连接
   */
  checkServer(param, callback) {
    apiCheckMediaServer(param).then((res) => {
      if (typeof (callback) == "function") callback(res.data)
    }).catch((error) => {
      console.log(error);
    });
  }

  /**
   * 检查录像服务器连接
   */
  checkRecordServer(param, callback) {
    apiCheckRecordServer(param).then((res) => {
      if (typeof (callback) == "function") callback(res.data)
    }).catch((error) => {
      console.log(error);
    });
  }

  /**
   * 添加或更新流媒体服务器
   */
  addServer(param, callback) {
    saveMediaServer(param).then((res) => {
      if (typeof (callback) == "function") callback(res.data)
    }).catch((error) => {
      console.log(error);
    });
  }

  /**
   * 删除流媒体服务器
   */
  delete(id, callback) {
    deleteMediaServerByParams(id).then((res) => {
      if (typeof (callback) == "function") callback(res.data)
    }).catch((error) => {
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
    
    getChannelSnap(channelId)
      .then((response) => {
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
      .catch((error) => {
        console.error('获取通道截图错误:', error);
        if (typeof callback === 'function') callback({ 
          success: false, 
          message: error.message || '获取截图失败'
        });
      });
  }
}

export default MediaServer;
