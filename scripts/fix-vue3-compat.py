#!/usr/bin/env python3
"""
Vue 3 Compatibility Fix Script

This script fixes common Vue 2 → Vue 3 migration issues:
1. this.$set(obj, key, value) → obj.key = value
2. >>> and /deep/ → :deep()
3. Outdated gradient syntax (linear-gradient(left, ...) → linear-gradient(to right, ...))
"""

import os
import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
SRC_DIR = PROJECT_ROOT / "src"

CHANGES = {
    "files_modified": 0,
    "this_$set_fixed": 0,
    "deep_selector_fixed": 0,
    "gradient_syntax_fixed": 0,
}


def fix_this_set(content: str) -> tuple[str, int]:
    """
    Fix this.$set() calls for Vue 3 compatibility.

    Patterns to fix:
    - this.$set(obj, 'key', value) → obj.key = value
    - this.$set(this.obj, 'key', value) → this.obj.key = value
    - vm.$set(obj, 'key', value) → obj.key = value
    """
    count = 0
    original = content

    # Pattern 1: this.$set(object, 'key', value)
    # We need to be careful with the key - it could be a string or variable
    pattern1 = r'\bthis\.\$set\s*\(\s*([^,]+)\s*,\s*[\'"]([^\'"]+)[\'"]\s*,\s*([^)]+)\s*\)'

    def replace_set_simple(match):
        nonlocal count
        obj = match.group(1).strip()
        key = match.group(2)
        value = match.group(3).strip()
        count += 1
        return f"{obj}.{key} = {value}"

    content = re.sub(pattern1, replace_set_simple, content)

    # Pattern 2: vm.$set(object, 'key', value)
    pattern2 = r'\bvm\.\$set\s*\(\s*([^,]+)\s*,\s*[\'"]([^\'"]+)[\'"]\s*,\s*([^)]+)\s*\)'

    def replace_vm_set(match):
        nonlocal count
        obj = match.group(1).strip()
        key = match.group(2)
        value = match.group(3).strip()
        count += 1
        return f"{obj}.{key} = {value}"

    content = re.sub(pattern2, replace_vm_set, content)

    return content, count


def fix_deep_selectors(content: str) -> tuple[str, int]:
    """
    Fix >>> and /deep/ selectors to :deep().

    Patterns:
    - >>> selector → :deep(selector)
    - /deep/ selector → :deep(selector)
    - >>> .class → :deep(.class)
    - /deep/ .class → :deep(.class)
    """
    count = 0
    original = content

    # Pattern 1: >>> followed by whitespace and selector
    pattern1 = r'>>>\s*([^\s{,]+)'
    matches1 = list(re.finditer(pattern1, content))

    for match in reversed(matches1):
        selector = match.group(1).strip()
        count += 1
        # Replace with :deep(selector)
        replacement = f':deep({selector})'
        content = content[:match.start()] + replacement + content[match.end():]

    # Pattern 2: /deep/ followed by whitespace and selector
    pattern2 = r'/deep/\s*([^\s{,]+)'
    matches2 = list(re.finditer(pattern2, content))

    for match in reversed(matches2):
        selector = match.group(1).strip()
        count += 1
        replacement = f':deep({selector})'
        content = content[:match.start()] + replacement + content[match.end():]

    # Pattern 3: Handle multiline cases like:
    # >>>
    #   .class
    # We'll fix these to:
    # :deep(.class)
    lines = content.split('\n')
    new_lines = []
    i = 0

    while i < len(lines):
        line = lines[i]

        # Check if line ends with >>> or contains /deep/
        if re.search(r'>>>|/deep/', line):
            # Get the next non-empty line as the selector
            j = i + 1
            while j < len(lines) and lines[j].strip() == '':
                j += 1

            if j < len(lines):
                # Extract selector from the next line
                next_line = lines[j].strip()
                # Find the first selector (class, id, element, etc)
                selector_match = re.search(r'^([.#]?[\w-]+)', next_line)

                if selector_match:
                    selector = selector_match.group(1)
                    count += 1

                    # Replace current line's >>> or /deep/ with :deep(selector)
                    current_fixed = re.sub(r'>>>|/deep/', f':deep({selector})', line)

                    # Next line - remove the selector that's now in :deep()
                    # But keep the rest of the content (like { ... })
                    next_line_rest = re.sub(r'^[.#]?[\w-]+\s*', '', next_line)

                    if next_line_rest.strip():
                        new_lines.append(current_fixed)
                        new_lines.append(next_line_rest)
                    else:
                        new_lines.append(current_fixed)
                    i = j + 1
                    continue

        new_lines.append(line)
        i += 1

    content = '\n'.join(new_lines)

    return content, count


def fix_gradient_syntax(content: str) -> tuple[str, int]:
    """
    Fix outdated gradient syntax.

    Old: linear-gradient(left, color1, color2)
    New: linear-gradient(to right, color1, color2)

    Direction mapping:
    - left → to right
    - right → to left
    - top → to bottom
    - bottom → to top
    """
    count = 0
    original = content

    # Pattern: linear-gradient(direction, ...)
    # Only fix when direction is one of: left, right, top, bottom
    pattern = r'linear-gradient\s*\(\s*(left|right|top|bottom)\s*,'

    def fix_gradient(match):
        nonlocal count
        direction = match.group(1)
        count += 1
        direction_map = {
            'left': 'to right',
            'right': 'to left',
            'top': 'to bottom',
            'bottom': 'to top',
        }
        return f'linear-gradient({direction_map[direction]},'

    content = re.sub(pattern, fix_gradient, content)

    # Also fix with browser prefixes
    prefixes = ['-webkit-', '-moz-', '-o-', '-ms-']
    for prefix in prefixes:
        pattern = r'%slinear-gradient\s*\(\s*(left|right|top|bottom)\s*,' % prefix

        def fix_prefixed_gradient(match):
            nonlocal count
            direction = match.group(1)
            count += 1
            direction_map = {
                'left': 'to right',
                'right': 'to left',
                'top': 'to bottom',
                'bottom': 'to top',
            }
            return f'{prefix}linear-gradient({direction_map[direction]},'

        content = re.sub(pattern, fix_prefixed_gradient, content)

    return content, count


def fix_file(file_path: Path) -> bool:
    """Fix a single file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        file_changes = 0

        # Fix this.$set
        if file_path.suffix in ['.vue', '.js']:
            content, set_count = fix_this_set(content)
            if set_count > 0:
                file_changes += set_count
                CHANGES["this_$set_fixed"] += set_count

        # Fix deep selectors (in Vue files and CSS)
        if file_path.suffix in ['.vue', '.css', '.scss']:
            content, deep_count = fix_deep_selectors(content)
            if deep_count > 0:
                file_changes += deep_count
                CHANGES["deep_selector_fixed"] += deep_count

            # Fix gradient syntax
            content, gradient_count = fix_gradient_syntax(content)
            if gradient_count > 0:
                file_changes += gradient_count
                CHANGES["gradient_syntax_fixed"] += gradient_count

        # Only write if content changed
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            CHANGES["files_modified"] += 1
            print(f"  ✓ Fixed: {file_path.relative_to(PROJECT_ROOT)} ({file_changes} changes)")
            return True

        return False

    except Exception as e:
        print(f"  ✗ Error: {file_path.relative_to(PROJECT_ROOT)}: {e}")
        return False


def should_process_file(file_path: Path) -> bool:
    """Check if file should be processed."""
    extensions = ['.vue', '.js', '.css', '.scss']
    return (
        file_path.suffix in extensions and
        'node_modules' not in str(file_path) and
        '.git' not in str(file_path) and
        'dist' not in str(file_path)
    )


def main():
    print("=" * 60)
    print("Vue 3 Compatibility Fix Script")
    print("=" * 60)
    print()

    # Find all relevant files
    files_to_process = []
    for ext in ['.vue', '.js', '.css', '.scss']:
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
    print(f"  this.$set fixed: {CHANGES['this_$set_fixed']}")
    print(f"  deep selectors fixed: {CHANGES['deep_selector_fixed']}")
    print(f"  gradient syntax fixed: {CHANGES['gradient_syntax_fixed']}")
    print()


if __name__ == "__main__":
    main()
