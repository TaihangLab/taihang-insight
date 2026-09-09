<template>
  <div id="realTimeMonitoring" class="realtime-monitoring-container">
    <el-container v-loading="loading" class="main-container" element-loading-text="加载中">
    <!-- 左侧设备列表 - 科技感设计 -->
      <el-aside width="250px" class="device-tree-aside">
        <div class="custom-tree-header">
          <div class="header-title">
            <i class="el-icon-office-building"></i>
            <span>组织与点位</span>
          </div>
        </div>
        <div class="custom-tree-container">
          <OrgPointTree ref="orgPointTree" :hasChannel="true" :clickEvent="treeNodeClickEvent" />
        </div>
      </el-aside>

      <!-- 中间监控容器 - 科技感设计 -->
      <el-container class="video-main-container">
        <!-- 顶部工具栏 - 科技感设计 -->
        <el-header height="50px" class="video-toolbar">
          <div class="toolbar-left">
            <span class="header-label">分屏:</span>
            <div class="view-mode-buttons">
              <i class="iconfont icon-a-mti-1fenpingshi btn" :class="{active: viewMode === 'single'}" @click="switchViewMode('single')"/>
              <i class="iconfont icon-a-mti-4fenpingshi btn" :class="{active: viewMode === 'four'}" @click="switchViewMode('four')"/>
              <i class="iconfont icon-a-mti-9fenpingshi btn" :class="{active: viewMode === 'nine'}" @click="switchViewMode('nine')"/>
            </div>
          </div>
          <div class="toolbar-right">
            <div class="current-time">
              <i class="el-icon-time"></i>
              <span>{{ currentDateTime }}</span>
            </div>
            <el-tooltip content="全屏" placement="bottom" effect="light">
              <i class="el-icon-full-screen btn fullscreen-btn" @click="toggleFullscreen"/>
            </el-tooltip>
          </div>
        </el-header>

      <!-- 视频网格区域 - 科技感设计 -->
        <el-main class="video-main">
          <div ref="videoGrid"
               :class="['video-grid', viewMode, { fullscreen: isFullscreen }]">
        <template v-if="!isFullscreen">
          <div
            v-for="index in generateGrids()"
            :key="index"
            class="video-cell"
            :class="{ selected: selectedCamera === index }"
            @click="selectCamera(index)"
          >
                <!-- 超薄标题栏 - 科技感设计 -->
                <div class="video-slim-header">
                  <span class="camera-name">{{ cameraNames[index-1] || `摄像头 ${index}` }}</span>
                  <div class="video-status" :class="getVideoStatus(index-1)">
                    <span class="status-dot"></span>
                    <span class="status-text">{{ getVideoStatusText(index-1) }}</span>
            </div>
                </div>

            <div class="video-content" :ref="'videoContent'+(index-1)">

              <div class="video-placeholder" :data-timestamp="currentDateTime" :data-camera="formatCameraName(index)">
                    <div v-if="!videoUrl[index-1]" class="no-signal">
                      <i :class="videoTip[index-1] ? 'el-icon-loading' : 'el-icon-video-camera-solid'"></i>
                      <div>{{ videoTip[index-1] ? videoTip[index-1] : "无信号" }}</div>
                    </div>
                    <div v-else class="video-player-wrapper">
                      <zlm-rtc-player
                        v-if="playProtocol[index-1] === 'webrtc'"
                        :ref="'player'+(index-1)"
                        :videoUrl="videoUrl[index-1]"
                        @error="onRtcError(index-1)"
                        @screenshot="shot"/>
                      <player
                        v-else
                        :ref="'player'+(index-1)"
                        :videoUrl="videoUrl[index-1]"
                        fluent autoplay
                        @screenshot="shot"
                        @destroy="destroy(index - 1)"/>

                      <!-- 🆕 AI任务选择下拉框 - 移到video-player-wrapper内部 -->
                      <div v-if="availableAITasks[cameraIdMapping[index-1]] && availableAITasks[cameraIdMapping[index-1]].length > 0"
                           class="ai-task-selector">
                        <el-select
                          v-model="selectedAITasks[index-1]"
                          size="mini"
                          placeholder="选择AI任务"
                          @change="onTaskSelectionChange(index-1)"
                          clearable>
                          <el-option
                            v-for="task in availableAITasks[cameraIdMapping[index-1]]"
                            :key="task.task_id"
                            :label="aiTaskOptionLabel(task)"
                            :value="task.task_id">
                            <span style="float: left">{{ aiTaskOptionLabel(task) }}</span>
                            <span v-if="aiTaskOptionHint(task)" style="float: right; color: #8492a6; font-size: 12px">{{ aiTaskOptionHint(task) }}</span>
                          </el-option>
                        </el-select>
                      </div>

                      <!-- 调试信息（紧凑，避免遮挡画面） -->
                      <div v-if="selectedAITasks[index-1]" class="detection-debug-info" :title="getDetectionDebugTitle(index-1)">
                        <div class="debug-line">
                          <span class="debug-label">WS</span>
                          <span :class="['debug-value', wsConnections[index-1] ? 'connected' : 'disconnected']">
                            {{ wsConnections[index-1] ? '已连接' : '未连接' }}
                          </span>
                        </div>
                        <div class="debug-line">
                          <span class="debug-label">目标</span>
                          <span class="debug-value">{{ getDetectionCount(index-1) }}</span>
                        </div>
                        <div class="debug-line" v-if="getDetectionLabels(index-1)">
                          <span class="debug-label">列表</span>
                          <span class="debug-value debug-ellipsis">{{ getDetectionLabels(index-1) }}</span>
                        </div>
                        <div class="debug-line">
                          <span class="debug-label">更新</span>
                          <span class="debug-value debug-ellipsis">{{ detectionUpdateTime[index-1] || '无数据' }}</span>
                        </div>
                      </div>

                      <!-- 🆕 检测框OSD叠加层 -->
                      <detection-overlay
                        v-if="selectedAITasks[index-1] && detectionResults[index-1]"
                        :container-width="getVideoWidth(index-1)"
                        :container-height="getVideoHeight(index-1)"
                        :video-width="videoResolutions[index-1] ? videoResolutions[index-1].width : 1920"
                        :video-height="videoResolutions[index-1] ? videoResolutions[index-1].height : 1080"
                        :frame-timestamp="detectionResults[index-1].frame_timestamp || 0"
                        :detections="detectionResults[index-1].detections || []"
                        :status-tags="detectionResults[index-1].status_tags || []">
                      </detection-overlay>
                    </div>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div
            v-for="index in generateGrids()"
            :key="index"
            class="video-cell"
            :class="{ selected: selectedCamera === index }"
            @click="selectCamera(index)"
          >
            <!-- 超薄标题栏 -->
            <div class="video-slim-header">
              <span class="camera-name">{{ cameraNames[index-1] || `摄像头 ${index}` }}</span>
              <div class="video-status" :class="getVideoStatus(index-1)">
                <span class="status-dot"></span>
                <span class="status-text">{{ getVideoStatusText(index-1) }}</span>
              </div>
            </div>

            <div class="video-content" :ref="'videoContentFs'+(index-1)">

              <div class="video-placeholder" :data-timestamp="currentDateTime" :data-camera="formatCameraName(index)">
                    <div v-if="!videoUrl[index-1]" class="no-signal">
                      <i :class="videoTip[index-1] ? 'el-icon-loading' : 'el-icon-video-camera-solid'"></i>
                      <div>{{ videoTip[index-1] ? videoTip[index-1] : "无信号" }}</div>
                    </div>
                    <div v-else class="video-player-wrapper">
                      <zlm-rtc-player
                        v-if="playProtocol[index-1] === 'webrtc'"
                        :ref="'player'+(index-1)"
                        :videoUrl="videoUrl[index-1]"
                        @error="onRtcError(index-1)"
                        @screenshot="shot"/>
                      <player
                        v-else
                        :ref="'player'+(index-1)"
                        :videoUrl="videoUrl[index-1]"
                        fluent autoplay
                        @screenshot="shot"
                        @destroy="destroy(index - 1)"/>

                      <!-- 🆕 AI任务选择下拉框（全屏模式） -->
                      <div v-if="availableAITasks[cameraIdMapping[index-1]] && availableAITasks[cameraIdMapping[index-1]].length > 0"
                           class="ai-task-selector">
                        <el-select
                          v-model="selectedAITasks[index-1]"
                          size="mini"
                          placeholder="选择AI任务"
                          @change="onTaskSelectionChange(index-1)"
                          clearable>
                          <el-option
                            v-for="task in availableAITasks[cameraIdMapping[index-1]]"
                            :key="task.task_id"
                            :label="aiTaskOptionLabel(task)"
                            :value="task.task_id">
                            <span style="float: left">{{ aiTaskOptionLabel(task) }}</span>
                            <span v-if="aiTaskOptionHint(task)" style="float: right; color: #8492a6; font-size: 12px">{{ aiTaskOptionHint(task) }}</span>
                          </el-option>
                        </el-select>
                      </div>

                      <!-- 调试信息（全屏，紧凑） -->
                      <div v-if="selectedAITasks[index-1]" class="detection-debug-info" :title="getDetectionDebugTitle(index-1)">
                        <div class="debug-line">
                          <span class="debug-label">WS</span>
                          <span :class="['debug-value', wsConnections[index-1] ? 'connected' : 'disconnected']">
                            {{ wsConnections[index-1] ? '已连接' : '未连接' }}
                          </span>
                        </div>
                        <div class="debug-line">
                          <span class="debug-label">目标</span>
                          <span class="debug-value">{{ getDetectionCount(index-1) }}</span>
                        </div>
                        <div class="debug-line" v-if="getDetectionLabels(index-1)">
                          <span class="debug-label">列表</span>
                          <span class="debug-value debug-ellipsis">{{ getDetectionLabels(index-1) }}</span>
                        </div>
                        <div class="debug-line">
                          <span class="debug-label">更新</span>
                          <span class="debug-value debug-ellipsis">{{ detectionUpdateTime[index-1] || '无数据' }}</span>
                        </div>
                      </div>
                      <!-- 🆕 检测框OSD叠加层（全屏模式） -->
                      <detection-overlay
                        v-if="selectedAITasks[index-1] && detectionResults[index-1]"
                        :container-width="getVideoWidth(index-1)"
                        :container-height="getVideoHeight(index-1)"
                        :video-width="videoResolutions[index-1] ? videoResolutions[index-1].width : 1920"
                        :video-height="videoResolutions[index-1] ? videoResolutions[index-1].height : 1080"
                        :frame-timestamp="detectionResults[index-1].frame_timestamp || 0"
                        :detections="detectionResults[index-1].detections || []"
                        :status-tags="detectionResults[index-1].status_tags || []">
                      </detection-overlay>
                    </div>
              </div>
            </div>
          </div>
        </template>
      </div>
        </el-main>
      </el-container>

    <!-- 右侧预警信息 - 科技感设计 -->
      <el-aside width="270px" class="warning-aside">
    <div class="warning-list">
      <div class="list-header">
        <div class="header-left">
          <span>实时预警</span>
          <div class="sse-status-indicator" :class="getSSEStatusClass()">
            <span class="status-dot"></span>
            <span class="status-text">{{ getSSEStatusText() }}</span>
          </div>
        </div>
        <el-button type="text" class="more-btn" @click="goToMoreWarnings">更多 <i class="el-icon-arrow-right"></i></el-button>
      </div>
      <div class="list-content">
        <!-- 加载状态 -->
        <div v-if="apiDataLoading && warningList.length === 0" class="loading-state">
          <i class="el-icon-loading"></i>
          <span>正在加载预警数据...</span>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!apiDataLoading && warningList.length === 0" class="empty-state">
          <i class="el-icon-warning-outline"></i>
          <span>暂无预警数据</span>
          <el-button type="text" @click="refreshWarningData">点击刷新</el-button>
        </div>

        <!-- 预警列表 -->
        <div v-for="warning in warningList"
             :key="warning.id"
             class="warning-item">
          <div class="warning-video">
            <div class="warning-status-container">
              <div class="warning-level-badge" :class="warning.level">{{ getWarningLevelText(warning.level) }}</div>
              <div class="warning-status-badge" :class="getCurrentWarningStatus(warning).class">{{ getCurrentWarningStatus(warning).text }}</div>
            </div>
            <div v-if="warning.imageUrl" class="warning-image">
              <img :src="warning.imageUrl" :alt="warning.type" />
            </div>
            <div v-else class="video-placeholder">
              <i :class="getWarningIcon(warning.level)"></i>
              <span>预警监控画面</span>
            </div>
          </div>
          <div class="warning-info">
            <div class="warning-time-location">
              <div class="warning-time">{{ formatTime(warning.time) }}</div>
              <div class="warning-location">{{ warning.location }}</div>
            </div>
            <div class="warning-detail">
              <div class="device-type-row">
                <span class="device-name">{{ warning.device }}</span>
                <span class="violation-type">{{ warning.type }}</span>
              </div>
            </div>
            <div class="warning-actions">
              <el-button size="mini" plain class="report-btn" @click="viewWarningDetail(warning)">查看详情</el-button>
              <!-- 处理按钮根据状态禁用，使用与上报按钮相同的样式 -->
              <el-button
                size="mini"
                plain
                class="process-btn"
                :disabled="isProcessingDisabled(warning)"
                @click="handleWarningFromList(warning)">
                {{ isProcessingDisabled(warning) ? '已完成' : '处理' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
      </el-aside>
    </el-container>

    <!-- 引入预警详情组件 -->
    <WarningDetail
      :visible.sync="warningDetailVisible"
      :alert-id="currentAlertId"
      @handle-warning="handleWarningFromDialog"
      @handle-report="handleReportFromDialog"
      @handle-archive="handleArchiveFromDialog"
      @handle-false-alarm="handleFalseAlarmFromDialog"
    />

    <!-- 处理意见对话框 -->
    <el-dialog
      title="处理预警"
      :visible.sync="remarkDialogVisible"
      width="30%"
      center
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      append-to-body
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

    <!-- 误报输入对话框 -->
    <el-dialog
      title="标记误报"
      :visible.sync="falseAlarmDialogVisible"
      width="35%"
      center
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      append-to-body
    >
      <el-form :model="falseAlarmForm" label-width="100px">
        <el-form-item label="复判意见" required>
          <el-input
            v-model="falseAlarmForm.reviewNotes"
            type="textarea"
            :rows="4"
            placeholder="请输入复判意见，说明为什么判定为误报（可选）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="同时归档">
          <el-switch
            v-model="falseAlarmForm.needArchive"
            active-text="是"
            inactive-text="否"
          />
        </el-form-item>
        <el-form-item label="选择档案" v-if="falseAlarmForm.needArchive">
          <el-select
            v-model="falseAlarmForm.archiveId"
            placeholder="请选择档案"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="archive in availableArchivesList"
              :key="archive.archive_id"
              :label="archive.name"
              :value="archive.archive_id"
            >
              <span style="float: left">{{ archive.name }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">{{ archive.location }}</span>
            </el-option>
          </el-select>
          <el-button
            type="text"
            size="small"
            @click="createNewArchiveForFalseAlarm"
            style="margin-top: 5px"
          >
            <i class="el-icon-plus"></i> 创建新档案
          </el-button>
        </el-form-item>
      </el-form>
      <div class="process-tip">
        <i class="el-icon-warning" style="color: #E6A23C; margin-right: 4px;"></i>
        <span style="color: #E6A23C; font-size: 13px;">标记为误报后，该预警将被移出实时监控列表，并保存到复判记录中{{ falseAlarmForm.needArchive ? '，同时归档到选定的档案' : '' }}</span>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeFalseAlarmDialog">取消</el-button>
        <el-button type="warning" @click="handleFalseAlarmArchive">确认误报</el-button>
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
      append-to-body
      :modal-append-to-body="true"
      custom-class="realtime-archive-dialog"
      @opened="onArchiveDialogOpened"
    >
      <div class="archive-dialog-content">
        <div class="archive-info">
          <i class="el-icon-folder" style="color: #E6A23C; font-size: 24px; margin-right: 8px;"></i>
          <span>请选择要归档到的档案：</span>
        </div>

        <div class="archive-selection">
          <el-form label-width="100px">
            <el-form-item label="选择档案">
              <el-select
                v-model="selectedArchiveId"
                placeholder="请选择档案"
                style="width: 100%"
                filterable
                :loading="archiveListLoading"
                @visible-change="handleArchiveSelectVisibleChange"
                popper-append-to-body
                :popper-class="'archive-select-dropdown'"
              >
                <el-option
                  v-for="archive in availableArchivesList"
                  :key="archive.archive_id"
                  :label="archive.name"
                  :value="archive.archive_id"
                >
                  <span style="float: left">{{ archive.name }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">{{ archive.location }}</span>
                </el-option>
              </el-select>
              <el-button
                type="text"
                size="small"
                @click="createNewArchiveForArchiveDialog"
                style="margin-top: 5px"
              >
                <i class="el-icon-plus"></i> 创建新档案
              </el-button>
            </el-form-item>

            <el-form-item v-if="availableArchivesList.length === 0 && !archiveListLoading">
              <el-alert
                title="暂无可用档案"
                description='点击上方"创建新档案"按钮快速创建，或前往"预警档案"页面管理档案'
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
            description="归档后，预警将从实时预警列表中移除，可在预警档案页面查看。"
            type="warning"
            :closable="false"
            show-icon
          />
        </div>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button @click="closeArchiveDialog">取 消</el-button>
        <el-button
          type="danger"
          @click="confirmArchive"
          :disabled="!selectedArchiveId"
        >确认归档</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import player from '../../common/jessibuca.vue'
import zlmRtcPlayer from '../../common/zlmRtcPlayer.vue'
// 使用本地专用组件（改造后的实时监控专用API）
import OrgPointTree from './components/OrgPointTree.vue'
import WarningDetail from './warningDetail.vue'
// 🆕 导入OSD检测框组件
import DetectionOverlay from './components/DetectionOverlay.vue'
import screenfull from "screenfull";
import { alertAPI, realtimeMonitorAPI, realtimeDetectionAPI } from '../../service/VisionAIService.js';
import userService from '../../service/UserService.js';
import {
  formatAlertDateTime,
  getAlertLevelShortName,
  getAlertStatusName,
  getCurrentAlertTime,
  toAlertLevelKey,
  toAlertStatusKey
} from './utils/alertFormatting';
import { buildAlertProcessHistory } from './utils/alertProcessHistory';

export default {
  name: "RealTimeMonitoring",
  components: {
    player, zlmRtcPlayer, OrgPointTree, WarningDetail, DetectionOverlay
  },
  data() {
    return {
      // 视图模式：single, four, nine
      viewMode: 'four',
      // 选中的摄像头ID
      selectedCamera: null,
      // 是否全屏显示
      isFullscreen: false,
      // 当前时间戳
      currentDateTime: '',
      // 定时更新器
      timer: null,
      aiTaskPollTimer: null,
      aiTaskPollInFlight: false,
      aiTaskPollRequestId: 0,
      // 视频URL数组
      videoUrl: [],
      playProtocol: {},
      flvFallbackUrl: {},
      rtcFailed: {},
      // 视频提示信息
      videoTip: [],
      // 每个播放格子的后端观看租约及心跳
      playbackLeases: {},
      playbackLeaseTimers: {},
      playbackRequestVersions: {},
      playbackDisposing: false,
      // 播放器索引
      playerIdx: 0,
      // 加载状态
      loading: false,

      // 预警列表数据 - 从API获取
      warningList: [],
      warningDetailVisible: false,
      currentAlertId: null,

      // 🆕 OSD检测框叠加相关
      selectedAITasks: {},  // 每个视频窗口的AI任务选择 {index: task_id}
      availableAITasks: {},  // 每个摄像头的可用AI任务列表 {camera_id: []}
      wsConnections: {},  // WebSocket连接池 {index: WebSocket}
      detectionResults: {},  // 检测结果数据 {index: {detections: [], frame_size: {}}}
      cameraIdMapping: {},  // 摄像头ID映射 {index: camera_id}
      cameraNames: {},  // 摄像头名称映射 {index: camera_name}
      videoResolutions: {},  // 视频分辨率 {index: {width, height}}
      detectionUpdateTime: {},  // 检测结果更新时间 {index: time_string}
      archiveWarningId: '',

      // 处理意见对话框
      remarkDialogVisible: false,
      remarkForm: {
        remark: ''
      },
      currentProcessingWarningId: '',

      // 误报对话框
      falseAlarmDialogVisible: false,
      falseAlarmForm: {
        reviewNotes: '',
        needArchive: false,
        archiveId: null
      },

      // 可用档案列表
      availableArchivesList: [],
      archiveListLoading: false,

      // 归档对话框
      archiveDialogVisible: false,
      selectedArchiveId: null,

      // SSE连接相关
      sseConnection: null,
      sseLastEventId: '',
      sseSeenEventIds: new Set(),
      sseSeenEventOrder: [],
      sseMessageSequence: 0,
      sseReplayRemaining: 0,
      componentDestroyed: false,
      sseStatus: {
        connected: false,
        reconnecting: false
      },

      // API数据加载相关
      apiDataLoading: false,
      warningRequestId: 0,
      currentPage: 1,
      pageSize: 10, // 只显示最新的10条预警数据
    }
  },
  mounted() {
    // 启动时间更新定时器
    this.updateDateTime();
    this.timer = setInterval(this.updateDateTime, 1000);
    this.aiTaskPollTimer = setInterval(this.refreshPlayingCameraAITasks, 5000);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // 添加键盘事件监听器，用于ESC键退出全屏
    document.addEventListener('keydown', this.handleKeyDown);

    // 添加全屏变化事件监听器
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', this.handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', this.handleFullscreenChange);

    // 添加窗口大小变化监听器，用于重新计算四分屏布局
    window.addEventListener('resize', this.handleResize);

    // 初始化视频URL和提示信息数组
    this.initVideoArrays();

    // 加载真实档案列表（页面加载时预加载，提升用户体验）
    this.loadAvailableArchives();

    // 加载真实预警数据
    this.loadWarningData();

    // 初始化SSE连接
    this.initSSEConnection();

    // 初始化后延迟刷新布局
    this.$nextTick(() => {
      setTimeout(() => {
        this.refreshFourScreenLayout();
      }, 200);
    });
  },
  beforeDestroy() {
    this.componentDestroyed = true;
    this.warningRequestId++;
    this.playbackDisposing = true;
    this.invalidatePlaybackRequests();
    this.releaseAllPlaybackLeases();
    this.exitFullscreen();
    document.body.classList.remove('camera-fullscreen-mode');
    clearInterval(this.timer);
    if (this.aiTaskPollTimer) {
      clearInterval(this.aiTaskPollTimer);
      this.aiTaskPollTimer = null;
    }
    this.aiTaskPollRequestId++;
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    this.cleanupSSEConnection();

    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('mozfullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('MSFullscreenChange', this.handleFullscreenChange);

    window.removeEventListener('resize', this.handleResize);

    this.cleanupAllOSDResources();
  },
  methods: {
    // 初始化视频数组
    initVideoArrays() {
      // 初始化9个空位置用于视频URL和提示信息
      this.videoUrl = Array(9).fill('');
      this.videoTip = Array(9).fill('');
    },

    // 初始化档案列表 - 已废弃，使用 loadAvailableArchives() 从API加载真实数据
    // initArchivesList() {
    //   // 此方法已不再使用，所有档案数据通过API获取
    // },
    // 生成网格数量
    generateGrids() {
      if (this.viewMode === 'single') return [1]
      if (this.viewMode === 'four') return [1, 2, 3, 4]
      return [1, 2, 3, 4, 5, 6, 7, 8, 9]
    },
    // 切换视图模式
    switchViewMode(mode) {
      this.viewMode = mode
      const visibleCount = mode === 'single' ? 1 : (mode === 'four' ? 4 : 9)
      for (let index = visibleCount; index < 9; index += 1) {
        if (this.videoUrl[index] || this.playbackLeases[index] || this.cameraIdMapping[index] != null) {
          this.clear(index)
        }
      }
      if (this.playerIdx >= visibleCount) {
        this.playerIdx = 0
      }
      if (this.isFullscreen) {
        this.exitFullscreen(); // 切换视图模式时退出全屏
      }
      this.selectedCamera = null

      // 如果切换到四分屏，等待DOM更新后刷新布局
      if (mode === 'four') {
        this.$nextTick(() => {
          setTimeout(() => {
            this.refreshFourScreenLayout();
          }, 100);
        });
      }
    },
    // 选择摄像头
    selectCamera(index) {
      this.selectedCamera = this.selectedCamera === index ? null : index
      this.playerIdx = index - 1;

      // 在切换摄像头后，添加强制更新视图的逻辑
      if (this.viewMode === 'four') {
        this.$nextTick(() => {
          // 强制重新计算布局
          this.$forceUpdate();
        });
      }
    },
    // 切换全屏显示
    toggleFullscreen() {
      if (!this.isFullscreen) {
        this.enterFullscreen();
      } else {
        this.exitFullscreen();
      }
    },
    // 进入全屏模式
    enterFullscreen() {
      // 先加上样式类以便切换后立即显示全屏效果
      document.body.classList.add('camera-fullscreen-mode');

      this.isFullscreen = true;

      // 获取视频网格元素
      const element = this.$refs.videoGrid;

      try {
        // 请求全屏
        if (element.requestFullscreen) {
          element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) { /* Safari */
          element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) { /* IE11 */
          element.msRequestFullscreen();
        } else if (element.mozRequestFullScreen) { /* Firefox */
          element.mozRequestFullScreen();
        }
      } catch (err) {
        console.error('无法进入全屏模式:', err);
        // 如果无法进入全屏模式，仍然保持样式效果
      }
    },
    // 退出全屏模式
    exitFullscreen() {
      // 移除样式类
      document.body.classList.remove('camera-fullscreen-mode');
      this.isFullscreen = false;

      try {
        // 判断当前是否在全屏模式
        if (
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement
        ) {
          // 退出全屏
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
          } else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
          } else if (document.mozCancelFullScreen) { /* Firefox */
            document.mozCancelFullScreen();
          }
        }
      } catch (err) {
        console.error('退出全屏模式时出错:', err);
      }
    },
    // 处理键盘事件
    handleKeyDown(event) {
      if (event.key === 'Escape' && this.isFullscreen) {
        this.exitFullscreen();
      }
    },
    // 处理全屏状态变化事件
    handleFullscreenChange() {
      const fullscreenElement =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;

      // 如果没有全屏元素但我们的状态是全屏，那么退出全屏
      if (!fullscreenElement && this.isFullscreen) {
        this.exitFullscreen();
      }
    },
    // 更新当前日期时间戳
    updateDateTime() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      // 获取星期几
      const weekDay = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];

      this.currentDateTime = `${year}年${month}月${day}日 星期${weekDay} ${hours}:${minutes}:${seconds}`;
    },
    // 格式化摄像头名称
    formatCameraName(index) {
      return `Camera ${String(index).padStart(2, '0')}`;
    },
    // 截图功能
    shot(e) {
      let base64ToBlob = function (code) {
        let parts = code.split(';base64,');
        let contentType = parts[0].split(':')[1];
        let raw = window.atob(parts[1]);
        let rawLength = raw.length;
        let uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        return new Blob([uInt8Array], {
          type: contentType
        });
      };
      let aLink = document.createElement('a');
      let blob = base64ToBlob(e);
      let evt = document.createEvent("HTMLEvents");
      evt.initEvent("click", true, true);
      aLink.download = '截图';
      aLink.href = URL.createObjectURL(blob);
      aLink.click();
    },
    // 销毁播放器
    destroy(idx) {
      this.clear(idx, { silent: false });
    },
    // 清除播放数据
    clear(idx, options) {
      const silent = !options || options.silent !== false;
      this.bumpPlaybackRequestVersion(idx);
      this.cleanupOSDResources(idx);
      this.releasePlaybackLease(idx, { silent: silent });
      this.$delete(this.cameraIdMapping, idx);
      this.$delete(this.cameraNames, idx);
      this.$set(this.videoUrl, idx, '');
      this.$set(this.videoTip, idx, '');
      this.$set(this.playProtocol, idx, '');
      this.$set(this.flvFallbackUrl, idx, '');
      this.$set(this.rtcFailed, idx, false);
    },
    onRtcError(idx) {
      if (this.rtcFailed[idx] || this.playProtocol[idx] !== 'webrtc') return
      const flv = this.flvFallbackUrl[idx]
      this.$set(this.rtcFailed, idx, true)
      if (!flv) {
        this.$set(this.videoTip, idx, "播放失败: WebRTC 不可用")
        this.setPlayUrl("", idx)
        return
      }
      console.warn('WebRTC 播放失败，回退 HTTP-FLV', idx)
      this.$set(this.playProtocol, idx, 'flv')
      this.setPlayUrl(flv, idx)
    },
    setPlayUrl(url, idx) {
      this.$set(this.videoUrl, idx, url);
    },
    bumpPlaybackRequestVersion(index) {
      const nextVersion = (this.playbackRequestVersions[index] || 0) + 1;
      this.$set(this.playbackRequestVersions, index, nextVersion);
      return nextVersion;
    },
    invalidatePlaybackRequests() {
      for (let index = 0; index < 9; index += 1) {
        this.bumpPlaybackRequestVersion(index);
      }
    },
    clearPlaybackLeaseHeartbeat(index) {
      const timer = this.playbackLeaseTimers[index];
      if (timer) {
        clearInterval(timer);
        this.$delete(this.playbackLeaseTimers, index);
      }
    },
    startPlaybackLeaseHeartbeat(index) {
      this.clearPlaybackLeaseHeartbeat(index);
      const lease = this.playbackLeases[index];
      if (!lease) return;
      const intervalSeconds = Number(lease.heartbeatIntervalSeconds) || 30;
      const timer = setInterval(
        () => this.renewPlaybackLease(index),
        Math.max(intervalSeconds * 1000, 1000)
      );
      this.$set(this.playbackLeaseTimers, index, timer);
    },
    async renewPlaybackLease(index) {
      const lease = this.playbackLeases[index];
      if (!lease || this.playbackDisposing) return;
      try {
        const response = await realtimeMonitorAPI.renewPlaybackLease(lease.leaseId);
        const current = this.playbackLeases[index];
        if (!current || current.leaseId !== lease.leaseId) return;
        const renewed = response.data && response.data.data;
        if (renewed) {
          this.$set(this.playbackLeases, index, Object.assign({}, current, {
            heartbeatIntervalSeconds: renewed.heartbeat_interval_seconds,
            expiresAt: renewed.expires_at
          }));
        }
      } catch (error) {
        const status = error.response && error.response.status;
        const current = this.playbackLeases[index];
        if (!current || current.leaseId !== lease.leaseId) return;
        if (status === 404 || status === 410) {
          this.clearPlaybackLeaseHeartbeat(index);
          this.$delete(this.playbackLeases, index);
          if (!this.playbackDisposing && String(this.cameraIdMapping[index]) === String(lease.channelId)) {
            this.setPlayUrl('', index);
            this.$set(this.videoTip, index, '播放租约已过期，正在重新连接...');
            this.sendDevicePush(lease.channelId);
          }
        } else {
          console.warn('⚠️ 播放租约续期暂时失败，将继续重试:', error);
        }
      }
    },
    async releasePlaybackLease(index, options) {
      const silent = options && options.silent;
      const lease = this.playbackLeases[index];
      this.clearPlaybackLeaseHeartbeat(index);
      if (!lease) return;

      // 先移除本地引用，避免并发的重复 DELETE；服务端 DELETE 本身也是幂等的。
      this.$delete(this.playbackLeases, index);
      try {
        await realtimeMonitorAPI.stopChannel(lease.channelId, lease.leaseId);
      } catch (error) {
        console.error('❌ 释放播放租约失败，将由服务端超时机制继续回收:', error);
        if (!silent && this.$message) {
          this.$message.warning('播放器已关闭，但服务端停流失败，系统将自动重试回收');
        }
      }
    },
    releaseAllPlaybackLeases() {
      Object.keys(this.playbackLeases).forEach(index => {
        this.releasePlaybackLease(Number(index), { silent: true });
      });
      Object.keys(this.playbackLeaseTimers).forEach(index => {
        this.clearPlaybackLeaseHeartbeat(Number(index));
      });
    },
    // 设备树点击事件
    treeNodeClickEvent(data) {
      if (data.leaf) {
        // 🆕 保存摄像头名称
        const idx = this.playerIdx
        this.$set(this.cameraNames, idx, data.name || `摄像头 ${idx+1}`)

        this.sendDevicePush(data.id);
      }
    },
    // 向设备发送推流请求
    async sendDevicePush(channelId) {
      const idxTmp = this.playerIdx;
      const requestVersion = this.bumpPlaybackRequestVersion(idxTmp);
      // 切摄像头时关掉该格子上旧的检测 WS / 已选任务，避免「视频已换、WS 还在」
      const prevCameraId = this.cameraIdMapping[idxTmp]
      if (prevCameraId != null && String(prevCameraId) !== String(channelId)) {
        this.cleanupOSDResources(idxTmp)
      }
      // 先在本地摘除旧租约；DELETE 与新 POST 可并发，后端引用计数会处理先后顺序。
      this.releasePlaybackLease(idxTmp, { silent: true })
      this.setPlayUrl("", idxTmp);
      this.$set(this.playProtocol, idxTmp, '');
      this.$set(this.flvFallbackUrl, idxTmp, '');
      this.$set(this.rtcFailed, idxTmp, false);
      this.$set(this.videoTip, idxTmp, "正在拉流...");

      // 🆕 保存摄像头ID映射
      this.$set(this.cameraIdMapping, idxTmp, channelId);

      // 注意：拉流只在对应视频格子里显示"正在拉流..."提示，
      // 不再使用整页 v-loading 遮罩，避免通道离线/不存在时整页转圈卡死

      try {

        // 使用新的专用API播放通道
        const response = await realtimeMonitorAPI.playChannel(channelId);

        if (response.data && response.data.code === 0 && response.data.data) {
          const streamData = response.data.data;
          const lease = streamData.viewer_lease;
          if (!lease || !lease.lease_id) {
            throw new Error('服务端未返回播放租约');
          }

          // 用户可能已切换到另一通道；把迟到响应携带的租约立即归还。
          if (this.playbackDisposing || this.playbackRequestVersions[idxTmp] !== requestVersion) {
            try {
              await realtimeMonitorAPI.stopChannel(channelId, lease.lease_id);
            } catch (releaseError) {
              console.warn('⚠️ 释放迟到的播放租约失败，将由服务端超时回收:', releaseError);
            }
            return;
          }

          this.$set(this.playbackLeases, idxTmp, {
            leaseId: lease.lease_id,
            channelId: channelId,
            heartbeatIntervalSeconds: lease.heartbeat_interval_seconds,
            expiresAt: lease.expires_at
          });
          this.startPlaybackLeaseHeartbeat(idxTmp);

          const flvUrl = location.protocol === "https:"
            ? (streamData.https_flv || streamData.wss_flv)
            : (streamData.http_flv || streamData.ws_flv);
          const config = require('../../../../config/index.js')
          let rtcUrl = streamData.webrtc || ''
          if (rtcUrl.startsWith('/')) {
            rtcUrl = String(config.API_BASE_URL || '').replace(/\/$/, '') + rtcUrl
          }
          const videoUrl = rtcUrl || flvUrl;

          if (videoUrl) {
            this.$set(this.playProtocol, idxTmp, rtcUrl ? 'webrtc' : 'flv');
            this.$set(this.flvFallbackUrl, idxTmp, flvUrl || '');
            this.setPlayUrl(videoUrl, idxTmp);

            // 🆕 加载该摄像头的AI任务列表
            await this.loadAvailableAITasks(channelId);

            // 视频加载后刷新布局
            setTimeout(() => {
              this.refreshFourScreenLayout();
              // 单独调整当前播放器尺寸
              this.adjustPlayerSize(idxTmp);
            }, 200);
          } else {
            console.warn('⚠️ 未找到可用的流地址');
            this.releasePlaybackLease(idxTmp, { silent: true });
            this.$set(this.videoTip, idxTmp, "播放失败: 未找到可用的流地址");
          }
        } else {
          const errorMsg = (response.data && response.data.msg) || '播放失败';
          console.error('❌ 播放失败:', errorMsg);
          this.$set(this.videoTip, idxTmp, "播放失败: " + errorMsg);
        }
      } catch (error) {
        console.error('❌ 播放通道异常:', error);
        if (this.playbackRequestVersions[idxTmp] !== requestVersion || this.playbackDisposing) {
          return;
        }
        if (this.playbackLeases[idxTmp]) {
          this.releasePlaybackLease(idxTmp, { silent: true });
        }
        // axios 超时(ECONNABORTED)时给出更友好的提示
        const isTimeout = error.code === 'ECONNABORTED' || /timeout/i.test(error.message || '');
        const responseDetail = error.response && error.response.data && error.response.data.detail;
        const errorMsg = isTimeout ? '拉流超时，通道可能已离线或不存在' : (responseDetail || error.message || '网络错误');
        this.$set(this.videoTip, idxTmp, "播放失败: " + errorMsg);
      }
    },
    // 获取视频状态类
    getVideoStatus(index) {
      if (!this.videoUrl[index]) return 'offline';
      return 'online';
    },
    // 获取视频状态文本
    getVideoStatusText(index) {
      if (!this.videoUrl[index]) return '离线';
      return '在线';
    },
    // 处理窗口大小变化
    handleResize() {
      // 延迟处理，确保DOM已更新
      setTimeout(() => {
        this.refreshFourScreenLayout();
      }, 100);
    },
    // 添加一个方法来重新计算和更新四分屏布局
    refreshFourScreenLayout() {
      if (this.viewMode !== 'four') return;

      // 强制更新视图
      this.$forceUpdate();

      // 延迟后检查并修正尺寸
      this.$nextTick(() => {
        // 获取视频网格元素
        const gridElement = this.$refs.videoGrid;
        if (!gridElement) return;

        // 确保网格完全填充容器
        gridElement.style.width = '100%';
        gridElement.style.height = '100%';

        // 处理每个视频单元格
        const cells = gridElement.querySelectorAll('.video-cell');
        cells.forEach(cell => {
          // 确保盒模型计算正确
          cell.style.boxSizing = 'border-box';

          // 确保内容区域正确
          const contentElement = cell.querySelector('.video-content');
          if (contentElement) {
            contentElement.style.width = '100%';
            contentElement.style.height = 'calc(100% - 26px)';
          }
        });

        // 调整所有播放器组件尺寸
        if (this.viewMode === 'four') {
          for (let i = 0; i < 4; i++) {
            this.adjustPlayerSize(i);
          }
        }
      });
    },
    // 添加player组件调整方法，处理播放器尺寸
    adjustPlayerSize(index) {
      // 获取player对象
      const playerKey = 'player' + index;
      if (!this.$refs[playerKey]) return;

      // 获取player组件实例
      let playerRef = this.$refs[playerKey];

      // 确保playerRef不为空且有resize方法
      if (playerRef && typeof playerRef.resize === 'function') {
        // 触发resize方法调整播放器尺寸
        playerRef.resize();
      }
    },
    // 获取预警等级文字
    getWarningLevelText(level) {
      return getAlertLevelShortName(level);
    },
    // 查看预警详情
    viewWarningDetail(warning) {
      const alertId = (warning._apiData && warning._apiData.alert_id) || warning.id
      this.currentAlertId = alertId
      this.warningDetailVisible = true
    },
    // 从预警列表处理预警 - 点击处理仅打开意见对话框，确认后才变更状态
    handleWarningFromList(warning) {

      if (warning && warning.id) {
        this.currentProcessingWarningId = warning.id;
        this.remarkDialogVisible = true;
      } else {
        console.error('❌ 无效的预警数据:', warning);
        this.$message.error('预警数据无效，无法处理');
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


        const currentWarning = this.warningList.find(item =>
          String(item.id) === String(this.currentProcessingWarningId)
        );
        const expectedStatus = currentWarning && currentWarning._apiData
          ? Number(currentWarning._apiData.status)
          : null;
        if (!expectedStatus) {
          this.$message.error('无法确定预警当前状态，请刷新页面后重试');
          return;
        }
        const apiAlertId = currentWarning._apiData.alert_id || currentWarning.id;

        // 真实的API调用 - 添加处理记录
        const updateData = {
          status: 2, // 保持处理中状态
          expected_status: expectedStatus,
          processing_notes: this.remarkForm.remark,
          processed_by: this.getCurrentUserName(),
          operation_type: 'add_processing_note'
        };

        const response = await alertAPI.updateAlertStatus(apiAlertId, updateData);

        // 🔧 从后端响应中获取实际的操作人名字
        const operatorName = (response.data && response.data.data && response.data.data.updated_alert && response.data.data.updated_alert.processed_by) ||
                            (response.data && response.data.data && response.data.data.processing_record && response.data.data.processing_record.operator) ||
                            this.getCurrentUserName();

        // 更新本地数据状态 - 添加新的处理记录
        const index = this.warningList.findIndex(item => item.id === this.currentProcessingWarningId);
        if (index !== -1) {
          if (!this.warningList[index].operationHistory) {
            this.$set(this.warningList[index], 'operationHistory', []);
          }

          const newRecord = {
            id: Date.now() + Math.random(),
            status: 'completed',
            statusText: '处理中',
            time: getCurrentAlertTime(),
            description: `处理意见：${this.remarkForm.remark}`,
            operationType: 'processing-action',
            operator: operatorName
          };

          this.warningList[index].operationHistory.push(newRecord);
          this.syncWarningStatus(this.warningList[index], 2);
        }

        this.$message.success('处理记录已添加');
        this.closeRemarkDialog();

      } catch (error) {
        console.error('❌ 保存处理意见失败:', error);
        this.$message.error('处理失败: ' + (error.message || (error.response && error.response.data && error.response.data.message) || '未知错误'));
      } finally {
        this.loading = false;
      }
    },

    // 结束处理
    async finishProcessing() {
      try {
        this.loading = true;


        const currentWarning = this.warningList.find(item =>
          String(item.id) === String(this.currentProcessingWarningId)
        );
        const expectedStatus = currentWarning && currentWarning._apiData
          ? Number(currentWarning._apiData.status)
          : null;
        if (!expectedStatus) {
          this.$message.error('无法确定预警当前状态，请刷新页面后重试');
          return;
        }
        const apiAlertId = currentWarning._apiData.alert_id || currentWarning.id;

        // 真实的API调用 - 完成处理
        const updateData = {
          status: 3, // 已处理状态
          expected_status: expectedStatus,
          processing_notes: this.remarkForm.remark.trim() || null,
          processed_by: this.getCurrentUserName(),
          operation_type: 'complete_processing'
        };

        const response = await alertAPI.updateAlertStatus(apiAlertId, updateData);

        const result = (response.data && response.data.data) || {};
        const updatedAlert = result.updated_alert || {};
        const processingRecord = result.processing_record || {};
        const processingNotes = updatedAlert.processing_notes != null
          ? updatedAlert.processing_notes
          : updateData.processing_notes;
        const operatorName = processingRecord.operator || updatedAlert.processed_by || '未知操作人';

        // 更新本地数据状态
        const index = this.warningList.findIndex(item => item.id === this.currentProcessingWarningId);
        if (index !== -1) {
          if (!this.warningList[index].operationHistory) {
            this.$set(this.warningList[index], 'operationHistory', []);
          }

          // 添加已处理记录 - 这是状态判断的关键，使用后端返回的操作人名字
          const completedRecord = {
            id: Date.now() + Math.random(),
            status: 'completed',
            statusText: '已处理',
            time: processingRecord.created_at ? formatAlertDateTime(processingRecord.created_at) : getCurrentAlertTime(),
            description: processingNotes || '未填写处理意见',
            operationType: 'completed',
            operator: operatorName
          };

          this.warningList[index].operationHistory.push(completedRecord);

          this.syncWarningStatus(this.warningList[index], 3);

          // 🔧 关键修复：更新处理信息，使用后端返回的操作人名字
          if (this.warningList[index]._apiData) {
            this.warningList[index]._apiData.processed_at = new Date().toISOString();
            this.warningList[index]._apiData.processed_by = operatorName;
            this.warningList[index]._apiData.processing_notes = processingNotes;
          }

        }

        this.$message.success('处理已完成，现在可以进行归档等操作');
        this.closeRemarkDialog();
        await this.removeWarningAndReload(apiAlertId);

      } catch (error) {
        console.error('❌ 结束处理失败:', error);
        this.$message.error('结束处理失败: ' + (error.message || (error.response && error.response.data && error.response.data.message) || '未知错误'));
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
      this.currentProcessingWarningId = '';
    },

    // 从对话框处理预警 - 也使用处理意见流程
    async handleWarningFromDialog(eventData) {
      if (!eventData || !eventData.alert_id) return;

      const alertId = eventData.alert_id;
      const index = this.warningList.findIndex(item =>
        String(item.id) === String(alertId) ||
        (item._apiData && String(item._apiData.alert_id) === String(alertId))
      );

      if (eventData.action === 'finished') {
        if (index !== -1) {
          this.syncWarningStatus(this.warningList[index], 3);
        }
        await this.removeWarningAndReload(alertId);
        return;
      }

      if (['record-added', 'reopened'].includes(eventData.action) && index !== -1) {
        this.syncWarningStatus(this.warningList[index], 2);
        return;
      }
    },

    // 处理预警事件 - 复制预警管理页面的核心逻辑
    async handleWarning(id, action) {
      try {
        this.loading = true;
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500));

        // 更新本地数据状态
        const index = this.warningList.findIndex(item => item.id === id);
        if (index !== -1) {
          if (action === 'markProcessed') {
            // 标记为已处理
            this.syncWarningStatus(this.warningList[index], 3);
            this.$message.success('已标记为已处理');
          } else if (action === 'archive') {
            // 归档 - 需要选择档案
            this.archiveWarningId = id;
            await this.handleArchiveProcess();
            return; // 不关闭loading，等归档完成后再关闭
          } else if (action === 'false_alarm') {
            // 误报 - 显示输入对话框
            this.archiveWarningId = id;
            this.falseAlarmDialogVisible = true;
            return; // 不关闭loading，等用户输入完成后再关闭
          }
        }
      } catch (error) {
        this.$message.error('处理预警失败');
      } finally {
        this.loading = false;
      }
    },

    async handleReportFromDialog(eventData) {
      if (eventData && eventData.alert_id && eventData.action === 'reported') {
        // 详情组件已完成上报持久化；重新加载以同步处理时间线。
        await this.loadWarningData();
      }
    },

    handleArchiveFromDialog(eventData) {
      if (eventData && eventData.alert_id) {
        // 详情组件已经完成原子归档，这里只同步列表，避免再次发起归档请求。
        const index = this.warningList.findIndex(item => {
          const alertId = item._apiData ? item._apiData.alert_id : item.id;
          return String(alertId) === String(eventData.alert_id);
        });
        if (index !== -1) {
          this.warningList.splice(index, 1);
        }
        this.warningDetailVisible = false;
      }
    },

    async handleFalseAlarmFromDialog(eventData) {
      if (eventData && eventData.alert_id) {
        if (eventData.completed) {
          this.warningDetailVisible = false;
          await this.removeWarningAndReload(eventData.alert_id);
          return;
        }
        this.handleWarning(eventData.alert_id, 'false_alarm');
      }
    },

    // 处理归档流程 - 显示档案选择对话框
    async handleArchiveProcess() {
      try {
        // 获取当前预警信息
        const index = this.warningList.findIndex(item => item.id === this.archiveWarningId);
        if (index === -1) {
          this.$message.error('未找到预警信息');
          return;
        }

        const warningInfo = this.warningList[index];

        // 检查预警状态，只有已处理状态（status=3）才能归档
        const currentStatus = warningInfo._apiData
          ? Number(warningInfo._apiData.status)
          : null;
        if (currentStatus != null && currentStatus !== 3) {
          const statusNames = {
            1: '待处理',
            2: '处理中',
            3: '已处理',
            4: '已归档',
            5: '误报'
          };
          const currentStatusName = statusNames[currentStatus] || '未知状态';
          this.$message.warning(`只有已处理状态的预警才能归档，当前状态为：${currentStatusName}。请先点「处理」并结束处理后再归档。`);
          this.loading = false;
          return;
        }


        // 刷新档案列表
        await this.loadAvailableArchives();


        // 显示档案选择对话框（即使没有档案也显示，让用户可以创建）
        this.archiveDialogVisible = true;
        this.selectedArchiveId = null; // 重置选择

        // 确保对话框在最上层（DOM 更新后设置）
        this.$nextTick(() => {
          this.ensureArchiveDialogOnTop();
        });


        // 如果没有档案，提示用户但不阻止对话框显示
        if (this.availableArchivesList.length === 0) {
          this.$message.warning('当前没有可用档案，请点击"创建新档案"按钮创建');
        }
      } catch (error) {
        console.error('❌ 打开归档对话框失败:', error);
        this.$message.error('打开归档对话框失败: ' + (error.message || '未知错误'));
      }
    },

    // 确认归档
    async confirmArchive() {
      if (!this.selectedArchiveId) {
        this.$message.warning('请选择要归档到的档案');
        return;
      }

      try {
        this.loading = true;

        // 获取当前预警信息
        const index = this.warningList.findIndex(item => item.id === this.archiveWarningId);
        if (index === -1) {
          this.$message.error('未找到预警信息');
          return;
        }

        const warningInfo = this.warningList[index];

        // 再次检查预警状态，只有已处理状态（status=3）才能归档
        const currentStatus = warningInfo._apiData
          ? Number(warningInfo._apiData.status)
          : null;
        if (currentStatus != null && currentStatus !== 3) {
          const statusNames = {
            1: '待处理',
            2: '处理中',
            3: '已处理',
            4: '已归档',
            5: '误报'
          };
          const currentStatusName = statusNames[currentStatus] || '未知状态';
          this.$message.warning(`只有已处理状态的预警才能归档，当前状态为：${currentStatusName}。请先点「处理」并结束处理后再归档。`);
          this.closeArchiveDialog();
          return;
        }

        const alertId = warningInfo._apiData ? warningInfo._apiData.alert_id : parseInt(this.archiveWarningId);

        // 🔧 修复：使用 archive_id 字段查找档案（不是 id）
        const selectedArchive = this.availableArchivesList.find(archive => archive.archive_id === this.selectedArchiveId);
        const archiveName = selectedArchive ? selectedArchive.name : '未知档案';
        const archiveLocation = selectedArchive ? selectedArchive.location : '未知位置';


        // 后端在同一事务中建立档案关联并更新预警状态。
        const { archiveAPI } = await import('../../service/VisionAIService.js');
        const response = await archiveAPI.linkAlertsToArchive(
          this.selectedArchiveId,
          [alertId],
          `实时监控归档 - 预警类型: ${warningInfo.type}`
        );


        const archiveResult = response.data && response.data.data;
        if (response.data && response.data.code === 0 &&
            archiveResult && archiveResult.failed_count === 0) {
          const operatorName = archiveResult.linked_by || this.getCurrentUserName();

          // 只有后端事务提交成功后，才更新本地状态和操作历史。
          this.syncWarningStatus(this.warningList[index], 4);
          this.$set(this.warningList[index], 'archiveId', this.selectedArchiveId);
          this.$set(this.warningList[index], 'archiveTime', new Date().toLocaleString());

          if (!this.warningList[index].operationHistory) {
            this.$set(this.warningList[index], 'operationHistory', []);
          }
          this.warningList[index].operationHistory.push({
            id: Date.now() + Math.random(),
            status: 'completed',
            statusText: '预警归档',
            time: getCurrentAlertTime(),
            description: `预警已归档到：${archiveName}（${archiveLocation}），可在预警档案中查看`,
            operationType: 'archive',
            operator: operatorName,
            archiveInfo: {
              archiveId: this.selectedArchiveId,
              archiveName: archiveName,
              location: archiveLocation
            }
          });

          setTimeout(() => {
            const currentIndex = this.warningList.findIndex(item => {
              const itemAlertId = item._apiData ? item._apiData.alert_id : item.id;
              return String(itemAlertId) === String(alertId);
            });
            if (currentIndex !== -1) {
              // 从实时预警列表中移除已归档的预警
              this.warningList.splice(currentIndex, 1);
            }
          }, 500);

          this.$message.success('预警已成功归档');

          // 关闭对话框
          this.closeArchiveDialog();
        } else {
          const errorMessage = (response.data && response.data.message) || '归档失败';
          this.$message.error(errorMessage);
          console.warn('⚠️ 实时监控 - 预警归档失败:', response.data);
        }
      } catch (error) {
        console.error('❌ 实时监控 - 预警归档异常:', error);
        const serverMessage = error.response && error.response.data &&
          (error.response.data.detail || error.response.data.message);
        this.$message.error('归档失败: ' + (serverMessage || error.message || '未知错误'));
      } finally {
        this.loading = false;
      }
    },

    // 关闭归档对话框
    closeArchiveDialog() {
      this.archiveDialogVisible = false;
      this.selectedArchiveId = null;
      this.archiveWarningId = '';
    },

    // 确保归档对话框在最上层
    ensureArchiveDialogOnTop() {
      try {
        // 查找所有的对话框包裹层和弹出层
        const dialogWrappers = document.querySelectorAll('.el-dialog__wrapper');
        const poppers = document.querySelectorAll('.el-select-dropdown, .el-picker-panel');
        let maxZIndex = 2000; // Element UI 默认起始值

        // 找到当前最大的 z-index（包括对话框和其他弹出层）
        dialogWrappers.forEach(wrapper => {
          const zIndex = parseInt(window.getComputedStyle(wrapper).zIndex || 0);
          if (zIndex > maxZIndex) {
            maxZIndex = zIndex;
          }
        });

        poppers.forEach(popper => {
          const zIndex = parseInt(window.getComputedStyle(popper).zIndex || 0);
          if (zIndex > maxZIndex) {
            maxZIndex = zIndex;
          }
        });

        // 设置归档对话框为最大值 + 10，留出空间给 select 下拉框
        const targetZIndex = maxZIndex + 10;

        // 查找归档对话框的包裹层
        dialogWrappers.forEach(wrapper => {
          const archiveDialog = wrapper.querySelector('.realtime-archive-dialog');
          if (archiveDialog) {
            // 设置对话框包裹层的 z-index
            wrapper.style.zIndex = targetZIndex.toString();

            // 查找对应的遮罩层（紧邻在对话框前面的 v-modal）
            const previousSibling = wrapper.previousElementSibling;
            if (previousSibling && previousSibling.classList.contains('v-modal')) {
              previousSibling.style.zIndex = (targetZIndex - 1).toString();
            }
          }
        });

        // 确保归档对话框中的 select 下拉框也有足够高的 z-index
        const archiveSelectDropdown = document.querySelector('.archive-select-dropdown');
        if (archiveSelectDropdown) {
          archiveSelectDropdown.style.zIndex = (targetZIndex + 1).toString();
        }
      } catch (error) {
        console.warn('⚠️ 设置归档对话框层级失败:', error);
        // 静默失败，不影响主要功能
      }
    },

    // 对话框完全打开后的回调
    onArchiveDialogOpened() {
      // 在对话框打开后再次确保 z-index 正确
      this.ensureArchiveDialogOnTop();

      // 监听 select 下拉框的打开，确保其 z-index 正确
      this.$nextTick(() => {
        const selectElement = this.$el.querySelector('.archive-select-dropdown');
        if (selectElement) {
          const observer = new MutationObserver(() => {
            this.ensureArchiveDialogOnTop();
          });

          observer.observe(document.body, {
            childList: true,
            subtree: false
          });

          // 组件销毁时断开观察
          this.$once('hook:beforeDestroy', () => {
            observer.disconnect();
          });
        }
      });
    },

    // 处理档案选择器显示变化
    handleArchiveSelectVisibleChange(visible) {
      if (visible) {
        if (this.availableArchivesList.length === 0) {
          // 当下拉框打开且没有数据时，重新加载
          this.loadAvailableArchives();
        }
        // 当下拉框打开时，确保对话框和下拉框的层级正确
        this.$nextTick(() => {
          this.ensureArchiveDialogOnTop();
        });
      }
    },

    // 处理误报事件 - 支持同时归档
    async handleFalseAlarmArchive() {
      try {
        // 如果选择了归档，检查是否选择了档案
        if (this.falseAlarmForm.needArchive && !this.falseAlarmForm.archiveId) {
          this.$message.warning('请选择要归档的档案');
          return;
        }

        // 获取当前预警信息
        const warningIndex = this.warningList.findIndex(item => item.id === this.archiveWarningId);
        if (warningIndex === -1) {
          this.$message.error('未找到预警信息');
          return;
        }

        const warningInfo = this.warningList[warningIndex];
        const currentStatus = warningInfo._apiData ? warningInfo._apiData.status : null;

        // 待处理、处理中均可标记误报（与后端一致）
        if (warningInfo._apiData) {
          const s = Number(warningInfo._apiData.status);
          if (s !== 1 && s !== 2) {
            const currentStatusName = getAlertStatusName(warningInfo._apiData.status);
            this.$message.warning(`只有待处理或处理中状态的预警才能标记为误报，当前状态为：${currentStatusName}`);
            this.closeFalseAlarmDialog();
            return;
          }
        }

        const reviewNotes = this.falseAlarmForm.reviewNotes.trim() || '标记为误报';

        // 调用后端API标记误报
        const { alertAPI, archiveAPI } = await import('../../service/VisionAIService.js');
        const alertId = warningInfo._apiData ? warningInfo._apiData.alert_id : parseInt(this.archiveWarningId);
        const response = await alertAPI.markAlertAsFalseAlarm(
          alertId,
          currentStatus,
          reviewNotes
        );

        if (response.data && response.data.code === 0) {
          // 🔧 从后端响应中获取实际的操作人名字
          const operatorName = (response.data && response.data.data && response.data.data.reviewed_by) ||
                              (response.data && response.data.data && response.data.data.processed_by) ||
                              this.getCurrentUserName();

          // 添加误报记录到操作历史
          if (!this.warningList[warningIndex].operationHistory) {
            this.$set(this.warningList[warningIndex], 'operationHistory', []);
          }

          const newRecord = {
            id: Date.now() + Math.random(),
            status: 'completed',
            statusText: '误报处理',
            time: getCurrentAlertTime(),
            description: `预警被标记为误报：${reviewNotes}`,
            operationType: 'false_alarm',
            operator: operatorName
          };

          this.warningList[warningIndex].operationHistory.push(newRecord);
          this.syncWarningStatus(this.warningList[warningIndex], 5);
          this.warningList[warningIndex].isFalseAlarm = true;
          this.warningList[warningIndex].archiveTime = new Date().toLocaleString();

          // 状态提交成功后立即移出实时列表，再从后端重新拉取活动预警。
          await this.removeWarningAndReload(alertId);

          // 如果选择了归档，调用归档API
          if (this.falseAlarmForm.needArchive && this.falseAlarmForm.archiveId) {
            try {
              const archiveResponse = await archiveAPI.linkAlertsToArchive(
                this.falseAlarmForm.archiveId,
                [alertId],
                `误报记录归档：${reviewNotes}`
              );

              if (archiveResponse.data && archiveResponse.data.code === 0) {
                this.$message.success('预警已标记为误报，复判记录已保存并归档');
              } else {
                console.warn('⚠️ 误报记录归档失败:', archiveResponse.data);
                const errorMessage = (archiveResponse.data && archiveResponse.data.message) || '未知错误';
                this.$message.warning('预警已标记为误报，但归档失败: ' + errorMessage);
              }
            } catch (archiveError) {
              console.error('❌ 误报记录归档异常:', archiveError);
              this.$message.warning('预警已标记为误报，但归档时发生异常');
            }
          } else {
            this.$message.success('预警已标记为误报，复判记录已保存');
          }

        } else {
          this.$message.error((response.data && response.data.msg) || '标记误报失败');
        }

        // 关闭对话框并重置表单
        this.closeFalseAlarmDialog();

      } catch (error) {
        console.error('标记误报失败:', error);
        if (error.response && error.response.status === 409) {
          const detail = error.response.data && error.response.data.detail;
          this.$message.warning((detail && detail.message) || '预警状态已更新，请刷新后重试');
          await this.loadWarningData();
          this.closeFalseAlarmDialog();
        } else {
          this.$message.error('标记误报失败: ' + (error.message || '未知错误'));
        }
      } finally {
        this.loading = false;
      }
    },

    // 加载可用档案列表 - 与 warningArchives 页面使用相同的接口
    async loadAvailableArchives() {
      try {
        this.archiveListLoading = true;
        const { archiveAPI } = await import('../../service/VisionAIService.js');

        const response = await archiveAPI.getArchiveList({
          page: 1,
          limit: 100,
          status: 1 // 只获取正常状态的档案
        });


        // 后端返回格式：{ code: 0, msg: "获取成功", data: [...], pagination: {...} }
        if (response.data && response.data.code === 0 && response.data.data) {
          this.availableArchivesList = response.data.data;
        } else if (response.data && response.data.archives) {
          // 兼容其他可能的返回格式
          this.availableArchivesList = response.data.archives;
        } else if (response.data && Array.isArray(response.data)) {
          // 兼容直接返回数组的格式
          this.availableArchivesList = response.data;
        } else {
          console.warn('⚠️ 实时监控 - 获取档案列表格式异常:', response.data);
          this.availableArchivesList = [];
        }

        // 如果没有档案，提示用户
        if (this.availableArchivesList.length === 0) {
          console.warn('⚠️ 实时监控 - 当前没有可用档案，请先在预警档案页面创建档案');
        }
      } catch (error) {
        console.error('❌ 实时监控 - 加载档案列表失败:', error);
        this.availableArchivesList = [];
        // 显示错误提示，帮助用户了解问题
        this.$message.warning('加载档案列表失败，请检查网络连接或联系管理员');
      } finally {
        this.archiveListLoading = false;
      }
    },

    // 为误报创建新档案
    async createNewArchiveForFalseAlarm() {
      this.$prompt('请输入新档案名称', '创建档案', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /\S+/,
        inputErrorMessage: '档案名称不能为空',
        inputPlaceholder: '例如：误报记录档案'
      }).then(async ({ value }) => {
        try {
          const { archiveAPI } = await import('../../service/VisionAIService.js');
          const now = new Date();
          const startTime = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          const endTime = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

          const response = await archiveAPI.createArchive({
            name: value,
            location: '误报记录档案',
            description: '用于存储误报预警记录',
            start_time: startTime,
            end_time: endTime,
            created_by: this.getCurrentUserName()
          });


          // 后端直接返回档案对象
          if (response.data && response.data.archive_id) {
            const newArchive = {
              archive_id: response.data.archive_id,
              name: response.data.name,
              location: response.data.location,
              status: response.data.status || 1,
              total_alerts: response.data.total_alerts || 0,
              created_at: response.data.created_at
            };
            this.availableArchivesList.push(newArchive);
            this.falseAlarmForm.archiveId = newArchive.archive_id;
            this.$message.success('档案创建成功');
          } else {
            console.error('❌ 实时监控 - 创建误报档案响应格式异常:', response.data);
            this.$message.error('创建档案失败：响应格式异常');
          }
        } catch (error) {
          console.error('❌ 实时监控 - 创建误报档案失败:', error);
          this.$message.error('创建档案失败: ' + (error.message || '未知错误'));
        }
      }).catch(() => {
        // 用户取消
      });
    },

    // 为归档对话框创建新档案
    async createNewArchiveForArchiveDialog() {
      this.$prompt('请输入新档案名称', '创建档案', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /\S+/,
        inputErrorMessage: '档案名称不能为空',
        inputPlaceholder: '例如：2024年1月安全预警档案'
      }).then(async ({ value }) => {
        try {
          this.archiveListLoading = true;
          const { archiveAPI } = await import('../../service/VisionAIService.js');
          const now = new Date();
          const startTime = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          const endTime = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

          const response = await archiveAPI.createArchive({
            name: value,
            location: '实时预警归档',
            description: '从实时监控页面创建的预警档案',
            start_time: startTime,
            end_time: endTime,
            created_by: this.getCurrentUserName()
          });


          // 后端直接返回档案对象，不是包装格式
          if (response.data && response.data.archive_id) {
            const newArchive = {
              archive_id: response.data.archive_id,
              name: response.data.name,
              location: response.data.location,
              status: response.data.status || 1,
              total_alerts: response.data.total_alerts || 0,
              created_at: response.data.created_at
            };
            this.availableArchivesList.push(newArchive);
            this.selectedArchiveId = newArchive.archive_id;
            this.$message.success('档案创建成功，已自动选择');
          } else {
            console.error('❌ 实时监控 - 创建档案响应格式异常:', response.data);
            this.$message.error('创建档案失败：响应格式异常');
          }
        } catch (error) {
          console.error('❌ 实时监控 - 创建档案失败:', error);
          this.$message.error('创建档案失败: ' + (error.message || '未知错误'));
        } finally {
          this.archiveListLoading = false;
        }
      }).catch(() => {
        // 用户取消
      });
    },

    // 关闭误报对话框
    closeFalseAlarmDialog() {
      this.falseAlarmDialogVisible = false;
      this.falseAlarmForm.reviewNotes = '';
      this.falseAlarmForm.needArchive = false;
      this.falseAlarmForm.archiveId = null;
      this.archiveWarningId = '';
    },

    // 获取当前用户昵称
    getCurrentUserName() {
      return userService.getUserDisplayName();
    },
    // 跳转到更多预警页面
    goToMoreWarnings() {
      // 跳转到预警管理页面
      this.$router.push({
        path: '/monitoring/warningManage'
      });
    },
    // 获取预警图标
    getWarningIcon(level) {
      const iconMap = {
        'level1': 'el-icon-warning',
        'level2': 'el-icon-warning-outline',
        'level3': 'el-icon-warning-outline',
        'level4': 'el-icon-warning-outline'
      };
      return iconMap[level] || 'el-icon-warning';
    },

    // 同步预警的数字状态、显示状态和状态文案，避免不同入口更新不一致。
    syncWarningStatus(warning, apiStatus) {
      if (!warning) return false;

      const normalizedStatus = Number(apiStatus);
      const statusMap = {
        1: { value: 'pending', display: '待处理' },
        2: { value: 'processing', display: '处理中' },
        3: { value: 'completed', display: '已处理' },
        4: { value: 'archived', display: '已归档' },
        5: { value: 'false_alarm', display: '误报' }
      };
      const nextStatus = statusMap[normalizedStatus];
      if (!nextStatus) return false;

      this.$set(warning, 'status', nextStatus.value);
      if (warning._apiData) {
        this.$set(warning._apiData, 'status', normalizedStatus);
        this.$set(warning._apiData, 'status_display', nextStatus.display);
      }

      return true;
    },

    // 获取当前预警状态 - 优先使用API返回的status字段
    getCurrentWarningStatus(warning) {
      // 优先使用API返回的status字段（与后端alerts表的status字段对应）
      if (warning._apiData && typeof warning._apiData.status !== 'undefined') {
        const statusMap = {
          1: { text: '待处理', class: 'status-pending' },      // PENDING
          2: { text: '处理中', class: 'status-processing' },   // PROCESSING
          3: { text: '已处理', class: 'status-completed' },    // RESOLVED
          4: { text: '已归档', class: 'status-archived' },     // ARCHIVED
          5: { text: '误报', class: 'status-false-alarm' }     // FALSE_ALARM
        };
        const result = statusMap[warning._apiData.status] || { text: '未知', class: 'status-pending' };
        return result;
      }

      // 如果没有API数据，使用operationHistory判断（向后兼容）
      if (!warning.operationHistory || warning.operationHistory.length === 0) {
        return {
          text: '待处理',
          class: 'status-pending'
        };
      }

      // 检查是否已归档或误报
      const hasArchived = warning.operationHistory.some(record =>
        record.operationType === 'archive' || record.operationType === 'false_alarm'
      ) || warning.status === 'archived' || warning.status === 'false_alarm';

      if (hasArchived) {
        return warning.status === 'false_alarm'
          ? { text: '误报', class: 'status-false-alarm' }
          : { text: '已归档', class: 'status-archived' };
      }

      // 检查是否有已处理状态
      const hasCompletedProcessing = warning.operationHistory.some(record =>
        record.operationType === 'completed'
      );

      if (hasCompletedProcessing) {
        return {
          text: '已处理',
          class: 'status-completed'
        };
      }

      // 检查是否有处理中状态（包括processing和processing-action）
      const hasActiveProcessing = warning.operationHistory.some(record =>
        record.operationType === 'processing' || record.operationType === 'processing-action'
      );

      if (hasActiveProcessing) {
        return {
          text: '处理中',
          class: 'status-processing'
        };
      }

      // 检查是否已经确认开始处理（待处理状态完成）
      const hasPendingCompleted = warning.operationHistory.some(record =>
        record.operationType === 'pending' && record.status === 'completed'
      );

      if (hasPendingCompleted) {
        return {
          text: '处理中',
          class: 'status-processing'
        };
      }

      // 默认为待处理
      return {
        text: '待处理',
        class: 'status-pending'
      };
    },

    // 检查处理按钮是否应该禁用
    isProcessingDisabled(warning) {
      if (!warning) {
        return true;
      }

      // 当前后端状态是处理按钮的权威依据，历史完成记录不能覆盖重新处理后的状态。
      if (warning._apiData && typeof warning._apiData.status !== 'undefined') {
        return [3, 4, 5].includes(Number(warning._apiData.status));
      }

      // 向后兼容没有原始API数据的列表项。
      if (warning.status) {
        return ['completed', 'archived', 'false_alarm'].includes(warning.status);
      }

      const operationHistory = Array.isArray(warning.operationHistory)
        ? warning.operationHistory
        : [];
      const latestStatusRecord = [...operationHistory].reverse().find(record =>
        ['pending', 'processing', 'completed', 'archive', 'false_alarm'].includes(record.operationType)
      );

      if (!latestStatusRecord) {
        return false;
      }

      return ['completed', 'archive', 'false_alarm'].includes(latestStatusRecord.operationType);
    },

    // 格式化时间显示
    formatTime(timeString) {
      try {
        if (!timeString) {
          return '时间未知';
        }

        // 处理不同的时间格式
        if (timeString.includes('/') && timeString.includes(' ')) {
          // 本地化格式: "2025/06/30 17:05:35"
          const [date, time] = timeString.split(' ');
          const [year, month, day] = date.split('/');
          return `${month}-${day} ${time}`;
        } else if (timeString.includes('-') && timeString.includes(' ')) {
          // 标准格式: "2025-06-30 17:05:35"
          const [date, time] = timeString.split(' ');
          const [year, month, day] = date.split('-');
          return `${month}-${day} ${time}`;
        } else if (timeString.includes('T')) {
          // ISO格式，直接转换
          const date = new Date(timeString);
          if (!isNaN(date.getTime())) {
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${month}-${day} ${hours}:${minutes}:${seconds}`;
          }
        }

        // 如果无法识别格式，直接返回
        return timeString;
      } catch (error) {
        return timeString || '时间解析失败';
      }
    },

    // =================== API数据加载相关方法 ===================

    // 已处理或误报后先立即移出本地列表，再重新拉取活动预警。
    async removeWarningAndReload(alertId) {
      const index = this.warningList.findIndex(item => {
        const itemAlertId = item._apiData ? item._apiData.alert_id : item.id;
        return String(itemAlertId) === String(alertId);
      });

      if (index !== -1) {
        this.warningList.splice(index, 1);
      }

      await this.loadWarningData();
    },

    getWarningIdentity(warning) {
      if (!warning) return '';
      const apiData = warning._apiData || {};
      const alertId = apiData.alert_id;
      if (alertId !== undefined && alertId !== null && String(alertId).trim()) {
        return `alert:${String(alertId)}`;
      }
      const messageId = apiData.message_id || warning.messageId;
      if (messageId) return `message:${String(messageId)}`;
      return warning.id !== undefined && warning.id !== null
        ? `local:${String(warning.id)}`
        : '';
    },

    mergeWarningLists(...warningLists) {
      const identities = new Set();
      const merged = [];
      warningLists.forEach(list => {
        (list || []).forEach(warning => {
          if (!warning || this.isProcessedStatus(warning.status)) return;
          const identity = this.getWarningIdentity(warning);
          if (identity && identities.has(identity)) return;
          if (identity) identities.add(identity);
          merged.push(warning);
        });
      });
      return merged;
    },

    // 加载预警数据。请求期间到达的SSE事件优先，避免旧快照覆盖实时消息。
    async loadWarningData(options = {}) {
      const requestId = ++this.warningRequestId;
      const sseSequenceAtStart = this.sseMessageSequence;
      try {
        this.apiDataLoading = true;
        this.currentPage = 1;

        // 调用API获取预警列表
        const params = {
          page: 1,
          limit: this.pageSize,
          // 后端先限定待处理/处理中，再按时间倒序分页。
          active_only: true,
        };

        const response = await alertAPI.getRealTimeAlerts(params);
        if (requestId !== this.warningRequestId || this.componentDestroyed) return;

        if (response.data && response.data.code === 0) {
          // 修正数据结构 - 数据直接在data字段中（是一个数组）
          let apiWarnings = [];
          if (Array.isArray(response.data.data)) {
            // 数据直接是数组
            apiWarnings = response.data.data;
          } else if (response.data.data && Array.isArray(response.data.data.alerts)) {
            // 数据在data.alerts中
            apiWarnings = response.data.data.alerts;
          } else if (Array.isArray(response.data.alerts)) {
            // 数据在alerts字段中
            apiWarnings = response.data.alerts;
          }

          const convertedWarnings = apiWarnings.map(warning =>
            this.convertAPIWarningToFrontend(warning)
          ).filter(warning => warning !== null);

          const realtimeArrivals = this.warningList.filter(warning =>
            Number(warning._sseSequence || 0) > sseSequenceAtStart
          );
          this.warningList = this.mergeWarningLists(
            realtimeArrivals,
            convertedWarnings
          ).slice(0, this.pageSize);

        } else {
          if (options.showError !== false) {
            this.$message.warning('获取预警数据失败，保留当前实时列表');
          }
        }
      } catch (error) {
        if (requestId === this.warningRequestId && !this.componentDestroyed && options.showError !== false) {
          this.$message.error('加载预警数据失败，请检查网络连接');
        }
      } finally {
        if (requestId === this.warningRequestId && !this.componentDestroyed) {
          this.apiDataLoading = false;
        }
      }
    },

    // 将API预警数据转换为前端格式
    convertAPIWarningToFrontend(apiWarning) {
      try {
        // 根据你提供的API数据格式进行准确映射，确保所有字段都有默认值
        const convertedWarning = {
          id: apiWarning.alert_id || `temp_${Date.now()}`,
          time: formatAlertDateTime(apiWarning.alert_time) || '时间未知',
          device: apiWarning.camera_name || `摄像头${apiWarning.camera_id || '未知'}`,
          alertName: apiWarning.alert_name || '未知预警',  // 预警名称（如：未佩戴安全带）
          type: apiWarning.alert_type || '未知类型',        // 预警类型（如：安全生产预警）
          level: toAlertLevelKey(apiWarning.alert_level) || 'level4',
          location: apiWarning.location || '未知位置',
          status: toAlertStatusKey(apiWarning.status, apiWarning.status_display) || 'pending',
          imageUrl: this.getWarningImageUrl(apiWarning) || null,
          // 🔧 修复：添加视频URL字段，用于预警详情页播放视频
          videoUrl: this.getWarningVideoUrl(apiWarning) || null,
          minio_video_url: this.getWarningVideoUrl(apiWarning) || null,
          minio_frame_url: this.getWarningImageUrl(apiWarning) || null,
          description: apiWarning.alert_description || '无描述信息',
          operationHistory: this.convertProcessHistory(apiWarning.process, apiWarning.status, formatAlertDateTime(apiWarning.alert_time), apiWarning.processed_by, formatAlertDateTime(apiWarning.resolved_at || apiWarning.processed_at), apiWarning.processing_notes) || [],
          // 添加额外的API数据字段
          messageId: apiWarning.message_id || null,
          taskId: apiWarning.task_id || null,
          task_id: apiWarning.task_id || null,  // 合并图片URL拼接需要
          electronicFence: apiWarning.electronic_fence || null,
          result: apiWarning.result || null,
          // 🔧 修复：添加合并预警相关字段，用于显示"查看合并"按钮
          is_merged: apiWarning.is_merged || false,
          alert_count: apiWarning.alert_count || 1,
          alert_duration: apiWarning.alert_duration || 0,
          alert_images: apiWarning.alert_images || [],
          first_alert_time: apiWarning.first_alert_time || null,
          last_alert_time: apiWarning.last_alert_time || null,
          // 保存原始API数据，用于状态判断和其他功能
          _apiData: {
            alert_id: apiWarning.alert_id,
            message_id: apiWarning.message_id,
            status: apiWarning.status,  // 保存原始status数字（1-5）
            status_display: apiWarning.status_display,
            alert_time: apiWarning.alert_time,
            camera_id: apiWarning.camera_id,
            task_id: apiWarning.task_id,
            process: apiWarning.process,
            minio_video_url: apiWarning.minio_video_url,  // 保存原始视频URL
            minio_video_object_name: apiWarning.minio_video_object_name,
            is_merged: apiWarning.is_merged,
            alert_count: apiWarning.alert_count,
            alert_images: apiWarning.alert_images
          }
        };


        return convertedWarning;
      } catch (error) {
        console.error('❌ 转换API预警数据失败:', error);
        return null;
      }
    },

    // 获取预警图片URL
    getWarningImageUrl(apiWarning) {
      try {
        // 优先使用常见的图片字段
        const imageFields = [
          'minio_frame_url',
          'alert_image_url',
          'image_url',
          'frame_url',
          'snapshot_url',
          'picture_url'
        ];

        for (const field of imageFields) {
          if (apiWarning[field]) {
            const imageUrl = apiWarning[field];
            // 如果是相对路径，拼接基础URL
            if (imageUrl.startsWith('/')) {
              return `${window.baseUrl || ''}${imageUrl}`;
            }
            return imageUrl;
          }
        }

        // 如果没有直接的图片URL，但有result数据，可能可以生成预览图或使用占位符
        if (apiWarning.result && apiWarning.result.length > 0) {
          // 暂时返回null，后续可以考虑生成预览图
        }

        // 如果没有图片，返回null
        return null;
      } catch (error) {
        return null;
      }
    },

    // 🔧 新增：获取预警视频URL
    getWarningVideoUrl(apiWarning) {
      try {
        // 优先使用常见的视频字段
        const videoFields = [
          'minio_video_url',
          'video_url',
          'alert_video_url',
          'clip_url'
        ];

        for (const field of videoFields) {
          if (apiWarning[field]) {
            const videoUrl = apiWarning[field];
            // 如果是相对路径，拼接基础URL
            if (videoUrl.startsWith('/')) {
              return `${window.baseUrl || ''}${videoUrl}`;
            }
            return videoUrl;
          }
        }

        // 如果没有视频URL，返回null
        return null;
      } catch (error) {
        return null;
      }
    },

    // 刷新预警数据
    async refreshWarningData() {
      try {
        this.$message.info('正在刷新预警数据...');

        // 重置分页状态
        this.currentPage = 1;

        await this.loadWarningData();

        this.$message.success('预警数据刷新成功');
      } catch (error) {
        this.$message.error('刷新预警数据失败');
      }
    },

    // =================== SSE连接相关方法 ===================

    // 初始化SSE连接
    initSSEConnection() {
      if (this.componentDestroyed) return;

      // 如果已有连接，先关闭
      if (this.sseConnection) {
        this.sseConnection.close();
        this.sseConnection = null;
      }

      // 创建新的SSE连接，通过 onOpen 回调在连接真正建立（含断线重连成功）时更新状态
      this.sseConnection = alertAPI.createAlertSSEConnection(
        this.handleSSEMessage.bind(this),   // 消息处理
        this.handleSSEError.bind(this),     // 错误处理
        this.handleSSEClose.bind(this),     // 连接关闭处理
        this.handleSSEOpen.bind(this),      // 连接建立/重连成功处理
        { lastEventId: this.sseLastEventId }
      );
    },

    // 处理SSE消息
    handleSSEMessage(messageData, event) {
      if (event && event.lastEventId) {
        this.sseLastEventId = String(event.lastEventId);
      }
      if (!messageData || messageData.event === 'heartbeat') {
        return;
      }
      if (messageData.event === 'connected') {
        const replayed = Number(messageData.replayed || 0);
        this.sseReplayRemaining = Number.isFinite(replayed) && replayed > 0
          ? replayed
          : 0;
        if (this.sseReplayRemaining === 0) {
          this.loadWarningData({ showError: false });
        }
        return;
      }
      if (messageData.event === 'resync_required') {
        this.sseReplayRemaining = 0;
        this.loadWarningData({ showError: false });
        return;
      }
      // 如果是AI预警消息
      if (messageData.alert_id || messageData.id) {
        this.handleNewAlert(messageData, event && event.lastEventId);
        if (this.sseReplayRemaining > 0) {
          this.sseReplayRemaining--;
          if (this.sseReplayRemaining === 0) {
            this.loadWarningData({ showError: false });
          }
        }
      }
    },

    rememberSSEEvent(eventId) {
      const normalizedId = eventId ? String(eventId).trim() : '';
      if (!normalizedId) return true;
      if (this.sseSeenEventIds.has(normalizedId)) return false;

      this.sseSeenEventIds.add(normalizedId);
      this.sseSeenEventOrder.push(normalizedId);
      while (this.sseSeenEventOrder.length > 1000) {
        const expiredId = this.sseSeenEventOrder.shift();
        this.sseSeenEventIds.delete(expiredId);
      }
      return true;
    },

    // 处理新预警
    handleNewAlert(alertData, eventId = '') {
      try {
        const stableEventId = eventId || alertData.message_id || '';
        if (stableEventId && this.sseSeenEventIds.has(String(stableEventId).trim())) {
          return;
        }

        // 将后端预警数据转换为前端格式 - 统一使用API转换方法
        const newWarning = this.convertAPIWarningToFrontend(alertData);

        if (!newWarning || this.isProcessedStatus(newWarning.status)) {
          return;
        }

        if (!this.rememberSSEEvent(stableEventId)) return;

        const warningIdentity = this.getWarningIdentity(newWarning);
        const existingIndex = this.warningList.findIndex(warning =>
          this.getWarningIdentity(warning) === warningIdentity
        );
        const replacesExisting = existingIndex !== -1;
        if (replacesExisting) {
          this.warningList.splice(existingIndex, 1);
        }

        newWarning._sseSequence = ++this.sseMessageSequence;
        this.warningList.unshift(newWarning);

        // 限制列表长度，只保留最新一页预警
        if (this.warningList.length > this.pageSize) {
          this.warningList = this.warningList.slice(0, this.pageSize);
        }
        // 新预警已添加到列表
      } catch (error) {
        // 静默处理错误
      }
    },

    // 判断预警状态是否为已处理（已处理/已归档/误报等不需要在实时预警中展示的状态）
    isProcessedStatus(status) {
      const processedStatuses = ['completed', 'archived', 'false_alarm'];
      return processedStatuses.includes(status);
    },

    // 转换处理历史 - 确保与状态判断逻辑一致
    // alertTime: 预警产生时间, processedAt: 处理时间
    convertProcessHistory(processData, apiStatus, alertTime, processedBy, processedAt, processingNotes) {
      return buildAlertProcessHistory({
        processData,
        apiStatus,
        alertTime,
        processedBy,
        processedAt,
        processingNotes,
        formatTime: value => formatAlertDateTime(value),
        currentTime: () => getCurrentAlertTime()
      });
    },

    // 处理SSE连接建立/重连成功
    handleSSEOpen() {
      if (this.componentDestroyed) return;
      this.sseStatus.connected = true;
      this.sseStatus.reconnecting = false;
    },

    // 处理SSE错误（EventSource断线后会自动重连，此时readyState为CONNECTING）
    handleSSEError() {
      const es = this.sseConnection;
      if (es && es.readyState === EventSource.CONNECTING) {
        this.sseStatus.connected = false;
        this.sseStatus.reconnecting = true;
        return;
      }
      this.sseStatus.connected = false;
      this.sseStatus.reconnecting = false;
    },

    // 处理SSE连接关闭
    handleSSEClose() {
      this.sseStatus.connected = false;
      this.sseStatus.reconnecting = false;
    },

    // 清理SSE连接
    cleanupSSEConnection() {

      if (this.sseConnection) {
        this.sseConnection.close();
        this.sseConnection = null;
      }

      this.sseReplayRemaining = 0;
      this.sseStatus.connected = false;
      this.sseStatus.reconnecting = false;
    },

    // 获取SSE状态样式类
    getSSEStatusClass() {
      if (this.sseStatus.connected) return 'status-connected';
      if (this.sseStatus.reconnecting) return 'status-reconnecting';
      return 'status-disconnected';
    },

    // 获取SSE状态文本
    getSSEStatusText() {
      if (this.sseStatus.connected) return '已连接';
      if (this.sseStatus.reconnecting) return '重连中';
      return '未连接';
    },

    // 🆕 ========== OSD检测框叠加功能 ==========

    getDetectionCount(index) {
      const dets = this.detectionResults[index] && this.detectionResults[index].detections
      return dets ? `${dets.length} 个` : '0 个'
    },

    getDetectionLabels(index) {
      const dets = this.detectionResults[index] && this.detectionResults[index].detections
      if (!dets || !dets.length) return ''
      const labels = dets.map(d => d.label || d.class_name).filter(Boolean)
      if (!labels.length) return ''
      // 最多展示前 3 个标签，其余用数量概括，避免撑大浮层
      if (labels.length <= 3) return labels.join(', ')
      return `${labels.slice(0, 3).join(', ')} 等${labels.length}个`
    },

    getDetectionDebugTitle(index) {
      const ws = this.wsConnections[index] ? '已连接' : '未连接'
      const count = this.getDetectionCount(index)
      const dets = this.detectionResults[index] && this.detectionResults[index].detections
      const labels = dets && dets.length
        ? dets.map(d => d.label || d.class_name).filter(Boolean).join(', ')
        : ''
      const updated = this.detectionUpdateTime[index] || '无数据'
      return `WS: ${ws}\n目标: ${count}${labels ? `\n列表: ${labels}` : ''}\n更新: ${updated}`
    },

    /**
     * 加载指定摄像头的可用AI任务列表
     */
    aiTaskOptionLabel(task) {
      return (task && (task.skill_name || task.task_name)) || ''
    },
    aiTaskOptionHint(task) {
      if (!task) return ''
      const skill = String(task.skill_name || '').trim()
      const alert = String(task.alert_name || '').trim()
      if (alert && alert !== skill) return alert
      return ''
    },

    async loadAvailableAITasks(cameraId) {
      try {
        const response = await realtimeDetectionAPI.getTasksByCamera(cameraId)
        if (response.data && response.data.code === 0) {
          this.$set(this.availableAITasks, cameraId, response.data.data || [])
        }
      } catch (error) {
        // Worker 重启/503 时保留上次列表，避免下拉框被空数据冲掉
        console.error(`❌ 获取摄像头AI任务列表失败:`, error)
      }
    },

    handleVisibilityChange() {
      if (!document.hidden) {
        this.refreshPlayingCameraAITasks()
      }
    },

    async refreshPlayingCameraAITasks() {
      if (this.componentDestroyed || document.hidden || this.aiTaskPollInFlight) {
        return
      }

      const ids = Object.values(this.cameraIdMapping || {}).filter(
        id => id != null && id !== ''
      )
      const unique = [...new Set(ids.map(id => String(id)))]
      if (!unique.length) return

      const requestId = ++this.aiTaskPollRequestId
      this.aiTaskPollInFlight = true
      try {
        const response = await realtimeDetectionAPI.getTasksByCameras(unique)
        if (this.componentDestroyed || requestId !== this.aiTaskPollRequestId) return

        if (response.data && response.data.code === 0) {
          const tasksByCamera = response.data.data || {}
          unique.forEach(cameraId => {
            this.$set(this.availableAITasks, cameraId, tasksByCamera[cameraId] || [])
          })
        }
      } catch (error) {
        // Worker 重启/503 时保留上次列表，避免下拉框被空数据冲掉
        console.error('❌ 批量刷新摄像头AI任务列表失败:', error)
      } finally {
        if (requestId === this.aiTaskPollRequestId) {
          this.aiTaskPollInFlight = false
        }
      }
    },

    /**
     * AI任务选择变化处理
     */
    onTaskSelectionChange(index) {
      const taskId = this.selectedAITasks[index]
      const { closeWebSocket } = require('./utils/detectionWebSocket')

      // 断开旧连接（含 CONNECTING，避免泄漏）
      closeWebSocket(this.wsConnections[index])
      if (this.wsConnections[index]) {
        delete this.wsConnections[index]
      }

      // 清空检测结果
      this.$set(this.detectionResults, index, null)

      // 如果选择了任务，建立WebSocket连接
      if (taskId) {
        this.connectDetectionWebSocket(index, taskId)
      }
    },

    /**
     * 连接检测结果WebSocket
     */
    connectDetectionWebSocket(index, taskId) {
      const { createDetectionWebSocket, closeWebSocket } = require('./utils/detectionWebSocket')
      // 先关掉该格子上可能残留的连接
      closeWebSocket(this.wsConnections[index])

      // 立刻挂上引用（不要等 onOpen），否则切摄像头时 cleanup 关不到 CONNECTING 的 socket
      const ws = createDetectionWebSocket(taskId, {
        onMessage: (parsed) => {
          if (this.wsConnections[index] !== ws) return
          this.$set(this.detectionResults, index, {
            detections: parsed.detections,
            status_tags: parsed.statusTags || [],
            frame_size: parsed.frameSize,
            frame_timestamp: parsed.frameTimestamp
          })
          const now = new Date()
          this.$set(this.detectionUpdateTime, index,
            `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`)
          this.$set(this.videoResolutions, index, {
            width: parsed.frameSize.width,
            height: parsed.frameSize.height
          })
        },
        onClose: (closedWs) => {
          if (this.wsConnections[index] === closedWs) {
            delete this.wsConnections[index]
            const keepTaskId = this.selectedAITasks[index]
            if (keepTaskId) {
              setTimeout(() => {
                if (this.selectedAITasks[index] === keepTaskId && !this.wsConnections[index]) {
                  this.connectDetectionWebSocket(index, keepTaskId)
                }
              }, 1500)
            }
          }
        }
      })
      this.$set(this.wsConnections, index, ws)
    },

    /**
     * 获取视频窗口宽度
     */
    getVideoWidth(index) {
      // 尝试获取实际的video/canvas元素
      const playerRef = this.$refs[`player${index}`]
      if (playerRef && playerRef[0]) {
        const playerEl = playerRef[0].$el
        if (playerEl) {
          const videoEl = playerEl.querySelector('video') || playerEl.querySelector('canvas')
          if (videoEl) {
            return videoEl.clientWidth || 640
          }
        }
      }

      // 降级方案：使用容器尺寸
      const ref = this.$refs[`videoContent${index}`]
      if (ref && ref[0]) {
        return ref[0].clientWidth || 640
      }
      return 640
    },

    /**
     * 获取视频窗口高度
     */
    getVideoHeight(index) {
      // 尝试获取实际的video/canvas元素
      const playerRef = this.$refs[`player${index}`]
      if (playerRef && playerRef[0]) {
        const playerEl = playerRef[0].$el
        if (playerEl) {
          const videoEl = playerEl.querySelector('video') || playerEl.querySelector('canvas')
          if (videoEl) {
            return videoEl.clientHeight || 480
          }
        }
      }

      // 降级方案：使用容器尺寸
      const ref = this.$refs[`videoContent${index}`]
      if (ref && ref[0]) {
        return ref[0].clientHeight || 480
      }
      return 480
    },

    /**
     * 清理指定索引的OSD资源
     */
    cleanupOSDResources(index) {
      const { closeWebSocket } = require('./utils/detectionWebSocket')
      closeWebSocket(this.wsConnections[index])
      if (this.wsConnections[index]) {
        delete this.wsConnections[index]
      }

      // 清空数据
      this.$set(this.selectedAITasks, index, null)
      this.$set(this.detectionResults, index, null)
      this.$set(this.videoResolutions, index, null)
      this.$set(this.detectionUpdateTime, index, null)
    },

    /**
     * 清理所有OSD资源
     */
    cleanupAllOSDResources() {
      const { closeWebSocket } = require('./utils/detectionWebSocket')
      Object.values(this.wsConnections).forEach(ws => closeWebSocket(ws))

      // 清空所有数据
      this.wsConnections = {}
      this.selectedAITasks = {}
      this.detectionResults = {}
      this.availableAITasks = {}
      this.cameraIdMapping = {}
      this.cameraNames = {}
      this.videoResolutions = {}
      this.detectionUpdateTime = {}
    }
    // 🆕 ========== OSD检测框叠加功能结束 ==========

  }
}
</script>

<style scoped src="./styles/realTimeMonitoring.scoped.css"></style>

<!-- 全局样式，处理全屏模式 -->
<style src="./styles/realTimeMonitoring.global.css"></style>
