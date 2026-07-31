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
              <span slot="label"><i class="el-icon-picture-outline"></i> 图片管理 ({{ images.length || selectedDataset.image_count || 0 }})</span>
              <div class="tab-toolbar">
                <el-button type="primary" size="small" icon="el-icon-plus" @click="showAddImagesDialog">添加图片</el-button>
                <el-button size="small" icon="el-icon-refresh" @click="loadImages" :loading="imagesLoading">刷新</el-button>
                <el-checkbox
                  v-if="images.length"
                  :indeterminate="selectedImageIds.length > 0 && selectedImageIds.length < images.length"
                  :value="images.length > 0 && selectedImageIds.length === images.length"
                  @change="toggleSelectAllImages"
                  style="margin-left: 8px;">
                  全选
                </el-checkbox>
                <el-button
                  size="small"
                  icon="el-icon-download"
                  :disabled="!images.length"
                  :loading="downloadingImages"
                  @click="handleDownloadImages">
                  {{ selectedImageIds.length ? `下载选中 (${selectedImageIds.length})` : '下载全部原图' }}
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  icon="el-icon-delete"
                  plain
                  :disabled="!selectedImageIds.length"
                  :loading="deletingImages"
                  @click="handleBatchDeleteImages">
                  删除选中 ({{ selectedImageIds.length }})
                </el-button>
              </div>
              <div class="image-grid" v-loading="imagesLoading">
                <div v-if="!images.length" class="empty-tip">暂无图片，点击「添加图片」开始</div>
                <div
                  v-for="img in images"
                  :key="img.id"
                  :class="['image-card', { selected: selectedImageIds.includes(img.id) }]">
                  <el-checkbox
                    class="image-check"
                    :value="selectedImageIds.includes(img.id)"
                    @change="(checked) => toggleImageSelect(img.id, checked)"
                    @click.native.stop>
                  </el-checkbox>
                  <el-image
                    :src="imageProxyUrl(img.id)"
                    :preview-src-list="imagePreviewList"
                    fit="cover"
                    class="image-thumb">
                    <div slot="error" class="image-error">
                      <i class="el-icon-picture-outline"></i>
                    </div>
                  </el-image>
                  <span v-if="img.source_type && img.source_type !== 'upload' && img.source_type !== 'label_studio'" class="image-source">
                    {{ sourceTypeLabel(img.source_type) }}
                  </span>
                  <button
                    class="image-delete-btn"
                    title="删除"
                    :disabled="deletingImages"
                    @click.stop="handleDeleteImage(img)">
                    <i class="el-icon-delete"></i>
                  </button>
                  <span :class="['image-badge', img.is_labeled ? 'labeled' : 'unlabeled']">
                    {{ img.is_labeled ? '已标注' : '未标注' }}
                  </span>
                </div>
              </div>
            </el-tab-pane>

            <!-- ====== Tab: 自动采集 ====== -->
            <el-tab-pane name="collection">
              <span slot="label"><i class="el-icon-video-camera"></i> 自动采集</span>
              <div class="collection-panel">
                <p class="anno-hint">从摄像头按条件自动采图写入本数据集。可选「画面变化 / 小模型检测到 / 大模型判定 / 技能编排」；后三种可再叠加「需画面变化」前置。</p>
                <div class="tab-toolbar">
                  <el-button type="primary" size="small" icon="el-icon-plus" @click="showCreateCollectionDialog">新建采集</el-button>
                  <el-button size="small" icon="el-icon-refresh" @click="loadCollectionTasks" :loading="collectionLoading">刷新</el-button>
                </div>
                <div v-loading="collectionLoading">
                  <div v-if="!collectionTasks.length" class="empty-tip">暂无采集任务，点击「新建采集」开始</div>
                  <div v-for="task in collectionTasks" :key="task.id" class="collection-card">
                    <div class="collection-card-head">
                      <div class="collection-card-title">
                        <span class="card-name">{{ task.name }}</span>
                        <el-tag :type="collectionStatusType(task.status)" size="mini">{{ collectionStatusLabel(task.status) }}</el-tag>
                        <el-tag size="mini" effect="plain">{{ collectionTaskTemplateLabel(task) }}</el-tag>
                      </div>
                      <div class="collection-card-actions">
                        <el-button size="mini" icon="el-icon-view" @click="showCollectionDetail(task)">详情</el-button>
                        <el-button
                          size="mini"
                          icon="el-icon-edit"
                          :disabled="task.status === 'running'"
                          @click="showEditCollectionDialog(task)">
                          编辑
                        </el-button>
                        <el-button
                          v-if="task.status !== 'running'"
                          type="success"
                          size="mini"
                          icon="el-icon-video-play"
                          :loading="collectionActionId === task.id"
                          @click="handleStartCollection(task)">
                          启动
                        </el-button>
                        <el-button
                          v-else
                          type="warning"
                          size="mini"
                          icon="el-icon-video-pause"
                          :loading="collectionActionId === task.id"
                          @click="handleStopCollection(task)">
                          停止
                        </el-button>
                        <el-button
                          type="danger"
                          size="mini"
                          icon="el-icon-delete"
                          plain
                          :disabled="task.status === 'running'"
                          @click="handleDeleteCollection(task)">
                          删除
                        </el-button>
                      </div>
                    </div>
                    <div class="collection-meta">
                      <span>摄像头：{{ (task.camera_names && task.camera_names.length) ? task.camera_names.join('、') : (task.camera_ids || []).join('、') }}</span>
                      <span>已采 {{ task.collected_count || 0 }} 张</span>
                      <span>冷却 {{ task.cooldown_sec }}s · 每小时≤{{ task.max_per_hour }} · 轮询 {{ task.poll_interval_sec }}s</span>
                    </div>
                    <div v-if="collectionTaskParamsSummary(task)" class="collection-params">
                      触发参数：{{ collectionTaskParamsSummary(task) }}
                    </div>
                    <div v-if="task.last_trigger_reason" class="collection-reason">最近命中：{{ task.last_trigger_reason }}</div>
                    <div v-if="task.last_error" class="collection-error">{{ task.last_error }}</div>
                    <div v-if="task.recentImages && task.recentImages.length" class="collection-thumbs">
                      <el-image
                        v-for="img in task.recentImages"
                        :key="img.id"
                        :src="imageProxyUrl(img.id)"
                        :preview-src-list="task.recentImages.map(i => imageProxyUrl(i.id))"
                        fit="cover"
                        class="collection-thumb">
                      </el-image>
                      <div
                        v-if="(task.collected_count || 0) > task.recentImages.length"
                        class="collection-thumbs-more"
                        @click="goImagesTab">
                        还有 {{ (task.collected_count || 0) - task.recentImages.length }} 张，去图片管理查看
                      </div>
                    </div>
                    <div v-else-if="task.collected_count > 0" class="collection-thumbs-more" @click="goImagesTab">
                      去图片管理查看全部 {{ task.collected_count }} 张
                    </div>
                  </div>
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

    <!-- ===== 新建采集任务抽屉（分步） ===== -->
    <el-drawer
      :visible.sync="createCollectionVisible"
      size="880px"
      :wrapper-closable="false"
      :show-close="true"
      append-to-body
      custom-class="collection-create-drawer"
      @closed="onCollectionDrawerClosed">
      <div slot="title" class="coll-drawer-title">
        <span>{{ editingCollectionId ? '编辑自动采集' : '新建自动采集' }}</span>
        <span class="coll-drawer-sub" v-if="selectedDataset">写入数据集：{{ selectedDataset.name }}</span>
      </div>

      <div class="coll-drawer-body">
        <div class="coll-step-bar">
          <div
            v-for="(s, i) in collectionStepLabels"
            :key="i"
            class="coll-step-item"
            :class="{ active: collectionStep === i, done: collectionStep > i }"
            @click="goCollectionStep(i)">
            <span class="coll-step-num">{{ collectionStep > i ? '✓' : i + 1 }}</span>
            <span class="coll-step-label">{{ s }}</span>
          </div>
        </div>

        <el-form :model="collectionForm" ref="collectionForm" label-width="110px" size="small" :rules="collectionRules">
          <!-- 步骤1：触发条件 -->
          <div v-show="collectionStep === 0" class="coll-step-pane">
            <div class="coll-form-section">
              <div class="coll-section-head"><i class="el-icon-edit-outline"></i> 基本信息</div>
              <el-form-item label="任务名称" prop="name">
                <el-input v-model="collectionForm.name" placeholder="如：东门-未戴帽采集" maxlength="200" style="max-width: 480px;" />
              </el-form-item>
            </div>

            <div class="coll-form-section">
              <div class="coll-section-head"><i class="el-icon-magic-stick"></i> 触发条件</div>
              <el-form-item label="触发方式" prop="template_id" label-width="90px">
                <div class="template-card-group">
                  <div
                    v-for="t in collectionTemplates"
                    :key="t.id"
                    class="template-card"
                    :class="{ active: collectionForm.template_id === t.id }"
                    @click="selectCollectionTemplate(t.id)">
                    <div class="template-card__name">
                      <i :class="t.icon || 'el-icon-s-opportunity'"></i> {{ t.name }}
                    </div>
                    <div class="template-card__desc">{{ t.description }}</div>
                  </div>
                </div>
              </el-form-item>

              <template v-if="collectionForm.template_id === 'frame_change'">
                <el-form-item label="灵敏度阈值">
                  <el-slider v-model="collectionForm.template_params.sensitivity" :min="0.01" :max="0.5" :step="0.01" show-input style="max-width: 520px;" />
                </el-form-item>
                <el-form-item label="变化区域占比">
                  <el-slider v-model="collectionForm.template_params.min_changed_ratio" :min="0.001" :max="0.3" :step="0.001" show-input style="max-width: 520px;" />
                </el-form-item>
              </template>

              <template v-if="collectionForm.template_id === 'small_model'">
                <el-form-item label="检测模型" required>
                  <el-select
                    v-model="collectionForm.template_params.model_name"
                    filterable
                    style="width: 100%; max-width: 480px;"
                    placeholder="选择已部署检测模型"
                    :loading="detectModelLoading"
                    @change="onCollectModelChange">
                    <el-option v-for="m in detectModelOptions" :key="m.name" :label="m.name" :value="m.name">
                      <span>{{ m.name }}</span>
                      <span style="float:right;color:#909399;font-size:12px;">{{ m.status || '' }}</span>
                    </el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="目标类别" required>
                  <el-select
                    v-model="collectionForm.template_params.target_classes"
                    multiple
                    filterable
                    style="width: 100%; max-width: 480px;"
                    placeholder="先选模型后加载类别"
                    :loading="modelClassLoading">
                    <el-option v-for="c in modelClassOptions" :key="c" :label="c" :value="c" />
                  </el-select>
                </el-form-item>
                <el-form-item label="置信度">
                  <el-slider v-model="collectionForm.template_params.confidence_threshold" :min="0.1" :max="0.99" :step="0.05" show-input style="max-width: 520px;" />
                </el-form-item>
                <el-form-item label="需画面变化">
                  <el-switch v-model="collectionForm.template_params.require_frame_change" />
                  <span class="form-tip" style="margin-left: 8px;">开启后静止画面不跑检测</span>
                </el-form-item>
                <template v-if="collectionForm.template_params.require_frame_change">
                  <el-form-item label="灵敏度阈值">
                    <el-slider v-model="collectionForm.template_params.sensitivity" :min="0.01" :max="0.5" :step="0.01" show-input style="max-width: 520px;" />
                  </el-form-item>
                  <el-form-item label="变化区域占比">
                    <el-slider v-model="collectionForm.template_params.min_changed_ratio" :min="0.001" :max="0.3" :step="0.001" show-input style="max-width: 520px;" />
                  </el-form-item>
                </template>
              </template>

              <template v-if="collectionForm.template_id === 'vlm'">
                <el-form-item label="判定提示词" required>
                  <el-input
                    v-model="collectionForm.template_params.prompt"
                    type="textarea"
                    :rows="3"
                    style="max-width: 520px;"
                    placeholder="要求模型回答 YES/NO" />
                </el-form-item>
                <el-form-item label="肯定关键词">
                  <el-select
                    v-model="collectionForm.template_params.positive_keywords"
                    multiple
                    filterable
                    allow-create
                    default-first-option
                    style="width: 100%; max-width: 480px;"
                    placeholder="回复包含这些词视为命中">
                    <el-option v-for="k in ['YES', '是', '存在', '有']" :key="k" :label="k" :value="k" />
                  </el-select>
                </el-form-item>
                <el-form-item label="需画面变化">
                  <el-switch v-model="collectionForm.template_params.require_frame_change" />
                  <span class="form-tip" style="margin-left: 8px;">建议开启，画面无变化时不调用大模型</span>
                </el-form-item>
                <template v-if="collectionForm.template_params.require_frame_change">
                  <el-form-item label="灵敏度阈值">
                    <el-slider v-model="collectionForm.template_params.sensitivity" :min="0.01" :max="0.5" :step="0.01" show-input style="max-width: 520px;" />
                  </el-form-item>
                  <el-form-item label="变化区域占比">
                    <el-slider v-model="collectionForm.template_params.min_changed_ratio" :min="0.001" :max="0.3" :step="0.001" show-input style="max-width: 520px;" />
                  </el-form-item>
                </template>
              </template>

              <template v-if="collectionForm.template_id === 'skill_graph'">
                <el-form-item label="技能编排" required>
                  <el-select
                    v-model="collectionForm.template_params.skill_id"
                    filterable
                    style="width: 100%; max-width: 480px;"
                    placeholder="选择已发布的技能编排"
                    :loading="skillGraphLoading"
                    @change="onCollectSkillGraphChange"
                    @visible-change="(v) => v && loadSkillGraphOptions()">
                    <el-option
                      v-for="g in skillGraphOptions"
                      :key="g.skill_id"
                      :label="g.skill_name"
                      :value="g.skill_id">
                      <span>{{ g.skill_name }}</span>
                      <span style="float:right;color:#909399;font-size:12px;">{{ g.skill_id }}</span>
                    </el-option>
                  </el-select>
                  <div class="form-tip">
                    编排结束节点判定为触发时采图；不会走业务预警推送。若只需按检测模型采图，请改用「小模型检测到」。
                    <el-button type="text" size="mini" @click="openSkillGraphEditor">去编排</el-button>
                  </div>
                </el-form-item>
                <el-form-item label="需画面变化">
                  <el-switch v-model="collectionForm.template_params.require_frame_change" />
                  <span class="form-tip" style="margin-left: 8px;">依赖滞留/计时的编排请保持关闭</span>
                </el-form-item>
                <template v-if="collectionForm.template_params.require_frame_change">
                  <el-form-item label="灵敏度阈值">
                    <el-slider v-model="collectionForm.template_params.sensitivity" :min="0.01" :max="0.5" :step="0.01" show-input style="max-width: 520px;" />
                  </el-form-item>
                  <el-form-item label="变化区域占比">
                    <el-slider v-model="collectionForm.template_params.min_changed_ratio" :min="0.001" :max="0.3" :step="0.001" show-input style="max-width: 520px;" />
                  </el-form-item>
                </template>
              </template>
            </div>
          </div>

          <!-- 步骤2：点位选择 -->
          <div v-show="collectionStep === 1" class="coll-step-pane">
            <div class="coll-form-section">
              <div class="coll-section-head"><i class="el-icon-location-outline"></i> 点位选择</div>
              <div class="point-tip">
                <i class="el-icon-info"></i>
                从组织树选择通道，与技能运行计划相同；可多选
              </div>
              <el-form-item prop="camera_ids" label-width="0" class="collection-point-item">
                <div class="point-selector">
                  <div class="ps-tree">
                    <channel-tree-panel @channel-click="onCollectionChannelClick" />
                    <div class="ps-tree-tip">点击通道节点即可加入已选列表，再次点击可取消</div>
                  </div>
                  <div class="ps-selected">
                    <div class="ps-head">
                      已选点位 ({{ selectedCollectionCameras.length }})
                      <a v-if="selectedCollectionCameras.length" class="clear-link" @click="clearCollectionCameras">清空</a>
                    </div>
                    <div class="ps-list">
                      <div
                        v-for="c in selectedCollectionCameras"
                        :key="c.camera_id"
                        class="ps-item selected-item">
                        <div class="selected-item__main">
                          <span class="selected-item__name">
                            <i class="el-icon-video-camera"></i> {{ c.camera_name }}
                          </span>
                          <span class="selected-item__status">
                            <span class="status-dot" :class="c.online ? 'is-active' : 'is-offline'"></span>
                            {{ c.online ? '在线' : '离线' }}
                          </span>
                        </div>
                        <i class="el-icon-close" @click="removeCollectionCamera(c)"></i>
                      </div>
                      <div v-if="!selectedCollectionCameras.length" class="empty-tip-sm">请从左侧组织树选择点位</div>
                    </div>
                  </div>
                </div>
              </el-form-item>
            </div>
          </div>

          <!-- 步骤3：控量与确认 -->
          <div v-show="collectionStep === 2" class="coll-step-pane">
            <div class="coll-form-section">
              <div class="coll-section-head"><i class="el-icon-setting"></i> 控量设置</div>
              <el-form-item label="冷却(秒)">
                <el-input-number v-model="collectionForm.cooldown_sec" :min="0" :max="600" :step="1" />
                <span class="form-tip" style="margin-left: 8px;">同一点位两次入库最短间隔</span>
              </el-form-item>
              <el-form-item label="每小时上限">
                <el-input-number v-model="collectionForm.max_per_hour" :min="1" :max="5000" :step="10" />
              </el-form-item>
              <el-form-item label="轮询间隔(秒)">
                <el-input-number v-model="collectionForm.poll_interval_sec" :min="1" :max="120" :step="1" />
              </el-form-item>
            </div>
            <div class="coll-form-section">
              <div class="coll-section-head"><i class="el-icon-document-checked"></i> 确认信息</div>
              <el-descriptions :column="1" border size="small" class="coll-summary">
                <el-descriptions-item label="任务名称">{{ collectionForm.name || '-' }}</el-descriptions-item>
                <el-descriptions-item label="触发方式">{{ selectedCollectionTemplate ? selectedCollectionTemplate.name : '-' }}</el-descriptions-item>
                <el-descriptions-item v-if="collectionForm.template_id === 'skill_graph'" label="技能编排">
                  {{ collectionForm.template_params.skill_name || collectionForm.template_params.skill_id || '-' }}
                  · 告警触发时采图
                </el-descriptions-item>
                <el-descriptions-item v-if="collectionForm.template_id === 'small_model'" label="检测模型">
                  {{ collectionForm.template_params.model_name || '-' }}
                  / {{ (collectionForm.template_params.target_classes || []).join('、') || '未选类别' }}
                </el-descriptions-item>
                <el-descriptions-item
                  v-if="['small_model', 'vlm', 'skill_graph'].includes(collectionForm.template_id)"
                  label="画面变化前置">
                  <template v-if="collectionForm.template_params.require_frame_change">
                    已开启 · 灵敏度 {{ collectionForm.template_params.sensitivity }} · 占比 {{ collectionForm.template_params.min_changed_ratio }}
                  </template>
                  <template v-else>未开启</template>
                </el-descriptions-item>
                <el-descriptions-item label="点位">
                  {{ selectedCollectionCameras.length
                    ? selectedCollectionCameras.map(c => c.camera_name).join('、')
                    : '未选择' }}
                </el-descriptions-item>
                <el-descriptions-item label="控量">
                  冷却 {{ collectionForm.cooldown_sec }}s · 每小时≤{{ collectionForm.max_per_hour }} · 轮询 {{ collectionForm.poll_interval_sec }}s
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </div>
        </el-form>
      </div>

      <div class="coll-drawer-footer">
        <el-button @click="createCollectionVisible = false">取消</el-button>
        <el-button v-if="collectionStep > 0" @click="prevCollectionStep">上一步</el-button>
        <el-button v-if="collectionStep < 2" type="primary" @click="nextCollectionStep">下一步</el-button>
        <el-button v-else type="primary" :loading="creatingCollection" @click="confirmCreateCollection">
          {{ editingCollectionId ? '保存修改' : '创建并启动' }}
        </el-button>
      </div>
    </el-drawer>

    <!-- ===== 采集任务详情 ===== -->
    <el-dialog
      title="采集任务详情"
      :visible.sync="collectionDetailVisible"
      width="560px"
      append-to-body>
      <div v-if="collectionDetailTask">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="任务名称">{{ collectionDetailTask.name }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="collectionStatusType(collectionDetailTask.status)" size="mini">
              {{ collectionStatusLabel(collectionDetailTask.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="触发方式">{{ collectionTaskTemplateLabel(collectionDetailTask) }}</el-descriptions-item>
          <el-descriptions-item label="点位">
            {{ (collectionDetailTask.camera_names && collectionDetailTask.camera_names.length)
              ? collectionDetailTask.camera_names.join('、')
              : (collectionDetailTask.camera_ids || []).join('、') || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="控量">
            冷却 {{ collectionDetailTask.cooldown_sec }}s · 每小时≤{{ collectionDetailTask.max_per_hour }} · 轮询 {{ collectionDetailTask.poll_interval_sec }}s
          </el-descriptions-item>
          <el-descriptions-item label="已采集">{{ collectionDetailTask.collected_count || 0 }} 张</el-descriptions-item>
          <template v-if="collectionDetailTask.template_id === 'frame_change'">
            <el-descriptions-item label="灵敏度阈值">{{ collectionDetailParam('sensitivity') }}</el-descriptions-item>
            <el-descriptions-item label="变化区域占比">{{ collectionDetailParam('min_changed_ratio') }}</el-descriptions-item>
          </template>
          <template v-else-if="collectionDetailTask.template_id === 'small_model'">
            <el-descriptions-item label="检测模型">{{ collectionDetailParam('model_name') || '-' }}</el-descriptions-item>
            <el-descriptions-item label="目标类别">
              {{ (collectionDetailParam('target_classes') || []).join('、') || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="置信度">{{ collectionDetailParam('confidence_threshold') }}</el-descriptions-item>
            <el-descriptions-item label="需画面变化">
              {{ collectionDetailParam('require_frame_change') ? '是' : '否' }}
            </el-descriptions-item>
            <template v-if="collectionDetailParam('require_frame_change')">
              <el-descriptions-item label="灵敏度阈值">{{ collectionDetailParam('sensitivity') }}</el-descriptions-item>
              <el-descriptions-item label="变化区域占比">{{ collectionDetailParam('min_changed_ratio') }}</el-descriptions-item>
            </template>
          </template>
          <template v-else-if="collectionDetailTask.template_id === 'vlm'">
            <el-descriptions-item label="判定提示词">
              <div style="white-space: pre-wrap;">{{ collectionDetailParam('prompt') || '-' }}</div>
            </el-descriptions-item>
            <el-descriptions-item label="肯定关键词">
              {{ (collectionDetailParam('positive_keywords') || []).join('、') || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="需画面变化">
              {{ collectionDetailParam('require_frame_change') ? '是' : '否' }}
            </el-descriptions-item>
            <template v-if="collectionDetailParam('require_frame_change')">
              <el-descriptions-item label="灵敏度阈值">{{ collectionDetailParam('sensitivity') }}</el-descriptions-item>
              <el-descriptions-item label="变化区域占比">{{ collectionDetailParam('min_changed_ratio') }}</el-descriptions-item>
            </template>
          </template>
          <template v-else-if="collectionDetailTask.template_id === 'skill_graph'">
            <el-descriptions-item label="技能编排">
              {{ collectionDetailParam('skill_name') || collectionDetailParam('skill_id') || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="触发模式">
              {{ collectionDetailParam('trigger_mode') === 'alert' ? '告警触发时采图' : (collectionDetailParam('trigger_mode') || '-') }}
            </el-descriptions-item>
            <el-descriptions-item label="需画面变化">
              {{ collectionDetailParam('require_frame_change') ? '是' : '否' }}
            </el-descriptions-item>
            <template v-if="collectionDetailParam('require_frame_change')">
              <el-descriptions-item label="灵敏度阈值">{{ collectionDetailParam('sensitivity') }}</el-descriptions-item>
              <el-descriptions-item label="变化区域占比">{{ collectionDetailParam('min_changed_ratio') }}</el-descriptions-item>
            </template>
          </template>
          <el-descriptions-item v-if="collectionDetailTask.last_trigger_reason" label="最近命中">
            {{ collectionDetailTask.last_trigger_reason }}
          </el-descriptions-item>
          <el-descriptions-item v-if="collectionDetailTask.last_error" label="最近错误">
            <span style="color: #f56c6c;">{{ collectionDetailTask.last_error }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ collectionDetailTask.created_at || '-' }}</el-descriptions-item>
          <el-descriptions-item label="最近启动">{{ collectionDetailTask.started_at || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <div slot="footer">
        <el-button
          v-if="collectionDetailTask && collectionDetailTask.status !== 'running'"
          size="small"
          type="primary"
          icon="el-icon-edit"
          @click="editFromCollectionDetail">
          编辑
        </el-button>
        <el-button size="small" @click="collectionDetailVisible = false">关闭</el-button>
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

    <!-- ===== 原图打包下载进度 ===== -->
    <el-dialog
      title="下载原图"
      :visible.sync="downloadProgressVisible"
      width="480px"
      :close-on-click-modal="false"
      :close-on-press-escape="downloadProgressPhase === 'done' || downloadProgressPhase === 'error'"
      :show-close="downloadProgressPhase === 'done' || downloadProgressPhase === 'error'"
      append-to-body
      @closed="onDownloadProgressClosed">
      <div class="dl-progress-body">
        <div class="dl-progress-phase">{{ downloadProgressTitle }}</div>
        <el-progress
          :percentage="downloadProgressPercent"
          :status="downloadProgressStatus"
          :stroke-width="16"
          text-inside>
        </el-progress>
        <div class="dl-progress-meta">{{ downloadProgressMeta }}</div>
        <div v-if="downloadProgressError" class="dl-progress-error">{{ downloadProgressError }}</div>
      </div>
      <div slot="footer">
        <el-button
          v-if="downloadProgressPhase === 'done' || downloadProgressPhase === 'error'"
          size="small"
          type="primary"
          @click="downloadProgressVisible = false">
          关闭
        </el-button>
        <span v-else class="form-tip">打包/传输过程中请勿关闭页面</span>
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
        <p v-else-if="exportForm.format === 'engine'">TensorRT：NVIDIA GPU 专属，推理速度最快（需安装 tensorrt）</p>
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
import { mlPipelineAPI, modelAPI, skillGraphAPI } from '../../service/VisionAIService.js';
import ChannelTreePanel from '../skillManagement/runPlan/ChannelTreePanel.vue';
const config = require('../../../../config/index.js');

export default {
  name: 'ModelFactory',
  components: { ChannelTreePanel },
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

      // 自动采集
      collectionLoading: false,
      collectionTasks: [],
      collectionTemplates: [],
      collectionActionId: null,
      collectionDetailVisible: false,
      collectionDetailTask: null,
      createCollectionVisible: false,
      creatingCollection: false,
      editingCollectionId: null,
      collectionStep: 0,
      collectionStepLabels: ['触发条件', '点位选择', '控量确认'],
      selectedCollectionCameras: [],
      detectModelOptions: [],
      detectModelLoading: false,
      modelClassOptions: [],
      modelClassLoading: false,
      skillGraphOptions: [],
      skillGraphLoading: false,
      collectionForm: {
        name: '',
        camera_ids: [],
        template_id: 'frame_change',
        template_params: {
          sensitivity: 0.12,
          min_changed_ratio: 0.02,
          require_frame_change: false,
          model_name: '',
          target_classes: [],
          confidence_threshold: 0.5,
          prompt: '图中是否存在未佩戴安全帽的人员？只回答 YES 或 NO。',
          positive_keywords: ['YES', '是', '存在', '有'],
          skill_id: '',
          skill_name: '',
          trigger_mode: 'alert',
        },
        cooldown_sec: 5,
        max_per_hour: 200,
        poll_interval_sec: 3,
      },
      collectionRules: {
        name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
        camera_ids: [{ type: 'array', required: true, min: 1, message: '请从组织树选择点位', trigger: 'change' }],
        template_id: [{ required: true, message: '请选择模板', trigger: 'change' }],
      },

      // LS 项目状态
      lsProjectWarning: '',

      // 图片
      images: [],
      imagesLoading: false,
      selectedImageIds: [],
      deletingImages: false,
      downloadingImages: false,
      downloadProgressVisible: false,
      downloadProgressPhase: '', // packing | transferring | done | error
      downloadProgressPercent: 0,
      downloadProgressTitle: '',
      downloadProgressMeta: '',
      downloadProgressError: '',
      downloadProgressStatus: undefined,
      downloadJobId: null,
      downloadPollTimer: null,

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
    selectedCollectionTemplate() {
      return this.collectionTemplates.find(t => t.id === this.collectionForm.template_id) || null;
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
    this.loadCollectionTemplates();
    this.pollTimer = setInterval(() => {
      if (this.allTrainingTasks.some(t => t.status === 'running')) {
        this.silentLoadTrainingTasks();
      }
      if (this.activeTab === 'collection' && this.collectionTasks.some(t => t.status === 'running')) {
        this.loadCollectionTasks(true);
      }
    }, 5000);
  },
  beforeDestroy() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.logPollTimer) clearInterval(this.logPollTimer);
    if (this.exportPollTimer) clearInterval(this.exportPollTimer);
    this.stopDownloadPoll();
  },
  methods: {
    imageProxyUrl(imageId) {
      return `${config.API_BASE_URL}/api/v1/ml-pipeline/annotation/images/${imageId}/proxy`;
    },
    sourceTypeLabel(type) {
      return {
        camera: '摄像头',
        camera_change: '画面变化',
        camera_model: '小模型',
        camera_vlm: '大模型',
        camera_skill: '技能编排',
        alert: '预警',
        upload: '上传',
        label_studio: 'LS',
      }[type] || type;
    },
    collectionStatusType(status) {
      return { pending: 'info', running: 'success', paused: 'warning', stopped: 'info', failed: 'danger' }[status] || 'info';
    },
    collectionStatusLabel(status) {
      return { pending: '待启动', running: '采集中', paused: '已暂停', stopped: '已停止', failed: '失败' }[status] || status;
    },
    collectionTaskTemplateLabel(task) {
      if (!task) return '';
      if (task.template_id === 'skill_graph') {
        const name = (task.template_params && task.template_params.skill_name) || '';
        return name ? `编排·${name}` : (task.template_name || '技能编排');
      }
      return task.template_name || task.template_id;
    },
    collectionTaskParamsSummary(task) {
      if (!task) return '';
      const p = task.template_params || {};
      const frameGate = p.require_frame_change
        ? ` · 需画面变化(灵敏度 ${p.sensitivity != null ? p.sensitivity : '-'} / 占比 ${p.min_changed_ratio != null ? p.min_changed_ratio : '-'})`
        : '';
      if (task.template_id === 'frame_change') {
        const sensitivity = p.sensitivity != null ? p.sensitivity : '-';
        const ratio = p.min_changed_ratio != null ? p.min_changed_ratio : '-';
        return `灵敏度 ${sensitivity} · 变化占比 ${ratio}`;
      }
      if (task.template_id === 'small_model') {
        const classes = (p.target_classes || []).join('、') || '未选类别';
        const confidence = p.confidence_threshold != null ? p.confidence_threshold : '-';
        return `模型 ${p.model_name || '-'} · 类别 ${classes} · 置信度 ${confidence}${frameGate}`;
      }
      if (task.template_id === 'vlm') {
        const prompt = (p.prompt || '').replace(/\s+/g, ' ').trim();
        const short = prompt.length > 40 ? `${prompt.slice(0, 40)}…` : prompt;
        const keywords = (p.positive_keywords || []).join('/') || '-';
        return `提示词 ${short || '-'} · 关键词 ${keywords}${frameGate}`;
      }
      if (task.template_id === 'skill_graph') {
        return `编排 ${p.skill_name || p.skill_id || '-'} · ${p.trigger_mode === 'alert' ? '告警触发' : (p.trigger_mode || '-')}${frameGate}`;
      }
      return '';
    },
    collectionDetailParam(key) {
      const p = (this.collectionDetailTask && this.collectionDetailTask.template_params) || {};
      return p[key];
    },
    showCollectionDetail(task) {
      this.collectionDetailTask = task;
      this.collectionDetailVisible = true;
    },
    goImagesTab() {
      this.activeTab = 'images';
      this.loadImages();
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
      this.selectedImageIds = [];
      this.loadImages();
      this.loadCollectionTasks();
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

    // ---- 自动采集 ----
    async loadCollectionTemplates() {
      try {
        const res = await mlPipelineAPI.listCollectionTemplates();
        this.collectionTemplates = (res.data && res.data.data) || [];
      } catch (_) {
        this.collectionTemplates = [];
      }
    },
    async loadCollectionTasks(silent = false) {
      if (!this.selectedDataset) return;
      if (!silent) this.collectionLoading = true;
      try {
        const res = await mlPipelineAPI.listCollectionTasks(this.selectedDataset.id);
        const tasks = (res.data && res.data.data) || [];
        // 并行拉取采图缩略图（卡片预览最多 12 张；完整列表在「图片管理」）
        const withRecent = await Promise.all(tasks.map(async (t) => {
          try {
            const r = await mlPipelineAPI.listCollectionRecentImages(t.id, 12);
            return { ...t, recentImages: (r.data && r.data.data) || [] };
          } catch (_) {
            return { ...t, recentImages: [] };
          }
        }));
        this.collectionTasks = withRecent;
      } catch (_) {
        if (!silent) this.$message.error('加载采集任务失败');
        this.collectionTasks = [];
      } finally {
        if (!silent) this.collectionLoading = false;
      }
    },
    defaultCollectionTemplateParams() {
      return {
        sensitivity: 0.12,
        min_changed_ratio: 0.02,
        require_frame_change: false,
        model_name: '',
        target_classes: [],
        confidence_threshold: 0.5,
        prompt: '图中是否存在未佩戴安全帽的人员？只回答 YES 或 NO。',
        positive_keywords: ['YES', '是', '存在', '有'],
        skill_id: '',
        skill_name: '',
        trigger_mode: 'alert',
      };
    },
    async showCreateCollectionDialog() {
      if (!this.selectedDataset) return;
      this.editingCollectionId = null;
      this.collectionStep = 0;
      this.selectedCollectionCameras = [];
      this.collectionForm = {
        name: `${this.selectedDataset.name}-采集`,
        camera_ids: [],
        template_id: 'frame_change',
        template_params: this.defaultCollectionTemplateParams(),
        cooldown_sec: 5,
        max_per_hour: 200,
        poll_interval_sec: 2,
      };
      this.createCollectionVisible = true;
      this.onCollectionTemplateChange('frame_change');
      this.loadDetectModels();
      this.loadSkillGraphOptions();
      this.$nextTick(() => {
        if (this.$refs.collectionForm) this.$refs.collectionForm.clearValidate();
      });
    },
    async showEditCollectionDialog(task) {
      if (!task) return;
      if (task.status === 'running') {
        this.$message.warning('任务运行中，请先停止后再编辑');
        return;
      }
      this.editingCollectionId = task.id;
      this.collectionStep = 0;
      const params = { ...this.defaultCollectionTemplateParams(), ...(task.template_params || {}) };
      if (!Array.isArray(params.target_classes)) params.target_classes = [];
      if (!Array.isArray(params.positive_keywords)) params.positive_keywords = [];
      const cameraIds = (task.camera_ids || []).map(String);
      const cameraNames = task.camera_names || [];
      this.selectedCollectionCameras = cameraIds.map((id, idx) => ({
        camera_id: id,
        camera_name: cameraNames[idx] || id,
        online: true,
      }));
      this.collectionForm = {
        name: task.name || '',
        camera_ids: cameraIds.slice(),
        template_id: task.template_id || 'frame_change',
        template_params: params,
        cooldown_sec: task.cooldown_sec != null ? Number(task.cooldown_sec) : 5,
        max_per_hour: task.max_per_hour != null ? Number(task.max_per_hour) : 200,
        poll_interval_sec: task.poll_interval_sec != null ? Number(task.poll_interval_sec) : 2,
      };
      this.createCollectionVisible = true;
      this.loadDetectModels();
      this.loadSkillGraphOptions();
      if (this.collectionForm.template_id === 'small_model' && params.model_name) {
        await this.loadModelClassesByName(params.model_name, false);
      }
      this.$nextTick(() => {
        if (this.$refs.collectionForm) this.$refs.collectionForm.clearValidate();
      });
    },
    editFromCollectionDetail() {
      const task = this.collectionDetailTask;
      this.collectionDetailVisible = false;
      this.showEditCollectionDialog(task);
    },
    onCollectionDrawerClosed() {
      this.collectionStep = 0;
      this.creatingCollection = false;
      this.editingCollectionId = null;
    },
    selectCollectionTemplate(templateId) {
      if (this.collectionForm.template_id === templateId) return;
      this.collectionForm.template_id = templateId;
      this.onCollectionTemplateChange(templateId);
    },
    async goCollectionStep(i) {
      if (i === this.collectionStep) return;
      if (i < this.collectionStep) {
        this.collectionStep = i;
        return;
      }
      // 只能前进到下一步；跨步点击时逐级校验
      for (let s = this.collectionStep; s < i; s += 1) {
        const ok = await this.validateCollectionStep(s);
        if (!ok) {
          this.collectionStep = s;
          return;
        }
      }
      this.collectionStep = i;
    },
    prevCollectionStep() {
      if (this.collectionStep > 0) this.collectionStep -= 1;
    },
    async nextCollectionStep() {
      const ok = await this.validateCollectionStep(this.collectionStep);
      if (!ok) return;
      this.collectionStep = Math.min(this.collectionStep + 1, 2);
    },
    validateCollectionStep(step) {
      return new Promise((resolve) => {
        if (step === 0) {
          this.$refs.collectionForm.validateField('name', (err) => {
            if (err) {
              resolve(false);
              return;
            }
            if (!(this.collectionForm.name || '').trim()) {
              this.$message.warning('请输入任务名称');
              resolve(false);
              return;
            }
            if (this.collectionForm.template_id === 'small_model') {
              if (!this.collectionForm.template_params.model_name) {
                this.$message.warning('请选择检测模型');
                resolve(false);
                return;
              }
              if (!(this.collectionForm.template_params.target_classes || []).length) {
                this.$message.warning('请选择目标类别');
                resolve(false);
                return;
              }
            }
            if (this.collectionForm.template_id === 'vlm' && !(this.collectionForm.template_params.prompt || '').trim()) {
              this.$message.warning('请填写判定提示词');
              resolve(false);
              return;
            }
            if (this.collectionForm.template_id === 'skill_graph' && !(this.collectionForm.template_params.skill_id || '').trim()) {
              this.$message.warning('请选择已发布的技能编排');
              resolve(false);
              return;
            }
            resolve(true);
          });
          return;
        }
        if (step === 1) {
          if (!this.selectedCollectionCameras.length) {
            this.$message.warning('请至少选择一个点位');
            resolve(false);
            return;
          }
          resolve(true);
          return;
        }
        resolve(true);
      });
    },
    syncCollectionCameraIds() {
      this.collectionForm.camera_ids = this.selectedCollectionCameras.map(c => String(c.camera_id));
    },
    onCollectionChannelClick(channel) {
      if (!channel || !channel.camera_id) return;
      const idx = this.selectedCollectionCameras.findIndex(
        c => String(c.camera_id) === String(channel.camera_id)
      );
      if (idx >= 0) {
        this.selectedCollectionCameras.splice(idx, 1);
      } else {
        this.selectedCollectionCameras.push({
          camera_id: String(channel.camera_id),
          camera_name: channel.camera_name || String(channel.camera_id),
          online: !!channel.online,
        });
      }
      this.syncCollectionCameraIds();
      this.$nextTick(() => {
        if (this.$refs.collectionForm) this.$refs.collectionForm.validateField('camera_ids');
      });
    },
    removeCollectionCamera(pt) {
      const i = this.selectedCollectionCameras.findIndex(
        c => String(c.camera_id) === String(pt.camera_id)
      );
      if (i >= 0) this.selectedCollectionCameras.splice(i, 1);
      this.syncCollectionCameraIds();
    },
    clearCollectionCameras() {
      this.selectedCollectionCameras = [];
      this.syncCollectionCameraIds();
    },
    onCollectionTemplateChange(templateId) {
      const tmpl = this.collectionTemplates.find(t => t.id === templateId);
      if (!tmpl) return;
      this.collectionForm.cooldown_sec = tmpl.default_cooldown_sec;
      this.collectionForm.max_per_hour = tmpl.default_max_per_hour;
      this.collectionForm.poll_interval_sec = tmpl.default_poll_interval_sec;
      const defaults = tmpl.default_params || {};
      this.collectionForm.template_params = {
        ...this.collectionForm.template_params,
        ...defaults,
      };
      if (templateId === 'skill_graph') {
        this.loadSkillGraphOptions();
      }
    },
    async loadSkillGraphOptions() {
      this.skillGraphLoading = true;
      try {
        const res = await skillGraphAPI.listGraphs({ status: true, page: 1, page_size: 200 });
        this.skillGraphOptions = (res.data && res.data.data) || [];
        if (!this.skillGraphOptions.length) {
          // 部分环境 status 过滤参数可能不生效，再拉全量后本地筛已发布
          const all = await skillGraphAPI.listGraphs({ page: 1, page_size: 200 });
          const list = (all.data && all.data.data) || [];
          this.skillGraphOptions = list.filter(g => g.status === true || g.status === 1);
        }
      } catch (_) {
        this.skillGraphOptions = [];
        this.$message.warning('加载技能编排列表失败');
      } finally {
        this.skillGraphLoading = false;
      }
    },
    onCollectSkillGraphChange(skillId) {
      const g = this.skillGraphOptions.find(x => x.skill_id === skillId);
      this.collectionForm.template_params.skill_name = g ? g.skill_name : '';
    },
    openSkillGraphEditor() {
      const route = this.$router.resolve({ path: '/skillManage/skillGraphEditor' });
      window.open(route.href, '_blank');
    },
    async loadDetectModels() {
      this.detectModelLoading = true;
      try {
        const res = await modelAPI.getModelList({ page: 1, limit: 100 });
        const list = (res.data && res.data.data) || [];
        this.detectModelOptions = list.map(m => ({
          id: m.id,
          name: m.name,
          status: m.model_status === 'loaded' ? '已加载' : (m.model_status || ''),
        }));
      } catch (_) {
        this.detectModelOptions = [];
      } finally {
        this.detectModelLoading = false;
      }
    },
    async onCollectModelChange(modelName) {
      this.collectionForm.template_params.target_classes = [];
      await this.loadModelClassesByName(modelName, true);
    },
    async loadModelClassesByName(modelName, warnEmpty = true) {
      this.modelClassOptions = [];
      if (!modelName) return;
      let model = this.detectModelOptions.find(m => m.name === modelName);
      if (!model) {
        await this.loadDetectModels();
        model = this.detectModelOptions.find(m => m.name === modelName);
      }
      if (!model) return;
      this.modelClassLoading = true;
      try {
        const res = await modelAPI.getModelClasses(model.id);
        const classes = (res.data && res.data.classes) || [];
        this.modelClassOptions = classes.map(c => (typeof c === 'string' ? c : c.name)).filter(Boolean);
        if (warnEmpty && !this.modelClassOptions.length) {
          this.$message.warning('该模型暂无类别标签，请先在模型管理中维护');
        }
      } catch (_) {
        this.modelClassOptions = [];
        if (warnEmpty) this.$message.warning('加载模型类别失败，请先在模型管理中维护标签');
      } finally {
        this.modelClassLoading = false;
      }
    },
    async confirmCreateCollection() {
      const step0Ok = await this.validateCollectionStep(0);
      if (!step0Ok) {
        this.collectionStep = 0;
        return;
      }
      const step1Ok = await this.validateCollectionStep(1);
      if (!step1Ok) {
        this.collectionStep = 1;
        return;
      }
      this.creatingCollection = true;
      try {
        const payload = {
          name: this.collectionForm.name,
          camera_ids: this.selectedCollectionCameras.map(c => String(c.camera_id)),
          camera_names: this.selectedCollectionCameras.map(c => c.camera_name),
          template_id: this.collectionForm.template_id,
          template_params: this.collectionForm.template_params,
          cooldown_sec: this.collectionForm.cooldown_sec,
          max_per_hour: this.collectionForm.max_per_hour,
          poll_interval_sec: this.collectionForm.poll_interval_sec,
        };
        if (this.editingCollectionId) {
          await mlPipelineAPI.updateCollectionTask(this.editingCollectionId, payload);
          this.$message.success('采集任务已更新');
        } else {
          const res = await mlPipelineAPI.createCollectionTask({
            ...payload,
            dataset_id: this.selectedDataset.id,
          });
          const task = res.data.data;
          await mlPipelineAPI.startCollectionTask(task.id);
          this.$message.success('采集任务已创建并启动');
        }
        this.createCollectionVisible = false;
        this.activeTab = 'collection';
        await this.loadCollectionTasks();
      } catch (e) {
        const action = this.editingCollectionId ? '保存' : '创建';
        this.$message.error(`${action}失败: ` + ((e.response && e.response.data && e.response.data.detail) || e.message));
      } finally {
        this.creatingCollection = false;
      }
    },
    async handleStartCollection(task) {
      this.collectionActionId = task.id;
      try {
        await mlPipelineAPI.startCollectionTask(task.id);
        this.$message.success('已启动');
        await this.loadCollectionTasks();
      } catch (e) {
        this.$message.error((e.response && e.response.data && e.response.data.detail) || e.message);
      } finally {
        this.collectionActionId = null;
      }
    },
    async handleStopCollection(task) {
      this.collectionActionId = task.id;
      try {
        await mlPipelineAPI.stopCollectionTask(task.id);
        this.$message.success('已停止');
        await this.loadCollectionTasks();
        await this.loadImages();
        await this.loadDatasets();
      } catch (e) {
        this.$message.error((e.response && e.response.data && e.response.data.detail) || e.message);
      } finally {
        this.collectionActionId = null;
      }
    },
    async handleDeleteCollection(task) {
      try {
        await this.$confirm(`确定删除采集任务「${task.name}」？`, '提示', { type: 'warning' });
        await mlPipelineAPI.deleteCollectionTask(task.id);
        this.$message.success('已删除');
        await this.loadCollectionTasks();
      } catch (e) {
        if (e === 'cancel') return;
        this.$message.error((e.response && e.response.data && e.response.data.detail) || e.message);
      }
    },

    // ---- 图片 ----
    async loadImages() {
      if (!this.selectedDataset) return;
      this.imagesLoading = true;
      try {
        const res = await mlPipelineAPI.listImages(this.selectedDataset.id);
        this.images = res.data.data || [];
        const remain = new Set(this.images.map(i => i.id));
        this.selectedImageIds = this.selectedImageIds.filter(id => remain.has(id));
      } catch (_) {
        this.images = [];
        this.selectedImageIds = [];
      } finally {
        this.imagesLoading = false;
      }
    },
    toggleImageSelect(imageId, checked) {
      const idx = this.selectedImageIds.indexOf(imageId);
      if (checked && idx < 0) this.selectedImageIds.push(imageId);
      else if (!checked && idx >= 0) this.selectedImageIds.splice(idx, 1);
    },
    toggleSelectAllImages(checked) {
      this.selectedImageIds = checked ? this.images.map(i => i.id) : [];
    },
    applyDatasetImageCounts(d) {
      if (!this.selectedDataset || !d) return;
      if (d.dataset_image_count != null) {
        this.$set(this.selectedDataset, 'image_count', d.dataset_image_count);
      }
      if (d.dataset_labeled_count != null) {
        this.$set(this.selectedDataset, 'labeled_count', d.dataset_labeled_count);
      }
      const ds = this.datasets.find(x => x.id === this.selectedDataset.id);
      if (ds) {
        if (d.dataset_image_count != null) this.$set(ds, 'image_count', d.dataset_image_count);
        if (d.dataset_labeled_count != null) this.$set(ds, 'labeled_count', d.dataset_labeled_count);
      }
    },
    async handleDeleteImage(img) {
      try {
        await this.$confirm(
          img.is_labeled ? '该图片已标注，删除后标注也会一并清除，确定删除？' : '确定删除这张图片？',
          '删除图片',
          { type: 'warning' }
        );
      } catch (_) {
        return;
      }
      this.deletingImages = true;
      try {
        const res = await mlPipelineAPI.deleteImage(img.id);
        this.$message.success('已删除');
        this.selectedImageIds = this.selectedImageIds.filter(id => id !== img.id);
        this.applyDatasetImageCounts((res.data && res.data.data) || {});
        await this.loadImages();
        await this.loadDatasets();
        await this.loadCollectionTasks(true);
      } catch (e) {
        this.$message.error('删除失败: ' + ((e.response && e.response.data && e.response.data.detail) || e.message));
      } finally {
        this.deletingImages = false;
      }
    },
    async handleBatchDeleteImages() {
      if (!this.selectedImageIds.length) return;
      try {
        await this.$confirm(
          `确定删除选中的 ${this.selectedImageIds.length} 张图片？已标注的图片标注也会一并清除。`,
          '批量删除',
          { type: 'warning' }
        );
      } catch (_) {
        return;
      }
      this.deletingImages = true;
      try {
        const res = await mlPipelineAPI.deleteImages(this.selectedDataset.id, this.selectedImageIds.slice());
        const d = (res.data && res.data.data) || {};
        const msg = `已删除 ${d.deleted || this.selectedImageIds.length} 张`;
        if (d.errors && d.errors.length) {
          this.$message.warning(msg + `（${d.errors.length} 项有警告）`);
        } else {
          this.$message.success(msg);
        }
        this.selectedImageIds = [];
        this.applyDatasetImageCounts(d);
        await this.loadImages();
        await this.loadDatasets();
        await this.loadCollectionTasks(true);
      } catch (e) {
        this.$message.error('删除失败: ' + ((e.response && e.response.data && e.response.data.detail) || e.message));
      } finally {
        this.deletingImages = false;
      }
    },
    stopDownloadPoll() {
      if (this.downloadPollTimer) {
        clearInterval(this.downloadPollTimer);
        this.downloadPollTimer = null;
      }
    },
    onDownloadProgressClosed() {
      this.stopDownloadPoll();
      this.downloadingImages = false;
      this.downloadJobId = null;
    },
    async handleDownloadImages() {
      if (!this.selectedDataset || !this.images.length || this.downloadingImages) return;
      const ids = this.selectedImageIds.slice();
      const count = ids.length || this.images.length;
      if (!ids.length) {
        try {
          await this.$confirm(
            `将打包下载本数据集全部 ${count} 张原图（不含标注）。数量较多时会先后台打包并显示进度，确认继续？`,
            '下载原图',
            { type: 'info' }
          );
        } catch (_) {
          return;
        }
      }

      this.downloadingImages = true;
      this.downloadProgressVisible = true;
      this.downloadProgressPhase = 'packing';
      this.downloadProgressPercent = 0;
      this.downloadProgressStatus = undefined;
      this.downloadProgressTitle = '正在创建打包任务…';
      this.downloadProgressMeta = `共 ${count} 张`;
      this.downloadProgressError = '';
      this.downloadJobId = null;
      this.stopDownloadPoll();

      try {
        const res = await mlPipelineAPI.createDownloadImagesJob(
          this.selectedDataset.id,
          ids.length ? ids : null
        );
        const job = (res.data && res.data.data) || {};
        if (!job.job_id) throw new Error('未返回任务 ID');
        this.downloadJobId = job.job_id;
        this.applyDownloadJobProgress(job);
        this.downloadPollTimer = setInterval(() => this.pollDownloadJob(), 800);
        await this.pollDownloadJob();
      } catch (e) {
        this.downloadProgressPhase = 'error';
        this.downloadProgressStatus = 'exception';
        this.downloadProgressTitle = '创建打包任务失败';
        this.downloadProgressError = (e.response && e.response.data && e.response.data.detail) || e.message || '未知错误';
        this.downloadingImages = false;
      }
    },
    applyDownloadJobProgress(job) {
      if (!job) return;
      const total = job.total || 0;
      const packed = job.packed || 0;
      const failed = job.failed || 0;
      this.downloadProgressPercent = Math.min(100, Number(job.percent) || 0);
      this.downloadProgressTitle = job.message || '打包中…';
      this.downloadProgressMeta = total
        ? `已处理 ${packed + failed} / ${total}（成功 ${packed}${failed ? `，失败 ${failed}` : ''}）`
        : '';
    },
    async pollDownloadJob() {
      if (!this.selectedDataset || !this.downloadJobId) return;
      try {
        const res = await mlPipelineAPI.getDownloadImagesJob(this.selectedDataset.id, this.downloadJobId);
        const job = (res.data && res.data.data) || {};
        this.applyDownloadJobProgress(job);
        if (job.status === 'done') {
          this.stopDownloadPoll();
          await this.fetchDownloadJobFile(job);
        } else if (job.status === 'error') {
          this.stopDownloadPoll();
          this.downloadProgressPhase = 'error';
          this.downloadProgressStatus = 'exception';
          this.downloadProgressTitle = '打包失败';
          this.downloadProgressError = job.error || job.message || '打包失败';
          this.downloadingImages = false;
        }
      } catch (e) {
        this.stopDownloadPoll();
        this.downloadProgressPhase = 'error';
        this.downloadProgressStatus = 'exception';
        this.downloadProgressTitle = '查询进度失败';
        this.downloadProgressError = (e.response && e.response.data && e.response.data.detail) || e.message || '未知错误';
        this.downloadingImages = false;
      }
    },
    async fetchDownloadJobFile(job) {
      this.downloadProgressPhase = 'transferring';
      this.downloadProgressStatus = undefined;
      this.downloadProgressPercent = 0;
      this.downloadProgressTitle = '打包完成，正在传输到本地…';
      const sizeHint = job && job.file_size_mb != null ? `约 ${job.file_size_mb} MB` : '';
      this.downloadProgressMeta = sizeHint;
      try {
        const res = await mlPipelineAPI.downloadImagesJobFile(
          this.selectedDataset.id,
          this.downloadJobId,
          (evt) => {
            if (!evt || !evt.total) return;
            const pct = Math.min(99, Math.round((evt.loaded * 100) / evt.total));
            this.downloadProgressPercent = pct;
            const loadedMb = (evt.loaded / (1024 * 1024)).toFixed(1);
            const totalMb = (evt.total / (1024 * 1024)).toFixed(1);
            this.downloadProgressMeta = `已传输 ${loadedMb} / ${totalMb} MB`;
          }
        );
        const blob = res && res.data;
        if (!blob || !(blob instanceof Blob) || !blob.size) {
          throw new Error('下载内容为空');
        }
        if (blob.type && blob.type.includes('application/json')) {
          const text = await blob.text();
          let detail = text;
          try {
            const j = JSON.parse(text);
            detail = j.detail || j.message || text;
          } catch (_) { /* ignore */ }
          throw new Error(detail || '下载失败');
        }
        const filename = (job && job.filename) || `dataset_${this.selectedDataset.id}_images.zip`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.downloadProgressPhase = 'done';
        this.downloadProgressPercent = 100;
        this.downloadProgressStatus = 'success';
        this.downloadProgressTitle = '下载完成';
        const packed = (job && job.packed) || 0;
        const failed = (job && job.failed) || 0;
        this.downloadProgressMeta = failed
          ? `成功 ${packed} 张，失败 ${failed} 张`
          : `成功 ${packed} 张原图`;
        if (failed) this.$message.warning(this.downloadProgressMeta);
        else this.$message.success(this.downloadProgressMeta);
      } catch (e) {
        let msg = e.message || '下载失败';
        const data = e.response && e.response.data;
        if (data instanceof Blob) {
          try {
            const text = await data.text();
            const j = JSON.parse(text);
            msg = j.detail || j.message || msg;
          } catch (_) { /* ignore */ }
        } else if (e.response && e.response.data && e.response.data.detail) {
          msg = e.response.data.detail;
        }
        this.downloadProgressPhase = 'error';
        this.downloadProgressStatus = 'exception';
        this.downloadProgressTitle = '传输失败';
        this.downloadProgressError = msg;
      } finally {
        this.downloadingImages = false;
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
      if (this.selectedDataset) {
        await this.loadImages();
        await this.loadCollectionTasks();
      }
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

/* ---- 原图下载进度 ---- */
.dl-progress-body { padding: 4px 0 8px; }
.dl-progress-phase { font-size: 14px; color: #303133; margin-bottom: 14px; }
.dl-progress-meta { margin-top: 12px; font-size: 13px; color: #606266; }
.dl-progress-error { margin-top: 10px; font-size: 13px; color: #f56c6c; line-height: 1.5; word-break: break-all; }

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
.image-card.selected { border-color: #409eff; box-shadow: 0 0 0 1px #409eff inset; }
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
.image-check {
  position: absolute;
  top: 4px;
  left: 4px;
  z-index: 2;
  margin: 0;
}
.image-check >>> .el-checkbox__label { display: none; }
.image-delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 2;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 0;
  font-size: 12px;
}
.image-card:hover .image-delete-btn,
.image-card.selected .image-delete-btn { display: flex; }
.image-delete-btn:hover { background: #f56c6c; }
.image-delete-btn:disabled { opacity: 0.5; cursor: not-allowed; }
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

/* ---- 自动采集 ---- */
.collection-panel { padding: 4px 0; }
.collection-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 10px;
  background: #fff;
}
.collection-card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}
.collection-card-title { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.collection-card-actions { display: flex; gap: 6px; flex-shrink: 0; }
.collection-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 12px;
  color: #606266;
  margin-bottom: 6px;
}
.collection-params {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
  line-height: 1.5;
  word-break: break-all;
}
.collection-reason { font-size: 12px; color: #67c23a; margin-bottom: 4px; }
.collection-error { font-size: 12px; color: #f56c6c; margin-bottom: 4px; }
.collection-thumbs { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; align-items: center; }
.collection-thumb {
  width: 64px;
  height: 64px;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
  overflow: hidden;
}
.collection-thumbs-more {
  font-size: 12px;
  color: #409eff;
  cursor: pointer;
  line-height: 1.4;
  padding: 4px 0;
}
.collection-thumbs-more:hover { color: #66b1ff; }
.image-source {
  position: absolute;
  top: 0;
  left: 0;
  background: rgba(64, 158, 255, 0.85);
  color: #fff;
  font-size: 10px;
  padding: 1px 4px;
  border-bottom-right-radius: 4px;
}

/* ---- 采集抽屉 ---- */
.coll-drawer-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.3;
}
.coll-drawer-title > span:first-child { font-size: 16px; font-weight: 600; color: #303133; }
.coll-drawer-sub { font-size: 12px; color: #909399; font-weight: normal; }
.coll-drawer-body {
  padding: 0 20px 80px;
  height: calc(100vh - 120px);
  overflow-y: auto;
}
.coll-step-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin: 4px 0 20px;
  padding: 12px 8px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}
.coll-step-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #909399;
  cursor: pointer;
  position: relative;
  padding: 0 18px;
  font-size: 13px;
}
.coll-step-item:not(:last-child)::after {
  content: '';
  position: absolute;
  right: -10px;
  top: 50%;
  width: 28px;
  height: 2px;
  background: #dcdfe6;
  transform: translateY(-50%);
}
.coll-step-item.done:not(:last-child)::after { background: #409eff; }
.coll-step-num {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  background: #fff;
  z-index: 1;
}
.coll-step-item.active .coll-step-num,
.coll-step-item.done .coll-step-num {
  border-color: #409eff;
  background: #409eff;
  color: #fff;
}
.coll-step-item.active { color: #303133; font-weight: 600; }
.coll-step-item.done { color: #409eff; }
.coll-form-section {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px 20px 8px;
  margin-bottom: 16px;
}
.coll-section-head {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f2f5;
}
.coll-section-head i { margin-right: 6px; color: #409eff; }
.template-card-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  width: 100%;
  max-width: 640px;
}
.template-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.15s;
  background: #fafafa;
}
.template-card:hover { border-color: #c0c4cc; background: #fff; }
.template-card.active {
  border-color: #409eff;
  background: #ecf5ff;
  box-shadow: 0 0 0 1px #409eff inset;
}
.template-card__name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
}
.template-card__name i { color: #409eff; margin-right: 4px; }
.template-card__desc {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}
.point-tip {
  background: #ecf5ff;
  color: #409eff;
  font-size: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.coll-summary { max-width: 640px; margin-bottom: 12px; }
.coll-drawer-footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12px 20px;
  background: #fff;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  z-index: 5;
}

/* ---- 点位选择（对齐运行计划） ---- */
.collection-point-item { margin-bottom: 8px; }
.collection-point-item >>> .el-form-item__content { line-height: normal; margin-left: 0 !important; }
.point-selector {
  display: flex;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  height: 420px;
  overflow: hidden;
  width: 100%;
}
.ps-tree {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #ebeef5;
  padding: 10px;
  background: #fafbfc;
}
.ps-tree >>> .channel-tree-panel {
  flex: 1;
  min-height: 0;
}
.ps-tree-tip {
  font-size: 11px;
  color: #909399;
  margin-top: 8px;
  text-align: left;
}
.ps-selected {
  width: 240px;
  flex-shrink: 0;
  padding: 12px;
  display: flex;
  flex-direction: column;
  background: #fff;
}
.ps-head {
  font-size: 13px;
  color: #303133;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.clear-link {
  color: #409eff;
  font-size: 12px;
  font-weight: normal;
  cursor: pointer;
}
.clear-link:hover { color: #66b1ff; }
.ps-list { flex: 1; overflow-y: auto; margin-top: 4px; }
.ps-item {
  padding: 7px 6px;
  font-size: 13px;
  color: #606266;
  display: flex;
  align-items: center;
  border-radius: 4px;
}
.selected-item { justify-content: space-between; align-items: flex-start; }
.selected-item__main { flex: 1; min-width: 0; }
.selected-item__name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 2px;
}
.selected-item__name i { color: #409eff; margin-right: 4px; }
.selected-item__status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #909399;
}
.selected-item .status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.selected-item .status-dot.is-active { background: #67c23a; }
.selected-item .status-dot.is-offline { background: #c0c4cc; }
.selected-item .el-icon-close {
  cursor: pointer;
  color: #c0c4cc;
  padding: 4px;
  flex-shrink: 0;
  margin-top: 2px;
}
.selected-item .el-icon-close:hover { color: #f56c6c; }
.empty-tip-sm {
  text-align: center;
  color: #c0c4cc;
  font-size: 12px;
  padding: 24px 8px;
}
</style>

<style>
.collection-create-drawer .el-drawer__header {
  margin-bottom: 0;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f2f5;
}
.collection-create-drawer .el-drawer__body {
  padding: 0;
  position: relative;
}
.collection-create-drawer .el-drawer__close-btn {
  text-align: right;
}
</style>
