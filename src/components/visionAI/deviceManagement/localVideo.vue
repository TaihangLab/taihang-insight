<template>
  <div class="local-video-container">
    <!-- 页面标题和操作栏 -->
    <div class="header-container">
      <div class="header-left">
        <h2 class="page-title">
          <i class="el-icon-video-camera-solid"></i>
          本地视频管理
        </h2>
        <span class="page-subtitle">上传本地视频并推流到RTSP服务器，实现虚拟摄像头功能</span>
      </div>
      <div class="header-right">
        <el-button type="primary" icon="el-icon-upload" @click="showUploadDialog">
          上传视频
        </el-button>
        <el-button icon="el-icon-refresh" @click="loadVideos">刷新</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <i class="el-icon-files stat-icon"></i>
          <div class="stat-info">
            <div class="stat-value">{{ totalVideos }}</div>
            <div class="stat-label">视频总数</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card streaming" shadow="hover">
        <div class="stat-content">
          <i class="el-icon-video-play stat-icon"></i>
          <div class="stat-info">
            <div class="stat-value">{{ streamingVideos }}</div>
            <div class="stat-label">推流中</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <i class="el-icon-video-pause stat-icon"></i>
          <div class="stat-info">
            <div class="stat-value">{{ totalVideos - streamingVideos }}</div>
            <div class="stat-label">未推流</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 搜索和筛选栏 -->
    <div class="filter-container">
      <el-input
        v-model="searchName"
        placeholder="搜索视频名称"
        prefix-icon="el-icon-search"
        clearable
        style="width: 300px; margin-right: 10px;"
        @input="handleSearch"
      />
      <el-select
        v-model="filterStreaming"
        placeholder="推流状态"
        clearable
        style="width: 150px;"
        @change="handleSearch"
      >
        <el-option label="全部" :value="null"></el-option>
        <el-option label="推流中" :value="true"></el-option>
        <el-option label="未推流" :value="false"></el-option>
      </el-select>
    </div>

    <!-- 视频列表 -->
    <div class="video-list">
      <el-table
        :data="videoList"
        v-loading="loading"
        style="width: 100%"
        :default-sort="{prop: 'created_at', order: 'descending'}"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="视频名称" min-width="180">
          <template slot-scope="scope">
            <div class="video-name-cell">
              <i class="el-icon-video-camera-solid"></i>
              <span>{{ scope.row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="视频信息" min-width="200">
          <template slot-scope="scope">
            <div class="video-info-cell">
              <el-tag size="mini" type="info">{{ scope.row.width }}x{{ scope.row.height }}</el-tag>
              <el-tag size="mini" type="info">{{ scope.row.fps.toFixed(1) }} fps</el-tag>
              <el-tag size="mini" type="info">{{ formatDuration(scope.row.duration) }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="文件大小" width="110" align="center">
          <template slot-scope="scope">
            {{ formatFileSize(scope.row.file_size) }}
          </template>
        </el-table-column>
        <el-table-column label="推流状态" width="120" align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.is_streaming" type="success" effect="dark">
              <i class="el-icon-video-play"></i> 推流中
            </el-tag>
            <el-tag v-else type="info" effect="plain">
              <i class="el-icon-video-pause"></i> 未推流
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="RTSP地址" min-width="250">
          <template slot-scope="scope">
            <div v-if="scope.row.is_streaming && scope.row.rtsp_url" class="rtsp-url-cell">
              <el-input
                :value="scope.row.rtsp_url"
                size="mini"
                readonly
              >
                <el-button
                  slot="append"
                  icon="el-icon-document-copy"
                  @click="copyToClipboard(scope.row.rtsp_url)"
                >
                </el-button>
              </el-input>
            </div>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160" align="center">
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template slot-scope="scope">
            <div class="action-buttons">
              <el-button
                v-if="!scope.row.is_streaming"
                type="success"
                size="mini"
                icon="el-icon-video-play"
                :loading="streamingOperations.has(scope.row.id)"
                :disabled="streamingOperations.has(scope.row.id)"
                @click="startStream(scope.row)"
              >
                {{ streamingOperations.has(scope.row.id) ? '启动中...' : '开始推流' }}
              </el-button>
              <el-button
                v-else
                type="warning"
                size="mini"
                icon="el-icon-video-pause"
                @click="stopStream(scope.row)"
              >
                停止推流
              </el-button>
              <el-button
                size="mini"
                icon="el-icon-edit"
                @click="showEditDialog(scope.row)"
              >
                编辑
              </el-button>
              <el-button
                type="danger"
                size="mini"
                icon="el-icon-delete"
                @click="deleteVideo(scope.row)"
                :disabled="scope.row.is_streaming"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 上传视频对话框 -->
    <el-dialog
      title="上传视频"
      :visible.sync="uploadDialogVisible"
      width="600px"
      @close="resetUploadForm"
    >
      <el-form
        :model="uploadForm"
        :rules="uploadRules"
        ref="uploadForm"
        label-width="120px"
      >
         <el-form-item label="视频文件" prop="file">
           <el-upload
             class="upload-demo"
             drag
             action="#"
             :auto-upload="false"
             :on-change="handleFileChange"
             :file-list="fileList"
             :limit="1"
             accept="video/*"
           >
             <i class="el-icon-upload"></i>
             <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
             <div class="el-upload__tip" slot="tip">
               支持MP4、AVI、MOV等视频格式，建议使用H.264编码的MP4格式
             </div>
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
         <el-form-item label="默认推流帧率（可选）">
           <el-input-number
             v-model="uploadForm.stream_fps"
             :min="1"
             :max="60"
             :step="1"
             :controls="true"
             placeholder="留空"
             style="width: 150px;"
           />
           <span class="form-tip">fps（设置后，推流时会默认使用此帧率，留空则使用视频原始帧率，推荐25-30）</span>
         </el-form-item>
         
         <!-- 上传进度条 -->
         <el-form-item v-if="uploading">
           <el-progress :percentage="uploadProgress" :status="uploadProgress === 100 ? 'success' : null"></el-progress>
           <span style="font-size: 12px; color: #909399;">正在上传视频文件，请稍候...</span>
         </el-form-item>
       </el-form>
      <div slot="footer">
        <el-button @click="uploadDialogVisible = false" :disabled="uploading">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="submitUpload" :disabled="uploading">
          {{ uploading ? `上传中... ${uploadProgress}%` : '开始上传' }}
        </el-button>
      </div>
    </el-dialog>

    <!-- 编辑视频对话框 -->
    <el-dialog
      title="编辑视频"
      :visible.sync="editDialogVisible"
      width="600px"
    >
      <el-form
        :model="editForm"
        :rules="editRules"
        ref="editForm"
        label-width="120px"
      >
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
         <el-form-item label="推流帧率（可选）">
           <el-input-number
             v-model="editForm.stream_fps"
             :min="1"
             :max="60"
             :step="1"
             :disabled="currentVideo && currentVideo.is_streaming"
             :controls="true"
             placeholder="留空"
             style="width: 150px;"
           />
           <span class="form-tip">fps（留空则使用原始帧率，推流中时无法修改）</span>
         </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">确定</el-button>
      </div>
    </el-dialog>

    <!-- 推流配置对话框 -->
    <el-dialog
      title="推流配置"
      :visible.sync="streamDialogVisible"
      width="600px"
    >
      <el-form
        :model="streamForm"
        ref="streamForm"
        label-width="120px"
      >
         <el-form-item label="推流ID（可选）">
           <el-input
             v-model="streamForm.stream_id"
             placeholder="留空自动生成，如：warehouse_cam_1"
           />
           <span class="form-tip">推流ID用于构建RTSP地址（如：rtsp://.../推流ID），留空则自动生成</span>
         </el-form-item>
         <el-form-item label="推流帧率（可选）">
           <el-input-number
             v-model="streamForm.stream_fps"
             :min="1"
             :max="60"
             :step="1"
             :controls="true"
             placeholder="留空"
             style="width: 150px;"
           />
           <span class="form-tip">fps（留空则使用视频配置的帧率或原始帧率）</span>
         </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="streamDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmStartStream">开始推流</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios';
const config = require('../../../../config/index.js');

// 创建专用axios实例，避免CORS错误
const localVideoAxios = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: 15000,
  withCredentials: false  // 避免CORS错误
});

export default {
  name: 'LocalVideo',
  data() {
    return {
      loading: false,
      videoList: [],
      totalVideos: 0,
      streamingVideos: 0,
      searchName: '',
      filterStreaming: null,
      
      // 上传相关
      uploadDialogVisible: false,
      uploading: false,
      uploadProgress: 0,  // 上传进度百分比
       uploadForm: {
         file: null,
         name: '',
         description: '',
         stream_fps: undefined  // 使用 undefined 而不是 null，避免 el-input-number 显示默认值
       },
      fileList: [],
      uploadRules: {
        file: [{ required: true, message: '请选择视频文件', trigger: 'change' }],
        name: [
          { required: true, message: '请输入视频名称', trigger: 'blur' },
          { min: 1, max: 255, message: '长度在 1 到 255 个字符', trigger: 'blur' }
        ]
      },
      
      // 编辑相关
      editDialogVisible: false,
      currentVideo: null,
      editForm: {
        name: '',
        description: '',
        stream_fps: null
      },
      editRules: {
        name: [
          { required: true, message: '请输入视频名称', trigger: 'blur' },
          { min: 1, max: 255, message: '长度在 1 到 255 个字符', trigger: 'blur' }
        ]
      },
      
      // 推流配置相关
      streamDialogVisible: false,
      streamForm: {
        stream_id: '',
        stream_fps: null
      },
      
      // 推流操作中的视频ID集合（防止重复点击）
      streamingOperations: new Set()
    };
  },
  mounted() {
    this.loadVideos();
    // 定时刷新推流状态
    this.timer = setInterval(() => {
      this.refreshStreamingStatus();
    }, 10000); // 每10秒刷新一次
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
  methods: {
    // 加载视频列表
    async loadVideos() {
      this.loading = true;
      try {
        const params = {
          skip: 0,
          limit: 1000
        };
        if (this.searchName) {
          params.name = this.searchName;
        }
        if (this.filterStreaming !== null) {
          params.is_streaming = this.filterStreaming;
        }
        
         const response = await localVideoAxios.get(
           '/prod-api/smart-engine/api/v1/local-videos/list',
           { params }
         );
        
        this.videoList = response.data;
        this.totalVideos = this.videoList.length;
        this.streamingVideos = this.videoList.filter(v => v.is_streaming).length;
        
        // 获取推流状态
        await this.loadStreamingStatus();
      } catch (error) {
        this.$message.error('加载视频列表失败: ' + ((error.response && error.response.data && error.response.data.detail) ? error.response.data.detail : error.message));
      } finally {
        this.loading = false;
      }
    },
    
     // 加载推流状态
     async loadStreamingStatus() {
       for (const video of this.videoList) {
         if (video.is_streaming) {
           try {
             const response = await localVideoAxios.get(
               `/prod-api/smart-engine/api/v1/local-videos/${video.id}/stream-status`
             );
             if (response.data) {
               // 使用 $set 确保Vue能追踪新属性的变化
               this.$set(video, 'rtsp_url', response.data.rtsp_url);
               this.$set(video, 'stream_stats', response.data.stats);
             }
           } catch (error) {
             console.error(`获取视频${video.id}推流状态失败:`, error);
           }
         }
       }
     },
    
     // 刷新推流状态
     async refreshStreamingStatus() {
       if (this.loading) return;
       
       const streamingVideos = this.videoList.filter(v => v.is_streaming);
       for (const video of streamingVideos) {
         try {
           const response = await localVideoAxios.get(
             `/prod-api/smart-engine/api/v1/local-videos/${video.id}/stream-status`
           );
           if (response.data) {
             // 使用 $set 确保Vue能追踪新属性的变化
             this.$set(video, 'rtsp_url', response.data.rtsp_url);
             this.$set(video, 'stream_stats', response.data.stats);
           } else {
             // 推流状态不一致，刷新列表
             this.$set(video, 'is_streaming', false);
           }
         } catch (error) {
           console.error(`刷新视频${video.id}推流状态失败:`, error);
         }
       }
     },
    
    // 搜索处理
    handleSearch() {
      this.loadVideos();
    },
    
    // 显示上传对话框
    showUploadDialog() {
      // 重置表单
      this.uploadForm = {
        file: null,
        name: '',
        description: '',
        stream_fps: undefined  // 使用 undefined 而不是 null
      };
      this.fileList = [];
      // 重置表单验证
      this.$nextTick(() => {
        if (this.$refs.uploadForm) {
          this.$refs.uploadForm.clearValidate();
        }
      });
      this.uploadDialogVisible = true;
    },
    
    // 文件选择处理
    handleFileChange(file, fileList) {
      this.uploadForm.file = file.raw;
      this.fileList = fileList;
      
      // 如果没有输入名称，使用文件名（去除扩展名）
      if (!this.uploadForm.name && file.name) {
        this.uploadForm.name = file.name.replace(/\.[^/.]+$/, "");
      }
    },
    
    // 提交上传
    submitUpload() {
      this.$refs.uploadForm.validate(async (valid) => {
        if (valid) {
          if (!this.uploadForm.file) {
            this.$message.error('请选择视频文件');
            return;
          }
          
          this.uploading = true;
          const formData = new FormData();
          formData.append('file', this.uploadForm.file);
          formData.append('name', this.uploadForm.name);
           if (this.uploadForm.description) {
             formData.append('description', this.uploadForm.description);
           }
           // 只有当用户明确填写了帧率且值有效时才传递
           if (this.uploadForm.stream_fps && this.uploadForm.stream_fps > 0) {
             formData.append('stream_fps', this.uploadForm.stream_fps);
           }
          
          try {
             await localVideoAxios.post(
               '/prod-api/smart-engine/api/v1/local-videos/upload',
               formData,
               {
                 headers: {
                   'Content-Type': 'multipart/form-data'
                 },
                 onUploadProgress: (progressEvent) => {
                   // 计算上传进度
                   if (progressEvent.total) {
                     this.uploadProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                   }
                 }
               }
             );
            
            this.$message.success('视频上传成功');
            this.uploadDialogVisible = false;
            this.loadVideos();
          } catch (error) {
            this.$message.error('上传失败: ' + ((error.response && error.response.data && error.response.data.detail) ? error.response.data.detail : error.message));
          } finally {
            this.uploading = false;
            this.uploadProgress = 0;  // 重置上传进度
          }
        }
      });
    },
    
    // 重置上传表单
    resetUploadForm() {
      this.$refs.uploadForm.resetFields();
      this.uploadForm.file = null;
      this.fileList = [];
    },
    
    // 显示编辑对话框
    showEditDialog(video) {
      this.currentVideo = video;
      this.editForm = {
        name: video.name,
        description: video.description || '',
        stream_fps: video.stream_fps
      };
      this.editDialogVisible = true;
    },
    
    // 提交编辑
    submitEdit() {
      this.$refs.editForm.validate(async (valid) => {
        if (valid) {
          try {
            // 构建更新数据，只传递有效的字段
            const updateData = {
              name: this.editForm.name,
              description: this.editForm.description
            };
            // 只有当用户明确填写了帧率且值有效时才传递
            if (this.editForm.stream_fps && this.editForm.stream_fps > 0) {
              updateData.stream_fps = this.editForm.stream_fps;
            }
            
             await localVideoAxios.put(
               `/prod-api/smart-engine/api/v1/local-videos/${this.currentVideo.id}`,
               updateData
             );
            
            this.$message.success('视频信息已更新');
            this.editDialogVisible = false;
            this.loadVideos();
           } catch (error) {
             this.$message.error('更新失败: ' + ((error.response && error.response.data && error.response.data.detail) ? error.response.data.detail : error.message));
           }
         }
       });
     },
    
    // 开始推流
    startStream(video) {
      this.currentVideo = video;
      this.streamForm = {
        stream_id: '',
        stream_fps: video.stream_fps || undefined  // 如果视频没有设置默认帧率，使用 undefined 保持输入框为空
      };
      this.streamDialogVisible = true;
    },
    
    // 确认开始推流
    async confirmStartStream() {
      // 防止重复提交
      if (this.streamingOperations.has(this.currentVideo.id)) {
        this.$message.warning('推流操作正在进行中，请稍候...');
        return;
      }
      
      // 添加到操作集合中
      this.streamingOperations.add(this.currentVideo.id);
      
      try {
        const payload = {};
        if (this.streamForm.stream_id) {
          payload.stream_id = this.streamForm.stream_id;
        }
        // 只有当用户明确填写了帧率且值有效时才传递
        if (this.streamForm.stream_fps && this.streamForm.stream_fps > 0) {
          payload.stream_fps = this.streamForm.stream_fps;
        }
        
         const response = await localVideoAxios.post(
           `/prod-api/smart-engine/api/v1/local-videos/${this.currentVideo.id}/start-stream`,
           payload
         );
        
        this.$message.success('推流已启动');
        this.streamDialogVisible = false;
        
        // 显示RTSP地址（10秒后自动关闭，也可手动关闭）
        this.$notify({
          title: '推流成功',
          message: `RTSP地址: ${response.data.rtsp_url}`,
          type: 'success',
          duration: 10000,  // 10秒后自动关闭
          showClose: true   // 显示关闭按钮
        });
        
         this.loadVideos();
       } catch (error) {
         this.$message.error('启动推流失败: ' + ((error.response && error.response.data && error.response.data.detail) ? error.response.data.detail : error.message));
       } finally {
         // 从操作集合中移除
         this.streamingOperations.delete(this.currentVideo.id);
       }
     },
    
    // 停止推流
    stopStream(video) {
      this.$confirm('确定要停止推流吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
           await localVideoAxios.post(
             `/prod-api/smart-engine/api/v1/local-videos/${video.id}/stop-stream`
           );
          
           this.$message.success('推流已停止');
           this.loadVideos();
         } catch (error) {
           this.$message.error('停止推流失败: ' + ((error.response && error.response.data && error.response.data.detail) ? error.response.data.detail : error.message));
         }
       }).catch(() => {});
     },
    
    // 删除视频
    deleteVideo(video) {
      if (video.is_streaming) {
        this.$message.warning('请先停止推流后再删除');
        return;
      }
      
      this.$confirm(`确定要删除视频"${video.name}"吗？删除后无法恢复。`, '警告', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }).then(async () => {
        try {
           await localVideoAxios.delete(
             `/prod-api/smart-engine/api/v1/local-videos/${video.id}`
           );
          
           this.$message.success('视频已删除');
           this.loadVideos();
         } catch (error) {
           this.$message.error('删除失败: ' + ((error.response && error.response.data && error.response.data.detail) ? error.response.data.detail : error.message));
         }
       }).catch(() => {});
     },
    
    // 复制到剪贴板
    copyToClipboard(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        this.$message.success('RTSP地址已复制到剪贴板');
      } catch (err) {
        this.$message.error('复制失败');
      }
      document.body.removeChild(textarea);
    },
    
    // 格式化文件大小
    formatFileSize(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
    },
    
    // 格式化时长
    formatDuration(seconds) {
      if (!seconds) return '-';
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      if (h > 0) {
        return `${h}h ${m}m ${s}s`;
      } else if (m > 0) {
        return `${m}m ${s}s`;
      } else {
        return `${s}s`;
      }
    },
    
    // 格式化日期时间
    formatDateTime(dateStr) {
      if (!dateStr) return '-';
      const date = new Date(dateStr);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
};
</script>

<style scoped>
.local-video-container {
  padding: 20px;
  background: #f5f7fa;
  height: 100%;
}

/* 页面标题 */
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
}

.header-left {
  flex: 1;
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
  font-weight: 600;
}

.page-title i {
  color: #409EFF;
  margin-right: 10px;
}

.page-subtitle {
  color: #909399;
  font-size: 14px;
}

.header-right {
  display: flex;
  gap: 10px;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 20px rgba(0,0,0,.15);
}

.stat-card.streaming {
  background: linear-gradient(135deg, #67C23A 0%, #85CE61 100%);
  color: white;
}

.stat-card.streaming >>> .el-card__body {
  padding: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  font-size: 48px;
  color: #409EFF;
}

.stat-card.streaming .stat-icon {
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}

.stat-card.streaming .stat-value {
  color: white;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.stat-card.streaming .stat-label {
  color: rgba(255,255,255,0.9);
}

/* 筛选栏 */
.filter-container {
  margin-bottom: 20px;
  padding: 15px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
}

/* 视频列表 */
.video-list {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
  height: calc(100% - 330px);
}

.video-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.video-name-cell i {
  color: #409EFF;
}

.video-info-cell {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.rtsp-url-cell {
  width: 100%;
}

.rtsp-url-cell >>> .el-input-group {
  width: 100%;
}

.text-muted {
  color: #909399;
}

.action-buttons {
  display: flex;
  gap: 5px;
  justify-content: center;
  flex-wrap: wrap;
}

.form-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}

/* 上传组件样式 */
.upload-demo {
  width: 100%;
}

>>> .el-upload {
  width: 100%;
}

>>> .el-upload-dragger {
  width: 100%;
}
</style>

