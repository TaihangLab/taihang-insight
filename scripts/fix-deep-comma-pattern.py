#!/usr/bin/env python3
"""
修复 :deep( 后面跟逗号的错误模式

错误模式：
.warning-table :deep(.el-table,
.device-table :deep(.el-table) {

修复为：
.warning-table :deep(.el-table),
.device-table :deep(.el-table) {
"""

import re
import sys
from pathlib import Path


def fix_deep_comma_pattern(content):
    """修复 :deep( 后面跟逗号的模式"""

    # 模式1: :deep(.xxx, 后面跟换行，然后下一行是 .yyy :deep(.zzz) {
    # 修复为: :deep(.xxx),
    #         .yyy :deep(.zzz) {

    # 首先处理 :deep( 后面跟逗号的情况
    lines = content.split('\n')
    result = []

    for i, line in enumerate(lines):
        # 检查是否有 :deep(..., 的模式
        if re.search(r':deep\([^)]*,\s*$', line):
            # 在逗号后加 )，然后继续
            line = re.sub(r':deep\(([^)]*),\s*$', r':deep(\1),', line)

        result.append(line)

    return '\n'.join(result)


def fix_file(file_path):
    """修复单个文件"""
    try:
        content = file_path.read_text(encoding='utf-8')
        original = content

        # 检查是否有问题模式
        if not re.search(r':deep\([^)]*,\s*$', content):
            return 0

        # 处理 style 块
        def replace_style(match):
            style_block = match.group(0)
            return fix_deep_comma_pattern(style_block)

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
    css_files = sorted(src_dir.rglob('*.css'))

    print(f"🔍 Found {len(vue_files)} Vue files and {len(css_files)} CSS files")
    print("🔧 Fixing :deep( followed by comma pattern...\n")

    fixed_count = 0
    for file_path in vue_files + css_files:
        if fix_file(file_path):
            fixed_count += 1
            rel_path = file_path.relative_to(project_root)
            print(f"  ✓ Fixed: {rel_path}")

    print(f"\n✨ Done! Fixed {fixed_count} files")


if __name__ == '__main__':
    main()
