/**
 * Playwright E2E 测试 - 基础页面类
 * 提供通用的页面操作方法
 */

import { Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

export class BasePage {
  constructor(protected page: Page) {}

  /**
   * 导航到指定路径
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(`${BASE_URL}${path}`);
  }

  /**
   * 等待页面加载完成
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  /**
   * 等待元素可见
   */
  async waitForVisible(selector: string, timeout = 10000): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
  }

  /**
   * 等待元素可点击
   */
  async waitForClickable(selector: string, timeout = 10000): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'attached', timeout });
  }

  /**
   * 点击元素（使用 data-testid）
   */
  async clickByTestId(testId: string): Promise<void> {
    await this.page.click(`[data-testid="${testId}"]`);
  }

  /**
   * 填写输入框（使用 data-testid）
   */
  async fillByTestId(testId: string, value: string): Promise<void> {
    await this.page.fill(`[data-testid="${testId}"]`, value);
  }

  /**
   * 获取元素文本
   */
  async getText(selector: string): Promise<string> {
    return await this.page.locator(selector).textContent() || '';
  }

  /**
   * 检查元素是否存在
   */
  async exists(selector: string): Promise<boolean> {
    return await this.page.locator(selector).count() > 0;
  }

  /**
   * 截图
   */
  async screenshot(filename: string): Promise<void> {
    await this.page.screenshot({
      path: `test-results/${filename}.png`,
      fullPage: true,
    });
  }

  /**
   * 等待 API 请求
   */
  async waitForApiResponse(urlPattern: string): Promise<void> {
    await this.page.waitForResponse(
      response => response.url().includes(urlPattern),
      { timeout: 10000 }
    );
  }

  /**
   * 获取表格行数
   */
  async getTableRowCount(tableSelector = '.el-table'): Promise<number> {
    return await this.page.locator(`${tableSelector} .el-table-row`).count();
  }

  /**
   * 等待表格加载完成
   */
  async waitForTable(tableSelector = '.el-table', timeout = 10000): Promise<void> {
    await this.page.waitForSelector(tableSelector, { timeout });
    await this.page.waitForSelector(`${tableSelector} .el-table-row`, { timeout });
  }

  /**
   * 检查是否有加载状态
   */
  async hasLoadingState(): Promise<boolean> {
    return await this.exists('.loading') || await this.exists('.el-loading-mask');
  }

  /**
   * 等待加载状态消失
   */
  async waitForLoadingEnd(timeout = 10000): Promise<void> {
    await this.page.waitForSelector('.el-loading-mask', { state: 'hidden', timeout })
      .catch(() => {});
  }
}
