#!/usr/bin/env python3
"""
修复剩余的深度选择器问题

修复模式:
1. .xxx >>> .yyy) → .xxx :deep(.yyy)
2. ::deep( → :deep(
3. 带有 ) 结尾的错误 :deep() 模式
"""

import re
import sys
from pathlib import Path


def fix_remaining_patterns(content):
    """修复剩余的深度选择器模式"""

    # 1. 修复 .xxx >>> .yyy) → .xxx :deep(.yyy)
    # 这种模式是 >>> 后面跟选择器，但是最后是 )
    content = re.sub(
        r'([^{]+?)\s*>>>\s*([^{}]+?)\)',
        r'\1:deep(\2)',
        content
    )

    # 2. 修复 ::deep( → :deep(
    content = re.sub(r'::deep\(', ':deep(', content)

    # 3. 修复 .xxx >>> .yyy { (模式后面直接跟 {)
    content = re.sub(
        r'([^{]+?)\s*>>>\s*([^{}]+?)\s*\{',
        r'\1:deep(\2) {',
        content,
        flags=re.DOTALL
    )

    # 4. 修复 .xxx >>> .yyy (多行选择器的一部分)
    # 这种需要特别小心处理

    return content


def fix_file(file_path):
    """修复单个文件"""
    try:
        content = file_path.read_text(encoding='utf-8')
        original = content

        # 处理 style 块
        def replace_style(match):
            style_block = match.group(0)
            return fix_remaining_patterns(style_block)

        new_content = re.sub(
            r'<style\b[^>]*>.*?</style>',
            replace_style,
            content,
            flags=re.DOTALL | re.IGNORECASE
        )

        if new_content != original:
            file_path.write_text(new_content, encoding='utf-8')
            return 1

        return 0

    except Exception as e:
        print(f"❌ Error: {file_path}: {e}", file=sys.stderr)
        return 0


def main():
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    src_dir = project_root / 'src'

    if not src_dir.exists():
        print(f"❌ Error: {src_dir} does not exist", file=sys.stderr)
        sys.exit(1)

    vue_files = sorted(src_dir.rglob('*.vue'))

    print(f"🔍 Found {len(vue_files)} Vue files")
    print("🔧 Fixing remaining deep selector patterns...\n")

    fixed_count = 0
    for file_path in vue_files:
        if fix_file(file_path):
            fixed_count += 1
            rel_path = file_path.relative_to(project_root)
            print(f"  ✓ Fixed: {rel_path}")

    print(f"\n✨ Done! Fixed {fixed_count} files")


if __name__ == '__main__':
    main()
