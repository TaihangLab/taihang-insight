#!/usr/bin/env python3
"""
修复 CSS 文件中的深度选择器

处理 .css 和 .less 文件中的 >>> 和 /deep/ 选择器
"""

import re
import sys
from pathlib import Path


def fix_css_selectors(content):
    """修复 CSS 文件中的深度选择器"""

    # 1. 处理 >>> → :deep()
    # 匹配 .xxx >>> .yyy { 或 .xxx >>> .yyy {
    content = re.sub(
        r'([^{]+?)\s*>>>\s*([^{}]+?)(?=\s*\{)',
        lambda m: f"{m.group(1).strip()} :deep({m.group(2).strip()})",
        content,
        flags=re.DOTALL
    )

    # 2. 处理 /deep/ → :deep()
    content = re.sub(
        r'([^{]+?)\s*/deep/\s*([^{}]+?)(?=\s*\{)',
        lambda m: f"{m.group(1).strip()} :deep({m.group(2).strip()})",
        content,
        flags=re.DOTALL
    )

    # 3. 处理 ::v-deep .xxx → :deep(.xxx)
    content = re.sub(
        r'::v-deep\s+([^{]+?)(?=\s*\{)',
        lambda m: f":deep({m.group(1).strip()})",
        content
    )

    # 4. 处理 ::v-deep(.xxx) → :deep(.xxx)
    content = re.sub(r'::v-deep\s*\(', ':deep(', content)

    return content


def fix_file(file_path):
    """修复单个文件"""
    try:
        content = file_path.read_text(encoding='utf-8')
        original = content

        new_content = fix_css_selectors(content)

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

    # 查找所有 CSS 和 LESS 文件
    css_files = sorted(src_dir.rglob('*.css'))
    less_files = sorted(src_dir.rglob('*.less'))
    all_files = css_files + less_files

    if not all_files:
        print("⚠️  未找到任何 CSS/LESS 文件")
        return

    print(f"🔍 扫描到 {len(all_files)} 个样式文件")
    print("🔧 修复深度选择器...\n")

    fixed_count = 0
    for file_path in all_files:
        if fix_file(file_path):
            fixed_count += 1
            rel_path = file_path.relative_to(project_root)
            print(f"  ✅ 已修复: {rel_path}")

    print("\n" + "=" * 50)
    print(f"✨ 完成！已修复 {fixed_count} / {len(all_files)} 个文件")


if __name__ == '__main__':
    main()
