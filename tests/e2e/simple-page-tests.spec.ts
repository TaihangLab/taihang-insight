/**
 * 简单的页面访问测试
 * 不依赖 Token，只测试页面能否正常加载
 */

import { test, expect } from '@playwright/test';

test.describe('页面访问测试', () => {
  test('应该能够访问登录页面', async ({ page }) => {
    await page.goto('/#/login');
    await page.waitForLoadState('networkidle');
    
    // 验证登录页面加载
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
  });

  test('应该能够访问首页', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 首页应该重定向到登录页或可视化中心
    const url = page.url();
    expect(url).toMatch(/login|visualCenter/);
  });
});
