#!/usr/bin/env python3
"""
修复 :deep() 中缺少闭合括号的问题

错误模式:
:deep(.xxx:not(.yyy) {
:deep(.xxx:hover ) {  (注意 hover 后有空格和 ))

修复为:
:deep(.xxx:not(.yyy)) {
:deep(.xxx:hover) {
"""

import re
import sys
from pathlib import Path


def fix_unclosed_deep(content):
    """修复缺少闭合括号的 :deep() """

    # 1. 修复 :deep( 后面跟 :not( 但缺少闭合括号
    # 模式: :deep(.xxx:not(.yyy) {
    content = re.sub(
        r':deep\(([^:)]*:not\([^)]+)\)\s*\{',
        r':deep(\1)) {',
        content
    )

    # 2. 修复 :deep(... 后面有空格和 )) {
    # 模式: :deep(.xxx:hover )) {
    content = re.sub(
        r':deep\([^)]+\)\s*\)\s*\{',
        lambda m: m.group(0).replace(') {', ' {').replace('))', ')'),
        content
    )

    # 3. 修复 :deep(... 后面有空格再跟伪类或伪元素
    # 模式: :deep(.xxx :hover ) {
    content = re.sub(
        r':deep\(([^)]+?\s:[a-z-]+)\s*\)\s*\{',
        r':deep(\1) {',
        content
    )

    # 4. 修复 :deep(.xxx ) { (选择器和 ) 之间有空格)
    content = re.sub(
        r':deep\(([^)]+)\s+\)\s*\{',
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
            return fix_unclosed_deep(style_block)

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
    print("🔧 Fixing unclosed :deep() patterns...\n")

    fixed_count = 0
    for file_path in vue_files:
        if fix_file(file_path):
            fixed_count += 1
            rel_path = file_path.relative_to(project_root)
            print(f"  ✓ Fixed: {rel_path}")

    print(f"\n✨ Done! Fixed {fixed_count} files")


if __name__ == '__main__':
    main()
