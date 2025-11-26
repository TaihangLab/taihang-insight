<template>
  <div id="realTimeMonitoring" class="realtime-monitoring-container">
    <el-container v-loading="loading" class="main-container" element-loading-text="加载中">
    <!-- 左侧设备列表 - 科技感设计 -->
      <el-aside width="250px" class="device-tree-aside">
        <div class="custom-tree-header">
          <div class="header-title">
            <i class="el-icon-video-camera"></i>
            <span>通道列表</span>
          </div>
          <div class="header-switch">
            <el-switch
              v-model="showRegion"
              active-color="#3b82f6"
              inactive-color="#10b981"
              active-text="行政区划"
              inactive-text="业务分组">
            </el-switch>
          </div>
        </div>
        <div class="custom-tree-container">
          <div v-if="showRegion" style="height: 100%">
            <RegionTree ref="regionTree" :edit="false" :showHeader="false" :hasChannel="true" :clickEvent="treeNodeClickEvent"></RegionTree>
          </div>
          <div v-if="!showRegion" style="height: 100%">
            <GroupTree ref="groupTree" :edit="false" :showHeader="false" :hasChannel="true" :clickEvent="treeNodeClickEvent"></GroupTree>
          </div>
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
                      <i class="el-icon-video-camera-solid"></i>
                      <div>{{ videoTip[index-1] ? videoTip[index-1] : "无信号" }}</div>
                    </div>
                    <div v-else class="video-player-wrapper">
                      <player :ref="'player'+(index-1)" :videoUrl="videoUrl[index-1]" fluent autoplay @screenshot="shot"
                              @destroy="destroy"/>
                      
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
                            :label="`${task.task_name}`"
                            :value="task.task_id">
                            <span style="float: left">{{ task.task_name }}</span>
                            <span style="float: right; color: #8492a6; font-size: 12px">{{ task.skill_name }}</span>
                          </el-option>
                        </el-select>
                      </div>
                      
                      <!-- 🆕 调试信息显示区域 -->
                      <div v-if="selectedAITasks[index-1]" class="detection-debug-info">
                        <div class="debug-line">
                          <span class="debug-label">WebSocket:</span>
                          <span :class="['debug-value', wsConnections[index-1] ? 'connected' : 'disconnected']">
                            {{ wsConnections[index-1] ? '已连接' : '未连接' }}
                          </span>
                        </div>
                        <div class="debug-line" v-if="detectionResults[index-1]">
                          <span class="debug-label">检测目标:</span>
                          <span class="debug-value">{{ detectionResults[index-1].detections ? detectionResults[index-1].detections.length : 0 }} 个</span>
                        </div>
                        <div class="debug-line" v-if="detectionResults[index-1] && detectionResults[index-1].detections && detectionResults[index-1].detections.length > 0">
                          <span class="debug-label">目标列表:</span>
                          <span class="debug-value">
                            {{ detectionResults[index-1].detections.map(d => d.label || d.class_name).join(', ') }}
                          </span>
                        </div>
                        <div class="debug-line">
                          <span class="debug-label">最后更新:</span>
                          <span class="debug-value">{{ detectionUpdateTime[index-1] || '无数据' }}</span>
                        </div>
                      </div>
                      
                      <!-- 🆕 检测框OSD叠加层 -->
                      <detection-overlay
                        v-if="selectedAITasks[index-1] && detectionResults[index-1]"
                        :container-width="getVideoWidth(index-1)"
                        :container-height="getVideoHeight(index-1)"
                        :video-width="getActualVideoWidth(index-1)"
                        :video-height="getActualVideoHeight(index-1)"
                        :detections="detectionResults[index-1].detections || []">
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
                      <i class="el-icon-video-camera-solid"></i>
                      <div>{{ videoTip[index-1] ? videoTip[index-1] : "无信号" }}</div>
                    </div>
                    <div v-else class="video-player-wrapper">
                      <player :ref="'player'+(index-1)" :videoUrl="videoUrl[index-1]" fluent autoplay @screenshot="shot"
                              @destroy="destroy"/>
                      
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
                            :label="`${task.task_name}`"
                            :value="task.task_id">
                            <span style="float: left">{{ task.task_name }}</span>
                            <span style="float: right; color: #8492a6; font-size: 12px">{{ task.skill_name }}</span>
                          </el-option>
                        </el-select>
                      </div>
                      
                      <!-- 🆕 调试信息显示区域（全屏模式） -->
                      <div v-if="selectedAITasks[index-1]" class="detection-debug-info">
                        <div class="debug-line">
                          <span class="debug-label">WebSocket:</span>
                          <span :class="['debug-value', wsConnections[index-1] ? 'connected' : 'disconnected']">
                            {{ wsConnections[index-1] ? '已连接' : '未连接' }}
                          </span>
                        </div>
                        <div class="debug-line" v-if="detectionResults[index-1]">
                          <span class="debug-label">检测目标:</span>
                          <span class="debug-value">{{ detectionResults[index-1].detections ? detectionResults[index-1].detections.length : 0 }} 个</span>
                        </div>
                        <div class="debug-line" v-if="detectionResults[index-1] && detectionResults[index-1].detections && detectionResults[index-1].detections.length > 0">
                          <span class="debug-label">目标列表:</span>
                          <span class="debug-value">
                            {{ detectionResults[index-1].detections.map(d => d.label || d.class_name).join(', ') }}
                          </span>
                        </div>
                        <div class="debug-line">
                          <span class="debug-label">最后更新:</span>
                          <span class="debug-value">{{ detectionUpdateTime[index-1] || '无数据' }}</span>
                        </div>
                      </div>
                      <!-- 🆕 检测框OSD叠加层（全屏模式） -->
                      <detection-overlay
                        v-if="selectedAITasks[index-1] && detectionResults[index-1]"
                        :container-width="getVideoWidth(index-1)"
                        :container-height="getVideoHeight(index-1)"
                        :video-width="videoResolutions[index-1] ? videoResolutions[index-1].width : 1920"
                        :video-height="videoResolutions[index-1] ? videoResolutions[index-1].height : 1080"
                        :detections="detectionResults[index-1].detections || []">
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
          <div class="sse-status-indicator" :class="getSSSStatusClass()">
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
      :warning="currentWarning"
      source="realTimeMonitoring"
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
            placeholder="请输入复判意见，说明为什么判定为误报"
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
import DeviceTree from '../../common/DeviceTree.vue'
// 使用本地专用组件（改造后的实时监控专用API）
import RegionTree from './components/RegionTree.vue'
import GroupTree from './components/GroupTree.vue'
import WarningDetail from './warningDetail.vue'
// 🆕 导入OSD检测框组件
import DetectionOverlay from './components/DetectionOverlay.vue'
import screenfull from "screenfull";
import { alertAPI, realtimeMonitorAPI, realtimeDetectionAPI } from '../../service/VisionAIService.js';
// 🆕 导入配置文件获取后端地址
const config = require('../../../../config/index.js');

export default {
  name: "RealTimeMonitoring",
  components: {
    player, DeviceTree, RegionTree, GroupTree, WarningDetail, DetectionOverlay
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
      // 视频URL数组
      videoUrl: [],
      // 视频提示信息
      videoTip: [],
      // 播放器索引
      playerIdx: 0,
      // 加载状态
      loading: false,
      // 显示行政区划或业务分组
      showRegion: true,

      // 预警列表数据 - 从API获取
      warningList: [],
      warningDetailVisible: false,
      currentWarning: null,

      // 添加预警管理相关的数据属性
      // archivesList: [],  // 已废弃，使用 availableArchivesList
      currentCameraId: '',
      
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
      reportWarningId: '',

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
      sseStatus: {
        connected: false
      },

      // API数据加载相关
      apiDataLoading: false,
      totalWarnings: 0,
      currentPage: 1,
      pageSize: 10, // 只显示最新的10条预警数据
    }
  },
  computed: {
    // 过滤后的设备分组
    filteredDeviceGroups() {
      return this.deviceGroups
        .map(group => {
          // 创建一个新的组对象，避免修改原始数据
          const newGroup = { ...group };

          // 根据行政区划过滤
          if (this.selectedRegion && group.region !== this.selectedRegion) {
            return null;
          }

          // 过滤设备
          newGroup.devices = group.devices.filter(device => {
            // 按业务分组过滤
            if (this.selectedIndustry && device.industry !== this.selectedIndustry) {
              return false;
            }

            // 按关键词搜索过滤
            if (this.searchKeyword && !device.name.toLowerCase().includes(this.searchKeyword.toLowerCase())) {
              return false;
            }

            return true;
          });

          // 如果组内没有设备，则不显示该组
          if (newGroup.devices.length === 0) {
            return null;
          }

          return newGroup;
        })
        .filter(group => group !== null);
    },

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
  mounted() {
    // 启动时间更新定时器
    this.updateDateTime();
    this.timer = setInterval(this.updateDateTime, 1000);

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
    console.log('🚀 实时监控页面 - 开始预加载档案列表');
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
    // 组件销毁时清理
    this.exitFullscreen();
    document.body.classList.remove('camera-fullscreen-mode');
    clearInterval(this.timer);

    // 清理SSE连接
    this.cleanupSSEConnection();

    // 移除事件监听器
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('mozfullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('MSFullscreenChange', this.handleFullscreenChange);

    // 移除窗口大小变化监听器
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    // 切换分组展开/折叠
    toggleGroup(groupIndex) {
      this.$set(this.deviceGroups[groupIndex], 'expanded', !this.deviceGroups[groupIndex].expanded);
    },

    // 选择设备
    selectDevice(groupIndex, deviceIndex, device) {
      const deviceKey = 'device-' + groupIndex + '-' + deviceIndex;
      this.selectedDevice = this.selectedDevice === deviceKey ? null : deviceKey;

      if (this.selectedDevice) {
        // 发送设备推流请求
        this.sendDevicePush(device.channelId);
      }
    },

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
    // 获取网格列模板
    getGridColumns() {
      if (this.viewMode === 'single') return "minmax(0, 1fr)"
      if (this.viewMode === 'four') return "minmax(0, 1fr) minmax(0, 1fr)"
      return "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)"
    },
    // 获取网格行模板
    getGridRows() {
      if (this.viewMode === 'single') return "minmax(0, 1fr)"
      if (this.viewMode === 'four') return "minmax(0, 1fr) minmax(0, 1fr)"
      return "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)"
    },
    // 切换视图模式
    switchViewMode(mode) {
      this.viewMode = mode
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
      this.clear(idx.substring(idx.length - 1));
    },
    // 清除播放数据
    clear(idx) {
      this.$set(this.videoUrl, idx - 1, '');
      this.$set(this.videoTip, idx - 1, '');
    },
    // 设置播放URL
    setPlayUrl(url, idx) {
      this.$set(this.videoUrl, idx, url);
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
    // 设备树上下文菜单事件
    contextMenuEvent(device, event, data, isCatalog) {
      // 上下文菜单处理
    },
    // 向设备发送推流请求
    async sendDevicePush(channelId) {
      let idxTmp = this.playerIdx;
      this.setPlayUrl("", idxTmp);
      this.$set(this.videoTip, idxTmp, "正在拉流...");
      
      // 🆕 保存摄像头ID映射
      this.$set(this.cameraIdMapping, idxTmp, channelId);
      
      this.loading = true;

      try {
        console.log('🎬 开始播放通道 - 通道ID:', channelId, '播放器索引:', idxTmp);
        
        // 使用新的专用API播放通道
        const response = await realtimeMonitorAPI.playChannel(channelId);
        
        if (response.data && response.data.code === 0 && response.data.data) {
          const streamData = response.data.data;
          let videoUrl;
          
          // 根据协议选择合适的流地址
          if (location.protocol === "https:") {
            videoUrl = streamData.wss_flv || streamData.https_flv;
          } else {
            videoUrl = streamData.ws_flv || streamData.http_flv;
          }
          
          if (videoUrl) {
            console.log('✅ 获取播放地址成功:', videoUrl);
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
            this.$set(this.videoTip, idxTmp, "播放失败: 未找到可用的流地址");
          }
        } else {
          const errorMsg = (response.data && response.data.msg) || '播放失败';
          console.error('❌ 播放失败:', errorMsg);
          this.$set(this.videoTip, idxTmp, "播放失败: " + errorMsg);
        }
      } catch (error) {
        console.error('❌ 播放通道异常:', error);
        const errorMsg = error.message || '网络错误';
        this.$set(this.videoTip, idxTmp, "播放失败: " + errorMsg);
      } finally {
        this.loading = false;
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
    // 是否可以截图 - 当前选中视频且有视频URL
    mainClass() {
      return this.viewMode === 'single' ? 'single-screen-mode' : '';
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
      const levelMap = {
        'level1': '一级',
        'level2': '二级',
        'level3': '三级',
        'level4': '四级'
      };
      return levelMap[level] || '未知';
    },
    // 查看预警详情
    viewWarningDetail(warning) {
      this.currentWarning = warning;
      this.warningDetailVisible = true;
    },
    // 处理预警（原有方法，保持兼容性）
    handleWarningOld(warning) {
      this.$message({
        message: `正在处理 ${warning.device} 的 ${warning.type} 预警`,
        type: 'success'
      });
      // 这里可以添加处理预警的逻辑
    },

    // 从预警列表处理预警 - 使用统一的处理逻辑
    handleWarningFromList(warning) {
      console.log('🖱️ 点击处理按钮, 预警ID:', warning && warning.id, '预警数据:', warning);

      if (warning && warning.id) {
        // 检查当前是否已经在处理中
        const hasProcessingRecord = warning.operationHistory &&
          warning.operationHistory.some(record =>
            record.operationType === 'processing' && record.status === 'active'
          );

        if (hasProcessingRecord) {
          console.log('📝 预警已在处理中，直接打开处理对话框');
          // 如果已经有处理中记录，直接弹出处理意见对话框
          this.currentProcessingWarningId = warning.id;
          this.remarkDialogVisible = true;
        } else {
          console.log('🆕 开始新的处理流程');
          // 如果没有处理中记录，先添加"处理中"状态
          this.startProcessingWarning(warning);
        }
      } else {
        console.error('❌ 无效的预警数据:', warning);
        this.$message.error('预警数据无效，无法处理');
      }
    },

    // 开始处理预警
    async startProcessingWarning(warning) {
      try {
        this.loading = true;

        console.log('🔄 开始处理预警:', warning.id);

        // 1. 先调用后端API更新状态为"处理中"
        const updateData = {
          status: 2, // 处理中状态
          processing_notes: '开始处理预警',
          processed_by: this.getCurrentUserName()
        };

        // 发送真实的API请求
        const response = await alertAPI.updateAlertStatus(warning.id, updateData);
        console.log('✅ 后端状态更新成功:', response);

        // 2. 后端更新成功后，更新本地状态
        const index = this.warningList.findIndex(item => item.id === warning.id);
        if (index !== -1) {
          // 确保有操作历史数组
          if (!this.warningList[index].operationHistory) {
            this.$set(this.warningList[index], 'operationHistory', []);
          }

          // 更新待处理记录为已完成状态
          this.warningList[index].operationHistory = this.warningList[index].operationHistory.map(record => {
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

          this.warningList[index].operationHistory.unshift(newRecord);

          // 🔧 关键修复：更新 _apiData.status 字段为处理中
          if (this.warningList[index]._apiData) {
            this.warningList[index]._apiData.status = 2; // 处理中状态
          }

          // 🔧 同时更新前端使用的 status 字段
          this.$set(this.warningList[index], 'status', 'processing');

          console.log('✅ 开始处理，本地状态已更新为处理中:', this.warningList[index]);
        }

        // 3. 弹出处理意见对话框
        this.currentProcessingWarningId = warning.id;
        this.remarkDialogVisible = true;

        this.$message.success('预警已开始处理');

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

        console.log('📝 保存处理意见:', this.currentProcessingWarningId, this.remarkForm.remark);

        // 真实的API调用 - 添加处理记录
        const updateData = {
          status: 2, // 保持处理中状态
          processing_notes: this.remarkForm.remark,
          processed_by: this.getCurrentUserName(),
          operation_type: 'add_processing_note'
        };

        const response = await alertAPI.updateAlertStatus(this.currentProcessingWarningId, updateData);
        console.log('✅ 处理意见保存成功:', response);

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
            time: this.getCurrentTime(),
            description: `处理意见：${this.remarkForm.remark}`,
            operationType: 'processing-action',
            operator: this.getCurrentUserName()
          };

          this.warningList[index].operationHistory.unshift(newRecord);
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

        console.log('🏁 结束处理预警:', this.currentProcessingWarningId);

        // 真实的API调用 - 完成处理
        const updateData = {
          status: 3, // 已处理状态
          processing_notes: this.remarkForm.remark || '预警处理已完成',
          processed_by: this.getCurrentUserName(),
          operation_type: 'complete_processing'
        };

        const response = await alertAPI.updateAlertStatus(this.currentProcessingWarningId, updateData);
        console.log('✅ 处理完成状态更新成功:', response);

        // 更新本地数据状态
        const index = this.warningList.findIndex(item => item.id === this.currentProcessingWarningId);
        if (index !== -1) {
          if (!this.warningList[index].operationHistory) {
            this.$set(this.warningList[index], 'operationHistory', []);
          }

          // 添加已处理记录 - 这是状态判断的关键
          const completedRecord = {
            id: Date.now() + Math.random(),
            status: 'completed',
            statusText: '已处理',
            time: this.getCurrentTime(),
            description: this.remarkForm.remark ? `处理完成：${this.remarkForm.remark}` : '预警处理已完成',
            operationType: 'completed',
            operator: this.getCurrentUserName()
          };

          this.warningList[index].operationHistory.unshift(completedRecord);

          // 🔧 关键修复：更新 _apiData.status 字段
          if (this.warningList[index]._apiData) {
            this.warningList[index]._apiData.status = 3; // 已处理状态
            this.warningList[index]._apiData.processed_at = new Date().toISOString();
            this.warningList[index]._apiData.processed_by = this.getCurrentUserName();
          }

          // 🔧 同时更新前端使用的 status 字段
          this.$set(this.warningList[index], 'status', 'completed');

          console.log('✅ 本地状态已更新为已处理:', this.warningList[index]);
        }

        this.$message.success('处理已完成，现在可以进行归档等操作');
        this.closeRemarkDialog();

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
    handleWarningFromDialog(warning) {
      if (warning && warning.id) {
        // 如果是完成处理的事件，只更新状态，不再弹出对话框
        if (warning.action === 'finished') {
          // 更新本地预警列表的状态
          const index = this.warningList.findIndex(item => item.id === warning.id);
          if (index !== -1) {
            this.warningList[index].operationHistory = warning.operationHistory;

            // 🔧 关键修复：更新状态字段
            if (this.warningList[index]._apiData) {
              this.warningList[index]._apiData.status = 3; // 已处理状态
            }
            this.$set(this.warningList[index], 'status', 'completed');

            console.log('✅ 从详情对话框完成处理，状态已更新:', this.warningList[index]);
          }
          return;
        }

        // 如果是添加处理记录的事件，只更新状态，不再弹出对话框
        if (warning.action === 'record-added') {
          // 更新本地预警列表的状态
          const index = this.warningList.findIndex(item => item.id === warning.id);
          if (index !== -1) {
            this.warningList[index].operationHistory = warning.operationHistory;

            // 🔧 如果记录中包含开始处理，更新状态为处理中
            const hasProcessingRecord = warning.operationHistory &&
              warning.operationHistory.some(record =>
                record.operationType === 'processing' && record.status === 'active'
              );

            if (hasProcessingRecord && this.warningList[index]._apiData) {
              this.warningList[index]._apiData.status = 2; // 处理中状态
              this.$set(this.warningList[index], 'status', 'processing');
            }

            console.log('✅ 从详情对话框添加处理记录，状态已更新:', this.warningList[index]);
          }
          return;
        }

        // 检查当前是否已经在处理中
        const hasProcessingRecord = warning.operationHistory &&
          warning.operationHistory.some(record =>
            record.operationType === 'processing' && record.status === 'active'
          );

        if (hasProcessingRecord) {
          // 如果已经有处理中记录，直接弹出处理意见对话框
          this.currentProcessingWarningId = warning.id;
          this.remarkDialogVisible = true;
        } else {
          // 如果没有处理中记录，先添加"处理中"状态
          this.startProcessingWarning(warning);
        }
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
            this.warningList[index].status = 'completed';
            this.$message.success('已标记为已处理');
          } else if (action === 'report') {
            // 上报
            this.reportWarningId = id;
            this.warningList[index].status = 'reported';
            this.$message.success('预警已成功上报');
          } else if (action === 'archive') {
            // 归档 - 需要选择档案
            this.archiveWarningId = id;
            // 获取当前预警的摄像头信息（实际项目中从预警数据获取）
            this.currentCameraId = this.warningList[index].cameraId || 'camera_1';
            await this.handleArchiveProcess();
            return; // 不关闭loading，等归档完成后再关闭
          } else if (action === 'falseAlarm') {
            // 误报 - 显示输入对话框
            this.archiveWarningId = id;
            this.currentCameraId = this.warningList[index].cameraId || 'camera_1';
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

    // 处理上报事件
    handleReportFromDialog(warning) {
      if (warning && warning.id) {
        this.handleWarning(warning.id, 'report');
      }
    },

    // 处理归档事件
    handleArchiveFromDialog(warning) {
      if (warning && warning.id) {
        this.handleWarning(warning.id, 'archive');
      }
    },

    // 处理预警详情对话框中的误报事件 - 与预警管理页面保持完全一致
    handleFalseAlarmFromDialog(warning) {
      if (warning && warning.id) {
        // 调用统一的误报处理流程（弹出误报输入对话框）
        this.handleWarning(warning.id, 'falseAlarm');
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
        if (warningInfo._apiData && warningInfo._apiData.status !== 3) {
          const statusNames = {
            1: '待处理',
            2: '处理中',
            3: '已处理',
            4: '已归档',
            5: '误报'
          };
          const currentStatusName = statusNames[warningInfo._apiData.status] || '未知状态';
          this.$message.warning(`只有已处理状态的预警才能归档，当前状态为：${currentStatusName}`);
          this.loading = false;
          return;
        }

        console.log('📁 开始归档流程，当前档案列表长度:', this.availableArchivesList.length);

        // 刷新档案列表
        await this.loadAvailableArchives();

        console.log('📁 刷新后档案列表长度:', this.availableArchivesList.length);
        console.log('📁 档案列表数据:', JSON.stringify(this.availableArchivesList, null, 2));

        // 显示档案选择对话框（即使没有档案也显示，让用户可以创建）
        this.archiveDialogVisible = true;
        this.selectedArchiveId = null; // 重置选择

        // 确保对话框在最上层（DOM 更新后设置）
        this.$nextTick(() => {
          this.ensureArchiveDialogOnTop();
        });

        console.log('📁 显示档案选择对话框，可用档案数:', this.availableArchivesList.length);

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
        if (warningInfo._apiData && warningInfo._apiData.status !== 3) {
          const statusNames = {
            1: '待处理',
            2: '处理中',
            3: '已处理',
            4: '已归档',
            5: '误报'
          };
          const currentStatusName = statusNames[warningInfo._apiData.status] || '未知状态';
          this.$message.warning(`只有已处理状态的预警才能归档，当前状态为：${currentStatusName}`);
          this.closeArchiveDialog();
          return;
        }

        const alertId = warningInfo._apiData ? warningInfo._apiData.alert_id : parseInt(this.archiveWarningId);
        
        // 🔧 修复：使用 archive_id 字段查找档案（不是 id）
        const selectedArchive = this.availableArchivesList.find(archive => archive.archive_id === this.selectedArchiveId);
        const archiveName = selectedArchive ? selectedArchive.name : '未知档案';
        const archiveLocation = selectedArchive ? selectedArchive.location : '未知位置';

        console.log('📍 选中的档案信息:', { selectedArchive, archiveName, archiveLocation });

        // 1. 先调用updateAlertStatus更新预警状态为已归档
        const updateData = {
          status: 4, // 已归档状态
          processing_notes: `预警已归档到：${archiveName}（${archiveLocation}）`,
          processed_by: this.getCurrentUserName()
        };

        console.log('📤 更新预警状态为已归档:', alertId, updateData);
        const updateResponse = await alertAPI.updateAlertStatus(alertId, updateData);
        console.log('✅ 预警状态更新成功:', updateResponse);

        // 2. 更新本地的_apiData.status字段
        if (this.warningList[index]._apiData) {
          this.$set(this.warningList[index]._apiData, 'status', 4);
        }
        this.$set(this.warningList[index], 'status', 'archived');
        this.$set(this.warningList[index], 'archiveId', this.selectedArchiveId);
        this.$set(this.warningList[index], 'archiveTime', new Date().toLocaleString());

        // 添加归档记录到操作历史
        if (!this.warningList[index].operationHistory) {
          this.$set(this.warningList[index], 'operationHistory', []);
        }

        // 🔧 修复：在归档记录中包含位置信息
        const archiveRecord = {
          id: Date.now() + Math.random(),
          status: 'completed',
          statusText: '预警归档',
          time: this.getCurrentTime(),
          description: `预警已归档到：${archiveName}（${archiveLocation}），可在预警档案中查看`,
          operationType: 'archive',
          operator: this.getCurrentUserName(),
          archiveInfo: {
            archiveId: this.selectedArchiveId,
            archiveName: archiveName,
            location: archiveLocation // 🔧 添加位置信息
          }
        };

        this.warningList[index].operationHistory.unshift(archiveRecord);

        console.log('✅ 本地状态已更新为已归档');

        // 3. 调用归档API关联预警到档案
        const { archiveAPI } = await import('../../service/VisionAIService.js');
        const response = await archiveAPI.linkAlertsToArchive(
          this.selectedArchiveId,
          [alertId],
          `实时监控归档 - 预警类型: ${warningInfo.type}`
        );

        console.log('📤 归档API响应:', response.data);

        if (response.data && response.data.code === 0) {
          // 4. 延迟移除记录，让用户能看到状态变化
          setTimeout(() => {
            const currentIndex = this.warningList.findIndex(item => item.id === this.archiveWarningId);
            if (currentIndex !== -1) {
              // 从实时预警列表中移除已归档的预警
              this.warningList.splice(currentIndex, 1);
            }
          }, 500);

          this.$message.success('预警已成功归档');
          console.log('✅ 实时监控 - 预警归档成功:', alertId, '档案ID:', this.selectedArchiveId);

          // 关闭对话框
          this.closeArchiveDialog();
        } else {
          const errorMessage = (response.data && response.data.message) || '归档失败';
          this.$message.error(errorMessage);
          console.warn('⚠️ 实时监控 - 预警归档失败:', response.data);
        }
      } catch (error) {
        console.error('❌ 实时监控 - 预警归档异常:', error);
        this.$message.error('归档失败: ' + (error.message || '未知错误'));
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
            console.log('✅ 归档对话框 z-index 已设置为:', targetZIndex);

            // 查找对应的遮罩层（紧邻在对话框前面的 v-modal）
            const previousSibling = wrapper.previousElementSibling;
            if (previousSibling && previousSibling.classList.contains('v-modal')) {
              previousSibling.style.zIndex = (targetZIndex - 1).toString();
              console.log('✅ 遮罩层 z-index 已设置为:', targetZIndex - 1);
            }
          }
        });

        // 确保归档对话框中的 select 下拉框也有足够高的 z-index
        const archiveSelectDropdown = document.querySelector('.archive-select-dropdown');
        if (archiveSelectDropdown) {
          archiveSelectDropdown.style.zIndex = (targetZIndex + 1).toString();
          console.log('✅ Select 下拉框 z-index 已设置为:', targetZIndex + 1);
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
        if (!this.falseAlarmForm.reviewNotes.trim()) {
          this.$message.warning('请输入复判意见');
          return;
        }

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

        // 检查预警状态，只有待处理状态才能标记为误报
        if (warningInfo._apiData && warningInfo._apiData.status !== 1) {
          const statusNames = {
            2: '处理中',
            3: '已处理',
            4: '已归档',
            5: '误报'
          };
          const currentStatusName = statusNames[warningInfo._apiData.status] || '未知状态';
          this.$message.warning(`只有待处理状态的预警才能标记为误报，当前状态为：${currentStatusName}`);
          this.closeFalseAlarmDialog();
          return;
        }

        // 调用后端API标记误报
        const { alertAPI, archiveAPI } = await import('../../service/VisionAIService.js');
        const alertId = warningInfo._apiData ? warningInfo._apiData.alert_id : parseInt(this.archiveWarningId);
        const response = await alertAPI.markAlertAsFalseAlarm(
          alertId,
          this.falseAlarmForm.reviewNotes,
          this.getCurrentUserName()
        );

        if (response.data && response.data.code === 0) {
          // 添加误报记录到操作历史
          if (!this.warningList[warningIndex].operationHistory) {
            this.$set(this.warningList[warningIndex], 'operationHistory', []);
          }

          const newRecord = {
            id: Date.now() + Math.random(),
            status: 'completed',
            statusText: '误报处理',
            time: this.getCurrentTime(),
            description: `预警被标记为误报：${this.falseAlarmForm.reviewNotes}`,
            operationType: 'falseAlarm',
            operator: this.getCurrentUserName()
          };

          this.warningList[warningIndex].operationHistory.unshift(newRecord);
          this.warningList[warningIndex].status = 'archived';
          this.warningList[warningIndex].isFalseAlarm = true;
          this.warningList[warningIndex].archiveTime = new Date().toLocaleString();

          // 保存到智能复判记录
          await this.saveToReviewRecords(warningInfo);
          console.log('📝 实时监控页面-误报记录已保存到智能复判');

          // 如果选择了归档，调用归档API
          if (this.falseAlarmForm.needArchive && this.falseAlarmForm.archiveId) {
            try {
              const archiveResponse = await archiveAPI.linkAlertsToArchive(
                this.falseAlarmForm.archiveId,
                [alertId],
                `误报记录归档：${this.falseAlarmForm.reviewNotes}`
              );

              if (archiveResponse.data && archiveResponse.data.code === 0) {
                console.log('✅ 误报记录已成功归档到档案');
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

          // 从实时预警列表中移除误报预警
          this.warningList.splice(warningIndex, 1);
        } else {
          this.$message.error((response.data && response.data.msg) || '标记误报失败');
        }

        // 关闭对话框并重置表单
        this.closeFalseAlarmDialog();

      } catch (error) {
        console.error('标记误报失败:', error);
        this.$message.error('标记误报失败: ' + (error.message || '未知错误'));
      } finally {
        this.loading = false;
      }
    },

    // 保存到智能复判记录 - 与预警管理页面保持完全一致
    async saveToReviewRecords(warningInfo) {
      try {
        // 创建复判记录数据
        const reviewRecord = {
          id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          originalWarningId: warningInfo.id,
          warningType: warningInfo.type || warningInfo.deviceName,
          deviceName: warningInfo.device || (warningInfo.deviceInfo && warningInfo.deviceInfo.name),
          location: warningInfo.location || (warningInfo.deviceInfo && warningInfo.deviceInfo.position),
          originalTime: warningInfo.time,
          imageUrl: warningInfo.imageUrl,
          level: warningInfo.level,
          description: warningInfo.description,
          reviewResult: 'false_alarm', // 复判结果：误报
          reviewTime: this.getCurrentTime(),
          reviewer: this.getCurrentUserName(),
          reviewReason: '人工标记为误报',
          confidence: 100, // 人工复判置信度100%
          aiReviewResult: null, // AI复判结果（如果有的话）
          aiConfidence: null,
          status: 'completed',
          createTime: this.getCurrentTime()
        };

        // 保存到本地存储（实际项目中应该调用API保存到数据库）
        let reviewRecords = JSON.parse(localStorage.getItem('intelligentReviewRecords') || '[]');
        reviewRecords.unshift(reviewRecord);

        // 限制记录数量，避免本地存储过大
        if (reviewRecords.length > 1000) {
          reviewRecords = reviewRecords.slice(0, 1000);
        }

        localStorage.setItem('intelligentReviewRecords', JSON.stringify(reviewRecords));

        // 这里是本地存储操作，不需要额外的API调用
        console.log('📝 智能复判记录已保存到本地存储');

        console.log('误报记录已保存到智能复判:', reviewRecord);

      } catch (error) {
        console.error('保存到智能复判记录失败:', error);
        throw error;
      }
    },

    // 自动创建默认档案
    async createDefaultArchive() {
      try {
        // 模拟API调用创建默认档案
        await new Promise(resolve => setTimeout(resolve, 300));

        const newArchive = {
          id: `archive_${Date.now()}`,
          name: `${this.getCurrentCameraName()}默认档案`,
          cameraId: this.currentCameraId,
          cameraName: this.getCurrentCameraName(),
          isDefault: true,
          createTime: new Date().toLocaleString()
        };

        this.archivesList.push(newArchive);

        return newArchive.id;
      } catch (error) {
        this.$message.error('创建默认档案失败');
        return null;
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

        console.log('📥 实时监控 - 获取档案列表响应:', response.data);

        // 后端返回格式：{ code: 0, msg: "获取成功", data: [...], pagination: {...} }
        if (response.data && response.data.code === 0 && response.data.data) {
          this.availableArchivesList = response.data.data;
          console.log('✅ 实时监控 - 加载档案列表成功:', this.availableArchivesList.length, '个档案', this.availableArchivesList);
        } else if (response.data && response.data.archives) {
          // 兼容其他可能的返回格式
          this.availableArchivesList = response.data.archives;
          console.log('✅ 实时监控 - 加载档案列表成功(archives):', this.availableArchivesList.length, '个档案');
        } else if (response.data && Array.isArray(response.data)) {
          // 兼容直接返回数组的格式
          this.availableArchivesList = response.data;
          console.log('✅ 实时监控 - 加载档案列表成功(数组):', this.availableArchivesList.length, '个档案');
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

          console.log('📤 实时监控 - 为误报创建档案响应:', response.data);

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
            console.log('✅ 实时监控 - 误报档案已创建:', newArchive);
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

          console.log('📤 实时监控 - 创建档案响应:', response.data);

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
            console.log('✅ 实时监控 - 新档案已创建并选中:', newArchive);
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
        // console.log('📊 预警状态显示 - API status:', warning._apiData.status, '显示:', result);
        return result;
      }

      // 如果没有API数据，使用operationHistory判断（向后兼容）
      if (!warning.operationHistory || warning.operationHistory.length === 0) {
        return {
          text: '待处理',
          class: 'status-pending'
        };
      }

      // 检查是否已归档
      const hasArchived = warning.operationHistory.some(record =>
        record.operationType === 'archive' || record.operationType === 'falseAlarm'
      ) || warning.status === 'archived';

      if (hasArchived) {
        return {
          text: '已归档',
          class: 'status-archived'
        };
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
      if (!warning.operationHistory || warning.operationHistory.length === 0) {
        return false; // 没有历史记录，可以处理
      }

      // 如果已归档，禁用处理按钮
      const hasArchived = warning.operationHistory.some(record =>
        record.operationType === 'archive' || record.operationType === 'falseAlarm'
      ) || warning.status === 'archived';

      if (hasArchived) {
        return true;
      }

      // 如果已完成处理，禁用处理按钮
      const hasCompletedProcessing = warning.operationHistory.some(record =>
        record.operationType === 'completed'
      );

      return hasCompletedProcessing;
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

    // 加载预警数据
    async loadWarningData() {
      try {
        this.apiDataLoading = true;

        // 调用API获取预警列表
        const params = {
          page: this.currentPage,
          limit: this.pageSize,
          // 默认只获取最近的预警，按时间倒序
        };

        const response = await alertAPI.getRealTimeAlerts(params);

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

          // 更新预警列表
          this.warningList = convertedWarnings;
          this.totalWarnings = response.data.total || apiWarnings.length;
        } else {
          this.$message.warning('获取预警数据失败，将显示空列表');
          this.warningList = [];
        }
      } catch (error) {
        this.$message.error('加载预警数据失败，请检查网络连接');
        this.warningList = [];
      } finally {
        this.apiDataLoading = false;
      }
    },

    // 将API预警数据转换为前端格式
    convertAPIWarningToFrontend(apiWarning) {
      try {
        // 根据你提供的API数据格式进行准确映射，确保所有字段都有默认值
        const convertedWarning = {
          id: apiWarning.alert_id || `temp_${Date.now()}`,
          time: this.formatAPITime(apiWarning.alert_time) || '时间未知',
          device: apiWarning.camera_name || `摄像头${apiWarning.camera_id || '未知'}`,
          type: apiWarning.alert_name || this.convertAlertTypeToDisplayName(apiWarning.alert_type) || '未知预警类型',
          level: this.convertAlertLevel(apiWarning.alert_level) || 'level4',
          location: apiWarning.location || '未知位置',
          status: this.convertAlertStatus(apiWarning.status, apiWarning.status_display) || 'pending',
          imageUrl: this.getWarningImageUrl(apiWarning) || null,
          description: apiWarning.alert_description || '无描述信息',
          operationHistory: this.convertProcessHistory(apiWarning.process, apiWarning.status, this.formatAPITime(apiWarning.alert_time)) || [],
          // 添加额外的API数据字段
          taskId: apiWarning.task_id || null,
          electronicFence: apiWarning.electronic_fence || null,
          result: apiWarning.result || null,
          // 保存原始API数据，用于状态判断和其他功能
          _apiData: {
            alert_id: apiWarning.alert_id,
            status: apiWarning.status,  // 保存原始status数字（1-5）
            status_display: apiWarning.status_display,
            alert_time: apiWarning.alert_time,
            camera_id: apiWarning.camera_id,
            task_id: apiWarning.task_id,
            process: apiWarning.process
          }
        };

        console.log('🔄 转换API预警数据 - alert_id:', apiWarning.alert_id, 'status:', apiWarning.status, '→ 前端格式');

        return convertedWarning;
      } catch (error) {
        console.error('❌ 转换API预警数据失败:', error);
        return null;
      }
    },

    // 转换预警类型到显示名称
    convertAlertTypeToDisplayName(alertType) {
      const typeMap = {
        'product_area_detection': '商品区域检测报警',
        'safety_helmet_detection': '未戴安全帽',
        'safety_belt_detection': '未系安全带',
        'protective_clothing_detection': '未穿工作服',
        'personnel_intrusion_detection': '闲杂人员入侵',
        'smoke_fire_detection': '吸烟检测',
        'high_altitude_work_detection': '高空作业检测',
        'fall_detection': '跌倒检测',
        'crowd_gathering_detection': '人群聚集检测',
        'vehicle_detection': '车辆检测',
        'abnormal_behavior_detection': '异常行为检测'
      };

      return typeMap[alertType] || alertType || '未知预警类型';
    },

    // 格式化API时间
    formatAPITime(timeString) {
      try {
        if (!timeString) {
          return new Date().toLocaleString();
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

        const formattedTime = date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        return formattedTime;
      } catch (error) {
        return timeString || new Date().toLocaleString();
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
              return `http://192.168.1.106:8000${imageUrl}`;
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

    // 加载更多预警数据（分页）
    async loadMoreWarnings() {
      try {
        this.apiDataLoading = true;
        this.currentPage++;

        const params = {
          page: this.currentPage,
          limit: this.pageSize,
        };

        const response = await alertAPI.getRealTimeAlerts(params);

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

          // 追加到现有列表
          this.warningList.push(...convertedWarnings);
        }
      } catch (error) {
        this.currentPage--; // 回退页码
        this.$message.error('加载更多预警失败');
      } finally {
        this.apiDataLoading = false;
      }
    },

    // =================== SSE连接相关方法 ===================

    // 初始化SSE连接
    initSSEConnection() {
      // 初始化SSE连接

      // 如果已有连接，先关闭
      if (this.sseConnection) {
        this.sseConnection.close();
        this.sseConnection = null;
      }

      // 创建新的SSE连接
      this.sseConnection = alertAPI.createAlertSSEConnection(
        this.handleSSEMessage.bind(this),   // 消息处理
        this.handleSSEError.bind(this),     // 错误处理
        this.handleSSEClose.bind(this)      // 连接关闭处理
      );

      if (this.sseConnection) {
        this.sseStatus.connected = true;
      }
    },

    // 处理SSE消息
    handleSSEMessage(messageData) {
      // 如果是AI预警消息
      if (messageData.alert_id || messageData.id) {
        this.handleNewAlert(messageData);
      }
    },

    // 判断是否是传统报警消息格式
    isTraditionalAlarmMessage(messageData) {
      return messageData.deviceName && messageData.deviceId && messageData.alarmTime;
    },

    // 处理传统报警消息（参考UiHeader.vue的处理方式）
    handleTraditionalAlarm(alarmData) {
      try {
        // 将传统报警数据转换为预警列表格式
        const newWarning = this.convertTraditionalAlarmToWarning(alarmData);

        if (!newWarning) {
          return;
        }

        // 添加到预警列表顶部
        this.warningList.unshift(newWarning);

        // 限制列表长度，只保留最新的10条预警
        if (this.warningList.length > 10) {
          this.warningList = this.warningList.slice(0, 10);
        }

        // 显示新预警提示
        this.$message({
          message: `收到新报警：${newWarning.type} - ${newWarning.device}`,
          type: 'warning',
          duration: 3000
        });
      } catch (error) {
        // 静默处理错误
      }
    },

    // 将传统报警数据转换为前端预警格式
    convertTraditionalAlarmToWarning(alarmData) {
      try {
        // 生成唯一ID
        const id = `alarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // 根据报警级别映射预警等级
        const level = this.mapAlarmPriorityToLevel(alarmData.alarmPriorityDescription);

        return {
          id: id,
          time: this.formatAlarmTime(alarmData.alarmTime),
          device: alarmData.deviceName || `设备${alarmData.deviceId}`,
          type: alarmData.alarmTypeDescription || '报警',
          level: level,
          location: `通道${alarmData.channelId}`,
          status: 'pending',
          imageUrl: null, // 传统报警可能没有图片
          description: `${alarmData.alarmMethodDescription || ''}报警 - ${alarmData.alarmTypeDescription || ''}`,
          operationHistory: [{
            id: Date.now(),
            operationType: 'pending',
            status: 'active',
            statusText: '待处理',
            time: this.formatAlarmTime(alarmData.alarmTime),
            description: `系统检测到${alarmData.alarmTypeDescription || '异常情况'}，等待处理人员确认`,
            operator: '系统'
          }]
        };
      } catch (error) {
        return null;
      }
    },

    // 映射报警级别到预警等级
    mapAlarmPriorityToLevel(priorityDescription) {
      const priorityMap = {
        '一级': 'level1',
        '紧急': 'level1',
        '高': 'level1',
        '二级': 'level2',
        '重要': 'level2',
        '中高': 'level2',
        '三级': 'level3',
        '中等': 'level3',
        '中': 'level3',
        '四级': 'level4',
        '低': 'level4',
        '一般': 'level4'
      };

      // 查找匹配的级别
      for (const [key, value] of Object.entries(priorityMap)) {
        if (priorityDescription && priorityDescription.includes(key)) {
          return value;
        }
      }

      // 默认返回四级
      return 'level4';
    },

    // 格式化报警时间
    formatAlarmTime(alarmTime) {
      try {
        if (!alarmTime) return this.getCurrentTime();

        // 如果已经是标准格式，直接返回
        if (alarmTime.includes('-') && alarmTime.includes(':')) {
          return alarmTime;
        }

        // 处理其他格式
        const date = new Date(alarmTime);
        if (isNaN(date.getTime())) {
          return alarmTime; // 如果解析失败，返回原字符串
        }

        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch (error) {
        return alarmTime || this.getCurrentTime();
      }
    },

    // 处理新预警
    handleNewAlert(alertData) {
      try {
        // 将后端预警数据转换为前端格式 - 统一使用API转换方法
        const newWarning = this.convertAPIWarningToFrontend(alertData);

        if (!newWarning) {
          return;
        }

        // 添加到预警列表顶部
        this.warningList.unshift(newWarning);

        // 限制列表长度，只保留最新的10条预警
        if (this.warningList.length > 10) {
          this.warningList = this.warningList.slice(0, 10);
        }

        // 新预警已添加到列表
      } catch (error) {
        // 静默处理错误
      }
    },

    // 处理预警更新
    handleAlertUpdate(alertData) {
      try {
        // 查找现有预警并更新
        const index = this.warningList.findIndex(warning =>
          warning.id === alertData.alert_id || warning.id === alertData.id
        );

        if (index !== -1) {
          // 更新现有预警 - 统一使用API转换方法
          const updatedWarning = this.convertAPIWarningToFrontend(alertData);

          if (!updatedWarning) {
            return;
          }

          this.$set(this.warningList, index, updatedWarning);
        }
      } catch (error) {
        // 静默处理错误
      }
    },




    // 转换预警等级
    convertAlertLevel(backendLevel) {
      const levelMap = {
        1: 'level1',
        2: 'level2',
        3: 'level3',
        4: 'level4'
      };
      return levelMap[backendLevel] || 'level4';
    },

    // 转换预警状态
    convertAlertStatus(statusNumber, statusDisplay) {
      // 如果有显示文本，优先使用显示文本进行映射
      if (statusDisplay) {
        const statusMap = {
          '待处理': 'pending',
          '处理中': 'processing',
          '已处理': 'completed',
          '已忽略': 'ignored',
          '已过期': 'expired'
        };
        return statusMap[statusDisplay] || 'pending';
      }

      // 如果没有显示文本，根据数字状态映射
      if (statusNumber !== undefined && statusNumber !== null) {
        const numberStatusMap = {
          1: 'pending',     // 待处理
          2: 'processing',  // 处理中
          3: 'completed',   // 已处理
          4: 'ignored',     // 已忽略
          5: 'expired'      // 已过期
        };
        return numberStatusMap[statusNumber] || 'pending';
      }

      // 对于新的API数据，如果没有状态信息，默认为待处理
      return 'pending';
    },

    // 转换处理历史 - 确保与状态判断逻辑一致
    convertProcessHistory(processData, apiStatus, alertTime) {
      try {
        const operationHistory = []

        console.log('🔄 转换处理历史, API状态:', apiStatus, '处理数据:', processData);

        // 处理API返回的步骤（如果存在）
        if (processData && processData.steps && Array.isArray(processData.steps)) {
          processData.steps.forEach((step, index) => {
            operationHistory.push({
              id: step.id || (Date.now() + index + 100),
              status: 'completed',
              statusText: step.step || '处理中',
              time: this.formatAPITime(step.time),
              description: step.desc || step.description || '',
              operationType: step.step === '预警产生' ? 'pending' : 'processing', // 预警产生直接标记为pending状态
              operator: step.operator || '系统'
            })
          })
        }

        // 根据API状态添加相应的操作记录
        if (apiStatus === 1 || apiStatus === undefined || apiStatus === null) {
          // 待处理状态 - 添加待处理记录
          if (operationHistory.length === 0) {
            operationHistory.push({
              id: Date.now() + Math.random(),
              status: 'active',
              statusText: '待处理',
              time: alertTime || this.getCurrentTime(),
              description: '系统检测到异常情况，等待处理人员确认并开始处理',
              operationType: 'pending',
              operator: '系统'
            });
          }
        } else if (apiStatus === 2) {
          // 处理中状态 - 添加处理中记录
          operationHistory.push({
            id: Date.now() + Math.random(),
            status: 'active',
            statusText: '处理中',
            time: alertTime || this.getCurrentTime(),
            description: '预警正在处理中',
            operationType: 'processing',
            operator: '处理人员'
          });
        } else if (apiStatus === 3) {
          // 已处理状态 - 添加已完成记录（关键修复）
          operationHistory.push({
            id: Date.now() + Math.random(),
            status: 'completed',
            statusText: '已处理',
            time: alertTime || this.getCurrentTime(),
            description: '预警处理已完成',
            operationType: 'completed', // 这是按钮状态判断的关键
            operator: '处理人员'
          });
          console.log('✅ 已添加已处理状态记录');
        } else if (apiStatus === 4) {
          // 已归档状态 - 添加归档记录
          operationHistory.push({
            id: Date.now() + Math.random(),
            status: 'completed',
            statusText: '已归档',
            time: alertTime || this.getCurrentTime(),
            description: '预警已归档',
            operationType: 'archive',
            operator: '管理员'
          });
        } else if (apiStatus === 5) {
          // 误报状态 - 添加误报记录
          operationHistory.push({
            id: Date.now() + Math.random(),
            status: 'completed',
            statusText: '误报',
            time: alertTime || this.getCurrentTime(),
            description: '预警已标记为误报',
            operationType: 'falseAlarm',
            operator: '管理员'
          });
        }

        console.log('📋 最终操作历史:', operationHistory);
        return operationHistory;

      } catch (error) {
        console.error('❌ 转换处理历史出错:', error);
        // 即使出错也要返回基本的历史记录
        return [{
          id: Date.now() + Math.random(),
          status: 'active',
          statusText: '待处理',
          time: alertTime || this.getCurrentTime(),
          description: '系统检测到异常情况，等待处理人员确认并开始处理',
          operationType: 'pending',
          operator: '系统'
        }];
      }
    },

    // 处理SSE错误
    handleSSEError(error) {
      this.sseStatus.connected = false;
    },

    // 处理SSE连接关闭
    handleSSEClose() {
      console.log('SSE连接已关闭');
      this.sseStatus.connected = false;
    },

    // 清理SSE连接
    cleanupSSEConnection() {
      console.log('清理SSE连接');

      if (this.sseConnection) {
        this.sseConnection.close();
        this.sseConnection = null;
      }

      this.sseStatus.connected = false;
    },

    // 手动重连SSE
    reconnectSSE() {
      console.log('手动重连SSE');
      this.cleanupSSEConnection();

      setTimeout(() => {
        this.initSSEConnection();
      }, 1000);
    },

    // 获取SSE状态样式类
    getSSSStatusClass() {
      return this.sseStatus.connected ? 'status-connected' : 'status-disconnected';
    },

    // 获取SSE状态文本
    getSSEStatusText() {
      return this.sseStatus.connected ? '已连接' : '未连接';
    },

    // 🆕 ========== OSD检测框叠加功能 ==========
    
    /**
     * 加载指定摄像头的可用AI任务列表
     */
    async loadAvailableAITasks(cameraId) {
      try {
        const response = await realtimeDetectionAPI.getTasksByCamera(cameraId)
        if (response.data && response.data.code === 0) {
          this.$set(this.availableAITasks, cameraId, response.data.data || [])
        }
      } catch (error) {
        console.error(`❌ 获取摄像头AI任务列表失败:`, error)
      }
    },
    
    /**
     * AI任务选择变化处理
     */
    onTaskSelectionChange(index) {
      const taskId = this.selectedAITasks[index]
      
      // 断开旧连接
      if (this.wsConnections[index]) {
        this.wsConnections[index].close()
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
      try {
        // 构建WebSocket URL - 直接连接到后端服务器
        // 使用与 VisionAIService 相同的后端地址
        const backendUrl = config.API_BASE_URL // 从配置文件获取
        const wsProtocol = backendUrl.startsWith('https') ? 'wss:' : 'ws:'
        const wsHost = backendUrl.replace(/^https?:\/\//, '') // 移除 http:// 或 https://
        const wsUrl = `${wsProtocol}//${wsHost}/api/v1/realtime-detection/ws/detection/${taskId}`
        
        const ws = new WebSocket(wsUrl)
        
        // 先设置为未连接状态
        this.$set(this.wsConnections, index, null)
        
        ws.onopen = () => {
          // 连接成功后才设置
          this.$set(this.wsConnections, index, ws)
        }
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            // 更新检测结果
            this.$set(this.detectionResults, index, {
              detections: data.detections || [],
              frame_size: data.frame_size || {width: 1920, height: 1080}
            })
            
            // 更新时间戳
            const now = new Date()
            this.$set(this.detectionUpdateTime, index, 
              `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`)
            
            // 更新视频分辨率
            if (data.frame_size) {
              this.$set(this.videoResolutions, index, {
                width: data.frame_size.width,
                height: data.frame_size.height
              })
            }
          } catch (error) {
            console.error('❌ 解析检测结果失败:', error)
          }
        }
        
        ws.onerror = (error) => {
          console.error(`❌ WebSocket错误: task_id=${taskId}`, error)
        }
        
        ws.onclose = () => {
          // 清理
          if (this.wsConnections[index] === ws) {
            delete this.wsConnections[index]
          }
        }
        
        // 不在这里保存连接，等onopen成功后再保存
        
      } catch (error) {
        console.error('❌ 创建WebSocket连接失败:', error)
      }
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
     * 获取实际视频分辨率宽度
     */
    getActualVideoWidth(index) {
      const playerRef = this.$refs[`player${index}`]
      if (playerRef && playerRef[0]) {
        const playerEl = playerRef[0].$el
        if (playerEl) {
          const videoEl = playerEl.querySelector('video') || playerEl.querySelector('canvas')
          if (videoEl && videoEl.videoWidth) {
            return videoEl.videoWidth
          }
          if (videoEl && videoEl.width) {
            return videoEl.width
          }
        }
      }
      
      // 降级方案：使用后端返回的分辨率
      if (this.videoResolutions[index]) {
        return this.videoResolutions[index].width
      }
      return 1920
    },
    
    /**
     * 获取实际视频分辨率高度
     */
    getActualVideoHeight(index) {
      const playerRef = this.$refs[`player${index}`]
      if (playerRef && playerRef[0]) {
        const playerEl = playerRef[0].$el
        if (playerEl) {
          const videoEl = playerEl.querySelector('video') || playerEl.querySelector('canvas')
          if (videoEl && videoEl.videoHeight) {
            return videoEl.videoHeight
          }
          if (videoEl && videoEl.height) {
            return videoEl.height
          }
        }
      }
      
      // 降级方案：使用后端返回的分辨率
      if (this.videoResolutions[index]) {
        return this.videoResolutions[index].height
      }
      return 1080
    },
    
    /**
     * 清理指定索引的OSD资源
     */
    cleanupOSDResources(index) {
      // 关闭WebSocket连接
      if (this.wsConnections[index]) {
        this.wsConnections[index].close()
        delete this.wsConnections[index]
      }
      
      // 清空数据
      this.$set(this.selectedAITasks, index, null)
      this.$set(this.detectionResults, index, null)
      this.$set(this.videoResolutions, index, null)
    },
    
    /**
     * 清理所有OSD资源
     */
    cleanupAllOSDResources() {
      // 关闭所有WebSocket连接
      Object.values(this.wsConnections).forEach(ws => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close()
        }
      })
      
      // 清空所有数据
      this.wsConnections = {}
      this.selectedAITasks = {}
      this.detectionResults = {}
      this.availableAITasks = {}
      this.cameraIdMapping = {}
      this.cameraNames = {}
      this.videoResolutions = {}
    }
    // 🆕 ========== OSD检测框叠加功能结束 ==========

  },
  beforeDestroy() {
    // 清理定时器
    if (this.timer) {
      clearInterval(this.timer)
    }
    
    // 🆕 清理所有OSD资源
    this.cleanupAllOSDResources()
  }
}
</script>

<style scoped>
/* 实时监控容器 - 科技感蓝色风格 */
.realtime-monitoring-container {
  height: 100%;
  max-height: 100%;
  background: #f5f5f5;
  padding: 0;
  overflow: hidden;
}

/* 主容器 - 科技感设计 */
.main-container {
  height: 100%;
  max-height: 100%;
  background: #f5f5f5;
  position: relative;
  padding: 16px;
  box-sizing: border-box;
  overflow: hidden;
}

/* 移除蓝色渐变背景 */

/* 移除z-index设置 */

/* 设备树容器 - 科技感设计 */
.device-tree-aside {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-right: 1px solid rgba(59, 130, 246, 0.1);
  height: 100%;
  overflow: hidden;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.05);
  border-radius: 16px;
  /* margin-right: 16px; */
  z-index: 10;
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(59, 130, 246, 0.1);
}



.device-tree-aside > * {
  position: relative;
  z-index: 2;
}

.custom-tree-header {
  padding: 20px 16px;
  background: #fff;
  color: #1e40af;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.15);
  min-height: 80px;
  flex-shrink: 0;
  border-radius: 16px 16px 0 0;
  position: relative;
  overflow: hidden;
  text-shadow: none;
}



@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

/* 添加header-switch样式 */
.header-title {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.header-title i {
  font-size: 18px;
  margin-right: 8px;
}

.header-title span {
  font-size: 16px;
  font-weight: bold;
}

.header-switch {
  margin-top: 6px;
}

.header-switch /deep/ .el-switch__label {
  color: #1e40af !important;
  font-weight: 600 !important;
  text-shadow: none !important;
}

.header-switch /deep/ .el-switch__label.is-active {
  color: #1e40af !important;
}

.custom-tree-container {
  flex: 1;
  overflow: auto;
  height: calc(100% - 40px);
  padding: 16px 0;
  background: #fff;
}

/* 覆盖树组件样式 */
.device-tree-aside /deep/ #DeviceTree {
  height: 100% !important;
}

.device-tree-aside /deep/ .el-container {
  height: 100% !important;
}

.device-tree-aside /deep/ .el-header {
  display: none !important; /* 隐藏原组件头部 */
}

.device-tree-aside /deep/ .el-main {
  padding: 0 !important;
  overflow: visible !important;
  height: auto !important;
  min-height: 100%;
}

/* 简单修复树节点样式 */
.device-tree-aside /deep/ .el-tree-node__content {
  height: auto !important;
  min-height: 34px !important;
  transition: all 0.2s ease !important;
  border-radius: 0 !important;
  margin: 2px 0 !important;
  padding: 0 8px !important;
}

/* 修正文字显示不全问题 */
.device-tree-aside /deep/ .custom-tree-node {
  font-size: 14px !important;
  line-height: 20px !important;
  transition: all 0.3s ease !important;
  font-weight: 500 !important;
  width: 100% !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  display: flex !important;
  align-items: center !important;
  padding: 0 !important;
}

.device-tree-aside /deep/ .flow-tree {
  padding: 0 !important;
}

/* 视频主容器 - 科技感设计 */
.video-main-container {
  flex: 1;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  position: relative;
  margin: 0 16px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.1);
}



.video-main-container > * {
  position: relative;
  z-index: 2;
}

/* 视频工具栏 - 科技感设计 */
.video-toolbar {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-bottom: 1px solid rgba(59, 130, 246, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}



.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.view-mode-buttons {
  display: flex;
  gap: 8px;
}

/* 预警列表侧边栏 - 科技感设计，固定高度避免滚动条 */
.warning-aside {
  width: 270px;
  flex: none;
  height: calc(100vh - 120px);
  max-height: calc(100vh - 120px);
  position: relative;
  overflow: hidden;
}

.warning-list {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 1px solid rgba(59, 130, 246, 0.1);
  position: relative;
}



.warning-list > * {
  position: relative;
  z-index: 2;
}

/* 修复视频网格 */
.el-main {
  padding: 0 !important;
  margin: 0 !important;
  overflow: hidden !important;
  background-color: #2c3e50 !important;
  width: 100% !important;
  height: calc(100% - 5vh) !important;
}

/* 调整四分屏布局 */
.video-grid.four {
  display: flex !important;
  flex-wrap: wrap !important;
  align-content: flex-start !important;
  justify-content: space-between !important;
  gap: 4px !important;
  padding: 4px !important;
}

.video-grid.four .video-cell {
  width: calc(50% - 4px) !important;
  height: calc(50% - 4px) !important;
  margin: 0 !important;
}

.header-label {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.current-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
  padding: 8px 16px;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(59, 130, 246, 0.1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.current-time i {
  color: #3b82f6;
  font-size: 16px;
}

/* 按钮样式 - 科技感设计 */
.btn {
  margin: 0 6px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-size: 16px;
  color: #4b5563;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(59, 130, 246, 0.1);
  backdrop-filter: blur(4px);
}

.btn:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #3b82f6;
  color: #1e40af;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
  transform: translateY(-1px);
}

.btn.active {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  color: #fff;
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.fullscreen-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.fullscreen-btn:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transform: translateY(-2px);
  color: white;
}



.btn.disabled {
  cursor: not-allowed;
  opacity: 0.6;
  color: #c0c4cc;
}

/* 视频主区域 - 科技感设计 */
.video-main {
  padding: 16px;
  background: linear-gradient(to bottom, #fafafa 0%, #f5f5f5 100%);
  overflow: hidden;
}

/* 视频网格 - 科技感设计 */
.video-grid {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.1);
  padding: 16px;
  position: relative;
  display: grid;
  gap: 16px;
}



.video-grid > * {
  position: relative;
  z-index: 2;
}

.video-grid.single {
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
}

.video-grid.four {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  padding: 2px;
  background-color: #2c3e50;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.video-grid.nine {
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  gap: 4px; /* 九分屏保留间隙 */
  padding: 4px 8px 4px 4px; /* 右侧增加padding */
}

/* 视频单元格 - 科技感设计 */
.video-cell {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #f3f4f6;
  position: relative;
  animation: fadeIn 0.4s ease-out;
}



.video-cell > * {
  position: relative;
  z-index: 2;
}

.video-cell.selected {
  border: 1px solid #3b82f6;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
  transform: translateY(-2px);
  z-index: 5;
}

.video-cell:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 3;
}

/* 视频标题栏 - 科技感设计 */
.video-slim-header {
  height: 36px;
  padding: 0 16px;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  font-size: 13px;
  font-weight: 500;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}



@keyframes headerShimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

.video-slim-header .camera-name {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.video-slim-header .video-status {
  display: flex;
  align-items: center;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.3);
  margin-left: 8px;
  backdrop-filter: blur(4px);
}

.video-slim-header .video-status .status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
}

.video-slim-header .video-status.online {
  color: #95ffa5;
}

.video-slim-header .video-status.online .status-dot {
  background-color: #67c23a;
  box-shadow: 0 0 4px #67c23a;
  animation: pulse 1.5s infinite ease-in-out;
}

.video-slim-header .video-status.offline {
  color: #ffbbbb;
}

.video-slim-header .video-status.offline .status-dot {
  background-color: #f56c6c;
}

.video-cell .video-content {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  min-height: 0;
  height: calc(100% - 36px);
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

/* 确保视频占满容器 */
.video-cell .video-content > div {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

/* 视频占位符 - 科技感设计 */
.video-cell .video-content .video-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #0a1526, #1e3c72);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  box-sizing: border-box;
  position: relative;
}



@keyframes patternMove {
  0% { background-position: 0 0; }
  100% { background-position: 20px 20px; }
}

.video-cell .video-content .no-signal {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.8);
  width: 100%;
  height: 100%;
  z-index: 2;
  position: relative;
}

.video-cell .video-content .no-signal i {
  font-size: 36px;
  margin-bottom: 12px;
  color: rgba(255, 255, 255, 0.7);
  opacity: 0.8;
}

.video-cell .video-content .no-signal div {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

/* 预警列表头部 - 科技感设计，调整高度 */
.warning-list .list-header {
  padding: 16px 20px;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  background: #fff;
  color: #1e40af;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
  text-shadow: none;
  flex-shrink: 0;
}

.warning-list .list-header .header-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

/* SSE连接状态指示器 */
.sse-status-indicator {
  display: flex;
  align-items: center;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.sse-status-indicator .status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
  display: inline-block;
}

/* 已连接状态 - 绿色 */
.sse-status-indicator.status-connected {
  background: rgba(16, 185, 129, 0.1);
  color: #065f46;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.sse-status-indicator.status-connected .status-dot {
  background-color: #10b981;
  box-shadow: 0 0 4px #10b981;
  animation: pulse 1.5s infinite ease-in-out;
}

/* 重连中状态 - 橙色 */
.sse-status-indicator.status-reconnecting {
  background: rgba(245, 158, 11, 0.1);
  color: #92400e;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.sse-status-indicator.status-reconnecting .status-dot {
  background-color: #f59e0b;
  animation: pulse 1s infinite ease-in-out;
}

/* 未连接状态 - 红色 */
.sse-status-indicator.status-disconnected {
  background: rgba(239, 68, 68, 0.1);
  color: #991b1b;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.sse-status-indicator.status-disconnected .status-dot {
  background-color: #ef4444;
}



.warning-list .list-header .more-btn {
  color: #1e40af;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 6px;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
}

.warning-list .list-header .more-btn:hover {
  background: rgba(59, 130, 246, 0.2);
  color: #1e40af;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.warning-list .list-content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  background: linear-gradient(to bottom, #fafafa 0%, #f5f5f5 100%);
  height: calc(100% - 60px);
}

/* 加载状态样式 */
.warning-list .list-content .loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #909399;
  font-size: 14px;
}

.warning-list .list-content .loading-state i {
  font-size: 32px;
  margin-bottom: 12px;
  color: #3b82f6;
  animation: spin 1s linear infinite;
}

.warning-list .list-content .loading-state span {
  font-weight: 500;
}

/* 空状态样式 */
.warning-list .list-content .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #909399;
  font-size: 14px;
}

.warning-list .list-content .empty-state i {
  font-size: 48px;
  margin-bottom: 12px;
  color: #c0c4cc;
}

.warning-list .list-content .empty-state span {
  margin-bottom: 12px;
  font-weight: 500;
}

.warning-list .list-content .empty-state .el-button {
  color: #3b82f6;
  font-size: 13px;
}

.warning-list .list-content .empty-state .el-button:hover {
  color: #1e40af;
  background: rgba(59, 130, 246, 0.1);
}

/* 旋转动画 */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 预警项目 - 科技感设计，调整尺寸减少滚动条 */
.warning-list .list-content .warning-item {
  padding: 8px;
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
  font-size: 13px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #f3f4f6;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  animation: slideIn 0.5s ease-out;
}



.warning-list .list-content .warning-item > * {
  position: relative;
  z-index: 2;
}

.warning-list .list-content .warning-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.warning-list .list-content .warning-item .warning-status-container {
  position: absolute;
  top: 6px;
  left: 6px;
  display: flex;
  gap: 6px;
  z-index: 2;
}

/* 预警等级标签 - 科技感样式（参考摄像头页面状态标签） */
.warning-list .list-content .warning-item .warning-level-badge {
  display: inline-block;
  padding: 0 8px !important;
  height: 24px !important;
  line-height: 22px !important;
  font-size: 12px !important;
  border-radius: 6px !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  border: 1px solid !important;
}

.warning-list .list-content .warning-item .warning-level-badge:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
}

/* 一级预警 - 危险红色渐变 */
.warning-list .list-content .warning-item .warning-level-badge.level1 {
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%) !important;
  color: #991b1b !important;
  border-color: #fca5a5 !important;
}

/* 二级预警 - 警告橙色渐变 */
.warning-list .list-content .warning-item .warning-level-badge.level2 {
  background: linear-gradient(135deg, #fffbeb 0%, #fed7aa 100%) !important;
  color: #92400e !important;
  border-color: #fbbf24 !important;
}

/* 三级预警 - 信息蓝色渐变 */
.warning-list .list-content .warning-item .warning-level-badge.level3 {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  color: #1e40af !important;
  border-color: #93c5fd !important;
}

/* 四级预警 - 成功绿色渐变 */
.warning-list .list-content .warning-item .warning-level-badge.level4 {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%) !important;
  color: #065f46 !important;
  border-color: #a7f3d0 !important;
}

/* 预警状态标签 - 科技感样式 */
.warning-list .list-content .warning-item .warning-status-badge {
  display: inline-block;
  padding: 0 8px !important;
  height: 24px !important;
  line-height: 22px !important;
  font-size: 12px !important;
  border-radius: 6px !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  border: 1px solid !important;
}

.warning-list .list-content .warning-item .warning-status-badge:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
}

/* 待处理状态 - 灰色渐变 */
.warning-list .list-content .warning-item .warning-status-badge.status-pending {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%) !important;
  color: #4b5563 !important;
  border-color: #d1d5db !important;
}

/* 处理中状态 - 蓝色渐变 */
.warning-list .list-content .warning-item .warning-status-badge.status-processing {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  color: #1e40af !important;
  border-color: #93c5fd !important;
}

/* 已完成状态 - 绿色渐变 */
.warning-list .list-content .warning-item .warning-status-badge.status-completed {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%) !important;
  color: #065f46 !important;
  border-color: #a7f3d0 !important;
}

/* 已归档状态 - 深灰色渐变 */
.warning-list .list-content .warning-item .warning-status-badge.status-archived {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%) !important;
  color: #374151 !important;
  border-color: #9ca3af !important;
}

/* 误报状态 - 橙色渐变 */
.warning-list .list-content .warning-item .warning-status-badge.status-false-alarm {
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%) !important;
  color: #9a3412 !important;
  border-color: #fdba74 !important;
}



.warning-list .list-content .warning-item .warning-info {
  padding: 2px 0;
}

.warning-list .list-content .warning-item .warning-info .warning-time-location {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.warning-list .list-content .warning-item .warning-info .warning-time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 0;
  font-weight: 500;
  display: flex;
  align-items: center;
  flex: 1;
}

.warning-list .list-content .warning-item .warning-info .warning-time:before {
  content: '';
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 6px;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23909399"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>');
  background-size: contain;
}

.warning-list .list-content .warning-item .warning-info .warning-location {
  font-size: 12px;
  color: #909399;
  margin-bottom: 0;
  font-weight: 500;
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: flex-end;
}

.warning-list .list-content .warning-item .warning-info .warning-location:before {
  content: '';
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 6px;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23909399"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>');
  background-size: contain;
}

.warning-list .list-content .warning-item .warning-info .warning-detail {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
  line-height: 1.6;
}

.warning-list .list-content .warning-item .warning-info .warning-detail .device-type-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.warning-list .list-content .warning-item .warning-info .warning-detail .device-name {
  font-weight: 500;
  color: #303133;
}

.warning-list .list-content .warning-item .warning-info .warning-detail .violation-type {
  color: #909399;
  font-weight: 500;
  background: rgba(144, 147, 153, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

/* 预警操作按钮 - 与详情弹框颜色保持一致 */
.warning-list .list-content .warning-item .warning-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  gap: 6px;
}

.warning-list .list-content .warning-item .warning-actions .el-button {
  flex: 1;
  margin: 0;
  padding: 6px 8px;
  font-size: 11px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

/* 预警操作按钮基础样式 - 与预警详情页面保持一致 */
.warning-list .list-content .warning-item .warning-actions .el-button {
  padding: 6px 12px;
  font-size: 11px;
  border-radius: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  background-color: transparent;
  border-color: #d1d5db;
  color: #4b5563;
  border-width: 1px;
  border-style: solid;
}

/* 所有按钮的悬浮效果 - 淡蓝色交互效果 */
.warning-list .list-content .warning-item .warning-actions .el-button:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #3b82f6;
  color: #1e40af;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

/* 禁用状态样式 */
.warning-list .list-content .warning-item .warning-actions .el-button.is-disabled,
.warning-list .list-content .warning-item .warning-actions .el-button:disabled {
  background-color: transparent;
  border-color: #e4e7ed;
  color: #c0c4cc;
  transform: none;
  box-shadow: none;
  cursor: not-allowed;
}

.warning-list .list-content .warning-item .warning-actions .el-button.is-disabled:hover,
.warning-list .list-content .warning-item .warning-actions .el-button:disabled:hover {
  background-color: transparent;
  border-color: #e4e7ed;
  color: #c0c4cc;
  transform: none;
  box-shadow: none;
}

/* 原有的plain样式已移除，统一使用新的科技感蓝色交互效果 */

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

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 单分屏时调整视频比例 */
.video-grid.single .video-cell {
  border-radius: 0; /* 移除单分屏模式下的圆角 */
  box-shadow: none; /* 移除单分屏模式下的阴影 */
  border: none; /* 移除单分屏模式下的边框 */
  height: 100%;
  width: 100%;
}

.video-grid.single .video-cell.selected {
  border: none; /* 移除选中状态下的边框 */
  box-shadow: none; /* 移除选中状态下的阴影 */
  transform: none; /* 移除选中状态下的变换 */
}

/* 调整单分屏模式下的标题栏 */
.video-grid.single .video-cell .video-slim-header {
  border-radius: 0; /* 移除标题栏的圆角 */
}

/* 四分屏时调整每个单元格比例 */
.video-grid.four .video-cell {
  width: calc(50% - 4px);
  height: calc(50% - 4px);
  margin: 2px;
  box-sizing: border-box;
  flex-grow: 0;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

/* 九分屏时保持较小的单元格 */
.video-cell {
  background: #1e2430;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  height: 100%;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
  position: relative;
  animation: fadeIn 0.4s ease-out;
}

.video-cell .video-slim-header {
  height: 26px;
  padding: 0 10px;
  background: rgba(28, 58, 112, 0.8);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  font-size: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  z-index: 5;
}

.video-cell .video-slim-header .camera-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-cell .video-slim-header .video-status {
  display: flex;
  align-items: center;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.3);
  margin-left: 8px;
}

.video-cell .video-slim-header .video-status .status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
}

.video-cell .video-slim-header .video-status.online {
  color: #95ffa5;
}

.video-cell .video-slim-header .video-status.online .status-dot {
  background-color: #67c23a;
  box-shadow: 0 0 4px #67c23a;
  animation: pulse 1.5s infinite ease-in-out;
}

.video-cell .video-slim-header .video-status.offline {
  color: #ffbbbb;
}

.video-cell .video-slim-header .video-status.offline .status-dot {
  background-color: #f56c6c;
}

/* 全屏模式下的样式调整 */
body.camera-fullscreen-mode .video-cell .video-slim-header {
  height: 36px;
  padding: 0 16px;
  font-size: 14px;
  background: rgba(20, 40, 80, 0.7);
  backdrop-filter: blur(5px);
}

/* 调整el-main的填充，使视频网格居中 */
#realTimeMonitoring .el-main {
  padding: 0;
  margin: 0;
  overflow: hidden;
  background-color: #2c3e50;
  width: 100%;
  height: calc(100% - 5vh);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 确保视频网格容器完全填充主区域 */
.el-main .video-grid {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  margin: 0;
  position: relative;
}

/* 全屏状态下的必要样式 */
body.camera-fullscreen-mode .video-cell .video-content {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  height: 100% !important;
  width: 100% !important;
}

body.camera-fullscreen-mode .video-cell .video-content .video-placeholder {
  background: linear-gradient(135deg, #102948, #1e3c72) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2) !important;
  font-size: 18px !important;
}



/* 调整el-main在单分屏模式下的样式 */
.single-screen-mode .el-main {
  padding: 0;
  margin: 0;
  overflow: hidden;
}

.single-screen-mode .video-grid {
  width: 100%;
  height: 100%;
  background-color: #1e2430;
  border-radius: 0;
  box-shadow: none;
}

.single-screen-mode .video-grid .video-cell {
  background-color: #1e2430;
  border: none;
  box-shadow: none;
  border-radius: 0;
}

.single-screen-mode .video-grid .video-cell .video-content {
  background-color: #1e2430;
}

.single-screen-mode .video-grid .video-cell .video-content .video-placeholder {
  background: linear-gradient(45deg, #0a1526, #1e3c72);
}

/* 修复文本只显示一半的问题 */
.device-tree-aside /deep/ .custom-tree-node {
  font-size: 14px !important;
  line-height: 20px !important;
  transition: all 0.3s ease !important;
  font-weight: 500 !important;
  width: 100% !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  display: flex !important;
  align-items: center !important;
  padding: 0 !important;
}

/* 调整树节点高度，确保文本显示完整 */
.device-tree-aside /deep/ .el-tree-node__content {
  height: auto !important;
  min-height: 34px !important;
  transition: all 0.2s ease !important;
  border-radius: 0 !important;
  margin: 2px 0 !important;
  padding: 0 8px !important;
}

/* 修改树节点悬浮效果，使其更加轻微 */
.device-tree-aside /deep/ .el-tree-node__content:hover {
  background-color: rgba(64, 158, 255, 0.1) !important;
  transform: translateX(2px) !important;
}

/* 在自定义树容器中添加底部内边距，确保最后一项完全显示 */
.custom-tree-container {
  flex: 1;
  overflow: auto;
  height: calc(100% - 80px);
  padding-bottom: 20px !important; /* 添加底部内边距 */
}

/* 添加树节点选中样式以区分悬浮状态 */
.device-tree-aside /deep/ .is-current>.el-tree-node__content {
  background-color: rgba(64, 158, 255, 0.15) !important;
  color: #409EFF !important;
  font-weight: bold !important;
  transform: none !important;
}

/* 修复图标显示 */
.device-tree-aside /deep/ .iconfont {
  transition: all 0.2s ease !important;
  margin-right: 6px !important;
  font-size: 16px !important;
  min-width: 16px !important;
  text-align: center !important;
  display: inline-block !important;
  flex-shrink: 0 !important;
}

/* 确保文本容器有足够的空间 */
.device-tree-aside /deep/ .custom-tree-node span {
  line-height: 1.5 !important;
  display: inline-block !important;
  padding-bottom: 2px !important; /* 底部添加小间距 */
  vertical-align: middle !important;
}

.warning-list .list-content .warning-item .warning-video {
  width: 100%;
  height: 100px;
  margin-bottom: 8px;
  border-radius: 6px;
  overflow: hidden;
  padding: 0;
  position: relative;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
}

.warning-list .list-content .warning-item .warning-image {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 6px;
}

.warning-list .list-content .warning-item .warning-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.3s ease;
}

.warning-list .list-content .warning-item:hover .warning-image img {
  transform: scale(1.05);
}

.warning-list .list-content .warning-item .warning-video .video-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #0a1526, #1e3c72);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  border-radius: 0;
  position: relative;
}

.warning-list .list-content .warning-item .warning-video .video-placeholder i {
  font-size: 36px;
  margin-bottom: 12px;
  opacity: 0.8;
}

.warning-list .list-content .warning-item .warning-video .video-placeholder span {
  font-size: 13px;
  opacity: 0.9;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.warning-list .list-content .warning-item.level1 .warning-video .video-placeholder i {
  color: #f56c6c;
  animation: pulse 1.5s infinite;
}

.warning-list .list-content .warning-item.level2 .warning-video .video-placeholder i {
  color: #e6a23c;
}

.warning-list .list-content .warning-item.level3 .warning-video .video-placeholder i {
  color: #409EFF;
}

.warning-list .list-content .warning-item.level4 .warning-video .video-placeholder i {
  color: #67c23a;
}

.warning-media .placeholder-image,
.warning-media .placeholder-video {
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

.warning-media .placeholder-image i,
.warning-media .placeholder-video i {
  opacity: 0.8;
  margin-bottom: 10px;
}

.warning-media .placeholder-image i.el-icon-warning {
  color: #f56c6c;
  animation: pulse 1.5s infinite;
}

.warning-media .placeholder-video i.el-icon-video-camera {
  color: #409EFF;
}

body.camera-fullscreen-mode .video-cell .video-content .video-placeholder i.el-icon-warning {
  color: #f56c6c;
  animation: pulse 1.5s infinite;
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

/* 归档对话框样式 */
.archive-dialog-content {
  padding: 10px 0;
}

.archive-info {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  font-size: 14px;
  color: #333;
}

.archive-selection {
  margin-bottom: 20px;
}

.archive-tip {
  margin-top: 20px;
}

/* 对话框样式优化 - 科技感设计 */
.realtime-monitoring-container >>> .el-dialog {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.realtime-monitoring-container >>> .el-dialog__header {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid rgba(59, 130, 246, 0.1);
  padding: 16px 20px;
}

.realtime-monitoring-container >>> .el-dialog__title {
  color: #1f2937;
  font-weight: 600;
}

.realtime-monitoring-container >>> .el-dialog__close {
  color: #6b7280;
  transition: color 0.3s ease;
}

.realtime-monitoring-container >>> .el-dialog__close:hover {
  color: #3b82f6;
}

.realtime-monitoring-container >>> .el-dialog__body {
  padding: 20px;
  background: #ffffff;
}

.realtime-monitoring-container >>> .el-button--primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  border: none;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;
  border-radius: 6px;
}

.realtime-monitoring-container >>> .el-button--primary:hover {
  background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4);
  transform: translateY(-1px);
}

.realtime-monitoring-container >>> .el-button--success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;
  border-radius: 6px;
}

.realtime-monitoring-container >>> .el-button--success:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.4);
  transform: translateY(-1px);
}

.realtime-monitoring-container >>> .el-button--default {
  background: white;
  border: 1px solid #d1d5db;
  color: #4b5563;
  transition: all 0.3s ease;
  border-radius: 6px;
}

.realtime-monitoring-container >>> .el-button--default:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #3b82f6;
  color: #1e40af;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

/* 输入框和选择框样式优化 */
.realtime-monitoring-container >>> .el-input__inner {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.realtime-monitoring-container >>> .el-input__inner:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.realtime-monitoring-container >>> .el-textarea__inner {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.realtime-monitoring-container >>> .el-textarea__inner:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* 通道列表区域隐藏滚动条 */
.custom-tree-container::-webkit-scrollbar {
  width: 0px;
  background: transparent;
}

.custom-tree-container {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE和Edge */
}

/* 实时预警列表滚动条 - 黑色样式 */
.warning-list .list-content::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.warning-list .list-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.warning-list .list-content::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.warning-list .list-content::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}

/* 其他区域保持默认滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}

/* Loading动画 - 科技感效果 */
.realtime-monitoring-container >>> .el-loading-mask {
  background-color: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(4px);
}

.realtime-monitoring-container >>> .el-loading-spinner {
  color: #3b82f6 !important;
}

.realtime-monitoring-container >>> .el-loading-text {
  color: #1f2937 !important;
  font-weight: 500 !important;
}

/* Pulse动画 */
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

/* 淡入动画 */
@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 🆕 OSD检测框叠加相关样式 */
/* AI任务选择器 */
.ai-task-selector {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 20;
  background: rgba(0, 0, 0, 0.75);
  padding: 6px;
  border-radius: 6px;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.ai-task-selector >>> .el-select {
  width: 200px;
}

.ai-task-selector >>> .el-input__inner {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(59, 130, 246, 0.5);
  color: #fff;
  font-size: 12px;
}

.ai-task-selector >>> .el-input__inner::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

/* 视频播放器包装器 */
.video-player-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

/* 🆕 调试信息显示区域 */
.detection-debug-info {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.85);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  color: #fff;
  z-index: 20;
  max-width: 300px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.detection-debug-info .debug-line {
  margin-bottom: 4px;
  display: flex;
  align-items: center;
}

.detection-debug-info .debug-line:last-child {
  margin-bottom: 0;
}

.detection-debug-info .debug-label {
  color: #8492a6;
  margin-right: 8px;
  min-width: 70px;
}

.detection-debug-info .debug-value {
  color: #fff;
  font-weight: 500;
}

.detection-debug-info .debug-value.connected {
  color: #10b981;
}

.detection-debug-info .debug-value.disconnected {
  color: #f56c6c;
}

/* 🆕 OSD样式结束 */

</style>

<!-- 全局样式，处理全屏模式 -->
<style>
/* 归档对话框层级控制 - 确保始终在最上层 */
/* 方案1: 直接设置对话框类的 z-index */
.realtime-archive-dialog {
  z-index: 3000 !important;
}

/* 方案2: 设置对话框包裹层的 z-index（Element UI 的实际结构） */
.el-dialog__wrapper .realtime-archive-dialog {
  z-index: 3001 !important;
}

/* 方案3: 针对归档对话框的包裹层（使用属性选择器作为备用） */
div[aria-label="归档预警"] {
  z-index: 3001 !important;
}

/* 方案4: 使用 :has 选择器（现代浏览器支持） */
.el-dialog__wrapper:has(.realtime-archive-dialog) {
  z-index: 3001 !important;
}

/* 归档对话框对应的遮罩层 */
.v-modal[style*="z-index: 3000"] {
  z-index: 3000 !important;
}

/* 归档对话框中的 select 下拉框层级控制 */
.archive-select-dropdown {
  z-index: 3002 !important;
}

/* 确保 select 下拉框在对话框之上 */
.el-select-dropdown.archive-select-dropdown {
  z-index: 3002 !important;
}

/* 全屏状态下的页面容器 */
body.camera-fullscreen-mode #realTimeMonitoring {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  z-index: 9999 !important;
  height: 100vh !important;
  width: 100vw !important;
  padding: 0 !important;
  margin: 0 !important;
  background: linear-gradient(135deg, #0a1526, #1e3a70) !important;
}

/* 全屏状态下隐藏设备列表和预警列表 */
body.camera-fullscreen-mode .el-aside {
  display: none !important;
}

/* 全屏状态下调整监控容器样式 */
body.camera-fullscreen-mode .el-container {
  max-width: 100% !important;
  width: 100% !important;
  padding: 16px !important;
  height: 100vh !important;
  max-height: 100vh !important;
}

/* 全屏状态下视频网格占满屏幕 */
body.camera-fullscreen-mode .video-grid {
  height: calc(100vh - 70px) !important;
  max-height: 100vh !important;
  background-color: transparent !important;
  box-shadow: none !important;
}

/* 全屏状态下工具栏样式调整 */
body.camera-fullscreen-mode .el-header {
  background: rgba(0, 0, 0, 0.7) !important;
  padding: 8px 16px !important;
  border-radius: 8px !important;
  margin-bottom: 16px !important;
  position: absolute !important;
  top: 16px !important;
  right: 16px !important;
  z-index: 10 !important;
  width: auto !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
  backdrop-filter: blur(5px) !important;
}

/* 全屏状态下时间显示，移除背景 */
body.camera-fullscreen-mode .current-time {
  color: #ffffff !important;
}

body.camera-fullscreen-mode .current-time i {
  color: #ffffff !important;
}

body.camera-fullscreen-mode .header-label {
  color: #ffffff !important;
}

/* 全屏状态下按钮样式调整 */
body.camera-fullscreen-mode .btn {
  color: white !important;
}

body.camera-fullscreen-mode .btn:hover {
  color: #409EFF !important;
  background-color: rgba(255, 255, 255, 0.15) !important;
}

body.camera-fullscreen-mode .btn.active {
  background-color: rgba(255, 255, 255, 0.2) !important;
}

/* 确保全屏模式下没有滚动条 */
body.camera-fullscreen-mode {
  overflow: hidden !important;
}

/* 全屏模式下视频单元格样式 */
body.camera-fullscreen-mode .video-cell {
  border-width: 0 !important;
  border-radius: 8px !important;
  background: rgba(0, 0, 0, 0.2) !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
  width: 100% !important;
  height: 100% !important;
  overflow: hidden !important;
}

body.camera-fullscreen-mode .video-cell .video-overlay {
  padding: 16px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0) 100%);
}

body.camera-fullscreen-mode .video-cell .video-overlay .camera-name {
  font-size: 16px;
}

/* 默认滚动条样式 - 黑色主题 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}

/* 添加截图按钮的数据方法 */
</style>
