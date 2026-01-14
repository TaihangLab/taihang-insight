#!/usr/bin/env python3
"""
驼峰命名到蛇形命名转换脚本
"""

import os
import re
from pathlib import Path


def camel_to_snake(name):
    """
    将驼峰命名转换为蛇形命名
    例如: userName -> user_name, tenantCode -> tenant_code
    """
    # 在小写字母和大写字母之间插入下划线
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    # 在小写字母后面的大写字母前插入下划线
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()


def process_file(file_path, patterns):
    """
    处理单个文件，执行模式替换
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # 应用所有替换模式
    for old_pattern, new_pattern in patterns:
        # 使用单词边界确保只替换完整单词
        content = re.sub(r'\b' + re.escape(old_pattern) + r'\b', new_pattern, content)

    # 如果内容发生了变化，则写回文件
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"已更新: {file_path}")
        return True
    return False


def main():
    # 定义项目路径
    project_path = Path("/Users/ray/IdeaProjects/taihang/taihang-insight/src")
    
    # 定义要替换的驼峰命名到蛇形命名的映射
    patterns = [
        # 用户管理模块
        ('userName', 'user_name'),
        ('userNickname', 'nick_name'),
        ('phoneNumber', 'phone'),
        ('departmentId', 'dept_id'),
        ('userCode', 'user_code'),
        
        # 角色管理模块
        ('roleName', 'role_name'),
        ('roleCode', 'role_code'),
        ('sortOrder', 'sort_order'),
        
        # 部门管理模块
        ('deptName', 'dept_name'),
        ('deptCode', 'dept_code'),
        ('parentId', 'parent_id'),
        
        # 职位管理模块
        ('positionName', 'position_name'),
        ('positionCode', 'position_code'),
        ('categoryCode', 'category_code'),
        ('orderNum', 'order_num'),
        
        # 租户管理模块
        ('tenantName', 'tenant_name'),
        ('tenantCode', 'tenant_code'),
        ('companyName', 'company_name'),
        ('contactPerson', 'contact_person'),
        ('contactPhone', 'contact_phone'),
        
        # 权限管理模块
        ('permissionName', 'permission_name'),
        ('permissionCode', 'permission_code'),
        ('permissionType', 'permission_type'),
        
        # 通用参数
        ('createTime', 'create_time'),
        ('updateTime', 'update_time'),
        ('createBy', 'create_by'),
        ('updateBy', 'update_by'),
        
        # 函数名转换
        ('handleMoreAction', 'handle_more_action'),
        ('downloadTemplate', 'download_template'),
        ('importData', 'import_data'),
        ('exportData', 'export_data'),
        ('resetPassword', 'reset_password'),
        ('confirmResetPassword', 'confirm_reset_password'),
        ('assignRole', 'assign_role'),
        ('handleStatusChange', 'handle_status_change'),
    ]

    # 查找所有 JS 和 Vue 文件
    js_files = project_path.rglob("*.js")
    vue_files = project_path.rglob("*.vue")
    
    all_files = list(js_files) + list(vue_files)
    
    print(f"找到 {len(all_files)} 个文件待处理...")
    
    updated_count = 0
    for file_path in all_files:
        try:
            if process_file(file_path, patterns):
                updated_count += 1
        except Exception as e:
            print(f"处理文件时出错 {file_path}: {str(e)}")
    
    print(f"\n转换完成！共更新了 {updated_count} 个文件。")
    print("请使用 git 检查修改并确认结果。")


if __name__ == "__main__":
    main()