<template>
  <div class="page-container">
    <div class="camera-management">
      <!-- 左侧分类卡片 -->
      <div class="filter-card">
        <div class="card-header">
          <div class="card-title">
            <i class="el-icon-video-camera title-icon"></i>
            <span>摄像头分类</span>
          </div>
        </div>
        <div class="card-content">
          <div class="filter-options">
            <div
              class="filter-item"
              :class="{ active: currentCameraTypeFilter === 0 }"
              @click="filterAllCameraTypes">
              <i class="el-icon-check" v-if="currentCameraTypeFilter === 0"></i>
              <span>全部类型</span>
            </div>
            <div
              class="filter-item gb-device"
              :class="{ active: currentCameraTypeFilter === 1 }"
              @click="filterByCameraType(1)">
              <i class="el-icon-check" v-if="currentCameraTypeFilter === 1"></i>
              <span>国标设备</span>
            </div>
            <div
              class="filter-item push-device"
              :class="{ active: currentCameraTypeFilter === 2 }"
              @click="filterByCameraType(2)">
              <i class="el-icon-check" v-if="currentCameraTypeFilter === 2"></i>
              <span>推流设备</span>
            </div>
            <div
              class="filter-item pull-device"
              :class="{ active: currentCameraTypeFilter === 3 }"
              @click="filterByCameraType(3)">
              <i class="el-icon-check" v-if="currentCameraTypeFilter === 3"></i>
              <span>拉流设备</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧主内容卡片 -->
      <div class="main-content">
        <!-- 操作栏卡片 -->
        <div class="operation-card">
          <div class="operation-left">
            <el-button type="primary" icon="el-icon-refresh" @click="handleRefresh">刷新列表</el-button>
            <el-button type="success" icon="el-icon-setting" @click="handleCameraManagement">摄像头管理</el-button>
          </div>
          <div class="operation-right">
            <el-input v-model="searchKeyword" placeholder="请输入设备名称搜索" style="width: 250px" clearable>
              <i slot="prefix" class="el-icon-search"></i>
            </el-input>
          </div>
        </div>

        <!-- 表格卡片 -->
        <div class="table-card">
          <el-table
            :data="deviceList"
            style="width: 100%"
            v-loading="loading"
            element-loading-text="加载中..."
            empty-text="暂无摄像头数据">
            <el-table-column type="index" label="序号" width="70" align="center" />
            <el-table-column prop="id" label="ID" width="80" align="center" />
            <el-table-column prop="name" label="摄像头名称" width="150" align="center" />
            <el-table-column prop="camera_type" label="类型" width="100" align="center">
              <template slot-scope="{ row }">
                <el-tag size="mini" effect="plain" type="">{{ getCameraTypeText(row.camera_type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template slot-scope="{ row }">
                <el-tag :type="row.status === true ? 'success' : 'danger'" size="mini">
                  <template v-if="row.camera_type === 1">
                    {{ row.status === true ? '在线' : '离线' }}
                  </template>
                  <template v-else-if="row.camera_type === 2">
                    {{ row.status === true ? '推流中' : '已停止' }}
                  </template>
                  <template v-else-if="row.camera_type === 3">
                    {{ row.status === true ? '正在拉流' : '尚未拉流' }}
                  </template>
                  <template v-else>{{ row.status }}
                    {{ row.status === true ? '启用' : '禁用' }}
                  </template>
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="location" label="设备来源" width="140" align="center" />
            <el-table-column prop="skill" label="视频技能" min-width="220" align="center">
              <template slot-scope="{ row }">
                <div v-if="row.skill && row.skill !== '-'" class="skill-tags-container">
                  <div
                    v-for="(skillName, idx) in row.skill.split(',')"
                    :key="idx"
                    class="skill-tag-item"
                    :class="isSkillRunning(row, skillName) ? 'skill-running' : 'skill-stopped'">
                    <span
                      class="skill-run-dot"
                      :class="isSkillRunning(row, skillName) ? 'is-running' : 'is-stopped'"
                      :title="isSkillRunning(row, skillName) ? '运行中' : '已停止'"></span>
                    <template v-if="getSkillKind(row, skillName) === 'llm'">
                      <i class="el-icon-magic-stick" style="color: #E6A23C; margin-right: 4px; font-size: 13px;" title="大模型技能"></i>
                    </template>
                    <template v-else-if="getSkillKind(row, skillName) === 'graph'">
                      <span class="skill-type-badge skill-type-graph" title="技能编排">编排</span>
                    </template>
                    <template v-else>
                      <span class="skill-type-badge skill-type-ai" title="视觉技能文件">AI</span>
                    </template>
                    <span class="skill-name">{{ skillName.trim() }}</span>
                  </div>
                </div>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" align="center">
              <template slot-scope="{ row }">
                <div class="operation-buttons">
                  <el-button type="text" size="mini" icon="el-icon-picture-outline"
                    @click="handleFetchSnapshot(row)">获取截图</el-button>
                  <el-button type="text" size="mini" icon="el-icon-view" class="view-detail-btn"
                    @click="handleViewDetails(row)">查看详情</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页区域 -->
          <div class="pagination-wrapper">
            <el-pagination :current-page.sync="currentPage" :page-size.sync="pageSize" :page-sizes="[10, 20, 30, 50]"
              layout="total, sizes, prev, pager, next, jumper" :total="total" @size-change="handleSizeChange"
              @current-change="handleCurrentChange" />
          </div>
        </div>
      </div>

      <!-- 截图预览对话框 -->
      <el-dialog
        title="摄像头截图预览"
        :visible.sync="snapshotVisible"
        width="720px"
        append-to-body
        custom-class="camera-snapshot-dialog"
        @closed="onSnapshotClosed">
        <div v-loading="snapshotLoading" class="snapshot-dialog-body">
          <div v-if="snapshotError" class="snapshot-error">
            <i class="el-icon-warning-outline"></i>
            <p>{{ snapshotError }}</p>
            <el-button size="small" @click="retrySnapshot">重试</el-button>
          </div>
          <div v-else-if="snapshotUrl" class="snapshot-img-wrap">
            <img :src="snapshotUrl" alt="摄像头截图" @load="snapshotLoading = false" @error="onSnapshotImgError" />
          </div>
          <div v-else class="snapshot-empty">暂无截图</div>
        </div>
        <div v-if="snapshotCamera" slot="footer" class="snapshot-dialog-footer">
          <span class="snapshot-meta">
            {{ snapshotCamera.name }}
            <el-tag size="mini" :type="snapshotCamera.status ? 'success' : 'danger'">
              {{ getSnapshotStatusText(snapshotCamera) }}
            </el-tag>
          </span>
          <el-button size="small" @click="snapshotVisible = false">关闭</el-button>
          <el-button size="small" type="primary" @click="retrySnapshot">刷新截图</el-button>
        </div>
      </el-dialog>

      <!-- 设备详情对话框 -->
      <el-dialog title="摄像头详情" :visible.sync="deviceDetailDialogVisible" width="60%" :close-on-click-modal="false">
        <div v-if="deviceDetailData" class="device-detail-content">
          <el-descriptions title="基本信息" :column="2" border>
            <el-descriptions-item label="摄像头ID">{{ deviceDetailData.id }}</el-descriptions-item>
            <el-descriptions-item label="摄像头名称">{{ deviceDetailData.name }}</el-descriptions-item>
            <el-descriptions-item label="摄像头状态">
              <el-tag :type="deviceDetailData.status ? 'success' : 'danger'">
                <template v-if="deviceDetailData.camera_type === 1">
                  {{ deviceDetailData.status ? '在线' : '离线' }}
                </template>
                <template v-else-if="deviceDetailData.camera_type === 2">
                  {{ deviceDetailData.status ? '推流中' : '已停止' }}
                </template>
                <template v-else-if="deviceDetailData.camera_type === 3">
                  {{ deviceDetailData.status ? '正在拉流' : '尚未拉流' }}
                </template>
                <template v-else>
                  {{ deviceDetailData.status ? '启用' : '禁用' }}
                </template>
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="设备来源">{{ deviceDetailData.location || '-' }}</el-descriptions-item>
            <el-descriptions-item label="摄像头类型">
              <el-tag>
                {{ getCameraTypeText(deviceDetailData.camera_type) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ deviceDetailData.createTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ deviceDetailData.updateTime || '-' }}</el-descriptions-item>
          </el-descriptions>

          <el-divider content-position="left">设备详细信息</el-divider>

          <div class="device-specific-info">
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item
                v-for="(value, key) in getDeviceSpecificInfo(deviceDetailData)"
                :label="formatPropertyLabel(key)"
                :key="key">
                <template v-if="typeof value === 'boolean'">
                  {{ value ? '是' : '否' }}
                </template>
                <template v-else-if="key.includes('Longitude') || key.includes('Latitude') && value !== null">
                  {{ Number(value).toFixed(6) }}
                </template>
                <template v-else-if="value === null || value === undefined || value === ''">
                  -
                </template>
                <template v-else>
                  {{ value }}
                </template>
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <el-divider content-position="left">关联技能</el-divider>

          <div v-if="deviceDetailData.skill_names && deviceDetailData.skill_names.length > 0" class="skills-list">
            <el-tag
              v-for="skill in deviceDetailData.skill_names"
              :key="skill"
              effect="plain"
              :type="getDetailSkillTagType(skill)"
              class="skill-tag">
              <span
                class="skill-run-dot"
                :class="isSkillRunning(deviceDetailData, skill) ? 'is-running' : 'is-stopped'"
                :title="isSkillRunning(deviceDetailData, skill) ? '运行中' : '已停止'"></span>
              <template v-if="getSkillKind(deviceDetailData, skill) === 'llm'">
                <i class="el-icon-magic-stick" style="margin-right: 4px;" title="大模型技能"></i>
              </template>
              <template v-else-if="getSkillKind(deviceDetailData, skill) === 'graph'">
                <span class="skill-type-badge skill-type-graph" style="margin-right: 4px;" title="技能编排">编排</span>
              </template>
              <template v-else>
                <span class="skill-type-badge skill-type-ai" style="margin-right: 4px;" title="视觉技能文件">AI</span>
              </template>
              {{ skill }}
              <span class="skill-run-text" :class="isSkillRunning(deviceDetailData, skill) ? 'is-running' : 'is-stopped'">
                {{ isSkillRunning(deviceDetailData, skill) ? '运行中' : '已停止' }}
              </span>
            </el-tag>
          </div>
          <el-empty v-else description="暂无关联技能"></el-empty>
        </div>
        <span slot="footer" class="dialog-footer">
          <el-button @click="deviceDetailDialogVisible = false">关 闭</el-button>
        </span>
      </el-dialog>
    </div>
  </div>
</template>

<script>
import cameraComponent from './cameraComponents/camera.js'

export default {
  ...cameraComponent
}
</script>

<style scoped>
@import './cameraComponents/camera.css';
</style>

<style>
.camera-snapshot-dialog .el-dialog__body {
  padding: 16px 20px;
}
</style>
