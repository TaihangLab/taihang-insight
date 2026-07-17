import axios from 'axios';
const config = require('../../../config/index.js');

const assetAxios = axios.create({
  baseURL: config.API_BASE_URL + '/api/v1',
  timeout: 30000,
  withCredentials: false,
});

function unwrap(res) {
  const body = res.data || {};
  if (body.code !== 0 && body.code !== undefined) {
    return Promise.reject(new Error(body.msg || body.message || '请求失败'));
  }
  return body.data;
}

/** 将 asset 组织树扁平化为 el-select options */
export function flattenOrgOptions(nodes, prefix = '') {
  const out = [];
  (nodes || []).forEach((node) => {
    const label = prefix ? `${prefix} / ${node.title || node.name}` : (node.title || node.name);
    out.push({ value: node.key || node.id, label });
    if (node.children && node.children.length) {
      out.push(...flattenOrgOptions(node.children, label));
    }
  });
  return out;
}

/** 选中组织及（可选）全部下级组织 id，用于侧栏筛选 */
export function collectOrgScopeIds(nodes, orgId, includeSub = true) {
  if (!orgId) return [];
  const ids = [orgId];
  if (!includeSub) return ids;

  const walkChildren = (node) => {
    (node.children || []).forEach((child) => {
      const cid = child.id || child.key;
      if (cid) ids.push(cid);
      walkChildren(child);
    });
  };

  const findNode = (list) => {
    for (const node of list || []) {
      const id = node.id || node.key;
      if (id === orgId) {
        walkChildren(node);
        return true;
      }
      if (node.children && findNode(node.children)) return true;
    }
    return false;
  };

  findNode(nodes);
  return ids;
}

export const assetAPI = {
  fetchDevices(params) {
    return assetAxios.get('/asset/devices', {
      params: {
        page: params.page,
        size: params.pageSize,
        key: params.key || '',
      },
    }).then(unwrap);
  },
  fetchGbAccessInfo() {
    return assetAxios.get('/asset/gb-access-info').then(unwrap);
  },
  createDevice(data) {
    return assetAxios.post('/asset/devices', {
      name: data.name,
      accessType: data.accessType,
      orgId: data.orgId || '',
      gbCode: data.gbCode || '',
      streamUrl: data.streamUrl || '',
      protocol: data.protocol || 'TCP',
      auth: !!data.auth,
      ip: data.ip || '',
      port: data.port || 80,
      username: data.username || '',
      password: data.password || '',
      createPoint: data.createPoint !== false,
    }).then(unwrap);
  },
  deleteDevice(id) {
    return assetAxios.delete(`/asset/devices/${id}`).then(unwrap);
  },
  fetchPoints(params) {
    return assetAxios.get('/asset/points', {
      params: {
        page: params.page,
        size: params.pageSize,
        key: params.key || '',
        type: params.type || '',
        orgId: params.orgId || '',
        includeSub: params.includeSub !== false,
      },
    }).then(unwrap);
  },
  fetchAvailableChannels(params) {
    return assetAxios.get('/asset/points/available-channels', {
      params: {
        orgId: params.orgId || '',
        key: params.key || '',
        includeSub: params.includeSub !== false,
      },
    }).then(unwrap);
  },
  createPointsBatch(data) {
    return assetAxios.post('/asset/points/batch', data).then(unwrap);
  },
  createVirtualPointStream(data) {
    return assetAxios.post('/asset/points/virtual/stream', data).then(unwrap);
  },
  /** 导出拉流虚拟点位 CSV（或空模板） */
  exportStreamPoints(template = false) {
    return assetAxios.get('/asset/points/export/stream', {
      params: { template: template ? true : false },
      responseType: 'blob',
      timeout: 60000,
    }).then((res) => {
      const blob = res.data;
      const filename = template ? 'stream_points_template.csv' : 'stream_points.csv';
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  },
  /** 上传 CSV 批量导入拉流虚拟点位 */
  importStreamPoints(file) {
    const formData = new FormData();
    formData.append('file', file);
    return assetAxios.post('/asset/points/import/stream', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 600000,
    }).then(unwrap);
  },
  createVirtualPointFile(file, name, orgId) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name || '');
    formData.append('orgId', orgId || '');
    formData.append('tags', '[]');
    return assetAxios.post('/asset/points/virtual/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 600000,
    }).then(unwrap);
  },
  /** 探测任意 rtsp/rtmp 流地址是否可用（建点前测试，不创建资源） */
  probeStreamUrl(streamUrl) {
    return assetAxios.post('/asset/points/probe-url', { streamUrl }, { timeout: 20000 }).then(unwrap);
  },
  /** 立即探测某个拉流点位的源地址并刷新其源状态 */
  probePoint(pointId) {
    return assetAxios.post(`/asset/points/${pointId}/probe`, {}, { timeout: 20000 }).then(unwrap);
  },
  startPointStream(pointId) {
    return assetAxios.post(`/asset/points/${pointId}/start`).then(unwrap);
  },
  stopPointStream(pointId) {
    return assetAxios.post(`/asset/points/${pointId}/stop`).then(unwrap);
  },
  deletePoint(id) {
    return assetAxios.delete(`/asset/points/${id}`).then(unwrap);
  },
  fetchOrganizations() {
    return assetAxios.get('/asset/organizations').then(unwrap);
  },
  fetchOrganizationDetail(orgId) {
    return assetAxios.get(`/asset/organizations/${orgId}`).then(unwrap);
  },
  fetchOrganizationParentOptions(excludeId) {
    return assetAxios.get('/asset/organizations/parent-options', {
      params: { excludeId: excludeId || '' },
    }).then(unwrap);
  },
  createOrganization(data) {
    return assetAxios.post('/asset/organizations', data).then(unwrap);
  },
  updateOrganization(orgId, data) {
    return assetAxios.put(`/asset/organizations/${orgId}`, data).then(unwrap);
  },
  deleteOrganization(orgId) {
    return assetAxios.delete(`/asset/organizations/${orgId}`).then(unwrap);
  },
};

export default assetAPI;
