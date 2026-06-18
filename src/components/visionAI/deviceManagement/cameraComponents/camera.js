import { cameraAPI } from '@/components/service/VisionAIService.js';

/**
 * 摄像头（点位）管理 —— 核心列表/详情逻辑
 *
 * 说明：原来"在摄像头上直接配置技能/大模型技能"的旧流程已下线，
 * 技能与点位的关联统一改由「技能运行计划」(/skillManage/runPlan) 完成。
 * 本页只保留点位的浏览、筛选、详情查看等基础设备管理能力。
 */
export default {
  name: 'CameraManagement',
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

      // 设备详情
      deviceDetailDialogVisible: false,
      deviceDetailData: null,

      // 截图预览
      snapshotVisible: false,
      snapshotLoading: false,
      snapshotUrl: '',
      snapshotError: '',
      snapshotCamera: null,

      // 摄像头类型筛选
      currentCameraTypeFilter: 0,
      cameraTypeMap: {
        0: '全部类型',
        1: '国标设备',
        2: '推流设备',
        3: '拉流设备'
      }
    };
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
        page: this.currentPage,
        limit: this.pageSize,
        ...params
      };

      cameraAPI.getCameraList(queryParams)
        .then(response => {
          if (response.data && response.data.code === 0) {
            const camerasData = response.data.data || [];
            this.total = response.data.total || camerasData.length;

            const newDeviceList = camerasData.map(camera => ({
              id: camera.id,
              name: camera.name,
              status: camera.status,
              location: camera.location || '-',
              skill: Array.isArray(camera.skill_names) ? camera.skill_names.join(', ') : '-',
              llm_skill_names: Array.isArray(camera.llm_skill_names) ? camera.llm_skill_names : [],
              graph_skill_names: Array.isArray(camera.graph_skill_names) ? camera.graph_skill_names : [],
              camera_type: camera.camera_type
            }));

            this.$set(this, 'deviceList', newDeviceList);
            this.originalDeviceList = [...this.deviceList];

            if (this.deviceList.length === 0 && this.currentPage > 1 && this.total > 0) {
              this.currentPage -= 1;
              this.fetchCameraList();
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
          this.total = 0;
        })
        .finally(() => {
          this.loading = false;
        });
    },

    handleCurrentChange(val) {
      this.currentPage = val;
      this.fetchCameraList();
    },

    handleSizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1;
      this.fetchCameraList();
    },

    handleRefresh() {
      this.searchKeyword = '';
      const currentCameraType = this.currentCameraTypeFilter;
      this.currentPage = 1;

      const params = {};
      if (currentCameraType === 1 || currentCameraType === 2 || currentCameraType === 3) {
        params.camera_type = currentCameraType;
      }
      this.fetchCameraList(params);
    },

    handleCameraManagement() {
      this.$router.push({ name: 'CameraManagementMain' });
    },

    handleFetchSnapshot(row) {
      this.snapshotCamera = row;
      this.snapshotLoading = true;
      this.snapshotError = '';
      this.snapshotVisible = true;
      this.snapshotUrl = cameraAPI.getCameraSnapshotUrl(row.id);
    },

    retrySnapshot() {
      if (!this.snapshotCamera) return;
      this.handleFetchSnapshot(this.snapshotCamera);
    },

    onSnapshotImgError() {
      this.snapshotLoading = false;
      this.snapshotError = '获取截图失败，请确认设备在线且支持抓图后重试';
      this.snapshotUrl = '';
    },

    onSnapshotClosed() {
      this.snapshotUrl = '';
      this.snapshotError = '';
      this.snapshotCamera = null;
    },

    getSnapshotStatusText(row) {
      if (!row) return '-';
      if (row.camera_type === 1) return row.status ? '在线' : '离线';
      if (row.camera_type === 2) return row.status ? '推流中' : '已停止';
      if (row.camera_type === 3) return row.status ? '正在拉流' : '尚未拉流';
      return row.status ? '启用' : '禁用';
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
      const typeMap = { 1: '国标设备', 2: '推流设备', 3: '代理拉流' };
      return typeMap[type] || `未知类型(${type})`;
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
        'skill_names', 'llm_skill_names', 'createTime', 'updateTime'
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
