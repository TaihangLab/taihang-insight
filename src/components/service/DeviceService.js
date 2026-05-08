/**
 * 设备服务类
 * 使用封装的API方法，不直接暴露axios
 */
import { 
  getDeviceList as apiGetDeviceList, 
  getDeviceInfo, 
  getDeviceTree as apiGetDeviceTree 
} from '@/api/device'
import { getDeviceChannels, getSubChannels } from '@/api/channel'

class DeviceService {
  /**
   * 获取设备列表
   */
  getDeviceList(currentPage, count, callback, errorCallback) {
    apiGetDeviceList({
      page: currentPage,
      count: count
    }).then((res) => {
      if (typeof (callback) == "function") callback(res.data)
    }).catch((error) => {
      console.log(error);
      if (typeof (errorCallback) == "function") errorCallback(error)
    });
  }

  /**
   * 获取设备详情
   */
  getDevice(deviceId, callback, errorCallback) {
    getDeviceInfo(deviceId).then((res) => {
      if (typeof (callback) == "function") callback(res.data)
    }).catch((error) => {
      console.log(error);
      if (typeof (errorCallback) == "function") errorCallback(error)
    });
  }

  /**
   * 获取所有设备列表（分页迭代）
   */
  getAllDeviceList(callback, endCallback, errorCallback) {
    let currentPage = 1;
    let count = 100;
    let deviceList = []
    this.getAllDeviceListIteration(deviceList, currentPage, count, callback, endCallback, errorCallback)
  }

  /**
   * 获取所有设备列表迭代方法
   */
  getAllDeviceListIteration(deviceList, currentPage, count, callback, endCallback, errorCallback) {
    this.getDeviceList(currentPage, count, (data) => {
      if (data.code === 0 && data.data.list) {
        if (typeof (callback) == "function") callback(data.data.list)
        deviceList = deviceList.concat(data.data.list);
        if (deviceList.length < data.data.total) {
          currentPage++
          this.getAllDeviceListIteration(deviceList, currentPage, count, callback, endCallback, errorCallback)
        } else {
          if (typeof (endCallback) == "function") endCallback(deviceList)
        }
      }
    }, errorCallback)
  }

  /**
   * 获取所有通道
   */
  getAllChannel(isCatalog, catalogUnderDevice, deviceId, callback, endCallback, errorCallback) {
    let currentPage = 1;
    let count = 100;
    let catalogList = []
    this.getAllChannelIteration(isCatalog, catalogUnderDevice, deviceId, catalogList, currentPage, count, callback, endCallback, errorCallback)
  }

  /**
   * 获取所有通道迭代方法
   */
  getAllChannelIteration(isCatalog, catalogUnderDevice, deviceId, catalogList, currentPage, count, callback, endCallback, errorCallback) {
    this.getChanel(isCatalog, catalogUnderDevice, deviceId, currentPage, count, (data) => {
      if (data.list) {
        if (typeof (callback) == "function") callback(data.list)
        catalogList = catalogList.concat(data.list);
        if (catalogList.length < data.total) {
          currentPage++
          this.getAllChannelIteration(isCatalog, catalogUnderDevice, deviceId, catalogList, currentPage, count, callback, endCallback, errorCallback)
        } else {
          if (typeof (endCallback) == "function") endCallback(catalogList)
        }
      }
    }, errorCallback)
  }

  /**
   * 获取通道列表
   */
  getChanel(isCatalog, catalogUnderDevice, deviceId, currentPage, count, callback, errorCallback) {
    getDeviceChannels(deviceId, {
      page: currentPage,
      count: count,
      query: "",
      online: "",
      channelType: isCatalog,
      catalogUnderDevice: catalogUnderDevice
    }).then((res) => {
      if (typeof (callback) == "function") callback(res.data)
    }).catch(errorCallback);
  }

  /**
   * 获取所有子通道
   */
  getAllSubChannel(isCatalog, deviceId, channelId, callback, endCallback, errorCallback) {
    let currentPage = 1;
    let count = 100;
    let catalogList = []
    this.getAllSubChannelIteration(isCatalog, deviceId, channelId, catalogList, currentPage, count, callback, endCallback, errorCallback)
  }

  /**
   * 获取所有子通道迭代方法
   */
  getAllSubChannelIteration(isCatalog, deviceId, channelId, catalogList, currentPage, count, callback, endCallback, errorCallback) {
    this.getSubChannel(isCatalog, deviceId, channelId, currentPage, count, (data) => {
      if (data.list) {
        if (typeof (callback) == "function") callback(data.list)
        catalogList = catalogList.concat(data.list);
        if (catalogList.length < data.total) {
          currentPage++
          this.getAllSubChannelIteration(isCatalog, deviceId, channelId, catalogList, currentPage, count, callback, endCallback, errorCallback)
        } else {
          if (typeof (endCallback) == "function") endCallback(catalogList)
        }
      }
    }, errorCallback)
  }

  /**
   * 获取子通道列表
   */
  getSubChannel(isCatalog, deviceId, channelId, currentPage, count, callback, errorCallback) {
    getSubChannels(deviceId, channelId, {
      page: currentPage,
      count: count,
      query: "",
      online: "",
      channelType: isCatalog
    }).then((res) => {
      if (typeof (callback) == "function") callback(res.data)
    }).catch(errorCallback);
  }

  /**
   * 获取设备树
   */
  getTree(deviceId, parentId, onlyCatalog, callback, endCallback, errorCallback) {
    let currentPage = 1;
    let count = 100;
    let catalogList = []
    this.getTreeIteration(deviceId, parentId, onlyCatalog, catalogList, currentPage, count, callback, endCallback, errorCallback)
  }

  /**
   * 获取设备树迭代方法
   */
  getTreeIteration(deviceId, parentId, onlyCatalog, catalogList, currentPage, count, callback, endCallback, errorCallback) {
    this.getTreeInfo(deviceId, parentId, onlyCatalog, currentPage, count, (data) => {
      if (data.code === 0 && data.data.list) {
        if (typeof (callback) == "function") callback(data.data.list)
        catalogList = catalogList.concat(data.data.list);
        if (catalogList.length < data.data.total) {
          currentPage++
          this.getTreeIteration(deviceId, parentId, onlyCatalog, catalogList, currentPage, count, callback, endCallback, errorCallback)
        } else {
          if (typeof (endCallback) == "function") endCallback(catalogList)
        }
      }
    }, errorCallback)
  }

  /**
   * 获取设备树信息
   */
  getTreeInfo(deviceId, parentId, onlyCatalog, currentPage, count, callback, errorCallback) {
    if (onlyCatalog == null || typeof onlyCatalog === "undefined") {
      onlyCatalog = false;
    }
    apiGetDeviceTree(deviceId, {
      page: currentPage,
      count: count,
      parentId: parentId,
      onlyCatalog: onlyCatalog
    }).then((res) => {
      if (typeof (callback) == "function") callback(res.data)
    }).catch(errorCallback);
  }
}

export default DeviceService;
