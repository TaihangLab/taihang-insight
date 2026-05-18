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
              <span class="card-id">#{{ ds.id }}</span>
            </div>
            <div class="card-info">
              <span class="info-label">位置:</span>
              <span class="info-value">默认位置</span>
            </div>
            <div class="card-info">
              <span class="info-label">创建:</span>
              <span class="info-value">{{ ds.created_at || ds.create_time || '2026-05-14 01:17:50' }}</span>
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
              <el-tag :type="statusTagType(selectedDataset.status)" size="small" :class="{'created-tag': selectedDataset.status === 'created'}">{{ statusLabel(selectedDataset.status) }}</el-tag>
              <span class="detail-desc" v-if="selectedDataset.description">{{ selectedDataset.description }}</span>
            </div>
            <div class="detail-header-right">
              <el-popconfirm title="确定删除此数据集？关联的 Label Studio 项目也会被删除。" @confirm="handleDeleteDataset">
                <el-button slot="reference" type="danger" size="mini" icon="el-icon-delete">删除数据集</el-button>
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
                    v-if="selectedDataset.ls_project_id"
                    type="primary"
                    size="medium"
                    icon="el-icon-link"
                    @click="openLabelStudio">
                    打开 Label Studio 标注项目
                  </el-button>
                  <p v-if="selectedDataset.ls_project_id" class="anno-hint" style="margin-top: 6px;">
                    登录账号：<b>admin@admin.com</b> &nbsp; 密码：<b>admin123456</b>
                  </p>
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
                    <div>
                      <el-button
                        size="small"
                        :type="tbStatus.running ? 'warning' : 'default'"
                        icon="el-icon-data-analysis"
                        @click="toggleTensorBoard">
                        {{ tbStatus.running ? '关闭 TensorBoard' : 'TensorBoard' }}
                      </el-button>
                      <el-button
                        type="primary"
                        size="small"
                        icon="el-icon-video-play"
                        :disabled="selectedDataset.status !== 'exported'"
                        @click="showCreateTrainingDialog">
                        创建训练任务
                      </el-button>
                    </div>
                  </div>
                  <p v-if="selectedDataset.status !== 'exported'" class="anno-hint">请先导出数据集后才能创建训练任务。</p>

                  <el-table :data="datasetTrainingTasks" border stripe size="small" style="width: 100%; margin-top: 8px;" empty-text="暂无训练任务" v-loading="tasksLoading">
                    <el-table-column prop="name" label="任务名称" min-width="120" />
                    <el-table-column label="类型" width="85">
                      <template slot-scope="scope">
                        <el-tag size="mini" effect="plain">{{ taskTypeLabel(scope.row.task_type) }}</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="base_model" label="模型" width="130" />
                    <el-table-column label="参数" width="170">
                      <template slot-scope="scope">
                        e{{ scope.row.epochs }} b{{ scope.row.batch_size }} img{{ scope.row.image_size }}
                      </template>
                    </el-table-column>
                    <el-table-column label="进度" width="130">
                      <template slot-scope="scope">
                        <el-progress :percentage="Math.round(scope.row.progress || 0)" :status="progressStatus(scope.row.status)" :stroke-width="14" :text-inside="true" />
                      </template>
                    </el-table-column>
                    <el-table-column label="状态" width="80">
                      <template slot-scope="scope">
                        <el-tag :type="trainStatusType(scope.row.status)" size="mini">{{ trainStatusLabel(scope.row.status) }}</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="模型产出" min-width="140">
                      <template slot-scope="scope">
                        <div v-if="scope.row.output_model_path" style="font-size: 12px; word-break: break-all;">
                          <div>{{ scope.row.output_model_path.split(/[/\\]/).pop() }}</div>
                          <el-tag v-if="scope.row.export_format" size="mini" type="success" style="margin-top: 2px;">
                            已导出 {{ scope.row.export_format.toUpperCase() }}
                          </el-tag>
                        </div>
                        <span v-else style="color: #ccc;">-</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" min-width="340" fixed="right">
                      <template slot-scope="scope"><div style="white-space: nowrap;">
                        <el-button v-if="scope.row.status === 'pending' || scope.row.status === 'failed' || scope.row.status === 'cancelled'"
                          size="mini" type="primary" @click="handleStartTraining(scope.row)">启动</el-button>
                        <el-button v-if="scope.row.status === 'interrupted'"
                          size="mini" type="success" @click="handleStartTraining(scope.row)">恢复</el-button>
                        <el-button v-if="scope.row.status === 'running'"
                          size="mini" type="warning" @click="handleInterruptTraining(scope.row)">中断</el-button>
                        <el-button v-if="scope.row.status === 'running'"
                          size="mini" type="danger" @click="handleCancelTraining(scope.row)">取消</el-button>
                        <el-button v-if="scope.row.status === 'completed'"
                          size="mini" type="success" :loading="exportingTaskIds.includes(scope.row.id)" @click="showExportDialog(scope.row)">{{ exportingTaskIds.includes(scope.row.id) ? '导出中' : '导出' }}</el-button>
                        <el-button v-if="scope.row.export_model_path || scope.row.output_model_path"
                          size="mini" type="info" @click="handleDownloadModel(scope.row)">下载</el-button>
                        <el-button v-if="scope.row.status === 'completed'"
                          size="mini" @click="handleStartTraining(scope.row)">重训</el-button>
                        <el-button size="mini" @click="showTrainingDetail(scope.row)">详情</el-button>
                        <el-button v-if="scope.row.status !== 'running'"
                          size="mini" type="danger" @click="handleDeleteTraining(scope.row)">删除</el-button>
                      </div></template>
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
    <el-dialog title="创建训练任务" :visible.sync="createTrainingDialogVisible" width="540px" :close-on-click-modal="false" append-to-body>
      <el-form :model="trainingForm" ref="trainingForm" label-width="90px" :rules="trainingRules" size="small">
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="trainingForm.name" placeholder="如：安全帽训练v1" maxlength="200" />
        </el-form-item>
        <el-form-item label="数据集">
          <el-input :value="selectedDataset ? selectedDataset.name + ' (ID:' + selectedDataset.id + ')' : ''" disabled />
        </el-form-item>
        <el-form-item label="任务类型">
          <el-radio-group v-model="trainingForm.task_type" size="small" @change="onTaskTypeChange">
            <el-radio-button label="detect">目标检测</el-radio-button>
            <el-radio-button label="segment">实例分割</el-radio-button>
            <el-radio-button label="classify">图像分类</el-radio-button>
            <el-radio-button label="pose">姿态估计</el-radio-button>
            <el-radio-button label="obb">旋转检测</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="基础模型">
          <el-select v-model="trainingForm.base_model" style="width: 100%;" placeholder="选择预训练模型">
            <el-option-group v-for="(models, family) in filteredModels" :key="family" :label="family">
              <el-option v-for="m in models" :key="m.value" :label="m.label" :value="m.value">
                <span style="float: left;">{{ m.label }}</span>
                <span style="float: right; color: #909399; font-size: 12px;">{{ m.params }} · mAP {{ m.map }}</span>
              </el-option>
            </el-option-group>
          </el-select>
        </el-form-item>
        <el-form-item label="训练轮数">
          <el-input-number v-model="trainingForm.epochs" :min="1" :max="1000" style="width: 160px;" />
        </el-form-item>
        <el-form-item label="批量大小">
          <el-input-number v-model="trainingForm.batch_size" :min="1" :max="128" style="width: 160px;" />
          <span class="form-tip" style="margin-left: 8px;">显存不足时调小此值</span>
        </el-form-item>
        <el-form-item label="图片尺寸">
          <el-input-number v-model="trainingForm.image_size" :min="320" :max="1280" :step="32" style="width: 160px;" />
        </el-form-item>
      </el-form>
      <div v-if="gpuInfo" class="gpu-info-bar">
        <i :class="gpuInfo.cuda_available ? 'el-icon-monitor' : 'el-icon-warning-outline'" :style="{ color: gpuInfo.cuda_available ? '#67c23a' : '#e6a23c' }"></i>
        <span v-if="gpuInfo.cuda_available && gpuInfo.devices && gpuInfo.devices.length">
          GPU: {{ gpuInfo.devices[0].name }} ({{ gpuInfo.devices[0].memory_total_mb }} MB)
        </span>
        <span v-else style="color: #e6a23c;">{{ gpuInfo.message || '将使用 CPU 训练（较慢）' }}</span>
      </div>
      <div slot="footer">
        <el-button size="small" @click="createTrainingDialogVisible = false">取消</el-button>
        <el-button type="primary" size="small" :loading="creatingTraining" @click="confirmCreateTraining">创建</el-button>
      </div>
    </el-dialog>

    <!-- ===== 模型导出弹窗 ===== -->
    <el-dialog title="导出模型" :visible.sync="exportDialogVisible" width="460px" :close-on-click-modal="false" append-to-body>
      <el-form label-width="90px" size="small">
        <el-form-item label="导出格式">
          <el-select v-model="exportForm.format" style="width: 100%;" placeholder="选择部署格式">
            <el-option v-for="f in exportFormats" :key="f.value" :label="f.label" :value="f.value">
              <span style="float: left;">{{ f.label }}</span>
              <span style="float: right; color: #909399; font-size: 12px;">{{ f.desc }}</span>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div class="export-format-tip">
        <p v-if="exportForm.format === 'onnx'">ONNX：通用格式，支持 CPU/GPU，跨平台部署首选</p>
        <p v-else-if="exportForm.format === 'engine'">TensorRT：NVIDIA GPU 专属，推理速度最快</p>
        <p v-else-if="exportForm.format === 'openvino'">OpenVINO：Intel CPU/GPU/VPU 优化</p>
        <p v-else-if="exportForm.format === 'torchscript'">TorchScript：PyTorch 原生格式</p>
        <p v-else-if="exportForm.format === 'ncnn'">NCNN：腾讯开源，适合安卓/嵌入式/ARM 设备</p>
        <p v-else-if="exportForm.format === 'coreml'">CoreML：Apple 设备专用 (iPhone/iPad/Mac)</p>
        <p v-else-if="exportForm.format === 'tflite'">TFLite：Google 移动端框架，适合安卓/IoT</p>
        <p v-else-if="exportForm.format === 'paddle'">PaddlePaddle：百度飞桨框架格式</p>
      </div>
      <div slot="footer">
        <el-button size="small" @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" size="small" :disabled="exportingTaskIds.includes(exportingTaskId)" @click="confirmExportModel">开始导出</el-button>
      </div>
    </el-dialog>

    <!-- ===== 训练详情弹窗 ===== -->
    <el-dialog title="训练任务详情" :visible.sync="trainingDetailVisible" width="720px" append-to-body @open="onDetailOpen" @close="onDetailClose">
      <div v-if="trainingDetailTask">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="任务ID">{{ trainingDetailTask.id }}</el-descriptions-item>
          <el-descriptions-item label="名称">{{ trainingDetailTask.name }}</el-descriptions-item>
          <el-descriptions-item label="任务类型">{{ taskTypeLabel(trainingDetailTask.task_type) }}</el-descriptions-item>
          <el-descriptions-item label="基础模型">{{ trainingDetailTask.base_model }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="trainStatusType(trainingDetailTask.status)" size="small">{{ trainStatusLabel(trainingDetailTask.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="进度">{{ Math.round(trainingDetailTask.progress || 0) }}%</el-descriptions-item>
          <el-descriptions-item label="训练参数" :span="2">
            epochs={{ trainingDetailTask.epochs }} &nbsp; batch={{ trainingDetailTask.batch_size }} &nbsp; imgsz={{ trainingDetailTask.image_size }}
          </el-descriptions-item>
          <el-descriptions-item label="模型文件" :span="2">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="word-break: break-all;">{{ trainingDetailTask.output_model_path || '-' }}</span>
              <el-button v-if="trainingDetailTask.output_model_path" size="mini" type="primary" icon="el-icon-download"
                @click="handleDownloadModel(trainingDetailTask, 'best')">下载</el-button>
            </div>
          </el-descriptions-item>
          <el-descriptions-item v-if="trainingDetailTask.export_format" label="已导出格式">
            <el-tag type="success" size="small">{{ trainingDetailTask.export_format.toUpperCase() }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="trainingDetailTask.export_model_path" label="导出模型" :span="2">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 12px; word-break: break-all;">{{ trainingDetailTask.export_model_path }}</span>
              <el-button size="mini" type="success" icon="el-icon-download"
                @click="handleDownloadModel(trainingDetailTask, 'export')">下载</el-button>
            </div>
          </el-descriptions-item>
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
        <!-- 训练日志 -->
        <div style="margin-top: 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <h4 style="margin: 0;">训练日志</h4>
            <div style="display: flex; align-items: center; gap: 8px;">
              <el-button size="mini" icon="el-icon-data-analysis" @click="openTensorBoard">TensorBoard</el-button>
              <span v-if="trainingDetailTask.status === 'running'" style="color: #67c23a; font-size: 12px;">
                <i class="el-icon-loading"></i> 实时刷新中
              </span>
              <el-button v-else size="mini" icon="el-icon-refresh" @click="loadTrainingLog">刷新</el-button>
            </div>
          </div>
          <pre ref="logBox" class="training-log-box">{{ trainingLog || '暂无日志' }}</pre>
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
      trainingForm: { name: '', task_type: 'detect', base_model: 'yolo26n.pt', epochs: 100, batch_size: 16, image_size: 640 },
      trainingRules: {
        name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
      },

      // 模型 & 导出 & GPU & TensorBoard
      supportedModels: {},
      exportFormats: [],
      gpuInfo: null,
      tbStatus: { running: false, url: null },

      // 训练详情
      trainingDetailVisible: false,
      trainingDetailTask: null,
      trainingLog: '',
      logPollTimer: null,

      // 导出
      exportingTaskId: null,
      exportDialogVisible: false,
      exportForm: { format: 'onnx' },
      exportPollTimer: null,
      exportingTaskIds: [],

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
    filteredModels() {
      const models = this.supportedModels[this.trainingForm.task_type] || [];
      const grouped = {};
      models.forEach(m => {
        if (!grouped[m.family]) grouped[m.family] = [];
        grouped[m.family].push(m);
      });
      return grouped;
    },
  },
  mounted() {
    this.checkLabelStudio();
    this.loadDatasets();
    this.loadAllTrainingTasks();
    this.loadSupportedModels();
    this.loadExportFormats();
    this.loadGpuInfo();
    this.loadTbStatus();
    this.pollTimer = setInterval(() => {
      if (this.allTrainingTasks.some(t => t.status === 'running')) {
        this.silentLoadTrainingTasks();
      }
    }, 5000);
  },
  beforeDestroy() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.logPollTimer) clearInterval(this.logPollTimer);
    if (this.exportPollTimer) clearInterval(this.exportPollTimer);
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
      if (!this.selectedDataset || !this.selectedDataset.ls_project_id) return;
      const projectPath = `/projects/${this.selectedDataset.ls_project_id}/`;
      const lsBase = this.lsUrl || this.selectedDataset.ls_project_url.replace(/\/projects\/\d+\/?$/, '');
      window.open(`${lsBase}${projectPath}`, '_blank');
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
        const parts = [`${d.labeled_images}/${d.total_images} 张已标注`];
        if (d.synced_labels) parts.push(`${d.synced_labels} 个标注框`);
        if (d.new_images_from_ls) parts.push(`新发现 ${d.new_images_from_ls} 张图片`);
        this.syncResult = `同步完成：${parts.join('，')}`;
        await this.loadDatasets();
        await this.loadImages();
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
        await this.loadDatasets();
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
      const isResume = row.status === 'interrupted';
      const title = isResume ? '确认恢复训练' : '确认启动';
      const msg = isResume
        ? `确定从断点恢复训练任务「${row.name}」？将从上次中断处继续。`
        : `确定启动训练任务「${row.name}」？`;
      this.$confirm(msg, title, { type: 'info' })
        .then(async () => {
          try {
            await mlPipelineAPI.startTrainingTask(row.id);
            this.$message.success(isResume ? '训练已恢复' : '训练已启动');
            this.loadAllTrainingTasks();
          } catch (e) {
            this.$message.error('启动失败: ' + ((e.response && e.response.data && e.response.data.detail) || e.message));
          }
        }).catch(() => {});
    },
    handleInterruptTraining(row) {
      this.$confirm('中断后可从断点恢复训练，确定中断？', '中断训练', { type: 'warning' })
        .then(async () => {
          try {
            await mlPipelineAPI.interruptTrainingTask(row.id);
            this.$message.success('已中断，可稍后恢复训练');
            this.loadAllTrainingTasks();
          } catch (e) {
            this.$message.error('中断失败: ' + ((e.response && e.response.data && e.response.data.detail) || e.message));
          }
        }).catch(() => {});
    },
    handleCancelTraining(row) {
      this.$confirm('取消后需从头重新训练，确定取消？', '取消训练', { type: 'warning' })
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
      this.trainingLog = '';
      this.trainingDetailVisible = true;
    },
    async loadTrainingLog() {
      if (!this.trainingDetailTask) return;
      try {
        const res = await mlPipelineAPI.getTrainingTaskLog(this.trainingDetailTask.id);
        this.trainingLog = (res.data.data && res.data.data.log) || '';
        this.$nextTick(() => {
          const el = this.$refs.logBox;
          if (el) el.scrollTop = el.scrollHeight;
        });
      } catch (_) { /* ignore */ }
    },
    async refreshDetailTask() {
      if (!this.trainingDetailTask) return;
      try {
        const res = await mlPipelineAPI.getTrainingTask(this.trainingDetailTask.id);
        if (res.data.data) this.trainingDetailTask = res.data.data;
      } catch (_) { /* ignore */ }
    },
    onDetailOpen() {
      this.loadTrainingLog();
      this.logPollTimer = setInterval(async () => {
        if (!this.trainingDetailTask) return;
        await this.refreshDetailTask();
        await this.loadTrainingLog();
        if (this.trainingDetailTask.status !== 'running') {
          // 停止了就最后拉一次，不再轮询
          clearInterval(this.logPollTimer);
          this.logPollTimer = null;
        }
      }, 3000);
    },
    onDetailClose() {
      if (this.logPollTimer) {
        clearInterval(this.logPollTimer);
        this.logPollTimer = null;
      }
    },
    progressStatus(status) {
      if (status === 'completed') return 'success';
      if (status === 'failed' || status === 'interrupted') return 'exception';
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
        await this.loadDatasets();
        await this.loadImages();
      } catch (e) {
        this.$message.error('上传失败: ' + ((e.response && e.response.data && e.response.data.detail) || e.message));
      } finally {
        this.addingImages = false;
      }
    },

    // ---- 模型 & GPU 信息 ----
    async loadSupportedModels() {
      try {
        const res = await mlPipelineAPI.getSupportedModels();
        this.supportedModels = res.data.data || {};
      } catch (_) { /* ignore */ }
    },
    async loadExportFormats() {
      try {
        const res = await mlPipelineAPI.getExportFormats();
        this.exportFormats = res.data.data || [];
      } catch (_) { /* ignore */ }
    },
    async loadGpuInfo() {
      try {
        const res = await mlPipelineAPI.getGpuInfo();
        this.gpuInfo = res.data.data || null;
      } catch (_) { /* ignore */ }
    },
    async loadTbStatus() {
      try {
        const res = await mlPipelineAPI.getTensorBoardStatus();
        this.tbStatus = res.data.data || { running: false };
      } catch (_) { /* ignore */ }
    },
    getTbUrl() {
      const port = (this.tbStatus && this.tbStatus.port) || 6006;
      return `http://${window.location.hostname}:${port}`;
    },
    async openTensorBoard() {
      if (this.tbStatus.running) {
        window.open(this.getTbUrl(), '_blank');
        return;
      }
      const loading = this.$loading({ text: '正在启动 TensorBoard...', background: 'rgba(0,0,0,0.5)' });
      try {
        const res = await mlPipelineAPI.startTensorBoard();
        const data = res.data.data;
        this.tbStatus = data;
        if (data.running) {
          this.$message.success('TensorBoard 已启动');
          setTimeout(() => window.open(this.getTbUrl(), '_blank'), 1500);
        } else {
          this.$message.error(data.message || '启动失败');
        }
      } catch (e) {
        this.$message.error('启动失败');
      } finally {
        loading.close();
      }
    },
    async toggleTensorBoard() {
      if (this.tbStatus.running) {
        await mlPipelineAPI.stopTensorBoard();
        this.tbStatus = { running: false, url: null };
        this.$message.success('TensorBoard 已关闭');
      } else {
        await this.openTensorBoard();
      }
    },
    onTaskTypeChange() {
      const models = this.supportedModels[this.trainingForm.task_type] || [];
      if (models.length) this.trainingForm.base_model = models[0].value;
    },

    // ---- 创建训练任务 ----
    showCreateTrainingDialog() {
      this.trainingForm = { name: '', task_type: 'detect', base_model: 'yolo26n.pt', epochs: 100, batch_size: 16, image_size: 640 };
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

    // ---- 模型导出 ----
    showExportDialog(row) {
      this.exportingTaskId = row.id;
      this.exportForm = { format: 'onnx' };
      this.exportDialogVisible = true;
    },
    async confirmExportModel() {
      if (!this.exportingTaskId) return;
      try {
        await mlPipelineAPI.exportModel(this.exportingTaskId, this.exportForm.format);
        this.$message.info(`${this.exportForm.format.toUpperCase()} 导出已提交，完成后会通知您`);
        this.exportDialogVisible = false;
        if (!this.exportingTaskIds.includes(this.exportingTaskId)) this.exportingTaskIds.push(this.exportingTaskId);
        this.startExportPolling();
      } catch (e) {
        this.$message.error('导出失败: ' + ((e.response && e.response.data && e.response.data.detail) || e.message));
      }
    },
    startExportPolling() {
      if (this.exportPollTimer) return;
      this.exportPollTimer = setInterval(() => this.checkExportStatus(), 3000);
    },
    async checkExportStatus() {
      if (this.exportingTaskIds.length === 0) {
        clearInterval(this.exportPollTimer);
        this.exportPollTimer = null;
        return;
      }
      for (const taskId of this.exportingTaskIds.slice()) {
        try {
          const res = await mlPipelineAPI.getExportStatus(taskId);
          const d = res.data.data;
          if (d.status === 'done') {
            this.$notify({ title: '导出完成', message: d.message, type: 'success', duration: 5000 });
            this.exportingTaskIds = this.exportingTaskIds.filter(id => id !== taskId);
            this.loadAllTrainingTasks();
          } else if (d.status === 'error') {
            this.$notify({ title: '导出失败', message: d.message, type: 'error', duration: 8000 });
            this.exportingTaskIds = this.exportingTaskIds.filter(id => id !== taskId);
          }
        } catch (_) { /* ignore */ }
      }
      if (this.exportingTaskIds.length === 0) {
        clearInterval(this.exportPollTimer);
        this.exportPollTimer = null;
      }
    },

    // ---- 模型下载 ----
    handleDownloadModel(row, type) {
      const downloadType = type || (row.export_model_path ? 'export' : 'best');
      const url = mlPipelineAPI.getModelDownloadUrl(row.id, downloadType);
      window.open(url, '_blank');
    },

    // ---- 操作下拉菜单 ----
    handleTaskCommand(cmd, row) {
      if (cmd === 'detail') this.showTrainingDetail(row);
      else if (cmd === 'restart') this.handleStartTraining(row);
      else if (cmd === 'cancel') this.handleCancelTraining(row);
      else if (cmd === 'delete') this.handleDeleteTraining(row);
    },

    // ---- 删除训练任务 ----
    handleDeleteTraining(row) {
      this.$confirm(`确定删除训练任务「${row.name}」？模型文件也将被清除。`, '确认删除', { type: 'warning' })
        .then(async () => {
          try {
            await mlPipelineAPI.deleteTrainingTask(row.id);
            this.$message.success('已删除');
            this.loadAllTrainingTasks();
          } catch (e) {
            this.$message.error('删除失败: ' + ((e.response && e.response.data && e.response.data.detail) || e.message));
          }
        }).catch(() => {});
    },

    // ---- 删除数据集 ----
    async handleDeleteDataset() {
      try {
        await mlPipelineAPI.deleteDataset(this.selectedDataset.id);
        this.$message.success('删除成功');
        this.selectedDataset = null;
        this.images = [];
        await this.loadDatasets();
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
      if (this.selectedDataset) await this.loadImages();
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
      return { pending: 'info', running: 'warning', completed: 'success', failed: 'danger', cancelled: 'info', interrupted: 'warning' }[status] || 'info';
    },
    trainStatusLabel(status) {
      return { pending: '待启动', running: '训练中', completed: '已完成', failed: '失败', cancelled: '已取消', interrupted: '已中断' }[status] || status;
    },
    taskTypeLabel(type) {
      return { detect: '目标检测', segment: '实例分割', classify: '图像分类', pose: '姿态估计', obb: '旋转检测' }[type] || type;
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
  padding: 12px;
  border-radius: 8px;
  margin: 8px 0;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid rgba(59, 130, 246, 0.2);
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dataset-card:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 197, 253, 0.03) 100%);
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.dataset-card.active {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #1A6DFF;
  box-shadow: 0 4px 12px rgba(26, 109, 255, 0.2);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}

.card-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e40af;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

.card-id {
  font-size: 10px;
  font-family: 'Courier New', Courier, monospace;
  color: #1A6DFF;
  background: rgba(26, 109, 255, 0.1);
  border: 1px solid rgba(26, 109, 255, 0.3);
  border-radius: 4px;
  padding: 1px 5px;
  white-space: nowrap;
}

.card-info {
  font-size: 12px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  color: #6b7280;
}

.info-value {
  color: #333;
}

.dataset-card.active .card-name {
  color: #1e40af;
}

.dataset-card.active .info-label,
.dataset-card.active .info-value {
  color: #4b5563;
}

.dataset-card.active .card-id {
  background: rgba(26, 109, 255, 0.15);
  border-color: rgba(26, 109, 255, 0.4);
}

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

/* ---- GPU 信息栏 ---- */
.gpu-info-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  font-size: 13px;
  color: #606266;
  background: #f4f4f5;
  border-radius: 4px;
  margin: 0 20px;
}

/* ---- 导出格式提示 ---- */
.export-format-tip {
  padding: 8px 16px;
  margin-top: 4px;
}
.export-format-tip p {
  margin: 0;
  font-size: 13px;
  color: #909399;
  line-height: 1.6;
}

/* ---- 训练日志 ---- */
.training-log-box {
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  padding: 12px 14px;
  border-radius: 6px;
  max-height: 320px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

/* ---- 其他 ---- */
.form-tip { font-size: 12px; color: #909399; line-height: 1.4; margin-top: 4px; }

/* 修复危险按钮文字颜色 */
.el-button--danger {
  color: #fff !important;
}

/* 主题色按钮及标签 */
.el-button--primary {
  background-color: #1A6DFF !important;
  border-color: #1A6DFF !important;
}

.created-tag {
  color: #1A6DFF !important;
  border-color: rgba(26, 109, 255, 0.3) !important;
  background-color: rgba(26, 109, 255, 0.1) !important;
}

/* 当卡片激活时，内部的已创建标签改为白色 */
.dataset-card.active .created-tag {
  color: #fff !important;
  background-color: rgba(255, 255, 255, 0.2) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
}
</style>
