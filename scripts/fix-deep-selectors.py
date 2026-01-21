#!/usr/bin/env python3
"""
Vue 2 → Vue 3 深度选择器迁移工具

将以下语法：
  - .parent >>> .child
  - .parent /deep/ .child
  - ::v-deep .child
  - ::v-deep(.child)

转换为 Vue 3 标准语法：
  - .parent :deep(.child)
  - :deep(.child)

用法:
  python fix-vue-deep-selectors.py               # 实际修改文件
  python fix-vue-deep-selectors.py --dry-run     # 仅预览改动
"""

import re
import sys
import argparse
from pathlib import Path


def replace_deep_selector(match):
    before = match.group(1) or ''
    target = match.group(2).strip()
    if not target or ':deep(' in target:
        return match.group(0)
    return f"{before}:deep({target})"


def fix_css_block(css: str) -> str:
    """修复 CSS 块中的深度选择器"""
    original = css

    # 1. 处理 >>> 和 /deep/ （必须后跟 {，避免误匹配）
    css = re.sub(
        r'([^{]*?)\s*>>>\s*([^{}]+?)(?=\s*\{)',
        replace_deep_selector,
        css,
        flags=re.DOTALL
    )
    css = re.sub(
        r'([^{]*?)\s*/deep/\s*([^{}]+?)(?=\s*\{)',
        replace_deep_selector,
        css,
        flags=re.DOTALL
    )

    # 2. 处理 ::v-deep(...) → :deep(...)
    css = re.sub(r'::v-deep\s*(  $ [^)]+ $  )', r':deep\1', css)

    # 3. 处理 ::v-deep .x → :deep(.x)
    css = re.sub(
        r'::v-deep\s+([^{}]+?)(?=\s*\{)',
        lambda m: f":deep({m.group(1).strip()})",
        css
    )

    return css


def process_vue_file(file_path: Path, dry_run: bool = False) -> bool:
    """处理单个 .vue 文件，返回是否需要修改"""
    try:
        content = file_path.read_text(encoding='utf-8')
        original = content

        def replace_style_block(m):
            style_block = m.group(0)
            fixed = fix_css_block(style_block)
            return fixed

        # 匹配所有 <style ...>...</style> 块（不区分大小写，支持属性）
        content = re.sub(
            r'<style\b[^>]*>.*?</style>',
            replace_style_block,
            content,
            flags=re.DOTALL | re.IGNORECASE
        )

        if content != original:
            if not dry_run:
                file_path.write_text(content, encoding='utf-8')
            return True
        return False

    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}", file=sys.stderr)
        return False


def main():
    parser = argparse.ArgumentParser(description="Migrate Vue 2 deep selectors to Vue 3")
    parser.add_argument('--dry-run', action='store_true', help="Preview changes without modifying files")
    args = parser.parse_args()

    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    src_dir = project_root / 'src'

    if not src_dir.exists():
        print(f"❌ Error: '{src_dir}' does not exist. Please run this script from your project root.", file=sys.stderr)
        sys.exit(1)

    vue_files = sorted(src_dir.rglob('*.vue'))
    if not vue_files:
        print("⚠️  No .vue files found in ./src")
        return

    print(f"🔍 Scanning {len(vue_files)} .vue files in {src_dir}")
    if args.dry_run:
        print("👀 DRY RUN MODE — no files will be modified\n")

    fixed_count = 0
    for file_path in vue_files:
        if process_vue_file(file_path, dry_run=args.dry_run):
            fixed_count += 1
            rel_path = file_path.relative_to(project_root)
            status = "🔧 WOULD FIX" if args.dry_run else "✅ FIXED"
            print(f"{status}: {rel_path}")

    print("\n" + "="*50)
    if args.dry_run:
        print(f"💡 DRY RUN COMPLETE: {fixed_count} files need updates.")
        print("Run without --dry-run to apply changes.")
    else:
        print(f"✨ SUCCESS: {fixed_count} / {len(vue_files)} files updated.")


if __name__ == '__main__':
    main()