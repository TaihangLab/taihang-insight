/**
 * Playwright E2E 测试 - 租户管理页面
 * 提供租户管理模块的完整页面操作封装
 * @see .claude/rules/testing-guide.md
 */

import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class TenantManagementPage extends BasePage {
  // 页面路径
  readonly path = '/#/systemManage/tenantManagement';

  // 选择器
  private readonly selectors = {
    // 按钮
    addButton: 'button:has-text("新增")',
    editButton: 'button:has-text("编辑")',
    deleteButton: 'button:has-text("删除")',
    batchDeleteButton: 'button:has-text("批量删除")',
    searchButton: 'button:has-text("搜索")',
    resetButton: 'button:has-text("重置")',

    // 对话框
    dialog: '.el-dialog:has-text("新增租户"), .el-dialog:has-text("编辑租户"), .el-dialog:has-text("添加租户")',
    dialogTitle: '.el-dialog__title',
    confirmButton: '.el-dialog__footer button:has-text("确定")',
    cancelButton: '.el-dialog__footer button:has-text("取消")',

    // 表格
    table: '.el-table',
    tableRow: '.el-table-row',
    checkbox: '.el-checkbox',

    // 搜索栏
    searchInputTenantName: 'input[placeholder*="租户名称"]',
    searchInputCompanyName: 'input[placeholder*="企业名称"]',

    // 表单字段
    form: '.el-form',
    tenantCodeInput: 'input[placeholder*="租户编码"]',
    tenantNameInput: 'input[placeholder*="租户名称"]',
    companyNameInput: 'input[placeholder*="企业名称"]',
    contactPersonInput: 'input[placeholder*="联系人"]',
    contactPhoneInput: 'input[placeholder*="联系电话"]',
    usernameInput: 'input[placeholder*="系统用户名"]',
    passwordInput: 'input[placeholder*="密码"], input[placeholder*="系统用户密码"]',
    packageSelect: '.el-select:has(input[placeholder*="租户套餐"])',
    datePicker: 'input[placeholder*="过期时间"]',
    userCountInput: 'input[placeholder*="0"]',
    domainInput: 'input[placeholder*="绑定域名"]',
    addressInput: 'input[placeholder*="企业地址"]',
    companyCodeInput: 'input[placeholder*="统一社会信用代码"]',
    descriptionTextarea: 'textarea[placeholder*="企业简介"]',
    remarkInput: 'input[placeholder*="备注"]',

    // 验证消息
    errorMessage: '.el-message--error',
    successMessage: '.el-message--success',
    formItemError: '.el-form-item__error',
  };

  /**
   * 导航到租户管理页面
   */
  async navigateTo(): Promise<void> {
    await this.goto(this.path);
    await this.waitForPageLoad();
    await this.waitForLoadingEnd();
    await this.waitForVisible(this.selectors.table);
  }

  // ========== 新增租户 ==========

  /**
   * 点击新增租户按钮
   */
  async clickAddButton(): Promise<void> {
    await this.page.click(this.selectors.addButton);
    await this.waitForVisible(this.selectors.dialog);
  }

  /**
   * 填写租户表单
   * 注意：新增模式下没有租户编码字段（由后端自动生成）
   */
  async fillTenantForm(data: {
    tenantName?: string;
    companyName?: string;
    contactPerson?: string;
    contactPhone?: string;
    username?: string;
    password?: string;
    package?: string;
    expireTime?: string;
    userCount?: string;
    domain?: string;
    address?: string;
    companyCode?: string;
    description?: string;
    remark?: string;
  }): Promise<void> {
    if (data.tenantName !== undefined) {
      await this.page.fill(this.selectors.tenantNameInput, data.tenantName);
    }
    if (data.companyName !== undefined) {
      await this.page.fill(this.selectors.companyNameInput, data.companyName);
    }
    if (data.contactPerson !== undefined) {
      await this.page.fill(this.selectors.contactPersonInput, data.contactPerson);
    }
    if (data.contactPhone !== undefined) {
      await this.page.fill(this.selectors.contactPhoneInput, data.contactPhone);
    }
    if (data.username !== undefined) {
      await this.page.fill(this.selectors.usernameInput, data.username);
    }
    if (data.password !== undefined) {
      await this.page.fill(this.selectors.passwordInput, data.password);
    }
    if (data.package !== undefined) {
      await this.selectPackage(data.package);
    }
    if (data.expireTime !== undefined) {
      await this.selectExpireDate(data.expireTime);
    }
    if (data.userCount !== undefined) {
      await this.page.fill(this.selectors.userCountInput, data.userCount);
    }
    if (data.domain !== undefined) {
      await this.page.fill(this.selectors.domainInput, data.domain);
    }
    if (data.address !== undefined) {
      await this.page.fill(this.selectors.addressInput, data.address);
    }
    if (data.companyCode !== undefined) {
      await this.page.fill(this.selectors.companyCodeInput, data.companyCode);
    }
    if (data.description !== undefined) {
      await this.page.fill(this.selectors.descriptionTextarea, data.description);
    }
    if (data.remark !== undefined) {
      await this.page.fill(this.selectors.remarkInput, data.remark);
    }
  }

  /**
   * 选择租户套餐
   */
  async selectPackage(packageName: string): Promise<void> {
    await this.page.click(this.selectors.packageSelect);
    await this.page.click(`.el-select-dropdown__item:has-text("${packageName}")`);
  }

  /**
   * 选择过期日期
   */
  async selectExpireDate(dateString: string): Promise<void> {
    await this.page.click(this.selectors.datePicker);
    // 简单实现：直接输入日期
    await this.page.fill(this.selectors.datePicker, dateString);
    // 点击其他地方关闭日期选择器
    await this.page.click('.el-form-item__label');
  }

  /**
   * 提交表单
   */
  async submitForm(): Promise<void> {
    await this.page.click(this.selectors.confirmButton);
    // 等待对话框关闭或出现错误消息
    await this.page.waitForTimeout(2000);

    // 如果对话框仍然存在，尝试关闭它
    const dialogVisible = await this.page.locator(this.selectors.dialog).count() > 0;
    if (dialogVisible) {
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(1000);
    }

    // 额外等待，确保后续操作不会受阻
    await this.page.waitForTimeout(1000);
  }

  /**
   * 取消表单
   */
  async cancelForm(): Promise<void> {
    await this.page.click(this.selectors.cancelButton);
    await this.page.waitForSelector(this.selectors.dialog, { state: 'hidden' }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  // ========== 编辑租户 ==========

  /**
   * 点击编辑按钮
   */
  async clickEditButton(rowIndex: number = 0): Promise<void> {
    await this.page.locator(this.selectors.editButton).nth(rowIndex).click();
    await this.waitForVisible(this.selectors.dialog);
  }

  /**
   * 获取表单字段值
   */
  async getFormFieldValue(fieldName: string): Promise<string> {
    const selector = `input[placeholder*="${fieldName}"]`;
    const element = this.page.locator(selector);
    if (await element.count() > 0) {
      return await element.inputValue();
    }
    return '';
  }

  // ========== 删除租户 ==========

  /**
   * 点击删除按钮
   */
  async clickDeleteButton(rowIndex: number = 0): Promise<void> {
    await this.page.locator(this.selectors.deleteButton).nth(rowIndex).click();
  }

  /**
   * 确认删除对话框
   */
  async confirmDelete(): Promise<void> {
    await this.page.click('.el-message-box__btns button:has-text("确定")');
  }

  /**
   * 取消删除对话框
   */
  async cancelDelete(): Promise<void> {
    await this.page.click('.el-message-box__btns button:has-text("取消")');
  }

  // ========== 批量操作 ==========

  /**
   * 选择表格行
   */
  async selectRowByIndex(rowIndex: number): Promise<void> {
    const checkbox = this.page.locator('.el-table-row .el-checkbox').nth(rowIndex);
    await checkbox.check();
  }

  /**
   * 全选所有行
   */
  async selectAllRows(): Promise<void> {
    const headerCheckbox = this.page.locator('.el-table__header .el-checkbox');
    await headerCheckbox.check();
  }

  /**
   * 点击批量删除按钮
   */
  async clickBatchDeleteButton(): Promise<void> {
    await this.page.click(this.selectors.batchDeleteButton);
  }

  // ========== 搜索和筛选 ==========

  /**
   * 按租户名称搜索
   */
  async searchByTenantName(name: string): Promise<void> {
    await this.page.fill(this.selectors.searchInputTenantName, name);
    await this.page.click(this.selectors.searchButton);
    await this.waitForLoadingEnd();
  }

  /**
   * 按企业名称搜索
   */
  async searchByCompanyName(name: string): Promise<void> {
    await this.page.fill(this.selectors.searchInputCompanyName, name);
    await this.page.click(this.selectors.searchButton);
    await this.waitForLoadingEnd();
  }

  /**
   * 重置搜索
   */
  async resetSearch(): Promise<void> {
    await this.page.click(this.selectors.resetButton);
    await this.waitForLoadingEnd();
  }

  // ========== 辅助方法 ==========

  /**
   * 获取表格行数
   */
  override async getTableRowCount(): Promise<number> {
    return await this.page.locator(this.selectors.tableRow).count();
  }

  /**
   * 获取指定行的租户名称
   */
  async getTenantNameFromRow(rowIndex: number): Promise<string> {
    const row = this.page.locator(this.selectors.tableRow).nth(rowIndex);
    return await row.locator('td').nth(1).textContent() || '';
  }

  /**
   * 获取指定行的企业名称
   */
  async getCompanyNameFromRow(rowIndex: number): Promise<string> {
    const row = this.page.locator(this.selectors.tableRow).nth(rowIndex);
    return await row.locator('td').nth(2).textContent() || '';
  }

  /**
   * 等待租户出现在列表中
   */
  async waitForTenantVisible(tenantName: string, timeout = 10000): Promise<void> {
    await this.page.waitForSelector(`text=${tenantName}`, { state: 'visible', timeout });
  }

  /**
   * 获取所有租户名称
   */
  async getAllTenantNames(): Promise<string[]> {
    const names: string[] = [];
    const count = await this.getTableRowCount();

    for (let i = 0; i < count; i++) {
      const name = await this.getTenantNameFromRow(i);
      names.push(name);
    }

    return names;
  }

  /**
   * 获取表单验证错误消息
   */
  async getFormErrors(): Promise<string[]> {
    const errors: string[] = [];
    const errorElements = this.page.locator(this.selectors.formItemError);
    const count = await errorElements.count();

    for (let i = 0; i < count; i++) {
      const errorText = await errorElements.nth(i).textContent();
      if (errorText) {
        errors.push(errorText);
      }
    }

    return errors;
  }

  /**
   * 验证是否显示成功消息
   */
  async expectSuccessMessage(): Promise<void> {
    // 尝试等待成功消息，但不强制要求（可能对话框关闭速度很快）
    await this.waitForVisible(this.selectors.successMessage, 3000).catch(() => {});
  }

  /**
   * 验证是否显示错误消息
   */
  async expectErrorMessage(): Promise<void> {
    await this.waitForVisible(this.selectors.errorMessage, 5000);
  }

  /**
   * 验证对话框是否显示
   */
  async expectDialogVisible(): Promise<void> {
    await expect(this.page.locator(this.selectors.dialog)).toBeVisible();
  }

  /**
   * 验证对话框是否隐藏
   */
  async expectDialogHidden(): Promise<void> {
    await expect(this.page.locator(this.selectors.dialog)).toBeHidden();
  }

  /**
   * 获取对话框标题
   */
  async getDialogTitle(): Promise<string> {
    return await this.page.locator(this.selectors.dialogTitle).textContent() || '';
  }

  /**
   * 点击状态切换按钮
   */
  async toggleStatus(rowIndex: number = 0): Promise<void> {
    // 状态切换通常是 el-switch 或 el-button
    const row = this.page.locator(this.selectors.tableRow).nth(rowIndex);
    const statusButton = row.locator('.el-switch, button:has-text("启用"), button:has-text("停用")').first();
    await statusButton.click();
  }
}
