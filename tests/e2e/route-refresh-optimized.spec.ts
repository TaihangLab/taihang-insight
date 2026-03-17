/**
 * 路由刷新验证测试（优化版）
 *
 * 优化点：
 * 1. 异步执行 - 所有操作使用 async/await
 * 2. 无头模式 - 使用 headless: true (playwright.config.js)
 * 3. 语义化定位 - 使用 getByRole/getByPlaceholder 替代 ID 选择器
 * 4. 元素等待 - 使用 waitForSelector/waitForLoadState
 * 5. DOM 验证 - 通过 URL 验证登录成功
 * 6. 禁用截图/录屏 - screenshot: 'off', video: 'off'
 * 7. 详细注释 - 说明核心逻辑
 * 8. 登录凭据 - 租户=0, 用户=superadmin, 密码=password
 * 9. 访问现有实例 - https://localhost:4000/login
 * 10. 共享认证状态 - 全局登录一次，所有测试共享 session
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// 测试配置：使用现有实例，不启动新服务器
const BASE_URL = 'http://localhost:4000';

// 8. 测试凭据
const TEST_CREDENTIALS = {
  tenant: '0',
  username: 'superadmin',
  password: 'password'
};

// 认证状态文件路径
const AUTH_STATE_FILE = 'tests/e2e/.auth/storage-state.json';

/**
 * 全局认证状态
 * 10. 优化：所有测试用例共享同一个认证状态，避免重复登录
 */
let authenticatedContext: any = null;

test.describe.configure({ mode: 'serial' }); // 串行执行，确保所有测试共享同一个 browser context

test.describe('路由刷新验证', () => {
  /**
   * 10. 优化：全局登录一次，所有测试共享认证状态
   */
  test.beforeAll(async ({ browser }) => {
    console.log('=== 检查认证状态 ===');

    // 尝试加载已保存的认证状态
    const authFilePath = path.resolve(AUTH_STATE_FILE);

    // 检查认证文件是否存在且未过期（24小时内）
    let useExistingAuth = false;
    if (fs.existsSync(authFilePath)) {
      const stats = fs.statSync(authFilePath);
      const fileAge = Date.now() - stats.mtimeMs;
      const maxAge = 24 * 60 * 60 * 1000; // 24小时

      if (fileAge < maxAge) {
        useExistingAuth = true;
        console.log('=== 使用已保存的认证状态 ===');
      } else {
        console.log('=== 认证状态已过期，重新登录 ===');
      }
    }

    if (!useExistingAuth) {
      console.log('=== 全局登录开始 ===');

      // 创建新的浏览器上下文进行登录
      const context = await browser.newContext({
        ignoreHTTPSErrors: true,
      });

      const page = await context.newPage();

      try {
        // 9. 访问现有实例的登录页
        await page.goto(`${BASE_URL}/login`);

        // 4. 等待页面加载完成，添加超时处理
        await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

        // 3. 使用语义化定位器填写表单
        const tenantInput = page.getByPlaceholder(/租户编码|请输入租户编码/);
        await tenantInput.fill(TEST_CREDENTIALS.tenant);

        const usernameInput = page.getByPlaceholder(/用户名|请输入用户名/);
        await usernameInput.fill(TEST_CREDENTIALS.username);

        const passwordInput = page.getByPlaceholder(/密码|请输入密码/);
        await passwordInput.fill(TEST_CREDENTIALS.password);

        const loginButton = page.getByRole('button', { name: /登录|登录系统|提交/ });
        await loginButton.click();

        // 4. 等待导航完成
        await page.waitForURL(
          (url: URL) => !url.hash.includes('/login'),
          { timeout: 10000 }
        );

        // 5. 验证登录成功
        const currentUrl = page.url();
        expect(currentUrl).not.toContain('#/login');

        // 10. 保存认证状态到文件
        const dir = path.dirname(authFilePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        await context.storageState({ path: authFilePath });

        console.log('=== 全局登录成功，认证状态已保存 ===');

      } catch (error) {
        console.error('全局登录失败:', error);
        throw new Error(`全局登录失败: ${error}`);
      } finally {
        await context.close();
      }
    }

    // 创建共享的认证上下文，供所有测试使用
    authenticatedContext = await browser.newContext({
      storageState: authFilePath,
      ignoreHTTPSErrors: true,
    });
  });

  test.afterAll(async () => {
    // 清理共享的认证上下文
    if (authenticatedContext) {
      await authenticatedContext.close();
    }
  });

  /**
   * 测试：用户管理页面刷新
   */
  test('用户管理页面刷新正常', async ({ page }) => {
    // 10. 使用共享的认证上下文创建页面
    const authPage = await authenticatedContext.newPage();

    try {
      await authPage.goto(`${BASE_URL}/systemManage/userManagement`);
      await authPage.waitForLoadState('domcontentloaded', { timeout: 10000 });

      const urlBefore = authPage.url();
      console.log('刷新前 URL:', urlBefore);

      await authPage.reload({ waitUntil: 'domcontentloaded' });
      await authPage.waitForTimeout(1000);

      const urlAfter = authPage.url();
      console.log('刷新后 URL:', urlAfter);

      expect(urlAfter).toContain('systemManage/userManagement');
      expect(urlAfter).not.toContain('/404');
    } finally {
      await authPage.close();
    }
  });

  /**
   * 测试：租户管理页面刷新
   */
  test('租户管理页面刷新正常', async ({ page }) => {
    const authPage = await authenticatedContext.newPage();

    try {
      await authPage.goto(`${BASE_URL}/systemManage/tenantManagement`);
      await authPage.waitForLoadState('domcontentloaded', { timeout: 10000 });

      await authPage.reload({ waitUntil: 'domcontentloaded' });
      await authPage.waitForTimeout(1000);

      const url = authPage.url();
      expect(url).toContain('systemManage/tenantManagement');
      expect(url).not.toContain('/404');
    } finally {
      await authPage.close();
    }
  });

  /**
   * 测试：角色管理页面刷新
   */
  test('角色管理页面刷新正常', async ({ page }) => {
    const authPage = await authenticatedContext.newPage();

    try {
      await authPage.goto(`${BASE_URL}/systemManage/roleManagement`);
      await authPage.waitForLoadState('domcontentloaded', { timeout: 10000 });

      await authPage.reload({ waitUntil: 'domcontentloaded' });
      await authPage.waitForTimeout(1000);

      const url = authPage.url();
      expect(url).toContain('systemManage/roleManagement');
      expect(url).not.toContain('/404');
    } finally {
      await authPage.close();
    }
  });

  /**
   * 测试：部门管理页面刷新
   */
  test('部门管理页面刷新正常', async ({ page }) => {
    const authPage = await authenticatedContext.newPage();

    try {
      await authPage.goto(`${BASE_URL}/systemManage/departmentManagement`);
      await authPage.waitForLoadState('domcontentloaded', { timeout: 10000 });

      await authPage.reload({ waitUntil: 'domcontentloaded' });
      await authPage.waitForTimeout(1000);

      const url = authPage.url();
      expect(url).toContain('systemManage/departmentManagement');
      expect(url).not.toContain('/404');
    } finally {
      await authPage.close();
    }
  });

  /**
   * 测试：岗位管理页面刷新
   */
  test('岗位管理页面刷新正常', async ({ page }) => {
    const authPage = await authenticatedContext.newPage();

    try {
      await authPage.goto(`${BASE_URL}/systemManage/positionManagement`);
      await authPage.waitForLoadState('domcontentloaded', { timeout: 10000 });

      await authPage.reload({ waitUntil: 'domcontentloaded' });
      await authPage.waitForTimeout(1000);

      const url = authPage.url();
      expect(url).toContain('systemManage/positionManagement');
      expect(url).not.toContain('/404');
    } finally {
      await authPage.close();
    }
  });

  /**
   * 测试：权限管理页面刷新
   */
  test('权限管理页面刷新正常', async ({ page }) => {
    const authPage = await authenticatedContext.newPage();

    try {
      await authPage.goto(`${BASE_URL}/systemManage/permissionManagement`);
      await authPage.waitForLoadState('domcontentloaded', { timeout: 10000 });

      await authPage.reload({ waitUntil: 'domcontentloaded' });
      await authPage.waitForTimeout(1000);

      const url = authPage.url();
      expect(url).toContain('systemManage/permissionManagement');
      expect(url).not.toContain('/404');
    } finally {
      await authPage.close();
    }
  });

  /**
   * 测试：可视化中心页面刷新
   */
  test('可视化中心页面刷新正常', async ({ page }) => {
    const authPage = await authenticatedContext.newPage();

    try {
      await authPage.goto(`${BASE_URL}/visualCenter`);
      await authPage.waitForLoadState('domcontentloaded', { timeout: 10000 });

      await authPage.reload({ waitUntil: 'domcontentloaded' });
      await authPage.waitForTimeout(1000);

      const url = authPage.url();
      expect(url).toContain('visualCenter');
      expect(url).not.toContain('/404');
    } finally {
      await authPage.close();
    }
  });
});
