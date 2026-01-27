#!/usr/bin/env python3
"""
检查项目中同时存在 .js 和 .ts 版本的文件

这个脚本会扫描项目目录，找出所有同时存在 .js 和 .ts 版本的文件，
这种情况会导致维护混乱，需要清理。
"""

import os
import re
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Tuple, Set

# ANSI 颜色代码
class Colors:
    RED = '\033[91m'
    YELLOW = '\033[93m'
    GREEN = '\033[92m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'


def print_header(text: str):
    """打印标题"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'=' * 60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text:^60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'=' * 60}{Colors.END}\n")


def print_error(text: str):
    """打印错误信息"""
    print(f"{Colors.RED}❌ {text}{Colors.END}")


def print_warning(text: str):
    """打印警告信息"""
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.END}")


def print_success(text: str):
    """打印成功信息"""
    print(f"{Colors.GREEN}✅ {text}{Colors.END}")


def print_info(text: str):
    """打印信息"""
    print(f"{Colors.CYAN}ℹ️  {text}{Colors.END}")


def find_js_ts_files(root_dir: str, extensions: Tuple[str, ...] = ('.js', '.ts', '.vue')) -> Dict[str, Dict[str, List[str]]]:
    """
    查找所有 .js, .ts, .vue 文件

    返回格式: {
        '目录路径': {
            '.js': ['file1.js', 'file2.js'],
            '.ts': ['file1.ts'],
            '.vue': ['component.vue']
        }
    }
    """
    result = defaultdict(lambda: defaultdict(list))

    for root, dirs, files in os.walk(root_dir):
        # 跳过 node_modules 和其他不需要检查的目录
        dirs[:] = [d for d in dirs if d not in {
            'node_modules',
            '.git',
            'dist',
            'build',
            '.vite',
            'coverage',
            '__pycache__',
            '.pytest_cache',
            'vendor'
        }]

        for file in files:
            if file.endswith(extensions):
                ext = os.path.splitext(file)[1]
                # 只考虑文件名（不含扩展名）
                basename = os.path.splitext(file)[0]
                result[root][ext].append(basename)

    return dict(result)


def check_duplicates(root_dir: str) -> List[Dict[str, any]]:
    """
    检查同时存在 .js 和 .ts 的文件

    返回重复文件的列表
    """
    files_by_dir = find_js_ts_files(root_dir)
    duplicates = []

    for dir_path, ext_files in files_by_dir.items():
        js_files = set(ext_files.get('.js', []))
        ts_files = set(ext_files.get('.ts', []))

        # 找出同时有 .js 和 .ts 的文件
        common = js_files & ts_files

        if common:
            for basename in sorted(common):
                js_path = os.path.join(dir_path, f"{basename}.js")
                ts_path = os.path.join(dir_path, f"{basename}.ts")

                # 检查文件大小，判断哪个可能是主要文件
                js_size = 0
                ts_size = 0

                if os.path.exists(js_path):
                    js_size = os.path.getsize(js_path)
                if os.path.exists(ts_path):
                    ts_size = os.path.getsize(ts_path)

                duplicates.append({
                    'dir': dir_path,
                    'basename': basename,
                    'js_path': js_path,
                    'ts_path': ts_path,
                    'js_size': js_size,
                    'ts_size': ts_size,
                    'recommendation': determine_recommendation(js_size, ts_size)
                })

    return duplicates


def determine_recommendation(js_size: int, ts_size: int) -> str:
    """
    根据文件大小判断应该保留哪个文件
    """
    if js_size == 0 and ts_size > 0:
        return "保留 .ts，删除 .js（.js 为空或不存在）"
    elif ts_size == 0 and js_size > 0:
        return "保留 .js，删除 .ts（.ts 为空或不存在）"
    elif ts_size > js_size * 1.5:
        return "保留 .ts（TypeScript 版本更完整，可能包含类型定义）"
    elif js_size > ts_size * 1.5:
        return "保留 .js（JavaScript 版本更完整）"
    else:
        return "手动检查内容后决定（文件大小相近，需要查看具体内容）"


def check_vue_script_imports(root_dir: str) -> List[Dict[str, any]]:
    """
    检查 .vue 文件中的 script 标签是否同时引用了 .js 和 .ts
    """
    issues = []

    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in {
            'node_modules', '.git', 'dist', 'build', '.vite'
        }]

        for file in files:
            if file.endswith('.vue'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()

                    # 检查是否有重复的导入（同时导入 .js 和 .ts 版本）
                    js_imports = re.findall(r'from ["\']([^"\']+\.js)["\']', content)
                    ts_imports = re.findall(r'from ["\']([^"\']+\.ts)["\']', content)

                    # 检查是否有相同基名的导入
                    js_basenames = {os.path.splitext(imp)[0] for imp in js_imports}
                    ts_basenames = {os.path.splitext(imp)[0] for imp in ts_imports}

                    common_imports = js_basenames & ts_basenames

                    if common_imports:
                        for imp in common_imports:
                            issues.append({
                                'file': file_path,
                                'import': imp,
                                'type': 'duplicate_import'
                            })
                except Exception as e:
                    pass

    return issues


def generate_cleanup_script(duplicates: List[Dict[str, any]], script_path: str):
    """
    生成清理脚本（.sh 格式）
    """
    with open(script_path, 'w', encoding='utf-8') as f:
        f.write("#!/bin/bash\n")
        f.write("# 自动生成的清理脚本\n")
        f.write("# ⚠️  执行前请仔细检查！建议先 git commit 当前状态\n\n")

        for dup in duplicates:
            f.write(f"# {dup['basename']}\n")
            f.write(f"# {dup['recommendation']}\n")

            # 根据推荐生成删除命令（注释掉，让用户手动确认）
            if "保留 .ts" in dup['recommendation']:
                f.write(f"# rm -v \"{dup['js_path']}\"\n")
            elif "保留 .js" in dup['recommendation']:
                f.write(f"# rm -v \"{dup['ts_path']}\"\n")
            else:
                f.write(f"# 需要手动检查: {dup['js_path']} vs {dup['ts_path']}\n")

            f.write("\n")

    os.chmod(script_path, 0o755)


def main():
    # 获取项目根目录
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    src_dir = os.path.join(project_root, 'src')

    print_header("JS/TS 重复文件检查器")

    print_info(f"项目根目录: {project_root}")
    print_info(f"扫描目录: {src_dir}")

    # 检查重复文件
    print("\n🔍 检查同时存在 .js 和 .ts 的文件...")
    duplicates = check_duplicates(src_dir)

    if duplicates:
        print_error(f"发现 {len(duplicates)} 组重复文件！\n")

        for i, dup in enumerate(duplicates, 1):
            print(f"{Colors.BOLD}{Colors.MAGENTA}[{i}] {dup['basename']}{Colors.END}")
            print(f"  📁 目录: {dup['dir']}")
            print(f"  📄 JS:  {dup['js_path']} ({dup['js_size']} bytes)")
            print(f"  📄 TS:  {dup['ts_path']} ({dup['ts_size']} bytes)")
            print(f"  💡 建议: {Colors.YELLOW}{dup['recommendation']}{Colors.END}")
            print()
    else:
        print_success("未发现重复的 .js/.ts 文件！")

    # 检查 Vue 组件中的导入
    print("\n🔍 检查 .vue 文件中的导入...")
    import_issues = check_vue_script_imports(src_dir)

    if import_issues:
        print_warning(f"发现 {len(import_issues)} 个可能的导入问题！\n")
        for issue in import_issues:
            print(f"  📄 {issue['file']}")
            print(f"     可能同时导入了 {issue['import']}.js 和 {issue['import']}.ts")
    else:
        print_success("未发现导入问题！")

    # 统计信息
    print_header("统计信息")

    all_files = find_js_ts_files(src_dir)
    total_js = sum(len(files.get('.js', [])) for files in all_files.values())
    total_ts = sum(len(files.get('.ts', [])) for files in all_files.values())
    total_vue = sum(len(files.get('.vue', [])) for files in all_files.values())

    print(f"  📊 .js 文件总数: {Colors.CYAN}{total_js}{Colors.END}")
    print(f"  📊 .ts 文件总数: {Colors.CYAN}{total_ts}{Colors.END}")
    print(f"  📊 .vue 文件总数: {Colors.CYAN}{total_vue}{Colors.END}")
    print(f"  📊 重复文件组数: {Colors.RED if duplicates else Colors.GREEN}{len(duplicates)}{Colors.END}")

    # 生成清理脚本
    if duplicates:
        cleanup_script = os.path.join(script_dir, 'cleanup-js-ts-duplicates.sh')
        print(f"\n📝 生成清理脚本: {Colors.YELLOW}{cleanup_script}{Colors.END}")
        generate_cleanup_script(duplicates, cleanup_script)
        print_warning("⚠️  清理脚本已生成，执行前请仔细检查！")

        # 显示清理建议摘要
        print_header("清理建议摘要")

        keep_ts = sum(1 for d in duplicates if "保留 .ts" in d['recommendation'])
        keep_js = sum(1 for d in duplicates if "保留 .js" in d['recommendation'])
        manual_check = sum(1 for d in duplicates if "手动检查" in d['recommendation'])

        print(f"  🔧 建议删除 .js 保留 .ts: {Colors.GREEN}{keep_ts}{Colors.END}")
        print(f"  🔧 建议删除 .ts 保留 .js: {Colors.YELLOW}{keep_js}{Colors.END}")
        print(f"  🔧 需要手动检查: {Colors.RED}{manual_check}{Colors.END}")

    # 返回退出码
    if duplicates or import_issues:
        print(f"\n{Colors.RED}{Colors.BOLD}⚠️  发现问题，请处理后重新运行！{Colors.END}")
        return 1
    else:
        print(f"\n{Colors.GREEN}{Colors.BOLD}✅ 检查通过，项目状态良好！{Colors.END}")
        return 0


if __name__ == '__main__':
    exit(main())
