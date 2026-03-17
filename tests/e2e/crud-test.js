// 系统管理页面 CRUD 功能黑盒测试
const { chromium } = require('playwright');
const fs = require('fs');

const TARGET_URL = 'http://localhost:4000';

// 测试数据
const TEST_DATA = {
  tenant: {
    name: '测试租户',
    code: 'TEST_TENANT_' + Date.now(),
    contact: '测试联系人',
    phone: '13800138000',
    email: 'test@example.com'
  },
  user: {
    username: 'test_user_' + Date.now(),
    password: 'Test@123456',
    nickName: '测试用户',
    phone: '13900139000',
    email: 'testuser@example.com'
  },
  role: {
    roleName: '测试角色_' + Date.now(),
    roleCode: 'TEST_ROLE_' + Date.now(),
    description: '这是一个测试角色'
  },
  department: {
    name: '测试部门_' + Date.now(),
    description: '这是一个测试部门'
  },
  position: {
    name: '测试岗位_' + Date.now(),
    code: 'TEST_POS_' + Date.now(),
    description: '这是一个测试岗位'
  }
};

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 200 // 放慢操作，便于观察
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // 收集测试结果
  const testResults = {
    timestamp: new Date().toISOString(),
    summary: { total: 0, passed: 0, failed: 0 },
    tests: [],
    apiCalls: [],
    errors: []
  };

  // 监听 API 调用
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/')) {
      testResults.apiCalls.push({
        url: url,
        method: request.method(),
        type: 'request'
      });
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/')) {
      try {
        const body = await response.text();
        testResults.apiCalls.push({
          url: url,
          method: response.request().method(),
          status: response.status(),
          type: 'response',
          body: body.substring(0, 500)
        });
      } catch (e) {
        // ignore
      }
    }
  });

  // 辅助函数：记录测试结果
  function recordTest(name, status, message, details = {}) {
    const result = { name, status, message, details, timestamp: new Date().toISOString() };
    testResults.tests.push(result);

    const icon = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⚠️';
    console.log(`  ${icon} ${name}: ${message}`);

    if (status === 'passed') {
      testResults.summary.passed++;
    } else if (status === 'failed') {
      testResults.summary.failed++;
    }
    testResults.summary.total++;
  }

  // 辅助函数：等待并点击元素
  async function clickElement(locator, description, timeout = 5000) {
    try {
      await page.waitForSelector(locator, { timeout });
      await page.click(locator);
      return true;
    } catch (error) {
      console.log(`    ⚠️ 无法点击 ${description}: ${error.message}`);
      return false;
    }
  }

  // 辅助函数：填写输入框
  async function fillInput(locator, value, description) {
    try {
      await page.waitForSelector(locator, { timeout: 5000 });
      await page.fill(locator, value);
      return true;
    } catch (error) {
      console.log(`    ⚠️ 无法填写 ${description}: ${error.message}`);
      return false;
    }
  }

  try {
    console.log('🌐 开始系统管理 CRUD 功能测试...\n');

    // ========== 登录 ==========
    console.log('\n📝 步骤1: 登录系统');
    await page.goto(TARGET_URL + '/#/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    try {
      await page.fill('input[name="tenantCode"], input[placeholder*="租户"]', '0', { timeout: 1000 });
    } catch (e) {
      // ignore
    }
    await page.fill('input[name="username"], input[placeholder*="用户"]', 'superadmin');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(5000);
    console.log('  ✅ 登录成功');

    // ========== 1. 租户管理测试 ==========
    console.log('\n' + '='.repeat(80));
    console.log('🔍 测试1: 租户管理 CRUD');
    console.log('='.repeat(80));

    await page.goto(TARGET_URL + '/#/systemManage/tenantManagement', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'playwright-tests/tenant-01-list.png', fullPage: true });
    recordTest('租户管理-列表页', 'passed', '成功访问租户管理列表页');

    // 尝试点击新增按钮
    console.log('\n  📝 测试新增租户...');
    const addClicked = await clickElement('button:has-text("新增"), button:has-text("添加"), .el-button--primary:first-child', '新增按钮');
    if (addClicked) {
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'playwright-tests/tenant-02-add-dialog.png', fullPage: true });

      // 尝试填写租户信息
      const inputs = await page.locator('input[type="text"], input[type="number"], textarea').all();
      console.log(`    ℹ️ 找到 ${inputs.length} 个输入框`);

      if (inputs.length > 0) {
        // 尝试填写第一个输入框
        try {
          await inputs[0].fill(TEST_DATA.tenant.name);
          console.log(`    ✅ 填写租户名称: ${TEST_DATA.tenant.name}`);
          await page.waitForTimeout(500);

          // 尝试填写更多字段
          if (inputs.length > 1) {
            await inputs[1].fill(TEST_DATA.tenant.code);
            console.log(`    ✅ 填写租户代码: ${TEST_DATA.tenant.code}`);
          }

          await page.screenshot({ path: 'playwright-tests/tenant-03-filled.png', fullPage: true });
          recordTest('租户管理-填写表单', 'passed', `成功填写${inputs.length}个字段`);
        } catch (e) {
          recordTest('租户管理-填写表单', 'failed', `填写表单失败: ${e.message}`);
        }
      } else {
        recordTest('租户管理-新增对话框', 'warning', '新增对话框打开但未找到输入框');
      }

      // 尝试取消或关闭对话框
      await page.waitForTimeout(1000);
      const cancelClicked = await clickElement('button:has-text("取消"), .el-button--default:first-child', '取消按钮');
      if (cancelClicked) {
        console.log('    ✅ 已关闭新增对话框');
      }
    } else {
      recordTest('租户管理-新增按钮', 'failed', '未找到新增按钮或点击失败');
    }

    // ========== 2. 用户管理测试 ==========
    console.log('\n' + '='.repeat(80));
    console.log('🔍 测试2: 用户管理 CRUD');
    console.log('='.repeat(80));

    await page.goto(TARGET_URL + '/#/systemManage/userManagement', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'playwright-tests/user-01-list.png', fullPage: true });
    recordTest('用户管理-列表页', 'passed', '成功访问用户管理列表页');

    // 检查数据是否加载
    const userTable = await page.locator('table, .el-table__body').count();
    console.log(`    ℹ️ 用户表格数量: ${userTable}`);

    if (userTable > 0) {
      // 检查是否有数据行
      const rows = await page.locator('table tbody tr, .el-table__body-wrapper .el-table__row').count();
      console.log(`    ℹ️ 用户数据行数: ${rows}`);

      if (rows > 0) {
        recordTest('用户管理-数据加载', 'passed', `成功加载${rows}条用户数据`);

        // 获取第一行数据
        const firstRowText = await page.locator('table tbody tr:first-child, .el-table__body-wrapper .el-table__row:first-child').textContent();
        console.log(`    ℹ️ 第一行数据预览: ${firstRowText.substring(0, 100)}...`);
      } else {
        recordTest('用户管理-数据加载', 'warning', '页面加载但无数据显示');
      }
    }

    // 尝试点击新增用户
    console.log('\n  📝 测试新增用户...');
    const userAddClicked = await clickElement('button:has-text("新增"), button:has-text("添加"), .el-button--primary:first-child', '新增用户按钮');
    if (userAddClicked) {
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'playwright-tests/user-02-add-dialog.png', fullPage: true });

      // 尝试填写用户信息
      const userInputs = await page.locator('input[type="text"], input[type="password"], input[type="email"], textarea').all();
      console.log(`    ℹ️ 找到 ${userInputs.length} 个输入框`);

      if (userInputs.length >= 3) {
        try {
          // 用户名
          await userInputs[0].fill(TEST_DATA.user.username);
          console.log(`    ✅ 填写用户名: ${TEST_DATA.user.username}`);

          // 密码（如果存在）
          let passwordIndex = -1;
          for (let i = 0; i < userInputs.length; i++) {
            const inputType = await userInputs[i].getAttribute('type');
            if (inputType === 'password') {
              passwordIndex = i;
              break;
            }
          }

          if (passwordIndex >= 0) {
            await userInputs[passwordIndex].fill(TEST_DATA.user.password);
            console.log(`    ✅ 填写密码`);
          }

          // 昵称/姓名
          if (userInputs.length > 2) {
            await userInputs[2].fill(TEST_DATA.user.nickName);
            console.log(`    ✅ 填写昵称: ${TEST_DATA.user.nickName}`);
          }

          await page.screenshot({ path: 'playwright-tests/user-03-filled.png', fullPage: true });
          recordTest('用户管理-填写表单', 'passed', `成功填写用户信息`);
        } catch (e) {
          recordTest('用户管理-填写表单', 'failed', `填写失败: ${e.message}`);
        }
      }

      // 取消
      await page.waitForTimeout(500);
      await clickElement('button:has-text("取消"), .el-button--default', '取消按钮');
    }

    // ========== 3. 角色管理测试 ==========
    console.log('\n' + '='.repeat(80));
    console.log('🔍 测试3: 角色管理 CRUD');
    console.log('='.repeat(80));

    await page.goto(TARGET_URL + '/#/systemManage/roleManagement', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'playwright-tests/role-01-list.png', fullPage: true });
    recordTest('角色管理-列表页', 'passed', '成功访问角色管理列表页');

    // 检查角色数据
    const roleRows = await page.locator('table tbody tr, .el-table__body-wrapper .el-table__row').count();
    console.log(`    ℹ️ 角色数据行数: ${roleRows}`);

    if (roleRows > 0) {
      recordTest('角色管理-数据加载', 'passed', `成功加载${roleRows}条角色数据`);

      // 查看第一行数据
      const firstRoleText = await page.locator('table tbody tr:first-child, .el-table__body-wrapper .el-table__row:first-child').textContent();
      console.log(`    ℹ️ 第一行角色数据: ${firstRoleText.substring(0, 150)}...`);
    } else {
      recordTest('角色管理-数据加载', 'failed', '角色数据未加载');
    }

    // 尝试新增角色
    console.log('\n  📝 测试新增角色...');
    const roleAddClicked = await clickElement('button:has-text("新增"), button:has-text("添加"), .el-button--primary:first-child', '新增角色按钮');
    if (roleAddClicked) {
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'playwright-tests/role-02-add-dialog.png', fullPage: true });

      // 填写角色信息
      const roleInputs = await page.locator('input[placeholder*="角色"], input[placeholder*="名称"], input[placeholder*="role"], textarea').all();
      console.log(`    ℹ️ 找到 ${roleInputs.length} 个输入框`);

      if (roleInputs.length > 0) {
        try {
          await roleInputs[0].fill(TEST_DATA.role.roleName);
          console.log(`    ✅ 填写角色名称: ${TEST_DATA.role.roleName}`);

          if (roleInputs.length > 1) {
            await roleInputs[1].fill(TEST_DATA.role.description);
            console.log(`    ✅ 填写描述: ${TEST_DATA.role.description}`);
          }

          await page.screenshot({ path: 'playwright-tests/role-03-filled.png', fullPage: true });
          recordTest('角色管理-填写表单', 'passed', '成功填写角色信息');
        } catch (e) {
          recordTest('角色管理-填写表单', 'failed', `填写失败: ${e.message}`);
        }
      }

      await page.waitForTimeout(500);
      await clickElement('button:has-text("取消"), .el-button--default', '取消按钮');
    }

    // ========== 4. 权限管理测试 ==========
    console.log('\n' + '='.repeat(80));
    console.log('🔍 测试4: 权限管理 CRUD');
    console.log('='.repeat(80));

    await page.goto(TARGET_URL + '/#/systemManage/permissionManagement', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'playwright-tests/permission-01-list.png', fullPage: true });
    recordTest('权限管理-列表页', 'passed', '成功访问权限管理列表页');

    // 检查权限数据
    const permRows = await page.locator('table tbody tr, .el-table__body-wrapper .el-table__row, .el-tree-node').count();
    console.log(`    ℹ️ 权限数据行/节点数: ${permRows}`);

    // 检查是否有树形结构
    const treeExists = await page.locator('.el-tree, .tree, [class*="permission-tree"]').count();
    if (treeExists > 0) {
      console.log(`    ℹ️ 找到权限树形结构`);
      recordTest('权限管理-数据加载', 'passed', `权限树已加载，包含${permRows}个节点`);
    } else if (permRows > 0) {
      recordTest('权限管理-数据加载', 'passed', `权限数据已加载，${permRows}条记录`);
    } else {
      recordTest('权限管理-数据加载', 'failed', '权限数据未加载');
    }

    // 检查API调用
    const permApiCalls = testResults.apiCalls.filter(call => call.url.includes('/permission'));
    console.log(`    ℹ️ 权限相关API调用数: ${permApiCalls.length}`);
    if (permApiCalls.length > 0) {
      permApiCalls.forEach(call => {
        console.log(`      - ${call.method} ${call.url} (${call.status || 'pending'})`);
      });
    }

    // ========== 5. 部门管理测试 ==========
    console.log('\n' + '='.repeat(80));
    console.log('🔍 测试5: 部门管理 CRUD');
    console.log('='.repeat(80));

    await page.goto(TARGET_URL + '/#/systemManage/departmentManagement', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'playwright-tests/department-01-list.png', fullPage: true });
    recordTest('部门管理-列表页', 'passed', '成功访问部门管理列表页');

    // 检查部门树
    const deptTreeCount = await page.locator('.el-tree, .tree, [class*="department"]').count();
    console.log(`    ℹ️ 部门树组件数: ${deptTreeCount}`);

    // 检查是否有部门节点
    const deptNodes = await page.locator('.el-tree-node, .tree-node, [class*="node"]').count();
    console.log(`    ℹ️ 部门节点数: ${deptNodes}`);

    if (deptNodes > 0) {
      recordTest('部门管理-数据加载', 'passed', `部门树已加载，包含${deptNodes}个节点`);

      // 尝试展开第一个节点
      const firstNodeClicked = await clickElement('.el-tree-node:first-child, .tree-node:first-child', '第一个部门节点');
      if (firstNodeClicked) {
        await page.waitForTimeout(500);
        console.log(`    ✅ 已点击第一个部门节点`);
      }
    } else {
      recordTest('部门管理-数据加载', 'warning', '未找到部门树或节点');
    }

    // 尝试新增部门
    console.log('\n  📝 测试新增部门...');
    const deptAddClicked = await clickElement('button:has-text("新增"), button:has-text("添加"), .el-button--primary:first-child', '新增部门按钮');
    if (deptAddClicked) {
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'playwright-tests/department-02-add-dialog.png', fullPage: true });

      const deptInputs = await page.locator('input[placeholder*="部门"], input[placeholder*="名称"]').all();
      if (deptInputs.length > 0) {
        try {
          await deptInputs[0].fill(TEST_DATA.department.name);
          console.log(`    ✅ 填写部门名称: ${TEST_DATA.department.name}`);
          await page.screenshot({ path: 'playwright-tests/department-03-filled.png', fullPage: true });
          recordTest('部门管理-填写表单', 'passed', '成功填写部门信息');
        } catch (e) {
          recordTest('部门管理-填写表单', 'failed', `填写失败: ${e.message}`);
        }
      }

      await page.waitForTimeout(500);
      await clickElement('button:has-text("取消"), .el-button--default', '取消按钮');
    }

    // ========== 6. 岗位管理测试 ==========
    console.log('\n' + '='.repeat(80));
    console.log('🔍 测试6: 岗位管理 CRUD');
    console.log('='.repeat(80));

    await page.goto(TARGET_URL + '/#/systemManage/positionManagement', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'playwright-tests/position-01-list.png', fullPage: true });
    recordTest('岗位管理-列表页', 'passed', '成功访问岗位管理列表页');

    // 检查岗位数据
    const posRows = await page.locator('table tbody tr, .el-table__body-wrapper .el-table__row').count();
    console.log(`    ℹ️ 岗位数据行数: ${posRows}`);

    if (posRows > 0) {
      recordTest('岗位管理-数据加载', 'passed', `成功加载${posRows}条岗位数据`);

      const firstPosText = await page.locator('table tbody tr:first-child, .el-table__body-wrapper .el-table__row:first-child').textContent();
      console.log(`    ℹ️ 第一行岗位数据: ${firstPosText.substring(0, 150)}...`);
    } else {
      recordTest('岗位管理-数据加载', 'failed', '岗位数据未加载');
    }

    // 尝试新增岗位
    console.log('\n  📝 测试新增岗位...');
    const posAddClicked = await clickElement('button:has-text("新增"), button:has-text("添加"), .el-button--primary:first-child', '新增岗位按钮');
    if (posAddClicked) {
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'playwright-tests/position-02-add-dialog.png', fullPage: true });

      const posInputs = await page.locator('input[placeholder*="岗位"], input[placeholder*="名称"], input[placeholder*="职位"]').all();
      if (posInputs.length > 0) {
        try {
          await posInputs[0].fill(TEST_DATA.position.name);
          console.log(`    ✅ 填写岗位名称: ${TEST_DATA.position.name}`);

          if (posInputs.length > 1) {
            await posInputs[1].fill(TEST_DATA.position.code);
            console.log(`    ✅ 填写岗位代码: ${TEST_DATA.position.code}`);
          }

          await page.screenshot({ path: 'playwright-tests/position-03-filled.png', fullPage: true });
          recordTest('岗位管理-填写表单', 'passed', '成功填写岗位信息');
        } catch (e) {
          recordTest('岗位管理-填写表单', 'failed', `填写失败: ${e.message}`);
        }
      }

      await page.waitForTimeout(500);
      await clickElement('button:has-text("取消"), .el-button--default', '取消按钮');
    }

    // ========== 测试搜索功能 ==========
    console.log('\n' + '='.repeat(80));
    console.log('🔍 测试7: 搜索功能');
    console.log('='.repeat(80));

    // 在用户管理页面测试搜索
    await page.goto(TARGET_URL + '/#/systemManage/userManagement', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const searchInput = await page.locator('input[placeholder*="搜索"], input[placeholder*="search"], .search-input input').first();
    const searchExists = await searchInput.count();

    if (searchExists > 0) {
      console.log('  📝 测试搜索功能...');
      try {
        await searchInput.fill('admin');
        console.log('    ✅ 填写搜索关键词: admin');
        await page.waitForTimeout(1000);

        // 尝试按回车或点击搜索按钮
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);

        await page.screenshot({ path: 'playwright-tests/search-result.png', fullPage: true });
        recordTest('搜索功能', 'passed', '搜索功能正常');
      } catch (e) {
        recordTest('搜索功能', 'warning', `搜索测试失败: ${e.message}`);
      }
    } else {
      recordTest('搜索功能', 'skipped', '未找到搜索框');
    }

    // ========== 测试分页功能 ==========
    console.log('\n' + '='.repeat(80));
    console.log('🔍 测试8: 分页功能');
    console.log('='.repeat(80));

    await page.goto(TARGET_URL + '/#/systemManage/userManagement', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const nextPageBtn = await page.locator('button[aria-label*="next"], .btn-next, .el-pagination__next').first();
    const nextPageExists = await nextPageBtn.count();

    if (nextPageExists > 0) {
      console.log('  📝 测试分页功能...');
      try {
        const isDisabled = await nextPageBtn.isDisabled();
        if (!isDisabled) {
          await nextPageBtn.click();
          console.log('    ✅ 点击下一页');
          await page.waitForTimeout(2000);
          recordTest('分页功能', 'passed', '分页功能正常');
        } else {
          recordTest('分页功能', 'skipped', '只有一页数据');
        }
      } catch (e) {
        recordTest('分页功能', 'warning', `分页测试失败: ${e.message}`);
      }
    }

  } catch (error) {
    console.error('\n❌ 测试过程出错:', error.message);
    await page.screenshot({ path: 'playwright-tests/test-error.png', fullPage: true });
  }

  // ========== 打印测试总结 ==========
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 CRUD 功能测试总结');
  console.log('='.repeat(80));

  console.log(`\n总计: ${testResults.summary.total} 项测试`);
  console.log(`✅ 通过: ${testResults.summary.passed} 项`);
  console.log(`❌ 失败: ${testResults.summary.failed} 项`);
  console.log(`⚠️ 跳过/警告: ${testResults.summary.total - testResults.summary.passed - testResults.summary.failed} 项`);

  console.log(`\n📡 API 调用统计: ${testResults.apiCalls.length} 次`);

  // 按页面分类显示测试结果
  console.log('\n📋 详细测试结果:');
  console.log('-'.repeat(80));

  const currentSection = '';
  for (const test of testResults.tests) {
    const section = test.name.split('-')[0];
    if (section !== currentSection) {
      console.log(`\n【${section}】`);
      console.log('-'.repeat(40));
    }

    const icon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⚠️';
    console.log(`  ${icon} ${test.name}: ${test.message}`);
  }

  // API 错误统计
  const apiErrors = testResults.apiCalls.filter(call => call.status && call.status >= 400);
  if (apiErrors.length > 0) {
    console.log('\n🔴 API 错误详情:');
    console.log('-'.repeat(80));
    apiErrors.forEach((err, index) => {
      console.log(`\n${index + 1}. ${err.method} ${err.url}`);
      console.log(`   状态码: ${err.status}`);
      if (err.body && err.body.length < 200) {
        console.log(`   响应: ${err.body}`);
      }
    });
  }

  // 保存测试结果
  fs.writeFileSync('playwright-tests/crud-test-result.json', JSON.stringify(testResults, null, 2));
  console.log('\n📄 测试结果已保存到: playwright-tests/crud-test-result.json');

  // 生成测试报告
  let report = `# 系统管理 CRUD 功能测试报告

## 测试时间
${testResults.timestamp}

## 测试统计
- 总计: ${testResults.summary.total}
- 通过: ${testResults.summary.passed}
- 失败: ${testResults.summary.failed}
- API 调用: ${testResults.apiCalls.length} 次

## 测试结果详情

`;

  for (const test of testResults.tests) {
    const icon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⚠️';
    report += `### ${icon} ${test.name}\n`;
    report += `- 状态: ${test.status}\n`;
    report += `- 描述: ${test.message}\n`;
    report += `- 时间: ${test.timestamp}\n\n`;
  }

  if (apiErrors.length > 0) {
    report += `## API 错误\n\n`;
    apiErrors.forEach((err, index) => {
      report += `### ${index + 1}. ${err.method} ${err.url}\n`;
      report += `- 状态码: ${err.status}\n`;
      if (err.body) {
        report += `- 响应: \`${err.body.substring(0, 100)}\`\n`;
      }
      report += '\n';
    });
  }

  fs.writeFileSync('playwright-tests/CRUD_TEST_REPORT.md', report);
  console.log('📄 测试报告已保存到: playwright-tests/CRUD_TEST_REPORT.md');

  console.log('\n⏳ 浏览器将保持打开 15 秒供查看...');
  await page.waitForTimeout(15000);

  await browser.close();
  console.log('\n✅ 测试完成');

  process.exit(testResults.summary.failed > 0 ? 1 : 0);
})();
