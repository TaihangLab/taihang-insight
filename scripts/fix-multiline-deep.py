#!/usr/bin/env python3
"""
修复多行深度选择器的问题

处理模式：
.warning-table :deep(.el-table,
.device-table :deep(.el-table) {

这种情况下，第一行的 :deep( 后面有逗号，说明选择器继续
第二行的 :deep(...) 后面有 ) { ，需要保持
"""

import re
import sys
from pathlib import Path


def fix_multiline_selectors(content):
    """修复多行选择器中的 :deep() 问题"""
    lines = content.split('\n')
    result = []
    i = 0

    while i < len(lines):
        line = lines[i]

        # 检查是否有 :deep( 后面跟逗号（多行选择器开始）
        if re.search(r':deep\([^)]*,\s*$', line):
            # 保留这一行，不需要修改
            result.append(line)
            i += 1
            # 继续处理后续行，直到找到 )
            while i < len(lines):
                next_line = lines[i]
                result.append(next_line)
                # 如果找到 ) { ，说明多行选择器结束
                if re.search(r':deep\([^)]+\)\s*\{', next_line):
                    break
                i += 1
        else:
            # 处理单行 :deep(... { 的情况
            if re.search(r':deep\([^)]*\{', line):
                # 在 { 前加 )
                line = re.sub(r'(:deep\([^)]*)\s*\{', r'\1) {', line)
            result.append(line)

        i += 1

    return '\n'.join(result)


def fix_file(file_path):
    """修复单个文件"""
    try:
        content = file_path.read_text(encoding='utf-8')
        original = content

        # 只处理包含多行 :deep( 模式的文件
        if not re.search(r':deep\([^)]*,\s*$', content):
            return 0

        # 处理 style 块
        def replace_style(match):
            style_block = match.group(0)
            return fix_multiline_selectors(style_block)

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
    print("🔧 Fixing multiline :deep() selectors...\n")

    fixed_count = 0
    for file_path in vue_files:
        if fix_file(file_path):
            fixed_count += 1
            rel_path = file_path.relative_to(project_root)
            print(f"  ✓ Fixed: {rel_path}")

    print(f"\n✨ Done! Fixed {fixed_count} files")


if __name__ == '__main__':
    main()
