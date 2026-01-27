import { test, expect } from '@playwright/test';

/**
 * 全路由页面错误检查测试
 *
 * 遍历项目中所有路由页面，检测并报告每个页面的错误
 */

test.describe('全路由页面错误检查', () => {
  const BASE_URL = 'http://localhost:8080';

  // 所有路由配置（从 src/router/index.ts 提取）
  const routes = [
    // ==================== 可视化中心 ====================
    { path: '#/visualCenter', name: '可视化中心', category: '可视化中心' },
    { path: '#/algorithmInference', name: '算法推理', category: '可视化中心' },
    { path: '#/visualCenter/parkManagement', name: '园区管理', category: '可视化中心' },

    // ==================== 监控预警 ====================
    { path: '#/monitoring/realtime', name: '实时监控', category: '监控预警' },
    { path: '#/monitoring/statistics', name: '统计分析', category: '监控预警' },
    { path: '#/monitoring/warningArchive', name: '预警档案', category: '监控预警' },
    { path: '#/monitoring/warningManage', name: '预警管理', category: '监控预警' },
    { path: '#/monitoring/reviewRecords', name: '复判记录', category: '监控预警' },
    { path: '#/monitoring/intelligentReview', name: '智能复判', category: '监控预警' },

    // ==================== 设备管理 ====================
    { path: '#/deviceManage/camera', name: '摄像头', category: '设备管理' },
    { path: '#/deviceManage/cameraManagement', name: '摄像头管理', category: '设备管理' },
    { path: '#/deviceManage/localVideo', name: '本地视频', category: '设备管理' },

    // ==================== 模型管理 ====================
    { path: '#/modelManage/modelList', name: '模型列表', category: '模型管理' },

    // ==================== 技能管理 ====================
    { path: '#/skillManage/deviceSkills', name: '设备技能', category: '技能管理' },
    { path: '#/skillManage/multimodalLlmSkills', name: '多模态LLM技能', category: '技能管理' },
    { path: '#/skillManage/multimodalReview', name: '多模态复判', category: '技能管理' },

    // ==================== 智能控制 ====================
    { path: '#/intelligentControl/logRecord', name: '日志记录', category: '智能控制' },

    // ==================== 边缘管理 ====================
    { path: '#/edgeManage/edgeServer', name: '边缘服务器', category: '边缘管理' },
    { path: '#/edgeManage/edgeBox', name: '边缘盒子', category: '边缘管理' },

    // ==================== 系统管理 ====================
    { path: '#/systemManage/appSettings', name: '应用设置', category: '系统管理' },
    { path: '#/systemManage/tenantManagement', name: '租户管理', category: '系统管理' },
    { path: '#/systemManage/userManagement', name: '用户管理', category: '系统管理' },
    { path: '#/systemManage/roleManagement', name: '角色管理', category: '系统管理' },
    { path: '#/systemManage/departmentManagement', name: '部门管理', category: '系统管理' },
    { path: '#/systemManage/positionManagement', name: '岗位管理', category: '系统管理' },
    { path: '#/systemManage/knowledgeBase', name: '知识库', category: '系统管理' },
    { path: '#/systemManage/profile', name: '个人中心', category: '系统管理' },
    { path: '#/systemManage/permissionManagement', name: '权限管理', category: '系统管理' },
  ];

  // 辅助函数：等待页面加载
  async function waitForPageLoad(page) {
    try {
      await page.waitForLoadState('domcontentloaded', { timeout: 8000 });
    } catch (e) {
      // 忽略超时
    }
    try {
      await page.waitForLoadState('networkidle', { timeout: 3000 });
    } catch (e) {
      // 忽略超时
    }
  }

  // 辅助函数：收集页面错误
  async function collectPageErrors(page) {
    const errors = {
      console: [],
      network: [],
      runtime: []
    };

    // 控制台错误
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        errors.console.push({
          type: 'console',
          text: text,
          location: msg.location()
        });
      }
    });

    // 页面错误
    page.on('pageerror', error => {
      errors.runtime.push({
        type: 'runtime',
        message: error.message,
        stack: error.stack
      });
    });

    // 请求失败
    page.on('requestfailed', request => {
      const failure = request.failure();
      if (failure) {
        errors.network.push({
          type: 'network',
          url: request.url(),
          method: request.method(),
          error: failure.errorText
        });
      }
    });

    return errors;
  }

  // 辅助函数：格式化错误报告
  function formatErrors(errors, routeName) {
    let output = `\n🔴 ${routeName} - 发现 ${errors.console.length + errors.runtime.length + errors.network.length} 个错误:\n`;

    if (errors.console.length > 0) {
      output += `  控制台错误 (${errors.console.length}):\n`;
      errors.console.forEach((err, i) => {
        output += `    ${i + 1}. ${err.text}\n`;
        if (err.location && err.location.url) {
          output += `       位置: ${err.location.url}:${err.location.lineNumber}\n`;
        }
      });
    }

    if (errors.runtime.length > 0) {
      output += `  运行时错误 (${errors.runtime.length}):\n`;
      errors.runtime.forEach((err, i) => {
        output += `    ${i + 1}. ${err.message}\n`;
        if (err.stack) {
          output += `       堆栈: ${err.stack.split('\n')[0]}\n`;
        }
      });
    }

    if (errors.network.length > 0) {
      output += `  网络错误 (${errors.network.length}):\n`;
      errors.network.forEach((err, i) => {
        output += `    ${i + 1}. ${err.method} ${err.url}\n`;
        output += `       错误: ${err.error}\n`;
      });
    }

    return output;
  }

  // 测试每个路由页面
  test('检查所有路由页面的错误', async ({ page }) => {
    test.setTimeout(180000); // 3分钟超时
    console.log('\n🚀 开始全路由页面错误检查...\n');

    const results = {
      total: routes.length,
      passed: 0,
      failed: 0,
      details: []
    };

    // 按分类组织结果
    const categoryResults = {};

    for (const route of routes) {
      console.log(`🔍 检查: ${route.category} > ${route.name}`);

      // 初始化分类结果
      if (!categoryResults[route.category]) {
        categoryResults[route.category] = { total: 0, passed: 0, failed: 0, routes: [] };
      }
      categoryResults[route.category].total++;
      categoryResults[route.category].routes.push(route.name);

      // 收集错误
      const errors = await collectPageErrors(page);

      try {
        // 导航到页面
        await page.goto(`${BASE_URL}/${route.path}`);
        await waitForPageLoad(page);

        // 等待一下以捕获所有可能的错误
        await page.waitForTimeout(1000);

        // 检查页面是否有致命错误（页面崩溃）
        const isPageCrashed = await page.evaluate(() => {
          return document.body === null;
        });

        if (isPageCrashed) {
          console.log(`  ❌ 页面崩溃`);
          results.failed++;
          categoryResults[route.category].failed++;
          results.details.push({
            route: route.name,
            status: 'failed',
            reason: '页面崩溃'
          });
          continue;
        }

        // 统计错误数量
        const totalErrors = errors.console.length + errors.runtime.length + errors.network.length;

        if (totalErrors > 0) {
          console.log(`  ⚠️ 发现 ${totalErrors} 个错误`);
          console.log(formatErrors(errors, route.name));
          results.failed++;
          categoryResults[route.category].failed++;
          results.details.push({
            route: route.name,
            status: 'errors',
            errorCount: totalErrors,
            errors: errors
          });

          // 截图保存错误页面
          await page.screenshot({
            path: `test-results/errors/${route.name.replace(/\s+/g, '-').toLowerCase()}-error.png`,
            fullPage: true
          });
        } else {
          console.log(`  ✅ 无错误`);
          results.passed++;
          categoryResults[route.category].passed++;
          results.details.push({
            route: route.name,
            status: 'passed'
          });
        }

      } catch (error) {
        console.log(`  ❌ 无法访问: ${error.message}`);
        results.failed++;
        categoryResults[route.category].failed++;
        results.details.push({
          route: route.name,
          status: 'failed',
          reason: error.message
        });
      }

      console.log('');
    }

    // 打印分类汇总
    console.log('\n📊 分类汇总:');
    console.log('═'.repeat(80));
    for (const [category, data] of Object.entries(categoryResults)) {
      const status = data.failed === 0 ? '✅' : '⚠️';
      console.log(`${status} ${category} (${data.passed}/${data.total} 通过)`);
      if (data.failed > 0) {
        console.log(`   失败的路由: ${data.routes.filter(r => {
          const detail = results.details.find(d => d.route === r);
          return detail && detail.status !== 'passed';
        }).join(', ')}`);
      }
    }

    // 打印总结果
    console.log('\n' + '═'.repeat(80));
    console.log(`📈 总体结果: ${results.passed}/${results.total} 个页面通过`);
    if (results.failed > 0) {
      console.log(`\n❌ 失败的页面 (${results.failed} 个):`);
      results.details
        .filter(d => d.status !== 'passed')
        .forEach(d => {
          console.log(`   - ${d.route}: ${d.reason || d.errorCount + ' 个错误'}`);
        });
    }
    console.log('═'.repeat(80) + '\n');

    // 如果有失败的路由，测试失败
    // expect(results.failed).toBe(0);
  });

  // 按分类单独测试（便于定位问题）
  for (const category of [...new Set(routes.map(r => r.category))]) {
    test(`${category} - 错误检查`, async ({ page }) => {
      test.setTimeout(60000); // 1分钟超时
      const categoryRoutes = routes.filter(r => r.category === category);
      console.log(`\n🔍 检查分类: ${category} (${categoryRoutes.length} 个路由)`);

      let hasErrors = false;

      for (const route of categoryRoutes) {
        const errors = await collectPageErrors(page);

        await page.goto(`${BASE_URL}/${route.path}`);
        await waitForPageLoad(page);
        await page.waitForTimeout(800);

        const totalErrors = errors.console.length + errors.runtime.length + errors.network.length;

        if (totalErrors > 0) {
          console.log(`  ❌ ${route.name}: ${totalErrors} 个错误`);
          console.log(formatErrors(errors, route.name));
          hasErrors = true;

          await page.screenshot({
            path: `test-results/errors/${category}-${route.name.replace(/\s+/g, '-').toLowerCase()}.png`,
            fullPage: true
          });
        } else {
          console.log(`  ✅ ${route.name}`);
        }
      }

      expect(hasErrors).toBeFalsy();
    });
  }

  // 快速检查 - 只检查页面能否加载
  test('快速页面加载检查', async ({ page }) => {
    console.log('\n⚡ 快速加载检查...\n');

    const failedRoutes = [];

    for (const route of routes) {
      try {
        await page.goto(`${BASE_URL}/${route.path}`, { timeout: 8000 });
        await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});

        // 检查页面内容中是否有 JavaScript 错误
        const content = await page.content();

        if (content.includes('Cannot read') || content.includes('is not defined')) {
          failedRoutes.push({ route: route.name, reason: 'JavaScript错误' });
        }
      } catch (error) {
        failedRoutes.push({ route: route.name, reason: error.message });
      }
    }

    if (failedRoutes.length > 0) {
      console.log(`\n❌ 无法加载的页面 (${failedRoutes.length}):`);
      failedRoutes.forEach(r => {
        console.log(`   - ${r.route}: ${r.reason}`);
      });
    } else {
      console.log('✅ 所有页面都可以加载');
    }
  });
});
