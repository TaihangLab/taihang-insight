import { cameraAPI } from '@/components/service/VisionAIService.js';
import { assetAPI } from '@/components/service/AssetService.js';
import AssetEmptyState from '../AssetEmptyState.vue';
import assetTableLayout from '../assetTableLayout.js';
import {
  pullPointStatusTagType,
  pullPointStatusText,
  showSourceStatus,
  sourceTagType,
  sourceTooltip,
  summarizePointStats,
} from '../assetStreamStatus.js';

/**
 * 摄像头（点位）管理 —— 核心列表/详情逻辑
 *
 * 说明：原来"在摄像头上直接配置技能/大模型技能"的旧流程已下线，
 * 技能与点位的关联统一改由「技能运行计划」(/skillManage/runPlan) 完成。
 * 本页只保留点位的浏览、筛选、详情查看等基础设备管理能力。
 */
export default {
  name: 'CameraList',
  components: { AssetEmptyState },
  mixins: [assetTableLayout],
  data() {
    return {
      // 摄像头列表数据
      deviceList: [],
      originalDeviceList: [],
      loading: true,
      currentPage: 1,
      pageSize: 10,
      total: 0,
      searchKeyword: '',
      rowProbing: {},
      statsList: [],

      // 设备详情
      deviceDetailDialogVisible: false,
      deviceDetailData: null,

      // 截图预览
      snapshotVisible: false,
      snapshotLoading: false,
      snapshotUrl: '',
      snapshotError: '',
      snapshotCamera: null,
      snapshotTimer: null,

      // 摄像头类型筛选
      currentCameraTypeFilter: 0,
      cameraTypeMap: {
        0: '全部类型',
        1: '国标 GB28181',
        2: 'ONVIF',
        3: 'RTSP 拉流',
        4: 'RTMP 推流',
      }
    };
  },

  computed: {
    cameraStats() {
      return summarizePointStats(this.statsList);
    },
  },

  created() {
    this.currentCameraTypeFilter = 0;
    this.fetchCameraList();
  },

  watch: {
    searchKeyword(newValue) {
      if (!newValue) {
        this.fetchCameraList();
      } else {
        this.fetchCameraList({ name: newValue });
      }
    }
  },

  methods: {
    fetchCameraList(params = {}) {
      this.loading = true;
      const queryParams = {
        page: 1,
        limit: 2000,
        ...params,
      };
      if (this.currentCameraTypeFilter > 0) {
        queryParams.camera_type = this.currentCameraTypeFilter;
      }

      cameraAPI.getCameraList(queryParams)
        .then(response => {
          if (response.data && response.data.code === 0) {
            const camerasData = response.data.data || [];
            const fullTotal = response.data.total != null ? response.data.total : camerasData.length;

            const mapCamera = (camera) => ({
              id: camera.id,
              name: camera.name,
              status: camera.status,
              location: camera.location || '-',
              skill: Array.isArray(camera.skill_names) ? camera.skill_names.join(', ') : '-',
              llm_skill_names: Array.isArray(camera.llm_skill_names) ? camera.llm_skill_names : [],
              graph_skill_names: Array.isArray(camera.graph_skill_names) ? camera.graph_skill_names : [],
              running_skill_names: Array.isArray(camera.running_skill_names) ? camera.running_skill_names : [],
              camera_type: camera.camera_type,
              running: camera.running,
              pointId: camera.pointId,
              sourceStatus: camera.sourceStatus || '',
              sourceStatusText: camera.sourceStatusText || '',
              sourceDetail: camera.sourceDetail || '',
              sourceCheckedAt: camera.sourceCheckedAt || '',
            });

            const allRows = camerasData.map(mapCamera);
            this.statsList = allRows;
            this.total = fullTotal;
            this.applyPageSlice();

            if (this.deviceList.length === 0 && this.currentPage > 1 && this.total > 0) {
              this.currentPage -= 1;
              this.applyPageSlice();
            }
          } else {
            this.$message.error('获取摄像头列表失败：' + (response.data && response.data.msg ? response.data.msg : '未知错误'));
          }
        })
        .catch(error => {
          console.error('获取摄像头列表出错:', error);
          this.$message.error('获取摄像头列表失败：' + (error.message || '服务器错误'));
          this.$set(this, 'deviceList', []);
          this.originalDeviceList = [];
          this.statsList = [];
          this.total = 0;
        })
        .finally(() => {
          this.loading = false;
          this.updateAssetTableHeight();
        });
    },

    handleCurrentChange(val) {
      this.currentPage = val;
      this.applyPageSlice();
    },

    handleSizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1;
      this.applyPageSlice();
    },

    applyPageSlice() {
      const start = (this.currentPage - 1) * this.pageSize;
      const pageRows = this.statsList.slice(start, start + this.pageSize);
      this.$set(this, 'deviceList', pageRows);
      this.originalDeviceList = [...pageRows];
    },

    handleRefresh() {
      this.searchKeyword = '';
      const currentCameraType = this.currentCameraTypeFilter;
      this.currentPage = 1;

      const params = {};
      if (currentCameraType === 1 || currentCameraType === 2 || currentCameraType === 3
          || currentCameraType === 4 || currentCameraType === 5) {
        params.camera_type = currentCameraType;
      }
      this.fetchCameraList(params);
    },

    handleCameraManagement() {
      this.$router.push({ name: 'deviceManage' });
    },

    // 已知源不可用时直接提示，避免空等 ZLM 拉流超时（无流/不可达会转很久）
    getSnapshotBlockedReason(row) {
      if (!row) return '';
      if (row.camera_type === 4 && row.running === false) {
        return '该点位推流已停止，请先在点位管理中启动推流后再截图';
      }
      if (row.camera_type === 3 && !row.status) {
        if (row.sourceStatus === 'unreachable') {
          return `源地址不可达，无法截图${row.sourceDetail ? '（' + row.sourceDetail + '）' : ''}`;
        }
        if (row.sourceStatus === 'no_stream') {
          return `源地址当前无流，无法截图${row.sourceDetail ? '（' + row.sourceDetail + '）' : ''}`;
        }
        if (row.sourceStatus === 'invalid') {
          return '源地址无效，无法截图';
        }
      }
      return '';
    },

    clearSnapshotTimer() {
      if (this.snapshotTimer) {
        clearTimeout(this.snapshotTimer);
        this.snapshotTimer = null;
      }
    },

    handleFetchSnapshot(row) {
      this.clearSnapshotTimer();
      this.snapshotCamera = row;
      this.snapshotVisible = true;
      this.snapshotUrl = '';

      const blocked = this.getSnapshotBlockedReason(row);
      if (blocked) {
        this.snapshotLoading = false;
        this.snapshotError = blocked;
        return;
      }

      this.snapshotLoading = true;
      this.snapshotError = '';
      // 最长等待 15 秒，防止无流/不可达时后端卡在 ZLM 拉流导致一直转圈
      this.snapshotTimer = setTimeout(() => {
        if (this.snapshotLoading) {
          this.snapshotLoading = false;
          this.snapshotError = '截图超时，请确认设备在线且源地址有流后重试';
          this.snapshotUrl = '';
        }
      }, 15000);
      // 先清空再赋值，强制 <img> 重新发起请求（避免同通道刷新时沿用旧画面）
      this.$nextTick(() => {
        this.snapshotUrl = cameraAPI.getCameraSnapshotUrl(row.id);
      });
    },

    retrySnapshot() {
      if (!this.snapshotCamera) return;
      this.handleFetchSnapshot(this.snapshotCamera);
    },

    onSnapshotImgLoad() {
      this.clearSnapshotTimer();
      this.snapshotLoading = false;
    },

    onSnapshotImgError() {
      this.clearSnapshotTimer();
      this.snapshotLoading = false;
      this.snapshotError = this.getSnapshotBlockedReason(this.snapshotCamera)
        || '获取截图失败，请确认设备在线且支持抓图后重试';
      this.snapshotUrl = '';
    },

    onSnapshotClosed() {
      this.clearSnapshotTimer();
      this.snapshotUrl = '';
      this.snapshotError = '';
      this.snapshotCamera = null;
      this.snapshotLoading = false;
    },

    getSnapshotStatusText(row) {
      return this.getStatusText(row);
    },

    handleViewDetails(row) {
      this.loading = true;
      cameraAPI.getCameraDetail(row.id)
        .then(response => {
          if (response.data && (response.data.success || response.data.code === 0)) {
            const camera = response.data.camera || response.data.data;
            this.deviceDetailData = camera;
            this.deviceDetailDialogVisible = true;
          } else {
            const errorMsg = response.data && response.data.message ? response.data.message : '获取摄像头详情失败';
            this.$message.error(errorMsg);
          }
        })
        .catch(error => {
          console.error('获取摄像头详情时出错:', error);
          this.$message.error('获取摄像头详情失败: ' + (error.message || '未知错误'));
        })
        .finally(() => {
          this.loading = false;
        });
    },

    getCameraTypeText(type) {
      const typeMap = {
        1: '国标 GB28181',
        2: 'ONVIF',
        3: 'RTSP 拉流',
        4: 'RTMP 推流',
      };
      return typeMap[type] || `其他(${type})`;
    },

    getStatusText(row) {
      return pullPointStatusText(row);
    },

    getStatusTagType(row) {
      return pullPointStatusTagType(row);
    },

    showSourceStatus,
    sourceTagType,
    sourceTooltip,

    async handleProbeSource(row) {
      if (!row.pointId) return;
      this.$set(this.rowProbing, row.id, true);
      try {
        const res = await assetAPI.probePoint(row.pointId);
        row.sourceStatus = res.status;
        row.sourceStatusText = res.statusText;
        row.sourceDetail = res.detail;
        row.sourceCheckedAt = res.checkedAt;
      } catch (e) {
        this.$message.error(e.message || '检测失败');
      } finally {
        this.$set(this.rowProbing, row.id, false);
      }
    },

    /**
     * 判断单个技能属于哪一类，用于展示不同的标识：
     *   'llm'    大模型技能
     *   'graph'  技能编排（已发布技能图）
     *   'visual' 视觉技能文件（默认）
     */
    getSkillKind(row, skillName) {
      const name = (skillName || '').trim();
      if (row && Array.isArray(row.llm_skill_names) && row.llm_skill_names.includes(name)) {
        return 'llm';
      }
      if (row && Array.isArray(row.graph_skill_names) && row.graph_skill_names.includes(name)) {
        return 'graph';
      }
      return 'visual';
    },

    /**
     * 判断某个技能在该摄像头上是否处于运行中（存在已启用的任务）。
     * 后端返回 running_skill_names 为"运行中"的技能名称列表。
     */
    isSkillRunning(row, skillName) {
      const name = (skillName || '').trim();
      return !!(row && Array.isArray(row.running_skill_names) && row.running_skill_names.includes(name));
    },

    getDetailSkillTagType(skillName) {
      const kind = this.getSkillKind(this.deviceDetailData, skillName);
      if (kind === 'llm') return 'warning';
      if (kind === 'graph') return 'info';
      return 'success';
    },

    formatPropertyLabel(key) {
      const labelMap = {
        'id': '设备ID',
        'name': '设备名称',
        'location': '设备位置',
        'status': '设备状态',
        'camera_type': '设备类型',
        'gbDeviceId': '国标-编码',
        'gbManufacturer': '国标-设备厂商',
        'gbModel': '国标-设备型号',
        'gbOwner': '国标-设备归属',
        'gbCivilCode': '国标-行政区域',
        'gbBlock': '国标-警区',
        'gbParental': '国标-是否有子设备',
        'gbParentId': '国标-父节点ID',
        'gbSafetyWay': '国标-信令安全模式',
        'gbRegisterWay': '国标-注册方式',
        'gbCertNum': '国标-证书序列号',
        'gbCertifiable': '国标-证书有效标识',
        'gbErrCode': '国标-无效原因码',
        'gbEndTime': '国标-证书终止有效期',
        'gbSecrecy': '国标-保密属性',
        'gbIpAddress': '国标-设备/系统IPv4/IPv6地址',
        'gbPort': '国标-设备/系统端口',
        'gbPassword': '国标-设备口令',
        'gbLongitude': '国标-经度 WGS-84坐标系',
        'gbLatitude': '国标-纬度 WGS-84坐标系',
        'gpsAltitude': 'GPS-海拔',
        'gpsSpeed': 'GPS-速度',
        'gpsDirection': 'GPS-方向',
        'gpsTime': 'GPS-时间',
        'gbBusinessGroupId': '国标-虚拟组织所属的业务分组ID',
        'gbPtzType': '国标-摄像机结构类型',
        'gbPositionType': '国标-摄像机位置类型扩展',
        'gbRoomType': '国标-摄像机安装位置室外/室内属性',
        'gbUseType': '国标-用途属性',
        'gbSupplyLightType': '国标-摄像机补光属性',
        'gbDirectionType': '国标-摄像机监视方位',
        'gbResolution': '国标-摄像机支持的分辨率',
        'gbDownloadSpeed': '国标-下载倍速',
        'gbSvcSpaceSupportMod': '国标-空域编码能力',
        'gbSvcTimeSupportMode': '国标-时域编码能力',
        'recordPLan': '录制计划（每位代表半小时）',
        'dataDeviceId': '关联的设备ID',
        'createTime': '创建时间',
        'updateTime': '更新时间'
      };
      return labelMap[key] || this.formatKeyAsLabel(key);
    },

    formatKeyAsLabel(key) {
      const formatted = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .toLowerCase()
        .trim();
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    },

    getDeviceSpecificInfo(deviceData) {
      if (!deviceData) return {};
      const excludeProps = [
        'id', 'name', 'status', 'location', 'camera_type',
        'skill_names', 'llm_skill_names', 'graph_skill_names',
        'running_skill_names', 'createTime', 'updateTime'
      ];
      const result = {};
      Object.keys(deviceData).forEach(key => {
        if (!excludeProps.includes(key) &&
            deviceData[key] !== null &&
            deviceData[key] !== undefined &&
            deviceData[key] !== '') {
          result[key] = deviceData[key];
        }
      });
      return result;
    },

    filterByCameraType(typeId) {
      this.currentCameraTypeFilter = typeId;
      this.currentPage = 1;
      this.fetchCameraList({ camera_type: typeId });
    },

    filterAllCameraTypes() {
      this.currentCameraTypeFilter = 0;
      this.currentPage = 1;
      this.fetchCameraList();
    }
  }
};
