#!/usr/bin/env python3
"""
简化版驼峰命名到蛇形命名转换脚本
"""

import os
import re
from pathlib import Path


def process_file(file_path, patterns):
    """
    处理单个文件，执行模式替换
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # 应用所有替换模式
    for old_pattern, new_pattern in patterns:
        # 使用单词边界确保只替换完整单词
        content = re.sub(r'\b' + re.escape(old_pattern) + r'\b', new_pattern, content)

    # 如果内容发生了变化，则写回文件
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False


def main():
    # 定义项目路径
    project_path = Path("/Users/ray/IdeaProjects/taihang/taihang-insight/src")
    
    # 从命令行参数获取要替换的模式
    import sys
    if len(sys.argv) < 3:
        print("用法: python3 quick_replace.py <old_pattern> <new_pattern>")
        print("例如: python3 quick_replace.py tenantCode tenant_code")
        return
    
    old_pattern = sys.argv[1]
    new_pattern = sys.argv[2]
    
    patterns = [(old_pattern, new_pattern)]

    # 查找所有 JS 和 Vue 文件
    js_files = project_path.rglob("*.js")
    vue_files = project_path.rglob("*.vue")
    
    all_files = list(js_files) + list(vue_files)
    
    print(f"使用模式 '{old_pattern}' -> '{new_pattern}' 处理 {len(all_files)} 个文件...")
    
    updated_count = 0
    for file_path in all_files:
        try:
            if process_file(file_path, patterns):
                updated_count += 1
                print(f"  已更新: {file_path.name}")
        except Exception as e:
            print(f"处理文件时出错 {file_path}: {str(e)}")
    
    print(f"\n完成！共更新了 {updated_count} 个文件。")


if __name__ == "__main__":
    main()