// @playwright/test configuration
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // 每个测试文件共享同一个浏览器实例，避免频繁重启
  fullyParallel: false,
  // 测试失败时不关闭浏览器，继续执行下一个测试
  maximizeBrowserContext: false,
  webServer: {
    command: 'echo "Server already running"',
    port: 4000,
    reuseExistingServer: true,
  },
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    browserName: 'chromium',
    headless: true, // 后台运行，不打扰前端服务
    viewport: { width: 1920, height: 1080 }, // 大屏测试使用更大视口
    ignoreHTTPSErrors: true,
    video: 'off', // 关闭视频录制以减少资源占用
    screenshot: 'only-on-failure',
    // 所有操作默认超时10秒
    actionTimeout: 10000,
    navigationTimeout: 10000,
  },
  // 单个测试用例超时30秒
  timeout: 30000,
  retries: 0,
  // 每个测试文件使用独立的 worker，但同一个文件内的测试共享浏览器
  workers: 1,
});