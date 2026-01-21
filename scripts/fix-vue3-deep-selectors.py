#!/usr/bin/env python3
"""
Vue 深度选择器迁移工具 (Vue 2 → Vue 3)

功能：
  - 仅处理 .vue 文件中的 <style> 块
  - 替换以下语法为 :deep(...)
      * .parent >>> .child
      * .parent /deep/ .child
      * ::v-deep .child
      * ::v-deep(.child)
  - 支持 --dry-run 预览
  - 自动跳过已符合规范的代码

用法：
  python migrate-deep-selectors.py               # 实际修改
  python migrate-deep-selectors.py --dry-run     # 仅预览
"""

import re
import sys
import argparse
from pathlib import Path


def convert_deep_selector(match):
    """将匹配到的深度选择器转换为 :deep(...) 格式"""
    prefix = match.group(1) or ''  # 如 ".container "
    target = match.group(2).strip()
    if not target or ':deep(' in target:
        return match.group(0)
    return f"{prefix}:deep({target})"


def fix_style_block(style_content: str) -> str:
    """修复单个 <style>...</style> 块中的深度选择器"""
    content = style_content

    # 1. 处理 >>> 和 /deep/ （要求后面跟着 {，避免误匹配）
    content = re.sub(
        r'([^{]*?)\s*>>>\s*([^{}]+?)(?=\s*\{)',
        convert_deep_selector,
        content,
        flags=re.DOTALL
    )
    content = re.sub(
        r'([^{]*?)\s*/deep/\s*([^{}]+?)(?=\s*\{)',
        convert_deep_selector,
        content,
        flags=re.DOTALL
    )

    # 2. 处理 ::v-deep(...) → :deep(...)
    content = re.sub(r'::v-deep\s*(  $ [^)]+ $  )', r':deep\1', content)

    # 3. 处理 ::v-deep .x → :deep(.x)
    content = re.sub(
        r'::v-deep\s+([^{}]+?)(?=\s*\{)',
        lambda m: f":deep({m.group(1).strip()})",
        content
    )

    return content


def process_vue_file(file_path: Path, dry_run: bool = False) -> bool:
    """处理单个 .vue 文件，返回是否发生变更"""
    try:
        original = file_path.read_text(encoding='utf-8')
        if '<style' not in original:
            return False

        # 替换所有 <style ...>...</style> 块
        def replace_style(match):
            return fix_style_block(match.group(0))

        updated = re.sub(
            r'<style\b[^>]*>.*?</style>',
            replace_style,
            original,
            flags=re.DOTALL | re.IGNORECASE
        )

        if updated != original:
            if not dry_run:
                file_path.write_text(updated, encoding='utf-8')
            return True
        return False

    except Exception as e:
        print(f"❌ 错误: {file_path} - {e}", file=sys.stderr)
        return False


def main():
    parser = argparse.ArgumentParser(description="批量迁移 Vue 深度选择器到 Vue 3 语法")
    parser.add_argument('--dry-run', action='store_true', help="仅预览改动，不修改文件")
    args = parser.parse_args()

    # 自动查找 src 目录（支持从项目根目录或脚本目录运行）
    project_root = Path.cwd()
    src_dir = project_root / 'src'
    if not src_dir.exists():
        print(f"❌ 未找到 '{src_dir}' 目录，请在项目根目录运行此脚本。", file=sys.stderr)
        sys.exit(1)

    vue_files = sorted(src_dir.rglob('*.vue'))
    if not vue_files:
        print("⚠️  未在 ./src 中找到任何 .vue 文件")
        return

    print(f"🔍 扫描到 {len(vue_files)} 个 .vue 文件")
    if args.dry_run:
        print("👀 [DRY RUN] 仅预览，不会修改任何文件\n")

    fixed_count = 0
    for file in vue_files:
        if process_vue_file(file, dry_run=args.dry_run):
            fixed_count += 1
            rel_path = file.relative_to(project_root)
            mark = "🔧 [需更新]" if args.dry_run else "✅ 已修复"
            print(f"{mark} {rel_path}")

    print("\n" + "=" * 50)
    if args.dry_run:
        print(f"💡 预览完成：{fixed_count} 个文件需要更新。")
        print("移除 --dry-run 参数以应用更改。")
    else:
        print(f"✨ 迁移完成：{fixed_count} / {len(vue_files)} 个文件已更新。")


if __name__ == '__main__':
    main()