/**
 * 用户管理 E2E 测试
 * 遵循 CRUD 完整流程测试原则：新增→查询验证→修改→查询验证→删除→查询验证
 * @see .claude/rules/testing-guide.md
 */
import { test, expect } from '@playwright/test';

// 测试数据前缀
const TEST_PREFIX = 'E2E_USER_';
const generateTestData = () => ({
  username: `${TEST_PREFIX}${Date.now()}`,
  user_name: `E2E用户${Date.now()}`,
  nick_name: `测试用户${Date.now()}`,
  phone: `138${Date.now().toString().slice(-8)}`,
  email: `test${Date.now()}@example.com`,
  password: 'Test@123456',
  status: 0,
});

test.describe('用户管理 - CRUD 完整流程', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('http://localhost:4000/#/login');
    await page.fill('input[placeholder*="租户编码"]', '0');
    await page.fill('input[placeholder*="用户名"]', 'superadmin');
    await page.fill('input[placeholder*="密码"]', 'password');
    await page.click('button:has-text("登录")');

    // 等待登录成功（URL 不再包含 /login）
    await page.waitForURL(/^(?!.*\/login).*$/, { timeout: 5000 });

    // 导航到用户管理页面
    await page.goto('http://localhost:4000/#/systemManage/userManagement');
    await page.waitForSelector('.el-table', { state: 'visible', timeout: 10000 });
  });

  test('完整 CRUD 流程：新增→查询→修改→查询→删除→查询', async ({ page }) => {
    const testData = generateTestData();
    const modifiedNickName = `修改后的用户${Date.now()}`;

    // ========== 步骤 1: 新增用户 ==========
    await test.step('新增用户', async () => {
      // 点击新增按钮
      await page.click('[data-testid="btn-add-user"]');

      // 等待对话框出现
      await page.waitForSelector('.el-dialog', { state: 'visible' });

      // 填写表单
      await page.fill('input[placeholder*="用户名"]', testData.user_name);
      await page.fill('input[placeholder*="昵称"]', testData.nick_name);
      await page.fill('input[placeholder*="手机号"]', testData.phone);
      await page.fill('input[placeholder*="邮箱"]', testData.email);
      await page.fill('input[placeholder*="密码"]', testData.password);

      // 提交表单
      await page.click('.el-dialog button:has-text("确定")');

      // 等待对话框关闭
      await page.waitForSelector('.el-dialog', { state: 'hidden', timeout: 5000 });
    });

    // ========== 步骤 2: 查询验证（新增成功） ==========
    await test.step('查询验证新增成功', async () => {
      // 搜索刚创建的用户
      await page.fill('input[placeholder*="用户名"]', testData.user_name);
      await page.click('[data-testid="btn-search"]');

      // 等待表格加载
      await page.waitForSelector('.el-table__body-wrapper', { state: 'visible' });

      // 验证用户存在于表格中
      const userRow = page.locator(`text=${testData.user_name}`);
      await expect(userRow.first()).toBeVisible({ timeout: 5000 });

      // 验证其他字段
      const tableRow = page.locator(`.el-table__row:has-text("${testData.user_name}")`);
      await expect(tableRow.locator('td').nth(2)).toContainText(testData.nick_name);
    });

    // ========== 步骤 3: 修改用户 ==========
    await test.step('修改用户', async () => {
      // 找到用户行并点击编辑按钮
      const tableRow = page.locator(`.el-table__row:has-text("${testData.user_name}")`);
      await tableRow.locator('button:has-text("编辑")').click();

      // 等待编辑对话框出现
      await page.waitForSelector('.el-dialog', { state: 'visible' });

      // 修改昵称
      const nickNameInput = page.locator('input[placeholder*="昵称"]');
      await nickNameInput.clear();
      await nickNameInput.fill(modifiedNickName);

      // 提交修改
      await page.click('.el-dialog button:has-text("确定")');

      // 等待对话框关闭
      await page.waitForSelector('.el-dialog', { state: 'hidden', timeout: 5000 });
    });

    // ========== 步骤 4: 查询验证（修改成功） ==========
    await test.step('查询验证修改成功', async () => {
      // 刷新页面或重新搜索
      await page.click('[data-testid="btn-search"]');

      // 等待表格更新
      await page.waitForSelector('.el-table__body-wrapper', { state: 'visible' });

      // 验证修改后的昵称显示
      const tableRow = page.locator(`.el-table__row:has-text("${testData.user_name}")`);
      await expect(tableRow.locator('td').nth(2)).toContainText(modifiedNickName);
    });

    // ========== 步骤 5: 删除用户 ==========
    await test.step('删除用户', async () => {
      // 找到用户行并点击删除按钮
      const tableRow = page.locator(`.el-table__row:has-text("${testData.user_name}")`);
      await tableRow.locator('button:has-text("删除")').click();

      // 等待确认对话框
      await page.waitForSelector('.el-message-box', { state: 'visible' });

      // 确认删除
      await page.click('.el-message-box button:has-text("确定")');

      // 等待确认对话框关闭
      await page.waitForSelector('.el-message-box', { state: 'hidden', timeout: 5000 });
    });

    // ========== 步骤 6: 查询验证（删除成功） ==========
    await test.step('查询验证删除成功', async () => {
      // 重新搜索
      await page.click('[data-testid="btn-search"]');

      // 等待表格加载
      await page.waitForSelector('.el-table__body-wrapper', { state: 'visible' });

      // 验证用户不存在
      const userRow = page.locator(`text=${testData.user_name}`);
      await expect(userRow).not.toBeVisible({ timeout: 5000 });
    });
  });

  test('批量删除用户', async ({ page }) => {
    const users = [generateTestData(), generateTestData()];

    // ========== 步骤 1: 新增多个用户 ==========
    for (const user of users) {
      await page.click('[data-testid="btn-add-user"]');
      await page.waitForSelector('.el-dialog', { state: 'visible' });

      await page.fill('input[placeholder*="用户名"]', user.user_name);
      await page.fill('input[placeholder*="昵称"]', user.nick_name);
      await page.fill('input[placeholder*="手机号"]', user.phone);
      await page.fill('input[placeholder*="密码"]', user.password);

      await page.click('.el-dialog button:has-text("确定")');
      await page.waitForSelector('.el-dialog', { state: 'hidden', timeout: 5000 });
    }

    // ========== 步骤 2: 查询验证（新增成功） ==========
    await page.click('[data-testid="btn-search"]');
    await page.waitForSelector('.el-table__body-wrapper', { state: 'visible' });

    for (const user of users) {
      await expect(page.locator(`text=${user.user_name}`).first()).toBeVisible();
    }

    // ========== 步骤 3: 批量选择并删除 ==========
    // 选择所有行
    await page.click('.el-table__header .el-checkbox');
    await page.waitForTimeout(500); // 等待选择完成

    // 点击批量删除按钮
    await page.click('[data-testid="btn-batch-delete"]');
    await page.waitForSelector('.el-message-box', { state: 'visible' });
    await page.click('.el-message-box button:has-text("确定")');
    await page.waitForSelector('.el-message-box', { state: 'hidden', timeout: 5000 });

    // ========== 步骤 4: 查询验证（删除成功） ==========
    await page.click('[data-testid="btn-search"]');
    await page.waitForSelector('.el-table__body-wrapper', { state: 'visible' });

    for (const user of users) {
      await expect(page.locator(`text=${user.user_name}`)).not.toBeVisible();
    }
  });

  test('重置用户密码', async ({ page }) => {
    const testData = generateTestData();

    // 新增用户
    await page.click('[data-testid="btn-add-user"]');
    await page.waitForSelector('.el-dialog', { state: 'visible' });

    await page.fill('input[placeholder*="用户名"]', testData.user_name);
    await page.fill('input[placeholder*="手机号"]', testData.phone);
    await page.fill('input[placeholder*="密码"]', testData.password);

    await page.click('.el-dialog button:has-text("确定")');
    await page.waitForSelector('.el-dialog', { state: 'hidden', timeout: 5000 });

    // 搜索用户
    await page.fill('input[placeholder*="用户名"]', testData.user_name);
    await page.click('[data-testid="btn-search"]');

    // 点击重置密码按钮
    const tableRow = page.locator(`.el-table__row:has-text("${testData.user_name}")`);
    await tableRow.locator('button:has-text("重置")').click();

    // 验证密码重置提示
    await expect(page.locator('.el-message--success')).toBeVisible({ timeout: 5000 });

    // 清理：删除测试用户
    await tableRow.locator('button:has-text("删除")').click();
    await page.waitForSelector('.el-message-box', { state: 'visible' });
    await page.click('.el-message-box button:has-text("确定")');
    await page.waitForSelector('.el-message-box', { state: 'hidden', timeout: 5000 });
  });

  test.afterAll(async ({ page }) => {
    // 清理所有测试数据
    console.log('清理测试数据...');

    // 搜索所有测试用户
    await page.goto('http://localhost:4000/#/systemManage/userManagement');
    await page.waitForSelector('.el-table', { state: 'visible' });

    // 尝试删除所有以 E2E_USER_ 开头的用户
    // 注意：这需要后端支持模糊搜索
    const maxAttempts = 50;
    let deletedCount = 0;

    for (let i = 0; i < maxAttempts; i++) {
      const firstRow = page.locator('.el-table__body-wrapper .el-table__row').first();

      const hasTestUser = await firstRow.locator('td').nth(1).textContent()
        .then(text => text?.includes('E2E_'));

      if (!hasTestUser) {
        break;
      }

      try {
        // 选择第一行
        await firstRow.locator('.el-checkbox').click();
        await page.waitForTimeout(300);

        // 删除
        await page.click('[data-testid="btn-batch-delete"]');
        await page.waitForSelector('.el-message-box', { state: 'visible', timeout: 3000 });
        await page.click('.el-message-box button:has-text("确定")');
        await page.waitForSelector('.el-message-box', { state: 'hidden', timeout: 3000 });

        deletedCount++;
      } catch (error) {
        console.log('清理出错:', error);
        break;
      }
    }

    console.log(`已清理 ${deletedCount} 条测试数据`);
  });
});
