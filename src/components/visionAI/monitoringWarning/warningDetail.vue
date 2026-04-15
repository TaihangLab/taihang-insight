<template>
  <div class="warning-detail-component">
    <el-dialog
      title="预警详情"
      :visible.sync="dialogVisible"
      width="900px"
      :before-close="handleClose"
      v-loading="loading"
      element-loading-text="处理中...">
      <div v-if="detail" class="warning-detail-container">
        <!-- 预警详情头部 -->
        <div class="warning-detail-header">
          <div class="warning-level-badge" :class="getWarningLevelClass(detail.alert_level)">
            {{ getWarningLevelText(detail.alert_level) }}预警
          </div>
          <div class="warning-detail-time">
            <i class="el-icon-time"></i>
            {{ formatTime(detail.alert_time) }}
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
                      <span class="value alert-id">{{ getAlertId() }}</span>
                    </div>
                    <div class="info-cell">
                      <span class="label">设备名称</span>
                      <span class="value">{{ detail.camera_name || '未知摄像头' }}</span>
                    </div>
                  </div>
                  <div class="info-row">
                    <div class="info-cell">
                      <span class="label">违规位置</span>
                      <span class="value">{{ detail.location || '未知位置' }}</span>
                    </div>
                    <div class="info-cell">
                      <span class="label">预警名称</span>
                      <span class="value">{{ detail.alert_name || '未知预警' }}</span>
                    </div>
                  </div>
                  <div class="info-row">
                    <div class="info-cell">
                      <span class="label">预警类型</span>
                      <span class="value">{{ detail.alert_type || '未知类型' }}</span>
                    </div>
                    <div class="info-cell" v-if="detail.skill_name_zh">
                      <span class="label">AI技能</span>
                      <span class="value">
                        <el-tag size="mini" :type="isLLMSkill ? 'warning' : 'primary'" effect="plain" style="margin-right:4px">{{ isLLMSkill ? '大模型' : '视觉' }}</el-tag>
                        {{ detail.skill_name_zh }}
                      </span>
                    </div>
                  </div>
                  <!-- 复判信息行 (仅在复判记录页面显示) -->
                  <div class="info-row" v-if="reviewData && reviewData.reviewType">
                    <div class="info-cell">
                      <span class="label">复判分类</span>
                      <span class="value review-classification" :class="'review-' + reviewData.reviewType">
                        {{ getReviewClassificationText(reviewData.reviewType) }}
                        <el-tooltip
                          v-if="reviewData.reviewResult === 'false_alarm'"
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
                    <div class="info-cell" v-if="reviewData.reviewerName">
                      <span class="label">复判人员</span>
                      <span class="value">{{ reviewData.reviewerName }}</span>
                    </div>
                  </div>
                  <div class="info-row" v-if="reviewData && reviewData.reviewSkillName">
                    <div class="info-cell">
                      <span class="label">复判技能</span>
                      <span class="value">
                        <el-tag size="mini" type="success" effect="plain" style="margin-right:4px">LLM</el-tag>
                        {{ reviewData.reviewSkillName }}
                      </span>
                    </div>
                  </div>
                  <div class="info-row" v-if="reviewData && reviewData.reviewNotes">
                    <div class="info-cell full-width">
                      <span class="label">复判意见</span>
                      <span class="value review-notes">{{ reviewData.reviewNotes }}</span>
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
                  <p class="description-content">{{ detail.alert_description || '检测到异常情况，请立即处理' }}</p>
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
                    v-if="detail.is_merged"
                    type="warning"
                    size="mini"
                    plain
                    class="merge-view-btn"
                    @click.stop="showMergedDialog = true"
                  >
                    <i class="el-icon-folder-opened"></i>
                    查看合并 ({{ detail.alert_count }})
                  </el-button>
                </h4>
                <div class="image-container" @click="openImageViewer">
                  <div v-if="detail.minio_frame_url" class="real-image">
                    <img :src="detail.minio_frame_url" :alt="detail.alert_type" />
                    <div class="media-overlay">
                      <i class="el-icon-zoom-in"></i>
                      <span>点击放大查看</span>
                    </div>
                  </div>
                  <div v-else class="placeholder-image">
                    <i :class="getWarningIcon(detail.alert_level)"></i>
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
                  <div v-if="detail.minio_video_url" class="real-video">
                    <video
                      :src="detail.minio_video_url"
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

          <!-- 右侧：处理进展时间线 -->
          <div class="warning-right-content">
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
        <template v-if="detail && detail.status === 5">
          <span class="false-alarm-status-text">
            <i class="el-icon-warning-outline"></i>
            该预警已标记为误报
          </span>
        </template>
        <template v-else>
          <el-button plain @click="handleReport" class="action-btn report-btn">
            <i class="el-icon-upload"></i>
            上报
          </el-button>
          <el-button
            plain
            :disabled="isArchiveDisabled()"
            @click="handleArchive"
            class="action-btn archive-btn">
            <i class="el-icon-folder"></i>
            归档
          </el-button>
          <el-button
            plain
            :disabled="isFalseAlarmDisabled()"
            @click="handleFalseAlarm"
            class="action-btn false-alarm-btn">
            <i class="el-icon-close"></i>
            误报
          </el-button>
          <el-button
            plain
            :disabled="isProcessingDisabled()"
            @click="handleWarning"
            class="action-btn process-btn">
            <i class="el-icon-check"></i>
            {{ isProcessingDisabled() ? '已完成' : '处理' }}
          </el-button>
        </template>
      </span>
    </el-dialog>

    <!-- 上报确认对话框 -->
    <el-dialog
      title="上报确认"
      :visible.sync="reportDialogVisible"
      width="400px"
      center
      append-to-body>
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
      append-to-body
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
      append-to-body
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

    <!-- 误报确认对话框 -->
    <el-dialog
      title="标记误报"
      :visible.sync="falseAlarmDialogVisible"
      width="30%"
      center
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form label-width="80px">
        <el-form-item label="误报原因">
          <el-input
            v-model="falseAlarmReason"
            type="textarea"
            :rows="3"
            placeholder="请输入误报原因（可选）"
            maxlength="300"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <div style="margin-top: 8px;">
        <el-alert
          title="标记为误报后，该预警将不再出现在待处理列表中"
          type="warning"
          :closable="false"
          show-icon
        />
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeFalseAlarmDialog">取 消</el-button>
        <el-button type="danger" @click="confirmFalseAlarm">确认误报</el-button>
      </span>
    </el-dialog>

    <!-- 合并预警详情弹窗 -->
    <el-dialog
      title="合并预警详情"
      :visible.sync="showMergedDialog"
      width="700px"
      class="merged-dialog"
      append-to-body
      :modal-append-to-body="true"
      :z-index="3000"
    >
      <div v-if="detail && detail.is_merged" class="merged-content">
        <!-- 合并统计信息 -->
        <div class="merged-stats-wrapper">
          <!-- 数值统计行 -->
          <div class="merged-stats-row stats-numbers">
            <div class="stat-item">
              <div class="stat-value">{{ detail.alert_count }}</div>
              <div class="stat-label">检测次数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ formatMergeDuration(detail.alert_duration) }}</div>
              <div class="stat-label">持续时长</div>
            </div>
          </div>
          <!-- 时间统计行 -->
          <div class="merged-stats-row stats-times">
            <div class="time-item">
              <span class="time-label">首次检测：</span>
              <span class="time-value">{{ formatTime(detail.first_alert_time) }}</span>
            </div>
            <div class="time-item">
              <span class="time-label">最后检测：</span>
              <span class="time-value">{{ formatTime(detail.last_alert_time) }}</span>
            </div>
          </div>
        </div>

        <!-- 合并图片列表 -->
        <div class="merged-images-section">
          <div class="section-title">全部截图</div>
          <div class="merged-images-grid">
            <div
              v-for="(img, index) in detail.alert_images"
              :key="index"
              class="merged-image-item"
              :class="{ 'is-primary': index === getMergedMiddleIndex() }"
              @click="openMergedImage(index)"
            >
              <img :src="getMergedImageUrl(img)" />
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
      class="merged-image-overlay"
      @click="closeMergedImageViewer"
    >
      <div class="merged-image-viewer-container" @click.stop>
        <div class="viewer-header">
          <span>{{ currentMergedImageIndex + 1 }} / {{ detail.alert_images.length }}</span>
          <span class="viewer-time">+{{ detail.alert_images[currentMergedImageIndex].relative_time.toFixed(1) }}s</span>
          <i class="el-icon-close" @click="closeMergedImageViewer"></i>
        </div>
        <div class="viewer-body">
          <i class="el-icon-arrow-left nav-btn" @click="prevMergedImage"></i>
          <img :src="getMergedImageUrl(detail.alert_images[currentMergedImageIndex])" />
          <i class="el-icon-arrow-right nav-btn" @click="nextMergedImage"></i>
        </div>
        <div class="viewer-thumbnails">
          <div
            v-for="(img, index) in detail.alert_images"
            :key="index"
            class="viewer-thumb"
            :class="{ active: index === currentMergedImageIndex }"
            @click="currentMergedImageIndex = index"
          >
            <img :src="getMergedImageUrl(img)" />
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
           v-if="detail && detail.minio_frame_url"
           :src="detail.minio_frame_url"
           :alt="detail.alert_type"
           class="simple-enlarged-image" />
       </div>
     </div>

    <!-- 简单视频播放器 -->
    <div
      v-if="videoViewerVisible"
      class="simple-video-overlay"
      @click="closeVideoViewer"
      @keydown.esc.stop="closeVideoViewer"
      tabindex="-1"
      ref="videoOverlay">
      <div class="simple-video-container" @click.stop>
        <div class="simple-video-player">
          <!-- 视频预览区域 -->
          <div class="video-preview">
                          <video
               v-if="detail && detail.minio_video_url"
               ref="videoPlayer"
               :src="detail.minio_video_url"
               @loadedmetadata="onVideoLoaded"
               @timeupdate="onVideoTimeUpdate"
               @ended="onVideoEnded"
               :style="`width: 100%; height: 100%; object-fit: ${videoFitMode}; border-radius: 12px;`"
               preload="metadata"
               controls
             ></video>
            <img
              v-else-if="detail && detail.minio_frame_url"
              :src="detail.minio_frame_url"
              :alt="detail.alert_type"
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
    alertId: {
      type: [String, Number],
      default: null
    },
    reviewData: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      dialogVisible: false,
      loading: false,
      detail: null,
      // 归档相关
      archiveDialogVisible: false,
      selectedArchiveId: '',
      archivesList: [],
      archivesListLoading: false,
      currentCameraId: '',
      // 上报相关
      reportDialogVisible: false,
      reportWarningId: '',

      // 处理意见对话框
      remarkDialogVisible: false,
      remarkForm: {
        remark: ''
      },

      // 误报对话框
      falseAlarmDialogVisible: false,
      falseAlarmReason: '',

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
        if (val && this.alertId) {
          this.loadDetail();
        }
      },
      immediate: true
    },
    alertId: {
      handler(val) {
        if (val && this.visible) {
          this.loadDetail();
        }
      }
    }
  },
  mounted() {
    this.initArchivesList();
    // 添加键盘事件监听
    document.addEventListener('keydown', this.handleKeydown);
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeydown);
    if (this.videoTimer) {
      clearInterval(this.videoTimer);
    }
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.endDrag);
  },
  computed: {
    availableArchives() {
      return this.archivesList.filter(archive =>
        archive.cameraId === this.currentCameraId || archive.isDefault
      );
    },
    defaultArchive() {
      return this.availableArchives.find(archive => archive.isDefault);
    },
    isLLMSkill() {
      if (!this.detail) return false
      if (this.detail.skill_name_zh && this.detail.alert_type) {
        return this.detail.alert_type.startsWith('llm_')
      }
      return false
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
      if (!this.detail || !this.detail.alert_images) return 0
      return Math.floor(this.detail.alert_images.length / 2)
    },

    // 获取合并图片URL
    getMergedImageUrl(imageData) {
      // 支持两种格式：直接传入object_name字符串，或传入包含image_url的对象
      if (!imageData) return ''
      
      // 如果传入的是对象，优先使用后端生成的image_url（预签名URL）
      if (typeof imageData === 'object') {
        if (imageData.image_url) {
          return imageData.image_url
        }
        // 没有image_url则使用object_name
        imageData = imageData.object_name
      }
      
      if (!imageData) return ''
      
      // 如果已经是完整URL则直接返回
      if (imageData.startsWith('http')) return imageData
      
      // 否则通过后端API代理访问（使用baseUrl）
      const taskId = (this.detail && this.detail.task_id) || ''
      return `${window.baseUrl || ''}/api/v1/alerts/image/${taskId}/${imageData}`
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
      if (this.currentMergedImageIndex < this.detail.alert_images.length - 1) {
        this.currentMergedImageIndex++
      }
    },

    // ==================== 数据加载 ====================
    async loadDetail() {
      if (!this.alertId) {
        this.$message.error('缺少预警ID');
        this.closeDialog();
        return;
      }
      try {
        this.loading = true;
        const response = await alertAPI.getAlertDetail(this.alertId);
        if (response.data && response.data.alert_id) {
          this.detail = response.data;
          this.initArchivesList();
          this.initOperationHistory();
        } else {
          this.$message.error('获取预警详情失败');
          this.closeDialog();
        }
      } catch (error) {
        this.$message.error('获取预警详情失败：' + (error.message || '网络错误'));
        this.closeDialog();
      } finally {
        this.loading = false;
      }
    },

    // 初始化档案列表 - 调用真实API
    async initArchivesList() {
      if (this.archivesListLoading) return;
      this.archivesListLoading = true;
      try {
        const { archiveAPI } = await import('../../service/VisionAIService.js');

        const response = await archiveAPI.getArchiveList({
          page: 1,
          limit: 100,
        });

        console.log('📥 获取档案列表响应:', response.data);

        if (response.data && response.data.data) {
          this.archivesList = response.data.data.map(archive => ({
            id: archive.archive_id,
            name: archive.name,
            cameraId: archive.camera_id || 'unknown',
            cameraName: archive.location || '未知位置',
            isDefault: false,
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
      } finally {
        this.archivesListLoading = false;
      }
    },

    getAlertId() {
      return this.detail ? this.detail.alert_id : '未知';
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

    async handleRestoreReview() {
      if (!this.detail || !this.detail.alert_id) {
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
        await new Promise(resolve => setTimeout(resolve, 800));

        this.$emit('restore-review', { alert_id: this.detail.alert_id });
        this.$message.success('预警已成功还原到预警管理页面');
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

    async handleWarningAction(action) {
      if (!this.detail || !this.detail.alert_id) {
        this.$message.error('预警信息不完整');
        return;
      }

      try {
        this.loading = true;
        await new Promise(resolve => setTimeout(resolve, 500));

        if (action === 'report') {
          this.reportWarningId = this.detail.alert_id;
          this.reportDialogVisible = true;
          return;
        } else if (action === 'archive') {
          this.currentCameraId = this.detail.camera_id || '';
          this.initArchiveSelection();
          this.archiveDialogVisible = true;
          return;
        }
      } catch (error) {
        this.$message.error('处理预警失败');
      } finally {
        this.loading = false;
      }
    },

    handleWarning() {
      if (this.detail.status === 2) {
        this.remarkDialogVisible = true;
      } else {
        this.startProcessing();
      }
    },

    async startProcessing() {
      try {
        this.loading = true;
        const updateData = {
          status: 2,
          processing_notes: '开始处理预警',
          processed_by: this.getCurrentUserName()
        };

        await alertAPI.updateAlertStatus(this.detail.alert_id, updateData);

        this.operationHistory = this.operationHistory.map(record => {
          if (record.operationType === 'pending' && record.status === 'active') {
            return { ...record, status: 'completed', description: '预警已确认，开始处理' };
          }
          return record;
        });

        this.detail.status = 2;
        this.$message.success('预警已开始处理');
        this.remarkDialogVisible = true;

      } catch (error) {
        this.$message.error('开始处理失败: ' + (error.message || '未知错误'));
      } finally {
        this.loading = false;
      }
    },

    async saveRemark() {
      if (!this.remarkForm.remark.trim()) {
        this.$message.warning('请输入处理意见');
        return;
      }

      try {
        this.loading = true;
        const updateData = {
          status: 2,
          processing_notes: this.remarkForm.remark,
          processed_by: this.getCurrentUserName()
        };

        const response = await alertAPI.updateAlertStatus(this.detail.alert_id, updateData);

        if (response.data && response.data.code === 0) {
          this.addOperationRecord({
            status: 'completed',
            statusText: '处理记录',
            time: this.getCurrentTime(),
            description: `处理意见：${this.remarkForm.remark}`,
            operationType: 'processing-action',
            operator: this.getCurrentUserName()
          });

          this.$message.success('确认处理成功，状态已更新为处理中');
          this.$emit('handle-warning', {
            alert_id: this.detail.alert_id,
            action: 'record-added',
            apiResponse: response.data.data
          });
          this.closeRemarkDialog();
        } else {
          throw new Error(response.data ? response.data.msg : '更新失败');
        }
      } catch (error) {
        this.$message.error(`确认处理失败: ${error.message || error}`);
      } finally {
        this.loading = false;
      }
    },

    async finishProcessing() {
      try {
        this.loading = true;
        const updateData = {
          status: 3,
          processing_notes: this.remarkForm.remark ? `${this.remarkForm.remark}\n处理已完成` : '处理已完成',
          processed_by: this.getCurrentUserName()
        };

        const response = await alertAPI.updateAlertStatus(this.detail.alert_id, updateData);

        if (response.data && response.data.code === 0) {
          this.addOperationRecord({
            status: 'completed',
            statusText: '已处理',
            time: this.getCurrentTime(),
            description: '预警处理已完成，可以进行后续操作',
            operationType: 'completed',
            operator: this.getCurrentUserName()
          });

          this.detail.status = 3;
          this.$message.success('处理已完成，现在可以进行归档等操作');
          this.$emit('handle-warning', {
            alert_id: this.detail.alert_id,
            action: 'finished',
            apiResponse: response.data.data
          });
          this.closeRemarkDialog();
        } else {
          throw new Error(response.data ? response.data.msg : '更新失败');
        }
      } catch (error) {
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
    handleArchive() {
      if (this.detail.status !== 3) {
        const statusNames = { 1: '待处理', 2: '处理中', 3: '已处理', 4: '已归档', 5: '误报' };
        this.$message.warning(`只有已处理状态的预警才能归档，当前状态为：${statusNames[this.detail.status] || '未知状态'}`);
        return;
      }
      this.currentCameraId = this.detail.camera_id || '';
      this.initArchiveSelection();
      this.archiveDialogVisible = true;
    },
    handleFalseAlarm() {
      this.falseAlarmDialogVisible = true;
    },
    async confirmFalseAlarm() {
      try {
        this.loading = true;
        const updateData = {
          status: 5,
          processing_notes: this.falseAlarmReason || '标记为误报',
          processed_by: this.getCurrentUserName()
        };
        const response = await alertAPI.updateAlertStatus(this.detail.alert_id, updateData);
        if (response.data && response.data.code === 0) {
          this.addOperationRecord({
            status: 'completed',
            statusText: '标记误报',
            time: this.getCurrentTime(),
            description: `已标记为误报。${this.falseAlarmReason ? '原因：' + this.falseAlarmReason : ''}`,
            operationType: 'falseAlarm',
            operator: this.getCurrentUserName()
          });
          this.detail.status = 5;
          this.$message.success('已标记为误报');
          this.$emit('handle-false-alarm', { alert_id: this.detail.alert_id });
          this.closeFalseAlarmDialog();
        } else {
          throw new Error(response.data ? response.data.msg : '操作失败');
        }
      } catch (error) {
        this.$message.error('标记误报失败: ' + (error.message || '未知错误'));
      } finally {
        this.loading = false;
      }
    },
    closeFalseAlarmDialog() {
      this.falseAlarmDialogVisible = false;
      this.falseAlarmReason = '';
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

    async confirmReport() {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));

        this.addOperationRecord({
          status: 'completed',
          statusText: '预警上报',
          time: this.getCurrentTime(),
          description: '预警已上报给上级部门处理，等待上级部门响应',
          operationType: 'report',
          operator: this.getCurrentUserName()
        });

        this.$emit('handle-report', { alert_id: this.detail.alert_id });
        this.closeReportDialog();
      } catch (error) {
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

    async confirmArchive() {
      try {
        this.loading = true;
        let targetArchiveId = this.selectedArchiveId;
        let archiveName = '';
        let archiveLocation = '';

        if (!targetArchiveId) {
          targetArchiveId = await this.createDefaultArchive();
          archiveName = '默认档案';
          archiveLocation = this.getCurrentCameraName();
        } else {
          const selectedArchive = this.availableArchives.find(archive => archive.id === targetArchiveId);
          archiveName = selectedArchive ? selectedArchive.name : '未知档案';
          archiveLocation = selectedArchive ? selectedArchive.cameraName : '未知位置';
        }

        if (!targetArchiveId) {
          this.$message.error('无法创建默认档案');
          return;
        }

        const { archiveAPI } = await import('../../service/VisionAIService.js');
        const response = await archiveAPI.linkAlertsToArchive(
          targetArchiveId,
          [this.detail.alert_id],
          `预警详情页面归档 - 预警类型: ${this.detail.alert_type}`
        );

        if (response.data && response.data.code === 0) {
          this.addOperationRecord({
            status: 'completed',
            statusText: '预警归档',
            time: this.getCurrentTime(),
            description: `预警已归档到：${archiveName}（${archiveLocation}），可在预警档案中查看`,
            operationType: 'archive',
            operator: this.getCurrentUserName(),
            archiveInfo: { archiveId: targetArchiveId, archiveName, location: archiveLocation }
          });

          this.detail.status = 4;
          this.$message.success('预警已成功归档');
          this.$emit('handle-archive', { alert_id: this.detail.alert_id });
          this.closeArchiveDialog();
        } else {
          this.$message.error((response.data && response.data.message) || '归档失败');
        }
      } catch (error) {
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


    getWarningLevelText(level) {
      const levelMap = { 1: '一级', 2: '二级', 3: '三级', 4: '四级' };
      return levelMap[level] || '未知';
    },
    getWarningIcon(level) {
      return level === 1 ? 'el-icon-warning' : 'el-icon-warning-outline';
    },
    getWarningLevelColor(level) {
      const colorMap = { 1: '#f56c6c', 2: '#e6a23c', 3: '#409EFF', 4: '#67c23a' };
      return colorMap[level] || '#f56c6c';
    },
    getWarningLevelClass(level) {
      const classMap = { 1: 'level1-tag', 2: 'level2-tag', 3: 'level3-tag', 4: 'level4-tag' };
      return classMap[level] || 'level1-tag';
    },
    initOperationHistory() {
      if (!this.detail) return;
      this.operationHistory = [];

      if (this.detail.process) {
        this.processApiOperationHistory();
        return;
      }

      this.addOperationRecord({
        status: 'active',
        statusText: '待处理',
        time: this.formatTime(this.detail.alert_time) || this.getCurrentTime(),
        description: `${this.detail.alert_type || '系统检测'}：${this.detail.alert_description || '检测到异常情况，等待处理人员确认'}`,
        operationType: 'pending',
        operator: '系统'
      });
    },

    processApiOperationHistory() {
      const processData = this.detail.process;
      const allRecords = [];

      if (processData.steps && Array.isArray(processData.steps)) {
        processData.steps.forEach(step => {
          allRecords.push({
            id: Date.now() + Math.random(),
            status: 'completed',
            statusText: step.step || '处理步骤',
            time: this.formatTime(step.time),
            description: step.desc || '处理描述',
            operationType: step.step === '预警产生' ? 'create' : 'process',
            operator: step.operator || '系统'
          });
        });
      }

      if (allRecords.length > 0) {
        allRecords[allRecords.length - 1].status = 'active';
      }

      this.operationHistory = allRecords;

      if (processData.remark && this.operationHistory.length > 0) {
        const lastRecord = this.operationHistory[this.operationHistory.length - 1];
        if (lastRecord) {
          lastRecord.description += ' 备注：' + processData.remark;
        }
      }
    },

    // 🔧 统一排序操作历史（最新的在最下面，时间正序）
    sortOperationHistory() {
      if (!this.operationHistory || this.operationHistory.length <= 1) return;
      
      this.operationHistory.sort((a, b) => {
        const timeA = new Date(a.time).getTime();
        const timeB = new Date(b.time).getTime();
        // 如果时间无效，保持原有顺序
        if (isNaN(timeA) || isNaN(timeB)) return 0;
        return timeA - timeB; // 升序排列，最新的在最下面
      });
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

      // 添加到历史记录末尾（最新的在最下面，时间正序）
      this.operationHistory.push(newRecord);

      // 更新预警对象的操作历史
      if (this.detail) {
        if (!this.detail.operationHistory) {
          this.$set(this.detail, 'operationHistory', []);
        }
        this.detail.operationHistory.push(newRecord);
      }
    },

    isProcessingDisabled() {
      if (!this.detail) return false;
      // status: 3=已处理, 4=已归档, 5=误报 → 禁用
      return [3, 4, 5].includes(this.detail.status);
    },

    isFalseAlarmDisabled() {
      if (!this.detail) return true;
      // 只有 status=1（待处理）时才能点击误报
      return this.detail.status !== 1;
    },

    isArchiveDisabled() {
      if (!this.detail) return true;
      // 只有 status=3（已处理）时才能归档
      return this.detail.status !== 3;
    },

    // 格式化时间
    formatTime(timeString) {
      try {
        if (!timeString) {
          return '时间未知';
        }

        let date, time;
        
        // 处理 ISO 格式时间（包含 T 的格式，如 2026-01-23T12:30:00）
        if (timeString.includes('T')) {
          const parts = timeString.split('T');
          date = parts[0];
          // 移除可能的时区信息和毫秒
          time = parts[1] ? parts[1].split('.')[0].split('+')[0].split('Z')[0] : '';
        } else if (timeString.includes(' ')) {
          // 处理空格分隔的格式（如 2026-01-23 12:30:00）
          const parts = timeString.split(' ');
          date = parts[0];
          time = parts[1] || '';
        } else {
          return timeString;
        }

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
      if (this.detail && this.detail.minio_frame_url) {
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
        // 优先关闭合并图片查看器（因为它在最上层）
        if (this.mergedImageViewerVisible) {
          event.preventDefault();
          event.stopPropagation();
          this.closeMergedImageViewer();
        } else if (this.imageViewerVisible) {
          event.preventDefault();
          event.stopPropagation();
          this.closeImageViewer();
        } else if (this.videoViewerVisible) {
          event.preventDefault();
          event.stopPropagation();
          this.closeVideoViewer();
        }
      }
    },

    // ==================== 视频播放器相关方法 ====================

          // 打开视频播放器
      openVideoViewer() {
        console.log('打开视频播放器');
        console.log('预警数据:', this.detail);
        console.log('视频URL:', this.detail ? this.detail.minio_video_url : 'null');

        this.resetVideoPlayer();
        // 重置视频显示模式为默认的cover模式（无黑边）
        this.videoFitMode = 'cover';
        this.videoViewerVisible = true;
        // 延迟一下确保DOM已渲染
        this.$nextTick(() => {
          // 让 overlay 获取焦点，以便 ESC 键能被捕获
          if (this.$refs.videoOverlay) {
            this.$refs.videoOverlay.focus();
          }
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
       if (this.detail && this.detail.minio_video_url) {
         window.open(this.detail.minio_video_url, '_blank');
       } else {
         this.$message.warning('暂无视频下载链接');
       }
     }
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

/* 所有历史时间线项目（除最后一个外）使用灰色样式 */
.timeline-container .timeline-item:not(:last-child) .timeline-dot {
  border-color: #e4e7ed !important;
  background: #e4e7ed !important;
  box-shadow: 0 2px 6px rgba(228, 231, 237, 0.3) !important;
  animation: none !important;
}

.timeline-container .timeline-item:not(:last-child) .timeline-content {
  background: #fafbfc !important;
  border-color: #f0f2f5 !important;
}

.timeline-container .timeline-item:not(:last-child) .timeline-status {
  color: #909399 !important;
}

.timeline-container .timeline-item:not(:last-child) .timeline-time {
  color: #c0c4cc !important;
}

.timeline-container .timeline-item:not(:last-child) .timeline-desc {
  color: #c0c4cc !important;
}

.timeline-container .timeline-item:not(:last-child) .timeline-operator {
  color: #c0c4cc !important;
  background: rgba(192, 196, 204, 0.1) !important;
}

/* 所有历史时间线项目的左边框都显示为灰色 */
.timeline-container .timeline-item:not(:last-child) .timeline-content::before {
  background: #e4e7ed !important;
}

/* 最新的时间线项目（最后一个）使用动态蓝色圆点 - 优先级最高 */
.timeline-container .timeline-item:last-child .timeline-dot {
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

/* 🔧 优化：恢复active和completed状态的圆点样式 */
/* 处理中状态 - 蓝色脉冲动画，醒目提示 */
.timeline-item.active .timeline-dot {
  border-color: #409EFF;
  background: #409EFF;
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2), 0 2px 6px rgba(64, 158, 255, 0.3);
  animation: pulse-dot 2s infinite;
}

/* 处理中状态（processing类型）- 特殊强调样式 */
.timeline-item[data-type="processing"].active .timeline-dot {
  border-color: #409EFF;
  background: #409EFF;
  box-shadow: 0 0 0 6px rgba(64, 158, 255, 0.3), 0 2px 8px rgba(64, 158, 255, 0.4);
  animation: pulse-dot 1.5s infinite;
}

/* 已完成状态 - 绿色 */
.timeline-item.completed .timeline-dot {
  border-color: #67c23a;
  background: #67c23a;
  box-shadow: 0 2px 6px rgba(103, 194, 58, 0.3);
}

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
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: transparent !important;
  border-top: none !important;
  border: none !important;
  box-shadow: none !important;
}

.false-alarm-status-text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #909399;
  padding: 8px 20px;
  background: #f4f4f5;
  border-radius: 6px;
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
  z-index: 10001;
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
  z-index: 10000;
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

.merged-stats-wrapper {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #fff7e6 0%, #fff3cd 100%);
  border-radius: 12px;
  padding: 16px;
}

.merged-stats-row {
  display: flex;
  justify-content: center;
  align-items: center;
}

.merged-stats-row.stats-numbers {
  gap: 60px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px dashed rgba(230, 162, 60, 0.3);
}

.merged-stats-row.stats-numbers .stat-item {
  text-align: center;
}

.merged-stats-row.stats-numbers .stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #e6a23c;
}

.merged-stats-row.stats-numbers .stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.merged-stats-row.stats-times {
  gap: 30px;
  flex-wrap: wrap;
}

.merged-stats-row.stats-times .time-item {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.merged-stats-row.stats-times .time-label {
  color: #909399;
  margin-right: 4px;
}

.merged-stats-row.stats-times .time-value {
  color: #606266;
  font-weight: 500;
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

/* 合并图片大图查看遮罩层 - 必须在最上层 */
.merged-image-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 40002;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  animation: fadeIn 0.3s ease-out;
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
