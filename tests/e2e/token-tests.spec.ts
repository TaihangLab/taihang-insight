/**
 * 使用本地存储的 Token 进行 E2E 测试
 * 
 * 使用方法：
 * 1. 先在浏览器中手动登录（使用超管账号）
 * 2. Token 会自动保存到 localStorage
 * 3. 运行此测试
 * 
 * 或者在浏览器控制台执行：
 * localStorage.setItem('Admin-Token', '你的 token');
 */

import { test, expect } from '@playwright/test';

test.describe('使用 localStorage 中的 Token 进行测试', () => {
  // 从文档中获取永久 Token（如果 localStorage 中没有）
  const FALLBACK_TOKENS = {
    ADMIN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2dpblR5cGUiOiJsb2dpbiIsImxvZ2luSWQiOiJzeXNfdXNlcjp0aF8wIiwicm5TdHIiOiIzYzVkNTJkNGQ1Y2QzMTc5NTNmNWY5ZDRiNDg1YWJmNCIsImNsaWVudGlkIjoiMDJiYjljZmU4ZDc4NDRlY2FlOGRiZTYyYjFiYTk3MWEiLCJ0ZW5hbnRJZCI6IjAiLCJ1c2VySWQiOiJ0aF8wIiwidXNlck5hbWUiOiJzdXBlcmFkbWluIiwiZGVwdElkIjowLCJkZXB0TmFtZSI6IkRlcHQtMCIsImRlcHRDYXRlZ29yeSI6IiIsInJvbGVzIjpbIlJPTEVfQUxMIl0sInBlcm1pc3Npb25zIjpbInRlbmFudDpkZWxldGU6cmVtb3ZlIiwicGFya19tYW5hZ2VtZW50Iiwicm9sZV9tYW5hZ2VtZW50IiwibG9jYWxfdmlkZW8iLCJjYW1lcmE6bGlzdDp2aWV3IiwibG9nOmxpc3Q6dmlldyIsInZpc3VhbF9jZW50ZXIiLCJyb2xlOnBlcm1pc3Npb246dmlldyIsIndhcm5pbmdfbWFuYWdlbWVudCIsImRldmljZV9za2lsbHMiLCJ2aXN1YWwiLCJyZWFsX3RpbWVfbW9uaXRvcmluZyIsImNvbnRyb2wiLCJyZXZpZXdfcmVjb3JkcyIsImFpLm1vZGVscyIsImRldmljZXMiLCJlZGdlIiwid2FybmluZ19hcmNoaXZlcyIsInN0YXRpc3RpY3NfYW5hbHlzaXMiLCJtb2RlbHMiLCJ1c2VyOnBhc3N3b3JkOnJlc2V0IiwiYXBwbGljYXRpb25fc2V0dGluZ3MiLCJ1c2VyOnJvbGU6dmlldyIsInBlcm1pc3Npb246dXBkYXRlOmVkaXQiLCJsb2dfcmVjb3JkcyIsInNraWxsOmxpc3Q6dmlldyIsInVzZXI6dXBkYXRlOmVkaXQiLCJjYW1lcmFfbWFuYWdlbWVudCIsInVzZXI6Y3JlYXRlOmFkZCIsInRlbmFudDpjcmVhdGU6YWRkIiwicm9sZTpsaXN0OnZpZXciLCJtdWx0aW1vZGFsX3JldmlldyIsInBvc2l0aW9uOmxpc3Q6dmlldyIsInVzZXJfbWFuYWdlbWVudCIsInBvc2l0aW9uX21hbmFnZW1lbnQiLCJjYW1lcmFfbWFuYWdlbWVudF9tYWluIiwibW9uaXRvcmluZyIsImRlcGFydG1lbnRfbWFuYWdlbWVudCIsInNraWxscy5sbG0iLCJwcm9maWxlIiwidGVuYW50OnVwZGF0ZTplZGl0IiwiZWRnZV9ib3g6bGlzdDp2aWV3Iiwic3lzdGVtIiwicGVybWlzc2lvbl9tYW5hZ2VtZW50IiwiY2FtZXJhOmRlbGV0ZTpyZW1vdmUiLCJ1c2VyOmxpc3Q6dmlldyIsImFsZ29yaXRobV9pbmZlcmVuY2UiLCJwb3NpdGlvbjp1cGRhdGU6ZWRpdCIsIm1vZGVsX2xpc3QiLCJ1c2VyOnJvbGU6YXNzaWduOmFkZCIsImVkZ2Vfc2VydmVyOmxpc3Q6dmlldyIsInRlbmFudDpsaXN0OnZpZXciLCJtdWx0aW1vZGFsX2xsbV9za2lsbHMiLCJpbnRlbGxpZ2VudF9yZXZpZXciLCJwb3NpdGlvbjpkZWxldGU6cmVtb3ZlIiwidGVuYW50X21hbmFnZW1lbnQiLCJwYXJrOmxpc3Q6dmlldyIsInJvbGU6ZGVsZXRlOnJlbW92ZSIsImVkZ2VfYm94IiwicGVybWlzc2lvbjpjb2RlOnZhbGlkYXRlIiwiZWRnZV9zZXJ2ZXIiLCJkZXB0OnVwZGF0ZTplZGl0Iiwia25vd2xlZGdlX2Jhc2UiLCJza2lsbHMiLCJwZXJtaXNzaW9uOmNoZWNrOnZlcmlmeSIsInBlcm1pc3Npb246ZGV0YWlsOnZpZXciLCJyb2xlOnBlcm1pc3Npb246cmVtb3ZlOmRlbGV0ZSIsInBlcm1pc3Npb246cm9sZTp2aWV3IiwicGVybWlzc2lvbjpkZWxldGU6cmVtb3ZlIiwidXNlcjpkZWxldGU6YmF0Y2giLCJwZXJtaXNzaW9uOmNyZWF0ZTphZGQiLCJ1c2VyOmRlbGV0ZTpyZW1vdmUiLCJkZXB0OmRlbGV0ZTpyZW1vdmUiLCJwZXJtaXNzaW9uOnRyZWU6dmlldyIsImRlcHQ6Y3JlYXRlOmFkZCIsInJvbGU6Y3JlYXRlOmFkZCIsInVzZXI6cGVybWlzc2lvbjp2aWV3IiwidGVuYW50OmRlbGV0ZTpiYXRjaCIsInBvc2l0aW9uOmNyZWF0ZTphZGQiLCJkZXB0OnRyZWU6dmlldyIsInJvbGU6dXNlcjp2aWV3Iiwicm9sZTp1cGRhdGU6ZWRpdCIsInJvbGUtcGVybWlzc2lvbjphc3NpZ246YWRkIiwicGVybWlzc2lvbjpzdGF0dXM6dXBkYXRlIiwidXNlci1yb2xlOmFzc2lnbjphZGQiLCJkZXB0Omxpc3Q6dmlldyIsInVzZXItcm9sZTpyZW1vdmU6ZGVsZXRlIl0sImV4cCI6MTc3Mzc0OTgzNH0.TPsywlO7heqb9dsdvBG7r_5jKpTkGvPJiqwSYtsgVCA',
  };

  test.beforeEach(async ({ page }) => {
    // 检查 localStorage 中是否有 Token，如果没有则使用备用 Token
    await page.addInitScript(() => {
      const existingToken = localStorage.getItem('Admin-Token');
      if (!existingToken) {
        console.log('localStorage 中没有 Token，使用备用 Token');
        localStorage.setItem('Admin-Token', FALLBACK_TOKENS.ADMIN);
      } else {
        console.log('使用 localStorage 中已有的 Token');
      }
    });
  });

  test('应该能够访问用户管理页面', async ({ page }) => {
    await page.goto('/#/systemManage/userManagement');
    await page.waitForLoadState('networkidle');
    
    // 验证 URL 正确
    await expect(page).toHaveURL(/.*userManagement/);
    
    // 验证页面加载（检查是否有表格或加载状态）
    const table = page.locator('.el-table');
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('应该能够访问角色管理页面', async ({ page }) => {
    await page.goto('/#/systemManage/roleManagement');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*roleManagement/);
    const table = page.locator('.el-table');
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('应该能够访问可视化中心', async ({ page }) => {
    await page.goto('/#/visualCenter');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*visualCenter/);
  });

  test('应该能够访问实时监控', async ({ page }) => {
    await page.goto('/#/monitoring/realtime');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*realtime/);
  });
});
