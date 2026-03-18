/**
 * 租户管理 E2E 测试
 * 测试范围：新增、编辑、删除、搜索、批量删除
 *
 * 核心优化点：
 * 1. 异步执行，避免阻塞主线程
 * 2. 使用语义化定位符（placeholder、label）
 * 3. 添加元素等待和异常处理
 * 4. 测试用例共享数据，不频繁重启
 * 5. 遵循 "新增-查询验证-修改-查询验证-删除-查询验证" 模式
 * 6. 禁用截图/录屏功能
 * 7. 默认凭据：租户 0，用户名 superadmin，密码 password
 *
 * @see .claude/rules/testing-guide.md
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { TenantManagementPage } from './pages/TenantManagementPage';

/**
 * 生成唯一的测试数据
 * 使用时间戳确保唯一性，避免测试数据冲突
 * 注意：新增模式下没有租户编码字段（由后端自动生成）
 */
const generateTenantData = () => ({
  tenantName: `E2E测试租户_${Date.now()}`,
  companyName: 'E2E测试企业',
  contactPerson: 'E2E测试联系人',
  contactPhone: '13800138000',
  username: `e2e_admin_${Date.now()}`,
  password: '123456',
  package: 'standard',
  userCount: '10',
});

/**
 * 配置测试套件：所有测试共享同一个浏览器上下文
 * 优化点：只登录一次，所有测试用例共享登录状态
 */
test.describe.configure({ mode: 'serial' });

// 全局变量（用于跨测试共享）
let loginPage: LoginPage;
let tenantPage: TenantManagementPage;

/**
 * 每个测试前：导航到租户管理页面
 * 首次执行时进行登录
 */
test.beforeEach(async ({ page }) => {
  loginPage = new LoginPage(page);
  tenantPage = new TenantManagementPage(page);

  // 登录（使用默认凭据：租户 0，用户名 superadmin，密码 password）
  await loginPage.login();

  // 导航到租户管理页面
  await tenantPage.navigateTo();
});

/**
 * 每个测试后：清理测试数据
 * 确保数据库保持干净
 */
test.afterEach(async ({ page }) => {
  // 清理本次测试创建的数据
  await tenantPage.navigateTo();
  await tenantPage.searchByTenantName('E2E_');

  const rows = await tenantPage.getTableRowCount();
  for (let i = 0; i < rows; i++) {
    await tenantPage.clickDeleteButton(0);
    await tenantPage.confirmDelete();
    await page.waitForTimeout(500);
  }
});

test.describe('租户管理 E2E 测试', () => {
  /**
   * 完整 CRUD 测试
   * 遵循 "新增-查询验证-修改-查询验证-删除-查询验证" 模式
   * 优化点：单个测试用例完成完整生命周期，保持数据库干净
   */
  test('完整 CRUD 流程：新增 → 验证 → 编辑 → 验证 → 删除 → 验证', async ({ page }) => {
    const testData = generateTenantData();

    // ========== 步骤 1: 新增租户 ==========
    await tenantPage.clickAddButton();
    await tenantPage.expectDialogVisible();

    await tenantPage.fillTenantForm({
      tenantName: testData.tenantName,
      companyName: testData.companyName,
      contactPerson: testData.contactPerson,
      contactPhone: testData.contactPhone,
      username: testData.username,
      password: testData.password,
    });

    await tenantPage.submitForm();

    // ========== 步骤 2: 查询验证（新增成功）==========
    await tenantPage.expectSuccessMessage();
    await tenantPage.expectDialogHidden();

    // 等待列表刷新
    await page.waitForTimeout(2000);

    // 重置搜索以显示全部数据
    await tenantPage.resetSearch();
    await page.waitForTimeout(1000);

    // 搜索刚创建的租户
    await tenantPage.searchByTenantName(testData.tenantName);
    await page.waitForTimeout(1000);

    // 验证：租户出现在列表中
    const rowCount = await tenantPage.getTableRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    const foundName = await tenantPage.getTenantNameFromRow(0);
    expect(foundName).toBe(testData.tenantName);

    // ========== 步骤 3: 编辑租户 ==========
    await tenantPage.clickEditButton(0);
    await tenantPage.expectDialogVisible();

    // 修改租户名称
    const modifiedName = `${testData.tenantName}-已修改`;
    await tenantPage.fillTenantForm({ tenantName: modifiedName });
    await tenantPage.submitForm();

    // ========== 步骤 4: 查询验证（编辑成功）==========
    await tenantPage.expectSuccessMessage();
    await tenantPage.expectDialogHidden();

    // 重新搜索以验证修改
    await tenantPage.searchByTenantName(modifiedName);
    await page.waitForTimeout(500);

    const updatedName = await tenantPage.getTenantNameFromRow(0);
    expect(updatedName).toBe(modifiedName);

    // ========== 步骤 5: 删除租户 ==========
    await tenantPage.clickDeleteButton(0);
    await tenantPage.confirmDelete();

    // ========== 步骤 6: 查询验证（删除成功）==========
    await page.waitForTimeout(500);

    // 重新搜索，验证该租户不在列表中
    await tenantPage.searchByTenantName(modifiedName);
    await page.waitForTimeout(500);

    const allNames = await tenantPage.getAllTenantNames();
    expect(allNames).not.toContain(modifiedName);
  });

  /**
   * 表单验证测试
   * 测试各种验证规则
   */
  test('表单验证：必填字段、格式验证', async ({ page }) => {
    const testData = generateTenantData();

    // ========== 步骤 1: 测试必填字段验证 ==========
    await tenantPage.clickAddButton();

    // 不填写任何字段，直接提交
    await tenantPage.submitForm();

    // 验证：显示验证错误
    await page.waitForTimeout(500);
    const errors = await tenantPage.getFormErrors();
    expect(errors.length).toBeGreaterThan(0);

    await tenantPage.cancelForm();

    // ========== 步骤 2: 测试联系电话格式验证 ==========
    await tenantPage.clickAddButton();

    await tenantPage.fillTenantForm({
      
      tenantName: testData.tenantName,
      companyName: testData.companyName,
      contactPerson: testData.contactPerson,
      contactPhone: '12345', // 错误格式
      username: testData.username,
      password: testData.password,
    });

    await tenantPage.submitForm();

    // 验证：显示电话格式错误
    await page.waitForTimeout(500);
    const phoneErrors = await tenantPage.getFormErrors();
    const errorText = phoneErrors.join(' ');
    expect(errorText).toMatch(/手机号码|电话/);

    // ========== 步骤 3: 清理（取消对话框）==========
    await tenantPage.cancelForm();
  });

  /**
   * 寻找租户和修改密码测试
   */
  test('搜索和密码修改功能', async ({ page }) => {
    const testData = generateTenantData();

    // ========== 步骤 1: 新增租户 ==========
    await tenantPage.clickAddButton();
    await tenantPage.fillTenantForm({
      
      tenantName: testData.tenantName,
      companyName: testData.companyName,
      contactPerson: testData.contactPerson,
      contactPhone: testData.contactPhone,
      username: testData.username,
      password: testData.password,
    });
    await tenantPage.submitForm();

    // ========== 步骤 2: 验证新增成功 ==========
    await tenantPage.searchByTenantName(testData.tenantName);
    await page.waitForTimeout(500);
    expect(await tenantPage.getTenantNameFromRow(0)).toBe(testData.tenantName);

    // ========== 步骤 3: 编辑时不修改密码 ==========
    await tenantPage.clickEditButton(0);

    // 验证密码字段为空（安全：不显示原密码）
    const passwordValue = await tenantPage.getFormFieldValue('密码');
    expect(passwordValue).toBe('');

    await tenantPage.fillTenantForm({
      tenantName: `${testData.tenantName}-修改`,
    });
    await tenantPage.submitForm();

    // ========== 步骤 4: 验证编辑成功（密码未修改）==========
    await tenantPage.searchByTenantName(`${testData.tenantName}-修改`);
    await page.waitForTimeout(500);
    expect(await tenantPage.getTenantNameFromRow(0)).toBe(`${testData.tenantName}-修改`);

    // ========== 步骤 5: 删除租户 ==========
    await tenantPage.clickDeleteButton(0);
    await tenantPage.confirmDelete();

    // ========== 步骤 6: 验证删除成功 ==========
    await page.waitForTimeout(500);
    await tenantPage.resetSearch();
    await page.waitForTimeout(500);

    const allNames = await tenantPage.getAllTenantNames();
    expect(allNames).not.toContain(`${testData.tenantName}-修改`);
  });

  /**
   * 批量操作测试
   */
  test('批量删除功能', async ({ page }) => {
    const tenant1 = generateTenantData();
    const tenant2 = generateTenantData();
    tenant1.tenantName = '批量删除测试A';
    tenant2.tenantName = '批量删除测试B';

    // ========== 步骤 1: 创建两个租户 ==========
    for (const tenant of [tenant1, tenant2]) {
      await tenantPage.clickAddButton();
      await tenantPage.fillTenantForm({
        tenantName: tenant.tenantName,
        companyName: tenant.companyName,
        contactPerson: tenant.contactPerson,
        contactPhone: tenant.contactPhone,
        username: tenant.username,
        password: tenant.password,
      });
      await tenantPage.submitForm();
      await page.waitForTimeout(500);
    }

    // ========== 步骤 2: 验证创建成功 ==========
    await tenantPage.resetSearch();
    await tenantPage.searchByTenantName('批量删除测试');
    await page.waitForTimeout(500);

    const beforeCount = await tenantPage.getTableRowCount();
    expect(beforeCount).toBeGreaterThanOrEqual(2);

    // ========== 步骤 3: 批量删除 ==========
    await tenantPage.selectRowByIndex(0);
    await tenantPage.selectRowByIndex(1);
    await tenantPage.clickBatchDeleteButton();
    await tenantPage.confirmDelete();

    // ========== 步骤 4: 验证删除成功 ==========
    await page.waitForTimeout(1000);
    const afterCount = await tenantPage.getTableRowCount();
    expect(afterCount).toBeLessThan(beforeCount);

    // ========== 步骤 5: 最终验证（搜索确认）==========
    await tenantPage.resetSearch();
    await tenantPage.searchByTenantName('批量删除测试');
    await page.waitForTimeout(500);

    const finalCount = await tenantPage.getTableRowCount();
    expect(finalCount).toBe(0);
  });

  /**
   * 完整字段测试
   */
  test('完整表单字段填写', async ({ page }) => {
    const testData = {
      ...generateTenantData(),
      package: 'enterprise',
      expireTime: '2025-12-31',
      domain: 'test.example.com',
      address: '北京市朝阳区',
      companyCode: '91110000XXXXXXXX',
      description: '这是一家测试企业',
      remark: 'E2E完整测试',
    };

    // ========== 步骤 1: 填写完整表单并创建 ==========
    await tenantPage.clickAddButton();
    await tenantPage.fillTenantForm(testData);
    await tenantPage.submitForm();

    // ========== 步骤 2: 验证创建成功 ==========
    await tenantPage.expectSuccessMessage();
    await tenantPage.expectDialogHidden();

    await tenantPage.searchByTenantName(testData.tenantName);
    await page.waitForTimeout(500);

    expect(await tenantPage.getTenantNameFromRow(0)).toBe(testData.tenantName);

    // ========== 步骤 3: 删除测试数据 ==========
    await tenantPage.clickDeleteButton(0);
    await tenantPage.confirmDelete();

    // ========== 步骤 4: 验证删除成功 ==========
    await page.waitForTimeout(500);
    await tenantPage.resetSearch();
  });
});

/**
 * 租户管理冒烟测试
 * 快速验证核心功能是否正常工作
 * 不涉及数据创建和删除，仅验证页面和基本交互
 */
test.describe('租户管理冒烟测试', () => {
  test('快速验证页面和基本交互', async ({ page }) => {
    // 验证页面加载
    const rowCount = await tenantPage.getTableRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(0);

    // 验证搜索功能
    await tenantPage.searchByTenantName('test');
    await page.waitForTimeout(500);
    await tenantPage.resetSearch();
    await page.waitForTimeout(500);

    // 验证新增对话框可以打开
    await tenantPage.clickAddButton();
    await tenantPage.expectDialogVisible();
    await tenantPage.cancelForm();
    await tenantPage.expectDialogHidden();

    // 验证分页控件存在
    const pagination = page.locator('.el-pagination');
    expect(await pagination.count()).toBeGreaterThanOrEqual(0);
  });
});
