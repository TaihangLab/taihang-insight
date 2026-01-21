#!/usr/bin/env python3
"""
Vue 3 Slot Scope Fix Script

This script fixes Vue 2 slot-scope syntax to Vue 3 v-slot syntax.

Vue 2: <template slot-scope="scope">
Vue 3: <template #default="scope">

Also handles scope property access in templates.
"""

import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
SRC_DIR = PROJECT_ROOT / "src"

CHANGES = {
    "files_modified": 0,
    "slot_scope_fixed": 0,
}


def fix_slot_scope(content: str) -> tuple[str, int]:
    """
    Fix slot-scope to v-slot syntax.

    Patterns:
    - <template slot-scope="scope"> → <template #default="scope">
    - <template slot-scope='scope'> → <template #default="scope">
    - <template slot-scope="scope" > → <template #default="scope">
    """
    count = 0
    original = content

    # Pattern 1: slot-scope="scope"
    pattern1 = r'<template\s+slot-scope\s*=\s*"([^"]+)"\s*>'
    matches1 = list(re.finditer(pattern1, content))

    for match in reversed(matches1):
        scope_var = match.group(1)
        count += 1
        replacement = f'<template #default="{scope_var}">'
        content = content[:match.start()] + replacement + content[match.end():]

    # Pattern 2: slot-scope='scope'
    pattern2 = r"<template\s+slot-scope\s*=\s*'([^']+)'\s*>"
    matches2 = list(re.finditer(pattern2, content))

    for match in reversed(matches2):
        scope_var = match.group(1)
        count += 1
        replacement = f"<template #default='{scope_var}'>"
        content = content[:match.start()] + replacement + content[match.end():]

    # Pattern 3: Handle multiline cases
    # <template
    #   slot-scope="scope">
    pattern3 = r'<template\s+\n\s*slot-scope\s*=\s*"([^"]+)"\s*\n\s*>'
    content = re.sub(
        pattern3,
        lambda m: f'<template #default="{m.group(1)}">',
        content
    )
    additional_count = len(re.findall(pattern3, original))
    count += additional_count

    return content, count


def fix_file(file_path: Path) -> bool:
    """Fix a single file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Fix slot-scope
        content, slot_count = fix_slot_scope(content)
        if slot_count > 0:
            CHANGES["slot_scope_fixed"] += slot_count

        # Only write if content changed
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            CHANGES["files_modified"] += 1
            print(f"  ✓ Fixed: {file_path.relative_to(PROJECT_ROOT)} ({slot_count} slot-scope fixes)")
            return True

        return False

    except Exception as e:
        print(f"  ✗ Error: {file_path.relative_to(PROJECT_ROOT)}: {e}")
        return False


def should_process_file(file_path: Path) -> bool:
    """Check if file should be processed."""
    return (
        file_path.suffix in ['.vue', '.js'] and
        'node_modules' not in str(file_path) and
        '.git' not in str(file_path) and
        'dist' not in str(file_path)
    )


def main():
    print("=" * 60)
    print("Vue 3 Slot Scope Fix Script")
    print("=" * 60)
    print()

    # Find all relevant files
    files_to_process = []
    for ext in ['.vue', '.js']:
        files_to_process.extend(SRC_DIR.rglob(f"*{ext}"))

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
    print(f"  slot-scope fixed: {CHANGES['slot_scope_fixed']}")
    print()


if __name__ == "__main__":
    main()
