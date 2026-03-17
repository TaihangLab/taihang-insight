-- ============================================
-- 修复本地视频 API 权限 URL
-- ============================================
-- 问题描述：
--   加载视频列表失败：Request failed with status code 401
--   原因：后端路由使用 /videos/local/*，但权限表使用 /api/v1/local-videos/*
--
-- 解决方案：
--   1. 更新数据库权限表中的 path 字段（执行本 SQL）
--   2. 前端代码已修改：/api/v1/local-videos -> /videos/local
--
-- 后端路由配置：
--   文件：smart_engine/app/api/__init__.py
--   路由：api_router.include_router(local_videos.router, prefix="/videos/local", tags=["videos.local"])
--
-- 前端修改：
--   文件：taihang-insight/src/components/visionAI/deviceManagement/localVideo.vue
--   修改：将所有 /api/v1/local-videos 改为 /videos/local
-- ============================================

-- 备份原始数据（执行前建议先备份）
-- CREATE TABLE sys_permission_backup_20260317 AS SELECT * FROM sys_permission;

-- ============================================
-- 更新 API 权限 path 字段
-- ============================================

-- 1. 本地视频上传 (POST /videos/local/upload)
UPDATE sys_permission 
SET path = '/videos/local/upload',
    permission_code = 'local-video:upload',
    update_by = 'system',
    update_time = NOW()
WHERE id = 243;

-- 2. 本地视频列表 (GET /videos/local/list)
UPDATE sys_permission 
SET path = '/videos/local/list',
    permission_code = 'local-video:list:view',
    update_by = 'system',
    update_time = NOW()
WHERE id = 244;

-- 3. 本地视频详情 (GET /videos/local/{video_id})
UPDATE sys_permission 
SET path = '/videos/local/{video_id}',
    permission_code = 'local-video:detail:view',
    update_by = 'system',
    update_time = NOW()
WHERE id = 245;

-- 4. 本地视频修改 (PUT /videos/local/{video_id})
UPDATE sys_permission 
SET path = '/videos/local/{video_id}',
    permission_code = 'local-video:update:edit',
    update_by = 'system',
    update_time = NOW()
WHERE id = 246;

-- 5. 本地视频删除 (DELETE /videos/local/{video_id})
UPDATE sys_permission 
SET path = '/videos/local/{video_id}',
    permission_code = 'local-video:delete:remove',
    update_by = 'system',
    update_time = NOW()
WHERE id = 247;

-- 6. 本地视频启动推流 (POST /videos/local/{video_id}/start-stream)
UPDATE sys_permission 
SET path = '/videos/local/{video_id}/start-stream',
    permission_code = 'local-video:start',
    update_by = 'system',
    update_time = NOW()
WHERE id = 248;

-- 7. 本地视频停止推流 (POST /videos/local/{video_id}/stop-stream)
UPDATE sys_permission 
SET path = '/videos/local/{video_id}/stop-stream',
    permission_code = 'local-video:stop',
    update_by = 'system',
    update_time = NOW()
WHERE id = 249;

-- 8. 本地视频推流状态 (GET /videos/local/{video_id}/stream-status)
UPDATE sys_permission 
SET path = '/videos/local/{video_id}/stream-status',
    permission_code = 'local-video:status:view',
    update_by = 'system',
    update_time = NOW()
WHERE id = 250;

-- 9. 本地视频流列表 (GET /videos/local/streams/list)
UPDATE sys_permission 
SET path = '/videos/local/streams/list',
    permission_code = 'local-video:streams:list',
    update_by = 'system',
    update_time = NOW()
WHERE id = 251;

-- ============================================
-- 验证更新结果
-- ============================================
SELECT 
    id,
    permission_name,
    permission_code,
    path,
    method,
    parent_id,
    update_time
FROM sys_permission
WHERE id BETWEEN 243 AND 251
ORDER BY id;

-- ============================================
-- 使用方法：
-- 1. 连接数据库
-- 2. 执行：source /path/to/fix_local_videos_permissions.sql
-- 3. 检查验证查询结果
-- 4. 重启后端服务（如果需要）
-- 5. 测试前端功能
-- ============================================
