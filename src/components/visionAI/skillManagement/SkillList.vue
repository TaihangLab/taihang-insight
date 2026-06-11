<template>
  <div class="skill-list-page">
    <!-- 筛选 + 搜索 + 操作 -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <div class="filter-left">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入技能名称或ID搜索"
            size="small"
            clearable
            style="width: 260px;"
            @keyup.enter.native="handleSearch"
            @clear="handleSearch">
            <i slot="suffix" class="el-input__icon el-icon-search" style="cursor:pointer;" @click="handleSearch"></i>
          </el-input>
          <el-select v-model="statusFilter" size="small" style="width: 150px;" @change="handleFilterChange">
            <el-option label="全部发布状态" value="all"></el-option>
            <el-option label="已启用 / 已发布" value="on"></el-option>
            <el-option label="已停用 / 草稿" value="off"></el-option>
          </el-select>
          <el-select v-model="kindFilter" size="small" style="width: 160px;" @change="handleKindChange">
            <el-option label="全部创建方式" value="all"></el-option>
            <el-option label="视觉模型技能" value="visual"></el-option>
            <el-option label="技能编排" value="graph"></el-option>
            <el-option label="多模态大模型" value="llm"></el-option>
          </el-select>
          <el-select v-model="sortValue" size="small" style="width: 168px;" @change="handleSortChange">
            <el-option
              v-for="opt in sortOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value" />
          </el-select>
        </div>

        <div class="filter-right">
          <el-radio-group v-model="viewMode" size="small" @change="onViewModeChange" class="view-toggle">
            <el-radio-button label="card"><i class="el-icon-menu" title="卡片视图"></i></el-radio-button>
            <el-radio-button label="table"><i class="el-icon-s-operation" title="列表视图"></i></el-radio-button>
          </el-radio-group>
          <el-dropdown trigger="click" @command="handleImportCommand">
            <el-button size="small" icon="el-icon-upload2">
              导入技能<i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="visual"><i class="el-icon-document"></i> 视觉模型技能（.py）</el-dropdown-item>
              <el-dropdown-item command="graph"><i class="el-icon-share"></i> 技能编排（.json）</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
          <el-dropdown trigger="click" @command="handleCreateCommand">
            <el-button type="primary" size="small" icon="el-icon-plus">
              创建技能<i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="llm"><i class="el-icon-cpu"></i> 多模态大模型</el-dropdown-item>
              <el-dropdown-item command="graph"><i class="el-icon-share"></i> 技能编排</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </div>
    </el-card>

    <!-- 技能列表（卡片 / 表格 两种视图） -->
    <el-card class="list-card" shadow="never" v-loading="loading">
      <div v-if="skills.length" class="list-toolbar">
        <span v-if="selectedSkillKeys.length" class="selected-hint">已选 {{ selectedSkillKeys.length }} 项</span>
        <el-button
          size="small"
          type="danger"
          plain
          icon="el-icon-delete"
          :disabled="!selectedSkillKeys.length"
          @click="handleBatchDelete">
          批量删除
        </el-button>
        <el-button size="small" icon="el-icon-check" @click="selectAllCurrentPage">
          {{ allCurrentPageSelected ? '取消本页' : '选择本页' }}
        </el-button>
      </div>

      <!-- 卡片视图 -->
      <div v-if="viewMode === 'card'">
        <div class="skill-grid">
          <div
            v-for="s in skills"
            :key="skillRowKey(s)"
            class="skill-card"
            :class="{ 'is-selected': isSkillSelected(s) }"
            @mouseenter="setCardHover(s, true)"
            @mouseleave="setCardHover(s, false)"
            @click="viewDetail(s)">
            <div
              v-show="cardHoverStates[skillRowKey(s)] || isSkillSelected(s)"
              class="sc-select"
              @click.stop>
              <el-checkbox :value="isSkillSelected(s)" @input="toggleSkillSelect(s, $event)" />
            </div>
            <div class="sc-cover">
              <div class="sc-cover-placeholder" aria-hidden="true"></div>
              <div
                v-if="s.image_url"
                class="sc-cover-bg"
                :style="{ backgroundImage: 'url(' + s.image_url + ')' }"></div>
              <img
                :key="(s.kind + '-' + s.skill_id) + '-' + (s.image_url || 'default')"
                :src="s.image_url || defaultCover"
                class="sc-img"
                :class="{ 'is-placeholder': !s.image_url, 'is-loaded': !s.image_url }"
                @load="onImgLoad"
                @error="onImgError" />
              <!-- 普通视觉技能不标，仅大模型 / 技能编排标识种类 -->
              <span v-if="s.kind !== 'visual'" class="sc-badge" :class="'badge-' + s.kind">
                {{ s.kind_label }}
              </span>
            </div>
            <div class="sc-body">
              <div class="sc-name" :title="s.name_zh">{{ s.name_zh }}</div>
              <div class="sc-desc">{{ s.description || '暂无描述' }}</div>
              <div class="sc-info">
                <span class="sc-info-label">最新版本</span>
                <span class="sc-info-val">V{{ s.version }}</span>
                <span v-if="s.kind === 'graph'" class="sc-info-node">{{ s.node_count }} 节点</span>
              </div>
              <div class="sc-footer" @click.stop>
                <el-tag :type="s.status ? 'success' : 'info'" size="mini">{{ s.status_text }}</el-tag>
                <div class="sc-actions">
                  <el-button v-if="s.kind === 'graph'" type="text" size="mini" @click="exportGraph(s, $event)">导出</el-button>
                  <el-button type="text" size="mini" @click="viewDetail(s)">详情</el-button>
                  <el-button v-if="s.kind === 'graph'" type="text" size="mini" @click="openGraphEditor(s)">编排</el-button>
                  <el-button type="text" size="mini" @click="handleEdit(s)">编辑</el-button>
                  <el-button type="text" size="mini" @click="toggleStatus(s)">{{ statusActionText(s) }}</el-button>
                  <el-button type="text" size="mini" class="danger-text" @click="handleDelete(s)">删除</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <el-empty v-if="!skills.length && !loading" description="暂无技能"></el-empty>
      </div>

      <!-- 表格视图 -->
      <el-table
        v-else
        ref="skillTable"
        :data="skills"
        style="width: 100%"
        stripe
        empty-text="暂无技能数据"
        @selection-change="onTableSelectionChange">
        <el-table-column type="selection" width="45" align="center" />
        <el-table-column label="技能名称" min-width="220">
          <template slot-scope="{ row }">
            <div class="name-cell">
              <span class="name-zh">{{ row.name_zh }}</span>
              <span class="name-sub" v-if="row.description">{{ row.description }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型标识" width="140" align="center">
          <template slot-scope="{ row }">
            <el-tag :type="kindTagType(row.kind)" size="small" effect="plain">{{ row.kind_label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="编排节点" width="90" align="center">
          <template slot-scope="{ row }">
            <span v-if="row.kind === 'graph'">{{ row.node_count }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="版本" width="90" align="center" prop="version"></el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template slot-scope="{ row }">
            <el-tag :type="row.status ? 'success' : 'info'" size="small">{{ row.status_text }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="170" align="center" prop="updated_at"></el-table-column>
        <el-table-column label="操作" width="380" align="center" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="mini" @click="viewDetail(row)">详情</el-button>
            <el-button v-if="row.kind === 'graph'" type="text" size="mini" @click="openGraphEditor(row)">编排</el-button>
            <el-button type="text" size="mini" @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="row.kind === 'graph'" type="text" size="mini" @click="exportGraph(row)">导出</el-button>
            <el-button type="text" size="mini" @click="toggleStatus(row)">
              {{ statusActionText(row) }}
            </el-button>
            <el-button type="text" size="mini" class="danger-text" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="total"
          :current-page="currentPage"
          :page-size="pageSize"
          @current-change="handlePageChange">
        </el-pagination>
      </div>
    </el-card>

    <!-- 导入技能编排弹窗 -->
    <el-dialog title="导入技能编排" :visible.sync="graphImportVisible" width="560px" :close-on-click-modal="false">
      <el-form :model="graphImportForm" label-width="90px">
        <el-form-item label="编排文件" required>
          <el-upload
            action="#"
            :auto-upload="false"
            :limit="1"
            :on-change="onGraphImportFileChange"
            :on-remove="onGraphImportFileRemove"
            accept=".json,application/json">
            <el-button size="small" icon="el-icon-document">选择 .json 文件</el-button>
            <div slot="tip" class="el-upload__tip">支持本系统导出的 .skill-graph.json 文件，大小不超过 10MB</div>
          </el-upload>
        </el-form-item>
        <el-form-item label="技能名称" required>
          <el-input v-model="graphImportForm.skill_name" placeholder="导入后的技能名称" maxlength="32" show-word-limit></el-input>
        </el-form-item>
        <el-form-item label="技能ID">
          <el-input v-model="graphImportForm.skill_id" placeholder="留空则使用文件内 ID 或自动生成"></el-input>
          <div class="el-upload__tip">若 ID 已存在，系统会自动追加后缀</div>
        </el-form-item>
        <el-form-item label="技能描述">
          <el-input v-model="graphImportForm.description" type="textarea" :rows="3" placeholder="选填"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="graphImportVisible = false">取消</el-button>
        <el-button type="primary" :loading="graphImporting" @click="confirmGraphImport">确定导入</el-button>
      </span>
    </el-dialog>

    <!-- 导入技能文件弹窗（视觉模型技能/插件方式） -->
    <el-dialog title="导入技能文件" :visible.sync="importDialogVisible" width="560px" :close-on-click-modal="false">
      <el-form label-width="110px">
        <el-form-item label="技能主文件" required>
          <el-upload
            action="#"
            :auto-upload="false"
            :limit="1"
            :on-change="onMainFileChange"
            :on-remove="() => mainFile = null"
            accept=".py">
            <el-button size="small" icon="el-icon-document">选择 .py 主文件</el-button>
            <div slot="tip" class="el-upload__tip">仅支持单个 .py 文件，大小不超过 5MB</div>
          </el-upload>
        </el-form-item>
        <el-form-item label="依赖文件">
          <el-upload
            action="#"
            :auto-upload="false"
            multiple
            :on-change="onDepFileChange"
            :on-remove="onDepFileRemove"
            accept=".py,.json,.yaml,.yml,.txt">
            <el-button size="small" icon="el-icon-folder-opened">选择依赖文件（可选）</el-button>
            <div slot="tip" class="el-upload__tip">可选，支持 .py/.json/.yaml/.txt 等，单个不超过 5MB</div>
          </el-upload>
        </el-form-item>
        <el-form-item label="">
          <div class="import-reload-tip">
            上传 .py 技能文件后会自动热加载；若仅在服务器上替换了插件文件，可手动点击「加载技能」重新扫描目录。
          </div>
        </el-form-item>
      </el-form>
      <span slot="footer" class="import-dialog-footer">
        <el-button
          type="success"
          plain
          icon="el-icon-refresh-right"
          :loading="reloading"
          @click="handleReloadSkillClasses">
          加载技能
        </el-button>
        <span class="import-footer-spacer"></span>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="importing" @click="confirmImport">确定导入</el-button>
      </span>
    </el-dialog>

    <!-- 技能编排：创建弹窗 -->
    <el-dialog title="创建技能编排" :visible.sync="graphDialogVisible" width="520px" :close-on-click-modal="false">
      <el-form :model="graphForm" label-width="90px">
        <el-form-item label="技能名称" required>
          <el-input v-model="graphForm.name" placeholder="仅支持数字、中文、大小写字母，无空格" maxlength="32" show-word-limit></el-input>
        </el-form-item>
        <el-form-item label="技能描述">
          <el-input v-model="graphForm.description" type="textarea" :rows="3" placeholder="选填"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="graphDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="graphCreating" @click="confirmCreateGraph">创建并进入编排</el-button>
      </span>
    </el-dialog>

    <!-- 视觉模型技能：编辑基本信息 -->
    <el-dialog title="编辑技能信息" :visible.sync="visualEditVisible" width="560px" :close-on-click-modal="false">
      <el-form :model="visualForm" label-width="90px">
        <el-form-item label="技能类型">
          <el-tag size="small" effect="plain">视觉模型技能</el-tag>
        </el-form-item>
        <el-form-item label="技能名称">
          <el-input v-model="visualForm.name_zh" maxlength="64"></el-input>
        </el-form-item>
        <el-form-item label="技能描述">
          <el-input v-model="visualForm.description" type="textarea" :rows="3"></el-input>
        </el-form-item>
        <skill-cover-upload
          :preview-url="visualForm.imageUrl"
          :max-size-mb="2"
          :accept-types="['image/jpeg', 'image/jpg', 'image/png']"
          tip="仅支持 JPG、PNG，单张不超过 2MB（与原先视觉技能一致）"
          @change="onVisualCoverChange" />
      </el-form>
      <span slot="footer">
        <el-button @click="visualEditVisible = false">取消</el-button>
        <el-button type="primary" :loading="visualSaving" @click="confirmVisualEdit">保存</el-button>
      </span>
    </el-dialog>

    <!-- 技能编排：编辑基本信息 -->
    <el-dialog title="编辑技能信息" :visible.sync="graphEditVisible" width="560px" :close-on-click-modal="false">
      <el-form :model="graphEditForm" label-width="90px">
        <el-form-item label="技能类型">
          <el-tag type="success" size="small" effect="plain">技能编排</el-tag>
        </el-form-item>
        <el-form-item label="技能ID">
          <el-input v-model="graphEditForm.skill_id" disabled></el-input>
        </el-form-item>
        <el-form-item label="技能名称">
          <el-input v-model="graphEditForm.name_zh" maxlength="32" show-word-limit></el-input>
        </el-form-item>
        <el-form-item label="技能描述">
          <el-input v-model="graphEditForm.description" type="textarea" :rows="3"></el-input>
        </el-form-item>
        <skill-cover-upload
          :preview-url="graphEditForm.imageUrl"
          @change="onGraphCoverChange" />
      </el-form>
      <span slot="footer">
        <el-button @click="graphEditVisible = false">取消</el-button>
        <el-button type="primary" :loading="graphEditSaving" @click="confirmGraphEdit">保存</el-button>
        <el-button type="primary" plain @click="openGraphEditorFromEdit">进入编排</el-button>
      </span>
    </el-dialog>

    <!-- 多模态大模型：创建/编辑基础信息弹窗（复用） -->
    <llm-skill-create-dialog ref="llmCreateDialog" @confirm="handleLlmConfirm"></llm-skill-create-dialog>

    <!-- 技能详情弹窗（只读） -->
    <el-dialog title="技能详情" :visible.sync="detailVisible" width="640px" :destroy-on-close="true" custom-class="skill-detail-dialog">
      <div v-if="detailSkill" class="detail-body" v-loading="detailLoading">
        <div class="detail-hero">
          <div class="detail-icon">
            <img
              :src="detailSkill.image_url || defaultCover"
              :class="{ 'is-placeholder': !detailSkill.image_url }"
              @error="onImgError" />
          </div>
          <div class="detail-hero-info">
            <div class="detail-name-row">
              <span class="detail-name" :title="detailSkill.name_zh">{{ detailSkill.name_zh }}</span>
              <el-tag :type="detailSkill.status ? 'success' : 'info'" size="mini">{{ detailSkill.status_text }}</el-tag>
            </div>
            <div class="detail-meta-row">
              <el-tag :type="kindTagType(detailSkill.kind)" size="mini" effect="plain">{{ detailSkill.kind_label }}</el-tag>
              <span class="detail-id">ID：{{ detailSkill.skill_id }}</span>
              <span class="detail-ver">V{{ detailSkill.version }}</span>
            </div>
          </div>
        </div>

        <el-descriptions v-if="detailSkill.kind === 'llm'" :column="1" size="small" border class="detail-desc">
          <el-descriptions-item label="更新时间">{{ detailSkill.updated_at || '-' }}</el-descriptions-item>
          <el-descriptions-item label="技能描述">{{ detailSkill.description || '暂无描述' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 技能编排扩展信息 -->
        <template v-if="detailSkill.kind === 'graph'">
          <el-descriptions :column="1" size="small" border class="detail-desc">
            <el-descriptions-item label="编排节点">{{ detailSkill.node_count }} 个</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatTime(graphDetail && graphDetail.created_at) || '-' }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatTime(graphDetail && graphDetail.updated_at) || detailSkill.updated_at || '-' }}</el-descriptions-item>
            <el-descriptions-item label="技能描述">{{ (graphDetail && graphDetail.description) || detailSkill.description || '暂无描述' }}</el-descriptions-item>
          </el-descriptions>

          <div class="detail-section-title">技能参数</div>
          <div class="detail-subtitle">输入参数</div>
          <el-table :data="graphInputs" size="mini" border>
            <el-table-column label="参数名" min-width="160">
              <template slot-scope="{ row }">
                <span class="param-name">{{ row.name }}</span>
                <el-tag size="mini" effect="plain" class="param-type">{{ paramTypeLabel(row) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="参数说明" min-width="160">
              <template slot-scope="{ row }">
                <div>{{ row.display_name || row.description || '-' }}</div>
                <div v-if="row.display_name && row.description" class="param-sub">{{ row.description }}</div>
              </template>
            </el-table-column>
          </el-table>

          <div class="detail-subtitle">输出参数</div>
          <el-table :data="graphOutputs" size="mini" border>
            <el-table-column label="参数名" min-width="160">
              <template slot-scope="{ row }">
                <span class="param-name">{{ row.name }}</span>
                <el-tag size="mini" effect="plain" class="param-type">{{ paramTypeLabel(row) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="参数说明" min-width="160">
              <template slot-scope="{ row }">{{ row.description || '-' }}</template>
            </el-table-column>
          </el-table>
        </template>

        <!-- 视觉模型技能扩展信息 -->
        <template v-if="detailSkill.kind === 'visual' && visualDetail">
          <div class="detail-section-title">技能信息</div>
          <el-descriptions :column="1" size="small" border class="detail-desc">
            <el-descriptions-item label="技能类型">{{ visualTypeText(visualDetail.type) }}</el-descriptions-item>
            <el-descriptions-item label="关联模型">
              <template v-if="(visualDetail.model_info || []).length">
                <el-tag v-for="(m, mi) in visualDetail.model_info" :key="(m[0] != null ? m[0] : m[1]) + '-' + mi" size="mini" class="detail-tag">{{ m[1] || ('模型#' + m[0]) }}</el-tag>
              </template>
              <span v-else class="detail-empty">未关联模型</span>
            </el-descriptions-item>
            <el-descriptions-item label="关联任务">{{ visualDetail.task_count || 0 }} 个</el-descriptions-item>
            <el-descriptions-item label="关联设备">
              <el-popover placement="top-start" trigger="click" width="320" :disabled="!visualDevices.length">
                <div class="device-pop">
                  <div v-for="(d, i) in visualDevices" :key="i" class="device-pop-item">
                    <div class="device-pop-head">
                      <i class="el-icon-video-camera"></i>
                      <span class="device-name">{{ d.name }}</span>
                      <span v-if="d.location" class="device-loc">{{ d.location }}</span>
                    </div>
                    <div v-for="(t, ti) in d.tasks" :key="ti" class="device-task">
                      <span class="dt-name">{{ t.name }}</span>
                      <el-tag size="mini" :type="taskStatusType(t.status)" effect="plain">{{ taskStatusText(t.status) }}</el-tag>
                    </div>
                  </div>
                </div>
                <el-button slot="reference" type="text" class="link-count" :disabled="!visualDevices.length">
                  {{ visualDetail.total_device_count || 0 }} 个<span v-if="visualDevices.length"> · 查看</span>
                </el-button>
              </el-popover>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatTime(visualDetail.created_at) || '-' }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatTime(visualDetail.updated_at) || detailSkill.updated_at || '-' }}</el-descriptions-item>
            <el-descriptions-item label="技能描述">{{ visualDetail.description || detailSkill.description || '暂无描述' }}</el-descriptions-item>
          </el-descriptions>

          <div v-if="visualParams.length" class="detail-section-title">默认参数</div>
          <el-table v-if="visualParams.length" :data="visualParams" size="mini" border>
            <el-table-column prop="label" label="参数" min-width="140" />
            <el-table-column prop="value" label="默认值" min-width="120">
              <template slot-scope="{ row }">{{ formatParamValue(row.value) }}</template>
            </el-table-column>
          </el-table>

          <div v-if="visualAlertDefs.length" class="detail-section-title">预警定义</div>
          <div v-if="visualAlertDefs.length" class="detail-alertdefs">
            <el-tag v-for="(a, i) in visualAlertDefs" :key="i" size="small" class="detail-tag" type="warning" effect="plain">{{ a }}</el-tag>
          </div>
        </template>

        <!-- 多模态大模型扩展信息 -->
        <template v-if="detailSkill.kind === 'llm' && llmDetail">
          <div class="detail-section-title">大模型配置</div>
          <el-descriptions :column="1" size="small" border class="detail-desc">
            <el-descriptions-item label="应用场景">{{ llmScenarioText(llmDetail.application_scenario) }}</el-descriptions-item>
            <el-descriptions-item v-if="(llmDetail.skill_tags || []).length" label="技能标签">
              <el-tag v-for="t in llmDetail.skill_tags" :key="t" size="mini" class="detail-tag">{{ t }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="关联任务">{{ (llmDetail.tasks || []).length }} 个</el-descriptions-item>
            <el-descriptions-item label="关联设备">
              <el-popover placement="top-start" trigger="click" width="320" :disabled="!llmDevices.length">
                <div class="device-pop">
                  <div v-for="(d, i) in llmDevices" :key="i" class="device-pop-item">
                    <div class="device-pop-head">
                      <i class="el-icon-video-camera"></i>
                      <span class="device-name">{{ d.name }}</span>
                    </div>
                    <div v-for="(t, ti) in d.tasks" :key="ti" class="device-task">
                      <span class="dt-name">{{ t.name }}</span>
                      <el-tag size="mini" :type="taskStatusType(t.status)" effect="plain">{{ taskStatusText(t.status) }}</el-tag>
                    </div>
                  </div>
                </div>
                <el-button slot="reference" type="text" class="link-count" :disabled="!llmDevices.length">
                  {{ llmDeviceCount }} 个<span v-if="llmDevices.length"> · 查看</span>
                </el-button>
              </el-popover>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatTime(llmDetail.created_at) || '-' }}</el-descriptions-item>
          </el-descriptions>

          <div class="detail-section-title">提示词模板</div>
          <div class="detail-prompt-box">{{ promptPreview(llmDetail.prompt_template) || '未配置' }}</div>

          <div class="detail-section-title">输出参数</div>
          <el-table v-if="(llmDetail.output_parameters || []).length" :data="llmDetail.output_parameters" size="mini" border>
            <el-table-column prop="name" label="参数名" min-width="120" />
            <el-table-column prop="type" label="类型" width="80" align="center" />
            <el-table-column prop="description" label="说明" min-width="140" />
            <el-table-column label="必填" width="60" align="center">
              <template slot-scope="{ row }">
                <el-tag :type="row.required ? 'danger' : 'info'" size="mini" effect="plain">{{ row.required ? '是' : '否' }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <div v-else class="detail-empty">未配置输出参数</div>

          <div class="detail-section-title">预警条件</div>
          <template v-if="alertGroups.length">
            <div class="detail-cond-summary">
              <i class="el-icon-warning-outline"></i>
              条件组之间关系：<b>{{ globalRelationText(llmDetail.alert_conditions) }}</b>，满足后产生预警
            </div>
            <div v-for="(group, gi) in alertGroups" :key="gi" class="detail-cond-group">
              <div class="detail-cond-group-head">
                <span class="cond-group-name">条件组 {{ gi + 1 }}</span>
                <el-tag size="mini" type="info" effect="plain">组内满足{{ groupRelationText(group.relation) }}条件</el-tag>
              </div>
              <div v-for="(c, ci) in (group.conditions || [])" :key="ci" class="detail-cond-item">
                <span class="cond-field">{{ c.field || '-' }}</span>
                <el-tag size="mini" effect="plain" class="cond-op">{{ operatorText(c.operator) }}</el-tag>
                <span class="cond-val" v-if="!['is_empty','is_not_empty'].includes(c.operator)">{{ c.value }}</span>
              </div>
            </div>
          </template>
          <div v-else class="detail-empty">未配置预警条件</div>
        </template>
      </div>
      <span slot="footer" v-if="detailSkill">
        <el-button v-if="detailSkill.kind === 'graph'" size="small" icon="el-icon-download" @click="exportGraph(detailSkill)">导出</el-button>
        <el-button v-if="detailSkill.kind === 'graph'" size="small" icon="el-icon-share" @click="openGraphEditor(detailSkill); detailVisible = false">编排</el-button>
        <el-button size="small" @click="handleEdit(detailSkill); detailVisible = false">编辑</el-button>
        <el-button size="small" @click="toggleStatus(detailSkill)">{{ statusActionText(detailSkill) }}</el-button>
        <el-button size="small" type="danger" plain @click="handleDelete(detailSkill); detailVisible = false">删除</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { skillAPI, skillGraphAPI } from '@/components/service/VisionAIService.js'
import LlmSkillCreateDialog from './LlmSkillCreateDialog.vue'
import SkillCoverUpload from './SkillCoverUpload.vue'

const SKILL_SORT_OPTIONS = [
  { label: '更新时间 · 倒序', value: 'updated_at:desc' },
  { label: '更新时间 · 正序', value: 'updated_at:asc' },
  { label: '创建时间 · 倒序', value: 'created_at:desc' },
  { label: '创建时间 · 正序', value: 'created_at:asc' },
  { label: '名称 · 倒序', value: 'name:desc' },
  { label: '名称 · 正序', value: 'name:asc' }
]

function readSortValue() {
  const saved = localStorage.getItem('skillListSort')
  if (saved && SKILL_SORT_OPTIONS.some(o => o.value === saved)) return saved
  const field = localStorage.getItem('skillListSortField')
  const order = localStorage.getItem('skillListSortOrder')
  if (field && order) {
    const merged = `${field}:${order}`
    if (SKILL_SORT_OPTIONS.some(o => o.value === merged)) return merged
  }
  return 'updated_at:desc'
}

export default {
  name: 'SkillList',
  components: { LlmSkillCreateDialog, SkillCoverUpload },
  data() {
    return {
      sortOptions: SKILL_SORT_OPTIONS,
      loading: false,
      skills: [],
      total: 0,
      currentPage: 1,
      pageSize: 12,
      kindFilter: 'all',
      statusFilter: 'all',
      searchKeyword: '',
      sortValue: readSortValue(),
      viewMode: localStorage.getItem('skillListViewMode') || 'card',
      defaultCover: '/static/logo.png',
      // 技能详情抽屉
      detailVisible: false,
      detailSkill: null,
      detailLoading: false,
      llmDetail: null,
      visualDetail: null,
      graphDetail: null,
      counts: { all: 0, visual: 0, graph: 0, llm: 0 },
      // 导入
      importDialogVisible: false,
      importing: false,
      mainFile: null,
      dependencyFiles: [],
      // 技能编排导入
      graphImportVisible: false,
      graphImporting: false,
      graphImportFile: null,
      graphImportForm: { skill_id: '', skill_name: '', description: '' },
      // 技能编排创建
      graphDialogVisible: false,
      graphCreating: false,
      graphForm: { name: '', description: '' },
      // 视觉技能编辑
      visualEditVisible: false,
      visualSaving: false,
      visualForm: { id: null, name_zh: '', description: '', imageUrl: '', coverFile: null },
      // 技能编排基本信息编辑
      graphEditVisible: false,
      graphEditSaving: false,
      graphEditForm: { skill_id: '', name_zh: '', description: '', imageUrl: '', coverFile: null },
      // 批量选择与热加载
      selectedSkillKeys: [],
      cardHoverStates: {},
      reloading: false
    }
  },
  mounted() {
    this.loadSkills()
  },
  computed: {
    allCurrentPageSelected() {
      if (!this.skills.length) return false
      return this.skills.every(s => this.selectedSkillKeys.includes(this.skillRowKey(s)))
    },
    alertGroups() {
      const ac = this.llmDetail && this.llmDetail.alert_conditions
      return (ac && Array.isArray(ac.condition_groups)) ? ac.condition_groups : []
    },
    llmDeviceCount() {
      const tasks = (this.llmDetail && this.llmDetail.tasks) || []
      const ids = new Set(tasks.map(t => t.camera_id).filter(v => v !== null && v !== undefined))
      return ids.size
    },
    llmDevices() {
      const tasks = (this.llmDetail && this.llmDetail.tasks) || []
      const map = {}
      tasks.forEach(t => {
        if (t.camera_id === null || t.camera_id === undefined) return
        if (!map[t.camera_id]) map[t.camera_id] = { name: '设备 #' + t.camera_id, location: '', tasks: [] }
        map[t.camera_id].tasks.push({ name: t.name || ('任务 #' + t.id), status: t.status })
      })
      return Object.keys(map).map(k => map[k])
    },
    visualDevices() {
      const tasks = (this.visualDetail && this.visualDetail.ai_tasks) || []
      const map = {}
      tasks.forEach(t => {
        const ci = t.camera_info
        if (!ci || ci.id === undefined || ci.id === null) return
        if (!map[ci.id]) map[ci.id] = { name: ci.name || ('设备 #' + ci.id), location: ci.location || '', tasks: [] }
        map[ci.id].tasks.push({ name: t.name || ('任务 #' + t.id), status: t.status })
      })
      return Object.keys(map).map(k => map[k])
    },
    visualParams() {
      const dc = this.visualDetail && this.visualDetail.default_config
      const params = dc && dc.params
      if (!params) return []
      if (Array.isArray(params)) {
        return params.map(p => ({
          label: p.label || p.name || p.key || '参数',
          value: p.default !== undefined ? p.default : (p.value !== undefined ? p.value : '')
        }))
      }
      if (typeof params === 'object') {
        return Object.keys(params).map(k => ({ label: k, value: params[k] }))
      }
      return []
    },
    visualAlertDefs() {
      const dc = this.visualDetail && this.visualDetail.default_config
      const defs = dc && dc.alert_definitions
      if (!defs) return []
      if (Array.isArray(defs)) {
        return defs.map(a => (typeof a === 'string') ? a : (a.name || a.label || a.type || JSON.stringify(a)))
      }
      if (typeof defs === 'object') return Object.keys(defs)
      return []
    },
    graphNodes() {
      const gj = this.graphDetail && this.graphDetail.graph_json
      return (gj && Array.isArray(gj.nodes)) ? gj.nodes : []
    },
    graphInputs() {
      // 按实际的开始节点配置取输入参数，不再硬编码 image/roi 等默认参数
      const start = this.graphNodes.find(n => (n.type || (n.properties && n.properties.nodeType)) === 'start')
      if (!start) return []
      const cfg = start.config || (start.properties && start.properties.config) || {}
      return (cfg.input_params || []).filter(p => p && p.name)
    },
    graphOutputs() {
      // 按实际的结束节点配置取输出参数：始终包含 message（输出信息），其余来自 output_params
      const end = this.graphNodes.find(n => (n.type || (n.properties && n.properties.nodeType)) === 'end')
      if (!end) return []
      const cfg = end.config || (end.properties && end.properties.config) || {}
      const outs = [{ name: 'message', type: 'TemplateString', description: '输出信息' }]
      const extra = cfg.output_params || cfg.output_parameters || []
      extra.forEach(o => {
        if (o && o.name && o.name !== 'message') {
          outs.push({ name: o.name, type: o.type || 'String', description: o.ref ? ('引用 ' + o.ref) : '' })
        }
      })
      return outs
    }
  },
  watch: {
    // 从创建/编辑/编排详情页返回时刷新
    '$route'(to, from) {
      const backFrom = ['/skillManage/multimodalCreateDetail', '/skillManage/skillGraphEditor']
      if (to.path === '/skillManage/skillList' && backFrom.includes(from.path)) {
        localStorage.removeItem('tempSkillInfo')
        localStorage.removeItem('editSkillInfo')
        this.loadSkills()
      }
    }
  },
  methods: {
    async loadSkills() {
      this.loading = true
      try {
        const params = { page: this.currentPage, limit: this.pageSize }
        if (this.kindFilter && this.kindFilter !== 'all') params.kind = this.kindFilter
        if (this.searchKeyword) params.query = this.searchKeyword
        if (this.statusFilter === 'on') params.status = true
        else if (this.statusFilter === 'off') params.status = false
        const sortParts = (this.sortValue || 'updated_at:desc').split(':')
        params.sort_by = sortParts[0] || 'updated_at'
        params.sort_order = sortParts[1] || 'desc'
        const res = await skillAPI.getUnifiedSkills(params)
        if (res && res.code === 0) {
          this.skills = res.data || []
          this.total = res.total || 0
          if (res.counts) this.counts = res.counts
        } else {
          this.skills = []
          this.total = 0
        }
      } catch (e) {
        this.$message.error('获取技能列表失败')
        this.skills = []
        this.total = 0
      } finally {
        this.loading = false
        this.$nextTick(() => this.syncLoadedImages())
      }
    },
    handleSortChange() {
      localStorage.setItem('skillListSort', this.sortValue)
      localStorage.removeItem('skillListSortField')
      localStorage.removeItem('skillListSortOrder')
      this.currentPage = 1
      this.clearSkillSelection()
      this.loadSkills()
    },
    handleKindChange() {
      this.currentPage = 1
      this.clearSkillSelection()
      this.loadSkills()
    },
    handleFilterChange() {
      this.currentPage = 1
      this.clearSkillSelection()
      this.loadSkills()
    },
    handleSearch() {
      this.currentPage = 1
      this.clearSkillSelection()
      this.loadSkills()
    },
    handlePageChange(page) {
      this.currentPage = page
      this.clearSkillSelection()
      this.loadSkills()
    },
    onViewModeChange(mode) {
      localStorage.setItem('skillListViewMode', mode)
      this.clearSkillSelection()
    },
    skillRowKey(s) {
      return `${s.kind}-${s.skill_id}`
    },
    setCardHover(s, visible) {
      this.$set(this.cardHoverStates, this.skillRowKey(s), visible)
    },
    isSkillSelected(s) {
      return this.selectedSkillKeys.includes(this.skillRowKey(s))
    },
    toggleSkillSelect(s, checked) {
      const key = this.skillRowKey(s)
      if (checked) {
        if (!this.selectedSkillKeys.includes(key)) {
          this.selectedSkillKeys.push(key)
        }
      } else {
        this.selectedSkillKeys = this.selectedSkillKeys.filter(k => k !== key)
      }
    },
    onTableSelectionChange(rows) {
      this.selectedSkillKeys = (rows || []).map(s => this.skillRowKey(s))
    },
    clearSkillSelection() {
      this.selectedSkillKeys = []
      if (this.$refs.skillTable) {
        this.$refs.skillTable.clearSelection()
      }
    },
    getSelectedRows() {
      return this.skills.filter(s => this.selectedSkillKeys.includes(this.skillRowKey(s)))
    },
    selectAllCurrentPage() {
      if (this.allCurrentPageSelected) {
        const pageKeys = this.skills.map(s => this.skillRowKey(s))
        this.selectedSkillKeys = this.selectedSkillKeys.filter(k => !pageKeys.includes(k))
      } else {
        const merged = [...this.selectedSkillKeys]
        this.skills.forEach(s => {
          const key = this.skillRowKey(s)
          if (!merged.includes(key)) merged.push(key)
        })
        this.selectedSkillKeys = merged
      }
      if (this.viewMode === 'table' && this.$refs.skillTable) {
        this.$nextTick(() => {
          this.skills.forEach(row => {
            this.$refs.skillTable.toggleRowSelection(row, this.isSkillSelected(row))
          })
        })
      }
    },
    async handleReloadSkillClasses() {
      this.reloading = true
      try {
        const res = await skillAPI.reloadSkillClasses()
        const body = res && res.data
        const inner = (body && body.data) ? body.data : body
        if (inner && inner.success) {
          this.$message.success(inner.message || '技能热加载成功')
          this.loadSkills()
        } else {
          this.$message.error((inner && inner.message) || (body && body.msg) || '技能热加载失败')
        }
      } catch (e) {
        this.$message.error('加载技能失败：' + this.errMsg(e))
      } finally {
        this.reloading = false
      }
    },
    async handleBatchDelete() {
      const rows = this.getSelectedRows()
      if (!rows.length) {
        this.$message.warning('请先选择要删除的技能')
        return
      }
      try {
        await this.$confirm(`确认删除选中的 ${rows.length} 个技能吗？`, '提示', {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning'
        })
      } catch (e) {
        return
      }

      const visualIds = rows.filter(r => r.kind === 'visual').map(r => r.id)
      const graphIds = rows.filter(r => r.kind === 'graph').map(r => r.skill_id)
      const llmIds = rows.filter(r => r.kind === 'llm').map(r => r.skill_id)
      let success = 0
      let failed = 0

      try {
        if (visualIds.length) {
          const res = await skillAPI.batchDeleteSkills(visualIds)
          const d = res && res.data
          if (d && d.detail) {
            success += (d.detail.success || []).length
            failed += (d.detail.failed || []).length
          } else if (d && d.success) {
            success += visualIds.length
          } else {
            failed += visualIds.length
          }
        }
        if (graphIds.length) {
          for (const sid of graphIds) {
            try {
              await skillGraphAPI.deleteGraph(sid)
              success++
            } catch (err) {
              failed++
              console.error('删除技能编排失败:', sid, err)
            }
          }
        }
        if (llmIds.length) {
          const res = await skillAPI.batchDeleteLlmSkills(llmIds)
          const d = res && res.data
          const inner = (d && d.data) ? d.data : d
          if (inner) {
            success += inner.deleted_count || (inner.deleted_skills && inner.deleted_skills.length) || 0
            failed += inner.failed_count || (inner.failed_skills && inner.failed_skills.length) || 0
          } else {
            failed += llmIds.length
          }
        }

        this.clearSkillSelection()
        if (failed > 0) {
          this.$message.warning(`成功删除 ${success} 个，失败 ${failed} 个`)
        } else {
          this.$message.success(`成功删除 ${success} 个技能`)
        }
        if (this.skills.length <= rows.length && this.currentPage > 1) {
          this.currentPage--
        }
        this.loadSkills()
      } catch (e) {
        this.$message.error('批量删除失败：' + this.errMsg(e))
      }
    },
    onImgLoad(e) {
      e.target.classList.add('is-loaded')
    },
    syncLoadedImages() {
      const root = this.$el
      if (!root) return
      root.querySelectorAll('.sc-cover .sc-img').forEach(img => {
        if (img.complete && img.naturalWidth > 0) {
          img.classList.add('is-loaded')
        }
      })
    },
    onImgError(e) {
      e.target.src = this.defaultCover
      e.target.classList.add('is-placeholder', 'is-loaded')
    },
    kindTagType(kind) {
      return { visual: '', graph: 'success', llm: 'warning' }[kind] || ''
    },
    statusActionText(row) {
      if (row.status_action === 'publish') return row.status ? '下线' : '发布'
      return row.status ? '停用' : '启用'
    },
    llmScenarioText(scenario) {
      return { video_analysis: '视频分析', image_processing: '图片处理', image_analysis: '图片分析' }[scenario] || scenario || '-'
    },
    promptPreview(tpl) {
      if (!tpl) return ''
      return String(tpl).replace(/\{#InputSlot placeholder="([^"]*)"#\}(.*?)\{#\/InputSlot#\}/g, (m, ph, val) => (val && val.trim()) ? val : `【${ph}】`)
    },
    globalRelationText(ac) {
      const r = ac && ac.global_relation
      return { and: '与（全部满足）', or: '或（任一满足）', not: '非（全不满足）' }[r] || '与（全部满足）'
    },
    groupRelationText(r) {
      return { all: '全部', any: '任一', not: '全不' }[r] || '全部'
    },
    operatorText(op) {
      return {
        eq: '等于', ne: '不等于', gt: '大于', lt: '小于', gte: '大于等于', lte: '小于等于',
        contains: '包含', not_contains: '不包含', is_empty: '为空', is_not_empty: '不为空'
      }[op] || op || '-'
    },
    formatParamValue(v) {
      if (v === null || v === undefined || v === '') return '-'
      if (typeof v === 'boolean') return v ? '是' : '否'
      if (typeof v === 'object') return JSON.stringify(v)
      return String(v)
    },
    visualTypeText(type) {
      const map = {
        detection: '目标检测', classification: '图像分类', segmentation: '图像分割',
        pose: '姿态估计', ocr: '文字识别', tracking: '目标跟踪'
      }
      return map[type] || type || '-'
    },
    formatTime(t) {
      if (!t) return ''
      return String(t).replace('T', ' ').replace(/\.\d+.*$/, '').slice(0, 19)
    },
    paramTypeLabel(row) {
      if (!row) return '-'
      if (row.type === 'Array') return 'Array<' + (row.item_type || 'Any') + '>'
      return row.type || '-'
    },
    taskStatusText(status) {
      return (status === 1 || status === true || status === 'running' || status === 'enabled') ? '运行中' : '已停止'
    },
    taskStatusType(status) {
      return (status === 1 || status === true || status === 'running' || status === 'enabled') ? 'success' : 'info'
    },

    /* ============ 查看详情 ============ */
    viewDetail(row) {
      this.detailSkill = row
      this.llmDetail = null
      this.visualDetail = null
      this.graphDetail = null
      this.detailVisible = true
      if (row.kind === 'graph') {
        this.detailLoading = true
        skillGraphAPI.getGraph(row.skill_id).then(response => {
          this.graphDetail = (response && response.data) ? response.data : null
        }).catch(() => {
          this.$message.warning('获取技能编排详情失败')
        }).finally(() => {
          this.detailLoading = false
        })
      } else if (row.kind === 'llm') {
        this.detailLoading = true
        skillAPI.getLlmSkillDetail(row.skill_id).then(response => {
          if (response.data && response.data.success) {
            this.llmDetail = response.data.data
          }
        }).catch(() => {
          this.$message.warning('获取大模型技能详情失败')
        }).finally(() => {
          this.detailLoading = false
        })
      } else if (row.kind === 'visual') {
        this.detailLoading = true
        skillAPI.getSkillDetail(row.id).then(response => {
          const payload = response && response.data ? response.data : null
          this.visualDetail = (payload && payload.data !== undefined) ? payload.data : payload
        }).catch(() => {
          this.$message.warning('获取视觉技能详情失败')
        }).finally(() => {
          this.detailLoading = false
        })
      }
    },

    /* ============ 创建技能 ============ */
    handleCreateCommand(command) {
      if (command === 'llm') {
        this.$refs.llmCreateDialog.show()
      } else if (command === 'graph') {
        this.graphForm = { name: '', description: '' }
        this.graphDialogVisible = true
      }
    },
    // 多模态大模型：基础信息确认 -> 跳详细创建页
    handleLlmConfirm(skillInfo) {
      localStorage.setItem('tempSkillInfo', JSON.stringify(skillInfo))
      this.$router.push({ path: '/skillManage/multimodalCreateDetail' })
    },
    // 技能编排创建
    async confirmCreateGraph() {
      const name = (this.graphForm.name || '').trim()
      if (!name) { this.$message.warning('请输入技能名称'); return }
      if (/\s/.test(this.graphForm.name)) { this.$message.warning('技能名称不允许空格'); return }
      if (!/^[\u4e00-\u9fa5A-Za-z0-9]+$/.test(name)) {
        this.$message.warning('技能名称仅支持数字、中文、大小写英文字母，不允许特殊符号')
        return
      }
      this.graphCreating = true
      const skillId = 'g' + Date.now()
      const graphJson = {
        skill_id: skillId, skill_name: name, nodes: [], edges: [], tags: []
      }
      try {
        await skillGraphAPI.createGraph({
          skill_id: skillId, skill_name: name, description: this.graphForm.description, graph_json: graphJson
        })
        this.graphDialogVisible = false
        this.$router.push({ path: '/skillManage/skillGraphEditor', query: { skillId } })
      } catch (e) {
        this.$message.error('创建失败：' + this.errMsg(e))
      } finally {
        this.graphCreating = false
      }
    },

    /* ============ 导入技能文件 ============ */
    handleImportCommand(command) {
      if (command === 'graph') {
        this.openGraphImportDialog()
      } else {
        this.openImportDialog()
      }
    },
    openImportDialog() {
      this.mainFile = null
      this.dependencyFiles = []
      this.importDialogVisible = true
    },
    onMainFileChange(file) {
      if (file.raw && file.raw.size > 5 * 1024 * 1024) {
        this.$message.warning('主文件大小不能超过 5MB')
        this.mainFile = null
        return
      }
      this.mainFile = file.raw
    },
    onDepFileChange(file, fileList) {
      this.dependencyFiles = fileList.map(f => f.raw).filter(Boolean)
    },
    onDepFileRemove(file, fileList) {
      this.dependencyFiles = fileList.map(f => f.raw).filter(Boolean)
    },
    async confirmImport() {
      if (!this.mainFile) { this.$message.warning('请选择技能主文件(.py)'); return }
      this.importing = true
      try {
        const res = await skillAPI.uploadSkillFiles(this.mainFile, this.dependencyFiles)
        const body = res && res.data
        const data = (body && body.data) ? body.data : body
        const ok = body && (body.code === 0 || data && data.success)
        if (ok) {
          let reloadOk = false
          const reload = data && data.reload_result
          if (reload) {
            reloadOk = !!reload.success
          } else {
            try {
              const reloadRes = await skillAPI.reloadSkillClasses()
              const reloadBody = reloadRes && reloadRes.data
              const reloadInner = (reloadBody && reloadBody.data) ? reloadBody.data : reloadBody
              reloadOk = reloadInner && reloadInner.success
            } catch (reloadErr) {
              console.error('导入后热加载失败:', reloadErr)
            }
          }
          if (reloadOk) {
            this.$message.success('导入成功，技能已热加载')
          } else {
            this.$message.warning('文件已上传，但技能热加载失败，请在导入弹窗中点击「加载技能」')
          }
          this.importDialogVisible = false
          this.loadSkills()
        } else {
          this.$message.error((data && data.message) || (body && body.msg) || '导入失败')
        }
      } catch (e) {
        this.$message.error('导入失败：' + this.errMsg(e))
      } finally {
        this.importing = false
      }
    },

    /* ============ 导入 / 导出技能编排 ============ */
    openGraphImportDialog() {
      this.graphImportFile = null
      this.graphImportForm = { skill_id: '', skill_name: '', description: '' }
      this.graphImportVisible = true
    },
    onGraphImportFileChange(file) {
      const raw = file && file.raw
      if (!raw) return
      if (raw.size > 10 * 1024 * 1024) {
        this.$message.warning('文件大小不能超过 10MB')
        this.graphImportFile = null
        return
      }
      this.graphImportFile = raw
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const pkg = JSON.parse(reader.result)
          if (!this.graphImportForm.skill_name) {
            this.graphImportForm.skill_name = pkg.skill_name || ''
          }
          if (!this.graphImportForm.skill_id) {
            this.graphImportForm.skill_id = pkg.skill_id || ''
          }
          if (!this.graphImportForm.description) {
            this.graphImportForm.description = pkg.description || ''
          }
        } catch (e) {
          this.$message.warning('文件不是有效的 JSON 格式')
          this.graphImportFile = null
        }
      }
      reader.readAsText(raw, 'utf-8')
    },
    onGraphImportFileRemove() {
      this.graphImportFile = null
    },
    async confirmGraphImport() {
      if (!this.graphImportFile) {
        this.$message.warning('请选择技能编排 JSON 文件')
        return
      }
      const skillName = (this.graphImportForm.skill_name || '').trim()
      if (!skillName) {
        this.$message.warning('请输入技能名称')
        return
      }
      this.graphImporting = true
      try {
        const text = await this.graphImportFile.text()
        const pkg = JSON.parse(text)
        const payload = {
          package: pkg,
          skill_name: skillName
        }
        const skillId = (this.graphImportForm.skill_id || '').trim()
        if (skillId) payload.skill_id = skillId
        if (this.graphImportForm.description) payload.description = this.graphImportForm.description

        const res = await skillGraphAPI.importGraph(payload)
        const data = res && res.data ? res.data : null
        const newSkillId = data && data.skill_id
        this.$message.success('导入成功')
        this.graphImportVisible = false
        await this.loadSkills()
        if (newSkillId) {
          this.$confirm('是否立即进入编排编辑器查看？', '导入成功', {
            confirmButtonText: '进入编辑',
            cancelButtonText: '留在列表',
            type: 'success'
          }).then(() => {
            this.$router.push({ path: '/skillManage/skillGraphEditor', query: { skillId: newSkillId } })
          }).catch(() => {})
        }
      } catch (e) {
        this.$message.error('导入失败：' + this.errMsg(e))
      } finally {
        this.graphImporting = false
      }
    },
    downloadJsonFile(obj, filename) {
      const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
    },
    async exportGraph(row, e) {
      if (e && e.stopPropagation) e.stopPropagation()
      if (!row || row.kind !== 'graph') return
      try {
        const res = await skillGraphAPI.exportGraph(row.skill_id)
        const body = res && res.data ? res.data : null
        const pkg = body && body.data ? body.data : body
        if (!pkg || !pkg.graph_json) {
          this.$message.error('导出失败：未获取到编排数据')
          return
        }
        const safeName = String(row.name_zh || row.skill_id || 'skill-graph').replace(/[\\/:*?"<>|]/g, '_')
        this.downloadJsonFile(pkg, `${safeName}.skill-graph.json`)
        this.$message.success('导出成功')
      } catch (err) {
        this.$message.error('导出失败：' + this.errMsg(err))
      }
    },

    /* ============ 编辑 / 编排 ============ */
    openGraphEditor(row) {
      if (!row || row.kind !== 'graph') return
      this.$router.push({ path: '/skillManage/skillGraphEditor', query: { skillId: row.skill_id } })
    },
    openGraphEditorFromEdit() {
      const sid = this.graphEditForm.skill_id
      if (!sid) return
      this.graphEditVisible = false
      this.$router.push({ path: '/skillManage/skillGraphEditor', query: { skillId: sid } })
    },
    onVisualCoverChange(file) {
      this.visualForm.coverFile = file
      this.visualForm.imageUrl = URL.createObjectURL(file)
    },
    onGraphCoverChange(file) {
      this.graphEditForm.coverFile = file
      this.graphEditForm.imageUrl = URL.createObjectURL(file)
    },
    handleEdit(row) {
      if (row.kind === 'graph') {
        this.graphEditForm = {
          skill_id: row.skill_id,
          name_zh: row.name_zh || '',
          description: row.description || '',
          imageUrl: row.image_url || '',
          coverFile: null
        }
        this.graphEditVisible = true
      } else if (row.kind === 'llm') {
        this.editLlmSkill(row)
      } else {
        this.visualForm = {
          id: row.id,
          name_zh: row.name_zh,
          description: row.description || '',
          imageUrl: row.image_url || '',
          coverFile: null
        }
        this.visualEditVisible = true
      }
    },
    editLlmSkill(row) {
      skillAPI.getLlmSkillDetail(row.skill_id).then(response => {
        if (response.data && response.data.success) {
          const d = response.data.data
          const editData = {
            id: d.id,
            name: d.skill_name,
            skillId: d.skill_id,
            scenario: d.application_scenario === 'video_analysis' ? 'vision' : 'image',
            tags: (d.skill_tags || []).join(', ') || '',
            description: d.skill_description || '',
            iconUrl: d.skill_icon_url || '/static/logo.png',
            skillIcon: d.skill_icon || null,
            promptTemplate: d.prompt_template || '',
            outputParameters: d.output_parameters || [],
            alertConditions: d.alert_conditions || null,
            globalRelation: (d.alert_conditions && d.alert_conditions.global_relation) || 'and',
            conditionGroups: (d.alert_conditions && d.alert_conditions.condition_groups) || []
          }
          localStorage.setItem('editSkillInfo', JSON.stringify(editData))
          this.$refs.llmCreateDialog.showEdit(editData)
        } else {
          this.$message.error('获取技能详情失败')
        }
      }).catch(() => this.$message.error('获取技能详情失败'))
    },
    async confirmVisualEdit() {
      this.visualSaving = true
      let imageUploadFailed = false
      try {
        const updateRes = await skillAPI.updateSkill(this.visualForm.id, {
          name_zh: this.visualForm.name_zh,
          description: this.visualForm.description
        })
        const updateBody = updateRes && updateRes.data
        if (updateBody && updateBody.code !== undefined && updateBody.code !== 0) {
          throw new Error(updateBody.msg || '更新技能信息失败')
        }
        if (this.visualForm.coverFile) {
          try {
            const imageRes = await skillAPI.uploadSkillImage(this.visualForm.id, this.visualForm.coverFile)
            const imageBody = imageRes && imageRes.data
            if (imageBody && imageBody.code !== undefined && imageBody.code !== 0) {
              imageUploadFailed = true
            }
          } catch (uploadErr) {
            imageUploadFailed = true
            console.error('上传技能图片失败:', uploadErr)
          }
        }
        if (imageUploadFailed) {
          this.$message.warning('技能信息已保存，但图片上传失败，请稍后重试')
        } else {
          this.$message.success('保存成功')
        }
        this.visualEditVisible = false
        this.loadSkills()
      } catch (e) {
        this.$message.error('保存失败：' + this.errMsg(e))
      } finally {
        this.visualSaving = false
      }
    },
    async confirmGraphEdit() {
      const name = (this.graphEditForm.name_zh || '').trim()
      if (!name) {
        this.$message.warning('请输入技能名称')
        return
      }
      this.graphEditSaving = true
      try {
        if (this.graphEditForm.coverFile) {
          await skillGraphAPI.uploadCoverFile(this.graphEditForm.skill_id, this.graphEditForm.coverFile)
        }
        await skillGraphAPI.updateGraph(this.graphEditForm.skill_id, {
          skill_name: name,
          description: this.graphEditForm.description || ''
        })
        this.$message.success('保存成功')
        this.graphEditVisible = false
        this.loadSkills()
      } catch (e) {
        this.$message.error('保存失败：' + this.errMsg(e))
      } finally {
        this.graphEditSaving = false
      }
    },

    /* ============ 状态切换 ============ */
    async toggleStatus(row) {
      try {
        if (row.kind === 'graph') {
          row.status ? await skillGraphAPI.unpublishGraph(row.skill_id) : await skillGraphAPI.publishGraph(row.skill_id)
        } else if (row.kind === 'llm') {
          row.status ? await skillAPI.unpublishLlmSkill(row.skill_id) : await skillAPI.publishLlmSkill(row.skill_id)
        } else {
          await skillAPI.updateSkill(row.id, { status: !row.status })
        }
        this.$message.success(row.status ? '已停用' : '已启用')
        this.loadSkills()
      } catch (e) {
        this.$message.error('操作失败：' + this.errMsg(e))
      }
    },

    /* ============ 删除 ============ */
    handleDelete(row) {
      this.$confirm(`确定删除技能「${row.name_zh}」吗？`, '提示', {
        confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
      }).then(async () => {
        try {
          if (row.kind === 'graph') {
            await skillGraphAPI.deleteGraph(row.skill_id)
          } else if (row.kind === 'llm') {
            await skillAPI.deleteLlmSkill(row.skill_id)
          } else {
            await skillAPI.deleteSkill(row.id)
          }
          this.$message.success('删除成功')
          if (this.skills.length === 1 && this.currentPage > 1) this.currentPage--
          this.loadSkills()
        } catch (e) {
          this.$message.error('删除失败：' + this.errMsg(e))
        }
      }).catch(() => {})
    },

    errMsg(e) {
      return (e && e.response && e.response.data && (e.response.data.detail || e.response.data.message)) || (e && e.message) || '未知错误'
    }
  }
}
</script>

<style scoped>
.skill-list-page {
  padding: 16px;
  height: 100%;
  /* 覆盖布局组件 .layout-main-inner > * 的 overflow:hidden!important，恢复本页纵向滚动 */
  overflow-y: auto !important;
  overflow-x: hidden;
  box-sizing: border-box;
}

.filter-card { margin-bottom: 12px; border-radius: 8px; }
.filter-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
.filter-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.filter-right { display: flex; align-items: center; gap: 8px; }
.view-toggle >>> .el-radio-button__inner { padding: 7px 11px; }

.list-card { border-radius: 8px; min-height: 200px; }

.list-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.selected-hint {
  font-size: 13px;
  color: #606266;
  margin-right: 4px;
}

.import-reload-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}
.import-dialog-footer {
  display: flex;
  align-items: center;
  width: 100%;
}
.import-footer-spacer {
  flex: 1;
}

/* ---------- 卡片视图 ---------- */
.skill-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.skill-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 320px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s ease;
}
.skill-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  transform: translateY(-3px);
}
.skill-card.is-selected {
  border-color: #409eff;
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.35);
}
.sc-select {
  position: absolute;
  z-index: 5;
  top: 8px;
  left: 8px;
  padding: 2px 4px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.92);
}

/* 封面 + 种类标识 */
.sc-cover {
  position: relative;
  flex-shrink: 0;
  width: 100%;
  height: 150px;
  min-height: 150px;
  aspect-ratio: 16 / 9;
  background: #f2f3f5;
  overflow: hidden;
}
/* 图片未加载时占位，避免封面区塌陷导致卡片挤在一起 */
.sc-cover-placeholder {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: linear-gradient(110deg, #f2f3f5 8%, #e9ebee 18%, #f2f3f5 33%);
  background-size: 200% 100%;
  animation: sc-cover-shimmer 1.4s ease-in-out infinite;
  transition: opacity 0.25s ease;
}
.sc-cover:has(.sc-img.is-loaded) .sc-cover-placeholder {
  opacity: 0;
  pointer-events: none;
}
@keyframes sc-cover-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
/* 模糊背景：用同一张图放大模糊垫底，填充 contain 留白，避免灰底突兀 */
.sc-cover-bg {
  position: absolute;
  inset: 0;
  z-index: 1;
  background-size: cover;
  background-position: center;
  filter: blur(20px) saturate(1.1);
  transform: scale(1.25);
  opacity: 0.6;
}
.sc-img {
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  opacity: 0;
  transition: opacity 0.25s ease, transform 0.3s ease;
}
.sc-img.is-loaded {
  opacity: 1;
}
/* 占位 logo：等比缩放居中，留白，避免被裁切/拉伸 */
.sc-img.is-placeholder {
  object-fit: contain;
  padding: 28px;
  box-sizing: border-box;
  background: #f5f7fa;
}
.sc-img.is-placeholder.is-loaded {
  opacity: 0.7;
}
.skill-card:hover .sc-img:not(.is-placeholder) { transform: scale(1.04); }
.sc-badge {
  position: absolute;
  z-index: 3;
  left: 10px; bottom: 10px;
  padding: 2px 10px;
  font-size: 12px;
  color: #fff;
  border-radius: 12px;
  backdrop-filter: blur(2px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}
.sc-badge.badge-llm { background: rgba(64, 110, 253, 0.92); }
.sc-badge.badge-graph { background: rgba(103, 194, 58, 0.92); }

.sc-body {
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
}
.sc-name {
  font-size: 15px; font-weight: 600; color: #303133; margin-bottom: 6px;
  min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.sc-desc {
  font-size: 12px; color: #909399; line-height: 1.5;
  min-height: 36px; max-height: 36px;
  overflow: hidden; text-overflow: ellipsis;
  display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical;
  overflow-wrap: anywhere;
  margin-bottom: 10px;
}
.sc-info {
  display: flex; align-items: center; gap: 6px 8px;
  flex-wrap: wrap;
  min-width: 0;
  font-size: 12px; color: #909399; margin-bottom: 10px;
}
.sc-info-label,
.sc-info-val {
  flex-shrink: 0;
}
.sc-info-val { color: #606266; font-weight: 600; }
.sc-info-node {
  margin-left: auto;
  flex-shrink: 0;
  white-space: nowrap;
}
.sc-footer {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  border-top: 1px dashed #ebeef5;
  padding-top: 10px;
  margin-top: auto;
  min-width: 0;
}
.sc-footer > .el-tag {
  align-self: flex-start;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sc-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 6px;
  width: 100%;
}
.sc-actions .el-button {
  padding: 0 4px;
  margin: 0;
  white-space: nowrap;
}

.name-cell { display: flex; flex-direction: column; }
.name-zh { font-weight: 600; color: #303133; }
.name-sub {
  font-size: 12px; color: #909399; margin-top: 2px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 380px;
}
.danger-text { color: #f56c6c; }
.pagination-wrapper { margin-top: 16px; text-align: right; }

/* ---------- 技能详情弹窗 ---------- */
.skill-detail-dialog >>> .el-dialog__body { padding: 16px 20px; max-height: 64vh; overflow-y: auto; text-align: left; }
.detail-body { text-align: left; }
.detail-hero { display: flex; align-items: center; gap: 16px; margin-bottom: 18px; }
.detail-icon {
  flex-shrink: 0; width: 72px; height: 72px; border-radius: 12px;
  overflow: hidden; background: #f2f3f5; border: 1px solid #ebeef5;
}
.detail-icon img { width: 100%; height: 100%; object-fit: cover; display: block; }
.detail-icon img.is-placeholder {
  object-fit: contain; padding: 12px; box-sizing: border-box; background: #f5f7fa; opacity: 0.75;
}
.detail-hero-info { flex: 1; min-width: 0; }
.detail-name-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.detail-name {
  font-size: 18px; font-weight: 600; color: #303133;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.detail-meta-row { display: flex; align-items: center; gap: 12px; font-size: 12px; color: #909399; }
.detail-meta-row .detail-id {
  font-family: 'SF Mono', 'Roboto Mono', monospace;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.detail-meta-row .detail-ver { color: #606266; font-weight: 600; }
.detail-desc { margin-bottom: 14px; }
.detail-section-title {
  font-size: 13px; font-weight: 600; color: #303133; text-align: left;
  margin: 18px 0 10px; padding-left: 9px; border-left: 3px solid #409eff; line-height: 1.2;
}
.detail-tag { margin-right: 6px; margin-bottom: 4px; }
.detail-prompt-box {
  white-space: pre-wrap; word-break: break-word; line-height: 1.6; color: #606266;
  background: #f8fafc; border: 1px solid #ebeef5; border-radius: 6px;
  padding: 10px 12px; font-size: 12px; max-height: 200px; overflow-y: auto;
}
.detail-empty { font-size: 12px; color: #909399; padding: 6px 0; }
.detail-alertdefs { display: flex; flex-wrap: wrap; gap: 6px; }
.detail-subtitle { font-size: 12px; color: #606266; font-weight: 600; margin: 10px 0 8px; }
.param-name { font-weight: 600; color: #303133; margin-right: 8px; }
.param-type { color: #909399; }
.param-sub { font-size: 12px; color: #909399; margin-top: 2px; }
.detail-cond-summary {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: #606266; background: #fdf6ec; border: 1px solid #faecd8;
  border-radius: 6px; padding: 8px 12px; margin-bottom: 10px;
}
.detail-cond-summary i { color: #e6a23c; }
.detail-cond-summary b { color: #e6a23c; }
.detail-cond-group {
  border: 1px solid #ebeef5; border-radius: 8px; overflow: hidden; margin-bottom: 10px;
}
.detail-cond-group-head {
  display: flex; align-items: center; gap: 8px;
  background: #f8fafc; border-bottom: 1px solid #ebeef5; padding: 8px 12px;
}
.detail-cond-group-head .cond-group-name { font-size: 12px; font-weight: 600; color: #303133; }
.detail-cond-item {
  display: flex; align-items: center; gap: 10px; font-size: 12px; color: #606266;
  padding: 8px 12px; border-bottom: 1px dashed #f0f2f5;
}
.detail-cond-item:last-child { border-bottom: none; }
.detail-cond-item .cond-field { font-weight: 600; color: #409eff; }
.detail-cond-item .cond-op { color: #909399; }
.detail-cond-item .cond-val { color: #303133; font-weight: 600; }

/* 关联设备：可点击 + 弹层列表 */
.link-count { padding: 0; font-size: 13px; }
.device-pop { max-height: 280px; overflow-y: auto; }
.device-pop-item { padding: 8px 4px; border-bottom: 1px dashed #f0f2f5; }
.device-pop-item:last-child { border-bottom: none; }
.device-pop-head { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #303133; font-weight: 600; }
.device-pop-head i { color: #409eff; }
.device-pop-head .device-loc { margin-left: auto; font-size: 12px; color: #909399; font-weight: 400; }
.device-task {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  font-size: 12px; color: #606266; padding: 4px 0 4px 20px;
}
.device-task .dt-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
