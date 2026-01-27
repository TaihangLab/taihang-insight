import { test, expect } from '@playwright/test';

/**
 * RBAC 综合功能验证测试
 *
 * 测试范围：
 * - 用户管理 (User Management)
 * - 角色管理 (Role Management)
 * - 部门管理 (Department Management)
 * - 岗位管理 (Position Management)
 * - 租户管理 (Tenant Management)
 * - 权限管理 (Permission Management)
 */

test.describe('RBAC 综合功能验证', () => {
  const BASE_URL = 'http://localhost:8080';

  // ==================== 辅助函数 ====================

  async function waitForPageLoad(page) {
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
  }

  async function checkTableExists(page) {
    const table = await page.locator('.el-table, .custom-table').count();
    return table > 0;
  }

  async function checkTreeExists(page) {
    const tree = await page.locator('.el-tree').count();
    return tree > 0;
  }

  async function takeScreenshot(page, name) {
    await page.screenshot({ path: `test-results/${name}.png`, fullPage: true });
  }

  // ==================== 首页测试 ====================

  test('应能访问应用首页', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForPageLoad(page);

    // 验证页面标题
    const title = await page.title();
    console.log('页面标题:', title);

    await takeScreenshot(page, '01-home');
    console.log('✅ 首页访问成功');
  });

  // ==================== 用户管理测试 ====================

  test('应能访问用户管理页面', async ({ page }) => {
    console.log('👤 测试用户管理...');
    await page.goto(`${BASE_URL}/#/systemManage/userManagement`);
    await waitForPageLoad(page);

    // 检查页面容器
    const container = await page.locator('.user-management-container, .system-management-container').count();
    console.log('  页面容器:', container > 0 ? '✅' : '❌');

    // 检查搜索栏
    const searchBar = await page.locator('.user-search-bar, .search-bar').count();
    console.log('  搜索栏:', searchBar > 0 ? '✅' : '❌');

    // 检查表格
    const hasTable = await checkTableExists(page);
    console.log('  数据表格:', hasTable ? '✅' : '❌');

    // 检查操作按钮
    const buttons = await page.locator('button').allTextContents();
    const hasSearch = buttons.some(b => b.includes('查询') || b.includes('搜索'));
    const hasAdd = buttons.some(b => b.includes('新增') || b.includes('添加'));
    const hasExport = buttons.some(b => b.includes('导出') || b.includes('更多'));

    console.log('  查询按钮:', hasSearch ? '✅' : '❌');
    console.log('  新增按钮:', hasAdd ? '✅' : '❌');
    console.log('  导出功能:', hasExport ? '✅' : '❌');

    await takeScreenshot(page, '02-user-management');
    console.log('  📸 用户管理截图已保存\n');

    expect(container > 0).toBeTruthy();
  });

  // ==================== 角色管理测试 ====================

  test('应能访问角色管理页面', async ({ page }) => {
    console.log('🔐 测试角色管理...');
    await page.goto(`${BASE_URL}/#/systemManage/roleManagement`);
    await waitForPageLoad(page);

    const hasTable = await checkTableExists(page);
    console.log('  数据表格:', hasTable ? '✅' : '❌');

    const buttons = await page.locator('button').allTextContents();
    const hasAdd = buttons.some(b => b.includes('新增') || b.includes('添加'));
    console.log('  新增按钮:', hasAdd ? '✅' : '❌');

    await takeScreenshot(page, '03-role-management');
    console.log('  📸 角色管理截图已保存\n');

    expect(hasTable).toBeTruthy();
  });

  // ==================== 部门管理测试 ====================

  test('应能访问部门管理页面', async ({ page }) => {
    console.log('🏢 测试部门管理...');
    await page.goto(`${BASE_URL}/#/systemManage/departmentManagement`);
    await waitForPageLoad(page);

    const hasTree = await checkTreeExists(page);
    console.log('  部门树:', hasTree ? '✅' : '❌');

    const buttons = await page.locator('button').allTextContents();
    const hasAdd = buttons.some(b => b.includes('新增') || b.includes('添加'));
    console.log('  新增按钮:', hasAdd ? '✅' : '❌');

    await takeScreenshot(page, '04-department-management');
    console.log('  📸 部门管理截图已保存\n');

    expect(hasTree).toBeTruthy();
  });

  // ==================== 岗位管理测试 ====================

  test('应能访问岗位管理页面', async ({ page }) => {
    console.log('💼 测试岗位管理...');
    await page.goto(`${BASE_URL}/#/systemManage/positionManagement`);
    await waitForPageLoad(page);

    const hasTable = await checkTableExists(page);
    console.log('  数据表格:', hasTable ? '✅' : '❌');

    const buttons = await page.locator('button').allTextContents();
    const hasAdd = buttons.some(b => b.includes('新增') || b.includes('添加'));
    console.log('  新增按钮:', hasAdd ? '✅' : '❌');

    await takeScreenshot(page, '05-position-management');
    console.log('  📸 岗位管理截图已保存\n');

    expect(hasTable).toBeTruthy();
  });

  // ==================== 租户管理测试 ====================

  test('应能访问租户管理页面', async ({ page }) => {
    console.log('🏢 测试租户管理...');
    await page.goto(`${BASE_URL}/#/systemManage/tenantManagement`);
    await waitForPageLoad(page);

    const hasTable = await checkTableExists(page);
    console.log('  数据表格:', hasTable ? '✅' : '❌');

    const buttons = await page.locator('button').allTextContents();
    const hasAdd = buttons.some(b => b.includes('新增') || b.includes('添加'));
    console.log('  新增按钮:', hasAdd ? '✅' : '❌');

    await takeScreenshot(page, '06-tenant-management');
    console.log('  📸 租户管理截图已保存\n');

    expect(hasTable).toBeTruthy();
  });

  // ==================== 权限管理测试 ====================

  test('应能访问权限管理页面', async ({ page }) => {
    console.log('🔑 测试权限管理...');
    await page.goto(`${BASE_URL}/#/systemManage/permissionManagement`);
    await waitForPageLoad(page);

    const hasTree = await checkTreeExists(page);
    console.log('  权限树:', hasTree ? '✅' : '❌');

    await takeScreenshot(page, '07-permission-management');
    console.log('  📸 权限管理截图已保存\n');

    expect(hasTree).toBeTruthy();
  });

  // ==================== API 请求验证测试 ====================

  test('应能正确处理 RBAC API 请求', async ({ page }) => {
    console.log('🌐 测试 RBAC API 请求...');

    // 监听 API 请求
    const apiRequests = [];

    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/') || url.includes('/rbac/')) {
        apiRequests.push({
          method: request.method(),
          url: url,
          resource: url.split('/').pop()
        });
      }
    });

    // 访问用户管理页面
    await page.goto(`${BASE_URL}/#/systemManage/userManagement`);
    await waitForPageLoad(page);

    // 等待 API 请求
    await page.waitForTimeout(2000);

    console.log('  捕获到的 API 请求:');
    if (apiRequests.length > 0) {
      apiRequests.forEach(req => {
        console.log(`    ${req.method} ${req.resource}`);
      });
      console.log(`  ✅ 共 ${apiRequests.length} 个 API 请求\n`);
    } else {
      console.log('  ⚠️ 未捕获到 API 请求\n');
    }

    // 验证至少有一些 API 请求
    expect(apiRequests.length).toBeGreaterThan(0);
  });

  // ==================== 响应式测试 ====================

  test('应能正确处理响应式布局', async ({ page }) => {
    console.log('📱 测试响应式布局...');

    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${BASE_URL}/#/systemManage/userManagement`);
      await waitForPageLoad(page);

      const hasTable = await checkTableExists(page);
      console.log(`  ${vp.name} (${vp.width}x${vp.height}):`, hasTable ? '✅' : '❌');

      await page.screenshot({ path: `test-results/responsive-${vp.name.toLowerCase()}.png` });
    }

    console.log('  📸 响应式截图已保存\n');
  });

  // ==================== 综合测试 ====================

  test('RBAC 功能完整性检查', async ({ page }) => {
    console.log('🔍 RBAC 功能完整性检查...\n');

    const pages = [
      { path: '#/systemManage/userManagement', name: '用户管理', hasTable: true },
      { path: '#/systemManage/roleManagement', name: '角色管理', hasTable: true },
      { path: '#/systemManage/departmentManagement', name: '部门管理', hasTree: true },
      { path: '#/systemManage/positionManagement', name: '岗位管理', hasTable: true },
      { path: '#/systemManage/tenantManagement', name: '租户管理', hasTable: true },
      { path: '#/systemManage/permissionManagement', name: '权限管理', hasTree: true },
    ];

    const results = [];

    for (const pg of pages) {
      await page.goto(`${BASE_URL}/${pg.path}`);
      await waitForPageLoad(page);

      let valid = false;
      if (pg.hasTable) {
        valid = await checkTableExists(page);
      } else if (pg.hasTree) {
        valid = await checkTreeExists(page);
      }

      results.push({ name: pg.name, valid });
      console.log(`  ${pg.name}:`, valid ? '✅ 通过' : '❌ 失败');
    }

    console.log('\n📊 测试结果汇总:');
    console.log(`  总计: ${results.length} 个模块`);
    console.log(`  通过: ${results.filter(r => r.valid).length} 个`);
    console.log(`  失败: ${results.filter(r => !r.valid).length} 个`);

    // 所有模块都应该通过
    results.forEach(r => {
      expect(r.valid).toBeTruthy();
    });
  });
});
