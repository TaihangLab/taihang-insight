<template>
  <div class="run-plan-page">
    <!-- 操作引导 -->
    <div class="guide-wrap">
      <!-- 收起态：一行摘要 -->
      <div v-if="!showGuide" class="guide-collapsed" @click="showGuide = true">
        <i class="el-icon-info guide-collapsed__icon"></i>
        <span class="guide-collapsed__label">使用前准备</span>
        <div class="guide-collapsed__steps">
          <span
            v-for="(step, i) in prepSteps"
            :key="i"
            class="guide-collapsed__tag"
            :class="{ done: isStepDone(i) }">
            <i :class="isStepDone(i) ? 'el-icon-check' : 'el-icon-circle-check'"></i>
            {{ step.title }}
          </span>
        </div>
        <span class="guide-collapsed__expand">展开引导 <i class="el-icon-arrow-down"></i></span>
      </div>

      <!-- 展开态：完整引导 -->
      <transition name="guide-expand">
        <div v-if="showGuide" class="guide-banner">
          <div class="guide-banner__head">
            <div class="guide-banner__title">
              <span class="guide-banner__badge">Guide</span>
              <span>使用前准备</span>
              <span class="guide-banner__sub">完成以下三步，即可将 AI 技能部署到监控点位</span>
            </div>
            <div class="guide-banner__tools">
              <el-checkbox v-model="guideNeverShow" size="mini" @change="onGuideNeverShow">不再提示</el-checkbox>
              <i class="el-icon-arrow-up guide-banner__close" title="收起" @click="showGuide = false"></i>
            </div>
          </div>

          <div class="guide-flow">
            <div
              v-for="(step, i) in prepSteps"
              :key="'wrap-' + i"
              class="guide-flow__item">
              <div
                class="guide-step"
                :class="{ done: isStepDone(i), current: !isStepDone(i) && isStepCurrent(i) }">
                <div class="guide-step__top">
                  <span class="guide-step__num">{{ padStepNum(i) }}</span>
                  <span v-if="isStepDone(i)" class="guide-step__status"><i class="el-icon-success"></i> 已完成</span>
                  <span v-else-if="isStepCurrent(i)" class="guide-step__status is-current">当前步骤</span>
                </div>
                <div class="guide-step__icon"><i :class="step.icon"></i></div>
                <div class="guide-step__title">{{ step.title }}</div>
                <div class="guide-step__desc">{{ step.desc }}</div>
                <router-link v-if="step.route" :to="step.route" class="guide-step__btn">
                  {{ step.linkText }} <i class="el-icon-arrow-right"></i>
                </router-link>
                <a v-else-if="step.action" class="guide-step__btn is-primary" @click="step.action">
                  {{ step.linkText }} <i class="el-icon-arrow-right"></i>
                </a>
              </div>
              <div v-if="i < prepSteps.length - 1" class="guide-arrow">
                <i class="el-icon-right"></i>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- 主内容 -->
    <el-card class="main-card" shadow="never">
      <!-- 顶栏：Tab + 工具栏 -->
      <div class="toolbar">
        <div class="toolbar__left">
          <el-tabs v-model="activeTab" class="page-tabs" @tab-click="onTabChange">
            <el-tab-pane label="运行计划" name="plan"></el-tab-pane>
            <el-tab-pane label="运行任务" name="task"></el-tab-pane>
          </el-tabs>
          <template v-if="activeTab === 'plan'">
            <el-radio-group v-model="planViewMode" size="small" class="view-toggle" @change="onViewModeChange">
              <el-radio-button label="detail">平铺视图</el-radio-button>
              <el-radio-button label="skill">技能聚合</el-radio-button>
              <el-radio-button label="point">点位聚合</el-radio-button>
            </el-radio-group>
          </template>
          <el-button
            size="small"
            :type="showFilter ? 'primary' : ''"
            :plain="!showFilter"
            icon="el-icon-s-operation"
            @click="showFilter = !showFilter">
            筛选
          </el-button>
        </div>
        <div class="toolbar__right">
          <el-tooltip content="刷新" placement="top">
            <el-button size="small" circle icon="el-icon-refresh" @click="loadData"></el-button>
          </el-tooltip>
          <template v-if="activeTab === 'plan'">
            <template v-if="planViewMode === 'detail'">
              <el-button size="small" :disabled="!multipleSelection.length" @click="batchEnable(false)">批量停用</el-button>
              <el-button size="small" :disabled="!multipleSelection.length" @click="batchEnable(true)">批量启用</el-button>
              <el-button size="small" :disabled="!multipleSelection.length" @click="batchDelete">批量删除</el-button>
            </template>
            <el-button type="primary" size="small" icon="el-icon-plus" @click="openCreate">批量创建运行计划</el-button>
          </template>
          <template v-else>
            <el-button size="small" :disabled="!taskSelection.length" @click="batchDeleteTasks">批量删除</el-button>
          </template>
        </div>
      </div>

      <!-- 筛选区 -->
      <transition name="slide-fade">
        <div v-show="showFilter" class="filter-panel">
          <el-form :inline="true" size="small" class="filter-form" @submit.native.prevent="handleSearch">
            <!-- 计划 - 平铺视图 -->
            <template v-if="activeTab === 'plan' && planViewMode === 'detail'">
              <el-form-item label="计划ID">
                <el-input v-model="filters.plan_id" placeholder="请输入计划ID" clearable style="width: 180px;" @clear="handleSearch"></el-input>
              </el-form-item>
              <el-form-item label="计划启停">
                <el-select v-model="filters.enabled" clearable placeholder="全部启停状态" style="width: 140px;" @change="handleSearch">
                  <el-option label="已启用" :value="true"></el-option>
                  <el-option label="已停用" :value="false"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="AI技能">
                <el-select
                  v-model="filters.skill_ref"
                  clearable
                  filterable
                  placeholder="全部AI技能"
                  style="width: 220px;"
                  @change="handleSkillFilterChange">
                  <el-option
                    v-for="s in skillFilterOptions"
                    :key="s.ref"
                    :label="s.label"
                    :value="s.ref">
                    <div class="skill-filter-option">
                      <span>{{ s.label }}</span>
                      <el-tag :type="skillKindTagType(s.kind)" size="mini" effect="plain">{{ s.kindLabel }}</el-tag>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="更新时间">
                <el-date-picker
                  v-model="filters.updated_range"
                  type="daterange"
                  value-format="yyyy-MM-dd"
                  range-separator="—"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  style="width: 250px;"
                  @change="handleSearch">
                </el-date-picker>
              </el-form-item>
              <el-form-item label="点位名称">
                <el-input v-model="filters.camera_name" placeholder="请输入点位名称" clearable style="width: 160px;" @clear="handleSearch"></el-input>
              </el-form-item>
            </template>

            <!-- 计划 - 技能聚合 -->
            <template v-else-if="activeTab === 'plan' && planViewMode === 'skill'">
              <el-form-item label="AI技能/ID">
                <el-input v-model="filters.keyword" placeholder="请输入AI技能名称或ID搜索" clearable style="width: 240px;" @clear="handleSearch"></el-input>
              </el-form-item>
              <el-form-item label="计划启停">
                <el-select v-model="filters.enabled" clearable placeholder="全部启停状态" style="width: 140px;" @change="handleSearch">
                  <el-option label="已启用" :value="true"></el-option>
                  <el-option label="已停用" :value="false"></el-option>
                </el-select>
              </el-form-item>
            </template>

            <!-- 计划 - 点位聚合 -->
            <template v-else-if="activeTab === 'plan' && planViewMode === 'point'">
              <el-form-item label="点位名称">
                <el-input v-model="filters.camera_name" placeholder="请输入点位名称" clearable style="width: 180px;" @clear="handleSearch"></el-input>
              </el-form-item>
              <el-form-item label="关联技能">
                <el-select
                  v-model="filters.skill_ref"
                  clearable
                  filterable
                  placeholder="全部关联技能"
                  style="width: 220px;"
                  @change="handleSkillFilterChange">
                  <el-option
                    v-for="s in skillFilterOptions"
                    :key="s.ref"
                    :label="s.label"
                    :value="s.ref">
                  </el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="计划启停">
                <el-select v-model="filters.enabled" clearable placeholder="全部启停状态" style="width: 140px;" @change="handleSearch">
                  <el-option label="已启用" :value="true"></el-option>
                  <el-option label="已停用" :value="false"></el-option>
                </el-select>
              </el-form-item>
            </template>

            <!-- 任务 -->
            <template v-else>
              <el-form-item label="任务ID">
                <el-input v-model="filters.task_id" placeholder="请输入任务ID" clearable style="width: 160px;" @clear="handleSearch"></el-input>
              </el-form-item>
              <el-form-item label="任务状态">
                <el-select v-model="filters.task_status" clearable placeholder="全部任务状态" style="width: 140px;" @change="handleSearch">
                  <el-option label="运行中" :value="true"></el-option>
                  <el-option label="已停止" :value="false"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="AI技能">
                <el-select
                  v-model="filters.task_skill_ref"
                  clearable
                  filterable
                  placeholder="全部AI技能"
                  style="width: 200px;"
                  @change="handleTaskSkillFilterChange">
                  <el-option
                    v-for="s in skillFilterOptions"
                    :key="s.ref"
                    :label="s.label"
                    :value="s.ref">
                  </el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="点位名称">
                <el-input v-model="filters.task_camera_name" placeholder="全部点位" clearable style="width: 150px;" @clear="handleSearch"></el-input>
              </el-form-item>
              <el-form-item label="所属计划">
                <el-input v-model="filters.task_plan_id" placeholder="请输入所属计划ID" clearable style="width: 160px;" @clear="handleSearch"></el-input>
              </el-form-item>
              <el-form-item label="开始时间">
                <el-date-picker
                  v-model="filters.start_range"
                  type="daterange"
                  value-format="yyyy-MM-dd"
                  range-separator="—"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  style="width: 250px;"
                  @change="handleSearch">
                </el-date-picker>
              </el-form-item>
            </template>
            <el-form-item class="filter-actions">
              <el-button @click="resetFilters">重置</el-button>
              <el-button type="primary" @click="handleSearch">查询</el-button>
            </el-form-item>
          </el-form>
        </div>
      </transition>

      <!-- 计划列表 -->
      <div v-if="activeTab === 'plan'" v-loading="loading" class="table-area">
        <!-- 点位聚合：左侧通道树 -->
        <div v-if="planViewMode === 'point'" class="point-layout">
          <div class="channel-tree-sidebar">
            <div class="tree-sidebar-head">
              <span class="tree-sidebar-head__title">组织列表</span>
              <el-checkbox v-model="includeSub" size="mini" @change="onIncludeSubChange">包含下级</el-checkbox>
            </div>
            <channel-tree-panel @node-click="onPointTreeNodeClick"></channel-tree-panel>
            <div v-if="pointFilter" class="channel-filter-bar" v-loading="pointFilterLoading">
              <div class="channel-filter-bar__info">
                <span class="channel-filter-bar__name">{{ pointFilter.label }}</span>
                <span class="channel-filter-bar__status">
                  覆盖 {{ pointFilter.ids.length }} 个点位
                </span>
              </div>
              <el-button type="text" size="mini" @click="clearPointFilter">显示全部</el-button>
            </div>
          </div>
          <div class="point-table-wrap">
            <el-table
              :data="pagedPointAggList"
              stripe
              style="width: 100%"
              empty-text="暂无数据">
              <el-table-column prop="camera_name" label="点位名称" min-width="160" show-overflow-tooltip></el-table-column>
              <el-table-column prop="skill_names" label="关联技能" min-width="200" show-overflow-tooltip></el-table-column>
              <el-table-column label="关联计划数" width="110" align="center">
                <template slot="header">
                  <span>关联计划数</span>
                  <el-tooltip content="该点位关联的运行计划总数" placement="top"><i class="el-icon-info col-tip"></i></el-tooltip>
                </template>
                <template slot-scope="{ row }">{{ row.plan_count }}</template>
              </el-table-column>
              <el-table-column label="启用计划数" width="110" align="center">
                <template slot="header">
                  <span>启用计划数</span>
                  <el-tooltip content="当前处于启用状态的计划数" placement="top"><i class="el-icon-info col-tip"></i></el-tooltip>
                </template>
                <template slot-scope="{ row }">{{ row.enabled_count }}</template>
              </el-table-column>
              <el-table-column label="运行中任务数" width="120" align="center">
                <template slot="header">
                  <span>运行中任务数</span>
                  <el-tooltip content="当前正在运行的子任务数" placement="top"><i class="el-icon-info col-tip"></i></el-tooltip>
                </template>
                <template slot-scope="{ row }">{{ row.running_count }}</template>
              </el-table-column>
              <el-table-column label="计划启停" width="100" align="center">
                <template slot-scope="{ row }">
                  <el-switch :value="row.enabled_count > 0" @change="(v) => toggleAggEnabled(row, v)"></el-switch>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="220" align="center" fixed="right">
                <template slot-scope="{ row }">
                  <el-button type="text" size="mini" @click="viewPlansByPoint(row)">查看计划</el-button>
                  <el-button type="text" size="mini" @click="viewTasksByPoint(row)">查看任务</el-button>
                  <el-button type="text" size="mini" class="danger-text" @click="deleteAggPlans(row, '点位')">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- 技能聚合 -->
        <el-table
          v-else-if="planViewMode === 'skill'"
          :data="pagedSkillAggList"
          stripe
          style="width: 100%"
          empty-text="暂无运行计划，请先创建">
          <el-table-column label="技能ID" min-width="160" show-overflow-tooltip>
            <template slot-scope="{ row }">
              <span class="mono-text">{{ row.skill_key }}</span>
            </template>
          </el-table-column>
          <el-table-column label="AI技能" min-width="220">
            <template slot-scope="{ row }">
              <div class="skill-cell">
                <el-tag v-if="row.skill_kind === 'llm'" size="mini" type="warning" effect="plain">大模型</el-tag>
                <el-tag v-else-if="row.skill_kind === 'graph'" size="mini" type="success" effect="plain">编排</el-tag>
                <span class="skill-name">{{ row.skill_name || '-' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="关联计划数" width="110" align="center">
            <template slot="header">
              <span>关联计划数</span>
              <el-tooltip content="使用该技能的运行计划总数" placement="top"><i class="el-icon-info col-tip"></i></el-tooltip>
            </template>
            <template slot-scope="{ row }">{{ row.plan_count }}</template>
          </el-table-column>
          <el-table-column label="启用计划数" width="110" align="center">
            <template slot="header">
              <span>启用计划数</span>
              <el-tooltip content="当前处于启用状态的计划数" placement="top"><i class="el-icon-info col-tip"></i></el-tooltip>
            </template>
            <template slot-scope="{ row }">{{ row.enabled_count }}</template>
          </el-table-column>
          <el-table-column label="运行中任务数" width="120" align="center">
            <template slot="header">
              <span>运行中任务数</span>
              <el-tooltip content="当前正在运行的子任务数" placement="top"><i class="el-icon-info col-tip"></i></el-tooltip>
            </template>
            <template slot-scope="{ row }">{{ row.running_count }}</template>
          </el-table-column>
          <el-table-column label="计划启停" width="100" align="center">
            <template slot-scope="{ row }">
              <el-switch :value="row.enabled_count > 0" @change="(v) => toggleAggEnabled(row, v)"></el-switch>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" align="center" fixed="right">
            <template slot-scope="{ row }">
              <el-button type="text" size="mini" @click="viewPlansBySkill(row)">查看计划</el-button>
              <el-button type="text" size="mini" @click="viewTasksBySkill(row)">查看任务</el-button>
              <el-button type="text" size="mini" class="danger-text" @click="deleteAggPlans(row, '技能')">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 平铺视图 -->
        <el-table
          v-else
          :data="planList"
          stripe
          style="width: 100%"
          empty-text="暂无运行计划，请先创建"
          @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="48" align="center"></el-table-column>
          <el-table-column label="计划ID" min-width="140">
            <template slot-scope="{ row }">
              <el-button type="text" size="mini" class="link-btn" @click="viewPlan(row)">{{ row.plan_id }}</el-button>
            </template>
          </el-table-column>
          <el-table-column label="AI技能" min-width="200">
            <template slot-scope="{ row }">
              <div class="skill-cell">
                <el-tag v-if="row.skill_kind === 'llm'" size="mini" type="warning" effect="plain">大模型</el-tag>
                <el-tag v-else-if="row.skill_kind === 'graph'" size="mini" type="success" effect="plain">编排</el-tag>
                <span class="skill-name">{{ row.skill_name || '-' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="点位名称" min-width="180" show-overflow-tooltip>
            <template slot-scope="{ row }">
              <span>{{ formatCameras(row) }}</span>
              <el-tag v-if="row.point_count > 1" size="mini" type="info" effect="plain" class="count-tag">{{ row.point_count }}个</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="运行中任务数" width="125" align="center">
            <template slot="header">
              <span>运行中任务数</span>
              <el-tooltip content="该计划下正在运行的任务数 / 任务总数；计划已启用但无运行中任务时通常是取流/启动失败，可在任务日志中查看原因" placement="top">
                <i class="el-icon-info col-tip"></i>
              </el-tooltip>
            </template>
            <template slot-scope="{ row }">
              <span :class="{ 'warn-text': row.enabled && countRunningTasks(row.plan_id) === 0 }">
                {{ countRunningTasks(row.plan_id) }}
              </span>
              <span class="dim-text"> / {{ row.task_count != null ? row.task_count : row.point_count }}</span>
              <el-tooltip
                v-if="row.enabled && countRunningTasks(row.plan_id) === 0"
                content="计划已启用但没有运行中的任务，可能启动失败或视频流异常"
                placement="top">
                <i class="el-icon-warning-outline warn-text"></i>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="计划启停" width="100" align="center">
            <template slot-scope="{ row }">
              <el-switch v-model="row.enabled" @change="(v) => toggleEnabled(row, v)"></el-switch>
            </template>
          </el-table-column>
          <el-table-column prop="updated_at" label="更新时间" width="170" align="center"></el-table-column>
          <el-table-column label="操作" width="230" align="center" fixed="right">
            <template slot-scope="{ row }">
              <el-button type="text" size="mini" @click="viewPlan(row)">查看</el-button>
              <el-button type="text" size="mini" @click="editPlan(row)">编辑</el-button>
              <el-button type="text" size="mini" @click="viewTasks(row)">查看任务</el-button>
              <el-button type="text" size="mini" class="danger-text" @click="deletePlan(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 任务列表 -->
      <div v-else v-loading="loading" class="table-area">
        <el-table
          :data="taskList"
          stripe
          style="width: 100%"
          empty-text="暂无运行任务"
          @selection-change="handleTaskSelectionChange">
          <el-table-column type="selection" width="48" align="center"></el-table-column>
          <el-table-column label="任务ID" min-width="130">
            <template slot-scope="{ row }">
              <el-button type="text" size="mini" class="link-btn" @click="viewTaskDetail(row)">{{ row.task_id }}</el-button>
            </template>
          </el-table-column>
          <el-table-column label="AI技能" min-width="190" show-overflow-tooltip>
            <template slot-scope="{ row }">
              <div class="skill-cell">
                <el-tag v-if="row.skill_kind === 'llm'" size="mini" type="warning" effect="plain">大模型</el-tag>
                <el-tag v-else-if="row.skill_kind === 'graph'" size="mini" type="success" effect="plain">编排</el-tag>
                <span class="skill-name">{{ row.skill_name || '-' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="camera_name" label="点位名称" min-width="150" show-overflow-tooltip>
            <template slot-scope="{ row }">{{ row.camera_name || '-' }}</template>
          </el-table-column>
          <el-table-column label="任务状态" width="110" align="center">
            <template slot-scope="{ row }">
              <span class="status-dot" :class="row.status ? 'is-running' : 'is-stopped'"></span>
              {{ row.status ? '运行中' : '已停止' }}
            </template>
          </el-table-column>
          <el-table-column label="所属计划" min-width="140">
            <template slot-scope="{ row }">
              <el-button type="text" size="mini" class="link-btn" @click="goPlanDetail(row.plan_id)">{{ row.plan_id }}</el-button>
            </template>
          </el-table-column>
          <el-table-column prop="start_time" label="开始时间" width="170" align="center">
            <template slot-scope="{ row }">{{ row.start_time || '-' }}</template>
          </el-table-column>
          <el-table-column label="结束时间" width="170" align="center">
            <template slot-scope="{ row }">{{ row.end_time || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="130" align="center" fixed="right">
            <template slot-scope="{ row }">
              <el-button type="text" size="mini" @click="viewTaskDetail(row)">查看</el-button>
              <el-button type="text" size="mini" class="danger-text" @click="deleteTask(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-wrapper">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :current-page.sync="page"
          :page-size.sync="limit"
          :page-sizes="[10, 20, 50]"
          :total="displayTotal"
          @current-change="loadData"
          @size-change="onSizeChange">
        </el-pagination>
      </div>
    </el-card>

    <run-plan-create-drawer
      :visible.sync="drawerVisible"
      :edit-plan="editingPlan"
      :mode="drawerMode"
      @saved="onSaved">
    </run-plan-create-drawer>
  </div>
</template>

<script>
import { runPlanAPI, skillAPI, realtimeMonitorAPI } from '@/components/service/VisionAIService.js';
import RunPlanCreateDrawer from './RunPlanCreateDrawer.vue';
import ChannelTreePanel, { resolveTreeChannel } from './ChannelTreePanel.vue';
import { skillKindTagType } from './runPlanFormat.js';

const GUIDE_STORAGE_KEY = 'run_plan_guide_hidden';

function defaultFilters() {
  return {
    // 计划（平铺）
    plan_id: '',
    enabled: '',
    skill_ref: '',
    skill_class_id: '',
    llm_skill_id: '',
    skill_kind: '',
    camera_name: '',
    updated_range: [],
    // 技能聚合
    keyword: '',
    // 任务
    task_id: '',
    task_status: '',
    task_skill_ref: '',
    task_skill_class_id: '',
    task_llm_skill_id: '',
    task_camera_name: '',
    task_plan_id: '',
    start_range: []
  };
}

export default {
  name: 'RunPlanList',
  components: { RunPlanCreateDrawer, ChannelTreePanel },
  data() {
    return {
      activeTab: 'plan',
      planViewMode: 'detail',
      showGuide: true,
      guideNeverShow: false,
      showFilter: true,
      loading: false,
      filters: defaultFilters(),
      skillFilterOptions: [],
      organizations: [],
      // 点位聚合：树筛选（单点位或某节点下级点位集合）
      pointFilter: null,
      pointFilterLoading: false,
      includeSub: true,
      lastTreeNode: null,
      planList: [],
      allPlans: [],
      taskList: [],
      allTasks: [],
      multipleSelection: [],
      taskSelection: [],
      page: 1,
      limit: 10,
      total: 0,
      drawerVisible: false,
      drawerMode: 'create',
      editingPlan: null,
      prepSteps: [
        { icon: 'el-icon-video-camera', title: '添加设备', desc: '接入摄像头或 GB 通道，作为 AI 分析的视频数据源', route: '/deviceManage/camera', linkText: '前往设备管理' },
        { icon: 'el-icon-cpu', title: '添加技能', desc: '创建视觉模型、技能编排或多模态大模型技能', route: '/skillManage/skillList', linkText: '前往技能管理' },
        { icon: 'el-icon-date', title: '创建计划', desc: '关联技能与点位，配置运行周期、参数及预警规则', linkText: '创建运行计划', action: null }
      ]
    };
  },
  computed: {
    skillAggList() {
      const map = {};
      this.applyPlanSkillFilters(this.allPlans).forEach(p => {
        const key = p.skill_kind === 'llm'
          ? 'llm:' + (p.llm_skill_id || '')
          : 'sc:' + (p.skill_class_id || '');
        if (!map[key]) {
          map[key] = {
            skill_key: p.skill_kind === 'llm' ? (p.llm_skill_id || key) : String(p.skill_class_id || key),
            skill_name: p.skill_name,
            skill_kind: p.skill_kind,
            skill_class_id: p.skill_class_id,
            llm_skill_id: p.llm_skill_id,
            plan_count: 0,
            enabled_count: 0,
            running_count: 0,
            plan_ids: []
          };
        }
        const g = map[key];
        g.plan_count++;
        if (p.enabled) g.enabled_count++;
        g.plan_ids.push(p.plan_id);
        g.running_count += this.countRunningTasks(p.plan_id);
      });
      let list = Object.values(map);
      const kw = (this.filters.keyword || '').trim().toLowerCase();
      if (kw) {
        list = list.filter(r =>
          (r.skill_name || '').toLowerCase().includes(kw) ||
          (r.skill_key || '').toLowerCase().includes(kw)
        );
      }
      return list;
    },
    pointAggList() {
      const map = {};
      this.applyPlanSkillFilters(this.allPlans).forEach(p => {
        (p.cameras || []).forEach(cam => {
          const cid = String(cam.camera_id);
          if (!map[cid]) {
            map[cid] = {
              camera_id: cam.camera_id,
              camera_name: cam.camera_name || cid,
              skill_names: new Set(),
              plan_count: 0,
              enabled_count: 0,
              running_count: 0,
              plan_ids: []
            };
          }
          const g = map[cid];
          g.skill_names.add(p.skill_name || '-');
          g.plan_count++;
          if (p.enabled) g.enabled_count++;
          g.plan_ids.push(p.plan_id);
          g.running_count += this.countRunningTasks(p.plan_id);
        });
      });
      let list = Object.values(map).map(r => ({
        ...r,
        skill_names: [...r.skill_names].join('、')
      }));
      if (this.pointFilter && this.pointFilter.ids.length) {
        const idSet = new Set(this.pointFilter.ids.map(String));
        list = list.filter(r => idSet.has(String(r.camera_id)));
      } else if (this.pointFilter) {
        list = [];
      }
      const kw = (this.filters.camera_name || '').trim();
      if (kw) {
        list = list.filter(r => (r.camera_name || '').includes(kw));
      }
      return list;
    },
    displayTotal() {
      if (this.activeTab === 'task') return this.total;
      if (this.planViewMode === 'skill') return this.skillAggList.length;
      if (this.planViewMode === 'point') return this.pointAggList.length;
      return this.total;
    },
    pagedSkillAggList() {
      const start = (this.page - 1) * this.limit;
      return this.skillAggList.slice(start, start + this.limit);
    },
    pagedPointAggList() {
      const start = (this.page - 1) * this.limit;
      return this.pointAggList.slice(start, start + this.limit);
    },
    hasCameras() {
      return this.organizations.some(o => (o.points || []).length > 0);
    },
    hasSkills() {
      return this.skillFilterOptions.length > 0;
    },
    hasPlans() {
      return this.allPlans.length > 0 || this.planList.length > 0;
    }
  },
  created() {
    this.prepSteps[2].action = () => this.openCreate();
    if (localStorage.getItem(GUIDE_STORAGE_KEY) === '1') {
      this.showGuide = false;
      this.guideNeverShow = true;
    }
    this.applyRouteQuery();
    this.loadSkillFilterOptions();
    this.loadOrganizations();
    this.loadData();
  },
  methods: {
    skillKindTagType,
    padStepNum(i) {
      return String(i + 1).padStart(2, '0');
    },
    isStepDone(i) {
      if (i === 0) return this.hasCameras;
      if (i === 1) return this.hasSkills;
      if (i === 2) return this.hasPlans;
      return false;
    },
    isStepCurrent(i) {
      if (this.isStepDone(i)) return false;
      if (i === 0) return true;
      if (i === 1) return this.isStepDone(0);
      if (i === 2) return this.isStepDone(0) && this.isStepDone(1);
      return false;
    },
    onGuideNeverShow(val) {
      if (val) {
        localStorage.setItem(GUIDE_STORAGE_KEY, '1');
        this.showGuide = false;
      } else {
        localStorage.removeItem(GUIDE_STORAGE_KEY);
      }
    },
    /** 从详情页跳回时支持 ?tab=task&plan_id=xxx 直达任务列表 */
    applyRouteQuery() {
      const q = this.$route.query || {};
      if (q.tab === 'task') {
        this.activeTab = 'task';
        if (q.plan_id) this.filters.task_plan_id = q.plan_id;
      }
    },
    async loadSkillFilterOptions() {
      try {
        this.skillFilterOptions = await skillAPI.fetchRunPlanSkillOptions();
      } catch (e) {
        console.warn('加载技能选项失败', e);
        this.skillFilterOptions = [];
      }
    },
    applyPlanSkillFilters(list) {
      let result = list || [];
      if (this.filters.llm_skill_id) {
        result = result.filter(row => row.llm_skill_id === this.filters.llm_skill_id);
      } else if (this.filters.skill_class_id) {
        result = result.filter(row => String(row.skill_class_id) === String(this.filters.skill_class_id));
      }
      if (this.filters.skill_kind) {
        result = result.filter(row => (row.skill_kind || 'visual') === this.filters.skill_kind);
      }
      return result;
    },
    handleSkillFilterChange(ref) {
      this.filters.skill_class_id = '';
      this.filters.llm_skill_id = '';
      this.filters.skill_kind = '';
      if (ref) {
        const s = this.skillFilterOptions.find(o => o.ref === ref);
        if (s) {
          if (s.kind === 'llm') {
            this.filters.llm_skill_id = s.llm_skill_id;
          } else {
            this.filters.skill_class_id = s.skill_class_id;
          }
          this.filters.skill_kind = s.kind;
        }
      }
      this.handleSearch();
    },
    handleTaskSkillFilterChange(ref) {
      this.filters.task_skill_class_id = '';
      this.filters.task_llm_skill_id = '';
      if (ref) {
        const s = this.skillFilterOptions.find(o => o.ref === ref);
        if (s) {
          if (s.kind === 'llm') {
            this.filters.task_llm_skill_id = s.llm_skill_id;
          } else {
            this.filters.task_skill_class_id = s.skill_class_id;
          }
        }
      }
      this.handleSearch();
    },
    async loadOrganizations() {
      try {
        const res = await runPlanAPI.getOrganizations();
        const d = res.data || {};
        this.organizations = d.data || [];
      } catch (e) {
        this.organizations = [];
      }
    },
    countRunningTasks(planId) {
      return this.allTasks.filter(t => t.plan_id === planId && t.status).length;
    },
    buildPlanParams() {
      const p = { page: this.page, limit: this.limit };
      if (this.filters.plan_id) p.plan_id = this.filters.plan_id.trim();
      if (this.filters.enabled !== '' && this.filters.enabled !== null) {
        p.enabled = this.filters.enabled;
      }
      if (this.filters.llm_skill_id) {
        p.llm_skill_id = this.filters.llm_skill_id;
      } else if (this.filters.skill_class_id) {
        p.skill_class_id = this.filters.skill_class_id;
      }
      if (this.filters.camera_name) p.camera_name = this.filters.camera_name.trim();
      const r = this.filters.updated_range || [];
      if (r.length === 2 && r[0] && r[1]) {
        p.updated_start = `${r[0]} 00:00:00`;
        p.updated_end = `${r[1]} 23:59:59`;
      }
      return p;
    },
    buildTaskParams() {
      const p = { page: this.page, limit: this.limit };
      if (this.filters.task_id) p.task_id = this.filters.task_id.trim();
      if (this.filters.task_status !== '' && this.filters.task_status !== null) {
        p.enabled = this.filters.task_status;
      }
      if (this.filters.task_llm_skill_id) {
        p.llm_skill_id = this.filters.task_llm_skill_id;
      } else if (this.filters.task_skill_class_id) {
        p.skill_class_id = this.filters.task_skill_class_id;
      }
      if (this.filters.task_camera_name) p.camera_name = this.filters.task_camera_name.trim();
      if (this.filters.task_plan_id) p.plan_id = this.filters.task_plan_id.trim();
      const r = this.filters.start_range || [];
      if (r.length === 2 && r[0] && r[1]) {
        p.start_time = `${r[0]} 00:00:00`;
        p.end_time = `${r[1]} 23:59:59`;
      }
      return p;
    },
    async loadAllTasks() {
      try {
        const res = await runPlanAPI.listRunTasks({ page: 1, limit: 1000 });
        const d = res.data || {};
        this.allTasks = d.data || [];
      } catch (e) {
        this.allTasks = [];
      }
    },
    async loadAllPlans() {
      try {
        const p = { page: 1, limit: 1000 };
        if (this.filters.enabled !== '' && this.filters.enabled !== null) {
          p.enabled = this.filters.enabled;
        }
        const res = await runPlanAPI.listPlans(p);
        const d = res.data || {};
        this.allPlans = d.data || [];
      } catch (e) {
        this.allPlans = [];
      }
    },
    async loadData() {
      this.loading = true;
      try {
        if (this.activeTab === 'plan') {
          await Promise.all([this.loadAllTasks(), this.loadAllPlans()]);
          const res = await runPlanAPI.listPlans(this.buildPlanParams());
          const d = res.data || {};
          this.planList = d.data || [];
          this.total = d.total || 0;
        } else {
          const res = await runPlanAPI.listRunTasks(this.buildTaskParams());
          const d = res.data || {};
          this.taskList = d.data || [];
          this.total = d.total || 0;
        }
      } catch (e) {
        this.$message.error('加载数据失败');
      } finally {
        this.loading = false;
      }
    },
    onTabChange() {
      this.page = 1;
      this.multipleSelection = [];
      this.taskSelection = [];
      this.loadData();
    },
    onViewModeChange() {
      this.page = 1;
      this.multipleSelection = [];
      if (this.planViewMode !== 'point') {
        this.clearPointFilter();
      }
    },
    /** 点位聚合：树节点点击（叶子=单点位；非叶子=该节点下点位集合） */
    async onPointTreeNodeClick(data, mode) {
      const channel = resolveTreeChannel(data);
      this.page = 1;
      if (channel) {
        if (this.pointFilter && this.pointFilter.single &&
            String(this.pointFilter.ids[0]) === String(channel.camera_id)) {
          this.clearPointFilter();
          return;
        }
        this.pointFilter = {
          label: channel.camera_name,
          ids: [channel.camera_id],
          single: true
        };
        return;
      }
      // 非叶子节点：收集其下（可选含下级）的点位
      this.lastTreeNode = { data, mode };
      this.pointFilterLoading = true;
      this.pointFilter = { label: data.name || data.label || '所选节点', ids: [], single: false };
      try {
        const ids = [];
        await this.collectChannelsUnder(data.id, mode, this.includeSub, 0, ids);
        this.pointFilter = {
          label: data.name || data.label || '所选节点',
          ids,
          single: false
        };
      } catch (e) {
        console.warn('收集节点下点位失败', e);
        this.$message.warning('获取该节点下的点位失败');
        this.pointFilter = null;
      } finally {
        this.pointFilterLoading = false;
      }
    },
    async collectChannelsUnder(parentId, mode, recursive, depth, acc) {
      if (depth > 6) return;
      // 与 RegionTree/GroupTree 的懒加载一致：根节点不传 parent
      const params = { hasChannel: true };
      if (parentId !== undefined && parentId !== null && parentId !== '') {
        params.parent = parentId;
      }
      const res = mode === 'group'
        ? await realtimeMonitorAPI.getGroupTree(params)
        : await realtimeMonitorAPI.getRegionTree(params);
      const list = (res.data && res.data.data) || [];
      for (const item of list) {
        const ch = resolveTreeChannel(item);
        if (ch) {
          acc.push(ch.camera_id);
        } else if (recursive) {
          await this.collectChannelsUnder(item.id, mode, recursive, depth + 1, acc);
        }
      }
    },
    onIncludeSubChange() {
      // 重新按新口径计算当前所选节点下的点位
      if (this.lastTreeNode && this.pointFilter && !this.pointFilter.single) {
        this.onPointTreeNodeClick(this.lastTreeNode.data, this.lastTreeNode.mode);
      }
    },
    clearPointFilter() {
      this.pointFilter = null;
      this.lastTreeNode = null;
      this.page = 1;
    },
    handleSearch() {
      this.page = 1;
      this.loadData();
    },
    resetFilters() {
      this.filters = defaultFilters();
      this.clearPointFilter();
      this.page = 1;
      this.loadData();
    },
    onSizeChange() {
      this.page = 1;
      this.loadData();
    },
    handleSelectionChange(val) {
      this.multipleSelection = val;
    },
    handleTaskSelectionChange(val) {
      this.taskSelection = val;
    },
    formatCameras(row) {
      const names = row.camera_names || [];
      if (!names.length) return '-';
      if (names.length <= 2) return names.join('、');
      return names.slice(0, 2).join('、') + '…';
    },
    // ---------- 跳转 ----------
    goPlanDetail(planId) {
      if (!planId) return;
      this.$router.push(`/skillManage/runPlan/detail/${planId}`);
    },
    viewPlan(row) {
      this.goPlanDetail(row.plan_id);
    },
    viewTaskDetail(row) {
      this.$router.push(`/skillManage/runPlan/task/${row.task_id}`);
    },
    viewTasks(row) {
      this.activeTab = 'task';
      this.filters.task_plan_id = row.plan_id;
      this.page = 1;
      this.$nextTick(() => this.loadData());
    },
    viewPlansBySkill(row) {
      this.planViewMode = 'detail';
      if (row.skill_kind === 'llm') {
        this.filters.skill_ref = 'llm:' + (row.llm_skill_id || '');
        this.filters.llm_skill_id = row.llm_skill_id || '';
        this.filters.skill_class_id = '';
      } else {
        this.filters.skill_ref = 'sc:' + (row.skill_class_id || '');
        this.filters.skill_class_id = row.skill_class_id || '';
        this.filters.llm_skill_id = '';
      }
      this.filters.skill_kind = row.skill_kind || '';
      this.handleSearch();
    },
    viewTasksBySkill(row) {
      this.activeTab = 'task';
      if (row.skill_kind === 'llm') {
        this.filters.task_skill_ref = 'llm:' + (row.llm_skill_id || '');
        this.filters.task_llm_skill_id = row.llm_skill_id || '';
        this.filters.task_skill_class_id = '';
      } else {
        this.filters.task_skill_ref = 'sc:' + (row.skill_class_id || '');
        this.filters.task_skill_class_id = row.skill_class_id || '';
        this.filters.task_llm_skill_id = '';
      }
      this.page = 1;
      this.$nextTick(() => this.loadData());
    },
    viewPlansByPoint(row) {
      this.planViewMode = 'detail';
      this.filters.camera_name = row.camera_name || '';
      this.handleSearch();
    },
    viewTasksByPoint(row) {
      this.activeTab = 'task';
      this.filters.task_camera_name = row.camera_name || '';
      this.page = 1;
      this.$nextTick(() => this.loadData());
    },
    // ---------- 计划操作 ----------
    openCreate() {
      this.editingPlan = null;
      this.drawerMode = 'create';
      this.drawerVisible = true;
    },
    async editPlan(row) {
      // 取最新详情，避免列表数据过期
      try {
        const res = await runPlanAPI.getPlan(row.plan_id);
        const d = res.data || {};
        this.editingPlan = d.data || JSON.parse(JSON.stringify(row));
      } catch (e) {
        this.editingPlan = JSON.parse(JSON.stringify(row));
      }
      this.drawerMode = 'edit';
      this.drawerVisible = true;
    },
    async toggleEnabled(row, val) {
      try {
        await runPlanAPI.setEnabled(row.plan_id, val);
        this.$message.success(val ? '已启用' : '已停用');
        this.loadAllTasks();
      } catch (e) {
        row.enabled = !val;
        this.$message.error('操作失败');
      }
    },
    /** 聚合行启停：批量启停该行关联的所有计划 */
    async toggleAggEnabled(row, val) {
      const ids = row.plan_ids || [];
      if (!ids.length) return;
      try {
        await this.$confirm(
          `确认${val ? '启用' : '停用'}该${this.planViewMode === 'skill' ? '技能' : '点位'}关联的 ${ids.length} 条计划？`,
          '操作确认', { type: 'warning' }
        );
        await runPlanAPI.batchEnable(ids, val);
        this.$message.success('操作成功');
        this.loadData();
      } catch (e) {
        if (e !== 'cancel') this.$message.error('操作失败');
      }
    },
    async deleteAggPlans(row, label) {
      const ids = row.plan_ids || [];
      if (!ids.length) return;
      try {
        await this.$confirm(`确认删除该${label}关联的 ${ids.length} 条计划及其运行任务？`, '删除确认', { type: 'warning' });
        await runPlanAPI.batchDelete(ids);
        this.$message.success('删除成功');
        this.loadData();
      } catch (e) {
        if (e !== 'cancel') this.$message.error('删除失败');
      }
    },
    async deletePlan(row) {
      try {
        await this.$confirm(`确认删除计划「${row.plan_id}」及其关联运行任务？`, '删除确认', { type: 'warning' });
        await runPlanAPI.deletePlan(row.plan_id);
        this.$message.success('删除成功');
        this.loadData();
      } catch (e) {
        if (e !== 'cancel') this.$message.error('删除失败');
      }
    },
    async batchEnable(enabled) {
      const ids = this.multipleSelection.map(r => r.plan_id).filter(Boolean);
      if (!ids.length) return;
      try {
        await runPlanAPI.batchEnable(ids, enabled);
        this.$message.success('操作成功');
        this.loadData();
      } catch (e) {
        this.$message.error('操作失败');
      }
    },
    async batchDelete() {
      const ids = this.multipleSelection.map(r => r.plan_id).filter(Boolean);
      if (!ids.length) return;
      try {
        await this.$confirm(`确认删除选中的 ${ids.length} 条计划？`, '删除确认', { type: 'warning' });
        await runPlanAPI.batchDelete(ids);
        this.$message.success('删除成功');
        this.loadData();
      } catch (e) {
        if (e !== 'cancel') this.$message.error('删除失败');
      }
    },
    // ---------- 任务操作 ----------
    async deleteTask(row) {
      try {
        await this.$confirm(`确认删除任务「${row.task_id}」？`, '删除确认', { type: 'warning' });
        await runPlanAPI.deleteRunTask(row.task_id);
        this.$message.success('删除成功');
        this.loadData();
      } catch (e) {
        if (e !== 'cancel') this.$message.error('删除失败');
      }
    },
    async batchDeleteTasks() {
      const ids = this.taskSelection.map(r => r.task_id).filter(Boolean);
      if (!ids.length) return;
      try {
        await this.$confirm(`确认删除选中的 ${ids.length} 条任务？`, '删除确认', { type: 'warning' });
        await runPlanAPI.batchDeleteRunTasks(ids);
        this.$message.success('删除成功');
        this.loadData();
      } catch (e) {
        if (e !== 'cancel') this.$message.error('删除失败');
      }
    },
    onSaved() {
      this.drawerVisible = false;
      this.loadData();
    }
  }
};
</script>

<style scoped>
.run-plan-page {
  padding: 16px 20px;
  background: #f5f7fa;
  min-height: 100%;
  overflow-y: auto !important;
  box-sizing: border-box;
  text-align: left;
}

/* 操作引导 */
.guide-wrap { margin-bottom: 14px; }

.guide-collapsed {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 16px;
  background: #fff; border: 1px solid #ebeef5; border-radius: 8px;
  cursor: pointer; transition: border-color 0.2s, box-shadow 0.2s;
}
.guide-collapsed:hover { border-color: #c6e2ff; box-shadow: 0 2px 8px rgba(64, 158, 255, 0.08); }
.guide-collapsed__icon { color: #409eff; font-size: 16px; flex-shrink: 0; }
.guide-collapsed__label { font-size: 13px; font-weight: 600; color: #303133; flex-shrink: 0; }
.guide-collapsed__steps { display: flex; align-items: center; gap: 8px; flex: 1; flex-wrap: wrap; }
.guide-collapsed__tag {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; color: #909399; background: #f5f7fa;
  padding: 2px 10px; border-radius: 12px;
}
.guide-collapsed__tag.done { color: #67c23a; background: #f0f9eb; }
.guide-collapsed__tag i { font-size: 11px; }
.guide-collapsed__expand { font-size: 12px; color: #409eff; flex-shrink: 0; white-space: nowrap; }
.guide-collapsed__expand i { margin-left: 2px; }

.guide-banner {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.guide-banner__head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px;
  background: linear-gradient(to right, #f7faff, #fff);
  border-bottom: 1px solid #f0f2f5;
}
.guide-banner__title {
  display: flex; align-items: center; gap: 10px;
  font-size: 14px; font-weight: 600; color: #1d2129;
}
.guide-banner__badge {
  font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
  color: #409eff; background: #ecf5ff;
  padding: 2px 8px; border-radius: 4px; text-transform: uppercase;
}
.guide-banner__sub { font-size: 12px; font-weight: 400; color: #909399; }
.guide-banner__tools { display: flex; align-items: center; gap: 14px; }
.guide-banner__close {
  font-size: 14px; color: #c0c4cc; cursor: pointer; padding: 4px;
  transition: color 0.15s;
}
.guide-banner__close:hover { color: #606266; }

.guide-flow {
  display: flex; align-items: stretch;
  padding: 20px 24px 22px;
  gap: 0;
}
.guide-flow__item {
  flex: 1; display: flex; align-items: stretch; min-width: 0;
}
.guide-flow__item:last-child { flex: 1; }
.guide-flow__item .guide-step { flex: 1; }
.guide-flow__item .guide-arrow { flex-shrink: 0; }
.guide-step {
  flex: 1; position: relative;
  display: flex; flex-direction: column; align-items: center; text-align: center;
  padding: 16px 12px 14px;
  border-radius: 10px;
  border: 1px solid transparent;
  transition: background 0.2s, border-color 0.2s;
}
.guide-step.current {
  background: #f7faff;
  border-color: #d9ecff;
}
.guide-step.done { opacity: 0.85; }
.guide-step__top {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  margin-bottom: 12px; width: 100%;
}
.guide-step__num {
  font-size: 22px; font-weight: 700; color: #dcdfe6;
  font-family: 'DIN Alternate', 'Helvetica Neue', sans-serif;
  line-height: 1;
}
.guide-step.current .guide-step__num { color: #409eff; }
.guide-step.done .guide-step__num { color: #b3e19d; }
.guide-step__status {
  font-size: 11px; color: #67c23a;
  display: inline-flex; align-items: center; gap: 2px;
}
.guide-step__status.is-current { color: #409eff; }
.guide-step__icon {
  width: 48px; height: 48px; border-radius: 12px;
  background: #f5f7fa; display: flex; align-items: center; justify-content: center;
  margin-bottom: 10px; transition: background 0.2s;
}
.guide-step.current .guide-step__icon { background: #ecf5ff; }
.guide-step.done .guide-step__icon { background: #f0f9eb; }
.guide-step__icon i { font-size: 22px; color: #909399; }
.guide-step.current .guide-step__icon i { color: #409eff; }
.guide-step.done .guide-step__icon i { color: #67c23a; }
.guide-step__title { font-size: 14px; font-weight: 600; color: #303133; margin-bottom: 6px; }
.guide-step__desc {
  font-size: 12px; color: #909399; line-height: 1.55;
  margin-bottom: 14px; max-width: 220px; min-height: 38px;
}
.guide-step__btn {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; color: #606266; text-decoration: none;
  padding: 6px 14px; border-radius: 16px;
  border: 1px solid #dcdfe6; background: #fff;
  transition: all 0.15s; cursor: pointer; margin-top: auto;
}
.guide-step__btn:hover { color: #409eff; border-color: #c6e2ff; background: #ecf5ff; }
.guide-step__btn.is-primary { color: #fff; background: #409eff; border-color: #409eff; }
.guide-step__btn.is-primary:hover { background: #66b1ff; border-color: #66b1ff; color: #fff; }
.guide-step__btn i { font-size: 11px; }

.guide-arrow {
  flex-shrink: 0; width: 32px;
  display: flex; align-items: center; justify-content: center;
  color: #dcdfe6; font-size: 16px; padding-top: 40px;
}

.guide-expand-enter-active, .guide-expand-leave-active { transition: all 0.22s ease; overflow: hidden; }
.guide-expand-enter, .guide-expand-leave-to { opacity: 0; max-height: 0; margin-bottom: 0; }
.guide-expand-enter-to, .guide-expand-leave { opacity: 1; max-height: 280px; }

@media (max-width: 900px) {
  .guide-flow { flex-direction: column; gap: 8px; }
  .guide-flow__item { flex-direction: column; }
  .guide-arrow { transform: rotate(90deg); padding: 0; width: auto; height: 24px; align-self: center; }
  .guide-step__desc { max-width: none; min-height: auto; }
  .guide-collapsed__steps { display: none; }
}

/* 主卡片 */
.main-card { border-radius: 10px; border: none; text-align: left; }
.main-card >>> .el-card__body { padding: 0; }

/* 工具栏 */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 20px 0;
  border-bottom: 1px solid #f0f2f5;
}
.toolbar__left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.toolbar__right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding-bottom: 12px; }

.page-tabs >>> .el-tabs__header { margin: 0; }
.page-tabs >>> .el-tabs__nav-wrap::after { display: none; }
.page-tabs >>> .el-tabs__item { height: 40px; line-height: 40px; font-size: 14px; padding: 0 20px; }
.page-tabs >>> .el-tabs__active-bar { height: 3px; border-radius: 2px; }

.view-toggle >>> .el-radio-button__inner { padding: 7px 14px; font-size: 13px; }

/* 筛选面板 */
.filter-panel {
  padding: 16px 20px 4px;
  background: #fafbfc;
  border-bottom: 1px solid #f0f2f5;
  text-align: left;
}
.filter-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  text-align: left;
}
.filter-form >>> .el-form-item { margin-bottom: 12px; margin-right: 16px; }
.filter-form >>> .el-form-item__label {
  color: #606266;
  font-size: 13px;
  text-align: left;
  justify-content: flex-start;
}
.filter-actions { margin-left: auto !important; margin-right: 0 !important; float: none; }

/* 表格区域 */
.table-area { padding: 16px 20px 0; min-height: 200px; }
.table-area >>> .el-table th { background: #fafbfc !important; color: #606266; font-weight: 600; font-size: 13px; }
.table-area >>> .el-table td { font-size: 13px; }
.col-tip { margin-left: 4px; color: #c0c4cc; cursor: help; font-size: 13px; }

/* 点位聚合布局 */
.point-layout { display: flex; gap: 16px; min-height: 420px; align-items: stretch; }
.channel-tree-sidebar {
  flex-shrink: 0;
  width: 260px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 420px;
  align-self: stretch;
}
.tree-sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 4px;
}
.tree-sidebar-head__title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}
.channel-tree-sidebar >>> .channel-tree-panel {
  flex: 1;
  min-height: 0;
}
.channel-filter-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px; font-size: 12px; color: #606266;
  background: #ecf5ff; border-radius: 6px; text-align: left;
}
.channel-filter-bar__info { flex: 1; min-width: 0; }
.channel-filter-bar__name {
  display: block;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 2px;
}
.channel-filter-bar__status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #909399;
}
.point-table-wrap { flex: 1; min-width: 0; }

/* 单元格 */
.skill-cell { display: flex; align-items: center; gap: 6px; }
.skill-filter-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.skill-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.count-tag { margin-left: 4px; }
.mono-text { font-family: 'SF Mono', 'Roboto Mono', Consolas, monospace; font-size: 12px; color: #409eff; }
.link-btn { padding: 0; font-family: 'SF Mono', 'Roboto Mono', Consolas, monospace; color: #409eff; }
.danger-text { color: #f56c6c; }
.warn-text { color: #e6a23c; }
.dim-text { color: #909399; }

/* 状态点 */
.status-dot {
  display: inline-block; width: 7px; height: 7px;
  border-radius: 50%; margin-right: 6px; vertical-align: middle;
}
.status-dot.is-running { background: #67c23a; box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.25); }
.status-dot.is-stopped { background: #c0c4cc; }

.pagination-wrapper {
  display: flex; justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid #f0f2f5;
}

/* 动画 */
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.25s ease; }
.slide-fade-enter, .slide-fade-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
