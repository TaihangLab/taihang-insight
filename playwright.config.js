// @playwright/test configuration
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // 每个测试文件共享同一个浏览器实例，避免频繁重启
  fullyParallel: false,
  // 测试失败时不关闭浏览器，继续执行下一个测试
  maximizeBrowserContext: false,
  webServer: {
    command: 'npm run dev',
    port: 8080,
    reuseExistingServer: !process.env.CI,
  },
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
    // 所有操作默认超时5秒
    actionTimeout: 5000,
    navigationTimeout: 5000,
  },
  // 单个测试用例超时5秒
  timeout: 5000,
  retries: 0,
  // 每个测试文件使用独立的 worker，但同一个文件内的测试共享浏览器
  workers: 1,
});