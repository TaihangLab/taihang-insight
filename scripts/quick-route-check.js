#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 简化版路由一致性检查工具
 * 快速检查路由配置中导入路径的存在性
 */
function quickCheckRoutes(routerFilePath) {
  console.log('🔍 快速检查路由配置...\n');

  // 读取路由配置文件
  const routerContent = fs.readFileSync(routerFilePath, 'utf8');

  // 匹配所有 import 语句
  const importRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;

  const imports = [];
  let match;
  
  while ((match = importRegex.exec(routerContent)) !== null) {
    const componentName = match[1];
    const importPath = match[2];
    
    // 只检查相对路径
    if (importPath.startsWith('../') || importPath.startsWith('./')) {
      imports.push({ componentName, importPath });
    }
  }

  const routerDir = path.dirname(routerFilePath);
  let errorCount = 0;
  const errors = [];

  imports.forEach(({ componentName, importPath }) => {
    // 解析绝对路径
    const absolutePath = path.resolve(routerDir, importPath);
    
    // 尝试添加常见扩展名
    const possibleExtensions = ['.vue', '.js', '.jsx', '.ts', '.tsx'];
    let fileExists = false;

    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
      fileExists = true;
    } else {
      for (const ext of possibleExtensions) {
        const pathWithExt = absolutePath + ext;
        if (fs.existsSync(pathWithExt) && fs.statSync(pathWithExt).isFile()) {
          fileExists = true;
          break;
        }
      }
    }

    if (fileExists) {
      console.log(`✅ ${componentName}: OK`);
    } else {
      console.log(`❌ ${componentName}: ${importPath} (文件不存在)`);
      errors.push({ componentName, importPath });
      errorCount++;
    }
  });

  console.log(`\n📊 总结: ${imports.length - errorCount} 个成功, ${errorCount} 个错误`);

  if (errorCount > 0) {
    console.log('\n❌ 发现错误，请检查以上路径');
    process.exit(1);
  } else {
    console.log('\n✅ 所有路由配置正常');
  }
}

// 获取路由文件路径
const args = process.argv.slice(2);
const routerFilePath = args[0] || './src/router/index.js';

if (!fs.existsSync(routerFilePath)) {
  console.error(`❌ 路由文件不存在: ${routerFilePath}`);
  process.exit(1);
}

quickCheckRoutes(path.resolve(routerFilePath));