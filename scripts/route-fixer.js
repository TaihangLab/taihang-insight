#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 检查并修复路由配置中导入路径的一致性
 * 验证所有导入的组件文件是否真实存在，并尝试自动修复
 */
class RouteConsistencyChecker {
  constructor(routerFilePath) {
    this.routerFilePath = routerFilePath;
    this.routerDir = path.dirname(routerFilePath);
    this.possibleExtensions = ['.vue', '.js', '.jsx', '.ts', '.tsx'];
    this.commonComponentDirs = [
      'components',
      'views',
      'pages',
      'src/components',
      'src/views',
      'src/pages',
      'src/components/common',
      'src/components/layout',
      'src/components/visionAI',
      'src/components/visionAI/systemManagement',
      'src/components/visionAI/systemManagement/rbac',
      'src/components/visionAI/deviceManagement',
      'src/components/visionAI/monitoringWarning',
      'src/components/visionAI/modelManagement',
      'src/components/visionAI/skillManagement',
      'src/components/visionAI/edgeManagement',
      'src/components/visionAI/ivisualCenter',
      'src/components/visionAI/smartControl',
      'src/layout',
      'src/pages/system-management',
      'src/pages/system-management/components'
    ];
  }

  /**
   * 检查路由配置中导入路径的一致性
   */
  checkRouteConsistency() {
    console.log('🔍 开始检查路由配置一致性...\n');

    // 读取路由配置文件
    const routerContent = fs.readFileSync(this.routerFilePath, 'utf8');

    // 使用正则表达式匹配所有 import 语句
    const importRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;

    const imports = [];
    let match;
    
    while ((match = importRegex.exec(routerContent)) !== null) {
      const componentName = match[1];
      const importPath = match[2];
      
      // 只检查相对路径（以 ../ 或 ./ 开头的路径）
      if (importPath.startsWith('../') || importPath.startsWith('./')) {
        imports.push({
          componentName,
          importPath,
          originalMatch: match[0]
        });
      }
    }

    let errorCount = 0;
    let warningCount = 0;
    const errors = [];
    const warnings = [];
    const fixes = [];

    console.log(`📁 检查路由文件: ${this.routerFilePath}\n`);

    imports.forEach(({ componentName, importPath, originalMatch }) => {
      // 解析绝对路径
      const absolutePath = path.resolve(this.routerDir, importPath);
      
      // 尝试添加常见的文件扩展名进行检查
      let fileExists = false;
      let resolvedPath = absolutePath;
      let correctedPath = null;

      // 如果路径本身就是一个存在的文件，直接使用
      if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
        fileExists = true;
      } else {
        // 否则尝试添加扩展名
        for (const ext of this.possibleExtensions) {
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
        // 尝试自动修复路径
        correctedPath = this.findCorrectPath(importPath, componentName);
        
        if (correctedPath) {
          const errorMsg = `⚠️  ${componentName}: ${importPath} (路径不正确，建议修正为: ${correctedPath})`;
          console.log(errorMsg);
          fixes.push({
            originalPath: importPath,
            correctedPath: correctedPath,
            componentName,
            resolvedPath: absolutePath
          });
          warningCount++;
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
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 检查结果:');
    console.log(`✅ 成功: ${imports.length - errorCount - fixes.length} 个`);
    console.log(`⚠️  可修复: ${fixes.length} 个`);
    console.log(`❌ 错误: ${errorCount} 个`);
    console.log('='.repeat(60));

    if (errors.length > 0) {
      console.log('\n📝 详细错误信息:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. 组件: ${error.componentName}`);
        console.log(`   导入路径: ${error.importPath}`);
        console.log(`   解析路径: ${error.resolvedPath}`);
        console.log(`   建议: 请检查文件路径是否正确或文件是否存在\n`);
      });
    }

    if (fixes.length > 0) {
      console.log('\n🔧 可自动修复的问题:');
      fixes.forEach((fix, index) => {
        console.log(`${index + 1}. 组件: ${fix.componentName}`);
        console.log(`   原路径: ${fix.originalPath}`);
        console.log(`   修正路径: ${fix.correctedPath}`);
        console.log('');
      });

      // 询问是否自动修复
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question('🤔 是否自动修复这些问题? (y/N): ', (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          this.applyFixes(fixes);
        } else {
          console.log('ℹ️  未应用任何修复。');
        }
        rl.close();
      });
    }

    if (errors.length > 0) {
      console.log('\n💡 修复建议:');
      console.log('- 检查文件是否存在于指定路径');
      console.log('- 确认文件名拼写是否正确');
      console.log('- 验证文件扩展名是否匹配');
      console.log('- 检查大小写是否正确（某些系统区分大小写）');
      
      process.exit(1); // 退出码为1表示有错误
    } else if (errors.length === 0 && fixes.length > 0) {
      console.log('\n🎉 检查完成！发现可修复的问题，等待用户确认...');
    } else {
      console.log('\n🎉 所有路由配置检查通过！');
    }
  }

  /**
   * 尝试找到正确的文件路径
   */
  findCorrectPath(originalPath, componentName) {
    // 移除扩展名（如果有的话）
    let cleanPath = originalPath;
    for (const ext of this.possibleExtensions) {
      if (originalPath.endsWith(ext)) {
        cleanPath = originalPath.substring(0, originalPath.length - ext.length);
        break;
      }
    }

    // 尝试在不同目录中查找文件
    for (const dir of this.commonComponentDirs) {
      const fullPath = path.resolve(this.routerDir, dir);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        // 搜索目录及其子目录
        const foundPath = this.searchInDirectory(fullPath, componentName, originalPath);
        if (foundPath) {
          return path.relative(this.routerDir, foundPath).replace(/\\/g, '/');
        }
      }
    }

    return null;
  }

  /**
   * 在指定目录中搜索组件文件
   */
  searchInDirectory(dir, componentName, originalPath) {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // 递归搜索子目录
          const result = this.searchInDirectory(filePath, componentName, originalPath);
          if (result) return result;
        } else if (stat.isFile()) {
          // 检查文件名是否匹配组件名
          const fileNameWithoutExt = path.basename(file, path.extname(file));
          
          if (fileNameWithoutExt.toLowerCase() === componentName.toLowerCase()) {
            return filePath;
          }
          
          // 检查文件名是否包含原始路径的一部分
          if (originalPath.toLowerCase().includes(fileNameWithoutExt.toLowerCase())) {
            return filePath;
          }
        }
      }
    } catch (err) {
      // 忽略无法访问的目录
    }
    
    return null;
  }

  /**
   * 应用修复
   */
  applyFixes(fixes) {
    console.log('\n🔄 正在应用修复...');

    let routerContent = fs.readFileSync(this.routerFilePath, 'utf8');

    fixes.forEach(fix => {
      // 替换导入语句中的路径
      const originalImportPattern = new RegExp(`(['"])${fix.originalPath}(['"])`, 'g');
      routerContent = routerContent.replace(originalImportPattern, `'${fix.correctedPath}'`);
      console.log(`✅ 已修复 ${fix.componentName}: ${fix.originalPath} -> ${fix.correctedPath}`);
    });

    // 写回文件
    fs.writeFileSync(this.routerFilePath, routerContent);
    console.log(`\n💾 修复已保存到 ${this.routerFilePath}`);
    console.log('🎉 修复完成！请重新运行项目以验证修复效果。');
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
const checker = new RouteConsistencyChecker(path.resolve(routerFilePath));
checker.checkRouteConsistency();