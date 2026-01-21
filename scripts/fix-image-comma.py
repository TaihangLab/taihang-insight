#!/usr/bin/env python3
"""
修复 image 行缺少逗号的问题
"""

import re
from pathlib import Path


def fix_file(file_path):
    """修复单个文件"""
    try:
        content = file_path.read_text(encoding='utf-8')
        original = content

        # 修复: image: 'xxx.jpg'\n          event:  →  image: 'xxx.jpg',\n          event:
        content = re.sub(
            r"(image:\s*'[^']+\.(jpg|jpeg|png|gif)')\n(\s+event:)",
            r"\1,\n\2",
            content
        )

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
