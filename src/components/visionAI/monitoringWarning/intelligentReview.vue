<template>
  <div class="intelligent-review-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">智能复判配置</h2>
        <p class="page-subtitle">为AI任务和多模态任务配置智能复判，提高预警准确性</p>
      </div>
      <div class="header-right">
        <!-- 服务状态（自动启动，无需手动控制） -->
        <div class="service-status" :class="serviceStatusClass">
          <i class="status-icon" :class="serviceStatusIcon"></i>
          <span class="status-text">复判服务: {{ serviceStatusText }}</span>
          <el-tooltip content="复判服务已随系统自动启动，无需手动控制" placement="bottom">
            <el-tag :type="serviceStatus === 'running' ? 'success' : 'warning'" size="small" style="margin-left: 10px;">
              {{ serviceStatus === 'running' ? '自动运行中' : '启动中...' }}
            </el-tag>
          </el-tooltip>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <i class="el-icon-s-check stat-icon success"></i>
          <div class="stat-info">
            <div class="stat-value">{{ reviewEnabledCount }}</div>
            <div class="stat-label">已启用复判</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <i class="el-icon-s-platform stat-icon primary"></i>
          <div class="stat-info">
            <div class="stat-value">{{ totalTasksCount }}</div>
            <div class="stat-label">任务总数</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <i class="el-icon-cpu stat-icon warning"></i>
          <div class="stat-info">
            <div class="stat-value">{{ availableSkillsCount }}</div>
            <div class="stat-label">可用复判技能</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <i class="el-icon-document stat-icon info"></i>
          <div class="stat-info">
            <div class="stat-value">{{ queueSize }}</div>
            <div class="stat-label">队列待处理</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 主内容区 -->
    <el-card class="main-content">
      <!-- 搜索和过滤 -->
      <div class="filter-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索任务名称或描述"
          prefix-icon="el-icon-search"
          clearable
          style="width: 300px; margin-right: 10px;"
          @input="handleSearch"
        />
        <el-select
          v-model="taskTypeFilter"
          placeholder="任务类型"
          clearable
          style="width: 150px; margin-right: 10px;"
          @change="handleFilterChange"
        >
          <el-option label="AI任务" value="ai_task"></el-option>
          <el-option label="多模态任务" value="llm_task"></el-option>
        </el-select>
        <el-select
          v-model="reviewStatusFilter"
          placeholder="复判状态"
          clearable
          style="width: 150px; margin-right: 10px;"
          @change="handleFilterChange"
        >
          <el-option label="已启用" value="enabled"></el-option>
          <el-option label="未启用" value="disabled"></el-option>
        </el-select>
        <el-button type="primary" icon="el-icon-refresh" @click="refreshData">刷新</el-button>
      </div>

      <!-- 任务列表 -->
      <el-table
        :data="filteredTaskList"
        v-loading="tableLoading"
        style="width: 100%; margin-top: 20px;"
        :row-class-name="tableRowClassName"
      >
        <el-table-column prop="name" label="任务名称" width="300">
          <template #default="scope">
            <div class="task-name-cell">
              <el-tag :type="scope.row.task_type === 'ai_task' ? 'primary' : 'success'" size="small" style="margin-right: 8px;">
                {{ scope.row.task_type === 'ai_task' ? 'AI' : 'LLM' }}
              </el-tag>
              <span class="task-name-text">{{ scope.row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip>
          <template #default="scope">
            <span>{{ scope.row.description || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="任务状态" width="90" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status ? 'success' : 'info'" size="small">
              {{ scope.row.status ? '运行中' : '已停止' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="复判状态" width="90" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.review_enabled ? 'success' : 'info'" size="small">
              {{ scope.row.review_enabled ? '已启用' : '未启用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="复判技能" width="180" show-overflow-tooltip>
          <template #default="scope">
            <span v-if="scope.row.review_skill_name" style="font-weight: 500; color: #303133;">
              {{ scope.row.review_skill_name }}
            </span>
            <span v-else style="color: #909399;">未配置</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center">
          <template #default="scope">
            <el-button
              link
              size="small"
              icon="el-icon-edit"
              @click="handleConfigReview(scope.row)"
            >
              配置
            </el-button>
            <el-button
              v-if="scope.row.review_enabled"
              link
              size="small"
              icon="el-icon-close"
              style="color: #f56c6c;"
              @click="handleDisableReview(scope.row)"
            >
              停用
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-if="total > 0"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        style="margin-top: 20px; text-align: right;"
      >
      </el-pagination>
    </el-card>

    <!-- 复判配置对话框 -->
    <el-dialog
      :title="`配置复判 - ${currentTask ? currentTask.name : ''}`"
      :visible.sync="configDialogVisible"
      width="600px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form
        ref="configForm"
        :model="configForm"
        :rules="configRules"
        label-width="140px"
      >
        <el-form-item label="启用复判" prop="review_enabled">
          <el-switch
            v-model="configForm.review_enabled"
            active-text="启用"
            inactive-text="禁用"
          >
          </el-switch>
        </el-form-item>

        <el-form-item label="复判技能" prop="review_skill_class_id" v-if="configForm.review_enabled">
          <el-select
            v-model="configForm.review_skill_class_id"
            placeholder="请选择复判技能"
            style="width: 100%;"
            filterable
          >
            <el-option
              v-for="skill in availableSkills"
              :key="skill.id"
              :label="skill.skill_name"
              :value="skill.id"
            >
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>{{ skill.skill_name }}</span>
                <el-tag :type="skill.status ? 'success' : 'info'" size="small">
                  {{ skill.status ? '在线' : '离线' }}
                </el-tag>
              </div>
            </el-option>
          </el-select>
          <div style="color: #909399; font-size: 12px; margin-top: 5px;">
            选择一个复判技能来对预警进行二次判断，技能会自动分析并返回是否为误报
          </div>
        </el-form-item>

        <!-- 技能详情预览 -->
        <el-form-item label="技能信息" v-if="configForm.review_enabled && selectedSkillDetail">
          <div class="skill-detail-card">
            <div class="skill-detail-row">
              <label>技能名称：</label>
              <span class="skill-name-text">{{ selectedSkillDetail.skill_name }}</span>
            </div>
            <div class="skill-detail-row" v-if="selectedSkillDetail.tags && selectedSkillDetail.tags.length > 0">
              <label>技能标签：</label>
              <div>
                <el-tag v-for="tag in selectedSkillDetail.tags" :key="tag" size="small" style="margin-right: 5px;">
                  {{ tag }}
                </el-tag>
              </div>
            </div>
            <div class="skill-detail-row">
              <label>功能描述：</label>
              <span>{{ selectedSkillDetail.description || '无描述' }}</span>
            </div>
            <div class="skill-detail-tip">
              <i class="el-icon-info"></i>
              该技能会自动分析预警内容，判断是否为误报
            </div>
          </div>
        </el-form-item>
      </el-form>

      <div slot="footer" class="dialog-footer">
        <el-button @click="configDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveConfig" :loading="saveLoading">
          保存配置
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { taskReviewAPI, skillAPI, reviewSkillAPI } from '../../service/VisionAIService.js';

export default {
  name: 'IntelligentReview',
  data() {
    return {
      // 服务状态（自动启动）
      serviceStatus: 'stopped', // 'running' | 'stopped' | 'error'
      queueSize: 0,

      // 统计数据
      reviewEnabledCount: 0,
      totalTasksCount: 0,
      availableSkillsCount: 0,

      // 搜索和过滤
      searchKeyword: '',
      taskTypeFilter: '',
      reviewStatusFilter: '',

      // 表格数据
      tableLoading: false,
      taskList: [],
      currentPage: 1,
      pageSize: 20,
      total: 0,

      // 可用技能
      availableSkills: [],

      // 配置对话框
      configDialogVisible: false,
      currentTask: null,
      saveLoading: false,
      configForm: {
        review_enabled: false,
        review_skill_class_id: null
      },
      configRules: {
        review_skill_class_id: [
          { required: true, message: '请选择复判技能', trigger: 'change' }
        ]
      },

      // 刷新定时器
      refreshTimer: null
    };
  },
  computed: {
    // 服务状态样式类
    serviceStatusClass() {
      return {
        'status-running': this.serviceStatus === 'running',
        'status-stopped': this.serviceStatus === 'stopped',
        'status-error': this.serviceStatus === 'error'
      };
    },
    // 服务状态图标
    serviceStatusIcon() {
      return {
        'el-icon-success': this.serviceStatus === 'running',
        'el-icon-warning': this.serviceStatus === 'stopped',
        'el-icon-error': this.serviceStatus === 'error'
      };
    },
    // 服务状态文本
    serviceStatusText() {
      const statusMap = {
        running: '运行中',
        stopped: '已停止',
        error: '异常'
      };
      return statusMap[this.serviceStatus] || '未知';
    },
    // 过滤后的任务列表
    filteredTaskList() {
      let list = [...this.taskList];

      // 搜索关键词过滤
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase();
        list = list.filter(task =>
          task.name.toLowerCase().includes(keyword) ||
          (task.description && task.description.toLowerCase().includes(keyword))
        );
      }

      // 任务类型过滤
      if (this.taskTypeFilter) {
        list = list.filter(task => task.task_type === this.taskTypeFilter);
      }

      // 复判状态过滤
      if (this.reviewStatusFilter) {
        const enabled = this.reviewStatusFilter === 'enabled';
        list = list.filter(task => task.review_enabled === enabled);
      }

      return list;
    },
    // 选中的技能详情
    selectedSkillDetail() {
      if (!this.configForm.review_skill_class_id) return null;
      return this.availableSkills.find(
        skill => skill.id === this.configForm.review_skill_class_id
      );
    }
  },
  created() {
    this.init();
  },
  beforeDestroy() {
    // 清除定时器
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  },
  methods: {
    // 初始化
    async init() {
      await this.loadServiceStatus();
      await this.loadAvailableSkills();
      await this.loadTaskList();
      
      // 启动定时刷新（每30秒）
      this.refreshTimer = setInterval(() => {
        this.loadServiceStatus();
      }, 30000);
    },

    // 加载服务状态
    async loadServiceStatus() {
      try {
        const response = await taskReviewAPI.getReviewServiceStatus();
        const data = response.data;
        
        this.serviceStatus = data.status || 'stopped';
        this.queueSize = data.queue_size || 0;
      } catch (error) {
        console.error('获取服务状态失败:', error);
        this.serviceStatus = 'error';
      }
    },

    // 加载可用技能
    async loadAvailableSkills() {
      try {
        const response = await taskReviewAPI.getAvailableReviewSkills();
        const data = response.data;
        
        this.availableSkills = data.skills || [];
        this.availableSkillsCount = this.availableSkills.length;
      } catch (error) {
        console.error('获取可用技能失败:', error);
        this.$message.error('获取可用复判技能失败');
      }
    },

    // 加载任务列表
    async loadTaskList() {
      this.tableLoading = true;
      try {
        // 加载AI任务
        const aiTasksResponse = await taskReviewAPI.getAITasksForReview({
          page: 1,
          limit: 1000 // 获取所有任务
        });
        const aiTasks = (aiTasksResponse.data.data || []).map(task => ({
          ...task,
          task_type: 'ai_task'
        }));

        // 加载LLM任务
        const llmTasksResponse = await skillAPI.getLlmTaskList({
          page: 1,
          limit: 1000
        });
        const llmTasks = (llmTasksResponse.data.data || []).map(task => ({
          ...task,
          task_type: 'llm_task'
        }));

        // 合并任务列表
        this.taskList = [...aiTasks, ...llmTasks];
        this.totalTasksCount = this.taskList.length;

        // 为每个任务加载复判配置
        await this.loadReviewConfigs();

        // 计算启用复判的任务数
        this.reviewEnabledCount = this.taskList.filter(t => t.review_enabled).length;

        this.total = this.taskList.length;
      } catch (error) {
        console.error('获取任务列表失败:', error);
        this.$message.error('获取任务列表失败');
      } finally {
        this.tableLoading = false;
      }
    },

    // 加载复判配置
    async loadReviewConfigs() {
      const promises = this.taskList.map(async (task, index) => {
        try {
          const response = await taskReviewAPI.getTaskReviewConfig(
            task.task_type,
            task.id
          );
          const config = response.data;
          
          // 使用 Vue.set 确保响应式更新
          task.has_config = config.has_config;
          task.review_enabled = config.review_enabled || false;
          task.review_skill_class_id = config.review_skill_class_id;
          task.review_skill_name = config.review_skill_name;
          task.review_skill_tags = config.review_skill_tags || [];
        } catch (error) {
          console.error(`加载任务 ${task.name} 的复判配置失败:`, error);
          // 如果API调用失败，使用默认值
          task.has_config = false;
          task.review_enabled = false;
          task.review_skill_class_id = null;
          task.review_skill_name = null;
          task.review_skill_tags = [];
        }
      });

      await Promise.all(promises);
      
      // 强制更新视图
      this.$forceUpdate();
    },


    // 搜索
    handleSearch() {
      // 搜索是响应式的，无需额外处理
    },

    // 过滤变化
    handleFilterChange() {
      // 过滤是响应式的，无需额外处理
    },

    // 刷新数据
    async refreshData() {
      await this.loadServiceStatus();
      await this.loadAvailableSkills();
      await this.loadTaskList();
      this.$message.success('数据已刷新');
    },

    // 配置复判
    handleConfigReview(task) {
      this.currentTask = task;
      
      // 初始化表单数据
      this.configForm = {
        review_enabled: task.review_enabled || false,
        review_skill_class_id: task.review_skill_class_id || null
      };

      this.configDialogVisible = true;
    },

    // 停用复判
    handleDisableReview(task) {
      this.$confirm(`确认要停用任务"${task.name}"的复判功能吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        this.tableLoading = true;
        try {
          await taskReviewAPI.updateTaskReviewConfig(
            task.task_type,
            task.id,
            { review_enabled: false }
          );
          this.$message.success('已停用复判');
          
          // 重新加载任务列表以更新显示
          await this.loadTaskList();
        } catch (error) {
          console.error('停用复判失败:', error);
          this.$message.error('停用复判失败: ' + (error.message || '未知错误'));
        } finally {
          this.tableLoading = false;
        }
      }).catch(() => {});
    },

    // 保存配置
    handleSaveConfig() {
      this.$refs.configForm.validate(async (valid) => {
        if (!valid) {
          return false;
        }

        this.saveLoading = true;
        
        try {
          // 构建配置对象
          const config = {
            review_enabled: this.configForm.review_enabled,
            review_skill_class_id: this.configForm.review_skill_class_id || null
          };

          // 调用API更新配置
          await taskReviewAPI.updateTaskReviewConfig(
            this.currentTask.task_type,
            this.currentTask.id,
            config
          );
          
          this.$message.success(config.review_enabled ? '配置保存成功' : '已停用复判');
          this.configDialogVisible = false;
          
          // 重新加载任务列表以更新显示
          await this.loadTaskList();
          
        } catch (error) {
          console.error('保存配置失败:', error);
          const errorMsg = (error.response && error.response.data && error.response.data.detail) || error.message || '未知错误';
          this.$message.error('保存配置失败: ' + errorMsg);
        } finally {
          this.saveLoading = false;
        }
      });
    },

    // 对话框关闭
    handleDialogClose() {
      this.$refs.configForm.resetFields();
      this.currentTask = null;
    },

    // 表格行样式
    tableRowClassName({ row }) {
      if (!row.status) {
        return 'row-disabled';
      }
      if (row.review_enabled) {
        return 'row-review-enabled';
      }
      return '';
    },

    // 分页
    handleSizeChange(val) {
      this.pageSize = val;
    },
    handleCurrentChange(val) {
      this.currentPage = val;
    }
  }
};
</script>

<style scoped>
.intelligent-review-container {
  padding: 20px;
  background-color: #f5f7fa;
  height: 100%;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
}

/* 服务状态 */
.service-status {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  border-radius: 6px;
  background: #f5f7fa;
  transition: all 0.3s;
}

.service-status.status-running {
  background: #f0f9ff;
  border: 1px solid #67c23a;
}

.service-status.status-stopped {
  background: #fdf6ec;
  border: 1px solid #e6a23c;
}

.service-status.status-error {
  background: #fef0f0;
  border: 1px solid #f56c6c;
}

.status-icon {
  font-size: 18px;
  margin-right: 8px;
}

.status-running .status-icon {
  color: #67c23a;
}

.status-stopped .status-icon {
  color: #e6a23c;
}

.status-error .status-icon {
  color: #f56c6c;
}

.status-text {
  font-size: 14px;
  font-weight: 500;
  margin-right: 15px;
  color: #303133;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  transition: all 0.3s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.stat-icon {
  font-size: 48px;
  margin-right: 20px;
  opacity: 0.8;
}

.stat-icon.success {
  color: #67c23a;
}

.stat-icon.primary {
  color: #409eff;
}

.stat-icon.warning {
  color: #e6a23c;
}

.stat-icon.info {
  color: #909399;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

/* 主内容区 */
.main-content {
  border-radius: 8px;
}

.filter-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

/* 任务名称单元格 */
.task-name-cell {
  display: flex;
  align-items: center;
}

.task-name-text {
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 复判技能单元格 */
.review-skill-cell {
  padding: 4px 0;
}

.review-skill-cell .skill-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  font-size: 13px;
}

.review-skill-cell .skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* 表格行样式 */
:deep(.row-disabled) {
  background-color: #fafafa;
  opacity: 0.7;
}

:deep(.row-review-enabled) {
  background-color: #f0f9ff;
}

/* 技能详情卡片 */
.skill-detail-card {
  padding: 15px;
  background: linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%);
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.skill-detail-row {
  display: flex;
  margin-bottom: 12px;
  font-size: 13px;
  line-height: 1.6;
}

.skill-detail-row:last-child {
  margin-bottom: 0;
}

.skill-detail-row label {
  min-width: 100px;
  color: #606266;
  font-weight: 500;
  flex-shrink: 0;
}

.skill-detail-row span {
  color: #303133;
  flex: 1;
}

.skill-detail-row > div {
  flex: 1;
}

.skill-name-text {
  font-weight: 600;
  color: #409eff;
  font-size: 14px;
}

.skill-detail-tip {
  margin-top: 15px;
  padding: 10px;
  background: #ecf5ff;
  border-left: 3px solid #409eff;
  border-radius: 4px;
  color: #409eff;
  font-size: 13px;
  display: flex;
  align-items: center;
}

.skill-detail-tip i {
  margin-right: 8px;
  font-size: 16px;
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

/* 响应式 */
@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-right {
    margin-top: 15px;
    width: 100%;
  }

  .service-status {
    width: 100%;
    justify-content: space-between;
  }
}
</style>

