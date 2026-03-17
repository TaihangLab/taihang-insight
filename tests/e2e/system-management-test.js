// 系统管理页面全面功能测试
const { chromium } = require('playwright');
const fs = require('fs');

const TARGET_URL = 'http://localhost:4000';

// 系统管理页面列表
const SYSTEM_PAGES = [
  { name: '租户管理', path: '/#/systemManage/tenantManagement', code: 'tenant' },
  { name: '用户管理', path: '/#/systemManage/userManagement', code: 'user' },
  { name: '角色管理', path: '/#/systemManage/roleManagement', code: 'role' },
  { name: '权限管理', path: '/#/systemManage/permissionManagement', code: 'permission' },
  { name: '部门管理', path: '/#/systemManage/departmentManagement', code: 'department' },
  { name: '岗位管理', path: '/#/systemManage/positionManagement', code: 'position' },
];

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // 收集测试结果
  const testResults = {
    timestamp: new Date().toISOString(),
    summary: { total: 0, passed: 0, failed: 0, errors: 0 },
    pages: [],
    apiErrors: []
  };

  // 监听 API 错误
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/')) {
      const status = response.status();
      if (status >= 400) {
        try {
          const body = await response.text();
          testResults.apiErrors.push({
            url: url,
            method: response.request().method(),
            status: status,
            body: body.substring(0, 500)
          });
        } catch (e) {
          testResults.apiErrors.push({
            url: url,
            method: response.request().method(),
            status: status
          });
        }
      }
    }
  });

  try {
    console.log('🌐 开始系统管理页面功能测试...\n');

    // 登录
    console.log('📝 登录系统...');
    await page.goto(TARGET_URL + '/#/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    try {
      await page.fill('input[name="tenantCode"], input[placeholder*="租户"]', '0', { timeout: 1000 });
    } catch (e) {
      // 忽略
    }
    await page.fill('input[name="username"], input[placeholder*="用户"]', 'superadmin');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("登录")');

    console.log('⏳ 等待登录完成...');
    await page.waitForTimeout(5000);

    // 测试每个系统管理页面
    for (const pageInfo of SYSTEM_PAGES) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔍 测试: ${pageInfo.name}`);
      console.log(`${'='.repeat(60)}`);

      const pageResult = {
        name: pageInfo.name,
        path: pageInfo.path,
        tests: []
      };

      try {
        // 1. 访问页面
        console.log(`  📍 访问页面: ${pageInfo.path}`);
        await page.goto(TARGET_URL + pageInfo.path, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);
        pageResult.tests.push({ test: '页面访问', status: 'passed', message: '成功访问页面' });

        // 截图
        const fileName = `system-${pageInfo.code}`;
        await page.screenshot({ path: `playwright-tests/${fileName}.png`, fullPage: true });
        console.log(`  📸 截图已保存: playwright-tests/${fileName}.png`);

        // 2. 检查页面基本元素
        console.log(`  🔍 检查页面元素...`);
        const pageTitle = await page.title();
        console.log(`     页面标题: ${pageTitle}`);

        // 检查是否有搜索框
        const searchBox = await page.locator('input[placeholder*="搜索"], input[placeholder*="search"], .search-input input').count();
        if (searchBox > 0) {
          pageResult.tests.push({ test: '搜索框', status: 'passed', message: '找到搜索框' });
          console.log(`     ✅ 搜索框: 存在`);
        } else {
          pageResult.tests.push({ test: '搜索框', status: 'skipped', message: '未找到搜索框' });
          console.log(`     ⚠️ 搜索框: 不存在`);
        }

        // 检查是否有新增按钮
        const addButtons = await page.locator('button:has-text("新增"), button:has-text("添加"), button:has-text("创建"), .el-button--primary').count();
        if (addButtons > 0) {
          pageResult.tests.push({ test: '新增按钮', status: 'passed', message: `找到 ${addButtons} 个操作按钮` });
          console.log(`     ✅ 操作按钮: ${addButtons} 个`);
        } else {
          pageResult.tests.push({ test: '新增按钮', status: 'warning', message: '未找到操作按钮' });
          console.log(`     ⚠️ 操作按钮: 未找到`);
        }

        // 检查是否有表格/列表
        const table = await page.locator('table, .el-table, .data-table, .list-container').count();
        if (table > 0) {
          pageResult.tests.push({ test: '数据表格', status: 'passed', message: '找到数据表格' });
          console.log(`     ✅ 数据表格: 存在`);
        } else {
          pageResult.tests.push({ test: '数据表格', status: 'warning', message: '未找到数据表格' });
          console.log(`     ⚠️ 数据表格: 不存在`);
        }

        // 检查分页器
        const pagination = await page.locator('.el-pagination, .pagination, .pager').count();
        if (pagination > 0) {
          pageResult.tests.push({ test: '分页器', status: 'passed', message: '找到分页器' });
          console.log(`     ✅ 分页器: 存在`);
        }

        // 3. 检查页面特定功能
        console.log(`  🔍 检查特定功能...`);

        // 根据不同页面类型检查特定元素
        switch(pageInfo.code) {
          case 'tenant':
            const tenantCode = await page.locator('input[placeholder*="租户代码"], input[placeholder*="tenant"]').count();
            pageResult.tests.push({ test: '租户代码输入', status: tenantCode > 0 ? 'passed' : 'skipped', message: tenantCode > 0 ? '存在租户代码输入' : '未检查到' });
            console.log(`     ${tenantCode > 0 ? '✅' : '⚠️'} 租户代码输入: ${tenantCode > 0 ? '存在' : '不存在'}`);
            break;

          case 'user':
            const usernameInput = await page.locator('input[placeholder*="用户名"], input[placeholder*="username"]').count();
            pageResult.tests.push({ test: '用户名输入', status: usernameInput > 0 ? 'passed' : 'skipped', message: usernameInput > 0 ? '存在用户名输入' : '未检查到' });
            console.log(`     ${usernameInput > 0 ? '✅' : '⚠️'} 用户名输入: ${usernameInput > 0 ? '存在' : '不存在'}`);
            break;

          case 'role':
            const roleName = await page.locator('input[placeholder*="角色名称"], input[placeholder*="role"]').count();
            pageResult.tests.push({ test: '角色名称输入', status: roleName > 0 ? 'passed' : 'skipped', message: roleName > 0 ? '存在角色名称输入' : '未检查到' });
            console.log(`     ${roleName > 0 ? '✅' : '⚠️'} 角色名称输入: ${roleName > 0 ? '存在' : '不存在'}`);
            break;

          case 'permission':
            const permTree = await page.locator('.el-tree, .permission-tree, [class*="tree"]').count();
            pageResult.tests.push({ test: '权限树', status: permTree > 0 ? 'passed' : 'warning', message: permTree > 0 ? `找到 ${permTree} 个树形结构` : '未找到权限树' });
            console.log(`     ${permTree > 0 ? '✅' : '⚠️'} 权限树: ${permTree > 0 ? `找到 ${permTree} 个` : '未找到'}`);
            break;

          case 'department':
            const deptTree = await page.locator('.el-tree, .department-tree, [class*="tree"]').count();
            pageResult.tests.push({ test: '部门树', status: deptTree > 0 ? 'passed' : 'warning', message: deptTree > 0 ? `找到 ${deptTree} 个树形结构` : '未找到部门树' });
            console.log(`     ${deptTree > 0 ? '✅' : '⚠️'} 部门树: ${deptTree > 0 ? `找到 ${deptTree} 个` : '未找到'}`);
            break;

          case 'position':
            const positionName = await page.locator('input[placeholder*="岗位名称"], input[placeholder*="position"]').count();
            pageResult.tests.push({ test: '岗位名称输入', status: positionName > 0 ? 'passed' : 'skipped', message: positionName > 0 ? '存在岗位名称输入' : '未检查到' });
            console.log(`     ${positionName > 0 ? '✅' : '⚠️'} 岗位名称输入: ${positionName > 0 ? '存在' : '不存在'}`);
            break;
        }

        pageResult.status = 'passed';
        testResults.summary.passed++;

      } catch (error) {
        console.error(`  ❌ 测试失败: ${error.message}`);
        pageResult.status = 'failed';
        pageResult.error = error.message;
        pageResult.tests.push({ test: '页面访问', status: 'failed', message: error.message });
        testResults.summary.failed++;
      }

      testResults.pages.push(pageResult);
      testResults.summary.total++;
    }

  } catch (error) {
    console.error('\n❌ 测试过程出错:', error.message);
    await page.screenshot({ path: 'playwright-tests/system-management-error.png', fullPage: true });
  }

  // 打印测试总结
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 测试总结');
  console.log('='.repeat(80));

  console.log(`\n总计: ${testResults.summary.total} 个页面`);
  console.log(`✅ 通过: ${testResults.summary.passed} 个`);
  console.log(`❌ 失败: ${testResults.summary.failed} 个`);
  console.log(`🔴 API 错误: ${testResults.apiErrors.length} 个`);

  // 详细页面结果
  console.log('\n📋 页面详情:');
  console.log('-'.repeat(80));
  for (const pageResult of testResults.pages) {
    console.log(`\n${pageResult.name}:`);
    console.log(`  状态: ${pageResult.status === 'passed' ? '✅ 通过' : '❌ 失败'}`);
    for (const test of pageResult.tests) {
      const icon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : test.status === 'warning' ? '⚠️' : '⏭️';
      console.log(`  ${icon} ${test.test}: ${test.message}`);
    }
  }

  // API 错误详情
  if (testResults.apiErrors.length > 0) {
    console.log('\n🔴 API 错误详情:');
    console.log('-'.repeat(80));
    testResults.apiErrors.forEach((err, index) => {
      console.log(`\n${index + 1}. ${err.method} ${err.url}`);
      console.log(`   状态码: ${err.status}`);
      if (err.body) {
        console.log(`   响应: ${err.body.substring(0, 200)}`);
      }
    });
  }

  // 保存测试结果
  fs.writeFileSync('playwright-tests/system-management-test-result.json', JSON.stringify(testResults, null, 2));
  console.log('\n📄 测试结果已保存到: playwright-tests/system-management-test-result.json');

  console.log('\n⏳ 浏览器将保持打开 10 秒供查看...');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log('\n✅ 测试完成');

  // 返回退出码
  process.exit(testResults.summary.failed > 0 ? 1 : 0);
})();
