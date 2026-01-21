#!/usr/bin/env python3
"""
修复 require() 转换后遗留的语法问题

处理模式:
1. '.jpg','  →  '.jpg',
2. '.jpeg',' →  '.jpeg',
"""

import re
from pathlib import Path


def fix_file(file_path):
    """修复单个文件"""
    try:
        content = file_path.read_text(encoding='utf-8')
        original = content

        # 修复: '.jpg',' 变成 '.jpg',
        content = content.replace("','", "")

        if content != original:
            file_path.write_text(content, encoding='utf-8')
            return 1

        return 0

    except Exception as e:
        print(f"❌ Error: {file_path}: {e}")
        return 0


def main():
    project_root = Path(__file__).parent.parent

    # 修复特定文件
    file_to_fix = project_root / 'src/components/visionAI/ivisualCenter/index.vue'

    print(f"🔧 修复: {file_to_fix.relative_to(project_root)}")

    if fix_file(file_to_fix):
        print("✅ 修复成功!")
    else:
        print("ℹ️  无需修复")


if __name__ == '__main__':
    main()
