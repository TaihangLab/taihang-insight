#!/usr/bin/env python3
"""
将 CommonJS require() 转换为 ESM import

处理模式:
1. require('./images/xxx.jpg') → 移除 require()，直接使用字符串
2. require('@/components/...') → 添加 import 语句
3. require('../../../../config/index.js') → 添加 import 语句
"""

import re
import sys
from pathlib import Path


def process_file(file_path):
    """处理单个文件"""
    try:
        content = file_path.read_text(encoding='utf-8')
        original = content

        # 收集所有需要转换的 require 模式
        imports_to_add = []
        import_counter = 0

        # 模式1: require('./images/xxx.jpg') - 图片资源，直接移除 require()
        # Vite 会自动处理静态资源导入
        def replace_image_require(match):
            return f"'{match.group(1)}'"

        content = re.sub(
            r"require\(['\"]((?:\.\.?/)*images/[^'\"]+)['\"]\)",
            replace_image_require,
            content
        )

        # 模式2: require('@/components/...') - 别名路径模块导入
        # pattern: const xxx = require('@/...').default
        def replace_alias_require(match):
            var_name = match.group(1)
            module_path = match.group(2)
            has_default = match.group(3)  # .default or empty

            # 生成唯一的变量名用于 import
            nonlocal import_counter
            import_counter += 1
            import_name = f"_imported_{import_counter}"

            if has_default:
                imports_to_add.append(f"import {import_name} from '{module_path}';")
                return f"const {var_name} = {import_name}"
            else:
                imports_to_add.append(f"import * as {import_name} from '{module_path}';")
                return f"const {var_name} = {import_name}"

        content = re.sub(
            r"const\s+(\w+)\s*=\s*require\(['\"](@/[^'\"]+)['\"]\)(\.default)?",
            replace_alias_require,
            content
        )

        # 模式3: require('../../../../config/index.js') - 相对路径模块导入
        def replace_relative_require(match):
            var_name = match.group(1)
            module_path = match.group(2)

            nonlocal import_counter
            import_counter += 1
            import_name = f"_imported_{import_counter}"

            imports_to_add.append(f"import {import_name} from '{module_path}';")
            return f"const {var_name} = {import_name}"

        content = re.sub(
            r"const\s+(\w+)\s*=\s*require\(['\"](\.\.?/\.\.?/\.\.?/\.\.?/[^'\"]+)['\"]\)",
            replace_relative_require,
            content
        )

        # 如果有需要添加的 import，在文件开头插入
        if imports_to_add:
            # 找到 <script> 标签或文件开头
            script_match = re.search(r'<script[^>]*>', content)
            if script_match:
                # 在 <script> 标签后插入
                insert_pos = script_match.end()
                imports_block = '\n' + '\n'.join(imports_to_add) + '\n'
                content = content[:insert_pos] + imports_block + content[insert_pos:]
            else:
                # 对于 .js 文件，直接在开头添加
                imports_block = '\n'.join(imports_to_add) + '\n\n'
                content = imports_block + content

        if content != original:
            file_path.write_text(content, encoding='utf-8')
            return 1

        return 0

    except Exception as e:
        print(f"❌ Error: {file_path}: {e}", file=sys.stderr)
        return 0


def main():
    project_root = Path.cwd()
    src_dir = project_root / 'src'

    if not src_dir.exists():
        print(f"❌ Error: {src_dir} does not exist", file=sys.stderr)
        sys.exit(1)

    # 查找所有 .vue 和 .js 文件（排除测试文件）
    vue_files = sorted(src_dir.rglob('*.vue'))
    js_files = sorted([f for f in src_dir.rglob('*.js') if 'test' not in str(f)])
    all_files = vue_files + js_files

    # 先搜索包含 require 的文件
    files_with_require = []
    for file_path in all_files:
        content = file_path.read_text(encoding='utf-8')
        if 'require(' in content:
            files_with_require.append(file_path)

    if not files_with_require:
        print("✅ 未找到使用 require() 的文件")
        return

    print(f"🔍 找到 {len(files_with_require)} 个使用 require() 的文件")
    print("🔧 转换为 ESM import...\n")

    fixed_count = 0
    for file_path in files_with_require:
        if process_file(file_path):
            fixed_count += 1
            rel_path = file_path.relative_to(project_root)
            print(f"  ✅ 已修复: {rel_path}")

    print("\n" + "=" * 50)
    print(f"✨ 完成！已修复 {fixed_count} / {len(files_with_require)} 个文件")


if __name__ == '__main__':
    main()
