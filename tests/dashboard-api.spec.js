/**
 * 太行视觉AI平台 - 大屏页面API验证测试
 * 使用 Playwright 验证三个大屏页面的后端API数据
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const API_BASE = 'http://localhost:5000/api/v1';

test.describe('太行视觉AI平台 - API测试', () => {

  test.beforeAll(async () => {
    // 确保后端服务运行
    console.log('测试后端API连接...');
    try {
      const response = await fetch(`${API_BASE.replace('/api/v1', '')}/health`);
      const data = await response.json();
      console.log('✓ 后端服务健康检查:', data);
    } catch (error) {
      console.error('✗ 后端服务未启动，请先启动后端服务');
      throw error;
    }
  });

  test.describe('预警统计API', () => {

    test('GET /api/v1/alerts/statistics/summary - 预警统计摘要', async ({ request }) => {
      const response = await request.get(`${API_BASE}/alerts/statistics/summary?time_range=day`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('code', 0);
      expect(data).toHaveProperty('msg', 'success');
      expect(data).toHaveProperty('data');

      const summary = data.data;
      expect(summary).toHaveProperty('total_alerts');
      expect(summary).toHaveProperty('pending_count');
      expect(summary).toHaveProperty('processing_count');
      expect(summary).toHaveProperty('completed_count');
      expect(summary).toHaveProperty('online_devices');
      expect(summary).toHaveProperty('total_devices');
      expect(summary).toHaveProperty('top_alert_types');
      expect(summary).toHaveProperty('top_locations');

      expect(Array.isArray(summary.top_alert_types)).toBeTruthy();
      expect(Array.isArray(summary.top_locations)).toBeTruthy();

      console.log('✓ 预警统计摘要:', summary.total_alerts, '条预警');
    });

    test('GET /api/v1/alerts/statistics/trend - 预警趋势', async ({ request }) => {
      const response = await request.get(`${API_BASE}/alerts/statistics/trend?time_range=24h&granularity=1h`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('code', 0);
      expect(data.data).toHaveProperty('time_labels');
      expect(data.data).toHaveProperty('trend_data');
      expect(data.data).toHaveProperty('total');

      expect(Array.isArray(data.data.time_labels)).toBeTruthy();
      expect(Array.isArray(data.data.trend_data)).toBeTruthy();

      console.log('✓ 预警趋势数据:', data.data.time_labels.length, '个时间点');
    });

    test('GET /api/v1/alerts/statistics/by-type - 预警类型统计', async ({ request }) => {
      const response = await request.get(`${API_BASE}/alerts/statistics/by-type?time_range=day`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data).toBeInstanceOf(Array);

      if (data.data.length > 0) {
        expect(data.data[0]).toHaveProperty('name');
        expect(data.data[0]).toHaveProperty('count');
        expect(data.data[0]).toHaveProperty('value');
        expect(data.data[0]).toHaveProperty('color');
      }

      console.log('✓ 预警类型统计:', data.data.length, '种类型');
    });

    test('GET /api/v1/alerts/statistics/by-level - 预警等级统计', async ({ request }) => {
      const response = await request.get(`${API_BASE}/alerts/statistics/by-level?time_range=day`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data).toBeInstanceOf(Array);

      if (data.data.length > 0) {
        expect(data.data[0]).toHaveProperty('value');
        expect(data.data[0]).toHaveProperty('name');
        expect(data.data[0]).toHaveProperty('level');
        expect(data.data[0]).toHaveProperty('color');
      }

      console.log('✓ 预警等级统计:', data.data.length, '个等级');
    });

    test('GET /api/v1/alerts/statistics/by-location - 预警位置统计', async ({ request }) => {
      const response = await request.get(`${API_BASE}/alerts/statistics/by-location?time_range=day&limit=10`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data).toBeInstanceOf(Array);

      if (data.data.length > 0) {
        expect(data.data[0]).toHaveProperty('name');
        expect(data.data[0]).toHaveProperty('count');
        expect(data.data[0]).toHaveProperty('value');
      }

      console.log('✓ 预警位置统计:', data.data.length, '个位置');
    });

    test('GET /api/v1/alerts/statistics/processing-status - 预警处理状态', async ({ request }) => {
      const response = await request.get(`${API_BASE}/alerts/statistics/processing-status?time_range=day`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data).toBeInstanceOf(Array);

      if (data.data.length > 0) {
        expect(data.data[0]).toHaveProperty('value');
        expect(data.data[0]).toHaveProperty('name');
        expect(data.data[0]).toHaveProperty('itemStyle');
      }

      console.log('✓ 预警处理状态:', data.data.length, '种状态');
    });
  });

  test.describe('系统监控API', () => {

    test('GET /api/v1/system/resources - 当前资源使用率', async ({ request }) => {
      const response = await request.get(`${API_BASE}/system/resources`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('code', 0);
      expect(data.data).toHaveProperty('cpu_usage');
      expect(data.data).toHaveProperty('memory_usage');
      expect(data.data).toHaveProperty('disk_usage');
      expect(data.data).toHaveProperty('network_usage');
      expect(data.data).toHaveProperty('timestamp');

      expect(typeof data.data.cpu_usage).toBe('number');
      expect(typeof data.data.memory_usage).toBe('number');

      console.log('✓ 资源使用率 - CPU:', data.data.cpu_usage, '%, 内存:', data.data.memory_usage, '%');
    });

    test('GET /api/v1/system/resources/history - 资源历史数据', async ({ request }) => {
      const response = await request.get(`${API_BASE}/system/resources/history?metric=cpu&time_range=1h`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data).toHaveProperty('metric');
      expect(data.data).toHaveProperty('time_range');
      expect(data.data).toHaveProperty('time_labels');
      expect(data.data).toHaveProperty('data_points');

      expect(Array.isArray(data.data.time_labels)).toBeTruthy();
      expect(Array.isArray(data.data.data_points)).toBeTruthy();

      console.log('✓ 资源历史数据:', data.data.data_points.length, '个数据点');
    });

    test('GET /api/v1/storage/usage - 存储使用情况', async ({ request }) => {
      const response = await request.get(`${API_BASE}/storage/usage`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data).toHaveProperty('total_storage');
      expect(data.data).toHaveProperty('used_storage');
      expect(data.data).toHaveProperty('storage_usage');
      expect(data.data).toHaveProperty('storage_list');

      expect(Array.isArray(data.data.storage_list)).toBeTruthy();

      console.log('✓ 存储使用率:', data.data.storage_usage, '%');
    });

    test('GET /api/v1/bandwidth/usage - 带宽使用情况', async ({ request }) => {
      const response = await request.get(`${API_BASE}/bandwidth/usage?time_range=1h`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data).toHaveProperty('time_range');
      expect(data.data).toHaveProperty('time_labels');
      expect(data.data).toHaveProperty('upstream_bandwidth');
      expect(data.data).toHaveProperty('downstream_bandwidth');

      expect(Array.isArray(data.data.time_labels)).toBeTruthy();

      console.log('✓ 带宽数据:', data.data.time_labels.length, '个时间点');
    });
  });

  test.describe('设备统计API', () => {

    test('GET /api/v1/devices/statistics - 设备状态统计', async ({ request }) => {
      const response = await request.get(`${API_BASE}/devices/statistics`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data).toHaveProperty('total_devices');
      expect(data.data).toHaveProperty('online_devices');
      expect(data.data).toHaveProperty('offline_devices');
      expect(data.data).toHaveProperty('online_rate');
      expect(data.data).toHaveProperty('device_groups');

      expect(typeof data.data.online_rate).toBe('number');

      console.log('✓ 设备统计 - 在线率:', data.data.online_rate, '%');
    });

    test('GET /api/v1/devices/tree - 设备树结构', async ({ request }) => {
      const response = await request.get(`${API_BASE}/devices/tree`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data).toBeInstanceOf(Array);

      if (data.data.length > 0) {
        expect(data.data[0]).toHaveProperty('id');
        expect(data.data[0]).toHaveProperty('label');
      }

      console.log('✓ 设备树:', data.data.length, '个根节点');
    });

    test('GET /api/v1/devices/summary - 设备接入摘要', async ({ request }) => {
      const response = await request.get(`${API_BASE}/devices/summary`);

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.data).toHaveProperty('total_connections');
      expect(data.data).toHaveProperty('video_streams');
      expect(data.data).toHaveProperty('capture_services');
      expect(data.data).toHaveProperty('nvr_calls');

      console.log('✓ 设备接入摘要 - 总连接数:', data.data.total_connections);
    });
  });
});

test.describe('太行视觉AI平台 - 页面集成测试', () => {

  test.beforeEach(async ({ page }) => {
    // 设置超时时间
    page.setDefaultTimeout(30000);
  });

  test('可视中心首页 - 数据加载验证', async ({ page }) => {
    console.log('导航到可视中心首页...');
    await page.goto(`${BASE_URL}/#/visualCenter`);

    // 等待页面加载
    await page.waitForTimeout(2000);

    // 检查页面标题
    const title = await page.title();
    expect(title).toContain('太行');

    // 检查关键元素
    const statsCards = page.locator('.dashboard-card').count();
    console.log('✓ 找到', statsCards, '个统计卡片');

    // 检查是否有错误提示
    const errors = page.locator('.el-message--error').count();
    expect(errors).toBe(0);
  });

  test('算法推理平台 - 资源监控验证', async ({ page }) => {
    console.log('导航到算法推理平台...');
    await page.goto(`${BASE_URL}/#/algorithmInference`);

    // 等待页面加载
    await page.waitForTimeout(2000);

    // 检查资源统计组件
    const resourceStats = page.locator('.resource-statistics');
    const isVisible = await resourceStats.isVisible().catch(() => false);

    if (isVisible) {
      console.log('✓ 资源统计组件已加载');

      // 检查资源标签
      const labels = ['CPU使用率', '磁盘使用率', '内存使用率', '显存使用率'];
      for (const label of labels) {
        const element = page.locator('.resource-label').filter({ hasText: label });
        const count = await element.count();
        console.log(`  - ${label}:`, count > 0 ? '✓' : '✗');
      }
    }
  });

  test('园区封闭管理平台 - 设备树验证', async ({ page }) => {
    console.log('导航到园区封闭管理平台...');
    await page.goto(`${BASE_URL}/#/parkManagement`);

    // 等待页面加载
    await page.waitForTimeout(2000);

    // 检查设备树
    const deviceTree = page.locator('.device-tree, .tree-container');
    const isVisible = await deviceTree.isVisible().catch(() => false);

    if (isVisible) {
      console.log('✓ 设备树组件已加载');
    }

    // 检查是否有错误
    const errors = page.locator('.el-message--error').count();
    expect(errors).toBe(0);
  });

  test('页面API请求验证', async ({ page }) => {
    // 监听所有API请求
    const apiRequests = [];

    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/v1/')) {
        apiRequests.push({
          url: url,
          method: request.method()
        });
      }
    });

    // 访问可视中心首页
    console.log('访问可视中心首页，监控API请求...');
    await page.goto(`${BASE_URL}/#/visualCenter`);

    // 等待API请求完成
    await page.waitForTimeout(3000);

    console.log('✓ 检测到', apiRequests.length, '个API请求');

    // 验证是否有请求到本地后端
    const localBackendRequests = apiRequests.filter(req =>
      req.url.includes('localhost:5000')
    );

    if (localBackendRequests.length > 0) {
      console.log('✓ 成功连接本地后端服务');
      localBackendRequests.forEach(req => {
        console.log('  -', req.method, req.url);
      });
    } else {
      console.log('⚠ 未检测到本地后端API请求');
    }
  });
});
