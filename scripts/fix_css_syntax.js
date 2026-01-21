import fs from 'fs';
import path from 'path';

// 修复CSS中过时的语法
function fixCssSyntax(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 修复 >>> 和 /deep/ 组合器为 :deep()
  content = content.replace(/>>>|\/deep\//g, ':deep()');
  
  // 修复 ::v-deep 为 :deep()
  content = content.replace(/::v-deep\s+/g, ':deep(');
  content = content.replace(/::v-deep\(/g, ':deep(');
  
  // 修复 ::v-deep() 为 :deep()
  content = content.replace(/::v-deep\(\)/g, ':deep()');
  
  // 修复 left/right 等过时的渐变方向语法
  content = content.replace(/linear-gradient\(left/g, 'linear-gradient(to right');
  content = content.replace(/linear-gradient\(right/g, 'linear-gradient(to left');
  content = content.replace(/linear-gradient\(top/g, 'linear-gradient(to bottom');
  content = content.replace(/linear-gradient\(bottom/g, 'linear-gradient(to top');
  
  // 修复 -o-linear-gradient 和 -moz-linear-gradient 的方向
  content = content.replace(/-o-linear-gradient\(left/g, '-o-linear-gradient(to right');
  content = content.replace(/-o-linear-gradient\(right/g, '-o-linear-gradient(to left');
  content = content.replace(/-o-linear-gradient\(top/g, '-o-linear-gradient(to bottom');
  content = content.replace(/-o-linear-gradient\(bottom/g, '-o-linear-gradient(to top');
  
  content = content.replace(/-moz-linear-gradient\(left/g, '-moz-linear-gradient(to right');
  content = content.replace(/-moz-linear-gradient\(right/g, '-moz-linear-gradient(to left');
  content = content.replace(/-moz-linear-gradient\(top/g, '-moz-linear-gradient(to bottom');
  content = content.replace(/-moz-linear-gradient\(bottom/g, '-moz-linear-gradient(to top');
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed CSS syntax in: ${filePath}`);
}

// 遍历所有.vue文件
function processVueFiles(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // 跳过node_modules目录
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        processVueFiles(filePath);
      }
    } else if (file.endsWith('.vue')) {
      fixCssSyntax(filePath);
    }
  }
}

// 从src目录开始处理
processVueFiles(path.join(__dirname, '..', 'src'));

console.log('CSS syntax fix completed!');