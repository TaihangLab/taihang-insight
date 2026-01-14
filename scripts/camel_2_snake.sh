#!/bin/bash

# 驼峰命名到蛇形命名转换脚本
# 作者: Assistant
# 日期: $(date '+%Y-%m-%d %H:%M:%S')

echo "开始执行驼峰命名到蛇形命名转换..."

# 定义项目路径
PROJECT_PATH="/Users/ray/IdeaProjects/taihang/taihang-insight"

# 定义要搜索和替换的模式
# 用户管理模块
echo "正在替换用户管理模块相关字段..."
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\buserName\b/user_name/g' {} +
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\buserNickname\b/nick_name/g' {} +
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\bphoneNumber\b/phone/g' {} +
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\bdepartmentId\b/dept_id/g' {} +
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\buserCode\b/user_code/g' {} +

# 角色管理模块
echo "正在替换角色管理模块相关字段..."
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\broleName\b/role_name/g' {} +
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\broleCode\b/role_code/g' {} +
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\bsortOrder\b/sort_order/g' {} +

# 部门管理模块
echo "正在替换部门管理模块相关字段..."
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\bdeptName\b/dept_name/g' {} +
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\bdeptCode\b/dept_code/g' {} +
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\bparentId\b/parent_id/g' {} +

# 职位管理模块
echo "正在替换职位管理模块相关字段..."
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\bpositionName\b/position_name/g' {} +
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\bpositionCode\b/position_code/g' {} +
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\bcategoryCode\b/category_code/g' {} +
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\borderNum\b/order_num/g' {} +

# 租户管理模块
echo "正在替换租户管理模块相关字段..."
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\btenantName\b/tenant_name/g' {} +
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\btenantCode\b/tenant_code/g' {} +
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\bcompanyName\b/company_name/g' {} +
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\bcontactPerson\b/contact_person/g' {} +
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\bcontactPhone\b/contact_phone/g' {} +

# 权限管理模块
echo "正在替换权限管理模块相关字段..."
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\bpermissionName\b/permission_name/g' {} +
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\bpermissionCode\b/permission_code/g' {} +
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\bpermissionType\b/permission_type/g' {} +

# 通用参数
echo "正在替换通用参数..."
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\bcreateTime\b/create_time/g' {} +
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\bupdateTime\b/update_time/g' {} +
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\bcreateBy\b/create_by/g' {} +
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\bupdateBy\b/update_by/g' {} +

# 函数名转换（示例，可根据需要扩展）
echo "正在替换常见函数名..."
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\bhandleMoreAction\b/handle_more_action/g' {} +
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\bdownloadTemplate\b/download_template/g' {} +
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\bimportData\b/import_data/g' {} +
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\bexportData\b/export_data/g' {} +
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\bresetPassword\b/reset_password/g' {} +
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\bconfirmResetPassword\b/confirm_reset_password/g' {} +
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\bassignRole\b/assign_role/g' {} +
find "$PROJECT_PATH/src" -type f \( -name "*.js" -o -name "*.vue" \) -exec sed -i '' 's/\bhandleStatusChange\b/handle_status_change/g' {} +

echo "转换完成！"
echo "请使用 git 检查修改并确认结果。"