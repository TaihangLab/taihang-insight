#!/usr/bin/env python3
"""
Fix unused uiHeader imports that cause initialization errors.

The error "Cannot access 'uiHeader' before initialization" occurs when
uiHeader is imported but not actually used in the template, causing
ES module temporal dead zone issues.
"""

import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
SRC_DIR = PROJECT_ROOT / "src"


def fix_file(file_path: Path) -> bool:
    """Fix unused uiHeader imports in a file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original = content

        # Pattern 1: Find files with uiHeader import
        uiheader_import_pattern = r"import\s+uiHeader\s+from\s+['\"].*UiHeader\.vue['\"]"
        has_import = re.search(uiheader_import_pattern, content)

        if not has_import:
            return False

        # Pattern 2: Check if <uiHeader> or <ui-header> is used in template
        # Look for the component usage in template
        template_match = re.search(r'<template[^>]*>(.*?)</template>', content, re.DOTALL)

        if template_match:
            template = template_match.group(1)
            # Check if uiHeader component is actually used
            uses_uiheader = (
                '<uiHeader>' in template or
                '<ui-header>' in template or
                '<ui-header ' in template or
                '<uiHeader ' in template
            )

            if not uses_uiheader:
                # Remove uiHeader from import
                content = re.sub(uiheader_import_pattern, '', content)

                # Remove uiHeader from components object
                # Pattern: components: { uiHeader, ... } or components: { ..., uiHeader }
                # or components: { uiHeader } etc.

                # Remove uiHeader from components object
                content = re.sub(
                    r'components:\s*\{([^}]*?)uiHeader\s*,?\s*',
                    lambda m: f"components: {{{m.group(1).rstrip(', ').rstrip()} " if m.group(1).strip() else "components: {",
                    content
                )
                content = re.sub(
                    r',\s*uiHeader\s*}',
                    '}',
                    content
                )
                content = re.sub(
                    r'\{\s*uiHeader\s*\}',
                    '{}',
                    content
                )
                content = re.sub(
                    r'components:\s*\{\s*\}',
                    '',
                    content
                )

                # Clean up empty script tags if needed
                content = re.sub(r'<script>\s*</script>', '', content)

                if content != original:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"  ✓ Fixed: {file_path.relative_to(PROJECT_ROOT)}")
                    return True

        return False

    except Exception as e:
        print(f"  ✗ Error: {file_path.relative_to(PROJECT_ROOT)}: {e}")
        return False


def main():
    print("Fixing unused uiHeader imports...")
    print()

    count = 0

    # Find all .vue files
    for vue_file in SRC_DIR.rglob("*.vue"):
        if fix_file(vue_file):
            count += 1

    if count == 0:
        print("  No files needed fixing")
    else:
        print(f"  Fixed {count} file(s)")


if __name__ == "__main__":
    main()
