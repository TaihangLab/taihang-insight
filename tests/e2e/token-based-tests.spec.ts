/**
 * 使用永久 Token 进行 E2E 测试
 * 
 * Token 来源：/docs/rbac/账号.md
 * 这些 token 是永久有效的，可以在测试中直接使用
 */

import { test, expect } from '@playwright/test';

// 永久有效的测试 Token
const TEST_TOKENS = {
  /** 超管账号 Token（拥有所有权限） */
  ADMIN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2dpblR5cGUiOiJsb2dpbiIsImxvZ2luSWQiOiJzeXNfdXNlcjp0aF8wIiwicm5TdHIiOiIzYzVkNTJkNGQ1Y2QzMTc5NTNmNWY5ZDRiNDg1YWJmNCIsImNsaWVudGlkIjoiMDJiYjljZmU4ZDc4NDRlY2FlOGRiZTYyYjFiYTk3MWEiLCJ0ZW5hbnRJZCI6IjAiLCJ1c2VySWQiOiJ0aF8wIiwidXNlck5hbWUiOiJzdXBlcmFkbWluIiwiZGVwdElkIjowLCJkZXB0TmFtZSI6IkRlcHQtMCIsImRlcHRDYXRlZ29yeSI6IiIsInJvbGVzIjpbIlJPTEVfQUxMIl0sInBlcm1pc3Npb25zIjpbInRlbmFudDpkZWxldGU6cmVtb3ZlIiwicGFya19tYW5hZ2VtZW50Iiwicm9sZV9tYW5hZ2VtZW50IiwibG9jYWxfdmlkZW8iLCJjYW1lcmE6bGlzdDp2aWV3IiwibG9nOmxpc3Q6dmlldyIsInZpc3VhbF9jZW50ZXIiLCJyb2xlOnBlcm1pc3Npb246dmlldyIsIndhcm5pbmdfbWFuYWdlbWVudCIsImRldmljZV9za2lsbHMiLCJ2aXN1YWwiLCJyZWFsX3RpbWVfbW9uaXRvcmluZyIsImNvbnRyb2wiLCJyZXZpZXdfcmVjb3JkcyIsImFpLm1vZGVscyIsImRldmljZXMiLCJlZGdlIiwid2FybmluZ19hcmNoaXZlcyIsInN0YXRpc3RpY3NfYW5hbHlzaXMiLCJtb2RlbHMiLCJ1c2VyOnBhc3N3b3JkOnJlc2V0IiwiYXBwbGljYXRpb25fc2V0dGluZ3MiLCJ1c2VyOnJvbGU6dmlldyIsInBlcm1pc3Npb246dXBkYXRlOmVkaXQiLCJsb2dfcmVjb3JkcyIsInNraWxsOmxpc3Q6dmlldyIsInVzZXI6dXBkYXRlOmVkaXQiLCJjYW1lcmFfbWFuYWdlbWVudCIsInVzZXI6Y3JlYXRlOmFkZCIsInRlbmFudDpjcmVhdGU6YWRkIiwicm9sZTpsaXN0OnZpZXciLCJtdWx0aW1vZGFsX3JldmlldyIsInBvc2l0aW9uOmxpc3Q6dmlldyIsInVzZXJfbWFuYWdlbWVudCIsInBvc2l0aW9uX21hbmFnZW1lbnQiLCJjYW1lcmFfbWFuYWdlbWVudF9tYWluIiwibW9uaXRvcmluZyIsImRlcGFydG1lbnRfbWFuYWdlbWVudCIsInNraWxscy5sbG0iLCJwcm9maWxlIiwidGVuYW50OnVwZGF0ZTplZGl0IiwiZWRnZV9ib3g6bGlzdDp2aWV3Iiwic3lzdGVtIiwicGVybWlzc2lvbl9tYW5hZ2VtZW50IiwiY2FtZXJhOmRlbGV0ZTpyZW1vdmUiLCJ1c2VyOmxpc3Q6dmlldyIsImFsZ29yaXRobV9pbmZlcmVuY2UiLCJwb3NpdGlvbjp1cGRhdGU6ZWRpdCIsIm1vZGVsX2xpc3QiLCJ1c2VyOnJvbGU6YXNzaWduOmFkZCIsImVkZ2Vfc2VydmVyOmxpc3Q6dmlldyIsInRlbmFudDpsaXN0OnZpZXciLCJtdWx0aW1vZGFsX2xsbV9za2lsbHMiLCJpbnRlbGxpZ2VudF9yZXZpZXciLCJwb3NpdGlvbjpkZWxldGU6cmVtb3ZlIiwidGVuYW50X21hbmFnZW1lbnQiLCJwYXJrOmxpc3Q6dmlldyIsInJvbGU6ZGVsZXRlOnJlbW92ZSIsImVkZ2VfYm94IiwicGVybWlzc2lvbjpjb2RlOnZhbGlkYXRlIiwiZWRnZV9zZXJ2ZXIiLCJkZXB0OnVwZGF0ZTplZGl0Iiwia25vd2xlZGdlX2Jhc2UiLCJza2lsbHMiLCJwZXJtaXNzaW9uOmNoZWNrOnZlcmlmeSIsInBlcm1pc3Npb246ZGV0YWlsOnZpZXciLCJyb2xlOnBlcm1pc3Npb246cmVtb3ZlOmRlbGV0ZSIsInBlcm1pc3Npb246cm9sZTp2aWV3IiwicGVybWlzc2lvbjpkZWxldGU6cmVtb3ZlIiwidXNlcjpkZWxldGU6YmF0Y2giLCJwZXJtaXNzaW9uOmNyZWF0ZTphZGQiLCJ1c2VyOmRlbGV0ZTpyZW1vdmUiLCJkZXB0OmRlbGV0ZTpyZW1vdmUiLCJwZXJtaXNzaW9uOnRyZWU6dmlldyIsImRlcHQ6Y3JlYXRlOmFkZCIsInJvbGU6Y3JlYXRlOmFkZCIsInVzZXI6cGVybWlzc2lvbjp2aWV3IiwidGVuYW50OmRlbGV0ZTpiYXRjaCIsInBvc2l0aW9uOmNyZWF0ZTphZGQiLCJkZXB0OnRyZWU6dmlldyIsInJvbGU6dXNlcjp2aWV3Iiwicm9sZTp1cGRhdGU6ZWRpdCIsInJvbGUtcGVybWlzc2lvbjphc3NpZ246YWRkIiwicGVybWlzc2lvbjpzdGF0dXM6dXBkYXRlIiwidXNlci1yb2xlOmFzc2lnbjphZGQiLCJkZXB0Omxpc3Q6dmlldyIsInVzZXItcm9sZTpyZW1vdmU6ZGVsZXRlIl0sImV4cCI6MTc3Mzc0OTgzNH0.TPsywlO7heqb9dsdvBG7r_5jKpTkGvPJiqwSYtsgVCA',
  
  /** 普通用户 Token */
  USER: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsb2dpblR5cGUiOiJsb2dpbiIsImxvZ2luSWQiOiJzeXNfdXNlcjoxOTgyNzE0MTA5NjgwNDk2NjQxIiwicm5TdHIiOiJ0TVo1YjBUZnFvdlVBVkNvcHVqUWdOM0xpRTBRcnQ3MSIsImNsaWVudGlkIjoiMDJiYjljZmU4ZDc4NDRlY2FlOGRiZTYyYjFiYTk3MWEiLCJ0ZW5hbnRJZCI6IjAwMDAwMCIsInVzZXJJZCI6MTk4MjcxNDEwOTY4MDQ5NjY0MSwidXNlck5hbWUiOiJ6dHNNYW5hZ2VyIiwiZGVwdElkIjoxOTgyNzEzNjYzNDE5MTMzOTUzLCJkZXB0TmFtZSI6IiIsImRlcHRDYXRlZ29yeSI6IiJ9.3sVts7xt7-kbKZQ-1z37qqjuwGlAlBm8ugnUvs6CHfE',
} as const;

test.describe('使用永久 Token 的 E2E 测试 - 超管权限', () => {
  // 在测试开始前设置 Token
  test.beforeEach(async ({ page }) => {
    // 设置超管 Token
    await page.addInitScript(() => {
      localStorage.setItem(
        'Admin-Token',
        TEST_TOKENS.ADMIN
      );
    });
  });

  test('应该能够访问系统管理页面', async ({ page }) => {
    // 直接访问用户管理页面（需要 Token）
    await page.goto('/#/systemManage/userManagement');
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 验证页面加载成功（通过 URL 和表格）
    await expect(page).toHaveURL(/.*userManagement/);
    await expect(page.locator('.el-table, .user-table')).toBeVisible();
  });

  test('应该能够访问角色管理页面', async ({ page }) => {
    await page.goto('/#/systemManage/roleManagement');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*roleManagement/);
    await expect(page.locator('.el-table, .role-table')).toBeVisible();
  });

  test('应该能够访问租户管理页面', async ({ page }) => {
    await page.goto('/#/systemManage/tenantManagement');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*tenantManagement/);
    await expect(page.locator('.el-table, .tenant-table')).toBeVisible();
  });

  test('应该能够访问职位管理页面', async ({ page }) => {
    await page.goto('/#/systemManage/positionManagement');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*positionManagement/);
    await expect(page.locator('.el-table, .position-table')).toBeVisible();
  });

  test('应该能够访问部门管理页面', async ({ page }) => {
    await page.goto('/#/systemManage/departmentManagement');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*departmentManagement/);
    await expect(page.locator('.el-table, .department-table')).toBeVisible();
  });

  test('应该能够访问权限管理页面', async ({ page }) => {
    await page.goto('/#/systemManage/permissionManagement');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*permissionManagement/);
    await expect(page.locator('.el-tree, .permission-tree')).toBeVisible();
  });
});

test.describe('使用普通用户 Token 的测试', () => {
  test.beforeEach(async ({ page }) => {
    // 设置普通用户 Token
    await page.addInitScript(() => {
      localStorage.setItem(
        'Admin-Token',
        TEST_TOKENS.USER
      );
    });
  });

  test('普通用户应该能够访问可视化中心', async ({ page }) => {
    await page.goto('/#/visualCenter');
    await page.waitForLoadState('networkidle');
    
    // 验证页面正常加载
    await expect(page).toHaveURL(/.*visualCenter/);
  });

  test('普通用户应该能够访问实时监控', async ({ page }) => {
    await page.goto('/#/monitoring/realtime');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*realtime/);
  });
});
