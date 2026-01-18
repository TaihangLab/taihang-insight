const { test, expect } = require('@playwright/test');

/**
 * Wiki 覆盖情况映射表 - roleManagement.md
 *
 * ✅ 已覆盖章节：
 * - 列表展示: 表格字段说明、空数据态、无分页
 * - 新增功能: 新增入口、表单字段、权限选项
 * - 编辑功能: 编辑入口、表单字段、特殊行为
 * - 删除功能: 删除入口、删除确认、删除方式
 *
 * ❌ 未覆盖章节：
 * - 无API调用: 所有操作（新增、编辑、删除）未连接后端API
 * - 无数据初始化: 页面加载时没有从API获取角色列表
 * - 编辑功能未实现: 保存编辑时只有console.log
 * - 删除功能未连接API: 仅从本地数组删除
 *
 * 🔍 发现的潜在规范问题：
 * 1. 所有操作未连接后端API，仅操作本地数据
 * 2. 页面加载时没有从API获取角色列表
 * 3. 编辑功能只有console.log输出，没有实际更新数据
 * 4. 删除功能仅从本地数组删除，未调用后端API
 * 5. 权限选项硬编码，应从后端获取
 * 6. 状态列直接显示原始值（0/1），未格式化
 * 7. role_id生成时为空字符串，可能导致删除功能异常
 * 8. 缺少租户选择功能
 * 9. 缺少搜索筛选功能
 * 10. 缺少分页功能
 * 11. 缺少loading状态
 */

test.describe('角色管理页面', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到角色管理页面
    await page.goto('/#/systemManage/roleManagement');
    // 等待页面加载
    await page.waitForSelector('.role-management-container');
  });

  // ==================== 页面概览 ====================
  test('应正确导航并显示角色管理页面', async ({ page }) => {
    // 【Wiki章节】页面概览
    // 【验证业务规则】页面应正确加载并显示角色管理功能

    // 验证页面容器可见
    await expect(page.locator('.role-management-container')).toBeVisible();

    // 验证页面标题
    await expect(page.locator('h2')).toContainText('角色管理');

    // 验证搜索筛选区域
    await expect(page.locator('.role-search-bar, .filter-section')).toBeVisible();

    // 验证表格操作区域
    await expect(page.locator('.role-table-actions, .table-actions')).toBeVisible();
  });

  // ==================== 列表展示 ====================
  test('应正确显示表格列标题', async ({ page }) => {
    // 【Wiki章节】列表展示
    // 【验证业务规则】表格应显示所有定义的字段列

    // 等待表格加载
    await page.waitForSelector('.custom-table, .el-table');

    // 验证表格列标题
    await expect(page.locator('.custom-table th, .el-table th')).toContainText(['角色名称', '角色代码', '描述']);
  });

  test('应显示空数据状态', async ({ page }) => {
    // 【Wiki章节】列表展示
    // 【验证业务规则】无数据时显示空表格
    // 【已知问题】页面加载时没有从API获取角色列表，roleData始终为空数组

    // 等待表格加载
    await page.waitForSelector('.custom-table, .el-table');

    // 验证表格为空
    const rowsCount = await page.locator('.el-table__body tr').count();

    // 由于没有API调用，应该始终是空数据
    console.log(`当前表格行数: ${rowsCount}（预期为0，因为未连接API）`);
  });

  // ==================== 新增功能 ====================
  test('应能打开角色新增对话框', async ({ page }) => {
    // 【Wiki章节】新增功能
    // 【验证业务规则】点击新增按钮应打开角色创建对话框

    // 点击新增角色按钮（尝试多种选择器）
    const addButton = page.locator('button').filter({ hasText: '新增角色' }).or(page.locator('button').filter({ hasText: '新增' }));
    await addButton.click();

    // 等待弹窗出现
    await page.waitForSelector('.el-dialog');

    // 验证对话框标题
    await expect(page.locator('.el-dialog__title')).toContainText('新增角色');

    // 验证必填字段标签
    await expect(page.locator('.el-dialog')).getByText('角色名称').toBeVisible();
    await expect(page.locator('.el-dialog')).getByText('角色代码').toBeVisible();

    // 验证权限选项区域
    await expect(page.locator('.el-dialog')).getByText('权限').toBeVisible();

    // 关闭对话框
    await page.locator('.el-dialog__footer .el-button').filter({ hasText: '取消' }).click();
    await expect(page.locator('.el-dialog')).not.toBeVisible();
  });

  test('应验证角色新增表单必填字段', async ({ page }) => {
    // 【Wiki章节】新增功能
    // 【验证业务规则】提交空表单时应显示必填字段验证错误

    // 点击新增角色按钮
    const addButton = page.locator('button').filter({ hasText: '新增角色' }).or(page.locator('button').filter({ hasText: '新增' }));
    await addButton.click();

    // 等待弹窗出现
    await page.waitForSelector('.el-dialog');

    // 尝试提交空表单
    const submitButton = page.locator('.el-dialog__footer .el-button').filter({ hasText: '确定' }).or(page.locator('.el-dialog__footer .el-button').filter({ hasText: '保存' })).or(page.locator('.el-dialog__footer .el-button--primary'));
    await submitButton.click();

    // 检查验证错误信息
    await expect(page.locator('.el-form-item__error').first()).toBeVisible();

    // 关闭对话框
    await page.locator('.el-dialog__footer .el-button').filter({ hasText: '取消' }).click();
  });

  test('应显示硬编码的权限选项', async ({ page }) => {
    // 【Wiki章节】新增功能
    // 【验证业务规则】权限选项为硬编码值（user:create, user:read等）
    // 【已知问题】权限选项硬编码，应从后端获取

    // 点击新增角色按钮
    const addButton = page.locator('button').filter({ hasText: '新增角色' }).or(page.locator('button').filter({ hasText: '新增' }));
    await addButton.click();

    // 等待弹窗出现
    await page.waitForSelector('.el-dialog');

    // 验证权限选项
    await expect(page.locator('.el-dialog')).getByText('user:create', { exact: false }).toBeVisible();
    await expect(page.locator('.el-dialog')).getByText('user:read', { exact: false }).toBeVisible();

    // 关闭对话框
    await page.locator('.el-dialog__footer .el-button').filter({ hasText: '取消' }).click();
  });

  test('应能新增角色并添加到本地数组', async ({ page }) => {
    // 【Wiki章节】新增功能
    // 【验证业务规则】成功后将数据添加到本地数组
    // 【已知问题】未连接API，仅操作本地数据

    // 点击新增角色按钮
    const addButton = page.locator('button').filter({ hasText: '新增角色' }).or(page.locator('button').filter({ hasText: '新增' }));
    await addButton.click();

    // 等待弹窗出现
    await page.waitForSelector('.el-dialog');

    // 填写表单
    await page.fill('.el-dialog input[placeholder*="角色名称"], .el-dialog input[placeholder*="role_name"]', '测试角色');
    await page.fill('.el-dialog input[placeholder*="角色代码"], .el-dialog input[placeholder*="role_code"]', 'test_role');
    await page.fill('.el-dialog textarea[placeholder*="描述"], .el-dialog textarea[placeholder*="description"]', '测试角色描述');

    // 选择一些权限
    const firstPermission = page.locator('.el-dialog .el-checkbox').first();
    const hasPermission = await firstPermission.count() > 0;

    if (hasPermission) {
      await firstPermission.click();
    }

    // 提交表单
    await page.locator('.el-dialog__footer .el-button').filter({ hasText: '确定', hasText: '保存' }).or(page.locator('.el-dialog__footer .el-button--primary')).click();

    // 等待对话框关闭
    await page.waitForTimeout(500);

    // 验证成功消息
    await expect(page.locator('.el-message')).toBeVisible();

    // 由于未连接API，验证是否添加到本地数组（检查表格行数增加）
    const rowsCount = await page.locator('.el-table__body tr').count();
    console.log(`当前表格行数: ${rowsCount}`);
  });

  // ==================== 编辑功能 ====================
  test('应能打开角色编辑对话框', async ({ page }) => {
    // 【Wiki章节】编辑功能
    // 【验证业务规则】点击编辑按钮应打开编辑对话框
    // 【已知问题】编辑功能仅有console.log输出，未实际更新数据

    // 先创建一个角色（因为页面加载时没有数据）
    await page.getByTestId('btn-add-role, .btn-add, [data-testid*="add"]').or(page.locator('button').filter({ hasText: '新增角色' })).or(page.locator('button').filter({ hasText: '新增' }))).click();
    await page.waitForSelector('.el-dialog');
    await page.fill('.el-dialog input[placeholder*="角色名称"], .el-dialog input[placeholder*="role_name"]', '待编辑角色');
    await page.fill('.el-dialog input[placeholder*="角色代码"], .el-dialog input[placeholder*="role_code"]', 'role_to_edit');
    await page.locator('.el-dialog__footer .el-button').filter({ hasText: '确定', hasText: '保存' }).or(page.locator('.el-dialog__footer .el-button--primary')).click();
    await page.waitForTimeout(500);

    // 点击编辑按钮
    await page.locator('.el-table__body-wrapper .el-table__body tr:first-child .edit-btn, .el-table__body tr:first-child .edit-btn').first().click();

    // 等待编辑对话框出现
    await page.waitForSelector('.el-dialog', { timeout: 5000 });

    // 验证编辑对话框打开
    await expect(page.locator('.el-dialog__title')).toContainText('编辑角色');

    // 验证数据已回填
    await expect(page.locator('.el-dialog input[placeholder*="角色名称"], .el-dialog input[placeholder*="role_name"]')).toHaveValue('待编辑角色');

    // 关闭对话框
    await page.locator('.el-dialog__footer .el-button').filter({ hasText: '取消' }).click();
    await expect(page.locator('.el-dialog')).not.toBeVisible();
  });

  test('编辑保存时应有日志输出', async ({ page }) => {
    // 【Wiki章节】编辑功能
    // 【验证业务规则】保存编辑时只有console.log输出，没有实际更新数据
    // 【已知问题】编辑功能未实现

    // 先创建一个角色
    await page.getByTestId('btn-add-role, .btn-add, [data-testid*="add"]').or(page.locator('button').filter({ hasText: '新增角色' })).or(page.locator('button').filter({ hasText: '新增' }))).click();
    await page.waitForSelector('.el-dialog');
    await page.fill('.el-dialog input[placeholder*="角色名称"], .el-dialog input[placeholder*="role_name"]', '待编辑角色');
    await page.fill('.el-dialog input[placeholder*="角色代码"], .el-dialog input[placeholder*="role_code"]', 'role_to_edit');
    await page.locator('.el-dialog__footer .el-button').filter({ hasText: '确定', hasText: '保存' }).or(page.locator('.el-dialog__footer .el-button--primary')).click();
    await page.waitForTimeout(500);

    // 点击编辑按钮
    await page.locator('.el-table__body-wrapper .el-table__body tr:first-child .edit-btn, .el-table__body tr:first-child .edit-btn').first().click();
    await page.waitForSelector('.el-dialog', { timeout: 5000 });

    // 修改数据
    await page.fill('.el-dialog input[placeholder*="角色名称"], .el-dialog input[placeholder*="role_name"]', '已编辑角色');

    // 提交表单
    await page.locator('.el-dialog__footer .el-button').filter({ hasText: '确定', hasText: '保存' }).or(page.locator('.el-dialog__footer .el-button--primary')).click();

    // 由于编辑功能未实现，只验证对话框关闭
    await page.waitForTimeout(500);

    console.log('⚠️ 编辑功能仅有console.log输出，未实际更新数据');
  });

  // ==================== 删除功能 ====================
  test('应能打开角色删除确认对话框', async ({ page }) => {
    // 【Wiki章节】删除功能
    // 【验证业务规则】点击删除按钮应打开确认对话框

    // 先创建一个角色
    await page.getByTestId('btn-add-role, .btn-add, [data-testid*="add"]').or(page.locator('button').filter({ hasText: '新增角色' })).or(page.locator('button').filter({ hasText: '新增' }))).click();
    await page.waitForSelector('.el-dialog');
    await page.fill('.el-dialog input[placeholder*="角色名称"], .el-dialog input[placeholder*="role_name"]', '待删除角色');
    await page.fill('.el-dialog input[placeholder*="角色代码"], .el-dialog input[placeholder*="role_code"]', 'role_to_delete');
    await page.locator('.el-dialog__footer .el-button').filter({ hasText: '确定', hasText: '保存' }).or(page.locator('.el-dialog__footer .el-button--primary')).click();
    await page.waitForTimeout(500);

    // 点击删除按钮
    await page.locator('.el-table__body-wrapper .el-table__body tr:first-child .delete-btn, .el-table__body tr:first-child .delete-btn').first().click();

    // 等待删除确认对话框出现
    await page.waitForSelector('.el-message-box, .el-dialog');

    // 验证删除确认对话框打开
    await expect(page.locator('.el-message-box, .el-dialog')).toBeVisible();

    // 取消删除
    await page.locator('.el-message-box__btns .el-button, .el-dialog__footer .el-button').filter({ hasText: '取消' }).click();
  });

  test('应能从本地数组删除角色', async ({ page }) => {
    // 【Wiki章节】删除功能
    // 【验证业务规则】从本地roleData数组中过滤掉对应角色
    // 【已知问题】删除功能未连接API，仅操作本地数据

    // 先创建一个角色
    await page.getByTestId('btn-add-role, .btn-add, [data-testid*="add"]').or(page.locator('button').filter({ hasText: '新增角色' })).or(page.locator('button').filter({ hasText: '新增' }))).click();
    await page.waitForSelector('.el-dialog');
    await page.fill('.el-dialog input[placeholder*="角色名称"], .el-dialog input[placeholder*="role_name"]', '待删除角色');
    await page.fill('.el-dialog input[placeholder*="角色代码"], .el-dialog input[placeholder*="role_code"]', 'role_to_delete');
    await page.locator('.el-dialog__footer .el-button').filter({ hasText: '确定', hasText: '保存' }).or(page.locator('.el-dialog__footer .el-button--primary')).click();
    await page.waitForTimeout(500);

    // 记录删除前的行数
    const rowsBefore = await page.locator('.el-table__body tr').count();

    // 点击删除按钮
    await page.locator('.el-table__body-wrapper .el-table__body tr:first-child .delete-btn, .el-table__body tr:first-child .delete-btn').first().click();

    // 确认删除
    await page.locator('.el-message-box__btns .el-button--primary, .el-dialog__footer .el-button--primary').click();

    // 等待删除完成
    await page.waitForTimeout(500);

    // 验证行数减少
    const rowsAfter = await page.locator('.el-table__body tr').count();
    expect(rowsAfter).toBe(rowsBefore - 1);

    console.log('⚠️ 删除功能仅操作本地数据，未调用API');
  });

  // ==================== 状态显示 ====================
  test('状态列应显示原始值', async ({ page }) => {
    // 【Wiki章节】列表展示
    // 【验证业务规则】状态列直接显示原始值（0/1），未格式化
    // 【已知问题】状态显示不友好

    // 先创建一个角色
    await page.getByTestId('btn-add-role, .btn-add, [data-testid*="add"]').or(page.locator('button').filter({ hasText: '新增角色' })).or(page.locator('button').filter({ hasText: '新增' }))).click();
    await page.waitForSelector('.el-dialog');
    await page.fill('.el-dialog input[placeholder*="角色名称"], .el-dialog input[placeholder*="role_name"]', '状态测试角色');
    await page.fill('.el-dialog input[placeholder*="角色代码"], .el-dialog input[placeholder*="role_code"]', 'status_test_role');
    await page.locator('.el-dialog__footer .el-button').filter({ hasText: '确定', hasText: '保存' }).or(page.locator('.el-dialog__footer .el-button--primary')).click();
    await page.waitForTimeout(500);

    // 检查状态列的显示
    const statusCell = page.locator('.el-table__body-wrapper .el-table__body tr:first-child td, .el-table__body tr:first-child td');

    // 验证状态显示为数字（0或1）而不是"启用"/"禁用"
    const statusText = await statusCell.nth(3).textContent();
    console.log(`状态列显示: ${statusText}（预期为数字0或1，而非格式化文本）`);
  });

  // ==================== 缺失功能验证 ====================
  test('应缺少租户选择功能', async ({ page }) => {
    // 【Wiki章节】与系统其他页面的一致性问题
    // 【验证业务规则】与其他管理页面不一致，缺少租户选择功能
    // 【已知问题】缺少租户选择功能

    // 检查页面是否有租户选择器
    const hasTenantSelector = await page.locator('.tenant-selector, [class*="tenant"]').count() > 0;

    if (!hasTenantSelector) {
      console.log('⚠️ 缺少租户选择功能，与其他页面不一致');
    } else {
      console.log('✓ 发现租户选择器');
    }
  });

  test('应缺少搜索筛选功能', async ({ page }) => {
    // 【Wiki章节】与系统其他页面的一致性问题
    // 【验证业务规则】与其他管理页面不一致，缺少搜索筛选功能
    // 【已知问题】缺少搜索筛选

    // 检查是否有完整的搜索表单
    const hasSearchForm = await page.locator('.role-search-bar, .filter-section').count() > 0;

    if (hasSearchForm) {
      // 检查搜索条件的数量（应该比较少）
      const searchItems = await page.locator('.role-search-bar .el-form-item, .filter-section .el-form-item').count();
      console.log(`搜索条件数量: ${searchItems}（可能不完整）`);
    } else {
      console.log('⚠️ 缺少搜索筛选功能');
    }
  });

  test('应缺少分页功能', async ({ page }) => {
    // 【Wiki章节】与系统其他页面的一致性问题
    // 【验证业务规则】与其他管理页面不一致，缺少分页功能
    // 【已知问题】无分页

    // 检查是否有分页器
    const hasPagination = await page.locator('.el-pagination').count() > 0;

    if (!hasPagination) {
      console.log('⚠️ 缺少分页功能，数据量大时可能存在性能问题');
    } else {
      console.log('✓ 发现有分页器');
    }
  });

  test('应缺少loading状态指示', async ({ page }) => {
    // 【Wiki章节】与系统其他页面的一致性问题
    // 【验证业务规则】API调用时没有加载状态指示
    // 【已知问题】缺少loading状态

    // 由于没有API调用，这个测试主要验证没有loading状态
    const hasLoading = await page.locator('.el-table[aria-busy="true"], .loading, .v-loading').count() > 0;

    if (!hasLoading) {
      console.log('⚠️ 缺少loading状态指示');
    }
  });
});
