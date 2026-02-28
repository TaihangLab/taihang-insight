<template>
  <div class="model-factory">
    <!-- ===== 顶部状态栏 ===== -->
    <div class="top-bar">
      <div class="top-left">
        <span class="ls-status">
          <span :class="['ls-dot', lsConnected ? 'connected' : 'disconnected']"></span>
          <span v-if="lsConnected" class="ls-text">Label Studio 已连接</span>
          <span v-else class="ls-text ls-text-warn">Label Studio 未连接</span>
          <span v-if="lsUrl" class="ls-url">{{ lsUrl }}</span>
        </span>
      </div>
      <div class="top-right">
        <el-button icon="el-icon-refresh-left" size="mini" @click="refreshAll" :loading="refreshing">刷新</el-button>
      </div>
    </div>

    <!-- ===== 流程步骤指引 ===== -->
    <div class="steps-bar" v-if="selectedDataset">
      <el-steps :active="currentStep" finish-status="success" align-center size="small">
        <el-step title="创建数据集"></el-step>
        <el-step title="添加图片"></el-step>
        <el-step title="去标注"></el-step>
        <el-step title="同步结果"></el-step>
        <el-step title="导出数据"></el-step>
        <el-step title="训练模型"></el-step>
      </el-steps>
    </div>

    <!-- ===== 主内容：左右布局 ===== -->
    <div class="main-content">
      <!-- 左侧：数据集列表 -->
      <div class="left-panel">
        <div class="left-header">
          <span class="left-title">数据集</span>
          <el-button type="primary" icon="el-icon-plus" size="mini" @click="showCreateDialog">新建</el-button>
        </div>
        <div class="dataset-list" v-loading="datasetsLoading">
          <div v-if="!datasets.length" class="empty-tip">暂无数据集，点击上方「新建」创建</div>
          <div
            v-for="ds in datasets"
            :key="ds.id"
            :class="['dataset-card', { active: selectedDataset && selectedDataset.id === ds.id }]"
            @click="selectDataset(ds)">
            <div class="card-top">
              <span class="card-name">{{ ds.name }}</span>
              <el-tag :type="statusTagType(ds.status)" size="mini">{{ statusLabel(ds.status) }}</el-tag>
            </div>
            <div class="card-labels" v-if="ds.label_names && ds.label_names.length">
              <el-tag v-for="lb in ds.label_names.slice(0, 3)" :key="lb" size="mini" effect="plain" class="label-tag">{{ lb }}</el-tag>
              <span v-if="ds.label_names.length > 3" class="label-more">+{{ ds.label_names.length - 3 }}</span>
            </div>
            <div class="card-progress">
              <el-progress
                :percentage="ds.image_count ? Math.round(ds.labeled_count / ds.image_count * 100) : 0"
                :stroke-width="6"
                :show-text="false">
              </el-progress>
              <span class="progress-text">{{ ds.labeled_count || 0 }}/{{ ds.image_count || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：详情面板 -->
      <div class="right-panel">
        <!-- 未选中状态 -->
        <div v-if="!selectedDataset" class="empty-detail">
          <i class="el-icon-folder-opened" style="font-size: 48px; color: #dcdfe6;"></i>
          <p>选择左侧数据集查看详情，或新建一个数据集</p>
        </div>

        <!-- 已选中 -->
        <div v-else class="detail-content">
          <!-- LS 项目已删除警告 -->
          <el-alert
            v-if="lsProjectWarning"
            :title="lsProjectWarning"
            type="warning"
            description="该数据集关联的 Label Studio 项目已不存在，上传图片时会自动重新创建项目。"
            show-icon
            :closable="false"
            style="margin-bottom: 10px;"
          />
          <!-- 数据集头部信息 -->
          <div class="detail-header">
            <div class="detail-header-left">
              <h3 class="detail-name">{{ selectedDataset.name }}</h3>
              <el-tag :type="statusTagType(selectedDataset.status)" size="small">{{ statusLabel(selectedDataset.status) }}</el-tag>
              <span class="detail-desc" v-if="selectedDataset.description">{{ selectedDataset.description }}</span>
            </div>
            <div class="detail-header-right">
              <el-popconfirm title="确定删除此数据集？关联的 Label Studio 项目也会被删除。" @confirm="handleDeleteDataset">
                <el-button slot="reference" type="danger" size="mini" icon="el-icon-delete" plain>删除数据集</el-button>
              </el-popconfirm>
            </div>
          </div>

          <!-- Tabs -->
          <el-tabs v-model="activeTab" type="border-card" class="detail-tabs">

            <!-- ====== Tab 1: 图片管理 ====== -->
            <el-tab-pane name="images">
              <span slot="label"><i class="el-icon-picture-outline"></i> 图片管理 ({{ selectedDataset.image_count || 0 }})</span>
              <div class="tab-toolbar">
                <el-button type="primary" size="small" icon="el-icon-plus" @click="showAddImagesDialog">添加图片</el-button>
                <el-button size="small" icon="el-icon-refresh" @click="loadImages" :loading="imagesLoading">刷新</el-button>
              </div>
              <div class="image-grid" v-loading="imagesLoading">
                <div v-if="!images.length" class="empty-tip">暂无图片，点击「添加图片」开始</div>
                <div v-for="img in images" :key="img.id" class="image-card">
                  <el-image
                    :src="imageProxyUrl(img.id)"
                    :preview-src-list="imagePreviewList"
                    fit="cover"
                    class="image-thumb">
                    <div slot="error" class="image-error">
                      <i class="el-icon-picture-outline"></i>
                    </div>
                  </el-image>
                  <span :class="['image-badge', img.is_labeled ? 'labeled' : 'unlabeled']">
                    {{ img.is_labeled ? '已标注' : '未标注' }}
                  </span>
                </div>
              </div>
            </el-tab-pane>

            <!-- ====== Tab 2: 标注 & 同步 ====== -->
            <el-tab-pane name="annotation">
              <span slot="label"><i class="el-icon-edit-outline"></i> 标注 & 同步</span>
              <div class="annotation-panel">
                <!-- Label Studio 入口 -->
                <div class="anno-section">
                  <h4>前往 Label Studio 标注</h4>
                  <p class="anno-hint">在 Label Studio 中设置标注类型、标注类别并完成标注后，回到此处点击「同步」拉取结果。</p>
                  <el-button
                    v-if="selectedDataset.ls_project_url"
                    type="primary"
                    size="medium"
                    icon="el-icon-link"
                    @click="openLabelStudio">
                    打开 Label Studio 标注项目
                  </el-button>
                  <el-alert
                    v-else
                    title="此数据集未关联 Label Studio 项目（可能创建时 LS 未连接），请删除重建或检查 LS 连接状态。"
                    type="warning"
                    :closable="false"
                    show-icon
                    style="margin-top: 8px;">
                  </el-alert>
                </div>

                <!-- 标注进度 -->
                <div class="anno-section">
                  <h4>标注进度</h4>
                  <div class="anno-progress">
                    <el-progress
                      type="circle"
                      :percentage="annoPercentage"
                      :width="120"
                      :stroke-width="8">
                    </el-progress>
                    <div class="anno-stats">
                      <div class="stat-row"><span class="stat-label">图片总数</span><span class="stat-value">{{ selectedDataset.image_count || 0 }}</span></div>
                      <div class="stat-row"><span class="stat-label">已标注</span><span class="stat-value success-text">{{ selectedDataset.labeled_count || 0 }}</span></div>
                      <div class="stat-row"><span class="stat-label">未标注</span><span class="stat-value">{{ (selectedDataset.image_count || 0) - (selectedDataset.labeled_count || 0) }}</span></div>
                    </div>
                  </div>
                </div>

                <!-- 同步按钮 -->
                <div class="anno-section">
                  <h4>同步标注结果</h4>
                  <p class="anno-hint">从 Label Studio 拉取最新标注数据到本地。</p>
                  <el-button
                    type="warning"
                    size="medium"
                    icon="el-icon-download"
                    :loading="syncing"
                    :disabled="!selectedDataset.ls_project_url"
                    @click="handleSync">
                    同步标注结果
                  </el-button>
                  <span v-if="syncResult" class="sync-result">
                    {{ syncResult }}
                  </span>
                </div>
              </div>
            </el-tab-pane>

            <!-- ====== Tab 3: 导出 & 训练 ====== -->
            <el-tab-pane name="training">
              <span slot="label"><i class="el-icon-cpu"></i> 导出 & 训练</span>
              <div class="training-panel">
                <!-- 导出区域 -->
                <div class="training-section">
                  <h4>导出 YOLO 数据集</h4>
                  <p class="anno-hint">将已标注的图片导出为 YOLO 格式 ZIP（含 train/val 划分），供训练使用。</p>
                  <div class="export-controls">
                    <span class="export-label">验证集比例：</span>
                    <el-slider v-model="valRatioPercent" :min="5" :max="50" :step="5" :format-tooltip="v => v + '%'" style="width: 200px; display: inline-block; vertical-align: middle;" />
                    <span class="export-label" style="margin-left: 12px;">{{ valRatioPercent }}%</span>
                    <el-button type="success" size="small" icon="el-icon-upload2" :loading="exporting" @click="handleExport" style="margin-left: 20px;">
                      导出数据集
                    </el-button>
                  </div>
                  <div v-if="exportResult" class="export-result">
                    <el-alert type="success" :closable="false" show-icon>
                      <div>导出完成：训练集 {{ exportResult.train_count }} 张，验证集 {{ exportResult.val_count }} 张，标注框 {{ exportResult.total_labels }} 个</div>
                      <div v-if="exportResult.zip_path" style="margin-top: 4px; font-size: 12px; color: #909399; word-break: break-all;">
                        保存路径：{{ exportResult.zip_path }}
                      </div>
                    </el-alert>
                  </div>
                </div>

                <el-divider></el-divider>

                <!-- 训练区域 -->
                <div class="training-section">
                  <div class="section-header">
                    <h4>训练任务</h4>
                    <el-button
                      type="primary"
                      size="small"
                      icon="el-icon-video-play"
                      :disabled="selectedDataset.status !== 'exported'"
                      @click="showCreateTrainingDialog">
                      创建训练任务
                    </el-button>
                  </div>
                  <p v-if="selectedDataset.status !== 'exported'" class="anno-hint">请先导出数据集后才能创建训练任务。</p>

                  <el-table :data="datasetTrainingTasks" border stripe size="small" style="width: 100%; margin-top: 8px;" empty-text="暂无训练任务" v-loading="tasksLoading">
                    <el-table-column prop="name" label="任务名称" min-width="140" />
                    <el-table-column prop="base_model" label="模型" width="110" />
                    <el-table-column label="参数" width="180">
                      <template slot-scope="scope">
                        e{{ scope.row.epochs }} b{{ scope.row.batch_size }} img{{ scope.row.image_size }}
                      </template>
                    </el-table-column>
                    <el-table-column label="进度" width="140">
                      <template slot-scope="scope">
                        <el-progress :percentage="scope.row.progress || 0" :status="progressStatus(scope.row.status)" :stroke-width="14" :text-inside="true" />
                      </template>
                    </el-table-column>
                    <el-table-column label="状态" width="90">
                      <template slot-scope="scope">
                        <el-tag :type="trainStatusType(scope.row.status)" size="mini">{{ trainStatusLabel(scope.row.status) }}</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="模型路径" min-width="160">
                      <template slot-scope="scope">
                        <span v-if="scope.row.output_model_path" style="font-size: 12px; word-break: break-all;">{{ scope.row.output_model_path }}</span>
                        <span v-else style="color: #ccc;">-</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="150" fixed="right">
                      <template slot-scope="scope">
                        <el-button v-if="scope.row.status === 'pending' || scope.row.status === 'failed'"
                          size="mini" type="primary" @click="handleStartTraining(scope.row)">启动</el-button>
                        <el-button v-if="scope.row.status === 'running'"
                          size="mini" type="warning" @click="handleCancelTraining(scope.row)">取消</el-button>
                        <el-button size="mini" @click="showTrainingDetail(scope.row)">详情</el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>

    <!-- ===== 创建数据集弹窗 ===== -->
    <el-dialog title="新建数据集" :visible.sync="createDialogVisible" width="440px" :close-on-click-modal="false" append-to-body>
      <el-form :model="createForm" ref="createForm" label-width="80px" :rules="createRules" size="small">
        <el-form-item label="名称" prop="name">
          <el-input v-model="createForm.name" placeholder="如：安全帽标注数据集" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="createForm.description" type="textarea" :rows="2" placeholder="可选" maxlength="500" />
        </el-form-item>
      </el-form>
      <div class="form-tip" style="padding: 0 20px; color: #909399; font-size: 12px;">
        创建后请在 Label Studio 中设置标注类型和标注类别，然后上传图片开始标注。
      </div>
      <div slot="footer">
        <el-button size="small" @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" size="small" :loading="creating" @click="confirmCreate">创建</el-button>
      </div>
    </el-dialog>

    <!-- ===== 添加图片弹窗 ===== -->
    <el-dialog title="上传图片" :visible.sync="addImagesDialogVisible" width="520px" :close-on-click-modal="false" append-to-body>
      <el-upload
        ref="imageUploader"
        action=""
        :auto-upload="false"
        :file-list="uploadFileList"
        :on-change="handleUploadChange"
        :on-remove="handleUploadChange"
        accept="image/jpeg,image/png,image/bmp,image/webp"
        multiple
        drag
        list-type="picture">
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将图片拖到此处，或 <em>点击选择</em></div>
        <div class="el-upload__tip" slot="tip">支持 JPG/PNG/BMP/WEBP，单张不超过 20MB，一次最多 50 张</div>
      </el-upload>
      <div slot="footer">
        <el-button size="small" @click="addImagesDialogVisible = false">取消</el-button>
        <el-button type="primary" size="small" :loading="addingImages" @click="confirmAddImages"
          :disabled="!uploadFileList.length">上传 ({{ uploadFileList.length }})</el-button>
      </div>
    </el-dialog>

    <!-- ===== 创建训练任务弹窗 ===== -->
    <el-dialog title="创建训练任务" :visible.sync="createTrainingDialogVisible" width="480px" :close-on-click-modal="false" append-to-body>
      <el-form :model="trainingForm" ref="trainingForm" label-width="90px" :rules="trainingRules" size="small">
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="trainingForm.name" placeholder="如：安全帽训练v1" maxlength="200" />
        </el-form-item>
        <el-form-item label="数据集">
          <el-input :value="selectedDataset ? selectedDataset.name + ' (ID:' + selectedDataset.id + ')' : ''" disabled />
        </el-form-item>
        <el-form-item label="基础模型">
          <el-select v-model="trainingForm.base_model" style="width: 100%;">
            <el-option label="yolo11n.pt (Nano)" value="yolo11n.pt" />
            <el-option label="yolo11s.pt (Small)" value="yolo11s.pt" />
            <el-option label="yolo11m.pt (Medium)" value="yolo11m.pt" />
            <el-option label="yolo11l.pt (Large)" value="yolo11l.pt" />
            <el-option label="yolo11x.pt (XLarge)" value="yolo11x.pt" />
          </el-select>
        </el-form-item>
        <el-form-item label="训练轮数">
          <el-input-number v-model="trainingForm.epochs" :min="1" :max="1000" style="width: 160px;" />
        </el-form-item>
        <el-form-item label="批量大小">
          <el-input-number v-model="trainingForm.batch_size" :min="1" :max="128" style="width: 160px;" />
        </el-form-item>
        <el-form-item label="图片尺寸">
          <el-input-number v-model="trainingForm.image_size" :min="320" :max="1280" :step="32" style="width: 160px;" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="createTrainingDialogVisible = false">取消</el-button>
        <el-button type="primary" size="small" :loading="creatingTraining" @click="confirmCreateTraining">创建</el-button>
      </div>
    </el-dialog>

    <!-- ===== 训练详情弹窗 ===== -->
    <el-dialog title="训练任务详情" :visible.sync="trainingDetailVisible" width="580px" append-to-body>
      <div v-if="trainingDetailTask">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="任务ID">{{ trainingDetailTask.id }}</el-descriptions-item>
          <el-descriptions-item label="名称">{{ trainingDetailTask.name }}</el-descriptions-item>
          <el-descriptions-item label="基础模型">{{ trainingDetailTask.base_model }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="trainStatusType(trainingDetailTask.status)" size="small">{{ trainStatusLabel(trainingDetailTask.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="epochs">{{ trainingDetailTask.epochs }}</el-descriptions-item>
          <el-descriptions-item label="进度">{{ trainingDetailTask.progress }}%</el-descriptions-item>
          <el-descriptions-item label="模型路径" :span="2">{{ trainingDetailTask.output_model_path || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ trainingDetailTask.created_at }}</el-descriptions-item>
        </el-descriptions>
        <div v-if="trainingDetailTask.error_message" style="margin-top: 12px;">
          <el-alert title="错误信息" type="error" :closable="false" show-icon>
            <pre style="white-space: pre-wrap; font-size: 12px; max-height: 200px; overflow: auto;">{{ trainingDetailTask.error_message && trainingDetailTask.error_message.length > 1000 ? trainingDetailTask.error_message.slice(-1000) : trainingDetailTask.error_message }}</pre>
          </el-alert>
        </div>
        <div v-if="trainingDetailTask.metrics" style="margin-top: 12px;">
          <h4 style="margin-bottom: 8px;">训练指标</h4>
          <el-tag v-for="(val, key) in trainingDetailTask.metrics" :key="key" size="small" style="margin: 2px 4px;">{{ key }}: {{ val }}</el-tag>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { mlPipelineAPI } from '../../service/VisionAIService.js';
const config = require('../../../../config/index.js');

export default {
  name: 'ModelFactory',
  data() {
    return {
      // Label Studio 状态
      lsConnected: false,
      lsUrl: '',

      // 数据集
      datasetsLoading: false,
      datasets: [],
      selectedDataset: null,
      activeTab: 'images',

      // LS 项目状态
      lsProjectWarning: '',

      // 图片
      images: [],
      imagesLoading: false,

      // 同步
      syncing: false,
      syncResult: '',

      // 导出
      exporting: false,
      exportResult: null,
      valRatioPercent: 20,

      // 训练
      allTrainingTasks: [],
      tasksLoading: false,

      // 刷新
      refreshing: false,

      // 创建数据集弹窗
      createDialogVisible: false,
      creating: false,
      createForm: { name: '', description: '' },
      createRules: {
        name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
      },

      // 上传图片弹窗
      addImagesDialogVisible: false,
      addingImages: false,
      uploadFileList: [],

      // 创建训练弹窗
      createTrainingDialogVisible: false,
      creatingTraining: false,
      trainingForm: { name: '', base_model: 'yolo11n.pt', epochs: 100, batch_size: 16, image_size: 640 },
      trainingRules: {
        name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
      },

      // 训练详情
      trainingDetailVisible: false,
      trainingDetailTask: null,

      // 轮询
      pollTimer: null,
    };
  },
  computed: {
    currentStep() {
      const ds = this.selectedDataset;
      if (!ds) return 0;
      const hasRunningTask = this.datasetTrainingTasks.some(t => t.status === 'running' || t.status === 'completed');
      if (ds.status === 'exported' && hasRunningTask) return 6;
      if (ds.status === 'exported') return 5;
      if (ds.status === 'completed') return 4;
      if (ds.status === 'labeling' && ds.labeled_count > 0) return 3;
      if (ds.status === 'labeling') return 2;
      if (ds.status === 'created' && ds.image_count > 0) return 1;
      return 0;
    },
    annoPercentage() {
      const ds = this.selectedDataset;
      if (!ds || !ds.image_count) return 0;
      return Math.round((ds.labeled_count || 0) / ds.image_count * 100);
    },
    imagePreviewList() {
      return this.images.map(i => this.imageProxyUrl(i.id));
    },
    datasetTrainingTasks() {
      if (!this.selectedDataset) return [];
      return this.allTrainingTasks.filter(t => t.dataset_id === this.selectedDataset.id);
    },
  },
  mounted() {
    this.checkLabelStudio();
    this.loadDatasets();
    this.loadAllTrainingTasks();
    this.pollTimer = setInterval(() => {
      if (this.allTrainingTasks.some(t => t.status === 'running')) {
        this.silentLoadTrainingTasks();
      }
    }, 5000);
  },
  beforeDestroy() {
    if (this.pollTimer) clearInterval(this.pollTimer);
  },
  methods: {
    imageProxyUrl(imageId) {
      return `${config.API_BASE_URL}/api/v1/ml-pipeline/annotation/images/${imageId}/proxy`;
    },

    // ---- Label Studio ----
    async checkLabelStudio() {
      try {
        const res = await mlPipelineAPI.getLabelStudioStatus();
        const data = res.data;
        this.lsConnected = data.connection && data.connection.success;
        this.lsUrl = data.url || '';
      } catch (_) {
        this.lsConnected = false;
      }
    },
    openLabelStudio() {
      if (this.selectedDataset && this.selectedDataset.ls_project_url) {
        window.open(this.selectedDataset.ls_project_url, '_blank');
      }
    },

    // ---- 数据集列表 ----
    async loadDatasets() {
      this.datasetsLoading = true;
      try {
        const res = await mlPipelineAPI.listDatasets();
        this.datasets = res.data.data || [];
        if (this.selectedDataset) {
          const updated = this.datasets.find(d => d.id === this.selectedDataset.id);
          if (updated) this.selectedDataset = updated;
          else this.selectedDataset = null;
        }
      } catch (e) {
        this.$message.error('加载数据集失败');
      } finally {
        this.datasetsLoading = false;
      }
    },
    async selectDataset(ds) {
      this.selectedDataset = ds;
      this.syncResult = '';
      this.exportResult = null;
      this.lsProjectWarning = '';
      this.loadImages();
      if (ds.ls_project_id) {
        try {
          const res = await mlPipelineAPI.checkLsProject(ds.id);
          const data = res.data.data;
          if (!data.exists) {
            this.lsProjectWarning = data.reason || 'Label Studio 项目已被删除';
            this.$message.warning(this.lsProjectWarning);
            this.loadDatasets();
          }
        } catch (e) {
          // 检查失败不阻塞
        }
      }
    },

    // ---- 图片 ----
    async loadImages() {
      if (!this.selectedDataset) return;
      this.imagesLoading = true;
      try {
        const res = await mlPipelineAPI.listImages(this.selectedDataset.id);
        this.images = res.data.data || [];
      } catch (_) {
        this.images = [];
      } finally {
        this.imagesLoading = false;
      }
    },

    // ---- 同步 ----
    async handleSync() {
      this.syncing = true;
      this.syncResult = '';
      try {
        const res = await mlPipelineAPI.syncAnnotations(this.selectedDataset.id);
        const d = res.data.data;
        this.syncResult = `同步完成：${d.synced_labels} 个标注，${d.labeled_images}/${d.total_images} 张已标注`;
        this.loadDatasets();
        this.loadImages();
      } catch (e) {
        this.$message.error('同步失败: ' + ((e.response && e.response.data && e.response.data.detail) || e.message));
      } finally {
        this.syncing = false;
      }
    },

    // ---- 导出 ----
    async handleExport() {
      this.exporting = true;
      this.exportResult = null;
      try {
        const res = await mlPipelineAPI.exportDataset(this.selectedDataset.id, this.valRatioPercent / 100);
        this.exportResult = res.data.data;
        this.$message.success('导出完成');
        this.loadDatasets();
      } catch (e) {
        this.$message.error('导出失败: ' + ((e.response && e.response.data && e.response.data.detail) || e.message));
      } finally {
        this.exporting = false;
      }
    },

    // ---- 训练任务 ----
    async loadAllTrainingTasks() {
      this.tasksLoading = true;
      try {
        const res = await mlPipelineAPI.listTrainingTasks();
        this.allTrainingTasks = res.data.data || [];
      } catch (_) {
        this.allTrainingTasks = [];
      } finally {
        this.tasksLoading = false;
      }
    },
    async silentLoadTrainingTasks() {
      try {
        const res = await mlPipelineAPI.listTrainingTasks();
        this.allTrainingTasks = res.data.data || [];
      } catch (_) { /* ignore */ }
    },
    handleStartTraining(row) {
      this.$confirm(`确定启动训练任务「${row.name}」？`, '确认启动', { type: 'info' })
        .then(async () => {
          try {
            await mlPipelineAPI.startTrainingTask(row.id);
            this.$message.success('训练已启动');
            this.loadAllTrainingTasks();
          } catch (e) {
            this.$message.error('启动失败: ' + ((e.response && e.response.data && e.response.data.detail) || e.message));
          }
        }).catch(() => {});
    },
    handleCancelTraining(row) {
      this.$confirm('确定取消训练任务？', '确认', { type: 'warning' })
        .then(async () => {
          try {
            await mlPipelineAPI.cancelTrainingTask(row.id);
            this.$message.success('已取消');
            this.loadAllTrainingTasks();
          } catch (e) {
            this.$message.error('取消失败');
          }
        }).catch(() => {});
    },
    showTrainingDetail(row) {
      this.trainingDetailTask = row;
      this.trainingDetailVisible = true;
    },
    progressStatus(status) {
      if (status === 'completed') return 'success';
      if (status === 'failed') return 'exception';
      return undefined;
    },

    // ---- 创建数据集 ----
    showCreateDialog() {
      this.createForm = { name: '', description: '' };
      this.createDialogVisible = true;
    },
    confirmCreate() {
      this.$refs.createForm.validate(async (valid) => {
        if (!valid) return;
        this.creating = true;
        try {
          const res = await mlPipelineAPI.createDataset({
            name: this.createForm.name,
            description: this.createForm.description,
          });
          this.$message.success('数据集创建成功');
          this.createDialogVisible = false;
          await this.loadDatasets();
          const newDs = this.datasets.find(d => d.id === res.data.data.id);
          if (newDs) this.selectDataset(newDs);
        } catch (e) {
          this.$message.error('创建失败: ' + ((e.response && e.response.data && e.response.data.detail) || e.message));
        } finally {
          this.creating = false;
        }
      });
    },

    // ---- 上传图片 ----
    showAddImagesDialog() {
      this.uploadFileList = [];
      this.addImagesDialogVisible = true;
      this.$nextTick(() => {
        if (this.$refs.imageUploader) this.$refs.imageUploader.clearFiles();
      });
    },
    handleUploadChange(file, fileList) {
      if (fileList.length > 50) {
        this.$message.warning('一次最多上传 50 张图片');
        fileList.splice(50);
      }
      this.uploadFileList = fileList;
    },
    async confirmAddImages() {
      if (!this.uploadFileList.length) { this.$message.warning('请选择至少一张图片'); return; }
      this.addingImages = true;
      try {
        const res = await mlPipelineAPI.uploadImages(this.selectedDataset.id, this.uploadFileList);
        const d = res.data.data;
        const msg = `上传 ${d.added} 张图片，推送 ${d.ls_imported} 张到 Label Studio`;
        if (d.errors && d.errors.length) {
          this.$message.warning(msg + `（${d.errors.length} 张失败）`);
        } else {
          this.$message.success(msg);
        }
        this.addImagesDialogVisible = false;
        this.loadDatasets();
        this.loadImages();
      } catch (e) {
        this.$message.error('上传失败: ' + ((e.response && e.response.data && e.response.data.detail) || e.message));
      } finally {
        this.addingImages = false;
      }
    },

    // ---- 创建训练任务 ----
    showCreateTrainingDialog() {
      this.trainingForm = { name: '', base_model: 'yolo11n.pt', epochs: 100, batch_size: 16, image_size: 640 };
      this.createTrainingDialogVisible = true;
    },
    confirmCreateTraining() {
      this.$refs.trainingForm.validate(async (valid) => {
        if (!valid) return;
        this.creatingTraining = true;
        try {
          await mlPipelineAPI.createTrainingTask({
            ...this.trainingForm,
            dataset_id: this.selectedDataset.id,
          });
          this.$message.success('训练任务创建成功');
          this.createTrainingDialogVisible = false;
          this.loadAllTrainingTasks();
        } catch (e) {
          this.$message.error('创建失败: ' + ((e.response && e.response.data && e.response.data.detail) || e.message));
        } finally {
          this.creatingTraining = false;
        }
      });
    },

    // ---- 删除数据集 ----
    async handleDeleteDataset() {
      try {
        await mlPipelineAPI.deleteDataset(this.selectedDataset.id);
        this.$message.success('删除成功');
        this.selectedDataset = null;
        this.images = [];
        this.loadDatasets();
      } catch (e) {
        this.$message.error('删除失败');
      }
    },

    // ---- 全局刷新 ----
    async refreshAll() {
      this.refreshing = true;
      await Promise.all([
        this.checkLabelStudio(),
        this.loadDatasets(),
        this.loadAllTrainingTasks(),
      ]);
      if (this.selectedDataset) this.loadImages();
      this.refreshing = false;
    },

    // ---- 工具 ----
    statusTagType(status) {
      return { created: 'info', labeling: 'warning', completed: 'success', exported: '' }[status] || 'info';
    },
    statusLabel(status) {
      return { created: '已创建', labeling: '标注中', completed: '已完成', exported: '已导出' }[status] || status;
    },
    trainStatusType(status) {
      return { pending: 'info', running: 'warning', completed: 'success', failed: 'danger', cancelled: 'info' }[status] || 'info';
    },
    trainStatusLabel(status) {
      return { pending: '待启动', running: '训练中', completed: '已完成', failed: '失败', cancelled: '已取消' }[status] || status;
    },
  }
};
</script>

<style scoped>
.model-factory {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

/* ---- 顶部栏 ---- */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
}
.ls-status { display: flex; align-items: center; gap: 6px; font-size: 13px; }
.ls-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.ls-dot.connected { background: #67c23a; }
.ls-dot.disconnected { background: #f56c6c; }
.ls-text { color: #303133; }
.ls-text-warn { color: #f56c6c; }
.ls-url { color: #909399; font-size: 12px; }

/* ---- 步骤栏 ---- */
.steps-bar {
  padding: 10px 24px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
}

/* ---- 主内容 ---- */
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ---- 左侧面板 ---- */
.left-panel {
  width: 300px;
  min-width: 300px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
}
.left-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid #f0f0f0;
}
.left-title { font-size: 15px; font-weight: 600; color: #303133; }
.dataset-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}
.empty-tip {
  text-align: center;
  color: #909399;
  font-size: 13px;
  padding: 40px 16px;
}

/* ---- 数据集卡片 ---- */
.dataset-card {
  padding: 10px 12px;
  margin-bottom: 6px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}
.dataset-card:hover { background: #f5f7fa; }
.dataset-card.active {
  background: #ecf5ff;
  border-color: #409eff;
}
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.card-name { font-size: 14px; font-weight: 500; color: #303133; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; }
.card-labels { margin-bottom: 6px; }
.label-tag { margin-right: 4px; }
.label-more { font-size: 11px; color: #909399; }
.card-progress { display: flex; align-items: center; gap: 8px; }
.card-progress .el-progress { flex: 1; }
.progress-text { font-size: 12px; color: #909399; white-space: nowrap; }

/* ---- 右侧面板 ---- */
.right-panel {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
.empty-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  gap: 12px;
}
.empty-detail p { font-size: 14px; }

/* ---- 详情头部 ---- */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}
.detail-header-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.detail-name { margin: 0; font-size: 18px; color: #303133; }
.detail-desc { font-size: 13px; color: #909399; width: 100%; margin-top: 2px; }

/* ---- Tabs ---- */
.detail-tabs { min-height: 400px; }

/* ---- Tab 工具栏 ---- */
.tab-toolbar { margin-bottom: 12px; display: flex; gap: 8px; }

/* ---- 图片网格 ---- */
.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  min-height: 100px;
}
.image-card {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e8e8e8;
}
.image-thumb { width: 100%; height: 100%; display: block; }
.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #ccc;
  font-size: 24px;
}
.image-badge {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 11px;
  padding: 2px 0;
  color: #fff;
}
.image-badge.labeled { background: rgba(103, 194, 58, 0.85); }
.image-badge.unlabeled { background: rgba(144, 147, 153, 0.7); }

/* ---- 标注面板 ---- */
.annotation-panel { padding: 4px 0; }
.anno-section { margin-bottom: 24px; }
.anno-section h4 { margin: 0 0 6px 0; font-size: 15px; color: #303133; }
.anno-hint { font-size: 13px; color: #909399; margin: 0 0 10px 0; }
.anno-progress { display: flex; align-items: center; gap: 32px; margin-top: 12px; }
.anno-stats { display: flex; flex-direction: column; gap: 8px; }
.stat-row { display: flex; gap: 12px; font-size: 14px; }
.stat-label { color: #909399; min-width: 60px; }
.stat-value { font-weight: 600; color: #303133; }
.success-text { color: #67c23a; }
.sync-result { margin-left: 12px; font-size: 13px; color: #67c23a; }

/* ---- 训练面板 ---- */
.training-panel { padding: 4px 0; }
.training-section { margin-bottom: 16px; }
.training-section h4 { margin: 0 0 6px 0; font-size: 15px; color: #303133; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.section-header h4 { margin: 0; }
.export-controls { display: flex; align-items: center; margin-top: 8px; }
.export-label { font-size: 13px; color: #606266; }
.export-result { margin-top: 10px; }

/* ---- 其他 ---- */
.form-tip { font-size: 12px; color: #909399; line-height: 1.4; margin-top: 4px; }
</style>
