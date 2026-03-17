/**
 * 简单的租户管理 E2E 测试 - 调试用
 * 用于快速定位问题
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { TenantManagementPage } from './pages/TenantManagementPage';

test('调试：新增租户流程 - 检查表单验证', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const tenantPage = new TenantManagementPage(page);

  // 登录
  console.log('步骤 1: 登录');
  await loginPage.login();
  console.log('登录成功');

  // 导航到租户管理
  console.log('步骤 2: 导航到租户管理');
  await tenantPage.navigateTo();
  console.log('已导航到租户管理');

  // 点击新增
  console.log('步骤 3: 点击新增按钮');
  await tenantPage.clickAddButton();
  await page.waitForTimeout(1000);

  // 填写表单
  console.log('步骤 4: 填写表单');
  const tenantName = `调试测试_${Date.now()}`;
  await page.fill('input[placeholder*="租户名称"]', tenantName);
  await page.fill('input[placeholder*="企业名称"]', '调试企业');
  await page.fill('input[placeholder*="联系人"]', '调试联系人');
  await page.fill('input[placeholder*="联系电话"]', '13800138000');
  await page.fill('input[placeholder*="系统用户名"]', 'debug_admin');
  await page.fill('input[placeholder*="密码"]', '123456');
  console.log('表单已填写');

  // 检查表单验证状态
  await page.waitForTimeout(500);

  // 尝试获取所有表单项的错误信息
  const formItems = await page.locator('.el-form-item').count();
  console.log(`表单项数量: ${formItems}`);

  const errorMessages = page.locator('.el-form-item__error');
  const errorCount = await errorMessages.count();
  console.log(`错误消息数量: ${errorCount}`);

  if (errorCount > 0) {
    for (let i = 0; i < errorCount; i++) {
      const errorText = await errorMessages.nth(i).textContent();
      console.log(`错误 ${i + 1}: ${errorText}`);
    }
  }

  // 截图查看表单状态
  await page.screenshot({
    path: 'test-results/debug-form-before-submit.png'
  });
  console.log('已保存截图: test-results/debug-form-before-submit.png');

  // 提交
  console.log('步骤 5: 提交表单');
  await page.click('.el-dialog__footer button:has-text("确定")');
  console.log('提交按钮已点击');

  // 等待并检查状态
  await page.waitForTimeout(3000);

  // 截图查看提交后的状态
  await page.screenshot({
    path: 'test-results/debug-after-submit.png'
  });
  console.log('已保存截图: test-results/debug-after-submit.png');

  // 检查对话框状态
  const dialogVisible = await page.locator('.el-dialog').count() > 0;
  console.log(`对话框仍然可见: ${dialogVisible}`);

  // 检查所有消息
  const allMessages = page.locator('.el-message');
  const messageCount = await allMessages.count();
  console.log(`消息数量: ${messageCount}`);

  for (let i = 0; i < messageCount; i++) {
    const msgEl = allMessages.nth(i);
    const msgType = await msgEl.evaluate(el => {
      return el.className;
    });
    const msgText = await msgEl.textContent();
    console.log(`消息 ${i + 1} [${msgType}]: ${msgText}`);
  }

  // 检查网络请求
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log(`API 请求: ${response.url()} - 状态: ${response.status()}`);
    }
  });

  // 如果对话框仍然可见，尝试关闭它
  if (dialogVisible) {
    console.log('尝试关闭对话框');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
  }

  // 等待观察
  console.log('测试完成，等待 5 秒观察...');
  await page.waitForTimeout(5000);
});
