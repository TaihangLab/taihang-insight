<template>
  <div>
    <el-dialog
      title="设备通道列表"
      v-model:visible="dialogVisible"
      width="90%"
      :close-on-click-modal="false"
      custom-class="device-channels-dialog"
    >
      <div v-if="currentDevice" class="device-header">
        <div class="device-info">
          <div class="device-title">
            <h3>{{ currentDevice.name }}</h3>
            <el-tag :type="currentDevice.onLine ? 'success' : 'danger'" size="small">
              {{ currentDevice.onLine ? "在线" : "离线" }}
            </el-tag>
          </div>
          <p class="device-id">设备编码：{{ currentDevice.deviceId }}</p>
          <div class="device-stats">
            <el-tag type="info" effect="plain">
              厂商：{{ currentDevice.manufacturer || "未知" }}
            </el-tag>
            <el-tag type="info" effect="plain">
              地址：{{ currentDevice.hostAddress || "未知" }}
            </el-tag>
            <el-tag type="primary" effect="plain">通道数：{{ (channelList || []).length }}</el-tag>
          </div>
        </div>
        <div class="device-actions">
          <el-button
            type="primary"
            icon="el-icon-refresh"
            @click="getDeviceChannelList"
            :loading="loading"
          >
            刷新通道
          </el-button>
          <el-button type="success" icon="el-icon-download" @click="handleExportChannels">
            导出列表
          </el-button>
        </div>
      </div>

      <!-- 搜索筛选区域 -->
      <div class="channel-filters">
        <div class="filter-row">
          <div class="filter-item">
            搜索:
            <el-input
              v-model="searchSrt"
              @input="search"
              placeholder="关键字"
              style="margin-right: 1rem; width: auto"
              size="small"
              prefix-icon="el-icon-search"
              clearable
            ></el-input>
          </div>

          <div class="filter-item">
            通道类型:
            <el-select
              v-model="channelType"
              @change="search"
              placeholder="请选择"
              style="width: 8rem; margin-right: 1rem"
              size="small"
              default-first-option
            >
              <el-option label="全部" value=""></el-option>
              <el-option label="设备" value="false"></el-option>
              <el-option label="子目录" value="true"></el-option>
            </el-select>
          </div>

          <div class="filter-item">
            在线状态:
            <el-select
              v-model="online"
              @change="search"
              placeholder="请选择"
              style="width: 8rem; margin-right: 1rem"
              size="small"
              default-first-option
            >
              <el-option label="全部" value=""></el-option>
              <el-option label="在线" value="true"></el-option>
              <el-option label="离线" value="false"></el-option>
            </el-select>
          </div>

          <div class="filter-item">
            码流类型重置:
            <el-select
              v-model="subStream"
              @change="subStreamChange"
              placeholder="请选择码流类型"
              style="width: 16rem; margin-right: 1rem"
              size="small"
              default-first-option
            >
              <el-option label="stream:0(主码流)" value="stream:0"></el-option>
              <el-option label="stream:1(子码流)" value="stream:1"></el-option>
              <el-option label="streamnumber:0(主码流-2022)" value="streamnumber:0"></el-option>
              <el-option label="streamnumber:1(子码流-2022)" value="streamnumber:1"></el-option>
              <el-option label="streamprofile:0(主码流-大华)" value="streamprofile:0"></el-option>
              <el-option label="streamprofile:1(子码流-大华)" value="streamprofile:1"></el-option>
              <el-option
                label="streamMode:main(主码流-水星+TP-LINK)"
                value="streamMode:main"
              ></el-option>
              <el-option
                label="streamMode:sub(子码流-水星+TP-LINK)"
                value="streamMode:sub"
              ></el-option>
            </el-select>
          </div>

          <div class="filter-actions">
            <el-button
              icon="el-icon-refresh-right"
              circle
              size="small"
              @click="refresh()"
            ></el-button>
          </div>
        </div>
      </div>

      <!-- 通道列表表格 -->
      <div class="channels-table">
        <el-table
          :data="paginatedChannelList"
          v-loading="loading"
          element-loading-text="加载通道中..."
          element-loading-spinner="el-icon-loading"
          element-loading-background="rgba(0, 0, 0, 0.8)"
          empty-text="暂无通道数据"
          stripe
          border
          :height="tableHeight"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" align="center"></el-table-column>
          <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>

          <el-table-column prop="name" label="名称" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="channel-name">
                <span>{{ row.name || "未命名通道" }}</span>
                <el-tag v-if="row.parental" size="small" type="warning">父节点</el-tag>
              </div>
            </template>
          </el-table-column>

          <el-table-column
            prop="deviceId"
            label="编号"
            min-width="180"
            align="center"
            show-overflow-tooltip
          ></el-table-column>

          <el-table-column label="快照" min-width="100" align="center">
            <template #default="{ row }">
              <el-image
                :src="getSnap(row)"
                :preview-src-list="getBigSnap(row)"
                @error="getSnapErrorEvent(row.deviceId, row.channelId)"
                :fit="'contain'"
                style="width: 60px"
              >
                <template v-slot:error>
<div  class="image-slot">
                  <i class="el-icon-picture-outline"></i>
                </div>
</template>
              </el-image>
            </template>
          </el-table-column>

          <el-table-column
            prop="manufacturer"
            label="厂家"
            min-width="100"
            align="center"
            show-overflow-tooltip
          ></el-table-column>

          <el-table-column label="位置信息" min-width="150" align="center">
            <template #default="{ row }">
              <span v-if="row.longitude && row.latitude">
                {{ row.longitude }}
                <br />
                {{ row.latitude }}
              </span>
              <span v-else>无</span>
            </template>
          </el-table-column>

          <el-table-column prop="ptzType" label="云台类型" min-width="100" align="center">
            <template #default="{ row }">
              <div>{{ getPtzTypeText(row.ptzType) }}</div>
            </template>
          </el-table-column>

          <el-table-column label="开启音频" min-width="100" align="center">
            <template #default="{ row }">
              <el-switch
                @change="updateChannel(row)"
                v-model="row.hasAudio"
                active-color="#409EFF"
              ></el-switch>
            </template>
          </el-table-column>

          <el-table-column label="码流类型" min-width="180" align="center">
            <template #default="{ row }">
              <el-select
                size="small"
                style="width: 160px"
                @change="channelSubStreamChange(row)"
                v-model="row.streamIdentification"
                placeholder="请选择码流类型"
              >
                <el-option label="stream:0(主码流)" value="stream:0"></el-option>
                <el-option label="stream:1(子码流)" value="stream:1"></el-option>
                <el-option label="streamnumber:0(主码流-2022)" value="streamnumber:0"></el-option>
                <el-option label="streamnumber:1(子码流-2022)" value="streamnumber:1"></el-option>
                <el-option label="streamprofile:0(主码流-大华)" value="streamprofile:0"></el-option>
                <el-option label="streamprofile:1(子码流-大华)" value="streamprofile:1"></el-option>
                <el-option
                  label="streamMode:main(主码流-水星+TP-LINK)"
                  value="streamMode:main"
                ></el-option>
                <el-option
                  label="streamMode:sub(子码流-水星+TP-LINK)"
                  value="streamMode:sub"
                ></el-option>
              </el-select>
            </template>
          </el-table-column>

          <el-table-column label="状态" min-width="100" align="center">
            <template #default="{ row }">
              <div>
                <el-tag size="medium" v-if="row.status === 'ON'">在线</el-tag>
                <el-tag size="medium" type="info" v-if="row.status !== 'ON'">离线</el-tag>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="操作" min-width="340" align="center" fixed="right">
            <template #default="{ row }">
              <div class="channel-actions">
                <el-button
                  size="medium"
                  :disabled="!currentDevice || currentDevice.onLine === false"
                  icon="el-icon-video-play"
                  link
                  :loading="row.playLoading"
                  @click="sendDevicePush(row)"
                >
                  播放
                </el-button>
                <el-button
                  size="medium"
                  :disabled="!currentDevice || currentDevice.onLine === false"
                  icon="el-icon-switch-button"
                  link
                  style="color: #f56c6c"
                  v-if="!!row.streamId"
                  @click="stopDevicePush(row)"
                >
                  停止
                </el-button>
                <el-divider direction="vertical"></el-divider>
                <el-button size="medium" link icon="el-icon-edit" @click="handleEdit(row)">
                  编辑
                </el-button>
                <el-divider direction="vertical"></el-divider>
                <el-button
                  size="medium"
                  icon="el-icon-s-open"
                  link
                  v-if="row.subCount > 0 || row.parental === 1 || row.deviceId.length <= 8"
                  @click="changeSubchannel(row)"
                >
                  查看
                </el-button>
                <el-divider
                  v-if="row.subCount > 0 || row.parental === 1 || row.deviceId.length <= 8"
                  direction="vertical"
                ></el-divider>
                <el-dropdown @command="(command) => moreClick(command, row)">
                  <el-button size="medium" link>
                    更多
                    <i class="el-icon-arrow-down el-icon--right"></i>
                  </el-button>
                  <template v-slot:dropdown>
<el-dropdown-menu >
                    <el-dropdown-item
                      command="records"
                      :disabled="!currentDevice || currentDevice.onLine === false"
                    >
                      设备录像
                    </el-dropdown-item>
                    <el-dropdown-item
                      command="cloudRecords"
                      :disabled="!currentDevice || currentDevice.onLine === false"
                    >
                      云端录像
                    </el-dropdown-item>
                    <el-dropdown-item
                      command="record"
                      :disabled="!currentDevice || currentDevice.onLine === false"
                    >
                      设备录像控制-开始
                    </el-dropdown-item>
                    <el-dropdown-item
                      command="stopRecord"
                      :disabled="!currentDevice || currentDevice.onLine === false"
                    >
                      设备录像控制-停止
                    </el-dropdown-item>
                  </el-dropdown-menu>
</template>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          ></el-pagination>
        </div>
      </div>

      <template v-slot:footer>
<div  class="dialog-footer">
        <span class="footer-info">
          总计 {{ (channelList || []).length }} 个通道， 在线 {{ onlineChannelCount }} 个， 离线
          {{ offlineChannelCount }} 个
        </span>
        <el-button @click="handleClose">关闭</el-button>
      </div>
</template>
    </el-dialog>

    <!-- 通道编辑对话框 -->
    <el-dialog
      title="编辑通道"
      v-model:visible="editDialogVisible"
      width="80%"
      :close-on-click-modal="false"
      :destroy-on-close="true"
      append-to-body
    >
      <CommonChannelEdit
        v-if="editDialogVisible"
        :id="currentChannelId"
        :saveSuccess="handleEditSuccess"
        :cancel="handleEditCancel"
      ></CommonChannelEdit>
      <template v-slot:footer>
<div  class="dialog-footer">
        <!-- 通过CommonChannelEdit组件内部的按钮控制 -->
      </div>
</template>
    </el-dialog>

    <!-- 设备播放器组件 -->
    <devicePlayer ref="devicePlayer"></devicePlayer>
  </div>
</template>

<script>
import CommonChannelEdit from "./CommonChannelEdit.vue";
import devicePlayer from "./devicePlayer.vue";
import { getDeviceChannels } from "@/api/channel";
import { startPlay, stopPlay } from "@/api/play";
import { updateChannelAudio, updateChannelStreamIdentification } from "@/api/channel";
import { controlRecord } from "@/api/device";

export default {
  name: "GBDeviceChannels",
  components: {
    CommonChannelEdit,
    devicePlayer,
  },
  data() {
    return {
      dialogVisible: false,
      currentDevice: null,
      channelList: [],
      filteredChannelList: [],
      loading: false,

      // 搜索筛选
      searchSrt: "",
      channelType: "",
      online: "",
      subStream: "",

      // 分页
      currentPage: 1,
      pageSize: 15,
      total: 0,

      // 表格高度
      tableHeight: 500,

      // 选中的通道
      selectedChannels: [],

      // 编辑对话框
      editDialogVisible: false,
      currentChannelId: null,

      // 云台类型映射
      ptzTypes: {
        0: "未知",
        1: "球机",
        2: "半球",
        3: "固定枪机",
        4: "遥控枪机",
      },
    };
  },

  computed: {
    onlineChannelCount() {
      let list = this.channelList;
      if (!list || !Array.isArray(list)) {
        return 0;
      }
      return list.filter((channel) => channel.status === "ON").length;
    },

    offlineChannelCount() {
      let list = this.channelList;
      if (!list || !Array.isArray(list)) {
        return 0;
      }
      return list.filter((channel) => channel.status !== "ON").length;
    },

    paginatedChannelList() {
      let list = this.filteredChannelList;
      if (!list || !Array.isArray(list)) {
        return [];
      }
      // 直接返回过滤后的列表，分页由后端处理
      return list;
    },
  },

  watch: {
    channelList: {
      immediate: true,
      handler(newVal) {
        if (!Array.isArray(newVal)) {
          this.channelList = [];
        }
      },
    },
    filteredChannelList: {
      immediate: true,
      handler(newVal) {
        if (!Array.isArray(newVal)) {
          this.filteredChannelList = [];
        }
      },
    },
  },

  methods: {
    // 获取云台类型文本
    getPtzTypeText(ptzType) {
      return this.ptzTypes[ptzType] || "未知";
    },

    // 获取快照URL - 与channelList.vue一致
    getSnap(row) {
      let baseUrl = window.baseUrl ? window.baseUrl : "";
      return (
        (import.meta.env.MODE === "development" ? import.meta.env.VITE_BASE_API : baseUrl) +
        "/api/device/query/snap/" +
        this.currentDevice.deviceId +
        "/" +
        row.deviceId
      );
    },

    // 获取大图快照URL - 与channelList.vue一致
    getBigSnap(row) {
      return [this.getSnap(row)];
    },

    // 快照加载错误处理 - 与channelList.vue一致
    getSnapErrorEvent(deviceId, channelId) {
      console.log(`快照加载失败: ${deviceId} / ${channelId}`);
    },

    // 播放设备推流 - 与channelList.vue一致
    sendDevicePush(itemData) {
      if (!this.currentDevice || !this.currentDevice.onLine) {
        this.$message.warning("设备离线，无法播放");
        return;
      }

      let deviceId = this.currentDevice.deviceId;
      let channelId = itemData.deviceId;
      itemData.playLoading = true;
      console.log("通知设备推流：" + deviceId + " : " + channelId);

      startPlay(deviceId, channelId)
        .then((res) => {
          if (res.code === 0) {
            itemData.streamId = res.data.stream;

            this.$refs.devicePlayer.openDialog("media", deviceId, channelId, {
              streamInfo: res.data,
              hasAudio: itemData.hasAudio,
            });

            setTimeout(() => {
              this.getDeviceChannelList();
            }, 1000);
          } else {
            this.$message.error("播放失败：" + res.msg);
          }
        })
        .catch((error) => {
          console.error("播放失败:", error);
          this.$message.error("播放失败：" + error.message);
        })
        .finally(() => {
          itemData.playLoading = false;
        });
    },

    // 停止设备推流 - 与channelList.vue一致
    stopDevicePush(itemData) {
      stopPlay(this.currentDevice.deviceId, itemData.deviceId)
        .then((res) => {
          if (res.code === 0) {
            itemData.streamId = null;
            this.$message.success("停止播放");
            this.getDeviceChannelList();
          } else {
            this.$message.error("停止播放失败：" + res.msg);
          }
        })
        .catch((error) => {
          if (error.response && error.response.status === 402) {
            itemData.streamId = null;
            this.getDeviceChannelList();
          } else {
            console.error("停止播放失败:", error);
            this.$message.error("停止播放失败：" + error.message);
          }
        });
    },

    // 更新通道信息 - 与channelList.vue一致
    updateChannel(channel) {
      updateChannelAudio({
        channelId: channel.id,
        audio: channel.hasAudio,
      })
        .then((res) => {
          console.log(JSON.stringify(res));
        })
        .catch((error) => {
          console.error("通道更新失败:", error);
          this.$message.error("通道更新失败：" + error.message);
        });
    },

    // 码流类型切换
    channelSubStreamChange(channel) {
      updateChannelStreamIdentification({
        deviceDbId: channel.deviceDbId,
        id: channel.id,
        streamIdentification: channel.streamIdentification,
      })
        .then((res) => {
          console.log(JSON.stringify(res));
        })
        .catch((error) => {
          console.error("码流类型修改失败:", error);
          this.$message.error("码流类型修改失败：" + error.message);
        });
    },

    // 查看子通道
    changeSubchannel(channel) {
      this.$message.info(`查看 ${channel.name} 的子通道`);
    },

    // 更多操作点击处理
    moreClick(command, channel) {
      switch (command) {
        case "records":
          this.showDeviceRecords(channel);
          break;
        case "cloudRecords":
          this.showCloudRecords(channel);
          break;
        case "record":
          this.startRecord(channel);
          break;
        case "stopRecord":
          this.stopRecord(channel);
          break;
        default:
          break;
      }
    },

    // 设备录像
    showDeviceRecords(channel) {
      if (!this.currentDevice || !this.currentDevice.onLine) {
        this.$message.warning("设备离线，无法查看录像");
        return;
      }
      let deviceId = this.currentDevice.deviceId;
      let channelId = channel.deviceId;
      this.$router.push(`/gbRecordDetail/${deviceId}/${channelId}`);
    },

    // 云端录像
    showCloudRecords(channel) {
      if (!this.currentDevice || !this.currentDevice.onLine) {
        this.$message.warning("设备离线，无法查看录像");
        return;
      }
      let deviceId = this.currentDevice.deviceId;
      let channelId = channel.deviceId;
      this.$router.push(`/cloudRecordDetail/rtp/${deviceId}_${channelId}`);
    },

    // 开始录像 - 与channelList.vue一致
    startRecord(itemData) {
      controlRecord({
        deviceId: this.currentDevice.deviceId,
        channelId: itemData.deviceId,
        recordCmdStr: "Record",
      })
        .then((res) => {
          if (res.code === 0) {
            this.$message.success("开始录像成功");
          } else {
            this.$message.error("开始录像失败：" + res.msg);
          }
        })
        .catch((error) => {
          this.$message.error("开始录像失败：" + error.message);
        });
    },

    // 停止录像 - 与channelList.vue一致
    stopRecord(itemData) {
      controlRecord({
        deviceId: this.currentDevice.deviceId,
        channelId: itemData.deviceId,
        recordCmdStr: "StopRecord",
      })
        .then((res) => {
          if (res.code === 0) {
            this.$message.success("停止录像成功");
          } else {
            this.$message.error("停止录像失败：" + res.msg);
          }
        })
        .catch((error) => {
          this.$message.error("停止录像失败：" + error.message);
        });
    },

    // 搜索方法 - 与channelList.vue一致
    search() {
      this.currentPage = 1;
      this.total = 0;
      this.getDeviceChannelList();
    },

    // 刷新方法
    refresh() {
      this.getDeviceChannelList();
    },

    // 码流类型重置方法 - 与channelList.vue一致
    subStreamChange() {
      if (!this.subStream) return;

      this.$confirm("确定重置所有通道的码流类型?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          updateChannelStreamIdentification({
            deviceDbId: this.currentDevice.id,
            streamIdentification: this.subStream,
          })
            .then((res) => {
              console.log(JSON.stringify(res));
              this.getDeviceChannelList();
            })
            .finally(() => {
              this.subStream = "";
            });
        })
        .catch(() => {
          this.subStream = "";
        });
    },

    // 打开对话框
    openDialog(deviceData) {
      if (!deviceData) {
        this.$message.error("设备信息不完整");
        return;
      }

      this.currentDevice = deviceData;
      // 确保数组初始化
      this.channelList = [];
      this.filteredChannelList = [];
      this.dialogVisible = true;
      this.resetFilters();
      this.getDeviceChannelList();

      // 计算表格高度
      this.$nextTick(() => {
        this.calculateTableHeight();
      });
    },

    // 获取通道列表
    getDeviceChannelList() {
      if (!this.currentDevice) return;

      this.loading = true;

      getDeviceChannels(this.currentDevice.deviceId, {
        page: this.currentPage,
        count: this.pageSize,
        query: this.searchSrt,
        online: this.online,
        channelType: this.channelType,
      })
        .then((res) => {
          console.log("API响应数据:", res); // 添加调试日志

          if (res.code === 0) {
            this.total = res.data.total || 0;
            let channelData = res.data.list || [];

            console.log("原始通道数据:", channelData); // 添加调试日志

            // 确保是数组并处理每个通道对象
            if (Array.isArray(channelData)) {
              this.channelList = channelData.map((channel) => {
                const processedChannel = {
                  ...channel,
                  // 与channelList.vue一致，使用deviceId作为通道编号字段
                  deviceId: channel.deviceId || channel.channelId || "",
                  channelId: channel.channelId || "",
                  name: channel.name || "未命名",
                  status: channel.status || "OFF",
                  ptzType: (channel.ptzType || 0) + "",
                  playLoading: false,
                  subCount: channel.subCount || 0,
                  parental: channel.parental || false,
                  hasAudio: channel.hasAudio || false,
                  streamIdentification: channel.streamIdentification || "stream:0",
                };
                console.log("处理后的通道数据:", processedChannel); // 添加调试日志
                return processedChannel;
              });
            } else {
              this.channelList = [];
            }

            this.filteredChannelList = [...this.channelList]; // 使用展开运算符确保数组的响应性
            console.log("最终通道列表:", this.channelList); // 添加调试日志
          } else {
            console.log("API返回错误:", res.msg);
            this.$message.error("获取通道列表失败：" + res.msg);
            // 使用模拟数据作为备选
            this.loadMockChannelData();
          }
        })
        .catch((error) => {
          console.error("获取通道列表失败:", error);
          // 网络错误时使用模拟数据
          this.loadMockChannelData();
        })
        .finally(() => {
          this.loading = false;
        });
    },

    // 加载模拟通道数据
    loadMockChannelData() {
      console.log("加载模拟数据，当前设备:", this.currentDevice);

      if (!this.currentDevice) {
        this.channelList = [];
        this.filteredChannelList = [];
        this.total = 0;
        return;
      }
      const deviceId = this.currentDevice.deviceId;
      console.log("使用设备ID生成模拟数据:", deviceId);
      this.channelList = [
        {
          deviceId: deviceId + "01", // 与channelList.vue一致的编号字段
          channelId: deviceId + "01",
          name: "大门入口摄像机",
          status: "ON",
          manufacturer: this.currentDevice.manufacturer || "海康威视",
          model: "DS-2CD2347G1-LI",
          subCount: 0,
          longitude: 116.397128,
          latitude: 39.916527,
          civilCode: "110101",
          parental: false,
          ptzType: 1,
          hasAudio: true,
          streamIdentification: "stream:0",
        },
        {
          deviceId: deviceId + "02",
          channelId: deviceId + "02",
          name: "停车场监控",
          status: "ON",
          manufacturer: this.currentDevice.manufacturer || "海康威视",
          model: "DS-2CD2347G1-LI",
          subCount: 0,
          longitude: 116.3972,
          latitude: 39.9166,
          civilCode: "110101",
          parental: false,
          ptzType: 3,
          hasAudio: false,
          streamIdentification: "stream:1",
        },
        {
          deviceId: deviceId + "03",
          channelId: deviceId + "03",
          name: "楼梯间监控",
          status: "OFF",
          manufacturer: this.currentDevice.manufacturer || "海康威视",
          model: "DS-2CD2347G1-LI",
          subCount: 0,
          longitude: 116.3973,
          latitude: 39.9167,
          civilCode: "110101",
          parental: false,
          ptzType: 3,
          hasAudio: false,
          streamIdentification: "stream:0",
        },
        {
          deviceId: deviceId + "04",
          channelId: deviceId + "04",
          name: "办公区域",
          status: "ON",
          manufacturer: this.currentDevice.manufacturer || "海康威视",
          model: "DS-2CD2347G1-LI",
          subCount: 2,
          longitude: null,
          latitude: null,
          civilCode: "110101",
          parental: true,
          ptzType: 0,
          hasAudio: true,
          streamIdentification: "stream:0",
        },
      ];
      this.filteredChannelList = [...this.channelList];
      this.total = this.channelList ? this.channelList.length : 0;
    },

    // 重置筛选
    resetFilters() {
      this.searchSrt = "";
      this.channelType = "";
      this.online = "";
      this.subStream = "";
      this.currentPage = 1;
    },

    // 播放
    handlePlay(channel) {
      console.log("播放通道:", channel);
      this.$message.info(`正在启动 ${channel.name} 的实时播放...`);
      // 这里可以调用播放相关的API
    },

    // 回放
    handlePlayback(channel) {
      console.log("回放通道:", channel);
      this.$message.info(`正在打开 ${channel.name} 的历史回放...`);
      // 这里可以跳转到回放页面
    },

    // 通道详情
    handleChannelDetail(channel) {
      console.log("通道详情:", channel);
      this.$alert(
        `
        <div style="text-align: left;">
          <p><strong>通道编码：</strong>${channel.channelId}</p>
          <p><strong>通道名称：</strong>${channel.name || "未命名"}</p>
          <p><strong>在线状态：</strong>${channel.status ? "在线" : "离线"}</p>
          <p><strong>设备厂商：</strong>${channel.manufacturer || "未知"}</p>
          <p><strong>设备型号：</strong>${channel.model || "未知"}</p>
          <p><strong>子设备数：</strong>${channel.subCount || 0}</p>
          ${
            channel.longitude && channel.latitude
              ? `<p><strong>位置坐标：</strong>${channel.longitude.toFixed(6)}, ${channel.latitude.toFixed(6)}</p>`
              : "<p><strong>位置坐标：</strong>无</p>"
          }
          <p><strong>行政区域：</strong>${channel.civilCode || "未知"}</p>
        </div>
      `,
        "通道详情",
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: "确定",
        },
      );
    },

    // 编辑通道
    handleEdit(row) {
      this.currentChannelId = row.id;
      this.editDialogVisible = true;
    },

    // 编辑成功回调
    handleEditSuccess() {
      this.editDialogVisible = false;
      this.$message.success("通道编辑成功");
      // 刷新通道列表
      this.getDeviceChannelList();
    },

    // 取消编辑
    handleEditCancel() {
      this.editDialogVisible = false;
    },

    // 更多操作
    handleMoreActions(command, channel) {
      switch (command) {
        case "detail":
          this.handleChannelDetail(channel);
          break;
        case "ptz":
          this.$message.info(`正在打开 ${channel.name} 的云台控制...`);
          break;
        case "preset":
          this.$message.info(`正在打开 ${channel.name} 的预置位设置...`);
          break;
        case "record":
          this.$message.info(`正在为 ${channel.name} 录像控制...`);
          break;
        case "snapshot":
          this.$message.info(`正在为 ${channel.name} 截图...`);
          break;
        default:
          break;
      }
    },

    // 导出通道列表
    handleExportChannels() {
      if (!this.channelList || this.channelList.length === 0) {
        this.$message.warning("暂无通道数据可导出");
        return;
      }

      this.$message.info("导出功能开发中...");
      // 这里可以实现导出Excel功能
    },

    // 选择改变
    handleSelectionChange(selection) {
      this.selectedChannels = selection;
    },

    // 计算表格高度
    calculateTableHeight() {
      const windowHeight = window.innerHeight;
      const dialogHeaderHeight = 200;
      const filtersHeight = 80;
      const paginationHeight = 60;
      const footerHeight = 80;
      const padding = 40;

      this.tableHeight =
        windowHeight -
        dialogHeaderHeight -
        filtersHeight -
        paginationHeight -
        footerHeight -
        padding;
      if (this.tableHeight < 300) {
        this.tableHeight = 300;
      }
    },

    // 分页处理
    handleSizeChange(val) {
      this.pageSize = val;
      this.getDeviceChannelList();
    },

    handleCurrentChange(val) {
      this.currentPage = val;
      this.getDeviceChannelList();
    },

    // 关闭对话框
    handleClose() {
      this.dialogVisible = false;
      this.currentDevice = null;
      this.channelList = [];
      this.filteredChannelList = [];
      this.selectedChannels = [];
      this.total = 0;
      this.currentPage = 1;
      this.resetFilters();
    },
  },
};
</script>

<style scoped>
.device-channels-dialog {
  border-radius: 8px;
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 8px;
}

.device-info .device-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.device-info .device-title h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.device-info .device-id {
  margin: 0 0 12px 0;
  color: #606266;
  font-family: "Courier New", monospace;
  font-size: 14px;
}

.device-stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.device-actions {
  display: flex;
  gap: 8px;
}

.channel-filters {
  margin-bottom: 20px;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-actions {
  margin-left: auto;
}

.channels-table {
  background: white;
  border-radius: 6px;
}

.channel-id {
  display: flex;
  align-items: center;
  gap: 6px;
}

.channel-icon {
  color: #409eff;
  font-size: 14px;
}

.channel-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.location-info {
  font-size: 12px;
}

.coordinates {
  margin-bottom: 2px;
}

.coord-label {
  color: #909399;
}

.coord-value {
  color: #303133;
  font-family: "Courier New", monospace;
}

.no-location {
  color: #c0c4cc;
  font-style: italic;
}

.channel-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.channel-actions .el-button--mini {
  padding: 6px 8px;
  font-size: 12px;
}

/* 编辑按钮样式 */
.channel-actions .el-button--warning {
  background-color: #e6a23c;
  border-color: #e6a23c;
  color: white;
}

.channel-actions .el-button--warning:hover {
  background-color: #ebb563;
  border-color: #ebb563;
}

.pagination-container {
  margin-top: 16px;
  text-align: right;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-info {
  color: #606266;
  font-size: 14px;
}

/* 表格样式优化 */
.el-table {
  border-radius: 6px;
  overflow: hidden;
}

.el-table th {
  background-color: #f8f9fa !important;
  color: #606266;
  font-weight: 600;
  border-bottom: 2px solid #e9ecef;
}

.el-table .el-button--mini {
  margin: 0 1px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .device-channels-dialog {
    width: 95% !important;
    margin: 0 auto;
  }

  .device-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .device-actions {
    justify-content: center;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-actions {
    margin-left: 0;
    margin-top: 12px;
  }

  .channel-actions {
    flex-direction: column;
    gap: 2px;
  }

  .dialog-footer {
    flex-direction: column;
    gap: 12px;
  }
}

/* 深色主题支持 */
@media (prefers-color-scheme: dark) {
  .device-header {
    background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
  }

  .channel-filters {
    background: #2c2c2c;
    border-color: #444;
  }
}
</style>
