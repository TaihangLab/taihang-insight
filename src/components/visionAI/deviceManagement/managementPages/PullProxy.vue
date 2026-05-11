<template>
  <div class="pull-proxy-wrapper">
    <div class="pull-proxy-container management-page-container" v-if="!streamProxy">


    <!-- 搜索筛选区域 -->
    <el-card class="search-card management-search-card" shadow="never">
      <div class="search-form">
        <div class="search-row">
          <div class="search-item">
            <label>关键字搜索：</label>
            <el-input
              v-model="searchSrt"
              placeholder="代理名称、流地址"
              style="width: 220px;"
              clearable
              @keyup.enter.native="handleSearch"
              @clear="handleSearch">
              <i slot="prefix" class="el-icon-search"></i>
            </el-input>
          </div>
          
          <div class="search-item">
            <label>流媒体：</label>
            <el-select
              v-model="mediaServerId"
              placeholder="请选择"
              style="width: 150px;"
              clearable
              @change="handleSearch">
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
            <label>拉流状态：</label>
            <el-select
              v-model="pulling"
              placeholder="请选择"
              style="width: 120px;"
              clearable
              @change="handleSearch">
              <el-option label="全部" value=""></el-option>
              <el-option label="正在拉流" value="true"></el-option>
              <el-option label="尚未拉流" value="false"></el-option>
            </el-select>
          </div>

          <div class="search-actions">
            <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
            <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 代理统计卡片 -->
    <div class="stats-cards management-stats-cards">
      <el-card class="stat-card management-stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon active">
            <i class="el-icon-video-play"></i>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ proxyStats.active }}</div>
            <div class="stat-label">运行中</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card management-stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon inactive">
            <i class="el-icon-video-pause"></i>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ proxyStats.inactive }}</div>
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
            <div class="stat-number">{{ proxyStats.total }}</div>
            <div class="stat-label">代理总数</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card management-stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon enabled">
            <i class="el-icon-check"></i>
          </div>
          <div class="stat-info">
            <div class="stat-number">{{ proxyStats.enabled }}</div>
            <div class="stat-label">已启用</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 代理列表 -->
    <el-card class="table-card management-table-card" shadow="never">
      <div slot="header" class="card-header">
        <div class="header-left-group">
          <span class="card-title">拉流代理列表</span>
        </div>
        <div class="card-actions">
          <el-button type="primary" size="mini" icon="el-icon-plus" @click="handleAdd">添加代理</el-button>
          <el-button type="success" size="mini" icon="el-icon-refresh" @click="handleRefresh" :loading="getStreamProxyListLoading">刷新</el-button>
          
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
          :data="streamProxyList"
          v-loading="loading"
          element-loading-text="加载中..."
          element-loading-spinner="el-icon-loading"
          element-loading-background="rgba(0, 0, 0, 0.8)"
          empty-text="暂无代理数据"
          style="width: 100%"
          stripe
          border
          @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" align="center"></el-table-column>
          <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
          
          <el-table-column prop="app" label="流应用名" min-width="120" align="center" show-overflow-tooltip></el-table-column>
          <el-table-column prop="stream" label="流ID" min-width="120" align="center" show-overflow-tooltip></el-table-column>
          
          <el-table-column label="流地址" min-width="300" show-overflow-tooltip>
            <template slot-scope="{ row }">
              <div class="stream-url">
                <el-tag size="medium" class="url-tag">
                  <i class="copy-btn el-icon-document-copy" 
                     title="点击拷贝" 
                     v-clipboard="row.srcUrl" 
                     @success="$message({type:'success', message:'成功拷贝到粘贴板'})"></i>
                  {{ row.srcUrl }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="mediaServerId" label="流媒体" min-width="120" align="center"></el-table-column>
          
          <el-table-column label="代理方式" width="120" align="center">
            <template slot-scope="{ row }">
              <el-tag :type="row.type === 'default' ? 'primary' : 'warning'" size="small">
                {{ row.type === "default" ? "默认" : "FFMPEG代理" }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="gbDeviceId" label="国标编码" min-width="150" align="center" show-overflow-tooltip></el-table-column>
          
          <el-table-column label="拉流状态" width="100" align="center">
            <template slot-scope="{ row }">
              <el-tag size="medium" v-if="row.pulling && Vue.prototype.$myServerId !== row.serverId" style="border-color: #ecf1af">正在拉流</el-tag>
              <el-tag size="medium" v-if="row.pulling && Vue.prototype.$myServerId === row.serverId" type="success">正在拉流</el-tag>
              <el-tag size="medium" type="info" v-if="!row.pulling">尚未拉流</el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="启用状态" width="100" align="center">
            <template slot-scope="{ row }">
              <el-tag size="medium" v-if="row.enable && Vue.prototype.$myServerId !== row.serverId" style="border-color: #ecf1af">已启用</el-tag>
              <el-tag size="medium" v-if="row.enable && Vue.prototype.$myServerId === row.serverId" type="success">已启用</el-tag>
              <el-tag size="medium" type="info" v-if="!row.enable">未启用</el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="createTime" label="创建时间" min-width="150" align="center" show-overflow-tooltip></el-table-column>
          
          <el-table-column label="操作" width="420" fixed="right" align="center">
            <template slot-scope="{ row }">
              <div class="operation-buttons">
                <el-button size="mini" :loading="row.playLoading" icon="el-icon-video-play" type="primary" @click="play(row)">播放</el-button>
                <el-button size="mini" icon="el-icon-switch-button" type="danger" v-if="row.pulling" @click="stopPlay(row)">停止</el-button>
                <el-button size="mini" icon="el-icon-edit" type="warning" @click="edit(row)">编辑</el-button>
                <el-button size="mini" icon="el-icon-cloudy" type="info" @click="queryCloudRecords(row)">云端录像</el-button>
                <el-button size="mini" icon="el-icon-delete" type="danger" @click="deleteStreamProxy(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 卡片视图 -->
      <div v-if="viewMode === 'card'" class="proxy-cards">
        <el-card v-for="proxy in streamProxyList" :key="proxy.id" class="proxy-card" shadow="hover">
          <div class="proxy-card-header">
            <div class="proxy-title">
              <h4>{{ proxy.app }}/{{ proxy.stream }}</h4>
              <p>{{ proxy.srcUrl }}</p>
            </div>
            <div class="proxy-status-badge">
              <el-tag :type="proxy.pulling ? 'success' : 'info'" size="small">
                {{ proxy.pulling ? '运行中' : '已停止' }}
              </el-tag>
            </div>
          </div>
          
          <div class="proxy-card-content">
            <div class="proxy-info-row">
              <span class="info-label">流媒体：</span>
              <span class="info-value">{{ proxy.mediaServerId }}</span>
            </div>
            <div class="proxy-info-row">
              <span class="info-label">代理方式：</span>
              <span class="info-value">{{ proxy.type === "default" ? "默认" : "FFMPEG代理" }}</span>
            </div>
            <div class="proxy-info-row" v-if="proxy.gbDeviceId">
              <span class="info-label">国标编码：</span>
              <span class="info-value">{{ proxy.gbDeviceId }}</span>
            </div>
            <div class="proxy-info-row">
              <span class="info-label">创建时间：</span>
              <span class="info-value">{{ proxy.createTime }}</span>
            </div>
          </div>
          
          <div class="proxy-card-actions">
            <el-button size="mini" :loading="proxy.playLoading" icon="el-icon-video-play" type="primary" @click="play(proxy)">播放</el-button>
            <el-button size="mini" icon="el-icon-edit" type="warning" @click="edit(proxy)">编辑</el-button>
            <el-button size="mini" icon="el-icon-delete" type="danger" @click="deleteStreamProxy(proxy)">删除</el-button>
          </div>
        </el-card>
      </div>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          background
          @size-change="handleSizeChange"
          @current-change="currentChange"
          :current-page="currentPage"
          :page-size="count"
          :page-sizes="[15, 25, 35, 50]"
          layout="total, sizes, prev, pager, next"
          :total="total">
        </el-pagination>
      </div>
    </el-card>

    <!-- 设备播放器 -->
    <devicePlayer ref="devicePlayer"></devicePlayer>
    
    <!-- 弹窗组件 -->
    <onvifEdit ref="onvifEdit"></onvifEdit>
    </div>
    
    <!-- 弹窗编辑组件 -->
    <stream-proxy-edit v-if="streamProxy" :streamProxy="streamProxy" :closeEdit="closeEdit"></stream-proxy-edit>
  </div>
</template>

<script>
import { deleteStreamProxyById, startStreamProxyById, stopStreamProxyById } from '@/api/stream'
import StreamProxyEdit from './dialogs/StreamProxyEdit.vue'
import onvifEdit from './dialogs/onvifEdit.vue'
import devicePlayer from './dialogs/devicePlayer.vue'
import MediaServer from "./service/MediaServer";
import Vue from "vue";

export default {
  name: 'PullProxy',
  components: {
    devicePlayer,
    StreamProxyEdit,
    onvifEdit
  },
  data() {
    return {
      streamProxyList: [],
      loading: false,
      getStreamProxyListLoading: false,
      currentPage: 1,
      count: 15,
      total: 0,
      searchSrt: "",
      mediaServerId: "",
      pulling: "",
      mediaServerObj: new MediaServer(),
      mediaServerList: [],
      updateLooper: 0,
      viewMode: 'table',
      tableHeight: 500,
      streamProxy: null,
      multipleSelection: [],
      proxyStats: {
        active: 0,
        inactive: 0,
        total: 0,
        enabled: 0
      }
    }
  },
  computed: {
    Vue() {
      return Vue
    }
  },
  created() {
    this.initData();
  },
  mounted() {
    this.startUpdateList();
    this.calculateTableHeight();
    window.addEventListener('resize', this.calculateTableHeight);
  },
  destroyed() {
    this.$destroy('videojs');
    clearTimeout(this.updateLooper);
    window.removeEventListener('resize', this.calculateTableHeight);
  },
  methods: {
    handleSelectionChange(val) {
      this.multipleSelection = val;
    },
    initData() {
      this.getStreamProxyList(true);
      this.mediaServerObj.getOnlineMediaServerList((data) => {
        this.mediaServerList = data;
      })
    },
    
    startUpdateList() {
      this.updateLooper = setInterval(() => {
        if (!this.streamProxy) {
          this.getStreamProxyList()
        }
      }, 1000);
    },
    
    calculateTableHeight() {
      // 计算表格高度
      const windowHeight = window.innerHeight;
      this.tableHeight = windowHeight - 450;
    },
    
    getStreamProxyList(showLoading = false) {
      if (showLoading) {
        this.loading = true;
        this.getStreamProxyListLoading = true;
      }
      
      return this.$axios({
        method: 'get',
        url: `/api/proxy/list`,
        params: {
          page: this.currentPage,
          count: this.count,
          query: this.searchSrt,
          pulling: this.pulling,
          mediaServerId: this.mediaServerId,
        }
      }).then((res) => {
        if (res.data.code === 0 && res.data.data) {
          this.total = res.data.data.total || 0;
          const list = res.data.data.list || [];
          for (let i = 0; i < list.length; i++) {
            list[i]["playLoading"] = false;
          }
          this.streamProxyList = list;
          this.updateProxyStats();
        } else if (res.data.code === 0 && Array.isArray(res.data.data)) {
          // 兼容非分页返回
          this.streamProxyList = res.data.data;
          this.total = res.data.data.length;
          this.updateProxyStats();
        } else {
          this.streamProxyList = [];
          this.total = 0;
          this.updateProxyStats();
        }
      }).catch((error) => {
        console.error(error);
        this.streamProxyList = [];
        this.total = 0;
        this.updateProxyStats();
      }).finally(() => {
        if (showLoading) {
          this.loading = false;
          this.getStreamProxyListLoading = false;
        }
      });
    },
    
    updateProxyStats() {
      const list = this.streamProxyList || [];
      this.proxyStats.total = this.total || list.length;
      this.proxyStats.active = list.filter(item => item.pulling).length;
      this.proxyStats.inactive = Math.max(0, this.proxyStats.total - this.proxyStats.active);
      this.proxyStats.enabled = list.filter(item => item.enable).length;
    },
    
    handleAdd() {
      // 按照PushStreams.vue的方式添加
      this.streamProxy = {};
    },
    
    handleSearchOnvif() {
      this.$axios({
        method: 'get',
        url: `/api/onvif/search?timeout=3000`,
      }).then((res) => {
        if (res.data.code === 0) {
          if (res.data.data.length > 0) {
            this.$refs.onvifEdit.openDialog(res.data.data, (url) => {
              if (url != null) {
                this.$refs.onvifEdit.close();
                this.streamProxy = {type: "default", url: url, srcUrl: url};
              }
            })
          } else {
            this.$message.success({
              showClose: true,
              message: "未找到可用设备"
            });
          }
        } else {
          this.$message.error({
            showClose: true,
            message: res.data.msg
          })
        }
      }).catch((error) => {
        this.$message.error({
          showClose: true,
          message: error
        })
      });
    },
    
    edit(row) {
      // 按照PushStreams.vue的方式设置编辑数据
      this.streamProxy = row;
    },
    
    play(row) {
      row.playLoading = true;
      startStreamProxyById(row.id, this.mediaServerId).then((res) => {
        if (res.data.code === 0) {
          this.$refs.devicePlayer.openDialog("streamPlay", null, null, {
            streamInfo: res.data.data,
            hasAudio: true
          });
        } else {
          this.$message({
            showClose: true,
            message: "获取地址失败：" + res.data.msg,
            type: "error",
          });
        }
      }).catch((error) => {
        console.log(error);
      }).finally(() => {
        row.playLoading = false;
      })
    },
    
    stopPlay(row) {
      stopStreamProxyById(row.id, this.mediaServerId).then((res) => {
        if (res.data.code === 0) {
          this.$message.success('停止成功');
        } else {
          this.$message.error(res.data.msg);
        }
      }).catch((error) => {
        console.log(error);
      });
    },
    
    queryCloudRecords(row) {
      this.$router.push(`/cloudRecordDetail/${row.app}/${row.stream}`)
    },
    
    deleteStreamProxy(row) {
      this.$confirm('确定删除此代理吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteStreamProxyById(row.id, this.mediaServerId).then((res) => {
          this.$message.success({
            showClose: true,
            message: "删除成功"
          })
          this.initData()
        }).catch((error) => {
          console.log(error);
        });
      }).catch(() => {
        // 取消删除
      });
    },
    
    handleRefresh() {
      this.initData();
    },
    
    handleSearch() {
      this.currentPage = 1;
      this.getStreamProxyList(true);
    },
    
    handleReset() {
      this.searchSrt = "";
      this.mediaServerId = "";
      this.pulling = "";
      this.currentPage = 1;
      this.getStreamProxyList(true);
    },
    
    currentChange(val) {
      this.currentPage = val;
      this.getStreamProxyList(true);
    },
    
    handleSizeChange(val) {
      this.count = val;
      this.getStreamProxyList(true);
    },
    
    closeEdit() {
      this.streamProxy = null;
      this.getStreamProxyList(true);
    }
  }
}
</script>

<style scoped>
.pull-proxy-container {
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
  flex: none;
}

.management-table-card >>> .el-card__body {
  padding: 20px !important;
  overflow: visible !important;
}

/* 表格卡片样式 */
.table-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

/* 头部样式由 common-style.css 统一处理 */

/* 表格样式 */
.el-table {
  border-radius: 8px;
  overflow: hidden;
}

.el-table th {
  background-color: #f8f9fa !important;
  color: #606266;
}

/* 卡片视图区域优化 */
.proxy-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.proxy-card-item {
  margin-bottom: 0;
}

.proxy-card {
  height: 100%;
  border-radius: 12px;
  border: 1px solid #ebeef5;
  transition: all 0.3s ease;
}

.proxy-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.proxy-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.proxy-card-content {
  padding: 16px 0;
}

.proxy-info-row {
  display: flex;
  margin-bottom: 10px;
  font-size: 13px;
}

.proxy-card-actions {
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
</style>