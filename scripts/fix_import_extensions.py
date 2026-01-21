#!/usr/bin/env python3
"""
自动修复Vue文件中缺少扩展名的导入语句
"""

import os
import re
from pathlib import Path

def find_vue_files(root_dir):
    """查找所有Vue文件"""
    vue_files = []
    for root, dirs, files in os.walk(root_dir):
        # 跳过node_modules目录
        dirs[:] = [d for d in dirs if d != 'node_modules' and d != '.git']
        for file in files:
            if file.endswith('.vue'):
                vue_files.append(os.path.join(root, file))
    return vue_files

def fix_import_statements(file_path):
    """修复单个文件中的导入语句"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 正则表达式匹配导入语句，检查是否缺少扩展名
    # 匹配形如 import xxx from './xxx' 或 import { xxx } from './xxx' 的语句
    pattern = r"(import\s+[\w{},\s*]+\s+from\s+['\"](\.[^'\"]+)['\"])"
    
    def replace_import(match):
        full_match = match.group(0)
        import_path = match.group(2)
        
        # 检查路径是否已经包含扩展名
        if any(import_path.endswith(ext) for ext in ['.vue', '.js', '.ts', '.jsx', '.tsx']):
            return full_match
        
        # 如果路径指向的是相对路径（以 ./ 或 ../ 开头）
        if import_path.startswith('./') or import_path.startswith('../'):
            # 检查在同一目录或父目录下是否存在对应的.vue文件
            dir_path = os.path.dirname(file_path)
            abs_import_path = os.path.abspath(os.path.join(dir_path, import_path))
            
            # 检查是否存在对应的.vue文件
            vue_path = abs_import_path + '.vue'
            if os.path.exists(vue_path):
                # 修改原导入语句，添加.vue扩展名
                new_import = full_match.replace(f"'{import_path}'", f"'{import_path}.vue'")
                new_import = new_import.replace(f'"{import_path}"', f'"{import_path}.vue"')
                return new_import
            
            # 检查是否存在对应的.js文件
            js_path = abs_import_path + '.js'
            if os.path.exists(js_path):
                # 修改原导入语句，添加.js扩展名
                new_import = full_match.replace(f"'{import_path}'", f"'{import_path}.js'")
                new_import = new_import.replace(f'"{import_path}"', f'"{import_path}.js"')
                return new_import
                
            # 检查是否存在对应的.ts文件
            ts_path = abs_import_path + '.ts'
            if os.path.exists(ts_path):
                # 修改原导入语句，添加.ts扩展名
                new_import = full_match.replace(f"'{import_path}'", f"'{import_path}.ts'")
                new_import = new_import.replace(f'"{import_path}"', f'"{import_path}.ts"')
                return new_import
    
        return full_match
    
    # 执行替换
    new_content = re.sub(pattern, replace_import, content)
    
    # 再次检查是否有需要修复的导入语句（针对import xx from 'xxx'格式）
    pattern2 = r"(import\s+[^(from)]+\s+from\s+['\"](\.[^'\"]+)['\"])"
    new_content = re.sub(pattern2, replace_import, new_content)
    
    # 检查是否有变化
    if content != new_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"已修复: {file_path}")
        return True
    return False

def main():
    root_dir = "src"  # 只定在src目录下查找
    vue_files = find_vue_files(root_dir)
    
    fixed_count = 0
    print(f"找到 {len(vue_files)} 个Vue文件")
    
    for vue_file in vue_files:
        try:
            if fix_import_statements(vue_file):
                fixed_count += 1
        except Exception as e:
            print(f"处理文件时出错 {vue_file}: {str(e)}")
    
    print(f"\n总共修复了 {fixed_count} 个文件")

if __name__ == "__main__":
    main()