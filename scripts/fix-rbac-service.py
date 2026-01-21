#!/usr/bin/env python3
"""
Fix RBACService.js for Vite compatibility

This script handles the special case in RBACService.js where require()
is used inside a try-catch block. In Vite/ESM, we need to use dynamic imports.
"""

import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
RBAC_SERVICE_FILE = PROJECT_ROOT / "src" / "components" / "service" / "RBACService.js"


def fix_rbac_service(content: str) -> str:
    """
    Convert the require() pattern in RBACService.js to use dynamic imports.

    Original pattern:
    ```
    try {
      UserService = require('./rbac/userService').default;
      // ...
    } catch (error) {
      console.warn('...');
    }
    ```

    New pattern (Vite compatible):
    ```
    // Import real services (Vite/ESM compatible)
    import UserService from './rbac/userService/index.js';
    import RoleService from './rbac/roleService/index.js';
    // ... etc
    ```
    """

    # Services to import
    services = [
        ('UserService', './rbac/userService/index.js'),
        ('RoleService', './rbac/roleService/index.js'),
        ('DepartmentService', './rbac/departmentService/index.js'),
        ('PositionService', './rbac/positionService/index.js'),
        ('TenantService', './rbac/tenantService/index.js'),
        ('PermissionService', './rbac/permissionService/index.js'),
        ('AssociationService', './rbac/associationService/index.js'),
    ]

    # Build import statements
    import_lines = ["// Import real services (Vite/ESM compatible)"]
    for service_name, service_path in services:
        import_lines.append(f"import {service_name} from '{service_path}';")

    imports_text = "\n".join(import_lines) + "\n\n"

    # Remove the old try-catch with require
    # Pattern: from "// 尝试导入真实服务" to the end of try-catch
    pattern = r"// 尝试导入真实服务，如果失败则使用模拟服务.*?try \{.*?require\('[^']+'\)\.default;.*?\}.*?catch \(error\) \{.*?\}"

    replacement = """// 导入真实服务
const hasRealServices = true;  // Vite环境下，如果模块不存在会直接报错

"""

    content = re.sub(pattern, replacement, content, flags=re.DOTALL)

    # Insert imports at the top (after the MockRBACService import)
    mock_import_pattern = r"(import MockRBACService from '\./rbac/mockRBACService';\n)"

    def insert_imports(match):
        return match.group(1) + "\n" + imports_text

    content = re.sub(mock_import_pattern, insert_imports, content)

    return content


def main():
    print("Fixing RBACService.js for Vite compatibility...")

    if not RBAC_SERVICE_FILE.exists():
        print(f"  ✗ File not found: {RBAC_SERVICE_FILE}")
        return

    with open(RBAC_SERVICE_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    content = fix_rbac_service(content)

    if content != original:
        with open(RBAC_SERVICE_FILE, 'w', encoding='utf-8') as f:
            f.write(content)
        print("  ✓ Fixed RBACService.js")
        print()
        print("  Changed:")
        print("    - Converted require() to ES module imports")
        print("    - Removed try-catch pattern (Vite handles missing modules at build time)")
    else:
        print("  - No changes needed")


if __name__ == "__main__":
    main()
