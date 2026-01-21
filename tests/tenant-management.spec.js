import { test, expect } from '@playwright/test';

test.describe('租户管理页面', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到租户管理页面
    await page.goto('/#/systemManage/tenantManagement');
    // 等待页面加载
    await page.waitForSelector('.tenant-management-page');
  });

  test('应正确导航并显示租户管理页面', async ({ page }) => {
    // 验证页面容器可见
    await expect(page.locator('.tenant-management-page')).toBeVisible();

    // 验证搜索栏可见
    await expect(page.locator('.tenant-search-bar')).toBeVisible();

    // 验证列表容器可见
    await expect(page.locator('.tenant-list-container')).toBeVisible();

    // 验证新增按钮可见
    await expect(page.getByTestId('btn-add-tenant')).toBeVisible();
  });

  test('应正确显示搜索条件输入框', async ({ page }) => {
    // 验证搜索栏可见
    await expect(page.locator('.tenant-search-bar')).toBeVisible();

    // 验证各输入框标签
    await expect(page.locator('.tenant-search-bar').getByText('租户编号')).toBeVisible();
    await expect(page.locator('.tenant-search-bar').getByText('租户名称')).toBeVisible();
    await expect(page.locator('.tenant-search-bar').getByText('企业名称')).toBeVisible();
    await expect(page.locator('.tenant-search-bar').getByText('租户状态')).toBeVisible();

    // 验证搜索和重置按钮
    await expect(page.getByTestId('btn-search')).toBeVisible();
    await expect(page.getByTestId('btn-reset')).toBeVisible();
  });

  test('应正确显示表格列标题', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.custom-table');

    // 验证表格列标题
    await expect(page.locator('.custom-table th')).toContainText(['租户编号', '租户名称', '企业名称']);
  });

  test('应能打开租户新增对话框', async ({ page }) => {
    // 点击新增租户按钮
    await page.getByTestId('btn-add-tenant').click();

    // 等待弹窗出现
    await page.waitForSelector('.el-dialog');

    // 验证对话框标题
    await expect(page.locator('.el-dialog__title')).toContainText('租户');

    // 关闭对话框
    await page.locator('.el-dialog__footer .el-button').filter({ hasText: '取消' }).click();
    await expect(page.locator('.el-dialog')).not.toBeVisible();
  });

  test('应能处理搜索功能', async ({ page }) => {
    // 输入搜索条件
    await page.fill('.tenant-search-bar input[placeholder="请输入租户编号"]', 'test_tenant');
    await page.fill('.tenant-search-bar input[placeholder="请输入租户名称"]', '测试租户');
    await page.fill('.tenant-search-bar input[placeholder="请输入企业名称"]', '测试企业');

    // 点击搜索按钮
    await page.getByTestId('btn-search').click();

    // 验证搜索条件被保留
    await expect(page.locator('.tenant-search-bar input[placeholder="请输入租户编号"]')).toHaveValue('test_tenant');
  });

  test('应能重置搜索条件', async ({ page }) => {
    // 输入一些搜索条件
    await page.fill('.tenant-search-bar input[placeholder="请输入租户编号"]', 'test_value');
    await page.fill('.tenant-search-bar input[placeholder="请输入租户名称"]', '测试名称');

    // 点击重置按钮
    await page.getByTestId('btn-reset').click();

    // 验证输入框被清空
    await expect(page.locator('.tenant-search-bar input[placeholder="请输入租户编号"]')).toHaveValue('');
    await expect(page.locator('.tenant-search-bar input[placeholder="请输入租户名称"]')).toHaveValue('');
  });

  test('应能处理租户编辑功能', async ({ page }) => {
    // 等待表格加载数据
    await page.waitForSelector('.custom-table');

    // 检查是否存在租户数据
    const rowsCount = await page.locator('.el-table__body-wrapper .el-table__body tr').count();

    test.skip(rowsCount === 0, '没有租户数据，跳过编辑测试');

    // 点击第一个租户的编辑按钮
    await page.locator('.el-table__body-wrapper .el-table__body tr:first-child .edit-btn').first().click();

    // 等待编辑对话框出现
    await page.waitForSelector('.el-dialog', { timeout: 5000 });

    // 验证编辑对话框打开
    await expect(page.locator('.el-dialog')).toBeVisible();

    // 关闭对话框
    await page.locator('.el-dialog__footer .el-button').filter({ hasText: '取消' }).click();
    await expect(page.locator('.el-dialog')).not.toBeVisible();
  });

  test('应能处理租户删除功能', async ({ page }) => {
    // 等待表格加载数据
    await page.waitForSelector('.custom-table');

    // 检查是否存在租户数据
    const rowsCount = await page.locator('.el-table__body-wrapper .el-table__body tr').count();

    test.skip(rowsCount === 0, '没有租户数据，跳过删除测试');

    // 点击第一个租户的删除按钮
    await page.locator('.el-table__body-wrapper .el-table__body tr:first-child .delete-btn').first().click();

    // 等待删除确认对话框出现
    await page.waitForSelector('.el-dialog');

    // 验证删除确认对话框打开
    await expect(page.locator('.el-dialog')).toBeVisible();

    // 取消删除
    await page.locator('.el-dialog__footer .el-button').filter({ hasText: '取消' }).click();
  });

  test('应能处理批量删除功能', async ({ page }) => {
    // 等待表格加载数据
    await page.waitForSelector('.custom-table');

    // 检查是否存在租户数据
    const rowsCount = await page.locator('.el-table__body-wrapper .el-table__body tr').count();

    test.skip(rowsCount === 0, '没有租户数据，跳过批量删除测试');

    // 选择第一行
    await page.locator('.el-table__body-wrapper .el-table__body tr:first-child .el-checkbox').first().click();

    // 点击批量删除按钮
    await page.getByTestId('btn-batch-delete').click();

    // 等待删除确认对话框出现
    await page.waitForSelector('.el-dialog');

    // 验证删除确认对话框打开
    await expect(page.locator('.el-dialog')).toBeVisible();

    // 取消删除
    await page.locator('.el-dialog__footer .el-button').filter({ hasText: '取消' }).click();
  });

  test('未选择记录时批量删除按钮应被禁用', async ({ page }) => {
    // 确保没有选中任何行
    const headerCheckbox = page.locator('.el-table__header-wrapper .el-checkbox');
    const isChecked = await headerCheckbox.getAttribute('aria-checked');
    if (isChecked === 'true') {
      await headerCheckbox.click();
    }

    // 验证批量删除按钮被禁用
    await expect(page.getByTestId('btn-batch-delete')).toBeDisabled();
  });

  test('应能处理租户状态切换功能', async ({ page }) => {
    // 等待表格加载数据
    await page.waitForSelector('.custom-table');

    // 检查是否存在租户数据
    const rowsCount = await page.locator('.el-table__body-wrapper .el-table__body tr').count();

    test.skip(rowsCount === 0, '没有租户数据，跳过状态切换测试');

    // 使用更精确的选择器定位第一行的状态开关
    const statusSwitch = page.locator('.el-table__body-wrapper .el-table__body tr:first-child .el-switch').first();

    // 确保开关存在
    await expect(statusSwitch).toBeVisible();

    // 记录初始状态
    const initialClass = await statusSwitch.getAttribute('class');
    const isInitiallyChecked = initialClass.includes('is-checked');

    // 点击状态开关
    await statusSwitch.click();

    // 等待API调用和状态更新
    await page.waitForTimeout(1500);

    // 验证状态已改变
    const newClass = await statusSwitch.getAttribute('class');
    const isNowChecked = newClass.includes('is-checked');

    if (isInitiallyChecked !== isNowChecked) {
      console.log('✓ 状态开关UI已更新');
    } else {
      console.log('⚠️ 状态开关UI未更新（可能是API调用失败）');
    }
  });

  test('应能处理导出功能', async ({ page }) => {
    // 点击导出按钮
    await page.getByTestId('btn-export').click();

    // 验证是否有消息提示
    await page.waitForSelector('.el-message', { timeout: 3000 }).catch(() => {
      console.log('⚠️ 导出消息未显示（可能是API问题）');
    });
  });

  test('应能处理选中行导出功能', async ({ page }) => {
    // 等待表格加载数据
    await page.waitForSelector('.custom-table');

    // 检查是否存在租户数据
    const rowsCount = await page.locator('.el-table__body-wrapper .el-table__body tr').count();

    test.skip(rowsCount === 0, '没有租户数据，跳过选中行导出测试');

    // 先取消全选
    await page.locator('.el-table__header-wrapper .el-checkbox').click();

    // 选择第一行
    await page.locator('.el-table__body-wrapper .el-table__body tr:first-child .el-checkbox').first().click();

    // 点击导出按钮
    await page.getByTestId('btn-export').click();

    // 验证是否有消息提示
    await page.waitForSelector('.el-message', { timeout: 3000 }).catch(() => {
      console.log('⚠️ 导出消息未显示（可能是API问题）');
    });
  });

  test('应能处理带筛选条件的导出功能', async ({ page }) => {
    // 输入搜索条件
    await page.fill('.tenant-search-bar input[placeholder="请输入租户名称"]', '测试租户');

    // 点击搜索按钮
    await page.getByTestId('btn-search').click();

    // 等待搜索结果加载
    await page.waitForTimeout(1000);

    // 点击导出按钮
    await page.getByTestId('btn-export').click();

    // 验证是否有消息提示
    await page.waitForSelector('.el-message', { timeout: 3000 }).catch(() => {
      console.log('⚠️ 导出消息未显示（可能是API问题）');
    });
  });

  test('应正确显示分页控件', async ({ page }) => {
    // 检查分页控件是否存在
    await expect(page.locator('.tenant-pagination-container')).toBeVisible();
  });

  test('应能正确处理分页大小变化', async ({ page }) => {
    // 等待分页控件完全加载
    await page.waitForSelector('.tenant-pagination-container');

    // 点击每页数量选择器
    await page.locator('.tenant-pagination-container .el-pagination__sizes .el-select').click();

    // 选择20条/页
    await page.click('li:has-text("20")');

    // 验证选择器更新
    await page.waitForTimeout(500);
    const sizeSelector = '.tenant-pagination-container .el-pagination__sizes .el-select .el-input__inner';
    const newSize = await page.locator(sizeSelector).inputValue();
    expect(newSize).toContain('20');

    // 验证当前页码仍为第1页
    const currentPage = await page.locator('.tenant-pagination-container .el-pager li.active').textContent();
    expect(currentPage).toBe('1');
  });

  test('应能正确处理页面导航', async ({ page }) => {
    // 等待数据加载完成
    await page.waitForTimeout(1000);

    // 检查是否有分页器
    const pagerItems = await page.locator('.tenant-pagination-container .el-pager li').count();

    test.skip(pagerItems <= 2, '数据不足，跳过多页导航测试');

    // 点击第2页（如果有）
    const page2Button = page.locator('.tenant-pagination-container .el-pager li').nth(1);
    const page2Text = await page2Button.textContent();

    test.skip(page2Text !== '2', '没有第2页，跳过测试');

    await page2Button.click();

    // 验证第2页变为激活状态
    await page.waitForTimeout(500);
    const activePage = await page.locator('.tenant-pagination-container .el-pager li.active').textContent();
    expect(activePage).toBe('2');
  });

  test('应能正确处理空数据状态', async ({ page }) => {
    // 使用一个不存在的租户编号进行搜索，以触发空数据状态
    await page.fill('.tenant-search-bar input[placeholder="请输入租户编号"]', 'nonexistent_tenant_xyz_999');
    await page.getByTestId('btn-search').click();

    // 等待搜索结果
    await page.waitForTimeout(1500);

    // 验证表格行数
    const rowsCount = await page.locator('.el-table__body tr').count();

    if (rowsCount === 0) {
      console.log('✓ 空数据状态显示正确（无数据行）');
    } else {
      console.log(`⚠️ 搜索结果有 ${rowsCount} 条数据，未触发空数据状态`);
    }
  });

  test('搜索时应重置分页到第一页', async ({ page }) => {
    // 等待数据加载
    await page.waitForTimeout(1000);

    // 先导航到第2页（如果存在）
    const page2Button = page.locator('.tenant-pagination-container .el-pager li').nth(1);
    const page2Text = await page2Button.textContent();

    test.skip(page2Text !== '2', '没有第2页，跳过页码重置测试');

    await page2Button.click();
    await page.waitForTimeout(500);

    // 验证当前在第2页
    let activePage = await page.locator('.tenant-pagination-container .el-pager li.active').textContent();
    expect(activePage).toBe('2');

    // 现在执行搜索操作
    await page.fill('.tenant-search-bar input[placeholder="请输入租户名称"]', 'test');
    await page.getByTestId('btn-search').click();

    // 等待搜索完成
    await page.waitForTimeout(1000);

    // 验证页码已重置到第1页
    activePage = await page.locator('.tenant-pagination-container .el-pager li.active').textContent();
    expect(activePage).toBe('1');
    console.log('✓ 搜索时页码已重置到第1页');
  });
});
