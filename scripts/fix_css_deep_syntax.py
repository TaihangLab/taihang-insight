#!/usr/bin/env python3
"""
修复CSS中错误的:deep()语法
"""

import re

def fix_css_deep_syntax(file_path):
    """修复CSS中错误的:deep()语法"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 修复 .class :deep(.selector) ) ) { 类型的错误语法
    # 匹配模式：任何字符 + :deep(...) + 一个或多个 ) + 空格 + { 
    pattern = r'(:deep\([^)]*\))\s*\)+\s*{'
    fixed_content = re.sub(pattern, r'\1 {', content)
    
    # 再次检查是否有连续多个右括号的情况
    pattern2 = r'(:deep\([^)]*\))\s*\)+\s*\)+\s*{'
    fixed_content = re.sub(pattern2, r'\1 {', fixed_content)
    
    # 再次检查是否有三个右括号的情况
    pattern3 = r'(:deep\([^)]*\))\s*\)\s*\)\s*\){'
    fixed_content = re.sub(pattern3, r'\1 {', fixed_content)
    
    # 检查是否有四个右括号的情况
    pattern4 = r'(:deep\([^)]*\))\s*\)\s*\)\s*\)\s*\){'
    fixed_content = re.sub(pattern4, r'\1 {', fixed_content)
    
    if content != fixed_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        print(f"已修复CSS deep语法: {file_path}")
        return True
    return False

def main():
    file_path = "src/components/visionAI/modelManagement/modelList.vue"
    if fix_css_deep_syntax(file_path):
        print("CSS deep语法修复完成")
    else:
        print("未发现需要修复的CSS deep语法")

if __name__ == "__main__":
    main()