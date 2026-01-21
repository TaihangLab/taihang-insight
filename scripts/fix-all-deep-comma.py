#!/usr/bin/env python3
"""
批量修复所有 :deep(...), 模式
"""

import re
from pathlib import Path

# 修复所有 Vue 文件
src_dir = Path('src')
vue_files = list(src_dir.rglob('*.vue'))

fixed_count = 0
for file_path in vue_files:
    content = file_path.read_text()
    original = content

    # 修复所有 :deep(...), 模式（在逗号后加 )）
    content = re.sub(r':deep\(([^)]+),', r':deep(\1),', content)

    if content != original:
        file_path.write_text(content)
        fixed_count += 1
        print(f'Fixed: {file_path.relative_to(src_dir)}')

print(f'Done! Fixed {fixed_count} files')
