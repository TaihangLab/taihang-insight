<template>
  <div class="asset-page face-gallery-page">
    <div class="asset-page-header">
      <div class="asset-page-header__main">
        <div class="asset-page-title-row">
          <div class="asset-page-icon asset-page-icon--user">
            <i class="el-icon-user" />
          </div>
          <h2 class="asset-page-title">人脸底库</h2>
        </div>
        <p class="asset-page-desc">
          管理人脸识别技能的登记人员：录入照片提取特征、修改信息、追加/删除人脸模板。运行计划中启用「人脸识别」后，将与本底库做 1:N 比对。
        </p>
      </div>
      <div class="asset-page-header__actions">
        <el-button icon="el-icon-refresh" size="small" @click="loadList">刷新</el-button>
        <el-button size="small" @click="openLogs">识别记录</el-button>
        <el-button size="small" @click="openSearch">1:N 检索</el-button>
        <el-button size="small" @click="openCompare">1:1 比对</el-button>
        <el-button size="small" icon="el-icon-download" :loading="exporting" @click="exportGallery">
          {{ selectedRows.length ? `导出选中 (${selectedRows.length})` : '导出底库' }}
        </el-button>
        <el-button size="small" icon="el-icon-upload2" @click="openBatch">批量录入</el-button>
        <el-button type="primary" icon="el-icon-plus" size="small" @click="openEnroll">录入人员</el-button>
      </div>
    </div>

    <div class="asset-stat-row">
      <div class="asset-stat-card">
        <div class="asset-stat-card__icon asset-stat-card__icon--total"><i class="el-icon-user" /></div>
        <div>
          <div class="asset-stat-card__value">{{ stats.person_total }}</div>
          <div class="asset-stat-card__label">人员总数</div>
        </div>
      </div>
      <div class="asset-stat-card">
        <div class="asset-stat-card__icon asset-stat-card__icon--online"><i class="el-icon-picture-outline" /></div>
        <div>
          <div class="asset-stat-card__value">{{ stats.template_total }}</div>
          <div class="asset-stat-card__label">人脸模板</div>
        </div>
      </div>
      <div class="asset-stat-card">
        <div class="asset-stat-card__icon asset-stat-card__icon--idle"><i class="el-icon-s-data" /></div>
        <div>
          <div class="asset-stat-card__value">{{ total }}</div>
          <div class="asset-stat-card__label">当前筛选</div>
        </div>
      </div>
    </div>

    <div class="asset-main">
      <div class="asset-toolbar">
        <div class="asset-toolbar__left">
          <el-input
            v-model="keyword"
            size="small"
            clearable
            placeholder="搜索人员编号 / 姓名"
            prefix-icon="el-icon-search"
            style="width: 260px"
            @keyup.enter.native="reloadFirstPage"
            @clear="reloadFirstPage"
          />
          <el-button type="primary" size="small" plain @click="reloadFirstPage">查询</el-button>
          <span class="threshold-label">比对阈值</span>
          <el-input-number
            v-model="cosineThreshold"
            size="small"
            :min="0"
            :max="2"
            :step="0.01"
            :precision="2"
            controls-position="right"
          />
          <el-button size="small" :loading="savingThreshold" @click="saveThreshold">保存阈值</el-button>
          <span class="form-hint">余弦距离，越小越严格，默认 0.68。保存后识别、1:1 比对和 1:N 检索都会用新值。</span>
        </div>
        <div class="asset-toolbar__right">
          <el-button
            type="danger"
            size="small"
            plain
            icon="el-icon-delete"
            :disabled="!selectedRows.length"
            :loading="batchDeleting"
            @click="batchRemovePersons"
          >批量删除{{ selectedRows.length ? ` (${selectedRows.length})` : '' }}</el-button>
        </div>
      </div>

      <div class="asset-table-wrap">
        <el-table
          ref="personTable"
          :data="rows"
          v-loading="loading"
          height="100%"
          stripe
          @selection-change="onSelectionChange"
        >
          <el-table-column type="selection" width="48" align="center" />
          <el-table-column label="登记照" width="88" align="center">
            <template slot-scope="scope">
              <el-image
                v-if="coverUrl(scope.row)"
                :src="coverUrl(scope.row)"
                fit="cover"
                class="face-cover"
                :preview-src-list="[coverUrl(scope.row)]"
              >
                <div slot="error" class="face-cover face-cover--empty"><i class="el-icon-user" /></div>
              </el-image>
              <div v-else class="face-cover face-cover--empty"><i class="el-icon-user" /></div>
            </template>
          </el-table-column>
          <el-table-column prop="person_code" label="人员编号" min-width="120" />
          <el-table-column prop="name" label="姓名" min-width="100" />
          <el-table-column prop="group_name" label="分组" min-width="100" />
          <el-table-column prop="department" label="部门" min-width="100" />
          <el-table-column label="状态" width="80" align="center">
            <template slot-scope="scope">
              <el-tag :type="scope.row.enabled === false ? 'info' : 'success'" size="mini">
                {{ scope.row.enabled === false ? '停用' : '启用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="template_count" label="模板数" width="80" align="center" />
          <el-table-column prop="created_at" label="创建时间" min-width="170" />
          <el-table-column label="操作" width="280" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="mini" @click="openDetail(scope.row)">详情</el-button>
              <el-button type="text" size="mini" @click="openEdit(scope.row)">编辑</el-button>
              <el-button type="text" size="mini" @click="openAddFace(scope.row)">追加人脸</el-button>
              <el-button type="text" size="mini" class="danger-text" @click="removePerson(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="face-pagination">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :current-page.sync="page"
          :page-size.sync="limit"
          :page-sizes="[10, 20, 50]"
          :total="total"
          @current-change="loadList"
          @size-change="reloadFirstPage"
        />
      </div>
    </div>

    <!-- 录入 -->
    <el-dialog
      title="录入人员"
      :visible.sync="enrollVisible"
      :width="enrollPipeline.active ? '640px' : '520px'"
      :close-on-click-modal="!enrollPipeline.active"
      :close-on-press-escape="!enrollPipeline.active"
      :show-close="!enrollPipeline.active"
      @closed="resetEnroll"
    >
      <el-form
        v-show="!enrollPipeline.active"
        ref="enrollForm"
        :model="enrollForm"
        :rules="enrollRules"
        label-width="90px"
      >
        <el-form-item label="人员编号" prop="person_code">
          <el-input v-model="enrollForm.person_code" maxlength="64" placeholder="唯一编号，如 emp001" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="enrollForm.name" maxlength="64" placeholder="可选" />
        </el-form-item>
        <el-form-item label="分组">
          <el-input v-model="enrollForm.group_name" maxlength="64" placeholder="可选" />
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="enrollForm.department" maxlength="64" placeholder="可选" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="enrollForm.remark" maxlength="255" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="enrollForm.enabled" active-text="启用" inactive-text="停用" />
        </el-form-item>
        <el-form-item label="人脸照片" prop="image" required>
          <el-upload
            class="face-uploader"
            action="#"
            :auto-upload="false"
            :limit="1"
            accept="image/jpeg,image/png,image/jpg"
            list-type="picture-card"
            :file-list="enrollFileList"
            :on-change="onEnrollFileChange"
            :on-remove="onEnrollFileRemove"
          >
            <i class="el-icon-plus" />
          </el-upload>
          <div class="form-hint">请上传清晰正面人脸照片</div>
        </el-form-item>
      </el-form>

      <div v-if="enrollPipeline.active" class="pipeline-panel">
        <div class="pipeline-stage">
          <div class="pipeline-preview">
            <img v-if="enrollPreviewUrl" :src="enrollPreviewUrl" alt="preview" />
            <div v-else class="pipeline-preview__empty"><i class="el-icon-user" /></div>
            <div
              class="pipeline-scan"
              :class="{
                'is-detect': enrollPipeline.stepIndex === 0,
                'is-align': enrollPipeline.stepIndex === 1,
                'is-embed': enrollPipeline.stepIndex === 2,
                'is-done': enrollPipeline.stepIndex >= 3 && !enrollPipeline.error,
                'is-error': !!enrollPipeline.error
              }"
            >
              <span class="pipeline-face-box" />
              <span class="pipeline-landmark pipeline-landmark--1" />
              <span class="pipeline-landmark pipeline-landmark--2" />
              <span class="pipeline-landmark pipeline-landmark--3" />
              <span class="pipeline-landmark pipeline-landmark--4" />
              <span class="pipeline-landmark pipeline-landmark--5" />
              <span class="pipeline-scanline" />
            </div>
          </div>
          <div class="pipeline-steps">
            <div
              v-for="(step, idx) in enrollPipeline.steps"
              :key="step.key"
              class="pipeline-step"
              :class="pipelineStepClass(enrollPipeline, idx)"
            >
              <div class="pipeline-step__dot">
                <i v-if="pipelineStepIcon(enrollPipeline, idx)" :class="pipelineStepIcon(enrollPipeline, idx)" />
                <span v-else>{{ idx + 1 }}</span>
              </div>
              <div class="pipeline-step__body">
                <div class="pipeline-step__title">{{ step.title }}</div>
                <div class="pipeline-step__desc">{{ pipelineStepDesc(enrollPipeline, idx, step) }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="pipeline-status" :class="{ 'is-error': !!enrollPipeline.error }">
          {{ enrollPipeline.error || enrollPipeline.statusText }}
        </div>
      </div>

      <span slot="footer">
        <el-button :disabled="enrollPipeline.active" @click="enrollVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="enrollPipeline.active"
          :disabled="enrollPipeline.active"
          @click="submitEnroll"
        >确定</el-button>
      </span>
    </el-dialog>

    <!-- 编辑姓名 -->
    <el-dialog title="编辑人员" :visible.sync="editVisible" width="520px">
      <el-form ref="editForm" :model="editForm" :rules="editRules" label-width="90px">
        <el-form-item label="人员编号">
          <el-input :value="editForm.person_code" disabled />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="editForm.name" maxlength="64" />
        </el-form-item>
        <el-form-item label="分组">
          <el-input v-model="editForm.group_name" maxlength="64" />
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="editForm.department" maxlength="64" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" maxlength="255" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="editForm.enabled" active-text="启用" inactive-text="停用" />
          <div class="form-hint">停用后不参与 1:N 识别</div>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitEdit">保存</el-button>
      </span>
    </el-dialog>

    <!-- 追加人脸 -->
    <el-dialog
      title="追加人脸"
      :visible.sync="addFaceVisible"
      :width="addFacePipeline.active ? '640px' : '480px'"
      :close-on-click-modal="!addFacePipeline.active"
      :close-on-press-escape="!addFacePipeline.active"
      :show-close="!addFacePipeline.active"
      @closed="resetAddFace"
    >
      <template v-if="!addFacePipeline.active">
        <p class="dialog-tip">为「{{ addFaceForm.person_code }} / {{ addFaceForm.name || '-' }}」再登记一张人脸。</p>
        <el-upload
          class="face-uploader"
          action="#"
          :auto-upload="false"
          :limit="1"
          accept="image/jpeg,image/png,image/jpg"
          list-type="picture-card"
          :file-list="addFaceFileList"
          :on-change="onAddFaceFileChange"
          :on-remove="onAddFaceFileRemove"
        >
          <i class="el-icon-plus" />
        </el-upload>
      </template>

      <div v-else class="pipeline-panel">
        <div class="pipeline-stage">
          <div class="pipeline-preview">
            <img v-if="addFacePreviewUrl" :src="addFacePreviewUrl" alt="preview" />
            <div v-else class="pipeline-preview__empty"><i class="el-icon-user" /></div>
            <div
              class="pipeline-scan"
              :class="{
                'is-detect': addFacePipeline.stepIndex === 0,
                'is-align': addFacePipeline.stepIndex === 1,
                'is-embed': addFacePipeline.stepIndex === 2,
                'is-done': addFacePipeline.stepIndex >= 3 && !addFacePipeline.error,
                'is-error': !!addFacePipeline.error
              }"
            >
              <span class="pipeline-face-box" />
              <span class="pipeline-landmark pipeline-landmark--1" />
              <span class="pipeline-landmark pipeline-landmark--2" />
              <span class="pipeline-landmark pipeline-landmark--3" />
              <span class="pipeline-landmark pipeline-landmark--4" />
              <span class="pipeline-landmark pipeline-landmark--5" />
              <span class="pipeline-scanline" />
            </div>
          </div>
          <div class="pipeline-steps">
            <div
              v-for="(step, idx) in addFacePipeline.steps"
              :key="step.key"
              class="pipeline-step"
              :class="pipelineStepClass(addFacePipeline, idx)"
            >
              <div class="pipeline-step__dot">
                <i v-if="pipelineStepIcon(addFacePipeline, idx)" :class="pipelineStepIcon(addFacePipeline, idx)" />
                <span v-else>{{ idx + 1 }}</span>
              </div>
              <div class="pipeline-step__body">
                <div class="pipeline-step__title">{{ step.title }}</div>
                <div class="pipeline-step__desc">{{ pipelineStepDesc(addFacePipeline, idx, step) }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="pipeline-status" :class="{ 'is-error': !!addFacePipeline.error }">
          {{ addFacePipeline.error || addFacePipeline.statusText }}
        </div>
      </div>

      <span slot="footer">
        <el-button :disabled="addFacePipeline.active" @click="addFaceVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="addFacePipeline.active"
          :disabled="addFacePipeline.active"
          @click="submitAddFace"
        >确定</el-button>
      </span>
    </el-dialog>

    <!-- 详情 -->
    <el-drawer :visible.sync="detailVisible" size="480px" title="人员详情" @closed="resetDetail">
      <div v-loading="detailLoading" class="detail-body">
        <template v-if="detail">
          <div class="detail-meta">
            <div><span class="label">人员编号</span>{{ detail.person_code }}</div>
            <div><span class="label">姓名</span>{{ detail.name || '-' }}</div>
            <div><span class="label">分组</span>{{ detail.group_name || '-' }}</div>
            <div><span class="label">部门</span>{{ detail.department || '-' }}</div>
            <div><span class="label">备注</span>{{ detail.remark || '-' }}</div>
            <div><span class="label">状态</span>{{ detail.enabled === false ? '停用' : '启用' }}</div>
            <div><span class="label">创建时间</span>{{ detail.created_at || '-' }}</div>
            <div><span class="label">模板数</span>{{ (detail.templates || []).length }}</div>
          </div>
          <div class="detail-section-title">人脸模板</div>
          <div v-if="!(detail.templates || []).length" class="empty-tip">暂无模板</div>
          <div class="template-grid">
            <div v-for="item in detail.templates || []" :key="item.id" class="template-card">
              <div class="template-frame">
                <el-image
                  v-if="templateUrl(item)"
                  :src="templateUrl(item)"
                  fit="contain"
                  class="template-img"
                  :preview-src-list="[templateUrl(item)]"
                />
                <div v-else class="template-img template-img--empty"><i class="el-icon-picture-outline" /></div>
              </div>
              <div class="template-meta">
                <div>#{{ item.id }}</div>
                <div>{{ item.created_at || '-' }}</div>
              </div>
              <el-button type="text" size="mini" class="danger-text" @click="removeTemplate(item)">删除模板</el-button>
            </div>
          </div>
        </template>
      </div>
    </el-drawer>

    <!-- 批量录入 -->
    <el-dialog
      title="批量录入（zip）"
      :visible.sync="batchVisible"
      width="640px"
      :close-on-click-modal="!batchProgress.active"
      :close-on-press-escape="!batchProgress.active"
      :show-close="!batchProgress.active"
      @closed="resetBatch"
    >
      <div v-show="!batchProgress.active">
        <div class="batch-guide">
          <p>请上传方案 B 格式的 <b>.zip</b> 压缩包（不超过 100MB）：</p>
          <pre class="batch-tree">faces.zip
  ├─ emp001_张三/
  │    ├─ 1.jpg
  │    └─ 2.jpg
  └─ emp002_李四/
       └─ 1.png</pre>
          <p class="form-hint">规则：每个子文件夹名 =「人员编号_姓名」；文件夹内放该人的一张或多张人脸图。同一编号多张图会追加为多条模板。从本页导出的压缩包含 manifest.json，会恢复分组、部门、备注和启停状态，并在每张登记照旁带上同名 .emb（512 维特征）。再次导入时直接使用这份特征，不再重新提取。</p>
        </div>
        <el-upload
          drag
          action="#"
          :auto-upload="false"
          :limit="1"
          accept=".zip,application/zip"
          :file-list="batchFileList"
          :on-change="onBatchFileChange"
          :on-remove="onBatchFileRemove"
        >
          <i class="el-icon-upload" />
          <div class="el-upload__text">将 zip 拖到此处，或<em>点击上传</em></div>
        </el-upload>
        <div class="batch-workers-row">
          <span class="batch-workers-label">并发数</span>
          <el-select
            v-model="batchWorkers"
            size="small"
            style="width: 120px"
            :disabled="batchProgress.active"
          >
            <el-option
              v-for="n in batchWorkerOptions"
              :key="n"
              :label="String(n)"
              :value="n"
            />
          </el-select>
          <span class="form-hint batch-workers-hint">
            服务端 CPU {{ batchCpuCores }} 核，默认 4；并发越高越快，也可能打满 Triton/GPU
          </span>
        </div>
        <div class="batch-workers-row">
          <span class="batch-workers-label">大头贴导入</span>
          <el-switch v-model="batchAsHeadshot" :disabled="batchProgress.active" />
          <span class="form-hint batch-workers-hint">
            打开后不做人脸检测，把压缩包里的原图直接缩成特征。适合没有 .emb 特征文件的大头贴。本页新导出的压缩包已带特征，导入时会自动跳过提取。
          </span>
        </div>
      </div>

      <div v-if="batchProgress.active" class="batch-progress-panel">
        <div class="batch-progress-head">
          <div class="batch-progress-title">
            <i class="el-icon-loading" />
            {{ batchProgressTitle }}
          </div>
          <div class="batch-progress-count">
            {{ batchProgress.current }} / {{ batchProgress.total || '—' }}
            <span v-if="batchProgress.totalPersons" class="batch-progress-sub">
              · 人员 {{ batchProgress.donePersons }}/{{ batchProgress.totalPersons }}
            </span>
          </div>
        </div>
        <el-progress
          :percentage="batchProgressPercent"
          :status="batchProgress.error ? 'exception' : (batchProgress.done ? 'success' : undefined)"
          :stroke-width="14"
        />
        <div class="batch-current">
          <div class="batch-current__label">
            {{ batchProgress.live ? '实时进度' : (batchProgress.waitingServer ? '处理状态' : '当前条目') }}
            <span v-if="batchProgress.workers">（并发 {{ batchProgress.workers }}）</span>
          </div>
          <div class="batch-current__value">{{ batchProgress.currentLabel || '准备中…' }}</div>
          <div v-if="batchProgress.waitingServer && !batchProgress.done && !batchProgress.error" class="batch-waiting-tip">
            服务端仍在处理中，请勿关闭窗口。
          </div>
          <div class="batch-mini-steps">
            <span
              v-for="(s, i) in batchProgress.miniSteps"
              :key="s"
              class="batch-mini-step"
              :class="batchMiniStepClass(i)"
            >{{ s }}</span>
          </div>
        </div>
        <div class="batch-log">
          <div v-for="(line, idx) in batchProgress.logs" :key="idx" class="batch-log__line">
            <span class="batch-log__time">{{ line.time }}</span>
            <span>{{ line.text }}</span>
          </div>
        </div>
        <div v-if="batchProgress.error" class="pipeline-status is-error">{{ batchProgress.error }}</div>
      </div>

      <div v-if="batchResult && !batchProgress.active" class="batch-result">
        <el-alert
          :title="batchResultTitle"
          :type="batchResult.failed_count ? 'warning' : 'success'"
          show-icon
          :closable="false"
        />
        <el-table
          v-if="(batchResult.failed || []).length"
          :data="batchResult.failed"
          size="mini"
          max-height="220"
          style="margin-top: 12px"
        >
          <el-table-column prop="folder" label="文件夹" min-width="120" />
          <el-table-column prop="file" label="文件" min-width="100" />
          <el-table-column prop="error" label="原因" min-width="180" />
        </el-table>
      </div>
      <span slot="footer">
        <el-button :disabled="batchProgress.active" @click="batchVisible = false">关闭</el-button>
        <el-button
          type="primary"
          :loading="batchProgress.active"
          :disabled="batchProgress.active"
          @click="submitBatch"
        >{{ batchResult ? '重新录入' : '开始录入' }}</el-button>
      </span>
    </el-dialog>

    <!-- 识别记录 -->
    <el-dialog title="识别记录" :visible.sync="logVisible" width="980px" @closed="resetLogs">
      <div class="log-filters">
        <el-input
          v-model="logKeyword"
          size="small"
          clearable
          placeholder="人员编号 / 姓名"
          style="width: 180px"
          @keyup.enter.native="reloadLogs"
        />
        <el-input
          v-model="logCamera"
          size="small"
          clearable
          placeholder="摄像头编号 / 名称"
          style="width: 180px"
          @keyup.enter.native="reloadLogs"
        />
        <el-select v-model="logMatched" size="small" clearable placeholder="全部状态" style="width: 120px">
          <el-option label="已登记" value="hit" />
          <el-option label="未登记" value="miss" />
        </el-select>
        <el-date-picker
          v-model="logRange"
          size="small"
          type="datetimerange"
          value-format="yyyy-MM-dd HH:mm:ss"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
        />
        <el-button type="primary" size="small" plain @click="reloadLogs">查询</el-button>
      </div>
      <p class="form-hint">
        视频识别时写入。默认同一摄像头、同一人员 30 秒内只记一次；未登记没有编号，按摄像头 30 秒记一条，抓拍取该帧里较大的一张脸。记录默认保留 30 天。
      </p>
      <el-table :data="logRows" v-loading="logLoading" size="small" max-height="420">
        <el-table-column label="抓拍" width="84" align="center">
          <template slot-scope="scope">
            <el-image
              v-if="logUrl(scope.row)"
              :src="logUrl(scope.row)"
              fit="contain"
              class="log-shot"
              :preview-src-list="[logUrl(scope.row)]"
            />
            <div v-else class="log-shot log-shot--empty"><i class="el-icon-picture-outline" /></div>
          </template>
        </el-table-column>
        <el-table-column label="人员" min-width="160">
          <template slot-scope="scope">
            <div>{{ scope.row.matched ? (scope.row.person_name || '未命名') : '未登记' }}</div>
            <div class="log-sub">{{ scope.row.person_code || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="摄像头" min-width="160">
          <template slot-scope="scope">
            <div>{{ scope.row.camera_name || '未命名摄像头' }}</div>
            <div class="log-sub">{{ scope.row.camera_id || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="occurred_at" label="时间" min-width="160" />
        <el-table-column label="距离" width="90" align="center">
          <template slot-scope="scope">
            {{ scope.row.distance == null ? '-' : Number(scope.row.distance).toFixed(4) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.matched ? 'success' : 'info'" size="mini">
              {{ scope.row.matched ? '已登记' : '未登记' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div class="face-pagination">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :current-page.sync="logPage"
          :page-size="logLimit"
          :total="logTotal"
          @current-change="loadLogs"
        />
      </div>
    </el-dialog>

    <!-- 1:N 检索 -->
    <el-dialog title="1:N 检索" :visible.sync="searchVisible" width="820px" @closed="resetSearch">
      <div class="search-toolbar">
        <el-upload
          action="#"
          :auto-upload="false"
          :limit="1"
          accept="image/jpeg,image/png,image/jpg"
          list-type="picture-card"
          :file-list="searchFileList"
          :on-change="onSearchChange"
          :on-remove="onSearchRemove"
        >
          <i class="el-icon-plus" />
        </el-upload>
        <div class="search-options">
          <div class="compare-label">现场照</div>
          <div class="search-topk">
            <span>返回人数</span>
            <el-input-number
              v-model="searchTopK"
              size="small"
              :min="1"
              :max="20"
              :step="1"
              controls-position="right"
            />
          </div>
          <p class="form-hint">
            在已启用的底库人员中，按余弦距离找出最接近的人。距离小于等于当前阈值记为命中；未达阈值的人仍会列出。一张图里有多张脸时，点选要检索的那一张。
          </p>
        </div>
      </div>
      <div v-if="searchResult" class="search-body">
        <div class="search-summary">
          检测到 {{ searchResult.face_count }} 张脸，启用人员 {{ searchResult.gallery_persons }}，阈值 {{ searchResult.threshold }}
        </div>
        <div v-if="(searchResult.faces || []).length > 1" class="search-faces">
          <button
            v-for="face in searchResult.faces"
            :key="face.index"
            type="button"
            class="search-face"
            :class="{ 'is-active': face.index === searchFaceIndex }"
            @click="searchFaceIndex = face.index"
          >
            <img :src="facePreview(face)" alt="" />
            <span>人脸 {{ face.index + 1 }}</span>
          </button>
        </div>
        <div v-if="activeSearchFace" class="search-panel">
          <div class="search-probe">
            <img :src="facePreview(activeSearchFace)" alt="" />
            <div>
              <div class="compare-label">当前检索人脸</div>
              <div class="form-hint">检测分 {{ Number(activeSearchFace.score).toFixed(3) }}，按对齐后的 112×112 特征检索</div>
            </div>
          </div>
          <div v-if="!(activeSearchFace.matches || []).length" class="empty-tip">底库里没有可检索的启用人员</div>
          <div v-else class="search-hits">
            <div v-for="item in activeSearchFace.matches" :key="item.person_code + '-' + item.rank" class="search-hit">
              <div class="search-hit__photo">
                <img v-if="searchUrl(item)" :src="searchUrl(item)" alt="" />
                <i v-else class="el-icon-user" />
              </div>
              <div class="search-hit__main">
                <div class="search-hit__title">
                  <span class="search-hit__rank">{{ item.rank }}</span>
                  <span>{{ item.name || '未命名' }}</span>
                  <span class="search-hit__code">{{ item.person_code }}</span>
                  <el-tag :type="item.matched ? 'success' : 'info'" size="mini">
                    {{ item.matched ? '命中' : '未达阈值' }}
                  </el-tag>
                </div>
                <div class="search-hit__meta">
                  {{ item.group_name || '未分组' }} / {{ item.department || '未填部门' }}
                  · 距离 {{ Number(item.distance).toFixed(4) }}
                  · 模板 #{{ item.template_id }}
                </div>
              </div>
              <el-button type="text" size="mini" @click="openDetail(item)">详情</el-button>
            </div>
          </div>
        </div>
      </div>
      <span slot="footer">
        <el-button @click="searchVisible = false">关闭</el-button>
        <el-button type="primary" :loading="searchLoading" @click="submitSearch">开始检索</el-button>
      </span>
    </el-dialog>

    <!-- 1:1 比对 -->
    <el-dialog title="1:1 人脸比对" :visible.sync="compareVisible" width="560px" @closed="resetCompare">
      <div class="compare-row">
        <div class="compare-col">
          <div class="compare-label">图片 A</div>
          <el-upload
            action="#"
            :auto-upload="false"
            :limit="1"
            accept="image/jpeg,image/png,image/jpg"
            list-type="picture-card"
            :file-list="compareAList"
            :on-change="(f, list) => onCompareChange('a', f, list)"
            :on-remove="() => onCompareRemove('a')"
          >
            <i class="el-icon-plus" />
          </el-upload>
        </div>
        <div class="compare-col">
          <div class="compare-label">图片 B</div>
          <el-upload
            action="#"
            :auto-upload="false"
            :limit="1"
            accept="image/jpeg,image/png,image/jpg"
            list-type="picture-card"
            :file-list="compareBList"
            :on-change="(f, list) => onCompareChange('b', f, list)"
            :on-remove="() => onCompareRemove('b')"
          >
            <i class="el-icon-plus" />
          </el-upload>
        </div>
      </div>
      <div v-if="compareResult" class="compare-result">
        <el-tag :type="compareResult.matched ? 'success' : 'danger'" size="medium">
          {{ compareResult.matched ? '判定为同一人' : '判定为不同人' }}
        </el-tag>
        <span>距离 {{ Number(compareResult.distance).toFixed(4) }}（阈值 {{ compareResult.threshold }}）</span>
      </div>
      <span slot="footer">
        <el-button @click="compareVisible = false">关闭</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCompare">开始比对</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import '../deviceManagement/asset-page.css'
import { faceGalleryAPI, formatApiError } from '../../service/VisionAIService'

const ENROLL_STEPS = [
  { key: 'detect', title: '人脸检测', desc: '定位面部区域', activeDesc: '正在检测人脸…', doneDesc: '已定位人脸框' },
  { key: 'align', title: '关键点对齐', desc: '五点对齐校正姿态', activeDesc: '正在对齐关键点…', doneDesc: '姿态已校正' },
  { key: 'embed', title: '特征提取', desc: '生成人脸特征向量', activeDesc: '正在提取特征…', doneDesc: '特征已生成' },
  { key: 'save', title: '写入底库', desc: '登记人员与模板', activeDesc: '正在写入底库…', doneDesc: '录入完成' }
]

function createPipelineState() {
  return {
    active: false,
    stepIndex: -1,
    error: '',
    statusText: '',
    steps: ENROLL_STEPS.map((s) => ({ ...s })),
    timer: null
  }
}

function createBatchProgressState() {
  return {
    active: false,
    done: false,
    live: false,
    waitingServer: false,
    error: '',
    total: 0,
    current: 0,
    totalPersons: 0,
    donePersons: 0,
    workers: 0,
    currentLabel: '',
    folders: [],
    miniSteps: ['检测', '对齐', '特征', '入库'],
    miniIndex: 0,
    waitPercent: 92,
    logs: [],
    timer: null,
    miniTimer: null,
    waitTimer: null
  }
}

function decodeZipName(bytes) {
  try {
    return new TextDecoder('utf-8').decode(bytes)
  } catch (e) {
    let s = ''
    for (let i = 0; i < bytes.length; i += 1) s += String.fromCharCode(bytes[i])
    try {
      return decodeURIComponent(escape(s))
    } catch (err) {
      return s
    }
  }
}

/** 轻量解析 zip 顶层人员文件夹名（方案 B） */
async function parseZipPersonFolders(file) {
  const buf = await file.arrayBuffer()
  const u8 = new Uint8Array(buf)
  const view = new DataView(buf)
  let eocd = -1
  const maxScan = Math.min(u8.length, 65557)
  for (let i = u8.length - 22; i >= u8.length - maxScan; i -= 1) {
    if (i < 0) break
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) return []
  const totalEntries = view.getUint16(eocd + 10, true)
  let offset = view.getUint32(eocd + 16, true)
  const folders = new Set()
  for (let n = 0; n < totalEntries; n += 1) {
    if (offset + 46 > u8.length || view.getUint32(offset, true) !== 0x02014b50) break
    const nameLen = view.getUint16(offset + 28, true)
    const extraLen = view.getUint16(offset + 30, true)
    const commentLen = view.getUint16(offset + 32, true)
    const nameBytes = u8.subarray(offset + 46, offset + 46 + nameLen)
    const name = decodeZipName(nameBytes).replace(/\\/g, '/')
    offset += 46 + nameLen + extraLen + commentLen
    if (!name || name.startsWith('__MACOSX')) continue
    const parts = name.split('/').filter(Boolean)
    if (!parts.length) continue
    const folder = parts[0]
    if (folder.includes('_')) folders.add(folder)
  }
  return Array.from(folders).sort()
}

export default {
  name: 'FaceGallery',
  data() {
    return {
      loading: false,
      submitting: false,
      batchDeleting: false,
      exporting: false,
      keyword: '',
      page: 1,
      limit: 20,
      total: 0,
      rows: [],
      selectedRows: [],
      stats: { person_total: 0, template_total: 0 },
      cosineThreshold: 0.68,
      savingThreshold: false,
      coverMap: {},
      templateMap: {},
      searchMap: {},
      logMap: {},
      logVisible: false,
      logLoading: false,
      logKeyword: '',
      logCamera: '',
      logMatched: '',
      logRange: [],
      logRows: [],
      logPage: 1,
      logLimit: 10,
      logTotal: 0,

      enrollVisible: false,
      enrollForm: { person_code: '', name: '', group_name: '', department: '', remark: '', enabled: true, image: null },
      enrollFileList: [],
      enrollPreviewUrl: '',
      enrollPipeline: createPipelineState(),
      enrollRules: {
        person_code: [{ required: true, message: '请输入人员编号', trigger: 'blur' }],
        image: [{
          validator: (rule, value, callback) => {
            if (!this.enrollForm.image) callback(new Error('请上传人脸照片'))
            else callback()
          },
          trigger: 'change'
        }]
      },

      editVisible: false,
      editForm: { person_code: '', name: '', group_name: '', department: '', remark: '', enabled: true },
      editRules: {
        name: [{ required: true, message: '请输入姓名', trigger: 'blur' }]
      },

      addFaceVisible: false,
      addFaceForm: { person_code: '', name: '', image: null },
      addFaceFileList: [],
      addFacePreviewUrl: '',
      addFacePipeline: createPipelineState(),

      detailVisible: false,
      detailLoading: false,
      detail: null,

      searchVisible: false,
      searchLoading: false,
      searchFile: null,
      searchFileList: [],
      searchTopK: 5,
      searchResult: null,
      searchFaceIndex: 0,

      compareVisible: false,
      compareA: null,
      compareB: null,
      compareAList: [],
      compareBList: [],
      compareResult: null,

      batchVisible: false,
      batchFile: null,
      batchFileList: [],
      batchResult: null,
      batchProgress: createBatchProgressState(),
      batchWorkers: 4,
      batchAsHeadshot: false,
      batchCpuCores: 4,
      batchWorkerOptions: [1, 2, 3, 4]
    }
  },
  computed: {
    batchProgressTitle() {
      const p = this.batchProgress
      if (p.done) return '录入完成，正在汇总结果…'
      if (p.waitingServer) return '等待服务端完成入库…'
      const workers = p.workers || this.batchWorkers
      return `正在批量录入人脸底库（并发 ${workers}）`
    },
    batchResultTitle() {
      const data = this.batchResult || {}
      const reused = Number(data.reused_embeddings) || 0
      const reusedText = reused ? `，直接使用已有特征 ${reused}` : ''
      return `成功人员 ${data.success_persons || 0}，新增模板 ${data.success_templates || 0}${reusedText}，重复跳过 ${data.skipped_duplicates || 0}，失败 ${data.failed_count || 0}`
    },
    activeSearchFace() {
      const faces = (this.searchResult && this.searchResult.faces) || []
      return faces.find((face) => face.index === this.searchFaceIndex) || faces[0] || null
    },
    batchProgressPercent() {
      const p = this.batchProgress
      if (p.done) return 100
      if (!p.total) return 8
      if (p.live) {
        const raw = Math.round((p.current / p.total) * 100)
        return Math.max(0, Math.min(99, raw === 100 ? 99 : raw))
      }
      if (p.waitingServer) return Math.max(92, Math.min(99, p.waitPercent || 96))
      const cappedCurrent = Math.min(p.current, Math.max(p.total - 1, 0))
      const raw = Math.round((cappedCurrent / p.total) * 100)
      return Math.max(2, Math.min(90, raw))
    }
  },
  created() {
    this.loadList()
    this.loadThreshold()
  },
  beforeDestroy() {
    this.stopPipeline(this.enrollPipeline)
    this.stopPipeline(this.addFacePipeline)
    this.stopBatchProgress()
    this.revokePreview('enrollPreviewUrl')
    this.revokePreview('addFacePreviewUrl')
    this.revokeAllUrls()
  },
  methods: {
    apiError(e, fallback) {
      return formatApiError(e, fallback) || fallback
    },
    coverUrl(row) {
      const key = row && row.cover_image_object
      return key ? this.coverMap[key] : ''
    },
    templateUrl(item) {
      const key = item && item.image_object
      return key ? this.templateMap[key] : ''
    },
    revokePreview(field) {
      if (this[field]) {
        URL.revokeObjectURL(this[field])
        this[field] = ''
      }
    },
    setPreviewFromFile(field, file) {
      this.revokePreview(field)
      if (file) this[field] = URL.createObjectURL(file)
    },
    revokeAllUrls() {
      Object.values(this.coverMap).forEach((url) => URL.revokeObjectURL(url))
      Object.values(this.templateMap).forEach((url) => URL.revokeObjectURL(url))
      this.revokeSearchMap()
      this.revokeLogMap()
      this.coverMap = {}
      this.templateMap = {}
    },
    pipelineStepClass(pipeline, idx) {
      if (pipeline.error && idx === pipeline.stepIndex) return 'is-error'
      if (idx < pipeline.stepIndex) return 'is-done'
      if (idx === pipeline.stepIndex) return 'is-active'
      return 'is-wait'
    },
    pipelineStepIcon(pipeline, idx) {
      if (pipeline.error && idx === pipeline.stepIndex) return 'el-icon-close'
      if (idx < pipeline.stepIndex) return 'el-icon-check'
      if (idx === pipeline.stepIndex) return 'el-icon-loading'
      return ''
    },
    pipelineStepDesc(pipeline, idx, step) {
      if (pipeline.error && idx === pipeline.stepIndex) return '处理失败'
      if (idx < pipeline.stepIndex) return step.doneDesc
      if (idx === pipeline.stepIndex) return step.activeDesc
      return step.desc
    },
    stopPipeline(pipeline) {
      if (pipeline && pipeline.timer) {
        clearInterval(pipeline.timer)
        pipeline.timer = null
      }
    },
    startPipeline(pipeline, statusText) {
      this.stopPipeline(pipeline)
      pipeline.active = true
      pipeline.stepIndex = 0
      pipeline.error = ''
      pipeline.statusText = statusText || '算法流水线运行中…'
      pipeline.timer = setInterval(() => {
        if (pipeline.stepIndex < pipeline.steps.length - 1) {
          pipeline.stepIndex += 1
        }
      }, 780)
    },
    finishPipeline(pipeline, ok, errorMsg) {
      this.stopPipeline(pipeline)
      if (ok) {
        pipeline.stepIndex = pipeline.steps.length
        pipeline.error = ''
        pipeline.statusText = '全部步骤完成'
      } else {
        if (pipeline.stepIndex < 0) pipeline.stepIndex = 0
        pipeline.error = errorMsg || '录入失败'
        pipeline.statusText = pipeline.error
      }
    },
    async runWithPipeline(pipeline, requestPromise) {
      this.startPipeline(pipeline)
      const started = Date.now()
      try {
        const result = await requestPromise
        const waitMore = Math.max(0, 2200 - (Date.now() - started))
        if (waitMore) await new Promise((r) => setTimeout(r, waitMore))
        this.finishPipeline(pipeline, true)
        await new Promise((r) => setTimeout(r, 420))
        return { ok: true, result }
      } catch (e) {
        const msg = typeof e === 'string' ? e : this.apiError(e, '处理失败')
        this.finishPipeline(pipeline, false, msg)
        await new Promise((r) => setTimeout(r, 700))
        return { ok: false, error: msg }
      } finally {
        pipeline.active = false
        this.stopPipeline(pipeline)
      }
    },
    stopBatchProgress() {
      const p = this.batchProgress
      if (p.timer) {
        clearInterval(p.timer)
        p.timer = null
      }
      if (p.miniTimer) {
        clearInterval(p.miniTimer)
        p.miniTimer = null
      }
      if (p.waitTimer) {
        clearInterval(p.waitTimer)
        p.waitTimer = null
      }
    },
    batchMiniStepClass(i) {
      const p = this.batchProgress
      if (p.error && i === p.miniIndex) return 'is-error'
      if (p.done || p.waitingServer) return 'is-done'
      if (i < p.miniIndex) return 'is-done'
      if (i === p.miniIndex) return 'is-active'
      return ''
    },
    enterBatchWaitingServer() {
      const p = this.batchProgress
      if (p.waitingServer || p.done || p.error) return
      p.waitingServer = true
      p.waitPercent = 92
      p.miniIndex = p.miniSteps.length
      p.currentLabel = '本地预览进度已到末尾，正在等待服务端完成全部入库…'
      this.pushBatchLog('等待服务端返回批量录入结果…')
      if (p.timer) {
        clearInterval(p.timer)
        p.timer = null
      }
      if (p.miniTimer) {
        clearInterval(p.miniTimer)
        p.miniTimer = null
      }
      p.waitTimer = setInterval(() => {
        if (p.done || p.error) return
        if (p.waitPercent < 99) p.waitPercent += 1
      }, 4000)
    },
    pushBatchLog(text) {
      const now = new Date()
      const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
        .map((n) => String(n).padStart(2, '0'))
        .join(':')
      this.batchProgress.logs.unshift({ time, text })
      if (this.batchProgress.logs.length > 8) this.batchProgress.logs.length = 8
    },
    startBatchProgress(folders, options = {}) {
      this.stopBatchProgress()
      const list = folders && folders.length ? folders.slice() : []
      const live = !!options.live
      const workers = Number(options.workers) || this.batchWorkers || 4
      this.batchProgress = {
        ...createBatchProgressState(),
        active: true,
        live,
        workers,
        total: live ? 0 : (list.length || 1),
        current: 0,
        totalPersons: list.length || 0,
        donePersons: 0,
        folders: list,
        currentLabel: live ? '正在上传压缩包并启动并发录入…' : (list[0] || '解析人员目录…'),
        waitPercent: 92
      }
      this.pushBatchLog(list.length
        ? `已解析 ${list.length} 个人员文件夹，并发 ${workers} 开始录入`
        : `并发 ${workers}，等待服务端解析压缩包`)
      // 实时模式下只轮播小步骤；计数由服务端 progress 事件驱动
      this.batchProgress.miniTimer = setInterval(() => {
        const p = this.batchProgress
        if (p.done || p.error || p.waitingServer) return
        p.miniIndex = (p.miniIndex + 1) % p.miniSteps.length
      }, 520)
      if (!live) {
        const tickMs = Math.max(1200, Math.min(3500, Math.round(2500 / Math.max(workers, 1))))
        this.batchProgress.timer = setInterval(() => {
          const p = this.batchProgress
          if (p.done || p.error || p.waitingServer) return
          const softCap = Math.max(p.total - 1, 0)
          const step = Math.max(1, workers)
          if (p.current < softCap) {
            p.current = Math.min(softCap, p.current + step)
            const idx = p.current - 1
            const folder = p.folders[idx]
            p.currentLabel = folder
              ? `第 ${p.current} 人：${folder}`
              : `正在处理第 ${p.current} / ${p.total} 条`
            if (folder) this.pushBatchLog(`录入 ${folder}`)
            p.miniIndex = 0
            if (p.current >= softCap) this.enterBatchWaitingServer()
          } else {
            this.enterBatchWaitingServer()
          }
        }, tickMs)
      }
    },
    applyBatchStreamEvent(evt) {
      if (!evt || !evt.event) return
      const p = this.batchProgress
      if (evt.event === 'start') {
        p.live = true
        p.workers = Number(evt.workers) || p.workers || this.batchWorkers
        p.total = Number(evt.total_images) || p.total || 0
        p.totalPersons = Number(evt.total_persons) || p.totalPersons || 0
        p.current = 0
        p.donePersons = 0
        p.currentLabel = `服务端已启动，并发 ${p.workers}，共 ${p.total} 张图`
        if (Array.isArray(evt.folders) && evt.folders.length) {
          p.folders = evt.folders.slice()
        }
        this.pushBatchLog(`服务端开始处理：${p.total} 张图 / ${p.totalPersons} 人，并发 ${p.workers}`)
        const vectors = Number(evt.embedding_files) || 0
        if (vectors) this.pushBatchLog(`其中 ${vectors} 条带有已导出特征，直接入库，不再重新提取`)
        return
      }
      if (evt.event === 'progress') {
        p.live = true
        p.waitingServer = false
        p.current = Number(evt.done_images) || p.current
        p.total = Number(evt.total_images) || p.total
        p.donePersons = Number(evt.done_persons) || p.donePersons
        p.totalPersons = Number(evt.total_persons) || p.totalPersons
        if (evt.workers) p.workers = Number(evt.workers) || p.workers
        const folder = evt.folder || ''
        const file = evt.file || ''
        p.currentLabel = folder
          ? `${folder}${file ? ' / ' + file : ''}（${p.current}/${p.total}）`
          : `已完成 ${p.current}/${p.total}`
        p.miniIndex = evt.ok === false ? p.miniSteps.length - 1 : (p.miniIndex + 1) % p.miniSteps.length
        if (folder) {
          const reused = evt.reused_embedding ? '（已有特征）' : ''
          this.pushBatchLog(`${evt.ok === false ? '失败' : '完成'} ${folder}${file ? '/' + file : ''}${reused}`)
        }
      }
    },
    finishBatchProgress(ok, errorMsg) {
      this.stopBatchProgress()
      this.batchProgress.waitingServer = false
      this.batchProgress.done = true
      if (this.batchProgress.total) {
        this.batchProgress.current = this.batchProgress.total
      }
      if (this.batchProgress.totalPersons) {
        this.batchProgress.donePersons = this.batchProgress.totalPersons
      }
      this.batchProgress.miniIndex = this.batchProgress.miniSteps.length
      this.batchProgress.waitPercent = 100
      if (ok) {
        this.batchProgress.error = ''
        this.batchProgress.currentLabel = '全部条目处理完成'
        this.pushBatchLog('批量录入请求完成')
      } else {
        this.batchProgress.error = errorMsg || '批量录入失败'
        this.pushBatchLog(this.batchProgress.error)
      }
    },
    async ensureImageUrl(objectKey, mapName) {
      if (!objectKey || this[mapName][objectKey]) return
      try {
        const res = await faceGalleryAPI.getImageBlob(objectKey)
        const url = URL.createObjectURL(res.data)
        this.$set(this[mapName], objectKey, url)
      } catch (e) {
        // 预览失败时静默，列表仍可用
      }
    },
    async prefetchCovers(rows) {
      await Promise.all((rows || []).map((row) => this.ensureImageUrl(row.cover_image_object, 'coverMap')))
    },
    loadThreshold() {
      faceGalleryAPI.getSettings().then((res) => {
        const body = res.data || {}
        if (body.code !== 0) return
        const value = Number((body.data || {}).cosine_threshold)
        if (!Number.isNaN(value)) this.cosineThreshold = value
      }).catch(() => {})
    },
    saveThreshold() {
      const value = Number(this.cosineThreshold)
      if (Number.isNaN(value) || value < 0 || value > 2) {
        this.$message.warning('阈值需在 0 到 2 之间')
        return
      }
      this.savingThreshold = true
      faceGalleryAPI.updateSettings({ cosine_threshold: value }).then((res) => {
        const body = res.data || {}
        if (body.code !== 0) {
          this.$message.error(body.msg || '保存阈值失败')
          return
        }
        this.cosineThreshold = Number((body.data || {}).cosine_threshold)
        this.$message.success('比对阈值已更新')
      }).catch((e) => {
        this.$message.error(this.apiError(e, '保存阈值失败'))
      }).finally(() => {
        this.savingThreshold = false
      })
    },
    reloadFirstPage() {
      this.page = 1
      this.loadList()
    },
    loadList() {
      this.loading = true
      faceGalleryAPI.listPersons({
        keyword: (this.keyword || '').trim(),
        page: this.page,
        limit: this.limit
      }).then((res) => {
        const body = res.data || {}
        if (body.code !== 0) {
          this.$message.error(body.msg || '加载失败')
          return
        }
        const data = body.data || {}
        this.rows = data.items || []
        this.total = body.total || 0
        this.stats = data.stats || { person_total: 0, template_total: 0 }
        this.prefetchCovers(this.rows)
      }).catch((e) => {
        this.$message.error(this.apiError(e, '加载人脸底库失败'))
      }).finally(() => {
        this.loading = false
      })
    },

    openEnroll() {
      this.resetEnroll()
      this.enrollVisible = true
    },
    resetEnroll() {
      this.stopPipeline(this.enrollPipeline)
      this.enrollPipeline = createPipelineState()
      this.enrollForm = { person_code: '', name: '', group_name: '', department: '', remark: '', enabled: true, image: null }
      this.enrollFileList = []
      this.revokePreview('enrollPreviewUrl')
      if (this.$refs.enrollForm) this.$refs.enrollForm.clearValidate()
    },
    onEnrollFileChange(file, list) {
      this.enrollFileList = list.slice(-1)
      this.enrollForm.image = (file && file.raw) || null
      this.setPreviewFromFile('enrollPreviewUrl', this.enrollForm.image)
    },
    onEnrollFileRemove() {
      this.enrollFileList = []
      this.enrollForm.image = null
      this.revokePreview('enrollPreviewUrl')
    },
    submitEnroll() {
      this.$refs.enrollForm.validate(async (ok) => {
        if (!ok) return
        const fd = new FormData()
        fd.append('person_code', (this.enrollForm.person_code || '').trim())
        fd.append('name', (this.enrollForm.name || '').trim())
        fd.append('group_name', (this.enrollForm.group_name || '').trim())
        fd.append('department', (this.enrollForm.department || '').trim())
        fd.append('remark', (this.enrollForm.remark || '').trim())
        fd.append('enabled', this.enrollForm.enabled ? 'true' : 'false')
        fd.append('image', this.enrollForm.image)
        const outcome = await this.runWithPipeline(this.enrollPipeline, faceGalleryAPI.createPerson(fd).then((res) => {
          const body = res.data || {}
          if (body.code !== 0) throw body.msg || '录入失败'
          return body
        }))
        if (!outcome.ok) {
          this.$message.error(outcome.error || '录入失败')
          return
        }
        this.$message.success('录入成功')
        this.enrollVisible = false
        this.reloadFirstPage()
      })
    },

    openEdit(row) {
      this.editForm = {
        person_code: row.person_code,
        name: row.name || '',
        group_name: row.group_name || '',
        department: row.department || '',
        remark: row.remark || '',
        enabled: row.enabled !== false
      }
      this.editVisible = true
    },
    submitEdit() {
      this.$refs.editForm.validate((ok) => {
        if (!ok) return
        this.submitting = true
        faceGalleryAPI.updatePerson(this.editForm.person_code, {
          name: (this.editForm.name || '').trim(),
          group_name: (this.editForm.group_name || '').trim(),
          department: (this.editForm.department || '').trim(),
          remark: (this.editForm.remark || '').trim(),
          enabled: !!this.editForm.enabled
        }).then((res) => {
          const body = res.data || {}
          if (body.code !== 0) {
            this.$message.error(body.msg || '保存失败')
            return
          }
          this.$message.success('已保存')
          this.editVisible = false
          this.loadList()
        }).catch((e) => {
          this.$message.error(this.apiError(e, '保存失败'))
        }).finally(() => {
          this.submitting = false
        })
      })
    },

    openAddFace(row) {
      this.resetAddFace()
      this.addFaceForm = {
        person_code: row.person_code,
        name: row.name || '',
        image: null
      }
      this.addFaceVisible = true
    },
    resetAddFace() {
      this.stopPipeline(this.addFacePipeline)
      this.addFacePipeline = createPipelineState()
      this.addFaceForm = { person_code: '', name: '', image: null }
      this.addFaceFileList = []
      this.revokePreview('addFacePreviewUrl')
    },
    onAddFaceFileChange(file, list) {
      this.addFaceFileList = list.slice(-1)
      this.addFaceForm.image = (file && file.raw) || null
      this.setPreviewFromFile('addFacePreviewUrl', this.addFaceForm.image)
    },
    onAddFaceFileRemove() {
      this.addFaceFileList = []
      this.addFaceForm.image = null
      this.revokePreview('addFacePreviewUrl')
    },
    async submitAddFace() {
      if (!this.addFaceForm.image) {
        this.$message.warning('请上传人脸照片')
        return
      }
      const personCode = this.addFaceForm.person_code
      const fd = new FormData()
      fd.append('image', this.addFaceForm.image)
      const outcome = await this.runWithPipeline(this.addFacePipeline, faceGalleryAPI.addTemplate(personCode, fd).then((res) => {
        const body = res.data || {}
        if (body.code !== 0) throw body.msg || '追加失败'
        return body
      }))
      if (!outcome.ok) {
        this.$message.error(outcome.error || '追加失败')
        return
      }
      this.$message.success('追加成功')
      this.addFaceVisible = false
      this.loadList()
      if (this.detailVisible && this.detail && this.detail.person_code === personCode) {
        this.openDetail({ person_code: personCode })
      }
    },

    onSelectionChange(rows) {
      this.selectedRows = rows || []
    },
    clearSelection() {
      this.selectedRows = []
      if (this.$refs.personTable) this.$refs.personTable.clearSelection()
    },
    removePerson(row) {
      this.$confirm(`确定删除人员「${row.person_code}」及其全部人脸模板吗？`, '提示', {
        type: 'warning'
      }).then(() => {
        return faceGalleryAPI.deletePerson(row.person_code)
      }).then((res) => {
        const body = res.data || {}
        if (body.code !== 0) {
          this.$message.error(body.msg || '删除失败')
          return
        }
        this.$message.success('已删除')
        this.clearSelection()
        this.reloadFirstPage()
      }).catch((e) => {
        if (e === 'cancel') return
        this.$message.error(this.apiError(e, '删除失败'))
      })
    },
    batchRemovePersons() {
      const codes = (this.selectedRows || [])
        .map((row) => row && row.person_code)
        .filter(Boolean)
      if (!codes.length) {
        this.$message.warning('请先勾选要删除的人员')
        return
      }
      this.$confirm(
        `确定删除选中的 ${codes.length} 名人员及其全部人脸模板吗？此操作不可恢复。`,
        '批量删除',
        { type: 'warning' }
      ).then(() => {
        this.batchDeleting = true
        return faceGalleryAPI.batchDeletePersons(codes)
      }).then((res) => {
        const body = res.data || {}
        if (body.code !== 0) {
          this.$message.error(body.msg || '批量删除失败')
          return
        }
        const data = body.data || {}
        const deleted = data.deleted_count || 0
        const failed = data.failed_count || 0
        const missing = (data.missing || []).length
        if (failed || missing) {
          this.$message.warning(`已删除 ${deleted} 人，失败 ${failed}，不存在 ${missing}`)
        } else {
          this.$message.success(`已删除 ${deleted} 人`)
        }
        this.clearSelection()
        this.reloadFirstPage()
      }).catch((e) => {
        if (e === 'cancel') return
        this.$message.error(this.apiError(e, '批量删除失败'))
      }).finally(() => {
        this.batchDeleting = false
      })
    },

    openDetail(row) {
      this.detailVisible = true
      this.detailLoading = true
      this.detail = null
      faceGalleryAPI.getPerson(row.person_code).then(async (res) => {
        const body = res.data || {}
        if (body.code !== 0) {
          this.$message.error(body.msg || '加载详情失败')
          return
        }
        this.detail = body.data || null
        const templates = (this.detail && this.detail.templates) || []
        await Promise.all(templates.map((item) => this.ensureImageUrl(item.image_object, 'templateMap')))
      }).catch((e) => {
        this.$message.error(this.apiError(e, '加载详情失败'))
      }).finally(() => {
        this.detailLoading = false
      })
    },
    resetDetail() {
      this.detail = null
    },
    removeTemplate(item) {
      this.$confirm(`确定删除模板 #${item.id} 吗？`, '提示', { type: 'warning' }).then(() => {
        return faceGalleryAPI.deleteTemplate(item.id)
      }).then((res) => {
        const body = res.data || {}
        if (body.code !== 0) {
          this.$message.error(body.msg || '删除失败')
          return
        }
        this.$message.success('模板已删除')
        this.loadList()
        if (this.detail && this.detail.person_code) {
          this.openDetail({ person_code: this.detail.person_code })
        }
      }).catch((e) => {
        if (e === 'cancel') return
        this.$message.error(this.apiError(e, '删除失败'))
      })
    },

    async exportGallery() {
      const codes = (this.selectedRows || []).map((row) => row && row.person_code).filter(Boolean)
      this.exporting = true
      try {
        const res = await faceGalleryAPI.exportZip(codes)
        const blob = res.data
        const type = (blob && blob.type) || ''
        if (type.includes('json') || type.includes('text')) {
          const text = await blob.text()
          let msg = '导出失败'
          try {
            const body = JSON.parse(text)
            msg = body.detail || body.msg || msg
          } catch (e) {
            if (text) msg = text
          }
          this.$message.error(typeof msg === 'string' ? msg : '导出失败')
          return
        }
        const persons = res.headers['x-export-persons']
        const images = res.headers['x-export-images']
        const embeddings = res.headers['x-export-embeddings']
        const skipped = Number(res.headers['x-export-skipped'] || 0)
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'face_gallery_scheme_b.zip'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        const scope = codes.length ? `选中 ${codes.length} 人` : '全部人员'
        const extra = skipped ? `，跳过 ${skipped} 条` : ''
        const vectors = embeddings ? ` / ${embeddings} 条特征` : ''
        this.$message.success(`已导出${scope}（${persons || '-'} 人 / ${images || '-'} 张${vectors}）${extra}`)
      } catch (e) {
        let msg = this.apiError(e, '导出失败')
        const data = e && e.response && e.response.data
        if (data && typeof data.text === 'function') {
          try {
            const text = await data.text()
            const body = JSON.parse(text)
            msg = body.detail || body.msg || msg
          } catch (err) {
            // 保留默认错误
          }
        }
        this.$message.error(msg)
      } finally {
        this.exporting = false
      }
    },
    openBatch() {
      this.resetBatch()
      this.batchVisible = true
      this.loadBatchOptions()
    },
    applyBatchOptions(data) {
      const cores = Math.max(1, Math.min(Number((data && data.cpu_cores) || 4) || 4, 32))
      const defaultWorkers = Math.max(1, Math.min(Number((data && data.default_workers) || 4) || 4, cores))
      this.batchCpuCores = cores
      this.batchWorkerOptions = Array.from({ length: cores }, (_, i) => i + 1)
      this.batchWorkers = defaultWorkers
    },
    loadBatchOptions() {
      faceGalleryAPI.getBatchOptions().then((res) => {
        const body = res.data || {}
        if (body.code !== 0) {
          this.applyBatchOptions(null)
          return
        }
        this.applyBatchOptions(body.data || {})
      }).catch(() => {
        // 接口不可用时，退回本机逻辑核心数，默认仍取 4
        const localCores = Math.max(1, Math.min(Number(navigator.hardwareConcurrency) || 4, 32))
        this.applyBatchOptions({
          cpu_cores: localCores,
          default_workers: Math.min(4, localCores)
        })
      })
    },
    resetBatch() {
      this.stopBatchProgress()
      this.batchProgress = createBatchProgressState()
      this.batchFile = null
      this.batchFileList = []
      this.batchResult = null
      // 保留已加载的 CPU 并发选项，仅在尚未加载时落到默认 4
      if (!this.batchWorkerOptions || !this.batchWorkerOptions.length) {
        this.applyBatchOptions(null)
      } else {
        const max = this.batchCpuCores || 4
        this.batchWorkers = Math.max(1, Math.min(this.batchWorkers || 4, max))
      }
    },
    onBatchFileChange(file, list) {
      this.batchFileList = list.slice(-1)
      this.batchFile = (file && file.raw) || null
      this.batchResult = null
    },
    onBatchFileRemove() {
      this.batchFile = null
      this.batchFileList = []
      this.batchResult = null
    },
    async submitBatch() {
      if (!this.batchFile) {
        this.$message.warning('请先选择 zip 压缩包')
        return
      }
      const name = (this.batchFile.name || '').toLowerCase()
      if (!name.endsWith('.zip')) {
        this.$message.warning('请上传 .zip 文件')
        return
      }
      const workers = Math.max(1, Math.min(Number(this.batchWorkers) || 4, this.batchCpuCores || 32))
      this.batchWorkers = workers
      this.batchResult = null
      let folders = []
      try {
        folders = await parseZipPersonFolders(this.batchFile)
      } catch (e) {
        folders = []
      }
      this.startBatchProgress(folders, { live: true, workers })
      const fd = new FormData()
      fd.append('file', this.batchFile)
      fd.append('workers', String(workers))
      fd.append('as_headshot', this.batchAsHeadshot ? 'true' : 'false')
      if (this.batchAsHeadshot) this.pushBatchLog('已关闭人脸检测，按大头贴原图提取特征')
      try {
        const data = await faceGalleryAPI.batchEnrollStream(fd, (evt) => {
          this.applyBatchStreamEvent(evt)
        })
        if (data && data.person_folder_count && !this.batchProgress.totalPersons) {
          this.batchProgress.totalPersons = data.person_folder_count
        }
        this.finishBatchProgress(true)
        await new Promise((r) => setTimeout(r, 350))
        this.batchProgress.active = false
        this.batchResult = data || null
        const failed = (data && data.failed_count) || 0
        this.$message[failed ? 'warning' : 'success'](
          failed ? '批量录入完成（部分失败，见下方明细）' : '批量录入成功'
        )
        this.reloadFirstPage()
      } catch (e) {
        const msg = typeof e === 'string' ? e : ((e && e.message) || this.apiError(e, '批量录入失败'))
        this.finishBatchProgress(false, msg)
        await new Promise((r) => setTimeout(r, 650))
        this.batchProgress.active = false
        this.$message.error(msg)
      }
    },

    facePreview(face) {
      if (!face || !face.aligned_jpeg) return ''
      return `data:image/jpeg;base64,${face.aligned_jpeg}`
    },
    searchUrl(item) {
      const key = item && item.image_object
      return key ? this.searchMap[key] : ''
    },
    revokeSearchMap() {
      Object.values(this.searchMap).forEach((url) => URL.revokeObjectURL(url))
      this.searchMap = {}
    },
    logUrl(row) {
      const key = row && row.image_object
      return key ? this.logMap[key] : ''
    },
    revokeLogMap() {
      Object.values(this.logMap).forEach((url) => URL.revokeObjectURL(url))
      this.logMap = {}
    },
    openLogs() {
      this.logVisible = true
      this.reloadLogs()
    },
    resetLogs() {
      this.logRows = []
      this.logTotal = 0
      this.revokeLogMap()
    },
    reloadLogs() {
      this.logPage = 1
      this.loadLogs()
    },
    loadLogs() {
      const params = {
        keyword: (this.logKeyword || '').trim(),
        camera: (this.logCamera || '').trim(),
        page: this.logPage,
        limit: this.logLimit
      }
      if (this.logMatched === 'hit') params.matched = true
      if (this.logMatched === 'miss') params.matched = false
      if (this.logRange && this.logRange.length === 2) {
        params.start = this.logRange[0]
        params.end = this.logRange[1]
      }
      this.logLoading = true
      faceGalleryAPI.listLogs(params).then(async (res) => {
        const body = res.data || {}
        if (body.code !== 0) {
          this.$message.error(body.msg || '加载识别记录失败')
          return
        }
        const data = body.data || {}
        this.logRows = data.items || []
        this.logTotal = body.total || 0
        await Promise.all(this.logRows.map((row) => this.ensureImageUrl(row.image_object, 'logMap')))
      }).catch((e) => {
        this.$message.error(this.apiError(e, '加载识别记录失败'))
      }).finally(() => {
        this.logLoading = false
      })
    },
    openSearch() {
      this.resetSearch()
      this.searchVisible = true
    },
    resetSearch() {
      this.searchFile = null
      this.searchFileList = []
      this.searchTopK = 5
      this.searchResult = null
      this.searchFaceIndex = 0
      this.revokeSearchMap()
    },
    onSearchChange(file, list) {
      this.searchFileList = list.slice(-1)
      this.searchFile = (file && file.raw) || null
      this.searchResult = null
      this.searchFaceIndex = 0
    },
    onSearchRemove() {
      this.searchFileList = []
      this.searchFile = null
      this.searchResult = null
      this.searchFaceIndex = 0
    },
    submitSearch() {
      if (!this.searchFile) {
        this.$message.warning('请上传一张现场照')
        return
      }
      const topK = Number(this.searchTopK)
      if (!Number.isInteger(topK) || topK < 1 || topK > 20) {
        this.$message.warning('返回人数需在 1 到 20 之间')
        return
      }
      const fd = new FormData()
      fd.append('image', this.searchFile)
      fd.append('top_k', String(topK))
      this.searchLoading = true
      faceGalleryAPI.search(fd).then(async (res) => {
        const body = res.data || {}
        if (body.code !== 0) {
          this.$message.error(body.msg || '检索失败')
          return
        }
        const data = body.data || null
        this.searchResult = data
        this.searchFaceIndex = 0
        const faces = (data && data.faces) || []
        const keys = []
        faces.forEach((face) => {
          ;(face.matches || []).forEach((item) => {
            if (item.image_object) keys.push(item.image_object)
          })
        })
        await Promise.all(keys.map((key) => this.ensureImageUrl(key, 'searchMap')))
      }).catch((e) => {
        this.$message.error(this.apiError(e, '检索失败'))
      }).finally(() => {
        this.searchLoading = false
      })
    },
    openCompare() {
      this.resetCompare()
      this.compareVisible = true
    },
    resetCompare() {
      this.compareA = null
      this.compareB = null
      this.compareAList = []
      this.compareBList = []
      this.compareResult = null
    },
    onCompareChange(side, file, list) {
      if (side === 'a') {
        this.compareAList = list.slice(-1)
        this.compareA = (file && file.raw) || null
      } else {
        this.compareBList = list.slice(-1)
        this.compareB = (file && file.raw) || null
      }
      this.compareResult = null
    },
    onCompareRemove(side) {
      if (side === 'a') {
        this.compareAList = []
        this.compareA = null
      } else {
        this.compareBList = []
        this.compareB = null
      }
      this.compareResult = null
    },
    submitCompare() {
      if (!this.compareA || !this.compareB) {
        this.$message.warning('请上传两张人脸照片')
        return
      }
      const fd = new FormData()
      fd.append('image_a', this.compareA)
      fd.append('image_b', this.compareB)
      this.submitting = true
      faceGalleryAPI.compare(fd).then((res) => {
        const body = res.data || {}
        if (body.code !== 0) {
          this.$message.error(body.msg || '比对失败')
          return
        }
        this.compareResult = body.data || null
      }).catch((e) => {
        this.$message.error(this.apiError(e, '比对失败'))
      }).finally(() => {
        this.submitting = false
      })
    }
  }
}
</script>

<style scoped>
.face-cover {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #eef2f7;
}
.face-cover--empty {
  color: #909399;
  font-size: 20px;
}
.face-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 12px 0 0;
  flex-shrink: 0;
}
.danger-text {
  color: #f56c6c;
}
.threshold-label {
  margin-left: 8px;
  font-size: 13px;
  color: #606266;
}
.form-hint,
.dialog-tip,
.empty-tip {
  color: #909399;
  font-size: 12px;
  line-height: 1.6;
}
.detail-body {
  padding: 0 20px 24px;
}
.detail-meta {
  display: grid;
  gap: 10px;
  margin-bottom: 18px;
  font-size: 14px;
}
.detail-meta .label {
  display: inline-block;
  width: 72px;
  color: #909399;
}
.detail-section-title {
  font-weight: 600;
  margin-bottom: 12px;
}
.template-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.template-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 10px;
  background: #fff;
}
.template-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 6px;
  overflow: hidden;
  background: #111827;
}
.template-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
.template-img >>> .el-image__inner {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.template-img--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 28px;
}
.template-meta {
  margin-top: 8px;
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
}
.compare-row {
  display: flex;
  gap: 24px;
}
.compare-col {
  flex: 1;
}
.compare-label {
  margin-bottom: 8px;
  font-weight: 600;
}
.compare-result {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.log-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}
.log-shot {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  background: #111827;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.log-shot >>> .el-image__inner {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.log-shot--empty {
  color: #c0c4cc;
  font-size: 18px;
}
.log-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #909399;
}
.search-toolbar {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}
.search-options {
  flex: 1;
  min-width: 0;
}
.search-topk {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #606266;
}
.search-body {
  margin-top: 16px;
}
.search-summary {
  margin-bottom: 12px;
  font-size: 13px;
  color: #606266;
}
.search-faces {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}
.search-face {
  width: 72px;
  padding: 4px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}
.search-face img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: contain;
  background: #111827;
  border-radius: 4px;
  display: block;
}
.search-face span {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #606266;
  text-align: center;
}
.search-face.is-active {
  border-color: #409eff;
  box-shadow: 0 0 0 1px #409eff;
}
.search-probe {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.search-probe img {
  width: 72px;
  height: 72px;
  object-fit: contain;
  background: #111827;
  border-radius: 8px;
}
.search-hits {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 360px;
  overflow: auto;
}
.search-hit {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}
.search-hit__photo {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  background: #111827;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 22px;
}
.search-hit__photo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
.search-hit__main {
  flex: 1;
  min-width: 0;
}
.search-hit__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
}
.search-hit__rank {
  width: 22px;
  height: 22px;
  border-radius: 11px;
  background: #ecf5ff;
  color: #409eff;
  font-size: 12px;
  line-height: 22px;
  text-align: center;
}
.search-hit__code {
  font-weight: 400;
  color: #909399;
  font-size: 12px;
}
.search-hit__meta {
  margin-top: 4px;
  font-size: 12px;
  color: #606266;
}
.batch-guide {
  margin-bottom: 14px;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}
.batch-workers-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}
.batch-workers-label {
  font-size: 13px;
  color: #606266;
  font-weight: 600;
}
.batch-workers-hint {
  margin: 0;
}
.batch-tree {
  margin: 8px 0 10px;
  padding: 10px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre;
  overflow-x: auto;
}
.batch-result {
  margin-top: 14px;
}
.face-uploader >>> .el-upload-list--picture-card .el-upload-list__item,
.face-uploader >>> .el-upload--picture-card {
  width: 120px;
  height: 120px;
  line-height: 120px;
}

.pipeline-panel {
  padding: 4px 0 2px;
}
.pipeline-stage {
  display: flex;
  gap: 20px;
  align-items: stretch;
}
.pipeline-preview {
  position: relative;
  width: 220px;
  height: 220px;
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
  background: #0f172a;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}
.pipeline-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  filter: saturate(1.05);
}
.pipeline-preview__empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.45);
  font-size: 42px;
}
.pipeline-scan {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.pipeline-face-box {
  position: absolute;
  left: 18%;
  top: 16%;
  width: 64%;
  height: 68%;
  border: 2px solid rgba(64, 158, 255, 0.15);
  border-radius: 14px;
  opacity: 0;
  transition: all 0.35s ease;
}
.pipeline-scan.is-detect .pipeline-face-box,
.pipeline-scan.is-align .pipeline-face-box,
.pipeline-scan.is-embed .pipeline-face-box,
.pipeline-scan.is-done .pipeline-face-box {
  opacity: 1;
  border-color: rgba(64, 158, 255, 0.95);
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.25), 0 0 18px rgba(64, 158, 255, 0.35);
  animation: face-box-pulse 1.4s ease-in-out infinite;
}
.pipeline-scan.is-done .pipeline-face-box {
  border-color: rgba(103, 194, 58, 0.95);
  box-shadow: 0 0 0 1px rgba(103, 194, 58, 0.25), 0 0 18px rgba(103, 194, 58, 0.35);
  animation: none;
}
.pipeline-scan.is-error .pipeline-face-box {
  opacity: 1;
  border-color: rgba(245, 108, 108, 0.95);
  box-shadow: 0 0 18px rgba(245, 108, 108, 0.35);
  animation: none;
}
.pipeline-landmark {
  position: absolute;
  width: 8px;
  height: 8px;
  margin: -4px 0 0 -4px;
  border-radius: 50%;
  background: #ffd666;
  box-shadow: 0 0 8px rgba(255, 214, 102, 0.8);
  opacity: 0;
  transform: scale(0.4);
  transition: all 0.25s ease;
}
.pipeline-landmark--1 { left: 34%; top: 38%; }
.pipeline-landmark--2 { left: 66%; top: 38%; }
.pipeline-landmark--3 { left: 50%; top: 52%; }
.pipeline-landmark--4 { left: 38%; top: 66%; }
.pipeline-landmark--5 { left: 62%; top: 66%; }
.pipeline-scan.is-align .pipeline-landmark,
.pipeline-scan.is-embed .pipeline-landmark,
.pipeline-scan.is-done .pipeline-landmark {
  opacity: 1;
  transform: scale(1);
}
.pipeline-scan.is-align .pipeline-landmark {
  animation: landmark-pop 0.9s ease-in-out infinite;
}
.pipeline-scanline {
  position: absolute;
  left: 10%;
  right: 10%;
  height: 2px;
  top: 12%;
  background: linear-gradient(90deg, transparent, rgba(64, 158, 255, 0.95), transparent);
  opacity: 0;
  box-shadow: 0 0 12px rgba(64, 158, 255, 0.8);
}
.pipeline-scan.is-detect .pipeline-scanline,
.pipeline-scan.is-embed .pipeline-scanline {
  opacity: 1;
  animation: scan-move 1.35s linear infinite;
}
.pipeline-steps {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}
.pipeline-step {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f7f9fc;
  border: 1px solid transparent;
  transition: all 0.25s ease;
}
.pipeline-step.is-active {
  background: #ecf5ff;
  border-color: #b3d8ff;
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.12);
}
.pipeline-step.is-done {
  background: #f0f9eb;
  border-color: #c2e7b0;
}
.pipeline-step.is-error {
  background: #fef0f0;
  border-color: #fbc4c4;
}
.pipeline-step__dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 13px;
  color: #909399;
  background: #ebeef5;
}
.pipeline-step.is-active .pipeline-step__dot {
  color: #fff;
  background: #409eff;
}
.pipeline-step.is-done .pipeline-step__dot {
  color: #fff;
  background: #67c23a;
}
.pipeline-step.is-error .pipeline-step__dot {
  color: #fff;
  background: #f56c6c;
}
.pipeline-step__title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  line-height: 1.3;
}
.pipeline-step__desc {
  margin-top: 2px;
  font-size: 12px;
  color: #909399;
}
.pipeline-step.is-active .pipeline-step__desc {
  color: #409eff;
}
.pipeline-status {
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f5f7fa;
  color: #606266;
  font-size: 13px;
}
.pipeline-status.is-error {
  background: #fef0f0;
  color: #f56c6c;
}

.batch-progress-panel {
  padding: 4px 0 2px;
}
.batch-progress-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.batch-progress-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}
.batch-progress-title .el-icon-loading {
  color: #409eff;
}
.batch-progress-count {
  font-variant-numeric: tabular-nums;
  color: #409eff;
  font-weight: 600;
}
.batch-progress-sub {
  margin-left: 4px;
  color: #909399;
  font-weight: 500;
  font-size: 12px;
}
.batch-current {
  margin-top: 16px;
  padding: 14px 14px 12px;
  border-radius: 10px;
  background: linear-gradient(180deg, #f7fbff 0%, #f5f7fa 100%);
  border: 1px solid #e4e7ed;
}
.batch-current__label {
  font-size: 12px;
  color: #909399;
}
.batch-current__value {
  margin-top: 4px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  word-break: break-all;
}
.batch-waiting-tip {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: #e6a23c;
}
.batch-mini-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.batch-mini-step {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: #909399;
  background: #eef2f7;
  transition: all 0.2s ease;
}
.batch-mini-step.is-active {
  color: #fff;
  background: #409eff;
  box-shadow: 0 4px 10px rgba(64, 158, 255, 0.28);
  animation: mini-pulse 1s ease-in-out infinite;
}
.batch-mini-step.is-done {
  color: #67c23a;
  background: #f0f9eb;
}
.batch-mini-step.is-error {
  color: #f56c6c;
  background: #fef0f0;
}
.batch-log {
  margin-top: 14px;
  max-height: 140px;
  overflow: auto;
  border-radius: 8px;
  background: #1f2937;
  padding: 10px 12px;
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  line-height: 1.7;
  color: #d1d5db;
}
.batch-log__line {
  display: flex;
  gap: 10px;
}
.batch-log__time {
  color: #60a5fa;
  flex-shrink: 0;
}

@keyframes scan-move {
  0% { top: 12%; opacity: 0; }
  15% { opacity: 1; }
  85% { opacity: 1; }
  100% { top: 86%; opacity: 0; }
}
@keyframes face-box-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}
@keyframes landmark-pop {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.35); opacity: 0.75; }
}
@keyframes mini-pulse {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-1px); }
}
</style>
