/**
 * Playwright E2E 测试 - 系统管理页面
 * 提供 RBAC 各模块的通用操作
 */

import { BasePage } from './BasePage';

export class SystemManagementPage extends BasePage {
  /**
   * 打开系统管理子页面
   */
  async openPage(moduleName: 'userManagement' | 'roleManagement' | 'departmentManagement' | 'positionManagement' | 'tenantManagement' | 'permissionManagement'): Promise<void> {
    await this.goto(`/#/systemManage/${moduleName}`);
    await this.waitForPageLoad();
    await this.waitForLoadingEnd();
  }

  /**
   * 点击新增按钮
   */
  async clickAddButton(buttonText: string = '新增'): Promise<void> {
    await this.page.click(`button:has-text("${buttonText}")`);
  }

  /**
   * 点击编辑按钮（第一行）
   */
  async clickEditButton(index = 0): Promise<void> {
    const editButtons = this.page.locator('button:has-text("编辑")');
    await editButtons.nth(index).click();
  }

  /**
   * 点击删除按钮（第一行）
   */
  async clickDeleteButton(index = 0): Promise<void> {
    const deleteButtons = this.page.locator('button:has-text("删除")');
    await deleteButtons.nth(index).click();
  }

  /**
   * 确认对话框操作
   */
  async confirmDialog(confirm = true): Promise<void> {
    const button = confirm ? '确定' : '取消';
    await this.page.click(`.el-dialog__footer button:has-text("${button}")`);
  }

  /**
   * 填写表单字段
   */
  async fillFormField(field: {
    placeholder?: string;
    label?: string;
    testId?: string;
  }, value: string): Promise<void> {
    let selector = '';

    if (field.testId) {
      selector = `[data-testid="${field.testId}"]`;
    } else if (field.placeholder) {
      selector = `input[placeholder*="${field.placeholder}"]`;
    } else if (field.label) {
      // 通过 label 查找输入框
      const labelElement = this.page.locator(`.el-form-item__label:has-text("${field.label}")`);
      const formItem = labelElement.locator('..').locator('.el-form-item__content');
      selector = `${formItem} input, ${formItem} textarea, ${formItem} .el-select`;
    }

    await this.page.fill(selector, value);
  }

  /**
   * 选择下拉选项
   */
  async selectOption(selectPlaceholder: string, optionText: string): Promise<void> {
    await this.page.click(`.el-select:has-text("${selectPlaceholder}")`);
    await this.page.click(`.el-select-dropdown__item:has-text("${optionText}")`);
  }

  /**
   * 等待成功提示
   */
  async expectSuccess(): Promise<void> {
    const successLocator = this.page.locator('.el-message--success');
    await successLocator.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * 等待错误提示
   */
  async expectError(message?: string): Promise<void> {
    const errorLocator = this.page.locator('.el-message--error');
    await errorLocator.waitFor({ state: 'visible', timeout: 5000 });
    if (message) {
      const text = await errorLocator.textContent();
      if (!text?.includes(message)) {
        throw new Error(`错误消息不包含: ${message}`);
      }
    }
  }

  /**
   * 验证表格包含文本
   */
  async expectTableContains(text: string): Promise<void> {
    const tableText = await this.page.locator('.el-table').textContent();
    if (!tableText?.includes(text)) {
      throw new Error(`表格不包含文本: ${text}`);
    }
  }

  /**
   * 验证表格不包含文本
   */
  async expectTableNotContains(text: string): Promise<void> {
    const tableText = await this.page.locator('.el-table').textContent();
    if (tableText?.includes(text)) {
      throw new Error(`表格不应包含文本: ${text}`);
    }
  }

  /**
   * 搜索表格
   */
  async search(keyword: string): Promise<void> {
    await this.page.fill('input[placeholder*="搜索"], input[placeholder*="查询"]', keyword);
    await this.page.press('input[placeholder*="搜索"], input[placeholder*="查询"]', 'Enter');
    await this.waitForLoadingEnd();
  }

  /**
   * 获取表格行数
   */
  async getRowCount(): Promise<number> {
    return await this.page.locator('.el-table-row').count();
  }
}
