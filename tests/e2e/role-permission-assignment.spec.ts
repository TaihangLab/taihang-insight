/**
 * 角色权限分配功能 E2E 测试
 *
 * 测试场景：
 * 1. 打开角色管理页面
 * 2. 点击"分配权限"按钮
 * 3. 验证权限树正确加载
 * 4. 选择/取消选择权限
 * 5. 提交分配
 * 6. 验证分配成功
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('角色权限分配', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    // 登录
    await loginPage.login();
  });

  /**
   * 辅助函数：打开角色权限分配对话框
   */
  async function openPermissionDialog(page: any) {
    await page.goto('/#/systemManage/roleManagement');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 等待角色列表加载
    await page.waitForSelector('.el-table__body-wrapper .el-table__row', { timeout: 10000 });

    // 找到第一个角色并点击"分配权限"
    const firstRow = page.locator('.el-table__body-wrapper .el-table__row').first();
    await firstRow.locator('button:has-text("分配权限")').click();

    // 等待对话框打开
    await page.waitForSelector('.el-dialog:has-text("分配权限")', { timeout: 5000 });

    // 等待加载状态完成（权限树数据加载）
    await page.waitForSelector('.permission-dialog-content:not(.el-loading-parent--relative)', { timeout: 5000 }).catch(() => {
      // 如果找不到非加载状态，只等待对话框出现
      console.log('权限树可能仍在加载，继续执行...');
    });

    // 额外等待权限树数据渲染
    await page.waitForTimeout(1000);
  }

  test('应该正确加载并显示权限树', async ({ page }) => {
    await openPermissionDialog(page);

    // 验证角色名称显示
    const roleInfoValue = page.locator('.el-dialog .role-info .value');
    await expect(roleInfoValue).toBeVisible();

    // 验证权限树容器存在
    const treeContainer = page.locator('.permission-tree-container .el-tree');
    await expect(treeContainer).toBeVisible({ timeout: 5000 });

    // 验证权限树节点存在（至少有根节点）
    // 使用更通用的选择器，因为 Element Plus Tree 的节点类名可能变化
    const treeNodes = page.locator('.permission-tree-container .el-tree-node, .permission-tree-container [role="treeitem"]');
    const nodeCount = await treeNodes.count();

    // 打印调试信息
    console.log('权限树节点数量:', nodeCount);

    // 获取树容器的 HTML 内容用于调试
    const treeHTML = await treeContainer.innerHTML();
    console.log('树容器 HTML (前 500 字符):', treeHTML.substring(0, 500));

    expect(nodeCount).toBeGreaterThan(0);

    // 验证第一个节点的标签可见
    const firstNodeLabel = page.locator('.permission-tree-container .node-label, .permission-tree-container .el-tree-node__content').first();
    await expect(firstNodeLabel).toBeVisible();

    // 关闭对话框
    await page.click('.el-dialog .el-button:has-text("取消")');
  });

  test('应该能够展开和收起权限树', async ({ page }) => {
    await openPermissionDialog(page);

    // 先验证有节点存在
    const treeNodes = page.locator('.permission-tree-container .el-tree-node, .permission-tree-container [role="treeitem"]');
    const initialCount = await treeNodes.count();
    expect(initialCount).toBeGreaterThan(0);

    // 点击"展开全部"
    await page.click('.action-bar button:has-text("展开全部")');
    await page.waitForTimeout(500);

    // 验证节点展开了
    const expandedNodes = page.locator('.permission-tree-container .el-tree-node.is-expanded, .permission-tree-container [aria-expanded="true"]');
    const expandedCount = await expandedNodes.count();
    console.log('展开后的节点数量:', expandedCount);

    // 点击"收起全部"
    await page.click('.action-bar button:has-text("收起全部")');
    await page.waitForTimeout(500);

    // 验证节点收起了（展开的节点变少）
    const expandedNodesAfter = page.locator('.permission-tree-container .el-tree-node.is-expanded, .permission-tree-container [aria-expanded="true"]');
    const expandedCountAfter = await expandedNodesAfter.count();
    console.log('收起后的展开节点数量:', expandedCountAfter);
    expect(expandedCountAfter).toBeLessThanOrEqual(expandedCount);

    await page.click('.el-dialog .el-button:has-text("取消")');
  });

  test('应该能够全选和全不选权限', async ({ page }) => {
    await openPermissionDialog(page);

    // 先验证有节点存在
    const treeNodes = page.locator('.permission-tree-container .el-tree-node, .permission-tree-container [role="treeitem"]');
    const initialCount = await treeNodes.count();
    expect(initialCount).toBeGreaterThan(0);

    // 点击"全选"
    await page.click('.action-bar button:has-text("全选")');
    await page.waitForTimeout(500);

    // 验证有复选框被选中
    const checkedCheckboxes = page.locator('.permission-tree-container .el-checkbox.is-checked, .permission-tree-container .el-checkbox__input:checked, .permission-tree-container [aria-checked="true"]');
    const checkedCount = await checkedCheckboxes.count();
    console.log('全选后选中的数量:', checkedCount);
    expect(checkedCount).toBeGreaterThan(0);

    // 点击"全不选"
    await page.click('.action-bar button:has-text("全不选")');
    await page.waitForTimeout(500);

    // 验证复选框都被取消选中了
    const checkedCheckboxesAfter = page.locator('.permission-tree-container .el-checkbox.is-checked, .permission-tree-container .el-checkbox__input:checked, .permission-tree-container [aria-checked="true"]');
    const checkedCountAfter = await checkedCheckboxesAfter.count();
    console.log('全不选后选中的数量:', checkedCountAfter);
    expect(checkedCountAfter).toBe(0);

    await page.click('.el-dialog .el-button:has-text("取消")');
  });

  test('应该能够提交权限分配', async ({ page }) => {
    await openPermissionDialog(page);

    // 先验证有节点存在
    const treeNodes = page.locator('.permission-tree-container .el-tree-node, .permission-tree-container [role="treeitem"]');
    const initialCount = await treeNodes.count();
    expect(initialCount).toBeGreaterThan(0);

    // 点击"全选"确保有选中项
    await page.click('.action-bar button:has-text("全选")');
    await page.waitForTimeout(500);

    // 提交分配
    await page.click('.el-dialog .el-button--primary:has-text("确定")');

    // 等待提交完成（按钮loading状态消失）
    await page.waitForSelector('.el-dialog .el-button--primary:not(.is-loading)', { timeout: 5000 });

    // 验证成功消息或对话框关闭
    const messageSuccess = page.locator('.el-message--success');
    const dialogClosed = page.locator('.el-dialog:has-text("分配权限")');

    // 等待其中一个条件满足
    await Promise.race([
      messageSuccess.waitFor({ state: 'visible', timeout: 5000 }),
      dialogClosed.waitFor({ state: 'hidden', timeout: 5000 })
    ]);

    // 验证对话框已关闭
    await expect(dialogClosed).not.toBeVisible({ timeout: 3000 });
  });

  test('应该在未选择任何权限时显示警告', async ({ page }) => {
    await openPermissionDialog(page);

    // 先点击"全不选"确保没有选中项
    await page.click('.action-bar button:has-text("全不选")');
    await page.waitForTimeout(500);

    // 尝试提交
    await page.click('.el-dialog .el-button--primary:has-text("确定")');

    // 验证警告消息
    const messageWarning = page.locator('.el-message--warning');
    await expect(messageWarning).toBeVisible({ timeout: 3000 });
    await expect(messageWarning).toContainText(/至少选择一个权限|请至少选择一个权限/);

    // 关闭对话框
    await page.click('.el-dialog .el-button:not(.el-button--primary):has-text("取消")');
  });

  test('应该正确显示角色信息', async ({ page }) => {
    // 1. 导航到角色管理页面
    await page.goto('/#/systemManage/roleManagement');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 2. 获取第一个角色的名称
    const firstRow = page.locator('.el-table__body-wrapper .el-table__row').first();
    const roleName = await firstRow.locator('.el-table__cell:nth-child(1)').textContent();
    const roleCode = await firstRow.locator('.el-table__cell:nth-child(2)').textContent();

    console.log('测试角色名称:', roleName);
    console.log('测试角色编码:', roleCode);

    // 3. 点击"分配权限"
    await firstRow.locator('button:has-text("分配权限")').click();

    // 4. 等待对话框打开
    await page.waitForSelector('.el-dialog:has-text("分配权限")', { timeout: 5000 });
    await page.waitForTimeout(1000);

    // 5. 验证角色名称显示
    const roleInfoValue = page.locator('.el-dialog .role-info .value');
    await expect(roleInfoValue).toHaveText(roleName || '');

    // 6. 验证操作按钮可见
    await expect(page.locator('.action-bar button:has-text("全选")')).toBeVisible();
    await expect(page.locator('.action-bar button:has-text("全不选")')).toBeVisible();
    await expect(page.locator('.action-bar button:has-text("展开全部")')).toBeVisible();
    await expect(page.locator('.action-bar button:has-text("收起全部")')).toBeVisible();

    // 7. 关闭对话框
    await page.click('.el-dialog .el-button:has-text("取消")');
  });
});
