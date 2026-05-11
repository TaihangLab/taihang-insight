<template>
  <div class="push-streams-container management-page-container">
    <!-- 搜索筛选区域 -->
    <el-card class="search-card management-search-card" shadow="never">
      <div class="search-form">
        <div class="search-row">
          <div class="search-item">
            <label>关键字搜索：</label>
            <el-input
              v-model="searchSrt"
              placeholder="应用名、流ID、名称"
              style="width: 220px;"
              clearable
              @input="getPushList"
              @keyup.enter.native="getPushList"
              @clear="getPushList">
              <i slot="prefix" class="el-icon-search"></i>
            </el-input>
          </div>
          
          <div class="search-item">
            <label>流媒体：</label>
            <el-select
              v-model="mediaServerId"
              placeholder="请选择"
              style="width: 120px;"
              clearable
              @change="getPushList">
              <el-option label="全部" value=""></el-option>
              <el-option
                v-for="item in mediaServerList"
                :key="item.id"
                :label="item.id"
                :value="item.id">
              </el-option>
            </el-select>
          </div>

          <div class="search-item">
            <label>推流状态：</label>
            <el-select
              v-model="pushing"
              placeholder="请选择"
              style="width: 120px;"
              clearable
              @change="getPushList">
              <el-option label="全部" value=""></el-option>
              <el-option label="推流中" value="true"></el-option>
              <el-option label="已停止" value="false"></el-option>
            </el-select>
          </div>

          <div class="search-actions">
            <el-button type="primary" icon="el-icon-search" @click="getPushList">搜索</el-button>
            <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 推流统计卡片 -->
    <div class="stats-cards management-stats-cards">
      <el-card class="stat-card management-stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon online">
            <i class="el-icon-video-play"></i>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ streamStats.pushing }}</div>
            <div class="stat-label">推流中</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card management-stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon offline">
            <i class="el-icon-video-pause"></i>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ streamStats.stopped }}</div>
            <div class="stat-label">已停止</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card management-stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon total">
            <i class="el-icon-box"></i>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ total }}</div>
            <div class="stat-label">总数量</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 推流列表 -->
    <el-card class="table-card management-table-card" shadow="never">
      <div slot="header" class="card-header">
        <div class="header-left-group">
          <span class="card-title">推流列表</span>
        </div>
        <div class="card-actions">
          <el-button type="primary" size="mini" icon="el-icon-plus" @click="addStream">添加推流</el-button>
          <el-button type="info" size="mini" icon="el-icon-upload2" @click="importChannel">导入</el-button>
          <el-button size="mini" icon="el-icon-download">
            <a style="color: inherit; text-decoration: none" href="/static/file/推流通道导入.zip" download>模板</a>
          </el-button>
          <el-button type="success" size="mini" icon="el-icon-refresh" @click="refresh" :loading="loading">刷新</el-button>
          
          <el-divider direction="vertical"></el-divider>
          
          <el-button-group>
            <el-button size="mini" :type="viewMode === 'table' ? 'primary' : ''" icon="el-icon-menu" @click="viewMode = 'table'">列表</el-button>
            <el-button size="mini" :type="viewMode === 'card' ? 'primary' : ''" icon="el-icon-s-grid" @click="viewMode = 'card'">卡片</el-button>
          </el-button-group>
          <el-button
            icon="el-icon-delete"
            size="mini"
            :disabled="multipleSelection.length === 0"
            type="danger"
            @click="batchDel">
            批量删除 ({{multipleSelection.length}})
          </el-button>
        </div>
      </div>

      <!-- 表格视图 -->
      <div v-if="viewMode === 'table'">
        <el-table
          ref="pushListTable"
          :data="pushList"
          v-loading="loading"
          element-loading-text="加载中..."
          element-loading-spinner="el-icon-loading"
          element-loading-background="rgba(0, 0, 0, 0.8)"
          empty-text="暂无推流数据"
          style="width: 100%"
          stripe
          border
          @selection-change="handleSelectionChange"
          :row-key="(row)=> row.app + row.stream">
        
        <el-table-column type="selection" :reserve-selection="true" width="55" align="center"></el-table-column>
        <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
        
        <el-table-column prop="gbName" label="名称" min-width="160" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <div class="stream-name">
              <i class="el-icon-video-camera stream-icon"></i>
              <span>{{ row.gbName || '-' }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="app" label="应用名" min-width="100" align="center" show-overflow-tooltip></el-table-column>
        <el-table-column prop="stream" label="流ID" min-width="180" align="center" show-overflow-tooltip></el-table-column>
        
        <el-table-column label="推流状态" min-width="100" align="center">
          <template slot-scope="{ row }">
            <el-tag size="medium" v-if="row.pushing && Vue.prototype.$myServerId !== row.serverId" style="border-color: #ecf1af">推流中</el-tag>
            <el-tag size="medium" v-if="row.pushing && Vue.prototype.$myServerId === row.serverId">推流中</el-tag>
            <el-tag size="medium" type="info" v-if="!row.pushing">已停止</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="gbDeviceId" label="国标编码" min-width="180" align="center" show-overflow-tooltip></el-table-column>
        
        <el-table-column label="位置信息" min-width="150" align="center">
          <template slot-scope="{ row }">
            <div v-if="row.gbLongitude && row.gbLatitude" class="location-info">
              <div>{{ row.gbLongitude }}</div>
              <div>{{ row.gbLatitude }}</div>
            </div>
            <el-tag v-else size="small" type="info">无</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="mediaServerId" label="流媒体" min-width="120" align="center" show-overflow-tooltip></el-table-column>
        
        <el-table-column label="开始时间" min-width="160" align="center">
          <template slot-scope="{ row }">
            <span>{{ row.pushTime || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="420" align="center" fixed="right">
          <template slot-scope="{ row }">
            <div class="operation-buttons">
              <el-button 
                size="mini" 
                :loading="row.playLoading" 
                icon="el-icon-video-play" 
                @click="playPush(row)" 
                type="primary">
                播放
              </el-button>
              <el-button 
                size="mini" 
                icon="el-icon-edit" 
                type="success" 
                @click="edit(row)">
                编辑
              </el-button>
              <el-button 
                size="mini" 
                icon="el-icon-cloudy" 
                type="info" 
                @click="queryCloudRecords(row)">
                云端录像
              </el-button>
              <el-button 
                size="mini" 
                icon="el-icon-delete" 
                type="danger" 
                @click="deletePush(row.id)">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
        </el-table>
      </div>

      <!-- 卡片视图 -->
      <div v-if="viewMode === 'card'" class="stream-cards">
        <div v-for="stream in pushList" :key="stream.app + stream.stream" class="stream-card-item">
          <el-card shadow="hover" class="stream-card">
            <div class="stream-card-header">
              <div class="stream-status-badge">
                <el-badge 
                  :type="stream.pushing ? 'success' : 'danger'" 
                  is-dot 
                  class="status-dot">
                </el-badge>
              </div>
              <div class="stream-title">
                <h4>{{ stream.gbName || '未命名推流' }}</h4>
                <p>{{ stream.app }}/{{ stream.stream }}</p>
              </div>
            </div>
            
            <div class="stream-card-content">
              <div class="stream-info-row">
                <span class="info-label">应用名：</span>
                <span class="info-value">{{ stream.app || '未知' }}</span>
              </div>
              <div class="stream-info-row">
                <span class="info-label">流ID：</span>
                <span class="info-value">{{ stream.stream || '未知' }}</span>
              </div>
              <div class="stream-info-row">
                <span class="info-label">国标编码：</span>
                <span class="info-value">{{ stream.gbDeviceId || '无' }}</span>
              </div>
              <div class="stream-info-row">
                <span class="info-label">流媒体：</span>
                <span class="info-value">{{ stream.mediaServerId || '未知' }}</span>
              </div>
              <div class="stream-info-row">
                <span class="info-label">开始时间：</span>
                <span class="info-value">{{ stream.pushTime || '无' }}</span>
              </div>
              <div class="stream-info-row" v-if="stream.gbLongitude && stream.gbLatitude">
                <span class="info-label">位置信息：</span>
                <span class="info-value">{{ stream.gbLongitude }}, {{ stream.gbLatitude }}</span>
              </div>
            </div>
            
            <div class="stream-card-actions">
              <el-button size="mini" type="primary" icon="el-icon-video-play" :loading="stream.playLoading" @click="playPush(stream)">
                播放
              </el-button>
              <el-button size="mini" type="success" icon="el-icon-edit" @click="edit(stream)">
                编辑
              </el-button>
              <el-button size="mini" type="info" icon="el-icon-cloudy" @click="queryCloudRecords(stream)">
                云端录像
              </el-button>
              <el-button size="mini" type="danger" icon="el-icon-delete" @click="deletePush(stream.id)">
                删除
              </el-button>
            </div>
          </el-card>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          background
          :hide-on-single-page="false"
          @size-change="handleSizeChange"
          @current-change="currentChange"
          :current-page.sync="currentPage"
          :page-size="count"
          :page-sizes="[15, 25, 35, 50]"
          layout="total, sizes, prev, pager, next"
          :total="total">
        </el-pagination>
      </div>
    </el-card>

    <!-- 弹窗组件 -->
    <devicePlayer ref="devicePlayer"></devicePlayer>
    <importChannel ref="importChannel"></importChannel>
    <stream-push-edit v-if="streamPush" :streamPush="streamPush" :closeEdit="closeEdit"></stream-push-edit>
  </div>
</template>

<script>
import { startPushStream, removePushStream, batchRemovePushStream } from '@/api/stream'
import devicePlayer from './dialogs/devicePlayer.vue'
import importChannel from './dialogs/importChannel.vue'
import MediaServer from './service/MediaServer'
import StreamPushEdit from "./dialogs/StreamPushEdit";
import Vue from "vue";

export default {
  name: 'PushStreams',
  components: {
    StreamPushEdit,
    devicePlayer,
    importChannel,
  },
  data() {
    return {
      pushList: [], //推流列表
      currentPage: 1,
      count: 15,
      total: 0,
      searchSrt: "",
      pushing: "",
      mediaServerId: "",
      mediaServerList: [],
      multipleSelection: [],
      loading: false,
      streamPush: null,
      updateLooper: 0, //数据刷新轮训标志
      mediaServerObj: new MediaServer(),
      viewMode: 'table' // table | card
    }
  },
  
  computed: {
    Vue() {
      return Vue
    },
    streamStats() {
      const pushing = this.pushList.filter(item => item.pushing).length;
      const stopped = this.pushList.filter(item => !item.pushing).length;
      return {
        pushing,
        stopped
      }
    }
  },
  
  mounted() {
    this.initData();
    this.updateLooper = setInterval(this.getPushList, 2000);
  },
  
  destroyed() {
    clearTimeout(this.updateLooper);
  },
  
  methods: {
    initData: function () {
      this.loading = true;
      this.mediaServerObj.getOnlineMediaServerList((data) => {
        this.mediaServerList = data.data;
      })
      this.getPushList();
    },
    
    currentChange: function (val) {
      this.currentPage = val;
      this.getPushList();
    },
    
    handleSizeChange: function (val) {
      this.count = val;
      this.getPushList();
    },
    
    getPushList: function () {
      let that = this;
      this.$axios({
        method: 'get',
        url: `/api/push/list`,
        params: {
          page: that.currentPage,
          count: that.count,
          query: that.searchSrt,
          pushing: that.pushing,
          mediaServerId: that.mediaServerId,
        }
      }).then(function (res) {
          if (res.data.code === 0) {
            that.total = res.data.data.total;
            const newList = res.data.data.list;
            newList.forEach(e => {
              // 查找当前列表中是否存在相同项，并保留其加载状态
              const existingItem = that.pushList.find(item => item.app === e.app && item.stream === e.stream);
              that.$set(e, "playLoading", existingItem ? existingItem.playLoading : false);
              
              that.$set(e, "location", "");
              if (e.gbLongitude && e.gbLatitude) {
                that.$set(e, "location", e.gbLongitude + "," + e.gbLatitude);
              }
            });
            that.pushList = newList;
          }
      }).catch(function (error) {
        console.error(error);
      }).finally(()=>{
        this.loading = false;
      })
    },

    playPush: function (row) {
      row.playLoading = true;
      startPushStream(row.id).then((res) =>{
        if (res.data.code === 0 ) {
          this.$refs.devicePlayer.openDialog("streamPlay", null, null, {
            streamInfo: res.data.data,
            hasAudio: true
          });
        }else {
          this.$message.error(res.data.msg);
        }
      }).catch(function (error) {
        console.error(error);
      }).finally(()=>{
        row.playLoading = false;
      })
    },
    
    deletePush: function (id) {
      this.$confirm(`确定删除通道?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.loading = true;
        removePushStream(id, this.mediaServerId).then((res) => {
          if (res.data.code === 0) {
            this.initData()
          }
        }).catch(function (error) {
          console.error(error);
        });
      }).catch(() => {

      });
    },
    
    edit: function (row) {
      this.streamPush = row
    },
    
    // 结束编辑
    closeEdit: function (){
      this.streamPush = null
      this.getPushList()
    },
    
    queryCloudRecords: function (row) {
      this.$router.push(`/cloudRecordDetail/${row.app}/${row.stream}`)
    },
    
    importChannel: function () {
      this.$refs.importChannel.openDialog(() => {

      })
    },
    
    addStream: function (){
      this.streamPush = {}
    },
    
    batchDel: function () {
      this.$confirm(`确定删除选中的${this.multipleSelection.length}个通道?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        let ids = []
        for (let i = 0; i < this.multipleSelection.length; i++) {
          ids.push(this.multipleSelection[i].id)
        }
        let that = this;
        batchRemovePushStream(ids, that.mediaServerId).then((res) => {
          this.initData();
          this.$refs.pushListTable.clearSelection();
        }).catch(function (error) {
          console.error(error);
        });
      }).catch(() => {

      });
    },
    
    handleSelectionChange: function (val) {
      this.multipleSelection = val;
    },
    
    refresh: function () {
      this.initData();
    },
    
    handleReset() {
      this.searchSrt = '';
      this.pushing = '';
      this.mediaServerId = '';
      this.getPushList();
    }
  }
}
</script>

<style scoped>
.push-streams-container {
  height: auto;
  min-height: auto;
  padding: 0;
  background-color: transparent;
  display: flex;
  flex-direction: column;
}

/* 搜索卡片 */
.search-card {
  flex-shrink: 0;
  margin-bottom: 16px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.search-form .search-row {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 24px;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.search-item label {
  font-weight: 600;
}

.search-actions {
  margin-left: auto;
  display: flex;
  gap: 12px;
}

/* 列表卡片布局优化 */
.management-table-card {
  flex: none; /* 让卡片根据内容撑开 */
}

.management-table-card >>> .el-card__body {
  padding: 20px !important;
  overflow: visible !important; /* 允许撑开，不再产生内部滚动条 */
}

/* 卡片视图区域优化 */
.stream-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stream-card-item {
  margin-bottom: 0;
}

.stream-card {
  height: 100%;
  border-radius: 12px;
  border: 1px solid #ebeef5;
  transition: all 0.3s ease;
}

.stream-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.stream-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.stream-title h4 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.stream-title p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #909399;
}

.stream-card-content {
  padding: 16px 0;
}

.stream-info-row {
  display: flex;
  margin-bottom: 10px;
  font-size: 13px;
}

.info-label {
  width: 70px;
  flex-shrink: 0;
}

.info-value {
  color: #606266;
  word-break: break-all;
}

.stream-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

/* 分页容器 */
.pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .push-streams-container {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .search-form .search-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .search-actions {
    margin-left: 0;
    margin-top: 16px;
  }
  
  .stats-cards {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }
  
  .operation-buttons {
    flex-direction: column;
    gap: 2px;
  }
  
  .operation-buttons .el-button--mini {
    padding: 6px 8px;
    font-size: 12px;
  }
  
  .stream-cards {
    grid-template-columns: 1fr;
  }
  
  .action-row {
    flex-direction: column;
  }
  
  .action-row .el-button {
    margin-bottom: 4px;
  }
}
</style> 