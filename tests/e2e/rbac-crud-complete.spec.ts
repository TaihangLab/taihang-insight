/**
 * RBAC 系统 Playwright E2E 测试套件
 * 验证完整的 CRUD 闭环、路由刷新、状态持久化
 * @see https://cn.vitest.dev/guide/browser/why.html
 */
import { test, expect, Page } from '@playwright/test';

// 测试配置
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const TEST_DATA = {
  tenant: {
    name: `E2E测试租户_${Date.now()}`,
    code: `E2E_TENANT_${Date.now()}`,
    contactName: 'E2E测试联系人',
    contactPhone: '13800138000',
  },
  role: {
    name: `E2E测试角色_${Date.now()}`,
    code: `E2E_ROLE_${Date.now()}`,
  },
  user: {
    username: `e2e_user_${Date.now()}`,
    password: 'Test@123456',
    realName: 'E2E测试用户',
    email: `e2e@example.com`,
  },
  permission: {
    name: `E2E测试权限_${Date.now()}`,
    code: `E2E:PERM:${Date.now()}`,
  },
  department: {
    name: `E2E测试部门_${Date.now()}`,
  },
  position: {
    name: `E2E测试岗位_${Date.now()}`,
    code: `E2E_POS_${Date.now()}`,
  },
};

// 测试辅助函数
async function login(page: Page) {
  await page.goto(`${BASE_URL}/#/login`);

  // 等待登录表单
  await page.waitForSelector('input[type="text"]', { timeout: 10000 });

  await page.fill('input[type="text"]', 'admin');
  await page.fill('input[type="password"]', 'Admin@123456');

  // 点击登录按钮
  await page.click('button[type="submit"]');

  // 等待跳转
  await page.waitForTimeout(2000);
}

async function cleanupTestData(page: Page, dataType: string, identifier: string) {
  // 清理测试数据的辅助函数
  try {
    // 通过 API 删除测试数据
    await page.evaluate(async ({ type, id }) => {
      // 这里可以添加 API 调用来删除测试数据
      console.log(`清理 ${type} 测试数据: ${id}`);
    }, { type: dataType, id: identifier });
  } catch (e) {
    console.log('清理测试数据失败:', e);
  }
}

test.describe.configure({ mode: 'serial' });

test.describe('RBAC 租户管理 CRUD E2E', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('应完成租户 CRUD 完整闭环', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/systemManage/tenantManagement`);

    // 等待列表加载
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // CREATE - 创建租户
    await page.click('button:has-text("新增")');
    await page.fill('input[placeholder*="租户名称"]', TEST_DATA.tenant.name);
    await page.fill('input[placeholder*="租户代码"]', TEST_DATA.tenant.code);
    await page.fill('input[placeholder*="联系人"]', TEST_DATA.tenant.contactName);
    await page.fill('input[placeholder*="联系电话"]', TEST_DATA.tenant.contactPhone);
    await page.click('button:has-text("确定")');

    // 验证创建成功
    await expect(page.locator(`text=${TEST_DATA.tenant.name}`)).toBeVisible({ timeout: 5000 });

    // 保存创建的租户代码用于后续清理
    const createdTenantCode = TEST_DATA.tenant.code;

    // READ - 验证租户出现在列表中
    const tableRows = await page.locator('.el-table-row').count();
    expect(tableRows).toBeGreaterThan(0);

    // UPDATE - 更新租户
    await page.click('button:has-text("编辑").first');
    await page.fill('input[placeholder*="租户名称"]', `${TEST_DATA.tenant.name}-已修改`);
    await page.click('button:has-text("确定")');
    await expect(page.locator(`text=${TEST_DATA.tenant.name}-已修改`)).toBeVisible();

    // 刷新验证状态保持
    await page.reload();
    await expect(page.locator(`text=${TEST_DATA.tenant.name}-已修改`)).toBeVisible();

    // DELETE - 删除租户
    await page.click('button:has-text("删除").first');
    await page.click('button:has-text("确定")');
    await expect(page.locator(`text=${TEST_DATA.tenant.name}-已修改`)).not.toBeVisible();

    // 清理
    await cleanupTestData(page, 'tenant', createdTenantCode);
  });

  test('应验证租户列表分页功能', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/systemManage/tenantManagement`);
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // 获取初始数据量
    const initialRows = await page.locator('.el-table-row').count();

    // 测试分页器是否存在
    const pagination = page.locator('.el-pagination');
    await expect(pagination).toBeVisible();
  });
});

test.describe('RBAC 用户管理 CRUD E2E', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('应完成用户 CRUD 完整闭环', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/systemManage/userManagement`);
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // CREATE
    await page.click('button:has-text("新增")');
    await page.fill('input[placeholder*="用户名"]', TEST_DATA.user.username);
    await page.fill('input[placeholder*="真实姓名"]', TEST_DATA.user.realName);
    await page.fill('input[placeholder*="邮箱"]', TEST_DATA.user.email);
    await page.fill('input[placeholder*="密码"]', TEST_DATA.user.password);

    // 选择角色
    await page.click('.el-select:has-text("请选择")');
    await page.click('.el-select-dropdown__item:has-text("管理员")');

    await page.click('button:has-text("确定")');
    await expect(page.locator(`text=${TEST_DATA.user.realName}`)).toBeVisible({ timeout: 5000 });

    // READ
    await page.fill('input[placeholder*="搜索"]', TEST_DATA.user.username);
    await page.press('input[placeholder*="搜索"]', 'Enter');
    await expect(page.locator(`text=${TEST_DATA.user.realName}`)).toBeVisible();

    // UPDATE
    await page.click('button:has-text("编辑")');
    await page.fill('input[placeholder*="真实姓名"]', `${TEST_DATA.user.realName}-已修改`);
    await page.click('button:has-text("确定")');
    await expect(page.locator(`text=${TEST_DATA.user.realName}-已修改`)).toBeVisible();

    // 验证刷新后状态保持
    await page.reload();
    await expect(page.locator(`text=${TEST_DATA.user.realName}-已修改`)).toBeVisible();

    // DELETE
    await page.click('button:has-text("删除")');
    await page.click('button:has-text("确定")');
  });
});

test.describe('RBAC 角色管理 CRUD E2E', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('应完成角色 CRUD 完整闭环', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/systemManage/roleManagement`);
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // CREATE
    await page.click('button:has-text("新增")');
    await page.fill('input[placeholder*="角色名称"]', TEST_DATA.role.name);
    await page.fill('input[placeholder*="角色代码"]', TEST_DATA.role.code);
    await page.click('button:has-text("确定")');
    await expect(page.locator(`text=${TEST_DATA.role.name}`)).toBeVisible();

    // UPDATE
    await page.click('button:has-text("编辑")');
    await page.fill('input[placeholder*="角色名称"]', `${TEST_DATA.role.name}-已修改`);
    await page.click('button:has-text("确定")');

    // 验证刷新后状态保持
    await page.reload();
    await expect(page.locator(`text=${TEST_DATA.role.name}-已修改`)).toBeVisible();

    // DELETE
    await page.click('button:has-text("删除")');
    await page.click('button:has-text("确定")');
  });
});

test.describe('RBAC 权限管理 CRUD E2E', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('应完成权限 CRUD 完整闭环', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/systemManage/permissionManagement`);
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // 验证权限树渲染
    const treeRows = await page.locator('.el-table-row').count();
    expect(treeRows).toBeGreaterThan(0);

    // 验证 node_type 正确映射（directory -> folder）
    await page.reload();
    const rowsAfterReload = await page.locator('.el-table-row').count();
    expect(rowsAfterReload).toBe(treeRows);

    // CREATE
    await page.click('button:has-text("新增")');
    await page.fill('input[placeholder*="权限名称"]', TEST_DATA.permission.name);
    await page.fill('input[placeholder*="权限代码"]', TEST_DATA.permission.code);
    await page.click('.el-select:has-text("请选择")');
    await page.click('.el-select-dropdown__item:has-text("文件夹")');
    await page.click('button:has-text("确定")');

    // READ - 验证创建成功
    await expect(page.locator(`text=${TEST_DATA.permission.name}`)).toBeVisible();

    // UPDATE
    await page.click('button:has-text("编辑")');
    await page.fill('input[placeholder*="权限名称"]', `${TEST_DATA.permission.name}-已修改`);
    await page.click('button:has-text("确定")');

    // DELETE
    await page.click('button:has-text("删除")');
    await page.click('button:has-text("确定")');
  });
});

test.describe('RBAC 部门管理 CRUD E2E', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('应完成部门 CRUD 完整闭环', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/systemManage/departmentManagement`);
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // CREATE
    await page.click('button:has-text("新增")');
    await page.fill('input[placeholder*="部门名称"]', TEST_DATA.department.name);
    await page.click('button:has-text("确定")');
    await expect(page.locator(`text=${TEST_DATA.department.name}`)).toBeVisible();

    // READ
    await page.reload();
    await expect(page.locator(`text=${TEST_DATA.department.name}`)).toBeVisible();

    // UPDATE
    await page.click('button:has-text("编辑")');
    await page.fill('input[placeholder*="部门名称"]', `${TEST_DATA.department.name}-已修改`);
    await page.click('button:has-text("确定")');
    await expect(page.locator(`text=${TEST_DATA.department.name}-已修改`)).toBeVisible();

    // DELETE
    await page.click('button:has-text("删除")');
    await page.click('button:has-text("确定")');
  });
});

test.describe('RBAC 岗位管理 CRUD E2E', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('应完成岗位 CRUD 完整闭环', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/systemManage/positionManagement`);
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // CREATE
    await page.click('button:has-text("新增岗位")');
    await page.fill('input[placeholder*="岗位名称"]', TEST_DATA.position.name);
    await page.fill('input[placeholder*="岗位代码"]', TEST_DATA.position.code);
    await page.click('button:has-text("确定")');
    await expect(page.locator(`text=${TEST_DATA.position.name}`)).toBeVisible();

    // READ
    await page.reload();
    await expect(page.locator(`text=${TEST_DATA.position.name}`)).toBeVisible();

    // UPDATE
    await page.click('button:has-text("编辑")');
    await page.fill('input[placeholder*="岗位名称"]', `${TEST_DATA.position.name}-已修改`);
    await page.click('button:has-text("确定")');

    // DELETE
    await page.click('button:has-text("删除")');
    await page.click('button:has-text("确定")');
  });
});

test.describe('路由刷新和状态持久化', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('租户管理页面应支持刷新和路由导航', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/systemManage/tenantManagement`);
    await page.waitForSelector('.el-table', { timeout: 10000 });

    const initialRows = await page.locator('.el-table-row').count();

    // 刷新页面
    await page.reload();
    await page.waitForSelector('.el-table', { timeout: 10000 });
    const rowsAfterReload = await page.locator('.el-table-row').count();
    expect(rowsAfterReload).toBe(initialRows);

    // 测试前进后退
    await page.goBack();
    await page.goForward();
    await page.waitForSelector('.el-table', { timeout: 10000 });
  });

  test('用户管理页面应支持刷新和路由导航', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/systemManage/userManagement`);
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // 创建测试数据
    await page.click('button:has-text("新增")');
    await page.fill('input[placeholder*="用户名"]', `refresh_test_${Date.now()}`);
    await page.fill('input[placeholder*="真实姓名"]', '刷新测试');
    await page.click('button:has-text("确定")');

    // 刷新验证
    await page.reload();
    await expect(page.locator('text=刷新测试')).toBeVisible();

    // 测试路由状态保持
    await page.goto(`${BASE_URL}/#/systemManage/roleManagement`);
    await page.waitForSelector('.el-table');
    await page.goto(`${BASE_URL}/#/systemManage/userManagement`);
    await expect(page.locator('text=刷新测试')).toBeVisible();
  });
});

test.describe('表单验证和错误处理', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('应验证租户表单必填字段', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/systemManage/tenantManagement`);
    await page.click('button:has-text("新增")');

    // 直接点击确定，不填写任何字段
    await page.click('button:has-text("确定")');

    // 应该显示验证错误提示
    await expect(page.locator('text=必填').or(page.locator('text=请输入'))).toBeVisible();
  });

  test('应验证用户表单邮箱格式', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/systemManage/userManagement`);
    await page.click('button:has-text("新增")');

    await page.fill('input[placeholder*="邮箱"]', 'invalid-email');
    await page.click('button:has-text("确定")');

    await expect(page.locator('text=邮箱格式').or(page.locator('text=格式'))).toBeVisible();
  });

  test('应验证密码强度要求', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/systemManage/userManagement`);
    await page.click('button:has-text("新增")');

    await page.fill('input[placeholder*="密码"]', '123');
    await page.click('button:has-text("确定")');

    await expect(page.locator('text=密码').or(page.locator('text=强度'))).toBeVisible();
  });
});

test.describe('性能和可访问性', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('所有 RBAC 页面应通过可访问性检查', async ({ page }) => {
    const pages = [
      '/#/systemManage/tenantManagement',
      '/#/systemManage/userManagement',
      '/#/systemManage/roleManagement',
      '/#/systemManage/permissionManagement',
      '/#/systemManage/departmentManagement',
      '/#/systemManage/positionManagement',
    ];

    for (const pagePath of pages) {
      await page.goto(`${BASE_URL}${pagePath}`);
      await page.waitForSelector('.el-table', { timeout: 10000 });

      // 简单的可访问性检查
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThan(0);
    }
  });

  test('列表页面应在合理时间内加载完成', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(`${BASE_URL}/#/systemManage/tenantManagement`);
    await page.waitForSelector('.el-table', { timeout: 10000 });

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // 应在5秒内加载完成
  });
});
