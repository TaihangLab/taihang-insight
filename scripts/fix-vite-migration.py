#!/usr/bin/env python3
"""
Webpack to Vite Migration - Batch Fix Script

This script fixes common issues when migrating from Webpack to Vite:
1. process.env.NODE_ENV → import.meta.env.MODE
2. process.env.VUE_APP_* → import.meta.env.VITE_*
3. process.env.BASE_API → import.meta.env.VITE_BASE_API
4. Simple require() → import statements (basic cases)
5. Fix __dirname usage in ES modules
"""

import os
import re
import sys
from pathlib import Path

# Project root directory
PROJECT_ROOT = Path(__file__).parent.parent
SRC_DIR = PROJECT_ROOT / "src"

# Track changes
CHANGES = {
    "files_modified": 0,
    "process_env_fixed": 0,
    "require_fixed": 0,
    "errors": []
}


def fix_process_env(content: str) -> tuple[str, int]:
    """
    Fix process.env patterns for Vite compatibility.

    Replacements:
    - process.env.NODE_ENV → import.meta.env.MODE
    - process.env.VUE_APP_*. → import.meta.env.VITE_*.
    - process.env.BASE_API → import.meta.env.VITE_BASE_API
    """
    count = 0
    original = content

    # Fix process.env.NODE_ENV → import.meta.env.MODE
    pattern = r'process\.env\.NODE_ENV'
    if re.search(pattern, content):
        content = re.sub(pattern, "import.meta.env.MODE", content)
        count += len(re.findall(pattern, original))

    # Fix process.env.VUE_APP_* → import.meta.env.VITE_*
    pattern = r'process\.env\.VUE_APP_'
    if re.search(pattern, content):
        content = re.sub(pattern, "import.meta.env.VITE_", content)
        count += len(re.findall(pattern, original))

    # Fix process.env.BASE_API → import.meta.env.VITE_BASE_API
    pattern = r'process\.env\.BASE_API'
    if re.search(pattern, content):
        content = re.sub(pattern, "import.meta.env.VITE_BASE_API", content)
        count += len(re.findall(pattern, original))

    return content, count


def fix_simple_require(content: str, file_path: Path) -> tuple[str, int]:
    """
    Fix simple require() statements to ES module imports.

    Note: Only handles simple cases like:
    - const config = require('../../config/index.js');
    - const path = require('path');

    Complex dynamic requires need manual handling.
    """
    count = 0
    original = content

    # Pattern 1: const/let/var x = require('path');
    # Convert to: import x from 'path';
    pattern1 = r'(const|let|var)\s+(\w+)\s*=\s*require\([\'"]([^\'"]+)[\'"]\)\s*;?\s*\n'
    matches = list(re.finditer(pattern1, content))

    # Get all imports to add at the top
    imports_to_add = []
    for match in matches:
        var_type, var_name, require_path = match.groups()
        imports_to_add.append(f"import {var_name} from '{require_path}';")

    # Replace require statements with empty (will add imports at top)
    if imports_to_add:
        content = re.sub(pattern1, '', content)
        count = len(imports_to_add)

        # Add imports after the last existing import or at the top
        import_pattern = r"(import\s+.*?;?\s*\n)+"
        import_match = re.search(import_pattern, content)

        if import_match:
            # Insert after existing imports
            insert_pos = import_match.end()
            content = content[:insert_pos] + "\n".join(imports_to_add) + "\n" + content[insert_pos:]
        else:
            # Add at the very top
            content = "\n".join(imports_to_add) + "\n\n" + content

    # Pattern 2: const { a, b } = require('module');
    # Convert to: import { a, b } from 'module';
    pattern2 = r'(const|let|var)\s*\{([^}]+)\}\s*=\s*require\([\'"]([^\'"]+)[\'"]\)\s*;?\s*\n'
    matches2 = list(re.finditer(pattern2, content))

    destructuring_imports = []
    for match in matches2:
        var_type, props, require_path = match.groups()
        props_clean = props.strip()
        destructuring_imports.append(f"import {{ {props_clean} }} from '{require_path}';")

    if destructuring_imports:
        content = re.sub(pattern2, '', content)
        count += len(destructuring_imports)

        import_pattern = r"(import\s+.*?;?\s*\n)+"
        import_match = re.search(import_pattern, content)

        if import_match:
            insert_pos = import_match.end()
            content = content[:insert_pos] + "\n".join(destructuring_imports) + "\n" + content[insert_pos:]
        else:
            content = "\n".join(destructuring_imports) + "\n\n" + content

    # Special case: RBACService.js - needs manual handling due to try-catch
    # Add a comment to indicate manual review needed
    if "require(" in content and "RBACService" in str(file_path):
        # Don't auto-fix RBACService, it needs special handling
        return original, 0

    return content, count


def fix_file(file_path: Path) -> bool:
    """Fix a single file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        file_changes = 0

        # Fix process.env
        content, env_count = fix_process_env(content)
        if env_count > 0:
            file_changes += env_count
            CHANGES["process_env_fixed"] += env_count

        # Fix require statements (skip .vue files with inline script blocks)
        if file_path.suffix not in ['.vue']:
            content, require_count = fix_simple_require(content, file_path)
            if require_count > 0:
                file_changes += require_count
                CHANGES["require_fixed"] += require_count

        # Only write if content changed
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            CHANGES["files_modified"] += 1
            print(f"  ✓ Fixed: {file_path.relative_to(PROJECT_ROOT)} ({file_changes} changes)")
            return True

        return False

    except Exception as e:
        CHANGES["errors"].append((str(file_path), str(e)))
        print(f"  ✗ Error: {file_path.relative_to(PROJECT_ROOT)}: {e}")
        return False


def should_process_file(file_path: Path) -> bool:
    """Check if file should be processed."""
    extensions = ['.js', '.vue', '.ts']
    return (
        file_path.suffix in extensions and
        'node_modules' not in str(file_path) and
        '.git' not in str(file_path) and
        'dist' not in str(file_path)
    )


def main():
    """Main entry point."""
    print("=" * 60)
    print("Webpack to Vite Migration - Batch Fix Script")
    print("=" * 60)
    print()

    # Find all relevant files
    files_to_process = []
    for ext in ['.js', '.vue', '.ts']:
        files_to_process.extend(SRC_DIR.rglob(f"*{ext}"))

    # Also check scripts directory and config files
    files_to_process.extend(PROJECT_ROOT.rglob("*.js"))
    files_to_process.extend(PROJECT_ROOT.rglob("*.ts"))

    # Filter and deduplicate
    files_to_process = list(set(f for f in files_to_process if should_process_file(f)))

    print(f"Found {len(files_to_process)} files to check")
    print()

    # Process files
    for file_path in sorted(files_to_process):
        fix_file(file_path)

    # Print summary
    print()
    print("=" * 60)
    print("Summary:")
    print("=" * 60)
    print(f"  Files modified: {CHANGES['files_modified']}")
    print(f"  process.env fixes: {CHANGES['process_env_fixed']}")
    print(f"  require() fixes: {CHANGES['require_fixed']}")

    if CHANGES["errors"]:
        print(f"  Errors: {len(CHANGES['errors'])}")
        for file_path, error in CHANGES["errors"]:
            print(f"    - {file_path}: {error}")

    print()
    print("Note: Some files may need manual review, especially:")
    print("  - RBACService.js (has try-catch around require)")
    print("  - Files with dynamic require() calls")
    print("  - Files using __dirname (needs vite config)")
    print()


if __name__ == "__main__":
    main()
