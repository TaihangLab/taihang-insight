#!/usr/bin/env python3
"""
修复 :deep() 后面多出一个 ) 的模式

错误模式:
:deep(.xxx)) {
:deep(.yyy)) {

修复为:
:deep(.xxx) {
:deep(.yyy) {
"""

import re
import sys
from pathlib import Path


def fix_double_close_paren(content):
    """修复 :deep() 后面的双 )"""

    # 模式: :deep(...) 后面跟 ) {
    # 修复为: :deep(...) {
    content = re.sub(
        r':deep\(([^)]+)\)\)\s*\{',
        r':deep(\1) {',
        content
    )

    return content


def fix_file(file_path):
    """修复单个文件"""
    try:
        content = file_path.read_text(encoding='utf-8')
        original = content

        # 处理 style 块
        def replace_style(match):
            style_block = match.group(0)
            return fix_double_close_paren(style_block)

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
    print("🔧 Fixing double close paren in :deep()...\n")

    fixed_count = 0
    for file_path in vue_files:
        if fix_file(file_path):
            fixed_count += 1
            rel_path = file_path.relative_to(project_root)
            print(f"  ✓ Fixed: {rel_path}")

    print(f"\n✨ Done! Fixed {fixed_count} files")


if __name__ == '__main__':
    main()
