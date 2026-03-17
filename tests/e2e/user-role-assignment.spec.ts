/**
 * 用户角色分配功能 E2E 测试
 *
 * 测试场景：
 * 1. 打开用户管理页面
 * 2. 点击"授权"按钮
 * 3. 验证角色列表正确加载
 * 4. 选择/取消选择角色
 * 5. 提交分配
 * 6. 验证分配成功
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('用户角色分配', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    // 登录
    await loginPage.login();
  });

  /**
   * 辅助函数：打开用户角色分配对话框
   */
  async function openRoleDialog(page: any) {
    await page.goto('/#/systemManage/userManagement');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 等待用户列表加载
    await page.waitForSelector('.el-table__body-wrapper .el-table__row', { timeout: 10000 });

    // 获取第一个用户行的所有单元格内容
    const firstRow = page.locator('.el-table__body-wrapper .el-table__row').first();
    const cells = await firstRow.locator('.el-table__cell').all();
    const cellTexts: string[] = [];
    for (const cell of cells) {
      cellTexts.push(await cell.textContent());
    }
    console.log('用户行数据:', cellTexts);

    // 监听网络请求
    page.on('response', async (response: any) => {
      if (response.url().includes('/roles') || response.url().includes('/user-roles')) {
        console.log('API 响应:', response.url(), response.status());
        try {
          const body = await response.json();
          console.log('响应体:', JSON.stringify(body).substring(0, 500));
        } catch (e) {
          console.log('响应体解析失败');
        }
      }
    });

    // 找到第一个用户并点击"授权"
    await firstRow.locator('button:has-text("授权")').click();

    // 等待对话框打开
    await page.waitForSelector('.el-dialog:has-text("分配角色")', { timeout: 5000 });

    // 额外等待角色数据加载
    await page.waitForTimeout(2000);
  }

  test('应该正确加载并显示角色列表', async ({ page }) => {
    // 监听控制台日志
    page.on('console', (msg: any) => {
      if (msg.type() === 'log') {
        console.log('浏览器控制台:', msg.text());
      }
    });

    await openRoleDialog(page);

    // 验证用户名称显示
    const userName = page.locator('.el-dialog .el-form-item:has-text("用户名称") span:last-child');
    await expect(userName).toBeVisible();

    // 验证角色搜索框存在
    const searchInput = page.locator('.role-search input[placeholder*="角色名称"]');
    await expect(searchInput).toBeVisible();

    // 验证角色列表容器存在
    const roleListContainer = page.locator('.role-list-container');
    await expect(roleListContainer).toBeVisible();

    // 调试：检查容器内容
    const containerHTML = await roleListContainer.innerHTML();
    console.log('角色列表容器 HTML:', containerHTML.substring(0, 500));

    // 验证复选框存在（至少有一个角色）
    const checkboxes = page.locator('.role-list-container .el-checkbox');
    const checkboxCount = await checkboxes.count();

    console.log('角色数量:', checkboxCount);

    // 如果角色数量为0，检查是否有错误消息
    if (checkboxCount === 0) {
      // 检查是否有 el-checkbox-group
      const checkboxGroup = page.locator('.role-list-container .el-checkbox-group');
      const groupExists = await checkboxGroup.count();
      console.log('checkbox-group 数量:', groupExists);

      // 检查是否有任何内容
      const hasContent = containerHTML.length > 0;
      console.log('容器有内容:', hasContent);

      // 尝试检查是否有 el-checkbox（不在 group 内）
      const allCheckboxes = await page.locator('.role-list-container label').count();
      console.log('所有 label 数量:', allCheckboxes);
    }

    expect(checkboxCount).toBeGreaterThan(0);

    // 关闭对话框
    await page.click('.el-dialog .el-button:has-text("取消")');
  });

  test('应该能够搜索过滤角色', async ({ page }) => {
    await openRoleDialog(page);

    // 先获取所有角色数量
    const allCheckboxes = page.locator('.role-list-container .el-checkbox');
    const totalCount = await allCheckboxes.count();
    console.log('总角色数:', totalCount);

    // 输入搜索关键词
    const searchInput = page.locator('.role-search input');
    await searchInput.fill('管理员');
    await page.waitForTimeout(500);

    // 验证搜索结果（角色数量减少或保持不变）
    const filteredCheckboxes = page.locator('.role-list-container .el-checkbox');
    const filteredCount = await filteredCheckboxes.count();
    console.log('搜索后角色数:', filteredCount);

    expect(filteredCount).toBeLessThanOrEqual(totalCount);

    // 清空搜索
    await searchInput.clear();
    await page.waitForTimeout(500);

    // 验证恢复显示所有角色
    const restoredCheckboxes = page.locator('.role-list-container .el-checkbox');
    const restoredCount = await restoredCheckboxes.count();
    expect(restoredCount).toBe(totalCount);

    await page.click('.el-dialog .el-button:has-text("取消")');
  });

  test('应该能够选择和取消选择角色', async ({ page }) => {
    await openRoleDialog(page);

    // 获取第一个复选框的状态
    const firstCheckbox = page.locator('.role-list-container .el-checkbox').first();
    const firstCheckboxInput = firstCheckbox.locator('.el-checkbox__input');

    // 点击选择
    await firstCheckbox.click();
    await page.waitForTimeout(300);

    // 验证被选中
    await expect(firstCheckboxInput).toHaveClass(/is-checked/);

    // 再次点击取消选择
    await firstCheckbox.click();
    await page.waitForTimeout(300);

    // 验证未被选中
    await expect(firstCheckboxInput).not.toHaveClass(/is-checked/);

    await page.click('.el-dialog .el-button:has-text("取消")');
  });

  test('应该能够提交角色分配', async ({ page }) => {
    await openRoleDialog(page);

    // 确保至少选择一个角色（点击第一个复选框）
    const firstCheckbox = page.locator('.role-list-container .el-checkbox').first();
    await firstCheckbox.click();
    await page.waitForTimeout(500);

    // 提交分配
    await page.click('.el-dialog .el-button--primary:has-text("确定分配")');

    // 等待提交完成（按钮loading状态消失）
    await page.waitForSelector('.el-dialog .el-button--primary:not(.is-loading)', { timeout: 5000 });

    // 验证成功消息或对话框关闭
    const messageSuccess = page.locator('.el-message--success');
    const dialogClosed = page.locator('.el-dialog:has-text("分配角色")');

    // 等待其中一个条件满足
    await Promise.race([
      messageSuccess.waitFor({ state: 'visible', timeout: 5000 }),
      dialogClosed.waitFor({ state: 'hidden', timeout: 5000 })
    ]);

    // 验证对话框已关闭
    await expect(dialogClosed).not.toBeVisible({ timeout: 3000 });
  });

  test('应该在未选择任何角色时显示警告', async ({ page }) => {
    await openRoleDialog(page);

    // 确保没有选中任何角色（取消所有选择）
    const allCheckboxes = page.locator('.role-list-container .el-checkbox.is-checked .el-checkbox__input');
    const checkedCount = await allCheckboxes.count();

    if (checkedCount > 0) {
      // 如果有选中的，逐个取消
      for (let i = 0; i < checkedCount; i++) {
        const checkbox = page.locator('.role-list-container .el-checkbox.is-checked').first();
        await checkbox.click();
        await page.waitForTimeout(200);
      }
    }

    await page.waitForTimeout(500);

    // 尝试提交
    await page.click('.el-dialog .el-button--primary:has-text("确定分配")');

    // 验证警告消息
    const messageWarning = page.locator('.el-message--warning');
    await expect(messageWarning).toBeVisible({ timeout: 3000 });
    await expect(messageWarning).toContainText(/至少选择一个角色/);

    // 关闭对话框
    await page.click('.el-dialog .el-button:not(.el-button--primary):has-text("取消")');
  });

  test('应该正确显示用户信息', async ({ page }) => {
    // 导航到用户管理页面
    await page.goto('/#/systemManage/userManagement');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 获取第一个用户的昵称（第2列，索引从1开始）
    const firstRow = page.locator('.el-table__body-wrapper .el-table__row').first();
    const userNickName = await firstRow.locator('.el-table__cell:nth-child(2)').textContent();
    const userAccount = await firstRow.locator('.el-table__cell:nth-child(1)').textContent();

    console.log('测试用户昵称:', userNickName);
    console.log('测试用户账号:', userAccount);

    // 点击"授权"
    await firstRow.locator('button:has-text("授权")').click();

    // 等待对话框打开
    await page.waitForSelector('.el-dialog:has-text("分配角色")', { timeout: 5000 });
    await page.waitForTimeout(1000);

    // 验证用户昵称显示
    const dialogUserName = page.locator('.el-dialog .el-form-item:has-text("用户名称") span:last-child');
    await expect(dialogUserName).toBeVisible();
    await expect(dialogUserName).toHaveText(userNickName || '');

    // 验证搜索框可见
    await expect(page.locator('.role-search input')).toBeVisible();

    // 验证角色列表可见
    await expect(page.locator('.role-list-container')).toBeVisible();

    // 关闭对话框
    await page.click('.el-dialog .el-button:has-text("取消")');
  });
});
