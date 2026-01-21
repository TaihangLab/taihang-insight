#!/usr/bin/env python3
"""
修复未闭合的 :deep() 括号问题

处理模式：
- .warning-table :deep(.el-table,
  .device-table :deep(.el-table) {

转换为：
- .warning-table :deep(.el-table),
  .device-table :deep(.el-table) {
"""

import re
import sys
from pathlib import Path


def fix_unclosed_parens(content):
    """修复未闭合的 :deep() 括号"""
    lines = content.split('\n')
    result = []

    for line in lines:
        # 检查是否有 :deep( 但后面没有 )
        if ':deep(' in line:
            # 查找 :deep( 后面的内容
            depth_match = re.search(r':deep\(([^)]+)', line)
            if depth_match:
                # 检查这一行是否有 )，如果没有，检查是否在行尾
                inner = depth_match.group(1)
                # 如果行以 , 结尾，说明是多行选择器
                if line.strip().endswith(','):
                    # 保留原样，不需要加 )
                    pass
                # 如果行以 { 结尾，需要在 { 前加 )
                elif '{' in line:
                    line = line.replace('{', ') {', 1)

        result.append(line)

    return '\n'.join(result)


def fix_file(file_path):
    """修复单个文件"""
    try:
        content = file_path.read_text(encoding='utf-8')
        original = content

        # 只处理包含 :deep( 的文件
        if ':deep(' not in content:
            return 0

        # 检查是否有未闭合的括号模式
        if re.search(r':deep\([^)]*\{', content):
            # 处理 style 块
            def replace_style(match):
                style_block = match.group(0)
                return fix_unclosed_parens(style_block)

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
    print("🔧 Fixing unclosed :deep() parentheses...\n")

    fixed_count = 0
    for file_path in vue_files + css_files:
        if fix_file(file_path):
            fixed_count += 1
            rel_path = file_path.relative_to(project_root)
            print(f"  ✓ Fixed: {rel_path}")

    print(f"\n✨ Done! Fixed {fixed_count} files")


if __name__ == '__main__':
    main()
