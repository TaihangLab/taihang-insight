<template>
  <div class="p-4 bg-[#f5f7fa] h-full flex flex-col gap-4">
    <!-- 页面标题和操作栏 -->
    <el-page-header class="bg-white rounded-lg p-4 px-6" @back="$router.back()">
      <template #content>
        <el-space :size="12" alignment="center">
          <el-icon :size="28" color="#409eff"><VideoCamera /></el-icon>
          <div>
            <h2 class="m-0 text-20px font-600 text-[#303133]">本地视频管理</h2>
            <el-text size="small" type="info">上传本地视频并推流到RTSP服务器，实现虚拟摄像头功能</el-text>
          </div>
        </el-space>
      </template>
      <template #extra>
        <el-space>
          <el-button type="primary" :icon="Upload" @click="showUploadDialog">上传视频</el-button>
          <el-button :icon="Refresh" @click="loadVideos">刷新</el-button>
        </el-space>
      </template>
    </el-page-header>

    <!-- 统计卡片 -->
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic :value="totalVideos">
            <template #title>
              <el-space :size="8">
                <el-icon><Files /></el-icon>
                <span>视频总数</span>
              </el-space>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="success-gradient">
          <el-statistic :value="streamingVideos">
            <template #title>
              <el-space :size="8">
                <el-icon><VideoPlay /></el-icon>
                <span>推流中</span>
              </el-space>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic :value="totalVideos - streamingVideos">
            <template #title>
              <el-space :size="8">
                <el-icon><VideoPause /></el-icon>
                <span>未推流</span>
              </el-space>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索和筛选栏 -->
    <el-card shadow="never">
      <el-form :inline="true">
        <el-form-item label="视频名称">
          <el-input
            v-model="searchName"
            placeholder="搜索视频名称"
            clearable
            style="width: 240px"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="推流状态">
          <el-select
            v-model="filterStreaming"
            placeholder="全部"
            clearable
            style="width: 140px"
            @change="handleSearch"
          >
            <el-option label="推流中" :value="true" />
            <el-option label="未推流" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="RefreshLeft" @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 视频列表 -->
    <el-card shadow="never" class="flex-1">
      <el-table
        v-loading="loading"
        :data="videoList"
        stripe
        height="100%"
        :default-sort="{ prop: 'created_at', order: 'descending' }"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="视频名称" min-width="180">
          <template #default="{ row }">
            <el-space :size="8">
              <el-icon color="#409eff"><VideoCamera /></el-icon>
              <el-text>{{ row.name }}</el-text>
            </el-space>
          </template>
        </el-table-column>
        <el-table-column label="视频信息" min-width="200">
          <template #default="{ row }">
            <el-space wrap>
              <el-tag size="small" type="info">{{ row.width }}x{{ row.height }}</el-tag>
              <el-tag size="small" type="info">{{ row.fps?.toFixed(1) }} fps</el-tag>
              <el-tag size="small" type="info">{{ formatDuration(row.duration) }}</el-tag>
            </el-space>
          </template>
        </el-table-column>
        <el-table-column label="文件大小" width="110" align="center">
          <template #default="{ row }">
            {{ formatFileSize(row.file_size) }}
          </template>
        </el-table-column>
        <el-table-column label="推流状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.is_streaming" type="success" effect="dark">
              <el-icon class="mr-1"><VideoPlay /></el-icon>
              推流中
            </el-tag>
            <el-tag v-else type="info" effect="plain">
              <el-icon class="mr-1"><VideoPause /></el-icon>
              未推流
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="RTSP地址" min-width="250">
          <template #default="{ row }">
            <div v-if="row.is_streaming && (row as any).rtsp_url">
              <el-input :value="(row as any).rtsp_url" size="small" readonly>
                <template #append>
                  <el-button :icon="DocumentCopy" @click="copyToClipboard((row as any).rtsp_url)" />
                </template>
              </el-input>
            </div>
            <el-text v-else type="info">-</el-text>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <el-space wrap>
              <el-button
                v-if="!row.is_streaming"
                type="success"
                size="small"
                :icon="VideoPlay"
                :loading="streamingOperations.has(row.id)"
                :disabled="streamingOperations.has(row.id)"
                @click="startStream(row)"
              >
                {{ streamingOperations.has(row.id) ? '启动中...' : '开始推流' }}
              </el-button>
              <el-button
                v-else
                type="warning"
                size="small"
                :icon="VideoPause"
                @click="stopStream(row)"
              >
                停止推流
              </el-button>
              <el-button size="small" :icon="Edit" @click="showEditDialog(row)">编辑</el-button>
              <el-button
                type="danger"
                size="small"
                :icon="Delete"
                :disabled="row.is_streaming"
                @click="deleteVideo(row)"
              >
                删除
              </el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 上传视频对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传视频"
      width="580px"
      :close-on-click-modal="false"
      @close="resetUploadForm"
    >
      <el-form ref="uploadFormRef" :model="uploadForm" :rules="uploadRules" label-width="120px">
        <el-form-item label="视频文件" prop="file">
          <el-upload
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :file-list="fileList"
            :limit="1"
            accept="video/*"
          >
            <el-icon :size="48" color="#409eff" class="mb-4"><UploadFilled /></el-icon>
            <div class="text-14px">
              将文件拖到此处，或<el-text type="primary">点击上传</el-text>
            </div>
            <template #tip>
              <div class="mt-2 text-12px text-[#909399]">
                支持 MP4、AVI、MOV 等视频格式，建议使用 H.264 编码的 MP4 格式
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="视频名称" prop="name">
          <el-input v-model="uploadForm.name" placeholder="请输入视频名称" />
        </el-form-item>
        <el-form-item label="视频描述">
          <el-input
            v-model="uploadForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入视频描述（可选）"
          />
        </el-form-item>
        <el-form-item label="默认推流帧率">
          <el-space>
            <el-input-number
              v-model="uploadForm.stream_fps"
              :min="1"
              :max="60"
              :step="1"
              controls-position="right"
              placeholder="留空"
              style="width: 150px"
            />
            <el-text size="small" type="info">
              fps（设置后，推流时会默认使用此帧率，留空则使用视频原始帧率，推荐 25-30）
            </el-text>
          </el-space>
        </el-form-item>
        <!-- 上传进度条 -->
        <el-form-item v-if="uploading">
          <div class="w-full">
            <el-progress
              :percentage="uploadProgress"
              :status="uploadProgress === 100 ? 'success' : undefined"
            />
            <el-text size="small" type="info">正在上传视频文件，请稍候...</el-text>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="uploading" @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploading" :disabled="uploading" @click="submitUpload">
          {{ uploading ? `上传中... ${uploadProgress}%` : '开始上传' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 编辑视频对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑视频" width="580px" :close-on-click-modal="false">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="120px">
        <el-form-item label="视频名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入视频名称" />
        </el-form-item>
        <el-form-item label="视频描述">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入视频描述"
          />
        </el-form-item>
        <el-form-item label="推流帧率">
          <el-space>
            <el-input-number
              v-model="editForm.stream_fps"
              :min="1"
              :max="60"
              :step="1"
              :disabled="currentVideo && currentVideo.is_streaming"
              controls-position="right"
              placeholder="留空"
              style="width: 150px"
            />
            <el-text size="small" type="info">
              fps（留空则使用原始帧率，推流中时无法修改）
            </el-text>
          </el-space>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 推流配置对话框 -->
    <el-dialog v-model="streamDialogVisible" title="推流配置" width="580px" :close-on-click-modal="false">
      <el-form ref="streamFormRef" :model="streamForm" label-width="120px">
        <el-form-item label="推流ID">
          <el-input v-model="streamForm.stream_id" placeholder="留空自动生成，如：warehouse_cam_1" />
          <el-text size="small" type="info" class="mt-1">
            推流ID用于构建RTSP地址（如：rtsp://.../推流ID），留空则自动生成
          </el-text>
        </el-form-item>
        <el-form-item label="推流帧率">
          <el-space>
            <el-input-number
              v-model="streamForm.stream_fps"
              :min="1"
              :max="60"
              :step="1"
              controls-position="right"
              placeholder="留空"
              style="width: 150px"
            />
            <el-text size="small" type="info">
              fps（留空则使用视频配置的帧率或原始帧率）
            </el-text>
          </el-space>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="streamDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmStartStream">开始推流</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  VideoCamera,
  Upload,
  Refresh,
  Files,
  VideoPlay,
  VideoPause,
  Search,
  RefreshLeft,
  DocumentCopy,
  Edit,
  Delete,
  UploadFilled
} from '@element-plus/icons-vue'
import { useLocalVideo } from '@/composables/useLocalVideo'

// 使用 composable
const {
  loading,
  videoList,
  totalVideos,
  streamingVideos,
  searchName,
  filterStreaming,
  uploadDialogVisible,
  uploading,
  uploadProgress,
  uploadFormRef,
  uploadForm,
  fileList,
  uploadRules,
  editDialogVisible,
  editFormRef,
  currentVideo,
  editForm,
  editRules,
  streamDialogVisible,
  streamForm,
  streamFormRef,
  streamingOperations,
  loadVideos,
  handleSearch,
  showUploadDialog,
  handleFileChange,
  submitUpload,
  resetUploadForm,
  showEditDialog,
  submitEdit,
  startStream,
  confirmStartStream,
  stopStream,
  deleteVideo,
  copyToClipboard,
  formatFileSize,
  formatDuration,
  formatDateTime,
} = useLocalVideo()

// 筛选表单（用于重置）
const filterForm = ref({
  name: '',
  is_streaming: null as boolean | null,
})

/**
 * 重置筛选条件
 */
const resetFilter = () => {
  searchName.value = ''
  filterStreaming.value = null
  handleSearch()
}
</script>

<style scoped>
/* 推流中卡片渐变背景（Element Plus 不支持渐变） */
.success-gradient {
  background: linear-gradient(135deg, var(--el-color-success) 0%, #85ce61 100%);
  color: white;
}

.success-gradient :deep(.el-statistic__head) {
  color: rgba(255, 255, 255, 0.9);
}

.success-gradient :deep(.el-statistic__number) {
  color: white;
}
</style>
