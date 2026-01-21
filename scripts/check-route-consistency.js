#!/usr/bin/env node

/**
 * 检查路由配置中导入路径的一致性
 * 验证所有导入的组件文件是否真实存在
 */
function checkRouteConsistency(routerFilePath) {
  console.log('🔍 开始检查路由配置一致性...\n');

  // 读取路由配置文件
  const routerContent = fs.readFileSync(routerFilePath, 'utf8');

  // 使用正则表达式匹配所有 import 语句
import fs from 'fs';
import path from 'path';
  const importRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
  const relativeImportRegex = /['"](\.\.\/[^'"]+)['"]/g;

  const imports = [];
  let match;
  
  while ((match = importRegex.exec(routerContent)) !== null) {
    const componentName = match[1];
    const importPath = match[2];
    
    // 只检查相对路径（以 ../ 或 ./ 开头的路径）
    if (importPath.startsWith('../') || importPath.startsWith('./')) {
      imports.push({
        componentName,
        importPath
      });
    }
  }

  // 获取路由文件所在的目录，用于解析相对路径
  const routerDir = path.dirname(routerFilePath);
  
  let errorCount = 0;
  let warningCount = 0;
  const errors = [];
  const warnings = [];

  console.log(`📁 检查路由文件: ${routerFilePath}\n`);

  imports.forEach(({ componentName, importPath }) => {
    // 解析绝对路径
    const absolutePath = path.resolve(routerDir, importPath);
    
    // 尝试添加常见的文件扩展名进行检查
    const possibleExtensions = ['.vue', '.js', '.jsx', '.ts', '.tsx'];
    let fileExists = false;
    let resolvedPath = absolutePath;

    // 如果路径本身就是一个存在的文件，直接使用
    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
      fileExists = true;
    } else {
      // 否则尝试添加扩展名
      for (const ext of possibleExtensions) {
        const pathWithExt = absolutePath + ext;
        if (fs.existsSync(pathWithExt) && fs.statSync(pathWithExt).isFile()) {
          fileExists = true;
          resolvedPath = pathWithExt;
          break;
        }
      }
    }

    if (fileExists) {
      console.log(`✅ ${componentName}: ${importPath} -> ${resolvedPath}`);
    } else {
      const errorMsg = `❌ ${componentName}: ${importPath} (文件不存在)`;
      console.log(errorMsg);
      errors.push({
        componentName,
        importPath,
        resolvedPath: absolutePath
      });
      errorCount++;
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('📊 检查结果:');
  console.log(`✅ 成功: ${imports.length - errorCount} 个`);
  console.log(`❌ 错误: ${errorCount} 个`);
  console.log(`⚠️  警告: ${warningCount} 个`);
  console.log('='.repeat(60));

  if (errors.length > 0) {
    console.log('\n📝 详细错误信息:');
    errors.forEach((error, index) => {
      console.log(`${index + 1}. 组件: ${error.componentName}`);
      console.log(`   导入路径: ${error.importPath}`);
      console.log(`   解析路径: ${error.resolvedPath}`);
      console.log(`   建议: 请检查文件路径是否正确或文件是否存在\n`);
    });

    console.log('💡 修复建议:');
    console.log('- 检查文件是否存在于指定路径');
    console.log('- 确认文件名拼写是否正确');
    console.log('- 验证文件扩展名是否匹配');
    console.log('- 检查大小写是否正确（某些系统区分大小写）');
    
    process.exit(1); // 退出码为1表示有错误
  } else {
    console.log('\n🎉 所有路由配置检查通过！');
  }
}

// 获取命令行参数或使用默认路径
const args = process.argv.slice(2);
const routerFilePath = args[0] || './src/router/index.js';

// 检查路由文件是否存在
if (!fs.existsSync(routerFilePath)) {
  console.error(`❌ 路由文件不存在: ${routerFilePath}`);
  console.log('💡 用法: node scripts/check-route-consistency.js [路由文件路径]');
  process.exit(1);
}

// 执行检查
checkRouteConsistency(path.resolve(routerFilePath));