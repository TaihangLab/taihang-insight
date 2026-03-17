/**
 * 可视化中心页面刷新测试
 * 专门测试 F5 刷新后白屏的问题
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:4000';
const AUTH_STATE_FILE = 'tests/e2e/.auth/storage-state.json';

test.describe.configure({ mode: 'serial' });

test.describe('可视化中心页面刷新测试', () => {
  test.beforeAll(async ({ browser }) => {
    console.log('=== 检查认证状态 ===');

    const authFilePath = path.resolve(AUTH_STATE_FILE);
    let useExistingAuth = false;

    if (fs.existsSync(authFilePath)) {
      const stats = fs.statSync(authFilePath);
      const fileAge = Date.now() - stats.mtimeMs;
      const maxAge = 24 * 60 * 60 * 1000;

      if (fileAge < maxAge) {
        useExistingAuth = true;
        console.log('=== 使用已保存的认证状态 ===');
      }
    }

    if (!useExistingAuth) {
      console.log('=== 全局登录开始 ===');

      const context = await browser.newContext({ ignoreHTTPSErrors: true });
      const page = await context.newPage();

      try {
        await page.goto(`${BASE_URL}/login`);
        await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

        await page.getByPlaceholder(/租户编码/).fill('0');
        await page.getByPlaceholder(/用户名/).fill('superadmin');
        await page.getByPlaceholder(/密码/).fill('password');
        await page.getByRole('button', { name: /登录/ }).click();

        await page.waitForURL((url: URL) => !url.hash.includes('/login'), { timeout: 10000 });

        const dir = path.dirname(authFilePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        await context.storageState({ path: authFilePath });

        console.log('=== 全局登录成功 ===');
      } finally {
        await context.close();
      }
    }
  });

  test('直接访问 /visual 页面应该正常显示', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: AUTH_STATE_FILE,
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();

    try {
      // 直接访问 /visual 页面
      await page.goto(`${BASE_URL}/#/visual`);
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
      await page.waitForTimeout(1000);

      const url = page.url();
      console.log('访问 /visual 后的 URL:', url);

      // 检查是否有白屏（body 应该有内容）
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length || 0).toBeGreaterThan(100);

      console.log('✅ /visual 页面正常显示');
    } finally {
      await context.close();
    }
  });

  test('/visual 页面刷新后应该正常显示', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: AUTH_STATE_FILE,
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();

    try {
      // 访问 /visual 页面
      await page.goto(`${BASE_URL}/#/visual`);
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
      await page.waitForTimeout(1000);

      const urlBefore = page.url();
      console.log('刷新前 URL:', urlBefore);

      // 检查刷新前页面内容
      const bodyTextBefore = await page.locator('body').textContent();
      console.log('刷新前页面内容长度:', bodyTextBefore?.length || 0);

      // 模拟 F5 强制刷新
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const urlAfter = page.url();
      console.log('刷新后 URL:', urlAfter);

      // 检查刷新后页面内容（不应该白屏）
      const bodyTextAfter = await page.locator('body').textContent();
      console.log('刷新后页面内容长度:', bodyTextAfter?.length || 0);

      // 验证刷新后不是白屏
      expect(bodyTextAfter?.length || 0).toBeGreaterThan(100);

      console.log('✅ /visual 页面刷新后正常显示');
    } finally {
      await context.close();
    }
  });
});
