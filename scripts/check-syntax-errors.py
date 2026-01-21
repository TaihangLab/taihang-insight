#!/usr/bin/env python3
"""
检查文件中的语法错误 - 特别是没有闭合的字符串
"""

import re
from pathlib import Path


def check_file(file_path):
    """检查单个文件的语法问题"""
    try:
        content = file_path.read_text(encoding='utf-8')
        lines = content.split('\n')

        issues = []

        for i, line in enumerate(lines, 1):
            # 检查单引号不匹配的情况
            single_quotes = line.count("'")
            if single_quotes % 2 != 0:
                # 排除注释行
                if '//' not in line or line.find("'") < line.find('//'):
                    issues.append((i, line.strip()))

        return issues

    except Exception as e:
        print(f"❌ Error: {file_path}: {e}")
        return []


def main():
    project_root = Path(__file__).parent.parent
    file_to_check = project_root / 'src/components/visionAI/ivisualCenter/index.vue'

    print(f"🔍 检查: {file_to_check.relative_to(project_root)}\n")

    issues = check_file(file_to_check)

    if issues:
        print(f"找到 {len(issues)} 个可能的语法错误:\n")
        for line_num, line_content in issues:
            print(f"  行 {line_num}: {line_content[:80]}...")
    else:
        print("✅ 未发现语法错误")


if __name__ == '__main__':
    main()
