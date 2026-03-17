/**
 * Playwright E2E 测试 - 登录页面
 * @see .claude/rules/testing-guide.md
 */

import { BasePage } from './BasePage';

// 默认测试凭据（配置在项目中）
const DEFAULT_CREDENTIALS = {
  tenantCode: '0',
  username: 'superadmin',
  password: 'password',
};

export class LoginPage extends BasePage {
  /**
   * 执行登录操作
   * 优化点：
   * - 使用语义化定位符（placeholder）
   * - 添加元素等待和超时处理
   * - 通过 URL 验证登录成功
   */
  async login(options?: {
    tenantCode?: string;
    username?: string;
    password?: string;
  }): Promise<void> {
    const creds = {
      tenantCode: options?.tenantCode ?? DEFAULT_CREDENTIALS.tenantCode,
      username: options?.username ?? DEFAULT_CREDENTIALS.username,
      password: options?.password ?? DEFAULT_CREDENTIALS.password,
    };

    // 导航到登录页面（不启动新实例，使用现有服务器）
    await this.goto('/#/login');
    await this.waitForPageLoad();

    // 等待登录表单元素可见（语义化定位）
    const tenantInput = this.page.locator('input[placeholder*="租户编码"]');
    const usernameInput = this.page.locator('input[placeholder*="用户名"]');
    const passwordInput = this.page.locator('input[placeholder*="密码"]');
    const loginButton = this.page.locator('.tech-login-btn');

    // 填写登录表单（带超时处理）
    await tenantInput.fill(creds.tenantCode, { timeout: 5000 });
    await usernameInput.fill(creds.username, { timeout: 5000 });
    await passwordInput.fill(creds.password, { timeout: 5000 });

    // 点击登录按钮
    await loginButton.click();

    // 验证登录成功：等待 URL 变化或页面元素出现
    await this.page.waitForTimeout(2000);
    const currentUrl = this.page.url();

    // 通过 URL 验证登录成功（不再包含 /#/login）
    if (currentUrl.includes('/#/login')) {
      throw new Error(`登录失败：仍在登录页面。URL: ${currentUrl}`);
    }
  }

  /**
   * 验证登录成功（通过 URL）
   */
  async expectLoggedIn(): Promise<void> {
    await this.waitForPageLoad();
    const url = this.page.url();
    if (url.includes('/#/login')) {
      throw new Error('登录失败：仍在登录页面');
    }
  }

  /**
   * 验证登录失败
   * 优化点：添加超时处理和语义化定位
   */
  async expectLoginError(message?: string): Promise<void> {
    const errorLocator = this.page.locator('.el-message--error, .error-message');
    await errorLocator.waitFor({ state: 'visible', timeout: 5000 });
    if (message) {
      const text = await errorLocator.textContent();
      if (!text?.includes(message)) {
        throw new Error(`错误消息不包含: ${message}`);
      }
    }
  }
}
