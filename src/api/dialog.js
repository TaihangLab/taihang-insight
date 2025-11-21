/**
 * Dialog 组件相关 API
 * 该文件封装所有 dialog 组件中使用的接口请求
 */
import request from '@/utils/request'

// ==================== Onvif 相关 ====================
/**
 * 获取 ONVIF RTSP 地址
 * @param {Object} params - 查询参数
 * @param {string} params.hostname - 主机名
 * @param {number} params.timeout - 超时时间
 * @param {string} params.username - 用户名
 * @param {string} params.password - 密码
 */
export function getOnvifRtsp(params) {
  return request({
    url: '/api/onvif/rtsp',
    method: 'get',
    params: params
  })
}

// ==================== 轨迹查询相关 ====================
/**
 * 查询历史轨迹
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID (可选)
 * @param {string} start - 开始时间
 * @param {string} end - 结束时间
 */
export function getPositionHistory(deviceId, channelId, start, end) {
  let url = `/api/position/history/${deviceId}?start=${start}&end=${end}`
  if (channelId) {
    url += `&channelId=${channelId}`
  }
  return request({
    url: url,
    method: 'get'
  })
}

// ==================== 设备管理相关 ====================
/**
 * 添加或更新设备
 * @param {Object} data - 设备数据
 * @param {boolean} isUpdate - 是否为更新操作
 */
export function saveDevice(data, isUpdate = false) {
  return request({
    url: `/api/device/query/device/${isUpdate ? 'update' : 'add'}`,
    method: 'post',
    data: data
  })
}

// ==================== 国标编码相关 ====================
/**
 * 查询行政区划子列表
 * @param {string} parent - 父级编码
 */
export function getRegionChildList(parent) {
  return request({
    url: '/api/region/base/child/list',
    method: 'get',
    params: { parent }
  })
}

/**
 * 查询行业编码列表
 */
export function getIndustryCodeList() {
  return request({
    url: '/api/common/channel/industry/list',
    method: 'get'
  })
}

/**
 * 查询设备类型列表
 */
export function getDeviceTypeList() {
  return request({
    url: '/api/common/channel/type/list',
    method: 'get'
  })
}

/**
 * 查询网络标识类型列表
 */
export function getNetworkIdentificationList() {
  return request({
    url: '/api/common/channel/network/identification/list',
    method: 'get'
  })
}

// ==================== 目录/分组管理相关 ====================
/**
 * 添加或编辑目录
 * @param {Object} data - 目录数据
 * @param {boolean} isEdit - 是否为编辑操作
 */
export function saveCatalog(data, isEdit = false) {
  return request({
    url: `/api/platform/catalog/${isEdit ? 'edit' : 'add'}`,
    method: 'post',
    data: data
  })
}

// ==================== 用户密码管理相关 ====================
/**
 * 修改当前用户密码
 * @param {string} oldPassword - 旧密码 (MD5加密)
 * @param {string} password - 新密码
 */
export function changePassword(oldPassword, password) {
  return request({
    url: '/api/user/changePassword',
    method: 'post',
    params: {
      oldPassword: oldPassword,
      password: password
    }
  })
}

/**
 * 管理员修改用户密码
 * @param {string} password - 新密码
 * @param {number} userId - 用户ID
 */
export function changePasswordForAdmin(password, userId) {
  return request({
    url: '/api/user/changePasswordForAdmin',
    method: 'post',
    params: {
      password: password,
      userId: userId
    }
  })
}

/**
 * 修改用户 PushKey
 * @param {string} pushKey - 新的 PushKey
 * @param {number} userId - 用户ID
 */
export function changePushKey(pushKey, userId) {
  return request({
    url: '/api/user/changePushKey',
    method: 'post',
    params: {
      pushKey: pushKey,
      userId: userId
    }
  })
}

// ==================== 录像下载相关 ====================
/**
 * 获取录像下载进度
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID
 * @param {string} stream - 流标识
 */
export function getDownloadProgress(deviceId, channelId, stream) {
  return request({
    url: `/api/gb_record/download/progress/${deviceId}/${channelId}/${stream}`,
    method: 'get'
  })
}

/**
 * 停止录像下载
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID
 * @param {string} stream - 流标识
 */
export function stopDownloadRecord(deviceId, channelId, stream) {
  return request({
    url: `/api/gb_record/download/stop/${deviceId}/${channelId}/${stream}`,
    method: 'get'
  })
}

// ==================== 设备通道列表相关 ====================
/**
 * 获取国标设备列表
 * @param {Object} params - 查询参数
 */
export function getGbDeviceList(params) {
  return request({
    url: '/api/device/query/devices',
    method: 'get',
    params: params
  })
}

/**
 * 获取国标通道列表（按行政区划）
 * @param {Object} params - 查询参数
 */
export function getChannelByCivilCode(params) {
  return request({
    url: '/api/common/channel/civilcode/list',
    method: 'get',
    params: params
  })
}

/**
 * 获取国标通道列表（按父节点）
 * @param {Object} params - 查询参数
 */
export function getChannelByParent(params) {
  return request({
    url: '/api/common/channel/parent/list',
    method: 'get',
    params: params
  })
}

// ==================== 平台共享相关 ====================
/**
 * 获取平台共享通道列表
 * @param {Object} params - 查询参数
 */
export function getPlatformChannelList(params) {
  return request({
    url: '/api/platform/channel/list',
    method: 'get',
    params: params
  })
}

/**
 * 添加平台共享通道
 * @param {Object} data - 通道数据
 */
export function addPlatformChannel(data) {
  return request({
    url: '/api/platform/channel/add',
    method: 'post',
    data: data
  })
}

/**
 * 按设备添加平台共享通道
 * @param {Object} data - 设备数据
 */
export function addPlatformChannelByDevice(data) {
  return request({
    url: '/api/platform/channel/device/add',
    method: 'post',
    data: data
  })
}

/**
 * 移除平台共享通道
 * @param {Object} data - 通道数据
 */
export function removePlatformChannel(data) {
  return request({
    url: '/api/platform/channel/remove',
    method: 'delete',
    data: data
  })
}

/**
 * 按设备移除平台共享通道
 * @param {Object} data - 设备数据
 */
export function removePlatformChannelByDevice(data) {
  return request({
    url: '/api/platform/channel/device/remove',
    method: 'post',
    data: data
  })
}

/**
 * 更新平台共享通道自定义信息
 * @param {Object} data - 通道数据
 */
export function updatePlatformChannelCustom(data) {
  return request({
    url: '/api/platform/channel/custom/update',
    method: 'post',
    data: data
  })
}

/**
 * 更新平台国标通道
 * @param {Object} data - 通道数据
 */
export function updatePlatformChannelForGb(data) {
  return request({
    url: '/api/platform/update_channel_for_gb',
    method: 'post',
    data: data
  })
}

// ==================== 录像计划关联相关 ====================
/**
 * 获取录像计划通道列表
 * @param {Object} params - 查询参数
 */
export function getRecordPlanChannelList(params) {
  return request({
    url: '/api/record/plan/channel/list',
    method: 'get',
    params: params
  })
}

/**
 * 关联/取消关联录像计划
 * @param {Object} data - 关联数据
 */
export function linkRecordPlan(data) {
  return request({
    url: '/api/record/plan/link',
    method: 'post',
    data: data
  })
}

// ==================== 异常通道相关 ====================
/**
 * 获取异常行政区划通道列表
 * @param {Object} params - 查询参数
 */
export function getUnusualCivilCodeChannelList(params) {
  return request({
    url: '/api/common/channel/civilCode/unusual/list',
    method: 'get',
    params: params
  })
}

/**
 * 清除异常行政区划通道
 * @param {Object} data - 通道数据
 */
export function clearUnusualCivilCodeChannel(data) {
  return request({
    url: '/api/common/channel/civilCode/unusual/clear',
    method: 'post',
    data: data
  })
}

/**
 * 获取行政区划描述
 * @param {string} civilCode - 行政区划代码
 */
export function getRegionDescription(civilCode) {
  return request({
    url: '/api/region/description',
    method: 'get',
    params: { civilCode }
  })
}

/**
 * 按行政区划添加区域
 * @param {string} civilCode - 行政区划代码
 */
export function addRegionByCivilCode(civilCode) {
  return request({
    url: '/api/region/addByCivilCode',
    method: 'get',
    params: { civilCode }
  })
}

/**
 * 获取异常分组通道列表
 * @param {Object} params - 查询参数
 */
export function getUnusualParentChannelList(params) {
  return request({
    url: '/api/common/channel/parent/unusual/list',
    method: 'get',
    params: params
  })
}

/**
 * 清除异常分组通道
 * @param {Object} data - 通道数据
 */
export function clearUnusualParentChannel(data) {
  return request({
    url: '/api/common/channel/parent/unusual/clear',
    method: 'post',
    data: data
  })
}

// ==================== 设备同步相关 ====================
/**
 * 获取设备同步状态
 * @param {string} deviceId - 设备ID
 */
export function getDeviceSyncStatus(deviceId) {
  return request({
    url: `/api/device/query/${deviceId}/sync_status/`,
    method: 'get'
  })
}

// ==================== 播放相关 ====================
/**
 * 开始播放
 * @param {string} deviceId - 设备ID
 * @param {string} channelId - 通道ID
 */
export function startPlay(deviceId, channelId) {
  return request({
    url: `/api/play/start/${deviceId}/${channelId}`,
    method: 'get'
  })
}

