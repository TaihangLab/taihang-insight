/** 拉流点位/设备源状态展示（设备接入、点位管理、AI 摄像头共用） */

export function isActiveStreamStatus(status) {
  return status === '在线' || status === '拉流中' || status === '推流中';
}

export function streamStatusTextClass(status) {
  if (isActiveStreamStatus(status)) return 'is-online';
  if (status === '未拉流' || status === '已停止') return 'is-idle';
  return 'is-offline';
}

export function streamStatusDotClass(status) {
  if (isActiveStreamStatus(status)) return 'asset-status-dot--online';
  if (status === '未拉流' || status === '已停止') return 'asset-status-dot--idle';
  return 'asset-status-dot--offline';
}

export function sourceTagType(status) {
  if (status === 'ok' || status === 'streaming') return 'success';
  if (status === 'no_stream') return 'warning';
  if (status === 'unreachable' || status === 'invalid') return 'danger';
  return 'info';
}

export function probeTone(status) {
  return status === 'ok' || status === 'streaming' ? 'ok' : 'bad';
}

const BAD_SOURCE_STATUSES = ['no_stream', 'unreachable', 'invalid'];

/**
 * 展示用源状态：行已在拉流/在线时，探测失败结果必然是过期或误报
 * （如摄像头连接数满导致 401），强制按「拉流中」展示，避免自相矛盾。
 */
export function displaySourceStatus(row) {
  if (!row) return '';
  if (BAD_SOURCE_STATUSES.includes(row.sourceStatus)
      && isActiveStreamStatus(pullPointStatusText(row))) {
    return 'streaming';
  }
  return row.sourceStatus;
}

export function displaySourceStatusText(row) {
  if (!row) return '';
  if (displaySourceStatus(row) !== row.sourceStatus) return '拉流中';
  return row.sourceStatusText;
}

export function sourceTooltip(row) {
  if (displaySourceStatus(row) !== row.sourceStatus) {
    return '正在从该源拉流（此前的探测结果已过期）';
  }
  const parts = [];
  if (row.sourceDetail) parts.push(row.sourceDetail);
  if (row.sourceCheckedAt) parts.push(`检测于 ${row.sourceCheckedAt}`);
  return parts.join('；') || '尚未检测，点击右侧按钮立即检测';
}

/** 拉流虚拟点位/摄像头：仅点位拉流状态，不含源状态 */
export function pullPointStatusText(row) {
  if (!row) return '-';
  if (row.camera_type === 4) {
    if (row.running != null && !row.running) return '已停止';
    if (row.running && !row.status) return '推流离线';
    if (row.running != null) return row.running ? '推流中' : '已停止';
    return row.status ? '推流中' : '已停止';
  }
  if (row.camera_type === 3 || row.virtualMode === 'stream') {
    const online = typeof row.status === 'boolean'
      ? row.status
      : ['拉流中', '在线', '推流中'].includes(row.status);
    return online ? '拉流中' : '未拉流';
  }
  if (typeof row.status === 'boolean') {
    return row.status ? '在线' : '离线';
  }
  if (row.status === '拉流中' || row.status === '推流中' || row.status === '在线' || row.status === '离线') {
    return row.status;
  }
  return row.status ? '在线' : '离线';
}

export function pullPointStatusTagType(row) {
  const text = pullPointStatusText(row);
  if (text === '拉流中' || text === '推流中' || text === '在线') return 'success';
  if (text === '未拉流' || text === '已停止') return 'info';
  return 'danger';
}

export function isIdleDeviceStatus(status) {
  return status === '未拉流' || status === '已停止';
}

export function isOfflineDeviceStatus(status) {
  return status === '离线';
}

export function categorizeRowStatus(row) {
  const text = typeof row.status === 'string' && ['在线', '离线', '拉流中', '未拉流', '推流中', '已停止', '推流离线'].includes(row.status)
    ? row.status
    : pullPointStatusText(row);
  if (isActiveStreamStatus(text)) return 'active';
  if (isIdleDeviceStatus(text)) return 'idle';
  if (isOfflineDeviceStatus(text) || text === '推流离线') return 'offline';
  return 'idle';
}

/**
 * 点位三态分桶（与顶部统计一致）：
 * - active   活跃：在线 / 拉流中 / 推流中
 * - abnormal 异常：离线 / 推流离线，或拉流点位源异常（无流 / 不可达 / 地址无效）
 * - idle     空闲：其余（未拉流 / 已停止且源正常）
 */
export function pointStatusBucket(row) {
  if (!row) return 'idle';
  const cat = categorizeRowStatus(row);
  if (cat === 'offline') return 'abnormal';
  const isStreamPoint = (row.pointType === 'virtual' && row.virtualMode === 'stream') || row.camera_type === 3;
  if (isStreamPoint && BAD_SOURCE_STATUSES.includes(displaySourceStatus(row))) return 'abnormal';
  if (cat === 'active') return 'active';
  return 'idle';
}

/** 点位管理 / AI 摄像头顶部统计 */
export function summarizePointStats(points) {
  const list = points || [];
  let active = 0;
  let idle = 0;
  let offline = 0;
  let virtual = 0;
  let sourceBad = 0;
  list.forEach((p) => {
    if (p.pointType === 'virtual') virtual += 1;
    const cat = categorizeRowStatus(p);
    if (cat === 'active') active += 1;
    else if (cat === 'idle') idle += 1;
    else offline += 1;
    const isStreamPoint = (p.pointType === 'virtual' && p.virtualMode === 'stream') || p.camera_type === 3;
    if (isStreamPoint && BAD_SOURCE_STATUSES.includes(displaySourceStatus(p))) {
      sourceBad += 1;
    }
  });
  return {
    total: list.length,
    active,
    idle,
    offline,
    virtual,
    sourceBad,
  };
}

/**
 * 设备三态分桶（与设备接入页顶部统计一致）：
 * - active   活跃：在线 / 拉流中 / 推流中
 * - offline  离线：设备或通道不可用
 * - idle     空闲：其余（未拉流 / 已停止 / 未知）
 */
export function deviceStatusBucket(row) {
  const status = row && row.status;
  if (isActiveStreamStatus(status)) return 'active';
  if (isOfflineDeviceStatus(status)) return 'offline';
  return 'idle';
}

/** 设备接入页顶部统计（基于全量筛选结果，非仅当前页） */
export function summarizeDeviceStats(devices) {
  const list = devices || [];
  let channelOnline = 0;
  let channelTotal = 0;
  let active = 0;
  let idle = 0;
  let offline = 0;
  list.forEach((d) => {
    const total = d.channelCount || 0;
    if (total > 1) {
      channelOnline += d.channelOnlineCount || 0;
      channelTotal += total;
    }
    if (isActiveStreamStatus(d.status)) active += 1;
    else if (isIdleDeviceStatus(d.status)) idle += 1;
    else if (isOfflineDeviceStatus(d.status)) offline += 1;
    else idle += 1;
  });
  return {
    total: list.length,
    active,
    idle,
    offline,
    channelOnline,
    channelTotal,
    hasMultiChannel: channelTotal > 0,
  };
}

export function formatChannelSummary(row) {
  const total = row.channelCount || 0;
  const online = row.channelOnlineCount != null ? row.channelOnlineCount : 0;
  if (total > 1) return `${online}/${total} 在线`;
  return String(total || 0);
}

/** 源状态只在点位管理 / AI 摄像头展示（设备接入页不展示，避免重复探测） */
export function showSourceStatus(row) {
  if (!row) return false;
  if (row.pointType === 'virtual' && row.virtualMode === 'stream') return true;
  if (row.camera_type === 3) return true;
  return false;
}
