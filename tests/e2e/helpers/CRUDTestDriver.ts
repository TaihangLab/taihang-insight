/**
 * CRUD 测试驱动抽象层
 *
 * 封装 "新增-查询验证-修改-查询验证-删除-查询验证" 测试模式
 * 确保数据库在每个测试后保持干净
 *
 * @see .claude/rules/testing-guide.md
 */

import { Page } from '@playwright/test';

/**
 * CRUD 操作接口
 * 子类需要实现这些方法来适配具体的页面
 */
export interface CRUDOperations<T, U = Partial<T>> {
  // 创建数据
  create(data: T): Promise<void>;
  // 搜索/查询数据
  search(identifier: string): Promise<void>;
  // 验证数据存在
  verifyExists(identifier: string): Promise<boolean>;
  // 获取数据（用于验证）
  getData(identifier: string): Promise<any>;
  // 更新数据
  update(identifier: string, changes: U): Promise<void>;
  // 删除数据
  delete(identifier: string): Promise<void>;
  // 重置搜索
  resetSearch(): Promise<void>;
}

/**
 * 测试数据生成器类型
 */
export type TestDataGenerator<T> = () => T;

/**
 * CRUD 测试驱动类
 *
 * 使用示例：
 * ```typescript
 * const driver = new CRUDTestDriver({
 *   create: async (data) => await page.fillAndSubmit(data),
 *   search: async (id) => await page.search(id),
 *   verifyExists: async (id) => await page.hasItem(id),
 *   getData: async (id) => await page.getItemData(id),
 *   update: async (id, changes) => await page.updateItem(id, changes),
 *   delete: async (id) => await page.deleteItem(id),
 *   resetSearch: async () => await page.resetSearch(),
 * });
 *
 * await driver.runFullCRUDTest({
 *   originalData: { name: 'test', value: 100 },
 *   modifications: { value: 200 },
 *   identifier: 'name',
 * });
 * ```
 */
export class CRUDTestDriver<T, U = Partial<T>> {
  private page: Page;
  private operations: CRUDOperations<T, U>;

  constructor(page: Page, operations: CRUDOperations<T, U>) {
    this.page = page;
    this.operations = operations;
  }

  /**
   * 运行完整的 CRUD 测试
   * 遵循 "新增 → 查询验证 → 修改 → 查询验证 → 删除 → 查询验证" 模式
   *
   * @param options 测试配置
   * @returns 测试结果摘要
   */
  async runFullCRUDTest(options: {
    originalData: T;
    modifications: U;
    identifier: string; // 用于标识数据的字段名（如 'name', 'code'）
    timeout?: number; // 操作超时时间（毫秒）
  }): Promise<{
    success: boolean;
    steps: {
      step: string;
      status: 'passed' | 'failed';
      duration: number;
      error?: string;
    }[];
  }> {
    const { originalData, modifications, identifier, timeout = 10000 } = options;
    const results: {
      step: string;
      status: 'passed' | 'failed';
      duration: number;
      error?: string;
    }[] = [];

    const identifierValue = (originalData as any)[identifier];

    // ========== 步骤 1: 新增数据 ==========
    const step1Start = Date.now();
    try {
      await this.withTimeout(
        () => this.operations.create(originalData),
        timeout,
        '创建数据超时'
      );
      results.push({
        step: '新增数据',
        status: 'passed',
        duration: Date.now() - step1Start,
      });
    } catch (error) {
      results.push({
        step: '新增数据',
        status: 'failed',
        duration: Date.now() - step1Start,
        error: String(error),
      });
      return { success: false, steps: results };
    }

    // 等待操作完成
    await this.page.waitForTimeout(500);

    // ========== 步骤 2: 查询验证（新增成功）==========
    const step2Start = Date.now();
    try {
      await this.withTimeout(
        () => this.operations.search(identifierValue),
        timeout,
        '搜索数据超时'
      );
      await this.page.waitForTimeout(500);

      const exists = await this.operations.verifyExists(identifierValue);
      if (!exists) {
        throw new Error(`新增验证失败：未找到数据 "${identifierValue}"`);
      }

      results.push({
        step: '查询验证（新增）',
        status: 'passed',
        duration: Date.now() - step2Start,
      });
    } catch (error) {
      results.push({
        step: '查询验证（新增）',
        status: 'failed',
        duration: Date.now() - step2Start,
        error: String(error),
      });
      // 尝试清理失败的数据
      await this.attemptCleanup(identifierValue);
      return { success: false, steps: results };
    }

    // ========== 步骤 3: 修改数据 ==========
    const step3Start = Date.now();
    try {
      await this.withTimeout(
        () => this.operations.update(identifierValue, modifications),
        timeout,
        '修改数据超时'
      );
      results.push({
        step: '修改数据',
        status: 'passed',
        duration: Date.now() - step3Start,
      });
    } catch (error) {
      results.push({
        step: '修改数据',
        status: 'failed',
        duration: Date.now() - step3Start,
        error: String(error),
      });
      // 尝试清理
      await this.attemptCleanup(identifierValue);
      return { success: false, steps: results };
    }

    // 等待操作完成
    await this.page.waitForTimeout(500);

    // ========== 步骤 4: 查询验证（修改成功）==========
    const step4Start = Date.now();
    try {
      // 重置搜索以获取最新数据
      await this.operations.resetSearch();
      await this.page.waitForTimeout(500);

      // 根据修改后的值搜索（如果标识符被修改）
      const newIdentifierValue = (modifications as any)[identifier] || identifierValue;
      await this.operations.search(newIdentifierValue);
      await this.page.waitForTimeout(500);

      const data = await this.operations.getData(newIdentifierValue);
      if (!data) {
        throw new Error(`修改验证失败：未找到数据 "${newIdentifierValue}"`);
      }

      // 验证修改是否生效
      const modificationsObj = modifications as Record<string, unknown>;
      for (const [key, value] of Object.entries(modificationsObj)) {
        if (data[key] !== value) {
          throw new Error(
            `修改验证失败：字段 "${key}" 期望 "${value}"，实际 "${data[key]}"`
          );
        }
      }

      results.push({
        step: '查询验证（修改）',
        status: 'passed',
        duration: Date.now() - step4Start,
      });
    } catch (error) {
      results.push({
        step: '查询验证（修改）',
        status: 'failed',
        duration: Date.now() - step4Start,
        error: String(error),
      });
      // 尝试清理
      await this.attemptCleanup(identifierValue);
      return { success: false, steps: results };
    }

    // ========== 步骤 5: 删除数据 ==========
    const step5Start = Date.now();
    try {
      await this.withTimeout(
        () => this.operations.delete(identifierValue),
        timeout,
        '删除数据超时'
      );
      results.push({
        step: '删除数据',
        status: 'passed',
        duration: Date.now() - step5Start,
      });
    } catch (error) {
      results.push({
        step: '删除数据',
        status: 'failed',
        duration: Date.now() - step5Start,
        error: String(error),
      });
      return { success: false, steps: results };
    }

    // 等待删除完成
    await this.page.waitForTimeout(500);

    // ========== 步骤 6: 查询验证（删除成功）==========
    const step6Start = Date.now();
    try {
      await this.operations.resetSearch();
      await this.page.waitForTimeout(500);

      await this.operations.search(identifierValue);
      await this.page.waitForTimeout(500);

      const stillExists = await this.operations.verifyExists(identifierValue);
      if (stillExists) {
        throw new Error(`删除验证失败：数据 "${identifierValue}" 仍然存在`);
      }

      results.push({
        step: '查询验证（删除）',
        status: 'passed',
        duration: Date.now() - step6Start,
      });
    } catch (error) {
      results.push({
        step: '查询验证（删除）',
        status: 'failed',
        duration: Date.now() - step6Start,
        error: String(error),
      });
      return { success: false, steps: results };
    }

    return {
      success: true,
      steps: results,
    };
  }

  /**
   * 运行仅创建和删除的测试（用于测试清理）
   */
  async runCreateDeleteTest(options: {
    data: T;
    identifier: string;
    timeout?: number;
  }): Promise<boolean> {
    const { data, identifier, timeout = 10000 } = options;
    const identifierValue = (data as any)[identifier];

    try {
      // 创建
      await this.withTimeout(
        () => this.operations.create(data),
        timeout,
        '创建数据超时'
      );
      await this.page.waitForTimeout(500);

      // 验证创建成功
      await this.operations.search(identifierValue);
      await this.page.waitForTimeout(500);

      // 删除
      await this.withTimeout(
        () => this.operations.delete(identifierValue),
        timeout,
        '删除数据超时'
      );
      await this.page.waitForTimeout(500);

      // 验证删除成功
      await this.operations.resetSearch();
      await this.operations.search(identifierValue);
      await this.page.waitForTimeout(500);

      const exists = await this.operations.verifyExists(identifierValue);
      return !exists;
    } catch (error) {
      console.error('创建/删除测试失败:', error);
      // 尝试清理
      await this.attemptCleanup(identifierValue);
      return false;
    }
  }

  /**
   * 批量清理测试数据
   */
  async cleanupTestData(options: {
    searchPattern: string;
    maxAttempts?: number;
  }): Promise<number> {
    const { searchPattern, maxAttempts = 50 } = options;
    let deletedCount = 0;

    try {
      for (let i = 0; i < maxAttempts; i++) {
        await this.operations.search(searchPattern);
        await this.page.waitForTimeout(500);

        const exists = await this.operations.verifyExists(searchPattern);
        if (!exists) {
          break;
        }

        await this.operations.delete(searchPattern);
        await this.page.waitForTimeout(500);
        deletedCount++;
      }
    } catch (error) {
      console.error('批量清理失败:', error);
    }

    return deletedCount;
  }

  /**
   * 尝试清理测试数据（用于失败时）
   */
  private async attemptCleanup(identifier: string): Promise<void> {
    try {
      await this.operations.search(identifier);
      await this.page.waitForTimeout(300);
      await this.operations.delete(identifier);
    } catch (error) {
      // 忽略清理错误
      console.warn('清理失败:', error);
    }
  }

  /**
   * 带超时包装器
   */
  private async withTimeout<T>(
    fn: () => Promise<T>,
    timeout: number,
    message: string
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(message)), timeout)
      ),
    ]);
  }
}

/**
 * 辅助函数：生成唯一的测试数据
 */
export function generateUniqueId(prefix: string = 'TEST'): string {
  return `${prefix}_${Date.now()}`;
}

/**
 * 辅助函数：运行多个独立测试
 */
export async function runParallelTests<T>(
  testDataArray: T[],
  testFn: (data: T, index: number) => Promise<void>
): Promise<void> {
  for (let i = 0; i < testDataArray.length; i++) {
    await testFn(testDataArray[i], i);
  }
}
