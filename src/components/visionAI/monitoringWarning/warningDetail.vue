<template>
  <div class="warning-detail-component">
    <el-dialog
      title="预警详情"
      :visible.sync="dialogVisible"
      width="900px"
      :before-close="handleClose"
      v-loading="loading"
      element-loading-text="处理中...">
      <div v-if="internalWarning" class="warning-detail-container">
        <!-- 预警详情头部 -->
        <div class="warning-detail-header">
          <div class="warning-level-badge" :class="getWarningLevelClass(internalWarning.level)">
            {{ getWarningLevelText(internalWarning.level) }}预警
          </div>
          <div class="warning-detail-time">
            <i class="el-icon-time"></i>
            {{ formatTime(internalWarning.time) }}
          </div>
        </div>

        <!-- 主要内容区域 -->
        <div class="warning-detail-main">
          <!-- 左侧：预警信息和媒体内容 -->
          <div class="warning-left-content">
            <!-- 预警信息 -->
            <div class="warning-detail-info">
              <!-- 基础信息卡片 -->
              <div class="info-card">
                <div class="card-title">
                  <i class="el-icon-info"></i>
                  基础信息
                </div>
                <div class="info-grid">
                  <div class="info-row">
                    <div class="info-cell">
                      <span class="label">预警ID</span>
                      <span class="value alert-id">{{ getAlertId(internalWarning) }}</span>
                    </div>
                    <div class="info-cell">
                      <span class="label">设备名称</span>
                      <span class="value">{{ internalWarning.device }}</span>
                    </div>
                  </div>
                  <div class="info-row">
                    <div class="info-cell">
                      <span class="label">违规位置</span>
                      <span class="value">{{ internalWarning.location || (internalWarning.deviceInfo && internalWarning.deviceInfo.position) || '未知位置' }}</span>
                    </div>
                    <div class="info-cell">
                      <span class="label">预警名称</span>
                      <span class="value">{{ internalWarning.type }}</span>
                    </div>
                  </div>
                  <div class="info-row">
                    <div class="info-cell">
                      <span class="label">预警类型</span>
                      <span class="value">{{ getWarningTypeText(internalWarning.type) }}</span>
                    </div>
                  </div>
                  <!-- 复判信息行 (仅在复判记录页面显示) -->
                  <div class="info-row" v-if="internalWarning.reviewType && source === 'reviewRecords'">
                    <div class="info-cell">
                      <span class="label">复判分类</span>
                      <span class="value review-classification" :class="'review-' + internalWarning.reviewType">
                        {{ getReviewClassificationText(internalWarning.reviewType) }}
                        <el-tooltip
                          v-if="internalWarning.reviewType === 'auto'"
                          content="还原复判"
                          placement="top"
                        >
                          <span
                            class="restore-review-btn"
                            @click="handleRestoreReview"
                            @click.stop
                          >
                            <i class="el-icon-refresh-left"></i>
                          </span>
                        </el-tooltip>
                      </span>
                    </div>
                    <div class="info-cell" v-if="internalWarning.reviewerName">
                      <span class="label">复判人员</span>
                      <span class="value">{{ internalWarning.reviewerName }}</span>
                    </div>
                  </div>
                  <!-- 复判意见行 (仅在复判记录页面且有复判意见时显示) -->
                  <div class="info-row" v-if="internalWarning.reviewNotes && source === 'reviewRecords'">
                    <div class="info-cell full-width">
                      <span class="label">复判意见</span>
                      <span class="value review-notes">{{ internalWarning.reviewNotes }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 详细描述卡片 -->
              <div class="info-card">
                <div class="card-title">
                  <i class="el-icon-document"></i>
                  预警描述
                </div>
                <div class="info-content">
                  <p class="description-content">{{ internalWarning.description || '检测到工作人员未佩戴安全帽，存在安全隐患，请立即整改' }}</p>
                </div>
              </div>
            </div>

            <!-- 媒体内容 -->
            <div class="warning-media">
              <div class="warning-image">
                <h4 class="media-title">
                  <i class="el-icon-picture"></i>
                  违规截图
                  <!-- 合并预警查看按钮 -->
                  <el-button
                    v-if="internalWarning.is_merged"
                    type="warning"
                    size="mini"
                    plain
                    class="merge-view-btn"
                    @click.stop="showMergedDialog = true"
                  >
                    <i class="el-icon-folder-opened"></i>
                    查看合并 ({{ internalWarning.alert_count }})
                  </el-button>
                </h4>
                <div class="image-container" @click="openImageViewer">
                  <div v-if="internalWarning.imageUrl" class="real-image">
                    <img :src="internalWarning.imageUrl" :alt="internalWarning.type" />
                    <div class="media-overlay">
                      <i class="el-icon-zoom-in"></i>
                      <span>点击放大查看</span>
                    </div>
                  </div>
                  <div v-else class="placeholder-image">
                    <i :class="getWarningIcon(internalWarning.level)"></i>
                    <span>违规截图</span>
                  </div>
                </div>
              </div>

              <div class="warning-video-clip">
                <h4 class="media-title">
                  <i class="el-icon-video-camera"></i>
                  视频片段
                </h4>
                <div class="video-container" @click="openVideoViewer">
                  <div v-if="internalWarning.videoUrl || internalWarning.minio_video_url" class="real-video">
                    <video
                      :src="internalWarning.videoUrl || internalWarning.minio_video_url"
                      preload="metadata"
                      style="width: 100%; height: 100%; object-fit: cover;"
                    ></video>
                    <div class="media-overlay">
                      <i class="el-icon-video-play"></i>
                      <span>点击播放视频</span>
                    </div>
                  </div>
                  <div v-else class="placeholder-video">
                    <i class="el-icon-video-camera"></i>
                    <span>视频片段</span>
                    <div class="media-overlay">
                      <i class="el-icon-video-play"></i>
                      <span>点击播放视频</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：处理进展时间线 (复判记录页面不显示) -->
          <div class="warning-right-content" v-if="source !== 'reviewRecords'">
            <div class="process-timeline">
              <h4 class="timeline-title">
                <i class="el-icon-time"></i>
                处理进展
              </h4>
              <div class="timeline-container">
                <div
                  v-for="(item, index) in operationHistory"
                  :key="index"
                  class="timeline-item"
                  :class="{
                    'active': item.status === 'active',
                    'completed': item.status === 'completed',
                    'future': item.status === 'future'
                  }"
                  :data-type="item.operationType"
                >
                  <div class="timeline-dot"></div>
                  <div class="timeline-content">
                    <div class="timeline-status">
                      <span>{{ item.statusText }}</span>
                      <span v-if="item.operator" class="timeline-operator">{{ item.operator }}</span>
                    </div>
                    <div class="timeline-time">{{ item.time }}</div>
                    <div class="timeline-desc">{{ item.description }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <span slot="footer" class="dialog-footer">
        <!-- 实时监控页面显示所有按钮 -->
        <template v-if="source === 'realTimeMonitoring'">
          <el-button plain @click="handleReport" class="action-btn report-btn">
            <i class="el-icon-upload"></i>
            上报
          </el-button>
          <!-- 归档按钮根据状态禁用（只有已处理状态才能归档） -->
          <el-button
            plain
            :disabled="isArchiveDisabled()"
            @click="handleArchive"
            class="action-btn archive-btn">
            <i class="el-icon-folder"></i>
            归档
          </el-button>
          <!-- 误报按钮根据状态禁用（只有待处理状态才能点击） -->
          <el-button
            plain
            :disabled="isFalseAlarmDisabled()"
            @click="handleFalseAlarm"
            class="action-btn false-alarm-btn">
            <i class="el-icon-close"></i>
            误报
          </el-button>
          <!-- 处理按钮根据状态禁用 -->
          <el-button
            plain
            :disabled="isProcessingDisabled()"
            @click="handleWarning"
            class="action-btn process-btn">
            <i class="el-icon-check"></i>
            {{ isProcessingDisabled() ? '已完成' : '处理' }}
          </el-button>
        </template>
        <!-- 预警管理页面只显示处理和关闭按钮 -->
        <template v-else-if="source === 'warningManagement'">
        </template>
        <!-- 预警档案页面只显示关闭按钮 -->
        <template v-else-if="source === 'warningArchives'">
        </template>
        <!-- 复判记录页面只显示关闭按钮 -->
        <template v-else-if="source === 'reviewRecords'">
        </template>
        <!-- 默认情况显示处理和关闭按钮 -->
        <template v-else>
          <!-- 处理按钮根据状态禁用 -->
          <el-button
            plain
            :disabled="isProcessingDisabled()"
            @click="handleWarning"
            class="action-btn process-btn">
            <i class="el-icon-check"></i>
            {{ isProcessingDisabled() ? '已完成' : '处理' }}
          </el-button>
          <el-button @click="closeDialog" class="action-btn">
            关闭
          </el-button>
        </template>
      </span>
    </el-dialog>

    <!-- 上报确认对话框 -->
    <el-dialog
      title="上报确认"
      :visible.sync="reportDialogVisible"
      width="400px"
      center>
      <div class="confirm-content">
        <p>确定要上报此预警吗？</p>
        <p style="color: #909399; font-size: 12px;">上报后预警将提交给上级部门处理</p>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeReportDialog">取 消</el-button>
        <el-button type="warning" @click="confirmReport">确定上报</el-button>
      </span>
    </el-dialog>

    <!-- 归档选择对话框 -->
    <el-dialog
      title="归档预警"
      :visible.sync="archiveDialogVisible"
      width="40%"
      center
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="archive-dialog-content">
        <div class="archive-info">
          <i class="el-icon-folder" style="color: #E6A23C; font-size: 24px; margin-right: 8px;"></i>
          <span>请选择要归档到的档案：</span>
        </div>

        <div class="archive-selection">
          <el-form label-width="80px">
            <el-form-item label="选择档案">
              <el-select
                v-model="selectedArchiveId"
                placeholder="请选择档案"
                style="width: 100%"
                :disabled="availableArchives.length === 0"
              >
                <el-option
                  v-for="archive in availableArchives"
                  :key="archive.id"
                  :label="archive.name + (archive.isDefault ? ' (默认)' : '')"
                  :value="archive.id"
                >
                  <span style="float: left">{{ archive.name }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">
                    {{ archive.isDefault ? '默认档案' : '自定义档案' }}
                  </span>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item v-if="availableArchives.length === 0">
              <el-alert
                title="当前摄像头位置没有可用档案"
                description="系统将自动创建默认档案进行归档"
                type="info"
                :closable="false"
                show-icon
              />
            </el-form-item>


          </el-form>
        </div>

        <div class="archive-tip">
          <el-alert
            title="归档说明"
            description="归档后，预警将从实时预警页面和预警管理页面移除，仅可在预警档案中查看。"
            type="warning"
            :closable="false"
            show-icon
          />
        </div>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button @click="closeArchiveDialog">取 消</el-button>
        <el-button type="danger" @click="confirmArchive">确认归档</el-button>
      </span>
    </el-dialog>

    <!-- 处理意见对话框 -->
    <el-dialog
      title="处理预警"
      :visible.sync="remarkDialogVisible"
      width="30%"
      center
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form :model="remarkForm" label-width="80px">
        <el-form-item label="处理意见" required>
          <el-input
            v-model="remarkForm.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入处理意见，描述具体的处理措施和结果"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <div class="process-tip">
        <i class="el-icon-info" style="color: #909399; margin-right: 4px;"></i>
        <span style="color: #909399; font-size: 13px;">填写处理意见后，可点击"确认处理"添加处理记录，或点击"结束处理"完成整个处理流程</span>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="saveRemark">确认处理</el-button>
        <el-button type="success" @click="finishProcessing">结束处理</el-button>
      </span>
    </el-dialog>

    <!-- 合并预警详情弹窗 -->
    <el-dialog
      title="合并预警详情"
      :visible.sync="showMergedDialog"
      width="700px"
      class="merged-dialog"
      append-to-body
    >
      <div v-if="internalWarning && internalWarning.is_merged" class="merged-content">
        <!-- 合并统计信息 -->
        <div class="merged-stats">
          <div class="stat-item">
            <div class="stat-value">{{ internalWarning.alert_count }}</div>
            <div class="stat-label">检测次数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ formatMergeDuration(internalWarning.alert_duration) }}</div>
            <div class="stat-label">持续时长</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ formatTime(internalWarning.first_alert_time) }}</div>
            <div class="stat-label">首次检测</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ formatTime(internalWarning.last_alert_time) }}</div>
            <div class="stat-label">最后检测</div>
          </div>
        </div>

        <!-- 合并图片列表 -->
        <div class="merged-images-section">
          <div class="section-title">全部截图</div>
          <div class="merged-images-grid">
            <div
              v-for="(img, index) in internalWarning.alert_images"
              :key="index"
              class="merged-image-item"
              :class="{ 'is-primary': index === getMergedMiddleIndex() }"
              @click="openMergedImage(index)"
            >
              <img :src="getMergedImageUrl(img.object_name)" />
              <div class="image-info">
                <span class="image-index">#{{ index + 1 }}</span>
                <span v-if="index === getMergedMiddleIndex()" class="primary-tag">主图</span>
                <span class="image-time">+{{ img.relative_time.toFixed(1) }}s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 合并图片大图查看 -->
    <div
      v-if="mergedImageViewerVisible"
      class="simple-image-overlay"
      @click="closeMergedImageViewer"
    >
      <div class="merged-image-viewer-container" @click.stop>
        <div class="viewer-header">
          <span>{{ currentMergedImageIndex + 1 }} / {{ internalWarning.alert_images.length }}</span>
          <span class="viewer-time">+{{ internalWarning.alert_images[currentMergedImageIndex].relative_time.toFixed(1) }}s</span>
          <i class="el-icon-close" @click="closeMergedImageViewer"></i>
        </div>
        <div class="viewer-body">
          <i class="el-icon-arrow-left nav-btn" @click="prevMergedImage"></i>
          <img :src="getMergedImageUrl(internalWarning.alert_images[currentMergedImageIndex].object_name)" />
          <i class="el-icon-arrow-right nav-btn" @click="nextMergedImage"></i>
        </div>
        <div class="viewer-thumbnails">
          <div
            v-for="(img, index) in internalWarning.alert_images"
            :key="index"
            class="viewer-thumb"
            :class="{ active: index === currentMergedImageIndex }"
            @click="currentMergedImageIndex = index"
          >
            <img :src="getMergedImageUrl(img.object_name)" />
          </div>
        </div>
      </div>
    </div>

    <!-- 简单图片放大显示 -->
    <div
      v-if="imageViewerVisible"
      class="simple-image-overlay"
      @click="closeImageViewer">
       <div class="simple-image-container" @click.stop>
         <img
           v-if="internalWarning && internalWarning.imageUrl"
           :src="internalWarning.imageUrl"
           :alt="internalWarning.type"
           class="simple-enlarged-image" />
       </div>
     </div>

    <!-- 简单视频播放器 -->
    <div
      v-if="videoViewerVisible"
      class="simple-video-overlay"
      @click="closeVideoViewer">
      <div class="simple-video-container" @click.stop>
        <div class="simple-video-player">
          <!-- 视频预览区域 -->
          <div class="video-preview">
                          <video
               v-if="internalWarning && (internalWarning.minio_video_url || internalWarning.videoUrl)"
               ref="videoPlayer"
               :src="internalWarning.minio_video_url || internalWarning.videoUrl"
               @loadedmetadata="onVideoLoaded"
               @timeupdate="onVideoTimeUpdate"
               @ended="onVideoEnded"
               :style="`width: 100%; height: 100%; object-fit: ${videoFitMode}; border-radius: 12px;`"
               preload="metadata"
               controls
             ></video>
            <img
              v-else-if="internalWarning && (internalWarning.minio_frame_url || internalWarning.imageUrl)"
              :src="internalWarning.minio_frame_url || internalWarning.imageUrl"
              :alt="internalWarning.type"
              style="width: 100%; height: 100%; object-fit: contain;" />
            <div v-else class="no-media-placeholder">
              <i class="el-icon-video-camera" style="font-size: 48px; color: #909399;"></i>
              <p style="color: #909399; margin-top: 16px;">暂无视频数据</p>
            </div>
          </div>

          <!-- 简化的视频控制条 - 关闭按钮和显示模式切换 -->
          <div class="simple-video-controls">
            <el-button
              size="mini"
              :icon="videoFitMode === 'cover' ? 'el-icon-full-screen' : 'el-icon-crop'"
              circle
              @click="toggleVideoFitMode"
              :title="videoFitMode === 'cover' ? '切换到完整显示' : '切换到填满显示'">
            </el-button>
            <el-button
              size="mini"
              icon="el-icon-close"
              circle
              @click="closeVideoViewer"
              style="margin-left: 8px;">
            </el-button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { alertAPI } from '@/components/service/VisionAIService.js'

export default {
  name: "WarningDetail",
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    warning: {
      type: Object,
      default: null
    },
    warningId: {
      type: [String, Number],
      default: null
    },
    source: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      dialogVisible: false,
      loading: false,
      // 内部预警数据（从API获取或使用传入的props）
      internalWarning: null,
      // 归档相关
      archiveDialogVisible: false,
      selectedArchiveId: '',
      archivesList: [],
      currentCameraId: '',
      // 上报相关
      reportDialogVisible: false,
      reportWarningId: '',

      // 处理意见对话框
      remarkDialogVisible: false,
      remarkForm: {
        remark: ''
      },

      // 处理进展时间线 - 改为数据属性，动态记录操作历史
      operationHistory: [],

      // 图片查看器相关
      imageViewerVisible: false,

      // 视频播放器相关
      videoViewerVisible: false,
      videoFitMode: 'cover', // 'cover' 无黑边但可能裁剪, 'contain' 完整显示但可能有黑边

      // 合并预警相关
      showMergedDialog: false,
      mergedImageViewerVisible: false,
      currentMergedImageIndex: 0
    }
  },
  watch: {
    visible: {
      handler(val) {
        this.dialogVisible = val;
        if (val) {
          // 当对话框打开时，获取或设置预警数据
          this.loadWarningData();
        }
      },
      immediate: true
    },
    warning: {
      handler(val) {
        if (val) {
          this.internalWarning = val;
          this.initArchivesList();
          this.initOperationHistory();
        }
      },
      immediate: true
    },
    warningId: {
      handler(val) {
        if (val && this.visible) {
          this.loadWarningData();
        }
      },
      immediate: true
    }
  },
  mounted() {
    this.initArchivesList();
    // 添加键盘事件监听
    document.addEventListener('keydown', this.handleKeydown);
  },
  destroyed() {
    // 移除键盘事件监听
    document.removeEventListener('keydown', this.handleKeydown);
  },
  computed: {
    // 可用档案列表
    availableArchives() {
      return this.archivesList.filter(archive =>
        archive.cameraId === this.currentCameraId || archive.isDefault
      );
    },
    // 默认档案
    defaultArchive() {
      return this.availableArchives.find(archive => archive.isDefault);
    }
  },
  methods: {
    // ==================== 合并预警相关方法 ====================
    // 格式化合并持续时间
    formatMergeDuration(seconds) {
      if (!seconds) return '0秒'
      if (seconds < 60) return `${Math.round(seconds)}秒`
      return `${(seconds / 60).toFixed(1)}分钟`
    },

    // 获取合并图片的中间索引
    getMergedMiddleIndex() {
      if (!this.internalWarning || !this.internalWarning.alert_images) return 0
      return Math.floor(this.internalWarning.alert_images.length / 2)
    },

    // 获取合并图片URL
    getMergedImageUrl(objectName) {
      if (!objectName) return ''
      // 如果已经是完整URL则直接返回
      if (objectName.startsWith('http')) return objectName
      // 否则拼接MinIO地址（根据实际配置调整）
      const taskId = (this.internalWarning && this.internalWarning.task_id) || ''
      return `${window.VUE_APP_MINIO_URL || ''}/visionai/alert-images/${taskId}/${objectName}`
    },

    // 打开合并图片大图
    openMergedImage(index) {
      this.currentMergedImageIndex = index
      this.mergedImageViewerVisible = true
    },

    // 关闭合并图片大图
    closeMergedImageViewer() {
      this.mergedImageViewerVisible = false
    },

    // 上一张合并图片
    prevMergedImage() {
      if (this.currentMergedImageIndex > 0) {
        this.currentMergedImageIndex--
      }
    },

    // 下一张合并图片
    nextMergedImage() {
      if (this.currentMergedImageIndex < this.internalWarning.alert_images.length - 1) {
        this.currentMergedImageIndex++
      }
    },

    // ==================== 原有方法 ====================
    // 加载预警数据（从props或API获取）
    async loadWarningData() {
      try {
        if (this.warning) {
          // 如果传入了完整的预警对象，直接使用
          this.internalWarning = this.warning;
          this.initArchivesList();
          this.initOperationHistory();
        } else if (this.warningId) {
          // 如果只传入了ID，调用API获取详情
          this.loading = true;
          console.log('通过ID获取预警详情:', this.warningId);

          const response = await alertAPI.getAlertDetail(this.warningId);
          console.log('预警详情API响应:', response.data);

          if (response.data && response.data.alert_id) {
            // API直接返回预警详情对象，转换API数据为页面数据格式
            this.internalWarning = this.transformApiDetailToPageData(response.data);
            this.initArchivesList();
            this.initOperationHistory();
          } else {
            console.error('获取预警详情失败:', response.data);
            this.$message.error('获取预警详情失败：' + (response.data && response.data.msg || '服务器错误'));
            this.closeDialog();
          }
        } else {
          console.warn('缺少预警数据或预警ID');
          this.$message.error('缺少预警数据');
          this.closeDialog();
        }
      } catch (error) {
        console.error('加载预警数据失败:', error);
        this.$message.error('获取预警详情失败：' + (error.message || '网络错误'));
        this.closeDialog();
      } finally {
        this.loading = false;
      }
    },

    // 转换API详情数据为页面数据格式
    transformApiDetailToPageData(apiData) {
      if (!apiData) {
        console.warn('API详情数据为空');
        return null;
      }

      // 预警等级映射
      const levelMap = {
        1: '一级预警',
        2: '二级预警',
        3: '三级预警',
        4: '四级预警'
      };

      // 状态映射
      const statusMap = {
        1: 'pending',
        2: 'processing',
        3: 'completed'
      };

      // 转换格式（类似warningManagement.vue中的转换逻辑）
      const transformedData = {
        // 基本信息映射
        id: String(apiData.alert_id || apiData.id || Date.now()),
        deviceName: apiData.alert_name || '未知预警',
        imageUrl: apiData.minio_frame_url || null,
        videoUrl: apiData.minio_video_url || null, // 添加视频URL
        // 同时保留API原始字段名，用于视频播放器
        minio_frame_url: apiData.minio_frame_url || null,
        minio_video_url: apiData.minio_video_url || null,
        level: levelMap[apiData.alert_level] || '未知等级',
        time: this.formatApiTime(apiData.alert_time || apiData.created_at),
        status: statusMap[apiData.status] || 'pending',

        // 设备信息
        device: apiData.camera_name || '未知摄像头',
        deviceInfo: {
          name: apiData.camera_name || '未知摄像头',
          position: apiData.location || '未知位置'
        },

        // 预警详细信息
        type: apiData.alert_type || apiData.alert_name || '未知类型',
        location: apiData.location || '未知位置',
        description: apiData.alert_description || '未知描述',
        skill: apiData.alert_type || 'unknown_skill',

        // 处理信息
        remark: apiData.processing_notes || '',

        // 检测结果（如果有的话）
        detectionResults: apiData.result || [],

        // 电子围栏信息（如果有的话）
        electronicFence: apiData.electronic_fence || null,

        // 技能相关信息
        skillClassId: apiData.skill_class_id,
        skillNameZh: apiData.skill_name_zh,
        taskId: apiData.task_id,

        // 处理时间信息
        processedAt: apiData.processed_at,
        processedBy: apiData.processed_by,
        createdAt: apiData.created_at,
        updatedAt: apiData.updated_at,

        // 原始API数据（用于调试和扩展）
        _apiData: apiData
      };

      console.log('API详情数据转换完成:', transformedData);
      return transformedData;
    },

    // 格式化API时间格式（复用warningManagement.vue的方法）
    formatApiTime(timeString) {
      if (!timeString) return new Date().toLocaleString();

      try {
        // 处理ISO格式时间 (2025-06-27T15:15:52)
        if (timeString.includes('T')) {
          const date = new Date(timeString);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
          }
        }

        // 如果已经是标准格式，直接返回
        return timeString;
      } catch (error) {
        console.warn('时间格式转换失败:', timeString, error);
        return timeString || new Date().toLocaleString();
      }
    },

    // 初始化档案列表 - 调用真实API
    async initArchivesList() {
      try {
        const { archiveAPI } = await import('../../service/VisionAIService.js');

        const response = await archiveAPI.getArchiveList({
          page: 1,
          limit: 100,
          // status: 1 // 获取所有正常状态的档案
        });

        console.log('📥 获取档案列表响应:', response.data);

        if (response.data && response.data.data) {
          this.archivesList = response.data.data.map(archive => ({
            id: archive.archive_id,
            name: archive.name,
            cameraId: archive.camera_id || 'unknown',
            cameraName: archive.location || '未知位置',
            isDefault: false, // 真实API中可能没有isDefault字段
            createTime: archive.created_at
          }));
          console.log('✅ 加载档案列表成功:', this.archivesList.length, '个档案');
        } else {
          console.warn('⚠️ 获取档案列表格式异常:', response.data);
          this.archivesList = [];
        }
      } catch (error) {
        console.error('❌ 加载档案列表失败:', error);
        this.archivesList = [];
        // 不显示错误提示,避免影响页面主要功能
      }
    },

    // 获取预警ID
    getAlertId(warning) {
      if (!warning) return '未知';

      // 优先从API原始数据中获取alert_id
      if (warning._apiData && warning._apiData.alert_id) {
        return warning._apiData.alert_id;
      }

      // 其次检查alert_id字段（复判记录页面使用）
      if (warning.alert_id) {
        return warning.alert_id;
      }

      // 最后从id字段获取（warningManagement中已映射）
      if (warning.id) {
        return warning.id;
      }

      return '未知';
    },

    // 关闭对话框
    closeDialog() {
      this.dialogVisible = false;
      this.$emit('update:visible', false);
    },
    // 处理关闭对话框事件
    handleClose(done) {
      this.closeDialog();
      if (done) done();
    },

    // 处理还原复判
    async handleRestoreReview() {
      if (!this.internalWarning || !this.internalWarning.id) {
        this.$message.error('预警信息不完整');
        return;
      }

      try {
        await this.$confirm(
          '确定要还原此预警的复判结果吗？还原后该预警将重新进入预警管理页面等待处理。',
          '还原复判确认',
          {
            confirmButtonText: '确定还原',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );

        this.loading = true;

        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 800));

        // 创建要还原到预警管理页面的预警数据
        const restoredWarning = {
          id: this.internalWarning.id,
          type: this.internalWarning.type,
          device: this.internalWarning.device,
          deviceInfo: this.internalWarning.deviceInfo,
          location: this.internalWarning.location,
          time: this.internalWarning.time,
          level: this.internalWarning.level,
          imageUrl: this.internalWarning.imageUrl,
          description: this.internalWarning.description,
          status: 'pending', // 重新设置为待处理状态
          // 重置操作历史，只保留预警触发记录
          operationHistory: this.internalWarning.operationHistory ?
            this.internalWarning.operationHistory.filter(record => record.operationType === 'create') : []
        };

        // 触发还原事件，通知父组件将预警添加到预警管理页面
        this.$emit('restore-review', restoredWarning);

        this.$message.success('预警已成功还原到预警管理页面');

        // 关闭详情对话框
        this.closeDialog();

      } catch (error) {
        if (error !== 'cancel') {
          console.error('还原复判失败:', error);
          this.$message.error('还原复判失败，请稍后重试');
        }
      } finally {
        this.loading = false;
      }
    },

    // 处理预警事件 - 复制预警管理页面的核心逻辑
    async handleWarningAction(action) {
      if (!this.internalWarning || !this.internalWarning.id) {
        this.$message.error('预警信息不完整');
        return;
      }

      try {
        this.loading = true;
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));

        if (action === 'markProcessed') {
          // 标记为已处理
          this.warning.status = 'completed';
          this.$message.success('已标记为已处理');
          this.$emit('handle-warning', this.warning);
          // 不立即关闭对话框，让用户看到状态变化
        } else if (action === 'report') {
          // 上报
          this.reportWarningId = this.warning.id;
          this.reportDialogVisible = true;
          return; // 不关闭loading，等确认后再关闭
        } else if (action === 'archive') {
          // 归档 - 需要选择档案
          this.currentCameraId = this.warning.cameraId || 'camera_1';
          this.initArchiveSelection();
          this.archiveDialogVisible = true;
          return; // 不关闭loading，等确认后再关闭
        } else if (action === 'falseAlarm') {
          // 误报 - 已改为由父组件统一处理，这个分支不应该被执行
          console.warn('⚠️ handleWarningAction中的falseAlarm分支不应该被调用，请使用handleFalseAlarm方法');
          return;
        }
      } catch (error) {
        console.error('处理失败:', error);
        this.$message.error('处理预警失败');
      } finally {
        this.loading = false;
      }
    },

    // 处理预警
    handleWarning() {
      // 检查当前是否已经在处理中
      const hasProcessingRecord = this.operationHistory.some(record =>
        record.operationType === 'processing' && record.status === 'active'
      );

      if (hasProcessingRecord) {
        // 如果已经有处理中记录，直接弹出处理意见对话框
        this.remarkDialogVisible = true;
      } else {
        // 如果没有处理中记录，先添加"处理中"状态
        this.startProcessing();
      }
    },

    // 开始处理
    async startProcessing() {
      try {
        this.loading = true;

        console.log('🔄 开始处理预警:', this.warning.id);

        // 1. 先调用后端API更新状态为"处理中"
        const apiAlertId = this.warning._apiData ? this.warning._apiData.alert_id : this.warning.id;
        const updateData = {
          status: 2, // 处理中状态
          processing_notes: '开始处理预警',
          processed_by: this.getCurrentUserName()
        };

        // 发送真实的API请求
        const response = await alertAPI.updateAlertStatus(apiAlertId, updateData);
        console.log('✅ 后端状态更新成功:', response);

        // 2. 后端更新成功后，更新本地状态
        // 更新待处理记录为已完成状态
        this.operationHistory = this.operationHistory.map(record => {
          if (record.operationType === 'pending' && record.status === 'active') {
            return {
              ...record,
              status: 'completed',
              description: '预警已确认，开始处理'
            };
          }
          return record;
        });

        // 添加处理中记录
        const newRecord = {
          id: Date.now() + Math.random(),
          status: 'active',
          statusText: '处理中',
          time: this.getCurrentTime(),
          description: '处理人员正在处理此预警，可添加处理记录',
          operationType: 'processing',
          operator: this.getCurrentUserName()
        };

        this.operationHistory.unshift(newRecord);

        // 同步更新warning对象的操作历史
        if (this.warning && this.warning.operationHistory) {
          this.warning.operationHistory = this.warning.operationHistory.map(record => {
            if (record.operationType === 'pending' && record.status === 'active') {
              return {
                ...record,
                status: 'completed',
                description: '预警已确认，开始处理'
              };
            }
            return record;
          });

          this.warning.operationHistory.unshift(newRecord);
        }

        // 🔧 关键修复：更新 _apiData.status 字段为处理中
        if (this.warning._apiData) {
          this.warning._apiData.status = 2; // 处理中状态
        }

        console.log('✅ 开始处理，本地状态已更新为处理中');

        this.$message.success('预警已开始处理');

        // 3. 弹出处理意见对话框
        this.remarkDialogVisible = true;

      } catch (error) {
        console.error('❌ 开始处理预警失败:', error);
        this.$message.error('开始处理失败: ' + (error.message || (error.response && error.response.data && error.response.data.message) || '未知错误'));
      } finally {
        this.loading = false;
      }
    },

    // 保存处理意见（添加处理中记录）
    async saveRemark() {
      if (!this.remarkForm.remark.trim()) {
        this.$message.warning('请输入处理意见');
        return;
      }

      try {
        this.loading = true;

        // 调用后端API更新预警状态为处理中
        const apiAlertId = this.warning._apiData ? this.warning._apiData.alert_id : this.warning.id;
        const updateData = {
          status: 2, // 处理中状态
          processing_notes: this.remarkForm.remark,
          processed_by: this.getCurrentUserName()
        };

        console.log('确认处理 - 调用API:', apiAlertId, updateData);

        const response = await alertAPI.updateAlertStatus(apiAlertId, updateData);

        if (response.data && response.data.code === 0) {
          // API调用成功，添加本地操作记录
          this.addOperationRecord({
            status: 'completed',
            statusText: '处理中',
            time: this.getCurrentTime(),
            description: `处理意见：${this.remarkForm.remark}`,
            operationType: 'processing',
            operator: this.getCurrentUserName()
          });

          this.$message.success('确认处理成功，状态已更新为处理中');
          // 发出处理记录添加事件，传递action标识和API响应数据
          this.$emit('handle-warning', {
            ...this.warning,
            action: 'record-added',
            apiResponse: response.data.data
          });
          this.closeRemarkDialog();
        } else {
          throw new Error(response.data ? response.data.msg : '更新失败');
        }
      } catch (error) {
        console.error('确认处理失败:', error);
        this.$message.error(`确认处理失败: ${error.message || error}`);
      } finally {
        this.loading = false;
      }
    },

    // 结束处理
    async finishProcessing() {
      try {
        this.loading = true;

        // 调用后端API更新预警状态为已处理
        const apiAlertId = this.warning._apiData ? this.warning._apiData.alert_id : this.warning.id;
        const updateData = {
          status: 3, // 已处理状态
          processing_notes: this.remarkForm.remark ? `${this.remarkForm.remark}\n处理已完成` : '处理已完成',
          processed_by: this.getCurrentUserName()
        };

        console.log('结束处理 - 调用API:', apiAlertId, updateData);

        const response = await alertAPI.updateAlertStatus(apiAlertId, updateData);

        if (response.data && response.data.code === 0) {
          // API调用成功，添加本地操作记录
          this.addOperationRecord({
            status: 'completed',
            statusText: '已处理',
            time: this.getCurrentTime(),
            description: '预警处理已完成，可以进行后续操作',
            operationType: 'completed',
            operator: this.getCurrentUserName()
          });

          this.$message.success('处理已完成，现在可以进行归档等操作');
          // 发出完成处理事件，传递API响应数据
          this.$emit('handle-warning', {
            ...this.warning,
            action: 'finished',
            apiResponse: response.data.data
          });
          this.closeRemarkDialog();
        } else {
          throw new Error(response.data ? response.data.msg : '更新失败');
        }
      } catch (error) {
        console.error('结束处理失败:', error);
        this.$message.error(`结束处理失败: ${error.message || error}`);
      } finally {
        this.loading = false;
      }
    },

    // 关闭处理意见对话框
    closeRemarkDialog() {
      this.remarkDialogVisible = false;
      this.remarkForm = {
        remark: ''
      };
    },

    // 上报处理
    handleReport() {
      this.handleWarningAction('report');
    },
    // 归档处理
    handleArchive() {
      // 检查预警状态，只有已处理状态（status=3）才能归档
      const currentStatus = this.warning._apiData ? this.warning._apiData.status : null;

      if (currentStatus !== 3) {
        const statusNames = {
          1: '待处理',
          2: '处理中',
          3: '已处理',
          4: '已归档',
          5: '误报'
        };
        const currentStatusName = statusNames[currentStatus] || '未知状态';
        this.$message.warning(`只有已处理状态的预警才能归档，当前状态为：${currentStatusName}`);
        return;
      }

      // 不在详情组件内部处理，直接emit给父组件
      // 父组件会弹出归档选择对话框，走完整的归档流程
      this.$emit('handle-archive', this.warning);
      // 关闭详情对话框
      this.closeDialog();
    },
    // 误报处理 - 直接交给父组件处理（统一的误报流程）
    handleFalseAlarm() {
      // 不在详情组件内部处理，直接emit给父组件
      // 父组件会弹出输入对话框，走完整的误报流程
      this.$emit('handle-false-alarm', this.warning);
      // 关闭详情对话框
      this.closeDialog();
    },

    // 初始化归档选择
    initArchiveSelection() {
      // 自动选择默认档案（如果存在）
      if (this.defaultArchive) {
        this.selectedArchiveId = this.defaultArchive.id;
      } else {
        // 如果没有默认档案，则准备创建
        this.selectedArchiveId = '';
      }
    },

    // 确认上报
    async confirmReport() {
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));

        // 记录上报操作到历史
        this.addOperationRecord({
          status: 'completed',
          statusText: '预警上报',
          time: this.getCurrentTime(),
          description: '预警已上报给上级部门处理，等待上级部门响应',
          operationType: 'report',
          operator: this.getCurrentUserName()
        });

        this.$emit('handle-report', this.warning);
        this.closeReportDialog();
        // 不关闭详情对话框，让用户可以继续查看和操作
      } catch (error) {
        console.error('上报失败:', error);
        this.$message.error('上报失败');
      } finally {
        this.loading = false;
      }
    },

    // 关闭上报对话框
    closeReportDialog() {
      this.reportDialogVisible = false;
      this.reportWarningId = '';
    },

    // 确认归档
    async confirmArchive() {
      try {
        this.loading = true;

        let targetArchiveId = this.selectedArchiveId;
        let archiveName = '';
        let archiveLocation = '';

        // 如果没有选择档案，自动创建默认档案
        if (!targetArchiveId) {
          targetArchiveId = await this.createDefaultArchive();
          archiveName = '默认档案';
          archiveLocation = this.getCurrentCameraName();
        } else {
          // 🔧 修复：获取选中档案的名称和位置
          const selectedArchive = this.availableArchives.find(archive => archive.id === targetArchiveId);
          archiveName = selectedArchive ? selectedArchive.name : '未知档案';
          archiveLocation = selectedArchive ? selectedArchive.cameraName : '未知位置';
        }

        console.log('📍 选中的档案信息:', { targetArchiveId, archiveName, archiveLocation });

        if (!targetArchiveId) {
          this.$message.error('无法创建默认档案');
          return;
        }

        // 获取预警ID
        const alertId = this.warning._apiData ? this.warning._apiData.alert_id : parseInt(this.warning.id);

        // 调用真实的归档API
        const { archiveAPI } = await import('../../service/VisionAIService.js');
        const response = await archiveAPI.linkAlertsToArchive(
          targetArchiveId,
          [alertId],
          `预警详情页面归档 - 预警类型: ${this.warning.type || this.warning.alert_type}`
        );

        console.log('📤 归档API响应:', response.data);

        if (response.data && response.data.code === 0) {
          // 🔧 修复：记录归档操作到历史，包含位置信息
          this.addOperationRecord({
            status: 'completed',
            statusText: '预警归档',
            time: this.getCurrentTime(),
            description: `预警已归档到：${archiveName}（${archiveLocation}），可在预警档案中查看`,
            operationType: 'archive',
            operator: this.getCurrentUserName(),
            archiveInfo: {
              archiveId: targetArchiveId,
              archiveName: archiveName,
              location: archiveLocation // 🔧 添加位置信息
            }
          });

          this.$message.success('预警已成功归档');
          console.log('✅ 预警详情页面 - 预警归档成功:', alertId, '档案ID:', targetArchiveId);

          this.$emit('handle-archive', this.warning);
          this.closeArchiveDialog();
          // 不关闭详情对话框，让用户可以继续查看操作历史
        } else {
          const errorMessage = (response.data && response.data.message) || '归档失败';
          this.$message.error(errorMessage);
          console.warn('⚠️ 预警详情页面 - 预警归档失败:', response.data);
        }
      } catch (error) {
        console.error('❌ 预警详情页面 - 预警归档异常:', error);
        this.$message.error('归档失败: ' + (error.message || '未知错误'));
      } finally {
        this.loading = false;
      }
    },

    // 关闭归档对话框
    closeArchiveDialog() {
      this.archiveDialogVisible = false;
      this.selectedArchiveId = '';
    },

    // 自动创建默认档案
    async createDefaultArchive() {
      try {
        const { archiveAPI } = await import('../../service/VisionAIService.js');
        const now = new Date();
        const startTime = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endTime = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

        const archiveName = `${this.getCurrentCameraName() || '未知设备'}默认档案`;

        const response = await archiveAPI.createArchive({
          name: archiveName,
          location: this.getCurrentCameraName() || '未知位置',
          description: '系统自动创建的默认档案',
          start_time: startTime,
          end_time: endTime,
          created_by: this.getCurrentUserName()
        });

        if (response.data && (response.data.archive_id || response.data.id)) {
          const newArchive = {
            id: response.data.archive_id || response.data.id,
            name: archiveName,
            cameraId: this.currentCameraId,
            cameraName: this.getCurrentCameraName(),
            isDefault: true,
            createTime: new Date().toLocaleString()
          };
          this.archivesList.push(newArchive);
          console.log('✅ 自动创建默认档案成功:', newArchive);
          return newArchive.id;
        } else {
          console.error('❌ 创建默认档案失败:', response.data);
          this.$message.error('创建默认档案失败');
          return null;
        }
      } catch (error) {
        console.error('❌ 创建默认档案异常:', error);
        this.$message.error('创建默认档案失败: ' + (error.message || '未知错误'));
        return null;
      }
    },

    // 获取当前摄像头名称
    getCurrentCameraName() {
      // 实际项目中应该从摄像头数据中获取
      const cameraNames = {
        'camera_1': '可燃气体监控点',
        'camera_2': '储罐区监控点',
        'camera_3': '管道接口监控点'
      };
      return cameraNames[this.currentCameraId] || '监控点';
    },

    // 获取当前时间
    getCurrentTime() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },

    // 获取当前用户昵称
    getCurrentUserName() {
      // 实际项目中应该从用户登录信息或Vuex store中获取
      // 这里模拟一些用户昵称
      const userNames = ['张工程师', '李主管', '王安全员', '赵技术员', '陈操作员'];
      const savedUserName = localStorage.getItem('currentUserName');

      if (savedUserName) {
        return savedUserName;
      } else {
        // 如果没有保存的用户名，随机选择一个并保存
        const randomName = userNames[Math.floor(Math.random() * userNames.length)];
        localStorage.setItem('currentUserName', randomName);
        return randomName;
      }
    },

    // 获取当前时间
    getCurrentTime() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },

    // 给时间添加指定秒数
    addSecondsToTime(timeString, seconds) {
      try {
        let date;
        if (timeString.includes('T')) {
          date = new Date(timeString);
        } else if (timeString.includes(' ')) {
          date = new Date(timeString);
        } else {
          date = new Date();
        }

        if (isNaN(date.getTime())) {
          return timeString;
        }

        date.setSeconds(date.getSeconds() + seconds);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const secs = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${secs}`;
      } catch (error) {
        return timeString;
      }
    },

    // 格式化API时间
    formatApiTime(timeString) {
      try {
        if (!timeString) {
          return this.getCurrentTime();
        }

        // 处理不同的时间格式
        let date;
        if (timeString.includes('T')) {
          // ISO格式: "2025-06-30T17:05:35"
          date = new Date(timeString);
        } else if (timeString.includes(' ')) {
          // 标准格式 YYYY-MM-DD HH:mm:ss
          date = new Date(timeString);
        } else {
          // 其他格式
          date = new Date(timeString);
        }

        if (isNaN(date.getTime())) {
          return timeString; // 如果解析失败，返回原字符串
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      } catch (error) {
        return timeString || this.getCurrentTime();
      }
    },

    // 注意：误报处理已统一由父组件处理
    // handleFalseAlarmArchive 和 saveToReviewRecords 方法已删除
    // 误报流程：点击误报按钮 → emit事件给父组件 → 父组件弹出输入对话框 → 完整的误报处理流程

    // 获取预警等级文字
    getWarningLevelText(level) {
      // 如果已经是中文格式，直接返回等级部分
      if (level && level.includes('预警')) {
        return level.replace('预警', '');
      }

      // 如果是英文格式，转换为中文
      const levelMap = {
        'level1': '一级',
        'level2': '二级',
        'level3': '三级',
        'level4': '四级'
      };
      return levelMap[level] || '未知';
    },
    // 获取预警图标
    getWarningIcon(level) {
      // 如果是中文格式，转换为对应图标
      if (level && level.includes('预警')) {
        const chineseIconMap = {
          '一级预警': 'el-icon-warning',
          '二级预警': 'el-icon-warning-outline',
          '三级预警': 'el-icon-warning-outline',
          '四级预警': 'el-icon-warning-outline'
        };
        return chineseIconMap[level] || 'el-icon-warning';
      }

      // 如果是英文格式，使用原有映射
      const iconMap = {
        'level1': 'el-icon-warning',
        'level2': 'el-icon-warning-outline',
        'level3': 'el-icon-warning-outline',
        'level4': 'el-icon-warning-outline'
      };
      return iconMap[level] || 'el-icon-warning';
    },
    // 获取预警等级颜色
    getWarningLevelColor(level) {
      // 如果是中文格式，转换为对应颜色
      if (level && level.includes('预警')) {
        const chineseColorMap = {
          '一级预警': '#f56c6c',
          '二级预警': '#e6a23c',
          '三级预警': '#409EFF',
          '四级预警': '#67c23a'
        };
        return chineseColorMap[level] || '#f56c6c';
      }

      // 如果是英文格式，使用原有映射
      const colorMap = {
        'level1': '#f56c6c',
        'level2': '#e6a23c',
        'level3': '#409EFF',
        'level4': '#67c23a'
      };
      return colorMap[level] || '#f56c6c';
    },
    // 获取预警等级CSS类名
    getWarningLevelClass(level) {
      // 如果是中文格式，转换为对应类名
      if (level && level.includes('预警')) {
        const chineseClassMap = {
          '一级预警': 'level1-tag',
          '二级预警': 'level2-tag',
          '三级预警': 'level3-tag',
          '四级预警': 'level4-tag'
        };
        return chineseClassMap[level] || 'level1-tag';
      }

      // 如果是英文格式，使用原有映射
      const classMap = {
        'level1': 'level1-tag',
        'level2': 'level2-tag',
        'level3': 'level3-tag',
        'level4': 'level4-tag'
      };
      return classMap[level] || 'level1-tag';
    },
    // 获取预警类型文字
    getWarningTypeText(type) {
      // 直接返回原始类型，不再进行映射转换
      return type || '未知类型';
    },
    // 初始化操作历史
    initOperationHistory() {
      if (!this.internalWarning) return;

      // 重置操作历史
      this.operationHistory = [];

      // 如果预警有保存的操作历史，则直接加载
      if (this.internalWarning.operationHistory && Array.isArray(this.internalWarning.operationHistory) && this.internalWarning.operationHistory.length > 0) {
        this.operationHistory = [...this.internalWarning.operationHistory];
        return;
      }

      // 如果是通过API获取的数据，处理API中的process信息
      if (this.internalWarning._apiData && this.internalWarning._apiData.process) {
        this.processApiOperationHistory();
        return;
      }

      // 如果没有操作历史，则创建默认的初始记录
      // 预警产生时状态就是"待处理"，不需要单独的待处理记录
      this.addOperationRecord({
        status: 'active',
        statusText: '待处理',
        time: this.internalWarning.time || this.getCurrentTime(),
        description: `${this.internalWarning.type || '系统检测'}：${this.internalWarning.description || '检测到异常情况，等待处理人员确认'}`,
        operationType: 'pending',
        operator: '系统'
      });
    },

    // 处理API中的process信息转换为操作历史
    processApiOperationHistory() {
      const processData = this.internalWarning._apiData.process;

      // 收集所有记录
      const allRecords = [];

      // 处理API步骤
      if (processData.steps && Array.isArray(processData.steps)) {
        processData.steps.forEach(step => {
          const record = {
            id: Date.now() + Math.random(),
            status: 'completed',
            statusText: step.step || '处理步骤',
            time: this.formatApiTime(step.time),
            description: step.desc || '处理描述',
            operationType: step.step === '预警产生' ? 'create' : 'process',
            operator: step.operator || '系统'
          };
          allRecords.push(record);
        });
      }

      // 根据预警状态添加当前状态记录
      const status = this.internalWarning.status;
      if (status === 'pending') {
        const pendingRecord = {
          id: Date.now() + Math.random(),
          status: 'active',
          statusText: '待处理',
          time: this.internalWarning.createdAt || this.getCurrentTime(),
          description: '预警已产生，等待处理人员确认并开始处理',
          operationType: 'pending',
          operator: ''
        };
        allRecords.push(pendingRecord);
      } else if (status === 'processing') {
        const processingRecord = {
          id: Date.now() + Math.random(),
          status: 'active',
          statusText: '处理中',
          time: this.internalWarning.updatedAt || this.getCurrentTime(),
          description: '预警正在处理中，处理人员：' + (this.internalWarning.processedBy || '未知'),
          operationType: 'processing',
          operator: this.internalWarning.processedBy || '处理人员'
        };
        allRecords.push(processingRecord);
      } else if (status === 'completed') {
        const completedRecord = {
          id: Date.now() + Math.random(),
          status: 'completed',
          statusText: '已处理',
          time: this.internalWarning.processedAt || this.getCurrentTime(),
          description: '预警处理已完成。' + (this.internalWarning.remark || ''),
          operationType: 'completed',
          operator: this.internalWarning.processedBy || '处理人员'
        };
        allRecords.push(completedRecord);
      }

      // 按时间排序（时间早的在后面，晚的在前面，因为时间轴显示是最新的在上面）
      allRecords.sort((a, b) => {
        const timeA = new Date(a.time).getTime();
        const timeB = new Date(b.time).getTime();
        return timeB - timeA; // 降序排列，最新的在前面
      });

      // 添加到操作历史
      this.operationHistory = allRecords;

      // 更新预警对象的操作历史
      if (this.internalWarning) {
        if (!this.internalWarning.operationHistory) {
          this.$set(this.internalWarning, 'operationHistory', []);
        }
        this.internalWarning.operationHistory = [...allRecords];
      }

      // 如果有备注信息，添加到描述中
      if (processData.remark && this.operationHistory.length > 0) {
        const lastRecord = this.operationHistory[0];
        if (lastRecord) {
          lastRecord.description += ' 备注：' + processData.remark;
        }
      }
    },

    // 添加操作记录到历史
    addOperationRecord(record) {
      // 确保记录包含必要字段
      const newRecord = {
        id: Date.now() + Math.random(), // 唯一ID
        status: record.status || 'completed',
        statusText: record.statusText || '操作',
        time: record.time || this.getCurrentTime(),
        description: record.description || '操作完成',
        operationType: record.operationType || 'custom',
        operator: record.operator || this.getCurrentUserName(),
        ...record
      };

      // 添加到历史记录开头（最新的在上面）
      this.operationHistory.unshift(newRecord);

      // 更新预警对象的操作历史
      if (this.internalWarning) {
        if (!this.internalWarning.operationHistory) {
          this.$set(this.internalWarning, 'operationHistory', []);
        }
        this.internalWarning.operationHistory.unshift(newRecord);
      }
    },

    // 检查处理按钮是否应该禁用
    isProcessingDisabled() {
      if (!this.internalWarning || !this.internalWarning.operationHistory || this.internalWarning.operationHistory.length === 0) {
        return false; // 没有历史记录，可以处理
      }

      // 如果已归档，禁用处理按钮
      const hasArchived = this.internalWarning.operationHistory.some(record =>
        record.operationType === 'archive' || record.operationType === 'falseAlarm'
      ) || this.internalWarning.status === 'archived';

      if (hasArchived) {
        return true;
      }

      // 如果已完成处理，禁用处理按钮
      const hasCompletedProcessing = this.internalWarning.operationHistory.some(record =>
        record.operationType === 'completed'
      );

      return hasCompletedProcessing;
    },

    // 检查误报按钮是否应该禁用（只有待处理状态才能点击误报）
    isFalseAlarmDisabled() {
      // 如果没有预警数据，禁用
      if (!this.internalWarning) {
        return true;
      }

      // 检查是否有API数据和状态信息
      if (this.internalWarning._apiData && typeof this.internalWarning._apiData.status !== 'undefined') {
        // 只有状态为1（待处理）时才能点击误报
        // 状态定义：1-待处理(允许) 2-处理中(禁用) 3-已处理(禁用) 4-已归档(禁用) 5-误报(禁用)
        const status = this.internalWarning._apiData.status;
        console.log('🔍 检查误报按钮状态 - API status:', status, '是否禁用:', status !== 1);
        return status !== 1;
      }

      // 如果没有API数据，检查operationHistory
      // 如果已经有误报或归档记录，也禁用
      if (this.internalWarning.operationHistory && this.internalWarning.operationHistory.length > 0) {
        const hasArchived = this.internalWarning.operationHistory.some(record =>
          record.operationType === 'archive' || record.operationType === 'falseAlarm'
        ) || this.internalWarning.status === 'archived';

        if (hasArchived) {
          console.log('🔍 检查误报按钮状态 - 已归档或误报，禁用按钮');
          return true;
        }

        // 如果有处理中或已处理记录，也禁用
        const hasProcessing = this.internalWarning.operationHistory.some(record =>
          record.operationType === 'processing' || record.operationType === 'completed'
        );

        if (hasProcessing) {
          console.log('🔍 检查误报按钮状态 - 处理中或已完成，禁用按钮');
          return true;
        }
      }

      // 默认不禁用（允许操作）
      console.log('🔍 检查误报按钮状态 - 待处理状态，允许点击');
      return false;
    },

    // 检查归档按钮是否应该禁用（只有已处理状态才能归档）
    isArchiveDisabled() {
      // 如果没有预警数据，禁用
      if (!this.internalWarning) {
        return true;
      }

      // 检查是否有API数据和状态信息
      if (this.internalWarning._apiData && typeof this.internalWarning._apiData.status !== 'undefined') {
        const status = this.internalWarning._apiData.status;
        // 只有状态为3（已处理）时才能归档
        // 状态定义：1-待处理(禁用) 2-处理中(禁用) 3-已处理(允许) 4-已归档(禁用) 5-误报(禁用)
        if (status !== 3) {
          console.log('🔍 检查归档按钮状态 - API status:', status, '禁用按钮');
          return true;
        }
        console.log('🔍 检查归档按钮状态 - 已处理状态，允许归档');
        return false;
      }

      // 如果没有API数据，检查operationHistory
      if (this.internalWarning.operationHistory && this.internalWarning.operationHistory.length > 0) {
        // 检查是否有已完成处理的记录
        const hasCompletedProcessing = this.internalWarning.operationHistory.some(record =>
          record.operationType === 'completed'
        );

        if (!hasCompletedProcessing) {
          console.log('🔍 检查归档按钮状态 - 未完成处理，禁用按钮');
          return true;
        }

        // 检查是否已归档或误报
        const hasArchived = this.internalWarning.operationHistory.some(record =>
          record.operationType === 'archive' || record.operationType === 'falseAlarm'
        ) || this.internalWarning.status === 'archived';

        if (hasArchived) {
          console.log('🔍 检查归档按钮状态 - 已归档或误报，禁用按钮');
          return true;
        }

        console.log('🔍 检查归档按钮状态 - 已完成处理，允许归档');
        return false;
      }

      // 默认禁用（未处理完成）
      console.log('🔍 检查归档按钮状态 - 默认禁用');
      return true;
    },

    // 格式化时间
    formatTime(timeString) {
      try {
        if (!timeString) {
          return '时间未知';
        }

        // 如果是完整的时间字符串，格式化为更友好的显示
        if (timeString.includes(' ')) {
          const [date, time] = timeString.split(' ');
          let year, month, day;

          // 处理不同的日期分隔符
          if (date.includes('-')) {
            // YYYY-MM-DD 格式
            [year, month, day] = date.split('-');
          } else if (date.includes('/')) {
            // YYYY/MM/DD 格式
            [year, month, day] = date.split('/');
          } else {
            return timeString;
          }

          // 确保年月日都有值
          if (year && month && day) {
            return `${year}年${month}月${day}日 ${time}`;
          } else {
            return timeString;
          }
        }

        return timeString;
      } catch (error) {
        return timeString || '时间解析失败';
      }
    },
    // 获取复判分类文字
    getReviewClassificationText(type) {
      const typeMap = {
        'manual': '人工审核',
        'auto': '多模态大模型复判'
      };
      return typeMap[type] || '未知复判方式';
    },

    // ==================== 简单图片查看器相关方法 ====================

    // 打开图片查看器
    openImageViewer() {
      if (this.internalWarning && this.internalWarning.imageUrl) {
        this.imageViewerVisible = true;
      } else {
        this.$message.warning('暂无违规截图');
      }
    },

    // 关闭图片查看器
    closeImageViewer() {
      this.imageViewerVisible = false;
    },

    // 处理键盘事件
    handleKeydown(event) {
      if (event.key === 'Escape') {
        if (this.imageViewerVisible) {
          this.closeImageViewer();
        } else if (this.videoViewerVisible) {
          this.closeVideoViewer();
        }
      }
    },

    // ==================== 视频播放器相关方法 ====================

          // 打开视频播放器
      openVideoViewer() {
        console.log('打开视频播放器');
        console.log('预警数据:', this.internalWarning);
        console.log('视频URL:', this.internalWarning ? this.internalWarning.minio_video_url || this.internalWarning.videoUrl : 'null');

        this.resetVideoPlayer();
        // 重置视频显示模式为默认的cover模式（无黑边）
        this.videoFitMode = 'cover';
        this.videoViewerVisible = true;
        // 延迟一下确保DOM已渲染
        this.$nextTick(() => {
          if (this.$refs.videoPlayer) {
            console.log('视频元素已创建，初始化视频');
            this.initializeVideo();
          } else {
            console.warn('视频元素未找到');
          }
        });
      },

      // 关闭视频播放器
      closeVideoViewer() {
        this.videoViewerVisible = false;
        this.resetVideoPlayer();
        // 停止视频播放
        if (this.$refs.videoPlayer) {
          this.$refs.videoPlayer.pause();
          this.$refs.videoPlayer.currentTime = 0;
        }
      },

      // 重置视频播放器状态
      resetVideoPlayer() {
        // 使用浏览器自带控制条，不需要手动管理播放状态
      },

              // 初始化视频
        initializeVideo() {
          const video = this.$refs.videoPlayer;
          if (video) {
            // 尝试加载视频
            video.load();
          }
        },

          // 视频加载完成
      onVideoLoaded() {
        const video = this.$refs.videoPlayer;
        if (video && video.duration) {
          console.log('视频加载完成，时长:', this.formatVideoTime(video.duration));
        }
      },

      // 视频时间更新（保留用于调试）
      onVideoTimeUpdate() {
        // 使用浏览器自带控制条，不需要手动同步进度
      },

              // 视频播放结束
        onVideoEnded() {
          console.log('视频播放结束');
        },

        // 切换视频显示模式
        toggleVideoFitMode() {
          this.videoFitMode = this.videoFitMode === 'cover' ? 'contain' : 'cover';
          const modeName = this.videoFitMode === 'cover' ? '填满显示(无黑边)' : '完整显示(可能有黑边)';
          this.$message.success(`已切换到${modeName}模式`);
        },

      // 格式化时间 (秒转为 MM:SS 格式)
      formatVideoTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '00:00';

        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      },

         // 下载视频
     downloadVideo() {
       // 实际项目中这里应该提供真实的视频下载链接
       if (this.internalWarning && this.internalWarning.minio_video_url) {
         window.open(this.internalWarning.minio_video_url, '_blank');
       } else {
         this.$message.warning('暂无视频下载链接');
       }
     }
   },

   // 组件销毁时清理定时器
   beforeDestroy() {
     if (this.videoTimer) {
       clearInterval(this.videoTimer);
     }
     // 清理全局事件监听
     document.removeEventListener('mousemove', this.onDrag);
     document.removeEventListener('mouseup', this.endDrag);
   }
 }
</script>

<style scoped>
/* 预警详情容器 */
.warning-detail-container {
  padding: 0;
}

/* 预警详情头部 */
.warning-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

/* 预警等级标签 - 科技感样式（参考摄像头页面状态标签） */
.warning-level-badge {
  display: inline-block;
  padding: 0 12px !important;
  height: 32px !important;
  line-height: 30px !important;
  font-size: 14px !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  transition: all 0.3s ease !important;
  border: 1px solid !important;
  text-transform: uppercase !important;
  letter-spacing: 0.5px !important;
}

.warning-level-badge:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

/* 一级预警 - 危险红色渐变 */
.warning-level-badge.level1-tag {
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%) !important;
  color: #991b1b !important;
  border-color: #fca5a5 !important;
}

/* 二级预警 - 警告橙色渐变 */
.warning-level-badge.level2-tag {
  background: linear-gradient(135deg, #fffbeb 0%, #fed7aa 100%) !important;
  color: #92400e !important;
  border-color: #fbbf24 !important;
}

/* 三级预警 - 信息蓝色渐变 */
.warning-level-badge.level3-tag {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  color: #1e40af !important;
  border-color: #93c5fd !important;
}

/* 四级预警 - 成功绿色渐变 */
.warning-level-badge.level4-tag {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%) !important;
  color: #065f46 !important;
  border-color: #a7f3d0 !important;
}

.warning-detail-time {
  font-size: 14px;
  color: #606266;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  padding: 6px 12px;
  border-radius: 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.warning-detail-time i {
  margin-right: 6px;
  color: #409EFF;
}

/* 主要内容区域 */
.warning-detail-main {
  display: flex;
  gap: 24px;
  padding: 0 4px;
  align-items: stretch;
}

/* 左侧内容 */
.warning-left-content {
  flex: 2;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* 右侧内容 */
.warning-right-content {
  flex: 1;
  min-width: 280px;
  display: flex;
  flex-direction: column;
}

/* 复判记录页面：左侧内容占据全部宽度 */
.warning-detail-main:not(:has(.warning-right-content)) .warning-left-content {
  flex: 1;
  max-width: 100%;
}

/* 预警信息样式 */
.warning-detail-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

/* 信息卡片样式 */
.info-card {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  transition: all 0.3s ease;
}

.info-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #c6e2ff;
}

/* 卡片标题 */
.card-title {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
}

.card-title i {
  margin-right: 8px;
  color: #409EFF;
  font-size: 16px;
}

/* 网格布局 */
.info-grid {
  padding: 16px;
}

.info-row {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-cell .label {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-cell .value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  background: #f8f9fa;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  transition: all 0.2s ease;
}

.info-cell .value:hover {
  background: #ecf5ff;
  border-color: #c6e2ff;
}

/* 全宽单元格 */
.info-cell.full-width {
  flex: 1 1 100%;
  width: 100%;
}

/* 预警ID特殊样式 */
.info-cell .value.alert-id {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  color: white;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
  border: none;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
  text-align: center;
  font-size: 13px;
}

.info-cell .value.alert-id:hover {
  background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4);
  transform: translateY(-1px);
}

/* 复判意见样式 */
.info-cell .value.review-notes {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #fbbf24;
  color: #78350f;
  font-weight: 500;
  padding: 12px 16px;
  border-radius: 8px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.15);
  font-size: 13px;
  min-height: 40px;
}

.info-cell .value.review-notes:hover {
  background: linear-gradient(135deg, #fde68a 0%, #fcd34d 100%);
  border-color: #f59e0b;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.25);
}

/* 复判分类科技感样式 - 渐变字体颜色，统一背景 */
.info-cell .value.review-classification {
  font-weight: 700;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  background: #f8f9fa;
  font-size: 14px;
  letter-spacing: 0.5px;
  position: relative;
  transition: all 0.3s ease;
  display: inline-block;
  min-width: 120px;
  text-align: center;
  text-transform: uppercase;
}

/* 多模态大模型复判 - 蓝紫科技渐变字体 */
.info-cell .value.review-auto {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  border-color: rgba(102, 126, 234, 0.3);
  box-shadow: 0 0 0 1px rgba(102, 126, 234, 0.1);
}

.info-cell .value.review-auto:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  border-color: rgba(102, 126, 234, 0.5);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
  transform: translateY(-1px);
}

/* 人工审核 - 青绿科技渐变字体 */
.info-cell .value.review-manual {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  border-color: rgba(17, 153, 142, 0.3);
  box-shadow: 0 0 0 1px rgba(17, 153, 142, 0.1);
}

.info-cell .value.review-manual:hover {
  background: linear-gradient(135deg, #38ef7d 0%, #11998e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  border-color: rgba(17, 153, 142, 0.5);
  box-shadow: 0 2px 8px rgba(17, 153, 142, 0.2);
  transform: translateY(-1px);
}

/* 还原复判按钮样式 */
.restore-review-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  cursor: pointer;
  margin-left: 8px;
  font-size: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(245, 87, 108, 0.2);
  position: relative;
  top: -1px;
}

.restore-review-btn:hover {
  background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
  transform: scale(1.1) rotate(-5deg);
  box-shadow: 0 4px 8px rgba(245, 87, 108, 0.3);
}

.restore-review-btn:active {
  transform: scale(0.95);
}

.restore-review-btn i {
  font-size: 10px;
  line-height: 1;
}

/* 内容布局 */
.info-content {
  padding: 16px;
}

.info-text .label {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  display: block;
}

.description-content {
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
  background: #f8f9fa;
  padding: 12px 16px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  margin: 0;
  white-space: pre-wrap;
}

/* 媒体内容样式 */
.warning-media {
  display: flex;
  gap: 16px;
  flex: 1;
}

.warning-image,
.warning-video-clip {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.media-title {
  font-size: 14px;
  margin: 0 0 12px;
  color: #303133;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.media-title i {
  margin-right: 6px;
  color: #409EFF;
}

.image-container,
.video-container {
  position: relative;
  height: 0;
  padding-bottom: 65%;
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.image-container:hover,
.video-container:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.real-image,
.placeholder-image,
.placeholder-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(45deg, #1e3c72, #2a5298);
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.real-image {
  background: transparent;
  padding: 0;
  overflow: hidden;
}

.real-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  border-radius: 8px;
  transition: transform 0.3s ease;
}

.real-image:hover img {
  transform: scale(1.05);
}

.placeholder-image i,
.placeholder-video i {
  font-size: 36px;
  margin-bottom: 12px;
  opacity: 0.8;
}

.placeholder-image i {
  color: #f56c6c;
  animation: pulse 1.5s infinite;
}

.placeholder-video i {
  color: #409EFF;
}

/* 媒体覆盖层样式 */
.media-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;
  color: white;
  font-size: 14px;
  z-index: 1;
}

.image-container:hover .media-overlay,
.video-container:hover .media-overlay {
  opacity: 1;
}

.media-overlay i {
  font-size: 48px;
  margin-bottom: 12px;
  color: white !important;
  animation: none;
}

.media-overlay span {
  color: white;
  font-weight: 500;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

/* 处理进展时间线样式 */
.process-timeline {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 12px;
  border: 1px solid #ebeef5;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  /* 固定高度，与左侧内容区域高度保持一致 */
  height: 580px;
  max-height: 580px;
  display: flex;
  flex-direction: column;
}

.timeline-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  padding: 16px 20px;
  background: linear-gradient(135deg, #409EFF 0%, #36a3f7 100%);
  color: white;
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  /* 固定标题高度，不参与滚动 */
  flex-shrink: 0;
  height: 55px;
  box-sizing: border-box;
}

.timeline-title i {
  margin-right: 8px;
  font-size: 16px;
}

.timeline-container {
  padding: 16px 20px 20px;
  position: relative;
  /* 设置滚动容器，占用剩余空间 */
  flex: 1;
  overflow-y: auto;
  /* 限制最大高度，确保滚动正常工作 */
  max-height: 525px;
  /* 美化滚动条 */
  scrollbar-width: thin;
  scrollbar-color: #c0c4cc #f5f7fa;
}

/* Webkit浏览器滚动条样式 */
.timeline-container::-webkit-scrollbar {
  width: 6px;
}

.timeline-container::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 3px;
}

.timeline-container::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
  transition: background 0.3s ease;
}

.timeline-container::-webkit-scrollbar-thumb:hover {
  background: #a6a9ad;
}

.timeline-item {
  position: relative;
  padding-left: 24px;
  margin-bottom: 20px;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 20px;
  bottom: -20px;
  width: 2px;
  background: linear-gradient(to bottom, #e4e7ed, #f5f7fa);
}

.timeline-item:last-child::before {
  display: none;
}

.timeline-dot {
  position: absolute;
  left: 0;
  top: 6px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #e4e7ed;
  background: #e4e7ed;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  z-index: 2;
  transition: all 0.3s ease;
}

/* 所有历史时间线项目（除第一个外）使用灰色样式 */
.timeline-container .timeline-item:not(:first-child) .timeline-dot {
  border-color: #e4e7ed !important;
  background: #e4e7ed !important;
  box-shadow: 0 2px 6px rgba(228, 231, 237, 0.3) !important;
  animation: none !important;
}

.timeline-container .timeline-item:not(:first-child) .timeline-content {
  background: #fafbfc !important;
  border-color: #f0f2f5 !important;
}

.timeline-container .timeline-item:not(:first-child) .timeline-status {
  color: #909399 !important;
}

.timeline-container .timeline-item:not(:first-child) .timeline-time {
  color: #c0c4cc !important;
}

.timeline-container .timeline-item:not(:first-child) .timeline-desc {
  color: #c0c4cc !important;
}

.timeline-container .timeline-item:not(:first-child) .timeline-operator {
  color: #c0c4cc !important;
  background: rgba(192, 196, 204, 0.1) !important;
}

/* 所有历史时间线项目的左边框都显示为灰色 */
.timeline-container .timeline-item:not(:first-child) .timeline-content::before {
  background: #e4e7ed !important;
}

/* 最新的时间线项目（第一个）使用动态蓝色圆点 - 优先级最高 */
.timeline-container .timeline-item:first-child .timeline-dot {
  border-color: #409EFF !important;
  background: #409EFF !important;
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2), 0 2px 6px rgba(64, 158, 255, 0.3) !important;
  animation: pulse-latest 2s infinite !important;
}

/* 最新圆点的动态效果 */
@keyframes pulse-latest {
  0% {
    box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2), 0 2px 6px rgba(64, 158, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(64, 158, 255, 0.1), 0 2px 6px rgba(64, 158, 255, 0.3);
  }
  100% {
    box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2), 0 2px 6px rgba(64, 158, 255, 0.3);
  }
}

/* 移除原有的active和completed状态样式，避免干扰圆点颜色 */
/* .timeline-item.active .timeline-dot {
  border-color: #409EFF;
  background: #409EFF;
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1);
  animation: pulse-dot 2s infinite;
}

.timeline-item.completed .timeline-dot {
  border-color: #67c23a;
  background: #67c23a;
  box-shadow: 0 2px 6px rgba(103, 194, 58, 0.3);
} */

.timeline-content {
  margin-left: 4px;
  background: #ffffff;
  border-radius: 8px;
  padding: 12px 16px;
  border: 1px solid #f0f2f5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  position: relative;
}

/* 为不同操作类型添加左边框颜色 */
.timeline-content::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 0 8px 8px 0;
}

/* 预警产生 */
.timeline-item[data-type="create"] .timeline-content::before {
  background: #909399;
}

/* 处理中（初始状态） */
.timeline-item[data-type="processing"] .timeline-content::before {
  background: #409EFF;
}

/* 处理中（操作记录） */
.timeline-item[data-type="processing-action"] .timeline-content::before {
  background: #409EFF;
}

/* 已处理 */
.timeline-item[data-type="completed"] .timeline-content::before {
  background: #67c23a;
}

/* 上报 */
.timeline-item[data-type="report"] .timeline-content::before {
  background: #e6a23c;
}

/* 归档 */
.timeline-item[data-type="archive"] .timeline-content::before {
  background: #f56c6c;
}

/* 误报 */
.timeline-item[data-type="falseAlarm"] .timeline-content::before {
  background: #909399;
}

/* 待处理 */
.timeline-item[data-type="pending"] .timeline-content::before {
  background: #909399;
}

/* 复判相关操作 */
.timeline-item[data-type="review_completed"] .timeline-content::before {
  background: #67c23a;
}

.timeline-item[data-type="review_start"] .timeline-content::before {
  background: #409EFF;
}

.timeline-item.active .timeline-content {
  border-color: #409EFF;
  background: linear-gradient(135deg, #ecf5ff 0%, #f0f9ff 100%);
  box-shadow: 0 3px 12px rgba(64, 158, 255, 0.1);
}

.timeline-item.completed .timeline-content {
  border-color: #f0f9ff;
  background: #fafbfc;
}

.timeline-status {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timeline-operator {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
  background: rgba(144, 147, 153, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: 8px;
}

.timeline-item.active .timeline-status {
  color: #409EFF;
}

.timeline-item.completed .timeline-status {
  color: #67c23a;
}

.timeline-time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
  font-family: 'Monaco', 'Consolas', monospace;
  min-height: 16px; /* 确保即使没有时间也保持高度 */
}

.timeline-time:empty::before {
  content: '待确定';
  color: #c0c4cc;
  font-style: italic;
}

.timeline-item.active .timeline-time {
  color: #409EFF;
}

.timeline-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  word-break: break-all;
}

.timeline-item.active .timeline-desc {
  color: #409EFF;
  font-weight: 500;
}

/* 为未来步骤添加特殊样式 */
.timeline-item.future {
  opacity: 0.7;
}

.timeline-item.future .timeline-dot {
  border-color: #e4e7ed;
  background: #f5f7fa;
}

.timeline-item.future .timeline-content {
  background: #fafbfc;
  border-color: #f0f2f5;
}

.timeline-item.future .timeline-status {
  color: #c0c4cc;
}

.timeline-item.future .timeline-desc {
  color: #c0c4cc;
}

/* 底部按钮样式 - 移除背景色和边框 */
.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 16px 20px;
  background: transparent !important;
  border-top: none !important;
  border: none !important;
  box-shadow: none !important;
}

.action-btn {
  padding: 8px 20px;
  font-size: 14px;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.action-btn i {
  margin-right: 6px;
}

.report-btn {
  background-color: transparent;
  border-color: #d1d5db;
  color: #4b5563;
}

.report-btn:hover {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  border-color: #3b82f6;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.archive-btn {
  background-color: transparent;
  border-color: #d1d5db;
  color: #4b5563;
}

.archive-btn:hover {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  border-color: #3b82f6;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.false-alarm-btn {
  background-color: transparent;
  border-color: #d1d5db;
  color: #4b5563;
}

.false-alarm-btn:hover {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  border-color: #3b82f6;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* 处理按钮 - 科技感蓝色交互效果 */
.process-btn {
  background-color: transparent;
  border-color: #d1d5db;
  color: #4b5563;
}

.process-btn:hover {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  border-color: #3b82f6;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* 动画效果 */
@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pulse-dot {
  0% {
    box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(64, 158, 255, 0.1), 0 2px 6px rgba(0, 0, 0, 0.1);
  }
  100% {
    box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1);
  }
}

/* 对话框样式优化 - 科技感设计 */
.warning-detail-component >>> .el-dialog {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.warning-detail-component >>> .el-dialog__header {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid rgba(59, 130, 246, 0.1);
  padding: 16px 20px;
}

.warning-detail-component >>> .el-dialog__title {
  color: #1f2937;
  font-weight: 600;
}

.warning-detail-component >>> .el-dialog__close {
  color: #6b7280;
  transition: color 0.3s ease;
}

.warning-detail-component >>> .el-dialog__close:hover {
  color: #3b82f6;
}

.warning-detail-component >>> .el-dialog__body {
  padding: 20px;
  background: #ffffff;
}

.warning-detail-component >>> .el-button--primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  border: none;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;
  border-radius: 6px;
}

.warning-detail-component >>> .el-button--primary:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%);
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4);
  transform: translateY(-1px);
}

.warning-detail-component >>> .el-button--success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;
  border-radius: 6px;
}

.warning-detail-component >>> .el-button--success:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.4);
  transform: translateY(-1px);
}

.warning-detail-component >>> .el-button--default {
  background: white;
  border: 1px solid #d1d5db;
  color: #4b5563;
  transition: all 0.3s ease;
  border-radius: 6px;
}

.warning-detail-component >>> .el-button--default:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #3b82f6;
  color: #1e40af;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.warning-detail-component >>> .el-button--danger {
  background: linear-gradient(135deg, #f56c6c 0%, #dc2626 100%);
  border: none;
  box-shadow: 0 2px 6px rgba(245, 108, 108, 0.3);
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;
  border-radius: 6px;
}

.warning-detail-component >>> .el-button--danger:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  box-shadow: 0 4px 10px rgba(245, 108, 108, 0.4);
  transform: translateY(-1px);
}

.warning-detail-component >>> .el-button--warning {
  background: linear-gradient(135deg, #e6a23c 0%, #f59e0b 100%);
  border: none;
  box-shadow: 0 2px 6px rgba(230, 162, 60, 0.3);
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;
  border-radius: 6px;
}

.warning-detail-component >>> .el-button--warning:hover {
  background: linear-gradient(135deg, #d97706 0%, #dc2626 100%);
  box-shadow: 0 4px 10px rgba(230, 162, 60, 0.4);
  transform: translateY(-1px);
}

/* 输入框和选择框样式优化 */
.warning-detail-component >>> .el-input__inner {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.warning-detail-component >>> .el-input__inner:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.warning-detail-component >>> .el-select .el-input__inner {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}

.warning-detail-component >>> .el-select .el-input__inner:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.warning-detail-component >>> .el-textarea__inner {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.warning-detail-component >>> .el-textarea__inner:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* 对话框内容样式 */
.confirm-content {
  text-align: center;
  padding: 20px 0;
}

.confirm-content p {
  margin: 8px 0;
  font-size: 14px;
  color: #606266;
}

/* 归档对话框样式 */
.archive-dialog-content {
  padding: 10px 0;
}

.archive-info {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.archive-selection {
  margin-bottom: 20px;
}

.archive-tip {
  margin-top: 15px;
}

.process-tip {
  margin-top: 10px;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  border-left: 3px solid #909399;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .warning-detail-main {
    flex-direction: column;
  }

  .warning-right-content {
    min-width: auto;
  }

  .warning-media {
    flex-direction: column;
  }

  .dialog-footer {
    flex-wrap: wrap;
    justify-content: center;
  }

  .action-btn {
    margin: 4px;
  }

  /* 移动端信息卡片调整 */
  .info-row {
    flex-direction: column;
    gap: 12px;
  }

  .info-grid {
    padding: 12px;
  }

  .card-title {
    padding: 10px 12px;
    font-size: 13px;
  }

  .info-content {
    padding: 12px;
  }

  .info-cell .value {
    padding: 6px 10px;
    font-size: 13px;
  }

  .remark-content,
  .description-content {
    padding: 10px 12px;
    font-size: 13px;
  }
}

/* ==================== 简单图片放大样式 ==================== */
.simple-image-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  animation: fadeIn 0.3s ease-out;
}

.simple-image-container {
  max-width: 60vw;
  max-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  padding: 0;
}

.simple-enlarged-image {
  max-width: 800px;
  max-height: 600px;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  cursor: default;
  animation: zoomIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* ==================== 简单视频播放器样式 ==================== */
.simple-video-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  animation: fadeIn 0.3s ease-out;
}

.simple-video-container {
  max-width: 80vw;
  max-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  padding: 0;
}

.simple-video-player {
  width: 100%;
  max-width: 1000px;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  animation: zoomIn 0.3s ease-out;
  cursor: default;
  position: relative;
}

/* 通用视频播放相关样式 */

.video-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  min-height: 300px;
  max-height: 600px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  overflow: hidden;
}

.video-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.8);
}

.video-preview video {
  width: 100%;
  height: 100%;
  /* object-fit 通过内联样式动态设置 */
  border-radius: 12px;
  transition: object-fit 0.3s ease;
}

.no-media-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  background: rgba(255, 255, 255, 0.05);
}

/* 播放覆盖层样式已移除 - 按需求去掉视频中央播放键 */

/* 简化的视频控制条 - 包含显示模式切换和关闭按钮 */
.simple-video-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  gap: 8px;
  align-items: center;
}

.simple-video-controls .el-button {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.simple-video-controls .el-button:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.simple-video-controls .el-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}



/* 媒体查看器响应式调整 */
@media (max-width: 768px) {
  .simple-image-container {
    max-width: 85vw;
    max-height: 70vh;
    padding: 0;
  }

  .simple-enlarged-image {
    max-width: 90vw;
    max-height: 60vh;
    border-radius: 6px;
  }

  .simple-video-container {
    max-width: 95vw;
    max-height: 85vh;
  }

  .simple-video-player {
    width: 100%;
  }

  .simple-video-controls {
    top: 10px;
    right: 10px;
    gap: 6px;
  }

  .video-preview {
    min-height: 250px;
    max-height: 400px;
  }
}

@media (max-width: 480px) {
  .simple-enlarged-image {
    max-width: 95vw;
    max-height: 50vh;
  }
}

/* ==================== 合并预警相关样式 ==================== */
.merge-view-btn {
  margin-left: 12px;
  vertical-align: middle;
}

.merged-content {
  padding: 0 10px;
}

.merged-stats {
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #fff7e6 0%, #fff3cd 100%);
  border-radius: 12px;
}

.merged-stats .stat-item {
  text-align: center;
}

.merged-stats .stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #e6a23c;
}

.merged-stats .stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.merged-images-section .section-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #e6a23c;
}

.merged-images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding: 4px;
}

.merged-image-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  aspect-ratio: 4/3;
}

.merged-image-item:hover {
  border-color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.merged-image-item.is-primary {
  border-color: #e6a23c;
}

.merged-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.merged-image-item .image-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 6px 8px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.merged-image-item .image-index {
  color: #fff;
  font-size: 12px;
  font-weight: 500;
}

.merged-image-item .primary-tag {
  background: #e6a23c;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}

.merged-image-item .image-time {
  color: rgba(255, 255, 255, 0.9);
  font-size: 11px;
}

/* 合并图片大图查看器 */
.merged-image-viewer-container {
  background: rgba(0, 0, 0, 0.95);
  border-radius: 12px;
  padding: 16px;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.merged-image-viewer-container .viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  color: #fff;
  font-size: 14px;
}

.merged-image-viewer-container .viewer-header .viewer-time {
  color: #e6a23c;
  margin-left: 12px;
}

.merged-image-viewer-container .viewer-header .el-icon-close {
  cursor: pointer;
  font-size: 20px;
  padding: 4px;
  border-radius: 50%;
  transition: background 0.3s;
}

.merged-image-viewer-container .viewer-header .el-icon-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.merged-image-viewer-container .viewer-body {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 400px;
}

.merged-image-viewer-container .viewer-body img {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
  border-radius: 8px;
}

.merged-image-viewer-container .viewer-body .nav-btn {
  color: #fff;
  font-size: 32px;
  padding: 20px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.3s;
}

.merged-image-viewer-container .viewer-body .nav-btn:hover {
  opacity: 1;
}

.merged-image-viewer-container .viewer-thumbnails {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  overflow-x: auto;
  justify-content: center;
}

.merged-image-viewer-container .viewer-thumb {
  width: 60px;
  height: 45px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  opacity: 0.6;
  transition: all 0.3s;
  flex-shrink: 0;
}

.merged-image-viewer-container .viewer-thumb:hover {
  opacity: 0.9;
}

.merged-image-viewer-container .viewer-thumb.active {
  border-color: #e6a23c;
  opacity: 1;
}

.merged-image-viewer-container .viewer-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
