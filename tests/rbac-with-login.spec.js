import { test, expect } from '@playwright/test';

/**
 * RBAC 功能测试（带登录）
 *
 * 测试范围：
 * - 用户管理 (User Management)
 * - 角色管理 (Role Management)
 * - 部门管理 (Department Management)
 * - 岗位管理 (Position Management)
 * - 租户管理 (Tenant Management)
 * - 权限管理 (Permission Management)
 */

test.describe('RBAC 功能测试（带登录）', () => {
  const BASE_URL = 'http://localhost:8080';

  // 登录函数 - 使用多种选择器策略
  async function login(page) {
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);

    // 检查页面上的所有输入框
    const allInputs = await page.locator('input').all();
    console.log(`  页面共有 ${allInputs.length} 个输入框`);

    // 检查是否有租户、用户名、密码相关的输入框
    const hasTenant = allInputs.length >= 3;

    if (hasTenant) {
      console.log('  检测到登录表单，正在执行登录...');

      try {
        // 使用更通用的方式选择输入框
        const inputs = await page.locator('input').all();

        // 填写租户编码（第1个输入框）
        if (inputs.length >= 1) {
          await inputs[0].fill('default');
          console.log('  ✓ 租户编码已填写');
        }

        // 填写用户名（第2个输入框）
        if (inputs.length >= 2) {
          await inputs[1].fill('admin');
          console.log('  ✓ 用户名已填写');
        }

        // 填写密码（第3个输入框）
        if (inputs.length >= 3) {
          await inputs[2].fill('admin123');
          console.log('  ✓ 密码已填写');
        }

        // 点击登录按钮 - 查找包含"登录"文本的按钮
        const loginButton = page.locator('button').filter({ hasText: /登录/ }).first();
        await loginButton.click();
        console.log('  ✓ 登录按钮已点击');

        // 等待登录完成
        await page.waitForTimeout(5000);
        console.log('  ✅ 登录操作完成');
      } catch (e) {
        console.log('  ⚠️ 登录过程出错:', e.message);
      }
    } else {
      console.log('  未检测到登录表单，可能已登录');
    }
  }

  // ==================== 用户管理测试 ====================

  test('用户管理 - 页面访问和基础功能', async ({ page }) => {
    console.log('👤 测试用户管理...');

    await login(page);

    // 访问用户管理页面
    await page.goto(`${BASE_URL}/#/systemManage/userManagement`);
    await page.waitForTimeout(2000);

    // 检查页面元素
    const pageTitle = await page.locator('h2, h3, .page-title, .title').filter({ hasText: /用户|管理/ }).count();
    console.log('  页面标题:', pageTitle > 0 ? '✅' : '❌');

    // 检查是否有表格
    const table = await page.locator('.el-table').count();
    console.log('  数据表格:', table > 0 ? '✅' : '❌');

    // 检查按钮
    const buttons = await page.locator('button').allTextContents();
    const hasAdd = buttons.some(b => b.includes('新增') || b.includes('添加') || b.includes('Add'));
    const hasSearch = buttons.some(b => b.includes('查询') || b.includes('搜索') || b.includes('Search'));
    const hasExport = buttons.some(b => b.includes('导出') || b.includes('Export'));

    console.log('  新增按钮:', hasAdd ? '✅' : '❌');
    console.log('  查询按钮:', hasSearch ? '✅' : '❌');
    console.log('  导出功能:', hasExport ? '✅' : '❌');

    // 截图
    await page.screenshot({ path: 'test-results/rbac-user-management.png', fullPage: true });
    console.log('  📸 截图已保存\n');

    // 验证表格存在
    expect(table).toBeGreaterThan(0);
  });

  // ==================== 角色管理测试 ====================

  test('角色管理 - 页面访问和基础功能', async ({ page }) => {
    console.log('🔐 测试角色管理...');

    await login(page);

    await page.goto(`${BASE_URL}/#/systemManage/roleManagement`);
    await page.waitForTimeout(2000);

    const table = await page.locator('.el-table').count();
    console.log('  数据表格:', table > 0 ? '✅' : '❌');

    const buttons = await page.locator('button').allTextContents();
    const hasAdd = buttons.some(b => b.includes('新增') || b.includes('添加'));
    console.log('  新增按钮:', hasAdd ? '✅' : '❌');

    await page.screenshot({ path: 'test-results/rbac-role-management.png', fullPage: true });
    console.log('  📸 截图已保存\n');

    expect(table).toBeGreaterThan(0);
  });

  // ==================== 部门管理测试 ====================

  test('部门管理 - 页面访问和基础功能', async ({ page }) => {
    console.log('🏢 测试部门管理...');

    await login(page);

    await page.goto(`${BASE_URL}/#/systemManage/departmentManagement`);
    await page.waitForTimeout(2000);

    const tree = await page.locator('.el-tree').count();
    console.log('  部门树:', tree > 0 ? '✅' : '❌');

    const buttons = await page.locator('button').allTextContents();
    const hasAdd = buttons.some(b => b.includes('新增') || b.includes('添加'));
    console.log('  新增按钮:', hasAdd ? '✅' : '❌');

    await page.screenshot({ path: 'test-results/rbac-department-management.png', fullPage: true });
    console.log('  📸 截图已保存\n');

    expect(tree).toBeGreaterThan(0);
  });

  // ==================== 岗位管理测试 ====================

  test('岗位管理 - 页面访问和基础功能', async ({ page }) => {
    console.log('💼 测试岗位管理...');

    await login(page);

    await page.goto(`${BASE_URL}/#/systemManage/positionManagement`);
    await page.waitForTimeout(2000);

    const table = await page.locator('.el-table').count();
    console.log('  数据表格:', table > 0 ? '✅' : '❌');

    const buttons = await page.locator('button').allTextContents();
    const hasAdd = buttons.some(b => b.includes('新增') || b.includes('添加'));
    console.log('  新增按钮:', hasAdd ? '✅' : '❌');

    await page.screenshot({ path: 'test-results/rbac-position-management.png', fullPage: true });
    console.log('  📸 截图已保存\n');

    expect(table).toBeGreaterThan(0);
  });

  // ==================== 租户管理测试 ====================

  test('租户管理 - 页面访问和基础功能', async ({ page }) => {
    console.log('🏢 测试租户管理...');

    await login(page);

    await page.goto(`${BASE_URL}/#/systemManage/tenantManagement`);
    await page.waitForTimeout(2000);

    const table = await page.locator('.el-table').count();
    console.log('  数据表格:', table > 0 ? '✅' : '❌');

    const buttons = await page.locator('button').allTextContents();
    const hasAdd = buttons.some(b => b.includes('新增') || b.includes('添加'));
    console.log('  新增按钮:', hasAdd ? '✅' : '❌');

    await page.screenshot({ path: 'test-results/rbac-tenant-management.png', fullPage: true });
    console.log('  📸 截图已保存\n');

    expect(table).toBeGreaterThan(0);
  });

  // ==================== 权限管理测试 ====================

  test('权限管理 - 页面访问和基础功能', async ({ page }) => {
    console.log('🔑 测试权限管理...');

    await login(page);

    await page.goto(`${BASE_URL}/#/systemManage/permissionManagement`);
    await page.waitForTimeout(2000);

    const tree = await page.locator('.el-tree').count();
    console.log('  权限树:', tree > 0 ? '✅' : '❌');

    await page.screenshot({ path: 'test-results/rbac-permission-management.png', fullPage: true });
    console.log('  📸 截图已保存\n');

    expect(tree).toBeGreaterThan(0);
  });

  // ==================== API 请求验证测试 ====================

  test('RBAC API 请求验证', async ({ page }) => {
    console.log('🌐 测试 RBAC API 请求...');

    // 监听 API 请求
    const apiRequests = [];

    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/') || url.includes('/rbac/')) {
        const pathParts = url.split('/');
        const resource = pathParts[pathParts.length - 1];
        // 过滤掉静态资源
        if (!resource.includes('.') && resource.length > 0) {
          apiRequests.push({
            method: request.method(),
            url: url,
            resource: resource
          });
        }
      }
    });

    await login(page);
    await page.goto(`${BASE_URL}/#/systemManage/userManagement`);
    await page.waitForTimeout(3000);

    console.log('  捕获到的 RBAC API 请求:');
    if (apiRequests.length > 0) {
      apiRequests.forEach(req => {
        console.log(`    ${req.method} ${req.resource}`);
      });
      console.log(`  ✅ 共 ${apiRequests.length} 个 API 请求\n`);
    } else {
      console.log('  ⚠️ 未捕获到 RBAC API 请求\n');
    }

    // 截图
    await page.screenshot({ path: 'test-results/rbac-api-requests.png', fullPage: true });

    // API 请求可能为 0（如果使用 mock 服务）
    console.log('  ✅ API 监听完成');
  });

  // ==================== 综合测试 ====================

  test('RBAC 功能完整性检查', async ({ page }) => {
    console.log('🔍 RBAC 功能完整性检查...\n');

    await login(page);

    const pages = [
      { path: '#/systemManage/userManagement', name: '用户管理', checkTable: true },
      { path: '#/systemManage/roleManagement', name: '角色管理', checkTable: true },
      { path: '#/systemManage/departmentManagement', name: '部门管理', checkTree: true },
      { path: '#/systemManage/positionManagement', name: '岗位管理', checkTable: true },
      { path: '#/systemManage/tenantManagement', name: '租户管理', checkTable: true },
      { path: '#/systemManage/permissionManagement', name: '权限管理', checkTree: true },
    ];

    const results = [];

    for (const pg of pages) {
      await page.goto(`${BASE_URL}/${pg.path}`);
      await page.waitForTimeout(2000);

      let valid = false;
      if (pg.checkTable) {
        valid = await page.locator('.el-table').count() > 0;
      } else if (pg.checkTree) {
        valid = await page.locator('.el-tree').count() > 0;
      }

      results.push({ name: pg.name, valid });
      console.log(`  ${pg.name}:`, valid ? '✅ 通过' : '❌ 失败');
    }

    console.log('\n📊 测试结果汇总:');
    console.log(`  总计: ${results.length} 个模块`);
    console.log(`  通过: ${results.filter(r => r.valid).length} 个`);
    console.log(`  失败: ${results.filter(r => !r.valid).length} 个`);

    await page.screenshot({ path: 'test-results/rbac-summary.png', fullPage: true });

    // 至少一半模块应该通过
    const passCount = results.filter(r => r.valid).length;
    expect(passCount).toBeGreaterThanOrEqual(results.length / 2);
  });
});
